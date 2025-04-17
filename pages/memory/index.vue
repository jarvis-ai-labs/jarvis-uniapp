<template>
  <custom-header />

  <scroll-view scroll-y="true" class="main">
    <swiper-box />

    <memory-list />
  </scroll-view>

  <view class="record-btn">
    <view class="record-btn-box">
      <button class="stop-btn" v-if="isRecording" @click="recStop">
        <uni-icons custom-prefix="iconfont" type="icon-stop" size="30" color="#ffffff" />
      </button>
      <image src="/static/images/record-btn.png" mode="widthFix" v-else @click="recReq" />
    </view>

    <view class="recwave" v-if="isRecording">
      <canvas type="2d" class="recwave-Histogram2"></canvas>
    </view>
  </view>

  <custom-tabbar />
</template>

<script setup>
import CustomTabbar from '@/components/custom-tabbar.vue';
import CustomHeader from '@/components/custom-header.vue';
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
import 'recorder-core/src/extensions/frequency.histogram.view.js';
import 'recorder-core/src/extensions/lib.fft.js';
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
import { ref, getCurrentInstance, onMounted, onUnmounted, computed } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  uploadToOss,
  generateOnlineUrl,
  createKeyPointsTask,
  getTaskResult,
  getTaskResultData,
  createTranscriptionTask,
  createImageSynthesisTask,
  getSynthesisTask
} from '@/api/api';

import { useStore } from 'vuex';

const store = useStore();
const recordList = computed(() => store.state.recordList);
const transferTextLoading = computed(() => store.state.transferTextLoading);
const againTransferTextLoading = computed(() => store.state.againTransferTextLoading);
const vue3This = getCurrentInstance().proxy;
const isRecording = ref(false);
const recordDuration = ref('');
// const startTimestamp = Date.now();
// const fileName = formatFileName(startTimestamp);

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
  if (transferTextLoading.value || againTransferTextLoading.value) return;

  RecordApp.UniNativeUtsPlugin = null;

  console.log('正在请求录音权限...');

  RecordApp.UniWebViewActivate(vue3This);

  RecordApp.RequestPermission(
    () => {
      console.log('已获得录音权限，可以开始录音了');
      recStart();
    },
    (msg, isUserNotAllow) => {
      if (isUserNotAllow) {
        openPermissionSetting();
      }
      console.log((isUserNotAllow ? 'isUserNotAllow,' : '') + '请求录音权限失败：' + msg);
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

  isRecording.value = true;

  RecordApp.Start(
    {
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

        //H5、小程序等可视化图形绘制，直接运行在逻辑层；App里面需要在onProcess_renderjs中进行这些操作
        // #ifdef H5 || MP-WEIXIN
        const wave = vue3This.waveStore && vue3This.waveStore[vue3This.recwaveChoiceKey];
        if (wave) {
          wave.input(buffers[buffers.length - 1], powerLevel, sampleRate);
        }
        // #endif
      },
      onProcess_renderjs: `function(buffers,powerLevel,duration,sampleRate,newBufferIdx,asyncEnd){
        const wave=this.waveStore&&this.waveStore[this.recwaveChoiceKey];
        if(wave) wave.input(buffers[buffers.length-1],powerLevel,sampleRate);
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
    },
    () => {
      console.log('录制中 mp3');

      //创建音频可视化图形绘制
      RecordApp.UniFindCanvas(
        vue3This,
        ['.recwave-Histogram2'],
        `const store=this.waveStore=this.waveStore||{};
        this.recwaveChoiceKey="Histogram2";
        store.Histogram2=Recorder.FrequencyHistogramView({compatibleCanvas:canvas1, width:300, height:100
          ,lineCount:200,widthRatio:1,position:0,minHeight:1
          ,fallDuration:600,stripeEnable:false,mirrorEnable:true,linear:[0,"#815EF6",1,"#815EF6"]});`,
        (canvas1) => {
          vue3This.waveStore = vue3This.waveStore || {};
          vue3This.recwaveChoiceKey = 'Histogram2';
          vue3This.waveStore.Histogram2 = Recorder.FrequencyHistogramView({
            compatibleCanvas: canvas1,
            width: 300,
            height: 100,
            lineCount: 200,
            widthRatio: 1,
            position: 0,
            minHeight: 1,
            fallDuration: 600,
            stripeEnable: false,
            mirrorEnable: true,
            linear: [0, '#815EF6', 1, '#815EF6']
          });
        }
      );
    },
    (msg) => {
      console.log('开始录音失败：' + msg);
    }
  );
};

const recStop = () => {
  console.log('正在结束录音...');
  isRecording.value = false;

  RecordApp.Stop(
    async (arrayBuffer, duration, mime) => {
      const recSet = (RecordApp.GetCurrentRecOrNull() || { set: { type: 'mp3' } }).set;
      console.log(
        '当前已录制[' +
          mime +
          ']: ' +
          formatDuration(duration) +
          ' ' +
          arrayBuffer.byteLength +
          '字节 ' +
          recSet.sampleRate +
          'hz ' +
          recSet.bitRate +
          'kbps'
      );

      uploadTransfer(arrayBuffer, duration, mime);
    },
    (msg) => {
      console.log('结束录音失败：' + msg);
    }
  );
};

const transferText = async (newFileName) => {
  try {
    const onlineUrl = await generateOnlineUrl(newFileName);

    const transcriptionId = await createTranscriptionTask(onlineUrl);
    const pointsId = await createKeyPointsTask(onlineUrl);

    const transcriptionResult = await getTaskResult(transcriptionId, '转录');
    const pointsResult = await getTaskResult(pointsId, '要点提炼');

    const transcriptionData = await getTaskResultData(transcriptionResult.Transcription, '转录');
    //     {
    //     "TaskId": "223110df025a4b4a858fbb100660aedd",
    //     "Transcription": {
    //         "AudioInfo": {
    //             "Size": 4320,
    //             "Duration": 2160,
    //             "SampleRate": 16000,
    //             "Language": "fspk"
    //         }
    //     }
    // }
    const pointsData = await getTaskResultData(pointsResult.MeetingAssistance, '要点提炼');
    //     {
    //     "TaskId": "0db6c5c9ec7c4a98a35d1c43dacf815b",
    //     "MeetingAssistance": {
    //         "Keywords": []
    //     }
    // }

    return {
      transcriptionData: transcriptionData.Transcription,
      pointsData: pointsData.MeetingAssistance
    };
  } catch (error) {
    throw error;
  }
};

const getImageSynthesisUrl = async (item) => {
  try {
    const imageSynthesisTask = await createImageSynthesisTask(item.pointsData?.Actions[0].Text);
    const synthesisTask = await getSynthesisTask(imageSynthesisTask.task_id);
    return synthesisTask.results[0].url;
  } catch (error) {
    console.error('生成图片失败', error);
  }
};

const uploadTransfer = async (arrayBuffer, duration, mime) => {
  if (transferTextLoading.value || againTransferTextLoading.value) return;
  store.commit('setTransferTextLoading', true);
  uni.showToast({ title: '开始上传录音文件并转写...', icon: 'none', mask: true });

  const startTimestamp = Date.now();
  const fileName = formatFileName(startTimestamp);

  RecordApp.UniSaveLocalFile(
    fileName + '.mp3',
    arrayBuffer,
    (savePath) => {
      console.log('UniSaveLocalFile:', savePath);
      uni.saveFile({
        tempFilePath: savePath,
        success: async (res) => {
          const filePath = res.savedFilePath;
          console.log('saveFile:', filePath);

          const newFileName = await uploadToOss(fileName, filePath);

          const { pointsData, transcriptionData } = await transferText(newFileName);

          const recordInfo = {
            fileName,
            mime,
            filePath,
            duration,
            durationText: formatDuration(duration),
            startTimestamp,
            startTimeText: formatDate(startTimestamp),
            arrayBuffer,
            size: arrayBuffer.byteLength,
            pointsData,
            transcriptionData,
            imageUrl: ''
          };
          console.log('录音信息', recordInfo);

          if (recordInfo.pointsData.Actions) {
            const imageUrl = await getImageSynthesisUrl(recordInfo);
            recordInfo.imageUrl = imageUrl;
            store.commit('setPopupEventData', recordInfo);
          }

          store.commit('setRecordList', [recordInfo, ...recordList.value]);
          store.commit('setTransferTextLoading', false);
        },
        fail: (err) => {
          console.error('保存录音失败:', err);
          store.commit('setTransferTextLoading', false);
        }
      });
    },
    (errMsg) => {
      console.error('保存录音失败:', errMsg);
      store.commit('setTransferTextLoading', false);
    }
  );
};

const recPause = () => {
  if (RecordApp.GetCurrentRecOrNull()) {
    RecordApp.Pause(); // 暂停录音
  }
};
const recResume = () => {
  if (RecordApp.GetCurrentRecOrNull()) {
    RecordApp.Resume(); // 继续录音
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
          nMsg
      );
    })
    .catch((e) => {
      console.log('原生插件的androidNotifyService接口调用出错：' + e.message);
      console.log(
        '如果你已集成了配套的原生录音插件，并且是打包自定义基座运行，请检查本项目根目录的AndroidManifest.xml里面是否已经解开了注释，否则被注释掉的service不会包含在App中'
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
      console.log('原生插件的androidNotifyService接口调用出错：' + e.message);
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
import 'recorder-core/src/engine/mp3.js'
import 'recorder-core/src/engine/mp3-engine.js'

//可选引入可视化插件
import 'recorder-core/src/extensions/frequency.histogram.view.js'
import 'recorder-core/src/extensions/lib.fft.js'

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

<style>
.recwave {
  width: 300px;
  height: 100px;
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translate(-50%, -50%);
  z-index: 1;
}
.recwave canvas {
  width: 300px;
  height: 100px;
}
</style>
