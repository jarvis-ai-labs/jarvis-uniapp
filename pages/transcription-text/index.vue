<template>
  <view class="container">
    <uni-nav-bar
      dark
      fixed
      status-bar
      :border="false"
      height="50px"
      title="录音转文字"
      left-icon="back"
      @clickLeft="handleGoBack" />

    <view class="container-box">
      <view class="transcription-text-box">
        <view class="record-info" v-if="recordInfo">
          <view class="file-name">{{ recordInfo.fileName }}</view>
          <view class="record-time">
            <view class="time">{{ recordInfo.durationText }}</view>
            <view class="time2">{{ recordInfo.startTimeText }}</view>
          </view>
        </view>
        <view class="transcription-text-content">
          <image mode="heightFix" src="/static/logo2.png" />
          <view class="log-list">
            <view v-for="(log, index) in displayLogs" :key="index">{{ log }}</view>
          </view>
        </view>
        <view class="transcription-text-btn-box">
          <template v-if="!audioToTextLoading">
            <button class="transcription-text-btn" v-if="transcriptionResult" @click="toTranscriptionResultPage">
              查看转录结果
            </button>
            <button class="transcription-text-btn" v-else @click="handleAudioToText">开始转文字</button>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import CryptoJS from 'crypto-js';
import OSS from 'ali-oss';

// 从环境变量获取配置
const APPKEY = import.meta.env.VITE_APPKEY;
const ACCESSKEYID = import.meta.env.VITE_ACCESSKEYID;
const ACCESSKEYSECRET = import.meta.env.VITE_ACCESSKEYSECRET;
const TINGWU_APPKEY = import.meta.env.VITE_TINGWU_APPKEY;

const accessTokenKey = 'aliyun_access_token';
const accessTokenExpireKey = 'aliyun_access_token_expire';
let accessToken = ref('');
let accessTokenExpire = ref('');

const recordInfo = ref(null);
const transcriptionResult = ref(null);
const audioToTextLoading = ref(false);
const logTextList = ref([]);

// 计算属性，只显示最新的5条日志
const displayLogs = computed(() => {
  const maxLogs = 5;
  if (logTextList.value.length <= maxLogs) {
    return logTextList.value;
  }
  return logTextList.value.slice(logTextList.value.length - maxLogs);
});

onLoad(async (options) => {
  if (!options?.id) {
    uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
    return;
  }

  const recordList = uni.getStorageSync('jarvis-record') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
    console.log('录音详情', recordInfo.value);
  }
});

/**获取授权令牌 */
const getAccessToken = async () => {
  // 检查 Token 是否有效
  accessToken.value = uni.getStorageSync(accessTokenKey);
  accessTokenExpire.value = parseInt(uni.getStorageSync(accessTokenExpireKey));

  // 如果当前 Token 未过期
  if (accessToken.value && accessTokenExpire.value && accessTokenExpire.value > Date.now()) {
    return;
  }

  try {
    const date = new Date();
    const timestamp = date.toISOString();
    const nonce = Math.random().toString(36).substr(2, 15);

    // 构建规范化请求字符串
    const parameters = {
      AccessKeyId: ACCESSKEYID,
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
    const signature = CryptoJS.HmacSHA1(stringToSign, `${ACCESSKEYSECRET}&`).toString(CryptoJS.enc.Base64);

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
      accessTokenExpire.value = response.data.Token.ExpireTime * 1000;
      // 将 Token 和过期时间存储到缓存
      uni.setStorageSync(accessTokenKey, accessToken.value);
      uni.setStorageSync(accessTokenExpireKey, accessTokenExpire.value.toString());
    } else {
      logTextList.value.push(`获取授权令牌失败`);
    }
  } catch (error) {
    logTextList.value.push(`获取授权令牌失败`);
  }
};

/**上传录音 */
const uploadToOss = async (filePath) => {
  try {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    const expiration = date.toISOString();

    const policyObj = {
      expiration: expiration,
      conditions: [
        ['content-length-range', 0, 1048576000], // 限制文件大小在 1000MB 以内
        ['starts-with', '$key', ''] // 允许所有文件名
      ]
    };

    const policy = btoa(JSON.stringify(policyObj));
    const signature = CryptoJS.HmacSHA1(policy, ACCESSKEYSECRET).toString(CryptoJS.enc.Base64);

    const fileName = `${recordInfo.value.fileName}-${recordInfo.value.startTimestamp}.mp3`;

    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'http://jarvis-uniapp.oss-cn-shanghai.aliyuncs.com',
        filePath: filePath,
        name: 'file',
        formData: {
          key: fileName,
          success_action_status: '200',
          OSSAccessKeyId: ACCESSKEYID,
          policy: policy,
          signature: signature
        },
        success: async (res) => {
          resolve(fileName);
        },
        fail: (err) => {
          logTextList.value.push(`上传录音失败`);
          reject(err);
        }
      });
    });
  } catch (error) {
    logTextList.value.push(`上传录音失败`);
  }
};

/**生成在线链接 */
const generateSignatureUrl = async (fileName) => {
  try {
    const client = new OSS({
      accessKeyId: ACCESSKEYID,
      accessKeySecret: ACCESSKEYSECRET,
      bucket: 'jarvis-uniapp',
      region: 'oss-cn-shanghai',
      secure: true,
      authorizationV4: true
    });
    const signatureUrl = await client.signatureUrlV4('GET', 3600, { headers: {} }, fileName);
    return signatureUrl;
  } catch (error) {
    logTextList.value.push('生成在线链接失败');
  }
};

/**创建转录任务 */
const createTask = async (audioUrl) => {
  try {
    // 1. 构建请求参数
    const date = new Date();
    const timestamp = date.toISOString().replace(/\.\d+Z$/, 'Z');
    const nonce = Math.random().toString(36).substr(2, 15);

    const requestBody = {
      AppKey: TINGWU_APPKEY,
      Input: {
        SourceLanguage: 'fspk', // fspk：中英文自由说
        FileUrl: audioUrl
      },
      Parameters: {
        Transcription: {
          DiarizationEnabled: true,
          Diarization: {
            SpeakerCount: 0 // 0：说话人角色区分结果为不定人数。 2：说话人角色区分结果为 2 人。
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
    const queryParams = { type: 'offline' };

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
    const signature = CryptoJS.HmacSHA256(stringToSign, ACCESSKEYSECRET).toString(CryptoJS.enc.Hex);

    // 构建 Authorization 头
    const authorization = `ACS3-HMAC-SHA256 Credential=${ACCESSKEYID},SignedHeaders=${signedHeaders},Signature=${signature}`;

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

    if (response.statusCode === 200) {
      return response.data.Data.TaskId;
    } else {
      logTextList.value.push(`创建转录任务失败`);
    }
  } catch (error) {
    logTextList.value.push(`创建转录任务失败`);
  }
};

/**查询转录任务结果 */
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
    const signature = CryptoJS.HmacSHA256(stringToSign, ACCESSKEYSECRET).toString(CryptoJS.enc.Hex);

    // 构建 Authorization 头
    const authorization = `ACS3-HMAC-SHA256 Credential=${ACCESSKEYID},SignedHeaders=${signedHeaders},Signature=${signature}`;

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

    if (response.statusCode === 200) {
      return response.data.Data;
    } else {
      logTextList.value.push(`查询转录状态失败`);
    }
  } catch (error) {
    logTextList.value.push(`查询转录状态失败`);
  }
};

/**查询转录状态 */
const checkResult = async (taskId) => {
  try {
    let status = 'RUNNING';
    let maxRetries = 10; // 最大重试次数
    let retryCount = 0;

    while ((status === 'RUNNING' || status === 'ONGOING') && retryCount < maxRetries) {
      // 获取任务状态
      const result = await getTaskInfo(taskId);
      status = result.TaskStatus || result.Status;

      if (status === 'SUCCESS' || status === 'COMPLETED') {
        // 如果有转写结果URL，需要下载结果
        if (result.Result && result.Result.Transcription) {
          const transcriptionUrl = result.Result.Transcription;
          return transcriptionUrl;
        }
      } else if (status === 'FAILED') {
        logTextList.value.push(`转录失败`);
        return null; // 转录失败时直接返回 null
      } else {
        // 任务仍在进行中，等待后再次查询
        logTextList.value.push(`第${retryCount + 1}次查询转录状态...`);
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 等待3秒
        retryCount++;
      }
    }

    if (retryCount >= maxRetries) {
      logTextList.value.push('转录超时，请稍后再试');
      return null; // 转录超时后直接返回 null
    }
  } catch (error) {
    logTextList.value.push(`转录失败`);
    return null; // 发生错误时直接返回 null
  }
};

/**查询转录结果 */
const fetchTranscriptionResult = async (transcriptionUrl) => {
  try {
    const response = await uni.request({
      url: transcriptionUrl,
      method: 'GET'
    });

    if (response.statusCode === 200 && response.data.Transcription.Paragraphs.length > 0) {
      transcriptionResult.value = response.data;
      console.log('转录结果', transcriptionResult.value);

      let recordList = uni.getStorageSync('jarvis-record') || [];
      const newRecordList = recordList.map((record) => {
        if (record.startTimestamp === recordInfo.value.startTimestamp) {
          record.transcriptionResult = transcriptionResult.value;
        }
        return record;
      });

      uni.setStorageSync('jarvis-record', newRecordList);

      logTextList.value.push('转录成功');
    } else {
      logTextList.value.push('转录失败');
    }
  } catch (error) {
    logTextList.value.push(`转录失败`);
  }
};

/**开始转录 */
const handleAudioToText = async () => {
  audioToTextLoading.value = true;
  logTextList.value = [];
  logTextList.value.push('开始转录...');

  try {
    // 1. 获取 AccessToken
    logTextList.value.push('获取授权令牌...');
    await getAccessToken();

    // 2. 上传录音到 OSS，获取文件名称
    logTextList.value.push('上传录音...');
    const fileName = await uploadToOss(recordInfo.value.filePath);

    // 3. 生成在线链接
    logTextList.value.push('生成在线链接...');
    const signatureUrl = await generateSignatureUrl(fileName);

    // 4. 创建转录任务
    logTextList.value.push('创建转录任务...');
    const taskId = await createTask(signatureUrl);

    // 5. 轮询查询结果
    logTextList.value.push('查询转录状态...');
    const transcriptionUrl = await checkResult(taskId);

    // 如果 transcriptionUrl 为 null，则不再继续执行
    if (!transcriptionUrl) {
      audioToTextLoading.value = false;
      return;
    }

    // 6. 查询转录结果
    logTextList.value.push('查询转录结果...');
    await fetchTranscriptionResult(transcriptionUrl);

    audioToTextLoading.value = false;
  } catch (error) {
    audioToTextLoading.value = false;
    logTextList.value.push(`转录失败`);
  }
};

// 跳转到转录结果页面
const toTranscriptionResultPage = () => {
  uni.navigateTo({
    url: '/pages/transcription-result/index?id=' + recordInfo.value.startTimestamp
  });
};

// 返回上一页
const handleGoBack = () => {
  uni.switchTab({ url: '/pages/file/index' });
};
</script>

<style lang="scss" scoped>
.transcription-text-box {
  width: 100%;
  height: calc(100vh - 125px);
  border-radius: 24px;
  background: linear-gradient(0deg, rgba(175, 175, 175, 0.2), rgba(175, 175, 175, 0.2)),
    radial-gradient(16.39% 7.56% at 0% 5.55%, #007aff 0%, rgba(61, 62, 61, 0) 100%)
      /* warning: gradient uses a rotation that is not supported by CSS and may not behave as expected */;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.transcription-text-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  image {
    width: auto;
    height: 120px;
  }
  .log-list {
    width: 100%;
    height: 120px;
    font-family: Avenir;
    font-weight: 300;
    font-size: 16px;
    color: #616161;
    margin-top: 10px;
    text-align: center;
  }
}

.transcription-text-btn-box {
  height: 40px;
  margin-bottom: 30px;
  .transcription-text-btn {
    width: 150px;
    height: 40px;
    border-radius: 20px;
    background: #606060;
    font-family: Avenir;
    font-weight: 300;
    font-size: 16px;
    color: #ffffff;
  }
}
</style>
