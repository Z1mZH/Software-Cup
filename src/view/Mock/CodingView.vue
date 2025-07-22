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

        <!-- 右侧代码编辑器区域（替换原有textarea） -->
        <div class="editor-section">
          <div class="lang-toolbar">
            <select v-model="selectedLang" @change="changeLanguage">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
            <button @click="resetCode">重置</button>
            <button @click="formatCode">代码格式化</button>
          </div>

          <!-- 代码编辑器组件 -->
          <codemirror
            v-model="code"
            :style="{ height: '300px' }"
            :extensions="extensions"
            :autofocus="true"
            @ready="handleEditorReady"
            @change="handleCodeChange"
          />

          <button class="btn-submit" @click="submitCode">保存并测试</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 导入代码编辑器相关依赖
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { python } from '@codemirror/lang-python'
import { java } from '@codemirror/lang-java'

export default {
  components: {
    Codemirror
  },
  data() {
    return {
      showCamera: false,
      remainingTime: 3600,
      // 代码编辑器相关
      code: 'console.log("Hello, world!");', // 默认代码
      selectedLang: 'javascript', // 默认语言
      extensions: [javascript(), oneDark], // 编辑器扩展（语言+主题）
      editorView: null // 编辑器实例
    };
  },
  mounted() {
    this.startTimer();
  },
  methods: {
    // 原有方法保持不变
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
      this.$router.push('/review');
      alert('面试结束');
    },

    // 代码编辑器新增方法
    handleEditorReady(payload) {
      // 保存编辑器实例（用于后续操作）
      this.editorView = payload.view;
    },
    handleCodeChange(value) {
      // 监听代码变化（可选）
      console.log('代码变化:', value);
    },
    resetCode() {
      // 重置代码
      this.code = this.selectedLang === 'javascript'
        ? 'console.log("Hello, world!");'
        : this.selectedLang === 'python'
          ? 'print("Hello, world!")'
          : 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}';
    },
    changeLanguage() {
  switch (this.selectedLang) {
    case 'javascript':
      this.extensions = [javascript(), oneDark];
      break;
    case 'python':
      this.extensions = [python(), oneDark];
      break;
    case 'java':
      this.extensions = [java(), oneDark];
      break;
    default:
      this.extensions = [javascript(), oneDark];
  }
  this.resetCode();
},
    formatCode() {
      // 代码格式化（需结合具体语言的格式化工具，这里仅示例）
      if (this.editorView) {
        // 简单格式化示例（实际需集成prettier等工具）
        const formatted = this.code.replace(/;/g, ';\n');
        this.code = formatted;
      }
    },
    submitCode() {
      // 提交代码逻辑
      console.log('提交的代码:', this.code);
      alert('代码已提交，正在测试...');
    }
  },
  beforeUnmount() {
    clearInterval(this.timer);
    // 销毁编辑器实例
    if (this.editorView) {
      this.editorView.destroy();
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
      width: 50px;
      height: 70px;
      border-radius: 80%;
      background: #52aff1;
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
.editor-section ::v-deep .cm-content {
  text-align: left !important;
  font-size: 16px; // 这里也可以设置编辑区域内容的字体大小
}
</style>