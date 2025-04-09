<template>
  <audio-recorder ref="recorder" @process="handleProcess">
    <view class="record-btn" @click="toggleRecording">
      <image src="/static/images/record-btn.png" mode="widthFix" />
      <voice-wave ref="waveView" />
    </view>
  </audio-recorder>
</template>

<script setup>
import { ref } from 'vue';
import AudioRecorder from './audio-recorder.vue';
import VoiceWave from './voice-wave.vue';

const recorder = ref(null);
const waveView = ref(null);

const toggleRecording = () => {
  if (recorder.value.isRecording) {
    recorder.value.stopRecording();
  } else {
    recorder.value.requestPermission();
  }
};

const handleProcess = (powerLevel) => {
  waveView.value.input(powerLevel);
};
</script>

<style lang="scss" scoped>
.record-btn {
  width: 60px;
  height: 60px;
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  margin: auto;
  image {
    width: 100%;
    height: 100%;
  }
}
</style>
