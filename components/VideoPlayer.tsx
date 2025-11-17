import React, { RefObject, useEffect, useMemo, useRef, useCallback } from 'react';
import { TextOverlay, Crop, Clip, Transition, Transform, ImageOverlay, Mask, ChromaKeySettings } from '../types';
import CropTool from './CropTool';

interface VideoPlayerProps {
  videoRefA: RefObject<HTMLVideoElement>;
  videoRefB: RefObject<HTMLVideoElement>;
  clipA?: Clip;
  clipB?: Clip;
  transition: Transition;
  filter: string;
  textOverlays: TextOverlay[];
  imageOverlays: ImageOverlay[];
  currentTime: number;
  isPlaying: boolean;
  isCropping: boolean;
  crop: Crop;
  onCropChange: (crop: Crop) => void;
}

const getClipTrimmedDuration = (clip: Clip | undefined) => clip ? clip.trimEnd - clip.trimStart : 0;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- Helper Functions for Canvas Rendering ---

const getOverlayRenderState = (overlay: TextOverlay | ImageOverlay, currentTime: number) => {
    const isVisible = currentTime >= overlay.startTime && currentTime <= overlay.endTime;
    if (!isVisible) {
        return { isVisible: false, opacity: 0, transform: { x: 0, y: 0, scale: 1 } };
    }

    const animationDuration = 0.5; // seconds
    let opacity = 1;
    let transform = { x: 0, y: 0, scale: 1 };

    // Animation In
    const timeIn = currentTime - overlay.startTime;
    if (overlay.animationIn !== 'none' && timeIn < animationDuration) {
        const progress = timeIn / animationDuration;
        if (overlay.animationIn === 'fade-in') opacity = progress;
        if (overlay.animationIn === 'slide-in-left') transform.x = lerp(-100, 0, progress);
        if (overlay.animationIn === 'slide-in-right') transform.x = lerp(100, 0, progress);
        if (overlay.animationIn === 'slide-in-top') transform.y = lerp(-100, 0, progress);
        if (overlay.animationIn === 'slide-in-bottom') transform.y = lerp(100, 0, progress);
        if (overlay.animationIn === 'slide-in-center') {
            opacity = progress;
            transform.scale = lerp(0, 1, progress);
        }
    }

    // Animation Out
    const timeUntilEnd = overlay.endTime - currentTime;
    if (overlay.animationOut !== 'none' && timeUntilEnd < animationDuration) {
        const progress = 1 - (timeUntilEnd / animationDuration);
        if (overlay.animationOut === 'fade-out') opacity = 1 - progress;
        if (overlay.animationOut === 'slide-out-left') transform.x = lerp(0, -100, progress);
        if (overlay.animationOut === 'slide-out-right') transform.x = lerp(0, 100, progress);
        if (overlay.animationOut === 'slide-out-top') transform.y = lerp(0, -100, progress);
        if (overlay.animationOut === 'slide-out-bottom') transform.y = lerp(0, 100, progress);
        if (overlay.animationOut === 'slide-out-center') {
            opacity = 1 - progress;
            transform.scale = lerp(1, 0, progress);
        }
    }

    return { isVisible: true, opacity, transform };
};

const applyCanvasMask = (ctx: CanvasRenderingContext2D, mask: Mask, overlayWidth: number, overlayHeight: number, maskImageCache: Record<string, HTMLImageElement>) => {
    if (mask.shape === 'none') return;

    if (mask.shape === 'custom-svg' && mask.customSvg) {
        const svgImage = maskImageCache[mask.customSvg];
        if (svgImage) {
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(svgImage, 0, 0, overlayWidth, overlayHeight);
        }
        return;
    }

    ctx.save();
    if (mask.feather > 0) {
        ctx.filter = `blur(${mask.feather}px)`;
    }

    const path = new Path2D();
    switch (mask.shape) {
        case 'circle':
            path.arc(overlayWidth / 2, overlayHeight / 2, Math.min(overlayWidth, overlayHeight) / 2, 0, Math.PI * 2);
            break;
        case 'rectangle':
            const shortestSide = Math.min(overlayWidth, overlayHeight);
            const radius = shortestSide * (mask.cornerRadius / 100);
            path.roundRect(0, 0, overlayWidth, overlayHeight, radius);
            break;
    }
    
    // Draw the blurred path onto itself to apply the blur before clipping
    if (mask.feather > 0) {
         ctx.fill(path);
         ctx.filter = 'none';
    }

    ctx.restore();
    ctx.clip(path);
};


const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
    videoRefA, videoRefB, clipA, clipB, transition, 
    filter, textOverlays, imageOverlays, currentTime, isPlaying, isCropping, crop, onCropChange 
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const imageElementsRef = useRef<{[src: string]: HTMLImageElement}>({});
    const maskImagesRef = useRef<{[svg: string]: HTMLImageElement}>({});
    
    const durationA = useMemo(() => getClipTrimmedDuration(clipA), [clipA]);
    const transitionDuration = useMemo(() => transition.type !== 'none' && clipA && clipB ? transition.duration : 0, [transition, clipA, clipB]);
    const transitionStartTime = durationA - transitionDuration;
    
    // Preload image overlay images and SVG masks
    useEffect(() => {
        const allOverlays = [...imageOverlays, ...textOverlays];
        
        allOverlays.forEach(overlay => {
            // Preload image source if it's an image overlay
            if ('src' in overlay && !imageElementsRef.current[overlay.src]) {
                const img = new Image();
                img.src = overlay.src;
                imageElementsRef.current[overlay.src] = img;
            }
            // Preload SVG mask if it exists
            if (overlay.mask?.shape === 'custom-svg' && overlay.mask.customSvg && !maskImagesRef.current[overlay.mask.customSvg]) {
                const svgContent = overlay.mask.customSvg;
                const img = new Image();
                const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(svgBlob);
                img.onload = () => URL.revokeObjectURL(url);
                img.onerror = () => URL.revokeObjectURL(url);
                img.src = url;
                maskImagesRef.current[svgContent] = img;
            }
        });
    }, [imageOverlays, textOverlays]);

    const drawFrame = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const videoA = videoRefA.current;

        if (!canvas || !ctx || !videoA) return;

        // Set canvas resolution based on video A
        const videoARes = { width: videoA.videoWidth, height: videoA.videoHeight };
        if (canvas.width !== videoARes.width || canvas.height !== videoARes.height) {
            canvas.width = videoARes.width;
            canvas.height = videoARes.height;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- Video Drawing Logic ---
        const drawVideo = (videoEl: HTMLVideoElement, clip: Clip, time: number, opacity: number = 1) => {
             if (!videoEl || videoEl.readyState < videoEl.HAVE_METADATA || !clip) return;
            const trimmedDuration = clip.trimEnd - clip.trimStart;
            const progress = trimmedDuration > 0 ? time / trimmedDuration : 0;
            const finalProgress = clip.isReversed ? 1 - progress : progress;

            const transform = {
                scale: lerp(clip.startTransform.scale, clip.endTransform.scale, finalProgress),
                x: lerp(clip.startTransform.x, clip.endTransform.x, finalProgress),
                y: lerp(clip.startTransform.y, clip.endTransform.y, finalProgress),
            };

            const sourceWidth = videoEl.videoWidth / transform.scale;
            const sourceHeight = videoEl.videoHeight / transform.scale;
            const viewCenterX = videoEl.videoWidth / 2 + (transform.x / 100 * videoEl.videoWidth);
            const viewCenterY = videoEl.videoHeight / 2 + (transform.y / 100 * videoEl.videoHeight);
            const sourceX = viewCenterX - sourceWidth / 2;
            const sourceY = viewCenterY - sourceHeight / 2;

            const clipAdjustments = [
                clip.blur > 0 ? `blur(${clip.blur}px)` : '',
                clip.colorGrading.brightness !== 100 ? `brightness(${clip.colorGrading.brightness}%)` : '',
                clip.colorGrading.saturation !== 100 ? `saturate(${clip.colorGrading.saturation}%)` : '',
                clip.colorGrading.hue !== 0 ? `hue-rotate(${clip.colorGrading.hue}deg)` : '',
            ].filter(Boolean).join(' ');

            const finalFilter = [filter, clipAdjustments].filter(Boolean).join(' ');

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.filter = finalFilter;
            
            let sourceToDraw: CanvasImageSource = videoEl;

            if (clip.chromaKey.enabled) {
                if (!offscreenCanvasRef.current) offscreenCanvasRef.current = document.createElement('canvas');
                const offscreenCanvas = offscreenCanvasRef.current;
                const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
                if (offscreenCtx) {
                    offscreenCanvas.width = videoEl.videoWidth;
                    offscreenCanvas.height = videoEl.videoHeight;
                    offscreenCtx.drawImage(videoEl, 0, 0);
                    const imageData = offscreenCtx.getImageData(0, 0, videoEl.videoWidth, videoEl.videoHeight);
                    applyChromaKey(imageData, clip.chromaKey);
                    offscreenCtx.putImageData(imageData, 0, 0);
                    sourceToDraw = offscreenCanvas;
                }
            }
            
            ctx.drawImage(sourceToDraw, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
            ctx.restore();
        };
        
        // --- Transition Logic ---
        const isInTransition = currentTime >= transitionStartTime && currentTime < durationA && clipB;

        if (!isInTransition) {
            if (currentTime < durationA && clipA) {
                drawVideo(videoA, clipA, currentTime);
            } else if (currentTime >= durationA && clipB && videoRefB.current) {
                drawVideo(videoRefB.current, clipB, currentTime - transitionStartTime);
            }
        } else {
             const videoB = videoRefB.current;
             if(clipA && videoB && clipB) {
                const timeInB = currentTime - transitionStartTime;
                const progress = (currentTime - transitionStartTime) / transition.duration;
                switch (transition.type) {
                    case 'crossfade':
                        drawVideo(videoA, clipA, currentTime, 1 - progress);
                        drawVideo(videoB, clipB, timeInB, progress);
                        break;
                    case 'wipe-left':
                        drawVideo(videoA, clipA, currentTime);
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(0, 0, canvas.width * progress, canvas.height);
                        ctx.clip();
                        drawVideo(videoB, clipB, timeInB);
                        ctx.restore();
                        break;
                    case 'wipe-right':
                        drawVideo(videoA, clipA, currentTime);
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(canvas.width * (1 - progress), 0, canvas.width * progress, canvas.height);
                        ctx.clip();
                        drawVideo(videoB, clipB, timeInB);
                        ctx.restore();
                        break;
                    case 'wipe-down':
                        drawVideo(videoA, clipA, currentTime);
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(0, 0, canvas.width, canvas.height * progress);
                        ctx.clip();
                        drawVideo(videoB, clipB, timeInB);
                        ctx.restore();
                        break;
                    case 'wipe-up':
                        drawVideo(videoA, clipA, currentTime);
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(0, canvas.height * (1 - progress), canvas.width, canvas.height * progress);
                        ctx.clip();
                        drawVideo(videoB, clipB, timeInB);
                        ctx.restore();
                        break;
                    default: drawVideo(videoA, clipA, currentTime);
                }
             }
        }
        
        // --- Overlay Drawing Logic ---
        const overlaysToDraw = [...imageOverlays, ...textOverlays].sort((a, b) => a.zIndex - b.zIndex);
        
        overlaysToDraw.forEach(overlay => {
            const { isVisible, opacity, transform } = getOverlayRenderState(overlay, currentTime);
            if (!isVisible) return;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            
            if ('src' in overlay) drawImageOverlay(ctx, overlay, transform, imageElementsRef.current, maskImagesRef.current);
            if ('text' in overlay) drawTextOverlay(ctx, overlay, transform, maskImagesRef.current);

            ctx.restore();
        });

    }, [clipA, clipB, transition, currentTime, filter, textOverlays, imageOverlays, videoRefA, videoRefB, durationA, transitionStartTime]);

    useEffect(() => {
        const vidA = videoRefA.current;
        const vidB = videoRefB.current;

        const updateVideoTimes = () => {
            if (!vidA || !clipA) return;

            const timeWithinClipA = currentTime;
            const seekTimeA = clipA.isReversed
                ? clipA.trimEnd - timeWithinClipA
                : clipA.trimStart + timeWithinClipA;

            if (Math.abs(vidA.currentTime - seekTimeA) > 0.2) {
                vidA.currentTime = seekTimeA;
            }

            if (clipB && vidB) {
                const timeWithinClipB = currentTime - transitionStartTime;
                const seekTimeB = clipB.isReversed
                    ? clipB.trimEnd - timeWithinClipB
                    : clipB.trimStart + timeWithinClipB;

                if (Math.abs(vidB.currentTime - seekTimeB) > 0.2) {
                    vidB.currentTime = seekTimeB;
                }
            }
        };
        
        const handlePlayPause = () => {
            if (!vidA) return;
            const isInClipA = currentTime < durationA;
            const isInClipB = clipB ? currentTime >= transitionStartTime : false;

            if (isPlaying) {
                if(isInClipA) vidA.play().catch(e => {}); else vidA.pause();
                if(isInClipB && vidB) vidB.play().catch(e => {}); else if(vidB) vidB.pause();
            } else {
                vidA.pause();
                vidB?.pause();
            }
        };

        updateVideoTimes();
        handlePlayPause();
        
        const frameId = requestAnimationFrame(drawFrame);
        return () => cancelAnimationFrame(frameId);

    }, [currentTime, isPlaying, clipA, clipB, videoRefA, videoRefB, durationA, transitionStartTime, drawFrame]);
    
    return (
      <div className="w-full h-full relative">
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
        {isCropping && (
            <CropTool
                crop={crop}
                onCropChange={onCropChange}
            />
        )}
      </div>
    );
};

// Helper functions for drawing on canvas
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

const applyChromaKey = (imageData: ImageData, settings: ChromaKeySettings) => {
    const keyColor = hexToRgb(settings.color);
    if (!keyColor) return;
    const data = imageData.data;
    const threshold = settings.similarity * 255 * Math.sqrt(3);
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const distance = Math.sqrt(Math.pow(r - keyColor.r, 2) + Math.pow(g - keyColor.g, 2) + Math.pow(b - keyColor.b, 2));
        if (distance < threshold) data[i + 3] = 0;
    }
};

const drawTextOverlay = (ctx: CanvasRenderingContext2D, overlay: TextOverlay, transform: {x:number, y:number, scale:number}, maskImageCache: Record<string, HTMLImageElement>) => {
    const { text, left, top, color, fontSize } = overlay;
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.font = `${fontSize}px Arial`;
    const textMetrics = tempCtx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize; // Approximation

    tempCanvas.width = textWidth;
    tempCanvas.height = textHeight;

    // Redraw text on correctly sized canvas
    tempCtx.font = `${fontSize}px Arial`;
    tempCtx.fillStyle = color;
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(text, textWidth / 2, textHeight / 2);

    if(overlay.mask) applyCanvasMask(tempCtx, overlay.mask, textWidth, textHeight, maskImageCache);

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    
    const x = (left / 100) * canvasWidth + (transform.x / 100 * canvasWidth);
    const y = (top / 100) * canvasHeight + (transform.y / 100 * canvasHeight);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(transform.scale, transform.scale);
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(tempCanvas, -textWidth / 2, -textHeight / 2);
    ctx.restore();
};

const drawImageOverlay = (ctx: CanvasRenderingContext2D, overlay: ImageOverlay, transform: {x:number, y:number, scale:number}, imageCache: Record<string, HTMLImageElement>, maskImageCache: Record<string, HTMLImageElement>) => {
    const img = imageCache[overlay.src];
    if (!img || !img.complete || img.width === 0) return;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;

    const overlayWidth = (overlay.width / 100) * canvasWidth;
    const overlayHeight = (overlayWidth / img.width) * img.height;
    
    const x = (overlay.left / 100) * canvasWidth + (transform.x / 100 * canvasWidth);
    const y = (overlay.top / 100) * canvasHeight + (transform.y / 100 * canvasHeight);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = overlayWidth;
    tempCanvas.height = overlayHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    let imageToDraw: CanvasImageSource = img;
    
     if (overlay.chromaKey.enabled) {
        const offscreen = document.createElement('canvas');
        offscreen.width = img.width;
        offscreen.height = img.height;
        const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
        if(offCtx) {
            offCtx.drawImage(img, 0, 0);
            const imageData = offCtx.getImageData(0, 0, img.width, img.height);
            applyChromaKey(imageData, overlay.chromaKey);
            offCtx.putImageData(imageData, 0, 0);
            imageToDraw = offscreen;
        }
    }
    
    tempCtx.drawImage(imageToDraw, 0, 0, overlayWidth, overlayHeight);

    if (overlay.mask) applyCanvasMask(tempCtx, overlay.mask, overlayWidth, overlayHeight, maskImageCache);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(transform.scale, transform.scale);
    ctx.drawImage(tempCanvas, -overlayWidth / 2, -overlayHeight / 2);
    ctx.restore();
};

export default VideoPlayer;