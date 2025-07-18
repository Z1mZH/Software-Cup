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

    <!-- 底部按钮 -->
    <div class="buttons">
      <button class="btn-back" @click="prevStep">上一步</button>
      <button class="btn-next" @click="nextStep">下一步</button>
    </div>

    <!-- 简历要求提示 -->
    <div class="resume-requirements">
      简历要求 word/pdf 形式，小于 10M，字数小于 3k
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import StepBar from "@/components/StepBar.vue";

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
      currentStep: 1,
      resumeFile: null,
      resumeText: '',
      currentLength: 0,
      isValid: false,
      isDragging: false  // 新增：拖拽状态标记
    };
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
      this.isDragging = true;  // 标记拖拽中
    },

    // 拖拽进入
    onDragEnter(e) {
      e.preventDefault();
      this.isDragging = true;
    },

    // 拖拽离开
    onDragLeave() {
      this.isDragging = false;  // 离开时取消标记
    },

    // 处理拖拽上传
    handleDragUpload(e) {
      e.preventDefault();
      this.isDragging = false;  // 结束拖拽
      const file = e.dataTransfer.files[0];
      if (file) {
        this.handleFileUpload({target: {files: [file]}});  // 复用验证逻辑
      }
    },

    // 处理文件上传（点击/拖拽共用）
    handleFileUpload(e) {
      const file = e.target.files[0];
      if (!file) return;  // 无文件则退出

      // 验证文件格式
      const validExt = ['.pdf', '.doc', '.docx'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();  // 修复：正确获取扩展名（兼容带多个点的文件名）
      // 验证文件大小（10MB）
      const maxSize = 10 * 1024 * 1024;

      if (validExt.includes(fileExt) && file.size <= maxSize) {
        this.resumeFile = file;
        this.isValid = true;
        ElMessage.success(`已选择文件：${file.name}`);  // 新增：成功提示
      } else {
        this.resumeFile = null;
        this.isValid = false;
        ElMessage.error('文件格式（仅支持pdf/doc/docx）或大小（不超过10MB）不符合要求');
      }

      // 重置input值（否则重复选择同一文件不会触发change事件）
      this.$refs.fileInput.value = '';
    },

    // 实时计算文本长度
    handleTextChange() {
      // 限制最大字数为3000（超过则截断）
      if (this.resumeText.length > 3000) {
        this.resumeText = this.resumeText.slice(0, 3000);
      }
      // 更新当前字数
      this.currentLength = this.resumeText.length;
    },
    // 初始化时计算已有文本的长度
    mounted() {
      this.currentLength = this.resumeText.length;
    },
    prevStep() {
      this.$router.push('/job_info');
    },
    nextStep() {
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
    border-color: #409eff;  // 拖拽时边框高亮
    background: #f0f7ff;   // 拖拽时背景色变化
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
    position: absolute;  // 绝对定位在文本框右下角
    bottom: 10%;
    right: 25%;
    font-size: 12px;
    color: #999;  // 灰色文字，不抢眼
    pointer-events: none;  // 避免点击干扰输入
    @media (max-width: 768px) {
      font-size: 10px;
      bottom: 8px;
      right: 10px;
    }
  }
    }
  }

  .buttons {
  display: flex;
  gap: 80px;
  margin-top: 30px;
  justify-content: flex-end; // 靠右对齐，符合表单操作习惯

  .btn-back,
  .btn-next {
    padding: 14px 28px;
    border-radius: 12px; // 更大的圆角，更柔和
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    font-size: 16px;
    font-weight: 600; // 文字更粗，增强可读性
    letter-spacing: 0.5px; // 字母间距，提升美感

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12); // 更细腻的阴影
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1); // 点击后阴影恢复
    }
  }

  .btn-back {
    background: linear-gradient(145deg, #f0f0f0, #e0e0e0); // 渐变背景，增加质感
    color: #666;
    border: none; // 去掉边框，更简洁
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08); // 初始阴影

    &:hover {
      background: linear-gradient(145deg, #e0e0e0, #d0d0d0); // hover时渐变加深
      color: #444;
    }
  }

  .btn-next {
    background: linear-gradient(145deg, #409eff, #3688e6); // 主题渐变，更有层次感
    color: white;
    border: none;
    box-shadow: 0 3px 6px rgba(64, 158, 255, 0.2); // 初始主题阴影

    &:hover {
      background: linear-gradient(145deg, #3688e6, #2c76d6); // hover时渐变加深
      box-shadow: 0 4px 10px rgba(64, 158, 255, 0.25); // 阴影增强
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