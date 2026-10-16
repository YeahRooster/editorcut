export type AspectRatio = '9:16' | '1:1' | '16:9';

export type TextStyleMode = 'behind_subject' | 'editorial_poster' | 'dynamic_subtitles' | 'classic_subtitles';

export type TextAnimationType = 'none' | 'fade' | 'slide_left' | 'slide_bottom' | 'zoom';

export interface SubtitleItem {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface TextClipItem {
  id: string;
  text: string;
  secondaryText?: string;
  start: number; // in seconds on timeline
  end: number;   // in seconds on timeline
  position?: { x: number; y: number }; // percentage (0 to 100)
  fontSize?: number; // percentage of canvas
  fontFamily?: string;
  textColor?: string;
  mode?: TextStyleMode;
  animation?: TextAnimationType;
  animationDuration?: number;
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

  // Title entrance/exit animation
  animation?: TextAnimationType; // 'fade' | 'slide_left' | 'slide_bottom' | 'zoom' | 'none'
  animationDuration?: number; // in seconds (default 0.4)
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
  speed?: number;
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
  speed?: number; // Playback speed multiplier (1 = normal, 2 = 2x, 4 = 4x, 8 = 8x speeddraw, etc.)
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
  trimStart?: number;
  trimEnd?: number;
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

export type ExportQuality = '4k' | '1080p' | '720p' | '480p';
export type ExportFPS = 30 | 60;
export type ExportFormat = 'mp4' | 'webm';
export interface ExportSettings {
  quality: ExportQuality;
  fps: ExportFPS;
  format: ExportFormat;
}

// -------------------------------------------------------------
// COMIC PANELS / VIÑETAS DE CÓMIC & SPLIT SCREEN TYPES
// -------------------------------------------------------------
export type ComicLayoutType =
  | 'none'
  | 'inset_pip'     // Inset reaction comic panel (Reference 1)
  | 'comic_3_left'  // 2 stacked on left, 1 tall on right (Reference 2)
  | 'comic_3_right' // 1 tall on left, 2 stacked on right
  | 'split_2_vert'  // 2 columns side by side (50/50)
  | 'split_2_horiz' // 2 rows top and bottom (50/50)
  | 'grid_4'        // 2x2 Comic 4-panel grid
  | 'strip_3_horiz' // 3 cinematic horizontal strips
  | 'custom';

export type ComicPanelAnimation =
  | 'none'
  | 'slide_bottom'
  | 'slide_top'
  | 'slide_left'
  | 'slide_right'
  | 'pop_zoom'
  | 'fade';

export interface ComicPanelItem {
  id: string;
  name: string;
  positionLabel?: string; // Human readable position badge (e.g. '⬆️ Arriba', '↔️ Medio', '⬇️ Abajo')
  x: number;      // 0 to 1 normalized canvas coordinate
  y: number;      // 0 to 1 normalized canvas coordinate
  width: number;  // 0 to 1 normalized canvas width
  height: number; // 0 to 1 normalized canvas height
  mediaUrl: string | null;
  mediaType: 'video' | 'image';
  mediaFile?: File;
  sourceClipId?: string; // Clip ID, or 'active_timeline' to follow timeline cuts
  start: number;       // in timeline seconds when panel enters
  duration: number;    // in seconds (0 = persists until end of timeline)
  animation: ComicPanelAnimation;
  animationDuration: number; // in seconds (e.g. 0.5s)
  volume: number;      // 0 to 1 (default 0 for secondary panels)
  isMuted?: boolean;
  loop?: boolean;      // whether video loops continuously (default true)
}

export interface ComicConfig {
  enabled: boolean;
  layout: ComicLayoutType;
  borderWidth: number; // in px (e.g. 4, 6, 8)
  borderColor: string; // hex or rgba (default #000000)
  borderRadius: number; // corner radius in px
  hasShadow: boolean;
  gutter: number; // spacing between panels in px
  panels: ComicPanelItem[];
  pages?: ComicPage[]; // Multiple comic pages / scenes across the timeline
  activePageIndex?: number; // Currently selected page in editor
}

export type ComicPageTransition =
  | 'none'
  | 'slide_left'
  | 'slide_right'
  | 'slide_up'
  | 'crossfade'
  | 'fade_black';

export interface ComicPage {
  id: string;
  name: string; // e.g. "Página 1", "Página 2"
  start: number; // in timeline seconds where this page begins
  duration: number; // in seconds (0 = persists until end of timeline or next page)
  layout: ComicLayoutType; // layout type (or 'none' for normal full-screen video!)
  transitionToNext?: ComicPageTransition; // transition into next page
  transitionDuration?: number; // in seconds (default 0.6s)
  panels: ComicPanelItem[];
}



