import React from 'react';
import type { AspectRatio } from '../types';
import { 
  Smartphone, 
  Square, 
  Monitor, 
  Download, 
  FolderOpen,
  Save,
  Upload,
  Mic,
  HelpCircle,
  Home,
  Radio
} from 'lucide-react';
import { useI18n } from '../i18n/context';
import { LanguageSelector } from './LanguageSelector';
import { LogoIcon } from './LogoIcon';

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
  onOpenLanding?: () => void;
  onOpenTour?: () => void;
  onRecordClick?: () => void;
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
  onOpenLanding,
  onOpenTour,
  onRecordClick,
}) => {
  const { t } = useI18n();

  return (
    <header className="h-12 sm:h-16 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur px-2.5 sm:px-5 flex items-center justify-between z-30 select-none flex-shrink-0 gap-1.5 sm:gap-4">
      {/* Brand & Badge */}
      <div 
        onClick={onOpenLanding}
        className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0 cursor-pointer hover:opacity-90 transition group"
        title={t.header.home}
      >
        <LogoIcon className="w-8 h-8 sm:w-9 sm:h-9 text-rose-500 drop-shadow-[0_2px_10px_rgba(225,29,72,0.4)] flex-shrink-0 group-hover:scale-105 transition" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-sm sm:text-lg font-black tracking-tight text-white m-0 truncate group-hover:text-rose-300 transition">
              {t.common.appName}<span className="hidden sm:inline"> Studio</span>
            </h1>
            <span className="hidden md:inline px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex-shrink-0">
              {t.common.easyEditingBadge}
            </span>
            {currentProjectName && (
              <span className="hidden 2xl:inline-block px-2.5 py-0.5 text-[11px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-lg max-w-[170px] truncate" title={`Proyecto actual: ${currentProjectName}`}>
                📁 {currentProjectName}
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 m-0 hidden lg:block truncate">
            {t.common.tagline}
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
          title={t.header.ratioVerticalTip}
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
          title={t.header.ratioSquareTip}
        >
          <Square className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">1:1</span>
          <span className="hidden md:inline">Feed</span>
        </button>

        <button
          onClick={() => setAspectRatio('16:9')}
          className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
            aspectRatio === '16:9'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
          title={t.header.ratioHorizontalTip}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">16:9</span>
          <span className="hidden md:inline">YouTube</span>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Language Selector */}
        <LanguageSelector variant="minimal" />

        {onOpenLanding && (
          <button
            onClick={onOpenLanding}
            className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700/70 transition"
            title={t.header.home}
          >
            <Home className="w-3.5 h-3.5 text-neutral-300" />
            <span className="hidden xl:inline">{t.header.home}</span>
          </button>
        )}

        {onOpenTour && (
          <button
            onClick={onOpenTour}
            className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700/70 transition"
            title={t.header.tutorial}
          >
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden lg:inline">{t.header.tutorial}</span>
          </button>
        )}

        {onProjectsClick && (
          <button
            onClick={onProjectsClick}
            className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700 transition"
            title={t.header.projects}
          >
            <FolderOpen className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">{t.header.projects}</span>
          </button>
        )}

        {onQuickSaveClick && (
          <button
            onClick={onQuickSaveClick}
            className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700 transition"
            title={t.header.quickSave}
          >
            <Save className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden lg:inline">{t.header.quickSave}</span>
          </button>
        )}

        {onRecordClick && (
          <button
            onClick={onRecordClick}
            className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3 sm:py-2 bg-neutral-800/90 hover:bg-neutral-700 text-rose-300 hover:text-white text-xs font-semibold rounded-xl border border-rose-500/40 hover:border-rose-500 transition shadow-sm"
            title={t.header.recordScreenTip}
          >
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="hidden sm:inline font-bold">{t.header.recordScreen}</span>
          </button>
        )}

        <button
          onClick={onImportClick}
          className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3.5 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700 transition"
          title={t.header.importMedia}
        >
          <Upload className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden xl:inline">{t.header.importMedia}</span>
        </button>

        <button
          onClick={onAutoSubtitlesClick}
          className="flex items-center gap-1 sm:gap-1.5 p-2 sm:px-3.5 sm:py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700 transition"
          title={t.header.aiSubtitles}
        >
          <Mic className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden xl:inline">{t.header.aiSubtitles}</span>
        </button>

        <button
          onClick={onExportClick}
          disabled={isExporting}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{isExporting ? t.common.loading : t.header.exportVideo}</span>
        </button>
      </div>
    </header>
  );
};
