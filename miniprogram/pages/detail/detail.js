// pages/detail/detail.js
import { callCloudFunction } from '../../utils/cloud_helper'
import { formatDate } from '../../utils/format_date'

function handleEndDatetime(datetime) {
  let dateZH = formatDate(new Date(datetime), 'YY-MM-DD')
  let dateArr = dateZH.split('-')
  let temp = ''
  if (dateArr[1] === 12) {
    temp = `${dateArr[0] + 1}-01-${dateArr[2]}`
  }
  console.log(new Date(`${dateArr[0]}-${Number(dateArr[1]) + 1}-01`))
  return new Date(`${dateArr[0]}-${Number(dateArr[1]) + 1}-01`).getTime()
}

const defaultStartDatetime = new Date('1990').getTime()
const defaultEndDatetime = new Date().getTime()
const defaultQueryDatetime = handleEndDatetime(new Date().getTime())

Page({

  /**
   * 页面的初始数据
   */
  data: {
    startDateZH: formatDate(defaultStartDatetime, 'YY-MM'),
    endDateZH: formatDate(defaultEndDatetime, 'YY-MM'),

    maxDate: new Date().getTime(),
    minDate: new Date('1990-01-01').getTime(),

    startDatetime: defaultStartDatetime,
    endDatetime: defaultEndDatetime,
    startDatetimeZH: formatDate(defaultStartDatetime, 'YY/MM/DD'),
    endDatetimeZH: formatDate(defaultEndDatetime, 'YY/MM/DD'),

    queryDatetime: defaultQueryDatetime,
    tempDate1: null,

    tempStartDatetime: defaultStartDatetime,
    tempEndDatetime: defaultEndDatetime,
    tempStartDatetimeZH: formatDate(defaultStartDatetime, 'YY/MM/DD'),
    tempEndDatetimeZH: formatDate(defaultEndDatetime, 'YY/MM/DD'),

    dateType: 1,

    currentNum0: 0,
    currentNum1: 0,
    billList: [],
    bill: null,
    billStatistic: null,
    popupShow: false,
    popupDateShow: false,
    dateActive: 0,
  },

  getBillList() {
    callCloudFunction('getBill', { date: this.data.queryDatetime }).then(res => {
      console.log(res)
      this.setData({
        'billList': res.result.arr
      })
      this.handleBillList(this.data.startDatetime, this.data.queryDatetime, res.result.arr)
    })
  },

  handleBillList(startDatetime, endDatetime, billList) {

    // 筛选时间范围内账单
    let tempList = []
    for (let index = 0; index < billList.length; index++) {
      let value = billList[index].bill_date
      if (value >= startDatetime && value <= endDatetime) {
        tempList.push(billList[index])
      }
    }

    // 账单时间排序
    tempList = tempList.sort((a, b) => {
      return a.bill_date - b.bill_date
    })
    console.log(tempList)

    // 以月分类
    let bill = {}
    tempList.reverse().map(ele => {
      let billDatetime = ele.bill_date
      let date = `${new Date(billDatetime).getFullYear()}-${new Date(billDatetime).getMonth() + 1}`
      if (bill[date] === undefined) {
        bill[date] = []
      }
      bill[date].push(ele)
    })

    // 以日分类
    Object.keys(bill).forEach(ele => {
      let obj = {}
      bill[ele].forEach(element => {
        let tempDate = new Date(element.bill_date).getDate()
        if (obj[tempDate] === undefined) {
          obj[tempDate] = []
        }
        obj[tempDate].push(element)
      });
      bill[ele] = obj
    });

    let tempBill = {}
    Object.keys(bill).forEach(ele => {
      let tempObj = {}
      Object.keys(bill[ele]).forEach(element => {
        tempObj[new Date(`${ele}-${element}`).getTime()] = bill[ele][element]
      });
      bill[ele] = tempObj
      tempBill[new Date(ele).getTime()] = bill[ele]
    });



    let tempStatistic = {}
    Object.keys(tempBill).forEach(ele1 => {
      let obj1Amount0 = 0
      let obj1Amount1 = 0

      if (tempStatistic[ele1] === undefined) {
        tempStatistic[ele1] = {}
      }

      Object.keys(tempBill[ele1]).forEach(ele2 => {
        let obj2Amount0 = 0
        let obj2Amount1 = 0

        if (tempStatistic[ele1][ele2] === undefined) {
          tempStatistic[ele1][ele2] = {}
        }

        tempBill[ele1][ele2].forEach(ele3 => {
          if (ele3.mode) {
            obj2Amount1 += ele3.amount
          } else {
            obj2Amount0 += ele3.amount
          }
        })

        tempStatistic[ele1][ele2].amount0 = obj2Amount0
        tempStatistic[ele1][ele2].amount1 = obj2Amount1
        tempStatistic[ele1][ele2].date = `${new Date(Number(ele2)).getMonth() + 1}月${new Date(Number(ele2)).getDate()}日 ${this.getWeek(Number(ele2))}`

        obj1Amount0 += obj2Amount0
        obj1Amount1 += obj2Amount1

      })

      tempStatistic[ele1].amount0 = obj1Amount0
      tempStatistic[ele1].amount1 = obj1Amount1
      tempStatistic[ele1].date = `${new Date(Number(Number(ele1))).getFullYear()}年${new Date(Number(Number(ele1))).getMonth() + 1}月`


    });

    console.log('tempStatistic', tempStatistic)

    this.setData({
      bill: tempBill,
      billStatistic: tempStatistic
    })
    console.log(tempBill)

  },

  getWeek(time) {
    let arr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return arr[new Date(time).getUTCDay()]
  },

  toInfo(e) {
    console.log(e.currentTarget.dataset.info)
    let info = e.currentTarget.dataset.info
    wx.navigateTo({
      url: '../info/info',
      success(res) {
        res.eventChannel.emit('acceptDataFromDetailPage', { data: info })
      }
    })
  },

  handleOverlay() {
    this.setData({
      popupShow: false
    })
  },
  handleDateInput(e) {
    console.log(e)
    this.setData({
      tempDate1: e.detail,
    })
  },

  handlePopupConfirm() {
    if (this.data.dateActive == 0) {
      this.setData({
        startDatetime: defaultStartDatetime,
        startDateZH: formatDate(defaultStartDatetime, 'YY-MM'),
        endDatetime: this.data.tempDate1,
        endDateZH: formatDate(this.data.tempDate1, 'YY-MM'),
        queryDatetime: handleEndDatetime(this.data.tempDate1),
        popupShow: false,
      })
    } else {
      this.setData({
        startDatetime: this.data.tempStartDatetime,
        startDatetimeZH: this.data.tempStartDatetimeZH,
        startDateZH: this.data.tempStartDatetimeZH,
        endDatetime: this.data.tempEndDatetime,
        endDatetimeZH: this.data.tempEndDatetimeZH,
        endDateZH: this.data.tempEndDatetimeZH,
        queryDatetime: handleEndDatetime(this.data.tempEndDatetime),
        popupShow: false,
      })
    }
    this.getBillList()
    this.setData({
      dateType: 1
    })
  },

  handlePopupClose() {
    this.setData({
      popupShow: false,
    })
  },

  handleOpenPopup() {
    this.setData({
      popupShow: true
    })
  },

  handleDatetimeRange(e) {
    let index = e.currentTarget.dataset.index
    this.setData({
      dateType: index,
      popupDateShow: this.data.dateType == index ? !this.data.popupDateShow : true
    })
  },

  handleDatetimeInput(e) {
    if (this.data.dateType == 2) {
      this.setData({
        tempEndDatetime: e.detail,
        tempEndDatetimeZH: formatDate(e.detail, 'YY/MM/DD')
      })
    } else {
      this.setData({
        tempStartDatetime: e.detail,
        tempStartDatetimeZH: formatDate(e.detail, 'YY/MM/DD')
      })
    }
  },

  handleDateChange(e) {
    if (e.detail.index == 1 && this.data.dateActive == 0) {
      this.setData({
        dateActive: e.detail.index,
        popupDateShow: false
      })
    } else {
      this.setData({
        dateActive: e.detail.index,
        popupDateShow: this.data.dateType && !!e.detail.index
      })
    }
  },

  handleDateFast(e) {
    let index = e.currentTarget.dataset.index
    let start = null
    let end = null
    if (index == 1) {
      start = new Date(`${new Date().getFullYear()}-01-01`).getTime()
      end = new Date().getTime()
    } else if (index == 2) {
      start = new Date(`${new Date().getFullYear() - 1}-01-01`).getTime()
      end = new Date(`${new Date().getFullYear() - 1}-12-31`).getTime()
    } else if (index == 3) {
      let year = Number(new Date().getFullYear())
      let month = Number(new Date().getMonth()) + 1
      let date = new Date().getDate()
      let diff = month - 2
      if (diff < 0) {
        year -= 1
        month = 12 + diff
      } else {
        month -= 2
      }
      if (month < 10) {
        month = `0${month}`
      }
      start = new Date(`${year}-${month}-${date}`).getTime()
      end = new Date().getTime()
    } else if (index == 4) {
      let year = Number(new Date().getFullYear())
      let month = Number(new Date().getMonth()) + 1
      let date = new Date().getDate()
      let diff = month - 5
      if (diff < 0) {
        year -= 1
        month = 12 + diff
      } else {
        month -= 5
      }
      if (month < 10) {
        month = `0${month}`
      }
      start = new Date(`${year}-${month}-${date}`).getTime()
      end = new Date().getTime()
    } else if (index == 5) {
      let year = Number(new Date().getFullYear()) - 1
      let month = Number(new Date().getMonth()) + 1
      let date = new Date().getDate()
      start = new Date(`${year}-${month}-${date}`).getTime()
      end = new Date().getTime()
    }

    this.setData({
      startDatetime: start,
      startDateZH: formatDate(start, 'YY-MM'),
      endDatetime: end,
      endDateZH: formatDate(end, 'YY-MM'),
      queryDatetime: handleEndDatetime(end),
      popupShow: false
    })
    this.getBillList()
  },

  handleShare(e){
    let date = `${e.currentTarget.dataset.date}01`.replace('年', '/').replace('月', '/')
    let month = Number( date.split('/')[1])
    let year = Number(date.split('/')[0])
    let startDatetime =  new Date(date).getTime()
    if(month + 1 > 12){
      year += 1
      month = 1
    }else{
      month += 1
    }
    let endDatetime = new Date(`${year}/${month}/01`).getTime()
    wx.navigateTo({
      url: `../share/share?startDatetime=${startDatetime}&endDatetime=${endDatetime}`
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getBillList()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})