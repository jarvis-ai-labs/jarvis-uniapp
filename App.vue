<script>
export default {
  onLaunch: function () {
    console.log('App Launch');
  },
  onShow: function () {
    console.log('App Show');
  },
  onHide: function () {
    console.log('App Hide');
  }
};
</script>

<style lang="scss">
@import '~@/static/iconfonts/iconfont.css';

@font-face {
  font-family: Avenir;
  src: url('/static/fonts/Avenir.ttc');
}

/*每个页面公共css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  font-family: Avenir;
}

.container {
  min-height: calc(100vh - 50px);
  position: relative;
  background: linear-gradient(180deg, #d9e7f2 0%, #e2edf7 55.87%, #ffffff 100%);
  // 添加一个伪元素来实现复杂的渐变叠加效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none; // 确保不影响点击事件
    background: radial-gradient(circle at 93% 90%, rgba(184, 121, 255, 0.3) 0%, rgba(178, 121, 255, 0.018) 100%),
      radial-gradient(circle at -2% 0%, rgba(95, 169, 255, 0.6) 0%, rgba(58, 191, 255, 0) 86%),
      radial-gradient(circle at 98% 17%, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.1) 100%);
  }

  .container-box {
    position: relative;
  }
}

.uni-toast {
  width: 10em;
  font-size: 20px;
}

.uni-navbar__header-btns-left {
  .uni-navbar-btn-text {
    uni-text {
      font-size: 16px !important;
    }
  }
}

.ua__markdown {
  padding: 0 10px;
}

uni-button:after {
  border: none !important;
}
</style>
