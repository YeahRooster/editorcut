import React, { useState } from 'react';
import type { AspectRatio } from '../types';
import { 
  Video, 
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
  const [skipLanding, setSkipLanding] = useState<boolean>(() => {
    return localStorage.getItem('simplecut_skip_landing') === 'true';
  });

  const handleToggleSkip = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setSkipLanding(val);
    if (val) {
      localStorage.setItem('simplecut_skip_landing', 'true');
    } else {
      localStorage.removeItem('simplecut_skip_landing');
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-100 font-sans selection:bg-rose-500 selection:text-white flex flex-col justify-between overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="h-16 sm:h-20 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white">SimpleCut Studio</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                Gratis & Sin Registro
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">Editor de video inteligente en tu navegador</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onStartTour}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded-xl transition"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>Tutorial Guiado</span>
          </button>

          <button
            onClick={onOpenProjects}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900 border border-neutral-800 rounded-xl transition"
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Proyectos</span>
          </button>

          <button
            onClick={() => onOpenEditor()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-rose-950/40 transition active:scale-95"
          >
            <span>Abrir Editor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 sm:py-16 space-y-16 sm:space-y-24">
        {/* Hero Top Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Edita videos en tu navegador sin instalar ninguna aplicación</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Crea videos virales <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                en minutos y con estilo IA
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Recorta clips, añade subtítulos con inteligencia artificial, aplica el efecto viral de <span className="text-neutral-200 font-semibold">texto detrás de la persona</span>, portadas editoriales y exporta en 4K o 1080p directamente desde tu navegador.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <button
                onClick={() => onOpenEditor()}
                className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-2xl shadow-rose-950/60 flex items-center gap-2 transition transform hover:scale-[1.02] active:scale-95"
              >
                <span>Comenzar a Editar Gratis</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onStartTour}
                className="px-5 sm:px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-sm sm:text-base rounded-2xl border border-neutral-800 hover:border-neutral-700 flex items-center gap-2 transition active:scale-95"
              >
                <PlayCircle className="w-5 h-5 text-rose-400" />
                <span>Ver Recorrido Guiado</span>
              </button>
            </div>

            {/* Quick Format Selector Cards */}
            <div className="pt-4">
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                O elige tu formato para empezar:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Vertical 9:16 */}
                <button
                  onClick={() => onOpenEditor('9:16')}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-rose-500/50 text-left transition group"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">Vertical (9:16)</div>
                  <div className="text-[11px] text-neutral-400">Reels, TikTok, Shorts</div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">1080 × 1920</div>
                </button>

                {/* Horizontal 16:9 */}
                <button
                  onClick={() => onOpenEditor('16:9')}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-sky-500/50 text-left transition group"
                >
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">Horizontal (16:9)</div>
                  <div className="text-[11px] text-neutral-400">YouTube, Vimeo, Web</div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">1920 × 1080</div>
                </button>

                {/* Square 1:1 */}
                <button
                  onClick={() => onOpenEditor('1:1')}
                  className="p-3.5 rounded-2xl bg-neutral-900/90 hover:bg-neutral-800/90 border border-neutral-800 hover:border-amber-500/50 text-left transition group"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition">
                    <Square className="w-4 h-4" />
                  </div>
                  <div className="font-bold text-white text-xs sm:text-sm">Cuadrado (1:1)</div>
                  <div className="text-[11px] text-neutral-400">Instagram Feed, Ads</div>
                  <div className="text-[10px] text-neutral-500 mt-1 font-mono">1080 × 1080</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Studio Mockup Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900/80 shadow-2xl shadow-rose-950/20 p-2 sm:p-3">
              <div className="rounded-2xl overflow-hidden relative aspect-[4/3] bg-neutral-950 flex items-center justify-center border border-neutral-800/80">
                {/* Visual Graphic Representation of Studio */}
                <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950 via-neutral-900 to-rose-950/30 flex flex-col justify-between p-4">
                  {/* Mock toolbar */}
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                      <span className="text-[10px] text-neutral-400 font-mono ml-2">SimpleCut Studio v2.0</span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      LIVE PREVIEW
                    </span>
                  </div>

                  {/* Mock Video Canvas in Center */}
                  <div className="self-center w-32 sm:w-40 aspect-[9/16] rounded-xl border border-neutral-700/80 bg-neutral-900 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center p-2">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    <Sparkles className="w-6 h-6 text-rose-400 mb-1 z-10 animate-pulse" />
                    <div className="text-[11px] font-black tracking-wider uppercase text-white z-10">TEXTO DETRÁS</div>
                    <div className="text-[9px] text-rose-300 font-bold z-10">DE PERSONA</div>
                    <div className="absolute bottom-2 left-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[8px] text-neutral-300 z-10 truncate">
                      💬 Subtítulos con IA
                    </div>
                  </div>

                  {/* Mock Timeline at bottom */}
                  <div className="border-t border-neutral-800/80 pt-2 space-y-1">
                    <div className="h-3 rounded bg-sky-500/30 border border-sky-400/40 text-[7px] text-sky-200 px-1.5 flex items-center">
                      🎬 Video Principal (15.0s)
                    </div>
                    <div className="h-3 rounded bg-purple-500/30 border border-purple-400/40 text-[7px] text-purple-200 px-1.5 flex items-center">
                      ✏️ Título Animado • Fade In
                    </div>
                    <div className="h-3 rounded bg-amber-500/30 border border-amber-400/40 text-[7px] text-amber-200 px-1.5 flex items-center">
                      💬 Subtítulos de Voz Sincronizados
                    </div>
                    <div className="h-3 rounded bg-emerald-500/30 border border-emerald-400/40 text-[7px] text-emerald-200 px-1.5 flex items-center">
                      🎵 Audio & Efecto Whoosh
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Pills under mockup */}
              <div className="grid grid-cols-3 gap-2 mt-2.5 pt-1 text-center">
                <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
                  <div className="text-xs font-bold text-white">1. Importar</div>
                  <div className="text-[10px] text-neutral-400">Video, foto o audio</div>
                </div>
                <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
                  <div className="text-xs font-bold text-white">2. Editar</div>
                  <div className="text-[10px] text-neutral-400">Corte y estilos IA</div>
                </div>
                <div className="p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
                  <div className="text-xs font-bold text-white">3. Exportar</div>
                  <div className="text-[10px] text-neutral-400">4K y 1080p a 60 FPS</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid ("Lo que hace SimpleCut") */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400">Capacidades del Estudio</h2>
            <h3 className="text-2xl sm:text-4xl font-black text-white">
              Herramientas de edición profesional listas para publicar
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              Diseñado para creadores de contenido que buscan velocidad, estética limpia y máxima comodidad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Scissors className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Línea de tiempo multipista</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Edita capas separadas de video, títulos animados, subtítulos, efectos de sonido y marca de agua con tijera ✂️ precisa y control táctil.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Texto Detrás de Persona</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Segmentación inteligente por IA en tiempo real. Coloca títulos gigantes detrás del sujeto sin necesidad de pantalla verde.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Mic className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Subtítulos con IA (0 Tokens)</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Transcribe tu voz directamente a texto con perfecta sincronización temporal y sin gastar créditos en servidores de terceros.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                <Type className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Portada Editorial & Tipografías</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Estilo estético limpio tipo revista moderna con fuentes cinematográficas (Bebas Neue, Montserrat, Impact, Playfair).
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Efectos de Sonido & Música</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Sintetizador integrado con efectos instantáneos (Whoosh, Risas, Notificación, Campana, Aplausos) y temas de fondo con auto-ducking.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-6 rounded-3xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Exportación 4K / 1080p a 60 FPS</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Renderiza en alta fidelidad a 60 cuadros por segundo en MP4 progresivo compatible con Windows, Mac, iOS y Android sin micro-lags.
              </p>
            </div>
          </div>
        </section>

        {/* 5 Simple Steps Section */}
        <section className="p-8 sm:p-12 rounded-3xl bg-neutral-900/40 border border-neutral-800 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Flujo de Trabajo</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Crea tu video en 5 simples pasos
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl mx-auto">
              Todo el proceso está diseñado para que no pierdas tiempo y tengas tu video listo para publicar en minutos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-black flex items-center justify-center">
                1
              </div>
              <h5 className="font-bold text-sm text-white">Importa Medios</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Arrastra cualquier video, foto o audio desde tu computadora o celular.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-black flex items-center justify-center">
                2
              </div>
              <h5 className="font-bold text-sm text-white">Corta y Ordena</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Divide con la tijera ✂️ y acomoda los clips en la pista de video como desees.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-black flex items-center justify-center">
                3
              </div>
              <h5 className="font-bold text-sm text-white">Aplica Estilos</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Elige Portada Editorial o Texto Detrás de la Persona con animaciones fluidas.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black flex items-center justify-center">
                4
              </div>
              <h5 className="font-bold text-sm text-white">Voz y Sonido</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Genera subtítulos automáticos y añade efectos de sonido en puntos de impacto.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black flex items-center justify-center">
                5
              </div>
              <h5 className="font-bold text-sm text-white">Exporta en 4K</h5>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Descarga en MP4 a 60 FPS sin marcas de agua ni suscripciones.
              </p>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => onOpenEditor()}
              className="px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-950/50 transition transform hover:scale-105 active:scale-95"
            >
              Comenzar Ahora en el Editor
            </button>
          </div>
        </section>

        {/* Local & Private Badge Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-800/60">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/50">
            <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">100% Privado y Local</div>
              <div className="text-[11px] text-neutral-400">Tus archivos nunca salen de tu dispositivo</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/50">
            <Cpu className="w-6 h-6 text-sky-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Aceleración por GPU</div>
              <div className="text-[11px] text-neutral-400">Renderizado rápido con WebAssembly</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-900/30 border border-neutral-800/50">
            <Zap className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white">Sin Marcas de Agua</div>
              <div className="text-[11px] text-neutral-400">Totalmente libre y sin limitaciones</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Skip Landing Toggle */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-xs">
            S
          </div>
          <span>SimpleCut Studio • Editor de video web para creadores</span>
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
            Saltar la pantalla de inicio siempre (ir directo al editor)
          </span>
        </label>
      </footer>
    </div>
  );
};
