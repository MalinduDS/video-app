import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextOverlay, Filter, Crop, Effect, Clip, Transition, Transform, ImageOverlay, ChromaKeySettings, ColorGradingSettings, ExportQuality } from './types';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import Controls from './components/Controls';
import TextOverlayEditor from './components/TextOverlayEditor';
import ImageOverlayEditor from './components/ImageOverlayEditor';
import Spinner from './components/Spinner';
import { useHistory, EditorState } from './hooks/useHistory';
import ExportDialog from './components/ExportDialog';
import EditingToolsPanel from './components/EditingToolsPanel';
import ClipManager from './components/ClipManager';
import TransitionControls from './components/TransitionControls';
import VideoGenerator from './components/VideoGenerator';
import { GoogleGenAI } from "@google/genai";
import { VideoSparkIcon } from './components/icons';

const FILTERS: Filter[] = [
  { name: 'None', value: 'none' },
  { name: 'Grayscale', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Invert', value: 'invert(100%)' },
  { name: 'Contrast', value: 'contrast(200%)' },
  { name: 'Saturate', value: 'saturate(8)' },
];

const EFFECTS: Effect[] = [
  { name: 'None', value: 'none' },
  { name: 'Vintage', value: 'sepia(60%) contrast(110%) brightness(90%)' },
  { name: 'Dreamy', value: 'blur(0.5px) saturate(150%) contrast(110%)' },
  { name: 'Noir', value: 'grayscale(100%) contrast(150%)' },
  { name: 'Vivid', value: 'saturate(175%) contrast(125%)' },
  { name: 'Lomo', value: 'saturate(150%) contrast(150%)' },
];

const DEFAULT_TRANSFORM: Transform = { scale: 1, x: 0, y: 0 };
const DEFAULT_CHROMA_KEY: ChromaKeySettings = { enabled: false, color: '#00ff00', similarity: 0.15 };
const DEFAULT_COLOR_GRADING: ColorGradingSettings = { brightness: 100, saturation: 100, hue: 0 };


const INITIAL_CLIP_STATE: Omit<Clip, 'id' | 'file' | 'duration' | 'url' > = {
    thumbnailUrl: '',
    trimStart: 0,
    trimEnd: 0,
    startTransform: DEFAULT_TRANSFORM,
    endTransform: DEFAULT_TRANSFORM,
    chromaKey: DEFAULT_CHROMA_KEY,
    colorGrading: DEFAULT_COLOR_GRADING,
    blur: 0,
    isReversed: false,
};

const INITIAL_EDITOR_STATE: EditorState = {
    clips: [],
    transition: { type: 'none', duration: 1 },
    textOverlays: [],
    imageOverlays: [],
    selectedFilter: FILTERS[0],
    selectedEffect: EFFECTS[0],
    crop: { x: 0, y: 0, width: 100, height: 100 },
    volume: 1,
    playbackSpeed: 1,
};


const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [lastFrameTime, setLastFrameTime] = useState(0);

  const { state: editorState, setState: setEditorState, undo, redo, canUndo, canRedo } = useHistory(INITIAL_EDITOR_STATE);
  const { clips, transition, textOverlays, imageOverlays, selectedFilter, selectedEffect, crop, volume, playbackSpeed } = editorState;
  
  const clipA = clips[0];
  const clipB = clips[1];
  
  const getClipTrimmedDuration = (clip: Clip | undefined) => clip ? clip.trimEnd - clip.trimStart : 0;
  const durationA = getClipTrimmedDuration(clipA);
  const durationB = getClipTrimmedDuration(clipB);
  const transitionDuration = transition.type !== 'none' && clipA && clipB ? transition.duration : 0;
  const totalDuration = Math.max(0, durationA + durationB - transitionDuration);

  const [selectedTextOverlay, setSelectedTextOverlay] = useState<TextOverlay | null>(null);
  const [isTextEditorOpen, setIsTextEditorOpen] = useState<boolean>(false);

  const [selectedImageOverlay, setSelectedImageOverlay] = useState<ImageOverlay | null>(null);
  const [isImageEditorOpen, setIsImageEditorOpen] = useState<boolean>(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);


  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);

  const [isCropping, setIsCropping] = useState<boolean>(false);
  
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState(true);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationProgressMessage, setGenerationProgressMessage] = useState('');

  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const checkKey = async () => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsApiKeySelected(hasKey);
        }
        setIsCheckingApiKey(false);
    };
    checkKey();
  }, []);

  const handleSelectApiKey = async () => {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          await window.aistudio.openSelectKey();
          // Per guidelines, assume success to avoid race condition
          setIsApiKeySelected(true);
      }
  };

  useEffect(() => {
    [videoRefA, videoRefB].forEach(ref => {
      if (ref.current) ref.current.volume = volume;
    });
  }, [volume]);

  useEffect(() => {
    [videoRefA, videoRefB].forEach(ref => {
      if (ref.current) ref.current.playbackRate = playbackSpeed;
    });
  }, [playbackSpeed, clips]);

  const handleFrameStep = useCallback((direction: 'forward' | 'backward') => {
      setIsPlaying(false);
      const frameTime = 1 / 30; // Assuming 30fps
      const increment = direction === 'forward' ? frameTime : -frameTime;
      setCurrentTime(prev => Math.max(0, Math.min(totalDuration, prev + increment)));
  }, [totalDuration]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            handleFrameStep('forward');
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            handleFrameStep('backward');
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFrameStep]);

  useEffect(() => {
    let frameId: number;
    if (isPlaying) {
      const animate = (timestamp: number) => {
        if (lastFrameTime !== 0) {
          const deltaTime = (timestamp - lastFrameTime) / 1000;
          const newTime = Math.min(currentTime + deltaTime * playbackSpeed, totalDuration);
          setCurrentTime(newTime);

          if (newTime >= totalDuration) {
              setIsPlaying(false);
          }
        }
        setLastFrameTime(timestamp);
        frameId = requestAnimationFrame(animate);
      };
      frameId = requestAnimationFrame(animate);
    } else {
      setLastFrameTime(0);
    }
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, lastFrameTime, playbackSpeed, totalDuration, currentTime]);


  const handleAddClip = useCallback((file: File, index: 0 | 1) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    
    video.onloadedmetadata = () => {
      video.currentTime = video.duration * 0.1; // Seek to 10% for a better thumbnail
    };

    video.onseeked = () => {
        const canvas = document.createElement('canvas');
        const aspectRatio = video.videoWidth / video.videoHeight;
        canvas.width = 160;
        canvas.height = 160 / aspectRatio;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg');

            const newClip: Clip = {
                ...INITIAL_CLIP_STATE,
                id: `clip-${index}-${Date.now()}`,
                file,
                url,
                duration: video.duration,
                trimEnd: video.duration,
                thumbnailUrl,
            };
            
            setEditorState(prev => {
                const newClips = [...prev.clips];
                if (prev.clips[index]?.url) {
                    URL.revokeObjectURL(prev.clips[index].url);
                }
                newClips[index] = newClip;
                return {...prev, clips: newClips };
            });
        }
    };
    
    video.onerror = (e) => {
      console.error("Error loading video:", e);
      alert("There was an error loading the video file.");
      URL.revokeObjectURL(url);
    };
  }, [setEditorState]);

  const handleRemoveClip = (index: 0 | 1) => {
    setEditorState(prev => {
        const clipToRemove = prev.clips[index];
        if (clipToRemove?.url) {
            URL.revokeObjectURL(clipToRemove.url);
        }
        
        const newClips = [...prev.clips];
        newClips.splice(index, 1);
        
        return { ...prev, clips: newClips };
    });
  }

  const handleSwapClips = () => {
    setEditorState(prev => {
        if (prev.clips.length === 2) {
            return { ...prev, clips: [prev.clips[1], prev.clips[0]] };
        }
        return prev;
    })
  }
  
  const handleToggleReverseClip = (index: 0 | 1) => {
    setEditorState(prev => {
      const newClips = [...prev.clips];
      if (newClips[index]) {
        newClips[index] = {
          ...newClips[index],
          isReversed: !newClips[index].isReversed,
        };
      }
      return { ...prev, clips: newClips };
    });
  };

  const handlePlayPause = () => {
    if (!totalDuration) return;
    if(currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleTimelineClick = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, totalDuration)));
  };

  const handleAddTextOverlay = () => {
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: 'Sample Text',
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, totalDuration),
      top: 50,
      left: 50,
      color: '#FFFFFF',
      fontSize: 48,
      animationIn: 'fade-in',
      animationOut: 'fade-out',
      mask: { shape: 'none', cornerRadius: 0, feather: 0, customSvg: null },
    };
    setSelectedTextOverlay(newOverlay);
    setIsTextEditorOpen(true);
  };

  const handleSaveTextOverlay = (overlay: TextOverlay) => {
    setEditorState(prev => {
        const index = prev.textOverlays.findIndex(o => o.id === overlay.id);
        const newOverlays = [...prev.textOverlays];
        if (index > -1) {
            newOverlays[index] = overlay;
        } else {
            newOverlays.push(overlay);
        }
        return {...prev, textOverlays: newOverlays};
    });
    setIsTextEditorOpen(false);
    setSelectedTextOverlay(null);
  };

  const handleAddImageClick = () => {
    imageFileInputRef.current?.click();
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newImageOverlay: ImageOverlay = {
          id: `image-${Date.now()}`,
          src: event.target?.result as string,
          startTime: currentTime,
          endTime: Math.min(currentTime + 5, totalDuration),
          width: 25,
          top: 50,
          left: 50,
          animationIn: 'fade-in',
          animationOut: 'fade-out',
          mask: { shape: 'none', cornerRadius: 0, feather: 0, customSvg: null },
          chromaKey: DEFAULT_CHROMA_KEY,
        };
        setSelectedImageOverlay(newImageOverlay);
        setIsImageEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
    // Reset file input
    if (e.target) e.target.value = '';
  };
  
  const handleSaveImageOverlay = (overlay: ImageOverlay) => {
    setEditorState(prev => {
        const index = prev.imageOverlays.findIndex(o => o.id === overlay.id);
        const newOverlays = [...prev.imageOverlays];
        if (index > -1) {
            newOverlays[index] = overlay;
        } else {
            newOverlays.push(overlay);
        }
        return {...prev, imageOverlays: newOverlays };
    });
    setIsImageEditorOpen(false);
    setSelectedImageOverlay(null);
  };

  const handleSetTransition = (newTransition: Transition) => {
    setEditorState(prev => ({...prev, transition: newTransition}));
  }

  const handleAutoEdit = () => {
    if (!clipA) {
        alert("Please upload at least one video to use Auto Edit.");
        return;
    }

    const sourceClip = clipA;
    const sourceDuration = sourceClip.duration;
    const segmentCount = 3;
    const segmentDuration = 4;
    const minReelDuration = segmentCount * segmentDuration;

    if (sourceDuration < minReelDuration) {
        alert(`Source video is too short for auto-editing. Minimum ${minReelDuration}s required.`);
        return;
    }

    const segments: { start: number; end: number }[] = [];
    let availableDuration = sourceDuration;
    let startTime = 0;
    for (let i = 0; i < segmentCount; i++) {
        const segmentStart = startTime + Math.random() * (availableDuration / segmentCount - segmentDuration);
        const segmentEnd = segmentStart + segmentDuration;
        segments.push({ start: segmentStart, end: segmentEnd });
        startTime = segmentEnd;
        availableDuration = sourceDuration - startTime;
    }
    
    const newClips: Clip[] = segments.slice(0, 2).map((seg, index) => ({
        ...sourceClip,
        id: `clip-auto-${index}-${Date.now()}`,
        trimStart: seg.start,
        trimEnd: seg.end,
        startTransform: { scale: 1, x: index % 2 === 0 ? -2 : 2, y: index % 2 === 0 ? -2 : 2 },
        endTransform: { scale: 1.15, x: index % 2 === 0 ? 2 : -2, y: index % 2 === 0 ? 2 : -2 },
    }));
    
    if (newClips.length < 2) {
        alert("Could not generate enough segments from the source video.");
        return;
    }

    const randomFilter = FILTERS[Math.floor(Math.random() * (FILTERS.length - 1)) + 1];
    const randomEffect = EFFECTS[Math.floor(Math.random() * (EFFECTS.length - 1)) + 1];

    setEditorState(() => ({
        ...INITIAL_EDITOR_STATE,
        clips: newClips,
        transition: { type: 'crossfade', duration: 0.5 },
        selectedFilter: randomFilter,
        selectedEffect: randomEffect,
        playbackSpeed: 1.2,
    }));
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleGenerateVideo = useCallback(async (prompt: string, aspectRatio: '16:9' | '9:16') => {
    setIsGeneratingVideo(true);
    setGenerationProgressMessage('Initializing generation...');
    
    try {
        // Per guidelines, create new instance before each call
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p', // Keep it 720p for faster generation
                aspectRatio: aspectRatio
            }
        });

        const pollingMessages = [
            'Analyzing prompt...',
            'Warming up the pixels...',
            'Composing the scene...',
            'Directing the action...',
            'Rendering frames...',
            'Almost there...',
        ];
        let messageIndex = 0;

        while (!operation.done) {
            setGenerationProgressMessage(pollingMessages[messageIndex % pollingMessages.length]);
            messageIndex++;
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        setGenerationProgressMessage('Finalizing video...');

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error('Video generation failed: No download link found.');
        }

        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
             if (response.status === 404) {
                const errorText = await response.text();
                if (errorText.includes("Requested entity was not found.")) {
                    // Per guidelines, reset API key state
                    setIsApiKeySelected(false);
                    throw new Error("API Key is invalid. Please select a valid API key.");
                }
            }
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        const blob = await response.blob();
        const videoFile = new File([blob], `generated-video-${Date.now()}.mp4`, { type: 'video/mp4' });

        // Add to the first empty clip slot or replace the first clip
        const targetIndex = clipA ? (clipB ? 0 : 1) : 0;
        handleAddClip(videoFile, targetIndex as 0 | 1);

        setGenerationProgressMessage('Video added to timeline!');

    } catch (error) {
        console.error('Video generation error:', error);
        alert(`Video generation failed: ${error instanceof Error ? error.message : String(error)}`);
        setGenerationProgressMessage('');
    } finally {
        setTimeout(() => {
            setIsGeneratingVideo(false);
        }, 3000); // Keep success/final message for a bit
    }
  }, [clipA, clipB, handleAddClip]);

  const globalFilter = [
    selectedFilter.value,
    selectedEffect.value,
  ].filter(f => f && f !== 'none').join(' ');

  const handleExport = useCallback(async (format: 'webm' | 'mp4', quality: ExportQuality) => {
    if (!clipA || !videoRefA.current) return;
    setIsPlaying(false);
    setIsExportDialogOpen(false);
    setIsExporting(true);
    setExportProgress(0);

    const videoA = videoRefA.current;
    const videoB = videoRefB.current;
    
    const videoARes = { width: videoA.videoWidth, height: videoA.videoHeight };

    const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm; codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      alert(`Error: Your browser does not support exporting to ${format.toUpperCase()}. Please choose another format.`);
      setIsExporting(false);
      return;
    }

    const BITRATES = {
        low: 2_000_000, // 2 Mbps
        high: 10_000_000, // 10 Mbps
    };
    const videoBitsPerSecond = BITRATES[quality];

    const canvas = document.createElement('canvas');
    const cropX = (crop.x / 100) * videoARes.width;
    const cropY = (crop.y / 100) * videoARes.height;
    const cropWidth = (crop.width / 100) * videoARes.width;
    const cropHeight = (crop.height / 100) * videoARes.height;

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Off-screen canvas for effects processing
    const processCanvas = document.createElement('canvas');
    const processCtx = processCanvas.getContext('2d');
    if(!processCtx) return;
    
    // --- Preload assets ---
    const allOverlays = [...textOverlays, ...imageOverlays];
    const uniqueSvgMasks = [...new Set(allOverlays.map(o => o.mask.shape === 'custom-svg' ? o.mask.customSvg : null).filter(Boolean) as string[])];
    
    const svgImageCache = new Map<string, HTMLImageElement>();
    try {
        await Promise.all(uniqueSvgMasks.map(svgContent => new Promise<void>((resolve, reject) => {
            const img = new Image();
            const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            img.onload = () => {
                URL.revokeObjectURL(url);
                svgImageCache.set(svgContent, img);
                resolve();
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                console.error("Failed to load SVG mask for export.");
                reject(new Error("Failed to load SVG mask"));
            };
            img.src = url;
        })));
    } catch (error) {
        alert("An error occurred while loading SVG mask assets for export.");
        setIsExporting(false);
        return;
    }

    const audioContext = new AudioContext();
    const sourceA = audioContext.createMediaElementSource(videoA);
    const destinationNode = audioContext.createMediaStreamDestination();
    sourceA.connect(destinationNode);
    if(clipB && videoB) {
        const sourceB = audioContext.createMediaElementSource(videoB);
        sourceB.connect(destinationNode);
    }
    const audioTrack = destinationNode.stream.getAudioTracks()[0];
    
    videoA.volume = volume;
    if(videoB) videoB.volume = volume;
    videoA.muted = false;
    if(videoB) videoB.muted = false;

    const videoStream = canvas.captureStream(30);
    const videoTrack = videoStream.getVideoTracks()[0];

    const combinedStream = new MediaStream([videoTrack, audioTrack]);
    const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond });
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edited-video-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      audioContext.close();
      setIsExporting(false);
      videoA.currentTime = clipA.trimStart;
      if(videoB && clipB) videoB.currentTime = clipB.trimStart;
    };

    recorder.start();

    const frameDuration = 1 / 30;
    let currentExportTime = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    const applyChromaKey = (imageData: ImageData, settings: ChromaKeySettings) => {
        const keyColor = hexToRgb(settings.color);
        if(!keyColor) return;

        const data = imageData.data;
        const threshold = settings.similarity * 255 * Math.sqrt(3);

        for(let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            const distance = Math.sqrt(
                Math.pow(r - keyColor.r, 2) +
                Math.pow(g - keyColor.g, 2) +
                Math.pow(b - keyColor.b, 2)
            );

            if(distance < threshold) {
                data[i+3] = 0; // Set alpha to 0
            }
        }
    };

    const applyCanvasMask = (ctx: CanvasRenderingContext2D, overlay: TextOverlay | ImageOverlay, overlayWidth: number, overlayHeight: number) => {
        if (!overlay.mask || overlay.mask.shape === 'none') return;
        
        ctx.save();
        
        if (overlay.mask.shape === 'custom-svg') {
            const svgImage = overlay.mask.customSvg ? svgImageCache.get(overlay.mask.customSvg) : null;
            if (svgImage) {
                // Use composition for SVG mask
                ctx.globalCompositeOperation = 'destination-in';
                ctx.drawImage(svgImage, 0, 0, overlayWidth, overlayHeight);
            } else {
                 console.warn("Custom SVG mask could not be applied during export.");
            }
            ctx.restore();
            // Restore happens outside after content is drawn, so we return here for this specific path
            return 'composited';
        }

        const feather = overlay.mask.feather || 0;
        if (feather > 0) {
            // This is a trick to simulate feathering on a clipped region
            ctx.shadowColor = 'black';
            ctx.shadowBlur = feather;
            // Offset the shadow so we are only drawing the blur
            ctx.shadowOffsetX = overlayWidth * 2;
            ctx.shadowOffsetY = overlayHeight * 2;
            ctx.translate(-overlayWidth * 2, -overlayHeight * 2);
        }

        ctx.beginPath();
        switch (overlay.mask.shape) {
            case 'circle':
                ctx.arc(overlayWidth / 2, overlayHeight / 2, Math.min(overlayWidth, overlayHeight) / 2, 0, Math.PI * 2);
                break;
            case 'rectangle':
                const shortestSide = Math.min(overlayWidth, overlayHeight);
                const radius = shortestSide * (overlay.mask.cornerRadius / 100);
                if (ctx.roundRect) {
                  ctx.roundRect(0, 0, overlayWidth, overlayHeight, radius);
                } else {
                  // Fallback for browsers that don't support roundRect
                  ctx.rect(0, 0, overlayWidth, overlayHeight);
                }
                break;
        }
        ctx.closePath();
        ctx.restore();
        ctx.clip();
        return 'clipped';
    };


    const drawTextToCanvas = (overlay: TextOverlay) => {
        const x = (overlay.left / 100) * canvas.width;
        const y = (overlay.top / 100) * canvas.height;
        ctx.save();
        ctx.font = `${overlay.fontSize}px Arial`;
        ctx.fillStyle = overlay.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textMetrics = ctx.measureText(overlay.text);
        const textWidth = textMetrics.width;
        const textHeight = overlay.fontSize; // Approximation
        
        ctx.translate(x - textWidth / 2, y - textHeight / 2);
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) { ctx.restore(); return; }
        
        // Draw text to temp canvas
        tempCtx.font = ctx.font;
        tempCtx.fillStyle = ctx.fillStyle;
        tempCtx.textAlign = ctx.textAlign;
        tempCtx.textBaseline = ctx.textBaseline;
        tempCtx.fillText(overlay.text, textWidth / 2, textHeight / 2);

        // Apply mask to temp canvas
        const maskResult = applyCanvasMask(tempCtx, overlay, textWidth, textHeight);
        
        if (maskResult === 'composited') {
             // The content and mask are already composited on tempCtx
        } else if (maskResult === 'clipped') {
            // This path won't work well as clip is on the main context.
            // Let's simplify and do all masking on a temp canvas for consistency.
        }
        
        // Simplified approach for export:
        // 1. Save main context state
        // 2. Translate main context
        // 3. Create temp canvas for the overlay
        // 4. Draw content to temp canvas
        // 5. Apply mask to temp canvas
        // 6. Draw temp canvas to main canvas
        
        ctx.restore(); // Restore outer translate

        // Re-implementing with temp canvas for all masking
        ctx.save();
        const tempCanvas2 = document.createElement('canvas');
        tempCanvas2.width = textWidth;
        tempCanvas2.height = textHeight;
        const tempCtx2 = tempCanvas2.getContext('2d');
        if (!tempCtx2) { ctx.restore(); return; }

        tempCtx2.font = `${overlay.fontSize}px Arial`;
        tempCtx2.fillStyle = overlay.color;
        tempCtx2.textAlign = 'center';
        tempCtx2.textBaseline = 'middle';
        tempCtx2.fillText(overlay.text, textWidth/2, textHeight/2);
        
        applyCanvasMask(tempCtx2, overlay, textWidth, textHeight);

        ctx.drawImage(tempCanvas2, x - textWidth / 2, y - textHeight / 2);
        ctx.restore();
    };

    const drawImageToCanvas = (overlay: ImageOverlay) => {
        return new Promise<void>(resolve => {
            const img = new Image();
            img.onload = () => {
                const overlayWidth = (overlay.width / 100) * canvas.width;
                const overlayHeight = (overlayWidth / img.width) * img.height;
                const x = (overlay.left / 100) * canvas.width - overlayWidth / 2;
                const y = (overlay.top / 100) * canvas.height - overlayHeight / 2;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = overlayWidth;
                tempCanvas.height = overlayHeight;
                const tempCtx = tempCanvas.getContext('2d');
                if(!tempCtx) { resolve(); return; }

                let imageToDraw: CanvasImageSource = img;

                if (overlay.chromaKey.enabled) {
                    processCanvas.width = img.width;
                    processCanvas.height = img.height;
                    processCtx.drawImage(img, 0, 0);
                    const imageData = processCtx.getImageData(0, 0, img.width, img.height);
                    applyChromaKey(imageData, overlay.chromaKey);
                    processCtx.putImageData(imageData, 0, 0);
                    imageToDraw = processCanvas;
                }
                
                tempCtx.drawImage(imageToDraw, 0, 0, overlayWidth, overlayHeight);
                
                applyCanvasMask(tempCtx, overlay, overlayWidth, overlayHeight);

                ctx.drawImage(tempCanvas, x, y);
                
                resolve();
            };
            img.onerror = () => resolve();
            img.src = overlay.src;
        });
    };
    
    const drawFrame = async () => {
        if (currentExportTime > totalDuration) {
            recorder.stop();
            return;
        }
        setExportProgress((currentExportTime / totalDuration) * 100);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const transitionStartTime = durationA - transitionDuration;
        
        if (currentExportTime < transitionStartTime) { // Clip A only
            await drawVideoToCanvas(videoA, clipA, currentExportTime, 1);
        } else if (currentExportTime >= transitionStartTime && currentExportTime < durationA && clipB && videoB) { // Transition
            const timeInB = currentExportTime - transitionStartTime;
            const progress = (currentExportTime - transitionStartTime) / transition.duration;
            
            switch (transition.type) {
                case 'crossfade':
                    await drawVideoToCanvas(videoB, clipB, timeInB, 1);
                    const opacityA = 1 - progress;
                    await drawVideoToCanvas(videoA, clipA, currentExportTime, opacityA);
                    break;
                case 'wipe-left':
                    await drawVideoToCanvas(videoA, clipA, currentExportTime, 1);
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, 0, canvas.width * progress, canvas.height);
                    ctx.clip();
                    await drawVideoToCanvas(videoB, clipB, timeInB, 1);
                    ctx.restore();
                    break;
                case 'wipe-right':
                    await drawVideoToCanvas(videoA, clipA, currentExportTime, 1);
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(canvas.width * (1 - progress), 0, canvas.width * progress, canvas.height);
                    ctx.clip();
                    await drawVideoToCanvas(videoB, clipB, timeInB, 1);
                    ctx.restore();
                    break;
                case 'wipe-down':
                    await drawVideoToCanvas(videoA, clipA, currentExportTime, 1);
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, 0, canvas.width, canvas.height * progress);
                    ctx.clip();
                    await drawVideoToCanvas(videoB, clipB, timeInB, 1);
                    ctx.restore();
                    break;
                case 'wipe-up':
                    await drawVideoToCanvas(videoA, clipA, currentExportTime, 1);
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(0, canvas.height * (1 - progress), canvas.width, canvas.height * progress);
                    ctx.clip();
                    await drawVideoToCanvas(videoB, clipB, timeInB, 1);
                    ctx.restore();
                    break;
                default:
                    await drawVideoToCanvas(videoA, clipA, currentExportTime, 1);
                    break;
            }
        } else if (clipB && videoB && currentExportTime >= durationA) { // Clip B only
            const timeInB = currentExportTime - transitionStartTime;
            await drawVideoToCanvas(videoB, clipB, timeInB, 1);
        } else if (clipA && videoA) { // Fallback to A if B doesn't exist
            await drawVideoToCanvas(videoA, clipA, currentExportTime, 1);
        }

        const imageOverlaysToDraw = imageOverlays.filter(overlay => currentExportTime >= overlay.startTime && currentExportTime <= overlay.endTime);
        for (const overlay of imageOverlaysToDraw) {
            await drawImageToCanvas(overlay);
        }
        
        const textOverlaysToDraw = textOverlays.filter(overlay => currentExportTime >= overlay.startTime && currentExportTime <= overlay.endTime);
        for (const overlay of textOverlaysToDraw) {
            drawTextToCanvas(overlay);
        }

        currentExportTime += frameDuration * playbackSpeed;
        requestAnimationFrame(drawFrame);
    };

    const drawVideoToCanvas = async (videoEl: HTMLVideoElement, clip: Clip, time: number, opacity: number) => {
        return new Promise<void>(resolve => {
            const onSeeked = () => {
                const trimmedDuration = clip.trimEnd - clip.trimStart;
                const progress = trimmedDuration > 0 ? time / trimmedDuration : 0;
                const finalProgress = clip.isReversed ? 1 - progress : progress;
                
                const scale = lerp(clip.startTransform.scale, clip.endTransform.scale, finalProgress);
                const panX = lerp(clip.startTransform.x, clip.endTransform.x, finalProgress);
                const panY = lerp(clip.startTransform.y, clip.endTransform.y, finalProgress);

                const sourceWidth = videoEl.videoWidth / scale;
                const sourceHeight = videoEl.videoHeight / scale;
                const viewCenterX = videoEl.videoWidth / 2 + (panX / 100 * videoEl.videoWidth);
                const viewCenterY = videoEl.videoHeight / 2 + (panY / 100 * videoEl.videoHeight);
                const sourceX = viewCenterX - sourceWidth / 2;
                const sourceY = viewCenterY - sourceHeight / 2;
                
                processCanvas.width = sourceWidth;
                processCanvas.height = sourceHeight;
                processCtx.drawImage(videoEl, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);
                
                if(clip.chromaKey.enabled) {
                    const imageData = processCtx.getImageData(0, 0, sourceWidth, sourceHeight);
                    applyChromaKey(imageData, clip.chromaKey);
                    processCtx.putImageData(imageData, 0, 0);
                }
                
                const clipAdjustments = [
                    clip.blur > 0 ? `blur(${clip.blur}px)` : '',
                    clip.colorGrading.brightness !== 100 ? `brightness(${clip.colorGrading.brightness}%)` : '',
                    clip.colorGrading.saturation !== 100 ? `saturate(${clip.colorGrading.saturation}%)` : '',
                    clip.colorGrading.hue !== 0 ? `hue-rotate(${clip.colorGrading.hue}deg)` : '',
                ].filter(Boolean).join(' ');

                const finalFilter = [globalFilter, clipAdjustments].filter(Boolean).join(' ');

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.filter = finalFilter;
                ctx.drawImage(processCanvas, 0, 0, canvas.width, canvas.height);
                ctx.restore();
                
                videoEl.removeEventListener('seeked', onSeeked);
                resolve();
            };
            videoEl.addEventListener('seeked', onSeeked);
            const timeToSeek = clip.isReversed ? clip.trimEnd - time : clip.trimStart + time;
            videoEl.currentTime = timeToSeek;
        });
    };

    drawFrame();
  }, [clips, transition, textOverlays, imageOverlays, selectedFilter, selectedEffect, crop, volume, playbackSpeed, totalDuration, durationA, transitionDuration]);

  const hasVideo = clips.length > 0;
  
  if (isCheckingApiKey) {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            Loading...
        </div>
    );
  }

  if (!isApiKeySelected) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8 text-center">
              <VideoSparkIcon className="w-16 h-16 text-indigo-400 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Welcome to Video Editor Pro</h1>
              <p className="text-gray-400 mb-6 max-w-md">To use AI-powered video generation, you need to select a Google AI Studio API key. This feature is part of a paid service.</p>
              <button
                  onClick={handleSelectApiKey}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 transition-colors"
              >
                  Select API Key
              </button>
              <p className="text-xs text-gray-500 mt-4">
                  For more information about pricing, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">billing documentation</a>.
              </p>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {isExporting && <Spinner progress={exportProgress} />}
      {isTextEditorOpen && selectedTextOverlay && (
        <TextOverlayEditor
          overlay={selectedTextOverlay}
          onSave={handleSaveTextOverlay}
          onClose={() => setIsTextEditorOpen(false)}
        />
      )}
      {isImageEditorOpen && selectedImageOverlay && (
        <ImageOverlayEditor
          overlay={selectedImageOverlay}
          onSave={handleSaveImageOverlay}
          onClose={() => setIsImageEditorOpen(false)}
        />
      )}
      {isExportDialogOpen && (
          <ExportDialog
            onExport={handleExport}
            onClose={() => setIsExportDialogOpen(false)}
          />
      )}
      <input type="file" ref={imageFileInputRef} onChange={handleImageFileChange} accept="image/*" className="hidden" />

      <header className="bg-gray-800 p-2 text-center text-xl font-bold shadow-md">
        Video Editor Pro
      </header>

      <main className="flex-grow flex p-4 gap-4 overflow-hidden">
        <div className="w-1/3 flex flex-col gap-4">
          <VideoGenerator
            onGenerate={handleGenerateVideo}
            isGenerating={isGeneratingVideo}
            progressMessage={generationProgressMessage}
          />
          <ClipManager 
            clipA={clipA}
            clipB={clipB}
            onAddClip={handleAddClip}
            onRemoveClip={handleRemoveClip}
            onSwapClips={handleSwapClips}
            onToggleReverse={handleToggleReverseClip}
          />
          <TransitionControls 
            transition={transition} 
            onTransitionChange={handleSetTransition}
            disabled={!clipA || !clipB}
          />
          <EditingToolsPanel
            clips={clips}
            setEditorState={setEditorState}
            filters={FILTERS}
            effects={EFFECTS}
            selectedFilter={selectedFilter}
            selectedEffect={selectedEffect}
            onSelectFilter={(filter) => setEditorState(prev => ({...prev, selectedFilter: filter}))}
            onSelectEffect={(effect) => setEditorState(prev => ({...prev, selectedEffect: effect}))}
          />
        </div>

        <div className="w-2/3 flex flex-col gap-4">
          <div className="flex-grow bg-black rounded-lg overflow-hidden relative">
            {hasVideo ? (
              <VideoPlayer
                videoRefA={videoRefA}
                videoRefB={videoRefB}
                clipA={clipA}
                clipB={clipB}
                transition={transition}
                filter={globalFilter}
                textOverlays={textOverlays}
                imageOverlays={imageOverlays}
                currentTime={currentTime}
                isPlaying={isPlaying}
                isCropping={isCropping}
                crop={crop}
                onCropChange={(newCrop) => setEditorState(prev => ({...prev, crop: newCrop}))}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Generate or upload a video to start editing
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <Controls
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
                onAddText={handleAddTextOverlay}
                onAddImage={handleAddImageClick}
                onExportClick={() => setIsExportDialogOpen(true)}
                onAutoEdit={handleAutoEdit}
                onSetTrimStart={() => {}}
                onSetTrimEnd={() => {}}
                hasVideo={hasVideo}
                isCropping={isCropping}
                onCropToggle={() => setIsCropping(prev => !prev)}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                volume={volume}
                onVolumeChange={(newVolume) => setEditorState(prev => ({...prev, volume: newVolume}))}
                playbackSpeed={playbackSpeed}
                onPlaybackSpeedChange={(newSpeed) => setEditorState(prev => ({...prev, playbackSpeed: newSpeed}))}
            />
            {hasVideo && (
              <Timeline
                duration={totalDuration}
                currentTime={currentTime}
                clips={clips}
                transition={transition}
                textOverlays={textOverlays}
                imageOverlays={imageOverlays}
                onTimeChange={handleTimelineClick}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;