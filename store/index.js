import { createStore } from 'vuex';

const store = createStore({
  state: {
    recordList: uni.getStorageSync('jarvis-record') || [],
    popupEventData: null
  },
  mutations: {
    setRecordList(state, data) {
      state.recordList = data;
      uni.setStorageSync('jarvis-record', data);
    },
    setPopupEventData(state, popupEventData) {
      state.popupEventData = popupEventData;
    }
  }
});

export default store;
