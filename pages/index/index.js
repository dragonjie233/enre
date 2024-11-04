import request from '../../util/request';
import { Toast } from 'tdesign-miniprogram';

Page({
  isFirstUse: false,
  covers: [],
  data: {
    books: {},
    showTutorial: false
  },
  async onLoad() {
    wx.showLoading({ title: 'Loading...' })
    const books = await request('/wordbook', Toast, this)
    this.covers = await request('/sharecover', Toast, this)
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
    const { id, title, part } = e.target.dataset
    wx.navigateTo({
      url: `/pages/recite/recite?wbid=${id}&t=${title}&p=${part}`,
    })
  },
  async onShareAppMessage() {
    const { title, imgurl } = this.covers[parseInt(Math.random() * this.covers.length, 10)]

    return {
      title:  title || '如图所示，还不懂吗？',
      path: '/pages/index/index',
      imageUrl: imgurl
    }
  }
})
