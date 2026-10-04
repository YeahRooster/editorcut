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
  Radio
} from 'lucide-react';
import { useI18n } from '../i18n/context';

interface ScreenRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVideoClip: (file: File) => void;
}

type RecordMode = 'screen_only' | 'screen_cam' | 'cam_only';
type PipPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
type PipShape = 'rounded' | 'circle';
type PipSize = 'sm' | 'md' | 'lg';
type RecordingStatus = 'idle' | 'countdown' | 'recording' | 'paused' | 'review';

export const ScreenRecorderModal: React.FC<ScreenRecorderModalProps> = ({
  isOpen,
  onClose,
  onAddVideoClip,
}) => {
  const { t } = useI18n();

  // Mode and settings
  const [mode, setMode] = useState<RecordMode>('screen_cam');
  const [pipPosition, setPipPosition] = useState<PipPosition>('bottom-right');
  const [pipShape, setPipShape] = useState<PipShape>('circle');
  const [pipSize, setPipSize] = useState<PipSize>('md');
  const [fps, setFps] = useState<60 | 30>(60);
  const [includeMic, setIncludeMic] = useState<boolean>(true);
  const [includeSystemAudio, setIncludeSystemAudio] = useState<boolean>(true);

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const vuAnimRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Clean stop for all media streams
  const stopAllMediaStreams = useCallback(() => {
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
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
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

  // Convert Blob size to human readable MB
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

      // Setup audio analyzer for VU meter
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

  // 3. Acquire Screen / Game
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

      // Handle user stopping screen share via browser's floating bar
      stream.getVideoTracks()[0].onended = () => {
        setHasScreenStream(false);
        if (status === 'recording' || status === 'paused') {
          stopRecording();
        }
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
  }, [fps, includeSystemAudio, status, t.recorder.browserUnsupported, t.recorder.permissionDenied]);

  // Main Canvas Compositing Loop (Draws screen + Picture-in-Picture webcam in real time)
  useEffect(() => {
    if (!isOpen || status === 'review') return;

    let isRunning = true;

    const renderComposite = () => {
      if (!isRunning) return;

      const canvas = canvasRef.current;
      const screenVid = screenVideoRef.current;
      const webcamVid = webcamVideoRef.current;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Determine composite dimensions (default 1920x1080)
          let targetWidth = 1920;
          let targetHeight = 1080;

          if (mode !== 'cam_only' && screenVid && screenVid.videoWidth > 0) {
            targetWidth = screenVid.videoWidth;
            targetHeight = screenVid.videoHeight;
          } else if (mode === 'cam_only' && webcamVid && webcamVid.videoWidth > 0) {
            targetWidth = webcamVid.videoWidth;
            targetHeight = webcamVid.videoHeight;
          }

          if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
          }

          // 1. Clear background
          ctx.fillStyle = '#09090b';
          ctx.fillRect(0, 0, targetWidth, targetHeight);

          // 2. Draw Screen Track (if applicable)
          if (mode !== 'cam_only') {
            if (screenVid && screenVid.readyState >= 2) {
              ctx.drawImage(screenVid, 0, 0, targetWidth, targetHeight);
            } else {
              // Placeholder when screen is not yet picked
              ctx.fillStyle = '#18181b';
              ctx.fillRect(0, 0, targetWidth, targetHeight);

              // Grid pattern
              ctx.strokeStyle = '#27272a';
              ctx.lineWidth = 1;
              const step = 80;
              for (let x = 0; x < targetWidth; x += step) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, targetHeight);
                ctx.stroke();
              }
              for (let y = 0; y < targetHeight; y += step) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(targetWidth, y);
                ctx.stroke();
              }

              // Placeholder text
              ctx.fillStyle = '#71717a';
              ctx.font = 'bold 36px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(t.recorder.noScreenSelected, targetWidth / 2, targetHeight / 2);
            }
          }

          // 3. Draw Webcam PiP (Picture-in-Picture) or Fullscreen Webcam
          if (mode === 'cam_only') {
            if (webcamVid && webcamVid.readyState >= 2) {
              ctx.drawImage(webcamVid, 0, 0, targetWidth, targetHeight);
            }
          } else if (mode === 'screen_cam' && webcamVid && webcamVid.readyState >= 2) {
            // Calculate PiP dimensions
            let pipScale = 0.24;
            if (pipSize === 'sm') pipScale = 0.18;
            if (pipSize === 'lg') pipScale = 0.32;

            const pipW = targetWidth * pipScale;
            const pipH = pipShape === 'circle' ? pipW : pipW * (9 / 16);
            const margin = Math.round(targetWidth * 0.025);

            let pipX = targetWidth - pipW - margin;
            let pipY = targetHeight - pipH - margin;

            if (pipPosition === 'bottom-left') {
              pipX = margin;
              pipY = targetHeight - pipH - margin;
            } else if (pipPosition === 'top-right') {
              pipX = targetWidth - pipW - margin;
              pipY = margin;
            } else if (pipPosition === 'top-left') {
              pipX = margin;
              pipY = margin;
            }

            // Draw shadow for depth
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
            ctx.shadowBlur = 24;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 8;

            if (pipShape === 'circle') {
              const r = pipW / 2;
              ctx.beginPath();
              ctx.arc(pipX + r, pipY + r, r, 0, Math.PI * 2);
              ctx.fillStyle = '#000000';
              ctx.fill();
              ctx.restore();

              // Clip and draw webcam image
              ctx.save();
              ctx.beginPath();
              ctx.arc(pipX + r, pipY + r, r, 0, Math.PI * 2);
              ctx.clip();
              // Center crop webcam into square
              const vAspect = webcamVid.videoWidth / webcamVid.videoHeight;
              let sW = webcamVid.videoWidth;
              let sH = webcamVid.videoHeight;
              let sX = 0;
              let sY = 0;
              if (vAspect > 1) {
                sW = webcamVid.videoHeight;
                sX = (webcamVid.videoWidth - sW) / 2;
              } else {
                sH = webcamVid.videoWidth;
                sY = (webcamVid.videoHeight - sH) / 2;
              }
              ctx.drawImage(webcamVid, sX, sY, sW, sH, pipX, pipY, pipW, pipW);
              ctx.restore();

              // Sleek magenta gamer border
              ctx.beginPath();
              ctx.arc(pipX + r, pipY + r, r, 0, Math.PI * 2);
              ctx.lineWidth = Math.max(4, Math.round(targetWidth * 0.003));
              ctx.strokeStyle = '#e11d48'; // EditorCut Rose
              ctx.stroke();
            } else {
              // Rounded rectangle
              const radius = Math.round(pipW * 0.08);
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(pipX, pipY, pipW, pipH, radius);
              } else {
                ctx.rect(pipX, pipY, pipW, pipH);
              }
              ctx.fillStyle = '#000000';
              ctx.fill();
              ctx.restore();

              ctx.save();
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(pipX, pipY, pipW, pipH, radius);
              } else {
                ctx.rect(pipX, pipY, pipW, pipH);
              }
              ctx.clip();
              ctx.drawImage(webcamVid, pipX, pipY, pipW, pipH);
              ctx.restore();

              // Rounded border
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(pipX, pipY, pipW, pipH, radius);
              } else {
                ctx.rect(pipX, pipY, pipW, pipH);
              }
              ctx.lineWidth = Math.max(4, Math.round(targetWidth * 0.003));
              ctx.strokeStyle = '#e11d48';
              ctx.stroke();
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(renderComposite);
    };

    animFrameRef.current = requestAnimationFrame(renderComposite);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, mode, pipPosition, pipShape, pipSize, status, t.recorder.noScreenSelected]);

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

  // Clean up on modal close
  useEffect(() => {
    if (!isOpen) {
      stopAllMediaStreams();
      setStatus('idle');
      setRecordedBlob(null);
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(null);
      }
    }
  }, [isOpen, stopAllMediaStreams, recordedUrl]);

  // Start recording countdown
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // 1. Video track from canvas stream
      const canvasStream = canvas.captureStream(fps);
      const videoTrack = canvasStream.getVideoTracks()[0];

      // 2. Audio mixing with AudioContext
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

      const combinedTracks: MediaStreamTrack[] = [videoTrack];
      const mixedAudioTracks = audioDest.stream.getAudioTracks();
      if (mixedAudioTracks.length > 0) {
        combinedTracks.push(mixedAudioTracks[0]);
      }

      const finalStream = new MediaStream(combinedTracks);

      // Choose supported MIME type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(finalStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 6_000_000, // 6 Mbps for smooth gameplay & drawing clarity
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, { type: selectedMime });
        setRecordedBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setRecordedUrl(url);
        setStatus('review');
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      setStatus('recording');
      setRecordingSeconds(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setErrorMessage('Error al inicializar la grabación');
      setStatus('idle');
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Discard & Record Again
  const handleRecordAgain = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setRecordedBlob(null);
    setRecordingSeconds(0);
    setStatus('idle');
  };

  // Import directly to EditorCut Timeline
  const handleImportToTimeline = () => {
    if (!recordedBlob) return;
    const timestamp = Date.now();
    const file = new File(
      [recordedBlob],
      `Grabacion_Pantalla_${timestamp}.webm`,
      { type: recordedBlob.type }
    );
    onAddVideoClip(file);
    onClose();
  };

  // Direct download to user's computer
  const handleDownloadFile = () => {
    if (!recordedBlob || !recordedUrl) return;
    const a = document.createElement('a');
    a.href = recordedUrl;
    a.download = `EditorCut_Grabacion_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      {/* Hidden processing videos */}
      <video ref={screenVideoRef} className="hidden" playsInline muted autoPlay />
      <video ref={webcamVideoRef} className="hidden" playsInline muted autoPlay />

      <div className="relative w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] my-auto">
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

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {status === 'review' ? (
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

              {/* Recording Metadata Summary */}
              <div className="flex items-center justify-center gap-6 text-xs text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500">{t.recorder.duration}:</span>
                  <span className="font-bold text-white font-mono">{formatTime(recordingSeconds)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500">{t.recorder.fileSize}:</span>
                  <span className="font-bold text-white font-mono">{formatFileSize(recordedBlob)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-500">{t.recorder.frameRate}:</span>
                  <span className="font-bold text-white font-mono">{fps} FPS</span>
                </div>
              </div>

              {/* Action Buttons */}
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
                  <span>{t.recorder.downloadVideo}</span>
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
            /* LIVE STUDIO CANVAS & CONTROLS (OBS STYLE)                                 */
            /* ========================================================================= */
            <div className="space-y-4">
              {/* Mode Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => setMode('screen_cam')}
                  disabled={status === 'recording' || status === 'paused'}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    mode === 'screen_cam'
                      ? 'bg-rose-500/10 border-rose-500/80 text-white shadow-md shadow-rose-950/20'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  } disabled:opacity-50`}
                >
                  <Layers className={`w-5 h-5 flex-shrink-0 mt-0.5 ${mode === 'screen_cam' ? 'text-rose-400' : 'text-neutral-500'}`} />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-neutral-200 flex items-center gap-1.5">
                      {t.recorder.modeScreenCam}
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                      {t.recorder.modeScreenCamDesc}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('screen_only')}
                  disabled={status === 'recording' || status === 'paused'}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    mode === 'screen_only'
                      ? 'bg-rose-500/10 border-rose-500/80 text-white shadow-md shadow-rose-950/20'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  } disabled:opacity-50`}
                >
                  <Monitor className={`w-5 h-5 flex-shrink-0 mt-0.5 ${mode === 'screen_only' ? 'text-rose-400' : 'text-neutral-500'}`} />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-neutral-200">
                      {t.recorder.modeScreen}
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                      {t.recorder.modeScreenDesc}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMode('cam_only')}
                  disabled={status === 'recording' || status === 'paused'}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                    mode === 'cam_only'
                      ? 'bg-rose-500/10 border-rose-500/80 text-white shadow-md shadow-rose-950/20'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  } disabled:opacity-50`}
                >
                  <Camera className={`w-5 h-5 flex-shrink-0 mt-0.5 ${mode === 'cam_only' ? 'text-rose-400' : 'text-neutral-500'}`} />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-neutral-200">
                      {t.recorder.modeCam}
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                      {t.recorder.modeCamDesc}
                    </div>
                  </div>
                </button>
              </div>

              {/* The Live Compositor Canvas (The OBS Canvas) */}
              <div className="relative aspect-video max-h-[44vh] rounded-2xl overflow-hidden bg-black border-2 border-neutral-800 shadow-2xl flex items-center justify-center group">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain pointer-events-none select-none"
                />

                {/* Overlaid Countdown Overlay */}
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

                {/* Overlaid Audio VU Meter (Bottom Left of Canvas) */}
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

                {/* Button inside canvas if screen is not yet selected */}
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
                      Puedes elegir tu juego, ventana de dibujo o toda la pantalla con audio
                    </p>
                  </div>
                )}
              </div>

              {/* PiP (Facecam) Controls & Audio Toggles Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-950 border border-neutral-800 rounded-xl text-xs">
                {/* Left Side: PiP Customization (Only active when in screen_cam mode) */}
                {mode === 'screen_cam' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-neutral-400 font-bold text-[11px] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-rose-500" />
                      <span>Facecam:</span>
                      {hasWebcamStream && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Cámara activa" />
                      )}
                    </span>

                    {/* PiP Position */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 gap-0.5">
                      <button
                        onClick={() => setPipPosition('bottom-right')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                          pipPosition === 'bottom-right'
                            ? 'bg-rose-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title={t.recorder.bottomRight}
                      >
                        ↘ Abajo Der
                      </button>
                      <button
                        onClick={() => setPipPosition('bottom-left')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                          pipPosition === 'bottom-left'
                            ? 'bg-rose-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title={t.recorder.bottomLeft}
                      >
                        ↙ Abajo Izq
                      </button>
                      <button
                        onClick={() => setPipPosition('top-right')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                          pipPosition === 'top-right'
                            ? 'bg-rose-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title={t.recorder.topRight}
                      >
                        ↗ Arriba Der
                      </button>
                      <button
                        onClick={() => setPipPosition('top-left')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                          pipPosition === 'top-left'
                            ? 'bg-rose-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title={t.recorder.topLeft}
                      >
                        ↖ Arriba Izq
                      </button>
                    </div>

                    {/* PiP Shape */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 gap-0.5">
                      <button
                        onClick={() => setPipShape('circle')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                          pipShape === 'circle'
                            ? 'bg-rose-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title={t.recorder.shapeCircle}
                      >
                        ○ {t.recorder.shapeCircle}
                      </button>
                      <button
                        onClick={() => setPipShape('rounded')}
                        className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                          pipShape === 'rounded'
                            ? 'bg-rose-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        title={t.recorder.shapeRounded}
                      >
                        ▢ {t.recorder.shapeRounded}
                      </button>
                    </div>

                    {/* PiP Size */}
                    <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 gap-0.5">
                      <button
                        onClick={() => setPipSize('sm')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                          pipSize === 'sm' ? 'bg-rose-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        S
                      </button>
                      <button
                        onClick={() => setPipSize('md')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                          pipSize === 'md' ? 'bg-rose-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        M
                      </button>
                      <button
                        onClick={() => setPipSize('lg')}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold transition ${
                          pipSize === 'lg' ? 'bg-rose-600 text-white' : 'text-neutral-400'
                        }`}
                      >
                        L
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-400">
                    {mode === 'screen_only' ? 'Grabando pantalla en alta resolución' : 'Grabando cámara web full screen'}
                  </div>
                )}

                {/* Right Side: Audio & FPS Options */}
                <div className="flex items-center gap-2">
                  {/* Mic Toggle */}
                  <button
                    onClick={() => setIncludeMic(!includeMic)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition ${
                      includeMic
                        ? 'bg-neutral-800 border-neutral-700 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                    }`}
                    title={t.recorder.micAudio}
                  >
                    {includeMic ? (
                      <Mic className="w-3.5 h-3.5 text-rose-500" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                    <span>Mic</span>
                  </button>

                  {/* System Audio Toggle */}
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
                      {includeSystemAudio ? (
                        <Volume2 className="w-3.5 h-3.5 text-rose-500" />
                      ) : (
                        <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                      <span>Audio Juego</span>
                    </button>
                  )}

                  {/* FPS Selector */}
                  <button
                    onClick={() => setFps(fps === 60 ? 30 : 60)}
                    disabled={status === 'recording' || status === 'paused'}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-rose-400 font-mono font-bold text-[11px] hover:border-neutral-700 transition"
                    title={fps === 60 ? t.recorder.fps60 : t.recorder.fps30}
                  >
                    {fps} FPS
                  </button>

                  {/* Change Screen Source Button */}
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

              {/* Bottom Main Action Controls (Big Record / Pause / Stop buttons) */}
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
  );
};
