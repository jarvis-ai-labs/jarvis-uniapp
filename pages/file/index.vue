<template>
  <view class="container">
    <view class="container-box">
      <uni-nav-bar
        :fixed="true"
        :border="false"
        height="50px"
        background-color="#FFFFFF"
        status-bar
        title="文件"
        left-icon="list"
        right-icon="search"
        @clickLeft="handleClickLeft"
        @clickRight="handleClickRight" />

      <view class="file-list">
        <view class="file-item" v-for="item in fileList" :key="item.id" @click="handleFileItem(item)">
          <view class="file-item-left">
            <view class="left-top">{{ item.title }}</view>
            <view class="left-bottom">
              <view class="time">{{ item.total_duration }}</view>
              <view class="time2">{{ item.recording_time }}</view>
            </view>
          </view>
          <view class="file-item-right">
            <button class="file-item-button">{{ item.buttonText }}</button>
          </view>
        </view>
      </view>

      <button class="sound-recording-btn" @click="handleSoundRecording">
        <uni-icons type="mic-filled" size="30" color="#ffffff" />
      </button>

      <!-- 提示窗示例 -->
      <!-- <uni-popup ref="alertDialog" type="dialog">
        <uni-popup-dialog
          type="warn"
          cancelText="关闭"
          confirmText="同意"
          title="通知"
          content="欢迎使用 uni-popup!"
          @confirm="dialogConfirm"
          @close="dialogClose"></uni-popup-dialog>
      </uni-popup> -->
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import permision from '@/js_sdk/wa-permission/permission.js';

import fileListData from '@/data/fileList.json';

const fileList = ref(fileListData);
// const alertDialog = ref(null);

const handleFileItem = (item) => {
  uni.navigateTo({
    url: '/pages/file-detail/index?id=' + item.id
  });
};

const handleClickLeft = () => {
  console.log('点击左侧按钮');
};

const handleClickRight = () => {
  console.log('点击右侧按钮');
};

const handleSoundRecording = async () => {
  switch (uni.getSystemInfoSync().platform) {
    case 'android':
      const isRecordAudioGranted = await permision.requestAndroidPermission('android.permission.RECORD_AUDIO');
      const isWriteStorageGranted = await permision.requestAndroidPermission(
        'android.permission.WRITE_EXTERNAL_STORAGE'
      );
      // 1	已获取授权
      // 0	未获取授权
      // -1	被永久拒绝授权

      console.log('录音权限', isRecordAudioGranted == 1 ? '已获取授权' : '未获取授权');
      console.log('文件存储权限', isWriteStorageGranted == 1 ? '已获取授权' : '未获取授权');

      if (isRecordAudioGranted > 0 && isWriteStorageGranted > 0) {
        uni.navigateTo({ url: '/pages/record-sound/index' });
      } else {
        uni.showModal({
          title: '提示',
          content: '录音功能需要录音和文件存储权限，请前往设置手动开启',
          success: function (res) {
            if (res.confirm) {
              console.log('用户点击确定');
              permision.gotoAppPermissionSetting();
            } else if (res.cancel) {
              console.log('用户点击取消');
            }
          }
        });
      }
      break;

    case 'ios':
      permision.judgeIosPermission('record');

      break;
  }
};

// const dialogConfirm = () => {
//   console.log('点击确认');
// };

// const dialogClose = () => {
//   console.log('点击关闭');
// };
</script>

<style lang="scss" scoped>
.file-list {
  position: relative;
  width: 95vw;
  margin: 20px auto 0;
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
      width: 70%;
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
      width: 20%;
      .file-item-button {
        background: #edf0f7;
        border-radius: 15px;
        font-family: Avenir;
        font-size: 14px;
        color: #303e89;
      }
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
