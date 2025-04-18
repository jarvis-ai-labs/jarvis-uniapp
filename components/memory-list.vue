<template>
  <view class="text-list">
    <view class="loading-box" v-if="transferTextLoading"><i class="uni-toast__icon uni-loading"></i></view>
    <view class="text-list-item" v-for="item in newRecordList" :key="item.startTimestamp">
      <view class="text-item-box">
        <uni-swipe-action>
          <uni-swipe-action-item>
            <view class="text-item">
              <div class="item-left">
                <div class="type-box">
                  <image src="/static/images/icon-type-write.png" mode="widthFix" />
                </div>

                <view
                  class="loading-box"
                  v-if="againTransferTextLoading && againTransferTextId === item.startTimestamp">
                  <uni-load-more iconType="circle" status="loading" :showText="false" color="#fff" />
                  <!-- <i class="uni-toast__icon uni-loading"></i> -->
                </view>
                <view class="text-box" v-else-if="item.pointsData?.Keywords.length > 0">
                  <view class="title">
                    {{ item.pointsData?.Keywords.join(' | ') }}
                  </view>
                  <view class="content">
                    {{ item.startTimeText }}
                  </view>
                </view>
                <view class="text-box" v-else>
                  <view class="title">
                    {{ item.startTimeText }}
                  </view>
                </view>
              </div>
              <button class="btn-text" @click="item.isOpen = !item.isOpen">文字</button>
            </view>
            <template #right>
              <view class="more-button-box">
                <button class="more-button" @click="handleDelete(item)">
                  <uni-icons type="trash-filled" size="20" color="#3d3d4a" />
                </button>
              </view>
            </template>
          </uni-swipe-action-item>
        </uni-swipe-action>
      </view>

      <view class="text-item2" v-if="item.isOpen">
        <view class="loading-box" v-if="againTransferTextLoading && againTransferTextId === item.startTimestamp">
          <uni-load-more iconType="circle" status="loading" :showText="false" color="#fff" />
          <!-- <i class="uni-toast__icon uni-loading"></i> -->
        </view>
        <view class="btn-text" v-else>
          <text @click="handleAgainTransferText(item)">重新转录</text>
        </view>

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
        cancelText="取消"
        confirmText="确定"
        content="确定删除该录音吗？"
        @confirm="deleteDialogConfirm"
        @close="deleteDialogClose">
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { formatDate } from '@/utils';
import { useStore } from 'vuex';
import {
  uploadToOss,
  generateOnlineUrl,
  createKeyPointsTask,
  getTaskResult,
  getTaskResultData,
  createTranscriptionTask,
  createImageSynthesisTask,
  getSynthesisTask
} from '@/api/api';

const store = useStore();
const recordList = computed(() => store.state.recordList);
const transferTextLoading = computed(() => store.state.transferTextLoading);
const againTransferTextLoading = computed(() => store.state.againTransferTextLoading);
const dialogInfo = ref(null);
const deleteDialog = ref(null);
const againTransferTextId = ref(null);
const newRecordList = ref([]);

watch(recordList, (newVal) => {
  console.log('监听录音列表', newVal.length, newVal);
  newRecordList.value = newVal.map((item, index) => {
    return item;
  });
});

onMounted(() => {
  console.log('录音列表', recordList.value.length, recordList.value);

  newRecordList.value = recordList.value.map((item, index) => {
    return { ...item, isOpen: index == 0 };
  });
});

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

const transferText = async (newFileName) => {
  try {
    const onlineUrl = await generateOnlineUrl(newFileName);

    const transcriptionId = await createTranscriptionTask(onlineUrl);
    const pointsId = await createKeyPointsTask(onlineUrl);

    const transcriptionResult = await getTaskResult(transcriptionId, '转录');
    const pointsResult = await getTaskResult(pointsId, '要点提炼');

    const transcriptionData = await getTaskResultData(transcriptionResult.Transcription, '转录');
    const pointsData = await getTaskResultData(pointsResult.MeetingAssistance, '要点提炼');

    return {
      transcriptionData: transcriptionData.Transcription,
      pointsData: pointsData.MeetingAssistance
    };
  } catch (error) {
    throw error;
  }
};

const getImageSynthesisUrl = async (item) => {
  try {
    let prompt = '';
    if (item.pointsData?.Actions.length > 0) {
      item.pointsData?.Actions.forEach((action) => {
        prompt += action.Text;
      });
    } else {
      prompt = item.pointsData?.Actions[0].Text;
    }
    const imageSynthesisTask = await createImageSynthesisTask(prompt);
    const synthesisTask = await getSynthesisTask(imageSynthesisTask.task_id);
    return synthesisTask.results[0].url;
  } catch (error) {
    console.error('生成图片失败', error);
  }
};

const handleAgainTransferText = async (item) => {
  if (transferTextLoading.value || againTransferTextLoading.value) return;
  store.commit('setAgainTransferTextLoading', true);
  uni.showToast({ title: '开始重新转写录音文件...', icon: 'none', mask: true });

  try {
    againTransferTextId.value = item.startTimestamp;
    item.pointsData = null;
    item.transcriptionData = null;

    const newFileName = item.fileName + '.mp3';
    const { pointsData, transcriptionData } = await transferText(newFileName);

    // 更新记录列表
    const updatedRecordList = newRecordList.value.map((record) => {
      if (record.startTimestamp === item.startTimestamp) {
        return { ...record, pointsData, transcriptionData };
      }
      return record;
    });

    // 如果有 Actions，生成图片
    const recordWithActions = updatedRecordList.find(
      (record) => record.startTimestamp === item.startTimestamp && record.pointsData?.Actions
    );

    if (recordWithActions) {
      const imageUrl = await getImageSynthesisUrl(recordWithActions);
      recordWithActions.imageUrl = imageUrl;
      store.commit('setPopupEventData', recordWithActions);
    }

    console.log('更新后的录音列表', updatedRecordList);
    store.commit('setRecordList', updatedRecordList);
  } catch (error) {
    console.error('重新转写失败:', error);
    uni.showToast({ title: '录音文件重新转写失败！', icon: 'none', mask: true });
  } finally {
    againTransferTextId.value = null;
    store.commit('setAgainTransferTextLoading', false);
  }
};
</script>

<style lang="scss" scoped>
.text-list {
  width: 100%;
  padding: 0 30px 50px 30px;

  .loading-box {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    .uni-toast__icon {
      margin: 0;
      width: 24px;
      height: 24px;
    }
  }

  .text-list-item {
    width: 100%;
    background: #1d1d23;
    border-radius: 18px;
    margin-bottom: 10px;
    .text-item-box {
      width: 100%;
      height: fit-content;
      background: #272730;
      border-radius: 18px;
      padding: 10px;
    }
    .text-item {
      width: 100%;
      height: fit-content;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .item-left {
        display: flex;
        align-items: center;
        width: calc(100% - 60px);
        .type-box {
          width: 60px;
          height: 60px;
          min-width: 60px;
          background: #3c3c48;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          image {
            width: 30px;
            height: auto;
          }
        }
        .text-box {
          width: calc(100% - 60px);
          padding: 0 10px;
          .title {
            font-family: Avenir;
            font-weight: 300;
            font-size: 14px;
            color: #ffffff;
          }
          .content {
            font-family: Avenir;
            font-weight: 300;
            font-size: 12px;
            text-transform: capitalize;
            color: #979797;
            display: flex;
            align-items: center;
          }
        }
      }
      .btn-text {
        width: 60px;
        height: 30px;
        line-height: 30px;
        border-radius: 30px;
        border: 1px solid #3d3d4a;
        background: #1d1d23;
        font-family: Avenir;
        font-weight: 300;
        font-size: 14px;
        color: #3d3d4a;
      }
    }

    .more-button-box {
      width: fit-content;
      display: flex;
      align-items: center;
      justify-content: center;
      .more-button {
        width: 60px;
        height: 30px;
        line-height: 30px;
        border-radius: 30px;
        border: 1px solid #3d3d4a;
        background: #1d1d23;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 20px;
      }
    }

    .text-item2 {
      width: 100%;
      padding: 10px;
      .btn-text {
        width: 100%;
        display: flex;
        justify-content: flex-end;
        text-align: right;
        font-family: Avenir;
        font-weight: 300;
        font-size: 14px;
        color: #815ef6;
      }

      .text-item2-list {
        width: 100%;
        max-height: calc(100vh - 400px);
        .text-box {
          width: 100%;
          height: fit-content;
          padding: 10px 0;
          border-bottom: 1px solid;
          border-image: linear-gradient(
              to right,
              rgba(151, 151, 151, 0) 0%,
              rgba(151, 151, 151, 0.2) 27.5%,
              rgba(151, 151, 151, 0.2) 63.75%,
              rgba(151, 151, 151, 0) 100%
            )
            1;

          &:last-child {
            border-bottom: none;
          }
          .title {
            font-family: Avenir;
            font-weight: 300;
            font-size: 12px;
            color: #979797;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .content {
            font-family: Avenir;
            font-weight: 300;
            font-size: 14px;
            color: #f0f0f0;
          }
        }
      }
    }
  }
}
</style>
