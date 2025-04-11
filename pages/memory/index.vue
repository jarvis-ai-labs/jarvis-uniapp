<template>
  <custom-header />

  <scroll-view scroll-y="true" class="main">
    <view class="swiper-box">
      <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="event-swiper">
        <z-swiper-item>
          <view
            class="event-box"
            style="
              background: url('/static/images/bg-event-2.png') no-repeat center center;
              background-size: 100% 100%;
            ">
            <view class="box-content active">
              <uni-icons type="checkbox" size="24" color="#ffffff" />
              <view class="text"><text>行程详情</text></view>
              <view class="text"><text>出发时间</text> <text>17:20</text></view>
              <view class="text"><text>路线</text> <text>驾车路线(预计20分钟，途径东三环)</text></view>
              <view class="text"><text>提醒</text> <text>提前10分钟通知</text></view>
              <button class="event-btn">晚餐|18:00|国贸大厦</button>
            </view>
          </view>
        </z-swiper-item>
        <z-swiper-item>
          <view
            class="event-box"
            style="
              background: url('/static/images/bg-event-1.png') no-repeat center center;
              background-size: 100% 100%;
            ">
            <view class="box-content">
              <uni-icons type="checkbox" size="24" color="#ffffff" />
              <button class="event-btn">Event</button>
            </view>
          </view>
        </z-swiper-item>
      </z-swiper>

      <view class="schedule-document">
        <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="schedule-swiper">
          <z-swiper-item>
            <view
              class="schedule-box"
              style="
                background: url('/static/images/bg-schedule-2.png') no-repeat center center;
                background-size: 100% 100%;
              ">
              <view class="box-content active">
                <text class="iconfont">&#xe61e;</text>
                <view class="text"><text>与技术部门探讨app 接入硬件需求</text></view>
                <view class="text text2"><text>提醒</text><text>提前5分钟通知</text></view>
                <view class="text"><text>会议 | 15:00 | 上海</text></view>
              </view>
            </view>
          </z-swiper-item>
          <z-swiper-item>
            <view
              class="schedule-box"
              style="
                background: url('/static/images/bg-schedule-1.png') no-repeat center center;
                background-size: 100% 100%;
              ">
              <view class="box-content">
                <text class="iconfont">&#xe61e;</text>
                <text class="box-title">Schedule</text>
              </view>
            </view>
          </z-swiper-item>
        </z-swiper>

        <z-swiper grabCursor effect="cards" :cardsEffect="{ rotate: false }" :modules="modules" class="document-swiper">
          <z-swiper-item>
            <view
              class="document-box"
              style="
                background: url('/static/images/bg-document-2.png') no-repeat center center;
                background-size: 100% 100%;
              ">
              <view class="box-content active">
                <text class="iconfont">&#xe613;</text>
                <view class="text"><text>JARVIS正在进行对市面智能穿戴分析， 生成了报告文档。</text></view>
              </view>
            </view>
          </z-swiper-item>
          <z-swiper-item>
            <view
              class="document-box"
              style="
                background: url('/static/images/bg-document-1.png') no-repeat center center;
                background-size: 100% 100%;
              ">
              <view class="box-content">
                <text class="iconfont">&#xe613;</text>
                <text class="box-title">News</text>
              </view>
            </view>
          </z-swiper-item>
        </z-swiper>
      </view>
    </view>

    <view class="text-list">
      <view class="text-list-item">
        <view class="text-item">
          <div class="item-left">
            <div class="type-box">
              <image src="/static/images/icon-type-write.png" mode="widthFix" />
            </div>
            <view class="text-box">
              <view class="title">2025.3.28</view>
              <view class="content">
                <uni-icons type="location" size="20" color="#979797" />
                shanghai
              </view>
            </view>
          </div>
          <view class="item-right">
            <button class="btn-text">Text</button>
          </view>
        </view>
        <view class="text-item2">
          <view class="text-title">实时转写中···</view>
          <scroll-view scroll-y="true" class="text-item2-list">
            <view class="text-box">
              <view class="title">
                <text>说话人1</text>
                <text>15:31:21 PM</text>
              </view>
              <view class="content"> "明天休息了，有空聚聚吗" </view>
            </view>
            <view class="text-box">
              <view class="title">
                <text>说话人2</text>
                <text>15:31:21 PM</text>
              </view>
              <view class="content"> "有的，去哪里" </view>
            </view>
          </scroll-view>
        </view>
      </view>

      <view class="text-list-item">
        <view class="text-item">
          <div class="item-left">
            <div class="type-box">
              <image src="/static/images/icon-type-write.png" mode="widthFix" />
            </div>
            <view class="text-box">
              <view class="title">2025.3.28</view>
              <view class="content">
                <uni-icons type="location" size="20" color="#979797" />
                shanghai
              </view>
            </view>
          </div>
          <view class="item-right">
            <button class="btn-text">Text</button>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>

  <view class="record-btn" @click="handleStartPause">
    <image src="/static/images/record-btn.png" mode="widthFix" />
    <voice-wave ref="voiceWaveRef" />
  </view>

  <custom-tabbar />
</template>

<script setup>
import CustomTabbar from '@/components/custom-tabbar.vue';
import CustomHeader from '@/components/custom-header.vue';
import VoiceWave from '@/components/voice-wave.vue';
import { formatDate, formatFileName, formatDuration } from '@/utils';
import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { EffectCards } from '@/uni_modules/zebra-swiper/modules';

const modules = ref([EffectCards]);

/** 先引入Recorder （ 需先 npm install recorder-core ）**/
import Recorder from 'recorder-core';

/** H5、小程序环境中：引入需要的格式编码器、可视化插件，App环境中在renderjs中引入 **/
// #ifdef H5 || MP-WEIXIN
//按需引入需要的录音格式编码器，用不到的不需要引入，减少程序体积；H5、renderjs中可以把编码器放到static文件夹里面用动态创建script来引入，免得这些文件太大
import 'recorder-core/src/engine/mp3.js';
import 'recorder-core/src/engine/mp3-engine.js';

//可选引入可视化插件
import 'recorder-core/src/extensions/waveview.js';
// #endif

/** 引入RecordApp **/
import RecordApp from 'recorder-core/src/app-support/app.js';
//【所有平台必须引入】uni-app支持文件
import '../../uni_modules/Recorder-UniCore/app-uni-support.js';

// #ifdef MP-WEIXIN
//可选引入微信小程序支持文件
import 'recorder-core/src/app-support/app-miniProgram-wx-support.js';
// #endif

import permision from '@/js_sdk/wa-permission/permission.js';

import Nls from 'alibabacloud-nls';

import {
  getAccessToken,
  uploadToOss,
  generateSignatureUrl,
  createTaskSummary,
  getTaskInfo,
  getTaskStatus,
  getTaskResult
} from '@/api/api';

const vue3This = getCurrentInstance().proxy;
const isRecording = ref(false);
const voiceWaveRef = ref(null);
const recordDuration = ref('');
const startTimestamp = Date.now();
const fileName = formatFileName(startTimestamp);
const isSummaryLoading = ref(false);
const speechTranscription = ref(null);
const sampleData = ref(null);
const recognitionResult = ref('');

onMounted(() => {
  vue3This.isMounted = true;
  RecordApp.UniPageOnShow(vue3This);
});
onUnmounted(() => {
  RecordApp.Stop();
});
onShow(() => {
  if (vue3This.isMounted) RecordApp.UniPageOnShow(vue3This);
});

const getFilePath = async (arrayBuffer) => {
  // 1. 先保存到本地文件
  const tempFilePath = await new Promise((resolve, reject) => {
    RecordApp.UniSaveLocalFile(
      `${fileName}.mp3`,
      arrayBuffer,
      (savePath) => {
        resolve(savePath);
      },
      (errMsg) => {
        reject(new Error(errMsg));
      }
    );
  });

  // 2. 保存到永久存储
  const filePath = await new Promise((resolve, reject) => {
    uni.saveFile({
      tempFilePath: tempFilePath,
      success: (res) => {
        resolve(res.savedFilePath);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });

  return filePath;
};

const recReq = () => {
  RecordApp.UniNativeUtsPlugin = null;

  console.log('正在请求录音权限...');

  RecordApp.UniWebViewActivate(vue3This);

  RecordApp.RequestPermission(
    () => {
      console.log('已获得录音权限，可以开始录音了', 2);
      recStart();
    },
    (msg, isUserNotAllow) => {
      if (isUserNotAllow) {
        openPermissionSetting();
      }
      console.log((isUserNotAllow ? 'isUserNotAllow,' : '') + '请求录音权限失败：' + msg, 1);
    }
  );
};

const openPermissionSetting = () => {
  console.log('当前平台：', uni.getSystemInfoSync().uniPlatform, uni.getSystemInfoSync().platform);

  if (uni.getSystemInfoSync().uniPlatform === 'app') {
    if (uni.getSystemInfoSync().platform === 'android') {
      uni.showModal({
        title: '提示',
        content: '需要麦克风权限，请前往设置手动开启',
        success: (res) => {
          if (res.confirm) {
            permision.gotoAppPermissionSetting();
          }
        }
      });
    } else if (uni.getSystemInfoSync().platform === 'ios') {
      permision.judgeIosPermission('record');
    }
  }
};

const recStart = () => {
  console.log('正在打开...');
  RecordApp.UniWebViewActivate(vue3This);
  voiceWaveRef.value.init();

  RecordApp.Start({
    type: 'mp3',
    sampleRate: 16000,
    bitRate: 16,
    audioTrackSet: {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true
    },
    onProcess: (buffers, powerLevel, duration, sampleRate, newBufferIdx, asyncEnd) => {
      recordDuration.value = formatDuration(duration);
      voiceWaveRef.value.input(powerLevel);
    },
    onProcess_renderjs: `function(buffers,powerLevel,duration,sampleRate,newBufferIdx,asyncEnd){
        if(this.voiceWaveRef){
          this.voiceWaveRef.input(powerLevel);
        }
      }`,
    onProcessBefore_renderjs: `function(buffers,powerLevel,duration,sampleRate,newBufferIdx){
      }`,
    takeoffEncodeChunk: (chunkBytes) => {},
    takeoffEncodeChunk_renderjs: `function(chunkBytes){
      }`,
    start_renderjs: `function(){
      }`,
    stop_renderjs: `function(aBuf,duration,mime){
        this.audioData=aBuf;
      }`
  });
};

const recStop = () => {
  console.log('正在结束录音...');

  isRecording.value = false;
  voiceWaveRef.value.clear();

  RecordApp.Stop(
    async (arrayBuffer, duration, mime) => {
      const recSet = (RecordApp.GetCurrentRecOrNull() || { set: { type: 'mp3' } }).set;
      console.log(
        '已录制[' +
          mime +
          ']：' +
          formatDuration(duration) +
          ' ' +
          arrayBuffer.byteLength +
          '字节 ' +
          recSet.sampleRate +
          'hz ' +
          recSet.bitRate +
          'kbps',
        2
      );

      // #ifdef APP
      const filePath = await getFilePath(arrayBuffer);
      const recordInfo = {
        fileName,
        mime,
        duration,
        durationText: formatDuration(duration),
        startTimestamp,
        startTimeText: formatDate(startTimestamp),
        arrayBuffer,
        size: arrayBuffer.byteLength,
        filePath
      };
      let recordList = uni.getStorageSync('jarvis-record') || [];
      recordList.unshift(recordInfo);
      uni.setStorageSync('jarvis-record', recordList);
      // #endif
    },
    (msg) => {
      console.log('结束录音失败：' + msg, 1);
    }
  );
};

const handleStartPause = () => {
  if (isRecording.value) {
    recStop();
  } else {
    recReq();
  }
};

const recPause = () => {
  if (RecordApp.GetCurrentRecOrNull()) {
    RecordApp.Pause();
    console.log('已暂停');
  }
};
const recResume = () => {
  if (RecordApp.GetCurrentRecOrNull()) {
    RecordApp.Resume();
    console.log('继续录音中...');
  }
};

const tryStart_androidNotifyService = () => {
  if (RecordApp.UniIsApp()) {
    console.log(
      'App中提升后台录音的稳定性：需要启用后台录音保活服务（iOS不需要），Android 9开始，锁屏或进入后台一段时间后App可能会被禁止访问麦克风导致录音静音、无法录音（App中H5录音也受影响），需要原生层提供搭配常驻通知的Android后台录音保活服务（Foreground services）；可调用配套原生插件的androidNotifyService接口，或使用第三方保活插件',
      '#4face6'
    );
  }
  if (RecordApp.UniIsApp() != 1) return; //非Android App不处理

  RecordApp.UniNativeUtsPluginCallAsync('androidNotifyService', {
    title: '正在录音',
    content: '正在录音中，请勿关闭App运行'
  })
    .then((data) => {
      const nCode = data.notifyPermissionCode,
        nMsg = data.notifyPermissionMsg;
      console.log(
        '搭配常驻通知的Android后台录音保活服务已打开，ForegroundService已运行(通知可能不显示或会延迟显示，并不影响服务运行)，通知显示状态(1有通知权限 3可能无权限)code=' +
          nCode +
          ' msg=' +
          nMsg,
        2
      );
    })
    .catch((e) => {
      console.log('原生插件的androidNotifyService接口调用出错：' + e.message, 1);
      console.log(
        '如果你已集成了配套的原生录音插件，并且是打包自定义基座运行，请检查本项目根目录的AndroidManifest.xml里面是否已经解开了注释，否则被注释掉的service不会包含在App中',
        1
      );
    });
};

const tryClose_androidNotifyService = () => {
  RecordApp.UniNativeUtsPluginCallAsync('androidNotifyService', {
    close: true
  })
    .then(() => {
      console.log('已关闭搭配常驻通知的Android后台录音保活服务');
    })
    .catch((e) => {
      console.log('原生插件的androidNotifyService接口调用出错：' + e.message, 1);
    });
};
</script>

<!-- #ifdef APP -->
<script module="testMainVue" lang="renderjs">
 //此模块内部只能用选项式API风格，vue2、vue3均可用，请照抄这段代码；不可改成setup组合式API风格，否则可能不能import vue导致编译失败
/**需要编译成App时，你需要添加一个renderjs模块，然后一模一样的import上面那些js（微信的js除外）
    ，因为App中默认是在renderjs（WebView）中进行录音和音频编码
    。如果配置了 RecordApp.UniWithoutAppRenderjs=true 且未调用依赖renderjs的功能时（如nvue、可视化、仅H5中可用的插件）
    ，可不提供此renderjs模块，同时逻辑层中需要将相关import的条件编译去掉**/
import 'recorder-core'
import RecordApp from 'recorder-core/src/app-support/app'
import '../../uni_modules/Recorder-UniCore/app-uni-support.js' //renderjs中似乎不支持"@/"打头的路径，如果编译路径错误请改正路径即可

//按需引入你需要的录音格式支持文件，和插件
import 'recorder-core/src/engine/mp3'
import 'recorder-core/src/engine/mp3-engine'

import 'recorder-core/src/extensions/waveview'

export default {
    mounted(){
        //App的renderjs必须调用的函数，传入当前模块this
        RecordApp.UniRenderjsRegister(this);
    },
    methods: {
        //这里定义的方法，在逻辑层中可通过 RecordApp.UniWebViewVueCall(this,'this.xxxFunc()') 直接调用
        //调用逻辑层的方法，请直接用 this.$ownerInstance.callMethod("xxxFunc",{args}) 调用，二进制数据需转成base64来传递
    }
}
</script>
<!-- #endif -->
