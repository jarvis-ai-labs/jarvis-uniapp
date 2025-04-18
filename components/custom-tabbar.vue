<!-- 自定义底部导航栏 -->
<template>
  <view class="custom-tabbar">
    <view class="custom-tabbar-item" @click="toMemory">
      <image src="/static/images/tab-memory.png" mode="widthFix" />
      <text>Memory</text>
    </view>

    <!-- <view class="record-btn" @click="toRecord">
      <view class="record-btn-box">
        <image src="/static/images/record-btn.png" mode="widthFix" />
      </view>
    </view> -->

    <view class="custom-tabbar-item" @click="toTasks">
      <image src="/static/images/tab-tasks.png" mode="widthFix" />
      <text>Tasks</text>
    </view>
  </view>
</template>

<script setup>
const toRecord = () => {
  uni.navigateTo({
    url: '/pages/home/index'
  });
};

const toMemory = () => {
  uni.navigateTo({
    url: '/pages/memory/index'
  });
};

const toTasks = () => {
  uni.navigateTo({
    url: '/pages/tasks/index'
  });
};
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
  }
}
</style>
