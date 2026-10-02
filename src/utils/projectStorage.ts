import type {
  AspectRatio,
  AudioTrackConfig,
  TextOverlayConfig,
  SubtitleItem,
  TransitionConfig,
  VideoTransitionType
} from '../types';

export interface SavedProject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // base64 data URL
  aspectRatio: AspectRatio;
  duration: number;
  currentTime: number;
  videoVolume: number;
  isVideoMuted: boolean;

  mediaAsset: {
    id: string;
    name: string;
    type: 'video' | 'image';
    duration: number;
    aspectRatio: number;
    fileBlob?: Blob;
  } | null;

  videoClips: Array<{
    id: string;
    name: string;
    type?: 'video' | 'image';
    duration: number;
    start: number;
    aspectRatio?: number;
    transitionToNext?: VideoTransitionType;
    transitionDuration?: number;
    fileBlob?: Blob;
  }>;

  audioClips: Array<{
    id: string;
    name: string;
    start: number;
    duration: number;
    volume: number;
    isLoop: boolean;
    sfxType?: any;
    presetTheme?: any;
    isMuted?: boolean;
    fileBlob?: Blob;
  }>;

  audioConfig: AudioTrackConfig;
  textConfig: TextOverlayConfig;
  subtitles: SubtitleItem[];
  transitionConfig: TransitionConfig;

  watermarkConfig: {
    position: { x: number; y: number };
    scale: number;
    opacity: number;
    start?: number;
    duration?: number;
    fileBlob?: Blob;
  };
}

export interface SavedProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  duration: number;
  aspectRatio: AspectRatio;
  thumbnail?: string;
  videoCount: number;
  audioCount: number;
  subtitleCount: number;
}

const DB_NAME = 'EditorcutDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_AUTOSAVE = 'autosave';

/**
 * Open or upgrade the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB no está disponible en este navegador.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUTOSAVE)) {
        db.createObjectStore(STORE_AUTOSAVE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save or update a project in IndexedDB
 */
export async function saveProjectToDB(project: SavedProject): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const item = {
      ...project,
      updatedAt: Date.now(),
    };
    const req = store.put(item);
    req.onsuccess = () => resolve(project.id);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all project summaries (without heavy blobs) for fast list display
 */
export async function getAllProjectsFromDB(): Promise<SavedProjectSummary[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.getAll();

    req.onsuccess = () => {
      const all: SavedProject[] = req.result || [];
      const summaries: SavedProjectSummary[] = all.map((p) => ({
        id: p.id,
        name: p.name || 'Proyecto sin título',
        updatedAt: p.updatedAt || p.createdAt || Date.now(),
        createdAt: p.createdAt || Date.now(),
        duration: p.duration || 0,
        aspectRatio: p.aspectRatio || '9:16',
        thumbnail: p.thumbnail,
        videoCount: p.videoClips?.length || (p.mediaAsset ? 1 : 0),
        audioCount: p.audioClips?.length || 0,
        subtitleCount: p.subtitles?.length || 0,
      }));

      // Sort by newest updated first
      summaries.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(summaries);
    };

    req.onerror = () => reject(req.error);
  });
}

/**
 * Get full project with media blobs by ID
 */
export async function getProjectFromDB(id: string): Promise<SavedProject | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a project by ID
 */
export async function deleteProjectFromDB(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Save an automatic background draft of the session
 */
export async function saveAutoSaveToDB(project: SavedProject): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUTOSAVE, 'readwrite');
      const store = tx.objectStore(STORE_AUTOSAVE);
      const item = {
        ...project,
        id: 'latest_autosave',
        updatedAt: Date.now(),
      };
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('AutoSave failed:', e);
  }
}

/**
 * Get latest autosave session if present
 */
export async function getAutoSaveFromDB(): Promise<SavedProject | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUTOSAVE, 'readonly');
      const store = tx.objectStore(STORE_AUTOSAVE);
      const req = store.get('latest_autosave');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    return null;
  }
}

/**
 * Clear the autosave session (e.g. on new blank project)
 */
export async function clearAutoSaveFromDB(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_AUTOSAVE, 'readwrite');
      const store = tx.objectStore(STORE_AUTOSAVE);
      const req = store.delete('latest_autosave');
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {}
}

/**
 * Helper to fetch a Blob from an existing blob: or http: URL if File is not set
 */
export async function urlToBlob(url: string | null | undefined): Promise<Blob | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    return await res.blob();
  } catch (e) {
    console.warn('Could not extract blob from url:', url, e);
    return null;
  }
}

/**
 * Export project as a standalone portable file (.editorcut)
 * Packaging format:
 * [Magic 'EDCU': 4 bytes]
 * [JSON Meta Length: Uint32 4 bytes]
 * [JSON Meta UTF-8 bytes]
 * [Number of Blobs: Uint32 4 bytes]
 * For each blob:
 *   [Mime length: Uint16 2 bytes]
 *   [Mime UTF-8 bytes]
 *   [Blob length: Uint32 4 bytes]
 *   [Blob bytes]
 */
export async function exportProjectToEditorcutFile(project: SavedProject): Promise<void> {
  const blobs: Blob[] = [];

  const addBlob = (b?: Blob): number => {
    if (!b) return -1;
    blobs.push(b);
    return blobs.length - 1;
  };

  const serializableProject = {
    ...project,
    mediaAsset: project.mediaAsset
      ? {
          ...project.mediaAsset,
          blobIndex: addBlob(project.mediaAsset.fileBlob),
          fileBlob: undefined,
        }
      : null,
    videoClips: (project.videoClips || []).map((c) => ({
      ...c,
      blobIndex: addBlob(c.fileBlob),
      fileBlob: undefined,
    })),
    audioClips: (project.audioClips || []).map((a) => ({
      ...a,
      blobIndex: addBlob(a.fileBlob),
      fileBlob: undefined,
    })),
    watermarkConfig: {
      ...project.watermarkConfig,
      blobIndex: addBlob(project.watermarkConfig?.fileBlob),
      fileBlob: undefined,
    },
  };

  const metaJson = JSON.stringify(serializableProject);
  const metaEncoder = new TextEncoder();
  const metaBytes = metaEncoder.encode(metaJson);

  const fileChunks: any[] = [];

  // Magic 'EDCU'
  fileChunks.push(new Uint8Array([0x45, 0x44, 0x43, 0x55]));

  // Meta JSON Length
  const metaLenBuf = new ArrayBuffer(4);
  new DataView(metaLenBuf).setUint32(0, metaBytes.byteLength, true);
  fileChunks.push(metaLenBuf);
  fileChunks.push(metaBytes);

  // Blobs Count
  const blobsCountBuf = new ArrayBuffer(4);
  new DataView(blobsCountBuf).setUint32(0, blobs.length, true);
  fileChunks.push(blobsCountBuf);

  // Blobs payload
  for (const blob of blobs) {
    const mimeBytes = metaEncoder.encode(blob.type || 'application/octet-stream');
    const mimeLenBuf = new ArrayBuffer(2);
    new DataView(mimeLenBuf).setUint16(0, mimeBytes.byteLength, true);
    fileChunks.push(mimeLenBuf);
    fileChunks.push(mimeBytes);

    const blobLenBuf = new ArrayBuffer(4);
    new DataView(blobLenBuf).setUint32(0, blob.size, true);
    fileChunks.push(blobLenBuf);
    fileChunks.push(blob);
  }

  const combinedBlob = new Blob(fileChunks, { type: 'application/octet-stream' });
  const downloadUrl = URL.createObjectURL(combinedBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const safeName = (project.name || 'Proyecto_Editorcut').replace(/[^a-zA-Z0-9_\-\u00C0-\u017F]/g, '_');
  a.download = `${safeName}.editorcut`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 2000);
}

/**
 * Import a standalone .editorcut file
 */
export async function importProjectFromEditorcutFile(file: File): Promise<SavedProject> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  let offset = 0;

  if (buffer.byteLength < 8) {
    throw new Error('Archivo corrupto o incompleto');
  }

  // Check magic 'EDCU'
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (magic !== 'EDCU') {
    throw new Error('El archivo no es un proyecto válido de Editorcut (.editorcut)');
  }
  offset += 4;

  const metaLen = view.getUint32(offset, true);
  offset += 4;

  if (offset + metaLen > buffer.byteLength) {
    throw new Error('Metadatos corruptos');
  }

  const metaBytes = new Uint8Array(buffer, offset, metaLen);
  offset += metaLen;

  const metaJson = new TextDecoder().decode(metaBytes);
  const serializableProject = JSON.parse(metaJson);

  const blobsCount = view.getUint32(offset, true);
  offset += 4;

  const blobs: Blob[] = [];
  for (let i = 0; i < blobsCount; i++) {
    const mimeLen = view.getUint16(offset, true);
    offset += 2;

    const mimeBytes = new Uint8Array(buffer, offset, mimeLen);
    offset += mimeLen;
    const mime = new TextDecoder().decode(mimeBytes);

    const blobSize = view.getUint32(offset, true);
    offset += 4;

    const blobData = buffer.slice(offset, offset + blobSize);
    offset += blobSize;

    blobs.push(new Blob([blobData], { type: mime }));
  }

  // Restore blobs into project
  const project: SavedProject = {
    ...serializableProject,
    id: 'proj-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    updatedAt: Date.now(),
    mediaAsset: serializableProject.mediaAsset
      ? {
          ...serializableProject.mediaAsset,
          fileBlob:
            serializableProject.mediaAsset.blobIndex >= 0
              ? blobs[serializableProject.mediaAsset.blobIndex]
              : undefined,
        }
      : null,
    videoClips: (serializableProject.videoClips || []).map((c: any) => ({
      ...c,
      fileBlob: c.blobIndex >= 0 ? blobs[c.blobIndex] : undefined,
    })),
    audioClips: (serializableProject.audioClips || []).map((a: any) => ({
      ...a,
      fileBlob: a.blobIndex >= 0 ? blobs[a.blobIndex] : undefined,
    })),
    watermarkConfig: {
      ...serializableProject.watermarkConfig,
      fileBlob:
        serializableProject.watermarkConfig?.blobIndex >= 0
          ? blobs[serializableProject.watermarkConfig.blobIndex]
          : undefined,
    },
  };

  return project;
}
