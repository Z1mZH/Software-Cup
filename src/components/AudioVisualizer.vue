<template>
  <div class="audio-visualizer">
    <div class="wave-container">
      <canvas ref="interviewerCanvas" class="wave-canvas"></canvas>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      interviewerAudioLevel: 0,
      canvasWidth: 200,
      canvasHeight: 60,
      animationId: null
    };
  },
  mounted() {
    this.initCanvas();
    this.startAnimation();
    this.simulateAudioInput();
  },
  beforeUnmount() {
    cancelAnimationFrame(this.animationId);
  },
  methods: {
    initCanvas() {
      this.interviewerCtx = this.$refs.interviewerCanvas.getContext('2d');

      this.$refs.interviewerCanvas.width = this.canvasWidth;
      this.$refs.interviewerCanvas.height = this.canvasHeight;
    },
    startAnimation() {
      const animate = () => {
        this.drawWaveform(this.interviewerCtx, this.interviewerAudioLevel);
        this.animationId = requestAnimationFrame(animate);
      };
      animate();
    },
    drawWaveform(ctx, level) {
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      const centerY = this.canvasHeight / 2;
      const amplitude = (level / 100) * (this.canvasHeight / 2 - 10);

      ctx.beginPath();
      ctx.moveTo(0, centerY);

      for (let x = 0; x < this.canvasWidth; x++) {
        // 使用正弦波模拟音频波形
        const y = centerY + amplitude * Math.sin(x * 0.1) * Math.exp(-Math.abs(x - this.canvasWidth/2) * 0.01);
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#409eff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制基线
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(this.canvasWidth, centerY);
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    simulateAudioInput() {
      // 模拟音频输入波动，实际应用中应替换为真实音频数据
      setInterval(() => {
        // 面试官声波波动
        this.interviewerAudioLevel = Math.max(10, Math.min(90, this.interviewerAudioLevel + (Math.random() * 20 - 10)));

      }, 200);
    }
  }
};
</script>

<style scoped>
.audio-visualizer {
  display: flex;
  gap: 20px;
  padding: 10px;
  margin-top: 20px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 15px;
}

.wave-container {
  position: relative;
  width: 250px;
  height: 50px;
}

.wave-canvas {
  width: 100%;
  height: 100%;
}

.wave-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 12px;
  pointer-events: none;
}
</style>