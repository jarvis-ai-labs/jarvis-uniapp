<template>
  <scroll-view scroll-y="true" class="scroll-app">
    <custom-header />

    <view class="search-box">
      <uni-datetime-picker type="date" :clear-icon="false" v-model="currentDate" @change="changeDate" />

      <uni-easyinput prefixIcon="search" v-model="searchValue" placeholder="搜索"> </uni-easyinput>
    </view>

    <scroll-view scroll-y="true" class="scroll-tasks">
      <view class="record-list">
        <view class="record-list-item" v-for="(item, index) in eventList" :key="index">
          <view class="record-item-box">
            <uni-swipe-action>
              <uni-swipe-action-item>
                <view class="record-item">
                  <div class="item-left">
                    <div class="type-box">
                      <image src="/static/images/icon-type-write.png" mode="widthFix" />
                    </div>

                    <view class="text-box">
                      <view class="title">
                        {{ item }}
                      </view>
                    </view>
                  </div>
                </view>
              </uni-swipe-action-item>
            </uni-swipe-action>
          </view>
        </view>
      </view>
    </scroll-view>

    <custom-tabbar />
  </scroll-view>
</template>

<script setup>
import CustomTabbar from '@/components/custom-tabbar.vue';
import CustomHeader from '@/components/custom-header.vue';
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { formatDate } from '@/utils';
import { useStore } from 'vuex';

const store = useStore();
const recordList = computed(() => store.state.recordList);
const currentDate = ref('');
const searchValue = ref('');
const eventList = ref([]);

const changeDate = (e) => {
  currentDate.value = e;

  const newRecordList = recordList.value.filter(
    (item) => item.pointsData?.Actions && item.startTimeText.includes(currentDate.value)
  );

  console.log(currentDate.value, '录音列表', newRecordList.length, newRecordList);

  newRecordList.forEach((item) => {
    item.pointsData?.Actions.forEach((element) => {
      eventList.value.push(element.Text);
    });
  });

  console.log(currentDate.value, '事件列表', eventList.value.length, eventList.value);
};

watch(recordList, (newVal) => {
  changeDate(currentDate.value);
});

onMounted(() => {
  console.log('录音列表', recordList.value.length, recordList.value);

  nextTick(() => {
    const time = new Date().getTime();
    changeDate(formatDate(time, 'yyyy-MM-dd'));
  });
});
</script>
