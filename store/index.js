import { createStore } from 'vuex';

const store = createStore({
  state: {
    recordList: uni.getStorageSync('jarvis-record') || [],
    popupEventData: null,
    transferTextLoading: false
  },
  mutations: {
    setRecordList(state, data) {
      state.recordList = data;
      uni.setStorageSync('jarvis-record', data);
    },
    setPopupEventData(state, data) {
      state.popupEventData = data;
    },
    setTransferTextLoading(state, data) {
      state.transferTextLoading = data;
    }
  }
});

export default store;
