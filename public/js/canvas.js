// KINDRED MEET - Interactive Shared Canvas for Kids & Family Bonding

class SharedCanvasManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.currentColor = '#FF3B30';
    this.currentBrushSize = 6;
    this.currentMode = 'brush'; // 'brush', 'stamp', 'eraser'
    this.selectedStamp = '⭐';
    this.onStrokeDrawn = null; // Callback to broadcast to peers
    this.onCanvasCleared = null;
  }

  init(canvasElement, onStrokeCallback, onClearCallback) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { willReadFrequently: true });
    this.onStrokeDrawn = onStrokeCallback;
    this.onCanvasCleared = onClearCallback;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindEvents();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Save existing drawing
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    let tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(this.canvas, 0, 0);

    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    // Restore drawing
    this.ctx.drawImage(tempCanvas, 0, 0, rect.width, rect.height);
  }

  bindEvents() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startAction(e));
    this.canvas.addEventListener('mousemove', (e) => this.drawAction(e));
    window.addEventListener('mouseup', () => this.stopAction());

    // Touch events for tablets / iPads / touchscreens
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.startAction(e.touches[0]);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        this.drawAction(e.touches[0]);
      }
    }, { passive: false });

    window.addEventListener('touchend', () => this.stopAction());
  }

  getCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height
    };
  }

  startAction(e) {
    const { x, y } = this.getCoords(e);
    if (this.currentMode === 'stamp') {
      this.placeStamp(x, y, this.selectedStamp, true);
      return;
    }

    this.isDrawing = true;
    this.lastX = x;
    this.lastY = y;
  }

  drawAction(e) {
    if (!this.isDrawing) return;
    const { x, y } = this.getCoords(e);

    const strokeData = {
      x0: this.lastX,
      y0: this.lastY,
      x1: x,
      y1: y,
      color: this.currentMode === 'eraser' ? 'rgba(0,0,0,1)' : this.currentColor,
      size: this.currentBrushSize,
      isEraser: this.currentMode === 'eraser'
    };

    this.renderStroke(strokeData);

    if (this.onStrokeDrawn) {
      this.onStrokeDrawn(strokeData);
    }

    this.lastX = x;
    this.lastY = y;
  }

  stopAction() {
    this.isDrawing = false;
  }

  renderStroke(stroke) {
    if (!this.ctx || !this.canvas) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.save();
    if (stroke.isEraser) {
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.lineWidth = stroke.size * 3;
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.size;
    }

    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    this.ctx.moveTo(stroke.x0 * w, stroke.y0 * h);
    this.ctx.lineTo(stroke.x1 * w, stroke.y1 * h);
    this.ctx.stroke();
    this.ctx.restore();
  }

  placeStamp(normalizedX, normalizedY, stampChar, shouldBroadcast = true) {
    if (!this.ctx || !this.canvas) return;

    const x = normalizedX * this.canvas.width;
    const y = normalizedY * this.canvas.height;

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.font = '48px serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(stampChar, x, y);
    this.ctx.restore();

    if (window.soundEngine) {
      window.soundEngine.playSparkle();
    }

    if (shouldBroadcast && this.onStrokeDrawn) {
      this.onStrokeDrawn({
        isStamp: true,
        x: normalizedX,
        y: normalizedY,
        stamp: stampChar
      });
    }
  }

  handleRemoteStroke(data) {
    if (data.isStamp) {
      this.placeStamp(data.x, data.y, data.stamp, false);
    } else {
      this.renderStroke(data);
    }
  }

  clearCanvas(shouldBroadcast = true) {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (shouldBroadcast && this.onCanvasCleared) {
      this.onCanvasCleared();
    }
  }

  setColor(color) {
    this.currentColor = color;
    this.currentMode = 'brush';
  }

  setBrushSize(size) {
    this.currentBrushSize = size;
  }

  setMode(mode, stamp = '⭐') {
    this.currentMode = mode;
    if (stamp) this.selectedStamp = stamp;
  }
}

window.sharedCanvasManager = new SharedCanvasManager();
