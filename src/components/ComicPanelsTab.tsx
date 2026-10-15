import React, { useRef } from 'react';
import type { ComicConfig, ComicLayoutType, ComicPanelAnimation, ComicPanelItem, VideoClip } from '../types';
import { 
  COMIC_PRESET_OPTIONS, 
  applyComicLayoutPreset 
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
  Palette 
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

export const ComicPanelsTab: React.FC<ComicPanelsTabProps> = ({
  comicConfig,
  setComicConfig,
  videoClips,
  currentTime,
  duration: _duration = 15,
  onSeek: _onSeek,
  selectedPanelId,
  setSelectedPanelId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadPanelIdRef = useRef<string | null>(null);

  // Toggle feature
  const handleToggleEnable = () => {
    if (!comicConfig.enabled) {
      // If currently disabled or none, default to inset_pip or comic_3_left
      const targetLayout = comicConfig.layout && comicConfig.layout !== 'none' 
        ? comicConfig.layout 
        : 'comic_3_left';
      setComicConfig(applyComicLayoutPreset(targetLayout, { ...comicConfig, enabled: true }, videoClips));
    } else {
      setComicConfig((prev) => ({ ...prev, enabled: false }));
    }
  };

  // Change layout preset
  const handleSelectPreset = (layout: ComicLayoutType) => {
    const updated = applyComicLayoutPreset(layout, comicConfig, videoClips);
    setComicConfig(updated);
    if (updated.panels.length > 0 && setSelectedPanelId) {
      setSelectedPanelId(updated.panels[0].id);
    }
  };

  // Update single panel property
  const updatePanel = (panelId: string, updates: Partial<ComicPanelItem>) => {
    setComicConfig((prev) => ({
      ...prev,
      panels: prev.panels.map((p) => (p.id === panelId ? { ...p, ...updates } : p)),
    }));
  };

  // Assign existing project clip to panel
  const handleAssignClip = (panelId: string, clipId: string) => {
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
                Split Screen
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Divide la pantalla en viñetas animadas de cómic con varios videos.
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

      {comicConfig.enabled && (
        <>
          {/* Layout Presets Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Columns2 className="w-4 h-4 text-rose-400" />
              <span>Plantillas de Viñetas</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMIC_PRESET_OPTIONS.map((opt) => {
                const isSelected = comicConfig.layout === opt.id;
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

          {/* Comic Border & Framing Styling */}
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

          {/* Active Panels Configuration List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-400" />
                <span>Viñetas ({comicConfig.panels.length})</span>
              </label>
              <span className="text-[11px] text-neutral-500">Configura cada toma</span>
            </div>

            <div className="space-y-3">
              {comicConfig.panels.map((panel, idx) => {
                const isSelected = selectedPanelId === panel.id;
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
                    {/* Panel Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center border border-rose-500/30">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {panel.name || `Viñeta ${idx + 1}`}
                        </span>
                      </div>

                      {comicConfig.layout === 'inset_pip' && (
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
                        <span className="font-semibold text-neutral-300">Origen de video / foto:</span>
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

                      {/* Pick from existing project videoClips */}
                      {videoClips.length > 0 && (
                        <div className="space-y-1">
                          <select
                            value={panel.sourceClipId || ''}
                            onChange={(e) => handleAssignClip(panel.id, e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg text-xs py-1.5 px-2 text-white focus:outline-none focus:border-rose-500"
                          >
                            <option value="">Seleccionar clip del proyecto...</option>
                            {videoClips.map((c, i) => (
                              <option key={c.id} value={c.id}>
                                Clip {i + 1}: {c.name} ({c.duration.toFixed(1)}s)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Display current media info */}
                      {panel.mediaUrl ? (
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
                          ⚠️ Sin video asignado. Puedes vincular un clip arriba o subir un archivo.
                        </p>
                      )}
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

                    {/* Timing: Start and Needle sync */}
                    <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          Aparición:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-bold">{panel.start.toFixed(1)}s</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updatePanel(panel.id, { start: Math.round(currentTime * 10) / 10 });
                            }}
                            className="bg-neutral-800 hover:bg-neutral-700 text-rose-300 text-[10px] px-2 py-0.5 rounded-md border border-neutral-700 transition"
                            title="Hacer que aparezca en el segundo actual del cabezal"
                          >
                            ⏱️ Fijar en aguja ({currentTime.toFixed(1)}s)
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
                          <option value="0">Todo el video</option>
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
        </>
      )}
    </div>
  );
};
