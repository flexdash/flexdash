/* Websock - Simple websocket connection to back-end server.
   This file contains the code that connects to the server.
   Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
*/

import Vue from 'vue'
import ReconnectingWebSocket from 'reconnecting-websocket'

export default class WebsockConnection {
  // config: { enabled: Boolean, address: String }
  constructor (sendMsg, recvMsg) {
    this.sendMsg = sendMsg
    this.recvMsg = recvMsg
    this.rws = null // ReconnectingWebSocket

    // data fed into the Vue reactivity system
    this.data = Vue.observable({
      last_msg: {topic:null, payload:null}, // last message sent for display
      status: 'off',
      status_txt: 'off',
    })

    return this
  }

  start(addr) {
    console.log("WS: connecting to", addr)
    this.data.status = 'bad'
    this.data.status_txt = "connecting"
    this.rws = new ReconnectingWebSocket(addr, [], { debug: false, startClosed: true })
    this.rws.addEventListener('open', ()=> this.onOpen())
    this.rws.addEventListener('close', ()=> this.onClose())
    this.rws.addEventListener('message', (m)=> this.onMessage(m))
    this.rws.addEventListener('error', (e)=> this.onError(e))
    this.rws.reconnect()
  }

  stop() {
    if (this.rws) {
      console.log("WS: closing")
      this.rws.close()
    }
    this.rws = null
    this.data.status = 'off'
    this.data.status_txt = "off"
  }

  onOpen() {
    console.log("WS opened")
    this.data.status = 'ok'
    this.data.status_txt = "connected"
    this.rws.send('{"topic":"$ctrl", "payload":"start"}')
  }

  onClose() {
    console.log("WS closed")
    this.data.status = this.rws ? 'bad' : 'off' // deliberate off vs. lost conn
  }

  onMessage(msg) {
    //console.log("WS rx:", msg)
    let m
    try {
      m = JSON.parse(msg.data)
    } catch (e) {
      console.log("WS rx:", e)
      return
    }
    if (typeof m !== 'object' || typeof m.topic !== 'string' || m.payload === undefined) {
      console.log("WS rx: message is missing topic and/or payload", m)
      return
    }
    console.log("WS rx:", m)
    this.recvMsg(m)
    this.data.status = 'ok'
    this.data.status_txt = "connected"
  }

  onError(err) {
    console.log("WS rx error:", err.message || " ... no details")
    this.data.status = 'bad'
    this.data.status_txt = err.message ? `error: ${err.message}` : "error"
  }
}
