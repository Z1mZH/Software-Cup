<template>
  <div class="device-detection">
    <h1>设备检测</h1>
    <div class="preview-container">
      <video ref="video" autoplay playsinline class="camera-preview"></video>
      <div class="volume-control">
        <span class="icon">🔊</span>
        <input type="range" v-model="volume" min="0" max="100" />
      </div>
    </div>
    <div class="status-list">
      <div class="status-item" v-for="(item, idx) in statusList" :key="idx">
        <span class="icon">{{ item.icon }}</span>
        {{ item.label }}：
        <span :class="['status', item.statusClass]">
          {{ item.statusText }}
          <span v-if="item.statusClass === 'error'" class="error-tooltip">
            {{ item.errorMessage }}
          </span>
        </span>
      </div>
    </div>
    <button
      class="continue-btn"
      :disabled="!allPassed"
      @click="onContinue"
    >
      继续
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      volume: 50,
      audioPlayed: false,
      videoStream: null,
      statusList: [
        {
          label: '摄像头',
          icon: '📷',
          status: 'checking',
          statusText: '检测中...',
          statusClass: 'checking',
          errorMessage: '摄像头设备不可用'
        },
        {
          label: '麦克风',
          icon: '🎙️',
          status: 'checking',
          statusText: '检测中...',
          statusClass: 'checking',
          errorMessage: '麦克风设备不可用'
        },
        {
          label: '声音输入检测',
          icon: '🔊',
          status: 'checking',
          statusText: '检测中...',
          statusClass: 'checking',
          errorMessage: '声音输入异常'
        },
        {
          label: '网络检测',
          icon: '🌐',
          status: 'checking',
          statusText: '检测中...',
          statusClass: 'checking',
          errorMessage: '网络连接异常'
        }
      ]
    };
  },
  computed: {
    allPassed() {
      return this.statusList.every(item => item.status === 'passed');
    }
  },
  mounted() {
    this.initDeviceCheck();
  },
  beforeUnmount() {
    this.stopDeviceCheck();
  },
  methods: {
    async initDeviceCheck() {
      // 摄像头/麦克风检测
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.videoStream = stream;
        this.$refs.video.srcObject = stream;
        this.updateStatus(0, 'passed', '可以使用 ✔️', 'ok');
        this.updateStatus(1, 'passed', '可以使用 ✔️', 'ok');
      } catch (e) {
        this.updateStatus(0, 'error', '设备不可用 ❌', 'error');
        this.updateStatus(1, 'error', '设备不可用 ❌', 'error');
      }

      // 声音输入检测（模拟，实际需音频分析）
      setTimeout(() => {
        const soundPassed = Math.random() > 0.1; // 模拟90%通过
        this.updateStatus(2, soundPassed ? 'passed' : 'error', soundPassed ? '已通过 ✔️' : '检测失败 ❌', soundPassed ? 'ok' : 'error');
      }, 1500);

      // 网络检测（模拟速度）
      setTimeout(() => {
        const speed = Math.floor(Math.random() * 30 + 10); // 模拟10-40 Mbps
        this.updateStatus(3, 'passed', `${speed} Mbps ✔️`, 'ok');
      }, 2000);
    },

    updateStatus(index, status, text, classname) {
      this.statusList[index] = {
        ...this.statusList[index],
        status,
        statusText: text,
        statusClass: classname
      };
    },

    stopDeviceCheck() {
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => track.stop());
        this.videoStream = null;
      }
    },

    onContinue() {
      if (this.allPassed) {
        this.$router.push('/config_view');
      } else {
        alert('设备检测未通过，请检查后重试');
      }
    }
  }
};
</script>

<style scoped lang="scss">
.device-detection {
  min-height: 100vh;
  background: #f0f8ff;
  padding: 0rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;

  h1 {
    color: #2c3e50;
    font-size: 2rem;
  }

  .preview-container {
    width: 100%;
    max-width: 600px;
    position: relative;

    .camera-preview {
      width: 70%; /* 调整宽度（如占父容器70%） */
      max-width: 500px; /* 最大宽度限制 */
      height: auto; /* 高度自动按比例 */
      aspect-ratio: 4/3; /* 保持宽高比（如4:3，可根据需求调整） */
      border-radius: 10px; /* 圆角 */
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* 阴影效果 */
    }


    .volume-control {
      position: absolute;
      bottom: 1rem;
      left: 6rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .icon {
        font-size: 1.2rem;
        color: #3498db;
      }

      input {
        width: 100px;
      }
    }
  }


  .status-list {
    width: 100%;
    max-width: 600px;

    .status-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 1.1rem;

      .icon {
        font-size: 1.3rem;
      }

      .status {
        font-weight: 500;
      }

      .ok {
        color: #27ae60;
      }

      .warn {
        color: #f39c12;
      }

      .tooltip {
        margin-left: 0.5rem;
        font-size: 0.9rem;
        color: #7f8c8d;
      }
    }
  }

  .continue-btn {
    width: 100%;
    max-width: 300px;
    padding: 1rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
      background: #2980b9;
    }
  }

  @media (max-width: 768px) {
    .preview-container,
    .status-list {
      width: 100%;
    }
  }
}
</style>