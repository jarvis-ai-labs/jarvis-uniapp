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
      <view class="audio-to-text-box">
        <view class="record-info">
          <view class="file-name">{{ recordInfo.fileName }}</view>
          <view class="record-time">
            <view class="time">{{ recordInfo.duration }}</view>
            <view class="time2">{{ recordInfo.startTime }}</view>
          </view>
        </view>
        <view class="audio-to-text-content">
          <image mode="widthFix" src="/static/logo2.png" v-if="audioToTextStatus == 0" />
          <view class="audio-to-text-content-box" v-if="audioToTextStatus > 0">
            <image mode="widthFix" src="/static/logo2-active.png" />
            <text v-if="audioToTextStatus == 1">正在转文字，请稍后...</text>
            <text v-if="audioToTextStatus == 2">转文字成功</text>
          </view>
        </view>
        <button class="audio-to-text-btn" v-if="audioToTextStatus == 0" @click="handleAudioToText">开始转文字</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const recordInfo = ref(null);
const audioToTextStatus = ref(0);
onLoad((options) => {
  // if (!options?.id) {
  //   uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
  //   uni.navigateBack();
  //   return;
  // }

  const recordList = uni.getStorageSync('recordList') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
    console.log('当前录音文件', recordInfo.value);
    if (recordInfo.value) {
    }
  }
});

const handleGoBack = () => {
  uni.navigateBack();
};

const handleAudioToText = () => {
  console.log('开始转文字');

  // uni.request({
  //   url: '上传接口地址',
  //   method: 'POST',
  //   header: { 'content-type': 'application/x-www-form-urlencoded' },
  //   data: {
  //     audio: uni.arrayBufferToBase64(arrayBuffer)
  //   },
  //   success: (res) => {},
  //   fail: (err) => {}
  // });
};
</script>

<style lang="scss" scoped>
.audio-to-text-box {
  width: 100%;
  height: calc(100vh - 125px);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 0 8px 2px rgba(140, 145, 151, 0.15);
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.audio-to-text-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  image {
    width: 100px;
  }
  .audio-to-text-content-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    text {
      font-family: Avenir;
      font-weight: 300;
      font-size: 16px;
      color: #616161;
      margin-top: 10px;
    }
  }
}

.audio-to-text-btn {
  width: 120px;
  height: 40px;
  border-radius: 20px;
  background: #dae7f2;
  font-family: Avenir;
  font-weight: 300;
  font-size: 16px;
  color: #004685;
  margin-bottom: 50px;
}
</style>
