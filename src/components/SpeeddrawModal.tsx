import React, { useState, useEffect } from 'react';
import {
  Zap,
  X,
  Clock,
  VolumeX,
  Volume2,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import type { VideoClip } from '../types';
import { useI18n } from '../i18n/context';

interface SpeeddrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  totalDuration: number;
  videoClips: VideoClip[];
  selectedClipId: string | null;
  onApplyRangeSpeed: (rangeStart: number, rangeEnd: number, speed: number, muteAudio: boolean) => void;
}

export const SpeeddrawModal: React.FC<SpeeddrawModalProps> = ({
  isOpen,
  onClose,
  currentTime,
  totalDuration,
  videoClips,
  selectedClipId,
  onApplyRangeSpeed,
}) => {
  const { t } = useI18n();

  // Selected clip or fallback
  const activeClip = videoClips.find((c) => c.id === selectedClipId) || videoClips[0] || null;
  const clipStart = activeClip ? activeClip.start : 0;
  const clipEnd = activeClip ? activeClip.start + activeClip.duration : totalDuration;

  // Range state: default to current playhead to clipEnd (or 0 to end if at start)
  const [rangeStart, setRangeStart] = useState<number>(0);
  const [rangeEnd, setRangeEnd] = useState<number>(10);
  const [speed, setSpeed] = useState<number>(8); // 8x standard for speeddraw
  const [muteAudio, setMuteAudio] = useState<boolean>(true);

  // Initialize range when modal opens
  useEffect(() => {
    if (isOpen) {
      const startCandidate = Math.max(clipStart, Math.min(clipEnd - 1, currentTime));
      const endCandidate = clipEnd;
      setRangeStart(Math.round(startCandidate * 10) / 10);
      setRangeEnd(Math.round(endCandidate * 10) / 10);
      setSpeed(8);
      setMuteAudio(true);
    }
  }, [isOpen, clipStart, clipEnd, currentTime]);

  if (!isOpen) return null;

  const originalSectionDuration = Math.max(0, rangeEnd - rangeStart);
  const acceleratedDuration = Math.max(0.1, originalSectionDuration / speed);
  const savedTime = Math.max(0, originalSectionDuration - acceleratedDuration);

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleApply = () => {
    if (rangeEnd <= rangeStart + 0.1) {
      alert('El tiempo de fin debe ser mayor que el tiempo de inicio.');
      return;
    }
    onApplyRangeSpeed(rangeStart, rangeEnd, speed, muteAudio);
    onClose();
  };

  // Speed Presets
  const presets = [
    { value: 2, label: '2x', desc: 'Rápido suave' },
    { value: 4, label: '4x', desc: 'Cámara rápida' },
    { value: 8, label: '8x', desc: 'Speeddraw ✨' },
    { value: 16, label: '16x', desc: 'Speeddraw Pro' },
    { value: 32, label: '32x', desc: 'Timelapse' },
  ];

  const maxTimeline = Math.max(1, totalDuration);
  const startPct = Math.max(0, Math.min(100, (rangeStart / maxTimeline) * 100));
  const endPct = Math.max(startPct, Math.min(100, (rangeEnd / maxTimeline) * 100));
  const rangeWidthPct = endPct - startPct;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative text-left space-y-5 max-h-[95vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
          title={t.common.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-950/40 text-white flex-shrink-0">
            <Zap className="w-6 h-6 fill-amber-300 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Acelerar Tramo (Speeddraw)
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Timelapse ⚡
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Acelera cualquier parte de tu video (dibujo, pintura o proceso largo) manteniendo el resto a velocidad normal.
            </p>
          </div>
        </div>

        {/* SECCIÓN 1: SELECCIONAR TRAMO (DESDE / HASTA) */}
        <div className="space-y-3 p-4 bg-neutral-950/70 border border-neutral-800/80 rounded-2xl">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-400" />
              <span>Tramo a Acelerar</span>
            </span>
            <span className="text-[11px] font-mono text-neutral-400 font-normal">
              Original: <strong className="text-white">{originalSectionDuration.toFixed(1)}s</strong>
            </span>
          </div>

          {/* Visual Scrubber Preview */}
          <div className="space-y-1.5">
            <div className="h-6 bg-neutral-900 border border-neutral-800 rounded-xl relative overflow-hidden flex items-center px-1">
              {/* Highlighted speeddraw section */}
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 opacity-90 shadow-sm flex items-center justify-center text-[10px] font-black text-white font-mono"
                style={{ left: `${startPct}%`, width: `${Math.max(4, rangeWidthPct)}%` }}
              >
                <span className="truncate px-1">⚡ {speed}x</span>
              </div>
              {/* Playhead marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                style={{ left: `${(currentTime / maxTimeline) * 100}%` }}
                title="Posición actual de la aguja"
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-neutral-500">
              <span>00:00.0</span>
              <span>Total: {formatMinSec(totalDuration)}</span>
            </div>
          </div>

          {/* Inputs: Desde y Hasta */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Desde */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-300 flex items-center justify-between">
                <span>Desde:</span>
                <span className="font-mono text-rose-400">{formatMinSec(rangeStart)}</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max={rangeEnd - 0.1}
                  step="0.5"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Math.max(0, Math.min(rangeEnd - 0.1, parseFloat(e.target.value) || 0)))}
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-rose-500 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setRangeStart(Math.max(0, Math.min(rangeEnd - 0.1, Math.round(currentTime * 10) / 10)))}
                  className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl border border-neutral-700 text-[10px] font-semibold whitespace-nowrap transition"
                  title="Fijar en la posición actual de la aguja"
                >
                  Aguja
                </button>
              </div>
            </div>

            {/* Hasta */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-300 flex items-center justify-between">
                <span>Hasta:</span>
                <span className="font-mono text-rose-400">{formatMinSec(rangeEnd)}</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={rangeStart + 0.1}
                  max={totalDuration}
                  step="0.5"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Math.max(rangeStart + 0.1, Math.min(totalDuration, parseFloat(e.target.value) || 0)))}
                  className="w-full bg-neutral-900 border border-neutral-700 focus:border-rose-500 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white text-center focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setRangeEnd(Math.max(rangeStart + 0.1, Math.min(totalDuration, Math.round(currentTime * 10) / 10)))}
                  className="px-2 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl border border-neutral-700 text-[10px] font-semibold whitespace-nowrap transition"
                  title="Fijar en la posición actual de la aguja"
                >
                  Aguja
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: MULTIPLICADOR DE VELOCIDAD */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Multiplicador de Velocidad</span>
            </label>
            <span className="text-xs font-mono font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
              {speed}x
            </span>
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-5 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setSpeed(p.value)}
                className={`py-2 px-1 rounded-xl text-center border transition flex flex-col items-center justify-center ${
                  speed === p.value
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400 font-bold'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <span className="text-xs sm:text-sm font-extrabold">{p.label}</span>
                <span className="text-[9px] text-neutral-400 truncate max-w-full scale-90">{p.desc}</span>
              </button>
            ))}
          </div>

          {/* Slider libre */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-neutral-500">1x</span>
              <input
                type="range"
                min="1.5"
                max="32"
                step="0.5"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-neutral-500">32x</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: OPCIÓN DE AUDIO */}
        <div className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-2xl flex items-start gap-3">
          <input
            type="checkbox"
            id="muteSpeeddrawAudio"
            checked={muteAudio}
            onChange={(e) => setMuteAudio(e.target.checked)}
            className="mt-1 w-4 h-4 rounded accent-rose-500 cursor-pointer"
          />
          <label htmlFor="muteSpeeddrawAudio" className="text-xs cursor-pointer select-none space-y-0.5">
            <span className="font-bold text-neutral-200 block flex items-center gap-1.5">
              {muteAudio ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
              <span>Silenciar audio original de este tramo (Recomendado)</span>
            </span>
            <span className="text-[11px] text-neutral-400 block">
              A velocidades altas (4x o más) las voces o ruidos se distorsionan. Puedes sumar música de fondo o SFX en la pista de audio.
            </span>
          </label>
        </div>

        {/* SECCIÓN 4: RESULTADO / RESUMEN EN TIEMPO REAL */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-pink-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <div className="text-neutral-400 text-[11px]">Duración resultante del tramo:</div>
            <div className="font-mono font-bold text-sm text-white flex items-center gap-2">
              <span className="text-neutral-400 line-through">{originalSectionDuration.toFixed(1)}s</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 text-base">{acceleratedDuration.toFixed(1)}s</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 inline-block">
              Ahorras {savedTime.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* ACCIÓN: BOTÓN APLICAR */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-bold rounded-2xl transition text-xs sm:text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-[2] py-3 px-5 bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white font-extrabold rounded-2xl shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transition transform active:scale-95 text-xs sm:text-sm"
          >
            <Zap className="w-4 h-4 fill-white text-white" />
            <span>Aplicar Speeddraw al Tramo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
