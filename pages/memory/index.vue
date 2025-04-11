<template>
  <custom-header />

  <scroll-view scroll-y="true" class="main">
    <swiper-box />

    <memory-list ref="memoryListRef" />
  </scroll-view>

  <view class="record-btn">
    <view class="record-btn-box">
      <button class="stop-btn" v-if="isRecording" @click="recStop">
        <uni-icons custom-prefix="iconfont" type="icon-stop" size="30" color="#ffffff" />
      </button>
      <image src="/static/images/record-btn.png" mode="widthFix" v-else @click="recReq" />
    </view>

    <voice-wave ref="voiceWaveRef" />
  </view>

  <custom-tabbar />
</template>

<script setup>
import CustomTabbar from '@/components/custom-tabbar.vue';
import CustomHeader from '@/components/custom-header.vue';
import VoiceWave from '@/components/voice-wave.vue';
import MemoryList from '@/components/memory-list.vue';
import SwiperBox from '@/components/swiper-box.vue';

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

import { formatDate, formatFileName, formatDuration } from '@/utils';
import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  uploadToOss,
  generateSignatureUrl,
  createKeyPointsTask,
  getTaskResultUrl,
  getTaskResult,
  createTranscriptionTask
} from '@/api/api';

const vue3This = getCurrentInstance().proxy;
const isRecording = ref(false);
const voiceWaveRef = ref(null);
const recordDuration = ref('');
const startTimestamp = Date.now();
const fileName = formatFileName(startTimestamp);
const memoryListRef = ref(null);

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
  isRecording.value = true;

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
      voiceWaveRef.value.input(buffers[buffers.length - 1], powerLevel, sampleRate);
    },
    onProcess_renderjs: `function(buffers,powerLevel,duration,sampleRate,newBufferIdx,asyncEnd){
        //App中在这里修改buffers才会改变生成的音频文件
        //App中是在renderjs中进行的可视化图形绘制，因此需要写在这里，this是renderjs模块的this（也可以用This变量）；如果代码比较复杂，请直接在renderjs的methods里面放个方法xxxFunc，这里直接使用this.xxxFunc(args)进行调用
      }`,
    takeoffEncodeChunk: !vue3This.takeoffEncodeChunkSet
      ? null
      : (chunkBytes) => {
          //全平台通用：实时接收到编码器编码出来的音频片段数据，chunkBytes是Uint8Array二进制数据，可以实时上传（发送）出去
          //App中如果未配置RecordApp.UniWithoutAppRenderjs时，建议提供此回调，因为录音结束后会将整个录音文件从renderjs传回逻辑层，由于uni-app的逻辑层和renderjs层数据交互性能实在太拉跨了，大点的文件传输会比较慢，提供此回调后可避免Stop时产生超大数据回传
        },
    takeoffEncodeChunk_renderjs: !vue3This.takeoffEncodeChunkSet
      ? null
      : `function(chunkBytes){
        //App中这里可以做一些仅在renderjs中才生效的事情，不提供也行，this是renderjs模块的this（也可以用This变量）
      }`,

    start_renderjs: `function(){
        //App中可以放一个函数，在Start成功时renderjs中会先调用这里的代码，this是renderjs模块的this（也可以用This变量）
        //放一些仅在renderjs中才生效的事情，比如初始化，不提供也行
      }`,
    stop_renderjs: `function(aBuf,duration,mime){
        //App中可以放一个函数，在Stop成功时renderjs中会先调用这里的代码，this是renderjs模块的this（也可以用This变量）
        this.audioData=aBuf; //留着给Stop时进行转码成wav播放
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

      getTextResult(arrayBuffer, duration, mime);
    },
    (msg) => {
      console.log('结束录音失败：' + msg, 1);
    }
  );
};

// 获取文字
const getTextResult = async (arrayBuffer, duration, mime) => {
  if (memoryListRef.value.textLoading) return;
  memoryListRef.value.textLoading = true;

  try {
    const filePath = await getFilePath(arrayBuffer);
    if (!filePath) return;

    const newFileName = await uploadToOss(fileName, filePath);

    const signatureUrl = await generateSignatureUrl(newFileName);

    const pointsId = await createKeyPointsTask(signatureUrl);
    const transcriptionId = await createTranscriptionTask(signatureUrl);

    const pointsUrl = await getTaskResultUrl(pointsId, '要点提炼');
    const transcriptionUrl = await getTaskResultUrl(transcriptionId, '转录');

    const pointsResult = await getTaskResult(pointsUrl.MeetingAssistance);
    const transcriptionResult = await getTaskResult(transcriptionUrl.Transcription);

    const recordInfo = {
      fileName,
      mime,
      duration,
      durationText: formatDuration(duration),
      startTimestamp,
      startTimeText: formatDate(startTimestamp),
      arrayBuffer,
      size: arrayBuffer.byteLength,
      filePath,
      pointsData: pointsResult.MeetingAssistance,
      transcriptionData: transcriptionResult.Transcription
    };
    console.log('录音信息', recordInfo);
    let recordList = uni.getStorageSync('jarvis-record') || [];
    recordList.unshift(recordInfo);
    uni.setStorageSync('jarvis-record', recordList);
    memoryListRef.value.refresh();
  } catch (error) {
    console.log('失败', error);
  } finally {
    memoryListRef.value.textLoading = false;
  }
};

const getFilePath = (arrayBuffer) => {
  return new Promise((resolve, reject) => {
    RecordApp.UniSaveLocalFile(
      fileName + '.mp3',
      arrayBuffer,
      (savePath) => {
        console.log('UniSaveLocalFile:', savePath);
        uni.saveFile({
          tempFilePath: savePath,
          success: (res) => {
            const filePath = res.savedFilePath;
            console.log('saveFile:', filePath);
            resolve(filePath);
          },
          fail: (err) => {
            console.error('保存录音失败:', err);
            reject(err);
          }
        });
      },
      (errMsg) => {
        console.error('保存录音失败:', errMsg);
        reject(errMsg);
      }
    );
  });
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
  data() {
    return {
    };
  },
  mounted() {
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
