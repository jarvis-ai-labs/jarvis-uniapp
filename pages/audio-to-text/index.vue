<template>
  <view class="container">
    <uni-nav-bar
      shadow
      fixed
      status-bar
      :border="false"
      height="50px"
      title="语音转文字"
      left-icon="back"
      @clickLeft="handleGoBack" />

    <view class="container-box">
      <button class="audio-to-text-btn">转文字</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const recordInfo = ref(null);

onLoad((options) => {
  if (!options?.id) {
    uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
    uni.navigateBack();
    return;
  }

  const recordList = uni.getStorageSync('recordList') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
    console.log('当前录音文件', recordInfo.value);
    if (recordInfo.value) {
    }
  }
});

const handleGoBack = () => {
  uni.switchTab({ url: '/pages/file/index' });
};
</script>

<style lang="scss" scoped></style>
