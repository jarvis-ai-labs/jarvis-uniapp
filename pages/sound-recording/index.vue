<template>
  <view class="container">
    <view class="container-box">
      <uni-nav-bar :fixed="true" :border="false" height="50px" background-color="#FFFFFF" status-bar title="正在录音" />

      <view class="record-file">
        <view class="record-file-name">
          <text>{{ fileName }}</text>
        </view>
        <view class="record-file-time">
          <text>{{ startTime }}</text>
        </view>
      </view>

      <view class="record-progress">
        <view class="record-progress-box"> </view>
        <view class="record-time">
          <text>{{ formatTime(currentTime) }}</text>
        </view>
      </view>

      <view class="record-control">
        <button class="start-pause-btn" @click="handleStartPause">
          <uni-icons
            custom-prefix="iconfont"
            :type="isRecording ? 'icon-pause' : 'icon-mic'"
            size="30"
            color="#ffffff" />
        </button>
        <button class="stop-btn" @click="handleStop">
          <uni-icons custom-prefix="iconfont" type="icon-stop" size="30" color="#ffffff" />
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const fileName = ref('录音文件_' + new Date().toLocaleString());
const startTime = ref(new Date().toLocaleTimeString());
const isRecording = ref(false);
const currentTime = ref(500);

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};

const handleStartPause = () => {
  isRecording.value = !isRecording.value;
};

const handleStop = () => {
  isRecording.value = false;
};
</script>

<style lang="scss" scoped>
.record-file {
  position: relative;
  width: 100%;
  height: 80px;
  background: #f9fafa;
  box-shadow: 0 0 8px 2px rgba(140, 145, 151, 0.15);
  padding: 0 20px;
  border-top: 1px solid #dae7f2;
  border-bottom: 1px solid #dae7f2;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .record-file-name {
    font-family: Avenir;
    font-size: 16px;
    color: #000;
  }
  .record-file-time {
    font-family: Avenir;
    font-size: 12px;
    color: #afafb1;
  }
}

.record-progress {
  width: 100%;
  height: calc(100vh - 265px);
  position: relative;
  .record-progress-box {
    width: 100%;
    height: 100%;
    background: #fff;
  }
  .record-time {
    width: fit-content;
    padding: 5px 10px;
    background: #afafb1;
    border-radius: 10px;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: auto;
    font-family: Avenir;
    font-size: 16px;
    font-weight: bold;
    color: #ffffff;
  }
}

.record-control {
  width: 100%;
  height: 100px;
  background-color: #f9fafa;
  display: flex;
  align-items: center;
  justify-content: center;
  .fa-solid {
    font-size: 24px;
    color: #ffffff;
  }

  .start-pause-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #303e89;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 10px;
  }

  .stop-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background-color: #303e89;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 30px;
  }
}
</style>
