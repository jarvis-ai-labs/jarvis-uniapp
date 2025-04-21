<template>
  <scroll-view scroll-y="true" class="scroll-app">
    <custom-header />

    <view class="search-box">
      <uni-datetime-picker type="date" :clear-icon="false" v-model="currentDate" @change="changeDate" />

      <uni-easyinput prefixIcon="search" v-model="searchValue" placeholder="搜索"> </uni-easyinput>
    </view>

    <scroll-view scroll-y="true" class="scroll-memory">
      <view class="record-list">
        <view class="record-list-item" v-for="item in newRecordList" :key="item.startTimestamp">
          <view class="record-item-box">
            <uni-swipe-action>
              <uni-swipe-action-item>
                <view class="record-item">
                  <div class="item-left">
                    <div class="type-box">
                      <image src="/static/images/icon-type-write.png" mode="widthFix" />
                    </div>

                    <view class="text-box" v-if="item.pointsData?.Keywords.length > 0">
                      <view class="title">
                        {{ item.pointsData?.Keywords.join(' | ') }}
                      </view>
                      <view class="content">
                        {{ item.startTimeText }}
                      </view>
                    </view>
                    <view class="text-box" v-else>
                      <view class="title">
                        {{ item.startTimeText }}
                      </view>
                    </view>
                  </div>
                  <button class="btn-text" @click="item.isOpen = !item.isOpen">文字</button>
                </view>
                <template #right>
                  <view class="more-button-box">
                    <button class="more-button" @click="handleDelete(item)">
                      <uni-icons type="trash-filled" size="20" color="#3d3d4a" />
                    </button>
                  </view>
                </template>
              </uni-swipe-action-item>
            </uni-swipe-action>
          </view>

          <view class="record-item-box2" v-if="item.isOpen">
            <scroll-view scroll-y="true" class="record-item-box2-list">
              <view class="text-box" v-for="text in item.transcriptionData?.Paragraphs" :key="text.ParagraphId">
                <view class="title">
                  <text>说话人{{ text.SpeakerId }}: </text>
                  <text>{{ formatDate(parseInt(text.ParagraphId / 1e6)).split(' ')[1] }}</text>
                </view>
                <view class="content">
                  <text v-for="word in text.Words" :key="word.Id">{{ word.Text }}</text>
                </view>
              </view>
            </scroll-view>
          </view>
        </view>

        <uni-popup ref="deleteDialog" type="dialog">
          <uni-popup-dialog
            type="info"
            cancelText="取消"
            confirmText="确定"
            content="确定删除该录音吗？"
            @confirm="deleteDialogConfirm"
            @close="deleteDialogClose">
          </uni-popup-dialog>
        </uni-popup>
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
const newRecordList = ref([]);
const dialogInfo = ref(null);
const deleteDialog = ref(null);
const currentDate = ref('');
const searchValue = ref('');

const changeDate = (e) => {
  currentDate.value = e;

  newRecordList.value = recordList.value.filter((item) => {
    return item.startTimeText.includes(currentDate.value);
  });

  console.log(currentDate.value, '录音列表', newRecordList.value.length, newRecordList.value);
};

const handleDelete = (item) => {
  dialogInfo.value = item;
  deleteDialog.value.open();
};

const deleteDialogConfirm = () => {
  const recordArr = recordList.value.filter((record) => record.startTimestamp !== dialogInfo.value.startTimestamp);
  store.commit('setRecordList', recordArr);
  deleteDialog.value.close();
};

const deleteDialogClose = () => {
  deleteDialog.value.close();
};

watch(recordList, (newVal) => {
  changeDate(currentDate.value);
});

onMounted(() => {
  console.log('录音列表', recordList.value.length, recordList.value);

  nextTick(() => {
    const time = new Date().getTime() - 86400000;
    changeDate(formatDate(time, 'yyyy-MM-dd'));
  });
});
</script>
