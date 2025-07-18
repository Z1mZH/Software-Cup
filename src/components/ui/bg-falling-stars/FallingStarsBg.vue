<template>
  <canvas ref="canvasRef" class="stars-canvas"></canvas>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

// 接收 props：流星颜色、数量
const props = defineProps({
  color: {
    type: String,
    default: "#423838" // 默认白色流星
  },
  count: {
    type: Number,
    default: 100 // 默认流星数量
  }
});

// 初始化变量
const canvasRef = ref(null);
let canvas = null;
let ctx = null;
let stars = []; // 存储流星数据
let animationId = null;

// 生成随机流星数据
const initStars = () => {
  stars = [];
  for (let i = 0; i < props.count; i++) {
    stars.push({
       x: Math.random() * canvas.width, // 随机x坐标
       y: canvas.height, // 初始y坐标为底部
       radius: Math.random() * 1.5 + 2, // 流星大小（0.5-2px）
       speed: Math.random() * 3 + 1, // 流星速度（1-4px/帧）
       opacity: Math.random() * 0.8 + 0.2, // 透明度（0.2-1）
       dx: Math.random() * 10 - 5 // x方向速度，向屏幕中心移动
    });
  }
};

// 绘制单颗流星
const drawStar = (star) => {
  ctx.save();
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fillStyle = `${props.color}${Math.floor(star.opacity * 255).toString(16).padStart(2, "0")}`; // 带透明度的颜色
  ctx.fill();
  ctx.restore();
};

// 更新流星位置（实现上移动画）
const updateStars = () => {
  stars.forEach(star => {
    // 流星向上移动（y减少），超出屏幕后重置到底部
    star.y -= star.speed;
    star.x += star.dx;
    if (star.y < 0) {
      star.y = canvas.height; // 从底部重新开始
      star.x = Math.random() * canvas.width; // 随机x坐标
    }
  });
};

// 动画循环
const animate = () => {
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 更新流星位置
  updateStars();
  // 绘制所有流星
  stars.forEach(star => drawStar(star));
  // 继续下一帧动画
  animationId = requestAnimationFrame(animate);
};

// 初始化画布和动画
onMounted(() => {
  canvas = canvasRef.value;
  if (!canvas) return;

  // 获取父容器尺寸，让canvas铺满容器
  const parent = canvas.parentElement;
  canvas.width = parent.clientWidth;
  canvas.height = parent.clientHeight;

  // 获取绘图上下文
  ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 初始化流星数据
  initStars();
  // 启动动画
  animate();
});

// 监听窗口大小变化，更新canvas尺寸
watch(
  () => [window.innerWidth, window.innerHeight],
  () => {
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  },
  { immediate: false, deep: true }
);

// 组件销毁时停止动画，避免内存泄漏
onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
});
</script>

<style scoped>
.stars-canvas {
  display: block;
  /* 确保canvas继承父元素的尺寸（铺满容器） */
  width: 100%;
  height: 100%;
  /* 避免鼠标交互影响底层元素 */
  pointer-events: none;
}
</style>