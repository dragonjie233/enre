import request from '../../util/request';
import Dialog from 'tdesign-miniprogram/dialog/index';
import { Toast } from 'tdesign-miniprogram';

Page({
  args: {},
  data: {
    words: [],
    curWords: [],
    record: [],
    errRecord: [],
    errMsgShow: false,
    inpVal: '',
    tabIndex: 1
  },
  async onLoad(args) {
    this.args = args
    wx.setNavigationBarTitle({ title: args.t })
    const words = await request('/glossary/' + args.wbid, Toast, this)
    const localDB = wx.getStorageSync(args.wbid)
    let data = {
      words,
      curWords: words
    }

    if (localDB != '') {
      data = {...data, ...localDB}
      if ('record' in localDB)
        data.curWords = words.filter(item => !localDB.record.includes(item.id))
    }

    this.setData(data)
  },
  changeTab(e) {
    const { words } = this.data
    const i = e.detail.current
    let data = {
      tabIndex: i,
      errMsgShow: false,
      curWords: words
    };

    switch(i) {
      case 1:
        const localDB = wx.getStorageSync(this.args.wbid)
        if (localDB != '') {
          data = {...data, ...localDB}
          if ('record' in localDB)
            data.curWords = words.filter(item => !localDB.record.includes(item.id))
        }
        break;
      case 2:
        const n = this.randomNum(0, words.length)
        data.curWords = [words[n]]
        data.errRecord = []
        break;
    }

    this.setData(data)
  },
  nextWord({detail}) {
    const { curWords, record, errRecord } = this.data
    const { id, word } = curWords[0]
    const inpWord = detail.value.toLowerCase()
    const data = {}
    
    data.record = (!record.includes(id)) ? [...record, id] : record
    data.errRecord = errRecord

    if (inpWord == word.toLowerCase()) {
      curWords.shift()
      data.curWords = curWords
      data.errMsgShow = false
      data.inpVal = ''
      this.readWord()
    } else {
      if (!errRecord.includes(id))
        data.errRecord = [...errRecord, id]
      data.errMsgShow = true
    }

    wx.setStorageSync(this.args.wbid, {
      record: data.record,
      errRecord: data.errRecord
    })
    
    this.setData(data)
  },
  randomWord({detail}) {
    const { words, curWords, record, errRecord } = this.data
    const { id, word } = curWords[0]
    const inpWord = detail.value.toLowerCase()
    const data = {}

    if (inpWord == word.toLowerCase()) {
      const n = this.randomNum(0, words.length)

      data.curWords = [words[n]]
      data.errMsgShow = false
      data.inpVal = ''
      this.readWord()
    } else {
      if (!errRecord.includes(id))
        data.errRecord = [...errRecord, id]
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
        wx.removeStorageSync(this.args.wbid)
        this.setData({
          curWords: this.data.words,
          record: [],
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
    let word = this.data.curWords[0].word

    if (e && e.currentTarget.dataset.w)
      word = e.currentTarget.dataset.w

    wx.downloadFile({
      url: 'https://dict.youdao.com/dictvoice?type=0&audio=' + word,
        success: function (res) {
          const audio = wx.createInnerAudioContext()
          const audioOption = wx.setInnerAudioOption

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
          audio.onEnded(() => audio.destroy())
       }
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