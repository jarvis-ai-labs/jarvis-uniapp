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
@import '/static/iconfonts/iconfont.css';
@import './global.scss';

@font-face {
  font-family: Avenir;
  src: url('/static/fonts/Avenir.ttc');
}
</style>
