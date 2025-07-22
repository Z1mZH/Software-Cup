<template>
  <!-- 顶部状态栏 -->
  <div class="top-bar">
    <div class="progress-info">
      <span>第 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }} 题</span>
      <span class="timer">剩余时间: {{ formatTime(remainingTime) }}</span>
    </div>
    <button class="end-btn" @click="endInterview">结束面试</button>
  </div>
  
  <div class="coding-interview-page">
    <div class="left-control">
      <button class="toggle-cam-btn" @click="toggleCameraView">
        {{ showCamera ? '隐藏摄像头' : '显示摄像头' }}
      </button>
    </div>

    <div class="main-content" :class="{ 'with-camera': showCamera }">
      <!-- 摄像头视图 -->
      <div class="camera-view" v-show="showCamera">
        <div class="user-panel">
          <div class="avatar blue">面试官</div>
          <div class="status">
            <span class="online-dot"></span> 在线
          </div>
          <div class="video-placeholder"></div>
        </div>
        <div class="user-panel">
          <div class="avatar gray">我</div>
          <div class="status">
            <span class="online-dot"></span> 在线
            <span v-if="isCapturingImages" class="capture-status">📸 采集中</span>
          </div>
          <div class="camera-container">
            <video ref="cameraVideo" class="camera-video" autoplay muted></video>
          </div>
        </div>
      </div>

      <!-- 编程区域 -->
      <div class="coding-area" v-show="!showCamera">
        <!-- 左侧题目描述 -->
        <div class="problem-section">
          <h3>【编程题】第{{ currentQuestionIndex + 1 }}题（共{{ totalQuestions }}题）</h3>
          <p class="time-info">答题时间：{{ formatTime(questionRemainingTime) }}</p>
          <div class="problem-desc" v-if="currentQuestion">
            <h4>题目要求</h4>
            <div class="description">{{ currentQuestion.question }}</div>
            
            <div class="tips-section" v-if="currentQuestion.tips">
              <h5>解题提示：</h5>
              <div class="tips-content">{{ currentQuestion.tips }}</div>
            </div>
            
            <div class="code-template-section" v-if="currentQuestion.codeTemplate">
              <h5>代码模板：</h5>
              <pre class="code-template">{{ currentQuestion.codeTemplate }}</pre>
            </div>
          </div>
        </div>

        <!-- 右侧代码编辑器区域 -->
        <div class="editor-section">
          <div class="lang-toolbar">
            <select v-model="selectedLang" @change="changeLanguage">
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
            <button @click="resetCode">重置代码</button>
            <button @click="formatCode">格式化</button>
            <div class="save-status">{{ saveStatus }}</div>
          </div>

          <!-- 代码编辑器组件 -->
          <codemirror
            v-model="code"
            :style="{ height: '400px' }"
            :extensions="extensions"
            :autofocus="true"
            @ready="handleEditorReady"
            @change="handleCodeChange"
          />

          <div class="submit-section">
            <button class="btn-test" @click="testCode" :disabled="isSubmitting">
              <span v-if="!isSubmitting">运行测试</span>
              <span v-else>测试中...</span>
            </button>
            <button class="btn-submit" @click="submitCode" :disabled="isSubmitting || !hasTestedCode">
              <span v-if="!isSubmitting">提交代码</span>
              <span v-else>提交中...</span>
            </button>
          </div>
          
          <!-- 测试结果显示 -->
          <div class="test-results" v-if="testResults">
            <h4>测试结果：</h4>
            <div class="result-item" v-for="(result, idx) in testResults" :key="idx">
              <span class="status" :class="result.passed ? 'passed' : 'failed'">
                {{ result.passed ? '✓' : '✗' }}
              </span>
              <span>测试用例 {{ idx + 1 }}: {{ result.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 评测结果弹窗 -->
    <div class="evaluation-modal" v-if="showEvaluationModal">
      <div class="modal-content">
        <h3>代码评测结果</h3>
        <div class="evaluation-details" v-if="currentEvaluation">
          <div class="score-section">
            <h4>总分：{{ currentEvaluation.totalScore }}/10</h4>
          </div>
          <div class="dimension-scores">
            <div class="dimension" v-for="(dim, key) in currentEvaluation.dimensions" :key="key">
              <span class="dim-name">{{ getDimensionName(key) }}：</span>
              <span class="dim-score">{{ dim.score }}/10</span>
              <p class="dim-feedback">{{ dim.feedback }}</p>
            </div>
          </div>
          <div class="strengths">
            <h5>优点：</h5>
            <ul>
              <li v-for="(strength, idx) in currentEvaluation.strengths" :key="idx">
                {{ strength }}
              </li>
            </ul>
          </div>
          <div class="improvements">
            <h5>改进建议：</h5>
            <ul>
              <li v-for="(improvement, idx) in currentEvaluation.improvements" :key="idx">
                {{ improvement }}
              </li>
            </ul>
          </div>
        </div>
        <button class="close-btn" @click="closeEvaluationModal">继续下一题</button>
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

// 配置大模型
const OpenAI = require('openai');
const openai = new OpenAI({
  apiKey: "sk-a34b0daa63ec4ad8b9f7d83ec09e6802",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  dangerouslyAllowBrowser: true
});

export default {
  components: {
    Codemirror
  },
  data() {
    return {
      // 摄像头相关
      showCamera: false,
      cameraStream: null,
      isCameraActive: false,
      
      // 题目相关
      codeQuestions: [],
      currentQuestionIndex: 0,
      totalQuestions: 2,
      currentQuestion: null,
      
      // 时间相关
      remainingTime: 3600, // 总时间60分钟
      questionRemainingTime: 1800, // 每题30分钟
      questionTimer: null,
      totalTimer: null,
      
      // 代码编辑器相关
      code: '',
      selectedLang: 'javascript',
      extensions: [javascript(), oneDark],
      editorView: null,
      saveStatus: '',
      autoSaveTimer: null,
      
      // 提交相关
      isSubmitting: false,
      hasTestedCode: false,
      testResults: null,
      
      // 图像采集相关
      isCapturingImages: false,
      capturedImages: [],
      imageCaptureInterval: null,
      imageAnalysisResults: [],
      
      // 代码评测相关
      codeEvaluations: [],
      currentEvaluation: null,
      showEvaluationModal: false,
      
      // 所有答题数据
      codingData: {
        questions: [],
        startTime: null,
        endTime: null,
        jobInfo: null,
        imageAnalysisResults: [],
        codeEvaluations: []
      }
    };
  },
  mounted() {
    this.initializeCodingInterview();
  },
  methods: {
    async initializeCodingInterview() {
      // 获取代码题数据
      const configData = sessionStorage.getItem('finalInterviewConfig');
      if (!configData) {
        alert('面试数据丢失，请重新开始');
        this.$router.push('/config_view');
        return;
      }
      
      const interviewConfig = JSON.parse(configData);
      
      // 正确获取编程题目
      // 优先从 allQuestions 中筛选出编程题
      if (interviewConfig.allQuestions) {
        this.codeQuestions = interviewConfig.allQuestions.filter(q => q.type === 'coding');
      }
      
      // 如果没有，尝试从原始分类中获取
      if (this.codeQuestions.length === 0 && interviewConfig.originalQuestions?.codingQuestions) {
        this.codeQuestions = interviewConfig.originalQuestions.codingQuestions.map(q => ({
          type: 'coding',
          question: q.question,
          tips: q.tips || q.answerTips || '',
          codeTemplate: q.codeTemplate || ''
        }));
      }
      
      // 如果还是没有，尝试直接使用 codeQuestions
      if (this.codeQuestions.length === 0 && interviewConfig.codeQuestions) {
        this.codeQuestions = interviewConfig.codeQuestions;
      }
      
      this.totalQuestions = this.codeQuestions.length;
      
      console.log('获取到的编程题目:', this.codeQuestions);
      
      if (this.totalQuestions === 0) {
        alert('没有编程题，返回配置页面');
        this.$router.push('/config_view');
        return;
      }
      
      this.codingData.jobInfo = interviewConfig.config?.jobInfo || interviewConfig.jobInfo;
      this.codingData.startTime = new Date().toISOString();
      
      // 初始化摄像头
      await this.initializeCamera();
      
      // 开始计时
      this.startTimers();
      
      // 加载第一题
      this.loadQuestion(0);
      
      // 开始图像采集
      this.startImageCapture();
    },
    
    async initializeCamera() {
      try {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });
        
        if (this.$refs.cameraVideo) {
          this.$refs.cameraVideo.srcObject = this.cameraStream;
          this.isCameraActive = true;
        }
      } catch (error) {
        console.error('无法启动摄像头:', error);
        alert('请允许使用摄像头以进行面试');
      }
    },
    
    startTimers() {
      // 总计时器
      this.totalTimer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--;
        } else {
          this.endInterview();
        }
      }, 1000);
      
      // 题目计时器
      this.questionTimer = setInterval(() => {
        if (this.questionRemainingTime > 0) {
          this.questionRemainingTime--;
        } else {
          this.submitCode(true); // 时间到自动提交
        }
      }, 1000);
    },
    
    loadQuestion(index) {
      if (index >= this.totalQuestions) {
        this.endInterview();
        return;
      }
      
      this.currentQuestionIndex = index;
      this.currentQuestion = this.codeQuestions[index];
      this.questionRemainingTime = 1800; // 重置题目时间
      this.hasTestedCode = false;
      this.testResults = null;
      
      console.log('加载题目:', this.currentQuestion);
      
      // 根据语言设置初始代码
      this.resetCode();
      
      // 开启自动保存
      this.startAutoSave();
    },
    
    startAutoSave() {
      // 清除之前的自动保存
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
      }
      
      // 每30秒自动保存一次
      this.autoSaveTimer = setInterval(() => {
        this.saveCode();
      }, 30000);
    },
    
    saveCode() {
      // 保存代码到sessionStorage
      const saveData = {
        questionIndex: this.currentQuestionIndex,
        code: this.code,
        language: this.selectedLang,
        timestamp: new Date().toISOString()
      };
      
      sessionStorage.setItem(`code_q${this.currentQuestionIndex}`, JSON.stringify(saveData));
      this.saveStatus = '已自动保存';
      
      setTimeout(() => {
        this.saveStatus = '';
      }, 2000);
    },
    
    // 图像采集相关方法
    startImageCapture() {
      if (!this.cameraStream || this.isCapturingImages) return;
      
      this.isCapturingImages = true;
      console.log('开始定期采集用户图像');
      
      // 立即捕获第一张
      this.captureImage();
      
      // 每分钟捕获一张图像
      this.imageCaptureInterval = setInterval(() => {
        this.captureImage();
      }, 60000); // 60秒
    },
    
    captureImage() {
      if (!this.$refs.cameraVideo) return;
      
      const video = this.$refs.cameraVideo;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageDataURL = canvas.toDataURL('image/jpeg', 0.8);
      
      this.capturedImages.push({
        image: imageDataURL,
        timestamp: new Date().toISOString(),
        questionIndex: this.currentQuestionIndex
      });
      
      console.log(`已捕获第 ${this.capturedImages.length} 张图像`);
      
      // 每采集5张图像进行一次分析
      if (this.capturedImages.length % 5 === 0) {
        this.analyzeRecentImages();
      }
    },
    
    async analyzeRecentImages() {
      try {
        // 获取最近5张图像
        const recentImages = this.capturedImages.slice(-5);
        const jobInfo = this.codingData.jobInfo;
        const currentQuestionTitle = this.currentQuestion?.question || '编程题';
        
        const analysisPrompt = `
你是一位经验丰富的技术面试官，正在观察应聘者编程过程中的状态。请基于以下5张图像（每分钟一张），分析应聘者的编程状态和专注度。

面试信息：
- 职位：${jobInfo?.position || '软件工程师'}
- 当前题目：${currentQuestionTitle}
- 题目类型：编程题

请特别关注：
1. 专注度：是否专心编程，有无分心行为
2. 编程姿态：坐姿是否良好，是否疲劳
3. 情绪状态：是否焦虑、困惑或自信
4. 整体状态：精神状态的变化趋势

请以JSON格式返回分析结果：
{
  "overallScore": 总分(1-10),
  "analysis": {
    "focus": {"score": 分数, "feedback": "专注度评价"},
    "posture": {"score": 分数, "feedback": "编程姿态评价"},
    "emotion": {"score": 分数, "feedback": "情绪状态评价"},
    "stamina": {"score": 分数, "feedback": "持久度评价"}
  },
  "observations": ["观察到的行为1", "观察到的行为2"],
  "suggestions": "给应聘者的建议"
}`;

        const imageContents = recentImages.map(item => ({
          type: "image_url",
          image_url: { url: item.image }
        }));
        
        const response = await openai.chat.completions.create({
          model: "qwen-vl-max-latest",
          messages: [{
            role: "user",
            content: [
              ...imageContents,
              {
                type: "text",
                text: analysisPrompt
              }
            ]
          }],
          temperature: 0.3,
          max_tokens: 1000
        });

        let content = response.choices[0].message.content;
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        
        const analysisResult = JSON.parse(content);
        
        this.imageAnalysisResults.push({
          timestamp: new Date().toISOString(),
          questionIndex: this.currentQuestionIndex,
          analysis: analysisResult,
          imageCount: recentImages.length
        });
        
        console.log('编程状态分析结果：', analysisResult);
        
      } catch (error) {
        console.error('图像分析失败:', error);
      }
    },
    
    // 代码编辑器相关方法
    toggleCameraView() {
      this.showCamera = !this.showCamera;
    },
    
    handleEditorReady(payload) {
      this.editorView = payload.view;
    },
    
    handleCodeChange() {
      // 代码变化时清除测试结果
      this.testResults = null;
      this.hasTestedCode = false;
    },
    
    resetCode() {
      // 如果题目提供了代码模板，使用题目的模板
      if (this.currentQuestion?.codeTemplate) {
        this.code = this.currentQuestion.codeTemplate;
        return;
      }
      
      // 否则使用默认模板
      const questionText = this.currentQuestion?.question || '解决方案';
      const templates = {
        javascript: `// ${questionText}
function solution(input) {
    // 在这里编写你的代码
    
}

// 测试代码
console.log(solution());`,
        python: `# ${questionText}
def solution(input):
    # 在这里编写你的代码
    pass

# 测试代码
if __name__ == "__main__":
    print(solution())`,
        java: `public class Solution {
    // ${questionText}
    public static Object solution(Object input) {
        // 在这里编写你的代码
        return null;
    }
    
    public static void main(String[] args) {
        System.out.println(solution(null));
    }
}`
      };
      
      this.code = templates[this.selectedLang] || templates.javascript;
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
      // 简单的代码格式化
      if (this.selectedLang === 'javascript') {
        this.code = this.code
          .replace(/;(?!\s*\n)/g, ';\n')
          .replace(/\{(?!\s*\n)/g, '{\n')
          .replace(/\}(?!\s*\n)/g, '}\n');
      }
      this.saveCode();
    },
    
    // 测试代码
    async testCode() {
      this.isSubmitting = true;
      this.testResults = [];
      
      try {
        // 模拟测试用例运行
        // 简单模拟3个测试用例
        for (let i = 0; i < 3; i++) {
          const passed = Math.random() > 0.3; // 模拟70%通过率
          
          this.testResults.push({
            passed: passed,
            message: passed ? '通过' : '输出不匹配',
            input: `测试输入${i + 1}`,
            expectedOutput: `期望输出${i + 1}`,
            actualOutput: passed ? `期望输出${i + 1}` : '错误输出'
          });
        }
        
        this.hasTestedCode = true;
        
      } catch (error) {
        console.error('测试失败:', error);
        alert('测试运行失败，请检查代码');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    // 提交代码并评测
    async submitCode(isAutoSubmit = false) {
      if (!isAutoSubmit && !this.hasTestedCode) {
        alert('请先运行测试');
        return;
      }
      
      this.isSubmitting = true;
      this.saveCode();
      
      try {
        // 调用AI进行代码评测
        const evaluation = await this.evaluateCode();
        
        // 保存评测结果
        this.codeEvaluations.push({
          questionIndex: this.currentQuestionIndex,
          question: this.currentQuestion,
          code: this.code,
          language: this.selectedLang,
          evaluation: evaluation,
          timestamp: new Date().toISOString()
        });
        
        // 保存当前题目数据
        this.codingData.questions.push({
          questionIndex: this.currentQuestionIndex,
          question: this.currentQuestion,
          code: this.code,
          language: this.selectedLang,
          testResults: this.testResults,
          evaluation: evaluation,
          submittedAt: new Date().toISOString()
        });
        
        // 显示评测结果
        this.currentEvaluation = evaluation;
        this.showEvaluationModal = true;
        
      } catch (error) {
        console.error('提交失败:', error);
        alert('代码提交失败，请重试');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    async evaluateCode() {
      const questionText = this.currentQuestion?.question || '编程题';
      const tips = this.currentQuestion?.tips || '无';
      
      const prompt = `
你是一位资深的技术面试官，请评测以下编程题的代码解答。

题目信息：
- 题目：${questionText}
- 解题提示：${tips}

提交的代码：
语言：${this.selectedLang}
\`\`\`${this.selectedLang}
${this.code}
\`\`\`

请从以下维度评价代码（每项1-10分）：
1. 代码正确性：是否正确解决了问题
2. 代码效率：时间复杂度和空间复杂度
3. 代码可读性：命名、注释、结构是否清晰
4. 代码风格：是否符合语言最佳实践
5. 错误处理：是否考虑了边界情况
6. 创新性：解决方案是否有创意

请以JSON格式返回评测结果：
{
  "totalScore": 总分(1-10),
  "dimensions": {
    "correctness": {"score": 分数, "feedback": "具体评价"},
    "efficiency": {"score": 分数, "feedback": "具体评价"},
    "readability": {"score": 分数, "feedback": "具体评价"},
    "style": {"score": 分数, "feedback": "具体评价"},
    "errorHandling": {"score": 分数, "feedback": "具体评价"},
    "creativity": {"score": 分数, "feedback": "具体评价"}
  },
  "strengths": ["优点1", "优点2", "优点3"],
  "improvements": ["改进建议1", "改进建议2", "改进建议3"],
  "summary": "总体评价"
}`;

      const response = await openai.chat.completions.create({
        model: "qwen-plus",
        messages: [
          {
            role: "system",
            content: "你是一位经验丰富的技术面试官，擅长评估编程能力。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      let content = response.choices[0].message.content;
      content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      
      return JSON.parse(content);
    },
    
    closeEvaluationModal() {
      this.showEvaluationModal = false;
      
      // 进入下一题
      if (this.currentQuestionIndex < this.totalQuestions - 1) {
        this.loadQuestion(this.currentQuestionIndex + 1);
      } else {
        this.endInterview();
      }
    },
    
    getDimensionName(key) {
      const names = {
        correctness: '代码正确性',
        efficiency: '代码效率',
        readability: '代码可读性',
        style: '代码风格',
        errorHandling: '错误处理',
        creativity: '创新性'
      };
      return names[key] || key;
    },
    
    formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      return `${min}:${sec.toString().padStart(2, '0')}`;
    },
    
    async endInterview() {
      // 清理定时器
      clearInterval(this.totalTimer);
      clearInterval(this.questionTimer);
      clearInterval(this.autoSaveTimer);
      clearInterval(this.imageCaptureInterval);
      
      // 如果当前题目未提交，自动提交
      if (this.code && !this.showEvaluationModal) {
        await this.submitCode(true);
      }
      
      // 最后一次图像分析
      if (this.capturedImages.length > 0) {
        await this.analyzeRecentImages();
      }
      
      // 准备数据
      this.codingData.endTime = new Date().toISOString();
      this.codingData.imageAnalysisResults = this.imageAnalysisResults;
      this.codingData.codeEvaluations = this.codeEvaluations;
      
      const codingResult = {
        ...this.codingData,
        summary: {
          totalQuestions: this.totalQuestions,
          completedQuestions: this.codingData.questions.length,
          totalDuration: Math.floor((3600 - this.remainingTime) / 60),
          imageAnalysisCount: this.imageAnalysisResults.length,
          averageScore: this.calculateAverageScore()
        }
      };
      
      console.log('编程面试结果汇总：', codingResult);
      
      // 合并之前的面试结果
      const previousResult = JSON.parse(sessionStorage.getItem('interviewResult') || '{}');
      const finalResult = {
        ...previousResult,
        codingInterview: codingResult
      };
      
      sessionStorage.setItem('interviewResult', JSON.stringify(finalResult));
      
      // 跳转到总结页面
      this.$router.push('/review');
    },
    
    calculateAverageScore() {
      if (this.codeEvaluations.length === 0) return 0;
      
      const totalScore = this.codeEvaluations.reduce((sum, evaluation) => {
        return sum + (evaluation.evaluation?.totalScore || 0);
      }, 0);
      
      return (totalScore / this.codeEvaluations.length).toFixed(1);
    }
  },
  beforeUnmount() {
    // 清理所有定时器
    clearInterval(this.totalTimer);
    clearInterval(this.questionTimer);
    clearInterval(this.autoSaveTimer);
    clearInterval(this.imageCaptureInterval);
    
    // 停止摄像头
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
    }
    
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

  .progress-info {
    display: flex;
    gap: 20px;
    align-items: center;
    
    span {
      font-size: 14px;
      color: #666;
    }
    
    .timer {
      font-weight: 500;
      color: #ff4d4f;
    }
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
  min-height: calc(100vh - 60px);
  background: #f0f2f5;

  .left-control {
    width: 60px;
    background: #2d3748;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 20px;

    .toggle-cam-btn {
      width: 50px;
      height: 70px;
      border-radius: 8px;
      background: #52aff1;
      color: white;
      border: none;
      cursor: pointer;
      transition: all 0.3s;
      font-size: 12px;
      writing-mode: vertical-lr;
      
      &:hover {
        transform: scale(1.05);
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
      margin-bottom: 2rem;

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
          
          .online-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22c55e;
            margin-right: 4px;
          }
          
          .capture-status {
            margin-left: 10px;
            color: #1890ff;
            animation: blink 1s infinite;
          }
        }

        .video-placeholder {
          width: 100%;
          height: 200px;
          background: #e5e7eb;
          border-radius: 8px;
        }
        
        .camera-container {
          width: 100%;
          height: 200px;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
          
          .camera-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
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
        max-height: calc(100vh - 200px);
        overflow-y: auto;

        h3 {
          font-size: 1.25rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }
        
        .time-info {
          color: #ff4d4f;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }
        
        .problem-desc {
          h4 {
            font-size: 1.1rem;
            color: #2d3748;
            margin-bottom: 1rem;
          }
          
          .description {
            color: #4b5563;
            line-height: 1.6;
            margin-bottom: 1.5rem;
            white-space: pre-wrap;
          }
          
          .tips-section, .code-template-section {
            margin-top: 1.5rem;
            
            h5 {
              font-size: 1rem;
              color: #2d3748;
              margin-bottom: 0.5rem;
            }
            
            .tips-content {
              background: #e6f4ff;
              padding: 1rem;
              border-radius: 6px;
              color: #1890ff;
              line-height: 1.6;
            }
            
            .code-template {
              background: #f8f9fa;
              padding: 1rem;
              border-radius: 6px;
              font-family: 'Courier New', monospace;
              font-size: 0.9rem;
              overflow-x: auto;
              white-space: pre;
            }
          }
        }
      }

      .editor-section {
        flex: 1.5;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        padding: 2rem;
        display: flex;
        flex-direction: column;

        .lang-toolbar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          align-items: center;

          select {
            padding: 0.5rem 1rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            outline: none;
            cursor: pointer;
            
            &:focus {
              border-color: #4299e1;
            }
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
          
          .save-status {
            margin-left: auto;
            color: #22c55e;
            font-size: 0.9rem;
          }
        }

        .submit-section {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
          
          .btn-test, .btn-submit {
            flex: 1;
            padding: 1rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: all 0.3s;
            
            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          }
          
          .btn-test {
            background: #e5e7eb;
            color: #4b5563;
            
            &:hover:not(:disabled) {
              background: #d1d5db;
            }
          }
          
          .btn-submit {
            background: #4299e1;
            color: white;
            
            &:hover:not(:disabled) {
              background: #3182ce;
              transform: translateY(-2px);
            }
          }
        }
        
        .test-results {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          
          h4 {
            font-size: 1rem;
            margin-bottom: 0.5rem;
            color: #2d3748;
          }
          
          .result-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0.5rem 0;
            
            .status {
              display: inline-block;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              text-align: center;
              line-height: 20px;
              font-size: 12px;
              color: white;
              
              &.passed {
                background: #22c55e;
              }
              
              &.failed {
                background: #ef4444;
              }
            }
          }
        }
      }
    }
  }
}

// 代码编辑器样式修正
.editor-section ::v-deep .cm-content {
  text-align: left !important;
  font-size: 14px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.editor-section ::v-deep .cm-editor {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

// 评测结果弹窗
.evaluation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  
  .modal-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    
    h3 {
      font-size: 1.5rem;
      color: #2d3748;
      margin-bottom: 1rem;
    }
    
    .evaluation-details {
      .score-section {
        text-align: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 1rem;
        
        h4 {
          font-size: 1.25rem;
          color: #4299e1;
          margin: 0;
        }
      }
      
      .dimension-scores {
        margin-bottom: 1.5rem;
        
        .dimension {
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #f8f9fa;
          border-radius: 6px;
          
          .dim-name {
            font-weight: 600;
            color: #2d3748;
          }
          
          .dim-score {
            color: #4299e1;
            font-weight: 500;
            margin-left: 0.5rem;
          }
          
          .dim-feedback {
            margin-top: 0.5rem;
            color: #4b5563;
            font-size: 0.9rem;
          }
        }
      }
      
      .strengths, .improvements {
        margin-bottom: 1rem;
        
        h5 {
          font-size: 1rem;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }
        
        ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          
          li {
            color: #4b5563;
            margin: 0.25rem 0;
          }
        }
      }
    }
    
    .close-btn {
      width: 100%;
      padding: 1rem;
      background: #4299e1;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      transition: all 0.3s;
      
      &:hover {
        background: #3182ce;
      }
    }
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 4px;
}
</style>