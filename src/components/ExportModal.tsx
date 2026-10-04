import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Download, 
  CheckCircle, 
  X, 
  Film, 
  Sliders, 
  Check, 
  ArrowRight, 
  HardDrive 
} from 'lucide-react';
import type { AspectRatio, ExportQuality, ExportFPS, ExportFormat, ExportSettings } from '../types';
import { useI18n } from '../i18n/context';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExporting: boolean;
  progress: number;
  isComplete: boolean;
  exportedBlob?: Blob | null;
  onDownload: () => void;
  onStartExport: (settings: ExportSettings) => void;
  currentAspectRatio: AspectRatio;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  isExporting,
  progress,
  isComplete,
  exportedBlob,
  onDownload,
  onStartExport,
  currentAspectRatio,
}) => {
  const { t } = useI18n();
  const [quality, setQuality] = useState<ExportQuality>('1080p');
  const [fps, setFps] = useState<ExportFPS>(60);
  const [format, setFormat] = useState<ExportFormat>('mp4');

  useEffect(() => {
    if (isComplete) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if confetti fails
      }
    }
  }, [isComplete]);

  if (!isOpen) return null;

  const getResolutionLabel = (q: ExportQuality): string => {
    switch (currentAspectRatio) {
      case '9:16':
        if (q === '4k') return '2160 × 3840';
        if (q === '1080p') return '1080 × 1920';
        if (q === '720p') return '720 × 1280';
        return '480 × 854';
      case '16:9':
        if (q === '4k') return '3840 × 2160';
        if (q === '1080p') return '1920 × 1080';
        if (q === '720p') return '1280 × 720';
        return '854 × 480';
      case '1:1':
        if (q === '4k') return '2160 × 2160';
        if (q === '1080p') return '1080 × 1080';
        if (q === '720p') return '720 × 720';
        return '480 × 480';
    }
  };

  const handleStart = () => {
    onStartExport({ quality, fps, format });
  };

  const fileSizeMB = exportedBlob ? (exportedBlob.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl relative text-left space-y-5 animate-fadeIn max-h-[95vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
          title={t.common.close}
        >
          <X className="w-5 h-5" />
        </button>

        {/* ------------------------------------------------------------- */}
        {/* PHASE 1: CONFIGURATION BEFORE EXPORTING                       */}
        {/* ------------------------------------------------------------- */}
        {!isExporting && !isComplete && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/40 text-white flex-shrink-0">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">{t.exportModal.settingsTitle}</h3>
                <p className="text-xs text-neutral-400">
                  {t.exportModal.settingsDesc}
                </p>
              </div>
            </div>

            {/* Quality Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center justify-between">
                <span>{t.exportModal.qualitySection}</span>
                <span className="text-[11px] text-rose-400 font-mono font-normal">
                  {getResolutionLabel(quality)}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* 4K */}
                <button
                  type="button"
                  onClick={() => setQuality('4k')}
                  className={`p-3 rounded-2xl border text-left transition relative ${
                    quality === '4k'
                      ? 'bg-rose-500/15 border-rose-500 text-white ring-1 ring-rose-500'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{t.exportModal.resolution4k}</span>
                    {quality === '4k' && <Check className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{t.exportModal.resolution4kDesc}</div>
                </button>

                {/* 1080p */}
                <button
                  type="button"
                  onClick={() => setQuality('1080p')}
                  className={`p-3 rounded-2xl border text-left transition relative ${
                    quality === '1080p'
                      ? 'bg-rose-500/15 border-rose-500 text-white ring-1 ring-rose-500'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{t.exportModal.resolution1080p}</span>
                    {quality === '1080p' && <Check className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div className="text-[11px] text-rose-300/90 font-semibold mt-0.5">{t.exportModal.resolution1080pDesc}</div>
                </button>

                {/* 720p */}
                <button
                  type="button"
                  onClick={() => setQuality('720p')}
                  className={`p-3 rounded-2xl border text-left transition relative ${
                    quality === '720p'
                      ? 'bg-rose-500/15 border-rose-500 text-white ring-1 ring-rose-500'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{t.exportModal.resolution720p}</span>
                    {quality === '720p' && <Check className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{t.exportModal.resolution720pDesc}</div>
                </button>

                {/* 480p */}
                <button
                  type="button"
                  onClick={() => setQuality('480p')}
                  className={`p-3 rounded-2xl border text-left transition relative ${
                    quality === '480p'
                      ? 'bg-rose-500/15 border-rose-500 text-white ring-1 ring-rose-500'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{t.exportModal.resolution480p}</span>
                    {quality === '480p' && <Check className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{t.exportModal.resolution480pDesc}</div>
                </button>
              </div>
            </div>

            {/* Framerate / FPS Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                {t.exportModal.fpsSection}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFps(60)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    fps === 60
                      ? 'bg-rose-500/15 border-rose-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm">{t.exportModal.fps60Title}</div>
                    <div className="text-[10px] text-neutral-400">{t.exportModal.fps60Desc}</div>
                  </div>
                  {fps === 60 && <Check className="w-4 h-4 text-rose-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setFps(30)}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    fps === 30
                      ? 'bg-rose-500/15 border-rose-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm">{t.exportModal.fps30Title}</div>
                    <div className="text-[10px] text-neutral-400">{t.exportModal.fps30Desc}</div>
                  </div>
                  {fps === 30 && <Check className="w-4 h-4 text-rose-400" />}
                </button>
              </div>
            </div>

            {/* Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                {t.exportModal.formatSection}
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('mp4')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    format === 'mp4'
                      ? 'bg-rose-500/15 border-rose-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm">{t.exportModal.formatMp4Title}</div>
                    <div className="text-[10px] text-neutral-400">{t.exportModal.formatMp4Desc}</div>
                  </div>
                  {format === 'mp4' && <Check className="w-4 h-4 text-rose-400" />}
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('webm')}
                  className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                    format === 'webm'
                      ? 'bg-rose-500/15 border-rose-500 text-white'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm">{t.exportModal.formatWebmTitle}</div>
                    <div className="text-[10px] text-neutral-400">{t.exportModal.formatWebmDesc}</div>
                  </div>
                  {format === 'webm' && <Check className="w-4 h-4 text-rose-400" />}
                </button>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold rounded-2xl shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transition transform active:scale-95 text-sm"
              >
                <span>{t.exportModal.startExportButton} ({quality.toUpperCase()} • {fps} FPS)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PHASE 2: RENDERING IN PROGRESS                                */}
        {/* ------------------------------------------------------------- */}
        {isExporting && !isComplete && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 mx-auto flex items-center justify-center mb-2 shadow-lg shadow-rose-950/40">
              <Film className="w-8 h-8 text-white animate-pulse" />
            </div>

            <h3 className="text-xl font-bold text-white">{t.exportModal.renderingTitle}</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              {t.exportModal.renderingDesc}
            </p>

            {/* Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="w-full bg-neutral-950 rounded-full h-3.5 border border-neutral-800 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 to-pink-500 h-3.5 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-neutral-400">
                <span>{t.common.loading}</span>
                <span className="font-bold text-rose-400">{progress}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* PHASE 3: EXPORT COMPLETE & DOWNLOAD READY                     */}
        {/* ------------------------------------------------------------- */}
        {isComplete && (
          <div className="text-center space-y-5 py-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-950/40">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">{t.exportModal.exportSuccessTitle}</h3>
              <p className="text-xs text-neutral-400">
                {t.exportModal.exportSuccessDesc}
              </p>
            </div>

            {/* Summary Badge Card */}
            <div className="p-4 bg-neutral-950/80 border border-neutral-800 rounded-2xl text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">{t.exportModal.qualitySection}:</span>
                <span className="font-bold text-white uppercase">{quality} ({getResolutionLabel(quality)})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">{t.exportModal.fpsSection}:</span>
                <span className="font-bold text-white">{fps} FPS</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">{t.exportModal.formatSection}:</span>
                <span className="font-bold text-white uppercase">{format}</span>
              </div>
              {fileSizeMB && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/80">
                  <span className="text-neutral-400 font-medium flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
                    File Size:
                  </span>
                  <span className="font-bold text-emerald-400">{fileSizeMB} MB</span>
                </div>
              )}
            </div>

            {/* Download CTA Button */}
            <button
              onClick={onDownload}
              className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold rounded-2xl shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transition transform active:scale-95 text-sm"
            >
              <Download className="w-5 h-5" />
              <span>{t.exportModal.downloadButton}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
