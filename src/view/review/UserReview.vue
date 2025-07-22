<template>
  <div class="interview-review">
    <!-- 顶部导航栏 -->
    <header class="review-header">
      <div class="logo-container">
        <span class="logo-text">OfferComing</span>
      </div>
      <button type="button" class="back-btn" @click="goHome">返回首页</button>
    </header>

    <!-- 主内容区域 -->
    <main class="review-main">
      <!-- 左侧面试对话区 -->
      <div class="interview-chat">
        <h3 class="chat-title">面试对话记录</h3>
        <div
          v-for="(item, idx) in chatRecords"
          :key="idx"
          :class="['chat-item', { interviewer: item.role === 'interviewer' }]"
        >
          <!-- 对话内容 -->
          <div class="chat-bubble">
            <div class="role-tag" :class="{ interviewer: item.role === 'interviewer' }">
              {{ item.role === 'interviewer' ? '面试官' : '你' }}
            </div>
            <p class="content">{{ item.content }}</p>
          </div>
        </div>
      </div>

      <!-- 右侧分析面板 -->
      <section class="analysis-panel">
        <!-- 面试概要 -->
        <div class="summary-section">
          <!-- 双雷达图展示 -->
          <div class="charts-container">
            <!-- 专业知识雷达图 -->
            <div class="chart-wrapper">
              <h3>专业知识评估</h3>
              <div ref="knowledgeChart" class="radar-chart"></div>
              <p class="chart-score">综合得分：{{ knowledgeScore }}/10</p>
            </div>
            
            <!-- 面试表现雷达图 -->
            <div class="chart-wrapper">
              <h3>面试表现评估</h3>
              <div ref="performanceChart" class="radar-chart"></div>
              <p class="chart-score">综合得分：{{ performanceScore }}/10</p>
            </div>
          </div>

          <!-- AI面试总结 -->
          <div class="ai-summary">
            <h3>AI面试总结</h3>
            <div class="summary-content">
              <p>{{ aiSummary }}</p>
            </div>
          </div>

          <!-- 优缺点分析 -->
          <div class="pros-cons">
            <!-- 专业技能优缺点 -->
            <div class="skill-analysis">
              <h3>专业技能分析</h3>
              <div class="analysis-content">
                <div class="cons-box">
                  <h4>待改进点</h4>
                  <ul>
                    <li v-for="(item, idx) in skillWeaknesses" :key="idx">{{ item }}</li>
                  </ul>
                </div>
                <div class="pros-box">
                  <h4>优势亮点</h4>
                  <ul>
                    <li v-for="(item, idx) in skillStrengths" :key="idx">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- 面试表现优缺点 -->
            <div class="performance-analysis">
              <h3>面试表现分析</h3>
              <div class="analysis-content">
                <div class="cons-box">
                  <h4>待改进点</h4>
                  <ul>
                    <li v-for="(item, idx) in performanceWeaknesses" :key="idx">{{ item }}</li>
                  </ul>
                </div>
                <div class="pros-box">
                  <h4>优势亮点</h4>
                  <ul>
                    <li v-for="(item, idx) in performanceStrengths" :key="idx">{{ item }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 录用建议 -->
          <div class="hiring-recommendation" v-if="hiringRecommendation">
            <h3>录用建议</h3>
            <div :class="['recommendation-box', recommendationClass]">
              <p>{{ hiringRecommendation }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import * as echarts from 'echarts';

// 配置大模型
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: "sk-a34b0daa63ec4ad8b9f7d83ec09e6802",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  dangerouslyAllowBrowser: true
});

export default {
  data() {
    return {
      // 面试数据
      interviewData: null,
      
      // 对话记录
      chatRecords: [],
      
      // 雷达图数据
      knowledgeRadarData: {
        indicator: [],
        values: []
      },
      performanceRadarData: {
        indicator: [],
        values: []
      },
      
      // 分数
      knowledgeScore: 0,
      performanceScore: 0,
      
      // AI总结
      aiSummary: '',
      
      // 优缺点分析
      skillStrengths: [],
      skillWeaknesses: [],
      performanceStrengths: [],
      performanceWeaknesses: [],
      
      // 录用建议
      hiringRecommendation: '',
      recommendationClass: ''
    };
  },
  
  async mounted() {
    // 获取面试数据
    const storedData = sessionStorage.getItem('interviewResult');
    if (!storedData) {
      alert('未找到面试数据');
      this.$router.push('/job_info');
      return;
    }
    
    this.interviewData = JSON.parse(storedData);
    
    // 处理对话记录
    this.processChatRecords();
    
    // 分析专业知识
    await this.analyzeKnowledge();
    
    // 处理面试表现数据
    this.processPerformanceData();
    
    // 生成AI总结
    await this.generateAISummary();
    
    // 初始化雷达图
    this.$nextTick(() => {
      this.initRadarCharts();
    });
  },
  
  methods: {
    // 处理对话记录
    processChatRecords() {
      const records = [];
      
      this.interviewData.questions.forEach((q) => {
        // 添加原始问题
        records.push({
          role: 'interviewer',
          content: q.originalQuestion
        });
        
        // 添加第一次回答
        records.push({
          role: 'candidate',
          content: q.firstAnswer || '未识别到有效回答'
        });
        
        // 添加追问
        if (q.followUpQuestion) {
          records.push({
            role: 'interviewer',
            content: `追问：${q.followUpQuestion}`
          });
          
          // 添加追问回答
          records.push({
            role: 'candidate',
            content: q.secondAnswer || '未识别到有效回答'
          });
        }
      });
      
      this.chatRecords = records;
    },
    
    // 分析专业知识
    async analyzeKnowledge() {
      try {
        const jobInfo = this.interviewData.jobInfo;
        const questions = this.interviewData.questions;
        
        const analysisPrompt = `
你是一位资深的技术面试官。请基于以下面试信息，评估应聘者的专业知识水平：

岗位信息：
- 职位：${jobInfo?.position || '未知职位'}
- 行业：${jobInfo?.industry || '未知行业'}
- 面试官类型：${jobInfo?.interviewerType || '综合面试官'}

面试问答记录：
${questions.map((q, index) => `
问题${index + 1}：${q.originalQuestion}
回答：${q.firstAnswer}
追问：${q.followUpQuestion}
追问回答：${q.secondAnswer}
`).join('\n')}

请从以下维度评估应聘者的专业知识（每项1-10分）：
1. 专业知识深度：对核心概念和原理的理解程度
2. 实践经验：实际项目经验和动手能力
3. 技术广度：知识面的宽度和对相关技术的了解
4. 问题解决能力：分析和解决技术问题的能力
5. 学习能力：对新知识的接受和学习能力
6. 创新思维：技术创新和优化的能力

请以JSON格式返回评估结果：
{
  "scores": {
    "knowledgeDepth": 分数,
    "practicalExperience": 分数,
    "technicalBreadth": 分数,
    "problemSolving": 分数,
    "learningAbility": 分数,
    "innovation": 分数
  },
  "overallScore": 总分(1-10),
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["缺点1", "缺点2", "缺点3"]
}`;

        const response = await openai.chat.completions.create({
          model: "qwen-plus",
          messages: [
            {
              role: "system",
              content: "你是一位经验丰富的技术面试官，擅长评估应聘者的专业能力。"
            },
            {
              role: "user",
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });

        let content = response.choices[0].message.content;
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        
        const knowledgeAnalysis = JSON.parse(content);
        
        // 设置雷达图数据
        this.knowledgeRadarData.indicator = [
          { name: '专业知识深度', max: 10 },
          { name: '实践经验', max: 10 },
          { name: '技术广度', max: 10 },
          { name: '问题解决能力', max: 10 },
          { name: '学习能力', max: 10 },
          { name: '创新思维', max: 10 }
        ];
        
        this.knowledgeRadarData.values = [
          knowledgeAnalysis.scores.knowledgeDepth,
          knowledgeAnalysis.scores.practicalExperience,
          knowledgeAnalysis.scores.technicalBreadth,
          knowledgeAnalysis.scores.problemSolving,
          knowledgeAnalysis.scores.learningAbility,
          knowledgeAnalysis.scores.innovation
        ];
        
        this.knowledgeScore = knowledgeAnalysis.overallScore;
        this.skillStrengths = knowledgeAnalysis.strengths;
        this.skillWeaknesses = knowledgeAnalysis.weaknesses;
        
      } catch (error) {
        console.error('专业知识分析失败:', error);
        // 使用默认值
        this.setDefaultKnowledgeData();
      }
    },
    
    // 处理面试表现数据
    processPerformanceData() {
      // 如果有图像分析结果，使用图像分析的数据
      if (this.interviewData.imageAnalysisResults && this.interviewData.imageAnalysisResults.length > 0) {
        // 计算所有图像分析的平均分
        const allScores = {
          eyeContact: [],
          bodyLanguage: [],
          appearance: [],
          facialExpression: [],
          professionalImage: []
        };
        
        this.interviewData.imageAnalysisResults.forEach(result => {
          const analysis = result.analysis.analysis;
          allScores.eyeContact.push(analysis.eyeContact.score);
          allScores.bodyLanguage.push(analysis.bodyLanguage.score);
          allScores.appearance.push(analysis.appearance.score);
          allScores.facialExpression.push(analysis.facialExpression.score);
          allScores.professionalImage.push(analysis.professionalImage.score);
        });
        
        // 计算平均分
        const avgScores = {
          eyeContact: this.calculateAverage(allScores.eyeContact),
          bodyLanguage: this.calculateAverage(allScores.bodyLanguage),
          appearance: this.calculateAverage(allScores.appearance),
          facialExpression: this.calculateAverage(allScores.facialExpression),
          professionalImage: this.calculateAverage(allScores.professionalImage)
        };
        
        // 设置雷达图数据
        this.performanceRadarData.indicator = [
          { name: '眼神接触', max: 10 },
          { name: '肢体语言', max: 10 },
          { name: '服装仪表', max: 10 },
          { name: '面部表情', max: 10 },
          { name: '专业形象', max: 10 },
          { name: '整体气质', max: 10 }
        ];
        
        // 计算整体气质分数（其他分数的加权平均）
        const overallPresence = (avgScores.eyeContact * 0.2 + 
                                avgScores.bodyLanguage * 0.2 + 
                                avgScores.appearance * 0.2 + 
                                avgScores.facialExpression * 0.2 + 
                                avgScores.professionalImage * 0.2);
        
        this.performanceRadarData.values = [
          avgScores.eyeContact,
          avgScores.bodyLanguage,
          avgScores.appearance,
          avgScores.facialExpression,
          avgScores.professionalImage,
          overallPresence
        ];
        
        this.performanceScore = this.calculateAverage(this.performanceRadarData.values);
        
        // 提取优缺点
        const latestAnalysis = this.interviewData.imageAnalysisResults[this.interviewData.imageAnalysisResults.length - 1].analysis;
        this.performanceStrengths = latestAnalysis.strengths || [];
        this.performanceWeaknesses = latestAnalysis.improvements || [];
        
      } else if (this.interviewData.performanceAnalysis) {
        // 使用综合表现分析数据
        const dimensions = this.interviewData.performanceAnalysis.dimensions;
        
        this.performanceRadarData.indicator = [
          { name: '专业技能', max: 10 },
          { name: '沟通表达', max: 10 },
          { name: '问题解决', max: 10 },
          { name: '学习潜力', max: 10 },
          { name: '岗位匹配', max: 10 },
          { name: '综合素质', max: 10 }
        ];
        
        this.performanceRadarData.values = [
          dimensions.technicalSkills.score,
          dimensions.communication.score,
          dimensions.problemSolving.score,
          dimensions.learningPotential.score,
          dimensions.jobFit.score,
          this.interviewData.performanceAnalysis.overallScore
        ];
        
        this.performanceScore = this.interviewData.performanceAnalysis.overallScore;
        this.performanceStrengths = this.interviewData.performanceAnalysis.highlights || [];
        this.performanceWeaknesses = this.interviewData.performanceAnalysis.weaknesses || [];
        this.hiringRecommendation = this.interviewData.performanceAnalysis.hiringRecommendation;
        
        // 设置推荐样式
        this.setRecommendationClass();
      } else {
        // 使用默认值
        this.setDefaultPerformanceData();
      }
    },
    
    // 生成AI总结
    async generateAISummary() {
      try {
        const jobInfo = this.interviewData.jobInfo;
        const summary = this.interviewData.summary;
        
        const summaryPrompt = `
请基于以下面试信息，生成一份简洁的面试总结（150-200字）：

岗位信息：
- 职位：${jobInfo?.position || '未知职位'}
- 行业：${jobInfo?.industry || '未知行业'}

面试概况：
- 总题目数：${summary.totalQuestions}
- 完成题目数：${summary.answeredQuestions}
- 面试时长：${summary.actualDuration}分钟
- 专业知识得分：${this.knowledgeScore}/10
- 面试表现得分：${this.performanceScore}/10

主要优势：
${[...this.skillStrengths, ...this.performanceStrengths].slice(0, 3).join('、')}

需要提升：
${[...this.skillWeaknesses, ...this.performanceWeaknesses].slice(0, 3).join('、')}

请生成一份客观、专业的面试总结，包括应聘者的整体表现、主要亮点和建议。`;

        const response = await openai.chat.completions.create({
          model: "qwen-plus",
          messages: [
            {
              role: "system",
              content: "你是一位专业的HR，擅长撰写简洁精准的面试总结。"
            },
            {
              role: "user",
              content: summaryPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        });

        this.aiSummary = response.choices[0].message.content.trim();
        
      } catch (error) {
        console.error('生成AI总结失败:', error);
        this.aiSummary = `在本次${this.interviewData.jobInfo?.position || ''}岗位面试中，应聘者完成了${this.interviewData.summary.answeredQuestions}道题目的回答。从专业知识角度看，应聘者展现了一定的技术基础，专业评分${this.knowledgeScore}/10。在面试表现方面，应聘者的综合表现评分为${this.performanceScore}/10。建议应聘者在今后继续加强专业技能的学习，同时提升面试技巧，以更好地展现自己的能力和潜力。`;
      }
    },
    
    // 初始化雷达图
    initRadarCharts() {
      // 专业知识雷达图
      const knowledgeChartDom = this.$refs.knowledgeChart;
      const knowledgeChart = echarts.init(knowledgeChartDom);
      
      const knowledgeOption = {
        radar: {
          indicator: this.knowledgeRadarData.indicator,
          shape: 'polygon',
          splitNumber: 5,
          axisName: {
            color: '#666',
            fontSize: 12
          },
          splitLine: {
            lineStyle: {
              color: '#e0e0e0'
            }
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ['#fff', '#f7f7f7']
            }
          },
          axisLine: {
            lineStyle: {
              color: '#e0e0e0'
            }
          }
        },
        series: [{
          name: '专业知识',
          type: 'radar',
          data: [{
            value: this.knowledgeRadarData.values,
            name: '能力值',
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.3)'
            },
            lineStyle: {
              color: '#409eff',
              width: 2
            },
            itemStyle: {
              color: '#409eff'
            }
          }]
        }]
      };
      
      knowledgeChart.setOption(knowledgeOption);
      
      // 面试表现雷达图
      const performanceChartDom = this.$refs.performanceChart;
      const performanceChart = echarts.init(performanceChartDom);
      
      const performanceOption = {
        radar: {
          indicator: this.performanceRadarData.indicator,
          shape: 'polygon',
          splitNumber: 5,
          axisName: {
            color: '#666',
            fontSize: 12
          },
          splitLine: {
            lineStyle: {
              color: '#e0e0e0'
            }
          },
          splitArea: {
            show: true,
            areaStyle: {
              color: ['#fff', '#f7f7f7']
            }
          },
          axisLine: {
            lineStyle: {
              color: '#e0e0e0'
            }
          }
        },
        series: [{
          name: '面试表现',
          type: 'radar',
          data: [{
            value: this.performanceRadarData.values,
            name: '表现值',
            areaStyle: {
              color: 'rgba(103, 194, 58, 0.3)'
            },
            lineStyle: {
              color: '#67c23a',
              width: 2
            },
            itemStyle: {
              color: '#67c23a'
            }
          }]
        }]
      };
      
      performanceChart.setOption(performanceOption);
      
      // 响应式
      window.addEventListener('resize', () => {
        knowledgeChart.resize();
        performanceChart.resize();
      });
    },
    
    // 计算平均值
    calculateAverage(arr) {
      return arr.reduce((sum, val) => sum + val, 0) / arr.length;
    },
    
    // 设置默认专业知识数据
    setDefaultKnowledgeData() {
      this.knowledgeRadarData.indicator = [
        { name: '专业知识深度', max: 10 },
        { name: '实践经验', max: 10 },
        { name: '技术广度', max: 10 },
        { name: '问题解决能力', max: 10 },
        { name: '学习能力', max: 10 },
        { name: '创新思维', max: 10 }
      ];
      
      this.knowledgeRadarData.values = [7, 6, 7, 7, 8, 6];
      this.knowledgeScore = 6.8;
      this.skillStrengths = ['基础知识扎实', '学习态度积极', '思路清晰'];
      this.skillWeaknesses = ['实践经验不足', '技术深度有待提高', '创新能力需加强'];
    },
    
    // 设置默认面试表现数据
    setDefaultPerformanceData() {
      this.performanceRadarData.indicator = [
        { name: '眼神接触', max: 10 },
        { name: '肢体语言', max: 10 },
        { name: '服装仪表', max: 10 },
        { name: '面部表情', max: 10 },
        { name: '专业形象', max: 10 },
        { name: '整体气质', max: 10 }
      ];
      
      this.performanceRadarData.values = [7, 7, 8, 7, 7, 7];
      this.performanceScore = 7.2;
      this.performanceStrengths = ['着装得体', '态度认真', '表达流畅'];
      this.performanceWeaknesses = ['略显紧张', '眼神交流不够', '肢体语言可以更自信'];
    },
    
    // 设置推荐样式
    setRecommendationClass() {
      if (this.hiringRecommendation.includes('强烈推荐')) {
        this.recommendationClass = 'strong-recommend';
      } else if (this.hiringRecommendation.includes('推荐')) {
        this.recommendationClass = 'recommend';
      } else if (this.hiringRecommendation.includes('考虑')) {
        this.recommendationClass = 'consider';
      } else {
        this.recommendationClass = 'not-recommend';
      }
    },
    
    // 返回首页
    goHome() {
      this.$router.push('/job_info');
    }
  },
  
  beforeUnmount() {
    // 清理图表实例
    ['knowledgeChart', 'performanceChart'].forEach(ref => {
      const chartDom = this.$refs[ref];
      if (chartDom) {
        const chart = echarts.getInstanceByDom(chartDom);
        if (chart) {
          chart.dispose();
        }
      }
    });
  }
};
</script>

<style scoped lang="scss">
.interview-review {
  min-height: 100vh;
  background: #f5f7fa;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;

  // 顶部导航
  .review-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.08);

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .logo-text {
        font-size: 1.5rem;
        font-weight: 600;
        color: #409eff;
      }
    }

    .back-btn {
      padding: 0.6rem 1.5rem;
      background: #409eff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;

      &:hover {
        background: #66b1ff;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
      }
    }
  }

  // 主内容布局
  .review-main {
    display: flex;
    padding: 2rem;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;

    @media (max-width: 1024px) {
      flex-direction: column;
      padding: 1rem;
    }
  }

  // 左侧对话面板
  .interview-chat {
    width: 400px;
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    height: fit-content;
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    
    @media (max-width: 1024px) {
      width: 100%;
      max-height: 400px;
    }
    
    .chat-title {
      font-size: 18px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 1.5rem;
      padding-bottom: 0.8rem;
      border-bottom: 2px solid #f0f2f5;
    }

    .chat-item {
      margin-bottom: 1.2rem;
      
      .chat-bubble {
        .role-tag {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 0.5rem;
          color: #67c23a;
          
          &.interviewer {
            color: #409eff;
          }
        }
        
        .content {
          font-size: 14px;
          line-height: 1.6;
          color: #606266;
          background: #f4f4f5;
          padding: 0.8rem 1rem;
          border-radius: 8px;
          
          .interviewer & {
            background: #ecf5ff;
          }
        }
      }
    }
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #dcdfe6;
      border-radius: 3px;
    }
  }

  // 右侧分析面板
  .analysis-panel {
    flex: 1;
    background: #fff;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);

    .summary-section {
      // 双雷达图容器
      .charts-container {
        display: flex;
        gap: 3rem;
        margin-bottom: 2.5rem;
        
        @media (max-width: 768px) {
          flex-direction: column;
          gap: 2rem;
        }
        
        .chart-wrapper {
          flex: 1;
          text-align: center;
          
          h3 {
            font-size: 16px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 1rem;
          }
          
          .radar-chart {
            width: 100%;
            height: 280px;
          }
          
          .chart-score {
            margin-top: 0.5rem;
            font-size: 14px;
            color: #409eff;
            font-weight: 500;
          }
        }
      }
      
      // AI总结
      .ai-summary {
        margin-bottom: 2.5rem;
        
        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          
          &::before {
            content: '';
            width: 4px;
            height: 18px;
            background: #409eff;
            margin-right: 8px;
            border-radius: 2px;
          }
        }
        
        .summary-content {
          background: #f5f7fa;
          border-radius: 8px;
          padding: 1.5rem;
          
          p {
            font-size: 15px;
            line-height: 1.8;
            color: #606266;
            text-align: justify;
          }
        }
      }

      // 优缺点分析
      .pros-cons {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-bottom: 2rem;
        
        .skill-analysis, .performance-analysis {
          h3 {
            font-size: 18px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            
            &::before {
              content: '';
              width: 4px;
              height: 18px;
              background: #409eff;
              margin-right: 8px;
              border-radius: 2px;
            }
          }
          
          .analysis-content {
            display: flex;
            gap: 2rem;
            
            @media (max-width: 768px) {
              flex-direction: column;
              gap: 1rem;
            }
            
            .cons-box, .pros-box {
              flex: 1;
              background: #fef0f0;
              border-radius: 8px;
              padding: 1.2rem;
              border: 1px solid #fde2e2;
              
              h4 {
                font-size: 15px;
                font-weight: 600;
                color: #f56c6c;
                margin-bottom: 0.8rem;
                display: flex;
                align-items: center;
                
                &::before {
                  content: '⚠️';
                  margin-right: 6px;
                }
              }
              
              ul {
                list-style: none;
                padding: 0;
                
                li {
                  font-size: 14px;
                  line-height: 1.8;
                  color: #606266;
                  padding-left: 1.2rem;
                  position: relative;
                  
                  &::before {
                    content: '•';
                    position: absolute;
                    left: 0;
                    color: #f56c6c;
                  }
                }
              }
            }
            
            .pros-box {
              background: #f0f9ff;
              border-color: #d0e9ff;
              
              h4 {
                color: #67c23a;
                
                &::before {
                  content: '✅';
                }
              }
              
              ul li::before {
                color: #67c23a;
              }
            }
          }
        }
      }
      
      // 录用建议
      .hiring-recommendation {
        margin-top: 2rem;
        
        h3 {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          
          &::before {
            content: '';
            width: 4px;
            height: 18px;
            background: #409eff;
            margin-right: 8px;
            border-radius: 2px;
          }
        }
        
        .recommendation-box {
          padding: 1.2rem;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          text-align: center;
          
          &.strong-recommend {
            background: #f0f9ff;
            color: #409eff;
            border: 2px solid #409eff;
          }
          
          &.recommend {
            background: #f0f9ff;
            color: #67c23a;
            border: 2px solid #67c23a;
          }
          
          &.consider {
            background: #fdf6ec;
            color: #e6a23c;
            border: 2px solid #e6a23c;
          }
          
          &.not-recommend {
            background: #fef0f0;
            color: #f56c6c;
            border: 2px solid #f56c6c;
          }
        }
      }
    }
  }
}
</style>