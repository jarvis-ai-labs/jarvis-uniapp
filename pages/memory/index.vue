<template>
  <custom-header />

  <scroll-view scroll-y="true" class="main">
    <view class="uni-margin-wrap">
      <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="event-swiper">
        <z-swiper-item>
          <view
            class="event-box"
            style="
              background: url('/static/images/bg-event-2.png') no-repeat center center;
              background-size: 100% 100%;
            ">
            <view class="box-content active">
              <uni-icons type="checkbox" size="24" color="#ffffff" />
              <view class="text"><text>行程详情</text></view>
              <view class="text"><text>出发时间</text> <text>17:20</text></view>
              <view class="text"><text>路线</text> <text>驾车路线(预计20分钟，途径东三环)</text></view>
              <view class="text"><text>提醒</text> <text>提前10分钟通知</text></view>
              <button class="event-btn">晚餐|18:00|国贸大厦</button>
            </view>
          </view>
        </z-swiper-item>
        <z-swiper-item>
          <view
            class="event-box"
            style="
              background: url('/static/images/bg-event-1.png') no-repeat center center;
              background-size: 100% 100%;
            ">
            <view class="box-content">
              <uni-icons type="checkbox" size="24" color="#ffffff" />
              <button class="event-btn">Event</button>
            </view>
          </view>
        </z-swiper-item>
      </z-swiper>

      <view class="schedule-document">
        <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="schedule-swiper">
          <z-swiper-item>
            <view
              class="schedule-box"
              style="
                background: url('/static/images/bg-schedule-2.png') no-repeat center center;
                background-size: 100% 100%;
              ">
              <view class="box-content active">
                <text class="iconfont">&#xe61e;</text>
                <view class="text"><text>与技术部门探讨app 接入硬件需求</text></view>
                <view class="text text2"><text>提醒</text><text>提前5分钟通知</text></view>
                <view class="text"><text>会议 | 15:00 | 上海</text></view>
              </view>
            </view>
          </z-swiper-item>
          <z-swiper-item>
            <view
              class="schedule-box"
              style="
                background: url('/static/images/bg-schedule-1.png') no-repeat center center;
                background-size: 100% 100%;
              ">
              <view class="box-content">
                <text class="iconfont">&#xe61e;</text>
                <text class="box-title">Schedule</text>
              </view>
            </view>
          </z-swiper-item>
        </z-swiper>

        <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="document-swiper">
          <z-swiper-item>
            <view
              class="document-box"
              style="
                background: url('/static/images/bg-document-2.png') no-repeat center center;
                background-size: 100% 100%;
              ">
              <view class="box-content active">
                <text class="iconfont">&#xe613;</text>
                <view class="text"><text>JARVIS正在进行对市面智能穿戴分析， 生成了报告文档。</text></view>
              </view>
            </view>
          </z-swiper-item>
          <z-swiper-item>
            <view
              class="document-box"
              style="
                background: url('/static/images/bg-document-1.png') no-repeat center center;
                background-size: 100% 100%;
              ">
              <view class="box-content">
                <text class="iconfont">&#xe613;</text>
                <text class="box-title">News</text>
              </view>
            </view>
          </z-swiper-item>
        </z-swiper>
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
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 10px;
  .swiper {
    margin: 0;
  }
  .box-content {
    width: 100%;
    height: 100%;
    border-radius: 18px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    position: relative;
    &.active {
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.204) 0%, rgba(0, 0, 0, 0.6) 100%);
      backdrop-filter: blur(2px);
    }
  }
  .event-swiper {
    width: 195px;
    height: 300px;
    .event-box {
      width: 95%;
      height: 100%;
      .event-btn {
        width: 100%;
        height: 60px;
        line-height: 60px;
        border-radius: 18px;
        font-family: Avenir;
        font-weight: 900;
        font-size: 14px;
        color: #000000;
        margin-top: 10px;
      }
      .uni-icons {
        position: absolute;
        top: 10px;
        right: 10px;
      }
      .text {
        font-family: Avenir;
        font-weight: 300;
        font-size: 12px;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 10px;
        text {
          width: 40%;
          &:nth-child(2) {
            width: 60%;
          }
        }
      }
    }
  }
  .schedule-document {
    width: 170px;
    height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .schedule-swiper {
      width: 100%;
      height: 170px;
      .schedule-box {
        width: 100%;
        height: 100%;
        .text {
          font-family: Avenir;
          font-weight: 300;
          font-size: 12px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          text {
            width: 80%;
          }
          &.text2 {
            text {
              width: 40%;
              &:nth-child(2) {
                width: 60%;
              }
            }
          }
        }
        .iconfont {
          font-size: 20px;
          color: #ffffff;
          position: absolute;
          top: 10px;
          right: 10px;
        }
        .box-title {
          font-family: Avenir;
          font-weight: 300;
          font-size: 12px;
          color: #ffffff;
        }
      }
    }

    .document-swiper {
      width: 100%;
      height: 120px;
      .document-box {
        width: 100%;
        height: 100%;
        .iconfont {
          font-size: 20px;
          color: #ffffff;
          position: absolute;
          top: 10px;
          right: 10px;
        }
        .box-title {
          font-family: Avenir;
          font-weight: 300;
          font-size: 12px;
          color: #ffffff;
        }
        .text {
          font-family: Avenir;
          font-weight: 300;
          font-size: 12px;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          text {
            width: 80%;
          }
        }
      }
    }
  }
}
</style>
