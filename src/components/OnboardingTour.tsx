import React, { useState } from 'react';
import { 
  Sparkles, 
  Monitor, 
  Scissors, 
  Type, 
  Mic, 
  Volume2, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Lightbulb
} from 'lucide-react';
import { useI18n } from '../i18n/context';

export interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tips: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  targetArea?: 'canvas' | 'timeline' | 'sidebar' | 'header' | 'center';
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useI18n();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      id: 'welcome',
      title: t.tour.step1Title,
      subtitle: t.tour.step1Subtitle,
      description: t.tour.step1Desc,
      tips: [t.tour.step1Tip1, t.tour.step1Tip2, t.tour.step1Tip3],
      icon: Sparkles,
      accentColor: 'from-rose-500 to-pink-600',
      targetArea: 'center',
    },
    {
      id: 'canvas',
      title: t.tour.step2Title,
      subtitle: t.tour.step2Subtitle,
      description: t.tour.step2Desc,
      tips: [t.tour.step2Tip1, t.tour.step2Tip2, t.tour.step2Tip3],
      icon: Monitor,
      accentColor: 'from-sky-500 to-cyan-500',
      targetArea: 'canvas',
    },
    {
      id: 'timeline',
      title: t.tour.step3Title,
      subtitle: t.tour.step3Subtitle,
      description: t.tour.step3Desc,
      tips: [t.tour.step3Tip1, t.tour.step3Tip2, t.tour.step3Tip3],
      icon: Scissors,
      accentColor: 'from-amber-500 to-orange-500',
      targetArea: 'timeline',
    },
    {
      id: 'styles',
      title: t.tour.step4Title,
      subtitle: t.tour.step4Subtitle,
      description: t.tour.step4Desc,
      tips: [t.tour.step4Tip1, t.tour.step4Tip2, t.tour.step4Tip3],
      icon: Type,
      accentColor: 'from-purple-500 to-pink-500',
      targetArea: 'sidebar',
    },
    {
      id: 'subtitles',
      title: t.tour.step5Title,
      subtitle: t.tour.step5Subtitle,
      description: t.tour.step5Desc,
      tips: [t.tour.step5Tip1, t.tour.step5Tip2, t.tour.step5Tip3],
      icon: Mic,
      accentColor: 'from-emerald-500 to-teal-500',
      targetArea: 'sidebar',
    },
    {
      id: 'audio',
      title: t.tour.step6Title,
      subtitle: t.tour.step6Subtitle,
      description: t.tour.step6Desc,
      tips: [t.tour.step6Tip1, t.tour.step6Tip2, t.tour.step6Tip3],
      icon: Volume2,
      accentColor: 'from-indigo-500 to-violet-500',
      targetArea: 'sidebar',
    },
    {
      id: 'export',
      title: t.tour.step7Title,
      subtitle: t.tour.step7Subtitle,
      description: t.tour.step7Desc,
      tips: [t.tour.step7Tip1, t.tour.step7Tip2, t.tour.step7Tip3],
      icon: Download,
      accentColor: 'from-rose-500 to-pink-600',
      targetArea: 'header',
    },
  ];

  const currentStep = steps[currentStepIndex] || steps[0];
  const StepIcon = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('editorcut_tour_seen', 'true');
      localStorage.setItem('simplecut_tour_seen', 'true');
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('editorcut_tour_seen', 'true');
    localStorage.setItem('simplecut_tour_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      {/* Dimmed backdrop (clickable to exit) */}
      <div 
        onClick={handleSkip}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm pointer-events-auto transition-opacity" 
      />

      {/* Floating Tour Dialog Card */}
      <div className="relative pointer-events-auto bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl shadow-rose-950/40 text-left animate-fadeIn space-y-5 z-10">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentStep.accentColor} flex items-center justify-center shadow-lg text-white flex-shrink-0`}>
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  {t.tour.stepOf} {currentStepIndex + 1} / {steps.length}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle & Description */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-rose-300">
            {currentStep.subtitle}
          </p>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Bullet Tips */}
        <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.common.appName} Tips</span>
          </div>
          <ul className="space-y-1.5 text-xs text-neutral-300">
            {currentStep.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer with Step Dots & Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-rose-500 shadow-sm shadow-rose-500'
                    : 'w-2 bg-neutral-700 hover:bg-neutral-600'
                }`}
                title={`${t.tour.stepOf} ${idx + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.common.back}</span>
              </button>
            )}

            <button
              onClick={handleSkip}
              className="text-xs text-neutral-400 hover:text-white px-2.5 py-2 transition"
            >
              {t.tour.skipTourButton}
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center gap-1.5 transition active:scale-95"
            >
              <span>{isLast ? t.tour.finishButton : t.common.next}</span>
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
