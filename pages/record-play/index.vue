<template>
  <view class="container">
    <uni-nav-bar
      shadow
      fixed
      status-bar
      :border="false"
      height="50px"
      left-icon="back"
      left-text="文件"
      @clickLeft="handleGoBack"
      right-width="100px">
      <template #right>
        <view class="record-play-nav-bar">
          <text @click="toAudioToTextPage">转文字</text>
          <!-- <text>分享</text> -->
          <!-- <uni-icons type="more-filled" size="20" color="#000000" /> -->
          <text @click="toAiPage">AI</text>
        </view>
      </template>
    </uni-nav-bar>

    <view class="container-box">
      <view class="record-play-box">
        <view class="record-info">
          <view class="file-name">{{ recordInfo.fileName }}</view>
          <view class="record-time">
            <view class="time">{{ recordInfo.duration }}</view>
            <view class="time2">{{ recordInfo.startTime }}</view>
          </view>
        </view>

        <view class="record-content">
          <text>音纹识别</text>
        </view>

        <view class="player-controls">
          <slider
            activeColor="#5FA9FF"
            backgroundColor="#DFE8F5"
            block-size="12"
            block-color="#5FA9FF"
            :value="progress"
            @change="onSliderChange" />
          <view class="time">
            <text>{{ currentTime }}</text>
            <text>{{ recordInfo.duration }}</text>
          </view>
          <view class="control-buttons">
            <uni-icons
              custom-prefix="iconfont"
              :type="isPlaying ? 'icon-pause' : 'icon-play'"
              size="50"
              color="#555555"
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
    uni.navigateBack();
    return;
  }

  const recordList = uni.getStorageSync('recordList') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
    console.log('当前录音文件信息:', recordInfo.value);
    if (recordInfo.value) {
      initAudioPlayer();
    }
  }
});

onBackPress((options) => {
  if (options.from == 'backbutton') {
    return true;
  } else if (options.from == 'navigateBack') {
    return false;
  }
});

onMounted(() => {
  if (recordInfo.value) {
    initAudioPlayer();
  }
});

onUnmounted(() => {
  if (audioContext.value) {
    audioContext.value.destroy();
  }
});

const initAudioPlayer = () => {
  if (!recordInfo.value?.filePath) {
    console.error('无效的文件路径');
    return;
  }

  audioContext.value = uni.createInnerAudioContext();

  // #ifdef APP-PLUS
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
            uni.showToast({
              title: '文件不存在或无法访问',
              icon: 'none'
            });
          }
        );
      }
    }
  );
  // #endif

  // #ifdef H5 || MP-WEIXIN
  audioContext.value.src = recordInfo.value.filePath;
  initAudioEvents();
  // #endif
};

// 将音频事件监听抽取为单独的函数
const initAudioEvents = () => {
  audioContext.value.onError((res) => {
    console.error('播放错误:', res);
    uni.showToast({
      title: '播放失败: ' + res.errMsg,
      icon: 'none'
    });
  });

  audioContext.value.onCanplay(() => {
    console.log('音频可以播放');
  });

  audioContext.value.onPlay(() => {
    console.log('开始播放');
    isPlaying.value = true;
  });

  audioContext.value.onPause(() => {
    console.log('暂停播放');
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
  uni.switchTab({ url: '/pages/file/index' });
};

const toAudioToTextPage = () => {
  uni.navigateTo({
    url: '/pages/audio-to-text/index?id=' + recordInfo.value.startTimestamp
  });
};

const toAiPage = () => {
  uni.navigateTo({
    url: '/pages/record-detail/index?id=' + recordInfo.value.startTimestamp
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
  background: #ffffff;
  box-shadow: 0 0 8px 2px rgba(140, 145, 151, 0.15);
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
  background: #edf2f8;
  border-radius: 18px;
  padding: 10px;

  .time {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: Avenir;
    font-size: 16px;
    color: #979797;
  }

  .control-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    .play-btn {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
