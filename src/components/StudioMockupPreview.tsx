import React from 'react';
import { 
  Video, 
  Smartphone, 
  Square, 
  Monitor, 
  Sparkles, 
  Download, 
  FolderOpen, 
  Save, 
  Mic, 
  Scissors, 
  Type, 
  Volume2, 
  Layers, 
  Image as ImageIcon,
  Pause,
  Copy,
  ClipboardPaste,
  Trash2,
  Check,
  ChevronLeft
} from 'lucide-react';
import { useI18n } from '../i18n/context';
import { LogoIcon } from './LogoIcon';

export const StudioMockupPreview: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Outer Studio Window Shell */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-rose-950/20 overflow-hidden ring-1 ring-white/10 select-none">
        
        {/* Ambient Backlight Glows */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header (Exact replica of our app's top bar) */}
        <div className="h-12 sm:h-14 border-b border-neutral-800 bg-neutral-900/95 backdrop-blur px-3 sm:px-5 flex items-center justify-between z-20 gap-2">
          {/* Brand & Badge */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* macOS dots */}
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>

            <LogoIcon className="w-6 h-6 sm:w-7 sm:h-7 text-rose-500 drop-shadow-[0_2px_8px_rgba(225,29,72,0.4)] flex-shrink-0" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white">
                EditorCut<span className="hidden sm:inline"> Studio</span>
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                EDICIÓN FÁCIL 👴👌
              </span>
              <span className="hidden xl:inline-block px-2 py-0.5 text-[10px] font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-lg">
                📁 Mi Video
              </span>
            </div>
          </div>

          {/* Center: Aspect Ratio Picker */}
          <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-0.5 gap-0.5 shadow-inner">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold bg-rose-600 text-white shadow-md shadow-rose-950/40">
              <Smartphone className="w-3 h-3" />
              <span>Reels</span>
            </div>
            <div className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-neutral-400">
              <Square className="w-3 h-3" />
              <span>Post</span>
            </div>
            <div className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-neutral-400">
              <Monitor className="w-3 h-3" />
              <span>YouTube</span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-neutral-800 text-neutral-300 text-[10px] font-semibold rounded-lg border border-neutral-700">
              <FolderOpen className="w-3 h-3 text-neutral-400" />
              <span>Proyectos</span>
            </div>
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-neutral-800 text-neutral-300 text-[10px] font-semibold rounded-lg border border-neutral-700">
              <Save className="w-3 h-3 text-neutral-400" />
              <span>Guardar</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-neutral-800 text-neutral-300 text-[10px] font-semibold rounded-lg border border-neutral-700">
              <Mic className="w-3 h-3 text-neutral-400" />
              <span>Voz a Texto</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-3 py-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] sm:text-xs font-bold rounded-lg shadow-md shadow-rose-500/30">
              <Download className="w-3 h-3" />
              <span>Exportar</span>
            </div>
          </div>
        </div>

        {/* 2. Main Middle Stage: Left Control Drawer + Center Stage Canvas */}
        <div className="grid grid-cols-12 h-80 sm:h-96 md:h-[420px] bg-neutral-950">
          
          {/* LeftSidebar Panel (Active on "Estilos") */}
          <div className="col-span-5 sm:col-span-4 lg:col-span-4 border-r border-neutral-800 bg-neutral-900/60 flex flex-col overflow-hidden">
            {/* Top Sidebar Tab Icons */}
            <div className="h-10 border-b border-neutral-800/80 px-2 flex items-center justify-between bg-neutral-950/70">
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="p-1 text-neutral-400 hover:text-white" title="Medios">
                  <Video className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold">
                  <Type className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Estilos</span>
                </div>
                <div className="p-1 text-neutral-400" title="Voz/Texto">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div className="p-1 text-neutral-400" title="Sonido">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
                <div className="p-1 text-neutral-400" title="Logo">
                  <ImageIcon className="w-3.5 h-3.5" />
                </div>
              </div>
              <ChevronLeft className="w-3 h-3 text-neutral-500" />
            </div>

            {/* Panel Content (Populated with Creator Style Data) */}
            <div className="p-2 sm:p-3 space-y-2.5 overflow-hidden text-left">
              <div className="flex items-center justify-between pb-1 border-b border-neutral-800/60">
                <span className="text-[11px] font-bold text-white">Títulos & Textos Animados</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  + Título
                </span>
              </div>

              {/* 4 Visual Style Cards (Detrás de la persona SELECTED) */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase text-neutral-400 tracking-wider">
                  Estilo Visual Seleccionado
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* Option 1: Detrás de la persona (ACTIVE) */}
                  <div className="p-1.5 rounded-xl bg-rose-500/15 border-2 border-rose-500 text-white relative shadow-md shadow-rose-950/30">
                    <div className="flex items-center justify-between">
                      <Layers className="w-3.5 h-3.5 text-rose-400" />
                      <Check className="w-3 h-3 text-rose-400" />
                    </div>
                    <div className="font-black text-[10px] text-white mt-1 leading-tight">Detrás de persona</div>
                    <div className="text-[8px] text-rose-300 truncate">IA Cutout Activo 🟢</div>
                  </div>

                  {/* Option 2: Portada Editorial */}
                  <div className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
                    <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                    <div className="font-bold text-[10px] text-neutral-300 mt-1 leading-tight">Portada Editorial</div>
                    <div className="text-[8px] text-neutral-500 truncate">Estética Vogue</div>
                  </div>

                  {/* Option 3: Subtítulo Karaoke */}
                  <div className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
                    <Type className="w-3.5 h-3.5 text-neutral-500" />
                    <div className="font-bold text-[10px] text-neutral-300 mt-1 leading-tight">Subtítulo Karaoke</div>
                    <div className="text-[8px] text-neutral-500 truncate">Resaltado enérgico</div>
                  </div>

                  {/* Option 4: Subtítulo Clásico */}
                  <div className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
                    <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
                    <div className="font-bold text-[10px] text-neutral-300 mt-1 leading-tight">Subtítulo Clásico</div>
                    <div className="text-[8px] text-neutral-500 truncate">Limpio y formal</div>
                  </div>
                </div>
              </div>

              {/* Form Input 1: Frase Principal (Filled!) */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-neutral-400">Frase Principal (Título)</span>
                <div className="px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] font-black text-rose-400 tracking-wider">
                  CINEMATIC LOOK
                </div>
              </div>

              {/* Form Input 2: Subtítulo Secundario */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-neutral-400">Lema / Subtítulo</span>
                <div className="px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-[9px] text-neutral-300 truncate">
                  Grabación profesional 4K
                </div>
              </div>

              {/* Settings Pill Badges */}
              <div className="pt-0.5 flex flex-wrap gap-1 text-[8px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">Fuente: Bebas Neue</span>
                <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">Posición: Y=35%</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">IA 100% Local</span>
              </div>
            </div>
          </div>

          {/* Center Stage: Live Vertical Canvas (With Loaded Professional Creator Video) */}
          <div className="col-span-7 sm:col-span-8 lg:col-span-8 flex flex-col justify-between items-center bg-neutral-950 p-2 sm:p-3 relative overflow-hidden">
            
            {/* The 9:16 Smartphone Video Preview Canvas */}
            <div className="relative w-40 sm:w-48 md:w-56 aspect-[9/16] rounded-2xl border-2 border-neutral-800 bg-neutral-950 shadow-2xl shadow-black overflow-hidden flex flex-col justify-between items-center group">
              
              {/* Cinematic Video Footage (Master Session Camera Operator) */}
              <img
                src="/cinematic-cameraman.jpg"
                alt="Cinematic Camera Session"
                className="absolute inset-0 w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-700"
              />

              {/* Cinematic Vignette / Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/50 pointer-events-none" />

              {/* Top Status Bar: REC 4K + Timecode */}
              <div className="relative z-10 w-full pt-2.5 px-2.5 flex items-center justify-between text-[8px] font-mono text-white/90">
                <span className="flex items-center gap-1 bg-rose-600/90 text-white font-bold px-1.5 py-0.5 rounded shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> REC 4K
                </span>
                <span className="bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10 text-neutral-300">
                  00:04:12
                </span>
              </div>

              {/* Center / Lower Overlay: Cinematic Title & Dynamic Subtitles */}
              <div className="relative z-10 w-full pb-3 px-2 flex flex-col items-center gap-1.5 pointer-events-none">
                <div className="text-center">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-rose-500/40 text-[9px] font-black tracking-wider text-rose-400">
                    CINEMATIC LOOK
                  </span>
                </div>
                {/* Dynamic Subtitle */}
                <div className="w-full px-2 py-1 rounded-xl bg-black/80 backdrop-blur-md border border-neutral-700/80 text-[8px] sm:text-[9px] text-white font-bold shadow-2xl text-center">
                  <span>⚡ Grabación profesional </span>
                  <span className="text-amber-300 bg-amber-500/30 px-1 py-0.5 rounded border border-amber-400/50">4K DCI</span>
                </div>
              </div>
            </div>

            {/* Floating Transport Bar under Canvas (Exact replica of our app) */}
            <div className="w-full max-w-sm flex items-center justify-between bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-2xl shadow-xl mt-1 text-[10px]">
              {/* Play Button */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-950/60 cursor-pointer">
                  <Pause className="w-3.5 h-3.5 fill-white" />
                </div>
                <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
              </div>

              {/* Timecode */}
              <div className="font-mono text-white font-bold flex items-center gap-1 text-[11px]">
                <span className="text-rose-400">00:04.2</span>
                <span className="text-neutral-600">/</span>
                <span className="text-neutral-400">00:15.0</span>
              </div>

              {/* Scrub Slider Bar */}
              <div className="w-20 sm:w-28 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full w-[28%] bg-rose-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Multi-Track Timeline (Exact replica of our app's Timeline) */}
        <div className="border-t border-neutral-800 bg-neutral-950 p-2 sm:p-2.5 space-y-1.5 text-left">
          {/* Timeline Action Toolbar */}
          <div className="flex items-center justify-between text-[10px] text-neutral-300 pb-1 border-b border-neutral-800/80">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold">
                <Scissors className="w-3 h-3 text-rose-400" />
                <span>Cortar</span>
              </div>
              <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                <span>+ Video</span>
              </div>
              <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                <span>+ Sonido</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                <span>+ Título</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                <span>+ Sub</span>
              </div>
              <Copy className="w-3 h-3 text-neutral-500 hidden md:inline" />
              <ClipboardPaste className="w-3 h-3 text-neutral-500 hidden md:inline" />
              <Trash2 className="w-3 h-3 text-neutral-500 hidden md:inline" />
            </div>

            {/* Timecode on right */}
            <div className="font-mono text-neutral-400 text-[10px]">
              <span className="text-white font-bold">00:04.2</span> / 00:15.0
            </div>
          </div>

          {/* Real Tracks Container with Active Playhead */}
          <div className="relative rounded-xl border border-neutral-800/90 bg-neutral-900/50 p-1.5 space-y-1 overflow-hidden">
            
            {/* Playhead Scrubber (Red Vertical Needle at 00:04.2) */}
            <div className="absolute top-0 bottom-0 left-[28%] z-30 pointer-events-none flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -mt-1 shadow-md shadow-rose-500/80" />
              <div className="w-0.5 flex-1 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            </div>

            {/* Track 1: Pista de Video */}
            <div className="h-7 sm:h-8 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center p-0.5 gap-1 text-[9px]">
              <span className="w-16 sm:w-20 text-neutral-400 font-bold truncate pl-1 flex-shrink-0 text-[8px]">
                🎬 Video
              </span>
              
              {/* Video Clip 1 (Active) */}
              <div className="w-[42%] h-full rounded bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border-2 border-rose-500/80 p-1 flex items-center justify-between text-rose-200 truncate shadow-sm">
                <span className="font-bold text-[8px]">Cinematic_Film_Session.mp4</span>
                <span className="text-[7px] text-rose-400 font-mono">6.5s</span>
              </div>

              {/* Scissors Cut Marker */}
              <div className="h-full w-px bg-rose-500 flex items-center justify-center">
                <span className="text-[8px] -ml-2 text-rose-400">✂️</span>
              </div>

              {/* Video Clip 2 */}
              <div className="flex-1 h-full rounded bg-gradient-to-r from-slate-900 to-neutral-950 border border-neutral-700/60 p-1 flex items-center justify-between text-neutral-400 truncate">
                <span className="text-[8px]">B-Roll_Studio_Lights.mp4</span>
                <span className="text-[7px] font-mono">8.5s</span>
              </div>
            </div>

            {/* Track 2: Pista de Títulos */}
            <div className="h-5 sm:h-6 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center p-0.5 gap-1 text-[8px]">
              <span className="w-16 sm:w-20 text-purple-400 font-bold truncate pl-1 flex-shrink-0">
                ✏️ Títulos
              </span>
              <div className="ml-[2%] w-[45%] h-full rounded bg-purple-500/30 border border-purple-400/60 text-purple-200 px-1.5 flex items-center justify-between truncate shadow-sm">
                <span className="font-bold">CINEMATIC LOOK (Grading & FX)</span>
                <span className="text-[7px] text-purple-300">0.5s - 7.0s</span>
              </div>
            </div>

            {/* Track 3: Pista de Subtítulos */}
            <div className="h-5 sm:h-6 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center p-0.5 gap-1 text-[8px]">
              <span className="w-16 sm:w-20 text-amber-400 font-bold truncate pl-1 flex-shrink-0">
                💬 Subtítulos
              </span>
              <div className="ml-[4%] w-[26%] h-full rounded bg-amber-500/25 border border-amber-400/50 text-amber-200 px-1 flex items-center truncate">
                "Grabación profesional..."
              </div>
              <div className="ml-[2%] w-[32%] h-full rounded bg-amber-500/25 border border-amber-400/50 text-amber-200 px-1 flex items-center truncate">
                "en resolución 4K DCI..."
              </div>
            </div>

            {/* Track 4: Pista de Sonido (Waveform + SFX Whoosh) */}
            <div className="h-5 sm:h-6 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center p-0.5 gap-1 text-[8px]">
              <span className="w-16 sm:w-20 text-emerald-400 font-bold truncate pl-1 flex-shrink-0">
                🎵 Sonido
              </span>
              {/* Whoosh Impact Pill */}
              <div className="ml-[3%] w-[12%] h-full rounded bg-amber-500/40 border border-amber-400/60 text-amber-200 px-1 flex items-center justify-center font-bold text-[7px] truncate">
                🔊 Whoosh
              </div>
              {/* Background Music Waveform */}
              <div className="flex-1 h-full rounded bg-emerald-950/40 border border-emerald-500/40 overflow-hidden flex items-center px-1">
                <svg className="w-full h-3 text-emerald-400 opacity-90" preserveAspectRatio="none" viewBox="0 0 300 12">
                  <path d="M0 6 Q 10 1, 20 6 T 40 6 T 60 2 T 80 6 T 100 10 T 120 6 T 140 1 T 160 6 T 180 11 T 200 6 T 220 1 T 240 6 T 260 10 T 280 6 T 300 6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. The 3 Sleek Cards Beneath Mockup (Import / Edit / Export) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1 text-left">
        {/* Card 1: Importar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/90 hover:border-neutral-700 transition shadow-lg space-y-1">
          <div className="text-base sm:text-lg font-black text-white">
            {t.landing.pillar1Title}
          </div>
          <div className="text-xs sm:text-sm text-neutral-400">
            {t.landing.pillar1Desc}
          </div>
        </div>

        {/* Card 2: Editar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/90 hover:border-neutral-700 transition shadow-lg space-y-1">
          <div className="text-base sm:text-lg font-black text-white">
            {t.landing.pillar2Title}
          </div>
          <div className="text-xs sm:text-sm text-neutral-400">
            {t.landing.pillar2Desc}
          </div>
        </div>

        {/* Card 3: Exportar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/90 hover:border-neutral-700 transition shadow-lg space-y-1">
          <div className="text-base sm:text-lg font-black text-white">
            {t.landing.pillar3Title}
          </div>
          <div className="text-xs sm:text-sm text-neutral-400">
            {t.landing.pillar3Desc}
          </div>
        </div>
      </div>
    </div>
  );
};
