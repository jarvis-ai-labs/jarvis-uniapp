<!-- 自定义底部导航栏 -->
<template>
  <view class="custom-tabbar">
    <view class="custom-tabbar-item">
      <image src="/static/images/tab-memory.png" mode="widthFix" />
      <text>Memory</text>
    </view>
    <record-btn />
    <view class="custom-tabbar-item">
      <image src="/static/images/tab-tasks.png" mode="widthFix" />
      <text>Tasks</text>
    </view>
  </view>
</template>

<script setup>
import RecordBtn from './record-component/record-btn.vue';
</script>

<style lang="scss" scoped>
.custom-tabbar {
  width: 100%;
  height: 80px;
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

  .record-btn {
    width: 65px;
    height: 65px;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 50px;
    margin: auto;
    border-radius: 50%;
    image {
      width: 100%;
      height: auto;
    }
  }
}
</style>
