<template>
  <view class="swiper-box">
    <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="event-swiper">
      <z-swiper-item>
        <view
          class="event-box"
          style="background: url('/static/images/bg-event-1.png') no-repeat center center; background-size: 100% 100%">
          <view class="box-content">
            <uni-icons type="checkbox" size="24" color="#ffffff" />
            <button class="event-btn">Event</button>
          </view>
        </view>
      </z-swiper-item>
      <z-swiper-item>
        <view
          class="event-box"
          style="background: url('/static/images/bg-event-2.png') no-repeat center center; background-size: 100% 100%">
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
    </z-swiper>

    <view class="schedule-document">
      <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="schedule-swiper">
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
      </z-swiper>

      <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="document-swiper">
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
      </z-swiper>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { EffectCards } from '@/uni_modules/zebra-swiper/modules';

const modules = ref([EffectCards]);
</script>
