/*
 * @Description: 长链接
 * @Author: Ask
 * @LastEditors  : Ask
 * @Date: 2019-08-28 17:56:24
 * @LastEditTime : 2019-12-24 10:10:08
 */
// const wrokerFile = require("./socketWorker");
import wrokerFile from "./socketWorker";

export class LongLink {
  static instance: LongLink; // LongLink的实例
  socketWorker: any; // woker的实例
  lockReconnect: any; // 重连锁
  vm: any; // vue的实例
  reconnectTimer: any; // vue的实例
  longMsgPullTimer: any; // vue的实例
  config: any;
  onMsg: any;

  constructor(options) {
    this.config = {
      // 长连接配置。
      socketFailures: 0, // 长连接失败次数。
      socketFailureTicks: [0, 0, 0, 0, 0], // 长连接最近5次失败时刻。
      socketProtocol: "wss", // 长连接协议。
      pingInterval: 30 * 1000, // 长连接 ping 间隔时长。
      checkInterval: 35 * 1000, // 长连接重连间隔时长。
      scsInterval: 10 * 1000, // 短连接拉取数据周期--后端参数。
      ajaxInterval: 4 * 1000, // 短连接拉取数据周期--前端设置。
      ackSyncInterval: 10 * 1000, // 长连接 pull 周期
      minReconnectInterval: 3 * 1000, // 长连接最短重连间隔
      maxReconnectTimes: 3, // 长链接最大重连次数
      protocol: /^https/i.test(window.location.protocol) ? "wss" : "ws",
      host: "",
      port: "",
      msgVer: 0, // 消息流水版本号
      longConnectStatus: 3, // 长链接状态
      wsOpenTime: 0 // 长链接beforeopen的时间
    };
    this.config = Object.assign(this.config, options);
    this.onMsg = options.onMessage;
    // 遍历赋值
    Object.keys(options).map(key => {
      this[key] = options[key];
    });
    window.addEventListener("beforeunload", () => {
      this.disconnect();
    });
    this.createWorker(wrokerFile);
    this.connect(options);
  }

  /**
   * @Description: 单例创建一个对象
   * @param {object} options
   * @return: obj
   */
  static getInstance(options) {
    if (!LongLink.instance) {
      LongLink.instance = new LongLink(options);
    }
    return LongLink.instance;
  }

  createWorker(wrokerFile) {
    this.socketWorker = new Worker(URL.createObjectURL(new Blob([wrokerFile])));
    console.log("socketWorker 创建完成");
    this.socketWorker.onmessage = e => {
      // console.log("socketWorker 接受消息", e.data);
      this.dealSocketMsg(e.data);
    };
  }

  /**
   * @Description: 建立链接
   * @param {type}
   * @return:
   */
  async connect(options?) {
    // 如果已经有连接,先关闭上一个连接
    if (this.config.longConnectStatus === 1) {
      this.disconnect();
    }

    console.log(this.config);
    // 打开长链接,传入配置信息
    this.socketWorker.postMessage({
      cmd: "open",
      url: "ws://127.0.0.1:4000", //this.config.protocol + "://",
      interval: {
        pingInterval: this.config.pingInterval,
        checkInterval: this.config.checkInterval
      }
    });
  }

  /**
   * @Description: 关闭长链接
   */
  close() {
    this.socketWorker.postMessage({
      cmd: "close"
    });
  }
  /**
   * @Description: 长链接重连
   */
  reconnect() {
    console.log("============", this.config.socketFailures);
    if (this.config.socketFailures >= this.config.maxReconnectTimes) {
      let msg = `重连次数已经达到最大重连次数(${this.config.socketFailures})限制,请刷新浏览器.如还不能解决问题,请联系管理员~`;
      this.vm.$message({
        type: "error",
        message: msg
      });
      console.error(msg);
      console.error("socketFailureTicks", this.config.socketFailureTicks);
      this.disconnect();
      return;
    }
    if (this.config.lockReconnect) {
      let msg = `第${this.config.socketFailures}次长链接重连,锁状态为${
        this.config.lockReconnect ? "打开" : "关闭"
      }`;
      console.error(msg);
      this.vm.$message({
        type: "info",
        message: msg
      });
      return;
    }
    console.log("开始重连~");
    // 加锁
    this.config.lockReconnect = true;
    // 记录连接失败的时间
    this.config.socketFailureTicks.push(new Date());
    this.config.socketFailureTicks.shift();
    this.config.socketFailures++;
    // 次数限制-----每隔failTimes次手动拉取一次数据
    if (this.config.socketFailures % this.config.idc.failTimes === 0) {
      console.log("reconnect========");
      this.pullMsg();
    }
    // 时间限制-----大于最小重连时间内可以重连
    let length = Date.now() - this.config.wsOpenTime;
    if (length > this.config.minReconnectInterval) {
      this.connect();
      this.config.lockReconnect = false;
    } else {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        this.connect();
        this.config.lockReconnect = false;
      }, this.config.minReconnectInterval - length);
    }
  }
  // 断开链接
  disconnect() {
    // 清除定时器
    clearTimeout(this.longMsgPullTimer);
    clearTimeout(this.reconnectTimer);
    // 关闭
    this.close();
  }
  /**
   * @Description: 拉消息
   */
  async pullMsg() {
    // 目前hxmis没有部署长链接模块,所以无法使用短连接拉取
    this.pullLongMsg();
    // 如果长链接的状态是已连接,使用长链接,否
    // if (this.config.longConnectStatus === 1) {
    //   this.pullLongMsg();
    // } else {
    //   // 短链接拉取数据
    //   try {
    //     let res = await this.pullShortMsg();
    //     // 拉到消息直接处理
    //     this.onMsg(res);
    //   } catch (err) {
    //     console.error(err);
    //   }
    // }
  }

  /**
   * @Description: 长链接拉取
   * @param {type}
   * @return:
   */
  pullLongMsg() {
    this.socketWorker.postMessage({
      cmd: "send",
      msg: {
        sig_no: this.config.sigNo,
        data: {
          type: "test",
          cur_ver_id: this.config.msgVer
        }
      }
    });

    // 定时拉取长链接消息
    // clearTimeout(this.longMsgPullTimer);
    // this.longMsgPullTimer = setTimeout(() => {
    //   console.log("longMsgPullTimer");
    //   this.pullLongMsg();
    // }, this.config.ackSyncInterval);
  }

  /**
   * @Description: 长链接拉取
   * @param {type}
   * @return:
   */
  pushLongMsg(data) {
    this.socketWorker.postMessage({
      cmd: "send",
      msg: {
        sig_no: this.config.sigNo,
        data
      }
    });
  }

  /**
   * @Description: 当前对象的配置
   */
  // assembleConfig(conf) {
  //   // 使用北京的机房
  //   let wsConf = conf.idc.idcList.find(item => item.idcTag === "BJ");
  //   this.config = { ...this.config, ...conf, ...wsConf };
  //   this.config.host = this.config[this.config.protocol + "Host"];
  //   this.config.port = this.config[this.config.protocol + "Port"];
  // }

  /**
   * @Description: 处理50003的消息
   * @param {type}
   * @return:
   */
  dealNormalMsg(msg) {
    try {
      msg = msg instanceof Object ? msg : JSON.parse(msg);
    } catch (err) {
      console.error(err);
    }
    this.onMsg(msg.data);
  }

  /**
   * @Description: 处理onMsg消息
   * @param {type}
   * @return:
   */
  dealOnMsg(msg) {
    switch (msg.sig_no) {
      case 50001: // 通知拉取消息。
        this.pullMsg();
        break;
      case 50003: // 拉取的消息到达。
        // console.log(msg);
        this.dealNormalMsg(msg);
        break;
      case 50005: // 暂时先不相应该命令.现在长链接在推送完第一波数据,直接关闭
        console.error("code 500005", msg);
        // this.close();
        // if (msg.err_no === 0) {
        //   this.config.socketFailures = 3;
        // } else {
        //   this.socketWorker.postMessage({ cmd: "close" });
        // }
        break;
      default:
    }
  }
  /**
   * @Description: 处理socket消息
   * @param {type}
   * @return:
   */
  dealSocketMsg(data) {
    switch (data.cmd) {
      case "beforeOpen":
        // 打开连接
        this.config.longConnectStatus = 0;
        this.config.wsOpenTime = Date.now();
        break;
      case "onOpen":
        // 连接成功
        this.config.longConnectStatus = 1;
        this.pullMsg();
        this.dealNormalMsg({
          sig_no: 50003,
          data: { type: "onOpen" }
        });

        break;

      case "onMsg":
        let msg = data.msg;
        this.dealOnMsg(msg);
        break;

      case "onClose":
        console.log("onClose");
        // 关闭连接
        this.config.longConnectStatus = 3;
        break;
      case "onError":
        console.error("onError");
        this.reconnect();
        break;
      default:
    }
  }
  /**
   * @Description: 单例模式必须要有销毁function
   */
  static destroy() {
    // this.instance && this.instance.disconnect() && (this.instance = null);
  }
}
