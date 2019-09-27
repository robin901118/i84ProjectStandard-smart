import Vue from "vue";

/**
 * +++++++++++++++++++++++++++++++++++
 * 状态
 * +++++++++++++++++++++++++++++++++++
 * */
export const store = Vue.observable({
  publicLoadingShow: false, // loadingShow
  publicArrDialogShow: false, // 错误弹窗显示/隐藏
  publicErrDialogTxt: '', // 错误弹窗信息
  publicErrDialogIcon: '', // 错误弹窗图标
  publicToastTxt: '', // 吐司提示文本
  publicToastShow: false, // 吐司提示显示
  publicToastType: ''// 吐司类型
});


/**
 * +++++++++++++++++++++++++++++++++++
 * mutations
 * +++++++++++++++++++++++++++++++++++
 * */
export const mutations = {
  /* 设置loading状态 */
  SET_LOADING: function (isloading) {
    store.publicLoadingShow = isloading
  },
  /* 设置通用提示弹窗 */
  SET_ERR_DIALOG: function ({ show, txt = '', icon = 'cubeic-sad' }) {
    store.publicArrDialogShow = show
    if (show) {
      store.publicErrDialogTxt = txt
      store.publicErrDialogIcon = icon
    }
  },
  /* 设置吐司提示 */
  SET_TOAST: function ({ show, txt = '', type = 'warn' }) {
    store.publicToastShow = show
    store.publicToastTxt = txt
    store.publicToastType = type
  }
}