import React, { useState } from 'react';
import type { AspectRatio } from '../types';
import { 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Square, 
  ArrowRight, 
  Scissors, 
  Type, 
  Mic, 
  Volume2, 
  Zap, 
  ShieldCheck, 
  Cpu, 
  Download,
  PlayCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { useI18n } from '../i18n/context';
import { LanguageSelector } from './LanguageSelector';
import { StudioMockupPreview } from './StudioMockupPreview';
import { LogoIcon } from './LogoIcon';

interface LandingPageProps {
  onOpenEditor: (ratio?: AspectRatio) => void;
  onStartTour: () => void;
  onOpenProjects: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenEditor,
  onStartTour,
  onOpenProjects,
}) => {
  const { t } = useI18n();

  const [skipLanding, setSkipLanding] = useState<boolean>(() => {
    return localStorage.getItem('editorcut_skip_landing') === 'true' || localStorage.getItem('simplecut_skip_landing') === 'true';
  });

  const handleToggleSkip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setSkipLanding(val);
    if (val) {
      localStorage.setItem('editorcut_skip_landing', 'true');
    } else {
      localStorage.removeItem('editorcut_skip_landing');
      localStorage.removeItem('simplecut_skip_landing');
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 font-sans selection:bg-rose-500 selection:text-white flex flex-col justify-between overflow-x-hidden overflow-y-auto">
      {/* Top Navbar */}
      <nav className="h-16 sm:h-20 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <LogoIcon className="w-9 h-9 sm:w-10 sm:h-10 text-rose-500 drop-shadow-[0_2px_12px_rgba(225,29,72,0.4)] flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">{t.common.appName}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                {t.common.freeBadge}
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">{t.common.navbarTagline}</p>
          </div>
        </div>

        {/* Navbar Actions & Language Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector Dropdown */}
          <LanguageSelector variant="minimal" />

          <button
            onClick={onStartTour}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded-xl transition"
          >
            <HelpCircle className="w-4 h-4 text-neutral-400" />
            <span>{t.landing.tutorialButton}</span>
          </button>

          <button
            onClick={onOpenProjects}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded-xl transition"
          >
            <FolderOpen className="w-4 h-4 text-neutral-400" />
            <span>{t.landing.projectsButton}</span>
          </button>

          <button
            onClick={() => onOpenEditor()}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-950/40 transition active:scale-95"
          >
            <span>{t.landing.openEditorButton}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-16 space-y-16 sm:space-y-24">
        {/* Hero Section */}
        <section className="space-y-10 sm:space-y-12">
          {/* Headlines & Call To Action */}
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>{t.landing.heroBadge}</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08]">
              {t.landing.heroTitleLine1} <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                {t.landing.heroTitleHighlight}
              </span>
            </h1>

            <p className="text-sm sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              {t.landing.heroSubtitle}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => onOpenEditor()}
                className="px-7 sm:px-9 py-3.5 sm:py-4 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-2xl shadow-rose-950/60 flex items-center gap-2.5 transition transform hover:scale-[1.02] active:scale-95"
              >
                <span>{t.landing.startFreeButton}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onStartTour}
                className="px-6 sm:px-7 py-3.5 sm:py-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-sm sm:text-base rounded-2xl border border-neutral-800 hover:border-neutral-700 flex items-center gap-2 transition active:scale-95 shadow-lg"
              >
                <PlayCircle className="w-5 h-5 text-rose-400" />
                <span>{t.landing.watchTourButton}</span>
              </button>
            </div>

            {/* Quick Format Selector Cards */}
            <div className="pt-2 max-w-2xl mx-auto">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                {t.landing.orSelectRatio}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Vertical 9:16 */}
                <button
                  onClick={() => onOpenEditor('9:16')}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-rose-500/50 text-left transition group shadow-md"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">{t.landing.ratioVerticalTitle}</div>
                  <div className="text-[11px] text-neutral-400">{t.landing.ratioVerticalSub}</div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">1080 × 1920</div>
                </button>

                {/* Horizontal 16:9 */}
                <button
                  onClick={() => onOpenEditor('16:9')}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-rose-500/50 text-left transition group shadow-md"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">{t.landing.ratioHorizontalTitle}</div>
                  <div className="text-[11px] text-neutral-400">{t.landing.ratioHorizontalSub}</div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">1920 × 1080</div>
                </button>

                {/* Square 1:1 */}
                <button
                  onClick={() => onOpenEditor('1:1')}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-rose-500/50 text-left transition group shadow-md"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Square className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">{t.landing.ratioSquareTitle}</div>
                  <div className="text-[11px] text-neutral-400">{t.landing.ratioSquareSub}</div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">1080 × 1080</div>
                </button>
              </div>
            </div>
          </div>

          {/* High-Fidelity Professional Studio Mockup Preview (Centerpiece!) */}
          <div className="pt-2">
            <StudioMockupPreview />
          </div>
        </section>

        {/* Feature Highlights Grid ("Lo que hace EditorCut") */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400">{t.landing.capabilitiesBadge}</h2>
            <h3 className="text-2xl sm:text-4xl font-black text-white">
              {t.landing.capabilitiesTitle}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              {t.landing.capabilitiesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat1Title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.feat1Desc}
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat2Title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.feat2Desc}
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat3Title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.feat3Desc}
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Type className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat4Title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.feat4Desc}
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat5Title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.feat5Desc}
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">{t.landing.feat6Title}</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.feat6Desc}
              </p>
            </div>
          </div>
        </section>

        {/* 5 Simple Steps Section */}
        <section className="p-8 sm:p-12 rounded-3xl bg-neutral-900/40 border border-neutral-800 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">{t.landing.stepsBadge}</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {t.landing.stepsTitle}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
              {t.landing.stepsSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black flex items-center justify-center">
                {t.landing.step1Num}
              </div>
              <h5 className="font-bold text-sm text-white">{t.landing.step1Title}</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.step1Desc}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black flex items-center justify-center">
                {t.landing.step2Num}
              </div>
              <h5 className="font-bold text-sm text-white">{t.landing.step2Title}</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.step2Desc}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black flex items-center justify-center">
                {t.landing.step3Num}
              </div>
              <h5 className="font-bold text-sm text-white">{t.landing.step3Title}</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.step3Desc}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black flex items-center justify-center">
                {t.landing.step4Num}
              </div>
              <h5 className="font-bold text-sm text-white">{t.landing.step4Title}</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.step4Desc}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-black flex items-center justify-center">
                {t.landing.step5Num}
              </div>
              <h5 className="font-bold text-sm text-white">{t.landing.step5Title}</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {t.landing.step5Desc}
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onOpenEditor()}
              className="px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-950/50 transition transform hover:scale-105 active:scale-95"
            >
              {t.landing.startFreeButton}
            </button>
          </div>
        </section>

        {/* Local & Private Badge Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-800/60">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/50">
            <ShieldCheck className="w-6 h-6 text-rose-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">{t.landing.whyPill1Title}</div>
              <div className="text-[11px] text-neutral-400">{t.landing.whyPill1Desc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/50">
            <Cpu className="w-6 h-6 text-rose-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">{t.landing.whyPill2Title}</div>
              <div className="text-[11px] text-neutral-400">{t.landing.whyPill2Desc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/50">
            <Zap className="w-6 h-6 text-rose-500 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">{t.landing.whyPill3Title}</div>
              <div className="text-[11px] text-neutral-400">{t.landing.whyPill3Desc}</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Skip Landing Toggle */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2.5">
          <LogoIcon className="w-6 h-6 text-rose-500 flex-shrink-0" withContainer={false} />
          <span>{t.landing.footerBrandText}</span>
        </div>

        {/* Skip landing screen toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer bg-neutral-900 hover:bg-neutral-800/80 px-3.5 py-2 rounded-xl border border-neutral-800 transition">
          <input
            type="checkbox"
            checked={skipLanding}
            onChange={handleToggleSkip}
            className="w-4 h-4 rounded text-rose-500 bg-neutral-950 border-neutral-700 focus:ring-rose-500 cursor-pointer"
          />
          <span className="text-neutral-300 font-medium select-none">
            {t.landing.footerSkipLabel}
          </span>
        </label>
      </footer>
    </div>
  );
};
