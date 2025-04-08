<!-- 自定义头部 -->
<template>
  <view class="custom-header">
    <uni-icons type="list" size="24" color="#ffffff" />

    <view class="header-content">
      <text class="header-title">Hi Jarvis</text>
      <view class="header-right">
        <image class="avatar" src="/static/images/avatar.png" mode="widthFix" />
        <view class="header-right-item">
          <view class="header-right-item-text">
            <image src="/static/images/icon-lv.png" />
            <view class="textbox">
              <text>Lv</text>
              <text class="text2"> 1</text>
            </view>
          </view>
          <view class="header-right-item-text">
            <image src="/static/images/icon-lv2.png" />
            <view class="textbox">
              <text class="text2">01</text>
              <text> / 20</text>
            </view>
          </view>
          <view class="header-right-item-text">
            <image src="/static/images/icon-lv3.png" />
            <view class="textbox">
              <text class="text2">01</text>
              <text> / 20</text>
            </view>

            <uni-icons type="plus-filled" size="18" color="#909ADE" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
</script>

<style lang="scss" scoped>
.custom-header {
  width: 100%;
  height: fit-content;
  padding: 20px;
  background: url('/static/images/bg-header.png') no-repeat left center;
  background-size: auto 120%;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .header-title {
      font-family: Poppins;
      font-weight: 400;
      font-size: 36px;
      text-transform: capitalize;
      color: #ffffff;
    }
    .header-right {
      display: flex;
      align-items: center;
      .avatar {
        width: 48px;
        height: auto;
      }
      .header-right-item {
        margin-left: 20px;
        width: 100px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;

        .header-right-item-text {
          width: 100%;
          height: 24px;
          border-radius: 24px;
          border: 1px solid #303e89;
          display: flex;
          align-items: center;
          padding: 0 10px;
          > image {
            width: 14px;
            height: 14px;
            margin-right: 5px;
          }
          .textbox {
            width: 40px;
            font-family: Poppins;
            font-weight: 400;
            font-size: 10px;
            text-transform: capitalize;
            color: #ffffff;
            text-align: center;
            .text2 {
              color: #815ef6;
            }
          }
        }
      }
    }
  }
}
</style>
