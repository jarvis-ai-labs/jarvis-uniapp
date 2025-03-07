<template>
  <view class="container">
    <uni-nav-bar
      shadow
      fixed
      status-bar
      :border="false"
      height="50px"
      title="语音转文字"
      left-icon="back"
      @clickLeft="handleGoBack" />

    <view class="container-box">
      <view class="audio-to-text-box">
        <view class="record-info" v-if="recordInfo">
          <view class="file-name">{{ recordInfo.fileName }}</view>
          <view class="record-time">
            <view class="time">{{ recordInfo.duration }}</view>
            <view class="time2">{{ recordInfo.startTime }}</view>
          </view>
        </view>
        <view class="audio-to-text-content">
          <image mode="widthFix" src="/static/logo2.png" v-if="audioToTextLoading" />
          <image mode="widthFix" src="/static/logo2-active.png" v-else />
          <text>{{ logText }}</text>
        </view>
        <view class="audio-to-text-btn-box">
          <button class="audio-to-text-btn" v-if="!audioToTextLoading" @click="handleAudioToText">开始转文字</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';

const recordInfo = ref(null);
const audioToTextLoading = ref(false);
const logText = ref('');

onLoad((options) => {
  if (!options?.id) {
    uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
    return;
  }

  const recordList = uni.getStorageSync('recordList') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
  }
});

// 处理开始转文字按钮点击
const handleAudioToText = async () => {
  const appKey = import.meta.env.VITE_APPKEY;
  const accessToken = import.meta.env.VITE_ACCESSTOKEN;
  audioToTextLoading.value = true;
  logText.value = '正在转换文字...';
  console.log('appKey', appKey);
  console.log('accessToken', accessToken);
  console.log('recordInfo', recordInfo.value);

  const audioArrayBuffer = uni.base64ToArrayBuffer(recordInfo.value.audioBase64);

  try {
    const response = await uni.request({
      url: `http://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr?appkey=${appKey}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-NLS-Token': accessToken
      },
      data: audioArrayBuffer
    });

    console.log('录音转文字结果:', response);
    console.log('录音转文字结果:', response.data);

    const data = response.data;
    if (response.statusCode === 200 && data.status === 20000000) {
      const recordList = uni.getStorageSync('recordList') || [];
      const newRecordList = recordList.map((record) => {
        if (record.startTimestamp === recordInfo.value.startTimestamp) {
          record.recordText = data.result;
        }
        return record;
      });
      uni.setStorageSync('recordList', newRecordList);

      logText.value = '录音转文字成功';
      uni.showToast({ title: '录音转文字成功', icon: 'success' });
      setTimeout(() => {
        audioToTextLoading.value = false;
        uni.navigateTo({
          url: '/pages/record-detail/index?id=' + recordInfo.value.startTimestamp
        });
      }, 1000);
    } else {
      conversionFailed(data.message);
    }
  } catch (error) {
    console.error('转换失败:', error);
    conversionFailed(error.message);
  }
};

const conversionFailed = (message) => {
  logText.value = `录音转文字失败: ${message}`;
  uni.showToast({ title: '录音转文字失败', icon: 'error' });
  audioToTextLoading.value = false;
};

const handleGoBack = () => {
  uni.navigateBack();
};

// import CryptoJS from 'crypto-js';

// 获取 OSS 签名
// const getOssSignature = async () => {
//   try {
//     const date = new Date();
//     date.setHours(date.getHours() + 1);
//     const expiration = date.toISOString();

//     const policy = {
//       expiration: expiration,
//       conditions: [
//         ['content-length-range', 0, 10485760], // 限制文件大小在 10MB 以内
//         ['starts-with', '$key', ''] // 允许所有文件名
//       ]
//     };

//     const policyBase64 = btoa(JSON.stringify(policy));
//     const signature = CryptoJS.HmacSHA1(policyBase64, import.meta.env.VITE_AccessKey_Secret).toString(CryptoJS.enc.Base64);

//     return { policy: policyBase64, signature: signature };
//   } catch (error) {
//     console.error('获取签名失败:', error);
//     throw error;
//   }
// };

// 上传文件到 OSS
// const uploadToOss = async (filePath) => {
//   try {
//     const { policy, signature } = await getOssSignature();
//     const fileName = `${recordInfo.value.startTimestamp}.wav`;

//     return new Promise((resolve, reject) => {
//       uni.uploadFile({
//         url: OSS_URL,
//         filePath: filePath,
//         name: 'file',
//         formData: {
//           key: fileName,
//           success_action_status: '200',
//           OSSAccessKeyId: import.meta.env.VITE_AccessKey_ID,
//           policy: policy,
//           signature: signature
//         },
//         success: (res) => {
//           if (res.statusCode === 200) {
//             logText.value = '文件上传成功';
//             resolve(`${OSS_URL}/${fileName}`);
//           } else {
//             logText.value = '文件上传失败';
//             reject(new Error('文件上传失败'));
//           }
//         },
//         fail: (err) => {
//           logText.value = '文件上传失败';
//           console.error('文件上传失败:', err);
//           reject(err);
//         }
//       });
//     });
//   } catch (error) {
//     logText.value = '文件上传失败';
//     console.error('文件上传失败:', error);
//     throw error;
//   }
// };
</script>

<style lang="scss" scoped>
.audio-to-text-box {
  width: 100%;
  height: calc(100vh - 125px);
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 0 8px 2px rgba(140, 145, 151, 0.15);
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.audio-to-text-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  image {
    width: 100px;
  }
  text {
    font-family: Avenir;
    font-weight: 300;
    font-size: 16px;
    color: #616161;
    margin-top: 10px;
  }
}

.audio-to-text-btn-box {
  margin-bottom: 50px;
  .audio-to-text-btn {
    width: 120px;
    height: 40px;
    border-radius: 20px;
    background: #dae7f2;
    font-family: Avenir;
    font-weight: 300;
    font-size: 16px;
    color: #004685;
  }
}
</style>
