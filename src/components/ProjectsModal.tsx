import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Save,
  Trash2,
  Download,
  Upload,
  Plus,
  X,
  Clock,
  Film,
  Music,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Smartphone,
  Square,
  Monitor
} from 'lucide-react';
import {
  getAllProjectsFromDB,
  getProjectFromDB,
  deleteProjectFromDB,
  getAutoSaveFromDB,
  exportProjectToEditorcutFile,
  importProjectFromEditorcutFile,
  type SavedProject,
  type SavedProjectSummary,
} from '../utils/projectStorage';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectName: string;
  setCurrentProjectName: (name: string) => void;
  onSaveCurrentProject: (name: string) => Promise<void>;
  onLoadProject: (project: SavedProject) => void;
  onNewProject: () => void;
  isSaving?: boolean;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  currentProjectName,
  setCurrentProjectName,
  onSaveCurrentProject,
  onLoadProject,
  onNewProject,
  isSaving = false,
}) => {
  const [projects, setProjects] = useState<SavedProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nameInput, setNameInput] = useState<string>(currentProjectName || 'Mi Video');
  const [autoSaveProject, setAutoSaveProject] = useState<SavedProject | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync name input when currentProjectName changes
  useEffect(() => {
    setNameInput(currentProjectName || 'Mi Video');
  }, [currentProjectName]);

  // Load project list and check autosave whenever modal opens
  const refreshProjects = async () => {
    setIsLoading(true);
    try {
      const list = await getAllProjectsFromDB();
      setProjects(list);
      const autoSave = await getAutoSaveFromDB();
      setAutoSaveProject(autoSave);
    } catch (e) {
      console.error('Error fetching saved projects:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const finalName = nameInput.trim() || 'Mi Video';
    setCurrentProjectName(finalName);
    try {
      await onSaveCurrentProject(finalName);
      setStatusMessage('¡Proyecto guardado con éxito!');
      await refreshProjects();
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (e) {
      console.error(e);
      setStatusMessage('Error al guardar el proyecto.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleOpenProject = async (id: string) => {
    try {
      const fullProj = await getProjectFromDB(id);
      if (fullProj) {
        onLoadProject(fullProj);
        onClose();
      }
    } catch (e) {
      console.error('Error opening project:', e);
      alert('No se pudo abrir el proyecto.');
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el proyecto "${name}"?`)) return;
    try {
      await deleteProjectFromDB(id);
      await refreshProjects();
    } catch (e) {
      console.error('Error deleting project:', e);
    }
  };

  const handleDownloadFile = async (id: string) => {
    try {
      const fullProj = await getProjectFromDB(id);
      if (fullProj) {
        await exportProjectToEditorcutFile(fullProj);
      }
    } catch (e) {
      console.error('Error exporting project file:', e);
      alert('Error al exportar archivo .editorcut');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatusMessage('Leyendo archivo de proyecto...');
      const imported = await importProjectFromEditorcutFile(file);
      onLoadProject(imported);
      setStatusMessage('¡Proyecto importado con éxito!');
      setTimeout(() => {
        setStatusMessage(null);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error al importar el archivo .editorcut');
      setStatusMessage(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestoreAutoSave = () => {
    if (!autoSaveProject) return;
    onLoadProject(autoSaveProject);
    onClose();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) {
      return `Hoy a las ${timeStr}`;
    }
    return `${date.toLocaleDateString()} a las ${timeStr}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-inner">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white m-0 tracking-tight flex items-center gap-2">
                Proyectos Guardados
                <span className="text-[11px] font-semibold bg-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full border border-neutral-700">
                  {projects.length}
                </span>
              </h2>
              <p className="text-xs text-neutral-400 m-0">
                Guardá tu trabajo para apagar la PC y continuar editando cuando quieras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar: Save Current Project & Import */}
        <div className="p-5 bg-neutral-900/90 border-b border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Nombre de tu proyecto (ej: Mi Video de TikTok)"
                className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950/50 transition transform active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Proyecto Actual'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium rounded-lg border border-neutral-700 transition"
                title="Cargar archivo .editorcut desde tu computadora"
              >
                <Upload className="w-3.5 h-3.5 text-rose-400" />
                <span>Importar archivo .editorcut</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".editorcut"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>

            <button
              onClick={() => {
                if (window.confirm('¿Deseas iniciar un nuevo proyecto en blanco?')) {
                  onNewProject();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-xs font-medium rounded-lg border border-neutral-800 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo proyecto en blanco</span>
            </button>
          </div>

          {statusMessage && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Autosave banner if exists */}
          {autoSaveProject && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div className="text-xs text-amber-200">
                  <span className="font-bold">Borrador automático recuperable:</span>{' '}
                  Sesión guardada el {formatDate(autoSaveProject.updatedAt)} ({formatDuration(autoSaveProject.duration)})
                </div>
              </div>
              <button
                onClick={handleRestoreAutoSave}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition whitespace-nowrap"
              >
                Restaurar
              </button>
            </div>
          )}
        </div>

        {/* Saved Projects List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              Cargando proyectos guardados...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-neutral-800/60 text-neutral-500 flex items-center justify-center mx-auto border border-neutral-800">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-neutral-300">No hay proyectos guardados todavía</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Escribí un nombre arriba y hacé clic en &quot;Guardar Proyecto Actual&quot; para asegurar tu edición.
              </p>
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="group p-4 bg-neutral-950/60 hover:bg-neutral-800/50 border border-neutral-800/80 hover:border-neutral-700 rounded-2xl flex items-center justify-between gap-4 transition shadow-sm"
              >
                {/* Thumbnail & Meta info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-20 h-24 sm:w-24 sm:h-20 bg-neutral-900 rounded-xl overflow-hidden border border-neutral-800 flex-shrink-0 flex items-center justify-center relative">
                    {proj.thumbnail ? (
                      <img
                        src={proj.thumbnail}
                        alt={proj.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Film className="w-6 h-6 text-neutral-600" />
                    )}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[9px] font-bold bg-black/80 text-white rounded">
                      {formatDuration(proj.duration)}
                    </span>
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-rose-400 transition">
                      {proj.name}
                    </h4>

                    <div className="flex items-center flex-wrap gap-2 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {formatDate(proj.updatedAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-neutral-300">
                        {proj.aspectRatio === '9:16' && <Smartphone className="w-3 h-3 text-rose-400" />}
                        {proj.aspectRatio === '1:1' && <Square className="w-3 h-3 text-rose-400" />}
                        {proj.aspectRatio === '16:9' && <Monitor className="w-3 h-3 text-rose-400" />}
                        {proj.aspectRatio}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Film className="w-3 h-3" /> {proj.videoCount} {proj.videoCount === 1 ? 'clip' : 'clips'}
                      </span>
                      {proj.audioCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3" /> {proj.audioCount} {proj.audioCount === 1 ? 'sonido' : 'sonidos'}
                        </span>
                      )}
                      {proj.subtitleCount > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {proj.subtitleCount} subs
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleOpenProject(proj.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition transform active:scale-95"
                    title="Cargar este proyecto en el editor"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Abrir</span>
                  </button>

                  <button
                    onClick={() => handleDownloadFile(proj.id)}
                    className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center justify-center transition border border-neutral-700"
                    title="Descargar archivo .editorcut de respaldo"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteProject(proj.id, proj.name)}
                    className="w-9 h-9 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 flex items-center justify-center transition border border-neutral-700 hover:border-rose-500/30"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
