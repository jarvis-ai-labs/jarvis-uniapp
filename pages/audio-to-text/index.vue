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
import OSS from 'ali-oss';

const recordInfo = ref(null);
const audioToTextLoading = ref(false);
const audioToText = ref('');
const logText = ref('');

// 从环境变量获取配置
const appKey = import.meta.env.VITE_APPKEY;
const accessKeyId = import.meta.env.VITE_ACCESSKEYID;
const accessKeySecret = import.meta.env.VITE_ACCESSKEYSECRET;
const ossBucketUrl = import.meta.env.VITE_OSSBUCKETURL;
const tingwuAppkey = import.meta.env.VITE_TINGWU_APPKEY;

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

// 获取 OSS 签名
const getOssSignature = async () => {
  try {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    const expiration = date.toISOString();

    const policy = {
      expiration: expiration,
      conditions: [
        ['content-length-range', 0, 10485760], // 限制文件大小在 10MB 以内
        ['starts-with', '$key', ''] // 允许所有文件名
      ]
    };

    const policyBase64 = btoa(JSON.stringify(policy));
    const signature = CryptoJS.HmacSHA1(policyBase64, import.meta.env.VITE_ACCESSKEYSECRET).toString(
      CryptoJS.enc.Base64
    );

    return { policy: policyBase64, signature: signature };
  } catch (error) {
    console.error('获取签名失败:', error);
    throw error;
  }
};

// 上传文件到 OSS
const uploadToOss = async (filePath) => {
  try {
    const { policy, signature } = await getOssSignature();
    const fileName = `${recordInfo.value.startTimestamp}.mp3`;

    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: ossBucketUrl,
        filePath: filePath,
        name: 'file',
        formData: {
          key: fileName,
          success_action_status: '200',
          OSSAccessKeyId: accessKeyId,
          policy: policy,
          signature: signature
        },
        success: (res) => {
          if (res.statusCode === 200) {
            logText.value = '文件上传成功';
            // resolve(`${ossBucketUrl}/${fileName}`);
            resolve(fileName);
          } else {
            logText.value = '文件上传失败';
            reject(new Error('文件上传失败'));
          }
        },
        fail: (err) => {
          logText.value = '文件上传失败';
          console.error('文件上传失败:', err);
          reject(err);
        }
      });
    });
  } catch (error) {
    logText.value = '文件上传失败';
    console.error('文件上传失败:', error);
    throw error;
  }
};

// 获取 AccessToken
const getAccessToken = async () => {
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
    console.log('存储的 AccessToken 有效期至', formatDate(accessTokenExpire.value));
  } else {
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
  }
};

// 定义一个生成预签名 URL 的函数
async function generateSignatureUrl(fileName) {
  const client = new OSS({
    accessKeyId: accessKeyId,
    accessKeySecret: accessKeySecret,
    bucket: 'jarvis-uniapp',
    region: 'oss-cn-shanghai',
    secure: true,
    authorizationV4: true
  });

  return await client.signatureUrlV4('GET', 3600, { headers: {} }, fileName);
}

// 创建转写任务
const createTask = async (audioUrl) => {
  try {
    // 1. 构建请求参数
    const date = new Date();
    const timestamp = date.toISOString().replace(/\.\d+Z$/, 'Z');
    const nonce = Math.random().toString(36).substr(2, 15);

    const requestBody = {
      AppKey: tingwuAppkey,
      Input: {
        SourceLanguage: 'cn',
        FileUrl: audioUrl
      },
      Parameters: {
        Transcription: {
          DiarizationEnabled: true,
          Diarization: {
            SpeakerCount: 0
          }
        }
      }
    };

    // 2. 计算请求体的 SHA256 哈希值
    const requestPayload = JSON.stringify(requestBody);
    const hashedRequestPayload = CryptoJS.SHA256(requestPayload).toString(CryptoJS.enc.Hex);

    // 3. 构建 V3 版本签名
    const host = 'tingwu.cn-beijing.aliyuncs.com';
    const method = 'PUT';
    const path = '/openapi/tingwu/v2/tasks';

    // 构建查询参数
    const queryParams = {
      type: 'offline'
    };

    // 按字典顺序排序查询参数
    const sortedQueryParams = {};
    Object.keys(queryParams)
      .sort()
      .forEach((key) => {
        sortedQueryParams[key] = queryParams[key];
      });

    // 构建规范化查询字符串
    const canonicalQueryString = Object.entries(sortedQueryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    // 构建规范化 URI
    const canonicalURI = path;

    // 构建规范化请求头
    const headers = {
      host: host,
      'x-acs-action': 'CreateTask',
      'x-acs-content-sha256': hashedRequestPayload,
      'x-acs-date': timestamp,
      'x-acs-signature-nonce': nonce,
      'x-acs-version': '2023-09-30',
      'content-type': 'application/json'
    };

    // 构建规范化请求头字符串
    const canonicalHeaders =
      Object.keys(headers)
        .sort()
        .map((key) => `${key.toLowerCase()}:${headers[key].trim()}`)
        .join('\n') + '\n';

    // 构建已签名消息头列表
    const signedHeaders = Object.keys(headers)
      .sort()
      .map((key) => key.toLowerCase())
      .join(';');

    // 构建规范化请求
    const canonicalRequest = [
      method,
      canonicalURI,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      hashedRequestPayload
    ].join('\n');

    // 计算规范化请求的哈希值
    const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);

    // 构建待签名字符串
    const stringToSign = ['ACS3-HMAC-SHA256', hashedCanonicalRequest].join('\n');

    // 计算签名
    const signature = CryptoJS.HmacSHA256(stringToSign, accessKeySecret).toString(CryptoJS.enc.Hex);

    // 构建 Authorization 头
    const authorization = `ACS3-HMAC-SHA256 Credential=${accessKeyId},SignedHeaders=${signedHeaders},Signature=${signature}`;

    // 构建最终的请求 URL
    const requestUrl = `https://${host}${path}?${canonicalQueryString}`;

    // 发送请求
    const response = await uni.request({
      url: requestUrl,
      method: method,
      header: {
        ...headers,
        Authorization: authorization
      },
      data: requestBody
    });

    console.log('创建任务', response);

    if (response.statusCode === 200) {
      return response.data.Data.TaskId;
    } else {
      throw new Error(response.data.Message || '创建任务失败');
    }
  } catch (error) {
    console.error('创建任务失败:', error);
    throw error;
  }
};

// 修改 checkResult 函数
const checkResult = async (taskId) => {
  try {
    let status = 'RUNNING';
    let maxRetries = 60; // 最大重试次数
    let retryCount = 0;

    while ((status === 'RUNNING' || status === 'ONGOING') && retryCount < maxRetries) {
      // 获取任务状态
      const result = await getTaskInfo(taskId);
      status = result.TaskStatus || result.Status;
      console.log('任务状态:', status, result);

      if (status === 'SUCCESS' || status === 'COMPLETED') {
        // 任务成功，处理结果
        console.log('转写成功', result);
        logText.value = '转写成功';
        audioToTextLoading.value = false;
        audioToText.value = true;

        // 如果有转写结果URL，需要下载结果
        if (result.Result && result.Result.Transcription) {
          const transcriptionUrl = result.Result.Transcription;
          const transcriptionResult = await fetchTranscriptionResult(transcriptionUrl);
          console.log('转写结果', transcriptionResult);
          if (transcriptionResult && transcriptionResult.Sentences) {
            // 更新录音文本
            updateRecordText(transcriptionResult.Sentences);
          }
        }

        return result;
      } else if (status === 'FAILED') {
        // 任务失败
        throw new Error(result.StatusText || '转写失败');
      } else {
        // 任务仍在进行中，等待后再次查询
        logText.value = `转写中...${Math.round((retryCount / maxRetries) * 100)}%`;
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒
        retryCount++;
      }
    }

    if (retryCount >= maxRetries) {
      throw new Error('转写超时');
    }
  } catch (error) {
    console.error('查询任务结果失败:', error);
    audioToTextLoading.value = false;
    logText.value = `转换失败: ${error.message}`;
    throw error;
  }
};

// 添加获取转写结果的函数
const fetchTranscriptionResult = async (url) => {
  try {
    const response = await uni.request({
      url: url,
      method: 'GET'
    });

    if (response.statusCode === 200) {
      console.log('获取转写结果', response.data.Transcription.Paragraphs);
      return response.data.Transcription.Paragraphs;
    } else {
      throw new Error('获取转写结果失败');
    }
  } catch (error) {
    console.error('获取转写结果失败:', error);
    throw error;
  }
};

// 实现 GetTaskInfo 接口
const getTaskInfo = async (taskId) => {
  try {
    // 1. 构建请求参数
    const date = new Date();
    const timestamp = date.toISOString().replace(/\.\d+Z$/, 'Z');
    const nonce = Math.random().toString(36).substr(2, 15);

    // 2. 构建 V3 版本签名
    const host = 'tingwu.cn-beijing.aliyuncs.com';
    const method = 'GET';
    const path = `/openapi/tingwu/v2/tasks/${taskId}`;

    // 构建查询参数
    const queryParams = {};

    // 按字典顺序排序查询参数
    const sortedQueryParams = {};
    Object.keys(queryParams)
      .sort()
      .forEach((key) => {
        sortedQueryParams[key] = queryParams[key];
      });

    // 构建规范化查询字符串
    const canonicalQueryString = Object.entries(sortedQueryParams)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    // 构建规范化 URI
    const canonicalURI = path;

    // 构建规范化请求头
    const headers = {
      host: host,
      'x-acs-action': 'GetTaskInfo',
      'x-acs-content-sha256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // 空请求体的哈希值
      'x-acs-date': timestamp,
      'x-acs-signature-nonce': nonce,
      'x-acs-version': '2023-09-30'
    };

    // 构建规范化请求头字符串
    const canonicalHeaders =
      Object.keys(headers)
        .sort()
        .map((key) => `${key.toLowerCase()}:${headers[key].trim()}`)
        .join('\n') + '\n';

    // 构建已签名消息头列表
    const signedHeaders = Object.keys(headers)
      .sort()
      .map((key) => key.toLowerCase())
      .join(';');

    // 构建规范化请求
    const canonicalRequest = [
      method,
      canonicalURI,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' // 空请求体的哈希值
    ].join('\n');

    // 计算规范化请求的哈希值
    const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex);

    // 构建待签名字符串
    const stringToSign = ['ACS3-HMAC-SHA256', hashedCanonicalRequest].join('\n');

    // 计算签名
    const signature = CryptoJS.HmacSHA256(stringToSign, accessKeySecret).toString(CryptoJS.enc.Hex);

    // 构建 Authorization 头
    const authorization = `ACS3-HMAC-SHA256 Credential=${accessKeyId},SignedHeaders=${signedHeaders},Signature=${signature}`;

    // 构建最终的请求 URL
    const requestUrl = `https://${host}${path}${canonicalQueryString ? '?' + canonicalQueryString : ''}`;

    // 发送请求
    const response = await uni.request({
      url: requestUrl,
      method: method,
      header: {
        ...headers,
        Authorization: authorization
      }
    });

    console.log('获取任务信息', response);

    if (response.statusCode === 200) {
      return response.data.Data;
    } else {
      throw new Error(response.data.Message || '获取任务信息失败');
    }
  } catch (error) {
    console.error('获取任务信息失败:', error);
    throw error;
  }
};

const updateRecordText = (sentences) => {
  let recordList = uni.getStorageSync('recordList') || [];

  const newRecordList = recordList.map((record) => {
    if (record.startTimestamp === recordInfo.value.startTimestamp) {
      record.recordText = {
        sentences,
        speakers: [...new Set(sentences.map((s) => s.speaker))].length
      };
    }
    return record;
  });

  uni.setStorageSync('recordList', newRecordList);
};

// 处理开始转文字按钮点击
const handleAudioToText = async () => {
  audioToTextLoading.value = true;
  logText.value = '正在转换中...';

  try {
    // 1. 获取 AccessToken
    await getAccessToken();

    // 2. 上传音频到 OSS，获取文件名称
    const fileName = await uploadToOss(recordInfo.value.filePath);
    console.log('上传音频到 OSS，获取文件名称', fileName);

    // 3. 生成预签名 URL
    const signatureUrl = await generateSignatureUrl(fileName);
    console.log('生成预签名 URL', signatureUrl);

    // 4. 创建转写任务
    const taskId = await createTask(signatureUrl);
    console.log('任务创建成功，TaskId:', taskId);

    // 5. 轮询获取结果
    await checkResult(taskId);
  } catch (error) {
    console.error('录音转文字失败:', error);
    audioToTextLoading.value = false;
    logText.value = `转换失败: ${error.message}`;
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
