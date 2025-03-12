<template>
  <view class="container">
    <uni-nav-bar dark fixed status-bar :border="false" height="50px" left-icon="back" @clickLeft="handleGoBack">
      <template #right>
        <view class="record-play-nav-bar">
          <text @click="toAudioToTextPage">转文字</text>
        </view>
      </template>
    </uni-nav-bar>

    <view class="container-box">
      <view class="record-play-box">
        <view class="record-info">
          <view class="file-name">{{ recordInfo.fileName }}</view>
          <view class="record-time">
            <view class="time">{{ recordInfo.durationText }}</view>
            <view class="time2">{{ recordInfo.startTimeText }}</view>
          </view>
        </view>

        <view class="record-content"> </view>

        <view class="player-controls">
          <slider
            activeColor="#2670E9"
            backgroundColor="#6B6B6B99"
            block-size="12"
            block-color="#2670E9"
            :value="progress"
            @change="onSliderChange" />
          <view class="time">
            <text>{{ currentTime }}</text>
            <text>{{ recordInfo.durationText }}</text>
          </view>

          <view class="control-buttons">
            <uni-icons
              custom-prefix="iconfont"
              :type="isPlaying ? 'icon-pause' : 'icon-play'"
              size="50"
              color="#AFAFAF"
              @click="handlePlay" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { onLoad, onBackPress } from '@dcloudio/uni-app';

const recordInfo = ref(null);
const isPlaying = ref(false);
const progress = ref(0);
const currentTime = ref('00:00');
const audioContext = ref(null);

onLoad((options) => {
  if (!options?.id) {
    uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
    return;
  }

  const recordList = uni.getStorageSync('jarvis-record') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
    if (recordInfo.value) {
      initAudioPlayer();
      console.log('录音详情', recordInfo.value);
    }
  }
});

onBackPress(() => {
  const pages = getCurrentPages();
  const prevPage = pages[pages.length - 2];
  console.log('prevPage.route', prevPage.route);
  if (prevPage.route == 'pages/record-sound/index') {
    uni.switchTab({ url: '/pages/file/index' });
    return true;
  } else {
    return false;
  }
});

onUnmounted(() => {
  if (audioContext.value) {
    audioContext.value.destroy();
  }
});

const initAudioPlayer = () => {
  audioContext.value = uni.createInnerAudioContext();

  // 检查文件是否存在并获取真实路径
  plus.io.resolveLocalFileSystemURL(
    recordInfo.value.filePath,
    (entry) => {
      console.log('文件存在，获取真实路径:', entry.fullPath);
      audioContext.value.src = entry.fullPath;
      initAudioEvents();
    },
    (err) => {
      console.error('文件不存在或无法访问:', err);
      if (recordInfo.value.tempFilePath) {
        console.log('尝试使用临时文件路径:', recordInfo.value.tempFilePath);
        plus.io.resolveLocalFileSystemURL(
          recordInfo.value.tempFilePath,
          (entry) => {
            audioContext.value.src = entry.fullPath;
            initAudioEvents();
          },
          (e) => {
            uni.showToast({ title: '文件不存在或无法访问', icon: 'none' });
          }
        );
      }
    }
  );
};

// 将音频事件监听抽取为单独的函数
const initAudioEvents = () => {
  audioContext.value.onError((res) => {
    uni.showToast({ title: '播放失败: ' + res.errMsg, icon: 'none' });
  });

  audioContext.value.onCanplay(() => {});

  audioContext.value.onPlay(() => {
    isPlaying.value = true;
  });

  audioContext.value.onPause(() => {
    isPlaying.value = false;
  });

  audioContext.value.onTimeUpdate(() => {
    const duration = audioContext.value.duration;
    const currentTime = audioContext.value.currentTime;
    progress.value = (currentTime / duration) * 100;
    updateCurrentTime(currentTime);
  });

  audioContext.value.onEnded(() => {
    isPlaying.value = false;
    progress.value = 0;
    currentTime.value = '00:00';
  });
};

const handlePlay = () => {
  if (isPlaying.value) {
    audioContext.value.pause();
  } else {
    audioContext.value.play();
  }
};

const onSliderChange = (e) => {
  const value = e.detail.value;
  const duration = audioContext.value.duration;
  const time = (value / 100) * duration;
  audioContext.value.seek(time);
};

const updateCurrentTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  currentTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const handleGoBack = () => {
  if (audioContext.value) {
    audioContext.value.pause();
  }
  uni.switchTab({ url: '/pages/file/index' });
};

const toAudioToTextPage = () => {
  if (audioContext.value) {
    audioContext.value.pause();
  }
  uni.navigateTo({
    url: '/pages/transcription-text/index?id=' + recordInfo.value.startTimestamp
  });
};
</script>

<style lang="scss" scoped>
.uni-navbar__header-btns-right {
  width: fit-content !important;
}
.record-play-nav-bar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-play-box {
  width: 100%;
  height: calc(100vh - 125px);
  border-radius: 24px;
  background: linear-gradient(0deg, rgba(175, 175, 175, 0.2), rgba(175, 175, 175, 0.2)),
    radial-gradient(16.39% 7.56% at 0% 5.55%, #007aff 0%, rgba(61, 62, 61, 0) 100%)
      /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.record-content {
  width: 100%;
  height: 100%;
  padding: 10px;
}

.player-controls {
  width: 100%;
  margin-bottom: 30px;
  .time {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: Avenir;
    font-size: 14px;
    color: #979797;
  }

  .control-buttons {
    width: 100%;
    height: 50px;
    background: #6b6b6b99;
    border-radius: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
