<template>
  <div class="interview-page">
    <!-- 左侧说明区 -->
    <div class="left-col">
      <img src="@/assets/logo.png" alt="模拟面试示例" class="preview-img" />
      <div class="guide">
        <h2>模拟面试</h2>
        <p>
          模拟面试由 AI 担任面试官，还原真实面试场景。
        </p>
        <ul>
          <li>📌 配置面试参数（时长、风格、语言等）</li>
          <li>🎙️ 录音测试确保设备正常</li>
          <li>🚀 一键启动沉浸式模拟面试</li>
        </ul>
      </div>
    </div>

    <!-- 右侧配置区 -->
    <div class="right-col">
      <div class="logo">OfferComing</div>
      <form class="config-form">
        <div class="form-group">
          <label>面试时长(分钟):</label>
          <select v-model="duration">
            <option>15</option>
            <option>20</option>
            <option>30</option>
          </select>
        </div>
        <div class="form-group">
          <label>面试官风格:</label>
          <select v-model="style">
            <option>亲切随和型</option>
            <option>理性客观型</option>
            <option>专业严厉型</option>
          </select>
        </div>
        <div class="form-group">
          <label>面试官角色:</label>
          <select v-model="role">
            <option>hr</option>
            <option>直属领导</option>
            <option>部门经理</option>
          </select>
        </div>
        <div class="form-group">
          <label>面试形式:</label>
          <select v-model="type" >
            <option value="ordinary">普通面试</option>
            <option value="coding">手撕代码</option>
          </select>
        </div>
        <div class="sound-test-section">
    <h2>声音输出检测</h2>
    <div class="audio-player">
<audio ref="testAudio" :src="audioSrc" controls preload="metadata"></audio>
    </div>
    <div class="confirmation">
      <button @click="playTestSound">播放测试音频</button>
      <button
        class="confirm-btn"
        :class="{ disabled: !audioPlayed }"
        @click="confirmSound"
      >
        {{ audioConfirmed ? "已确认" : "确认听到声音" }}
      </button>
    </div>
     </div>
        <div class="form-group">
          <label>音源选择:</label>
          <select v-model="audioSource">
            <option>内置麦克风</option>
            <option>外接麦克风</option>
          </select>
          <button class="test-btn" @click="goToRecordingTest" >录音测试</button>
        </div>
        <button class="start-btn" @click="goToMock">开始面试</button>
      </form>
    </div>
  </div>
</template>

<script>
import sampleAudio from '@/assets/sample.mp3'
export default {
  data() {
    return {
      duration: '15',
      style: '亲切随和型',
      role: '直属领导',
      type:'手撕代码',
      autoPlay: false,
      audioSrc: sampleAudio,
      audioSource: '内置麦克风',
      audioPlayed: false,
      audioConfirmed: false
    };
  },
  methods: {
    goToMock() {

      // 根据选择的面试类型跳转到不同的面试页面
      const routeMap = {
        ordinary: '/based_view',
        coding: '/coding_view'
      };

      // 传递配置参数到面试页面
      this.$router.push({
        path: routeMap[this.type]

      });
    },
    goToRecordingTest() {
      this.$router.push('/device_test'); // 跳转到指定路由
    },
    async initDeviceCheck() {
      // 播放测试音频（声音输出检测）
      await this.playTestSound();
    },
    async playTestSound() {
      const audio = this.$refs.testAudio;
      try {
        await audio.play();
        this.audioPlayed = true;
      } catch (err) {
        console.error('音频播放失败：', err);
        alert('请检查音频文件或浏览器设置');
      }
    },
    confirmSound() {
      if (this.audioPlayed) {
        this.audioConfirmed = true;
        // 可添加与设备检测状态的整合逻辑
      }
    }
  },
}
</script>
<style scoped lang="scss">
.interview-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2c82c9, #ebf4fa);
  display: flex;
  padding: 2rem;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }

  .left-col {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 2rem;
    color: white;

    .preview-img {
      width: 100%;
      border-radius: 8px;
      height: 45%;
    }

    .guide {
      h2 {
        font-size: 1.8rem;
        margin-bottom: 1rem;
      }
      p {
        line-height: 1.6;
        margin-bottom: 1rem;
      }
      ul {
        list-style: none;
        padding-left: 0;
        li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          svg {
            width: 1.2rem;
            height: 1.2rem;
          }
        }
      }
    }
  }

  .right-col {
    flex: 1;
    background: white;
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .logo {
      text-align: center;
      font-size: 2.5rem;
      color: #2c82c9;
      margin-bottom: 2rem;
    }

    .config-form {
      .form-group {
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;

        label {
          flex: 1;
          font-weight: 500;
        }

        select,
        input {
          flex: 2;
          padding: 0.8rem;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.3s;

          &:focus {
            border-color: #2c82c9;
          }
        }

        .test-btn {
          padding: 0.8rem 1.2rem;
          background: #2c82c9;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.3s;

          &:hover {
            background: #2268a3;
          }
        }
      }

      .start-btn {
        width: 100%;
        padding: 1rem;
        background: #2c82c9;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 1.2rem;
        cursor: pointer;
        transition: transform 0.3s, background 0.3s;

        &:hover {
          background: #2268a3;
          transform: translateY(-2px);
        }
      }
    }

    .sound-test-section {
      margin: 2rem 0;
      padding: 1.5rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      h2 {
        color: #2c82c9;
        margin-bottom: 1.2rem;
      }

      .audio-player {
        margin-bottom: 1.5rem;
      }

      .confirmation {
        display: flex;
        gap: 1rem;

        button {
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;

          &.confirm-btn {
            background: #27ae60;
            color: white;
            &.disabled {
              background: #ccc;
              cursor: not-allowed;
            }
          }

          &.replay-btn {
            background: #f39c12;
            color: white;
          }

          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .left-col,
  .right-col {
    width: 100%;
  }
}
</style>