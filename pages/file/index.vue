<template>
  <view class="container">
    <uni-nav-bar
      dark
      fixed
      status-bar
      :border="false"
      height="50px"
      @clickLeft="handleClickLeft"
      @clickRight="handleClickRight">
      <template #left>
        <button class="list-btn">
          <uni-icons type="list" size="18" color="#ffffff" />
        </button>
      </template>
      <view class="logo-view">
        <image mode="heightFix" src="/static/logo3.png" />
      </view>
      <template #right>
        <button class="search-btn">
          <uni-icons type="search" size="18" color="#ffffff" />
        </button>
      </template>
    </uni-nav-bar>

    <view class="container-box">
      <view class="file-list" v-if="recordList.length > 0">
        <uni-swipe-action>
          <view class="file-item" v-for="item in recordList" :key="item.startTimestamp" @click="toRecordPlayPage(item)">
            <uni-swipe-action-item>
              <view class="file-item-box">
                <view class="file-item-left">
                  <view class="left-top">{{ item.fileName }}</view>
                  <view class="left-bottom">
                    <view class="time">{{ item.durationText }}</view>
                    <view class="time2">{{ item.startTimeText }}</view>
                  </view>
                </view>
                <view class="file-item-right" v-if="item.transcriptionResult">
                  <button class="file-item-button" @click.stop="toFileDetailPage(item)">文字</button>
                </view>
              </view>

              <template #right>
                <view class="more-button-box">
                  <button class="more-button more-button-1" @click.stop="handleFileInfo(item)">
                    <uni-icons type="more-filled" size="20" color="#ffffff" />
                  </button>
                  <button class="more-button more-button-2" @click.stop="handleRename(item)">
                    <uni-icons type="compose" size="20" color="#ffffff" />
                  </button>
                  <button class="more-button more-button-3" @click.stop="handleDelete(item)">
                    <uni-icons type="trash-filled" size="20" color="#ffffff" />
                  </button>
                </view>
              </template>
            </uni-swipe-action-item>
          </view>
        </uni-swipe-action>
      </view>

      <button class="sound-recording-btn" @click="handleSoundRecording">
        <uni-icons type="mic-filled" size="30" color="#ffffff" />
      </button>

      <!-- 提示窗示例 -->
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

      <uni-popup ref="renameDialog" type="dialog">
        <uni-popup-dialog
          mode="input"
          title="重命名"
          placeholder="请输入新的文件名"
          v-model="renameInput"
          @confirm="renameDialogConfirm"
          @close="renameDialogClose"></uni-popup-dialog>
      </uni-popup>

      <uni-popup ref="fileInfoDom" background-color="#D2D2D2CC" borderRadius="20px 20px 0 0">
        <view class="popup-bottom-box">
          <view class="title">文件信息</view>
          <view class="text-box">
            <view class="text">
              <text>文件名：</text>
              <text>{{ dialogInfo.fileName }}</text>
            </view>
            <view class="text">
              <text>格式：</text>
              <text>{{ dialogInfo.mime }}</text>
            </view>
            <view class="text">
              <text>时长：</text>
              <text>{{ dialogInfo.durationText }}</text>
            </view>
            <view class="text">
              <text>大小：</text>
              <text>{{ formatFileSize(dialogInfo.size) }}</text>
            </view>
            <view class="text">
              <text>创建时间：</text>
              <text>{{ dialogInfo.startTimeText }}</text>
            </view>
          </view>
        </view>
      </uni-popup>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { formatFileSize } from '@/utils';

const recordList = ref([]);
const dialogInfo = ref(null);
const deleteDialog = ref(null);
const renameDialog = ref(null);
const fileInfoDom = ref(null);
const renameInput = ref('');

onShow(() => {
  recordList.value = uni.getStorageSync('jarvis-record') || [];
  console.log('APP本地录音列表', recordList.value);
});

const toRecordPlayPage = (item) => {
  uni.navigateTo({
    url: '/pages/record-play/index?id=' + item.startTimestamp
  });
};

const toFileDetailPage = (item) => {
  uni.navigateTo({
    url: '/pages/transcription-result/index?id=' + item.startTimestamp
  });
};

const handleFileInfo = (item) => {
  dialogInfo.value = item;
  fileInfoDom.value.open('bottom');
};

const handleRename = (item) => {
  dialogInfo.value = item;
  renameDialog.value.open();
};

const handleDelete = (item) => {
  dialogInfo.value = item;
  deleteDialog.value.open();
};

const renameDialogConfirm = () => {
  if (!renameInput.value.trim()) return;
  recordList.value = recordList.value.map((record) => {
    if (record.startTimestamp === dialogInfo.value.startTimestamp) {
      record.fileName = renameInput.value;
    }
    return record;
  });
  uni.setStorageSync('jarvis-record', recordList.value);
  renameDialog.value.close();
};

const renameDialogClose = () => {
  renameDialog.value.close();
};

const deleteDialogConfirm = () => {
  recordList.value = recordList.value.filter((record) => record.startTimestamp !== dialogInfo.value.startTimestamp);
  uni.setStorageSync('jarvis-record', recordList.value);
  deleteDialog.value.close();
};

const deleteDialogClose = () => {
  deleteDialog.value.close();
};

const handleClickLeft = () => {};

const handleClickRight = () => {
  uni.removeStorageSync('jarvis-record');
  recordList.value = [];
};

const handleSoundRecording = () => {
  uni.navigateTo({ url: '/pages/record-sound/index' });
};
</script>

<style lang="scss" scoped>
.list-btn,
.search-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #90909033;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-view {
  width: fit-content;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  image {
    width: auto;
    height: 36px;
  }
}

.file-list {
  width: 100%;
  .file-item {
    width: 100%;
    border-radius: 24px;
    background: linear-gradient(0deg, rgba(175, 175, 175, 0.2), rgba(175, 175, 175, 0.2)), rgba(61, 62, 61, 0) 100%;
    padding: 20px;
    margin-bottom: 10px;
    .file-item-box {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .file-item-left {
        width: calc(100% - 80px);
        .left-top {
          font-family: Avenir;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .left-bottom {
          display: flex;
          justify-content: space-between;
          .time {
            font-family: Avenir;
            font-size: 14px;
          }
          .time2 {
            font-family: Avenir;
            font-size: 14px;
          }
        }
      }
      .file-item-right {
        .file-item-button {
          width: 60px;
          height: 40px;
          background: #90909033;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Avenir;
          font-size: 16px;
          color: #ffffff;
        }
      }
    }
  }
}

.more-button-box {
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  .more-button {
    width: 40px;
    height: 40px;
    background: #90909033;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: 10px;
  }
}

.sound-recording-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #90909033;
  position: fixed;
  bottom: 100px;
  right: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.popup-bottom-box {
  padding: 20px;
  .title {
    font-family: Avenir;
    font-size: 18px;
    color: #222222;
    margin-bottom: 10px;
    text-align: center;
  }
  .text-box {
    background: #ececec;
    border-radius: 20px;
    .text {
      padding: 5px 20px;
      font-family: Avenir;
      font-size: 14px;
      color: #131313;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
