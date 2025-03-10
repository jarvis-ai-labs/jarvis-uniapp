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
      left-text="文件"
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
          <template v-if="!audioToTextLoading">
            <button class="audio-to-text-btn" v-if="!audioToText" @click="handleAudioToText">开始转文字</button>
            <button class="audio-to-text-btn" v-else @click="toRecordTextPage">查看转录结果</button>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import CryptoJS from 'crypto-js';
import { formatDate } from '@/utils';

const recordInfo = ref(null);
const audioToTextLoading = ref(false);
const audioToText = ref('');
const logText = ref('');

// 从环境变量获取配置
const appKey = import.meta.env.VITE_APPKEY;
const accessKeyId = import.meta.env.VITE_ACCESSKEYID;
const accessKeySecret = import.meta.env.VITE_ACCESSKEYSECRET;
const accessTokenKey = 'aliyun_access_token';
const accessTokenExpireKey = 'aliyun_access_token_expire';
let accessToken = ref('');
let accessTokenExpire = ref('');

onLoad(async (options) => {
  if (!options?.id) {
    uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
    return;
  }

  let recordList = [];
  // #ifdef H5 || MP-WEIXIN
  recordList = JSON.parse(localStorage.getItem('recordList')) || [];
  // #endif
  // #ifdef APP
  recordList = uni.getStorageSync('recordList') || [];
  // #endif
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
  }
});

// 获取 AccessToken
const getAccessToken = async () => {
  try {
    const date = new Date();
    const timestamp = date.toISOString();
    const nonce = Math.random().toString(36).substr(2, 15);

    // 构建规范化请求字符串
    const parameters = {
      AccessKeyId: accessKeyId,
      Action: 'CreateToken',
      Format: 'JSON',
      RegionId: 'cn-shanghai',
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: nonce,
      SignatureVersion: '1.0',
      Timestamp: timestamp,
      Version: '2019-02-28'
    };

    // 按照参数名称的字典顺序排序
    const sortedParams = Object.keys(parameters)
      .sort()
      .reduce((acc, key) => {
        acc[key] = parameters[key];
        return acc;
      }, {});

    // 构建规范化的请求字符串
    const canonicalizedQueryString = Object.entries(sortedParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    // 构建待签名字符串
    const stringToSign = `GET&${encodeURIComponent('/')}&${encodeURIComponent(canonicalizedQueryString)}`;

    // 计算签名
    const signature = CryptoJS.HmacSHA1(stringToSign, `${accessKeySecret}&`).toString(CryptoJS.enc.Base64);

    // 添加签名到参数中
    parameters.Signature = signature;

    // 构建最终的请求URL
    const requestUrl = `http://nls-meta.cn-shanghai.aliyuncs.com/?${Object.entries(parameters)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')}`;

    const response = await uni.request({
      url: requestUrl,
      method: 'GET'
    });

    console.log('getAccessToken', response);

    if (response.statusCode === 200 && response.data.Token) {
      accessToken.value = response.data.Token.Id;
      // 存储 Token 的过期时间（转换为毫秒）
      accessTokenExpire.value = response.data.Token.ExpireTime * 1000;

      // 将 Token 和过期时间存储到缓存
      // #ifdef H5 || MP-WEIXIN
      localStorage.setItem(accessTokenKey, accessToken.value);
      localStorage.setItem(accessTokenExpireKey, accessTokenExpire.value.toString());
      // #endif
      // #ifdef APP
      uni.setStorageSync(accessTokenKey, accessToken.value);
      uni.setStorageSync(accessTokenExpireKey, accessTokenExpire.value.toString());
      // #endif

      console.log('获取 AccessToken 成功', accessToken.value);
      console.log('AccessToken 有效期至', formatDate(accessTokenExpire.value));
    } else {
      logText.value = `获取授权失败: ${response.data.ErrMsg}`;
      uni.showToast({ title: '获取授权失败', icon: 'error' });
      audioToTextLoading.value = false;
    }
  } catch (error) {
    console.error('获取 AccessToken 失败:', error);
    logText.value = `获取授权失败: ${error.message}`;
    uni.showToast({ title: '获取授权失败', icon: 'error' });
    audioToTextLoading.value = false;
  }
};

// 处理开始转文字按钮点击
const handleAudioToText = async () => {
  audioToTextLoading.value = true;
  logText.value = '正在转换文字...';

  // 检查 Token 是否有效
  // #ifdef H5 || MP-WEIXIN
  accessToken.value = localStorage.getItem(accessTokenKey);
  accessTokenExpire.value = parseInt(localStorage.getItem(accessTokenExpireKey));
  // #endif
  // #ifdef APP
  accessToken.value = uni.getStorageSync(accessTokenKey);
  accessTokenExpire.value = parseInt(uni.getStorageSync(accessTokenExpireKey));
  // #endif

  // 如果当前 Token 未过期
  if (accessToken.value && accessTokenExpire.value && accessTokenExpire.value > Date.now()) {
    console.log('使用存储的 AccessToken', accessToken.value);
    console.log('AccessToken 有效期至', formatDate(accessTokenExpire.value));
  } else {
    await getAccessToken();
  }

  try {
    const audioArrayBuffer = uni.base64ToArrayBuffer(recordInfo.value.audioBase64);

    const response = await uni.request({
      url: `http://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr?appkey=${appKey}`,
      method: 'POST',
      header: {
        'Content-Type': 'audio/mp3',
        'X-NLS-Token': accessToken.value
      },
      data: audioArrayBuffer
    });

    console.log('录音转文字结果', response);

    const data = response.data;
    if (response.statusCode === 200 && data.status === 20000000) {
      audioToText.value = data.result;

      let recordList = [];
      // #ifdef H5 || MP-WEIXIN
      recordList = JSON.parse(localStorage.getItem('recordList')) || [];
      // #endif
      // #ifdef APP
      recordList = uni.getStorageSync('recordList') || [];
      // #endif

      const newRecordList = recordList.map((record) => {
        if (record.startTimestamp === recordInfo.value.startTimestamp) {
          record.recordText = audioToText.value;
        }
        return record;
      });

      // #ifdef H5 || MP-WEIXIN
      localStorage.setItem('recordList', JSON.stringify(newRecordList));
      // #endif
      // #ifdef APP
      uni.setStorageSync('recordList', newRecordList);
      // #endif

      logText.value = '录音转文字成功';
      uni.showToast({ title: '录音转文字成功', icon: 'success' });
      audioToTextLoading.value = false;
    } else {
      logText.value = `录音转文字失败: ${data.message}`;
      uni.showToast({ title: '录音转文字失败', icon: 'error' });
      audioToTextLoading.value = false;
    }
  } catch (error) {
    console.error('录音转文字失败:', error);
    logText.value = `录音转文字失败: ${error.message}`;
    uni.showToast({ title: '录音转文字失败', icon: 'error' });
    audioToTextLoading.value = false;
  }
};

const toRecordTextPage = () => {
  uni.navigateTo({
    url: '/pages/record-text/index?id=' + recordInfo.value.startTimestamp
  });
};

const handleGoBack = () => {
  uni.switchTab({ url: '/pages/file/index' });
};

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
//     const signature = CryptoJS.HmacSHA1(policyBase64, import.meta.env.VITE_ACCESSKEYSECRET).toString(CryptoJS.enc.Base64);

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
//           OSSAccessKeyId: import.meta.env.VITE_ACCESSKEYID,
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
  height: 40px;
  margin-bottom: 50px;
  .audio-to-text-btn {
    width: 150px;
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
