import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Download, CheckCircle, X, Sparkles, Film } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  isComplete: boolean;
  exportedBlob?: Blob | null;
  onDownload: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  progress,
  isComplete,
  onDownload,
}) => {
  useEffect(() => {
    if (isComplete) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore if confetti fails
      }
    }
  }, [isComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 mx-auto flex items-center justify-center mb-4 shadow-lg shadow-rose-950/40">
          {isComplete ? (
            <CheckCircle className="w-8 h-8 text-white" />
          ) : (
            <Film className="w-8 h-8 text-white animate-pulse" />
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          {isComplete ? '¡Tu Video Está Listo!' : 'Exportando Video...'}
        </h3>
        <p className="text-xs text-neutral-400 mb-6">
          {isComplete
            ? 'Listo para publicar en TikTok, Instagram Reels o YouTube Shorts.'
            : 'Renderizando texto detrás, capas visuales y audio localmente a máxima calidad.'}
        </p>

        {/* Progress Bar */}
        {!isComplete ? (
          <div className="space-y-2 mb-6">
            <div className="w-full bg-neutral-950 rounded-full h-3 border border-neutral-800 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-pink-500 h-3 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono text-neutral-400">
              <span>Procesando</span>
              <span>{progress}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-left flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="text-xs text-neutral-200">
                <span className="font-bold text-white block">Formato Optimizado</span>
                Resolución nativa, 30 FPS, audio balanceado.
              </div>
            </div>

            <button
              onClick={onDownload}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-2xl shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transition transform active:scale-95 text-sm"
            >
              <Download className="w-5 h-5" />
              <span>Descargar Video Final</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
