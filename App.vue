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
@use '@/uni_modules/zebra-swiper/index.scss';
@use '@/uni_modules/zebra-swiper/modules/effect-cards/effect-cards.scss';
</style>

<style lang="scss">
@import './static/iconfonts/iconfont.css';
@import './global.scss';

@font-face {
  font-family: Avenir;
  src: url('./static/fonts/Avenir.ttc');
}
@font-face {
  font-family: Poppins;
  src: url('./static/fonts/Poppins.otf');
}
</style>
