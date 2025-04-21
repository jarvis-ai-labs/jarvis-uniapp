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
        <view
          class="event-box"
          :style="
            event.imageUrl ? `background: url(${event.imageUrl}) no-repeat center center; background-size: cover;` : ''
          ">
          <view class="event-box-content">
            <uni-icons type="checkbox" size="24" color="#ffffff" />

            <view class="text">
              {{ getText(event.pointsData?.Actions[0].Text) }}
            </view>
            <view class="text" v-if="event.pointsData?.Actions.length > 1">...</view>

            <button class="event-btn" @click="handleEvent(event)">查看详情</button>
          </view>
        </view>
      </z-swiper-item>
      <z-swiper-item v-else>
        <view class="event-box">
          <view class="event-box-content">
            <uni-icons type="checkbox" size="24" color="#ffffff" />
            <button class="event-btn">Event</button>
          </view>
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
          <view
            class="event-box"
            :style="
              event.imageUrl
                ? `background: url(${event.imageUrl}) no-repeat center center; background-size: cover;`
                : ''
            "
            @click="handleEvent(event)">
            <view class="event-box-content">
              <text class="iconfont">&#xe61e;</text>

              <view class="text">
                {{ getText(event.pointsData?.Actions[0].Text) }}
              </view>
              <view class="text" v-if="event.pointsData?.Actions.length > 1">...</view>
            </view>
          </view>
        </z-swiper-item>
        <z-swiper-item v-else>
          <view class="event-box">
            <view class="event-box-content">
              <text class="iconfont">&#xe61e;</text>
              <view class="text">Schedule</view>
            </view>
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
        <z-swiper-item
          v-for="(event, eventIndex) in eventList3"
          :key="eventIndex"
          v-if="eventList3.length > 0"
          @click="handleEvent(event)">
          <view
            class="event-box"
            :style="
              event.imageUrl
                ? `background: url(${event.imageUrl}) no-repeat center center; background-size: cover;`
                : ''
            ">
            <view class="event-box-content">
              <text class="iconfont">&#xe613;</text>

              <view class="text">
                {{ getText(event.pointsData?.Actions[0].Text) }}
              </view>
              <view class="text" v-if="event.pointsData?.Actions.length > 1">...</view>
            </view>
          </view>
        </z-swiper-item>
        <z-swiper-item v-else>
          <view class="event-box">
            <view class="event-box-content">
              <text class="iconfont">&#xe613;</text>
              <view class="text">News</view>
            </view>
          </view>
        </z-swiper-item>
      </z-swiper>
    </view>
  </view>

  <uni-popup ref="popupEventRef" :mask-click="false">
    <view class="popup-box">
      <view class="event-popup-box">
        <view class="event-popup-box2">
          <image class="popup-title-img1" src="/static/images/popup-bg-event.png" mode="widthFix" />
          <image class="popup-title-img2" src="/static/images/popup-title-event.png" mode="widthFix" />

          <view class="event-content">
            <view class="event-title">
              {{
                popupEventData.pointsData?.Keywords.length > 0
                  ? popupEventData.pointsData?.Keywords.join(' | ')
                  : popupEventData.fileName
              }}
            </view>
            <view class="event-content-box">
              <view class="event-content-box-title">详情</view>
              <scroll-view scroll-y="true" class="event-content-box-content">
                <view>{{ popupEventData.startTimeText }}</view>
                <view v-for="(text, index) in popupEventData.pointsData?.Actions" :key="index">
                  {{ text.Text }}
                </view>
              </scroll-view>
            </view>
          </view>
        </view>
      </view>
      <image
        class="popup-close-img"
        src="/static/images/icon-close.png"
        mode="widthFix"
        @click="store.commit('setPopupEventData', false)" />
    </view>
  </uni-popup>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import { EffectCards } from '@/uni_modules/zebra-swiper/modules';

const store = useStore();
const recordList = computed(() => store.state.recordList);
const popupEventData = computed(() => store.state.popupEventData);
const modules = ref([EffectCards]);

const popupEventRef = ref(null);
const swiperEventInstance = ref(null);
const swiperEventInstance2 = ref(null);
const swiperEventInstance3 = ref(null);
const oldEventList = ref([]);
const eventList1 = ref([]);
const eventList2 = ref([]);
const eventList3 = ref([]);

watch(popupEventData, (newVal) => {
  if (newVal) {
    popupEventRef.value.open();
  } else {
    popupEventRef.value.close();
  }
});

watch(recordList, (newVal) => {
  console.log('监听录音列表', newVal.length, newVal);
  updateEventLists();
});

const updateEventLists = () => {
  if (!swiperEventInstance.value || !swiperEventInstance2.value || !swiperEventInstance3.value) return;

  const eventList = recordList.value.filter((item) => item.pointsData?.Actions);
  oldEventList.value = eventList.sort((a, b) => a.startTimestamp - b.startTimestamp);

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

const handleEvent = async (item) => {
  store.commit('setPopupEventData', item);
};

const getText = (text) => {
  return text.length > 10 ? text.slice(0, 10) + '...' : text;
};
</script>

<style lang="scss" scoped>
.swiper-box {
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  margin-bottom: 10px;
  .swiper {
    margin: 0;
  }

  .schedule-document {
    width: 160px;
    height: 300px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .event-swiper {
    width: 190px;
    height: 300px;
    .event-box {
      background: url('@/static/images/bg-event.png') no-repeat center center;
      background-size: cover;
    }
  }
  .event-swiper2 {
    width: 160px;
    height: 170px;
    .event-box {
      background: url('@/static/images/bg-event-2.png') no-repeat center center;
      background-size: cover;
    }
  }
  .event-swiper3 {
    width: 160px;
    height: 120px;
    .event-box {
      background: url('@/static/images/bg-event-3.png') no-repeat center center;
      background-size: cover;
    }
  }

  .event-box {
    width: 95%;
    height: 100%;
    border-radius: 18px;

    .event-box-content {
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.204) 0%, rgba(0, 0, 0, 0.6) 100%);
      backdrop-filter: blur(1px);
      padding: 10px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      position: relative;
      font-family: Avenir;
      font-weight: 300;
      font-size: 12px;
      color: #ffffff;
    }

    .event-btn {
      width: 100%;
      height: 50px;
      line-height: 50px;
      border-radius: 18px;
      font-family: Avenir;
      font-weight: 900;
      font-size: 14px;
      color: #000000;
      margin-top: 5px;
    }
    .uni-icons {
      position: absolute;
      top: 10px;
      right: 10px;
    }
    .iconfont {
      font-size: 20px;
      color: #ffffff;
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
    }
  }
}

.popup-box {
  width: fit-content;
  height: fit-content;
  position: relative;
  .popup-close-img {
    width: 36px;
    height: 36px;
    display: block;
    margin: 20px auto 0;
  }
}
.event-popup-box {
  width: 300px;
  height: fit-content;
  background: linear-gradient(360deg, #272730 0%, #634dac 100%);
  border-radius: 24px;
  backdrop-filter: blur(4px);
  position: relative;
  .event-popup-box2 {
    width: 100%;
    height: 100%;
    background: url('@/static/images/popup-bg-event.png') no-repeat center top;
    background-size: 100% auto;

    .popup-title-img1 {
      width: 100%;
      height: auto;
    }
    .popup-title-img2 {
      width: 140px;
      height: auto;
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      margin: auto;
    }

    .event-content {
      width: 90%;
      margin: 0 auto;
      padding-bottom: 20px;
      .event-title {
        font-family: Poppins;
        font-weight: 600;
        font-size: 16px;
        color: #ffffff;
        text-align: center;
      }
      .event-content-box {
        width: 100%;
        border-radius: 24px;
        background: #3c3065;
        border: 1px solid #6146be;
        font-family: Poppins;
        font-weight: 400;
        font-size: 14px;
        color: #ffffff;
        padding: 20px 10px;
        margin: 20px 0;
        position: relative;
        .event-content-box-title {
          width: fit-content;
          height: 30px;
          line-height: 30px;
          background: linear-gradient(180deg, #8463f7 0%, #4d3a91 111.23%);
          border-radius: 24px;
          border: 1px solid #8978c1;
          padding: 0 10px;
          font-family: Poppins;
          font-weight: 400;
          font-size: 14px;
          color: #ffffff;
          position: absolute;
          left: 0;
          top: -15px;
        }
        .event-content-box-content {
          width: 100%;
          max-height: 300px;
        }
      }
    }
  }
}
</style>
