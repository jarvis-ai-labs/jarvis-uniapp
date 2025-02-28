<template>
  <view class="container">
    <view class="container-box">
      <uni-nav-bar
        :fixed="true"
        :border="false"
        background-color="#FFFFFF"
        status-bar
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
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import fileListData from '@/data/fileList.json';

// 数据定义
const fileList = ref(fileListData);

// 方法定义
const handleFileItem = (item) => {
  console.log('点击文件:', item);
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
</script>

<style lang="scss">
.file-list {
  position: relative;
  width: 95vw;
  margin: 30px auto 0;
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
</style>
