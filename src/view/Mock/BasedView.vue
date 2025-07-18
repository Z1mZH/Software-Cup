<template>
  <div class="interview-page">
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="timer">距离面试结束 {{ formatTime(remainingTime) }}</div>
      <button class="end-btn" @click="endInterview">结束面试</button>
    </div>

    <!-- 主内容区（左右布局） -->
    <div class="main-content">
      <!-- 左侧用户面板 -->
      <div class="user-panel">
        <div class="user-card">
          <div class="avatar blue">面试官</div>
          <div class="status">
            <span class="online-dot"></span> 面试官
          </div>
          <AudioVisualizer />
        </div>
        <div class="user-card">
          <div class="avatar gray">用户 (我)</div>
          <div class="status">
            <span class="online-dot"></span> 用户 (我)
          </div>
          <UserAudio />
        </div>
      </div>

      <!-- 右侧对话区域 -->
      <div class="chat-area">
        <div class="message" v-for="(msg, idx) in messages" :key="idx">
          <div :class="['bubble', msg.sender]">
            <p>{{ msg.content }}</p>
          </div>
        </div>
      </div>

      <!-- 底部控制栏 -->
      <div class="bottom-control">
        <button class="mic-btn" @click="toggleMute">
          <span class="icon">{{ isMuted ? '🔇' : '🔊' }}</span>
          {{ isMuted ? '点击开启麦克风' : '点击静音麦克风' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import AudioVisualizer from "@/components/AudioVisualizer.vue";
import UserAudio from "@/components/userAudio.vue";
export default {
  components: {
    AudioVisualizer, UserAudio
  },
  data() {
    return {
      remainingTime: 3590, // 59分50秒（秒数）
      messages: [
        {
          sender: 'interviewer',
          content: '你好，我是你今天的面试官，如果准备好了请回复“准备好了”。'
        },
        {
          sender: 'user',
          content: '面试官，你好'
        }
      ],
      isMuted: false,
      audioLevel: 60 // 模拟音频音量
    };
  },
  mounted() {
    this.startTimer();
  },
  methods: {
    startTimer() {
      this.timer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          clearInterval(this.timer);
          this.endInterview();
        }
      }, 1000);
    },
    formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return `${min}:${sec.toString().padStart(2, '0')}`;
    },
    endInterview() {
      this.$router.push('/interview-result');
      alert('面试结束');
    },
    toggleMute() {
      this.isMuted = !this.isMuted;
      // 实际需集成音频控制逻辑
    }
  },
  beforeUnmount() {
    clearInterval(this.timer);
  }
};
</script>

<style scoped lang="scss">
.interview-page {
  min-height: 100vh;
  background: #f8f9fa;
  font-family: 'PingFang SC', sans-serif;

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);

    .audio-level {
      display: flex;
      align-items: center;
      gap: 8px;

      .bar-container {
        width: 120px;
        height: 6px;
        background: #e9e9e9;
        border-radius: 3px;

        .bar {
          height: 100%;
          background: #409eff;
          border-radius: 3px;
        }
      }
    }

    .timer {
      font-size: 14px;
      color: #666;
    }

    .end-btn {
      padding: 8px 16px;
      background: #ff4d4f;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s;

      &:hover {
        background: #ff3333;
      }
    }
  }

  .main-content {
    display: flex;
    height: calc(100vh - 80px);
    padding: 20px;

    .user-panel {
      width: 300px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      .user-card {
        padding: 16px;
        border-bottom: 1px solid #f0f0f0;

        .avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 20px;
          margin: 0 auto 12px;

          &.blue {
            background: #409eff;
            color: white;
          }

          &.gray {
            background: #d9d9d9;
            color: #666;
          }
        }

        .status {
          text-align: center;
          font-size: 14px;
          color: #666;

          .online-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #52c41a;
            margin-right: 4px;
          }
        }
      }
    }

    .chat-area {
      flex: 1;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 20px;
      overflow-y: auto;

      .message {
        margin-bottom: 20px;

        .bubble {
          max-width: 70%;
          padding: 12px 16px;
          border-radius: 16px;
          line-height: 1.5;

          &.interviewer {
            background: #f5f7fa;
            margin-left: auto;
          }

          &.user {
            background: #409eff;
            color: white;
            margin-right: auto;
          }
        }
      }
    }
  }

  .bottom-control {
    display: flex;
    justify-content: center;
    padding: 20px;
    background: white;
    box-shadow: 0 -1px 3px rgba(0,0,0,0.1);

    .mic-btn {
      padding: 12px 32px;
      background: #f5f7fa;
      border: none;
      border-radius: 24px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background: #e9e9e9;
      }

      .icon {
        margin-right: 8px;
      }
    }
  }
}

::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}
</style>