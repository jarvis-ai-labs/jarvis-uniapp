<template>
  <view>
    <view class="record-btn" @click="handleStartPause">
      <image src="/static/images/record-btn.png" mode="widthFix" />
      <voice-wave />
    </view>
  </view>
</template>

<!-- #ifdef VUE3 -->
<script setup>
import VoiceWave from './voice-wave.vue';
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
import '../uni_modules/Recorder-UniCore/app-uni-support.js';

// #ifdef MP-WEIXIN
//可选引入微信小程序支持文件
import 'recorder-core/src/app-support/app-miniProgram-wx-support.js';
// #endif

import { ref, getCurrentInstance, onMounted, onUnmounted } from 'vue';
import { formatDate, formatFileName, formatDuration } from '@/utils';
import { onShow } from '@dcloudio/uni-app';
import permision from '@/js_sdk/wa-permission/permission.js';

const startTimestamp = Date.now();
const fileName = formatFileName(startTimestamp);

const isRecording = ref(false);
const recpowertTime = ref('');

var vue3This = getCurrentInstance().proxy; //必须定义到最外面，getCurrentInstance得到的就是当前实例this

onMounted(() => {
  console.log('onMounted');
  vue3This.isMounted = true;
  RecordApp.UniPageOnShow(vue3This); //onShow可能比mounted先执行，页面准备好了时再执行一次
});

onUnmounted(() => {
  RecordApp.Stop();
});

onShow(() => {
  console.log('onShow');
  if (vue3This.isMounted) RecordApp.UniPageOnShow(vue3This); //onShow可能比mounted先执行，页面可能还未准备好
});

const recReq = () => {
  RecordApp.UniNativeUtsPlugin = null;

  if (RecordApp.UniIsApp()) {
    RecordApp.UniWebViewVueCall(vue3This, 'this.testCall("这里测试一下直接调用renderjs中的方法")');
  }

  console.log('正在请求录音权限...');

  RecordApp.UniWebViewActivate(vue3This); //App环境下必须先切换成当前页面WebView

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
        success: function (res) {
          if (res.confirm) {
            permision.gotoAppPermissionSetting();
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
  console.log('正在打开...');
  RecordApp.UniWebViewActivate(vue3This); //App环境下必须先切换成当前页面WebView

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
      },
      onProcess_renderjs: `function(buffers,powerLevel,duration,sampleRate,newBufferIdx,asyncEnd){
        //App中在这里修改buffers才会改变生成的音频文件
        //App中是在renderjs中进行的可视化图形绘制，因此需要写在这里，this是renderjs模块的this（也可以用This变量）；如果代码比较复杂，请直接在renderjs的methods里面放个方法xxxFunc，这里直接使用this.xxxFunc(args)进行调用
      }`,

      takeoffEncodeChunk: !instance?.proxy?.takeoffEncodeChunkSet
        ? null
        : (chunkBytes) => {
            //全平台通用：实时接收到编码器编码出来的音频片段数据，chunkBytes是Uint8Array二进制数据，可以实时上传（发送）出去
            //App中如果未配置RecordApp.UniWithoutAppRenderjs时，建议提供此回调，因为录音结束后会将整个录音文件从renderjs传回逻辑层，由于uni-app的逻辑层和renderjs层数据交互性能实在太拉跨了，大点的文件传输会比较慢，提供此回调后可避免Stop时产生超大数据回传
          },
      takeoffEncodeChunk_renderjs: !instance?.proxy?.takeoffEncodeChunkSet
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
      console.log('录制中 appUseH5Rec', 2);
      isRecording.value = true;
    },
    (msg) => {
      console.log('开始录音失败：' + msg, 1);
      isRecording.value = false;
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

const recStop = () => {
  console.log('正在结束录音...');

  isRecording.value = false;

  RecordApp.Stop(
    (arrayBuffer, duration, mime) => {
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
    },
    (msg) => {
      console.log('结束录音失败：' + msg, 1);
    }
  );
};
</script>
<!-- #endif -->

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
 import '../uni_modules/Recorder-UniCore/app-uni-support.js'

 export default {
   mounted(){
     //App的renderjs必须调用的函数，传入当前模块this
    RecordApp.UniRenderjsRegister(this);
		//测试用
		rjsThis=this;
   },
   methods: {
     //这里定义的方法，在逻辑层中可通过 RecordApp.UniWebViewVueCall(this,'this.xxxFunc()') 直接调用
     //调用逻辑层的方法，请直接用 this.$ownerInstance.callMethod("xxxFunc",{args}) 调用，二进制数据需转成base64来传递
     testCall(val){
       this.$ownerInstance.callMethod("console.log",'逻辑层调用renderjs中的testCall结果：'+val);
     }
   }
  }
</script>
<!-- #endif -->

<style lang="scss" scoped>
.record-btn {
  width: 60px;
  height: 60px;
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  margin: auto;
  image {
    width: 100%;
    height: 100%;
  }
}
</style>
