import React from 'react';
import type { AspectRatio } from '../types';
import { 
  Sparkles, 
  Smartphone, 
  Square, 
  Monitor, 
  Download, 
  FolderOpen,
  Save,
  Upload,
  Mic,
  Video
} from 'lucide-react';

interface HeaderProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ar: AspectRatio) => void;
  onImportClick: () => void;
  onAutoSubtitlesClick: () => void;
  onExportClick: () => void;
  isExporting: boolean;
  onProjectsClick?: () => void;
  onQuickSaveClick?: () => void;
  currentProjectName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  aspectRatio,
  setAspectRatio,
  onImportClick,
  onAutoSubtitlesClick,
  onExportClick,
  isExporting,
  onProjectsClick,
  onQuickSaveClick,
  currentProjectName,
}) => {
  return (
    <header className="h-14 sm:h-16 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur px-2.5 sm:px-5 flex items-center justify-between z-30 select-none flex-shrink-0 gap-1.5 sm:gap-4">
      {/* Brand & Badge */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/40 flex-shrink-0">
          <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-lg font-black tracking-tight text-white m-0 truncate">
              SimpleCut<span className="hidden sm:inline"> Studio</span>
            </h1>
            <span className="hidden md:inline px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex-shrink-0">
              Edición Fácil 👴👌
            </span>
            {currentProjectName && (
              <span className="hidden 2xl:inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-lg max-w-[170px] truncate" title={`Proyecto actual: ${currentProjectName}`}>
                📁 {currentProjectName}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 m-0 hidden lg:block truncate">
            El editor de video definitivo para creadores
          </p>
        </div>
      </div>

      {/* Center: Aspect Ratio Picker */}
      <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-0.5 sm:p-1 gap-0.5 sm:gap-1 shadow-inner flex-shrink-0">
        <button
          onClick={() => setAspectRatio('9:16')}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
            aspectRatio === '9:16'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
          title="Vertical 9:16 para TikTok, Reels y Shorts"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">9:16</span>
          <span className="hidden md:inline">Reels</span>
        </button>

        <button
          onClick={() => setAspectRatio('1:1')}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
            aspectRatio === '1:1'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
          title="Cuadrado 1:1 para Feed de Instagram"
        >
          <Square className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">1:1</span>
          <span className="hidden md:inline">Post</span>
        </button>

        <button
          onClick={() => setAspectRatio('16:9')}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
            aspectRatio === '16:9'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
          title="Horizontal 16:9 para YouTube clásico"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">16:9</span>
          <span className="hidden md:inline">YouTube</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {onProjectsClick && (
          <button
            onClick={onProjectsClick}
            className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700 transition"
            title="Mis Proyectos Guardados"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Proyectos</span>
          </button>
        )}

        {onQuickSaveClick && (
          <button
            onClick={onQuickSaveClick}
            className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700 transition"
            title="Guardar proyecto actual"
          >
            <Save className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden lg:inline">Guardar</span>
          </button>
        )}

        <button
          onClick={onImportClick}
          className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3.5 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700 transition"
          title="Cargar video, audio o foto"
        >
          <Upload className="w-3.5 h-3.5 text-neutral-300" />
          <span className="hidden xl:inline">Cargar</span>
        </button>

        <button
          onClick={onAutoSubtitlesClick}
          className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3.5 sm:py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition shadow-sm"
          title="Detectar voz automáticamente sin tokens"
        >
          <Mic className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline">Voz a Texto</span>
        </button>

        <button
          onClick={onExportClick}
          disabled={isExporting}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{isExporting ? 'Exportando...' : <><span className="hidden sm:inline">Exportar </span>Video</>}</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-200 hidden md:inline" />
        </button>
      </div>
    </header>
  );
};
