<template>
  <canvas class="voice-wave" canvas-id="voiceWave" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';

const instance = getCurrentInstance();
const ctx = ref(null);
const animationFrame = ref(null);
const dpr = ref(1);
const centerX = 80;
const centerY = 80;

// 定义点阵的配置
const config = {
  startRadius: 30, // 开始半径（按钮边缘）
  endRadius: 80, // 结束半径
  circleCount: 12, // 减少圆圈数量，使变化更明显
  minDotsPerCircle: 15, // 减少最内圈点数
  maxDotsPerCircle: 80, // 减少最外圈点数
  maxDotSize: 2, // 增大最大点大小
  minDotSize: 0.8, // 增大最小点大小
  baseColor: 'rgba(151, 151, 151, 0)', // 基础颜色（透明）
  activeColor: 'rgba(151, 151, 151, 1)' // 激活颜色
};

// 生成静态点阵
const generateDots = () => {
  const dots = [];
  const radiusStep = (config.endRadius - config.startRadius) / (config.circleCount - 1);

  for (let i = 0; i < config.circleCount; i++) {
    const radius = config.startRadius + i * radiusStep;
    // 根据半径计算这一圈的点数，越往外点越多
    const dotsCount = Math.floor(
      config.minDotsPerCircle + (config.maxDotsPerCircle - config.minDotsPerCircle) * (i / (config.circleCount - 1))
    );
    // 计算点大小，越往外点越小
    const dotSize = config.maxDotSize - (config.maxDotSize - config.minDotSize) * (i / (config.circleCount - 1));

    for (let j = 0; j < dotsCount; j++) {
      const angle = (j / dotsCount) * Math.PI * 2;
      dots.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius: radius,
        size: dotSize,
        currentColor: config.baseColor, // 初始为透明
        targetColor: config.baseColor // 初始为透明
      });
    }
  }
  return dots;
};

const dots = ref(generateDots());

// 更新点的状态
const updateDots = () => {
  dots.value.forEach((dot) => {
    const targetMatch = dot.targetColor.match(/[\d.]+\)$/);
    const currentMatch = dot.currentColor.match(/[\d.]+\)$/);
    if (targetMatch && currentMatch) {
      const targetAlpha = parseFloat(targetMatch[0]);
      const currentAlpha = parseFloat(currentMatch[0]);
      // 加快过渡速度
      const alphaDiff = targetAlpha - currentAlpha;
      const newAlpha = currentAlpha + alphaDiff * 0.5; // 降低过渡速度，使动画更平滑
      dot.currentColor = `rgba(151, 151, 151, ${newAlpha})`;
      // 减慢回归速度
      const newTargetAlpha = Math.max(0, targetAlpha - 0.02); // 减慢消失速度
      dot.targetColor = `rgba(151, 151, 151, ${newTargetAlpha})`;
    }
  });
};

// 绘制单个菱形点
const drawDiamond = (x, y, size, color) => {
  if (!ctx.value) return;
  ctx.value.beginPath();
  ctx.value.moveTo(x, y - size); // 上点
  ctx.value.lineTo(x + size, y); // 右点
  ctx.value.lineTo(x, y + size); // 下点
  ctx.value.lineTo(x - size, y); // 左点
  ctx.value.closePath();
  ctx.value.setFillStyle(color);
  ctx.value.fill();
};

// 绘制所有点
const drawDots = () => {
  if (!ctx.value) return;
  // 清除画布
  ctx.value.clearRect(0, 0, 160, 160);
  // 绘制所有点
  dots.value.forEach((dot) => {
    drawDiamond(dot.x, dot.y, dot.size, dot.currentColor);
  });
  // 绘制到画布
  ctx.value.draw();
};

// 动画循环
const animate = () => {
  updateDots();
  drawDots();
  animationFrame.value = setTimeout(animate, 16); // 约60fps
};

// 输入音频数据
const input = (powerLevel) => {
  // 将powerLevel转换为0-1之间的值，并增加灵敏度
  const normalizedPower = Math.min(1, Math.max(0, powerLevel / 50)); // 降低分母，提高灵敏度

  // 根据声音强度更新点的目标颜色
  dots.value.forEach((dot) => {
    const distanceRatio = (dot.radius - config.startRadius) / (config.endRadius - config.startRadius);

    // 声音越大，影响范围越大
    if (distanceRatio < normalizedPower) {
      // 在影响范围内的点，设置较高的不透明度，并增加对比度
      const alpha = 1.2 * (1 - distanceRatio); // 增加对比度
      dot.targetColor = `rgba(151, 151, 151, ${alpha})`;
    } else {
      // 不在影响范围内的点，快速设置为透明
      dot.targetColor = config.baseColor;
    }
  });
};

// 清除声纹效果
const clear = () => {
  dots.value.forEach((dot) => {
    dot.currentColor = config.baseColor;
    dot.targetColor = config.baseColor;
  });
  if (ctx.value) {
    ctx.value.clearRect(0, 0, 160, 160);
  }
  if (animationFrame.value) {
    clearTimeout(animationFrame.value);
  }
};

const init = () => {
  // 获取canvas上下文
  ctx.value = uni.createCanvasContext('voiceWave', instance.ctx);
  // 设置canvas尺寸
  dpr.value = uni.getSystemInfoSync().pixelRatio;
  // 开始动画
  animate();
};

// 清理
onUnmounted(() => {
  if (animationFrame.value) {
    clearTimeout(animationFrame.value);
  }
});

defineExpose({
  init,
  input,
  clear
});
</script>

<style scoped>
.voice-wave {
  width: 160px;
  height: 160px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: transparent;
  z-index: 1;
}
</style>
