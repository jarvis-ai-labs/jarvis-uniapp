<template>
  <view class="container">
    <uni-nav-bar
      shadow
      fixed
      status-bar
      :border="false"
      height="50px"
      left-icon="back"
      left-text="文件"
      @clickLeft="handleGoBack" />

    <view class="container-box">
      <view class="record-detail-box">
        <view class="tabs">
          <button
            @click="switchTab('transcription-results')"
            :class="{ active: currentTab === 'transcription-results' }">
            转录结果
          </button>
          <button @click="switchTab('ai-assistant')" :class="{ active: currentTab === 'ai-assistant' }">AI助手</button>
        </view>

        <template v-if="currentTab === 'transcription-results' && recordInfo">
          <view class="record-info">
            <view class="file-name">{{ recordInfo.fileName }}</view>
            <view class="record-time">
              <view class="time">{{ recordInfo.duration }}</view>
              <view class="time2">{{ recordInfo.startTime }}</view>
            </view>
          </view>

          <view class="transcription-box">
            <view>{{ recordInfo.recordText }}</view>
          </view>
        </template>

        <template v-if="currentTab === 'ai-assistant'">
          <view class="features" v-for="result in taskResult" :key="result.id">
            <view class="topbox">
              <view class="title">{{ result.name }}: </view>
              <ua-markdown :source="result.result || ''" />
            </view>
            <view class="bottombox">
              <uni-icons type="redo" size="20" @click="handleOpenShare(result)"></uni-icons>
              <text @click="handleRegenerate(result)">重新生成</text>
            </view>
          </view>

          <button v-if="taskResult.length > 0 && !showRemainingTask" class="btn-generate" @click="handleGenerateMore">
            继续生成
          </button>

          <view class="btn-list" v-if="showRemainingTask">
            <view class="btn-item" v-for="item in newTaskList" :key="item.id" @click="handleClickTask(item)">
              <text>{{ item.name }}</text>
              <uni-icons type="right" size="16"></uni-icons>
            </view>
          </view>
        </template>
      </view>
    </view>
    <uni-popup ref="shareDom" background-color="#EBEBEB" borderRadius="20px 20px 0 0">
      <view class="share-box">
        <view class="title">分享</view>
        <view class="share-list">
          <view class="share-item" @click="handleExportWord()">
            <image mode="aspectFill" src="/static/images/icon-word.png" />
            <text>Word文件</text>
          </view>
          <view class="share-item" @click="handleExportTxt()">
            <image mode="aspectFill" src="/static/images/icon-txt.png" />
            <text>TXT文件</text>
          </view>
          <view class="share-item" @click="handleCopyText()">
            <image mode="aspectFill" src="/static/images/icon-copy.png" />
            <text>复制文字</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { GetSupportedTasks, ProcessTextTask } from '@/api/api';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';

const shareDom = ref(null);
const currentTab = ref('transcription-results');
const recordInfo = ref(null);
const showRemainingTask = ref(true);
const taskList = ref([]);
const newTaskList = ref([]);
const taskResult = ref([]);
const currentShareContent = ref('');

onLoad((options) => {
  if (!options?.id) {
    uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
    uni.navigateBack();
    return;
  }

  const recordList = uni.getStorageSync('recordList') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
    console.log('当前录音文件', recordInfo.value);
    if (recordInfo.value) {
      getTaskList();
    }
  }
});

const getTaskList = async () => {
  try {
    const res = await GetSupportedTasks();
    console.log('任务列表', res.data);
    newTaskList.value = taskList.value = res.data || [];
  } catch (error) {
    console.error('获取任务列表失败', error);
    newTaskList.value = taskList.value = [];
    uni.showToast({ title: '获取任务列表失败，请重试', icon: 'error', duration: 2000 });
  }
};

const processTask = async (item, isRegenerate = false) => {
  uni.showLoading({ title: '请稍后...', mask: true });
  showRemainingTask.value = false;

  if (!isRegenerate) {
    taskResult.value.push({ id: item.id, name: item.name, result: '' });
  } else {
    taskResult.value = taskResult.value.map((result) => (result.id === item.id ? { ...result, result: '' } : result));
  }

  try {
    const res = await ProcessTextTask(item.name, recordInfo.value.recordText);
    console.log(item.name, res.data);

    const target = taskResult.value.find((result) => result.id === item.id);
    if (target) {
      target.result = res.data;
    }
    showRemainingTask.value = false;
  } catch (error) {
    console.log('error', error);
    const target = taskResult.value.find((result) => result.id === item.id);
    if (target) {
      target.result = isRegenerate ? '重新生成失败，请重试' : '生成失败，请重试';
    }
    showRemainingTask.value = true;
  } finally {
    uni.hideLoading();
  }
};

const handleClickTask = async (item) => {
  console.log('点击任务生成', item);
  await processTask(item);
};

const handleRegenerate = async (item) => {
  console.log('重新生成', item);
  await processTask(item, true);
};

const handleOpenShare = (item) => {
  console.log('分享', item);
  currentShareContent.value = item.result;
  shareDom.value.open('bottom');
};

const handleGenerateMore = () => {
  if (taskResult.value.length === 0) {
    newTaskList.value = taskList.value;
  } else {
    newTaskList.value = taskList.value.filter((item) => !taskResult.value.some((result) => result.id === item.id));
  }
  showRemainingTask.value = true;
};

const switchTab = (tab) => {
  if (currentTab.value !== tab) {
    currentTab.value = tab;
  }
};

const handleGoBack = () => {
  uni.switchTab({ url: '/pages/file/index' });
};

const handleExportWord = () => {
  uni.showToast({ title: '缺少api', icon: 'error' });
  return;
  uni.downloadFile({
    url: 'https://example.com/template.docx',
    success: (res) => {
      if (res.statusCode === 200) {
        const zip = new PizZip(res.tempFilePath);
        const doc = new Docxtemplater().loadZip(zip);

        doc.setData({ content: currentShareContent.value });

        try {
          doc.render();
          const buffer = doc.getZip().generate({ type: 'blob' });

          uni.saveFile({
            tempFilePath: buffer,
            success: (saveRes) => {
              uni.showToast({ title: 'Word 文件保存成功', icon: 'success' });
            },
            fail: (err) => {
              console.error('保存 Word 文件失败', err);
              uni.showToast({ title: '保存 Word 文件失败', icon: 'error' });
            }
          });
        } catch (error) {
          console.error('生成 Word 文件失败', error);
          uni.showToast({ title: '生成 Word 文件失败', icon: 'error' });
        }
      }
    },
    fail: (err) => {
      console.error('下载模板文件失败', err);
      uni.showToast({ title: '下载模板文件失败', icon: 'error' });
    }
  });
};

const handleExportTxt = () => {
  uni.showToast({ title: '缺少api', icon: 'error' });
  return;

  const filePath = `/export.txt`;
  uni.writeFile({
    filePath: filePath,
    data: currentShareContent.value,
    encoding: 'utf8',
    success: () => {
      uni.saveFile({
        tempFilePath: filePath,
        success: (res) => {
          uni.showToast({ title: 'TXT 文件保存成功', icon: 'success' });
        },
        fail: (err) => {
          console.error('保存 TXT 文件失败', err);
          uni.showToast({ title: '保存 TXT 文件失败', icon: 'error' });
        }
      });
    },
    fail: (err) => {
      console.error('写入 TXT 文件失败', err);
      uni.showToast({ title: '写入 TXT 文件失败', icon: 'error' });
    }
  });
};

const handleCopyText = () => {
  uni.setClipboardData({
    data: currentShareContent.value,
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' });
    },
    fail: (err) => {
      console.error('复制失败', err);
      uni.showToast({ title: '复制失败', icon: 'error' });
    }
  });
};
</script>

<style lang="scss" scoped>
.record-detail-box {
  width: 100%;
  min-height: calc(100vh - 125px);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 0 8px 2px rgba(140, 145, 151, 0.15);
  padding: 10px;
}
.tabs {
  width: 100%;
  background: #f9fafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  margin-bottom: 10px;

  uni-button:after {
    border: none;
  }

  button {
    width: 50%;
    height: 40px;
    background-color: #f9fafa;
    font-family: Avenir;
    font-size: 16px;
    color: #616161;
    &.active {
      border-radius: 10px;
      background: #ededed;
      color: #2a2a2a;
    }
  }
}

.transcription-box {
  background: #f9fafa;
  border-radius: 20px;
  padding: 20px;
  font-family: Avenir;
  font-weight: 300;
  font-size: 14px;
  color: #000;

  .dialog-item {
    margin-bottom: 5px;

    &:last-child {
      margin-bottom: 0;
    }

    .dialog-speaker {
      font-weight: bold;
      color: #81b82f;
    }
  }
}

.btn-list {
  .btn-item {
    display: flex;
    align-items: center;
    width: 100%;
    height: 40px;
    border-radius: 10px;
    font-family: Avenir;
    font-size: 16px;
    color: #575757;
    transition: background-color 0.3s ease;

    &:active {
      background-color: #f0f0f0;
    }
  }
}

.features {
  background: #f9fafa;
  border-radius: 18px;
  margin-bottom: 20px;
  .topbox {
    padding: 10px;
    border-bottom: 1px solid #dfe8f5;
    .title {
      font-family: Avenir;
      font-weight: 300;
      font-size: 16px;
      color: #000000;
      margin-bottom: 10px;
    }
    .text {
      font-family: Avenir;
      font-weight: 300;
      font-size: 12px;
      color: #616161;
    }
  }
  .bottombox {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: Avenir;
    font-size: 14px;
    font-weight: 300;
    color: #007aff;
    padding: 10px;
  }
}

.btn-generate {
  width: 120px;
  height: 40px;
  background: #dae7f2;
  border-radius: 20px;
  font-family: Avenir;
  font-weight: 300;
  font-size: 16px;
  color: #004685;
  transition: background-color 0.3s ease;

  &:active {
    background-color: #c0d4e5;
  }
}
.share-box {
  padding: 20px;
  .title {
    font-family: Avenir;
    font-weight: 300;
    font-size: 20px;
    color: #222222;
    margin-bottom: 20px;
  }
  .share-list {
    width: 100%;
    border-radius: 18px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .share-item {
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      image {
        width: 30px;
        height: 30px;
        margin-bottom: 10px;
      }
      text {
        font-family: Avenir;
        font-weight: 300;
        font-size: 14px;
        color: #555555;
      }
    }
  }
}
</style>
