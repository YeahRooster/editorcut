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

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a EditorCut!',
    subtitle: 'Editor de video inteligente en tu navegador',
    description: 'Crea videos de alto impacto para Reels, TikTok y YouTube sin necesidad de instalar programas ni pagar suscripciones.',
    tips: [
      'Todo se procesa en tu dispositivo: 100% privado y sin subir tus archivos.',
      'Sin marcas de agua ni limitaciones de duración.',
      'Diseñado para funcionar rápido tanto en computadora, tableta o celular.'
    ],
    icon: Sparkles,
    accentColor: 'from-rose-500 to-pink-600',
    targetArea: 'center',
  },
  {
    id: 'canvas',
    title: 'Lienzo y Previsualización',
    subtitle: 'Visualiza tu video en tiempo real mientras lo editas',
    description: 'Mira cómo queda tu video con todos los efectos, animaciones y títulos en tiempo real.',
    tips: [
      'Arrastra con el mouse o el dedo los títulos o logos para ubicarlos donde quieras.',
      'Haz doble clic sobre cualquier título o subtítulo para editar su texto.',
      'Usa la barra flotante inferior para reproducir, mutear o adelantar la aguja.'
    ],
    icon: Monitor,
    accentColor: 'from-sky-500 to-cyan-500',
    targetArea: 'canvas',
  },
  {
    id: 'timeline',
    title: 'Línea de Tiempo Táctil & Tijera ✂️',
    subtitle: 'Corta, organiza y ajusta múltiples pistas',
    description: 'Controla exactamente en qué segundo aparece cada elemento con nuestra línea de tiempo multipista.',
    tips: [
      'Usa el botón "Cortar ✂️" para dividir el video en la aguja de reproducción.',
      'Suma más videos seguidos con "+ Video" o música en "+ Sonido".',
      'Desliza con el dedo o mouse sobre la regla de segundos para navegar suavemente.'
    ],
    icon: Scissors,
    accentColor: 'from-amber-500 to-orange-500',
    targetArea: 'timeline',
  },
  {
    id: 'styles',
    title: 'Estilos, Portada Editorial & Texto Detrás',
    subtitle: 'El efecto viral de TikTok e Instagram en 1 clic',
    description: 'Aplica el efecto de "texto detrás de la persona" mediante IA sin necesidad de pantalla verde.',
    tips: [
      'Elige el modo "Portada Editorial" para un look limpio y cinematográfico.',
      'Activa "Detrás de persona" para que el texto quede entre el fondo y el sujeto.',
      'Añade animaciones como Desvanecer, Zoom o Deslizar a cada título.'
    ],
    icon: Type,
    accentColor: 'from-purple-500 to-pink-500',
    targetArea: 'sidebar',
  },
  {
    id: 'subtitles',
    title: 'Subtítulos Automáticos con IA',
    subtitle: 'Voz a texto precisa y sincronizada con 0 tokens',
    description: 'Convierte el audio hablado de tu video en subtítulos modernos listos para redes sociales.',
    tips: [
      'Haz clic en "Auto Subtítulos" en el panel o en el encabezado.',
      'Genera subtítulos en español e inglés sin consumir créditos ni registros.',
      'Personaliza colores, tamaño y resalte de palabras en la pestaña Voz/Texto.'
    ],
    icon: Mic,
    accentColor: 'from-emerald-500 to-teal-500',
    targetArea: 'sidebar',
  },
  {
    id: 'audio',
    title: 'Música & Efectos de Sonido (SFX)',
    subtitle: 'Dale vida y dinamismo a tus escenas',
    description: 'Suma música de fondo temática o efectos sonoros de impacto como Whoosh, Risas o Notificaciones.',
    tips: [
      'Toca cualquier botón de efecto de sonido para colocarlo en la aguja actual.',
      'Activa "Auto-Ducking" para atenuar la música cuando hables.',
      'Controla el volumen independiente de cada sonido o silencia clips en 1 clic.'
    ],
    icon: Volume2,
    accentColor: 'from-indigo-500 to-violet-500',
    targetArea: 'sidebar',
  },
  {
    id: 'export',
    title: 'Exportación en 4K / 1080p a 60 FPS',
    subtitle: 'Calidad profesional ultra fluida lista para descargar',
    description: 'Renderiza tu video final en resolución 4K, 1080p Full HD, 720p o 480p según lo que necesites.',
    tips: [
      'Renderizado 60 FPS sin micro-lags en MP4 progresivo.',
      'Compatible al 100% con Windows Media Player, iOS, Android y YouTube.',
      'Guarda tu proyecto localmente para retomarlo cuando quieras.'
    ],
    icon: Download,
    accentColor: 'from-rose-500 to-pink-600',
    targetArea: 'header',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const StepIcon = currentStep.icon;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

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
                  Paso {currentStepIndex + 1} de {TOUR_STEPS.length}
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
            title="Cerrar recorrido"
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
            <span>Consejos prácticos</span>
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
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-rose-500 shadow-sm shadow-rose-500'
                    : 'w-2 bg-neutral-700 hover:bg-neutral-600'
                }`}
                title={`Ir al paso ${idx + 1}`}
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
                <span>Atrás</span>
              </button>
            )}

            <button
              onClick={handleSkip}
              className="text-xs text-neutral-400 hover:text-white px-2.5 py-2 transition"
            >
              Saltar
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center gap-1.5 transition active:scale-95"
            >
              <span>{isLast ? '¡Empezar a Crear! 🚀' : 'Próximo'}</span>
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
