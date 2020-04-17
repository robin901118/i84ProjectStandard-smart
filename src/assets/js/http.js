import axios from 'axios'
import QS from 'qs'
import { Dialog } from 'cube-ui'
import router from '../../router'
import { mutations } from './store'
const CancelToken = axios.CancelToken

/**
 * +++++++++++++++++++++++++++++++++++
 * 封装的请求类
 * ajax()  =>  单个请求方法
 * all()  =>  并发请求方法
 * +++++++++++++++++++++++++++++++++++
 * */
export default class Http {
  constructor () {
    this.$http = axios.create()
    this.$http.defaults.baseURL = process.env.VUE_APP_BASEAPI
    this.$http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'
    // 请求拦截
    this.$http.interceptors.request.use(
      config => {
        if (config.method === 'post') {
          config.data = QS.stringify(config.data)// 序列化参数
        } else {
          config.params = config.data
        }
        return config
      },
      error => Promise.reject(error)
    )
  }

  /**
   * 通用错误数据处理
   **/
  publicError (error) {
    let message = '连接服务器失败'
    if (error.response) {
      const errorCode = error.response.status
      const errorCodeConfig = {
        400: '错误请求',
        403: '拒绝访问',
        404: '啊哦,接口404...',
        405: '请求方法未允许',
        408: '请求超时',
        500: '服务器端出错',
        501: '网络未实现',
        502: '网络错误',
        503: '服务不可用',
        504: '网络超时',
        505: 'http版本不支持该请求'
      }

      errorCode in errorCodeConfig
        ? message = errorCodeConfig[errorCode]
        : message = `错误代码:${errorCode}`
    }
    mutations.SET_ERR_DIALOG({ show: true, txt: message });
  }

  /**
   * +++++++++++++++++++++++++++++++++++
   * @param params 请求参数{
   * url：请求链接，
   * data:请求数据
   * loading:是否需要loading
   * method:请求类型
   * }
   * +++++++++++++++++++++++++++++++++++
   * */
  ajax (params) {
    params = Object.assign({
      url: '/api',
      data: undefined,
      loading: undefined,
      method: 'get'
    }, params)

    return new Promise((resolve, reject) => {
      // 打开loading
      params['loading'] && mutations.SET_LOADING(true)

      // 开始请求
      this.$http({
        url: params['url'],
        method: params['method'],
        data: params['data'],
        // 取消请求，如果有页面需要用到取消当前请求，则直接调用window.cancelRequire方法
        cancelToken: new CancelToken(c => { window.cancelRequire = c })
      })

      // 正确返回
        .then(res => {
          // 关闭loading
          params['loading'] && mutations.SET_LOADING(false)


          // 状态判断
          switch (res['data']['_code']) {
            case '99999':
              resolve(res['data']['_result'] || 'success')// 成功
              break

            case '20001':
              this.logout(res['data']['_msg'])// session失效
              reject('20001')
              break

            default:
              mutations.SET_ERR_DIALOG({ show: true, txt: res['data']['_msg'] })// 其他错误
              reject(['data']['_code'])
          }
        })

        // 错误处理
        .catch(error => {
          params['loading'] && mutations.SET_LOADING(false)
          this.publicError(error)
          reject(false)
        })
    })
  }

  /**
   * +++++++++++++++++++++++++++++++++++
   * @param params 请求参数{
   * requestArr:并发请求数组
   * loading:是否需要loading
   * }
   * +++++++++++++++++++++++++++++++++++
   * */
  all (params) {
    params = Object.assign({
      requestArr: [],
      loading: undefined
    }, params)

    // 打开loading
    params['loading'] && mutations.SET_LOADING(true)

    // 处理数据
    const requests = params['requestArr'].map(item => this.$http(item))

    // 返回数据
    return new Promise((resolve, reject) => {
      Promise.all(requests)
        .then(res => {
          const resultArr = []; let flag = false

          /** 循环遍历请求状态 **/
          for (let i = 0, len = res.length; i < len; i++) {
            if (res[i]['data']['_code'] === '99999') {
              resultArr.push(res[i]['data']['_result'] || 'success')// 成功
              flag = true
            } else if (res[i]['data']['_code'] === '20001') {
              this.logout(res[i]['data']['_msg'])// 未登录
              break
            } else {
              mutations.SET_ERR_DIALOG({ show: true, txt: res[i]['data']['_msg'] })// 其他错误
              break
            }
          }
          params['loading'] && mutations.SET_LOADING(false)// 关闭loading
          flag ? resolve(resultArr) : reject(false)// 返回结果
        })
        .catch(error => {
          params['loading'] && mutations.SET_LOADING(false)
          this.publicError(error)
          reject(false)
        })
    })
  }

  /**
   * 登出
   * **/
  logout (content) {
    Dialog.$create({
      type: 'alert',
      content: content,
      icon: 'cubeic-sad',
      onConfirm: () => {
        // 执行登出操作
        console.log('执行登出操作')
        console.log('当前页面的路由：', router.history.current.fullPath)
      }
    }, false).show()
  }
}
