import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Monitor,
  Camera,
  Layers,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Download,
  RotateCcw,
  Sparkles,
  AlertCircle,
  X,
  Radio,
  Crop,
  Minimize2,
  Maximize2,
  Move,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '../i18n/context';
import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  Mp4InputFormat,
  WebMInputFormat,
  Mp4OutputFormat,
  Conversion,
  getEncodableAudioCodecs,
} from 'mediabunny';

interface ScreenRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideoClip: (file: File) => void;
}

type RecordMode = 'screen_only' | 'screen_cam' | 'cam_only';
type AreaMode = 'fullscreen' | 'custom' | '16:9' | '9:16' | '1:1';
type PipPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
type PipShape = 'rounded' | 'circle';
type PipSize = 'sm' | 'md' | 'lg';
type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'paused' | 'review';

export interface PipCoord {
  x: number; // 0 to 1 normalized center
  y: number; // 0 to 1 normalized center
}

interface CropRect {
  x: number;      // 0 to 1 (normalized)
  y: number;      // 0 to 1 (normalized)
  width: number;  // 0 to 1 (normalized)
  height: number; // 0 to 1 (normalized)
}

export const ScreenRecorderModal: React.FC<ScreenRecorderModalProps> = ({
  isOpen,
  onClose,
  onAddVideoClip,
}) => {
  const { t } = useI18n();

  // Mode and settings
  const [mode, setMode] = useState<RecordMode>('screen_only');
  const [areaMode, setAreaMode] = useState<AreaMode>('fullscreen');
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const formatRef = useRef<'mp4' | 'webm'>('mp4');
  const [isConvertingMp4, setIsConvertingMp4] = useState<boolean>(false);
  const [cropRect, setCropRect] = useState<CropRect>({ x: 0, y: 0, width: 1, height: 1 });
  const [isAdjustingCrop, setIsAdjustingCrop] = useState<boolean>(false);

  const [pipPosition, setPipPosition] = useState<PipPosition>('bottom-right');
  const [pipCoord, setPipCoord] = useState<PipCoord>({ x: 0.88, y: 0.82 });
  const pipCoordRef = useRef<PipCoord>({ x: 0.88, y: 0.82 });
  const [isDraggingPip, setIsDraggingPip] = useState<boolean>(false);
  const floatingWebcamVideoRef = useRef<HTMLVideoElement | null>(null);

  const [pipShape, setPipShape] = useState<PipShape>('circle');
  const [pipSize, setPipSize] = useState<PipSize>('md');
  const [fps, setFps] = useState<60 | 30>(60);
  const [includeMic, setIncludeMic] = useState<boolean>(true);
  const [includeSystemAudio, setIncludeSystemAudio] = useState<boolean>(true);
  const [autoMinimize, setAutoMinimize] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Recording lifecycle
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [countdown, setCountdown] = useState<number>(3);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Active stream flags for UI
  const [hasScreenStream, setHasScreenStream] = useState<boolean>(false);
  const [hasWebcamStream, setHasWebcamStream] = useState<boolean>(false);

  // References
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const reviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vuAnimRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Crop interaction dragging state
  const dragModeRef = useRef<'none' | 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'new' | 'pip'>('none');
  const dragStartRef = useRef<{ x: number; y: number; rect: CropRect }>({
    x: 0,
    y: 0,
    rect: { x: 0, y: 0, width: 1, height: 1 }
  });

  // Clean stop for all media streams
  const stopAllMediaStreams = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ action: 'stop' });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (vuAnimRef.current) {
      cancelAnimationFrame(vuAnimRef.current);
      vuAnimRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setHasScreenStream(false);
    setHasWebcamStream(false);
    setAudioLevel(0);
  }, []);

  // Format seconds to HH:MM:SS or MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const h = Math.floor(m / 60);
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatFileSize = (blob: Blob | null) => {
    if (!blob) return '0 MB';
    const mb = blob.size / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // 1. Acquire Webcam
  const initWebcam = useCallback(async () => {
    try {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false,
      });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        await webcamVideoRef.current.play().catch(() => {});
      }
      setHasWebcamStream(true);
      return stream;
    } catch (err) {
      console.warn('Webcam permission error or not found:', err);
      setHasWebcamStream(false);
      return null;
    }
  }, []);

  // 2. Acquire Microphone & setup live VU meter
  const initMic = useCallback(async () => {
    try {
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContextClass();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          await ctx.resume().catch(() => {});
        }
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        const pcmData = new Uint8Array(analyser.frequencyBinCount);
        const checkAudioMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(pcmData);
          let sum = 0;
          for (let i = 0; i < pcmData.length; i++) {
            sum += pcmData[i];
          }
          const avg = sum / pcmData.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          vuAnimRef.current = requestAnimationFrame(checkAudioMeter);
        };
        vuAnimRef.current = requestAnimationFrame(checkAudioMeter);
      }
      return stream;
    } catch (err) {
      console.warn('Microphone error:', err);
      return null;
    }
  }, []);

  // 3. Stop recording helper for track ending
  const stopRecordingInternal = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.postMessage({ action: 'stop' });
    }
  }, []);

  // 4. Acquire Screen / Game
  const initScreen = useCallback(async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setErrorMessage(t.recorder.browserUnsupported);
        return null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: fps, max: 60 },
        } as MediaTrackConstraints,
        audio: includeSystemAudio,
      });

      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play().catch(() => {});
      }
      setHasScreenStream(true);

      // Handle user stopping screen share via browser's native stop sharing bar
      stream.getVideoTracks()[0].onended = () => {
        setHasScreenStream(false);
        stopRecordingInternal();
        setIsMinimized(false);
      };

      return stream;
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name !== 'NotAllowedError') {
        console.error('Screen capture error:', error);
      }
      setErrorMessage(t.recorder.permissionDenied);
      setHasScreenStream(false);
      return null;
    }
  }, [fps, includeSystemAudio, stopRecordingInternal, t.recorder.browserUnsupported, t.recorder.permissionDenied]);

  // Adjust crop preset
  const applyAreaPreset = useCallback((preset: AreaMode) => {
    setAreaMode(preset);
    if (preset === 'fullscreen') {
      setCropRect({ x: 0, y: 0, width: 1, height: 1 });
      setIsAdjustingCrop(false);
      return;
    }

    setIsAdjustingCrop(true);
    const screenVid = screenVideoRef.current;
    const aspect = screenVid && screenVid.videoWidth > 0
      ? screenVid.videoWidth / screenVid.videoHeight
      : 16 / 9;

    if (preset === '16:9') {
      const targetAspect = 16 / 9;
      if (aspect > targetAspect) {
        const normW = targetAspect / aspect;
        setCropRect({ x: (1 - normW) / 2, y: 0, width: normW, height: 1 });
      } else {
        const normH = aspect / targetAspect;
        setCropRect({ x: 0, y: (1 - normH) / 2, width: 1, height: normH });
      }
    } else if (preset === '9:16') {
      const targetAspect = 9 / 16;
      const normW = targetAspect / aspect;
      setCropRect({ x: Math.max(0, (1 - normW) / 2), y: 0, width: Math.min(1, normW), height: 1 });
    } else if (preset === '1:1') {
      if (aspect > 1) {
        const normW = 1 / aspect;
        setCropRect({ x: (1 - normW) / 2, y: 0, width: normW, height: 1 });
      } else {
        const normH = aspect;
        setCropRect({ x: 0, y: (1 - normH) / 2, width: 1, height: normH });
      }
    } else if (preset === 'custom') {
      setCropRect({ x: 0.15, y: 0.15, width: 0.7, height: 0.7 });
    }
  }, []);

  // Web Worker & Rendering Loop
  // A dedicated Web Worker timer guarantees frames render continuously even when tab is backgrounded!
  useEffect(() => {
    if (!isOpen || status === 'review') return;

    // Create inline worker
    const workerScript = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data.action === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(function() {
            self.postMessage('tick');
          }, 1000 / (e.data.fps || 60));
        } else if (e.data.action === 'stop') {
          if (timer) clearInterval(timer);
          timer = null;
        }
      };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    workerRef.current = worker;

    const drawFrame = () => {
      const screenVid = screenVideoRef.current;
      const webcamVid = webcamVideoRef.current;
      const prevCanvas = previewCanvasRef.current;
      const recCanvas = recordCanvasRef.current;

      const sW = screenVid?.videoWidth || 1920;
      const sH = screenVid?.videoHeight || 1080;

      // 1. Calculate Crop Bounds in pixels
      const isCropped = areaMode !== 'fullscreen' && mode !== 'cam_only';
      const cropX = Math.round(cropRect.x * sW);
      const cropY = Math.round(cropRect.y * sH);
      const cropW = Math.max(16, Math.round(cropRect.width * sW));
      const cropH = Math.max(16, Math.round(cropRect.height * sH));

      // 2. Render Recording Canvas (when cropping or when webcam PiP is active)
      if (recCanvas) {
        let outW = isCropped ? cropW : sW;
        let outH = isCropped ? cropH : sH;

        if (mode === 'cam_only') {
          outW = webcamVid?.videoWidth || 1280;
          outH = webcamVid?.videoHeight || 720;
        }

        // Even dimensions required for standard H264/VP9 codecs
        if (outW % 2 !== 0) outW -= 1;
        if (outH % 2 !== 0) outH -= 1;

        if (recCanvas.width !== outW || recCanvas.height !== outH) {
          recCanvas.width = outW;
          recCanvas.height = outH;
        }

        const rCtx = recCanvas.getContext('2d');
        if (rCtx) {
          rCtx.fillStyle = '#09090b';
          rCtx.fillRect(0, 0, outW, outH);

          if (mode === 'cam_only') {
            if (webcamVid && webcamVid.readyState >= 2) {
              rCtx.drawImage(webcamVid, 0, 0, outW, outH);
            }
          } else {
            // Draw Screen / Cropped Screen
            if (screenVid && screenVid.readyState >= 2) {
              if (isCropped) {
                rCtx.drawImage(screenVid, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
              } else {
                rCtx.drawImage(screenVid, 0, 0, outW, outH);
              }
            }
          }
        }
      }

      // 3. Render Preview Canvas for User Interface
      if (prevCanvas) {
        if (prevCanvas.width !== sW || prevCanvas.height !== sH) {
          prevCanvas.width = sW;
          prevCanvas.height = sH;
        }

        const pCtx = prevCanvas.getContext('2d');
        if (pCtx) {
          pCtx.fillStyle = '#09090b';
          pCtx.fillRect(0, 0, sW, sH);

          if (mode === 'cam_only') {
            if (webcamVid && webcamVid.readyState >= 2) {
              pCtx.drawImage(webcamVid, 0, 0, sW, sH);
            }
          } else {
            // Draw Screen
            if (screenVid && screenVid.readyState >= 2) {
              pCtx.drawImage(screenVid, 0, 0, sW, sH);
            } else {
              // Grid pattern placeholder
              pCtx.fillStyle = '#18181b';
              pCtx.fillRect(0, 0, sW, sH);
              pCtx.strokeStyle = '#27272a';
              pCtx.lineWidth = 1;
              for (let x = 0; x < sW; x += 80) {
                pCtx.beginPath();
                pCtx.moveTo(x, 0);
                pCtx.lineTo(x, sH);
                pCtx.stroke();
              }
              for (let y = 0; y < sH; y += 80) {
                pCtx.beginPath();
                pCtx.moveTo(0, y);
                pCtx.lineTo(sW, y);
                pCtx.stroke();
              }
              pCtx.fillStyle = '#71717a';
              pCtx.font = 'bold 36px sans-serif';
              pCtx.textAlign = 'center';
              pCtx.fillText(t.recorder.noScreenSelected, sW / 2, sH / 2);
            }

            // Draw Area Selection Overlays
            if (isCropped && screenVid && screenVid.readyState >= 2) {
              // Dim outside region
              pCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
              // Top
              pCtx.fillRect(0, 0, sW, cropY);
              // Bottom
              pCtx.fillRect(0, cropY + cropH, sW, sH - (cropY + cropH));
              // Left
              pCtx.fillRect(0, cropY, cropX, cropH);
              // Right
              pCtx.fillRect(cropX + cropW, cropY, sW - (cropX + cropW), cropH);

              // Highlight outline
              pCtx.strokeStyle = '#e11d48';
              pCtx.lineWidth = 4;
              pCtx.strokeRect(cropX, cropY, cropW, cropH);

              // Corner handles
              const handleSize = Math.max(12, Math.round(sW * 0.012));
              pCtx.fillStyle = '#ffffff';
              pCtx.strokeStyle = '#e11d48';
              pCtx.lineWidth = 3;

              const corners = [
                { x: cropX, y: cropY },
                { x: cropX + cropW, y: cropY },
                { x: cropX + cropW, y: cropY + cropH },
                { x: cropX, y: cropY + cropH },
              ];

              corners.forEach((c) => {
                pCtx.beginPath();
                pCtx.rect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
                pCtx.fill();
                pCtx.stroke();
              });

              // Area dimension tag
              pCtx.fillStyle = '#e11d48';
              pCtx.font = 'bold 20px monospace';
              const textTag = `${cropW} x ${cropH} px`;
              pCtx.fillRect(cropX, Math.max(0, cropY - 30), pCtx.measureText(textTag).width + 16, 28);
              pCtx.fillStyle = '#ffffff';
              pCtx.fillText(textTag, cropX + 8, Math.max(0, cropY - 30) + 20);
            }

            // Draw PiP overlay on preview
            if (mode === 'screen_cam' && webcamVid && webcamVid.readyState >= 2) {
              let pipScale = 0.15;
              if (pipSize === 'sm') pipScale = 0.11;
              if (pipSize === 'lg') pipScale = 0.20;

              const pipW = Math.round(sW * pipScale);
              const pipH = pipShape === 'circle' ? pipW : Math.round(pipW * (9 / 16));

              // Use normalized real-time draggable coordinates
              const normX = pipCoordRef.current.x;
              const normY = pipCoordRef.current.y;
              let pipX = Math.round(normX * sW - pipW / 2);
              let pipY = Math.round(normY * sH - pipH / 2);

              pipX = Math.max(10, Math.min(sW - pipW - 10, pipX));
              pipY = Math.max(10, Math.min(sH - pipH - 10, pipY));

              pCtx.save();
              if (pipShape === 'circle') {
                const r = pipW / 2;
                pCtx.beginPath();
                pCtx.arc(pipX + r, pipY + r, r, 0, Math.PI * 2);
                pCtx.clip();

                // Mirror webcam horizontally for natural reflection
                pCtx.translate(pipX + pipW, pipY);
                pCtx.scale(-1, 1);

                const vAspect = webcamVid.videoWidth / webcamVid.videoHeight;
                let srcW = webcamVid.videoWidth;
                let srcH = webcamVid.videoHeight;
                let srcX = 0;
                let srcY = 0;
                if (vAspect > 1) {
                  srcW = webcamVid.videoHeight;
                  srcX = (webcamVid.videoWidth - srcW) / 2;
                } else {
                  srcH = webcamVid.videoWidth;
                  srcY = (webcamVid.videoHeight - srcH) / 2;
                }
                pCtx.drawImage(webcamVid, srcX, srcY, srcW, srcH, 0, 0, pipW, pipW);
                pCtx.restore();

                pCtx.beginPath();
                pCtx.arc(pipX + r, pipY + r, r, 0, Math.PI * 2);
                pCtx.lineWidth = 4;
                pCtx.strokeStyle = '#e11d48';
                pCtx.stroke();
              } else {
                pCtx.beginPath();
                if (pCtx.roundRect) pCtx.roundRect(pipX, pipY, pipW, pipH, 16);
                else pCtx.rect(pipX, pipY, pipW, pipH);
                pCtx.clip();

                // Mirror webcam horizontally
                pCtx.translate(pipX + pipW, pipY);
                pCtx.scale(-1, 1);
                pCtx.drawImage(webcamVid, 0, 0, pipW, pipH);
                pCtx.restore();

                pCtx.beginPath();
                if (pCtx.roundRect) pCtx.roundRect(pipX, pipY, pipW, pipH, 16);
                else pCtx.rect(pipX, pipY, pipW, pipH);
                pCtx.lineWidth = 4;
                pCtx.strokeStyle = '#e11d48';
                pCtx.stroke();
              }
            }
          }
        }
      }
    };

    worker.onmessage = () => {
      drawFrame();
    };

    worker.postMessage({ action: 'start', fps });

    return () => {
      worker.postMessage({ action: 'stop' });
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      workerRef.current = null;
    };
  }, [isOpen, mode, areaMode, cropRect, pipPosition, pipShape, pipSize, fps, status, t.recorder.noScreenSelected]);

  // Handle stream mode adjustments on change
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'screen_cam') {
      if (!webcamStreamRef.current) initWebcam();
      if (!screenStreamRef.current) initScreen();
    } else if (mode === 'cam_only') {
      if (!webcamStreamRef.current) initWebcam();
    } else if (mode === 'screen_only') {
      if (!screenStreamRef.current) initScreen();
    }

    if (includeMic && !micStreamRef.current) {
      initMic();
    }
  }, [isOpen, mode, includeMic, initWebcam, initScreen, initMic]);

  // Sync formatRef and pipCoordRef
  useEffect(() => {
    formatRef.current = format;
  }, [format]);

  useEffect(() => {
    pipCoordRef.current = pipCoord;
  }, [pipCoord]);

  // Connect live webcam to floating preview element
  useEffect(() => {
    if (floatingWebcamVideoRef.current && webcamStreamRef.current) {
      floatingWebcamVideoRef.current.srcObject = webcamStreamRef.current;
      floatingWebcamVideoRef.current.play().catch(() => {});
    }
  }, [hasWebcamStream, isMinimized, status, mode]);

  // Global mouse & touch listeners for dragging the floating webcam window
  useEffect(() => {
    if (!isDraggingPip) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = Math.max(0.06, Math.min(0.94, e.clientX / window.innerWidth));
      const y = Math.max(0.06, Math.min(0.94, e.clientY / window.innerHeight));
      setPipCoord({ x, y });
      setPipPosition('custom');
    };

    const handleMouseUp = () => {
      setIsDraggingPip(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const x = Math.max(0.06, Math.min(0.94, touch.clientX / window.innerWidth));
        const y = Math.max(0.06, Math.min(0.94, touch.clientY / window.innerHeight));
        setPipCoord({ x, y });
        setPipPosition('custom');
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingPip(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingPip]);

  // System Picture-in-Picture window (Always on Top over games / desktop)
  const toggleSystemPip = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (floatingWebcamVideoRef.current) {
        await floatingWebcamVideoRef.current.requestPictureInPicture();
      } else if (webcamVideoRef.current) {
        await webcamVideoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('System Picture in Picture not available or rejected:', err);
    }
  };

  // Helper to select preset corner positions
  const handleSelectPipPosition = (pos: PipPosition) => {
    setPipPosition(pos);
    if (pos === 'bottom-right') setPipCoord({ x: 0.88, y: 0.82 });
    else if (pos === 'bottom-left') setPipCoord({ x: 0.12, y: 0.82 });
    else if (pos === 'top-right') setPipCoord({ x: 0.88, y: 0.18 });
    else if (pos === 'top-left') setPipCoord({ x: 0.12, y: 0.18 });
  };

  const handlePipStartDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPip(true);
  };

  const handlePipTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDraggingPip(true);
  };

  // Clean up on modal close
  useEffect(() => {
    if (!isOpen) {
      stopAllMediaStreams();
      setStatus('idle');
      setIsMinimized(false);
      setIsConvertingMp4(false);
      setRecordedBlob(null);
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(null);
      }
    }
  }, [isOpen, stopAllMediaStreams, recordedUrl]);

  // Interactive Crop & Facecam Dragging Handlers
  const handlePreviewMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    // Check if clicking on the webcam Facecam in screen_cam mode
    if (mode === 'screen_cam') {
      const distToPip = Math.hypot(mouseX - pipCoord.x, mouseY - pipCoord.y);
      if (distToPip < 0.14) {
        dragModeRef.current = 'pip';
        return;
      }
    }

    if (areaMode === 'fullscreen' || status === 'recording' || status === 'paused') return;

    const { x, y, width, height } = cropRect;
    const tol = 0.05; // Hit tolerance

    // Check corners
    if (Math.abs(mouseX - x) < tol && Math.abs(mouseY - y) < tol) {
      dragModeRef.current = 'nw';
    } else if (Math.abs(mouseX - (x + width)) < tol && Math.abs(mouseY - y) < tol) {
      dragModeRef.current = 'ne';
    } else if (Math.abs(mouseX - (x + width)) < tol && Math.abs(mouseY - (y + height)) < tol) {
      dragModeRef.current = 'se';
    } else if (Math.abs(mouseX - x) < tol && Math.abs(mouseY - (y + height)) < tol) {
      dragModeRef.current = 'sw';
    } else if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
      dragModeRef.current = 'move';
    } else {
      dragModeRef.current = 'new';
      setCropRect({ x: mouseX, y: mouseY, width: 0.05, height: 0.05 });
    }

    dragStartRef.current = {
      x: mouseX,
      y: mouseY,
      rect: { ...cropRect }
    };
  };

  const handlePreviewMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragModeRef.current === 'none') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const curX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const curY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    if (dragModeRef.current === 'pip') {
      const newX = Math.max(0.06, Math.min(0.94, curX));
      const newY = Math.max(0.06, Math.min(0.94, curY));
      setPipCoord({ x: newX, y: newY });
      setPipPosition('custom');
      return;
    }

    if (areaMode === 'fullscreen') return;

    const dx = curX - dragStartRef.current.x;
    const dy = curY - dragStartRef.current.y;
    const sRect = dragStartRef.current.rect;

    if (dragModeRef.current === 'move') {
      const newX = Math.max(0, Math.min(1 - sRect.width, sRect.x + dx));
      const newY = Math.max(0, Math.min(1 - sRect.height, sRect.y + dy));
      setCropRect({ ...sRect, x: newX, y: newY });
    } else if (dragModeRef.current === 'se') {
      const newW = Math.max(0.1, Math.min(1 - sRect.x, sRect.width + dx));
      const newH = Math.max(0.1, Math.min(1 - sRect.y, sRect.height + dy));
      setCropRect({ ...sRect, width: newW, height: newH });
    } else if (dragModeRef.current === 'nw') {
      const newX = Math.max(0, Math.min(sRect.x + sRect.width - 0.1, sRect.x + dx));
      const newY = Math.max(0, Math.min(sRect.y + sRect.height - 0.1, sRect.y + dy));
      const newW = sRect.width - (newX - sRect.x);
      const newH = sRect.height - (newY - sRect.y);
      setCropRect({ x: newX, y: newY, width: newW, height: newH });
    } else if (dragModeRef.current === 'new') {
      const x = Math.min(dragStartRef.current.x, curX);
      const y = Math.min(dragStartRef.current.y, curY);
      const width = Math.max(0.08, Math.abs(curX - dragStartRef.current.x));
      const height = Math.max(0.08, Math.abs(curY - dragStartRef.current.y));
      setCropRect({ x, y, width, height });
    }
  };

  const handlePreviewMouseUp = () => {
    dragModeRef.current = 'none';
  };

  // Start countdown trigger
  const handleStartCountdown = () => {
    if (mode !== 'cam_only' && !screenStreamRef.current) {
      initScreen().then((stream) => {
        if (stream) triggerCountdown();
      });
    } else {
      triggerCountdown();
    }
  };

  const triggerCountdown = () => {
    setStatus('countdown');
    setCountdown(3);
    setErrorMessage(null);

    let current = 3;
    const countTimer = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
      } else {
        clearInterval(countTimer);
        startActualRecording();
      }
    }, 1000);
  };

  // Start the actual MediaRecorder
  const startActualRecording = async () => {
    try {
      let finalVideoTrack: MediaStreamTrack | null = null;
      const isDirectScreen = (mode === 'screen_only' || mode === 'screen_cam') && areaMode === 'fullscreen';

      // CRITICAL FIX: If screen-only or screen+cam in full screen, record native stream track directly!
      // This eliminates duplicate overlays, provides native 60 FPS and prevents background throttling!
      if (isDirectScreen && screenStreamRef.current) {
        finalVideoTrack = screenStreamRef.current.getVideoTracks()[0];
      } else if (mode === 'cam_only' && webcamStreamRef.current) {
        finalVideoTrack = webcamStreamRef.current.getVideoTracks()[0];
      } else {
        // When cropped or screen+cam PiP, capture from background-worker-driven canvas
        const recCanvas = recordCanvasRef.current;
        if (!recCanvas) return;
        const canvasStream = recCanvas.captureStream(fps);
        finalVideoTrack = canvasStream.getVideoTracks()[0];
      }

      if (!finalVideoTrack) {
        setErrorMessage('No hay pista de video disponible para grabar');
        setStatus('idle');
        return;
      }

      // Audio mixing with AudioContext
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const audioDest = audioCtx.createMediaStreamDestination();
      audioDestRef.current = audioDest;

      // Add system audio from screen stream if enabled
      if (includeSystemAudio && screenStreamRef.current) {
        const sysTracks = screenStreamRef.current.getAudioTracks();
        if (sysTracks.length > 0) {
          const sysSource = audioCtx.createMediaStreamSource(new MediaStream([sysTracks[0]]));
          sysSource.connect(audioDest);
        }
      }

      // Add microphone audio if enabled
      if (includeMic && micStreamRef.current) {
        const micTracks = micStreamRef.current.getAudioTracks();
        if (micTracks.length > 0) {
          const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTracks[0]]));
          micSource.connect(audioDest);
        }
      }

      const combinedTracks: MediaStreamTrack[] = [finalVideoTrack];
      const mixedAudioTracks = audioDest.stream.getAudioTracks();
      if (mixedAudioTracks.length > 0) {
        combinedTracks.push(mixedAudioTracks[0]);
      }

      const finalStream = new MediaStream(combinedTracks);

      // Choose supported MIME type prioritizing MP4/H264/AAC when MP4 format is active
      const preferredMimes = formatRef.current === 'mp4'
        ? [
            'video/mp4;codecs=avc1,mp4a.40.2',
            'video/mp4;codecs=avc1',
            'video/mp4',
            'video/webm;codecs=h264,opus',
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
          ]
        : [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
          ];
      const selectedMime = preferredMimes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(finalStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 8_000_000, // 8 Mbps for pristine 60 FPS gameplay & crisp drawing
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Immediately terminate screen share, webcam and mic streams so Chrome / Windows removes the sharing bar
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = null;
        }
        if (webcamStreamRef.current) {
          webcamStreamRef.current.getTracks().forEach((track) => track.stop());
          webcamStreamRef.current = null;
        }
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = null;
        }
        if (floatingWebcamVideoRef.current) {
          floatingWebcamVideoRef.current.srcObject = null;
        }
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }
        if (document.pictureInPictureElement) {
          document.exitPictureInPicture().catch(() => {});
        }
        setHasScreenStream(false);
        setHasWebcamStream(false);
        setAudioLevel(0);

        const rawBlob = new Blob(recordedChunksRef.current, { type: selectedMime });
        const targetFormat = formatRef.current;

        if (targetFormat === 'mp4') {
          setIsConvertingMp4(true);
          try {
            const isWebm = rawBlob.type.includes('webm');
            const input = new Input({
              source: new BlobSource(rawBlob),
              formats: isWebm ? [new WebMInputFormat()] : [new Mp4InputFormat()],
            });
            const output = new Output({
              format: new Mp4OutputFormat(),
              target: new BufferTarget(),
            });

            // Universal Audio: Ensure MP4 contains AAC audio (mp4a.40.2)
            // Windows Media Player, QuickTime, iOS, TVs and WhatsApp require AAC in MP4
            let audioConfig: { codec: 'aac' } | undefined = undefined;
            try {
              const encodable = await getEncodableAudioCodecs();
              if (encodable.includes('aac')) {
                audioConfig = { codec: 'aac' };
              }
            } catch {
              audioConfig = { codec: 'aac' };
            }

            const conversion = await Conversion.init({
              input,
              output,
              audio: audioConfig,
            });
            await conversion.execute();

            const finalBuffer = output.target.buffer;
            if (finalBuffer && finalBuffer.byteLength > 0) {
              const mp4Blob = new Blob([finalBuffer], { type: 'video/mp4' });
              setRecordedBlob(mp4Blob);
              const url = URL.createObjectURL(mp4Blob);
              setRecordedUrl(url);
              setIsMinimized(false);
              setIsConvertingMp4(false);
              setStatus('review');
              return;
            }
          } catch (remuxErr) {
            console.warn('Fast remux to progressive MP4 fell back to raw blob:', remuxErr);
          } finally {
            setIsConvertingMp4(false);
          }
        }

        setRecordedBlob(rawBlob);
        const url = URL.createObjectURL(rawBlob);
        setRecordedUrl(url);
        setIsMinimized(false);
        setStatus('review');
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      setStatus('recording');
      setRecordingSeconds(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Auto-minimize if enabled so the modal doesn't block the user's view
      if (autoMinimize) {
        setIsMinimized(true);
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      setErrorMessage('Error al inicializar la grabación');
      setStatus('idle');
      setIsMinimized(false);
    }
  };

  // Pause / Resume
  const togglePauseRecording = () => {
    if (!mediaRecorderRef.current) return;
    if (status === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else if (status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    stopRecordingInternal();
    setIsMinimized(false);
  };

  // Discard & Record Again
  const handleRecordAgain = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setRecordedBlob(null);
    setRecordingSeconds(0);
    setIsConvertingMp4(false);
    setStatus('idle');
    setIsMinimized(false);
  };

  // Import directly to EditorCut Timeline
  const handleImportToTimeline = () => {
    if (!recordedBlob) return;
    const timestamp = Date.now();
    const ext = format === 'mp4' ? 'mp4' : 'webm';
    const mime = format === 'mp4' ? 'video/mp4' : (recordedBlob.type || 'video/webm');
    const file = new File(
      [recordedBlob],
      `Grabacion_Pantalla_${timestamp}.${ext}`,
      { type: mime }
    );
    onAddVideoClip(file);
    onClose();
  };

  // Direct download to user's computer
  const handleDownloadFile = () => {
    if (!recordedBlob || !recordedUrl) return;
    const ext = format === 'mp4' ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `EditorCut_Grabacion_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Hidden processing video elements and offscreen recording canvas */}
      <video ref={screenVideoRef} className="hidden" playsInline muted autoPlay />
      <video ref={webcamVideoRef} className="hidden" playsInline muted autoPlay />
      <canvas ref={recordCanvasRef} className="hidden" />

      {/* ========================================================================= */}
      {/* FLOATING DRAGGABLE WEBCAM WIDGET (LIVE FACECAM OVERLAY)                   */}
      {/* Visible in screen_cam mode when minimized or recording                    */}
      {/* ========================================================================= */}
      {mode === 'screen_cam' && (isMinimized || status === 'recording' || status === 'paused') && (
        <div
          style={{
            position: 'fixed',
            left: `${pipCoord.x * 100}%`,
            top: `${pipCoord.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
          }}
          className="group select-none touch-none animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Draggable Camera Container */}
          <div
            onMouseDown={handlePipStartDrag}
            onTouchStart={handlePipTouchStart}
            className={`relative cursor-grab active:cursor-grabbing transition-all duration-150 border-4 border-rose-500 bg-neutral-950 shadow-2xl shadow-black/80 hover:border-rose-400 ${
              pipShape === 'circle' ? 'rounded-full' : 'rounded-2xl'
            } ${
              pipSize === 'sm'
                ? pipShape === 'circle' ? 'w-36 h-36' : 'w-52 h-32'
                : pipSize === 'lg'
                ? pipShape === 'circle' ? 'w-64 h-64' : 'w-80 h-48'
                : pipShape === 'circle' ? 'w-48 h-48' : 'w-64 h-38'
            } overflow-hidden`}
          >
            <video
              ref={floatingWebcamVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1] pointer-events-none"
            />

            {/* If webcam stream not ready */}
            {!hasWebcamStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 p-2 text-center text-neutral-400 pointer-events-none">
                <Camera className="w-6 h-6 text-rose-500 mb-1 animate-pulse" />
                <span className="text-[10px] font-bold">Iniciando cámara...</span>
              </div>
            )}
          </div>

          {/* Quick Floating Controls Bar on Hover */}
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 px-2 py-1 rounded-xl shadow-2xl shadow-black text-white text-[10px] whitespace-nowrap z-30 pointer-events-auto">
            {/* Shape toggle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPipShape(pipShape === 'circle' ? 'rounded' : 'circle');
              }}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition"
              title="Cambiar forma (Círculo / Rectángulo)"
            >
              {pipShape === 'circle' ? '▢' : '○'}
            </button>

            <span className="w-px h-3 bg-neutral-700 mx-0.5" />

            {/* Size cycle */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPipSize(pipSize === 'sm' ? 'md' : pipSize === 'md' ? 'lg' : 'sm');
              }}
              className="px-1.5 py-0.5 hover:bg-neutral-800 rounded font-mono font-bold text-neutral-300 hover:text-white transition"
              title="Cambiar tamaño (S / M / L)"
            >
              {pipSize.toUpperCase()}
            </button>

            {/* System Picture-in-Picture Toggle */}
            <span className="w-px h-3 bg-neutral-700 mx-0.5" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSystemPip();
              }}
              className="px-1.5 py-0.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-rose-400 transition flex items-center gap-1"
              title={t.recorder.pipSystemWindow || 'Flotar sobre otras apps (PiP)'}
            >
              <ExternalLink className="w-3 h-3" />
              <span className="text-[9px]">Flotar fuera</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MINIMIZED FLOATING RECORDING BAR (NON-BLOCKING OVERLAY)                   */}
      {/* ========================================================================= */}
      {isMinimized && (status === 'recording' || status === 'paused' || status === 'idle') ? (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-neutral-900/95 backdrop-blur-xl border border-rose-500/50 px-4 py-2.5 rounded-full shadow-2xl shadow-black text-white select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Status & Time */}
          <div className="flex items-center gap-2 pr-3 border-r border-neutral-700">
            <span className={`w-3 h-3 rounded-full ${status === 'recording' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-mono font-bold text-xs sm:text-sm">
              {formatTime(recordingSeconds)}
            </span>
            <span className="text-[10px] font-mono uppercase text-neutral-400 px-1.5 py-0.5 rounded bg-neutral-800">
              {areaMode === 'fullscreen' ? '100%' : areaMode}
            </span>
            <span className="text-[10px] font-mono uppercase text-rose-400 font-bold px-1.5 py-0.5 rounded bg-neutral-800 border border-rose-500/30">
              {format}
            </span>
          </div>

          {/* Action buttons */}
          <button
            onClick={togglePauseRecording}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
            title={status === 'paused' ? t.recorder.resumeBtn : t.recorder.pauseBtn}
          >
            {status === 'paused' ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950 transition"
            title={t.recorder.stopBtn}
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>{t.recorder.stopBtn}</span>
          </button>

          {/* Camera Pip Toggle if screen_cam */}
          {mode === 'screen_cam' && (
            <button
              onClick={toggleSystemPip}
              className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-rose-400 hover:text-white transition"
              title={t.recorder.pipSystemWindow || 'Flotar sobre otras apps (PiP)'}
            >
              <Camera className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition ml-1"
            title={t.recorder.maximize}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* ========================================================================= */
        /* FULL STUDIO MODAL DIALOG                                                  */
        /* ========================================================================= */
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] my-auto">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/80 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-950/50">
                  <Radio className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      {t.recorder.title}
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {t.recorder.badgeObs}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 hidden sm:block">
                    {t.recorder.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Minimize to Floating Bar Button */}
                {(status === 'recording' || status === 'paused' || status === 'idle') && (
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                    title={t.recorder.minimizeToFloating}
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                  title={t.common.close}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
              {errorMessage && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {isConvertingMp4 ? (
                /* ========================================================================= */
                /* CONVERTING MP4 LOADER                                                     */
                /* ========================================================================= */
                <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center animate-in fade-in duration-300">
                  <div className="relative w-16 h-16">
                    <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin" />
                    <Sparkles className="w-6 h-6 text-rose-400 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      {t.recorder.processingMp4}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Creando video MP4 progresivo y de alta compatibilidad...
                    </p>
                  </div>
                </div>
              ) : status === 'review' ? (
                /* ========================================================================= */
                /* REVIEW / PREVIEW VIEW: Post-Recording Actions                             */
                /* ========================================================================= */
                <div className="space-y-4 text-center">
                  <div className="relative aspect-video max-h-[50vh] mx-auto rounded-xl overflow-hidden bg-black border border-neutral-800 shadow-2xl">
                    {recordedUrl && (
                      <video
                        ref={reviewVideoRef}
                        src={recordedUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  {/* Metadata Summary */}
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-neutral-300">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-500">{t.recorder.duration}:</span>
                      <span className="font-bold text-white font-mono">{formatTime(recordingSeconds)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-500">{t.recorder.fileSize}:</span>
                      <span className="font-bold text-white font-mono">{formatFileSize(recordedBlob)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-500">{t.recorder.format}:</span>
                      <span className="font-bold text-rose-400 font-mono uppercase">{format}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-500">{t.recorder.areaMode}:</span>
                      <span className="font-bold text-neutral-200 font-mono">
                        {areaMode === 'fullscreen' ? t.recorder.areaFullscreen : areaMode}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleImportToTimeline}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-950/50 transition transform active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{t.recorder.importToEditor}</span>
                    </button>

                    <button
                      onClick={handleDownloadFile}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs sm:text-sm border border-neutral-700 transition"
                    >
                      <Download className="w-4 h-4 text-neutral-300" />
                      <span>{format === 'mp4' ? t.recorder.downloadVideoMp4 : t.recorder.downloadVideoWebm}</span>
                    </button>

                    <button
                      onClick={handleRecordAgain}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-semibold text-xs sm:text-sm border border-neutral-800 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t.recorder.recordAgain}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ========================================================================= */
                /* LIVE STUDIO CANVAS & CONTROLS                                             */
                /* ========================================================================= */
                <div className="space-y-3.5">
                  {/* Top Bar: Mode & Area Selection */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    {/* Mode Pickers */}
                    <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-1 gap-1">
                      <button
                        onClick={() => setMode('screen_only')}
                        disabled={status === 'recording' || status === 'paused'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          mode === 'screen_only'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        } disabled:opacity-50`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>{t.recorder.modeScreen}</span>
                      </button>

                      <button
                        onClick={() => setMode('screen_cam')}
                        disabled={status === 'recording' || status === 'paused'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          mode === 'screen_cam'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        } disabled:opacity-50`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>{t.recorder.modeScreenCam}</span>
                      </button>

                      <button
                        onClick={() => setMode('cam_only')}
                        disabled={status === 'recording' || status === 'paused'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          mode === 'cam_only'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        } disabled:opacity-50`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t.recorder.modeCam}</span>
                      </button>
                    </div>

                    {/* Area / Region Selector */}
                    {mode !== 'cam_only' && (
                      <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-xl p-1 gap-1">
                        <span className="text-[11px] font-bold text-neutral-400 px-1.5 flex items-center gap-1">
                          <Crop className="w-3.5 h-3.5 text-rose-500" />
                          <span>{t.recorder.areaMode}:</span>
                        </span>

                        <button
                          onClick={() => applyAreaPreset('fullscreen')}
                          disabled={status === 'recording' || status === 'paused'}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                            areaMode === 'fullscreen'
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {t.recorder.areaFullscreen}
                        </button>

                        <button
                          onClick={() => applyAreaPreset('9:16')}
                          disabled={status === 'recording' || status === 'paused'}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                            areaMode === '9:16'
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title="Recorte vertical para TikTok / Reels"
                        >
                          9:16
                        </button>

                        <button
                          onClick={() => applyAreaPreset('16:9')}
                          disabled={status === 'recording' || status === 'paused'}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                            areaMode === '16:9'
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title="Recorte 16:9 estándar"
                        >
                          16:9
                        </button>

                        <button
                          onClick={() => applyAreaPreset('1:1')}
                          disabled={status === 'recording' || status === 'paused'}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                            areaMode === '1:1'
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title="Recorte cuadrado 1:1"
                        >
                          1:1
                        </button>

                        <button
                          onClick={() => applyAreaPreset('custom')}
                          disabled={status === 'recording' || status === 'paused'}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                            areaMode === 'custom'
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                          title={t.recorder.areaDragTip}
                        >
                          {t.recorder.areaCustom}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Interactive Studio Preview Canvas */}
                  <div className="relative aspect-video max-h-[46vh] rounded-2xl overflow-hidden bg-black border-2 border-neutral-800 shadow-2xl flex items-center justify-center group select-none">
                    <canvas
                      ref={previewCanvasRef}
                      onMouseDown={handlePreviewMouseDown}
                      onMouseMove={handlePreviewMouseMove}
                      onMouseUp={handlePreviewMouseUp}
                      className={`w-full h-full object-contain ${
                        areaMode !== 'fullscreen' && status === 'idle' ? 'cursor-crosshair' : 'cursor-default'
                      }`}
                    />

                    {/* Area Crop Instructions Tip (when cropped mode is active and idle) */}
                    {areaMode !== 'fullscreen' && status === 'idle' && isAdjustingCrop && (
                      <div className="absolute top-3 right-3 z-20 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl border border-rose-500/40 text-[10px] text-rose-300 pointer-events-none">
                        ✂️ {t.recorder.areaDragTip}
                      </div>
                    )}

                    {/* Countdown Overlay */}
                    {status === 'countdown' && (
                      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 animate-in fade-in duration-200">
                        <span className="text-7xl sm:text-8xl font-black text-rose-500 animate-ping">
                          {countdown}
                        </span>
                        <span className="text-sm font-bold text-neutral-300 mt-4 tracking-widest uppercase">
                          Preparando captura...
                        </span>
                      </div>
                    )}

                    {/* Overlaid Status Badge */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                      {status === 'recording' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/90 text-white font-mono font-bold text-xs shadow-lg shadow-rose-950/50">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span>{t.recorder.statusRecording}</span>
                          <span className="ml-1 pl-1.5 border-l border-white/20 font-bold">
                            {formatTime(recordingSeconds)}
                          </span>
                        </div>
                      )}

                      {status === 'paused' && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-600/90 text-white font-mono font-bold text-xs">
                          <Pause className="w-3 h-3" />
                          <span>{t.recorder.pauseBtn.toUpperCase()}</span>
                          <span className="ml-1 pl-1.5 border-l border-white/20">
                            {formatTime(recordingSeconds)}
                          </span>
                        </div>
                      )}

                      {status === 'idle' && (
                        <div className="px-2.5 py-1 rounded-full bg-neutral-900/80 backdrop-blur-md border border-neutral-700 text-neutral-300 text-[11px] font-mono font-semibold">
                          {hasScreenStream || mode === 'cam_only'
                            ? t.recorder.statusReady
                            : t.recorder.statusSelecting}
                        </div>
                      )}
                    </div>

                    {/* Audio VU Meter */}
                    {includeMic && (
                      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xl border border-neutral-800 text-[11px] font-mono">
                        <Mic className="w-3.5 h-3.5 text-neutral-400" />
                        <div className="w-16 sm:w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full transition-all duration-75 ${
                              audioLevel > 75
                                ? 'bg-rose-500'
                                : audioLevel > 40
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${audioLevel}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Select Screen button if not yet chosen */}
                    {mode !== 'cam_only' && !hasScreenStream && status === 'idle' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-10 p-4 text-center">
                        <button
                          onClick={initScreen}
                          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-2xl shadow-rose-950/60 flex items-center gap-2.5 transition transform active:scale-95"
                        >
                          <Monitor className="w-4 h-4" />
                          <span>{t.recorder.selectScreenBtn}</span>
                        </button>
                        <p className="text-[11px] text-neutral-400 mt-2 max-w-sm">
                          Elige tu juego, ventana de dibujo o pantalla completa
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Settings & Audio Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                    {/* Left: PiP Customization (when screen+cam) */}
                    {mode === 'screen_cam' ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-neutral-400 font-bold text-[11px] flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-rose-500" />
                          <span>Facecam:</span>
                          {hasWebcamStream && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Cámara activa" />
                          )}
                        </span>

                        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleSelectPipPosition('bottom-right')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                              pipPosition === 'bottom-right' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            ↘ {t.recorder.bottomRight || 'Abajo Der'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPipPosition('bottom-left')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                              pipPosition === 'bottom-left' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            ↙ {t.recorder.bottomLeft || 'Abajo Izq'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPipPosition('top-right')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                              pipPosition === 'top-right' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            ↗ {t.recorder.topRight || 'Arriba Der'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPipPosition('top-left')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                              pipPosition === 'top-left' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            ↖ {t.recorder.topLeft || 'Arriba Izq'}
                          </button>
                          {pipPosition === 'custom' && (
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-600 text-white flex items-center gap-1 shadow-sm">
                              <Move className="w-3 h-3" />
                              <span>{t.recorder.customPosition || 'Libre'}</span>
                            </span>
                          )}
                        </div>

                        {/* System PiP button */}
                        <button
                          type="button"
                          onClick={toggleSystemPip}
                          className="px-2 py-1 rounded text-[10px] font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-rose-400 transition flex items-center gap-1"
                          title={t.recorder.pipSystemWindow || 'Flotar sobre otras apps (PiP)'}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>PiP</span>
                        </button>

                        {/* Shape */}
                        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 gap-0.5">
                          <button
                            onClick={() => setPipShape('circle')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                              pipShape === 'circle' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            ○ {t.recorder.shapeCircle}
                          </button>
                          <button
                            onClick={() => setPipShape('rounded')}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                              pipShape === 'rounded' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            ▢ {t.recorder.shapeRounded}
                          </button>
                        </div>

                        {/* Size */}
                        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 gap-0.5">
                          <button
                            onClick={() => setPipSize('sm')}
                            className={`px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                              pipSize === 'sm' ? 'bg-rose-600 text-white' : 'text-neutral-400'
                            }`}
                            title="Pequeño"
                          >
                            S
                          </button>
                          <button
                            onClick={() => setPipSize('md')}
                            className={`px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                              pipSize === 'md' ? 'bg-rose-600 text-white' : 'text-neutral-400'
                            }`}
                            title="Mediano"
                          >
                            M
                          </button>
                          <button
                            onClick={() => setPipSize('lg')}
                            className={`px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                              pipSize === 'lg' ? 'bg-rose-600 text-white' : 'text-neutral-400'
                            }`}
                            title="Grande"
                          >
                            L
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-400">
                        {areaMode === 'fullscreen' ? 'Grabación en pantalla completa a 60 FPS' : `Recorte activo: ${areaMode}`}
                      </div>
                    )}

                    {/* Right: Audio Toggles & Auto-minimize */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Format toggle: MP4 / WebM */}
                      <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 gap-0.5">
                        <button
                          type="button"
                          onClick={() => setFormat('mp4')}
                          disabled={status === 'recording' || status === 'paused'}
                          className={`px-2 py-1 rounded text-[10px] sm:text-[11px] font-bold transition ${
                            format === 'mp4'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          } disabled:opacity-50`}
                          title={t.recorder.formatMp4}
                        >
                          MP4
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormat('webm')}
                          disabled={status === 'recording' || status === 'paused'}
                          className={`px-2 py-1 rounded text-[10px] sm:text-[11px] font-bold transition ${
                            format === 'webm'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-neutral-400 hover:text-white'
                          } disabled:opacity-50`}
                          title={t.recorder.formatWebm}
                        >
                          WebM
                        </button>
                      </div>

                      <button
                        onClick={() => setIncludeMic(!includeMic)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                          includeMic
                            ? 'bg-neutral-800 border-neutral-700 text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                        }`}
                        title={t.recorder.micAudio}
                      >
                        {includeMic ? <Mic className="w-3.5 h-3.5 text-rose-500" /> : <MicOff className="w-3.5 h-3.5 text-neutral-500" />}
                        <span>Mic</span>
                      </button>

                      {mode !== 'cam_only' && (
                        <button
                          onClick={() => setIncludeSystemAudio(!includeSystemAudio)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                            includeSystemAudio
                              ? 'bg-neutral-800 border-neutral-700 text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                          }`}
                          title={t.recorder.systemAudio}
                        >
                          {includeSystemAudio ? <Volume2 className="w-3.5 h-3.5 text-rose-500" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
                          <span>Audio Juego</span>
                        </button>
                      )}

                      <button
                        onClick={() => setFps(fps === 60 ? 30 : 60)}
                        disabled={status === 'recording' || status === 'paused'}
                        className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-rose-400 font-mono font-bold text-[11px] hover:border-neutral-700 transition"
                      >
                        {fps} FPS
                      </button>

                      {mode !== 'cam_only' && (
                        <button
                          onClick={initScreen}
                          disabled={status === 'recording' || status === 'paused'}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-[11px] font-semibold transition"
                        >
                          {t.recorder.changeSourceBtn}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Auto-minimize toggle option checkbox */}
                  <div className="flex items-center justify-between px-2 pt-1 text-xs text-neutral-400">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-neutral-200 transition">
                      <input
                        type="checkbox"
                        checked={autoMinimize}
                        onChange={(e) => setAutoMinimize(e.target.checked)}
                        className="rounded border-neutral-700 bg-neutral-800 text-rose-600 focus:ring-rose-500/20"
                      />
                      <span>{t.recorder.autoMinimize}</span>
                    </label>

                    {(status === 'recording' || status === 'paused') && (
                      <button
                        onClick={() => setIsMinimized(true)}
                        className="text-rose-400 hover:text-rose-300 underline font-medium"
                      >
                        {t.recorder.minimizeToFloating}
                      </button>
                    )}
                  </div>

                  {/* Bottom Main Action Controls */}
                  <div className="flex items-center justify-center gap-3 pt-2">
                    {status === 'idle' && (
                      <button
                        onClick={handleStartCountdown}
                        className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-950/60 transition transform active:scale-95 group"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-white group-hover:scale-110 transition animate-pulse" />
                        <span>{t.recorder.startBtn}</span>
                      </button>
                    )}

                    {(status === 'recording' || status === 'paused') && (
                      <>
                        <button
                          onClick={togglePauseRecording}
                          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs sm:text-sm border border-neutral-700 transition"
                        >
                          {status === 'paused' ? (
                            <>
                              <Play className="w-4 h-4 fill-white" />
                              <span>{t.recorder.resumeBtn}</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-4 h-4" />
                              <span>{t.recorder.pauseBtn}</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={stopRecording}
                          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-950/60 transition transform active:scale-95"
                        >
                          <Square className="w-4 h-4 fill-white" />
                          <span>{t.recorder.stopBtn}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
