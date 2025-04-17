import { get, post } from './request';

export const GetSupportedTasks = () => {
  return get('/tasks');
};

export const ProcessTextTask = (task, text) => {
  return post('/process-task', {
    task,
    text
  });
};

import CryptoJS from 'crypto-js';
import OSS from 'ali-oss';

const APPKEY = import.meta.env.VITE_APPKEY;
const ACCESSKEYID = import.meta.env.VITE_ACCESSKEYID;
const ACCESSKEYSECRET = import.meta.env.VITE_ACCESSKEYSECRET;
const TINGWU_APPKEY = import.meta.env.VITE_TINGWU_APPKEY;
const BAILIAN_API_KEY = import.meta.env.VITE_ALIYUN_BAILIAN_APIKEY;

const accessTokenKey = 'aliyun_access_token';
const accessTokenExpireKey = 'aliyun_access_token_expire';

/**获取授权令牌 */
export const getAccessToken = async () => {
  try {
    // 检查 Token 是否有效
    let accessTokenVal = uni.getStorageSync(accessTokenKey);
    let accessTokenExpireVal = parseInt(uni.getStorageSync(accessTokenExpireKey));
    console.log('缓存中的Token:', accessTokenVal);

    // 如果当前 Token 未过期
    if (accessTokenVal && accessTokenExpireVal && accessTokenExpireVal > Date.now()) {
      return accessTokenVal;
    }

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

    if (response.statusCode === 200) {
      accessTokenVal = response.data.Token.Id;
      accessTokenExpireVal = response.data.Token.ExpireTime * 1000;
      uni.setStorageSync(accessTokenKey, accessTokenVal);
      uni.setStorageSync(accessTokenExpireKey, accessTokenExpireVal.toString());
      return accessTokenVal;
    } else {
      throw new Error(`获取Token失败，状态码: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('获取Token错误:', error);
    throw error;
  }
};

/**上传录音 */
export const uploadToOss = async (fileName, filePath) => {
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

    const newFileName = `${fileName}.mp3`;

    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: 'http://jarvis-uniapp.oss-cn-shanghai.aliyuncs.com',
        filePath: filePath,
        name: 'file',
        formData: {
          key: newFileName,
          success_action_status: '200',
          OSSAccessKeyId: ACCESSKEYID,
          policy: policy,
          signature: signature
        },
        success: async (res) => {
          if (res.statusCode === 200) {
            console.log('上传录音成功', res);
            resolve(newFileName);
          } else {
            reject(new Error(`上传失败，状态码: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('上传录音失败:', err);
          reject(new Error(`上传失败: ${err.errMsg}`));
        }
      });
    });
  } catch (error) {
    console.error('上传录音错误:', error);
    throw error;
  }
};

/**生成在线链接 */
export const generateOnlineUrl = async (fileName) => {
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

    if (signatureUrl) {
      console.log('生成在线链接', signatureUrl);
      return signatureUrl;
    } else {
      throw new Error('生成在线链接失败');
    }
  } catch (error) {
    throw error;
  }
};

/**创建转录任务 */
export const createTranscriptionTask = async (audioUrl) => {
  try {
    // 构建请求参数
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

    // 计算请求体的 SHA256 哈希值
    const requestPayload = JSON.stringify(requestBody);
    const hashedRequestPayload = CryptoJS.SHA256(requestPayload).toString(CryptoJS.enc.Hex);

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

    // 构建 V3 版本签名
    const host = 'tingwu.cn-beijing.aliyuncs.com';
    const method = 'PUT';
    const path = '/openapi/tingwu/v2/tasks';

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
      path,
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

    console.log('创建转录任务', response);
    if (response.statusCode === 200) {
      return response.data.Data.TaskId;
    } else {
      throw new Error(`创建转录任务失败，状态码: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('创建转录任务错误:', error);
    throw error;
  }
};

/**创建要点提炼任务 */
export const createKeyPointsTask = async (audioUrl) => {
  try {
    // 构建请求参数
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
        MeetingAssistanceEnabled: true,
        MeetingAssistance: {
          Types: ['Actions', 'KeyInformation']
        }
      }
    };

    // 计算请求体的 SHA256 哈希值
    const requestPayload = JSON.stringify(requestBody);
    const hashedRequestPayload = CryptoJS.SHA256(requestPayload).toString(CryptoJS.enc.Hex);

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

    // 构建 V3 版本签名
    const host = 'tingwu.cn-beijing.aliyuncs.com';
    const method = 'PUT';
    const path = '/openapi/tingwu/v2/tasks';

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
      path,
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

    console.log('创建要点提炼任务', response);
    if (response.statusCode === 200) {
      return response.data.Data.TaskId;
    } else {
      throw new Error(`创建要点提炼任务失败`);
    }
  } catch (error) {
    throw error;
  }
};

/**查询任务信息 */
export const getTaskInfo = async (taskId) => {
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
      path,
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
      throw new Error(`查询任务信息失败，状态码: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('查询任务信息错误:', error);
    throw error;
  }
};

/**查询任务结果URL */
export const getTaskResult = async (taskId, taskName) => {
  try {
    let status = 'RUNNING';
    let maxRetries = 10;
    let retryCount = 1;

    while ((status === 'RUNNING' || status === 'ONGOING') && retryCount < maxRetries) {
      console.log(`${taskName} 任务，第${retryCount}次查询...`);
      const result = await getTaskInfo(taskId);
      console.log(`${taskName} 任务结果`, result);

      if (result.TaskStatus === 'SUCCESS' || result.TaskStatus === 'COMPLETED') {
        return result.Result;
      } else if (result.TaskStatus === 'FAILED') {
        throw new Error(`${taskName} 任务失败: ${result.ErrorMessage || '未知错误'}`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        retryCount++;
      }
    }

    if (retryCount >= maxRetries) {
      throw new Error(`${taskName} 任务超时，请稍后再试`);
    }
  } catch (error) {
    console.error('查询任务结果URL错误:', error);
    throw error;
  }
};

/**查询任务结果的数据 */
export const getTaskResultData = async (url, taskName) => {
  try {
    const response = await uni.request({
      url: url,
      method: 'GET'
    });

    if (response.statusCode === 200) {
      console.log(`${taskName} 任务结果的数据`, response.data);
      return response.data;
    } else {
      throw new Error(`${taskName} 查询任务结果的数据失败，状态码: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('查询任务结果的数据错误:', error);
    throw error;
  }
};

// HTTP调用
// 图像模型处理时间较长，为了避免请求超时，HTTP调用仅支持异步获取模型结果。您需要发起两个请求：

// 创建任务：首先发送一个请求创建任务，该请求会返回任务ID。

// 根据任务ID查询结果：使用上一步获得的任务ID，查询模型生成的结果。

// 创建任务
// POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis

// 根据任务ID查询结果
// GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}

/**生成图片 */
export const createImageSynthesisTask = async (prompt) => {
  try {
    const response = await uni.request({
      url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis',
      method: 'POST',
      header: {
        'X-DashScope-Async': 'enable',
        Authorization: `Bearer ${BAILIAN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: 'wanx2.1-t2i-turbo',
        input: {
          prompt: prompt,
          negative_prompt: '低分辨率、错误、最差质量、低质量、残缺、多余的手指、比例不良'
        },
        parameters: { size: '512*512', n: 1 }
      }
    });

    console.log('生成图片', response);
    if (response.statusCode === 200) {
      return response.data.output;
    } else {
      throw new Error(`生成图片失败，状态码: ${response.statusCode}`);
    }
  } catch (error) {
    console.error('生成图片错误:', error);
    throw error;
  }
};

/**根据任务ID查询结果 */
export const getSynthesisTask = async (taskId) => {
  try {
    let status = 'PENDING';
    let maxRetries = 10;
    let retryCount = 1;

    while ((status === 'PENDING' || status === 'RUNNING' || status === 'SUSPENDED') && retryCount < maxRetries) {
      console.log(`生成图片任务，第${retryCount}次查询...`);

      const response = await uni.request({
        url: `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        method: 'GET',
        header: { Authorization: `Bearer ${BAILIAN_API_KEY}` }
      });

      console.log(`生成图片任务结果`, response);

      if (response.statusCode === 200) {
        const output = response.data.output;
        const taskStatus = output.task_status;

        if (taskStatus === 'SUCCEEDED') {
          return output;
        } else if (taskStatus === 'FAILED' || taskStatus === 'UNKNOWN') {
          throw new Error(`生成图片任务失败: ${output.message}`);
        } else if (taskStatus === 'PENDING' || taskStatus === 'RUNNING' || taskStatus === 'SUSPENDED') {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          retryCount++;
        }
      } else {
        throw new Error(`查询任务失败，状态码: ${response.statusCode}`);
      }
    }

    if (retryCount >= maxRetries) {
      throw new Error(`${taskName} 任务超时，请稍后再试`);
    }
  } catch (error) {
    console.error('查询任务结果URL错误:', error);
    throw error;
  }
};
