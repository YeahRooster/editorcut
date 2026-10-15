import type { ComicConfig, ComicLayoutType, ComicPanelItem, VideoClip } from '../types';

export interface ComicPresetInfo {
  id: ComicLayoutType;
  title: string;
  description: string;
  panelCount: number;
  badge?: string;
}

export const COMIC_PRESET_OPTIONS: ComicPresetInfo[] = [
  {
    id: 'inset_pip',
    title: 'Viñeta Flotante / Reacción',
    description: 'Video principal de fondo con recuadro estilo cómic deslizable en esquina (Ref. 1).',
    panelCount: 1,
    badge: 'Popular',
  },
  {
    id: 'comic_3_left',
    title: 'Manga / Cómic 3 (Izq. doble)',
    description: '2 viñetas apiladas a la izquierda y 1 viñeta alta a la derecha (Ref. 2).',
    panelCount: 3,
    badge: 'Referencia',
  },
  {
    id: 'comic_3_right',
    title: 'Manga / Cómic 3 (Der. doble)',
    description: '1 viñeta alta a la izquierda y 2 viñetas apiladas a la derecha.',
    panelCount: 3,
  },
  {
    id: 'split_2_vert',
    title: 'Pantalla Dividida Vertical',
    description: '2 viñetas lado a lado (50/50 vertical).',
    panelCount: 2,
  },
  {
    id: 'split_2_horiz',
    title: 'Pantalla Dividida Horizontal',
    description: '2 viñetas arriba y abajo (50/50 horizontal).',
    panelCount: 2,
  },
  {
    id: 'grid_4',
    title: 'Cuadrícula 4 Viñetas',
    description: '4 viñetas en rejilla 2x2 clásica de historietas.',
    panelCount: 4,
  },
  {
    id: 'strip_3_horiz',
    title: 'Tiras Cinematográficas 3',
    description: '3 bandas horizontales panorámicas.',
    panelCount: 3,
  },
];

export function createDefaultComicConfig(): ComicConfig {
  return {
    enabled: false,
    layout: 'none',
    borderWidth: 6,
    borderColor: '#000000',
    borderRadius: 8,
    hasShadow: true,
    gutter: 8,
    panels: [],
  };
}

/**
 * Creates layout panels configured with positions, animations, and links to existing clips if available.
 */
export function applyComicLayoutPreset(
  layout: ComicLayoutType,
  currentConfig: ComicConfig,
  availableClips: VideoClip[] = []
): ComicConfig {
  if (layout === 'none') {
    return {
      ...currentConfig,
      enabled: false,
      layout: 'none',
      panels: [],
    };
  }

  const baseBorderWidth = currentConfig.borderWidth || 6;
  const baseBorderColor = currentConfig.borderColor || '#000000';
  const baseBorderRadius = currentConfig.borderRadius ?? 8;
  const baseShadow = currentConfig.hasShadow ?? true;

  // Helper to pick a clip safely
  const getClipForIndex = (index: number) => {
    if (!availableClips || availableClips.length === 0) return null;
    return availableClips[index % availableClips.length];
  };

  let newPanels: ComicPanelItem[] = [];

  switch (layout) {
    case 'inset_pip': {
      // Reference 1: Main background video + Inset reaction comic panel
      const clip = availableClips.length > 1 ? availableClips[1] : availableClips[0];
      newPanels = [
        {
          id: 'panel-inset-1',
          name: 'Viñeta Reacción (Esquina)',
          x: 0.60,
          y: 0.58,
          width: 0.36,
          height: 0.38,
          mediaUrl: clip?.url || null,
          mediaType: clip?.type || 'video',
          mediaFile: clip?.file,
          sourceClipId: clip?.id,
          start: 0,
          duration: 0, // 0 = entire video
          animation: 'slide_right',
          animationDuration: 0.55,
          volume: 0, // mute by default so it doesn't clash with main audio
        },
      ];
      break;
    }

    case 'comic_3_left': {
      // Reference 2: Left 2 stacked, Right 1 tall
      const c0 = getClipForIndex(0);
      const c1 = getClipForIndex(1);
      const c2 = getClipForIndex(2);

      newPanels = [
        {
          id: 'panel-c3l-0',
          name: 'Viñeta 1 (Superior Izq)',
          x: 0.015,
          y: 0.015,
          width: 0.47,
          height: 0.47,
          mediaUrl: c0?.url || null,
          mediaType: c0?.type || 'video',
          mediaFile: c0?.file,
          sourceClipId: c0?.id,
          start: 0,
          duration: 0,
          animation: 'slide_left',
          animationDuration: 0.5,
          volume: 1.0,
        },
        {
          id: 'panel-c3l-1',
          name: 'Viñeta 2 (Inferior Izq)',
          x: 0.015,
          y: 0.515,
          width: 0.47,
          height: 0.47,
          mediaUrl: c1?.url || null,
          mediaType: c1?.type || 'video',
          mediaFile: c1?.file,
          sourceClipId: c1?.id,
          start: 0.3,
          duration: 0,
          animation: 'slide_bottom',
          animationDuration: 0.55,
          volume: 0,
        },
        {
          id: 'panel-c3l-2',
          name: 'Viñeta 3 (Vertical Der)',
          x: 0.515,
          y: 0.015,
          width: 0.47,
          height: 0.97,
          mediaUrl: c2?.url || null,
          mediaType: c2?.type || 'video',
          mediaFile: c2?.file,
          sourceClipId: c2?.id,
          start: 0.6,
          duration: 0,
          animation: 'slide_right',
          animationDuration: 0.6,
          volume: 0,
        },
      ];
      break;
    }

    case 'comic_3_right': {
      const c0 = getClipForIndex(0);
      const c1 = getClipForIndex(1);
      const c2 = getClipForIndex(2);

      newPanels = [
        {
          id: 'panel-c3r-0',
          name: 'Viñeta 1 (Vertical Izq)',
          x: 0.015,
          y: 0.015,
          width: 0.47,
          height: 0.97,
          mediaUrl: c0?.url || null,
          mediaType: c0?.type || 'video',
          mediaFile: c0?.file,
          sourceClipId: c0?.id,
          start: 0,
          duration: 0,
          animation: 'slide_left',
          animationDuration: 0.5,
          volume: 1.0,
        },
        {
          id: 'panel-c3r-1',
          name: 'Viñeta 2 (Superior Der)',
          x: 0.515,
          y: 0.015,
          width: 0.47,
          height: 0.47,
          mediaUrl: c1?.url || null,
          mediaType: c1?.type || 'video',
          mediaFile: c1?.file,
          sourceClipId: c1?.id,
          start: 0.3,
          duration: 0,
          animation: 'slide_top',
          animationDuration: 0.55,
          volume: 0,
        },
        {
          id: 'panel-c3r-2',
          name: 'Viñeta 3 (Inferior Der)',
          x: 0.515,
          y: 0.515,
          width: 0.47,
          height: 0.47,
          mediaUrl: c2?.url || null,
          mediaType: c2?.type || 'video',
          mediaFile: c2?.file,
          sourceClipId: c2?.id,
          start: 0.6,
          duration: 0,
          animation: 'slide_bottom',
          animationDuration: 0.6,
          volume: 0,
        },
      ];
      break;
    }

    case 'split_2_vert': {
      const c0 = getClipForIndex(0);
      const c1 = getClipForIndex(1);

      newPanels = [
        {
          id: 'panel-s2v-0',
          name: 'Viñeta Izquierda (50%)',
          x: 0.015,
          y: 0.015,
          width: 0.475,
          height: 0.97,
          mediaUrl: c0?.url || null,
          mediaType: c0?.type || 'video',
          mediaFile: c0?.file,
          sourceClipId: c0?.id,
          start: 0,
          duration: 0,
          animation: 'slide_left',
          animationDuration: 0.5,
          volume: 1.0,
        },
        {
          id: 'panel-s2v-1',
          name: 'Viñeta Derecha (50%)',
          x: 0.51,
          y: 0.015,
          width: 0.475,
          height: 0.97,
          mediaUrl: c1?.url || null,
          mediaType: c1?.type || 'video',
          mediaFile: c1?.file,
          sourceClipId: c1?.id,
          start: 0.25,
          duration: 0,
          animation: 'slide_right',
          animationDuration: 0.5,
          volume: 0,
        },
      ];
      break;
    }

    case 'split_2_horiz': {
      const c0 = getClipForIndex(0);
      const c1 = getClipForIndex(1);

      newPanels = [
        {
          id: 'panel-s2h-0',
          name: 'Viñeta Superior (50%)',
          x: 0.015,
          y: 0.015,
          width: 0.97,
          height: 0.475,
          mediaUrl: c0?.url || null,
          mediaType: c0?.type || 'video',
          mediaFile: c0?.file,
          sourceClipId: c0?.id,
          start: 0,
          duration: 0,
          animation: 'slide_top',
          animationDuration: 0.5,
          volume: 1.0,
        },
        {
          id: 'panel-s2h-1',
          name: 'Viñeta Inferior (50%)',
          x: 0.015,
          y: 0.51,
          width: 0.97,
          height: 0.475,
          mediaUrl: c1?.url || null,
          mediaType: c1?.type || 'video',
          mediaFile: c1?.file,
          sourceClipId: c1?.id,
          start: 0.25,
          duration: 0,
          animation: 'slide_bottom',
          animationDuration: 0.5,
          volume: 0,
        },
      ];
      break;
    }

    case 'grid_4': {
      const c0 = getClipForIndex(0);
      const c1 = getClipForIndex(1);
      const c2 = getClipForIndex(2);
      const c3 = getClipForIndex(3);

      newPanels = [
        {
          id: 'panel-g4-0',
          name: 'Viñeta 1 (Arriba Izq)',
          x: 0.015,
          y: 0.015,
          width: 0.47,
          height: 0.47,
          mediaUrl: c0?.url || null,
          mediaType: c0?.type || 'video',
          mediaFile: c0?.file,
          sourceClipId: c0?.id,
          start: 0,
          duration: 0,
          animation: 'slide_top',
          animationDuration: 0.45,
          volume: 1.0,
        },
        {
          id: 'panel-g4-1',
          name: 'Viñeta 2 (Arriba Der)',
          x: 0.515,
          y: 0.015,
          width: 0.47,
          height: 0.47,
          mediaUrl: c1?.url || null,
          mediaType: c1?.type || 'video',
          mediaFile: c1?.file,
          sourceClipId: c1?.id,
          start: 0.2,
          duration: 0,
          animation: 'slide_right',
          animationDuration: 0.45,
          volume: 0,
        },
        {
          id: 'panel-g4-2',
          name: 'Viñeta 3 (Abajo Izq)',
          x: 0.015,
          y: 0.515,
          width: 0.47,
          height: 0.47,
          mediaUrl: c2?.url || null,
          mediaType: c2?.type || 'video',
          mediaFile: c2?.file,
          sourceClipId: c2?.id,
          start: 0.4,
          duration: 0,
          animation: 'slide_left',
          animationDuration: 0.45,
          volume: 0,
        },
        {
          id: 'panel-g4-3',
          name: 'Viñeta 4 (Abajo Der)',
          x: 0.515,
          y: 0.515,
          width: 0.47,
          height: 0.47,
          mediaUrl: c3?.url || null,
          mediaType: c3?.type || 'video',
          mediaFile: c3?.file,
          sourceClipId: c3?.id,
          start: 0.6,
          duration: 0,
          animation: 'slide_bottom',
          animationDuration: 0.45,
          volume: 0,
        },
      ];
      break;
    }

    case 'strip_3_horiz': {
      const c0 = getClipForIndex(0);
      const c1 = getClipForIndex(1);
      const c2 = getClipForIndex(2);

      newPanels = [
        {
          id: 'panel-s3h-0',
          name: 'Tira Superior',
          x: 0.015,
          y: 0.015,
          width: 0.97,
          height: 0.305,
          mediaUrl: c0?.url || null,
          mediaType: c0?.type || 'video',
          mediaFile: c0?.file,
          sourceClipId: c0?.id,
          start: 0,
          duration: 0,
          animation: 'slide_left',
          animationDuration: 0.5,
          volume: 1.0,
        },
        {
          id: 'panel-s3h-1',
          name: 'Tira Central',
          x: 0.015,
          y: 0.345,
          width: 0.97,
          height: 0.305,
          mediaUrl: c1?.url || null,
          mediaType: c1?.type || 'video',
          mediaFile: c1?.file,
          sourceClipId: c1?.id,
          start: 0.3,
          duration: 0,
          animation: 'slide_right',
          animationDuration: 0.5,
          volume: 0,
        },
        {
          id: 'panel-s3h-2',
          name: 'Tira Inferior',
          x: 0.015,
          y: 0.675,
          width: 0.97,
          height: 0.305,
          mediaUrl: c2?.url || null,
          mediaType: c2?.type || 'video',
          mediaFile: c2?.file,
          sourceClipId: c2?.id,
          start: 0.6,
          duration: 0,
          animation: 'slide_left',
          animationDuration: 0.5,
          volume: 0,
        },
      ];
      break;
    }

    default:
      newPanels = [];
  }

  return {
    ...currentConfig,
    enabled: true,
    layout,
    borderWidth: baseBorderWidth,
    borderColor: baseBorderColor,
    borderRadius: baseBorderRadius,
    hasShadow: baseShadow,
    panels: newPanels,
  };
}
