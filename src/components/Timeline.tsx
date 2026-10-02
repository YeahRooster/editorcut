import React, { useRef, useState, useEffect } from 'react';
import type { 
  MediaAsset, 
  SubtitleItem, 
  AudioTrackConfig, 
  AudioClip, 
  VideoClip,
  WatermarkConfig,
  TimelineSelection,
  VideoTransitionType
} from '../types';
import { 
  Scissors, 
  Trash2, 
  Copy, 
  Clipboard, 
  Plus, 
  Film, 
  Music, 
  Type, 
  Image as ImageIcon, 
  ChevronsLeft, 
  ChevronsRight,
  Repeat,
  Volume2,
  VolumeX
} from 'lucide-react';

interface TimelineProps {
  mediaAsset: MediaAsset | null;
  videoClips: VideoClip[];
  setVideoClips?: React.Dispatch<React.SetStateAction<VideoClip[]>>;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  subtitles: SubtitleItem[];
  audioClips: AudioClip[];
  audioConfig: AudioTrackConfig;
  watermarkConfig: WatermarkConfig;
  selectedItem: TimelineSelection | null;
  onSelectItem: (item: TimelineSelection | null) => void;
  onSplitClip: (splitTime: number) => void;
  onDeleteSelected: () => void;
  onCopySelected: () => void;
  onPasteAtPlayhead: () => void;
  onAddVideoClick: () => void;
  onAddSoundClick: () => void;
  videoVolume?: number;
  isVideoMuted?: boolean;
  setAudioClips?: React.Dispatch<React.SetStateAction<AudioClip[]>>;
  onDeleteAudioClip?: (id: string) => void;
  setSubtitles?: React.Dispatch<React.SetStateAction<SubtitleItem[]>>;
  onAddSubtitleClick?: () => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  mediaAsset,
  videoClips,
  setVideoClips,
  currentTime,
  duration,
  onSeek,
  subtitles,
  audioClips,
  audioConfig: _audioConfig,
  watermarkConfig,
  selectedItem,
  onSelectItem,
  onSplitClip,
  onDeleteSelected,
  onCopySelected,
  onPasteAtPlayhead,
  onAddVideoClick,
  onAddSoundClick,
  videoVolume: _videoVolume = 1.0,
  isVideoMuted: _isVideoMuted = false,
  setAudioClips,
  onDeleteAudioClip,
  setSubtitles,
  onAddSubtitleClick,
}) => {
  const trackContainerRef = useRef<HTMLDivElement>(null);
  const [draggingAudioId, setDraggingAudioId] = useState<string | null>(null);
  const dragStartMouseX = useRef<number>(0);
  const dragStartClipStart = useRef<number>(0);

  // Subtitle interactive stretching (resizing) & dragging state
  const [resizingSubId, setResizingSubId] = useState<{ id: string; edge: 'left' | 'right' } | null>(null);
  const [draggingSubId, setDraggingSubId] = useState<string | null>(null);
  const dragStartSubMouseX = useRef<number>(0);
  const dragStartSubTime = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const handleAudioMouseDown = (e: React.MouseEvent, clip: AudioClip) => {
    if (e.button !== 0 || (e.target as HTMLElement).tagName === 'BUTTON') return;
    e.stopPropagation();
    onSelectItem({ track: 'audio', id: clip.id });
    setDraggingAudioId(clip.id);
    dragStartMouseX.current = e.clientX;
    dragStartClipStart.current = clip.start;
  };

  useEffect(() => {
    if (!draggingAudioId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackContainerRef.current) return;
      const rect = trackContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartMouseX.current;
      const totalDur = duration || 15;
      const deltaSec = (deltaX / rect.width) * totalDur;
      const newStart = Math.max(
        0,
        Math.min(Math.max(0, totalDur - 0.2), dragStartClipStart.current + deltaSec)
      );

      if (setAudioClips) {
        setAudioClips((prev) =>
          prev.map((c) =>
            c.id === draggingAudioId ? { ...c, start: Math.round(newStart * 10) / 10 } : c
          )
        );
      }
    };

    const handleMouseUp = () => {
      setDraggingAudioId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingAudioId, duration, setAudioClips]);

  const handleSubtitleMouseDown = (e: React.MouseEvent, sub: SubtitleItem) => {
    if (e.button !== 0 || (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).dataset.handle) return;
    e.stopPropagation();
    onSelectItem({ track: 'text', id: sub.id });
    setDraggingSubId(sub.id);
    dragStartSubMouseX.current = e.clientX;
    dragStartSubTime.current = { start: sub.start, end: sub.end };
  };

  const handleSubtitleResizeMouseDown = (e: React.MouseEvent, sub: SubtitleItem, edge: 'left' | 'right') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelectItem({ track: 'text', id: sub.id });
    setResizingSubId({ id: sub.id, edge });
    dragStartSubMouseX.current = e.clientX;
    dragStartSubTime.current = { start: sub.start, end: sub.end };
  };

  const handleSubtitleDoubleClick = (e: React.MouseEvent, sub: SubtitleItem) => {
    e.stopPropagation();
    const updated = window.prompt('Editar texto del subtítulo:', sub.text);
    if (updated !== null && updated.trim() && setSubtitles) {
      setSubtitles((prev) =>
        prev.map((s) => (s.id === sub.id ? { ...s, text: updated.trim() } : s))
      );
    }
  };

  // Subtitle interactive stretching (resizing) & dragging listener
  useEffect(() => {
    if (!resizingSubId && !draggingSubId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!trackContainerRef.current) return;
      const rect = trackContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragStartSubMouseX.current;
      const totalDur = duration || 15;
      const deltaSec = (deltaX / rect.width) * totalDur;

      if (resizingSubId && setSubtitles) {
        setSubtitles((prev) =>
          prev.map((s) => {
            if (s.id !== resizingSubId.id) return s;
            if (resizingSubId.edge === 'right') {
              const newEnd = Math.max(
                dragStartSubTime.current.start + 0.3,
                Math.min(totalDur, dragStartSubTime.current.end + deltaSec)
              );
              return { ...s, end: Math.round(newEnd * 10) / 10 };
            } else {
              const newStart = Math.max(
                0,
                Math.min(dragStartSubTime.current.end - 0.3, dragStartSubTime.current.start + deltaSec)
              );
              return { ...s, start: Math.round(newStart * 10) / 10 };
            }
          })
        );
      } else if (draggingSubId && setSubtitles) {
        const subDur = dragStartSubTime.current.end - dragStartSubTime.current.start;
        const newStart = Math.max(
          0,
          Math.min(Math.max(0, totalDur - subDur), dragStartSubTime.current.start + deltaSec)
        );
        const newEnd = newStart + subDur;
        setSubtitles((prev) =>
          prev.map((s) =>
            s.id === draggingSubId
              ? { ...s, start: Math.round(newStart * 10) / 10, end: Math.round(newEnd * 10) / 10 }
              : s
          )
        );
      }
    };

    const handleMouseUp = () => {
      setResizingSubId(null);
      setDraggingSubId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingSubId, draggingSubId, duration, setSubtitles]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on an empty track area, seek to that position
    if (!trackContainerRef.current) return;
    const target = e.target as HTMLElement;
    // If user clicked directly on a block, the block's onClick will handle selection
    if (target.closest('[data-timeline-block]')) {
      return;
    }
    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newRatio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(newRatio * (duration || 15));
    // Clear selection if clicking on blank canvas
    onSelectItem(null);
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Video clips rendering calculations
  // If videoClips has entries use them, otherwise wrap mediaAsset
  const effectiveVideoClips: VideoClip[] = videoClips.length > 0 
    ? videoClips 
    : (mediaAsset ? [{ ...mediaAsset, start: mediaAsset.start ?? 0 }] : []);

  let accumulatedVideoTime = 0;

  return (
    <div className="h-52 border-t border-neutral-800 bg-neutral-950 flex flex-col select-none z-20 shadow-2xl">
      {/* Top Controls Bar */}
      <div className="h-10 border-b border-neutral-800/80 px-4 flex items-center justify-between text-xs bg-neutral-900/80 backdrop-blur">
        {/* Left: Editing Tools (Split, Copy, Paste, Delete, Add) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Split / Cut */}
          <button
            onClick={() => onSplitClip(currentTime)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 font-semibold transition active:scale-95 shadow-sm"
            title="Cortar el elemento seleccionado en la aguja de reproducción (S)"
          >
            <Scissors className="w-3.5 h-3.5 text-rose-400" />
            <span>Cortar aquí ✂️</span>
          </button>

          {/* Copy */}
          <button
            onClick={onCopySelected}
            disabled={!selectedItem}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 font-semibold transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            title="Copiar elemento seleccionado (Ctrl+C)"
          >
            <Copy className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Copiar</span>
          </button>

          {/* Paste */}
          <button
            onClick={onPasteAtPlayhead}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 font-semibold transition active:scale-95 shadow-sm"
            title="Pegar en la posición actual de la aguja (Ctrl+V)"
          >
            <Clipboard className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Pegar</span>
          </button>

          {/* Delete */}
          <button
            onClick={onDeleteSelected}
            disabled={!selectedItem}
            className="flex items-center gap-1 px-2 py-1 bg-neutral-800 hover:bg-rose-950/50 text-neutral-400 hover:text-rose-400 rounded-lg border border-neutral-700 hover:border-rose-900 transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            title="Eliminar elemento seleccionado (Supr)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Borrar</span>
          </button>

          <div className="h-4 w-px bg-neutral-700/60 mx-1 hidden sm:block" />

          {/* Add Video Button */}
          <button
            onClick={onAddVideoClick}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 font-semibold transition active:scale-95"
            title="Sumar otro video al lado sin reemplazar el actual"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Video</span>
          </button>

          {/* Add Sound Button */}
          <button
            onClick={onAddSoundClick}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white rounded-lg border border-emerald-500/30 font-semibold transition active:scale-95"
            title="Agregar un efecto de sonido o música en la aguja"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Sonido</span>
          </button>

          {/* Add Subtitle Button */}
          {onAddSubtitleClick && (
            <button
              onClick={onAddSubtitleClick}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-white rounded-lg border border-amber-500/30 font-semibold transition active:scale-95"
              title="Agregar un nuevo subtítulo en la aguja de reproducción"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Subtítulo</span>
            </button>
          )}
        </div>

        {/* Center: Current time readout */}
        <div className="flex items-center gap-2 font-mono font-bold text-neutral-300">
          <button
            onClick={() => onSeek(0)}
            className="p-1 hover:text-white text-neutral-400"
            title="Ir al inicio"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <span className="text-rose-400">{formatMinSec(currentTime)}</span>
          <span className="text-neutral-600">/</span>
          <span>{formatMinSec(duration || 15)}</span>
          <button
            onClick={() => onSeek(duration || 15)}
            className="p-1 hover:text-white text-neutral-400"
            title="Ir al final"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Selected item indicator badge and quick actions */}
        <div className="flex items-center gap-2 text-neutral-400 text-xs">
          {selectedItem?.track === 'audio' && (
            <button
              type="button"
              onClick={() => {
                if (setAudioClips) {
                  setAudioClips((prev) =>
                    prev.map((c) => (c.id === selectedItem.id ? { ...c, start: 0 } : c))
                  );
                }
              }}
              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
              title="Mover este sonido al segundo 00:00 (inicio)"
            >
              <span>⏮️ Mover sonido al inicio (0s)</span>
            </button>
          )}

          {selectedItem ? (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold animate-pulse">
              🎯 Seleccionado: {selectedItem.track.toUpperCase()}
            </span>
          ) : (
            <span className="text-[10px] text-neutral-500 hidden lg:inline">
              Haz clic en cualquier pista para seleccionarla o cortarla
            </span>
          )}
        </div>
      </div>

      {/* Tracks Area */}
      <div
        ref={trackContainerRef}
        onClick={handleTimelineClick}
        className="flex-1 relative p-1.5 px-6 flex flex-col justify-around cursor-pointer overflow-hidden bg-neutral-950/90"
      >
        {/* Playhead vertical needle */}
        <div
          className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center"
          style={{ left: `${playheadPercent}%` }}
        >
          <div className="w-3.5 h-3.5 bg-rose-500 rotate-45 -mt-1 shadow-lg shadow-rose-950 border border-white/40" />
          <div className="w-0.5 flex-1 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]" />
        </div>

        {/* TRACK 1: Video Track (Supports Multiple Consecutive Clips!) */}
        <div className="h-8 bg-neutral-900/60 rounded-lg border border-neutral-800/80 relative flex items-center overflow-hidden">
          <Film className="w-3.5 h-3.5 text-sky-400 absolute left-2 pointer-events-none z-20" />
          
          {effectiveVideoClips.length === 0 ? (
            <span className="text-[11px] text-neutral-500 ml-8 truncate">
              Pista de Video (Arrastra un archivo o haz clic en "+ Video")
            </span>
          ) : (
            effectiveVideoClips.map((clip, index) => {
              const clipDur = clip.duration || 15;
              const startPct = duration > 0 ? (accumulatedVideoTime / duration) * 100 : 0;
              const widthPct = duration > 0 ? (clipDur / duration) * 100 : 100;
              accumulatedVideoTime += clipDur;

              const isSelected = selectedItem?.track === 'video' && selectedItem?.id === clip.id;

              return (
                <div
                  key={clip.id || `video-${index}`}
                  data-timeline-block="true"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem({ track: 'video', id: clip.id });
                  }}
                  className={`absolute top-0.5 bottom-0.5 rounded flex items-center px-2 z-10 transition border cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500/30 border-sky-400 ring-2 ring-sky-400 shadow-lg shadow-sky-950/80'
                      : 'bg-neutral-800/90 border-neutral-700/80 hover:border-sky-500/50 hover:bg-neutral-800'
                  }`}
                  style={{ left: `${startPct}%`, width: `${Math.max(4, widthPct)}%` }}
                >
                  <div className="flex items-center gap-1.5 truncate text-[11px] font-semibold text-neutral-200">
                    <span className="truncate">
                      {clip.name} ({Math.round(clipDur)}s)
                    </span>
                    {index < effectiveVideoClips.length - 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!setVideoClips) return;
                          const currentTrans = clip.transitionToNext ?? 'none';
                          const nextMap: Record<VideoTransitionType, VideoTransitionType> = {
                            none: 'crossfade',
                            crossfade: 'fade_black',
                            fade_black: 'flash_white',
                            flash_white: 'none',
                          };
                          const newTrans = nextMap[currentTrans];
                          setVideoClips((prev) =>
                            prev.map((c, idx) =>
                              idx === index ? { ...c, transitionToNext: newTrans } : c
                            )
                          );
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold border transition flex items-center gap-1 z-20 active:scale-95 ${
                          (clip.transitionToNext || 'none') !== 'none'
                            ? 'bg-sky-500/40 border-sky-400 text-sky-100 shadow-sm'
                            : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:text-white'
                        }`}
                        title="Haz clic para cambiar la transición de este corte (Corte, Crossfade, A Negro, Flash)"
                      >
                        {clip.transitionToNext === 'crossfade'
                          ? '🔀 Crossfade'
                          : clip.transitionToNext === 'fade_black'
                          ? '⬛ A Negro'
                          : clip.transitionToNext === 'flash_white'
                          ? '⚡ Flash'
                          : '✂️ Corte'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* TRACK 2: Text / Subtitle blocks (Draggable, Stretchable & Editable) */}
        <div className="h-7 bg-neutral-900/40 rounded-lg border border-neutral-800/60 relative flex items-center overflow-hidden px-2">
          <Type className="w-3.5 h-3.5 text-amber-400 absolute left-2 pointer-events-none z-20" />
          
          {subtitles.length === 0 ? (
            <div className="flex items-center ml-8 text-[11px] text-neutral-500 gap-2">
              <span>Pista de Subtítulos (sin subtítulos)</span>
              {onAddSubtitleClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSubtitleClick();
                  }}
                  className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-semibold border border-neutral-700 hover:border-amber-500/50 transition flex items-center gap-1 text-[10px]"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Agregar Subtítulo</span>
                </button>
              )}
            </div>
          ) : (
            subtitles.map((sub) => {
              const startPct = ((sub.start) / (duration || 15)) * 100;
              const widthPct = Math.max(2.5, ((sub.end - sub.start) / (duration || 15)) * 100);
              const isSelected = selectedItem?.track === 'text' && selectedItem?.id === sub.id;

              return (
                <div
                  key={sub.id}
                  data-timeline-block="true"
                  onMouseDown={(e) => handleSubtitleMouseDown(e, sub)}
                  onDoubleClick={(e) => handleSubtitleDoubleClick(e, sub)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem({ track: 'text', id: sub.id });
                  }}
                  className={`absolute top-0.5 bottom-0.5 rounded px-1.5 flex items-center justify-between text-[10px] font-bold cursor-grab active:cursor-grabbing transition border select-none group ${
                    isSelected
                      ? 'bg-amber-500/40 border-amber-300 text-white ring-2 ring-amber-400 shadow-md shadow-amber-950/60 z-20'
                      : 'bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30 z-10'
                  }`}
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  title="Arrastra para mover • Estira los extremos para cambiar la duración • Doble clic para editar texto"
                >
                  {/* Left trim / resize handle */}
                  <div
                    data-handle="true"
                    onMouseDown={(e) => handleSubtitleResizeMouseDown(e, sub, 'left')}
                    className="absolute left-0 top-0 bottom-0 w-2 hover:w-3 bg-amber-400/30 hover:bg-amber-400/90 cursor-ew-resize rounded-l flex items-center justify-center transition"
                    title="↔️ Acortar o estirar inicio"
                  />

                  <span className="truncate px-2 pointer-events-none select-none">
                    {sub.text} ({((sub.end - sub.start)).toFixed(1)}s)
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0 z-10">
                    {/* Delete button right on block */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setSubtitles) {
                          setSubtitles((prev) => prev.filter((s) => s.id !== sub.id));
                        }
                        if (selectedItem?.id === sub.id) onSelectItem(null);
                      }}
                      className="w-4 h-4 rounded-full bg-neutral-900/90 hover:bg-rose-500 text-neutral-400 hover:text-white flex items-center justify-center transition text-[9px] font-bold"
                      title="Eliminar este subtítulo (Supr)"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Right stretch handle (ESTIRAR DURACIÓN) */}
                  <div
                    data-handle="true"
                    onMouseDown={(e) => handleSubtitleResizeMouseDown(e, sub, 'right')}
                    className="absolute right-0 top-0 bottom-0 w-2.5 hover:w-4 bg-amber-400/40 hover:bg-amber-400 cursor-ew-resize rounded-r flex items-center justify-center transition shadow-sm group/rhandle"
                    title="↔️ Estirar duración del subtítulo"
                  >
                    <div className="w-0.5 h-3 bg-amber-950 rounded-full group-hover/rhandle:bg-black" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* TRACK 3: Audio & Sound Effects (Supports Multiple Overlapping Tracks!) */}
        <div className="h-8 bg-neutral-900/60 rounded-lg border border-neutral-800/80 relative flex items-center overflow-hidden">
          <Music className="w-3.5 h-3.5 text-emerald-400 absolute left-2 pointer-events-none z-20" />

          {audioClips.length === 0 ? (
            <div className="flex items-center ml-8 text-[11px] text-neutral-500 gap-2">
              <span>Pista de Sonido (sin sonidos agregados)</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSoundClick();
                }}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 font-semibold border border-neutral-700 hover:border-emerald-500/50 transition flex items-center gap-1 text-[10px]"
              >
                <Plus className="w-3 h-3" />
                <span>+ Agregar Sonido</span>
              </button>
            </div>
          ) : (
            audioClips.map((clip) => {
              const startPct = (clip.start / (duration || 15)) * 100;
              const clipDur = clip.isLoop ? (duration || 15) - clip.start : clip.duration || 3;
              const widthPct = Math.max(4.5, (clipDur / (duration || 15)) * 100);
              const isSelected = selectedItem?.track === 'audio' && selectedItem?.id === clip.id;

              return (
                <div
                  key={clip.id}
                  data-timeline-block="true"
                  onMouseDown={(e) => handleAudioMouseDown(e, clip)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectItem({ track: 'audio', id: clip.id });
                  }}
                  className={`absolute top-0.5 bottom-0.5 rounded px-2 flex items-center justify-between text-[10px] font-bold cursor-grab active:cursor-grabbing transition border select-none group ${
                    isSelected
                      ? 'bg-emerald-500/40 border-emerald-300 text-white ring-2 ring-emerald-400 shadow-lg shadow-emerald-950/80 z-20'
                      : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 hover:bg-emerald-500/30 z-10'
                  }`}
                  style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                  title="Arrastra para mover en la línea de tiempo • Clic para seleccionar"
                >
                  <span className={`truncate pr-1 ${clip.isMuted ? 'line-through opacity-70 text-neutral-400' : ''}`}>
                    {clip.isMuted ? '🔇' : '🎵'} {clip.name} ({clip.isMuted ? 'Mudo' : `${Math.round((clip.volume ?? 1) * 100)}%`})
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Quick Mute Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (setAudioClips) {
                          setAudioClips((prev) =>
                            prev.map((c) => (c.id === clip.id ? { ...c, isMuted: !c.isMuted } : c))
                          );
                        }
                      }}
                      className={`px-1 py-0.5 rounded border transition flex items-center gap-0.5 ${
                        clip.isMuted
                          ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                          : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-700/60'
                      }`}
                      title={clip.isMuted ? 'Activar sonido de este clip' : 'Silenciar este clip'}
                    >
                      {clip.isMuted ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5" />}
                    </button>

                    {/* Snap to 0s button if clip.start > 0 */}
                    {clip.start > 0.1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (setAudioClips) {
                            setAudioClips((prev) =>
                              prev.map((c) => (c.id === clip.id ? { ...c, start: 0 } : c))
                            );
                          }
                        }}
                        className="px-1 py-0.2 text-[8px] bg-neutral-900/80 hover:bg-neutral-800 rounded border border-neutral-700/60 text-neutral-300 hover:text-white transition"
                        title="Mover este sonido a 0s (inicio)"
                      >
                        ⏮️ 0s
                      </button>
                    )}

                    <span className="text-[9px] px-1 py-0.2 bg-neutral-900/80 border border-neutral-700/60 rounded text-neutral-300 flex items-center gap-0.5">
                      {clip.isLoop ? <Repeat className="w-2.5 h-2.5 text-amber-300" /> : '1x'}
                    </span>

                    {/* Instant delete button right on the block! */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteAudioClip) {
                          onDeleteAudioClip(clip.id);
                        } else if (setAudioClips) {
                          setAudioClips((prev) => prev.filter((c) => c.id !== clip.id));
                        }
                        if (selectedItem?.id === clip.id) onSelectItem(null);
                      }}
                      className="w-4 h-4 rounded-full bg-neutral-900/90 hover:bg-rose-500 text-neutral-400 hover:text-white flex items-center justify-center transition ml-0.5 text-[9px] font-bold"
                      title="Eliminar este sonido"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* TRACK 4: Logo / Watermark Track (When Active) */}
        {watermarkConfig.url && (
          <div className="h-6 bg-neutral-900/40 rounded-lg border border-neutral-800/60 relative flex items-center overflow-hidden px-2">
            <ImageIcon className="w-3 h-3 text-purple-400 absolute left-2 pointer-events-none z-20" />
            <div
              data-timeline-block="true"
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem({ track: 'watermark', id: 'watermark' });
              }}
              className={`absolute top-0.5 bottom-0.5 left-8 right-2 rounded px-2 flex items-center text-[10px] font-bold cursor-pointer transition border ${
                selectedItem?.track === 'watermark'
                  ? 'bg-purple-500/30 border-purple-400 text-white ring-2 ring-purple-400 shadow-md shadow-purple-950/60'
                  : 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25'
              }`}
            >
              <span>🖼️ Logo / Marca de agua (Activo en todo el video)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
