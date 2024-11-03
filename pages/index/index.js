import request from '../../util/request';
import { Toast } from 'tdesign-miniprogram';

Page({
  isFirstUse: false,
  data: {
    books: {},
    showTutorial: false
  },
  async onLoad() {
    wx.showLoading({ title: 'Loading...' })
    const books = await request('/wordbook', Toast, this)    
    this.setData({ books })

    const isFirstUse = wx.getStorageSync('firstUse')
    if(isFirstUse.constructor != Boolean && isFirstUse == '') {
      this.isFirstUse = true
      this.showTutorial()
    }
  },
  showTutorial(e) {
    this.setData({ showTutorial: !this.data.showTutorial })

    if (e && e.type == 'confirm' && this.isFirstUse)
      wx.setStorageSync('firstUse', false)
  },
  toPage(e) {
    const { id, title } = e.target.dataset
    wx.navigateTo({
      url: `/pages/recite/recite?wbid=${id}&title=${title}`,
    })
  },
  onShareAppMessage() {
    return {
      title: 'ENRE :)',
      path: '/pages/index/index',
      imageUrl: '/img/ShareCover.jpg'
    }
  }
})
