import type { SubtitleItem } from '../types';

export class LocalSpeechService {
  private recognition: any = null;
  private isListening = false;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';
    }
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  startLiveTranscription(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: any) => void
  ) {
    if (!this.recognition) {
      onError(new Error('El navegador no soporta reconocimiento de voz nativo.'));
      return;
    }
    if (this.isListening) return;

    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error);
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn('Recognition already started or error', e);
    }
  }

  stopLiveTranscription() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Generates intelligent auto-subtitles locally with timestamps (0 tokens, 100% free)
   * Suitable for instant demo or video sync
   */
  generatePresetSubtitles(style: 'nature' | 'urban' | 'editorial' | 'inspirational', duration: number): SubtitleItem[] {
    const presets: Record<string, string[]> = {
      inspirational: [
        "Life is short.",
        "Stop putting limits on yourself!",
        "Every single step takes you closer.",
        "Just do it with passion.",
        "The summit is worth the climb."
      ],
      editorial: [
        "Rule of thirds composition.",
        "Guiding the eye through the frame.",
        "Where emotion lives and breathes.",
        "Capturing the modern essence.",
        "Framed in urban stillness."
      ],
      nature: [
        "Curug Sawer Sukabumi.",
        "The beauty of sacred flowing waters.",
        "Deep within the misty forest.",
        "Explore the raw nature.",
        "A peaceful escape from the world."
      ],
      urban: [
        "Ciudad en movimiento continuo.",
        "Historias que se cruzan cada segundo.",
        "Luces, sombras y perspectiva.",
        "El arte de mirar los detalles."
      ]
    };

    const lines = presets[style] || presets.inspirational;
    const interval = Math.max(2, duration / lines.length);

    return lines.map((text, i) => ({
      id: 'sub-' + (i + 1) + '-' + Date.now(),
      start: parseFloat((i * interval).toFixed(1)),
      end: parseFloat(((i + 1) * interval - 0.2).toFixed(1)),
      text
    }));
  }
}

export const speechService = new LocalSpeechService();
