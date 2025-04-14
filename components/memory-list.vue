<template>
  <view class="text-list">
    <view class="textlodingbox" v-if="textLoading"><i class="uni-toast__icon uni-loading"></i></view>
    <view class="text-list-item" v-for="item in recordList" :key="item.startTimestamp" v-if="recordList.length > 0">
      <view class="text-item-box">
        <uni-swipe-action>
          <uni-swipe-action-item>
            <view class="text-item">
              <div class="item-left">
                <div class="type-box">
                  <image src="/static/images/icon-type-write.png" mode="widthFix" />
                </div>
                <view class="text-box">
                  <view class="title">
                    {{ item.pointsData.Keywords.join(' | ') }}
                  </view>
                  <view class="content">
                    <!-- <uni-icons type="location" size="20" color="#979797" /> -->
                    {{ item.startTimeText }}
                  </view>
                </view>
              </div>
              <button class="btn-text">Text</button>
            </view>
            <template #right>
              <view class="more-button-box">
                <!-- <button class="more-button">
                  <uni-icons type="more-filled" size="20" color="#3d3d4a" />
                </button>
                <button class="more-button">
                  <uni-icons type="compose" size="20" color="#3d3d4a" />
                </button> -->
                <button class="more-button" @click="handleDelete(item)">
                  <uni-icons type="trash-filled" size="20" color="#3d3d4a" />
                </button>
              </view>
            </template>
          </uni-swipe-action-item>
        </uni-swipe-action>
      </view>

      <view class="text-item2">
        <scroll-view scroll-y="true" class="text-item2-list">
          <view class="text-box" v-for="text in item.transcriptionData?.Paragraphs" :key="text.ParagraphId">
            <view class="title">
              <text>说话人{{ text.SpeakerId }}: </text>
              <text>{{ formatDate(parseInt(text.ParagraphId / 1e6)).split(' ')[1] }}</text>
            </view>
            <view class="content">
              <text v-for="word in text.Words" :key="word.Id">{{ word.Text }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <uni-popup ref="deleteDialog" type="dialog">
      <uni-popup-dialog
        type="info"
        title="删除"
        cancelText="取消"
        confirmText="确定"
        content="确定删除该录音吗？"
        @confirm="deleteDialogConfirm"
        @close="deleteDialogClose"></uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { formatDate } from '@/utils';

const textLoading = ref(false);
const recordList = ref([]);
const dialogInfo = ref(null);
const deleteDialog = ref(null);

onMounted(() => {
  recordList.value = uni.getStorageSync('jarvis-record') || [];
  console.log('录音列表===', recordList.value);
});

const refresh = () => {
  recordList.value = uni.getStorageSync('jarvis-record') || [];
  console.log('录音列表===', recordList.value);
};

const handleDelete = (item) => {
  dialogInfo.value = item;
  deleteDialog.value.open();
};

const deleteDialogConfirm = () => {
  recordList.value = recordList.value.filter((record) => record.startTimestamp !== dialogInfo.value.startTimestamp);
  uni.setStorageSync('jarvis-record', recordList.value);
  deleteDialog.value.close();
};

const deleteDialogClose = () => {
  deleteDialog.value.close();
};

defineExpose({
  textLoading,
  refresh
});
</script>
