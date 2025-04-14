<template>
  <uni-popup ref="popupEventRef" :mask-click="false">
    <view class="popup-box">
      <view class="event-popup-box">
        <view class="event-popup-box2">
          <image class="popup-title-img1" src="/static/images/popup-bg-event.png" mode="widthFix" />
          <image class="popup-title-img2" src="/static/images/popup-title-event.png" mode="widthFix" />

          <view class="event-content">
            <view class="event-title">{{ popupEventData.pointsData.Keywords.join(' | ') }}</view>
            <view class="event-content-box">
              <view class="event-content-box-title">详情</view>
              <view>{{ popupEventData.startTimeText }}</view>
              <view v-for="(text, index) in popupEventData.pointsData.Actions" :key="index">
                {{ text.Text }}
              </view>
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
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

const store = useStore();
const popupEventData = computed(() => store.state.popupEventData);
const popupEventRef = ref(null);

watch(popupEventData, (newVal) => {
  if (newVal) {
    popupEventRef.value.open();
  } else {
    popupEventRef.value.close();
  }
});
</script>
