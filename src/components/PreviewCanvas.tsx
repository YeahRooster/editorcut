import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { 
  AspectRatio, 
  TextOverlayConfig, 
  WatermarkConfig, 
  SubtitleItem, 
  MediaAsset,
  VideoClip,
  TransitionConfig
} from '../types';
import { selfieSegmenter } from '../utils/segmentation';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Move, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Upload
} from 'lucide-react';

interface PreviewCanvasProps {
  aspectRatio: AspectRatio;
  mediaAsset: MediaAsset | null;
  videoClips?: VideoClip[];
  transitionConfig?: TransitionConfig;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  textConfig: TextOverlayConfig;
  setTextConfig: React.Dispatch<React.SetStateAction<TextOverlayConfig>>;
  watermarkConfig: WatermarkConfig;
  setWatermarkConfig: React.Dispatch<React.SetStateAction<WatermarkConfig>>;
  subtitles: SubtitleItem[];
  setSubtitles: React.Dispatch<React.SetStateAction<SubtitleItem[]>>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isMuted: boolean;
  videoVolume?: number;
  onToggleMute: () => void;
  onUploadClick: () => void;
  isExporting?: boolean;
  selectedElement?: 'none' | 'watermark' | 'title' | 'subtitle';
  setSelectedElement?: (el: 'none' | 'watermark' | 'title' | 'subtitle') => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  aspectRatio,
  mediaAsset,
  videoClips = [],
  transitionConfig,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onTogglePlay,
  onSeek,
  textConfig,
  setTextConfig,
  watermarkConfig,
  setWatermarkConfig,
  subtitles,
  setSubtitles,
  canvasRef,
  videoRef,
  isMuted,
  videoVolume = 1.0,
  onToggleMute,
  onUploadClick,
  isExporting = false,
  selectedElement = 'none',
  setSelectedElement,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const watermarkImgRef = useRef<HTMLImageElement | null>(null);
  const staticImgRef = useRef<HTMLImageElement | null>(null);
  const clipVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const lastAdvancedClipIdRef = useRef<string | null>(null);

  // Synchronize clip video elements audio & mute
  useEffect(() => {
    clipVideosRef.current.forEach((v) => {
      v.muted = isMuted;
      v.volume = isMuted ? 0 : Math.min(1.0, videoVolume);
    });
  }, [isMuted, videoVolume]);

  // Hover, Dragging & Resize states
  type DragMode = 'none' | 'watermark_move' | 'watermark_resize' | 'title' | 'title_resize' | 'subtitle';
  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredElement, setHoveredElement] = useState<'none' | 'watermark' | 'watermark_resize' | 'title' | 'title_resize' | 'subtitle'>('none');

  // Double-click inline editing states
  const [editingSubtitle, setEditingSubtitle] = useState<{ id: string; text: string } | null>(null);
  const [editingTitle, setEditingTitle] = useState<boolean>(false);
  const [titleEditText, setTitleEditText] = useState<string>('');

  // Drag anchor refs for smooth resizing without jumps
  const dragStartValRef = useRef<number>(0);
  const dragStartXRef = useRef<number>(0);
  const dragStartYRef = useRef<number>(0);

  // Load watermark image if present
  useEffect(() => {
    if (watermarkConfig.url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = watermarkConfig.url;
      img.onload = () => {
        watermarkImgRef.current = img;
      };
    } else {
      watermarkImgRef.current = null;
    }
  }, [watermarkConfig.url]);

  // Load static image if mediaAsset is an image
  useEffect(() => {
    if (mediaAsset && mediaAsset.type === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = mediaAsset.url;
      img.onload = () => {
        staticImgRef.current = img;
        if (textConfig.mode === 'behind_subject') {
          selfieSegmenter.processFrame(img);
        }
      };
    } else {
      staticImgRef.current = null;
    }
  }, [mediaAsset, textConfig.mode]);

  // Canvas dimensions based on aspect ratio
  const getCanvasDimensions = useCallback(() => {
    switch (aspectRatio) {
      case '9:16':
        return { width: 1080, height: 1920, displayAspect: 'aspect-[9/16]' };
      case '1:1':
        return { width: 1080, height: 1080, displayAspect: 'aspect-square' };
      case '16:9':
        return { width: 1920, height: 1080, displayAspect: 'aspect-[16/9]' };
    }
  }, [aspectRatio]);

  const { width: cWidth, height: cHeight, displayAspect } = getCanvasDimensions();

  // Primary rendering loop
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas internal resolution
    if (canvas.width !== cWidth || canvas.height !== cHeight) {
      canvas.width = cWidth;
      canvas.height = cHeight;
    }

    // 1. Clear background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, cWidth, cHeight);

    let activeSource: CanvasImageSource | null = null;
    let sourceWidth = 0;
    let sourceHeight = 0;

    let activeClip: VideoClip | null = null;
    if (videoClips && videoClips.length > 0) {
      activeClip =
        videoClips.find((c) => currentTime >= c.start && currentTime < c.start + c.duration) ||
        (currentTime >=
        (videoClips[videoClips.length - 1]?.start + videoClips[videoClips.length - 1]?.duration)
          ? videoClips[videoClips.length - 1]
          : videoClips[0]);
    }

    const clipIdx = activeClip && videoClips ? videoClips.findIndex((c) => c.id === activeClip?.id) : -1;
    const nextClip = (clipIdx >= 0 && clipIdx < videoClips.length - 1) ? videoClips[clipIdx + 1] : null;
    const cutTransition = activeClip
      ? (activeClip.transitionToNext ?? transitionConfig?.transitionBetweenClips ?? 'none')
      : 'none';
    const transDur = activeClip
      ? (activeClip.transitionDuration ?? transitionConfig?.transitionDuration ?? 0.6)
      : 0.6;
    const cutTime = nextClip ? nextClip.start : duration;
    const isCrossfading =
      cutTransition === 'crossfade' &&
      nextClip !== null &&
      currentTime >= cutTime - transDur &&
      currentTime <= cutTime;

    let activeVideoEl: HTMLVideoElement | null = null;
    if (activeClip) {
      activeVideoEl = clipVideosRef.current.get(activeClip.id) || null;
      if (activeVideoEl && videoRef) {
        (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = activeVideoEl;
      }
    } else if (mediaAsset?.type === 'video') {
      activeVideoEl = (videoRef && videoRef.current) || (mediaAsset ? clipVideosRef.current.get(mediaAsset.id) : null) || null;
    }

    const targetVol = isMuted ? 0 : Math.min(1.0, videoVolume);

    // Keep all other video elements paused (EXCEPT nextClip during crossfade window!)
    clipVideosRef.current.forEach((v, id) => {
      const isNextDuringCrossfade = isCrossfading && nextClip && id === nextClip.id;
      if (activeClip && id !== activeClip.id && !isNextDuringCrossfade && !v.paused) {
        try {
          v.pause();
        } catch (e) {}
      }
    });

    if (activeVideoEl) {
      const clipStart = activeClip ? activeClip.start : 0;
      const relTime = Math.max(0, currentTime - clipStart);
      const drift = Math.abs(activeVideoEl.currentTime - relTime);

      // Synchronize video muted state & volume
      if (activeVideoEl.muted !== isMuted) {
        activeVideoEl.muted = isMuted;
      }
      if (Math.abs(activeVideoEl.volume - targetVol) > 0.05) {
        activeVideoEl.volume = targetVol;
      }

      if (!isPlaying) {
        if (drift > 0.04) {
          try {
            activeVideoEl.currentTime = relTime;
          } catch (e) {}
        }
        if (!activeVideoEl.paused) {
          try {
            activeVideoEl.pause();
          } catch (e) {}
        }
      } else {
        // While playing: ONLY seek if user performed a major scrub / jump (> 1.2s)
        if (drift > 1.2) {
          try {
            activeVideoEl.currentTime = relTime;
          } catch (e) {}
        }

        // Start active video if paused and timeline not at the end
        if (activeVideoEl.paused && currentTime < duration - 0.04) {
          activeVideoEl.play().catch(() => {});
        }

        // Single master clock: report real hardware video playback time smoothly to timeline
        if (onTimeUpdate && !activeVideoEl.paused) {
          const currentReal = clipStart + activeVideoEl.currentTime;
          if (Math.abs(currentTime - currentReal) > 0.03) {
            onTimeUpdate(currentReal);
          }
        }
      }

      // Check if video reached total timeline duration
      const currentReal = clipStart + activeVideoEl.currentTime;
      if (isPlaying && duration > 0 && (currentReal >= duration - 0.04 || currentTime >= duration - 0.04)) {
        try {
          activeVideoEl.pause();
          activeVideoEl.currentTime = 0;
        } catch (e) {}
        onTimeUpdate(0);
        onTogglePlay();
      }

      // Seamless clip handoff: advance to next clip when current clip reaches cut point
      if (isPlaying && activeClip && nextClip) {
        const isNearClipEnd =
          activeVideoEl.ended ||
          activeVideoEl.currentTime >= (activeClip.duration || 0) - 0.05 ||
          currentTime >= cutTime - 0.03;

        if (isNearClipEnd && lastAdvancedClipIdRef.current !== activeClip.id) {
          lastAdvancedClipIdRef.current = activeClip.id;

          try {
            activeVideoEl.pause();
          } catch (e) {}

          const nextEl = clipVideosRef.current.get(nextClip.id);
          if (nextEl) {
            if (!isCrossfading || nextEl.paused) {
              nextEl.currentTime = 0;
              nextEl.muted = isMuted;
              nextEl.volume = targetVol;
              nextEl.play().catch(() => {});
            }
            if (videoRef) {
              (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = nextEl;
            }
          }

          if (onTimeUpdate) {
            onTimeUpdate(nextClip.start);
          }
        }
      }

      // Reset advance tracker once activeClip changes or when not playing
      if (activeClip && lastAdvancedClipIdRef.current && lastAdvancedClipIdRef.current !== activeClip.id) {
        lastAdvancedClipIdRef.current = null;
      }
      if (!isPlaying) {
        lastAdvancedClipIdRef.current = null;
      }

      activeSource = activeVideoEl;
      sourceWidth = activeVideoEl.videoWidth || cWidth;
      sourceHeight = activeVideoEl.videoHeight || cHeight;
    } else if (mediaAsset?.type === 'image' && staticImgRef.current) {
      activeSource = staticImgRef.current;
      sourceWidth = staticImgRef.current.naturalWidth || cWidth;
      sourceHeight = staticImgRef.current.naturalHeight || cHeight;
    }

    let centerShiftX = 0;
    let centerShiftY = 0;
    let destW = cWidth;
    let destH = cHeight;

    // Render media background (Cover mode) with optional zoom intro/outro
    if (activeSource && sourceWidth > 0 && sourceHeight > 0) {
      const hRatio = cWidth / sourceWidth;
      const vRatio = cHeight / sourceHeight;
      const ratio = Math.max(hRatio, vRatio);
      centerShiftX = (cWidth - sourceWidth * ratio) / 2;
      centerShiftY = (cHeight - sourceHeight * ratio) / 2;
      destW = sourceWidth * ratio;
      destH = sourceHeight * ratio;

      ctx.save();
      // Zoom in Intro or Zoom out Outro
      const introDur = transitionConfig?.introDuration || 0.8;
      const outroDur = transitionConfig?.outroDuration || 0.8;
      let scale = 1.0;
      if (transitionConfig?.intro === 'zoom_in' && currentTime < introDur) {
        const p = currentTime / introDur;
        scale = 1.15 - 0.15 * p;
      } else if (
        transitionConfig?.outro === 'zoom_out' &&
        currentTime > Math.max(0, duration - outroDur)
      ) {
        const p = (currentTime - (duration - outroDur)) / outroDur;
        scale = 1.0 - 0.15 * Math.min(1, Math.max(0, p));
      }

      if (scale !== 1.0) {
        ctx.translate(cWidth / 2, cHeight / 2);
        ctx.scale(scale, scale);
        ctx.translate(-cWidth / 2, -cHeight / 2);
      }

      ctx.drawImage(
        activeSource,
        0,
        0,
        sourceWidth,
        sourceHeight,
        centerShiftX,
        centerShiftY,
        destW,
        destH
      );

      // Crossfade transition between consecutive clips (per-cut or global setting)
      if (videoClips && videoClips.length > 1 && isCrossfading && nextClip) {
        const p = Math.min(1, Math.max(0, (currentTime - (cutTime - transDur)) / transDur));
        const nextV = clipVideosRef.current.get(nextClip.id);
        if (nextV && nextV.videoWidth > 0) {
          if (isPlaying && nextV.paused) {
            try {
              nextV.currentTime = Math.max(0, currentTime - (cutTime - transDur));
              nextV.muted = isMuted;
              nextV.volume = targetVol;
              nextV.play().catch(() => {});
            } catch (e) {}
          }
          ctx.save();
          ctx.globalAlpha = p;
          ctx.drawImage(
            nextV,
            0,
            0,
            nextV.videoWidth,
            nextV.videoHeight,
            centerShiftX,
            centerShiftY,
            destW,
            destH
          );
          ctx.restore();
        }
      }

      ctx.restore();

      // Trigger MediaPipe segmentation frame update if behind_subject is active
      if (textConfig.mode === 'behind_subject') {
        selfieSegmenter.processFrame(activeSource);
      }
    } else {
      // Empty placeholder background with subtle grid
      ctx.fillStyle = '#171717';
      ctx.fillRect(0, 0, cWidth, cHeight);
      ctx.fillStyle = '#737373';
      ctx.font = '36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Arrastra un video o foto aquí', cWidth / 2, cHeight / 2);
    }

    // -------------------------------------------------------------
    // SYNCED SUBTITLE CALCULATION WITH ACOUSTIC ONSET OFFSET
    // -------------------------------------------------------------
    const syncOffset = textConfig.subtitleSyncOffset ?? 0.20;
    const effectiveTime = currentTime - syncOffset;
    let displaySub = subtitles.find(
      (sub) => effectiveTime >= sub.start && effectiveTime <= sub.end
    );
    if (!displaySub && !isPlaying && subtitles.length > 0) {
      displaySub = subtitles.find((s) => s.start <= effectiveTime) || subtitles[0];
    }

    const isSubBehindPerson =
      textConfig.mode === 'behind_subject' &&
      (textConfig.subtitleStyle === 'behind_subject' || textConfig.useSubtitlesAsMainTitle);

    // -------------------------------------------------------------
    // LAYER: BEHIND SUBJECT TEXT (Curug Sawer / Just Do It style)
    // -------------------------------------------------------------
    const hasStaticTitle = textConfig.primaryText && textConfig.primaryText.trim().length > 0;
    const hasDynamicSubAsTitle = textConfig.useSubtitlesAsMainTitle && displaySub && displaySub.text.trim().length > 0;
    const hasSeparateSubBehind = !textConfig.useSubtitlesAsMainTitle && textConfig.subtitleStyle === 'behind_subject' && displaySub && displaySub.text.trim().length > 0;

    if (textConfig.enabled && textConfig.mode === 'behind_subject' && (hasStaticTitle || hasDynamicSubAsTitle || hasSeparateSubBehind)) {
      // 1. Render primary headline behind the person (either static title or dynamic voice subtitle taking title's spot)
      const textToRender = textConfig.useSubtitlesAsMainTitle
        ? (displaySub?.text || textConfig.primaryText || '')
        : textConfig.primaryText;

      if (textToRender && textToRender.trim().length > 0) {
        const textX = (cWidth * textConfig.textPosition.x) / 100;
        const textY = (cHeight * textConfig.textPosition.y) / 100;
        const textAlign = textConfig.textAlign || 'center';

        ctx.save();
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textConfig.textColor;

        // Primary massive text
        const computedFontSize = Math.round(cWidth * (textConfig.fontSize / 100));
        ctx.font = `900 ${computedFontSize}px "${textConfig.fontFamily || 'Bebas Neue'}", sans-serif`;

        // Multi-line support if text has newlines or spaces
        const lines = textToRender.split('\n');
        const lineHeight = computedFontSize * 0.95;
        const startY = textY - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, index) => {
          // Subtle soft shadow behind the letters
          ctx.shadowColor = 'rgba(0,0,0,0.7)';
          ctx.shadowBlur = 18;
          ctx.fillText(line.toUpperCase(), textX, startY + index * lineHeight);
        });
        ctx.restore();
      }

      // 2. If separate dynamic subtitle is also placed behind the person (coexisting with static title)
      if (hasSeparateSubBehind) {
        const subX = (cWidth * (textConfig.subtitlePosition?.x ?? 50)) / 100;
        const subY = (cHeight * (textConfig.subtitlePosition?.y ?? 65)) / 100;
        const subSizePct = textConfig.subtitleStyle === 'giant_headline' || textConfig.subtitleStyle === 'behind_subject'
          ? Math.max(textConfig.subtitleFontSize || 22, 16)
          : (textConfig.subtitleFontSize || 5.5);
        const subFontSize = Math.round(cWidth * (subSizePct / 100));

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textConfig.subtitleColor || '#ffffff';
        ctx.font = `900 ${subFontSize}px "${textConfig.fontFamily || 'Bebas Neue'}", sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 18;
        ctx.fillText(displaySub!.text.toUpperCase(), subX, subY);
        ctx.restore();
      }
    }

    // -------------------------------------------------------------
    // LAYER: PERSON FOREGROUND CUTOUT (MediaPipe segmentation)
    // Enhanced with sub-pixel feathering and anti-aliasing
    // -------------------------------------------------------------
    if (activeSource && textConfig.segmentationActive && textConfig.mode === 'behind_subject') {
      selfieSegmenter.drawPersonCutout(
        ctx,
        activeSource,
        sourceWidth,
        sourceHeight,
        centerShiftX,
        centerShiftY,
        destW,
        destH,
        cWidth,
        cHeight,
        textConfig.maskThreshold ?? 0.26,
        textConfig.maskFeather ?? 4
      );
    }

      // Small secondary text ON TOP of the person (like in the Just Do It hiking photo)
      if (textConfig.secondaryText) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.font = '600 32px Montserrat, sans-serif';
        ctx.fillText(textConfig.secondaryText, cWidth / 2, cHeight * 0.22);

        // Mountain or decorative icon placeholder
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        const iconY = cHeight * 0.16;
        ctx.moveTo(cWidth / 2 - 60, iconY + 20);
        ctx.lineTo(cWidth / 2 - 20, iconY - 20);
        ctx.lineTo(cWidth / 2 + 10, iconY + 5);
        ctx.lineTo(cWidth / 2 + 35, iconY - 10);
        ctx.lineTo(cWidth / 2 + 65, iconY + 20);
        ctx.stroke();
        ctx.restore();
      }

    // -------------------------------------------------------------
    // LAYER: EDITORIAL POSTER STYLE (Rule of Thirds style)
    // -------------------------------------------------------------
    if (textConfig.enabled && textConfig.mode === 'editorial_poster') {
      ctx.save();

      // 1. Rule of thirds grid lines
      if (textConfig.showGridLines) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(cWidth / 3, 0);
        ctx.lineTo(cWidth / 3, cHeight);
        ctx.moveTo((cWidth * 2) / 3, 0);
        ctx.lineTo((cWidth * 2) / 3, cHeight);

        // Horizontal lines
        ctx.moveTo(0, cHeight / 3);
        ctx.lineTo(cWidth, cHeight / 3);
        ctx.moveTo(0, (cHeight * 2) / 3);
        ctx.lineTo(cWidth, (cHeight * 2) / 3);
        ctx.stroke();
      }

      // 2. Editorial crosshair targets & circles (Reference 1)
      if (textConfig.showCrosshairs) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;

        // Top right big target circle
        const circleCenterX = (cWidth * 2) / 3;
        const circleCenterY = cHeight / 3;
        ctx.beginPath();
        ctx.arc(circleCenterX, circleCenterY, cWidth * 0.28, 0, Math.PI * 2);
        ctx.stroke();

        // Bottom left target circle
        const circle2X = cWidth / 3;
        const circle2Y = (cHeight * 2) / 3;
        ctx.beginPath();
        ctx.arc(circle2X, circle2Y, cWidth * 0.24, 0, Math.PI * 2);
        ctx.stroke();

        // Top corners "+" crosses
        ctx.font = '700 40px Space Grotesk, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('+', 80, 100);
        ctx.fillText('+', cWidth - 100, 100);

        // "X X X" vertical stack
        ctx.font = '600 28px Space Grotesk, sans-serif';
        ctx.fillText('X', cWidth / 3 - 80, (cHeight * 2) / 3 - 60);
        ctx.fillText('X', cWidth / 3 - 80, (cHeight * 2) / 3 - 25);
        ctx.fillText('X', cWidth / 3 - 80, (cHeight * 2) / 3 + 10);
      }

      // 3. Main Bold Editorial Typography ("RULE OF THIRDS")
      const textX = (cWidth * textConfig.textPosition.x) / 100;
      const textY = (cHeight * textConfig.textPosition.y) / 100;

      ctx.fillStyle = textConfig.textColor;
      ctx.textAlign = textConfig.textAlign || 'left';

      // Small hashtag or code header
      if (textConfig.badgeDateText || textConfig.showCrosshairs) {
        ctx.font = `700 36px "${textConfig.fontFamily || 'Bebas Neue'}", sans-serif`;
        ctx.fillText('#C051', textX, textY - 140);
      }

      // Massive headline
      const computedFontSize = Math.round(cWidth * (textConfig.fontSize / 100));
      ctx.font = `900 ${computedFontSize}px "${textConfig.fontFamily || 'Bebas Neue'}", sans-serif`;
      const lines = textConfig.primaryText.split('\n');
      lines.forEach((line, index) => {
        ctx.fillText(line.toUpperCase(), textX, textY + index * (computedFontSize * 0.95));
      });

      // Sub-description block
      if (textConfig.secondaryText) {
        ctx.font = '700 28px Bebas Neue, Montserrat, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const subLines = textConfig.secondaryText.split('\n');
        subLines.forEach((sLine, sIdx) => {
          ctx.fillText(sLine.toUpperCase(), textX, textY + lines.length * (computedFontSize * 0.95) + 30 + sIdx * 34);
        });
      }

      // Metadata elements (Date and Handle)
      ctx.font = '700 32px Space Grotesk, sans-serif';
      ctx.fillText(textConfig.authorHandle || '@addaube', 80, cHeight - 80);

      // Date vertical stack
      ctx.textAlign = 'right';
      ctx.fillText('04', cWidth - 80, (cHeight * 2) / 3 + 40);
      ctx.fillText('-', cWidth - 80, (cHeight * 2) / 3 + 80);
      ctx.fillText('08', cWidth - 80, (cHeight * 2) / 3 + 120);
      ctx.fillText('-', cWidth - 80, (cHeight * 2) / 3 + 160);
      ctx.fillText('20', cWidth - 80, (cHeight * 2) / 3 + 200);
      ctx.fillText('25', cWidth - 80, (cHeight * 2) / 3 + 240);

      // 4. Frosted Glass Info Pill (Reference 2 style)
      if (textConfig.showFrostedCard && textConfig.frostedGlassCaption) {
        const cardW = cWidth * 0.85;
        const cardH = 140;
        const cardX = (cWidth - cardW) / 2;
        const cardY = cHeight * 0.74;

        ctx.save();
        // Glass blur simulation background
        ctx.fillStyle = 'rgba(25, 25, 25, 0.75)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 28);
        ctx.fill();
        ctx.stroke();

        // Caption text inside frosted glass pill
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = '400 24px Montserrat, Inter, sans-serif';
        ctx.fillText(textConfig.frostedGlassCaption, cWidth / 2, cardY + cardH / 2 + 8);
        ctx.restore();
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // LAYER: SUBTITLES (Automatic speech words)
    // -------------------------------------------------------------
    if (displaySub && !isSubBehindPerson) {
      const isGiant = textConfig.subtitleStyle === 'giant_headline' || textConfig.useSubtitlesAsMainTitle;
      const subX = (cWidth * (textConfig.subtitlePosition?.x ?? 50)) / 100;
      const subY = (cHeight * (textConfig.subtitlePosition?.y ?? (isGiant ? 30 : 82))) / 100;
      const subFontSizePercent = isGiant
        ? Math.max(textConfig.subtitleFontSize || 26, 18)
        : (textConfig.subtitleFontSize || 5.5);
      const computedFontSize = Math.round(cWidth * (subFontSizePercent / 100));

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${computedFontSize}px "${textConfig.fontFamily || 'Bebas Neue'}", sans-serif`;

      const textMetrics = ctx.measureText(displaySub.text.toUpperCase());
      const paddingX = Math.round(computedFontSize * 0.45);
      const paddingY = Math.round(computedFontSize * 0.25);
      const pillH = computedFontSize + paddingY * 2;
      const pillW = textMetrics.width + paddingX * 2;

      // 1. If background pill is enabled: draw rounded dark box
      if (textConfig.subtitleShowBackground && !isGiant) {
        ctx.fillStyle = 'rgba(12, 12, 12, 0.88)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(
          subX - pillW / 2,
          subY - pillH / 2,
          pillW,
          pillH,
          16
        );
        ctx.fill();
        ctx.stroke();
      }

      // 2. Outline / Reborde:
      const hasOutline = textConfig.subtitleHasOutline !== false;
      if (hasOutline && (!textConfig.subtitleShowBackground || isGiant)) {
        const isDarkText = (textConfig.subtitleColor || '#ffffff').toLowerCase() === '#000000';
        ctx.strokeStyle = textConfig.subtitleStrokeColor || (isDarkText ? '#ffffff' : '#000000');
        ctx.lineWidth = Math.max(4, Math.round(computedFontSize * 0.16));
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(displaySub.text.toUpperCase(), subX, subY);
      }

      ctx.shadowColor = hasOutline ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = hasOutline ? 14 : 6;
      ctx.fillStyle = textConfig.subtitleColor || '#ffffff';
      ctx.fillText(displaySub.text.toUpperCase(), subX, subY);

      // Visual indicator outline if hovered or dragged or selected (NEVER during export)
      const isInteractingSub =
        !isExporting &&
        (hoveredElement === 'subtitle' || dragMode === 'subtitle' || selectedElement === 'subtitle');

      if (isInteractingSub) {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#facc15'; // Amber border
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(subX - pillW / 2 - 4, subY - pillH / 2 - 4, pillW + 8, pillH + 8);
        ctx.setLineDash([]);

        // Small badge
        ctx.fillStyle = '#facc15';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('💬 SUBTÍTULO (Doble clic para editar • Presiona SUPR para eliminar)', subX - pillW / 2 - 4, subY - pillH / 2 - 12);
      }

      ctx.restore();
    } else if (displaySub && isSubBehindPerson) {
      // If subtitle is behind the person, show interaction bounding box during drag/hover/select
      const isInteractingSub =
        !isExporting &&
        (hoveredElement === 'subtitle' || dragMode === 'subtitle' || selectedElement === 'subtitle');

      if (isInteractingSub) {
        const subX = (cWidth * (textConfig.subtitlePosition?.x ?? 50)) / 100;
        const subY = (cHeight * (textConfig.subtitlePosition?.y ?? 30)) / 100;
        const subSizePct = textConfig.useSubtitlesAsMainTitle ? (textConfig.fontSize || 28) : (textConfig.subtitleFontSize || 22);
        const computedFontSize = Math.round(cWidth * (subSizePct / 100));

        ctx.save();
        ctx.font = `900 ${computedFontSize}px "${textConfig.fontFamily || 'Bebas Neue'}", sans-serif`;
        const textMetrics = ctx.measureText(displaySub.text.toUpperCase());
        const pillW = textMetrics.width + computedFontSize * 0.9;
        const pillH = computedFontSize * 1.5;

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(subX - pillW / 2, subY - pillH / 2, pillW, pillH);
        ctx.setLineDash([]);

        ctx.fillStyle = '#facc15';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('👤 SUBTÍTULO DETRÁS (Arrastra para mover)', subX - pillW / 2, subY - pillH / 2 - 10);
        ctx.restore();
      }
    }

    // Visual indicator outline for Title if hovered or dragged or selected (NEVER during export)
    const isInteractingTitle =
      !isExporting &&
      textConfig.enabled &&
      textConfig.primaryText &&
      textConfig.primaryText.trim().length > 0 &&
      (hoveredElement === 'title' ||
        hoveredElement === 'title_resize' ||
        dragMode === 'title' ||
        dragMode === 'title_resize' ||
        selectedElement === 'title');

    if (isInteractingTitle) {
      ctx.save();
      const titleX = (cWidth * textConfig.textPosition.x) / 100;
      const titleY = (cHeight * textConfig.textPosition.y) / 100;
      const lines = textConfig.primaryText.split('\n');
      const maxLen = Math.max(...lines.map((l) => l.length));
      const fontSizePx = cWidth * ((textConfig.fontSize || 28) / 100);
      const approxWPx = maxLen * fontSizePx * 0.55 + 24;
      const approxHPx = lines.length * fontSizePx + 20;

      let startXPx = titleX - approxWPx / 2;
      if (textConfig.textAlign === 'left') startXPx = titleX - 4;
      if (textConfig.textAlign === 'right') startXPx = titleX - approxWPx + 4;

      ctx.strokeStyle = '#38bdf8'; // Sky blue
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(startXPx, titleY - approxHPx / 2, approxWPx, approxHPx);
      ctx.setLineDash([]);

      // Corner resize handle (Bottom-Right) - Large, high-visibility handle
      const brX = startXPx + approxWPx;
      const brY = titleY + approxHPx / 2;
      const handleR = 12;

      // Outer white ring
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(brX, brY, handleR + 2, 0, Math.PI * 2);
      ctx.fill();

      // Inner sky blue circle
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(brX, brY, handleR, 0, Math.PI * 2);
      ctx.fill();

      // Title badge
      ctx.fillStyle = '#38bdf8';
      ctx.font = '700 18px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔤 TÍTULO (Doble clic: editar • Esquina: tamaño • SUPR: borrar)', startXPx, titleY - approxHPx / 2 - 12);

      // Tooltip when resizing or hovering handle
      if (hoveredElement === 'title_resize' || dragMode === 'title_resize') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        ctx.roundRect(brX + 16, brY - 14, 150, 28, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`↔ Tamaño: ${Math.round(textConfig.fontSize || 28)}%`, brX + 91, brY + 5);
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // LAYER: WATERMARK / LOGO (Drag & drop anywhere + Free Transform)
    // -------------------------------------------------------------
    if (watermarkImgRef.current && watermarkConfig.url) {
      ctx.save();
      const img = watermarkImgRef.current;
      const baseSize = cWidth * 0.22 * watermarkConfig.scale;
      const aspect = img.width / img.height;
      const w = baseSize;
      const h = baseSize / aspect;

      const posX = (cWidth * watermarkConfig.position.x) / 100;
      const posY = (cHeight * watermarkConfig.position.y) / 100;

      ctx.globalAlpha = watermarkConfig.opacity;
      ctx.drawImage(img, posX - w / 2, posY - h / 2, w, h);

      // Free Transform Bounding Box & Corner Resize Handle
      // NEVER draw during export! And in edit mode, ONLY when hovered, interacting or selected!
      const isInteractingLogo =
        !isExporting &&
        (hoveredElement === 'watermark' ||
          hoveredElement === 'watermark_resize' ||
          dragMode === 'watermark_move' ||
          dragMode === 'watermark_resize' ||
          selectedElement === 'watermark');

      if (isInteractingLogo) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(posX - w / 2 - 4, posY - h / 2 - 4, w + 8, h + 8);
        ctx.setLineDash([]);

        // Corner resize handle (Bottom-Right) - Large, high-visibility handle
        const brX = posX + w / 2 + 4;
        const brY = posY + h / 2 + 4;
        const handleR = 12;

        // Outer white ring
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(brX, brY, handleR + 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner pink circle
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(brX, brY, handleR, 0, Math.PI * 2);
        ctx.fill();

        // Watermark badge
        ctx.fillStyle = '#f43f5e';
        ctx.font = '700 18px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🖼️ LOGO (Presiona SUPR para eliminar • Esquina: tamaño)', posX - w / 2 - 4, posY - h / 2 - 12);

        // Tooltip when resizing or hovering handle
        if (hoveredElement === 'watermark_resize' || dragMode === 'watermark_resize') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.beginPath();
          ctx.roundRect(brX + 16, brY - 14, 130, 28, 6);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '600 16px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`↔ ${Math.round(watermarkConfig.scale * 100)}%`, brX + 81, brY + 5);
        }
      }

      ctx.restore();
    }

    // -------------------------------------------------------------
    // LAYER: VIDEO TRANSITIONS (Fade to black / Flash white between clips)
    // -------------------------------------------------------------
    if (videoClips && videoClips.length > 1) {
      for (let i = 0; i < videoClips.length - 1; i++) {
        const clip = videoClips[i];
        const nextClip = videoClips[i + 1];
        const cutTransition =
          clip.transitionToNext ??
          transitionConfig?.transitionBetweenClips ??
          'none';

        if (cutTransition === 'fade_black' || cutTransition === 'flash_white') {
          const transDur =
            clip.transitionDuration ??
            transitionConfig?.transitionDuration ??
            0.6;
          const half = transDur / 2;
          const cutTime = nextClip.start;
          if (currentTime >= cutTime - half && currentTime <= cutTime + half) {
            const p = (currentTime - (cutTime - half)) / transDur;
            if (cutTransition === 'fade_black') {
              const alpha = Math.min(1, Math.max(0, 1 - Math.abs(p - 0.5) * 2));
              ctx.save();
              ctx.fillStyle = '#000000';
              ctx.globalAlpha = alpha;
              ctx.fillRect(0, 0, cWidth, cHeight);
              ctx.restore();
            } else if (cutTransition === 'flash_white') {
              const alpha = Math.min(1, Math.max(0, 1 - Math.abs(p - 0.5) * 2));
              ctx.save();
              ctx.fillStyle = '#ffffff';
              ctx.globalAlpha = alpha;
              ctx.fillRect(0, 0, cWidth, cHeight);
              ctx.restore();
            }
            break;
          }
        }
      }
    }

    // -------------------------------------------------------------
    // LAYER: INTRO & OUTRO FADE TO BLACK OVERLAYS
    // -------------------------------------------------------------
    const introDur = transitionConfig?.introDuration || 0.8;
    const outroDur = transitionConfig?.outroDuration || 0.8;

    if (transitionConfig?.intro === 'fade_in' && currentTime < introDur) {
      const alpha = Math.max(0, 1 - currentTime / introDur);
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = alpha;
      ctx.fillRect(0, 0, cWidth, cHeight);
      ctx.restore();
    } else if (
      transitionConfig?.outro === 'fade_out' &&
      currentTime > Math.max(0, duration - outroDur)
    ) {
      const alpha = Math.min(
        1,
        Math.max(0, (currentTime - (duration - outroDur)) / outroDur)
      );
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.globalAlpha = alpha;
      ctx.fillRect(0, 0, cWidth, cHeight);
      ctx.restore();
    }
  }, [
    cWidth,
    cHeight,
    mediaAsset,
    videoClips,
    transitionConfig,
    duration,
    currentTime,
    isPlaying,
    textConfig,
    watermarkConfig,
    subtitles,
    canvasRef,
    videoRef,
    isMuted,
    videoVolume,
    hoveredElement,
    dragMode,
    isExporting,
    selectedElement,
  ]);

  // Continuous animation frame loop
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderFrame();
      animId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  // Helper to compute hit boxes in canvas percentage (0 to 100)
  const getHitBoxes = useCallback(() => {
    // 1. Watermark box & handle
    let watermarkBox: { x: number; y: number; w: number; h: number } | null = null;
    let watermarkHandle: { x: number; y: number; r: number } | null = null;
    if (watermarkConfig.url && watermarkImgRef.current) {
      const img = watermarkImgRef.current;
      const baseSize = cWidth * 0.22 * watermarkConfig.scale;
      const aspect = img.width / img.height;
      const wPct = (baseSize / cWidth) * 100;
      const hPct = ((baseSize / aspect) / cHeight) * 100;
      const posX = watermarkConfig.position.x;
      const posY = watermarkConfig.position.y;
      watermarkBox = {
        x: posX - wPct / 2,
        y: posY - hPct / 2,
        w: wPct,
        h: hPct,
      };
      watermarkHandle = {
        x: posX + wPct / 2,
        y: posY + hPct / 2,
        r: 5.5,
      };
    }

    // 2. Subtitle box
    let subtitleBox: { x: number; y: number; w: number; h: number } | null = null;
    if (subtitles.length > 0) {
      const subPos = textConfig.subtitlePosition || { x: 50, y: 82 };
      const subFontSizePercent = textConfig.subtitleFontSize || 5.5;
      const displaySub =
        subtitles.find((s) => currentTime >= s.start && currentTime <= s.end) ||
        subtitles[0];
      const textLen = (displaySub?.text || 'SUBTITULO').length;
      const approxWPx = Math.max(120, textLen * (cWidth * (subFontSizePercent / 100)) * 0.6 + 40);
      const approxHPx = (cWidth * (subFontSizePercent / 100)) * 1.6 + 20;

      const wPct = (approxWPx / cWidth) * 100;
      const hPct = (approxHPx / cHeight) * 100;
      subtitleBox = {
        x: subPos.x - wPct / 2,
        y: subPos.y - hPct / 2,
        w: wPct,
        h: hPct,
      };
    }

    // 3. Title box & corner handle
    let titleBox: { x: number; y: number; w: number; h: number } | null = null;
    let titleHandle: { x: number; y: number; r: number } | null = null;
    if (textConfig.enabled && textConfig.primaryText && textConfig.primaryText.trim().length > 0) {
      const titlePos = textConfig.textPosition || { x: 50, y: 30 };
      const lines = textConfig.primaryText.split('\n');
      const maxLen = Math.max(...lines.map((l) => l.length));
      const fontSizePx = cWidth * ((textConfig.fontSize || 28) / 100);
      const approxWPx = maxLen * fontSizePx * 0.55 + 24;
      const approxHPx = lines.length * fontSizePx + 20;

      const titleXPx = (cWidth * titlePos.x) / 100;
      const titleYPx = (cHeight * titlePos.y) / 100;

      let startXPx = titleXPx - approxWPx / 2;
      if (textConfig.textAlign === 'left') startXPx = titleXPx - 4;
      if (textConfig.textAlign === 'right') startXPx = titleXPx - approxWPx + 4;

      const boxX = (startXPx / cWidth) * 100;
      const boxY = ((titleYPx - approxHPx / 2) / cHeight) * 100;
      const boxW = (approxWPx / cWidth) * 100;
      const boxH = (approxHPx / cHeight) * 100;

      titleBox = {
        x: boxX,
        y: boxY,
        w: boxW,
        h: boxH,
      };

      titleHandle = {
        x: ((startXPx + approxWPx) / cWidth) * 100,
        y: ((titleYPx + approxHPx / 2) / cHeight) * 100,
        r: 5.5,
      };
    }

    return { watermarkBox, watermarkHandle, subtitleBox, titleBox, titleHandle };
  }, [cWidth, cHeight, watermarkConfig, textConfig, subtitles, currentTime]);

  // Interactive mouse dragging for Title, Subtitle, and Logo (move & resize)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const { watermarkBox, watermarkHandle, subtitleBox, titleBox, titleHandle } = getHitBoxes();

    // 1. Check Logo corner resize handle first (highest priority)
    if (watermarkHandle) {
      const distToHandle = Math.hypot(xPct - watermarkHandle.x, yPct - watermarkHandle.y);
      if (distToHandle <= 5.5) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDragMode('watermark_resize');
        dragStartValRef.current = watermarkConfig.scale;
        dragStartXRef.current = xPct;
        dragStartYRef.current = yPct;
        setSelectedElement?.('watermark');
        return;
      }
    }

    // 2. Check Title corner resize handle
    if (titleHandle) {
      const distToHandle = Math.hypot(xPct - titleHandle.x, yPct - titleHandle.y);
      if (distToHandle <= 5.5) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDragMode('title_resize');
        dragStartValRef.current = textConfig.fontSize || 28;
        dragStartXRef.current = xPct;
        dragStartYRef.current = yPct;
        setSelectedElement?.('title');
        return;
      }
    }

    // 3. Check Logo body
    if (watermarkBox) {
      if (
        xPct >= watermarkBox.x &&
        xPct <= watermarkBox.x + watermarkBox.w &&
        yPct >= watermarkBox.y &&
        yPct <= watermarkBox.y + watermarkBox.h
      ) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDragMode('watermark_move');
        setDragOffset({
          x: xPct - watermarkConfig.position.x,
          y: yPct - watermarkConfig.position.y,
        });
        setSelectedElement?.('watermark');
        return;
      }
    }

    // 4. Check Subtitle box
    if (subtitleBox) {
      if (
        xPct >= subtitleBox.x &&
        xPct <= subtitleBox.x + subtitleBox.w &&
        yPct >= subtitleBox.y &&
        yPct <= subtitleBox.y + subtitleBox.h
      ) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDragMode('subtitle');
        const subPos = textConfig.subtitlePosition || { x: 50, y: 82 };
        setDragOffset({
          x: xPct - subPos.x,
          y: yPct - subPos.y,
        });
        setSelectedElement?.('subtitle');
        return;
      }
    }

    // 5. Check Title box
    if (titleBox) {
      if (
        xPct >= titleBox.x &&
        xPct <= titleBox.x + titleBox.w &&
        yPct >= titleBox.y &&
        yPct <= titleBox.y + titleBox.h
      ) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDragMode('title');
        const titlePos = textConfig.textPosition || { x: 50, y: 30 };
        setDragOffset({
          x: xPct - titlePos.x,
          y: yPct - titlePos.y,
        });
        setSelectedElement?.('title');
        return;
      }
    }

    // 6. If clicked on empty canvas: deselect
    setDragMode('none');
    setSelectedElement?.('none');
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPct = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100));

    // Update hover state when not dragging
    if (dragMode === 'none') {
      const { watermarkBox, watermarkHandle, subtitleBox, titleBox, titleHandle } = getHitBoxes();
      if (watermarkHandle && Math.hypot(xPct - watermarkHandle.x, yPct - watermarkHandle.y) <= 5.5) {
        setHoveredElement('watermark_resize');
      } else if (titleHandle && Math.hypot(xPct - titleHandle.x, yPct - titleHandle.y) <= 5.5) {
        setHoveredElement('title_resize');
      } else if (
        watermarkBox &&
        xPct >= watermarkBox.x &&
        xPct <= watermarkBox.x + watermarkBox.w &&
        yPct >= watermarkBox.y &&
        yPct <= watermarkBox.y + watermarkBox.h
      ) {
        setHoveredElement('watermark');
      } else if (
        subtitleBox &&
        xPct >= subtitleBox.x &&
        xPct <= subtitleBox.x + subtitleBox.w &&
        yPct >= subtitleBox.y &&
        yPct <= subtitleBox.y + subtitleBox.h
      ) {
        setHoveredElement('subtitle');
      } else if (
        titleBox &&
        xPct >= titleBox.x &&
        xPct <= titleBox.x + titleBox.w &&
        yPct >= titleBox.y &&
        yPct <= titleBox.y + titleBox.h
      ) {
        setHoveredElement('title');
      } else {
        setHoveredElement('none');
      }
      return;
    }

    // Dragging actions
    if (dragMode === 'watermark_resize') {
      const deltaX = xPct - dragStartXRef.current;
      const deltaY = yPct - dragStartYRef.current;
      const avgDelta = (deltaX + deltaY) / 2;
      const newScale = Math.max(0.2, Math.min(3.5, parseFloat((dragStartValRef.current + avgDelta * 0.04).toFixed(2))));
      setWatermarkConfig((prev) => ({
        ...prev,
        scale: newScale,
      }));
    } else if (dragMode === 'title_resize') {
      const deltaX = xPct - dragStartXRef.current;
      const deltaY = yPct - dragStartYRef.current;
      const avgDelta = (deltaX + deltaY) / 2;
      const newFontSize = Math.max(10, Math.min(75, Math.round(dragStartValRef.current + avgDelta * 0.9)));
      setTextConfig((prev) => ({
        ...prev,
        fontSize: newFontSize,
      }));
    } else if (dragMode === 'watermark_move') {
      const newX = Math.max(5, Math.min(95, xPct - dragOffset.x));
      const newY = Math.max(5, Math.min(95, yPct - dragOffset.y));
      setWatermarkConfig((prev) => ({
        ...prev,
        position: { x: Math.round(newX), y: Math.round(newY) },
      }));
    } else if (dragMode === 'subtitle') {
      const newX = Math.max(5, Math.min(95, xPct - dragOffset.x));
      const newY = Math.max(5, Math.min(95, yPct - dragOffset.y));
      setTextConfig((prev) => ({
        ...prev,
        subtitlePosition: { x: Math.round(newX), y: Math.round(newY) },
      }));
    } else if (dragMode === 'title') {
      const newX = Math.max(5, Math.min(95, xPct - dragOffset.x));
      const newY = Math.max(5, Math.min(95, yPct - dragOffset.y));
      setTextConfig((prev) => ({
        ...prev,
        textPosition: { x: Math.round(newX), y: Math.round(newY) },
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setDragMode('none');
  };

  // Double click inline editing handler for Subtitle and Title
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const { subtitleBox, titleBox } = getHitBoxes();

    // 1. Double click on Subtitle:
    if (subtitleBox) {
      if (
        xPct >= subtitleBox.x &&
        xPct <= subtitleBox.x + subtitleBox.w &&
        yPct >= subtitleBox.y &&
        yPct <= subtitleBox.y + subtitleBox.h
      ) {
        const curSub =
          subtitles.find((s) => currentTime >= s.start && currentTime <= s.end) ||
          subtitles[0];
        if (curSub) {
          setEditingSubtitle({ id: curSub.id, text: curSub.text });
          return;
        }
      }
    }

    // 2. Double click on Title:
    if (titleBox) {
      if (
        xPct >= titleBox.x &&
        xPct <= titleBox.x + titleBox.w &&
        yPct >= titleBox.y &&
        yPct <= titleBox.y + titleBox.h
      ) {
        setTitleEditText(textConfig.primaryText || '');
        setEditingTitle(true);
        return;
      }
    }
  };

  const getCursorClass = () => {
    if (
      dragMode === 'watermark_resize' ||
      hoveredElement === 'watermark_resize' ||
      dragMode === 'title_resize' ||
      hoveredElement === 'title_resize'
    ) {
      return 'cursor-nwse-resize';
    }
    if (dragMode !== 'none') {
      return 'cursor-grabbing';
    }
    if (hoveredElement !== 'none') {
      return 'cursor-grab';
    }
    return 'cursor-default';
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeekInternal = (time: number) => {
    clipVideosRef.current.forEach((v, id) => {
      const clip = videoClips?.find((c) => c.id === id);
      if (clip) {
        const rel = Math.max(0, Math.min(clip.duration, time - clip.start));
        try {
          v.currentTime = rel;
        } catch (e) {}
      }
    });
    onSeek(time);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none"
    >
      {/* Hidden Video Player Elements for Frame Decoding across all clips */}
      {videoClips && videoClips.length > 0 ? (
        videoClips.map((clip) => (
          <video
            key={clip.id}
            id={`video-clip-${clip.id}`}
            ref={(el) => {
              if (el) {
                clipVideosRef.current.set(clip.id, el);
              } else {
                clipVideosRef.current.delete(clip.id);
              }
            }}
            src={clip.url}
            className="hidden"
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            muted={isMuted}
          />
        ))
      ) : (
        mediaAsset?.type === 'video' && (
          <video
            key={mediaAsset.id}
            id={`video-clip-${mediaAsset.id}`}
            ref={(el) => {
              if (el) {
                clipVideosRef.current.set(mediaAsset.id, el);
                if (videoRef) {
                  (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                }
              } else {
                clipVideosRef.current.delete(mediaAsset.id);
              }
            }}
            src={mediaAsset.url}
            className="hidden"
            playsInline
            preload="auto"
            crossOrigin="anonymous"
            muted={isMuted}
          />
        )
      )}

      {/* Center Canvas Viewport */}
      <div className="relative group max-h-[72vh] flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/50">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          className={`max-h-[72vh] max-w-full ${displayAspect} object-contain ${getCursorClass()} transition-all`}
        />

        {/* INLINE SUBTITLE EDIT MODAL (ON DOUBLE-CLICK) */}
        {editingSubtitle && (
          <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-700 p-5 rounded-2xl shadow-2xl max-w-md w-full text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <h4 className="text-sm font-bold text-white">Editar Texto del Subtítulo</h4>
                </div>
                <span className="text-[11px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">Doble Clic</span>
              </div>
              <p className="text-xs text-neutral-400">
                Modifica lo que dice este subtítulo en este momento del video:
              </p>
              <textarea
                rows={3}
                value={editingSubtitle.text}
                onChange={(e) =>
                  setEditingSubtitle({ ...editingSubtitle, text: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setSubtitles((prev) =>
                      prev.map((s) =>
                        s.id === editingSubtitle.id
                          ? { ...s, text: editingSubtitle.text.trim() }
                          : s
                      )
                    );
                    setEditingSubtitle(null);
                  } else if (e.key === 'Escape') {
                    setEditingSubtitle(null);
                  }
                }}
                autoFocus
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-sm text-white font-medium focus:border-rose-500 focus:outline-none uppercase"
                placeholder="Texto del subtítulo..."
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-500">
                  Presiona <strong>Enter</strong> para guardar • <strong>Esc</strong> para cancelar
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSubtitle(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubtitles((prev) =>
                        prev.map((s) =>
                          s.id === editingSubtitle.id
                            ? { ...s, text: editingSubtitle.text.trim() }
                            : s
                        )
                      );
                      setEditingSubtitle(null);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/50 transition"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INLINE TITLE EDIT MODAL (ON DOUBLE-CLICK) */}
        {editingTitle && (
          <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-neutral-900 border border-neutral-700 p-5 rounded-2xl shadow-2xl max-w-md w-full text-left space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔤</span>
                  <h4 className="text-sm font-bold text-white">Editar Frase Principal / Título</h4>
                </div>
                <span className="text-[11px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">Doble Clic</span>
              </div>
              <p className="text-xs text-neutral-400">
                Cambia la frase del título principal:
              </p>
              <textarea
                rows={3}
                value={titleEditText}
                onChange={(e) => setTitleEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    setTextConfig((prev) => ({ ...prev, primaryText: titleEditText }));
                    setEditingTitle(false);
                  } else if (e.key === 'Escape') {
                    setEditingTitle(false);
                  }
                }}
                autoFocus
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-sm text-white font-medium focus:border-rose-500 focus:outline-none uppercase"
                placeholder="Título principal..."
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-500">
                  Presiona <strong>Enter</strong> para guardar • <strong>Esc</strong> para cancelar
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTitle(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTextConfig((prev) => ({ ...prev, primaryText: titleEditText }));
                      setEditingTitle(false);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-950/50 transition"
                  >
                    Guardar Título
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EMPTY STATE OVERLAY (When no video or media is loaded) */}
        {!mediaAsset && (
          <div
            onClick={onUploadClick}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-neutral-950/80 hover:bg-neutral-900/90 transition group z-20 backdrop-blur-sm"
          >
            <div className="w-20 h-20 rounded-3xl bg-neutral-900 border-2 border-dashed border-neutral-700 group-hover:border-rose-500 group-hover:scale-105 flex items-center justify-center mb-4 transition shadow-2xl">
              <Upload className="w-8 h-8 text-neutral-400 group-hover:text-rose-400 transition" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Arrastra tu video aquí</h3>
            <p className="text-xs text-neutral-400 mb-4 max-w-[240px]">
              Suelta cualquier video o foto desde tu computadora o haz clic aquí
            </p>
            <button
              type="button"
              className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 transition transform group-hover:scale-105"
            >
              Seleccionar Video
            </button>
          </div>
        )}

        {/* Drag guidance hint badge */}
        {mediaAsset && (
          <div className="absolute top-3 left-3 bg-neutral-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-neutral-700/60 text-[11px] text-neutral-300 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Move className="w-3 h-3 text-rose-400" />
            <span>Haz clic y arrastra para mover el texto o logo</span>
          </div>
        )}

        {/* Segmentation Active Badge */}
        {mediaAsset && textConfig.enabled && textConfig.mode === 'behind_subject' && (
          <div className="absolute top-3 right-3 bg-rose-500/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5 shadow-md">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Texto Detrás Activo</span>
          </div>
        )}
      </div>

      {/* Floating Player Controls Bar */}
      <div className="mt-4 flex items-center gap-3 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 px-5 py-2.5 rounded-2xl shadow-xl z-20">
        {/* Reset button */}
        <button
          onClick={() => handleSeekInternal(0)}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition"
          title="Volver al inicio"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Big Friendly Play / Pause Button */}
        <button
          onClick={onTogglePlay}
          className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-950/40 transition transform active:scale-95"
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl transition ${
            isMuted
              ? 'text-rose-400 bg-rose-500/10'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title={isMuted ? 'Desmutear' : 'Mutear'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Time counter */}
        <div className="text-xs font-mono font-semibold text-neutral-300 min-w-[90px] text-center">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Scrubber slider */}
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={0.05}
          value={currentTime}
          onChange={(e) => handleSeekInternal(parseFloat(e.target.value))}
          className="w-40 sm:w-64 h-1.5 bg-neutral-800 rounded-lg cursor-pointer appearance-none"
        />
      </div>
    </div>
  );
};
