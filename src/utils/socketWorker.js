/*
 * @Description: This is a description
 * @Author: Ask
 * @LastEditors  : Ask
 * @Date: 2019-08-28 16:58:10
 * @LastEditTime : 2019-12-22 14:33:58
 */
const str = `
/**
 * @author ask
 * @description    // 附加说明。
 *   1) 本脚本通过建立长连接与服务器进行通讯，设计为被 WebWorker 加载在独立的线程中运行，以避免对页面主线程的阻塞影响。
 *   2) 脚本响应 'open'、'send' 以及 'close' 三种消息命令，分别执行长连接的打开、消息发送以及关闭。
 *   3) 脚本发出 'onOpen'、'onMsg'、'onClose' 和 'onError' 四种消息以通知主线程长连接的状态。
 *      onMsg 消息结构如下：
 *      {
 *        cmd: 'onMsg',            // 消息类型
 *        msg: {Object|String},    // 消息内容(JSON 或 字符串)
 *      }
 *      onError 消息结构如下：
 *      {
 *        cmd: 'onError',     // 消息类型
 *        errNo: {Number},    // 错误代码
 *        errMsg: {String}    // 错误描述
 *      }
 *      其他类型的消息结构类似，消息体仅包含 'cmd'，无其他内容。
 *    4) websocket 的readyState 常量枚举类型如下：
 *          {
 *            0: 'CONNECTING'       // 连接未开启
 *            1: 'OPEN'             // 连接已开启并准备好通信
 *            2: 'CLOSING'          // 连接正在关闭
 *            3: 'CLOSED'           // 连接已经关闭，或者连接无法建立
 *          }
 *
 */
var DEFAULT_SETTING = {
  PING_INTERVAL: 15 * 1000, //发送ping周期
  MIN_PING_INTERVAL: 15 * 1000, //至少发送一次ping的周期
  CHECK_INTERVAL: 20 * 1000 //连接有效性周期
};
var PING_MESSAGE = "#9#";
var PONG_MESSAGE = "#10#";

var webSocket;
var heartBeatsTimer;
var connectionPendingTimer;
var sendPingTimer;
var interval;
var checkValidTimer;

function openSocket(url) {
  webSocket && webSocket.readyState < 2 && webSocket.close();

  clearTimeout(checkValidTimer);
  clearTimeout(connectionPendingTimer);
  webSocket = new WebSocket(url);
  postMessage({
    cmd: "beforeOpen"
  });

  // 长链接打开,心跳打开,通知父级
  webSocket.onopen = function() {
    clearInterval(heartBeatsTimer);
    loopSendPing();
    postMessage({
      cmd: "onOpen"
    });
  };

  // 长链接新消息回调
  webSocket.onmessage = function(msg) {
    let msgData;
    if (String(msg.data) === PONG_MESSAGE) {
      msgData = msg.data;
    } else {
      msgData = JSON.parse(msg.data);
    }
    postMessage({
      cmd: "onMsg",
      msg: msgData
    });

    clearTimeout(connectionPendingTimer);
    clearTimeout(checkValidTimer);

    function isMessage(data) {
      var sig_no = Number(data.sig_no);
      return sig_no === 50001 || sig_no === 50003;
    }

    //收到pong、50001、50003时检测是否失效,无效则关闭
    if (String(msgData) === PONG_MESSAGE || isMessage(msgData)) {
      // loopCheckValid(); 
    }
  };

  // 长链接关闭回调
  webSocket.onclose = function() {
    clearInterval(heartBeatsTimer);
    clearInterval(sendPingTimer);
    postMessage({
      cmd: "onClose"
    });
  };
}

/**
 * @Description: worker 的消息监听器,监听主线程发来的消息
 * @param {type}
 * @return:
 */
onmessage = function(e) {
  switch (e.data.cmd) {
    case "open":
      try {
        // 长链接传入的时间配置
        interval = e.data.interval;
        // 打开长链接
        openSocket(e.data.url);
      } catch (ex) {
        postMessage({
          cmd: "onError",
          errNo: 1,
          errMsg: "建立长连接失败(" + ex.message + ")"
        });
      }
      break;

    case "send":
      var msg = JSON.stringify(e.data.msg);
      if (msg && webSocket && Number(webSocket.readyState) === 1) {
        sendSocket(msg);
      }
      break;

    case "close":
      webSocket && webSocket.readyState < 2 && webSocket.close();
      clearTimeout(connectionPendingTimer);
      clearTimeout(checkValidTimer);
      break;

    default:
  }
};

//默认每隔180秒发一个ping
function loopSendPing() {
  clearTimeout(sendPingTimer);
  sendPingTimer = setTimeout(function() {
    sendSocket(PING_MESSAGE);
    loopSendPing();
  }, DEFAULT_SETTING.MIN_PING_INTERVAL);
}

//每隔 checkInterval 秒检测连接有效性
function loopCheckValid() {
  clearTimeout(checkValidTimer);
  checkValidTimer = setTimeout(function() {
    webSocket && webSocket.readyState < 2 && webSocket.close();
  }, interval.checkInterval || DEFAULT_SETTING.CHECK_INTERVAL);
}

//pingInterval 秒内没有发送消息则发送 ping
function sendSocket(msg) {
  webSocket.send(msg);
  clearTimeout(heartBeatsTimer);
  heartBeatsTimer = setTimeout(function() {
    sendSocket(PING_MESSAGE);
    loopSendPing();
  }, interval.pingInterval || DEFAULT_SETTING.PING_INTERVAL);
}
`

export default str;