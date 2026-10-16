import React, { useRef, useEffect } from 'react';
import type { 
  ComicConfig, 
  ComicLayoutType, 
  ComicPanelAnimation, 
  ComicPanelItem, 
  ComicPage, 
  ComicPageTransition, 
  VideoClip 
} from '../types';
import { 
  COMIC_PRESET_OPTIONS, 
  applyComicLayoutPreset,
  getPanelPositionInfo,
  createComicPage,
  ensureComicConfigPages
} from '../utils/comicPresets';
import { 
  LayoutGrid, 
  Columns2, 
  Upload, 
  Film, 
  Image as ImageIcon, 
  Volume2, 
  VolumeX, 
  Clock, 
  Check, 
  Layers, 
  Palette,
  ArrowUp,
  ArrowDown,
  Repeat,
  HelpCircle,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';

interface ComicPanelsTabProps {
  comicConfig: ComicConfig;
  setComicConfig: React.Dispatch<React.SetStateAction<ComicConfig>>;
  videoClips: VideoClip[];
  currentTime: number;
  duration?: number;
  onSeek?: (time: number) => void;
  selectedPanelId?: string | null;
  setSelectedPanelId?: (id: string | null) => void;
}

const BORDER_COLORS = [
  { label: 'Negro Cómic', value: '#000000' },
  { label: 'Blanco', value: '#ffffff' },
  { label: 'Rosa Magenta', value: '#f43f5e' },
  { label: 'Amarillo Pop', value: '#facc15' },
  { label: 'Azul Neón', value: '#06b6d4' },
];

const PAGE_TRANSITIONS: { id: ComicPageTransition; label: string; desc: string; icon: string }[] = [
  { id: 'slide_left', label: '📖 Deslizar Izquierda (Cómic)', desc: 'Pasa a la siguiente página deslizándose hacia la izquierda', icon: '⬅️' },
  { id: 'slide_right', label: '➡️ Deslizar Derecha', desc: 'Deslizamiento hacia la derecha', icon: '➡️' },
  { id: 'slide_up', label: '⬆️ Deslizar Arriba', desc: 'Deslizamiento vertical ascendente', icon: '⬆️' },
  { id: 'crossfade', label: '✨ Disolución Suave', desc: 'Transición suave de fundido cruzado', icon: '✨' },
  { id: 'fade_black', label: '⚫ Fundido a Negro', desc: 'Fundido pasando por negro cinematográfico', icon: '⚫' },
  { id: 'none', label: '✂️ Corte Directo', desc: 'Cambio instantáneo sin animación', icon: '✂️' },
];

export const ComicPanelsTab: React.FC<ComicPanelsTabProps> = ({
  comicConfig,
  setComicConfig,
  videoClips,
  currentTime,
  duration = 30,
  onSeek,
  selectedPanelId,
  setSelectedPanelId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadPanelIdRef = useRef<string | null>(null);

  // Initialize pages if enabled but missing
  useEffect(() => {
    if (comicConfig.enabled && (!comicConfig.pages || comicConfig.pages.length === 0)) {
      setComicConfig((prev) => ensureComicConfigPages(prev, videoClips, duration));
    }
  }, [comicConfig.enabled, videoClips, duration, setComicConfig]);

  // Safe resolution of pages and active page
  const pages: ComicPage[] = comicConfig.pages && comicConfig.pages.length > 0
    ? comicConfig.pages
    : (comicConfig.enabled ? ensureComicConfigPages(comicConfig, videoClips, duration).pages || [] : []);

  const activePageIndex = Math.max(0, Math.min(comicConfig.activePageIndex ?? 0, Math.max(0, pages.length - 1)));
  const activePage: ComicPage | undefined = pages[activePageIndex];

  // Toggle main feature
  const handleToggleEnable = () => {
    if (!comicConfig.enabled) {
      const initialized = ensureComicConfigPages({ ...comicConfig, enabled: true }, videoClips, duration);
      setComicConfig(initialized);
      if (initialized.pages && initialized.pages[0]?.panels.length > 0 && setSelectedPanelId) {
        setSelectedPanelId(initialized.pages[0].panels[0].id);
      }
    } else {
      setComicConfig((prev) => ({ ...prev, enabled: false }));
    }
  };

  // Add new page to the comic sequence
  const handleAddPage = () => {
    const lastPage = pages[pages.length - 1];
    const newStart = lastPage 
      ? Math.round((lastPage.start + (lastPage.duration > 0 ? lastPage.duration : 15)) * 10) / 10 
      : 0;

    // Use strip_3_horiz or match previous layout
    const defaultLayout: ComicLayoutType = lastPage?.layout && lastPage.layout !== 'none' 
      ? lastPage.layout 
      : 'strip_3_horiz';

    const newPage = createComicPage(pages.length, newStart, 15, defaultLayout, videoClips);
    const updatedPages = [...pages, newPage];

    setComicConfig((prev) => ({
      ...prev,
      enabled: true,
      pages: updatedPages,
      activePageIndex: updatedPages.length - 1,
      layout: newPage.layout,
      panels: newPage.panels,
    }));

    if (onSeek) onSeek(newStart);
    if (setSelectedPanelId && newPage.panels.length > 0) {
      setSelectedPanelId(newPage.panels[0].id);
    }
  };

  // Select a page tab
  const handleSelectPage = (idx: number) => {
    const targetPage = pages[idx];
    if (!targetPage) return;

    setComicConfig((prev) => ({
      ...prev,
      activePageIndex: idx,
      layout: targetPage.layout,
      panels: targetPage.panels,
    }));

    if (onSeek) onSeek(targetPage.start);
    if (setSelectedPanelId && targetPage.panels.length > 0) {
      setSelectedPanelId(targetPage.panels[0].id);
    }
  };

  // Delete a page
  const handleDeletePage = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length <= 1) return;

    const updatedPages = pages.filter((_, i) => i !== idx);
    const newIdx = Math.max(0, Math.min(activePageIndex >= idx ? activePageIndex - 1 : activePageIndex, updatedPages.length - 1));
    const newActive = updatedPages[newIdx];

    setComicConfig((prev) => ({
      ...prev,
      pages: updatedPages,
      activePageIndex: newIdx,
      layout: newActive.layout,
      panels: newActive.panels,
    }));

    if (onSeek) onSeek(newActive.start);
    if (setSelectedPanelId && newActive.panels.length > 0) {
      setSelectedPanelId(newActive.panels[0].id);
    }
  };

  // Duplicate an existing page
  const handleDuplicatePage = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const source = pages[idx];
    if (!source) return;

    const lastPage = pages[pages.length - 1];
    const newStart = lastPage 
      ? Math.round((lastPage.start + (lastPage.duration > 0 ? lastPage.duration : 15)) * 10) / 10 
      : source.start + source.duration;

    const duplicatedPage: ComicPage = {
      ...source,
      id: `comic-page-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${source.name} (Copia)`,
      start: newStart,
      panels: source.panels.map((p, pIdx) => ({
        ...p,
        id: `dup-${Date.now()}-${pIdx}-${p.id}`,
      })),
    };

    const updatedPages = [...pages, duplicatedPage];

    setComicConfig((prev) => ({
      ...prev,
      pages: updatedPages,
      activePageIndex: updatedPages.length - 1,
      layout: duplicatedPage.layout,
      panels: duplicatedPage.panels,
    }));

    if (onSeek) onSeek(newStart);
  };

  // Update properties of the currently active page
  const updateActivePage = (updates: Partial<ComicPage>) => {
    setComicConfig((prev) => {
      const currentPages = prev.pages && prev.pages.length > 0 ? [...prev.pages] : [...pages];
      const page = currentPages[activePageIndex];
      if (!page) return prev;

      const updatedPage = { ...page, ...updates };
      currentPages[activePageIndex] = updatedPage;

      return {
        ...prev,
        pages: currentPages,
        panels: updatedPage.panels,
        layout: updatedPage.layout,
      };
    });
  };

  // Change layout preset for the active page
  const handleSelectPreset = (layout: ComicLayoutType) => {
    const updated = applyComicLayoutPreset(layout, comicConfig, videoClips, activePageIndex);
    setComicConfig(updated);
    const activePanels = updated.pages && updated.pages[activePageIndex]?.panels;
    if (activePanels && activePanels.length > 0 && setSelectedPanelId) {
      setSelectedPanelId(activePanels[0].id);
    }
  };

  // Update a single panel inside the active page
  const updatePanel = (panelId: string, updates: Partial<ComicPanelItem>) => {
    setComicConfig((prev) => {
      const currentPages = prev.pages && prev.pages.length > 0 ? [...prev.pages] : [...pages];
      const page = currentPages[activePageIndex];
      if (!page) return prev;

      const updatedPanels = page.panels.map((p) => (p.id === panelId ? { ...p, ...updates } : p));
      const updatedPage = { ...page, panels: updatedPanels };
      currentPages[activePageIndex] = updatedPage;

      return {
        ...prev,
        pages: currentPages,
        panels: updatedPanels,
      };
    });
  };

  // Swap media and audio settings between two panel slots in the active page
  const handleSwapPanels = (indexA: number, indexB: number) => {
    if (!activePage || !activePage.panels) return;
    const currentPanels = activePage.panels;

    if (
      indexA < 0 ||
      indexA >= currentPanels.length ||
      indexB < 0 ||
      indexB >= currentPanels.length ||
      indexA === indexB
    ) {
      return;
    }

    const nextPanels = [...currentPanels];
    const panelA = nextPanels[indexA];
    const panelB = nextPanels[indexB];

    const mediaSettingsA = {
      mediaUrl: panelA.mediaUrl,
      mediaType: panelA.mediaType,
      mediaFile: panelA.mediaFile,
      sourceClipId: panelA.sourceClipId,
      loop: panelA.loop,
      volume: panelA.volume,
      isMuted: panelA.isMuted,
    };

    nextPanels[indexA] = {
      ...panelA,
      mediaUrl: panelB.mediaUrl,
      mediaType: panelB.mediaType,
      mediaFile: panelB.mediaFile,
      sourceClipId: panelB.sourceClipId,
      loop: panelB.loop,
      volume: panelB.volume,
      isMuted: panelB.isMuted,
    };

    nextPanels[indexB] = {
      ...panelB,
      ...mediaSettingsA,
    };

    updateActivePage({ panels: nextPanels });

    if (setSelectedPanelId) {
      setSelectedPanelId(nextPanels[indexB].id);
    }
  };

  // Assign existing project clip or active timeline to a panel
  const handleAssignClip = (panelId: string, clipId: string) => {
    if (clipId === 'active_timeline') {
      updatePanel(panelId, {
        mediaUrl: null,
        mediaType: 'video',
        mediaFile: undefined,
        sourceClipId: 'active_timeline',
      });
      return;
    }
    const clip = videoClips.find((c) => c.id === clipId);
    if (!clip) return;
    updatePanel(panelId, {
      mediaUrl: clip.url,
      mediaType: clip.type || 'video',
      mediaFile: clip.file,
      sourceClipId: clip.id,
    });
  };

  // Trigger file upload for specific panel
  const handleTriggerUpload = (panelId: string) => {
    activeUploadPanelIdRef.current = panelId;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle file chosen from device
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetPanelId = activeUploadPanelIdRef.current;
    if (!file || !targetPanelId) return;

    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video');

    updatePanel(targetPanelId, {
      mediaUrl: url,
      mediaType: isVideo ? 'video' : 'image',
      mediaFile: file,
      sourceClipId: undefined,
    });
  };

  // Quick Inset positions
  const handleSetInsetCorner = (panelId: string, corner: 'bottom_right' | 'bottom_left' | 'top_right' | 'top_left') => {
    const w = 0.36;
    const h = 0.38;
    let x = 0.60;
    let y = 0.58;
    let anim: ComicPanelAnimation = 'slide_right';

    if (corner === 'bottom_left') {
      x = 0.04;
      y = 0.58;
      anim = 'slide_left';
    } else if (corner === 'top_right') {
      x = 0.60;
      y = 0.04;
      anim = 'slide_right';
    } else if (corner === 'top_left') {
      x = 0.04;
      y = 0.04;
      anim = 'slide_left';
    }

    updatePanel(panelId, { x, y, width: w, height: h, animation: anim });
  };

  // Synchronize active page duration with assigned clips
  const handleSyncDurationWithClips = () => {
    if (!activePage || !activePage.panels) return;
    const assignedClipIds = activePage.panels
      .map((p) => p.sourceClipId)
      .filter((id): id is string => !!id && id !== 'active_timeline');

    const matchedClips = videoClips.filter((c) => assignedClipIds.includes(c.id));
    if (matchedClips.length > 0) {
      const maxDuration = Math.max(...matchedClips.map((c) => c.duration || 5));
      updateActivePage({ duration: Math.max(1, Math.round(maxDuration * 10) / 10) });
    } else if (duration > 0) {
      updateActivePage({ duration: Math.max(1, Math.round(duration * 10) / 10) });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6 text-neutral-200">
      {/* Hidden file input for uploading custom media to panels */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*,image/*"
        className="hidden"
      />

      {/* Main Switch Header */}
      <div className="flex items-center justify-between p-3.5 bg-neutral-800/80 rounded-2xl border border-neutral-700/60 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Viñetas de Cómic</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-400 font-semibold px-2 py-0.5 rounded-full border border-rose-500/30">
                Páginas & Transiciones
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Divide el video en viñetas animadas y pasa de una página a otra con transiciones.
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleEnable}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            comicConfig.enabled ? 'bg-rose-500' : 'bg-neutral-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              comicConfig.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {comicConfig.enabled && activePage && (
        <>
          {/* ========================================================= */}
          {/* 1. COMIC PAGES BAR & SEQUENCE MANAGER                     */}
          {/* ========================================================= */}
          <div className="space-y-3 bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800/90 shadow-md">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-400" />
                <span>Páginas de Cómic ({pages.length})</span>
              </label>

              <button
                onClick={handleAddPage}
                className="flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow transition"
                title="Añadir nueva página de cómic consecutiva"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Página</span>
              </button>
            </div>

            {/* Visual Page Sequence Tabs with Transition Connectors */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
              {pages.map((p, idx) => {
                const isSelected = activePageIndex === idx;
                const pageEnd = Math.round((p.start + (p.duration > 0 ? p.duration : 15)) * 10) / 10;
                const presetMeta = COMIC_PRESET_OPTIONS.find((opt) => opt.id === p.layout);

                return (
                  <React.Fragment key={p.id}>
                    {/* Page Tab Card */}
                    <div
                      onClick={() => handleSelectPage(idx)}
                      className={`flex flex-col shrink-0 p-2.5 rounded-xl border cursor-pointer transition-all min-w-[130px] max-w-[170px] relative ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500 text-white shadow-md shadow-rose-950/30 ring-1 ring-rose-500/50'
                          : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs truncate pr-1">
                          {p.name || `Página ${idx + 1}`}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>

                      <div className="text-[10px] text-neutral-400 font-mono mb-1">
                        ⏱️ {p.start.toFixed(1)}s - {pageEnd.toFixed(1)}s
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-neutral-400">
                        <span className="bg-neutral-800/80 px-1.5 py-0.5 rounded text-neutral-300 truncate max-w-[90px]">
                          {p.layout === 'none' ? '🎬 Normal' : (presetMeta?.title || p.layout)}
                        </span>
                        <span className="font-mono text-neutral-400">
                          {p.panels.length}v
                        </span>
                      </div>
                    </div>

                    {/* Transition Pill Connector to next page (or timeline) */}
                    {idx < pages.length - 1 && (
                      <div 
                        className="flex flex-col items-center justify-center shrink-0 px-1"
                        title={`Transición hacia Página ${idx + 2}: ${p.transitionToNext || 'slide_left'}`}
                      >
                        <div className="flex items-center gap-1 text-[10px] bg-neutral-950 border border-neutral-800 px-2 py-1 rounded-full text-rose-300 font-mono shadow-sm">
                          <span>
                            {PAGE_TRANSITIONS.find((t) => t.id === p.transitionToNext)?.icon || '➡️'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-rose-400" />
                        </div>
                        <span className="text-[8px] text-neutral-400 mt-0.5">
                          {p.transitionDuration || 0.6}s
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. ACTIVE PAGE TIMING & TRANSITION CONTROLS               */}
          {/* ========================================================= */}
          <div className="space-y-3 bg-neutral-900/90 p-3.5 rounded-2xl border border-neutral-800/90 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center border border-rose-500/30">
                  {activePageIndex + 1}
                </span>
                <input
                  type="text"
                  value={activePage.name}
                  onChange={(e) => updateActivePage({ name: e.target.value })}
                  placeholder={`Página ${activePageIndex + 1}`}
                  className="bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-rose-500 text-xs font-bold text-white py-0.5 px-1 focus:outline-none transition"
                />
              </div>

              {/* Page Duplicate & Delete buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleDuplicatePage(activePageIndex, e)}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition border border-neutral-700/80"
                  title="Duplicar esta página de cómic"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-300" />
                </button>
                {pages.length > 1 && (
                  <button
                    onClick={(e) => handleDeletePage(activePageIndex, e)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 transition border border-neutral-700/80 hover:border-rose-700/60"
                    title="Eliminar esta página de cómic"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Time Controls (Start & Duration) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Start time */}
              <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="flex items-center gap-1 font-semibold text-neutral-300">
                    <Clock className="w-3.5 h-3.5 text-rose-400" />
                    Segundo de Inicio:
                  </span>
                  <span className="font-mono font-bold text-white text-xs">
                    {activePage.start.toFixed(1)}s
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={activePage.start}
                    onChange={(e) => updateActivePage({ start: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-20 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => updateActivePage({ start: Math.max(0, Math.round(currentTime * 10) / 10) })}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-rose-300 text-[10px] py-1 px-2 rounded-lg border border-neutral-700 transition truncate"
                    title="Fijar segundo de inicio donde está la aguja de reproducción"
                  >
                    ⏱️ Fijar en aguja ({currentTime.toFixed(1)}s)
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-neutral-400">
                  <span className="font-semibold text-neutral-300">
                    Duración de la Página:
                  </span>
                  <span className="font-mono font-bold text-white text-xs">
                    {activePage.duration > 0 ? `${activePage.duration.toFixed(1)}s` : 'Infinito'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={activePage.duration}
                    onChange={(e) => updateActivePage({ duration: Math.max(1, parseFloat(e.target.value) || 1) })}
                    className="w-20 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={handleSyncDurationWithClips}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-[10px] py-1 px-2 rounded-lg border border-neutral-700 transition truncate"
                    title="Calcular duración según los videos asignados a esta página"
                  >
                    ⏱️ Sinc. con clips
                  </button>
                </div>
              </div>
            </div>

            {/* Transition to next page or normal video */}
            <div className="bg-neutral-950/80 p-3 rounded-xl border border-neutral-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>Transición hacia la siguiente página o video</span>
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {activePage.transitionDuration || 0.6}s
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={activePage.transitionToNext || 'slide_left'}
                  onChange={(e) => updateActivePage({ transitionToNext: e.target.value as ComicPageTransition })}
                  className="bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs py-1.5 px-2 text-white focus:outline-none focus:border-rose-500"
                >
                  {PAGE_TRANSITIONS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>

                <select
                  value={activePage.transitionDuration || 0.6}
                  onChange={(e) => updateActivePage({ transitionDuration: parseFloat(e.target.value) })}
                  className="bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs py-1.5 px-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="0.3">0.3s (Rápida)</option>
                  <option value="0.5">0.5s (Dinámica)</option>
                  <option value="0.6">0.6s (Recomendada Cómic)</option>
                  <option value="0.8">0.8s (Suave)</option>
                  <option value="1.0">1.0s (Cinematográfica)</option>
                </select>
              </div>

              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Al terminar esta página, se animará hacia la siguiente página (o volverá al video normal de la línea de tiempo) con este efecto.
              </p>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. LAYOUT PRESETS SELECTION FOR ACTIVE PAGE               */}
          {/* ========================================================= */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Columns2 className="w-4 h-4 text-rose-400" />
                <span>Plantilla de Viñetas para esta Página</span>
              </label>
              <span className="text-[11px] text-neutral-400 font-mono">
                {activePage.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMIC_PRESET_OPTIONS.map((opt) => {
                const isSelected = activePage.layout === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectPreset(opt.id)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all relative ${
                      isSelected
                        ? 'bg-rose-500/10 border-rose-500 shadow-md shadow-rose-950/40 text-white'
                        : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-semibold text-xs text-white truncate pr-2">
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold shrink-0">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 line-clamp-2">
                      {opt.description}
                    </p>
                    <div className="mt-2 text-[10px] text-neutral-500 flex items-center gap-1 font-mono">
                      <span>{opt.panelCount} {opt.panelCount === 1 ? 'viñeta' : 'viñetas'}</span>
                      {isSelected && (
                        <span className="ml-auto text-rose-400 flex items-center gap-0.5 font-bold">
                          <Check className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. ACTIVE PANELS DISTRIBUTION & CLIP ASSIGNMENTS           */}
          {/* ========================================================= */}
          {activePage.layout === 'none' ? (
            <div className="bg-sky-950/30 border border-sky-800/40 p-3.5 rounded-2xl flex items-start gap-3">
              <Film className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 space-y-1">
                <span className="font-bold text-white block">
                  Página en Modo Pantalla Completa (Sin Viñetas)
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Durante el rango de tiempo de esta página ({activePage.start.toFixed(1)}s - {(activePage.start + activePage.duration).toFixed(1)}s), se reproducirá el video normal de la línea de tiempo a pantalla completa.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-rose-400" />
                  <span>Viñetas y Videos ({activePage.panels.length})</span>
                </label>
                <span className="text-[11px] text-rose-400 font-medium">
                  Organiza arriba / abajo
                </span>
              </div>

              {/* Guide card */}
              <div className="bg-gradient-to-r from-rose-950/40 to-neutral-900/80 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-neutral-300 leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">
                    ¿Cómo elegir qué video va arriba o abajo?
                  </span>
                  Cada recuadro corresponde a una posición (ej: <strong>Arriba</strong>, <strong>Medio</strong> o <strong>Abajo</strong>).
                  Usa los botones <strong>⬆️ Subir</strong> o <strong>⬇️ Bajar</strong> para intercambiar videos al instante, o selecciona un clip en el menú desplegable.
                </div>
              </div>

              <div className="space-y-3">
                {activePage.panels.map((panel, idx) => {
                  const isSelected = selectedPanelId === panel.id;
                  const posInfo = getPanelPositionInfo(activePage.layout, idx);

                  return (
                    <div
                      key={panel.id}
                      className={`rounded-2xl border transition-all p-3.5 space-y-3 ${
                        isSelected
                          ? 'bg-neutral-800/90 border-rose-500/80 shadow-md shadow-rose-950/20'
                          : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700'
                      }`}
                      onClick={() => setSelectedPanelId && setSelectedPanelId(panel.id)}
                    >
                      {/* Panel Header with Positional Badge and Swap Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center border border-rose-500/30">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{panel.name || `Viñeta ${idx + 1}`}</span>
                              {isSelected && (
                                <span className="text-[9px] bg-rose-500/20 text-rose-400 font-semibold px-1.5 py-0.2 rounded border border-rose-500/30">
                                  Seleccionada
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {posInfo.description}
                            </span>
                          </div>
                        </div>

                        {/* Swap Position Buttons (Subir / Bajar) */}
                        {activePage.panels.length > 1 && (
                          <div className="flex items-center gap-1 bg-neutral-950/90 p-1 rounded-xl border border-neutral-800">
                            <button
                              disabled={idx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwapPanels(idx, idx - 1);
                              }}
                              className="p-1 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-[11px] text-white flex items-center gap-1 border border-neutral-700 transition"
                              title="Mover video una posición hacia arriba"
                            >
                              <ArrowUp className="w-3 h-3 text-rose-400" />
                              <span className="text-[10px] font-semibold">Subir</span>
                            </button>
                            <button
                              disabled={idx === activePage.panels.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwapPanels(idx, idx + 1);
                              }}
                              className="p-1 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-[11px] text-white flex items-center gap-1 border border-neutral-700 transition"
                              title="Mover video una posición hacia abajo"
                            >
                              <ArrowDown className="w-3 h-3 text-rose-400" />
                              <span className="text-[10px] font-semibold">Bajar</span>
                            </button>
                          </div>
                        )}

                        {/* Inset pip corner switcher */}
                        {activePage.layout === 'inset_pip' && (
                          <div className="flex items-center gap-1 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800 text-[10px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetInsetCorner(panel.id, 'top_left');
                              }}
                              title="Arriba Izquierda"
                              className="px-1.5 py-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                            >
                              ↖
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetInsetCorner(panel.id, 'top_right');
                              }}
                              title="Arriba Derecha"
                              className="px-1.5 py-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                            >
                              ↗
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetInsetCorner(panel.id, 'bottom_left');
                              }}
                              title="Abajo Izquierda"
                              className="px-1.5 py-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                            >
                              ↙
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetInsetCorner(panel.id, 'bottom_right');
                              }}
                              title="Abajo Derecha"
                              className="px-1.5 py-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white font-bold"
                            >
                              ↘
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Media Source Selector */}
                      <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-neutral-400">
                          <span className="font-semibold text-neutral-300">Origen de video:</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerUpload(panel.id);
                            }}
                            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[11px] font-medium"
                          >
                            <Upload className="w-3 h-3" /> Subir archivo
                          </button>
                        </div>

                        {/* Dropdown with active timeline option and project clips */}
                        <div className="space-y-1">
                          <select
                            value={panel.sourceClipId || ''}
                            onChange={(e) => handleAssignClip(panel.id, e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs py-1.5 px-2 text-white focus:outline-none focus:border-rose-500"
                          >
                            <option value="">Seleccionar video para esta viñeta...</option>
                            <option value="active_timeline" className="text-sky-300 font-semibold">
                              🎬 Seguir línea de tiempo (Cambia de video según los cortes)
                            </option>
                            {videoClips.length > 0 && (
                              <optgroup label="Videos en la línea de tiempo:">
                                {videoClips.map((c, i) => (
                                  <option key={c.id} value={c.id}>
                                    Clip {i + 1}: {c.name} ({c.duration.toFixed(1)}s)
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </div>

                        {/* Display current media info */}
                        {panel.sourceClipId === 'active_timeline' ? (
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-sky-400">
                            <Film className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="truncate flex-1 font-semibold">
                              🎬 Sigue la línea de tiempo (cambia con los cortes)
                            </span>
                            <span className="text-[10px] text-sky-400 bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-800/40">
                              Dinámico
                            </span>
                          </div>
                        ) : panel.mediaUrl ? (
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400">
                            {panel.mediaType === 'video' ? (
                              <Film className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span className="truncate flex-1 font-mono text-neutral-300">
                              {panel.mediaFile?.name || panel.name}
                            </span>
                            <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                              Asignado
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-400/90 italic">
                            ⚠️ Sin video asignado. Selecciona un clip arriba o sube un archivo.
                          </p>
                        )}
                      </div>

                      {/* Continuous Looping Toggle (Anti-Freeze & Anti-Black) */}
                      <div className="space-y-1 pt-1">
                        <label className="flex items-center justify-between text-xs text-neutral-300 py-1 bg-neutral-950/60 px-2.5 rounded-lg border border-neutral-800/80 cursor-pointer hover:border-neutral-700 transition">
                          <div className="flex items-center gap-1.5">
                            <Repeat className="w-3.5 h-3.5 text-rose-400" />
                            <span className="font-semibold text-white">Repetir en bucle continuo (Loop)</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={panel.loop !== false}
                            onChange={(e) => updatePanel(panel.id, { loop: e.target.checked })}
                            className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                          />
                        </label>
                        <p className="text-[10px] text-neutral-400 pl-1 leading-normal">
                          Si el video dura menos que la página, se repite automáticamente sin congelarse ni ponerse negro.
                        </p>
                      </div>

                      {/* Animation Controls */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] text-neutral-400 mb-1 block">
                            Animación de entrada
                          </label>
                          <select
                            value={panel.animation}
                            onChange={(e) =>
                              updatePanel(panel.id, {
                                animation: e.target.value as ComicPanelAnimation,
                              })
                            }
                            className="w-full bg-neutral-950 border border-neutral-700/80 rounded-lg py-1.5 px-2 text-white text-xs focus:outline-none focus:border-rose-500"
                          >
                            <option value="slide_bottom">⬇️ Deslizar abajo</option>
                            <option value="slide_right">➡️ Deslizar derecha</option>
                            <option value="slide_left">⬅️ Deslizar izquierda</option>
                            <option value="slide_top">⬆️ Deslizar arriba</option>
                            <option value="pop_zoom">💥 Pop Zoom</option>
                            <option value="fade">✨ Fade / Desvanecer</option>
                            <option value="none">Fija (Sin animación)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-neutral-400 mb-1 block">
                            Duración efecto
                          </label>
                          <select
                            value={panel.animationDuration}
                            onChange={(e) =>
                              updatePanel(panel.id, {
                                animationDuration: parseFloat(e.target.value),
                              })
                            }
                            className="w-full bg-neutral-950 border border-neutral-700/80 rounded-lg py-1.5 px-2 text-white text-xs focus:outline-none focus:border-rose-500"
                          >
                            <option value="0.3">0.3s (Rápido)</option>
                            <option value="0.5">0.5s (Recomendado)</option>
                            <option value="0.8">0.8s (Suave)</option>
                            <option value="1.2">1.2s (Cinemático)</option>
                          </select>
                        </div>
                      </div>

                      {/* Timing inside Page */}
                      <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-rose-400" />
                            Aparición dentro de página:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-bold">{panel.start.toFixed(1)}s</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const offsetInPage = Math.max(0, Math.round((currentTime - activePage.start) * 10) / 10);
                                updatePanel(panel.id, { start: offsetInPage });
                              }}
                              className="bg-neutral-800 hover:bg-neutral-700 text-rose-300 text-[10px] px-2 py-0.5 rounded-md border border-neutral-700 transition"
                              title="Hacer que aparezca en el segundo actual del cabezal"
                            >
                              ⏱️ En aguja (+{Math.max(0, Math.round((currentTime - activePage.start) * 10) / 10).toFixed(1)}s)
                            </button>
                          </div>
                        </div>

                        {/* Duration in panel */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/60">
                          <span className="text-neutral-400">Permanencia:</span>
                          <select
                            value={panel.duration}
                            onChange={(e) =>
                              updatePanel(panel.id, { duration: parseFloat(e.target.value) })
                            }
                            className="bg-neutral-900 border border-neutral-700 text-white rounded text-xs py-0.5 px-1.5 focus:outline-none"
                          >
                            <option value="0">Toda la página</option>
                            <option value="3">3 segundos</option>
                            <option value="5">5 segundos</option>
                            <option value="8">8 segundos</option>
                            <option value="10">10 segundos</option>
                          </select>
                        </div>
                      </div>

                      {/* Audio Volume */}
                      <div className="flex items-center justify-between gap-3 text-xs pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePanel(panel.id, { isMuted: !panel.isMuted });
                          }}
                          className={`p-1.5 rounded-lg border transition ${
                            panel.isMuted
                              ? 'bg-neutral-800 border-neutral-700 text-neutral-500'
                              : 'bg-neutral-800 border-neutral-700 text-rose-400'
                          }`}
                          title={panel.isMuted ? 'Silenciado' : 'Audio activo'}
                        >
                          {panel.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex-1 space-y-0.5">
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Volumen Viñeta</span>
                            <span className="font-mono text-white">
                              {panel.isMuted ? '0%' : `${Math.round(panel.volume * 100)}%`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            disabled={panel.isMuted}
                            value={panel.isMuted ? 0 : panel.volume}
                            onChange={(e) =>
                              updatePanel(panel.id, { volume: parseFloat(e.target.value), isMuted: false })
                            }
                            className="w-full accent-rose-500 disabled:opacity-40"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. COMIC BORDER & FRAMING STYLING                         */}
          {/* ========================================================= */}
          <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-2xl border border-neutral-800/80">
            <div className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-rose-400" />
              <span>Estilo del Marco Cómic</span>
            </div>

            {/* Border Width Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Grosor del marco</span>
                <span className="font-mono text-white font-bold">{comicConfig.borderWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="16"
                step="1"
                value={comicConfig.borderWidth}
                onChange={(e) =>
                  setComicConfig((prev) => ({ ...prev, borderWidth: parseInt(e.target.value, 10) }))
                }
                className="w-full accent-rose-500"
              />
            </div>

            {/* Corner Radius Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Esquinas redondeadas</span>
                <span className="font-mono text-white font-bold">{comicConfig.borderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="2"
                value={comicConfig.borderRadius}
                onChange={(e) =>
                  setComicConfig((prev) => ({ ...prev, borderRadius: parseInt(e.target.value, 10) }))
                }
                className="w-full accent-rose-500"
              />
            </div>

            {/* Border Color Swatches */}
            <div className="space-y-1.5 pt-1">
              <div className="text-xs text-neutral-400">Color del reborde</div>
              <div className="flex items-center gap-2">
                {BORDER_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setComicConfig((prev) => ({ ...prev, borderColor: c.value }))}
                    title={c.label}
                    className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                      comicConfig.borderColor.toLowerCase() === c.value.toLowerCase()
                        ? 'border-white scale-110 shadow-lg'
                        : 'border-neutral-700 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {comicConfig.borderColor.toLowerCase() === c.value.toLowerCase() && (
                      <Check
                        className={`w-3.5 h-3.5 ${
                          c.value === '#ffffff' || c.value === '#facc15' ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}

                {/* Custom Color Picker */}
                <input
                  type="color"
                  value={comicConfig.borderColor}
                  onChange={(e) => setComicConfig((prev) => ({ ...prev, borderColor: e.target.value }))}
                  className="w-7 h-7 rounded-full overflow-hidden cursor-pointer bg-transparent border-0 p-0 ml-1"
                  title="Color personalizado"
                />
              </div>
            </div>

            {/* Comic Drop Shadow Toggle */}
            <label className="flex items-center justify-between text-xs text-neutral-300 pt-2 border-t border-neutral-800/80 cursor-pointer">
              <span>Sombra proyectada cómic (3D)</span>
              <input
                type="checkbox"
                checked={comicConfig.hasShadow}
                onChange={(e) =>
                  setComicConfig((prev) => ({ ...prev, hasShadow: e.target.checked }))
                }
                className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
};
