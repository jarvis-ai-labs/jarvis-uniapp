<template>
  <view class="text-list">
    <view class="textlodingbox" v-if="props.textLoading"><i class="uni-toast__icon uni-loading"></i></view>
    <view class="text-list-item" v-for="item in recordList" :key="item.startTimestamp" v-if="recordList.length > 0">
      <view class="text-item">
        <div class="item-left">
          <div class="type-box">
            <image src="/static/images/icon-type-write.png" mode="widthFix" />
          </div>
          <view class="text-box">
            <view class="title">
              <text v-for="(text, index) in item.pointsData.Keywords" :key="index">
                {{ text }}
                {{ index === item.pointsData.Keywords.length - 1 ? '' : '、' }}
              </text>
            </view>
            <view class="content">
              <uni-icons type="location" size="20" color="#979797" />
              {{ item.startTimeText }}
            </view>
          </view>
        </div>
        <view class="item-right">
          <button class="btn-text">Text</button>
        </view>
      </view>
      <view class="text-item2">
        <view class="text-title" v-if="item.pointsData.KeySentences">
          <view v-for="(text, index) in item.pointsData.KeySentences" :key="index">
            {{ text.Text }}
          </view>
        </view>
        <scroll-view scroll-y="true" class="text-item2-list">
          <view class="text-box" v-for="item in item.transcriptionData?.Paragraphs" :key="item.ParagraphId">
            <view class="title">
              <text>说话人{{ item.SpeakerId }}: </text>
              <text>{{ formatDate(parseInt(item.ParagraphId / 1e6)) }}</text>
            </view>
            <view class="content">
              <text v-for="word in item.Words" :key="word.Id">{{ word.Text }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { formatDate } from '@/utils';

const props = defineProps({
  textLoading: {
    type: Boolean,
    default: false
  }
});

const recordList = ref([]);

onLoad((options) => {
  recordList.value = uni.getStorageSync('jarvis-record') || [];
  console.log('录音列表===', recordList.value);
});
</script>
