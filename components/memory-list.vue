<template>
  <view class="text-list">
    <view class="textlodingbox" v-if="transferTextLoading"><i class="uni-toast__icon uni-loading"></i></view>
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
                    {{ item.pointsData?.Keywords.length > 0 ? item.pointsData?.Keywords.join(' | ') : item.fileName }}
                  </view>
                  <view class="content">
                    <!-- <uni-icons type="location" size="20" color="#979797" /> -->
                    {{ item.startTimeText }}
                  </view>
                </view>
              </div>
              <button class="btn-text" @click="handleAgainTransferText(item)">Text</button>
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
          <view class="textlodingbox" v-if="againTransferTextLoading && againTransferTextId === item.startTimestamp">
            <i class="uni-toast__icon uni-loading"></i>
          </view>

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
import { ref, onMounted, computed } from 'vue';
import { formatDate } from '@/utils';
import { useStore } from 'vuex';
import {
  uploadToOss,
  generateOnlineUrl,
  createKeyPointsTask,
  getTaskResultUrl,
  getTaskResult,
  createTranscriptionTask
} from '@/api/api';

const store = useStore();
const recordList = computed(() => store.state.recordList);
const transferTextLoading = computed(() => store.state.transferTextLoading);
const againTransferTextLoading = computed(() => store.state.againTransferTextLoading);
const dialogInfo = ref(null);
const deleteDialog = ref(null);
const againTransferTextId = ref(null);

const handleDelete = (item) => {
  dialogInfo.value = item;
  deleteDialog.value.open();
};

const deleteDialogConfirm = () => {
  const recordArr = recordList.value.filter((record) => record.startTimestamp !== dialogInfo.value.startTimestamp);
  store.commit('setRecordList', recordArr);
  deleteDialog.value.close();
};

const deleteDialogClose = () => {
  deleteDialog.value.close();
};

const handleAgainTransferText = async (item) => {
  console.log('againTransferTextLoading', againTransferTextLoading.value);
  if (againTransferTextLoading.value) return;
  store.commit('setAgainTransferTextLoading', true);

  try {
    againTransferTextId.value = item.startTimestamp;
    item.pointsData = null;
    item.transcriptionData = null;

    const pointsId = await createKeyPointsTask(item.onlineUrl);
    const transcriptionId = await createTranscriptionTask(item.onlineUrl);

    const pointsUrl = await getTaskResultUrl(pointsId, '要点提炼');
    const transcriptionUrl = await getTaskResultUrl(transcriptionId, '转录');

    const pointsResult = await getTaskResult(pointsUrl.MeetingAssistance);
    const transcriptionResult = await getTaskResult(transcriptionUrl.Transcription);

    const newRecordList = recordList.value.map((record) => {
      if (record.startTimestamp === item.startTimestamp) {
        const newRecord = {
          ...record,
          pointsData: pointsResult.MeetingAssistance,
          transcriptionData: transcriptionResult.Transcription
        };

        if (newRecord.pointsData.Actions) {
          store.commit('setPopupEventData', newRecord);
        }

        return newRecord;
      }
      return record;
    });

    store.commit('setRecordList', newRecordList);
  } catch (error) {
    console.log('失败', error);
  } finally {
    store.commit('setAgainTransferTextLoading', true);
    againTransferTextId.value = null;
  }
};
</script>
