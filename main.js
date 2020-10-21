// ==UserScript==
// @name         BUPT reservation V3.0
// @namespace    zzp
// @version      3.0
// @description  北邮体育馆预约，全新改版，跳过获取预约列表这一费时操作，直接获取预约url
// @description  user-agent:mozilla/5.0 (linux; u; android 4.1.2; zh-cn; mi-one plus build/jzo54k) applewebkit/534.30 (khtml, like gecko) version/4.0 mobile safari/534.30 micromessenger/5.0.1.352
// @author       zzp
// @run-at       document-start
// @match        https://reservation.bupt.edu.cn/index.php/Wechat/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // setting 记得在设置里改脚本运行时间为document-start
    var item = 2 //0：羽毛球 1：乒乓球 2：游泳馆 3：健身房
    var hour = 10, minute = 0 //开抢时间点(当本地时间大于该时间点时自动启动核心函数)
    var timeIndex = [1] //预约时间段序号列表（按时间顺序排时间段，列表内数字代表相应序号时间段）  例如：某一天有三个时间段："08:00-09:20","10:00-11:20","12:00-13:20",[2,3]代表抢10点与12点的
    var posIndex = [[1]] //该时间段内位置列表（乒乓球和羽毛球同一时间段内有多个位置，默认为1，选第一个）游泳馆和健身房同一时间段内就一个，就是1  timeIndex与posIndex长度一致
    var autoPay = 0 //是否自动用余额支付，0代表不自动，1代表自动（注意，如若不自动，尽量快点支付，因为只有支付完成后才算预约上，否则可能会出现在支付过程中位置已被别人抢完）
    var flag = 1 //1代表默认抢明天的，否则抢date所表示的，flag为1则date属性无效
    var date = "20201019" //所要预约的日期 一共8位，例如:20200506

    //e.g.羽毛球一天有三个时间段 "08:00-09:20","10:00-11:20","12:00-13:20"，每个时间段有5个位置，我想在2点8分开始抢明天10:00-11:20的一号位置，12:00-13:20的四号五号位置，自动支付，设置如下：
    //item=0;hour=2;minute=8;timeIndex=[2,3];posIndex=[[1],[4,5]];autoPay=1;flag=1;
    //e.g.游泳馆一天有一个时间段 "18:00-20:00"，每个时间段有1个位置，我想在10点开始抢明天位置，不自动支付，设置如下：
    //item=2;hour=10;minute=0;timeIndex=[1];posIndex=[[1]];autoPay=1;flag=1;

    // code
    var area_id,query_date,reserve_td_ids;
    var url = window.location.href
    var updateTime = 50

    //area_id
    var area_list=['5982','5983','5984','5985']
    area_id=area_list[item]

    //query_date
    if(flag==1){
        var dateTime = new Date()
        var tomorrow = new Date(dateTime.setDate(dateTime.getDate()+1));
        var year = String(tomorrow.getFullYear())
        var month = String(tomorrow.getMonth()+1); if(month.length==1){ month='0'+month }
        var day = String(tomorrow.getDate()); if(day.length==1){ day='0'+day }
        query_date=year+month+day
    }
    else query_date=date

    //reserve_td_ids
    var reserve_td_id_list = []
    var A_list=[['15418','15419','15420','15421','15422','15423','15424','15425','15426'],['15427','15428','15429','15430','15431','15432','15433','15434'],['15455'],['15415']]
    var C_list=[['10','11','12','13','14'],['01','02','03','04','05','06','07','08','09','10','11','12','13','14'],['03'],['01','02','03','04','05','06','07']]
    for(var i=0;i<timeIndex.length;i++){
        for(var j=0;j<posIndex[i].length;j++){
            reserve_td_id_list.push(A_list[item][posIndex[i][j]-1]+'_'+query_date+C_list[item][timeIndex[i]-1])
        }
    }
    reserve_td_ids=reserve_td_id_list.join(',')
    console.log(area_id+','+query_date+','+reserve_td_ids)

    if(url.indexOf("Display/index")!=-1){
        var zpInterval = setInterval(()=>{
            var d = new Date()
            if(Number(d.getHours())>hour || (Number(d.getHours())>=hour && Number(d.getMinutes())>=minute)){
                window.location = '/index.php/Wechat/Booking/confirm_booking?area_id=' + area_id + '&td_id=' + reserve_td_ids + '&query_date=' + query_date;
                clearInterval(zpInterval)
            }
        },10)
    }

    function waitForElementToDisplay(xpath, time,func) {
        if(document.evaluate(xpath, document).iterateNext()!=null) {
            func()
            return;
        }
        else {
            setTimeout(function() {
                waitForElementToDisplay(xpath, time,func);
            }, time);
        }
    }

    if(url.indexOf("Booking/confirm_booking")!=-1){
        var e = ""
        document.addEventListener('DOMContentLoaded',function(){
            e = "//input[@value='确认预约']"
            waitForElementToDisplay(e,updateTime,()=>{
                document.evaluate(e, document).iterateNext().click()
                e = "//div[@role and contains(@style,'block')]"
                waitForElementToDisplay(e,updateTime,()=>{
                    setTimeout(()=>{
                        document.evaluate("//input[@id='balance_pay']", document).iterateNext().click()
                        if(autoPay==1){
                            document.evaluate("//button[contains(@class,'g-submit')]", document).iterateNext().click()
                        }
                    },500)
                })
            })
        })
        window.onload= ()=>{
            if(document.evaluate("//div[contains(string(),'存在不可预约')] | //div[contains(string(),'不允许同时预约不同的预约对象')]", document).iterateNext()!=null
              || document.evaluate("//input[@value='确认预约']", document).iterateNext()==null ){
                window.location = '/index.php/Wechat/Booking/confirm_booking?area_id=' + area_id + '&td_id=' + reserve_td_ids + '&query_date=' + query_date;
            }
        }

    }


})();