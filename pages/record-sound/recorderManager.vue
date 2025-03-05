<template>
  <view class="container">
    <view class="container-box">
      <uni-nav-bar :fixed="true" :border="false" height="50px" background-color="#FFFFFF" status-bar title="正在录音" />

      <view class="record-file">
        <view class="record-file-name">
          {{ fileName }}
        </view>
        <view class="record-file-time">
          {{ startTime }}
        </view>
      </view>

      <view class="record-progress">
        <canvas type="2d" class="recwave-WaveView" style="width: 300px; height: 100px"></canvas>
        <view class="record-time" @click="playVoice">
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
import { onLoad } from '@dcloudio/uni-app';
import { formatDate } from '@/utils';

const recorderManager = ref(null);
const innerAudioContext = ref(null);

const now = Date.now();
const fileName = ref('录音文件_' + formatDate(now).split(' ')[0] + '_' + formatDate(now).split(' ')[1]);
const startTime = ref(formatDate(now));
const isRecording = ref(false);
const currentTime = ref(0);
let timer = ref(null);
let tempFilePath = ref('');

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
};

// 开始/暂停录音
const handleStartPause = () => {
  // pause		暂停录音	App 暂不支持
  // resume		继续录音	App 暂不支持
  if (isRecording.value) {
    recorderManager.value.pause();
  } else {
    if (tempFilePath.value) {
      recorderManager.value.resume();
    } else {
      const options = {
        duration: 600000, // 指定录音的时长，单位 ms，最大为10分钟
        sampleRate: 44100, // 采样率
        numberOfChannels: 1, // 录音通道数
        encodeBitRate: 192000, // 编码码率
        format: 'mp3', // 音频格式，选择此格式是因为mp3文件小，可以在微信小程序中直接播放
        frameSize: 50 // 指定帧大小，单位 KB
      };
      recorderManager.value.start(options);
    }
  }
};

// 停止录音
const handleStop = () => {
  recorderManager.value.stop();
};

// 播放录音
const playVoice = () => {
  if (tempFilePath.value) {
    innerAudioContext.value.src = tempFilePath.value;
    innerAudioContext.value.play();
  }
};

onLoad(() => {
  recorderManager.value = uni.getRecorderManager();
  innerAudioContext.value = uni.createInnerAudioContext();
  console.log('recorderManager', recorderManager.value);

  // 录音开始事件
  recorderManager.value.onStart(() => {
    isRecording.value = true;
    timer.value = setInterval(() => {
      currentTime.value += 1;
    }, 1000);
  });

  // 录音暂停事件
  recorderManager.value.onPause(() => {
    isRecording.value = false;
    clearInterval(timer.value);
  });

  // 录音继续事件
  recorderManager.value.onResume(() => {
    isRecording.value = true;
    timer.value = setInterval(() => {
      currentTime.value += 1;
    }, 1000);
  });

  // 录音停止事件
  recorderManager.value.onStop((res) => {
    console.log('录音停止', res);
    isRecording.value = false;
    clearInterval(timer.value);
    tempFilePath.value = res.tempFilePath;
  });

  // 录音错误事件
  recorderManager.value.onError((res) => {
    console.log('录音错误', res);
  });
});

onMounted(() => {
  handleStartPause();
});

onUnmounted(() => {
  if (isRecording.value) {
    recorderManager.value.stop();
  }
  clearInterval(timer.value);
  innerAudioContext.value.destroy();
});
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
  display: flex;
  justify-content: center;
  align-items: center;

  .recwave-WaveView {
    width: 300px;
    height: 100px;
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
