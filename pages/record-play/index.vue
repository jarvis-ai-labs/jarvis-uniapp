<template>
  <view class="container">
    <view class="container-box">
      <uni-nav-bar
        shadow
        fixed
        status-bar
        :border="false"
        height="50px"
        background-color="#FFFFFF"
        @clickLeft="handleClickLeft">
        <template #left>
          <view class="back-btn">
            <uni-icons type="back" size="20" color="#000000" />
            <text>文件</text>
          </view>
        </template>
        <template #right>
          <view class="record-play-nav-bar">
            <text>转文字</text>
            <text>分享</text>
            <uni-icons type="more-filled" size="20" color="#000000" />
            <text>AI</text>
          </view>
        </template>
      </uni-nav-bar>
    </view>
  </view>
</template>

<script setup>
const handleClickLeft = () => {
  uni.switchTab({ url: '/pages/file/index' });
};
</script>

<style lang="scss" scoped></style>
