export type AspectRatio = '9:16' | '1:1' | '16:9';

export type TextStyleMode = 'behind_subject' | 'editorial_poster' | 'dynamic_subtitles' | 'classic_subtitles';

export interface SubtitleItem {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface TextOverlayConfig {
  enabled: boolean;
  mode: TextStyleMode;
  // Main title / quote
  primaryText: string;
  secondaryText: string;
  // Font & styling
  fontFamily: string; // 'Bebas Neue' | 'Anton' | 'Syne' | 'Montserrat'
  textColor: string;
  fontSize: number; // percentage of canvas
  letterSpacing: number;
  textPosition: { x: number; y: number }; // percentage (0 to 100) for Main Title
  textAlign?: 'left' | 'center' | 'right';
  subtitlePosition: { x: number; y: number }; // percentage (0 to 100) for Subtitles
  subtitleFontSize: number; // font size percentage
  subtitleShowBackground: boolean; // toggle background pill vs pure letters
  subtitleColor: string;
  subtitleHasOutline?: boolean; // toggle black/contrasting outline stroke
  subtitleStrokeColor?: string; // outline color (default '#000000')
  
  // Editorial poster specific (Rule of thirds reference)
  showGridLines: boolean;
  showCrosshairs: boolean;
  badgeLocationText: string;
  badgeDateText: string;
  authorHandle: string;
  frostedGlassCaption: string;
  showFrostedCard: boolean;

  // Behind subject specific (Curug Sawer / Just Do It reference)
  segmentationActive: boolean;
  maskThreshold: number;
  maskFeather?: number; // Anti-aliasing / edge feathering in px (default 4)
  maskTemporalSmoothing?: boolean; // EMA temporal stabilization

  // Subtitle presentation and synchronization
  subtitleStyle?: 'classic_bottom' | 'giant_headline' | 'behind_subject';
  useSubtitlesAsMainTitle?: boolean; // Dynamic subtitles replace or act as the main title
  subtitleSyncOffset?: number; // Timing offset in seconds to perfectly synchronize with speech
}

export interface WatermarkConfig {
  url: string | null;
  position: { x: number; y: number }; // percentage (0 to 100)
  scale: number; // 0.1 to 1
  opacity: number; // 0 to 1
  start?: number; // appearance start in seconds
  duration?: number; // duration in seconds
}

export interface AudioTrackConfig {
  url: string | null;
  name: string;
  volume: number; // 0 to 1
  ducking: boolean; // lower volume when speech happens
  isSyntheticLoop: boolean;
  presetTheme: 'lofi' | 'cinematic' | 'upbeat' | 'nature' | 'none';
  sfxType?: 'whoosh' | 'ding' | 'boom' | 'pop' | 'camera' | 'none';
  isMuted?: boolean;
  isLoop?: boolean; // toggle loop vs play once
  start?: number;
  duration?: number;
}

export interface MediaAsset {
  id: string;
  name: string;
  type: 'video' | 'image';
  url: string;
  duration: number; // in seconds
  aspectRatio: number;
  file?: File;
  volume?: number;
  start?: number;
  trimStart?: number;
  trimEnd?: number;
}

export interface VideoClip {
  id: string;
  name: string;
  type?: 'video' | 'image';
  url: string;
  duration: number; // in seconds
  start: number; // in seconds on timeline
  aspectRatio?: number;
  file?: File;
  volume?: number;
  trimStart?: number;
  trimEnd?: number;
  transitionToNext?: VideoTransitionType;
  transitionDuration?: number;
}

export interface AudioClip {
  id: string;
  name: string;
  url: string | null;
  start: number; // in seconds on timeline
  duration: number; // in seconds
  volume: number; // 0 to 1.5
  isLoop: boolean; // false = play once (1x), true = loop
  sfxType?: 'whoosh' | 'ding' | 'boom' | 'pop' | 'camera' | 'none';
  presetTheme?: 'lofi' | 'cinematic' | 'upbeat' | 'nature' | 'none';
  isMuted?: boolean;
  file?: File;
}

export type TimelineTrackType = 'video' | 'text' | 'subtitles' | 'audio' | 'watermark';

export interface TimelineSelection {
  track: TimelineTrackType;
  id: string;
}

export type VideoTransitionType = 'none' | 'crossfade' | 'fade_black' | 'flash_white';
export type IntroEffectType = 'none' | 'fade_in' | 'zoom_in';
export type OutroEffectType = 'none' | 'fade_out' | 'zoom_out';

export interface TransitionConfig {
  intro: IntroEffectType;
  introDuration: number;
  outro: OutroEffectType;
  outroDuration: number;
  transitionBetweenClips: VideoTransitionType;
  transitionDuration: number;
}


