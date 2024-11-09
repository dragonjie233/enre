import request from '../../util/request';
import Dialog from 'tdesign-miniprogram/dialog/index';
import { Toast } from 'tdesign-miniprogram';

Page({
  args: {},
  readLock: false,
  data: {
    words: [],
    curWord: 0,
    errRecord: [],
    errMsgShow: false,
    inpVal: '',
    tabIndex: 1,
    toolbar: {
      textShow: 'all',
      pronounce: {
        func: true,
        mode: 1
      }
    },
    unhide: {},
    isReview: false
  },
  async onLoad(args) {
    wx.setNavigationBarTitle({ title: args.t })

    const { glossary } = await request('/glossary/' + args.id, Toast, this)
    const local = wx.getStorageSync('save')

    let data = {
      words: glossary,
      toolbar: wx.getStorageSync('toolbar') || this.data.toolbar
    }

    if (local && local[args.id])
      data = { ...data, ...local[args.id] }

    this.args = args
    this.setData(data)
  },
  changeTab(e) {
    const { words } = this.data
    const i = e.detail.current
    let data = {
      tabIndex: i,
      errMsgShow: false
    };

    switch(i) {
      case 1:
        const local = wx.getStorageSync('save')
        const { id } = this.args
        if (local && local != '' && local[id])
          data = { ...data, ...local[id] }
        else
          data = { ...data, ...{
            curWord: 0,
            errRecord: []
          }}
        break;
      case 2:
        const n = this.randomNum(0, words.length - 1)
        data.curWord = n
        data.errRecord = []
        break;
    }

    this.setData(data)
  },
  nextWord({detail}) {
    const { words, curWord, errRecord, isReview } = this.data
    const word = words[curWord].word.toLowerCase()
    const inpWord = detail.value.toLowerCase()
    let data = { errRecord, isReview }

    if (inpWord == word) {
      data.curWord = curWord + 1

      if (data.curWord >= words.length || isReview) {
        if (data.errRecord.length) {
          data.isReview = true
          data.curWord = data.errRecord.shift()
        } else {
          Dialog.confirm({
            context: this,
            title: 'All words are OK',
            closeOnOverlayClick: true,
            content: '当前单词表已背完，重置后可重复背单词',
            confirmBtn: 'OK :)'
          })
          data.isReview = false
          data.curWord = 0
          data.errRecord = []
        }
      }

      data.errMsgShow = false
      data.inpVal = ''
    } else {
      if (!errRecord.includes(curWord))
        data.errRecord.push(curWord)
      data.errMsgShow = true
    }

    const { id } = this.args
    let local = wx.getStorageSync('save')

    local = local || {}
    local[id] = {
      curWord: 'curWord' in data ? data.curWord : curWord,
      errRecord: data.errRecord,
      isReview: data.isReview
    }

    wx.setStorageSync('save', local)

    this.setData(data)

    if (!data.errMsgShow)
      this.readWord()
  },
  randomWord({detail}) {
    const { words, curWord, errRecord } = this.data
    const word = words[curWord].word.toLowerCase()
    const inpWord = detail.value.toLowerCase()
    const data = { errRecord }

    if (inpWord == word) {
      const n = this.randomNum(0, words.length - 1)

      data.curWord = n
      data.errMsgShow = false
      data.inpVal = ''
      this.readWord()
    } else {
      if (!errRecord.includes(curWord))
        data.errRecord.push(curWord)
      data.errMsgShow = true
    }

    this.setData(data)
  },
  randomNum(minNum,maxNum) {
    return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10);
  },
  deleteSave() {
    const dialogConfig = {
      context: this,
      title: 'Sure Delete?',
      closeOnOverlayClick: true,
      content: '要删除当前的数据记录吗？',
      confirmBtn: 'Sure',
      cancelBtn: 'No',
    };

    Dialog.confirm(dialogConfig)
      .then(() => {
        const local = wx.getStorageSync('save')
        delete local[this.args.id]
        wx.setStorageSync('save', local)
        this.setData({
          curWord: 0,
          errRecord: [],
          errMsgShow: false,
          inpVal: ''
        })
        Toast({
          context: this,
          selector: '#t-toast',
          message: 'Successfully deleted',
        })
      })
      .catch(() => {})
  },
  readWord(e) {
    const that = this
    const { func, mode } = this.data.toolbar.pronounce
    const { words, curWord } = this.data
    let word = words[curWord].word

    if (!func || this.readLock) return;
    if (e && e.currentTarget.dataset.w)
      word = e.currentTarget.dataset.w

    wx.downloadFile({
      url: `https://dict.youdao.com/dictvoice?type=${mode}&audio=${word}`,
        success: function (res) {
          const audio = wx.createInnerAudioContext()
          const audioOption = wx.setInnerAudioOption

          that.readLock = true

          if (audioOption) {
            audioOption({
              obeyMuteSwitch: false,
              autoplay: true
            })
          } else {
            audio.obeyMuteSwitch = false
            audio.autoplay = true
          }

          audio.src = res.tempFilePath
          audio.play()
          audio.onEnded(() => {
            audio.destroy()
            that.readLock = false
          })
       }
    })
  },
  toolbarHandle(e) {
    const curData = e.currentTarget.dataset
    const data = e.target.dataset

    if (JSON.stringify(curData) == JSON.stringify(data)) return;

    let { toolbar, unhide } = this.data
    const k = curData.k
    const val = data.v || !toolbar[k][data.k]

    if (data.k)
      toolbar[k][data.k] = val
    else
      toolbar[k] = val
    
    if (k == 'textShow')
      unhide = {}
    
    wx.setStorageSync('toolbar', toolbar)
    this.setData({ toolbar, unhide })
  },
  checkHidden(e) {
    const { id } = e.currentTarget.dataset
    let { toolbar, unhide } = this.data

    if (toolbar.textShow == 'all') return;

    this.readLock = true

    if (unhide[id]) {
      delete unhide[id]
    } else {
      unhide[id] = true
    }

    this.setData({
      unhide
    }, () => {
      this.readLock = false
    })
  },
  onShareAppMessage() {
    const { wbid, t, p } = this.args
    const name = p.replace(/\s+/g, '');

    return {
      title: `来背 ${p} ${t}`,
      path: `/pages/recite/recite?wbid=${wbid}&t=${t}&p=${p}`,
      imageUrl: `/img/ShareCover.jpg`
    }
  }
})