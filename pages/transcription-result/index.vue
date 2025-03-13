<template>
  <view class="container">
    <uni-nav-bar
      dark
      fixed
      status-bar
      :border="false"
      height="50px"
      title="文字"
      left-icon="back"
      @clickLeft="handleGoBack" />

    <view class="container-box">
      <view class="transcription-result-box">
        <view class="tabs">
          <button
            @click="switchTab('transcription-results')"
            :class="{ active: currentTab === 'transcription-results' }">
            转录结果
          </button>
          <button @click="switchTab('ai-assistant')" :class="{ active: currentTab === 'ai-assistant' }">AI助手</button>
        </view>

        <template v-if="currentTab === 'transcription-results'">
          <view class="record-info">
            <view class="file-name">{{ recordInfo.fileName }}</view>
            <view class="record-time">
              <view class="time">{{ recordInfo.durationText }}</view>
              <view class="time2">{{ recordInfo.startTimeText }}</view>
            </view>
          </view>

          <view class="transcription-box">
            <view v-for="item in paragraphs" :key="item.ParagraphId">
              <view class="speaker">讲话人{{ item.SpeakerId }}：</view>
              <view class="text">
                <text v-for="word in item.Words" :key="word.Id">{{ word.Text }}</text>
              </view>
            </view>
          </view>
        </template>

        <template v-if="currentTab === 'ai-assistant'">
          <view class="features" v-for="result in taskResult" :key="result.id">
            <view class="topbox">
              <view class="title">{{ result.name }}: </view>
              <ua-markdown :source="result.result || ''" />
            </view>
            <view class="bottombox">
              <uni-icons type="redo" size="20" color="#fff" @click="handleOpenShare(result)"></uni-icons>
              <text @click="handleRegenerate(result)">重新生成</text>
            </view>
          </view>

          <button v-if="taskResult.length > 0 && !showRemainingTask" class="btn-generate" @click="handleGenerateMore">
            继续生成
          </button>

          <view class="btn-list" v-if="showRemainingTask">
            <view class="btn-item" v-for="item in newTaskList" :key="item.id" @click="handleClickTask(item)">
              <text>{{ item.name }}</text>
              <uni-icons type="right" size="16" color="#A9A9A9"></uni-icons>
            </view>
          </view>
        </template>
      </view>
    </view>
    <uni-popup ref="shareDom" background-color="#EBEBEB" borderRadius="20px 20px 0 0">
      <view class="popup-bottom-box">
        <view class="title">分享</view>
        <view class="share-list">
          <view class="share-item" @click="handleExportWord()">
            <image mode="heightFix" src="/static/images/icon-word.png" />
            <text>Word文件</text>
          </view>
          <view class="share-item" @click="handleExportTxt()">
            <image mode="heightFix" src="/static/images/icon-txt.png" />
            <text>TXT文件</text>
          </view>
          <view class="share-item" @click="handleCopyText()">
            <image mode="heightFix" src="/static/images/icon-copy.png" />
            <text>复制文字</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { GetSupportedTasks, ProcessTextTask } from '@/api/api';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { getAudioToTextExample } from '@/utils';

const shareDom = ref(null);
const currentTab = ref('transcription-results');
const recordInfo = ref(null);
const paragraphs = ref([]);
const showRemainingTask = ref(true);
const taskList = ref([]);
const newTaskList = ref([]);
const taskResult = ref([]);
const currentShareContent = ref('');

onLoad((options) => {
  if (!options?.id) {
    uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
    return;
  }

  const recordList = uni.getStorageSync('jarvis-record') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
    if (recordInfo.value) {
      getTaskList();
      console.log('录音详情', recordInfo.value);
      paragraphs.value = recordInfo.value.transcriptionResult.Transcription.Paragraphs;
    }
  }
});

const getTaskList = async () => {
  try {
    const res = await GetSupportedTasks();
    newTaskList.value = taskList.value = res.data || [];
  } catch (error) {
    newTaskList.value = taskList.value = [];
    console.error('获取任务失败', error);
    uni.showToast({ title: '获取任务失败', icon: 'error' });
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

  let text = '';
  paragraphs.value.forEach((item) => {
    text += `讲话人${item.SpeakerId}：`;
    item.Words.forEach((word) => {
      text += word.Text;
    });
    text += '\n';
  });
  console.log('ProcessTextTask', item.name, text);

  // text = getAudioToTextExample();

  try {
    const res = await ProcessTextTask(item.name, text);

    const target = taskResult.value.find((result) => result.id === item.id);
    if (target) {
      target.result = res.data;
    }
    showRemainingTask.value = false;
  } catch (error) {
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
  await processTask(item);
};

const handleRegenerate = async (item) => {
  await processTask(item, true);
};

const handleOpenShare = (item) => {
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
.transcription-result-box {
  width: 100%;
  min-height: calc(100vh - 125px);
  border-radius: 24px;
  background: linear-gradient(0deg, rgba(175, 175, 175, 0.2), rgba(175, 175, 175, 0.2)),
    radial-gradient(16.39% 7.56% at 0% 5.55%, #007aff 0%, rgba(61, 62, 61, 0) 100%)
      /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
  padding: 10px;
}
.tabs {
  width: fit-content;
  background: #86868633;
  border-radius: 40px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  uni-button:after {
    border: none;
  }
  button {
    width: 120px;
    height: 40px;
    background: transparent;
    border-radius: 40px;
    font-family: Avenir;
    font-size: 16px;
    color: #949494;
    &.active {
      background: #8f8f8f33;
      color: #ffffff;
    }
  }
}

.transcription-box {
  padding: 10px 20px;
  font-family: Avenir;
  font-weight: 300;
  font-size: 14px;
  color: #f0f0f0;
  > view {
    margin-bottom: 10px;
    .speaker {
      font-family: Avenir;
      font-size: 14px;
      color: #949494;
    }
    .text {
      font-family: Avenir;
      font-size: 14px;
    }
  }
}

.btn-list {
  .btn-item {
    display: flex;
    align-items: center;
    width: 100%;
    height: 36px;
    font-family: Avenir;
    font-size: 16px;
    color: #a9a9a9;
  }
}

.features {
  background: #70707033;
  border-radius: 18px;
  margin-bottom: 20px;
  .topbox {
    padding: 10px;
    border-bottom: 1px solid #343434;
    .title {
      font-family: Avenir;
      font-weight: 300;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .text {
      font-family: Avenir;
      font-weight: 300;
      font-size: 12px;
      color: #acacac;
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
  background: #9d9d9d66;
  border-radius: 20px;
  font-family: Avenir;
  font-weight: 300;
  font-size: 16px;
  color: #ffffff;
}
</style>
