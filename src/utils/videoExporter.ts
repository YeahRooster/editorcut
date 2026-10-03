import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  Mp4InputFormat,
  WebMInputFormat,
  Mp4OutputFormat,
  Conversion,
} from 'mediabunny';

export class VideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  async recordCanvas(
    canvas: HTMLCanvasElement,
    durationSeconds: number,
    audioTracks: MediaStreamTrack[] | MediaStreamAudioDestinationNode | MediaStream | null,
    onProgress: (percent: number) => void,
    onStartRecording?: () => void
  ): Promise<Blob> {
    this.recordedChunks = [];

    // Capture 60fps stream from canvas for perfectly smooth, fluid video rendering
    const canvasStream = canvas.captureStream(60);

    // If audio tracks are provided, add them to the canvasStream
    if (audioTracks) {
      if (Array.isArray(audioTracks)) {
        audioTracks.forEach((track) => {
          if (track.readyState === 'live') {
            canvasStream.addTrack(track);
          }
        });
      } else if (typeof MediaStream !== 'undefined' && audioTracks instanceof MediaStream) {
        audioTracks.getAudioTracks().forEach((track) => {
          if (track.readyState === 'live') {
            canvasStream.addTrack(track);
          }
        });
      } else if ('stream' in audioTracks && audioTracks.stream.getAudioTracks().length > 0) {
        audioTracks.stream.getAudioTracks().forEach((track) => {
          if (track.readyState === 'live') {
            canvasStream.addTrack(track);
          }
        });
      }
    }

    // Prioritize MP4 formats so Windows Media Player can play without extra codecs
    const mimeTypes = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedMime = 'video/webm';
    for (const mime of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        selectedMime = mime;
        break;
      }
    }

    this.mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType: selectedMime,
      videoBitsPerSecond: 8_000_000, // 8 Mbps high quality
    });

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) return reject(new Error('MediaRecorder unavailable'));

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const rawBlob = new Blob(this.recordedChunks, { type: selectedMime });

        try {
          // Remux fragmented stream into a progressive, standard MP4 with complete sample tables and duration
          const isWebm = selectedMime.includes('webm');
          const input = new Input({
            source: new BlobSource(rawBlob),
            formats: isWebm ? [new WebMInputFormat()] : [new Mp4InputFormat()],
          });
          const output = new Output({
            format: new Mp4OutputFormat(),
            target: new BufferTarget(),
          });

          const conversion = await Conversion.init({ input, output });
          await conversion.execute();

          const finalBuffer = output.target.buffer;
          if (finalBuffer && finalBuffer.byteLength > 0) {
            const finalBlob = new Blob([finalBuffer], { type: 'video/mp4' });
            resolve(finalBlob);
            return;
          }
        } catch (remuxErr) {
          console.warn('Fast remux to progressive MP4 fell back to raw blob:', remuxErr);
        }

        resolve(rawBlob);
      };

      this.mediaRecorder.onerror = (e) => {
        reject(e);
      };

      // 1000ms timeslices for smooth hardware encoder GOP pacing (avoids micro-lags from 100ms chunking)
      this.mediaRecorder.start(1000);

      // Trigger simultaneous un-freeze of audio & video playback
      if (onStartRecording) {
        onStartRecording();
      }

      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(100, Math.round((elapsed / durationSeconds) * 100));
        onProgress(progress);

        if (elapsed >= durationSeconds) {
          clearInterval(interval);
          if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            try {
              this.mediaRecorder.requestData();
            } catch (e) {}
            this.mediaRecorder.stop();
          }
        }
      }, 100);
    });
  }

  downloadBlob(blob: Blob, requestedFilename?: string) {
    const isMp4 = blob.type.includes('mp4') || !blob.type.includes('webm');
    const defaultFilename = isMp4 ? 'mi_video_editado.mp4' : 'mi_video_editado.webm';
    const filename = requestedFilename || defaultFilename;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}

export const videoExporter = new VideoExporter();
