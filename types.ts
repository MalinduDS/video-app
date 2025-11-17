export type AnimationInType = 'none' | 'fade-in' | 'slide-in-left' | 'slide-in-right' | 'slide-in-top' | 'slide-in-bottom' | 'slide-in-center';
export type AnimationOutType = 'none' | 'fade-out' | 'slide-out-left' | 'slide-out-right' | 'slide-out-top' | 'slide-out-bottom' | 'slide-out-center';
export type ExportQuality = 'low' | 'high';

export interface Mask {
  shape: 'none' | 'circle' | 'rectangle' | 'custom-svg';
  cornerRadius: number; // percentage of half the shortest side
  feather: number; // in pixels
  customSvg: string | null; // content of the SVG file
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string; // hex color
  similarity: number; // 0 to 1
}

export interface ColorGradingSettings {
  brightness: number; // percentage, 100 is normal
  saturation: number; // percentage, 100 is normal
  hue: number; // degrees, 0 is normal
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  top: number; // percentage
  left: number; // percentage
  color: string;
  fontSize: number; // in pixels
  animationIn: AnimationInType;
  animationOut: AnimationOutType;
  zIndex: number;
  mask: Mask;
}

export interface ImageOverlay {
  id: string;
  src: string;
  startTime: number;
  endTime: number;
  width: number; // percentage of video width
  top: number; // percentage
  left: number; // percentage
  animationIn: AnimationInType;
  animationOut: AnimationOutType;
  zIndex: number;
  mask: Mask;
  chromaKey: ChromaKeySettings;
}

export interface Filter {
  name: string;
  value: string; // CSS filter value
}

export interface Effect {
  name: string;
  value: string; // CSS filter value
}

export interface Crop {
  x: number; // percentage from left
  y: number; // percentage from top
  width: number; // percentage
  height: number; // percentage
}

export interface Transform {
  scale: number; // e.g., 1 for no zoom, 2 for 2x zoom
  x: number; // percentage, -50 to 50
  y: number; // percentage, -50 to 50
}

// Represents a single video clip in the timeline
export interface Clip {
  id: string;
  file: File;
  url: string;
  duration: number;
  thumbnailUrl: string;
  trimStart: number;
  trimEnd: number;
  startTransform: Transform;
  endTransform: Transform;
  chromaKey: ChromaKeySettings;
  colorGrading: ColorGradingSettings;
  blur: number; // in pixels
  isReversed: boolean;
}

// Represents a transition between two clips
export interface Transition {
  type: 'none' | 'crossfade' | 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down';
  duration: number; // in seconds
}