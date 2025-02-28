// const BASE_URL = process.env.NODE_ENV === 'development' ? 'https://jarvis-api.aigree.io' : '';

const BASE_URL = 'https://jarvis-api.aigree.io';

// 响应拦截器
const responseInterceptor = (response) => {
  // 处理响应数据
  if (response.statusCode === 200 && response.data.status === 'ok') {
    return response.data;
  } else {
    return Promise.reject(response);
  }
};

// 封装GET请求
export const get = (url, params = {}) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method: 'GET',
      data: params,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        resolve(responseInterceptor(res));
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

// 封装POST请求
export const post = (url, params = {}) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method: 'POST',
      data: params,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        resolve(responseInterceptor(res));
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};
