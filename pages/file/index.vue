<template>
  <view class="container">
    <uni-nav-bar
      shadow
      fixed
      status-bar
      :border="false"
      height="50px"
      title="文件"
      left-icon="list"
      right-icon="search"
      @clickLeft="handleClickLeft"
      @clickRight="handleClickRight" />

    <view class="container-box">
      <view class="file-list" v-if="recordList.length > 0">
        <uni-swipe-action>
          <uni-swipe-action-item v-for="item in recordList" :key="item.startTimestamp">
            <view class="file-item" @click="toRecordPlayPage(item)">
              <view class="file-item-left">
                <view class="left-top">{{ item.fileName }}</view>
                <view class="left-bottom">
                  <view class="time">{{ item.duration }}</view>
                  <view class="time2">{{ item.startTime }}</view>
                </view>
              </view>
              <view class="file-item-right">
                <button class="file-item-button" @click.stop="toFileDetailPage(item)">文字</button>
              </view>
            </view>

            <template #right>
              <view class="more-button-box">
                <!-- <button class="more-button more-button-1">
                  <uni-icons type="more-filled" size="20" color="#000000" />
                </button> -->
                <button class="more-button more-button-2" @click="handleRename(item)">重命名</button>
                <button class="more-button more-button-3" @click="handleDelete(item)">删除</button>
              </view>
            </template>
          </uni-swipe-action-item>
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
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';

const recordList = ref([]);
const dialogInfo = ref(null);
const deleteDialog = ref(null);
const renameDialog = ref(null);
const renameInput = ref('');

onShow(() => {
  recordList.value = uni.getStorageSync('recordList') || [];
  console.log('本地录音列表', recordList.value);
  console.log('import.meta.env', import.meta.env);
});

const toRecordPlayPage = (item) => {
  uni.navigateTo({
    url: '/pages/record-play/index?id=' + item.startTimestamp
  });
};

const toFileDetailPage = (item) => {
  uni.navigateTo({
    url: '/pages/record-detail/index?id=' + item.startTimestamp
  });
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
  uni.setStorageSync('recordList', recordList.value);
  renameDialog.value.close();
};

const renameDialogClose = () => {
  renameDialog.value.close();
};

const deleteDialogConfirm = () => {
  recordList.value = recordList.value.filter((record) => record.startTimestamp !== dialogInfo.value.startTimestamp);
  uni.setStorageSync('recordList', recordList.value);
  deleteDialog.value.close();
};

const deleteDialogClose = () => {
  deleteDialog.value.close();
};

const handleClickLeft = () => {};

const handleClickRight = () => {};

const handleSoundRecording = () => {
  uni.navigateTo({ url: '/pages/record-sound/index' });
};
</script>

<style lang="scss" scoped>
.file-list {
  width: 100%;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 0 8px 2px rgba(140, 145, 151, 0.15);
  padding: 0 20px;
  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #dae7f2;
    padding: 20px 0;
    &:last-child {
      border-bottom: none;
    }
    .file-item-left {
      width: calc(100% - 80px);
      .left-top {
        font-family: Avenir;
        font-size: 16px;
        color: #000;
        margin-bottom: 10px;
      }
      .left-bottom {
        display: flex;
        justify-content: space-between;
        .time {
          font-family: Avenir;
          font-size: 14px;
          color: #000;
        }
        .time2 {
          font-family: Avenir;
          font-size: 14px;
          color: #afafb1;
        }
      }
    }
    .file-item-right {
      .file-item-button {
        width: 60px;
        height: 40px;
        background: #edf0f7;
        border-radius: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Avenir;
        font-size: 16px;
        color: #303e89;
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
    width: 80px;
    height: 40px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Avenir;
    font-size: 16px;
    margin-left: 10px;
    &.more-button-1 {
      background: #efefef;
      color: #595959;
    }
    &.more-button-2 {
      background: #a5e9ff;
      color: #004685;
    }
    &.more-button-3 {
      background: #ed9672;
      color: #852204;
    }
  }
}

.sound-recording-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #303e89;
  position: fixed;
  bottom: 100px;
  right: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
