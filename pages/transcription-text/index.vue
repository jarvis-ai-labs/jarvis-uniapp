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
      <view class="transcription-text-box">
        <view class="record-info" v-if="recordInfo">
          <view class="file-name">{{ recordInfo.fileName }}</view>
          <view class="record-time">
            <view class="time">{{ recordInfo.duration }}</view>
            <view class="time2">{{ recordInfo.startTime }}</view>
          </view>
        </view>
        <view class="transcription-text-content">
          <image mode="widthFix" src="/static/logo2-active.png" />
          <view class="log-list" v-if="logTextList.length > 0">
            <text v-for="(log, index) in logTextList" :key="index">{{ log }}</text>
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
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import CryptoJS from 'crypto-js';
import OSS from 'ali-oss';

// 从环境变量获取配置
const APPKEY = import.meta.env.VITE_APPKEY;
const ACCESSKEYID = import.meta.env.VITE_ACCESSKEYID;
const ACCESSKEYSECRET = import.meta.env.VITE_ACCESSKEYSECRET;
const OSSBUCKETURL = import.meta.env.VITE_OSSBUCKETURL;
const TINGWU_APPKEY = import.meta.env.VITE_TINGWU_APPKEY;

const accessTokenKey = 'aliyun_access_token';
const accessTokenExpireKey = 'aliyun_access_token_expire';
let accessToken = ref('');
let accessTokenExpire = ref('');

const recordInfo = ref(null);
const transcriptionResult = ref(null);
const audioToTextLoading = ref(false);
const logTextList = ref([]);

onLoad(async (options) => {
  if (!options?.id) {
    uni.showToast({ title: '文件ID无效', icon: 'error', duration: 2000 });
    return;
  }

  const recordList = uni.getStorageSync('recordList') || [];
  if (recordList.length > 0) {
    recordInfo.value = recordList.find((item) => item.startTimestamp == options.id);
  }
});

// 获取 AccessToken
const getAccessToken = async () => {
  // 检查 Token 是否有效
  accessToken.value = uni.getStorageSync(accessTokenKey);
  accessTokenExpire.value = parseInt(uni.getStorageSync(accessTokenExpireKey));

  // 如果当前 Token 未过期
  if (accessToken.value && accessTokenExpire.value && accessTokenExpire.value > Date.now()) {
    logTextList.value.push('使用已有授权令牌');
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

      logTextList.value.push('获取授权令牌成功');
    } else {
      logTextList.value.push(`获取授权失败: ${response.data.ErrMsg || '未知错误'}`);
    }
  } catch (error) {
    logTextList.value.push(`获取授权失败: ${error.message}`);
  }
};

// 获取 OSS 签名
const getOssSignature = async () => {
  logTextList.value.push('获取上传签名...');
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
    const signature = CryptoJS.HmacSHA1(policyBase64, ACCESSKEYSECRET).toString(CryptoJS.enc.Base64);

    return { policy: policyBase64, signature: signature };
  } catch (error) {
    logTextList.value.push('获取上传签名失败');
  }
};

// 上传文件到 OSS
const uploadToOss = async (filePath, policy, signature) => {
  logTextList.value.push('开始上传录音...');
  try {
    const fileName = `${recordInfo.value.startTimestamp}.mp3`;
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: OSSBUCKETURL,
        filePath: filePath,
        name: 'file',
        formData: {
          key: fileName,
          success_action_status: '200',
          OSSAccessKeyId: ACCESSKEYID,
          policy: policy,
          signature: signature
        },
        success: (res) => {
          if (res.statusCode === 200) {
            logTextList.value.push('音频文件上传成功');
            resolve(fileName);
          } else {
            logTextList.value.push('音频文件上传失败');
            reject(new Error('文件上传失败'));
          }
        },
        fail: (err) => {
          logTextList.value.push(`上传失败: ${err.errMsg || '未知错误'}`);
          reject(err);
        }
      });
    });
  } catch (error) {
    logTextList.value.push(`上传失败: ${error.message}`);
  }
};

// 定义一个生成预签名 URL 的函数
async function generateSignatureUrl(fileName) {
  logTextList.value.push('生成文件访问链接...');
  try {
    const client = new OSS({
      accessKeyId: ACCESSKEYID,
      accessKeySecret: ACCESSKEYSECRET,
      bucket: 'jarvis-uniapp',
      region: 'oss-cn-shanghai',
      secure: true,
      authorizationV4: true
    });

    const url = await client.signatureUrlV4('GET', 3600, { headers: {} }, fileName);
    logTextList.value.push('生成访问链接成功');
    return url;
  } catch (error) {
    logTextList.value.push(`生成访问链接失败: ${error.message}`);
  }
}

// 创建转写任务
const createTask = async (audioUrl) => {
  logTextList.value.push('创建转写任务...');
  try {
    // 1. 构建请求参数
    const date = new Date();
    const timestamp = date.toISOString().replace(/\.\d+Z$/, 'Z');
    const nonce = Math.random().toString(36).substr(2, 15);

    const requestBody = {
      AppKey: TINGWU_APPKEY,
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
      logTextList.value.push('创建转写任务成功');
      return response.data.Data.TaskId;
    } else {
      logTextList.value.push(`创建任务失败: ${response.data.Message || '未知错误'}`);
    }
  } catch (error) {
    logTextList.value.push(`创建任务失败: ${error.message}`);
  }
};

// 获取任务信息
const getTaskInfo = async (taskId) => {
  logTextList.value.push('获取任务信息...');
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

    if (response.statusCode === 200 && response.data.Code == '0') {
      logTextList.value.push('获取任务信息成功');
      return response.data.Data;
    } else {
      logTextList.value.push(`获取任务信息失败: ${response.data.Message || '未知错误'}`);
    }
  } catch (error) {
    logTextList.value.push(`获取任务信息失败: ${error.message}`);
  }
};

// 获取转写结果
const fetchTranscriptionResult = async (url) => {
  logTextList.value.push('获取转写结果...');
  try {
    const response = await uni.request({
      url: url,
      method: 'GET'
    });

    if (response.statusCode === 200) {
      logTextList.value.push('获取转写结果成功');
      return response.data;
    } else {
      logTextList.value.push('获取转写结果失败');
    }
  } catch (error) {
    logTextList.value.push(`获取转写结果失败: ${error.message}`);
  }
};

// 检查任务结果
const checkResult = async (taskId) => {
  logTextList.value.push('检查任务结果...');
  try {
    let status = 'RUNNING';
    let maxRetries = 10; // 最大重试次数
    let retryCount = 0;

    while ((status === 'RUNNING' || status === 'ONGOING') && retryCount < maxRetries) {
      // 获取任务状态
      const result = await getTaskInfo(taskId);
      status = result.TaskStatus || result.Status;

      if (status === 'SUCCESS' || status === 'COMPLETED') {
        // 任务成功，处理结果
        logTextList.value.push('转写任务完成');

        // 如果有转写结果URL，需要下载结果
        if (result.Result && result.Result.Transcription) {
          const transcriptionUrl = result.Result.Transcription;
          transcriptionResult.value = await fetchTranscriptionResult(transcriptionUrl);

          // 更新存储
          let recordList = uni.getStorageSync('recordList') || [];
          const newRecordList = recordList.map((record) => {
            if (record.startTimestamp === recordInfo.value.startTimestamp) {
              record.transcriptionResult = transcriptionResult.value;
            }
            return record;
          });

          uni.setStorageSync('recordList', newRecordList);
        }

        audioToTextLoading.value = false;
        return result;
      } else if (status === 'FAILED') {
        // 任务失败
        logTextList.value.push(`转写失败: ${result.StatusText || '未知错误'}`);
      } else {
        // 任务仍在进行中，等待后再次查询
        logTextList.value.push(`转写中...`);
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 等待3秒
        retryCount++;
      }
    }

    if (retryCount >= maxRetries) {
      logTextList.value.push('转写超时，请稍后再试');
    }
  } catch (error) {
    audioToTextLoading.value = false;
    logTextList.value.push(`转换失败: ${error.message}`);
    throw error;
  }
};

// 处理开始转文字按钮点击
const handleAudioToText = async () => {
  audioToTextLoading.value = true;
  logTextList.value = [];
  logTextList.value.push('开始转文字...');

  try {
    // 1. 获取 AccessToken
    await getAccessToken();

    // 2. 获取 OSS 签名
    const { policy, signature } = await getOssSignature();

    // 3. 上传音频到 OSS，获取文件名称
    const fileName = await uploadToOss(recordInfo.value.filePath, policy, signature);

    // 4. 生成预签名 URL
    const signatureUrl = await generateSignatureUrl(fileName);

    // 5. 创建转写任务
    const taskId = await createTask(signatureUrl);

    // 6. 轮询获取结果
    await checkResult(taskId);
  } catch (error) {
    audioToTextLoading.value = false;
    logTextList.value.push(`转换失败: ${error.message}`);
  }
};

// 跳转到转写结果页面
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
  background: #ffffff;
  box-shadow: 0 0 8px 2px rgba(140, 145, 151, 0.15);
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
    width: 100px;
  }
  text {
    font-family: Avenir;
    font-weight: 300;
    font-size: 16px;
    color: #616161;
    margin-top: 10px;
  }

  .log-list {
    margin-top: 20px;
    width: 80%;
    max-height: 150px;
    overflow-y: auto;

    text {
      display: block;
      font-size: 14px;
      margin: 5px 0;
      text-align: left;

      &.error {
        color: #ff4d4f;
      }

      &.success {
        color: #52c41a;
      }

      &.info {
        color: #1890ff;
      }
    }
  }
}

.transcription-text-btn-box {
  height: 40px;
  margin-bottom: 50px;
  .transcription-text-btn {
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
