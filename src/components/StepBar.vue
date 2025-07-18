<template>
  <div class="step-bar">
    <div
      v-for="(step, index) in steps"
      :key="index"
      :class="['step-item', { active: currentStep === index }]"
    >
      <span class="step-label">{{ step.label }}</span>
      <span class="step-separator" v-if="index < steps.length - 1"></span>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    steps: {
      type: Array,
      required: true,
      // 每个步骤对象至少包含 label
      validator: (value) => value.every(step => 'label' in step)
    },
    currentStep: {
      type: Number,
      required: true,
      validator: (value) => value >= 0
    }
  }
};
</script>

<style scoped lang="scss">
// 顶部步骤条样式
    .step-bar {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 0px;
        max-width: 1200px;

        .step-item {
            display: flex;
            align-items: center;
            font-size: 16px;
            color: #999;
            position: relative;

            .step-label {
                padding: 6px 12px;
                border-radius: 12px;
                transition: all 0.3s;
            }

            &.active {
                color: #409eff;

                .step-label {
                    background: #d9ecff;
                }
            }

            .step-separator {
                width: 30px;
                height: 2px;
                background: #e0e0e0;
                margin-left: 10px;
                flex-shrink: 0;
            }
        }
    }

</style>