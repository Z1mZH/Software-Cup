<template>
  <div class="job-info-container">
    <!-- 步骤条 -->
    <StepBar :steps="steps" :current-step="currentStep" />

    <!-- 标题 -->
    <div class="header">
      <h1 class="title">面试押题中，请稍等~</h1>
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
    </div>
  </div>
</template>

<script>
import StepBar from "@/components/StepBar.vue";
import StarsBG from "@/components/ui/bg-falling-stars/FallingStarsBg.vue";

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
      timer: null
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
  mounted() {
    this.timer = setInterval(() => {
      if (this.progress < 100) {
        this.progress += 1;
      } else {
        clearInterval(this.timer);
        this.$router.push('/fin_prep'); // 跳转到下一页面
      }
    }, 100); // 每 100 毫秒增加 1% 进度
  },
  watch: {
    progress(newValue) {
      if (newValue >= 100) {
        clearInterval(this.timer); // 停止模拟
        // 跳转逻辑（示例：Vue Router）
        this.$router.push('/fin_prep');
      }
    }
  },
  beforeUnmount() {
    clearInterval(this.timer); // 清理定时器
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

/* 流星背景：铺满整屏、最底层 */
.stars-bg {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%); /* 居中对齐 */

  /* 尺寸与圆形进度条一致（50vw，最大400px） */
  width: 50vw;
  height: 50vw;
  max-width: 400px;
  max-height: 400px;
  clip-path: circle(45%); /* 以中心为圆心，半径为宽度的50%（正好覆盖圆形区域） */
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
}

.progress-circle {
  width: 100%;
  height: 100%;
}

.progress-arc {
  transition: stroke-dashoffset 0.3s ease;
}

@media (max-width: 768px) {
  .progress-box {
    width: 80vw;
  }
}
</style>