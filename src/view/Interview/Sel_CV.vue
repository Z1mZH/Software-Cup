<template>
  <div class="sel-cv-container">
    <!-- 步骤条 -->
    <StepBar :steps="steps" :current-step="currentStep" />

    <!-- 标题 -->
    <div class="header">
      <h1 class="title">想用哪份简历？</h1>
    </div>

    <!-- 简历上传区域 -->
    <div class="upload-area">
      <!-- 核心修复：添加拖拽状态类和事件绑定 -->
      <div
        class="upload-box"
        @click="openFileDialog"
        @dragover.prevent="onDragOver"
        @dragenter.prevent="onDragEnter"
        @dragleave="onDragLeave"
        @drop="handleDragUpload"
        :class="{ dragging: isDragging }"
      >
        <img
          src="@/assets/upload_CV1(1).png"
          alt="上传"
          class="upload-img"
          style="width: 70px; height: 70px;"
        />
        <p class="upload-tip">拖拽简历到此处上传</p>
        <p class="upload-tip secondary">或点击选择文件上传</p>
        <!-- 核心修复：添加@change事件 -->
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.doc,.docx"
          class="file-input"
          @change="handleFileUpload"
        />
      </div>

      <!-- 简历文本粘贴区域 -->
      <div class="paste-area">
        <textarea
          v-model="resumeText"
          placeholder="你还可以直接粘贴你的简历文本到这里"
          class="textarea"
          @input="handleTextChange"
        />
        <!-- 字数统计显示 -->
        <div class="word-count">
          {{ currentLength }}/3000
        </div>
      </div>
    </div>

    <!-- 加载状态提示 -->
    <div v-if="isProcessing" class="processing-tip">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在处理简历...</span>
    </div>

    <!-- 底部按钮 -->
    <div class="buttons">
      <button class="btn-back" @click="prevStep">上一步</button>
      <button class="btn-next" @click="nextStep" :disabled="isProcessing">下一步</button>
    </div>

    <!-- 简历要求提示 -->
    <div class="resume-requirements">
      简历要求 word/pdf 形式，小于 10M，字数小于 3k
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import StepBar from "@/components/StepBar.vue";
import OpenAI from "openai";
import mammoth from 'mammoth';
// 修改 pdfjs 导入方式
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// 配置大模型
const openai = new OpenAI({
  apiKey: "sk-a34b0daa63ec4ad8b9f7d83ec09e6802",
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  dangerouslyAllowBrowser: true // 注意：生产环境应该通过后端调用
});

export default {
  components: { StepBar, Loading },
  data() {
    return {
      steps: [
        { label: '填写岗位信息' },
        { label: '选择简历' },
        { label: '面试押题' },
        { label: '准备完成' }
      ],
      currentStep: 1,
      resumeFile: null,
      resumeText: '',
      currentLength: 0,
      isValid: false,
      isDragging: false,
      isProcessing: false, // 处理状态
      resumeSummary: '', // 简历总结
      jobData: null // 上一步传递的数据
    };
  },
  created() {
    // 获取上一步传递的数据
    const storedData = sessionStorage.getItem('jobData');
    if (storedData) {
      this.jobData = JSON.parse(storedData);
      console.log('接收到的岗位数据:', this.jobData);
    }
  },
  mounted() {
    this.currentLength = this.resumeText.length;
  },
  methods: {
    // 打开文件选择框
    openFileDialog() {
      this.$refs.fileInput.click();
    },

    // 拖拽悬停
    onDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      this.isDragging = true;
    },

    // 拖拽进入
    onDragEnter(e) {
      e.preventDefault();
      this.isDragging = true;
    },

    // 拖拽离开
    onDragLeave() {
      this.isDragging = false;
    },

    // 处理拖拽上传
    handleDragUpload(e) {
      e.preventDefault();
      this.isDragging = false;
      const file = e.dataTransfer.files[0];
      if (file) {
        this.handleFileUpload({target: {files: [file]}});
      }
    },

    // 处理文件上传
    async handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;

      // 验证文件格式
      const validExt = ['.pdf', '.doc', '.docx'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      const maxSize = 10 * 1024 * 1024;

      if (validExt.includes(fileExt) && file.size <= maxSize) {
        this.resumeFile = file;
        this.isValid = true;
        ElMessage.success(`已选择文件：${file.name}`);
        
        // 解析文件内容
        await this.parseFileContent(file);
      } else {
        this.resumeFile = null;
        this.isValid = false;
        ElMessage.error('文件格式（仅支持pdf/doc/docx）或大小（不超过10MB）不符合要求');
      }

      this.$refs.fileInput.value = '';
    },

    // 解析文件内容
    async parseFileContent(file) {
      this.isProcessing = true;
      try {
        let text = '';
        const fileExt = file.name.split('.').pop().toLowerCase();

        if (fileExt === 'pdf') {
          text = await this.parsePDF(file);
        } else if (fileExt === 'doc' || fileExt === 'docx') {
          text = await this.parseWord(file);
        }

        // 设置解析的文本
        this.resumeText = text.substring(0, 3000); // 限制3000字
        this.currentLength = this.resumeText.length;
        
        // 调用大模型总结简历
        await this.summarizeResume(this.resumeText);
      } catch (error) {
        console.error('解析文件失败:', error);
        ElMessage.error('文件解析失败，请尝试手动粘贴简历内容');
      } finally {
        this.isProcessing = false;
      }
    },

    // 解析PDF文件
    async parsePDF(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const typedarray = new Uint8Array(e.target.result);
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              fullText += pageText + '\n';
            }
            
            resolve(fullText);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },

    // 解析Word文件
    async parseWord(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const result = await mammoth.extractRawText({ arrayBuffer });
            resolve(result.value);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsArrayBuffer(file);
      });
    },

    // 调用大模型总结简历
    async summarizeResume(resumeContent) {
      if (!resumeContent || resumeContent.trim().length === 0) {
        return;
      }

      this.isProcessing = true;
      try {
        const completion = await openai.chat.completions.create({
          model: "qwen-plus",
          messages: [
            { 
              role: "system", 
              content: "你是一个专业的简历分析助手。请简洁地总结用户的简历，包括教育背景、工作经验、技能特长等关键信息。总结应该在200字以内。" 
            },
            { 
              role: "user", 
              content: `请总结以下简历内容：\n\n${resumeContent}` 
            }
          ],
        });

        this.resumeSummary = completion.choices[0].message.content;
        console.log('简历总结:', this.resumeSummary);
      } catch (error) {
        console.error('调用大模型失败:', error);
        ElMessage.warning('简历总结生成失败，但不影响后续流程');
        this.resumeSummary = '简历总结生成失败';
      } finally {
        this.isProcessing = false;
      }
    },

    // 实时计算文本长度
    handleTextChange() {
      if (this.resumeText.length > 3000) {
        this.resumeText = this.resumeText.slice(0, 3000);
      }
      this.currentLength = this.resumeText.length;
    },

    // 生成完整的prompt
    generateCompletePrompt() {
      const basePrompt = this.jobData?.prompt || '';
      const resumePart = this.resumeSummary 
        ? `用户的简历总结如下：${this.resumeSummary}` 
        : '用户未上传简历或简历总结失败。';
      
      // 构建面试押题的详细prompt
      const interviewPrompt = `
${basePrompt}

${resumePart}

现在请你作为一位资深的技术面试官，基于以上信息生成面试押题。请严格按照以下要求生成15道面试题目：

【输出格式要求】
请使用以下JSON格式输出，确保可以被正确解析：
{
  "companyQuestions": [
    {
      "id": 1,
      "category": "公司发展",
      "question": "题目内容",
      "hint": "答题思路提示"
    }
  ],
  "technicalQuestions": [
    {
      "id": 4,
      "category": "专业知识",
      "question": "题目内容",
      "keyPoints": ["要点1", "要点2", "要点3"]
    }
  ],
  "codingQuestions": [
    {
      "id": 14,
      "category": "编程题",
      "question": "题目描述",
      "difficulty": "中等/困难",
      "language": "推荐语言",
      "example": "输入输出示例",
      "solution": "参考解答思路"
    }
  ]
}

【具体要求】
1. 公司发展相关问题（3道）：
   - 结合用户申请的公司背景、企业文化、业务方向
   - 包括对公司的了解、为什么选择该公司、个人发展规划等
   - 每道题附带答题思路提示

2. 专业知识问题（10道）：
   - 必须与用户申请的岗位高度相关
   - 结合用户简历中的技术栈和项目经验
   - 涵盖基础知识、进阶概念、实际应用场景
   - 难度循序渐进，从基础到深入
   - 每道题列出3-5个关键答题要点

3. 编程题（2道）：
   - 基于用户简历中展示的编程语言和技术领域
   - 一道中等难度，一道偏难
   - 贴合实际工作场景，避免纯算法题
   - 提供题目描述、输入输出示例、解题思路

【注意事项】
- 所有问题都要具有针对性，避免泛泛而谈
- 考虑行业特点和技术发展趋势
- 问题要有区分度，能够考察不同层次的能力
- 编程题要实用，最好与实际业务场景相关`;

      return interviewPrompt;
    },

    prevStep() {
      this.$router.push('/job_info');
    },

    async nextStep() {
      // 如果有粘贴的文本但还没有总结，先进行总结
      if (this.resumeText && !this.resumeSummary && !this.resumeFile) {
        await this.summarizeResume(this.resumeText);
      }

      // 生成完整的prompt
      const completePrompt = this.generateCompletePrompt();
      
      // 准备传递的数据
      const resumeData = {
        ...this.jobData,
        resumeText: this.resumeText,
        resumeSummary: this.resumeSummary,
        completePrompt: completePrompt,
        hasResumeFile: !!this.resumeFile,
        resumeFileName: this.resumeFile?.name,
        // 添加更多结构化信息供后续使用
        interviewConfig: {
          companyQuestionCount: 3,
          technicalQuestionCount: 10,
          codingQuestionCount: 2,
          totalQuestions: 15
        }
      };

      // 存储数据
      sessionStorage.setItem('resumeData', JSON.stringify(resumeData));
      
      console.log('完整的prompt:', completePrompt);
      console.log('传递的数据:', resumeData);
      
      this.$router.push('/guess_ques');
    }
  }
};
</script>

<style scoped lang="scss">
.sel-cv-container {
  min-height: 100vh;
  background: #ebf4fa;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .header {
        text-align: center;
        margin-bottom: 30px;

        .title {
            font-size: 28px;
            color: #2d3748;
            margin-bottom: 0;
        }
  }

  .upload-area {
    width: 100%;
    max-width: 700px;

    .upload-box {
      border: 2px dashed #e0e0e0;
      border-radius: 10px;
      padding: 35px;
      text-align: center;
      cursor: pointer;
      margin-bottom: 20px;
      @media (max-width: 768px) {
        padding: 25px;
        &.dragging {
    border-color: #409eff;
    background: #f0f7ff;
  }
      }

      .el-icon-plus {
        font-size: 40px;
        color: #409eff;
        margin-bottom: 12px;
        @media (max-width: 768px) {
          font-size: 30px;
        }
      }

      .upload-tip {
        font-size: 16px;
        color: #666;
        @media (max-width: 768px) {
          font-size: 14px;
        }
      }

      .secondary {
        color: #999;
        font-size: 14px;
        margin-top: 8px;
        @media (max-width: 768px) {
          font-size: 12px;
        }
      }

      .file-input {
        display: none;
      }
    }

    .paste-area {
      position: relative;
      
      .textarea {
        width: 100% !important;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        min-height: 180px;
        resize: vertical;
        font-size: 14px;
        color: #666;
        @media (max-width: 768px) {
          min-height: 120px;
          font-size: 12px;
        }
      }
      
      .word-count {
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 12px;
        color: #999;
        pointer-events: none;
        @media (max-width: 768px) {
          font-size: 10px;
          bottom: 8px;
          right: 10px;
        }
      }
    }
  }

  .processing-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    color: #409eff;
    font-size: 14px;
    
    .is-loading {
      animation: rotating 2s linear infinite;
    }
  }

  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
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
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
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

      &:hover {
        background: linear-gradient(145deg, #3688e6, #2c76d6);
        box-shadow: 0 4px 10px rgba(64, 158, 255, 0.25);
      }
    }
  }

  .resume-requirements {
    margin-top: 15px;
    font-size: 13px;
    color: #999;
    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
}
</style>