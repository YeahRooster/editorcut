// High-Precision Selfie Segmentation Engine using Google MediaPipe SelfieSegmentation
// Enhanced with Model 0 (256x256 General Portrait) and Instant Frame Clearing (Zero Ghosting / Accumulation)
export class SelfieSegmenter {
  private segmenter: any = null;
  private latestMask: ImageBitmap | HTMLCanvasElement | null = null;
  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D | null;
  private refinedCanvas: HTMLCanvasElement;
  private refinedCtx: CanvasRenderingContext2D | null;
  private isProcessing = false;
  private currentModel: 0 | 1 = 0; // Default to Model 0 (General 256x256 for sharp vertical portrait/reels)
  private refineMode: 'enhanced' | 'direct' = 'enhanced';
  private lastProcessTime = 0;
  private cachedRawMask: CanvasImageSource | null = null;
  private cachedThreshold = -1;

  constructor() {
    this.maskCanvas = document.createElement('canvas');
    this.maskCtx = this.maskCanvas.getContext('2d');

    this.refinedCanvas = document.createElement('canvas');
    this.refinedCtx = this.refinedCanvas.getContext('2d', { willReadFrequently: true });

    this.initMediaPipe();
  }

  private initMediaPipe() {
    const win = window as any;
    if (win.SelfieSegmentation) {
      try {
        this.segmenter = new win.SelfieSegmentation({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        });
        // Model 0: General 256x256 model (Highest quality, optimal for vertical portrait, full body & hair detection)
        this.segmenter.setOptions({
          modelSelection: this.currentModel,
          selfieMode: false,
        });
        this.segmenter.onResults((results: any) => {
          if (results.segmentationMask) {
            this.latestMask = results.segmentationMask;
          }
          this.isProcessing = false;
        });
      } catch (e) {
        console.warn('Error initializing MediaPipe SelfieSegmentation:', e);
      }
    } else {
      window.addEventListener('load', () => this.initMediaPipe(), { once: true });
    }
  }

  /**
   * Switch between Model 0 (General 256x256 - high quality portrait) and Model 1 (Landscape 144x256)
   */
  setModel(modelIndex: 0 | 1) {
    if (this.currentModel !== modelIndex && this.segmenter) {
      this.currentModel = modelIndex;
      this.clearMask();
      try {
        this.segmenter.setOptions({
          modelSelection: modelIndex,
          selfieMode: false,
        });
      } catch (e) {
        console.warn('Error changing model selection:', e);
      }
    }
  }

  getModel(): 0 | 1 {
    return this.currentModel;
  }

  setRefineMode(mode: 'enhanced' | 'direct') {
    this.refineMode = mode;
  }

  getRefineMode(): 'enhanced' | 'direct' {
    return this.refineMode;
  }

  clearMask() {
    this.latestMask = null;
    this.cachedRawMask = null;
    this.cachedThreshold = -1;
    if (this.maskCtx) {
      this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    }
    if (this.refinedCtx) {
      this.refinedCtx.clearRect(0, 0, this.refinedCanvas.width, this.refinedCanvas.height);
    }
  }

  async processFrame(imageSource: CanvasImageSource): Promise<boolean> {
    if (this.isProcessing) return false;

    // Rate-limit MediaPipe frame sending to max ~30fps to avoid saturating GPU / main thread
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.lastProcessTime < 33) {
      return false;
    }

    if (!this.segmenter) {
      const win = window as any;
      if (win.SelfieSegmentation) {
        this.initMediaPipe();
      }
    }

    if (this.segmenter) {
      try {
        this.isProcessing = true;
        this.lastProcessTime = now;
        await this.segmenter.send({ image: imageSource });
        return true;
      } catch {
        this.isProcessing = false;
        return false;
      }
    }
    return false;
  }

  getMask(): ImageBitmap | HTMLCanvasElement | null {
    return this.latestMask;
  }

  /**
   * Refines the raw MediaPipe mask for the current frame.
   * GUARANTEE: Every frame begins with clearRect(0, 0, w, h) so that past frames
   * NEVER accumulate or leave ghost occlusion trails as the person moves.
   * Cached: If rawMask and threshold haven't changed, returns cached canvas instantly (0 ms CPU cost).
   */
  private refineMask(rawMask: CanvasImageSource, threshold: number): HTMLCanvasElement {
    const w = (rawMask as any).width || 256;
    const h = (rawMask as any).height || 256;

    if (this.refinedCanvas.width !== w || this.refinedCanvas.height !== h) {
      this.refinedCanvas.width = w;
      this.refinedCanvas.height = h;
      this.cachedRawMask = null;
    }

    if (!this.refinedCtx) return this.refinedCanvas;

    // Return cached refined mask if same source and threshold (skips 262k pixel loop!)
    if (this.cachedRawMask === rawMask && this.cachedThreshold === threshold) {
      return this.refinedCanvas;
    }

    // 1. ABSOLUTELY ESSENTIAL: Clear previous frame completely so nothing accumulates!
    this.refinedCtx.clearRect(0, 0, w, h);
    this.refinedCtx.globalCompositeOperation = 'source-over';
    this.refinedCtx.drawImage(rawMask, 0, 0, w, h);

    // 2. Read pixel data of ONLY the current frame
    const imgData = this.refinedCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    const threshVal = Math.max(0.08, Math.min(0.85, threshold)) * 255;
    const band = 36;
    const minThresh = Math.max(0, threshVal - band);
    const maxThresh = Math.min(255, threshVal + band);
    const range = Math.max(1, maxThresh - minThresh);

    for (let i = 0; i < data.length; i += 4) {
      // In MediaPipe JS:
      // data[i+3] is the alpha confidence channel
      // data[i] is red channel
      const a = data[i + 3];
      const r = data[i];
      const conf = Math.max(r, a);

      let alpha = 0;
      if (conf >= maxThresh) {
        alpha = 255;
      } else if (conf <= minThresh) {
        alpha = 0;
      } else {
        const t = (conf - minThresh) / range;
        // Smoothstep curve for soft anti-aliased edge
        alpha = Math.round(t * t * (3 - 2 * t) * 255);
      }

      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = alpha;
    }

    this.refinedCtx.putImageData(imgData, 0, 0);
    this.cachedRawMask = rawMask;
    this.cachedThreshold = threshold;
    return this.refinedCanvas;
  }

  /**
   * Renders the person foreground cutout on top of the text
   * Pixel-perfect alignment matching the video crop and aspect ratio!
   * Enhanced with sub-pixel feathering and anti-aliasing to eliminate jagged / bitten edges.
   */
  drawPersonCutout(
    targetCtx: CanvasRenderingContext2D,
    imageSource: CanvasImageSource,
    sourceWidth: number,
    sourceHeight: number,
    destX: number,
    destY: number,
    destWidth: number,
    destHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    threshold: number = 0.28,
    feather: number = 4
  ) {
    if (!this.maskCtx) return;

    if (this.latestMask) {
      if (this.maskCanvas.width !== canvasWidth || this.maskCanvas.height !== canvasHeight) {
        this.maskCanvas.width = canvasWidth;
        this.maskCanvas.height = canvasHeight;
      }

      // 1. Clear mask canvas completely on EVERY frame (no ghosting or residual trails)
      this.maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
      this.maskCtx.imageSmoothingEnabled = true;
      this.maskCtx.imageSmoothingQuality = 'high';

      // 2. Select mask (enhanced with clean clearRect or direct)
      const maskToDraw =
        this.refineMode === 'enhanced'
          ? this.refineMask(this.latestMask, threshold)
          : this.latestMask;

      const maskW = (maskToDraw as any).width || sourceWidth;
      const maskH = (maskToDraw as any).height || sourceHeight;

      // 3. Draw mask with EXACT coordinates and sub-pixel anti-aliasing feathering filter
      // This completely removes sawtooth pixelation (dentado / pixelado / mordedura)
      this.maskCtx.globalCompositeOperation = 'source-over';
      const blurPx = Math.max(1, Math.min(16, feather ?? 4));
      this.maskCtx.filter = `blur(${blurPx}px)`;
      this.maskCtx.drawImage(
        maskToDraw,
        0, 0, maskW, maskH,
        destX, destY, destWidth, destHeight
      );
      this.maskCtx.filter = 'none'; // Reset filter so the foreground video stays 100% crisp

      // 4. Keep only pixels where mask is active (the person) with smooth feathered contour
      this.maskCtx.globalCompositeOperation = 'source-in';
      this.maskCtx.drawImage(
        imageSource,
        0, 0, sourceWidth, sourceHeight,
        destX, destY, destWidth, destHeight
      );
      this.maskCtx.globalCompositeOperation = 'source-over';

      // 5. Draw the masked person layer over target canvas
      targetCtx.drawImage(this.maskCanvas, 0, 0);
    } else {
      // Trigger frame extraction if not yet available
      this.processFrame(imageSource);
    }
  }
}

export const selfieSegmenter = new SelfieSegmenter();
