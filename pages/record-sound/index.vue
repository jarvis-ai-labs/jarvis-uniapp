<template>
  <view>
    <view class="container">
      <uni-nav-bar dark fixed status-bar :border="false" height="50px" title="正在录音" />

      <view class="container-box">
        <view class="record-sound-box">
          <view class="record-info">
            <view class="file-name">{{ fileName }}</view>
            <view class="record-time">
              <view class="time2">{{ formatDate(startTimestamp) }}</view>
            </view>
          </view>

          <view class="record-box">
            <!-- 可视化绘制 -->
            <view class="recwave-box">
              <canvas type="2d" class="recwave-WaveView"></canvas>
            </view>
          </view>

          <view class="record-control">
            <view class="record-time">
              <text>{{ recpowertTime }}</text>
            </view>
            <button class="start-pause-btn" @click="handleStartPause">
              <uni-icons
                custom-prefix="iconfont"
                :type="isRecording ? 'icon-pause' : 'icon-mic'"
                size="30"
                color="#ffffff" />
            </button>
            <button class="stop-btn" @click="recStop">
              <uni-icons custom-prefix="iconfont" type="icon-stop" size="20" color="#ffffff" />
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 日志输出 -->
    <!-- <view style="padding-top: 10px">
      <view v-for="obj in reclogs" :key="obj.idx" style="border-bottom: 1px dashed #666; padding: 5px 0">
        <view :style="{ color: obj.color == 1 ? 'red' : obj.color == 2 ? 'green' : obj.color }">
          {{ obj.txt }}
        </view>
      </view>
    </view> -->
  </view>
</template>

<script setup>
/** 先引入Recorder （ 需先 npm install recorder-core ）**/
import Recorder from 'recorder-core';

/** H5、小程序环境中：引入需要的格式编码器、可视化插件，App环境中在renderjs中引入 **/
// #ifdef H5 || MP-WEIXIN
//按需引入需要的录音格式编码器，用不到的不需要引入，减少程序体积；H5、renderjs中可以把编码器放到static文件夹里面用动态创建script来引入，免得这些文件太大
import 'recorder-core/src/engine/wav.js';
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

import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue';
import { onShow, onBackPress } from '@dcloudio/uni-app';
import { formatDate, formatFileName, formatDuration } from '@/utils';

import permision from '@/js_sdk/wa-permission/permission.js';

const startTimestamp = Date.now();
const fileName = formatFileName(startTimestamp);

const isRecording = ref(false);
const recpowertTime = ref('');
const reclogs = ref([]);

var vue3This = getCurrentInstance().proxy; //必须定义到最外面，getCurrentInstance得到的就是当前实例this

const reclog = (msg, color) => {
  let now = new Date();
  let t =
    ('0' + now.getHours()).substr(-2) +
    ':' +
    ('0' + now.getMinutes()).substr(-2) +
    ':' +
    ('0' + now.getSeconds()).substr(-2);
  let txt = '[' + t + ']' + msg;
  reclogs.value.splice(0, 0, { txt: txt, color: color });
};

onBackPress((options) => {
  if (options.from == 'backbutton') {
    return true;
  }
  return false;
});

onMounted(() => {
  reclog('onMounted');
  vue3This.isMounted = true;
  RecordApp.UniPageOnShow(vue3This); //onShow可能比mounted先执行，页面准备好了时再执行一次
  recReq();
});

onUnmounted(() => {
  RecordApp.Stop(); //清理资源，如果打开了录音没有关闭，这里将会进行关闭
});

onShow(() => {
  reclog('onShow');
});

const recReq = () => {
  RecordApp.UniNativeUtsPlugin = null;

  /****【在App内使用app-uni-support.js的授权许可】编译到App平台时仅供测试用（App平台包括：Android App、iOS App），不可用于正式发布或商用，正式发布或商用需先联系作者获得授权许可（编译到其他平台时无此授权限制，比如：H5、小程序，均为免费授权）
    获得授权许可后，请解开下面这行注释，并且将**部分改成你的uniapp项目的appid，即可解除所有限制；使用配套的原生录音插件或uts插件时可不进行此配置
    ****/
  //RecordApp.UniAppUseLicense='我已获得UniAppID=*****的商用授权';

  // if (RecordApp.UniIsApp()) {
  //   RecordApp.UniWebViewVueCall(vue3This, 'this.testCall("这里测试一下直接调用renderjs中的方法")');
  // }

  reclog('正在请求录音权限...');

  RecordApp.UniWebViewActivate(vue3This); //App环境下必须先切换成当前页面WebView

  RecordApp.RequestPermission(
    () => {
      reclog('已获得录音权限，可以开始录音了', 2);
      recStart();
    },
    (msg, isUserNotAllow) => {
      if (isUserNotAllow) {
        //用户拒绝了录音权限
        //这里你应当编写代码进行引导用户给录音权限，不同平台分别进行编写
        openPermissionSetting();
      }
      reclog((isUserNotAllow ? 'isUserNotAllow,' : '') + '请求录音权限失败：' + msg, 1);
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
        success: function (res) {
          if (res.confirm) {
            permision.gotoAppPermissionSetting();
          } else if (res.cancel) {
            uni.switchTab({ url: '/pages/file/index' });
          }
        }
      });
    } else if (uni.getSystemInfoSync().platform === 'ios') {
      permision.judgeIosPermission('record');
    }
  } else if (uni.getSystemInfoSync().uniPlatform === 'web') {
  }
};

const recStart = () => {
  reclog('正在打开...');
  RecordApp.UniWebViewActivate(vue3This);
  tryStart_androidNotifyService();

  RecordApp.Start(
    {
      type: 'mp3',
      sampleRate: 16000,
      bitRate: 16,
      audioTrackSet: {
        //配置回声消除，H5、App、小程序均可用，但并不一定会生效；注意：H5、App+renderjs中需要在请求录音权限前进行相同配置RecordApp.RequestPermission_H5OpenSet后此配置才会生效
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true
      },

      onProcess: (buffers, powerLevel, duration, sampleRate, newBufferIdx, asyncEnd) => {
        recpowertTime.value = formatDuration(duration);

        // H5、小程序等可视化图形绘制
        // #ifdef H5 || MP-WEIXIN
        if (vue3This.waveView) {
          vue3This.waveView.input(buffers[buffers.length - 1], powerLevel, sampleRate);
        }
        // #endif
      },
      onProcess_renderjs: `function(buffers,powerLevel,duration,sampleRate,newBufferIdx,asyncEnd){
        //App中在这里修改buffers才会改变生成的音频文件
        //App中是在renderjs中进行的可视化图形绘制，因此需要写在这里，this是renderjs模块的this（也可以用This变量）；如果代码比较复杂，请直接在renderjs的methods里面放个方法xxxFunc，这里直接使用this.xxxFunc(args)进行调用
        if(this.waveView){
          this.waveView.input(buffers[buffers.length-1],powerLevel,sampleRate);
        }
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
      reclog('录制中 appUseH5Rec', 2);
      isRecording.value = true;

      // 初始化 WaveView
      RecordApp.UniFindCanvas(
        vue3This,
        ['.recwave-WaveView'],
        `this.waveView=Recorder.WaveView({compatibleCanvas:canvas1, width:300, height:300});`,
        (canvas1) => {
          vue3This.waveView = Recorder.WaveView({ compatibleCanvas: canvas1, width: 300, height: 300 });
        }
      );
    },
    (msg) => {
      reclog('开始录音失败：' + msg, 1);
      isRecording.value = false;
    }
  );
};

const handleStartPause = () => {
  if (RecordApp.GetCurrentRecOrNull()) {
    if (isRecording.value) {
      RecordApp.Pause();
      isRecording.value = false;
      reclog('已暂停');
    } else {
      RecordApp.Resume();
      isRecording.value = true;
      reclog('继续录音中...');
    }
  }
};

const recStop = () => {
  reclog('正在结束录音...');

  isRecording.value = false;
  tryClose_androidNotifyService();

  RecordApp.Stop(
    (arrayBuffer, duration, mime) => {
      const recSet = (RecordApp.GetCurrentRecOrNull() || { set: { type: 'mp3' } }).set;
      reclog(
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
      RecordApp.UniSaveLocalFile(
        fileName + '.mp3',
        arrayBuffer,
        (savePath) => {
          console.log('保存录音成功:', savePath);

          // const audioBase64 = uni.arrayBufferToBase64(arrayBuffer);

          uni.saveFile({
            tempFilePath: savePath,
            success: (res) => {
              const savedFilePath = res.savedFilePath;
              console.log('保存录音成功:', savedFilePath);

              const recordInfo = {
                fileName,
                mime,
                duration,
                durationText: formatDuration(duration),
                startTimestamp,
                startTimeText: formatDate(startTimestamp),
                arrayBuffer,
                size: arrayBuffer.byteLength,
                // audioBase64,
                filePath: savedFilePath,
                tempFilePath: savePath
              };

              let recordList = uni.getStorageSync('jarvis-record') || [];
              recordList.unshift(recordInfo);
              uni.setStorageSync('jarvis-record', recordList);

              uni.navigateTo({
                url: '/pages/record-play/index?id=' + startTimestamp
              });
            },
            fail: (err) => {
              console.error('保存录音失败:', err);
              uni.showToast({ title: '保存录音失败', icon: 'error' });
            }
          });
        },
        (errMsg) => {
          console.error('保存录音失败:', errMsg);
          uni.showToast({ title: '保存录音失败', icon: 'error' });
        }
      );
      // #endif
    },
    (msg) => {
      reclog('结束录音失败：' + msg, 1);
    }
  );
};

// const recStopX = () => {
//   isRecording.value = false;
//   tryClose_androidNotifyService();
//   RecordApp.Stop(
//     null, //success传null就只会清理资源，不会进行转码
//     (msg) => {
//       reclog('已清理，错误信息：' + msg);
//     }
//   );
// };

const tryStart_androidNotifyService = () => {
  if (RecordApp.UniIsApp()) {
    reclog(
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
      reclog(
        '搭配常驻通知的Android后台录音保活服务已打开，ForegroundService已运行(通知可能不显示或会延迟显示，并不影响服务运行)，通知显示状态(1有通知权限 3可能无权限)code=' +
          nCode +
          ' msg=' +
          nMsg,
        2
      );
    })
    .catch((e) => {
      reclog('原生插件的androidNotifyService接口调用出错：' + e.message, 1);
      reclog(
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
      reclog('已关闭搭配常驻通知的Android后台录音保活服务');
    })
    .catch((e) => {
      reclog('原生插件的androidNotifyService接口调用出错：' + e.message, 1);
    });
};
</script>

<!-- #ifdef APP -->
<script module="testMainVue" lang="renderjs">
//这地方就别用组合式api了，可能不能import vue
 /**============= App中在renderjs中引入RecordApp，这样App中也能使用H5录音、音频可视化 =============**/
 /** 先引入Recorder **/
 import Recorder from 'recorder-core';

 //按需引入需要的录音格式编码器，用不到的不需要引入，减少程序体积；H5、renderjs中可以把编码器放到static文件夹里面用动态创建script来引入，免得这些文件太大
 import 'recorder-core/src/engine/wav.js'
 import 'recorder-core/src/engine/mp3.js'
 import 'recorder-core/src/engine/mp3-engine.js'

 //可选引入可视化插件
 import 'recorder-core/src/extensions/waveview.js'

 /** 引入RecordApp **/
 import RecordApp from 'recorder-core/src/app-support/app.js'
 //【必须引入】uni-app支持文件
 import '../../uni_modules/Recorder-UniCore/app-uni-support.js'

 export default {
   mounted(){
     //App的renderjs必须调用的函数，传入当前模块this
     RecordApp.UniRenderjsRegister(this);
   },
   methods: {
     //这里定义的方法，在逻辑层中可通过 RecordApp.UniWebViewVueCall(this,'this.xxxFunc()') 直接调用
     //调用逻辑层的方法，请直接用 this.$ownerInstance.callMethod("xxxFunc",{args}) 调用，二进制数据需转成base64来传递
     testCall(val){
       this.$ownerInstance.callMethod("reclog",'逻辑层调用renderjs中的testCall结果：'+val);
     }
   }
  }
</script>
<!-- #endif -->

<style lang="scss" scoped>
.record-sound-box {
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

.record-box {
  width: 100%;
  height: calc(100vh - 264px);
  position: relative;

  .recwave-progress {
    height: 40px;
    width: 100%;
    background: #f9fafa;
    position: relative;
    .recwave-progress-bar {
      height: 40px;
      background: green;
      position: absolute;
    }
    .recwave-progress-text {
      padding-left: 50px;
      line-height: 40px;
      position: relative;
    }
  }

  .recwave-box {
    width: 100%;
    height: 100%;
    .recwave-WaveView,
    .recwave-SurferView,
    .recwave-SurferView-2x {
      width: 100%;
      height: 300px;
    }
  }
}

.record-control {
  width: 100%;
  height: 100px;
  background: #6b6b6b99;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;

  .fa-solid {
    font-size: 24px;
    color: #ffffff;
  }

  .start-pause-btn {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #4189ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 10px;
  }

  .stop-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: #4189ff;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    right: 40px;
  }

  .record-time {
    position: absolute;
    left: 40px;
    font-family: Avenir;
    font-size: 16px;
    font-weight: bold;
    color: #4189ff;
  }
}
</style>
