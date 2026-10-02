import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { 
  AspectRatio, 
  TextOverlayConfig, 
  WatermarkConfig, 
  AudioTrackConfig, 
  SubtitleItem, 
  MediaAsset,
  VideoClip,
  AudioClip,
  TimelineSelection,
  TimelineTrackType,
  TransitionConfig
} from './types';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { PreviewCanvas } from './components/PreviewCanvas';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { musicPlayer } from './utils/audioSynth';
import { videoExporter } from './utils/videoExporter';
import { whisperService } from './utils/whisperLocal';
import { selfieSegmenter } from './utils/segmentation';
import { UploadCloud, Wand2 } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Aspect Ratio (9:16 for Reels/TikTok by default)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');

  // 2. Active Media Asset & Video Clips (Multi-clip support)
  const [mediaAsset, setMediaAsset] = useState<MediaAsset | null>(null);
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);

  // 3. Playback State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoVolume, setVideoVolume] = useState<number>(1.0);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);

  // 4. Text & Creator Style Configuration (Disabled and empty by default)
  const [textConfig, setTextConfig] = useState<TextOverlayConfig>({
    enabled: false,
    mode: 'dynamic_subtitles',
    primaryText: '',
    secondaryText: '',
    fontFamily: 'Bebas Neue',
    textColor: '#ffffff',
    fontSize: 28,
    letterSpacing: 2,
    textPosition: { x: 50, y: 30 },
    textAlign: 'center',
    subtitlePosition: { x: 50, y: 82 },
    subtitleFontSize: 5.5,
    subtitleShowBackground: false,
    subtitleColor: '#ffffff',
    subtitleHasOutline: true,
    subtitleStrokeColor: '#000000',
    showGridLines: false,
    showCrosshairs: false,
    badgeLocationText: '',
    badgeDateText: '',
    authorHandle: '',
    frostedGlassCaption: '',
    showFrostedCard: false,
    segmentationActive: false,
    maskThreshold: 0.26,
    maskFeather: 4,
    subtitleStyle: 'classic_bottom',
    useSubtitlesAsMainTitle: false,
    subtitleSyncOffset: 0.20,
  });

  // 5. Watermark / Logo Configuration
  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    url: null,
    position: { x: 80, y: 88 },
    scale: 1,
    opacity: 0.85,
  });

  // 6. Background Audio & Multitrack SFX Clips
  const [audioConfig, setAudioConfig] = useState<AudioTrackConfig>({
    url: null,
    name: '',
    volume: 0.80,
    ducking: true,
    isSyntheticLoop: false,
    isLoop: false,
    presetTheme: 'none',
    sfxType: 'none',
    isMuted: false,
  });
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);

  // 7. Subtitles / Automatic Text Transcription (Empty by default)
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);

  // 8. Video Transitions & Intro/Outro Effects
  const [transitionConfig, setTransitionConfig] = useState<TransitionConfig>({
    intro: 'none',
    introDuration: 0.8,
    outro: 'none',
    outroDuration: 0.8,
    transitionBetweenClips: 'none',
    transitionDuration: 0.6,
  });

  // 9. Timeline Selection & Clipboard for Copy & Paste
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<TimelineSelection | null>(null);
  const [clipboardItem, setClipboardItem] = useState<{
    track: TimelineTrackType;
    data: any;
  } | null>(null);

  // 10. Drag and drop file from OS state
  const [isDraggingFileOver, setIsDraggingFileOver] = useState<boolean>(false);
  const dragCounterRef = useRef<number>(0);

  // 11. Transcribing status notification
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string>('');

  // 12. Exporting State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportComplete, setExportComplete] = useState<boolean>(false);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);

  // 13. Selected Canvas Element for keyboard deletion (Delete/Supr)
  const [selectedElement, setSelectedElement] = useState<'none' | 'watermark' | 'title' | 'subtitle'>('none');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas & Video element refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Total Timeline Duration calculated across all clips
  const duration = videoClips.length > 0
    ? videoClips.reduce((max, c) => Math.max(max, c.start + c.duration), 0)
    : (mediaAsset?.duration || 15);

  // Process incoming file (either from OS Drag & Drop or File Input)
  const processIncomingFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(file.name);
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (isVideo) {
      const v = document.createElement('video');
      v.src = url;
      v.onloadedmetadata = () => {
        const dur = v.duration || 15;
        const newClip: VideoClip = {
          id: 'clip-' + Date.now(),
          name: file.name,
          url,
          duration: dur,
          start: 0,
          file,
          aspectRatio: v.videoWidth / v.videoHeight || 9 / 16,
        };
        setMediaAsset({
          id: newClip.id,
          name: file.name,
          type: 'video',
          url,
          duration: dur,
          aspectRatio: newClip.aspectRatio || 9 / 16,
          file,
        });
        setVideoClips([newClip]);
        setCurrentTime(0);
        setIsPlaying(false);
      };
    } else if (isAudio) {
      const a = document.createElement('audio');
      a.src = url;
      a.onloadedmetadata = () => {
        const dur = a.duration || 5;
        const newAudioClip: AudioClip = {
          id: 'audio-' + Date.now(),
          name: file.name,
          url,
          start: currentTime,
          duration: dur,
          volume: audioConfig.volume,
          isLoop: false,
          file,
        };
        setAudioClips((prev) => [...prev, newAudioClip]);
        setAudioConfig((prev) => ({
          ...prev,
          url,
          name: file.name,
          presetTheme: 'none',
          isSyntheticLoop: false,
          isLoop: false,
          sfxType: 'none',
          isMuted: false,
        }));
        setSelectedTimelineItem({ track: 'audio', id: newAudioClip.id });
        setToastMessage('🎵 Sonido agregado a la línea de tiempo');
        setTimeout(() => setToastMessage(null), 2500);
      };
    } else if (isImage) {
      if (!mediaAsset && videoClips.length === 0) {
        setMediaAsset({
          id: 'media-' + Date.now(),
          name: file.name,
          type: 'image',
          url,
          duration: 15,
          aspectRatio: 9 / 16,
          file,
        });
      } else {
        // Set as watermark overlay and select it
        setWatermarkConfig((prev) => ({ ...prev, url }));
        setSelectedElement('watermark');
        setSelectedTimelineItem({ track: 'watermark', id: 'watermark' });
      }
    }
  }, [mediaAsset, videoClips.length, currentTime, audioConfig.volume]);

  // Global OS file drag & drop handlers
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingFileOver(true);
      }
    };

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDraggingFileOver(false);
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingFileOver(false);

      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        processIncomingFile(e.dataTransfer.files[0]);
      }
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [processIncomingFile]);

  // Synchronize video element volume & mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isVideoMuted ? 0 : Math.min(1.0, videoVolume);
      videoRef.current.muted = isVideoMuted;
    }
  }, [videoVolume, isVideoMuted]);

  // Synchronize music player volume & mute
  useEffect(() => {
    musicPlayer.setMuted(audioConfig.isMuted ?? false);
    const eff = audioConfig.isMuted ? 0 : audioConfig.volume;
    musicPlayer.setVolume(eff);
  }, [audioConfig.volume, audioConfig.isMuted]);

  // Synchronize audio clips playback
  useEffect(() => {
    musicPlayer.syncClips(audioClips, currentTime, isPlaying);
  }, [audioClips, currentTime, isPlaying]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (mediaAsset?.type === 'video' && videoRef.current) {
        videoRef.current.currentTime = currentTime;
        videoRef.current.volume = isVideoMuted ? 0 : Math.min(1.0, videoVolume);
        videoRef.current.muted = isVideoMuted;
        videoRef.current.play().catch(console.error);
      }
      const effAddedVol = audioConfig.isMuted ? 0 : audioConfig.volume;
      if (audioConfig.presetTheme !== 'none') {
        musicPlayer.playTheme(audioConfig.presetTheme, effAddedVol);
      } else if (audioConfig.url) {
        musicPlayer.playCustomAudio(audioConfig.url, effAddedVol, currentTime, audioConfig.isLoop);
      }
      musicPlayer.syncClips(audioClips, currentTime, true);
    } else {
      setIsPlaying(false);
      if (mediaAsset?.type === 'video' && videoRef.current) {
        videoRef.current.pause();
      }
      musicPlayer.pause();
      musicPlayer.stopAllClips();
    }
  };

  // Playback timer ticker ONLY for static images (when there is no video to provide the master clock)
  useEffect(() => {
    let timer: number;
    const hasActiveVideo = videoClips.length > 0 || mediaAsset?.type === 'video';
    if (isPlaying && !hasActiveVideo) {
      timer = window.setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            musicPlayer.stop();
            musicPlayer.stopAllClips();
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, duration, mediaAsset, videoClips.length]);

  // Audio ducking when subtitles are active
  useEffect(() => {
    if (audioConfig.ducking) {
      const isSpeaking = subtitles.some(
        (sub) => currentTime >= sub.start && currentTime <= sub.end
      );
      musicPlayer.applyDucking(isSpeaking, audioConfig.volume);
    }
  }, [currentTime, subtitles, audioConfig.ducking, audioConfig.volume]);

  // Handle Seek
  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (mediaAsset?.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = time;
      selfieSegmenter.clearMask();
    }
    musicPlayer.seek(time);
    musicPlayer.seekClips(audioClips, time);
  };

  // Append another video clip next to the existing one ("Sumar otro video al lado")
  const handleAddVideoClip = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.src = url;
    v.onloadedmetadata = () => {
      const clipDur = v.duration || 10;
      setVideoClips((prev) => {
        const lastClip = prev[prev.length - 1];
        const start = lastClip ? lastClip.start + lastClip.duration : 0;
        const newClip: VideoClip = {
          id: 'clip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          url,
          duration: clipDur,
          start,
          file,
          aspectRatio: v.videoWidth / v.videoHeight || 9 / 16,
        };
        if (!mediaAsset) {
          setMediaAsset({
            id: newClip.id,
            name: file.name,
            type: 'video',
            url,
            duration: clipDur,
            file,
            aspectRatio: newClip.aspectRatio || 9 / 16,
          });
        }
        return [...prev, newClip];
      });
      setToastMessage('🎬 Video sumado a la línea de tiempo');
      setTimeout(() => setToastMessage(null), 2500);
    };
  }, [mediaAsset]);

  // Add an audio clip file directly
  const handleAddAudioClip = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('audio');
    a.src = url;
    a.onloadedmetadata = () => {
      const dur = a.duration || 5;
      const newAudioClip: AudioClip = {
        id: 'audio-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: file.name,
        url,
        start: currentTime,
        duration: dur,
        volume: audioConfig.volume,
        isLoop: false,
        file,
      };
      setAudioClips((prev) => [...prev, newAudioClip]);
      setSelectedTimelineItem({ track: 'audio', id: newAudioClip.id });
      setToastMessage('🎵 Sonido agregado a la línea de tiempo');
      setTimeout(() => setToastMessage(null), 2500);
    };
  }, [currentTime, audioConfig.volume]);

  // Split clip at playhead position
  const handleSplitClip = (splitTime: number) => {
    if (selectedTimelineItem?.track === 'audio') {
      const clip = audioClips.find((c) => c.id === selectedTimelineItem.id);
      if (clip && splitTime > clip.start + 0.1 && splitTime < clip.start + clip.duration - 0.1) {
        const firstDur = splitTime - clip.start;
        const secondDur = clip.duration - firstDur;
        const clip1: AudioClip = { ...clip, duration: firstDur };
        const clip2: AudioClip = {
          ...clip,
          id: 'audio-' + Date.now() + '-split',
          start: splitTime,
          duration: secondDur,
        };
        setAudioClips((prev) => prev.flatMap((c) => (c.id === clip.id ? [clip1, clip2] : [c])));
        setToastMessage(`✂️ Sonido cortado en ${splitTime.toFixed(1)}s`);
        setTimeout(() => setToastMessage(null), 2500);
        return;
      }
    }

    if (selectedTimelineItem?.track === 'subtitles') {
      const sub = subtitles.find((s) => s.id === selectedTimelineItem.id);
      if (sub && splitTime > sub.start + 0.2 && splitTime < sub.end - 0.2) {
        const words = sub.text.trim().split(' ');
        const mid = Math.ceil(words.length / 2);
        const sub1: SubtitleItem = { ...sub, end: splitTime, text: words.slice(0, mid).join(' ') };
        const sub2: SubtitleItem = {
          id: 'sub-' + Date.now() + '-split',
          start: splitTime,
          end: sub.end,
          text: words.slice(mid).join(' '),
        };
        setSubtitles((prev) => prev.flatMap((s) => (s.id === sub.id ? [sub1, sub2] : [s])));
        setToastMessage(`✂️ Subtítulo cortado en ${splitTime.toFixed(1)}s`);
        setTimeout(() => setToastMessage(null), 2500);
        return;
      }
    }

    // Default or video track: split the video clip covering splitTime
    const targetClip =
      (selectedTimelineItem?.track === 'video'
        ? videoClips.find((c) => c.id === selectedTimelineItem.id)
        : null) ||
      videoClips.find((c) => splitTime > c.start + 0.1 && splitTime < c.start + c.duration - 0.1);

    if (targetClip) {
      const firstDur = splitTime - targetClip.start;
      const secondDur = targetClip.duration - firstDur;
      const clip1: VideoClip = { ...targetClip, duration: firstDur };
      const clip2: VideoClip = {
        ...targetClip,
        id: 'clip-' + Date.now() + '-split',
        start: splitTime,
        duration: secondDur,
      };
      setVideoClips((prev) => prev.flatMap((c) => (c.id === targetClip.id ? [clip1, clip2] : [c])));
      setToastMessage(`✂️ Video cortado en ${splitTime.toFixed(1)}s`);
      setTimeout(() => setToastMessage(null), 2500);
    } else {
      setToastMessage('✂️ Posiciona la línea de tiempo dentro de un clip para cortar');
      setTimeout(() => setToastMessage(null), 2500);
    }
  };

  // Copy selected clip
  const handleCopySelected = () => {
    if (!selectedTimelineItem) {
      setToastMessage('⚠️ Selecciona un clip en la línea de tiempo para copiar');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    const { track, id } = selectedTimelineItem;
    if (track === 'video') {
      const clip = videoClips.find((c) => c.id === id);
      if (clip) {
        setClipboardItem({ track: 'video', data: { ...clip } });
        setToastMessage('📋 Clip de video copiado');
      }
    } else if (track === 'audio') {
      const clip = audioClips.find((c) => c.id === id);
      if (clip) {
        setClipboardItem({ track: 'audio', data: { ...clip } });
        setToastMessage('📋 Pista de sonido copiada');
      }
    } else if (track === 'subtitles') {
      const sub = subtitles.find((s) => s.id === id);
      if (sub) {
        setClipboardItem({ track: 'subtitles', data: { ...sub } });
        setToastMessage('📋 Subtítulo copiado');
      }
    } else if (track === 'watermark') {
      setClipboardItem({ track: 'watermark', data: { ...watermarkConfig } });
      setToastMessage('📋 Logo copiado');
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Paste clip at playhead position
  const handlePasteAtPlayhead = () => {
    if (!clipboardItem) {
      setToastMessage('⚠️ El portapapeles está vacío. Primero copia un elemento');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    const { track, data } = clipboardItem;
    if (track === 'video') {
      const newClip: VideoClip = {
        ...data,
        id: 'clip-' + Date.now() + '-copy',
        start: currentTime,
      };
      setVideoClips((prev) => {
        const next = [...prev, newClip];
        next.sort((a, b) => a.start - b.start);
        return next;
      });
      setSelectedTimelineItem({ track: 'video', id: newClip.id });
      setToastMessage(`📌 Video pegado en ${currentTime.toFixed(1)}s`);
    } else if (track === 'audio') {
      const newClip: AudioClip = {
        ...data,
        id: 'audio-' + Date.now() + '-copy',
        start: currentTime,
      };
      setAudioClips((prev) => [...prev, newClip]);
      setSelectedTimelineItem({ track: 'audio', id: newClip.id });
      setToastMessage(`📌 Sonido pegado en ${currentTime.toFixed(1)}s`);
    } else if (track === 'subtitles') {
      const dur = data.end - data.start;
      const newSub: SubtitleItem = {
        ...data,
        id: 'sub-' + Date.now() + '-copy',
        start: currentTime,
        end: currentTime + Math.max(1, dur),
      };
      setSubtitles((prev) => {
        const next = [...prev, newSub];
        next.sort((a, b) => a.start - b.start);
        return next;
      });
      setSelectedTimelineItem({ track: 'subtitles', id: newSub.id });
      setToastMessage(`📌 Subtítulo pegado en ${currentTime.toFixed(1)}s`);
    } else if (track === 'watermark') {
      setWatermarkConfig({ ...data });
      setSelectedTimelineItem({ track: 'watermark', id: 'watermark' });
      setToastMessage('📌 Logo pegado');
    }
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Specific handler to delete an individual audio clip by ID
  const handleDeleteAudioClip = (id: string) => {
    setAudioClips((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        setAudioConfig((ac) => ({ ...ac, url: null, name: '', presetTheme: 'none', sfxType: 'none' }));
        musicPlayer.stop();
        musicPlayer.stopAllClips();
      }
      return next;
    });
    if (selectedTimelineItem?.id === id) {
      setSelectedTimelineItem(null);
    }
    setToastMessage('🗑️ Sonido eliminado');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Synchronize audioConfig when audioClips becomes empty
  useEffect(() => {
    if (audioClips.length === 0 && audioConfig.url) {
      setAudioConfig((prev) => ({
        ...prev,
        url: null,
        name: '',
        presetTheme: 'none',
        sfxType: 'none',
      }));
      musicPlayer.stop();
      musicPlayer.stopAllClips();
    }
  }, [audioClips.length, audioConfig.url]);

  // Delete selected item from timeline or canvas
  const handleDeleteTimelineSelected = () => {
    if (selectedTimelineItem) {
      const { track, id } = selectedTimelineItem;
      if (track === 'video') {
        setVideoClips((prev) => {
          const filtered = prev.filter((c) => c.id !== id);
          if (filtered.length === 0) setMediaAsset(null);
          return filtered;
        });
        setToastMessage('🗑️ Clip de video eliminado');
      } else if (track === 'audio') {
        setAudioClips((prev) => {
          const filtered = prev.filter((c) => c.id !== id);
          if (filtered.length === 0) {
            setAudioConfig((ac) => ({ ...ac, url: null, name: '', presetTheme: 'none', sfxType: 'none' }));
            musicPlayer.stop();
            musicPlayer.stopAllClips();
          }
          return filtered;
        });
        if (id === 'default-audio') {
          setAudioConfig((ac) => ({ ...ac, url: null, name: '', presetTheme: 'none', sfxType: 'none' }));
          musicPlayer.stop();
          musicPlayer.stopAllClips();
        }
        setToastMessage('🗑️ Pista de sonido eliminada');
      } else if (track === 'subtitles' || track === 'text') {
        setSubtitles((prev) => prev.filter((s) => s.id !== id));
        setToastMessage('🗑️ Subtítulo eliminado');
      } else if (track === 'watermark') {
        setWatermarkConfig((prev) => ({ ...prev, url: null }));
        setToastMessage('🗑️ Logo eliminado');
      }
      setSelectedTimelineItem(null);
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    if (confirm('¿Deseas quitar todos los medios y empezar de cero?')) {
      setMediaAsset(null);
      setVideoClips([]);
      setAudioClips([]);
      setCurrentTime(0);
      setIsPlaying(false);
      setSubtitles([]);
      setTextConfig((prev) => ({ ...prev, enabled: false, primaryText: '', secondaryText: '' }));
    }
  };

  // Add new subtitle manually at current playhead position
  const handleAddSubtitle = () => {
    const newSub: SubtitleItem = {
      id: 'sub-' + Date.now(),
      start: Math.round(currentTime * 10) / 10,
      end: Math.round(Math.min(duration || 15, currentTime + 2.5) * 10) / 10,
      text: 'NUEVO SUBTÍTULO',
    };
    setSubtitles((prev) => [...prev, newSub].sort((a, b) => a.start - b.start));
    setSelectedTimelineItem({ track: 'text', id: newSub.id });
    setToastMessage('✍️ Subtítulo agregado en la aguja');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Clear text action
  const handleClearAllText = () => {
    setTextConfig((prev) => ({
      ...prev,
      enabled: false,
      primaryText: '',
      secondaryText: '',
      frostedGlassCaption: '',
      showFrostedCard: false,
    }));
  };

  // Clear subtitles action
  const handleClearAllSubtitles = () => {
    setSubtitles([]);
  };

  // Global Delete / Suprimir and Copy / Paste key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl+C / Cmd+C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelected();
        return;
      }

      // Ctrl+V / Cmd+V: Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteAtPlayhead();
        return;
      }

      // Delete / Backspace: Remove selected element
      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'Del') {
        if (selectedTimelineItem) {
          handleDeleteTimelineSelected();
          return;
        }

        if (
          selectedElement === 'watermark' ||
          (watermarkConfig.url && selectedElement !== 'title' && selectedElement !== 'subtitle')
        ) {
          setWatermarkConfig((prev) => ({ ...prev, url: null }));
          setSelectedElement('none');
          setToastMessage('🗑️ Logo / Imagen eliminada');
          setTimeout(() => setToastMessage(null), 2500);
        } else if (selectedElement === 'title') {
          setTextConfig((prev) => ({ ...prev, primaryText: '', enabled: false }));
          setSelectedElement('none');
          setToastMessage('🗑️ Título eliminado');
          setTimeout(() => setToastMessage(null), 2500);
        } else if (selectedElement === 'subtitle') {
          setSubtitles((prev) =>
            prev.filter((s) => !(currentTime >= s.start && currentTime <= s.end))
          );
          setSelectedElement('none');
          setToastMessage('🗑️ Subtítulo eliminado');
          setTimeout(() => setToastMessage(null), 2500);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedElement,
    selectedTimelineItem,
    watermarkConfig.url,
    currentTime,
    videoClips,
    audioClips,
    subtitles,
    clipboardItem,
  ]);

  // SPEECH TO TEXT: Runs local whisper directly on the loaded video
  const handleAutoSubtitles = async () => {
    if (!mediaAsset) {
      fileInputRef.current?.click();
      return;
    }

    setIsTranscribing(true);
    setTranscribeStatus('Iniciando extracción y análisis de voz...');

    try {
      let results: SubtitleItem[] = [];
      if (mediaAsset.file) {
        results = await whisperService.transcribeVideoFile(
          mediaAsset.file,
          (msg) => setTranscribeStatus(msg)
        );
      } else {
        // Fallback generator for url demo
        setTranscribeStatus('Sincronizando subtítulos de muestra...');
        await new Promise((r) => setTimeout(r, 800));
        results = [
          { id: 'sub-1', start: 0.5, end: 3.5, text: 'Hola, bienvenidos a este video' },
          { id: 'sub-2', start: 3.8, end: 7.2, text: 'Miren la calidad de esta edición' },
          { id: 'sub-3', start: 7.5, end: 11.0, text: 'Texto automático generado al instante' },
        ];
      }

      setSubtitles(results);
      // Automatically enable text rendering so typography appears right away!
      setTextConfig((prev) => ({
        ...prev,
        enabled: true,
        mode: 'dynamic_subtitles',
      }));
      setTranscribeStatus('¡Listo! Subtítulos sincronizados.');
      setTimeout(() => {
        setIsTranscribing(false);
        setTranscribeStatus('');
      }, 1200);
    } catch (err) {
      console.error(err);
      setIsTranscribing(false);
      setTranscribeStatus('');
      alert('No se pudo procesar el audio del video.');
    }
  };

  // Export pipeline with full Web Audio mixer (Video Audio + Added SFX/Music)
  const handleExport = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    // Stop all live playback before setting up export
    setIsPlaying(false);
    musicPlayer.stop();
    musicPlayer.stopAllClips();
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const exportAudioCtx = new AudioCtx();
    // Keep suspended while decoding all audio buffers so audio clock stays frozen at 0.000s
    if (exportAudioCtx.state === 'running') {
      await exportAudioCtx.suspend().catch(() => {});
    }
    const destinationNode = exportAudioCtx.createMediaStreamDestination();
    const exportDuration = Math.ceil(duration);
    let hasAudioTrack = false;

    try {
      const effVideoVol = isVideoMuted ? 0 : videoVolume;

      // 1. Multi-clip Video Audio Mixing
      const clipsToExport =
        videoClips.length > 0
          ? videoClips
          : mediaAsset?.type === 'video'
          ? [
              {
                id: mediaAsset.id,
                name: mediaAsset.name,
                url: mediaAsset.url,
                duration: mediaAsset.duration,
                start: 0,
                file: mediaAsset.file,
              } as VideoClip,
            ]
          : [];

      for (const clip of clipsToExport) {
        if (clip.file && effVideoVol > 0) {
          try {
            const arr = await clip.file.arrayBuffer();
            const videoAudioBuffer = await exportAudioCtx.decodeAudioData(arr.slice(0));
            if (videoAudioBuffer && videoAudioBuffer.numberOfChannels > 0) {
              const videoBufferSource = exportAudioCtx.createBufferSource();
              videoBufferSource.buffer = videoAudioBuffer;
              const videoGain = exportAudioCtx.createGain();
              videoGain.gain.setValueAtTime(effVideoVol, 0);
              videoBufferSource.connect(videoGain);
              videoGain.connect(destinationNode);
              videoBufferSource.start(clip.start);
              hasAudioTrack = true;
            }
          } catch (e) {
            console.warn('Direct decode of clip video file failed:', e);
          }
        }
      }

      // 2. Multitrack Audio Mixing (Overlapping sounds and loops)
      if (audioClips.length > 0) {
        for (const aClip of audioClips) {
          const clipEffVol = (aClip.isMuted || audioConfig.isMuted) ? 0 : (aClip.volume ?? 1.0);
          if (aClip.url && clipEffVol > 0) {
            try {
              const resp = await fetch(aClip.url);
              const sfxArr = await resp.arrayBuffer();
              const sfxBuffer = await exportAudioCtx.decodeAudioData(sfxArr);
              if (sfxBuffer && sfxBuffer.numberOfChannels > 0) {
                const sfxSource = exportAudioCtx.createBufferSource();
                sfxSource.buffer = sfxBuffer;
                sfxSource.loop = aClip.isLoop;

                const sfxGain = exportAudioCtx.createGain();
                sfxGain.gain.setValueAtTime(clipEffVol, 0);

                // Apply ducking if enabled and subtitles exist
                if (audioConfig.ducking && subtitles.length > 0) {
                  subtitles.forEach((sub) => {
                    if (sub.start < exportDuration) {
                      sfxGain.gain.setValueAtTime(clipEffVol, Math.max(0, sub.start));
                      sfxGain.gain.linearRampToValueAtTime(
                        clipEffVol * 0.25,
                        Math.max(0, sub.start + 0.1)
                      );
                      const duckEnd = Math.min(exportDuration, sub.end);
                      sfxGain.gain.setValueAtTime(clipEffVol * 0.25, duckEnd);
                      sfxGain.gain.linearRampToValueAtTime(
                        clipEffVol,
                        Math.min(exportDuration, duckEnd + 0.15)
                      );
                    }
                  });
                }

                sfxSource.connect(sfxGain);
                sfxGain.connect(destinationNode);
                sfxSource.start(aClip.start);
                if (!aClip.isLoop) {
                  sfxSource.stop(
                    aClip.start + (aClip.duration || sfxBuffer.duration)
                  );
                }
                hasAudioTrack = true;
              }
            } catch (aErr) {
              console.warn('Could not decode audio clip for export:', aErr);
            }
          }
        }
      } else {
        // Fallback for single audioConfig
        const effAddedVol = audioConfig.isMuted ? 0 : audioConfig.volume;
        if (audioConfig.url && effAddedVol > 0) {
          try {
            const resp = await fetch(audioConfig.url);
            const sfxArr = await resp.arrayBuffer();
            const sfxBuffer = await exportAudioCtx.decodeAudioData(sfxArr);

            if (sfxBuffer && sfxBuffer.numberOfChannels > 0) {
              const sfxSource = exportAudioCtx.createBufferSource();
              sfxSource.buffer = sfxBuffer;
              sfxSource.loop = audioConfig.isLoop || audioConfig.isSyntheticLoop;

              const sfxGain = exportAudioCtx.createGain();
              sfxGain.gain.setValueAtTime(effAddedVol, 0);

              if (audioConfig.ducking && subtitles.length > 0) {
                subtitles.forEach((sub) => {
                  if (sub.start < exportDuration) {
                    sfxGain.gain.setValueAtTime(effAddedVol, Math.max(0, sub.start));
                    sfxGain.gain.linearRampToValueAtTime(
                      effAddedVol * 0.25,
                      Math.max(0, sub.start + 0.1)
                    );
                    const duckEnd = Math.min(exportDuration, sub.end);
                    sfxGain.gain.setValueAtTime(effAddedVol * 0.25, duckEnd);
                    sfxGain.gain.linearRampToValueAtTime(
                      effAddedVol,
                      Math.min(exportDuration, duckEnd + 0.15)
                    );
                  }
                });
              }

              sfxSource.connect(sfxGain);
              sfxGain.connect(destinationNode);
              sfxSource.start(0);
              hasAudioTrack = true;
            }
          } catch (sfxErr) {
            console.warn('Could not decode added audio for export:', sfxErr);
          }
        } else if (audioConfig.presetTheme !== 'none' && effAddedVol > 0) {
          musicPlayer.renderThemeToContext(
            exportAudioCtx,
            destinationNode,
            audioConfig.presetTheme,
            effAddedVol,
            exportDuration
          );
          hasAudioTrack = true;
        }
      }

      // Synchronize video playback from 0 for canvas rendering
      handleSeek(0);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        await new Promise<void>((resolve) => {
          const v = videoRef.current;
          if (!v) return resolve();
          if (v.seeking) {
            v.onseeked = () => {
              v.onseeked = null;
              resolve();
            };
          } else {
            resolve();
          }
        });
      }

      const audioInput = hasAudioTrack ? destinationNode : null;

      const blob = await videoExporter.recordCanvas(
        canvasRef.current,
        exportDuration,
        audioInput,
        (percent) => setExportProgress(percent),
        async () => {
          // Simultaneous frame-0 unfreeze: un-freeze audio clock & start video playback
          await exportAudioCtx.resume().catch(() => {});
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
          setIsPlaying(true);
        }
      );

      setExportedBlob(blob);
      setExportComplete(true);
      setIsPlaying(false);
      if (mediaAsset?.type === 'video' && videoRef.current) {
        videoRef.current.pause();
        videoRef.current.muted = isVideoMuted;
        videoRef.current.volume = isVideoMuted ? 0 : Math.min(1.0, videoVolume);
      }
    } catch (err) {
      console.error('Error during video export:', err);
      alert('Hubo un error al exportar el video.');
      setIsExporting(false);
    } finally {
      setTimeout(() => {
        try {
          destinationNode.stream.getAudioTracks().forEach((t) => t.stop());
          exportAudioCtx.close().catch(() => {});
        } catch (e) {
          // ignore
        }
      }, 600);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processIncomingFile(file);
        }}
      />

      {/* Hidden audio input for multitrack sound addition */}
      <input
        ref={audioFileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAddAudioClip(file);
        }}
      />

      {/* FULL-WINDOW OS DRAG & DROP OVERLAY */}
      {isDraggingFileOver && (
        <div className="absolute inset-0 z-50 bg-neutral-950/90 backdrop-blur-md border-4 border-dashed border-rose-500 flex flex-col items-center justify-center p-8 pointer-events-none animate-fadeIn">
          <div className="w-24 h-24 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4 shadow-2xl shadow-rose-950">
            <UploadCloud className="w-12 h-12 text-rose-400 animate-bounce" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">¡Suelta tu archivo aquí!</h2>
          <p className="text-sm text-neutral-300">
            Acepta videos (.mp4, .mov), fotos (.jpg, .png) o música de fondo (.mp3)
          </p>
        </div>
      )}

      {/* Top Header */}
      <Header
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onImportClick={() => fileInputRef.current?.click()}
        onAutoSubtitlesClick={handleAutoSubtitles}
        onExportClick={handleExport}
        isExporting={isExporting && !exportComplete}
      />

      {/* Transcribing Toast Notification */}
      {isTranscribing && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 border border-rose-500/50 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-3">
          <Wand2 className="w-5 h-5 text-rose-400 animate-spin" />
          <div>
            <div className="text-xs font-bold text-white">Transcribiendo Voz a Texto (0 Tokens)</div>
            <div className="text-[11px] text-neutral-400">{transcribeStatus}</div>
          </div>
        </div>
      )}

      {/* Action / Deletion Toast Notification */}
      {toastMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 border border-rose-500/80 shadow-2xl px-5 py-3 rounded-2xl flex items-center gap-2.5 animate-fadeIn">
          <div className="text-xs font-bold text-white">{toastMessage}</div>
        </div>
      )}

      {/* Main Workspace (Sidebar + Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Drawer */}
        <LeftSidebar
          mediaAsset={mediaAsset}
          setMediaAsset={setMediaAsset}
          textConfig={textConfig}
          setTextConfig={setTextConfig}
          watermarkConfig={watermarkConfig}
          setWatermarkConfig={setWatermarkConfig}
          audioConfig={audioConfig}
          setAudioConfig={setAudioConfig}
          subtitles={subtitles}
          setSubtitles={setSubtitles}
          currentTime={currentTime}
          onSeek={handleSeek}
          duration={duration}
          onAutoSubtitlesClick={handleAutoSubtitles}
          onClearText={handleClearAllText}
          onClearSubtitles={handleClearAllSubtitles}
          videoVolume={videoVolume}
          setVideoVolume={setVideoVolume}
          isVideoMuted={isVideoMuted}
          setIsVideoMuted={setIsVideoMuted}
          videoClips={videoClips}
          setVideoClips={setVideoClips}
          onAddVideoClip={handleAddVideoClip}
          audioClips={audioClips}
          setAudioClips={setAudioClips}
          transitionConfig={transitionConfig}
          setTransitionConfig={setTransitionConfig}
          selectedItem={selectedTimelineItem}
          onSelectItem={setSelectedTimelineItem}
        />

        {/* Center Live Stage Canvas */}
        <PreviewCanvas
          aspectRatio={aspectRatio}
          mediaAsset={mediaAsset}
          videoClips={videoClips}
          transitionConfig={transitionConfig}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onTimeUpdate={(t) => setCurrentTime(t)}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          textConfig={textConfig}
          setTextConfig={setTextConfig}
          watermarkConfig={watermarkConfig}
          setWatermarkConfig={setWatermarkConfig}
          subtitles={subtitles}
          setSubtitles={setSubtitles}
          canvasRef={canvasRef}
          videoRef={videoRef}
          isMuted={isVideoMuted}
          onToggleMute={() => setIsVideoMuted((prev) => !prev)}
          onUploadClick={() => fileInputRef.current?.click()}
          isExporting={isExporting}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
        />
      </div>

      {/* Bottom Timeline with Drag & Drop tracks and Scissors */}
      <Timeline
        mediaAsset={mediaAsset}
        videoClips={videoClips}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        subtitles={subtitles}
        setSubtitles={setSubtitles}
        onAddSubtitleClick={handleAddSubtitle}
        audioClips={audioClips}
        setAudioClips={setAudioClips}
        onDeleteAudioClip={handleDeleteAudioClip}
        audioConfig={audioConfig}
        watermarkConfig={watermarkConfig}
        selectedItem={selectedTimelineItem}
        onSelectItem={setSelectedTimelineItem}
        onSplitClip={handleSplitClip}
        onDeleteSelected={handleDeleteTimelineSelected}
        onCopySelected={handleCopySelected}
        onPasteAtPlayhead={handlePasteAtPlayhead}
        onAddVideoClick={() => fileInputRef.current?.click()}
        onAddSoundClick={() => audioFileInputRef.current?.click()}
        videoVolume={videoVolume}
        isVideoMuted={isVideoMuted}
      />

      {/* Export Progress & Download Modal */}
      <ExportModal
        isOpen={isExporting}
        onClose={() => {
          setIsExporting(false);
          setExportComplete(false);
        }}
        progress={exportProgress}
        isComplete={exportComplete}
        exportedBlob={exportedBlob}
        onDownload={() => {
          if (exportedBlob) {
            videoExporter.downloadBlob(exportedBlob);
          }
        }}
      />
    </div>
  );
};

export default App;
