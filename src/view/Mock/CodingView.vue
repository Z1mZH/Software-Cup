<template>
    <!-- 顶部状态栏 -->
    <div class="top-bar">
      <div class="timer">距离面试结束 {{ formatTime(remainingTime) }}</div>
      <button class="end-btn" @click="endInterview">结束面试</button>
    </div>
  <div class="coding-interview-page">
    <div class="left-control">
      <button class="toggle-cam-btn" @click="toggleCameraView">
        {{ showCamera ? '隐藏摄像头' : '显示摄像头' }}
      </button>
    </div>

    <div class="main-content" :class="{ 'with-camera': showCamera }">
      <div class="camera-view" v-show="showCamera">
        <div class="user-panel">
          <div class="avatar blue">面试官</div>
          <div class="status">在线</div>
          <div class="video-placeholder"></div>
        </div>
        <div class="user-panel">
          <div class="avatar gray">我</div>
          <div class="status">在线</div>
          <div class="video-placeholder"></div>
        </div>
      </div>

      <div class="coding-area" v-show="!showCamera">
        <div class="problem-section">
          <h3>【编程题】第1题（共2题）</h3>
          <p>答题时间：2:00</p>
          <div class="problem-desc">
            <pre>输出Hello,world（核心代码模式，不限制语言）</pre>
            <pre>输入</pre>
            <pre>输出：Hello,world</pre>
            <pre>说明</pre>
          </div>
        </div>

        <div class="editor-section">
          <div class="lang-toolbar">
            <select>
              <option>Java</option>
              <option>Python</option>
              <option>JavaScript</option>
            </select>
            <button>重置</button>
            <button>代码格式化</button>
          </div>
          <textarea class="code-editor" placeholder="编写代码..."></textarea>
          <button class="btn-submit">保存并测试</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showCamera: false,
      remainingTime: 3600,
    };
  },
  mounted() {
    this.startTimer();
  },
  methods: {
    toggleCameraView() {
      this.showCamera = !this.showCamera;
    },
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
    beforeUnmount() {
    clearInterval(this.timer);
  }
  }
};
</script>

<style scoped lang="scss">
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

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
.coding-interview-page {
  display: flex;
  min-height: 100vh;
  background: #f0f2f5;

  .left-control {
    width: 60px;
    background: #2d3748;
    display: flex;
    justify-content: center;
    align-items: center;

    .toggle-cam-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #4299e1;
      color: white;
      border: none;
      cursor: pointer;
      transition: all 0.3s;
      &:hover {
        transform: scale(1.1);
        background: #3182ce;
      }
    }
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    transition: all 0.3s ease;

    .camera-view {
      display: flex;
      gap: 2rem;

      .user-panel {
        flex: 1;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 2rem;
        text-align: center;

        .avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 1.5rem;
        }

        .blue {
          background: #4299e1;
          color: white;
        }

        .gray {
          background: #e5e7eb;
          color: #4b5563;
        }

        .status {
          color: #22c55e;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .video-placeholder {
          width: 100%;
          height: 200px;
          background: #e5e7eb;
          border-radius: 8px;
        }
      }
    }

    .coding-area {
      display: flex;
      gap: 2rem;

      .problem-section {
        flex: 1;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 2rem;

        pre {
          white-space: pre-wrap;
          font-size: 1rem;
          line-height: 1.6;
          color: #4b5563;
        }
      }

      .editor-section {
        flex: 1.5;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 2rem;

        .lang-toolbar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;

          select {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            outline: none;
            cursor: pointer;
          }

          button {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: none;
            background: #e5e7eb;
            color: #4b5563;
            cursor: pointer;
            transition: all 0.3s;
            &:hover {
              background: #d1d5db;
            }
          }
        }

        .code-editor {
          width: 100%;
          height: 300px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          resize: vertical;
          outline: none;
        }

        .btn-submit {
          width: 100%;
          padding: 1rem;
          background: #4299e1;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          margin-top: 1rem;
          transition: all 0.3s;
          &:hover {
            background: #3182ce;
            transform: translateY(-2px);
          }
        }
      }
    }
  }
}
</style>