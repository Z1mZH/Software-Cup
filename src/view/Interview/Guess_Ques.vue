<template>
  <div class="job-info-container">
    <!-- 步骤条 -->
    <StepBar :steps="steps" :current-step="currentStep" />

    <!-- 标题 -->
    <div class="header">
      <h1 class="title">{{ loadingText }}</h1>
    </div>

    <!-- 流星背景（绝对铺满、最底层） -->
    <StarsBG color="#fff" :count="200" class="stars-bg" />

    <!-- 进度条（绝对居中） -->
    <div class="progress-box">
      <svg
        viewBox="0 0 200 200"
        class="progress-circle"
      >
        <!-- 背景圆 -->
        <g transform="rotate(-90 100 100)">
          <circle
            r="90"
            cx="100"
            cy="100"
            fill="none"
            stroke="#f0f0f0"
            stroke-width="10"
          />
        </g>
        <!-- 进度圆 -->
        <g transform="rotate(-90 100 100)">
          <circle
            r="90"
            cx="100"
            cy="100"
            fill="none"
            stroke="#409eff"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="progressValue"
            class="progress-arc"
          />
        </g>
      </svg>
      <!-- 进度百分比 -->
      <div class="progress-text">{{ Math.round(progress) }}%</div>
    </div>
  </div>
</template>

<script>
import StepBar from "@/components/StepBar.vue";
import StarsBG from "@/components/ui/bg-falling-stars/FallingStarsBg.vue";
import OpenAI from "openai";
import { ElMessage } from 'element-plus';

// 配置大模型
const openai = new OpenAI({
  apiKey: "sk-a34b0daa63ec4ad8b9f7d83ec09e6802",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  dangerouslyAllowBrowser: true
});

export default {
  components: { StepBar, StarsBG },
  props: {
    color: { type: String, default: '#609fe1' },
    width: { type: String, default: '210px' },
    height: { type: String, default: '100px' }
  },
  data() {
    return {
      steps: [
        { label: '填写岗位信息' },
        { label: '选择简历' },
        { label: '面试押题' },
        { label: '准备完成' }
      ],
      currentStep: 2,
      radius: 90,
      progress: 0,
      timer: null,
      loadingText: '面试押题中，请稍等~',
      resumeData: null,
      interviewQuestions: null,
      isGenerating: false,
      progressInterval: null
    };
  },
  computed: {
    circumference() {
      return 2 * Math.PI * this.radius;
    },
    progressValue() {
      return this.circumference * (1 - this.progress / 100);
    }
  },
  async mounted() {
    // 获取上一步传递的数据
    const storedData = sessionStorage.getItem('resumeData');
    if (storedData) {
      this.resumeData = JSON.parse(storedData);
      console.log('接收到的数据:', this.resumeData);
      
      // 开始生成面试题目
      await this.generateInterviewQuestions();
    } else {
      ElMessage.error('未找到简历数据，请返回上一步');
      setTimeout(() => {
        this.$router.push('/sel_cv');
      }, 2000);
    }
  },
  methods: {
    // 生成面试题目
    async generateInterviewQuestions() {
      this.isGenerating = true;
      
      // 启动进度条动画
      this.startProgressAnimation();
      
      try {
        console.log('开始调用大模型...');
        console.log('使用的prompt:', this.resumeData.completePrompt);
        
        const completion = await openai.chat.completions.create({
          model: "qwen-plus",
          messages: [
            { 
              role: "system", 
              content: "你是一位经验丰富的技术面试官，擅长根据候选人的背景和目标岗位设计针对性的面试题目。请严格按照要求的JSON格式输出面试题目。" 
            },
            { 
              role: "user", 
              content: this.resumeData.completePrompt 
            }
          ],
          temperature: 0.7,
          max_tokens: 2500
        });

        const responseContent = completion.choices[0].message.content;
        console.log('大模型原始响应:', responseContent);

        // 尝试解析JSON响应
        try {
          // 提取JSON内容（如果响应中包含其他文字）
          const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            this.interviewQuestions = JSON.parse(jsonMatch[0]);
            console.log('解析后的面试题目:', this.interviewQuestions);
            
            // 验证数据结构
            if (this.validateQuestions(this.interviewQuestions)) {
              // 将进度快速推进到100%
              this.accelerateProgress();
            } else {
              throw new Error('题目格式不符合要求');
            }
          } else {
            throw new Error('响应中未找到JSON格式数据');
          }
        } catch (parseError) {
          console.error('JSON解析失败:', parseError);
          // 使用备用题目
          this.interviewQuestions = this.generateFallbackQuestions();
          this.accelerateProgress();
        }
        
      } catch (error) {
        console.error('生成面试题目失败:', error);
        ElMessage.error('题目生成失败，使用默认题库');
        
        // 使用备用题目
        this.interviewQuestions = this.generateFallbackQuestions();
        this.accelerateProgress();
      }
    },

    // 启动进度条动画
    startProgressAnimation() {
      // 设置一个基础进度增长
      this.progressInterval = setInterval(() => {
        if (this.progress < 90 && this.isGenerating) {
          // 进度条增长速度随进度递减，模拟真实加载
          const increment = Math.max(0.5, (90 - this.progress) / 20);
          this.progress = Math.min(90, this.progress + increment);
        }
      }, 100);
    },

    // 加速进度到100%
    accelerateProgress() {
      this.isGenerating = false;
      clearInterval(this.progressInterval);
      
      // 快速完成剩余进度
      const finishInterval = setInterval(() => {
        if (this.progress < 100) {
          this.progress = Math.min(100, this.progress + 5);
        } else {
          clearInterval(finishInterval);
          this.onComplete();
        }
      }, 50);
    },

    // 验证题目格式
    validateQuestions(questions) {
      return questions.companyQuestions && 
             questions.technicalQuestions && 
             questions.codingQuestions &&
             Array.isArray(questions.companyQuestions) &&
             Array.isArray(questions.technicalQuestions) &&
             Array.isArray(questions.codingQuestions);
    },

    // 生成备用题目
    generateFallbackQuestions() {
      const { company, position } = this.resumeData;
      
      return {
        companyQuestions: [
          {
            id: 1,
            category: "公司发展",
            question: `你对${company || '我们公司'}的了解有多少？为什么选择我们？`,
            hint: "从公司的业务、文化、发展方向等角度回答"
          },
          {
            id: 2,
            category: "公司发展",
            question: "你的职业规划是什么？如何在我们公司实现？",
            hint: "结合个人发展目标和公司平台优势"
          },
          {
            id: 3,
            category: "公司发展",
            question: "你能为公司带来什么独特价值？",
            hint: "突出个人优势和与岗位的匹配度"
          }
        ],
        technicalQuestions: [
          {
            id: 4,
            category: "专业知识",
            question: `作为${position || '技术人员'}，你如何理解这个岗位的核心职责？`,
            keyPoints: ["技术能力", "团队协作", "业务理解"]
          },
          // ... 可以根据实际情况添加更多默认题目
        ],
        codingQuestions: [
          {
            id: 14,
            category: "编程题",
            question: "实现一个简单的缓存系统（LRU Cache）",
            difficulty: "中等",
            language: "JavaScript/Python",
            example: "cache.get(1) => 返回缓存的值",
            solution: "使用Map数据结构维护插入顺序"
          },
          {
            id: 15,
            category: "编程题",
            question: "设计一个并发安全的任务调度器",
            difficulty: "困难",
            language: "语言不限",
            example: "scheduler.schedule(task, delay)",
            solution: "使用优先队列和线程池"
          }
        ]
      };
    },

    // 完成后的处理
    onComplete() {
      this.loadingText = '押题完成！';
      
      // 准备传递到下一页的数据
      const finalData = {
        ...this.resumeData,
        interviewQuestions: this.interviewQuestions,
        generatedAt: new Date().toISOString()
      };
      
      // 存储数据
      sessionStorage.setItem('interviewData', JSON.stringify(finalData));
      
      console.log('=== 面试题目生成完成 ===');
      console.log('公司相关问题:', this.interviewQuestions.companyQuestions);
      console.log('技术问题:', this.interviewQuestions.technicalQuestions);
      console.log('编程题:', this.interviewQuestions.codingQuestions);
      
      // 延迟跳转，让用户看到100%
      setTimeout(() => {
        this.$router.push('/fin_prep');
      }, 1000);
    }
  },
  beforeUnmount() {
    clearInterval(this.timer);
    clearInterval(this.progressInterval);
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
  margin-bottom: 30px;
  z-index: 5;
  
  .title {
    font-size: 28px;
    color: #2d3748;
    margin-bottom: 0;
  }
}

/* 流星背景：铺满整屏、最底层 */
.stars-bg {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 50vw;
  height: 50vw;
  max-width: 400px;
  max-height: 400px;
  clip-path: circle(45%);
  overflow: hidden;
}

/* 进度条：绝对居中、顶层 */
.progress-box {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 50vw;
  max-width: 400px;
  aspect-ratio: 1 / 1;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-circle {
  width: 100%;
  height: 100%;
}

.progress-arc {
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  position: absolute;
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
  @media (max-width: 768px) {
    font-size: 28px;
  }
}

@media (max-width: 768px) {
  .progress-box {
    width: 80vw;
  }
}
</style>