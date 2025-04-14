// 页面路径：store/index.js
import { createStore } from 'vuex';
const store = createStore({
  state: {
    popupEventData: null
  },
  mutations: {
    setPopupEventData(state, popupEventData) {
      state.popupEventData = popupEventData;
    }
  }
});

export default store;
