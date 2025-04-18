<!-- 自定义底部导航栏 -->
<template>
  <view class="custom-tabbar">
    <view class="custom-tabbar-item" @click="toMemory">
      <image src="/static/images/tab-memory.png" mode="widthFix" />
      <text>Memory</text>
    </view>

    <view class="record-btn" v-if="currentPage !== '/pages/home/index'" @click="toRecord">
      <view class="record-btn-box">
        <image src="/static/images/record-btn.png" mode="widthFix" />
      </view>
    </view>

    <view class="custom-tabbar-item" @click="toTasks">
      <image src="/static/images/tab-tasks.png" mode="widthFix" />
      <text>Tasks</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const currentPage = ref('');

const toMemory = () => {
  const pages = getCurrentPages();
  const currentPagePath = pages[pages.length - 1].route;
  if (currentPagePath === 'pages/memory/index') return;
  uni.navigateTo({
    url: '/pages/memory/index',
    animationType: 'slide-in-left',
    animationDuration: 200
  });
};

const toRecord = () => {
  const pages = getCurrentPages();
  const currentPagePath = pages[pages.length - 1].route;
  if (currentPagePath === 'pages/home/index') return;
  uni.navigateTo({
    url: '/pages/home/index',
    animationType: 'slide-in-bottom',
    animationDuration: 200
  });
};

const toTasks = () => {
  const pages = getCurrentPages();
  const currentPagePath = pages[pages.length - 1].route;
  if (currentPagePath === 'pages/tasks/index') return;
  uni.navigateTo({
    url: '/pages/tasks/index',
    animationType: 'slide-in-right',
    animationDuration: 200
  });
};

onMounted(() => {
  const pages = getCurrentPages();
  currentPage.value = pages[pages.length - 1].route;
});
</script>

<style lang="scss" scoped>
.custom-tabbar {
  width: 100%;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 50px;
  position: fixed;
  bottom: 0;

  .custom-tabbar-item {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    image {
      width: 30px;
      height: 30px;
    }
    text {
      font-family: Avenir;
      font-weight: 300;
      font-size: 12px;
      color: #ffffff;
      margin-top: 5px;
    }

    &.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }
}
</style>
