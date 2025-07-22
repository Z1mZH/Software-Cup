<template>
  <div class="interview-page">
    <div class="left-col">
      <img src="@/assets/interview.png" alt="模拟面试示例" class="preview-img" />
      <div class="guide">
        <h2>模拟面试</h2>
        <p>模拟面试由 AI 担任面试官，还原真实面试场景。</p>
        <ul>
          <li>📌 配置面试参数（时长、风格、语言等）</li>
          <li>🎙️ 录音测试确保设备正常</li>
          <li>🚀 一键启动沉浸式模拟面试</li>
        </ul>
      </div>
    </div>

    <div class="right-col">
      <div class="logo">OfferComing</div>
      <form class="config-form" @submit.prevent>
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
          <select v-model="type">
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
            <button type="button" @click="playTestSound">播放测试音频</button>
            <button
              type="button"
              class="confirm-btn"
              :class="{ disabled: !audioPlayed }"
              :disabled="!audioPlayed"
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
          <button type="button" class="test-btn" @click="goToRecordingTest">录音测试</button>
        </div>

        <button type="button" class="start-btn" @click="goToMock">开始面试</button>
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
      type: 'ordinary',
      audioSrc: sampleAudio,
      audioSource: '内置麦克风',
      audioPlayed: false,
      audioConfirmed: false,
      interviewData: null,
      questions: null
    };
  },
  created() {
    const storedData = sessionStorage.getItem('configData');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      this.interviewData = parsed;
      // 正确获取题目数据
      this.questions = parsed.interviewQuestions;

      console.log('=== 配置页面数据 ===');
      console.log('获取到的面试数据:', this.interviewData);
      console.log('题目数据:', this.questions);
    } else {
      console.error('未找到配置数据');
      this.$router.push('/guess_ques');
    }
  },
  methods: {
    async playTestSound() {
      const audio = this.$refs.testAudio;
      try {
        await audio.play();
        this.audioPlayed = true;
      } catch (err) {
        alert('音频播放失败，请检查浏览器设置');
      }
    },
    confirmSound() {
      if (this.audioPlayed) {
        this.audioConfirmed = true;
      }
    },
    goToRecordingTest() {
      this.$router.push('/device_test');
    },
    goToMock() {
      if (!this.audioConfirmed) {
        alert('请先确认听到测试音频');
        return;
      }

      // 检查数据是否存在
      if (!this.interviewData || !this.questions) {
        alert('面试数据丢失，请返回重新配置');
        this.$router.push('/guess_ques');
        return;
      }

      // 将所有题目合并为一个数组
      const allQuestions = [];

      // 添加公司相关问题
      if (this.questions.companyQuestions && this.questions.companyQuestions.length > 0) {
        this.questions.companyQuestions.forEach(q => {
          allQuestions.push({
            type: 'company',
            question: q.question,
            tips: q.tips || q.answerTips || ''
          });
        });
      }

      // 添加技术问题
      if (this.questions.technicalQuestions && this.questions.technicalQuestions.length > 0) {
        this.questions.technicalQuestions.forEach(q => {
          allQuestions.push({
            type: 'technical',
            question: q.question,
            tips: q.tips || q.answerTips || ''
          });
        });
      }

      // 添加编程题目
      if (this.questions.codingQuestions && this.questions.codingQuestions.length > 0) {
        this.questions.codingQuestions.forEach(q => {
          allQuestions.push({
            type: 'coding',
            question: q.question,
            tips: q.tips || q.answerTips || '',
            codeTemplate: q.codeTemplate || ''
          });
        });
      }

      // 构建面试官提示词
      const jobDetails = this.interviewData?.position
        ? `你应聘的岗位是${this.interviewData.position}，公司为${this.interviewData.company || '某公司'}。`
        : '你即将开始面试。';

      const prompt = `你是一位${this.role}，风格为${this.style}。请根据以下${this.type === 'coding' ? '编程' : '综合'}面试题目进行提问与评价。${jobDetails}本次面试共有${allQuestions.length}道题，请结合实际情况逐一进行。`;

      // 准备完整的配置数据
      const fullConfig = {
        ...this.interviewData,
        allQuestions: allQuestions,  // 所有题目的数组
        originalQuestions: this.questions,  // 保留原始分类的题目
        config: {
          totalQuestions: allQuestions.length,
          currentQuestionIndex: 0,
          answeredQuestions: [],
          startTime: new Date().toISOString(),
          durationMinutes: parseInt(this.duration),
          interviewStyle: this.style,
          interviewerRole: this.role,
          interviewType: this.type,
          audioSource: this.audioSource,
          prompt: prompt,
          jobInfo: {
            company: this.interviewData.company || '',
            position: this.interviewData.position || '',
            industry: this.interviewData.industry || ''
          }
        }
      };

      // 存储完整配置
      sessionStorage.setItem('finalInterviewConfig', JSON.stringify(fullConfig));

      console.log('=== 最终配置数据 ===');
      console.log('所有题目数量:', allQuestions.length);
      console.log('题目列表:', allQuestions);
      console.log('完整配置:', fullConfig);

      // 根据面试类型跳转
      const routeMap = {
        ordinary: '/based_view',
        coding: '/coding_view'
      };
      this.$router.push({ path: routeMap[this.type] });
    }
  }
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
        line-height: 3;
        margin-bottom: 1rem;
      }
      ul {
        list-style: none;
        padding-left: 0;
        li {
          display: flex;
          align-items: center;
          gap: 1rem;
          line-height: 2;
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
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    .logo {
      text-align: center;
      font-size: 2.5rem;
      color: #2c82c9;
      margin-bottom: 1rem;
      font-family: 'Microsoft YaHei';
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
      padding: 0.5rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      h2 {
        color: #2c82c9;
        margin-top: 0.5rem;
        margin-bottom: 1.2rem;
      }

      .audio-player {
        margin-bottom: 1.5rem;
      }

      .confirmation {
        display: flex;
        gap: 3rem;
        justify-content: center;

        button {
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 0.5rem;


          &.confirm-btn {
            background: #27ae60;
            color: white;
            border: none;
            &.disabled {
              background: #ccc;
              cursor: not-allowed;
            }
          }

          &:hover:not(.disabled) {
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