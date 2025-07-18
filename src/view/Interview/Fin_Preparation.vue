<template>
  <div class="job-info-container">
    <!-- 步骤条 -->
    <StepBar :steps="steps" :current-step="currentStep" />

    <!-- 标题 -->
    <div class="header">
      <h1 class="title">准备完成啦🎇</h1>
    </div>

    <!-- 底部按钮 -->
    <div class="buttons">
      <button class="btn-back" @click="prevStep">上一步</button>
      <button class="btn-next" @click="nextStep">下一步</button>
    </div>
  </div>
</template>


<script>
import StepBar from "@/components/StepBar.vue";

export default {
  components: {StepBar},
  data() {
    return {
      steps: [
        {label: '填写岗位信息'},
        {label: '选择简历'},
        {label: '面试押题'},
        {label: '准备完成'}
      ],
      currentStep: 3
    }
  },
  methods: {
    prevStep() {
      this.$router.push('/job_info');
    },
    nextStep() {
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
  position: relative; /* 让流星和进度条可绝对定位 */
}

.header {
  text-align: center;
  margin-bottom: 30px;
  .title {
    font-size: 28px;
    color: #2d3748;
    margin-bottom: 0;
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
    background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
    color: #666;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08); // 初始阴影

    &:hover {
      background: linear-gradient(145deg, #e0e0e0, #d0d0d0);
      color: #444;
    }
  }

  .btn-next {
    background: linear-gradient(145deg, #409eff, #3688e6); // 主题渐变，更有层次感
    color: white;
    border: none;
    box-shadow: 0 3px 6px rgba(64, 158, 255, 0.2); // 初始主题阴影

    &:hover {
      background: linear-gradient(145deg, #3688e6, #2c76d6); 
      box-shadow: 0 4px 10px rgba(64, 158, 255, 0.25); // 阴影增强
    }
  }
    }
</style>