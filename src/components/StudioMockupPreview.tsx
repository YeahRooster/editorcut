import React from 'react';
import { 
  Play, 
  SkipBack, 
  SkipForward, 
  Sliders, 
  Volume2, 
  Type, 
  Scissors, 
  Maximize2, 
  Sparkles, 
  Folder, 
  Download,
  RotateCcw,
  RotateCw,
  Layers,
  Wand2,
  Video,
  Music,
  Compass
} from 'lucide-react';
import { useI18n } from '../i18n/context';

export const StudioMockupPreview: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Outer Studio Window with Glow and Border */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-neutral-700/80 bg-neutral-950 shadow-2xl shadow-rose-950/20 overflow-hidden ring-1 ring-white/10 select-none">
        {/* Subtle Ambient Background Gradient */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Window Titlebar */}
        <div className="h-10 sm:h-11 bg-neutral-900/90 border-b border-neutral-800 px-3 sm:px-4 flex items-center justify-between gap-2">
          {/* Left: macOS Dots & Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 hover:opacity-80 transition" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 hover:opacity-80 transition" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 hover:opacity-80 transition" />
            </div>
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-neutral-400 pl-2 border-l border-neutral-800">
              <span className="font-bold text-white">EditorCut</span>
              <span className="text-neutral-500">Pro Studio v2.0</span>
            </div>
          </div>

          {/* Center: Tools & Aspect Ratio Toggle Pill */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-[10px] font-semibold text-neutral-300">
              <span className="px-2 py-0.5 rounded bg-neutral-800 text-cyan-400 font-bold border border-cyan-500/30">16:9</span>
              <span className="px-2 py-0.5 text-neutral-400 hover:text-white cursor-pointer">9:16</span>
              <span className="px-2 py-0.5 text-neutral-400 hover:text-white cursor-pointer">1:1</span>
            </div>
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[10px] text-neutral-400">
              <span>Zoom</span>
              <span className="text-white font-mono font-bold">100%</span>
            </div>
          </div>

          {/* Right: History & Export Button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-neutral-400">
              <button className="p-1 hover:text-white rounded hover:bg-neutral-800 transition"><RotateCcw className="w-3 h-3" /></button>
              <button className="p-1 hover:text-white rounded hover:bg-neutral-800 transition"><RotateCw className="w-3 h-3" /></button>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-neutral-950 rounded-lg font-bold text-[11px] shadow-sm shadow-cyan-500/30">
              <Download className="w-3 h-3" />
              <span>Export</span>
            </div>
          </div>
        </div>

        {/* 2. Main Middle Workspace: Tool Rail + Media Bin + Center Stage + Inspector */}
        <div className="grid grid-cols-12 h-64 sm:h-80 md:h-[350px] bg-neutral-950 text-neutral-300">
          
          {/* Vertical Tool Rail */}
          <div className="col-span-1 hidden lg:flex flex-col items-center py-3 border-r border-neutral-800/80 bg-neutral-950/60 gap-4 text-neutral-400">
            <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm" title="Media">
              <Video className="w-4 h-4" />
            </div>
            <div className="p-1.5 hover:text-white hover:bg-neutral-900 rounded-xl transition" title="Text">
              <Type className="w-4 h-4" />
            </div>
            <div className="p-1.5 hover:text-white hover:bg-neutral-900 rounded-xl transition" title="AI Subtitles">
              <Sparkles className="w-4 h-4 text-rose-400" />
            </div>
            <div className="p-1.5 hover:text-white hover:bg-neutral-900 rounded-xl transition" title="Audio & SFX">
              <Music className="w-4 h-4" />
            </div>
            <div className="p-1.5 hover:text-white hover:bg-neutral-900 rounded-xl transition" title="Transitions">
              <Layers className="w-4 h-4" />
            </div>
            <div className="p-1.5 hover:text-white hover:bg-neutral-900 rounded-xl transition" title="Filters & Color">
              <Sliders className="w-4 h-4" />
            </div>
          </div>

          {/* Media Pool / Project Clips Bin */}
          <div className="col-span-4 sm:col-span-3 lg:col-span-3 border-r border-neutral-800/80 bg-neutral-900/40 p-2 sm:p-2.5 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between text-[11px] pb-1 border-b border-neutral-800/60">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Folder className="w-3.5 h-3.5 text-cyan-400" />
                <span>Media Pool</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">6 clips</span>
            </div>

            {/* Media Thumbnails Grid */}
            <div className="grid grid-cols-2 gap-1.5 overflow-hidden">
              {/* Clip 1 */}
              <div className="group relative aspect-video rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 cursor-pointer hover:border-cyan-500/50 transition">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950 via-slate-900 to-indigo-900 opacity-90" />
                <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[8px] font-mono text-cyan-300">00:16</div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                  <Play className="w-3 h-3 text-white fill-white" />
                </div>
              </div>

              {/* Clip 2 */}
              <div className="group relative aspect-video rounded-lg overflow-hidden border border-cyan-500/50 bg-neutral-900 cursor-pointer ring-1 ring-cyan-500/30">
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-950 via-neutral-900 to-sky-900 opacity-90" />
                <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[8px] font-mono text-rose-300">00:10</div>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>

              {/* Clip 3 */}
              <div className="group relative aspect-video rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 cursor-pointer hover:border-cyan-500/50 transition">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-950 via-neutral-900 to-amber-950 opacity-90" />
                <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[8px] font-mono text-purple-300">00:14</div>
              </div>

              {/* Clip 4 */}
              <div className="group relative aspect-video rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 cursor-pointer hover:border-cyan-500/50 transition">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950 via-neutral-900 to-cyan-950 opacity-90" />
                <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 rounded text-[8px] font-mono text-emerald-300">00:08</div>
              </div>

              {/* Clip 5 Audio Track Item */}
              <div className="col-span-2 p-1.5 rounded-lg border border-neutral-800/80 bg-neutral-900/60 flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                  <span className="font-mono text-neutral-300 truncate max-w-[90px]">beat_whoosh.wav</span>
                </div>
                <span className="text-neutral-500 font-mono">00:02</span>
              </div>
            </div>
          </div>

          {/* Center Stage: Live Cinematic Viewport */}
          <div className="col-span-8 sm:col-span-6 lg:col-span-5 flex flex-col justify-between bg-neutral-950 p-2 sm:p-3 relative overflow-hidden">
            {/* Aspect Frame / Cinematic Viewport */}
            <div className="relative flex-1 rounded-xl border border-neutral-800 bg-black overflow-hidden flex items-center justify-center shadow-inner group">
              {/* Cinematic Scene Background Artwork */}
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-slate-900 to-neutral-950" />
              
              {/* Neon Light Tubes (Cyan and Magenta like reference!) */}
              <div className="absolute left-[18%] top-0 bottom-0 w-1.5 bg-cyan-400 shadow-[0_0_20px_#22d3ee]" />
              <div className="absolute left-[26%] top-6 bottom-6 w-1 bg-cyan-300 shadow-[0_0_15px_#67e8f9]" />
              <div className="absolute right-[22%] top-0 bottom-0 w-1.5 bg-rose-500 shadow-[0_0_20px_#f43f5e]" />
              <div className="absolute right-[30%] top-8 bottom-8 w-1 bg-rose-400 shadow-[0_0_15px_#fb7185]" />

              {/* Filmmaker Silhouette SVG Art */}
              <svg className="w-48 sm:w-56 h-auto z-10 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]" viewBox="0 0 200 150" fill="none">
                {/* Silhouette Character with Cap and Cinema Camera Rig */}
                <path d="M75 140 C75 115 85 95 98 85 C93 82 88 75 88 66 C88 54 98 44 110 44 C120 44 128 50 131 59 C138 58 145 61 146 66 L124 70 C125 75 123 81 118 85 C132 95 142 115 142 140 Z" fill="#0f172a" />
                {/* Cinema Camera with Top Monitor & Handles */}
                <rect x="115" y="65" width="40" height="26" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                <rect x="135" y="45" width="22" height="16" rx="2" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.2" />
                {/* Glowing Monitor Screen */}
                <rect x="137" y="47" width="18" height="12" rx="1" fill="#0284c7" />
                <circle cx="146" cy="53" r="2.5" fill="#f43f5e" />
                {/* Matte Box & Lens */}
                <path d="M155 70 L170 62 L170 88 L155 80 Z" fill="#090d16" stroke="#475569" strokeWidth="1" />
                <circle cx="162" cy="75" r="4" fill="#38bdf8" opacity="0.6" />
                {/* Subtle Edge Glows */}
                <path d="M96 85 C88 98 80 115 80 140" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
                <path d="M136 85 C144 98 150 115 150 140" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              </svg>

              {/* Text Behind Person Overlay Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-0 text-center opacity-40">
                <div className="text-2xl sm:text-3xl font-black tracking-widest text-cyan-400 font-mono">CINEMATIC</div>
              </div>

              {/* Live AI Subtitle Box at bottom of preview */}
              <div className="absolute bottom-3 px-3 py-1 rounded-lg bg-black/80 backdrop-blur border border-white/10 text-[10px] text-white font-semibold z-20 flex items-center gap-1.5 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>💬 "Create high-impact videos with EditorCut"</span>
              </div>
            </div>

            {/* Viewport Playback Transport Bar */}
            <div className="flex items-center justify-between pt-1.5 px-1 text-neutral-400 text-[10px]">
              {/* Current Timecode */}
              <div className="font-mono text-cyan-400 font-bold flex items-center gap-1">
                <span>00:14:28</span>
                <span className="text-neutral-600">/</span>
                <span className="text-neutral-400">00:45:00</span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 text-white">
                <button className="p-1 hover:text-cyan-400 transition"><SkipBack className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition shadow-md shadow-cyan-500/40">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <button className="p-1 hover:text-cyan-400 transition"><SkipForward className="w-3.5 h-3.5" /></button>
              </div>

              {/* Fullscreen Icon */}
              <button className="hover:text-white transition">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Inspector / Properties Panel */}
          <div className="col-span-3 hidden sm:flex flex-col border-l border-neutral-800/80 bg-neutral-900/30 p-2 sm:p-2.5 overflow-hidden gap-2">
            {/* Inspector Tabs */}
            <div className="flex items-center justify-between text-[10px] font-bold border-b border-neutral-800 pb-1.5 text-neutral-400">
              <span className="text-cyan-400 border-b border-cyan-400 pb-1 -mb-1.5">Video</span>
              <span className="hover:text-white cursor-pointer">Audio</span>
              <span className="hover:text-white cursor-pointer">Speed</span>
              <span className="hover:text-white cursor-pointer">AI Mask</span>
            </div>

            {/* Sliders & Toggles */}
            <div className="space-y-2 text-[10px]">
              {/* Scale Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Scale</span>
                  <span className="text-white font-mono">100%</span>
                </div>
                <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full w-2/3 bg-cyan-400 rounded-full" />
                </div>
              </div>

              {/* Position X / Y */}
              <div className="grid grid-cols-2 gap-1.5 text-[9px]">
                <div className="p-1 rounded bg-neutral-900 border border-neutral-800 flex justify-between">
                  <span className="text-neutral-500">X</span>
                  <span className="text-white font-mono">0 px</span>
                </div>
                <div className="p-1 rounded bg-neutral-900 border border-neutral-800 flex justify-between">
                  <span className="text-neutral-500">Y</span>
                  <span className="text-white font-mono">0 px</span>
                </div>
              </div>

              {/* AI Features Active Card */}
              <div className="p-2 rounded-xl bg-gradient-to-br from-rose-950/40 to-neutral-900 border border-rose-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 font-bold text-rose-300 text-[10px]">
                    <Wand2 className="w-3 h-3 text-rose-400" />
                    <span>Text Behind Person</span>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[8px] text-neutral-400 leading-tight">
                  Real-time segmentation: AI depth matte active.
                </div>
              </div>

              {/* Color Temperature */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-neutral-400">
                  <span>Color Temp</span>
                  <span className="text-rose-400 font-mono">+6</span>
                </div>
                <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-neutral-700 to-amber-500 relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-[58%] w-2.5 h-2.5 rounded-full bg-white shadow" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Multi-Track Professional Timeline */}
        <div className="border-t border-neutral-800 bg-neutral-950 p-2 sm:p-3 space-y-2">
          {/* Timeline Action Bar with Scissors */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-rose-400 border border-rose-500/30 font-bold transition">
                <Scissors className="w-3 h-3" />
                <span className="text-[10px]">Split</span>
              </button>
              <div className="h-3 w-px bg-neutral-800" />
              <button className="p-1 hover:text-white"><Compass className="w-3 h-3" /></button>
            </div>

            {/* Timecode Ruler Numbers */}
            <div className="hidden sm:flex items-center gap-8 md:gap-12 text-[9px] font-mono text-neutral-500">
              <span>00:00</span>
              <span>00:05</span>
              <span className="text-cyan-400 font-bold">00:14</span>
              <span>00:20</span>
              <span>00:30</span>
              <span>00:40</span>
            </div>

            {/* Zoom Slider */}
            <div className="flex items-center gap-1.5 text-[9px] text-neutral-500">
              <span>-</span>
              <div className="w-14 sm:w-20 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-neutral-500" />
              </div>
              <span>+</span>
            </div>
          </div>

          {/* Tracks Container with Playhead */}
          <div className="relative rounded-xl border border-neutral-800/90 bg-neutral-900/60 p-1.5 space-y-1 overflow-hidden">
            {/* Playhead Needle (Glowing Red/White Line) */}
            <div className="absolute top-0 bottom-0 left-[34%] z-30 pointer-events-none flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -mt-1 shadow-md shadow-rose-500/80" />
              <div className="w-0.5 flex-1 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            </div>

            {/* Track 1: Text & Titles */}
            <div className="h-5 sm:h-6 rounded-lg bg-neutral-950/80 border border-neutral-800 flex items-center px-1 gap-1 text-[8px] font-mono">
              <span className="w-4 text-purple-400 font-bold shrink-0">T1</span>
              <div className="ml-[10%] w-[35%] h-4 rounded bg-purple-500/30 border border-purple-400/50 text-purple-200 px-1.5 flex items-center truncate">
                ✏️ CINEMATIC TITLE (Glow)
              </div>
            </div>

            {/* Track 2: Video Clips Filmstrip with Transitions */}
            <div className="h-9 sm:h-11 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center p-0.5 gap-1 text-[9px]">
              <span className="w-4 text-cyan-400 font-bold font-mono pl-1 shrink-0 text-[8px]">V1</span>
              
              {/* Clip 1 */}
              <div className="w-[30%] h-full rounded bg-gradient-to-r from-cyan-950 to-slate-900 border border-cyan-500/40 p-1 flex items-center justify-between text-cyan-200 truncate">
                <span className="font-semibold text-[8px]">Scene_01.mp4</span>
              </div>

              {/* Transition FX Badge */}
              <div className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[7px] font-bold">
                ⟷
              </div>

              {/* Clip 2 (Active under playhead) */}
              <div className="w-[38%] h-full rounded bg-gradient-to-r from-slate-900 to-indigo-950 border-2 border-cyan-400 p-1 flex items-center justify-between text-white shadow-md shadow-cyan-500/20 truncate">
                <span className="font-bold text-[8px]">Neon_Filmmaker.mov</span>
                <span className="text-[7px] text-cyan-300 font-mono">4K 60fps</span>
              </div>

              {/* Transition FX Badge */}
              <div className="px-1 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[7px] font-bold">
                ⟷
              </div>

              {/* Clip 3 */}
              <div className="flex-1 h-full rounded bg-gradient-to-r from-slate-900 to-neutral-950 border border-neutral-700/60 p-1 flex items-center text-neutral-400 truncate">
                <span className="text-[8px]">Outro_Hero.mp4</span>
              </div>
            </div>

            {/* Track 3: Audio Waveform */}
            <div className="h-6 sm:h-7 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center px-1 gap-1 text-[8px] font-mono">
              <span className="w-4 text-emerald-400 font-bold shrink-0">A1</span>
              {/* Audio Waveform SVG Track */}
              <div className="flex-1 h-4 sm:h-5 rounded bg-emerald-950/40 border border-emerald-500/30 overflow-hidden flex items-center px-1">
                <svg className="w-full h-full text-emerald-400 opacity-80" preserveAspectRatio="none" viewBox="0 0 400 20">
                  <path d="M0 10 Q 10 2, 20 10 T 40 10 T 60 4 T 80 10 T 100 16 T 120 10 T 140 2 T 160 10 T 180 18 T 200 10 T 220 2 T 240 10 T 260 16 T 280 10 T 300 4 T 320 10 T 340 18 T 360 10 T 380 4 T 400 10" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M0 10 Q 10 6, 20 10 T 40 10 T 60 7 T 80 10 T 100 13 T 120 10 T 140 6 T 160 10 T 180 14 T 200 10 T 220 6 T 240 10 T 260 13 T 280 10 T 300 7 T 320 10 T 340 14 T 360 10 T 380 7 T 400 10" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. The 3 Sleek Cards Beneath Mockup (Import / Edit / Export) matching the user's reference! */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
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
