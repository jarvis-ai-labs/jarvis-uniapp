<!-- 自定义底部导航栏 -->
<template>
  <view class="custom-tabbar">
    <view class="custom-tabbar-item">
      <image src="/static/images/tab-memory.png" mode="widthFix"></image>
      <text>Memory</text>
    </view>
    <view class="record-btn">
      <image src="/static/images/record-btn.png" mode="widthFix"></image>
    </view>
    <view class="custom-tabbar-item">
      <image src="/static/images/tab-tasks.png" mode="widthFix"></image>
      <text>Tasks</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

</script>

<style lang="scss" scoped>
.custom-tabbar {
  width: 100%;
  height: 100px;
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
      width: 40px;
      height: 40px;
    }
    text {
      font-family: Avenir;
      font-weight: 300;
      font-size: 12px;
      color: #ffffff;
    }
  }

  .record-btn {
    width: 100px;
    height: 100px;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 50px;
    margin: auto;

    image {
      width: 100%;
      height: auto;
    }
  }
}
</style>
