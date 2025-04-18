import { createStore } from 'vuex';

const store = createStore({
  state: {
    recordList: uni.getStorageSync('jarvis-record') || localStorage.getItem('jarvis-record') || [],
    popupEventData: null,
    transferTextLoading: false,
    againTransferTextLoading: false
  },
  mutations: {
    setRecordList(state, data) {
      state.recordList = data;
      uni.setStorageSync('jarvis-record', data);
      localStorage.setItem('jarvis-record', data);
    },
    setPopupEventData(state, data) {
      state.popupEventData = data;
    },
    setTransferTextLoading(state, data) {
      state.transferTextLoading = data;
    },
    setAgainTransferTextLoading(state, data) {
      state.againTransferTextLoading = data;
    }
  }
});

export default store;
