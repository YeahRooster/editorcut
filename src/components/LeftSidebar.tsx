import React, { useState, useEffect } from 'react';
import type { 
  TextOverlayConfig, 
  WatermarkConfig, 
  AudioTrackConfig, 
  SubtitleItem,
  TextClipItem, 
  MediaAsset,
  VideoClip,
  AudioClip,
  TimelineSelection,
  TransitionConfig,
  VideoTransitionType,
  IntroEffectType,
  OutroEffectType
} from '../types';
import { 
  Film, 
  Type, 
  Mic, 
  Music, 
  Image as ImageIcon, 
  Sparkles, 
  Plus, 
  Trash2, 
  Grid, 
  Layers,
  Wand2,
  CheckCircle2,
  Volume2,
  VolumeX,
  Play,
  Zap,
  Bell,
  Flame,
  Repeat,
  RefreshCw,
  ChevronLeft
} from 'lucide-react';
import { musicPlayer, createSFXBuffer, audioBufferToWavBlob, type SFXPreset } from '../utils/audioSynth';
import { speechService } from '../utils/speechRecognition';
import { selfieSegmenter } from '../utils/segmentation';

interface LeftSidebarProps {
  className?: string;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
  mediaAsset: MediaAsset | null;
  setMediaAsset: (asset: MediaAsset) => void;
  textConfig: TextOverlayConfig;
  setTextConfig: React.Dispatch<React.SetStateAction<TextOverlayConfig>>;
  watermarkConfig: WatermarkConfig;
  setWatermarkConfig: React.Dispatch<React.SetStateAction<WatermarkConfig>>;
  audioConfig: AudioTrackConfig;
  setAudioConfig: React.Dispatch<React.SetStateAction<AudioTrackConfig>>;
  subtitles: SubtitleItem[];
  setSubtitles: React.Dispatch<React.SetStateAction<SubtitleItem[]>>;
  currentTime: number;
  onSeek: (time: number) => void;
  duration?: number;
  onAutoSubtitlesClick: () => void;
  onClearText: () => void;
  onClearSubtitles: () => void;
  videoVolume: number;
  setVideoVolume: (vol: number) => void;
  isVideoMuted: boolean;
  setIsVideoMuted: React.Dispatch<React.SetStateAction<boolean>>;
  videoClips: VideoClip[];
  setVideoClips: React.Dispatch<React.SetStateAction<VideoClip[]>>;
  onAddVideoClip: (file: File) => void;
  audioClips: AudioClip[];
  setAudioClips: React.Dispatch<React.SetStateAction<AudioClip[]>>;
  transitionConfig: TransitionConfig;
  setTransitionConfig: React.Dispatch<React.SetStateAction<TransitionConfig>>;
  selectedItem: TimelineSelection | null;
  onSelectItem: (item: TimelineSelection | null) => void;
  textClips?: TextClipItem[];
  setTextClips?: React.Dispatch<React.SetStateAction<TextClipItem[]>>;
  onAddTextClip?: (customText?: string) => void;
}

type TabKey = 'media' | 'text' | 'subtitles' | 'music' | 'watermark';

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  mediaAsset,
  setMediaAsset,
  textConfig,
  setTextConfig,
  watermarkConfig,
  setWatermarkConfig,
  audioConfig,
  setAudioConfig,
  subtitles,
  setSubtitles,
  currentTime,
  onSeek,
  onAutoSubtitlesClick,
  onClearText,
  onClearSubtitles,
  videoVolume,
  setVideoVolume,
  isVideoMuted,
  setIsVideoMuted,
  videoClips,
  setVideoClips,
  onAddVideoClip,
  audioClips,
  setAudioClips,
  transitionConfig,
  setTransitionConfig,
  selectedItem,
  onSelectItem,
  textClips = [],
  setTextClips,
  onAddTextClip,
  className,
  onToggleCollapse,
  isCollapsed: _isCollapsed,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('text');
  const [isMicListening, setIsMicListening] = useState(false);
  const [segmentationModel, setSegmentationModel] = useState<0 | 1>(selfieSegmenter.getModel());
  const [refineMode, setRefineModeState] = useState<'enhanced' | 'direct'>(selfieSegmenter.getRefineMode());
  // Resolve which title clip is being edited:
  // 1. Clip explicitly selected in timeline or list
  // 2. OR clip currently at playhead time
  // 3. OR first clip if clips exist
  const activeEditingClip =
    (selectedItem?.track === 'text' && textClips
      ? textClips.find((c) => c.id === selectedItem.id)
      : null) ||
    (textClips && textClips.length > 0
      ? textClips.find((c) => currentTime >= c.start && currentTime <= c.end)
      : null) ||
    (textClips && textClips.length > 0 ? textClips[0] : null);

  const currentEffectiveMode = activeEditingClip?.mode || textConfig.mode || 'behind_subject';

  const handleModeChange = (newMode: 'behind_subject' | 'editorial_poster' | 'dynamic_subtitles' | 'classic_subtitles') => {
    setTextConfig((prev) => ({
      ...prev,
      enabled: true,
      mode: newMode,
      segmentationActive: newMode === 'behind_subject',
    }));
    if (activeEditingClip && setTextClips) {
      setTextClips((prev) =>
        prev.map((c) => (c.id === activeEditingClip.id ? { ...c, mode: newMode } : c))
      );
    }
  };


  // File upload handler for media (automatically appends if a video already exists)
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    if (isVideo) {
      if (videoClips.length > 0 || mediaAsset?.type === 'video') {
        onAddVideoClip(file);
        e.target.value = '';
        return;
      }
      const v = document.createElement('video');
      v.src = url;
      v.onloadedmetadata = () => {
        const dur = v.duration || 15;
        const newAsset: MediaAsset = {
          id: 'media-' + Date.now(),
          name: file.name,
          type: 'video',
          url,
          duration: dur,
          aspectRatio: v.videoWidth / v.videoHeight || 9 / 16,
          file,
        };
        setMediaAsset(newAsset);
        setVideoClips([{
          id: newAsset.id,
          name: newAsset.name,
          url: newAsset.url,
          duration: newAsset.duration,
          start: 0,
          aspectRatio: newAsset.aspectRatio,
          file: newAsset.file,
        }]);
      };
    } else {
      setMediaAsset({
        id: 'media-' + Date.now(),
        name: file.name,
        type: 'image',
        url,
        duration: 15,
        aspectRatio: 9 / 16,
        file,
      });
    }
    e.target.value = '';
  };

  // Explicit replace video handler
  const handleReplaceVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    if (isVideo) {
      const v = document.createElement('video');
      v.src = url;
      v.onloadedmetadata = () => {
        const dur = v.duration || 15;
        const newAsset: MediaAsset = {
          id: 'media-' + Date.now(),
          name: file.name,
          type: 'video',
          url,
          duration: dur,
          aspectRatio: v.videoWidth / v.videoHeight || 9 / 16,
          file,
        };
        setMediaAsset(newAsset);
        setVideoClips([{
          id: newAsset.id,
          name: newAsset.name,
          url: newAsset.url,
          duration: newAsset.duration,
          start: 0,
          aspectRatio: newAsset.aspectRatio,
          file: newAsset.file,
        }]);
      };
    } else {
      setMediaAsset({
        id: 'media-' + Date.now(),
        name: file.name,
        type: 'image',
        url,
        duration: 15,
        aspectRatio: 9 / 16,
        file,
      });
    }
    e.target.value = '';
  };

  // Watermark upload handler
  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setWatermarkConfig((prev) => ({ ...prev, url }));
  };

  // Custom audio upload handler
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const audioObj = new Audio(url);
    audioObj.onloadedmetadata = () => {
      const dur = audioObj.duration || 5;
      const newClip: AudioClip = {
        id: 'audio-' + Date.now(),
        name: file.name,
        url,
        start: currentTime,
        duration: dur,
        volume: audioConfig.volume,
        isLoop: false, // Default to ONE-SHOT so it plays once and stops!
        sfxType: 'none',
        isMuted: false,
      };
      setAudioClips((prev) => [...prev, newClip]);
      onSelectItem({ track: 'audio', id: newClip.id });
      setAudioConfig((prev) => ({
        ...prev,
        url,
        name: file.name,
        presetTheme: 'none',
        isSyntheticLoop: false,
        sfxType: 'none',
        isMuted: false,
        isLoop: false,
        start: currentTime,
        duration: dur,
      }));
      musicPlayer.stopStandalone();
    };
  };

  // Instant SFX generator and selector (Placed at playhead, defaults to ONE-SHOT!)
  const handleSelectSFX = async (type: SFXPreset, label: string) => {
    try {
      const sfxBuf = await createSFXBuffer(type);
      const wavBlob = audioBufferToWavBlob(sfxBuf);
      const wavUrl = URL.createObjectURL(wavBlob);

      const newAudioClip: AudioClip = {
        id: 'sfx-' + Date.now(),
        name: label,
        url: wavUrl,
        start: currentTime, // Starts right at playhead needle!
        duration: sfxBuf.duration,
        volume: audioConfig.volume,
        isLoop: false, // Default to ONE-SHOT (1x) so it plays once and stops!
        sfxType: type,
        isMuted: false,
      };

      setAudioClips((prev) => [...prev, newAudioClip]);
      onSelectItem({ track: 'audio', id: newAudioClip.id });

      setAudioConfig((prev) => ({
        ...prev,
        url: wavUrl,
        name: label,
        presetTheme: 'none',
        isSyntheticLoop: false,
        sfxType: type,
        isMuted: false,
        isLoop: false,
        start: currentTime,
        duration: sfxBuf.duration,
      }));

      // Play instant preview
      musicPlayer.previewSFX(type, audioConfig.isMuted ? 0 : audioConfig.volume);
    } catch (err) {
      console.error('Error generating SFX:', err);
    }
  };

  // Preview currently loaded audio or SFX
  const handlePreviewCurrentAudio = () => {
    const effVol = audioConfig.isMuted ? 0 : audioConfig.volume;
    if (audioConfig.sfxType && audioConfig.sfxType !== 'none') {
      musicPlayer.previewSFX(audioConfig.sfxType as SFXPreset, effVol);
    } else if (audioConfig.presetTheme !== 'none') {
      musicPlayer.playTheme(audioConfig.presetTheme, effVol);
    } else if (audioConfig.url) {
      musicPlayer.playCustomAudio(audioConfig.url, effVol);
    }
  };

  // Synchronize audioConfig when user selects an audio clip on the timeline
  useEffect(() => {
    if (selectedItem?.track === 'audio') {
      const clip = audioClips.find((c) => c.id === selectedItem.id);
      if (clip) {
        setAudioConfig((prev) => {
          const isMutedVal = clip.isMuted ?? false;
          if (
            prev.name === clip.name &&
            prev.url === clip.url &&
            Math.abs(prev.volume - clip.volume) < 0.001 &&
            prev.isMuted === isMutedVal &&
            prev.isLoop === clip.isLoop
          ) {
            return prev;
          }
          return {
            ...prev,
            name: clip.name,
            url: clip.url,
            volume: clip.volume,
            isMuted: isMutedVal,
            isLoop: clip.isLoop,
          };
        });
      }
    }
  }, [selectedItem?.id, selectedItem?.track]);

  // Unified audio volume updater (updates audioConfig, musicPlayer master gain/elements, and audioClips)
  const handleUpdateAudioVolume = (val: number) => {
    setAudioConfig((prev) => ({ ...prev, volume: val, isMuted: false }));
    musicPlayer.setVolume(val);
    musicPlayer.setMuted(false);
    if (selectedItem?.track === 'audio') {
      setAudioClips((prev) =>
        prev.map((c) => (c.id === selectedItem.id ? { ...c, volume: val, isMuted: false } : c))
      );
    } else {
      setAudioClips((prev) =>
        prev.map((c) => ({ ...c, volume: val, isMuted: false }))
      );
    }
  };

  // Unified audio mute toggle
  const handleToggleAudioMute = () => {
    const nextMuted = !audioConfig.isMuted;
    setAudioConfig((prev) => ({ ...prev, isMuted: nextMuted }));
    musicPlayer.setMuted(nextMuted);
    if (selectedItem?.track === 'audio') {
      setAudioClips((prev) =>
        prev.map((c) => (c.id === selectedItem.id ? { ...c, isMuted: nextMuted } : c))
      );
    } else {
      setAudioClips((prev) =>
        prev.map((c) => ({ ...c, isMuted: nextMuted }))
      );
    }
  };

  // Preset sample loader (Directly reproducing the user's uploaded references!)
  const loadReferenceSample = (sampleType: 'just_do_it' | 'curug_sawer' | 'rule_of_thirds') => {
    if (sampleType === 'just_do_it') {
      setMediaAsset({
        id: 'sample-just-do-it',
        name: 'Just Do It - Senderismo (Referencia)',
        type: 'image',
        url: '/samples/sample_just_do_it.jpg',
        duration: 15,
        aspectRatio: 9 / 16,
      });
      setTextConfig((prev) => ({
        ...prev,
        enabled: true,
        mode: 'behind_subject',
        primaryText: 'JUST\nDO IT',
        secondaryText: 'Life is short. Stop putting limits on yourself!',
        fontFamily: 'Bebas Neue',
        textColor: '#ffffff',
        fontSize: 34,
        letterSpacing: 2,
        textPosition: { x: 50, y: 55 },
        showGridLines: false,
        showCrosshairs: false,
        badgeLocationText: 'TRUNYAN HILL',
        badgeDateText: 'Hiking Adventure',
        authorHandle: '@senderismo',
        frostedGlassCaption: '',
        showFrostedCard: false,
        segmentationActive: true,
        maskThreshold: 0.5,
      }));
    } else if (sampleType === 'curug_sawer') {
      setMediaAsset({
        id: 'sample-curug-sawer',
        name: 'Curug Sawer - Cascada (Referencia)',
        type: 'image',
        url: '/samples/sample_curug_sawer.jpg',
        duration: 15,
        aspectRatio: 9 / 16,
      });
      setTextConfig((prev) => ({
        ...prev,
        enabled: true,
        mode: 'behind_subject',
        primaryText: 'CURUG\nSAWER',
        secondaryText: 'THE BEAUTY OF NATURE',
        fontFamily: 'Bebas Neue',
        textColor: '#ffffff',
        fontSize: 38,
        letterSpacing: 3,
        textPosition: { x: 50, y: 38 },
        showGridLines: false,
        showCrosshairs: false,
        badgeLocationText: 'CURUG SAWER',
        badgeDateText: 'Shot on iPhone',
        authorHandle: 'Archived by Syarif',
        frostedGlassCaption: 'Curug Sawer Sukabumi erat kaitannya dengan mitos lokal dan keindahan alam pegunungan.',
        showFrostedCard: true,
        segmentationActive: true,
        maskThreshold: 0.5,
      }));
    } else if (sampleType === 'rule_of_thirds') {
      setMediaAsset({
        id: 'sample-rule-of-thirds',
        name: 'Rule of Thirds - Editorial (Referencia)',
        type: 'image',
        url: '/samples/sample_rule_of_thirds.png',
        duration: 15,
        aspectRatio: 9 / 16,
      });
      setTextConfig((prev) => ({
        ...prev,
        enabled: true,
        mode: 'editorial_poster',
        primaryText: 'RULE OF\nTHIRDS',
        secondaryText: 'THE RULE OF THIRDS IS ABOUT COMPOSITION\nGUIDING THE EYE WHERE EMOTION LIVES',
        fontFamily: 'Bebas Neue',
        textColor: '#ffffff',
        fontSize: 22,
        letterSpacing: 1,
        textPosition: { x: 10, y: 28 },
        showGridLines: true,
        showCrosshairs: true,
        badgeLocationText: 'URBAN FRAMING',
        badgeDateText: '04 - 08 - 2025',
        authorHandle: '@addaube',
        frostedGlassCaption: 'Enfocado en la armonía visual y la composición moderna.',
        showFrostedCard: false,
        segmentationActive: false,
        maskThreshold: 0.5,
      }));
    }
  };

  // Live microphone transcription
  const toggleLiveMic = () => {
    if (isMicListening) {
      speechService.stopLiveTranscription();
      setIsMicListening(false);
    } else {
      setIsMicListening(true);
      speechService.startLiveTranscription(
        (text, isFinal) => {
          if (isFinal) {
            setSubtitles((prev) => [
              ...prev,
              {
                id: 'sub-live-' + Date.now(),
                start: Math.max(0, currentTime - 2),
                end: currentTime + 1,
                text,
              },
            ]);
          }
        },
        (err) => {
          console.error(err);
          setIsMicListening(false);
        }
      );
    }
  };

  // Edit subtitle inline
  const updateSubtitleText = (id: string, newText: string) => {
    setSubtitles((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: newText } : s))
    );
  };

  const updateSubtitleTime = (id: string, start: number, end: number) => {
    setSubtitles((prev) =>
      prev.map((s) => (s.id === id ? { ...s, start, end } : s))
    );
  };

  const removeSubtitle = (id: string) => {
    setSubtitles((prev) => prev.filter((s) => s.id !== id));
  };

  const addManualSubtitle = () => {
    setSubtitles((prev) => [
      ...prev,
      {
        id: 'sub-' + Date.now(),
        start: currentTime,
        end: currentTime + 2.5,
        text: 'Escribe tu frase aquí...',
      },
    ]);
  };

  return (
    <aside className={`flex flex-col select-none bg-neutral-900/95 z-20 overflow-hidden ${className || 'w-full lg:w-80 xl:w-96 border-r border-neutral-800 h-full'}`}>
      {/* Tab Navigation */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-950/60 p-1 sm:p-1.5 gap-1 overflow-x-auto no-scrollbar flex-nowrap flex-shrink-0">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 min-w-[56px] sm:min-w-0 flex flex-col items-center py-1.5 sm:py-2 px-1 rounded-xl text-[10px] sm:text-xs font-medium transition ${
            activeTab === 'media'
              ? 'bg-neutral-800 text-rose-400 font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
          <span>Medios</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 min-w-[56px] sm:min-w-0 flex flex-col items-center py-1.5 sm:py-2 px-1 rounded-xl text-[10px] sm:text-xs font-medium transition ${
            activeTab === 'text'
              ? 'bg-neutral-800 text-rose-400 font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Type className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
          <span>Estilos</span>
        </button>

        <button
          onClick={() => setActiveTab('subtitles')}
          className={`flex-1 min-w-[56px] sm:min-w-0 flex flex-col items-center py-1.5 sm:py-2 px-1 rounded-xl text-[10px] sm:text-xs font-medium transition ${
            activeTab === 'subtitles'
              ? 'bg-neutral-800 text-rose-400 font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
          <span>Voz/Texto</span>
        </button>

        <button
          onClick={() => setActiveTab('music')}
          className={`flex-1 min-w-[56px] sm:min-w-0 flex flex-col items-center py-1.5 sm:py-2 px-1 rounded-xl text-[10px] sm:text-xs font-medium transition ${
            activeTab === 'music'
              ? 'bg-neutral-800 text-rose-400 font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
          <span>Sonido</span>
        </button>

        <button
          onClick={() => setActiveTab('watermark')}
          className={`flex-1 min-w-[56px] sm:min-w-0 flex flex-col items-center py-1.5 sm:py-2 px-1 rounded-xl text-[10px] sm:text-xs font-medium transition ${
            activeTab === 'watermark'
              ? 'bg-neutral-800 text-rose-400 font-bold shadow'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
          <span>Logo</span>
        </button>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex flex-col items-center justify-center p-1.5 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition flex-shrink-0"
            title="Ocultar barra lateral"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-5 text-sm custom-scrollbar">
        {/* ========================================================= */}
        {/* TAB 1: MEDIOS (VIDEOS Y FOTOS)                           */}
        {/* ========================================================= */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-200 mb-1">
                {videoClips.length > 0 || mediaAsset ? 'Videos del Proyecto' : 'Cargar tu archivo'}
              </h2>
              <p className="text-xs text-neutral-400 mb-3">
                {videoClips.length > 0 || mediaAsset
                  ? 'Suma varios videos seguidos a la historia o reemplaza el actual.'
                  : 'Arrastra cualquier video (.mp4, .mov) o foto de tu computadora.'}
              </p>

              {!(videoClips.length > 0 || mediaAsset) ? (
                <label className="border-2 border-dashed border-neutral-700 hover:border-rose-500/60 bg-neutral-950/40 hover:bg-neutral-950 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition group">
                  <Film className="w-7 h-7 text-neutral-500 group-hover:text-rose-400 mb-1.5 transition" />
                  <span className="text-xs font-semibold text-neutral-300 group-hover:text-white">
                    Toca aquí para elegir tu video
                  </span>
                  <span className="text-[11px] text-neutral-500 mt-0.5">MP4, MOV, JPG, PNG</span>
                  <input
                    type="file"
                    accept="video/*,image/*"
                    onChange={handleMediaUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-2.5">
                  {/* Botón destacado: Sumar otro video al lado */}
                  <label className="border-2 border-dashed border-sky-500/60 hover:border-sky-400 bg-sky-500/10 hover:bg-sky-500/20 rounded-2xl p-3.5 flex items-center justify-center gap-2 cursor-pointer transition group shadow-md shadow-sky-950/20">
                    <Plus className="w-4 h-4 text-sky-400 group-hover:scale-110 transition flex-shrink-0" />
                    <div className="text-left">
                      <span className="text-xs font-bold text-sky-200 group-hover:text-white block">
                        + Sumar otro video al lado (secuencia)
                      </span>
                      <span className="text-[10px] text-sky-400/80 block">
                        Se añade al final sin borrar el que ya tienes
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onAddVideoClip(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                  </label>

                  {/* Botón secundario: Reemplazar video actual */}
                  <label className="w-full py-2 px-3 border border-neutral-800 hover:border-neutral-700 bg-neutral-900/60 hover:bg-neutral-900 rounded-xl flex items-center justify-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer transition">
                    <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Reemplazar video actual por otro nuevo</span>
                    <input
                      type="file"
                      accept="video/*,image/*"
                      onChange={handleReplaceVideoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* SECCIÓN: LISTA DE VIDEOS (MULTICLIP) */}
            {(videoClips.length > 0 || mediaAsset) && (
              <div className="pt-2 border-t border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-sky-400" />
                    <span>Videos en la Historia ({videoClips.length || (mediaAsset ? 1 : 0)})</span>
                  </h3>
                  <span className="text-[10px] text-neutral-500">Consecutivos</span>
                </div>

              {/* Lista de clips cargados */}
              {(videoClips.length > 0 ? videoClips : (mediaAsset ? [mediaAsset] : [])).length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {(videoClips.length > 0 ? videoClips : (mediaAsset ? [mediaAsset] : [])).map((clip, index) => {
                    const isSelected = selectedItem?.track === 'video' && selectedItem?.id === clip.id;
                    return (
                      <div
                        key={clip.id}
                        onClick={() => onSelectItem({ track: 'video', id: clip.id })}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'border-sky-400 bg-sky-500/20 text-white ring-1 ring-sky-400'
                            : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-sky-400 flex-shrink-0">
                            {index + 1}
                          </span>
                          <Film className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-bold truncate">{clip.name}</div>
                            <div className="text-[10px] text-neutral-400">
                              Duración: {Math.round(clip.duration)}s
                            </div>
                          </div>
                        </div>

                        {videoClips.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVideoClips((prev) => prev.filter((c) => c.id !== clip.id));
                              if (selectedItem?.id === clip.id) onSelectItem(null);
                            }}
                            className="p-1 text-neutral-400 hover:text-rose-400 rounded transition"
                            title="Quitar este video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

            {/* SECCIÓN: TRANSICIONES Y EFECTOS DE VIDEO */}
            <div className="pt-2 border-t border-neutral-800 space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                  Transiciones y Efectos de Video
                </h3>
              </div>

              {/* 1. Intro Effect */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300">
                  🎬 Efecto de Inicio (Intro del video)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['none', 'fade_in', 'zoom_in'] as IntroEffectType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTransitionConfig((prev) => ({ ...prev, intro: type }))}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                        transitionConfig.intro === type
                          ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {type === 'none' ? 'Ninguno' : type === 'fade_in' ? 'Fade In' : 'Zoom In'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Outro Effect */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-neutral-300">
                  🎬 Efecto de Cierre (Finalización / Outro)
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['none', 'fade_out', 'zoom_out'] as OutroEffectType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTransitionConfig((prev) => ({ ...prev, outro: type }))}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                        transitionConfig.outro === type
                          ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {type === 'none' ? 'Ninguno' : type === 'fade_out' ? 'Fade Out' : 'Zoom Out'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Transition between consecutive clips */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-neutral-300">
                    🔀 Transición por defecto
                  </span>
                  <span className="text-[10px] text-neutral-500">General</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: 'none', label: 'Corte Directo' },
                    { key: 'crossfade', label: 'Disolución (Crossfade)' },
                    { key: 'fade_black', label: 'Fundido a Negro' },
                    { key: 'flash_white', label: 'Flash Blanco' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setTransitionConfig((prev) => ({
                          ...prev,
                          transitionBetweenClips: key as VideoTransitionType,
                        }))
                      }
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition text-center ${
                        transitionConfig.transitionBetweenClips === key
                          ? 'bg-rose-500/20 border-rose-500 text-white font-bold'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Per-cut custom transitions if there are multiple video clips */}
                {videoClips && videoClips.length > 1 && (
                  <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sky-400">
                        ✂️ Personalizar cada corte individual:
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {videoClips.length - 1} {videoClips.length - 1 === 1 ? 'corte' : 'cortes'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {videoClips.slice(0, -1).map((clip, i) => {
                        const nextClip = videoClips[i + 1];
                        const activeTrans =
                          clip.transitionToNext ??
                          transitionConfig.transitionBetweenClips ??
                          'none';

                        return (
                          <div
                            key={clip.id}
                            className="p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-neutral-200">
                                Corte #{i + 1}
                              </span>
                              <span className="text-[10px] text-sky-400/90 font-mono">
                                en {Math.round(nextClip.start)}s
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">
                              "{clip.name}" ➔ "{nextClip.name}"
                            </div>
                            <div className="grid grid-cols-4 gap-1 pt-1">
                              {[
                                { key: 'none', label: 'Directo' },
                                { key: 'crossfade', label: 'Crossfade' },
                                { key: 'fade_black', label: 'A Negro' },
                                { key: 'flash_white', label: 'Flash' },
                              ].map(({ key, label }) => {
                                const isSelected = activeTrans === key;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                      setVideoClips((prev) =>
                                        prev.map((c, idx) =>
                                          idx === i
                                            ? { ...c, transitionToNext: key as VideoTransitionType }
                                            : c
                                        )
                                      );
                                    }}
                                    className={`py-1 px-1 rounded-lg text-[10px] font-semibold border transition text-center ${
                                      isSelected
                                        ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-bold shadow-sm'
                                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                                    }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Presets de Muestra inspirados en las fotos del usuario */}
            <div className="pt-2 border-t border-neutral-800">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Prueba con tus fotos de muestra
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => loadReferenceSample('just_do_it')}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-800 text-left transition group"
                >
                  <img
                    src="/samples/sample_just_do_it.jpg"
                    alt="Just Do It"
                    className="w-12 h-14 object-cover rounded-lg border border-neutral-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-400">
                      1. "JUST DO IT" (Senderismo)
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Efecto de texto gigante detrás de la persona
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => loadReferenceSample('curug_sawer')}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-800 text-left transition group"
                >
                  <img
                    src="/samples/sample_curug_sawer.jpg"
                    alt="Curug Sawer"
                    className="w-12 h-14 object-cover rounded-lg border border-neutral-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-400">
                      2. "CURUG SAWER" (Cascada)
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Texto detrás + tarjeta translúcida inferior
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => loadReferenceSample('rule_of_thirds')}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-950/70 hover:bg-neutral-800 border border-neutral-800 text-left transition group"
                >
                  <img
                    src="/samples/sample_rule_of_thirds.png"
                    alt="Rule of Thirds"
                    className="w-12 h-14 object-cover rounded-lg border border-neutral-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-400">
                      3. "RULE OF THIRDS" (Editorial)
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Grilla estética, cruces y tipografía moderna
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {mediaAsset && (
              <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 flex items-center justify-between">
                <div className="truncate pr-2">
                  <div className="text-xs font-semibold text-neutral-200 truncate">
                    {mediaAsset.name}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {mediaAsset.type === 'video' ? 'Video' : 'Imagen estática'} • {Math.round(mediaAsset.duration)}s
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TEXTO & ESTILOS DE CREADOR                        */}
        {/* ========================================================= */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* Quick Header & Add Title on Timeline */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Títulos & Textos Animados</span>
              </div>
              {onAddTextClip ? (
                <button
                  type="button"
                  onClick={() => onAddTextClip && onAddTextClip()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
                  title="Agregar un nuevo título en la aguja de la línea de tiempo"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Título</span>
                </button>
              ) : (
                <button
                  onClick={onClearText}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                  title="Eliminar o quitar el texto de la pantalla"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar</span>
                </button>
              )}
            </div>

            {/* List of Titles on Timeline */}
            {textClips && textClips.length > 0 && (
              <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    Títulos en la Línea de Tiempo ({textClips.length})
                  </span>
                  <span className="text-[10px] text-neutral-500 font-normal">Clic para editar</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {textClips.map((clip, index) => {
                    const isSelected = selectedItem?.track === 'text' && selectedItem?.id === clip.id;
                    const animText =
                      clip.animation === 'slide_left' ? '⬅️ Lateral' :
                      clip.animation === 'slide_bottom' ? '⬆️ Abajo' :
                      clip.animation === 'zoom' ? '🔍 Zoom' :
                      clip.animation === 'none' ? '✂️ Directo' : '🎬 Fade';

                    return (
                      <div
                        key={clip.id}
                        onClick={() => {
                          onSeek(clip.start);
                          onSelectItem({ track: 'text', id: clip.id });
                        }}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-purple-500/25 border-purple-400 text-white font-bold ring-1 ring-purple-400'
                            : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] text-purple-400 font-mono font-bold">#{index + 1}</span>
                          <span className="truncate">{clip.text}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] font-mono text-neutral-400">
                          <span className="px-1 py-0.2 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 text-[9px]">
                            {animText}
                          </span>
                          <span>{clip.start.toFixed(1)}s</span>
                          {setTextClips && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTextClips((prev) => prev.filter((t) => t.id !== clip.id));
                                if (selectedItem?.id === clip.id) onSelectItem(null);
                              }}
                              className="w-4 h-4 rounded hover:bg-rose-500 hover:text-white text-neutral-500 flex items-center justify-center transition"
                              title="Eliminar este título"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-bold text-neutral-200 mb-2">Elige el estilo visual</h2>
              <div className="grid grid-cols-2 gap-2">
                {/* Mode 1: Behind Subject */}
                <button
                  type="button"
                  onClick={() => handleModeChange('behind_subject')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                    currentEffectiveMode === 'behind_subject'
                      ? 'border-rose-500 bg-rose-500/10 text-white shadow ring-1 ring-rose-500/50'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Layers className="w-5 h-5 text-rose-400 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-white">Detrás de la persona</div>
                    <div className="text-[10px] text-neutral-400">Como Curug & Just Do It</div>
                  </div>
                </button>

                {/* Mode 2: Editorial Poster */}
                <button
                  type="button"
                  onClick={() => handleModeChange('editorial_poster')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                    currentEffectiveMode === 'editorial_poster'
                      ? 'border-rose-500 bg-rose-500/10 text-white shadow ring-1 ring-rose-500/50'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Grid className="w-5 h-5 text-rose-400 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-white">Portada Editorial</div>
                    <div className="text-[10px] text-neutral-400">Grilla & estética moderna</div>
                  </div>
                </button>

                {/* Mode 3: Dynamic Subtitles */}
                <button
                  type="button"
                  onClick={() => handleModeChange('dynamic_subtitles')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                    currentEffectiveMode === 'dynamic_subtitles'
                      ? 'border-rose-500 bg-rose-500/10 text-white shadow ring-1 ring-rose-500/50'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-white">Subtítulo Karaoke</div>
                    <div className="text-[10px] text-neutral-400">Resaltado enérgico</div>
                  </div>
                </button>

                {/* Mode 4: Classic Subtitles */}
                <button
                  type="button"
                  onClick={() => handleModeChange('classic_subtitles')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                    currentEffectiveMode === 'classic_subtitles'
                      ? 'border-rose-500 bg-rose-500/10 text-white shadow ring-1 ring-rose-500/50'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Type className="w-5 h-5 text-blue-400 mb-2" />
                  <div>
                    <div className="text-xs font-bold text-white">Subtítulo Clásico</div>
                    <div className="text-[10px] text-neutral-400">Limpio y elegante</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Inputs: Main Text */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Frase Principal (Título)
                  </label>
                  {activeEditingClip ? (
                    <span className="text-[10px] text-purple-400 font-bold bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      Editando en línea de tiempo ({activeEditingClip.start.toFixed(1)}s - {activeEditingClip.end.toFixed(1)}s)
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-500">
                      Nuevo título
                    </span>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={activeEditingClip ? activeEditingClip.text : textConfig.primaryText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTextConfig((prev) => ({ ...prev, primaryText: val, enabled: true }));
                    if (activeEditingClip && setTextClips) {
                      setTextClips((prev) =>
                        prev.map((c) => (c.id === activeEditingClip.id ? { ...c, text: val } : c))
                      );
                      if (selectedItem?.id !== activeEditingClip.id) {
                        onSelectItem({ track: 'text', id: activeEditingClip.id });
                      }
                    } else if (!activeEditingClip && onAddTextClip) {
                      onAddTextClip(val);
                    }
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none uppercase font-bold"
                  placeholder="ESCRIBE TU FRASE IMPACTANTE..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Lema / Subtítulo Secundario
                </label>
                <input
                  type="text"
                  value={
                    activeEditingClip && activeEditingClip.secondaryText !== undefined
                      ? activeEditingClip.secondaryText
                      : textConfig.secondaryText
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setTextConfig((prev) => ({ ...prev, secondaryText: val }));
                    if (activeEditingClip && setTextClips) {
                      setTextClips((prev) =>
                        prev.map((c) => (c.id === activeEditingClip.id ? { ...c, secondaryText: val } : c))
                      );
                    }
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  placeholder="Ej: Life is short. Stop putting limits..."
                />
              </div>
            </div>

            {/* Presets de Ubicación del Título */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-200">
                  Ubicación del Título en pantalla
                </label>
                <span className="text-[10px] text-neutral-500 font-medium">1 clic</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const pos = { x: 12, y: 42 };
                    setTextConfig((prev) => ({
                      ...prev,
                      textPosition: pos,
                      textAlign: 'left',
                      fontFamily: 'Bebas Neue',
                    }));
                    if (activeEditingClip && setTextClips) {
                      setTextClips((prev) =>
                        prev.map((c) => (c.id === activeEditingClip.id ? { ...c, position: pos, fontFamily: 'Bebas Neue' } : c))
                      );
                    }
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-0.5 transition ${
                    textConfig.textAlign === 'left' && (activeEditingClip?.position?.x ?? textConfig.textPosition.x) < 30
                      ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                  title="Alinear en el costado izquierdo (Estilo revista editorial)"
                >
                  <span>⬅️ Costado Izq.</span>
                  <span className="text-[9px] text-neutral-500">Bebas Neue</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const pos = { x: 50, y: 30 };
                    setTextConfig((prev) => ({
                      ...prev,
                      textPosition: pos,
                      textAlign: 'center',
                    }));
                    if (activeEditingClip && setTextClips) {
                      setTextClips((prev) =>
                        prev.map((c) => (c.id === activeEditingClip.id ? { ...c, position: pos } : c))
                      );
                    }
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-0.5 transition ${
                    textConfig.textAlign === 'center' &&
                    (activeEditingClip?.position?.y ?? textConfig.textPosition.y) >= 20 &&
                    (activeEditingClip?.position?.y ?? textConfig.textPosition.y) <= 40
                      ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                  title="Parte Superior / Centro"
                >
                  <span>🎯 Arriba Centrado</span>
                  <span className="text-[9px] text-neutral-500">Despejado</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const pos = { x: 88, y: 42 };
                    setTextConfig((prev) => ({
                      ...prev,
                      textPosition: pos,
                      textAlign: 'right',
                      fontFamily: 'Bebas Neue',
                    }));
                    if (activeEditingClip && setTextClips) {
                      setTextClips((prev) =>
                        prev.map((c) => (c.id === activeEditingClip.id ? { ...c, position: pos, fontFamily: 'Bebas Neue' } : c))
                      );
                    }
                  }}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-0.5 transition ${
                    textConfig.textAlign === 'right' && (activeEditingClip?.position?.x ?? textConfig.textPosition.x) > 70
                      ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                  title="Alinear en el costado derecho"
                >
                  <span>➡️ Costado Der.</span>
                  <span className="text-[9px] text-neutral-500">Bebas Neue</span>
                </button>
              </div>

              {/* Botón para separar título de subtítulos si se superponen */}
              <button
                type="button"
                onClick={() =>
                  setTextConfig((prev) => ({
                    ...prev,
                    textPosition: { x: 50, y: 22 },
                    subtitlePosition: { x: 50, y: 82 },
                  }))
                }
                className="w-full py-1.5 px-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 rounded-xl text-[11px] font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition"
              >
                <span>↔️ Separar Título y Subtítulos (Despejar pantalla)</span>
              </button>
              <div className="text-[10px] text-neutral-500 text-center">
                💡 Podés arrastrar el título libremente en el video con el mouse.
              </div>
            </div>

            {/* Animación del Título (Fade, Slide, Zoom, None) */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-200">
                  Animación de Entrada y Salida
                </label>
                <span className="text-[10px] text-purple-400 font-semibold">Suave & Progresivo</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'fade', label: '🎬 Desvanecer', desc: 'Aparición suave' },
                  { id: 'slide_left', label: '⬅️ Lateral', desc: 'Desde un costado' },
                  { id: 'slide_bottom', label: '⬆️ Desde Abajo', desc: 'Sube a posición' },
                  { id: 'zoom', label: '🔍 Zoom Suave', desc: 'Escala progresiva' },
                  { id: 'none', label: '✂️ Corte Directo', desc: 'Sin animación' },
                ].map((anim) => {
                  const currentAnim = activeEditingClip?.animation || textConfig.animation || 'fade';
                  const isSelected = currentAnim === anim.id;

                  return (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => {
                        setTextConfig((prev) => ({ ...prev, animation: anim.id as any }));
                        if (activeEditingClip && setTextClips) {
                          setTextClips((prev) =>
                            prev.map((c) => (c.id === activeEditingClip.id ? { ...c, animation: anim.id as any } : c))
                          );
                        }
                      }}
                      className={`p-2 rounded-xl text-left border transition ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/15 text-white shadow ring-1 ring-purple-400'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{anim.label}</div>
                      <div className="text-[9px] text-neutral-400">{anim.desc}</div>
                    </button>
                  );
                })}
              </div>

              {/* Slider de duración de la animación */}
              <div className="pt-1">
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Velocidad de transición</span>
                  <span className="font-bold text-neutral-200">
                    {(textConfig.animationDuration ?? 0.5).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.5}
                  step={0.1}
                  value={textConfig.animationDuration ?? 0.5}
                  onChange={(e) => {
                    const dur = parseFloat(e.target.value);
                    setTextConfig((prev) => ({ ...prev, animationDuration: dur }));
                    if (activeEditingClip && setTextClips) {
                      setTextClips((prev) =>
                        prev.map((c) => (c.id === activeEditingClip.id ? { ...c, animationDuration: dur } : c))
                      );
                    }
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Tipografía & Tamaño */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Tipografía
                  </label>
                  <select
                    value={activeEditingClip?.fontFamily || textConfig.fontFamily}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTextConfig((prev) => ({ ...prev, fontFamily: val }));
                      if (activeEditingClip && setTextClips) {
                        setTextClips((prev) =>
                          prev.map((c) => (c.id === activeEditingClip.id ? { ...c, fontFamily: val } : c))
                        );
                      }
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Bebas Neue">Bebas Neue (Impacto)</option>
                    <option value="Anton">Anton (Ultra Negrita)</option>
                    <option value="Syne">Syne (Vanguardia)</option>
                    <option value="Montserrat">Montserrat (Limpio)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Color del Texto
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={activeEditingClip?.textColor || textConfig.textColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTextConfig((prev) => ({ ...prev, textColor: val }));
                        if (activeEditingClip && setTextClips) {
                          setTextClips((prev) =>
                            prev.map((c) => (c.id === activeEditingClip.id ? { ...c, textColor: val } : c))
                          );
                        }
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-neutral-400">
                      {activeEditingClip?.textColor || textConfig.textColor}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Tamaño del Título</span>
                  <span className="font-bold text-neutral-200">{activeEditingClip?.fontSize ?? textConfig.fontSize}%</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={65}
                  value={activeEditingClip?.fontSize ?? textConfig.fontSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setTextConfig((prev) => ({
                      ...prev,
                      fontSize: val,
                    }));
                    if (activeEditingClip && setTextClips) {
                      setTextClips((prev) =>
                        prev.map((c) => (c.id === activeEditingClip.id ? { ...c, fontSize: val } : c))
                      );
                    }
                  }}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = activeEditingClip?.fontSize ?? textConfig.fontSize ?? 28;
                      const next = Math.max(12, cur - 4);
                      setTextConfig((prev) => ({
                        ...prev,
                        fontSize: next,
                      }));
                      if (activeEditingClip && setTextClips) {
                        setTextClips((prev) =>
                          prev.map((c) => (c.id === activeEditingClip.id ? { ...c, fontSize: next } : c))
                        );
                      }
                    }}
                    className="py-1.5 px-2 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-200 font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <span>➖ Achicar Título</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = activeEditingClip?.fontSize ?? textConfig.fontSize ?? 28;
                      const next = Math.min(75, cur + 4);
                      setTextConfig((prev) => ({
                        ...prev,
                        fontSize: next,
                      }));
                      if (activeEditingClip && setTextClips) {
                        setTextClips((prev) =>
                          prev.map((c) => (c.id === activeEditingClip.id ? { ...c, fontSize: next } : c))
                        );
                      }
                    }}
                    className="py-1.5 px-2 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-200 font-semibold flex items-center justify-center gap-1 transition"
                  >
                    <span>➕ Agrandar Título</span>
                  </button>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1.5">
                  💡 También podés agrandar o achicar el título arrastrando el punto celeste de la esquina en la pantalla.
                </div>
              </div>
            </div>

            {/* Opciones Especiales según el modo */}
            {currentEffectiveMode === 'editorial_poster' && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <h3 className="text-xs font-bold text-neutral-300">Elementos Gráficos</h3>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={textConfig.showGridLines}
                    onChange={(e) =>
                      setTextConfig((prev) => ({
                        ...prev,
                        showGridLines: e.target.checked,
                      }))
                    }
                    className="rounded accent-rose-500"
                  />
                  <span>Mostrar líneas guía (Regla de Tercios)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={textConfig.showCrosshairs}
                    onChange={(e) =>
                      setTextConfig((prev) => ({
                        ...prev,
                        showCrosshairs: e.target.checked,
                      }))
                    }
                    className="rounded accent-rose-500"
                  />
                  <span>Mostrar cruces y círculos estéticos</span>
                </label>


              </div>
            )}

            {currentEffectiveMode === 'behind_subject' && (
              <div className="pt-2 border-t border-neutral-800 space-y-3">
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <Wand2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Recorte automático por IA (Modo Retrato 256px):</strong> La silueta se aísla localmente para que las letras queden por detrás sin taparle la cara ni el pelo.
                  </div>
                </div>

                {/* Calidad del Modelo de Detección */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Modo del Detector de Persona
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        selfieSegmenter.setModel(0);
                        setSegmentationModel(0);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        segmentationModel === 0
                          ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>📱 Retrato / Reels</span>
                      <div className="text-[9px] text-neutral-400 font-normal">Alta resolución (256px)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        selfieSegmenter.setModel(1);
                        setSegmentationModel(1);
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        segmentationModel === 1
                          ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>💻 Paisaje / Meet</span>
                      <div className="text-[9px] text-neutral-400 font-normal">Horizontal (144px)</div>
                    </button>
                  </div>
                </div>

                {/* Ajuste de Cobertura de la Silueta (Threshold) */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span className="font-semibold">Cobertura de la persona (Evitar letras en el pelo)</span>
                    <span className="font-bold text-rose-400">
                      {Math.round((1 - (textConfig.maskThreshold ?? 0.30)) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.15}
                    max={0.65}
                    step={0.02}
                    value={textConfig.maskThreshold ?? 0.30}
                    onChange={(e) =>
                      setTextConfig((prev) => ({
                        ...prev,
                        maskThreshold: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setTextConfig((prev) => ({
                          ...prev,
                          maskThreshold: 0.22,
                        }))
                      }
                      className={`py-1.5 px-1 text-[11px] rounded-xl font-semibold border transition ${
                        (textConfig.maskThreshold ?? 0.30) <= 0.25
                          ? 'border-rose-500 bg-rose-500/15 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                      title="Protege al máximo el pelo oscuro, frente y hombros"
                    >
                      👤 Más Cobertura
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTextConfig((prev) => ({
                          ...prev,
                          maskThreshold: 0.30,
                        }))
                      }
                      className={`py-1.5 px-1 text-[11px] rounded-xl font-semibold border transition ${
                        (textConfig.maskThreshold ?? 0.30) > 0.25 && (textConfig.maskThreshold ?? 0.30) < 0.40
                          ? 'border-rose-500 bg-rose-500/15 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      🎯 Equilibrado
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setTextConfig((prev) => ({
                          ...prev,
                          maskThreshold: 0.45,
                        }))
                      }
                      className={`py-1.5 px-1 text-[11px] rounded-xl font-semibold border transition ${
                        (textConfig.maskThreshold ?? 0.30) >= 0.40
                          ? 'border-rose-500 bg-rose-500/15 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      ✂️ Recorte Fino
                    </button>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1.5">
                    💡 <strong>Tip:</strong> Si las letras blancas se comen la gorra o la frente, seleccioná <strong>"Más Cobertura"</strong> para que la persona quede 100% al frente.
                  </div>
                </div>

                {/* Suavizado de Bordes (Anti-dentado / Prolijo) */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <div className="flex justify-between text-xs text-neutral-300 mb-1">
                    <span className="font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Suavizado de Bordes (Anti-Dentado)</span>
                    </span>
                    <span className="font-bold text-emerald-400">
                      {textConfig.maskFeather ?? 4}px (Prolijo)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={1}
                    value={textConfig.maskFeather ?? 4}
                    onChange={(e) =>
                      setTextConfig((prev) => ({
                        ...prev,
                        maskFeather: parseInt(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer accent-emerald-400"
                  />
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setTextConfig((prev) => ({ ...prev, maskFeather: 2 }))}
                      className={`py-1.5 px-1 text-[11px] rounded-xl font-semibold border transition ${
                        (textConfig.maskFeather ?? 4) === 2
                          ? 'border-emerald-500 bg-emerald-500/15 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Delicado (2px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextConfig((prev) => ({ ...prev, maskFeather: 4 }))}
                      className={`py-1.5 px-1 text-[11px] rounded-xl font-semibold border transition ${
                        (textConfig.maskFeather ?? 4) === 4
                          ? 'border-emerald-500 bg-emerald-500/15 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      ✨ Prolijo (4px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextConfig((prev) => ({ ...prev, maskFeather: 7 }))}
                      className={`py-1.5 px-1 text-[11px] rounded-xl font-semibold border transition ${
                        (textConfig.maskFeather ?? 4) >= 7
                          ? 'border-emerald-500 bg-emerald-500/15 text-white'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Extra Suave (7px)
                    </button>
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    ✅ Elimina el corte mordido, escalonado o pixelado alrededor de gorras, hombros y siluetas.
                  </div>
                </div>

                {/* Subtítulos de voz en Modo Detrás de la Persona */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                  <div className="text-xs font-bold text-neutral-200">
                    Subtítulos del Audio Detrás del Creador
                  </div>
                  <label className="flex items-center gap-2.5 p-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl cursor-pointer text-xs text-neutral-300 hover:bg-neutral-900 transition">
                    <input
                      type="checkbox"
                      checked={textConfig.useSubtitlesAsMainTitle ?? false}
                      onChange={(e) =>
                        setTextConfig((prev) => ({
                          ...prev,
                          useSubtitlesAsMainTitle: e.target.checked,
                          subtitleStyle: e.target.checked ? 'behind_subject' : prev.subtitleStyle,
                        }))
                      }
                      className="rounded accent-rose-500 w-4 h-4 flex-shrink-0"
                    />
                    <div>
                      <div className="font-semibold text-white">Reemplazar Título con Subtítulos de Voz</div>
                      <div className="text-[10px] text-neutral-400">
                        La voz hablada en el video aparece en letras gigantes detrás de la persona en tiempo real.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Tipo de Renderizado de la Máscara */}
                <div className="pt-2 border-t border-neutral-800/80">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Tipo de Silueta
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        selfieSegmenter.setRefineMode('enhanced');
                        setRefineModeState('enhanced');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        refineMode === 'enhanced'
                          ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>🛡️ Sólido Anti-Fugas</span>
                      <div className="text-[9px] text-neutral-400 font-normal">Cubre pelo y bordes</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        selfieSegmenter.setRefineMode('direct');
                        setRefineModeState('direct');
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                        refineMode === 'direct'
                          ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>⚡ Directo GPU</span>
                      <div className="text-[9px] text-neutral-400 font-normal">Suave natural</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: SUBTÍTULOS AUTOMÁTICOS & EDITOR INTERACTIVO       */}
        {/* ========================================================= */}
        {activeTab === 'subtitles' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-200 mb-1">
                Detección de voz inteligente
              </h2>
              <p className="text-xs text-neutral-400 mb-3">
                100% gratuito, local y sin gastar tokens de IA.
              </p>

              <div className="space-y-2">
                <button
                  onClick={onAutoSubtitlesClick}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Detectar Voz de mi Video (0 Tokens)</span>
                </button>

                <button
                  onClick={toggleLiveMic}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-2 ${
                    isMicListening
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <Mic className="w-4 h-4 text-rose-400" />
                  <span>
                    {isMicListening ? 'Detener Micrófono (Grabando...)' : 'Dictar en directo con Micrófono'}
                  </span>
                </button>
              </div>
            </div>

            {/* ESTILO Y APARIENCIA DE SUBTÍTULOS */}
            <div className="pt-2 border-t border-neutral-800 space-y-3 bg-neutral-950/70 p-3.5 rounded-2xl border border-neutral-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-rose-400" />
                  <span>Estilo y Fondo de Subtítulos</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">En vivo</span>
              </div>

              {/* 1. Fondo negro vs Solo letras */}
              {/* 1. Modo de renderizado: Solo color, Con reborde negro, Con fondo */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5">
                  Estilo de las letras y bordes
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Opción A: Solo Color (Sin reborde) */}
                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitleShowBackground: false,
                        subtitleHasOutline: false,
                      }))
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-0.5 transition ${
                      !textConfig.subtitleShowBackground && textConfig.subtitleHasOutline === false
                        ? 'border-rose-500 bg-rose-500/20 text-white shadow'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>🎨 Solo Color</span>
                    <span className="text-[9px] font-normal text-neutral-400">Sin reborde</span>
                  </button>

                  {/* Opción B: Con Reborde Negro */}
                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitleShowBackground: false,
                        subtitleHasOutline: true,
                      }))
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-0.5 transition ${
                      !textConfig.subtitleShowBackground && textConfig.subtitleHasOutline !== false
                        ? 'border-rose-500 bg-rose-500/20 text-white shadow'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>🔲 Con Reborde</span>
                    <span className="text-[9px] font-normal text-neutral-400">Contraste</span>
                  </button>

                  {/* Opción C: Con Fondo Oscuro */}
                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitleShowBackground: true,
                      }))
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-0.5 transition ${
                      textConfig.subtitleShowBackground
                        ? 'border-rose-500 bg-rose-500/20 text-white shadow'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>⬛ Con Fondo</span>
                    <span className="text-[9px] font-normal text-neutral-400">Cápsula</span>
                  </button>
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  {!textConfig.subtitleShowBackground && textConfig.subtitleHasOutline === false
                    ? '✓ Letras limpias con tu color seleccionado, sin ningún trazo alrededor'
                    : !textConfig.subtitleShowBackground
                    ? '✓ Letras con tu color seleccionado + reborde de alto contraste (ideal para Reels/TikTok)'
                    : '✓ Letras enmarcadas dentro de una cápsula oscura'}
                </div>
              </div>

              {/* 2. Estilo Visual del Subtítulo (Presencia & Apariencia) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-neutral-400">
                    Estilo y Presencia del Subtítulo
                  </label>
                  <span className="text-[10px] text-neutral-500">
                    {textConfig.subtitleStyle === 'behind_subject'
                      ? '👤 Detrás del creador'
                      : textConfig.subtitleStyle === 'giant_headline'
                      ? '👑 Tipo Título Gigante'
                      : '⬇️ Abajo clásico'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitleStyle: 'classic_bottom',
                        useSubtitlesAsMainTitle: false,
                        subtitleFontSize: 5.5,
                        subtitlePosition: { x: 50, y: 82 },
                      }))
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-0.5 transition ${
                      (!textConfig.subtitleStyle || textConfig.subtitleStyle === 'classic_bottom') && !textConfig.useSubtitlesAsMainTitle
                        ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>⬇️ Abajo Clásico</span>
                    <span className="text-[9px] text-neutral-500 font-normal">Prolijo y pequeño</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitleStyle: 'giant_headline',
                        subtitleFontSize: 26,
                        fontFamily: 'Bebas Neue',
                        subtitlePosition: { x: 50, y: 30 },
                      }))
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-0.5 transition ${
                      textConfig.subtitleStyle === 'giant_headline'
                        ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>🔥 Tipo Título</span>
                    <span className="text-[9px] text-neutral-500 font-normal">Gigante y punchy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        mode: 'behind_subject',
                        enabled: true,
                        segmentationActive: true,
                        subtitleStyle: 'behind_subject',
                        subtitleFontSize: 24,
                        fontFamily: 'Bebas Neue',
                        subtitlePosition: { x: 50, y: 30 },
                      }))
                    }
                    className={`py-2 px-1 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-0.5 transition ${
                      textConfig.subtitleStyle === 'behind_subject'
                        ? 'border-rose-500 bg-rose-500/15 text-white shadow'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span>👤 Detrás Sujeto</span>
                    <span className="text-[9px] text-neutral-500 font-normal">Efecto viral IA</span>
                  </button>
                </div>

                {/* Opción de Reemplazar Título con Subtítulo */}
                <label className="flex items-center gap-2 p-2 bg-neutral-950/70 border border-neutral-800 rounded-xl cursor-pointer text-[11px] text-neutral-300 hover:bg-neutral-900 transition mt-1">
                  <input
                    type="checkbox"
                    checked={textConfig.useSubtitlesAsMainTitle ?? false}
                    onChange={(e) =>
                      setTextConfig((prev) => ({
                        ...prev,
                        useSubtitlesAsMainTitle: e.target.checked,
                        subtitleFontSize: e.target.checked ? (prev.fontSize || 28) : prev.subtitleFontSize,
                      }))
                    }
                    className="rounded accent-rose-500 w-3.5 h-3.5"
                  />
                  <span>
                    👑 <strong>Reemplazar Título:</strong> La voz ocupa el lugar del título con su mismo tamaño
                  </span>
                </label>
              </div>

              {/* 3. Tamaño de las letras (Permite tamaño gigante como el título) */}
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>Tamaño de las letras</span>
                  <span className="font-bold text-neutral-200">{Math.round(textConfig.subtitleFontSize || 5.5)}%</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={45}
                  step={0.5}
                  value={textConfig.subtitleFontSize || 5.5}
                  onChange={(e) =>
                    setTextConfig((prev) => ({
                      ...prev,
                      subtitleFontSize: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer accent-rose-500"
                />
                <div className="grid grid-cols-4 gap-1 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setTextConfig((prev) => ({ ...prev, subtitleFontSize: 5 }))}
                    className="py-1 px-1 text-[10px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 font-semibold"
                  >
                    5% (Chico)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextConfig((prev) => ({ ...prev, subtitleFontSize: 12 }))}
                    className="py-1 px-1 text-[10px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 font-semibold"
                  >
                    12% (Medio)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextConfig((prev) => ({ ...prev, subtitleFontSize: 24 }))}
                    className="py-1 px-1 text-[10px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 font-semibold"
                  >
                    24% (Grande)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitleFontSize: prev.fontSize || 28,
                      }))
                    }
                    className="py-1 px-1 text-[10px] bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg text-rose-300 font-semibold"
                    title="Copiar exactamente el tamaño del Título principal"
                  >
                    📋 Igual al Título
                  </button>
                </div>
              </div>

              {/* 3. Color del subtítulo (Paleta completa + presets incluyendo negro) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-neutral-400">
                    Color del subtítulo
                  </label>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {textConfig.subtitleColor || '#ffffff'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  {/* Selector de color nativo que abre la paleta completa del sistema */}
                  <div className="relative group cursor-pointer">
                    <input
                      type="color"
                      value={textConfig.subtitleColor || '#ffffff'}
                      onChange={(e) =>
                        setTextConfig((prev) => ({ ...prev, subtitleColor: e.target.value }))
                      }
                      className="w-9 h-9 rounded-xl cursor-pointer bg-neutral-900 border border-neutral-700 p-0.5 shadow-sm"
                      title="Abrir paleta completa de colores"
                    />
                  </div>

                  <input
                    type="text"
                    value={textConfig.subtitleColor || '#ffffff'}
                    onChange={(e) =>
                      setTextConfig((prev) => ({ ...prev, subtitleColor: e.target.value }))
                    }
                    placeholder="#FFFFFF"
                    className="w-24 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:border-rose-500 focus:outline-none"
                  />

                  <span className="text-[10px] text-neutral-400 flex-1">
                    ← Paleta completa
                  </span>
                </div>

                {/* Chips de colores predeterminados (incluye NEGRO, BLANCO y colores vibrantes) */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-neutral-800/80">
                  {[
                    { name: 'Blanco', color: '#ffffff', border: 'border-neutral-400' },
                    { name: 'Negro', color: '#000000', border: 'border-neutral-600' },
                    { name: 'Amarillo Oro', color: '#facc15', border: 'border-amber-400' },
                    { name: 'Verde Neón', color: '#4ade80', border: 'border-emerald-400' },
                    { name: 'Cian', color: '#38bdf8', border: 'border-sky-400' },
                    { name: 'Rosa / Coral', color: '#f43f5e', border: 'border-rose-400' },
                    { name: 'Naranja', color: '#fb923c', border: 'border-orange-400' },
                  ].map((chip) => (
                    <button
                      key={chip.color}
                      type="button"
                      onClick={() => setTextConfig((prev) => ({ ...prev, subtitleColor: chip.color }))}
                      className={`w-7 h-7 rounded-xl border-2 transition transform active:scale-95 flex items-center justify-center ${
                        (textConfig.subtitleColor || '#ffffff').toLowerCase() === chip.color.toLowerCase()
                          ? 'border-rose-500 scale-110 shadow-lg ring-2 ring-rose-500/40'
                          : `${chip.border} hover:scale-105 opacity-90 hover:opacity-100`
                      }`}
                      style={{ backgroundColor: chip.color }}
                      title={`${chip.name} (${chip.color})`}
                    >
                      {(textConfig.subtitleColor || '#ffffff').toLowerCase() === chip.color.toLowerCase() && (
                        <span className={`text-[10px] font-bold ${chip.color === '#ffffff' ? 'text-black' : 'text-white'}`}>
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Ubicación rápida de los subtítulos */}
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1.5">
                  Ubicación del subtítulo
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitlePosition: { x: 50, y: 82 },
                      }))
                    }
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold border transition ${
                      (textConfig.subtitlePosition?.y ?? 82) > 70
                        ? 'border-rose-500 bg-rose-500/15 text-white'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    ⬇️ Abajo
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitlePosition: { x: 50, y: 55 },
                      }))
                    }
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold border transition ${
                      (textConfig.subtitlePosition?.y ?? 82) > 40 && (textConfig.subtitlePosition?.y ?? 82) <= 70
                        ? 'border-rose-500 bg-rose-500/15 text-white'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    🎯 Centro
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTextConfig((prev) => ({
                        ...prev,
                        subtitlePosition: { x: 50, y: 18 },
                      }))
                    }
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold border transition ${
                      (textConfig.subtitlePosition?.y ?? 82) <= 40
                        ? 'border-rose-500 bg-rose-500/15 text-white'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    ⬆️ Arriba
                  </button>
                </div>
              </div>

              {/* Botón de separación rápida: Título arriba, Subtítulo abajo */}
              <button
                type="button"
                onClick={() =>
                  setTextConfig((prev) => ({
                    ...prev,
                    textPosition: { x: 50, y: 22 },
                    subtitlePosition: { x: 50, y: 82 },
                  }))
                }
                className="w-full py-2 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-xl text-[11px] font-bold text-neutral-200 hover:text-white flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <span>↔️ Separar Título y Subtítulo (Despejar)</span>
              </button>
              <div className="text-[10px] text-neutral-500 text-center">
                💡 También podés arrastrar el subtítulo directamente en el video con el mouse.
              </div>
            </div>

            {/* CALIBRACIÓN DE SINCRONIZACIÓN DE AUDIO & INICIO DE PALABRA */}
            <div className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sincronización con la Voz</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {(textConfig.subtitleSyncOffset ?? 0.20) >= 0 ? '+' : ''}
                  {(textConfig.subtitleSyncOffset ?? 0.20).toFixed(2)}s
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Si el texto aparece un poco antes de que la persona hable (adelantado), suma tiempo para retrasarlo y coordinarlo exactamente con el inicio del habla.
              </p>

              <input
                type="range"
                min={-0.80}
                max={0.80}
                step={0.05}
                value={textConfig.subtitleSyncOffset ?? 0.20}
                onChange={(e) =>
                  setTextConfig((prev) => ({
                    ...prev,
                    subtitleSyncOffset: parseFloat(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer accent-emerald-400"
              />

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setTextConfig((prev) => ({
                      ...prev,
                      subtitleSyncOffset: parseFloat(((prev.subtitleSyncOffset ?? 0.20) + 0.20).toFixed(2)),
                    }))
                  }
                  className="py-1 px-1 text-[10px] rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold"
                  title="Retrasa el subtítulo si aparece antes de que la persona hable"
                >
                  ⏱️ +0.2s Retrasar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTextConfig((prev) => ({
                      ...prev,
                      subtitleSyncOffset: 0.0,
                    }))
                  }
                  className="py-1 px-1 text-[10px] rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-semibold"
                >
                  🔄 0.0s (Exacto)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setTextConfig((prev) => ({
                      ...prev,
                      subtitleSyncOffset: parseFloat(((prev.subtitleSyncOffset ?? 0.20) - 0.20).toFixed(2)),
                    }))
                  }
                  className="py-1 px-1 text-[10px] rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-semibold"
                  title="Adelanta el subtítulo si aparece tarde"
                >
                  ⏱️ -0.2s Adelantar
                </button>
              </div>
            </div>

            {/* Editor de líneas de subtítulos interactivo */}
            <div className="pt-2 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-300">
                  Líneas de Subtítulos ({subtitles.length})
                </h3>
                <div className="flex items-center gap-2">
                  {subtitles.length > 0 && (
                    <button
                      onClick={onClearSubtitles}
                      className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-rose-400 transition"
                      title="Eliminar todos los subtítulos generados"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar todos</span>
                    </button>
                  )}
                  <button
                    onClick={addManualSubtitle}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar frase</span>
                  </button>
                </div>
              </div>

              {subtitles.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-950/40 rounded-xl border border-neutral-800/80">
                  No hay subtítulos generados aún. Toca el botón de arriba o agrega uno manual.
                </div>
              ) : (
                <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                  {subtitles.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="p-2.5 bg-neutral-950 rounded-xl border border-neutral-800 hover:border-neutral-700 transition space-y-2"
                    >
                      {/* Top row: Timing, jump to time, and delete */}
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 gap-2">
                        <button
                          onClick={() => onSeek(sub.start)}
                          className="font-mono hover:text-rose-400 flex items-center gap-1 font-semibold"
                          title="Ir a este segundo en el reproductor"
                        >
                          <span>#{idx + 1}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={sub.start}
                            onChange={(e) => updateSubtitleTime(sub.id, parseFloat(e.target.value) || 0, sub.end)}
                            className="w-14 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[11px] text-neutral-300 font-mono"
                            title="Segundo de inicio"
                          />
                          <span className="text-neutral-600">-</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={sub.end}
                            onChange={(e) => updateSubtitleTime(sub.id, sub.start, parseFloat(e.target.value) || 0)}
                            className="w-14 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5 text-[11px] text-neutral-300 font-mono"
                            title="Segundo de fin"
                          />
                        </div>

                        <button
                          onClick={() => removeSubtitle(sub.id)}
                          className="text-neutral-500 hover:text-rose-400 transition"
                          title="Eliminar este subtítulo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Editable Text Field */}
                      <input
                        type="text"
                        value={sub.text}
                        onChange={(e) => updateSubtitleText(sub.id, e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SONIDO Y MEZCLADOR DE AUDIO                        */}
        {/* ========================================================= */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-rose-400" />
                  <span>Mezclador de Audio</span>
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Canales Separados
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Gradúa individualmente el volumen del video original y el sonido o música que agregues.
              </p>
            </div>

            {/* CANAL 1: AUDIO DEL VIDEO ORIGINAL */}
            <div className="p-3.5 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
                    <Film className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-200">Video Original</div>
                    <div className="text-[10px] text-neutral-400">Voz y sonido grabado</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {isVideoMuted ? '0%' : `${Math.round(videoVolume * 100)}%`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsVideoMuted((prev) => !prev)}
                    className={`p-1.5 rounded-lg border transition ${
                      isVideoMuted
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                    title={isVideoMuted ? 'Activar sonido del video' : 'Silenciar sonido del video'}
                  >
                    {isVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={1.5}
                step={0.02}
                value={isVideoMuted ? 0 : videoVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVideoVolume(val);
                  if (isVideoMuted && val > 0) setIsVideoMuted(false);
                }}
                className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer accent-sky-400"
              />

              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <button
                  type="button"
                  onClick={() => {
                    setIsVideoMuted(true);
                    setVideoVolume(0);
                  }}
                  className="hover:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                >
                  0% (Mudo)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsVideoMuted(false);
                    setVideoVolume(0.5);
                  }}
                  className="hover:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsVideoMuted(false);
                    setVideoVolume(1.0);
                  }}
                  className="hover:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-bold text-sky-400"
                >
                  100% (Normal)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsVideoMuted(false);
                    setVideoVolume(1.5);
                  }}
                  className="hover:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                >
                  150% (Boost)
                </button>
              </div>
            </div>

            {/* CANAL 2: EFECTO DE SONIDO / MÚSICA AGREGADA */}
            <div className="p-3.5 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300 flex-shrink-0">
                    <Music className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-neutral-200 truncate">
                      {audioConfig.name || 'Efecto / Música Agregada'}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {audioConfig.url || audioConfig.presetTheme !== 'none'
                        ? 'Pista activa agregada'
                        : 'Sin sonido agregado aún'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {audioConfig.isMuted ? '0%' : `${Math.round(audioConfig.volume * 100)}%`}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleAudioMute}
                    className={`p-1.5 rounded-lg border transition ${
                      audioConfig.isMuted
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white'
                    }`}
                    title={audioConfig.isMuted ? 'Activar sonido agregado' : 'Silenciar sonido agregado'}
                  >
                    {audioConfig.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <input
                type="range"
                min={0}
                max={1.5}
                step={0.02}
                value={audioConfig.isMuted ? 0 : audioConfig.volume}
                onChange={(e) => handleUpdateAudioVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer accent-emerald-400"
              />

              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <button
                  type="button"
                  onClick={() => handleUpdateAudioVolume(0.25)}
                  className="hover:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                >
                  25% (Suave)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAudioVolume(0.5)}
                  className="hover:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                >
                  50%
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAudioVolume(0.8)}
                  className="hover:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-bold text-emerald-400"
                >
                  80% (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateAudioVolume(1.0)}
                  className="hover:text-neutral-300 px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                >
                  100%
                </button>
              </div>

              {(audioConfig.url || audioConfig.presetTheme !== 'none') && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePreviewCurrentAudio}
                    className="flex-1 py-1.5 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 transition"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Probar Sonido Agregado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedItem?.track === 'audio') {
                        setAudioClips((prev) => {
                          const next = prev.filter((c) => c.id !== selectedItem.id);
                          if (next.length === 0) {
                            setAudioConfig((ac) => ({
                              ...ac,
                              presetTheme: 'none',
                              url: null,
                              name: '',
                              sfxType: 'none',
                            }));
                            musicPlayer.stop();
                            musicPlayer.stopAllClips();
                          }
                          return next;
                        });
                        onSelectItem(null);
                      } else {
                        setAudioClips([]);
                        setAudioConfig((prev) => ({
                          ...prev,
                          presetTheme: 'none',
                          url: null,
                          name: '',
                          sfxType: 'none',
                        }));
                        musicPlayer.stop();
                        musicPlayer.stopAllClips();
                      }
                    }}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 border border-transparent hover:border-neutral-800 rounded-xl transition"
                    title="Quitar sonido agregado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* MODO DE REPRODUCCIÓN: BUCLE VS UNA SOLA VEZ */}
            <div className="p-3 bg-neutral-950/90 rounded-2xl border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-amber-400" />
                  <span>Modo de Reproducción</span>
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {audioConfig.isLoop ? '🔁 Repite en bucle' : '⏯️ 1 sola vez'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem?.track === 'audio') {
                      setAudioClips((prev) =>
                        prev.map((c) => (c.id === selectedItem.id ? { ...c, isLoop: false } : c))
                      );
                    }
                    setAudioConfig((prev) => ({ ...prev, isLoop: false }));
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    !audioConfig.isLoop
                      ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Play className="w-3 h-3 text-emerald-400" />
                  <span>Una sola vez (1x)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedItem?.track === 'audio') {
                      setAudioClips((prev) =>
                        prev.map((c) => (c.id === selectedItem.id ? { ...c, isLoop: true } : c))
                      );
                    }
                    setAudioConfig((prev) => ({ ...prev, isLoop: true }));
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    audioConfig.isLoop
                      ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Repeat className="w-3 h-3 text-amber-400" />
                  <span>En bucle (Loop 🔁)</span>
                </button>
              </div>
              <p className="text-[10px] text-neutral-400">
                {!audioConfig.isLoop
                  ? '✅ El sonido se escuchará una sola vez en el momento indicado y luego finalizará.'
                  : '🔁 El sonido continuará repitiéndose indefinidamente.'}
              </p>
            </div>

            {/* LISTA DE SONIDOS AGREGADOS (MULTITRACK OVERLAY) */}
            {audioClips.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">
                    Sonidos en la Historia ({audioClips.length})
                  </span>
                  <span className="text-[10px] text-neutral-500">Superpuestos</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {audioClips.map((clip) => {
                    const isSelected = selectedItem?.track === 'audio' && selectedItem?.id === clip.id;
                    return (
                      <div
                        key={clip.id}
                        onClick={() => {
                          onSelectItem({ track: 'audio', id: clip.id });
                          setAudioConfig((prev) => ({
                            ...prev,
                            volume: clip.volume,
                            isLoop: clip.isLoop,
                            name: clip.name,
                            url: clip.url,
                          }));
                        }}
                        className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/20 text-white ring-1 ring-emerald-400'
                            : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:bg-neutral-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <Music className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <div className="truncate">
                            <div className="text-xs font-semibold truncate">{clip.name}</div>
                            <div className="text-[10px] text-neutral-400">
                              ⏱️ En seg {clip.start.toFixed(1)}s • {clip.isLoop ? '🔁 Bucle' : '1x Sola vez'} • {Math.round(clip.volume * 100)}% vol
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudioClips((prev) =>
                                prev.map((c) => (c.id === clip.id ? { ...c, start: 0 } : c))
                              );
                            }}
                            className="px-1.5 py-0.5 text-[10px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded font-semibold transition"
                            title="Mover este sonido a 00:00 (Inicio)"
                          >
                            ⏮️ 0s
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAudioClips((prev) => {
                                const next = prev.filter((c) => c.id !== clip.id);
                                if (next.length === 0) {
                                  setAudioConfig((ac) => ({
                                    ...ac,
                                    presetTheme: 'none',
                                    url: null,
                                    name: '',
                                    sfxType: 'none',
                                  }));
                                  musicPlayer.stop();
                                  musicPlayer.stopAllClips();
                                }
                                return next;
                              });
                              if (selectedItem?.id === clip.id) onSelectItem(null);
                            }}
                            className="p-1 text-neutral-400 hover:text-rose-400 rounded-lg transition"
                            title="Eliminar este sonido"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECCIÓN: EFECTOS DE SONIDO POPULARES */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Efectos de Sonido Rápidos (SFX)</span>
                </h3>
                <span className="text-[10px] text-neutral-500">Haz clic para aplicar</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectSFX('whoosh', '⚡ Efecto Whoosh (Transición)')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    audioConfig.sfxType === 'whoosh'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold">Whoosh</div>
                      <div className="text-[9px] text-neutral-400">Transición rápida</div>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSFX('ding', '🔔 Efecto Ding (Campana)')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    audioConfig.sfxType === 'ding'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-yellow-400" />
                    <div>
                      <div className="text-xs font-semibold">Ding</div>
                      <div className="text-[9px] text-neutral-400">Campana cristalina</div>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSFX('boom', '💥 Efecto Boom (Impacto)')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    audioConfig.sfxType === 'boom'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="text-xs font-semibold">Boom</div>
                      <div className="text-[9px] text-neutral-400">Impacto épico</div>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectSFX('pop', '🍿 Efecto Pop (Burbuja)')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    audioConfig.sfxType === 'pop'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-300 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold">Pop</div>
                      <div className="text-[9px] text-neutral-400">Texto nuevo / gota</div>
                    </div>
                  </div>
                  <Play className="w-3.5 h-3.5 text-neutral-500" />
                </button>
              </div>
            </div>

            {/* SECCIÓN: MÚSICA AMBIENTAL SINTÉTICA */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <h3 className="text-xs font-bold text-neutral-200">Música de fondo ambiental</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAudioConfig((prev) => ({
                      ...prev,
                      presetTheme: 'lofi',
                      url: null,
                      name: '☕ Lofi Chill Sunset',
                      sfxType: 'none',
                      isSyntheticLoop: true,
                    }));
                    musicPlayer.playTheme('lofi', audioConfig.isMuted ? 0 : audioConfig.volume);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    audioConfig.presetTheme === 'lofi'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white">☕ Lofi Chill</div>
                  <div className="text-[10px] text-neutral-400">Relajante y cálido</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAudioConfig((prev) => ({
                      ...prev,
                      presetTheme: 'cinematic',
                      url: null,
                      name: '🏔️ Cinematic Mountain',
                      sfxType: 'none',
                      isSyntheticLoop: true,
                    }));
                    musicPlayer.playTheme('cinematic', audioConfig.isMuted ? 0 : audioConfig.volume);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    audioConfig.presetTheme === 'cinematic'
                      ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white">🏔️ Cinematic</div>
                  <div className="text-[10px] text-neutral-400">Épico para naturaleza</div>
                </button>
              </div>
            </div>

            {/* SUBIR ARCHIVO PROPIO (MP3/WAV/AAC) */}
            <div className="pt-2 border-t border-neutral-800">
              <label className="border border-neutral-800 hover:border-emerald-500/50 bg-neutral-950/70 rounded-xl p-3 flex items-center justify-between cursor-pointer transition group">
                <div className="flex items-center gap-2.5 truncate">
                  <Music className="w-4 h-4 text-emerald-400 flex-shrink-0 group-hover:scale-110 transition" />
                  <span className="text-xs font-semibold text-neutral-300 group-hover:text-white truncate">
                    {audioConfig.url && audioConfig.sfxType === 'none' && audioConfig.name
                      ? audioConfig.name
                      : 'Subir audio o efecto propio (MP3 / WAV)'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* DUCKING TOGGLE */}
            <div className="pt-2 border-t border-neutral-800">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={audioConfig.ducking}
                  onChange={(e) =>
                    setAudioConfig((prev) => ({ ...prev, ducking: e.target.checked }))
                  }
                  className="rounded accent-emerald-500"
                />
                <span>Atenuar música/efecto cuando hable la voz (Ducking)</span>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: MARCA DE AGUA / LOGO                              */}
        {/* ========================================================= */}
        {activeTab === 'watermark' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-200 mb-1">Marca de agua / Logo</h2>
              <p className="text-xs text-neutral-400 mb-3">
                Arrastra tu logo en la pantalla de video para posicionarlo donde quieras.
              </p>

              <label className="border-2 border-dashed border-neutral-700 hover:border-rose-500/60 bg-neutral-950/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
                <ImageIcon className="w-8 h-8 text-neutral-500 group-hover:text-rose-400 mb-2 transition" />
                <span className="text-xs font-semibold text-neutral-300 group-hover:text-white">
                  Subir logo en PNG transparente
                </span>
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/webp"
                  onChange={handleWatermarkUpload}
                  className="hidden"
                />
              </label>
            </div>

            {watermarkConfig.url && (
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                {/* Free Transform Guidance Banner */}
                <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-white">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Transformación Libre Activa</span>
                  </div>
                  <div className="text-[11px] text-neutral-300">
                    • <strong>Mover:</strong> Hacé clic y arrastrá el logo en cualquier lugar del video.
                  </div>
                  <div className="text-[11px] text-neutral-300">
                    • <strong>Agrandar / Achicar:</strong> Arrastrá el punto rosa de la esquina inferior derecha.
                  </div>
                </div>

                {/* Tamaño Slider & Quick Buttons */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>Tamaño del logo</span>
                    <span className="font-bold text-neutral-200">{Math.round(watermarkConfig.scale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={2.5}
                    step={0.05}
                    value={watermarkConfig.scale}
                    onChange={(e) =>
                      setWatermarkConfig((prev) => ({
                        ...prev,
                        scale: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setWatermarkConfig((prev) => ({
                          ...prev,
                          scale: Math.max(0.2, parseFloat((prev.scale - 0.2).toFixed(2))),
                        }))
                      }
                      className="py-1.5 px-2 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-200 font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <span>➖ Achicar (-20%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWatermarkConfig((prev) => ({
                          ...prev,
                          scale: Math.min(3.0, parseFloat((prev.scale + 0.2).toFixed(2))),
                        }))
                      }
                      className="py-1.5 px-2 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-200 font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <span>➕ Agrandar (+20%)</span>
                    </button>
                  </div>
                </div>

                {/* Ubicación rápida */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                    Posición rápida del logo
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setWatermarkConfig((prev) => ({ ...prev, position: { x: 80, y: 88 } }))
                      }
                      className="py-1.5 px-1 rounded-xl text-[10px] font-semibold border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
                      title="Esquina inferior derecha"
                    >
                      ↘️ Inf. Der.
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWatermarkConfig((prev) => ({ ...prev, position: { x: 20, y: 88 } }))
                      }
                      className="py-1.5 px-1 rounded-xl text-[10px] font-semibold border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
                      title="Esquina inferior izquierda"
                    >
                      ↙️ Inf. Izq.
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWatermarkConfig((prev) => ({ ...prev, position: { x: 80, y: 12 } }))
                      }
                      className="py-1.5 px-1 rounded-xl text-[10px] font-semibold border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
                      title="Esquina superior derecha"
                    >
                      ↗️ Sup. Der.
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setWatermarkConfig((prev) => ({ ...prev, position: { x: 50, y: 50 } }))
                      }
                      className="py-1.5 px-1 rounded-xl text-[10px] font-semibold border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 transition"
                      title="Centro"
                    >
                      🎯 Centro
                    </button>
                  </div>
                </div>

                {/* Opacidad Slider */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1">
                    <span>Opacidad (Transparencia)</span>
                    <span className="font-bold text-neutral-200">{Math.round(watermarkConfig.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={watermarkConfig.opacity}
                    onChange={(e) =>
                      setWatermarkConfig((prev) => ({
                        ...prev,
                        opacity: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => setWatermarkConfig((prev) => ({ ...prev, url: null }))}
                  className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar logo</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
