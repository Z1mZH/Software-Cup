<template>
  <div class="job-info-container">
    <!-- 步骤条 -->
    <StepBar :steps="steps" :current-step="currentStep" />

    <!-- 标题 -->
    <div class="header">
      <h1 class="title">准备完成啦🎇</h1>
      <p class="subtitle">已为您生成 {{ totalQuestions }} 道面试题目</p>
    </div>

    <!-- 题目概览卡片 -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-icon">🏢</div>
        <div class="card-content">
          <h3>公司相关</h3>
          <p>{{ companyQuestionCount }} 道题目</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon">💻</div>
        <div class="card-content">
          <h3>专业技术</h3>
          <p>{{ technicalQuestionCount }} 道题目</p>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="card-icon">📝</div>
        <div class="card-content">
          <h3>实际操作</h3>
          <p>{{ codingQuestionCount }} 道题目</p>
        </div>
      </div>
    </div>

    <!-- 岗位信息摘要 -->
    <div class="job-summary" v-if="jobInfo">
      <h3>面试信息</h3>
      <div class="info-item">
        <span class="label">公司：</span>
        <span class="value">{{ jobInfo.company }}</span>
      </div>
      <div class="info-item">
        <span class="label">岗位：</span>
        <span class="value">{{ jobInfo.position }}</span>
      </div>
      <div class="info-item" v-if="jobInfo.industry">
        <span class="label">行业：</span>
        <span class="value">{{ jobInfo.industry }}</span>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="buttons">
      <button class="btn-back" @click="prevStep">重新生成</button>
      <button class="btn-next" @click="nextStep">开始模拟面试</button>
    </div>
  </div>
</template>

<script>
import StepBar from "@/components/StepBar.vue";
import { ElMessage } from 'element-plus';

export default {
  components: { StepBar },
  data() {
    return {
      steps: [
        { label: '填写岗位信息' },
        { label: '选择简历' },
        { label: '面试押题' },
        { label: '准备完成' }
      ],
      currentStep: 3,
      interviewData: null,
      questions: null,
      jobInfo: null
    };
  },
  computed: {
    totalQuestions() {
      if (!this.questions) return 0;
      return (this.questions.companyQuestions?.length || 0) +
             (this.questions.technicalQuestions?.length || 0) +
             (this.questions.codingQuestions?.length || 0);
    },
    companyQuestionCount() {
      return this.questions?.companyQuestions?.length || 0;
    },
    technicalQuestionCount() {
      return this.questions?.technicalQuestions?.length || 0;
    },
    codingQuestionCount() {
      return this.questions?.codingQuestions?.length || 0;
    }
  },
  mounted() {
    // 获取面试数据
    const storedData = sessionStorage.getItem('interviewData');
    if (storedData) {
      this.interviewData = JSON.parse(storedData);
      this.questions = this.interviewData.interviewQuestions;
      this.jobInfo = {
        company: this.interviewData.company,
        position: this.interviewData.position,
        industry: this.interviewData.industry
      };
      
      console.log('=== 准备完成页面数据 ===');
      console.log('面试数据:', this.interviewData);
      console.log('题目总数:', this.totalQuestions);
      console.log('公司问题:', this.questions.companyQuestions);
      console.log('技术问题:', this.questions.technicalQuestions);
      console.log('实操题:', this.questions.codingQuestions);
    } else {
      ElMessage.error('未找到面试数据，请重新开始');
      setTimeout(() => {
        this.$router.push('/job_info');
      }, 2000);
    }
  },
  methods: {
    prevStep() {
      // 返回重新生成题目
      this.$router.push('/guess_ques');
    },
    
    nextStep() {
      // 确保数据存在
      if (!this.interviewData || !this.questions) {
        ElMessage.error('数据丢失，请重新开始');
        return;
      }
      
      // 准备传递到下一页的数据
      const configData = {
        ...this.interviewData,
        // 确保题目数据完整
        interviewQuestions: this.questions,
        // 添加配置信息
        config: {
          totalQuestions: this.totalQuestions,
          currentQuestionIndex: 0,
          answeredQuestions: [],
          startTime: new Date().toISOString()
        }
      };
      
      // 存储数据供下一页使用
      sessionStorage.setItem('configData', JSON.stringify(configData));
      
      console.log('传递到配置页面的数据:', configData);
      
      // 跳转到模拟面试配置页面
      this.$router.push('/config_view');
    }
  }
};
</script>

<style scoped lang="scss">
.job-info-container {
  min-height: 100vh;
  background: #ebf4fa;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  
  .title {
    font-size: 32px;
    color: #2d3748;
    margin-bottom: 10px;
  }
  
  .subtitle {
    font-size: 18px;
    color: #666;
  }
}

.summary-cards {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
  
  .summary-card {
    background: white;
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 20px;
    transition: all 0.3s ease;
    min-width: 200px;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }
    
    .card-icon {
      font-size: 48px;
      line-height: 1;
    }
    
    .card-content {
      h3 {
        font-size: 18px;
        color: #2d3748;
        margin: 0 0 8px 0;
      }
      
      p {
        font-size: 24px;
        color: #409eff;
        margin: 0;
        font-weight: bold;
      }
    }
  }
}

.job-summary {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  max-width: 500px;
  width: 100%;
  
  h3 {
    font-size: 20px;
    color: #2d3748;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .info-item {
    display: flex;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label {
      font-weight: 600;
      color: #666;
      width: 80px;
    }
    
    .value {
      color: #2d3748;
      flex: 1;
    }
  }
}

.buttons {
  display: flex;
  gap: 80px;
  margin-top: 30px;
  justify-content: flex-end;

  .btn-back,
  .btn-next {
    padding: 14px 28px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.5px;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }
  }

  .btn-back {
    background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
    color: #666;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

    &:hover {
      background: linear-gradient(145deg, #e0e0e0, #d0d0d0);
      color: #444;
    }
  }

  .btn-next {
    background: linear-gradient(145deg, #409eff, #3688e6);
    color: white;
    border: none;
    box-shadow: 0 3px 6px rgba(64, 158, 255, 0.2);
    min-width: 150px;

    &:hover {
      background: linear-gradient(145deg, #3688e6, #2c76d6);
      box-shadow: 0 4px 10px rgba(64, 158, 255, 0.25);
    }
  }
}

@media (max-width: 768px) {
  .summary-cards {
    flex-direction: column;
    align-items: center;
    
    .summary-card {
      width: 100%;
      max-width: 300px;
    }
  }
  
  .buttons {
    gap: 20px;
    flex-direction: column;
    width: 100%;
    
    .btn-back,
    .btn-next {
      width: 100%;
    }
  }
}
</style>