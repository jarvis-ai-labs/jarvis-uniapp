<template>
  <canvas ref="canvas" class="voice-wave" type="2d" canvas-id="voiceWave" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const canvas = ref(null);
const ctx = ref(null);
const animationFrame = ref(null);
const dpr = ref(1);
const centerX = 80;
const centerY = 80;

// 定义点阵的配置
const config = {
  startRadius: 30, // 开始半径（按钮边缘）
  endRadius: 80, // 结束半径
  circleCount: 15, // 圆圈数量
  minDotsPerCircle: 20, // 最内圈点数
  maxDotsPerCircle: 120, // 最外圈点数
  maxDotSize: 1.5, // 最大点大小
  minDotSize: 0.5 // 最小点大小
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
        baseAlpha: 0, // 静态时的透明度
        currentAlpha: 0, // 当前透明度
        targetAlpha: 1, // 目标透明度
        baseColor: 'rgba(151, 151, 151, 1)', // 静态时的颜色
        currentColor: 'rgba(151, 151, 151, 1)', // 当前颜色
        targetColor: 'rgba(151, 151, 151, 1)' // 目标颜色
      });
    }
  }
  return dots;
};

const dots = ref(generateDots());

// 绘制单个菱形点
const drawDiamond = (x, y, size, color) => {
  if (!ctx.value) return;

  ctx.value.beginPath();
  ctx.value.moveTo(x, y - size);
  ctx.value.lineTo(x + size, y);
  ctx.value.lineTo(x, y + size);
  ctx.value.lineTo(x - size, y);
  ctx.value.closePath();

  ctx.value.setFillStyle(color);
  ctx.value.fill();
};

// 更新点的状态
const updateDots = () => {
  dots.value.forEach((dot) => {
    // 从目标颜色中提取alpha值
    const targetMatch = dot.targetColor.match(/[\d.]+\)$/);
    const currentMatch = dot.currentColor.match(/[\d.]+\)$/);
    if (targetMatch && currentMatch) {
      const targetAlpha = parseFloat(targetMatch[0]);
      const currentAlpha = parseFloat(currentMatch[0]);

      // 平滑过渡到目标颜色
      const alphaDiff = targetAlpha - currentAlpha;
      const newAlpha = currentAlpha + alphaDiff * 0.1;
      dot.currentColor = `rgba(151, 151, 151, ${newAlpha})`;

      // 逐渐回归到初始颜色
      const newTargetAlpha = Math.max(0, targetAlpha - 0.02);
      dot.targetColor = `rgba(151, 151, 151, ${newTargetAlpha})`;
    }
  });
};

// 绘制所有点
const drawDots = () => {
  if (!ctx.value) return;

  // 清除画布
  ctx.value.clearRect(0, 0, 160 * dpr.value, 160 * dpr.value);

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
  if (!ctx.value) return;

  // 将powerLevel转换为0-1之间的值
  const normalizedPower = Math.min(1, Math.max(0, powerLevel / 100));

  if (normalizedPower > 0.1) {
    // 根据声音强度更新点的目标颜色
    dots.value.forEach((dot) => {
      // 计算点到中心的距离比例
      const distanceRatio = (dot.radius - config.startRadius) / (config.endRadius - config.startRadius);

      // 声音越大，影响范围越大
      if (distanceRatio < normalizedPower) {
        // 在影响范围内的点，设置较高的不透明度
        const alpha = 0.8 * (1 - distanceRatio);
        dot.targetColor = `rgba(151, 151, 151, ${alpha})`;
      }
    });
  }
};

// 初始化
onMounted(() => {
  // 使用uni.createCanvasContext获取canvas上下文
  const canvasContext = uni.createCanvasContext('voiceWave', this);

  // 设置canvas尺寸
  dpr.value = uni.getSystemInfoSync().pixelRatio;
  const width = 160 * dpr.value;
  const height = 160 * dpr.value;

  // 保存上下文
  ctx.value = canvasContext;

  // 开始动画
  animate();
});

// 清理
onUnmounted(() => {
  if (animationFrame.value) {
    clearTimeout(animationFrame.value);
  }
});

defineExpose({
  input
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
