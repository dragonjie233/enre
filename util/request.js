const base_url = 'https://enre.xyhrc.com:52017/m';

export default (params, Toast, that) => {
  let url = base_url + (params.constructor == String ? params : params.url);
  let method = params.method || "GET";
  let data = params.data || {};
  let header = params.header || {
    'content-type': 'application/json'
  };

  return new Promise((resolve, reject) => {
    wx.request({
      url, method, header, data,
      success(response) {
        const res = response.data
        if (response.statusCode == 200) {
          if (res.code == 0) {
            Toast({
              context: that,
              selector: '#t-toast',
              message: res.msg,
            })
          }
          resolve(res.data)
        } else {
          switch (response.statusCode) {
            case 404:
              Toast({
                context: that,
                selector: '#t-toast',
                message: '请求地址不存在...',
              })
              break;
            default:
              Toast({
                context: that,
                selector: '#t-toast',
                message: '请重试...',
              })
              break;
          }
        }
      },
      fail(err) {
          Toast({
            context: that,
            selector: '#t-toast',
            message: err.errMsg.indexOf('request:fail ') !== -1 ? '网络异常' : '未知异常',
          })
        reject(err);
      },
      complete() {
        wx.hideLoading();
      }
    });
  }).catch((e) => {});
};