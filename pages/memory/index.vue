<template>
  <custom-header />

  <scroll-view scroll-y="true" class="main">
    <view class="uni-margin-wrap">
      <view class="event-box">
        <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="event-swiper">
          <z-swiper-item v-for="item in 5" :key="item">
            <view
              class="event-item"
              style="background: url('/static/images/img1.png') no-repeat center center; background-size: 100% 100%">
              <uni-icons type="checkbox" size="24" color="#ffffff" />
              <button class="event-btn">Event</button>
            </view>
          </z-swiper-item>
        </z-swiper>

        <view class="eventbox2">
          <view
            class="event-item2"
            style="background: url('/static/images/img2.png') no-repeat center center; background-size: 100% 100%">
            <text class="iconfont">&#xe61e;</text>
            <text class="event-text">Schedule</text>
          </view>

          <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="event-swiper2">
            <z-swiper-item v-for="item in 5" :key="item">
              <view
                class="event-item3"
                style="background: url('/static/images/img3.png') no-repeat center center; background-size: 100% 100%">
                <text class="iconfont">&#xe613;</text>
                <text class="event-text">News</text>
              </view>
            </z-swiper-item>
          </z-swiper>
        </view>
      </view>
    </view>

    <view class="text-list">
      <view class="text-list-item">
        <view class="text-item">
          <div class="item-left">
            <div class="type-box">
              <image src="/static/images/icon-type-write.png" mode="widthFix" />
            </div>
            <view class="text-box">
              <view class="title">2025.3.28</view>
              <view class="content">
                <uni-icons type="location" size="20" color="#979797" />
                shanghai
              </view>
            </view>
          </div>
          <view class="item-right">
            <button class="btn-text">Text</button>
          </view>
        </view>
        <view class="text-item2">
          <view class="text-title">实时转写中···</view>
          <scroll-view scroll-y="true" class="text-item2-list">
            <view class="text-box">
              <view class="title">
                <text>说话人1</text>
                <text>15:31:21 PM</text>
              </view>
              <view class="content"> "明天休息了，有空聚聚吗" </view>
            </view>
            <view class="text-box">
              <view class="title">
                <text>说话人2</text>
                <text>15:31:21 PM</text>
              </view>
              <view class="content"> "有的，去哪里" </view>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="text-list-item">
        <view class="text-item">
          <div class="item-left">
            <div class="type-box">
              <image src="/static/images/icon-type-write.png" mode="widthFix" />
            </div>
            <view class="text-box">
              <view class="title">2025.3.28</view>
              <view class="content">
                <uni-icons type="location" size="20" color="#979797" />
                shanghai
              </view>
            </view>
          </div>
          <view class="item-right">
            <button class="btn-text">Text</button>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>

  <custom-tabbar />
</template>

<script setup>
import customTabbar from '../../components/custom-tabbar.vue';
import customHeader from '../../components/custom-header.vue';

import { ref } from 'vue';
import { EffectCards } from '@/uni_modules/zebra-swiper/modules';

const modules = ref([EffectCards]);
</script>

<style lang="scss" scoped>
.main {
  height: calc(100vh - 200px - 80px);
}

.text-list {
  width: 100%;
  padding: 0 30px;
  .text-list-item {
    width: 100%;
    background: #1d1d23;
    border-radius: 18px;
    margin-bottom: 10px;
    .text-item {
      width: 100%;
      height: fit-content;
      background: #272730;
      border-radius: 18px;
      padding: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .item-left {
        display: flex;
        align-items: center;
        width: calc(100% - 60px);
        .type-box {
          width: 50px;
          height: 50px;
          background: #3c3c48;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          image {
            width: 14px;
            height: 20px;
          }
        }
        .text-box {
          width: calc(100% - 50px);
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
      .item-right {
        .btn-text {
          width: 60px;
          height: 30px;
          border-radius: 30px;
          border: 1px solid #3d3d4a;
          background: #1d1d23;
          font-family: Avenir;
          font-weight: 300;
          font-size: 12px;
          color: #3d3d4a;
        }
      }
    }

    .text-item2 {
      width: 100%;
      padding: 10px;
      .text-title {
        font-family: Avenir;
        font-weight: 300;
        font-size: 14px;
        color: #7a7a7a;
        text-align: right;
      }
      .text-item2-list {
        width: 100%;
        max-height: 200px;
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

.uni-margin-wrap {
  width: 100%;
  padding: 0 20px;
  margin-bottom: 10px;
  .swiper {
    margin: 0;
  }
  .event-box {
    width: 100%;
    display: flex;
    justify-content: space-between;
    .event-swiper {
      width: 195px;
      height: 300px;
      .event-item {
        width: 95%;
        height: 100%;
        border-radius: 18px;
        padding: 10px;
        display: flex;
        align-items: flex-end;
        position: relative;
        .event-btn {
          width: 100%;
          height: 60px;
          line-height: 60px;
          border-radius: 18px;
          font-family: Avenir;
          font-weight: 900;
          font-size: 14px;
          color: #000000;
        }
        .uni-icons {
          position: absolute;
          top: 10px;
          right: 10px;
        }
      }
    }
    .eventbox2 {
      width: 170px;
      height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      .event-item2 {
        width: 100%;
        height: 170px;
        border-radius: 18px;
        padding: 10px;
        display: flex;
        align-items: flex-end;
        position: relative;
        .iconfont {
          font-size: 20px;
          color: #ffffff;
          position: absolute;
          top: 10px;
          right: 10px;
        }
        .event-text {
          font-family: Avenir;
          font-weight: 300;
          font-size: 12px;
          color: #ffffff;
        }
      }

      .event-swiper2 {
        width: 100%;
        height: 120px;
        .event-item3 {
          width: 100%;
          height: 100%;
          border-radius: 18px;
          padding: 10px;
          display: flex;
          align-items: flex-end;
          position: relative;
          .event-text {
            font-family: Avenir;
            font-weight: 300;
            font-size: 12px;
            color: #ffffff;
            position: absolute;
            top: 10px;
            left: 10px;
          }
          .iconfont {
            font-size: 20px;
            color: #ffffff;
          }
        }
      }
    }
  }
}
</style>
