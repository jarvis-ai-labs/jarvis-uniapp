<template>
  <view class="swiper-box">
    <z-swiper
      class="event-swiper"
      grabCursor
      effect="cards"
      :cardsEffect="{ rotate: false, slideShadows: false }"
      :modules="modules"
      @swiper="onSwiperEvent"
      @slideChange="onSlideChange">
      <z-swiper-item v-for="(event, eventIndex) in eventList1" :key="eventIndex" v-if="eventList1.length > 0">
        <view class="event-box" style="background: url('/static/images/bg-event.png') no-repeat center center">
          <uni-icons type="checkbox" size="24" color="#ffffff" />
          <view class="text" v-for="(text, textIndex) in event.pointsData?.Actions" :key="textIndex">
            {{ text.Text }}
          </view>
          <button class="event-btn" @click="handleEvent(event)">查看详情</button>
        </view>
      </z-swiper-item>
      <z-swiper-item v-else>
        <view class="event-box">
          <uni-icons type="checkbox" size="24" color="#ffffff" />
          <button class="event-btn">Event</button>
        </view>
      </z-swiper-item>
    </z-swiper>

    <view class="schedule-document">
      <z-swiper
        class="event-swiper2"
        grabCursor
        effect="cards"
        :cardsEffect="{ rotate: false, slideShadows: false }"
        :modules="modules"
        @swiper="onSwiperEvent2"
        @slideChange="onSlideChange2">
        <z-swiper-item v-for="(event, eventIndex) in eventList2" :key="eventIndex" v-if="eventList2.length > 0">
          <view class="event-box" style="background: url('/static/images/bg-event-2.png') no-repeat center center">
            <text class="iconfont">&#xe61e;</text>
            <view class="text" v-for="(text, textIndex) in event.pointsData?.Actions" :key="textIndex">
              {{ text.Text }}
            </view>
          </view>
        </z-swiper-item>
        <z-swiper-item v-else>
          <view class="event-box">
            <text class="iconfont">&#xe61e;</text>
            <view class="text">Schedule</view>
          </view>
        </z-swiper-item>
      </z-swiper>

      <z-swiper
        class="event-swiper3"
        grabCursor
        effect="cards"
        :cardsEffect="{ rotate: false, slideShadows: false }"
        :modules="modules"
        @swiper="onSwiperEvent3"
        @slideChange="onSlideChange3">
        <z-swiper-item v-for="(event, eventIndex) in eventList3" :key="eventIndex" v-if="eventList3.length > 0">
          <view class="event-box" style="background: url('/static/images/bg-event-3.png') no-repeat center center">
            <text class="iconfont">&#xe613;</text>
            <view class="text" v-for="(text, textIndex) in event.pointsData?.Actions" :key="textIndex">
              {{ text.Text }}
            </view>
          </view>
        </z-swiper-item>
        <z-swiper-item v-else>
          <view class="event-box">
            <text class="iconfont">&#xe613;</text>
            <view class="text">News</view>
          </view>
        </z-swiper-item>
      </z-swiper>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import { EffectCards } from '@/uni_modules/zebra-swiper/modules';

const modules = ref([EffectCards]);
const store = useStore();
const recordList = computed(() => store.state.recordList);
const swiperEventInstance = ref(null);
const swiperEventInstance2 = ref(null);
const swiperEventInstance3 = ref(null);
const oldEventList = ref([]);
const eventList1 = ref([]);
const eventList2 = ref([]);
const eventList3 = ref([]);

watch(recordList, (newVal) => {
  console.log('监听录音列表', newVal.length, newVal);
  updateEventLists();
});

const updateEventLists = () => {
  if (!swiperEventInstance.value || !swiperEventInstance2.value || !swiperEventInstance3.value) return;

  console.log('录音列表', recordList.value.length, recordList.value);

  const newEventList = recordList.value.filter((item) => item.pointsData.Actions);
  oldEventList.value = newEventList.sort((a, b) => a.startTimestamp - b.startTimestamp);

  console.log('事件列表', oldEventList.value.length, oldEventList.value);

  const length = oldEventList.value.length;

  // 根据数据长度设置不同的显示策略
  if (length >= 3) {
    // 当数据大于等于3条时，三个轮播器都显示数据
    eventList1.value = oldEventList.value.slice(0, -2);
    eventList2.value = oldEventList.value.slice(1, -1);
    eventList3.value = oldEventList.value.slice(2);
  } else if (length === 2) {
    // 当数据为2条时，只显示前两个轮播器
    eventList1.value = oldEventList.value.slice(0, -1);
    eventList2.value = oldEventList.value.slice(1);
    eventList3.value = [];
  } else if (length === 1) {
    // 当数据为1条时，只显示第一个轮播器
    eventList1.value = oldEventList.value;
    eventList2.value = [];
    eventList3.value = [];
  } else {
    // 没有数据时清空所有轮播器
    eventList1.value = [];
    eventList2.value = [];
    eventList3.value = [];
  }

  // 更新轮播器实例
  [swiperEventInstance, swiperEventInstance2, swiperEventInstance3].forEach((instance) => {
    if (instance.value) {
      instance.value.updateSlides();
      instance.value.update();
    }
  });
};

const onSwiperEvent = (swiper) => {
  swiperEventInstance.value = swiper;
  updateEventLists();
};

const onSwiperEvent2 = (swiper) => {
  swiperEventInstance2.value = swiper;
  updateEventLists();
};

const onSwiperEvent3 = (swiper) => {
  swiperEventInstance3.value = swiper;
  updateEventLists();
};

const onSlideChange = (swiper) => {
  if (swiperEventInstance2.value && swiperEventInstance3.value) {
    swiperEventInstance2.value.slideTo(swiper.activeIndex);
    swiperEventInstance3.value.slideTo(swiper.activeIndex);
  }
};

const onSlideChange2 = (swiper) => {
  if (swiperEventInstance.value && swiperEventInstance3.value) {
    swiperEventInstance.value.slideTo(swiper.activeIndex);
    swiperEventInstance3.value.slideTo(swiper.activeIndex);
  }
};

const onSlideChange3 = (swiper) => {
  if (swiperEventInstance.value && swiperEventInstance2.value) {
    swiperEventInstance.value.slideTo(swiper.activeIndex);
    swiperEventInstance2.value.slideTo(swiper.activeIndex);
  }
};

const handleEvent = (item) => {
  store.commit('setPopupEventData', item);
};
</script>
