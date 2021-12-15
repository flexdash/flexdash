/* Websock - Simple websocket connection to back-end server.
   This file contains the code that connects to the server.
   Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
*/

import Vue from 'vue'
import ReconnectingWebSocket from 'reconnecting-websocket'

const state_txt = ['connecting', 'connected', 'closing', 'closed']

export default class WebsockConnection {

  constructor (storeInsert) {
    this.storeInsert = storeInsert
    this.rws = null // ReconnectingWebSocket
    this.checker = null // interval timer to check unsent messages
    this.first_connect = true
    this.get_config = false // whether to get the config upon first connect

    // data fed into the Vue reactivity system
    this.data = Vue.observable({
      last_msg: {topic:null, payload:null}, // last message sent for display
      status: 'off',
      status_txt: 'off',
    })

    return this
  }

  // start a connection
  start(addr, get_config) {
    console.log("WS: connecting to", addr)
    this.get_config = get_config
    this.data.status = 'bad'
    this.rws = new ReconnectingWebSocket(addr, [], { debug: false, startClosed: true })
    this.rws.addEventListener('open', ()=> this.onOpen())
    this.rws.addEventListener('close', ()=> this.onClose())
    this.rws.addEventListener('message', (m)=> this.onMessage(m))
    this.rws.addEventListener('error', (e)=> this.onError(e))
    this.rws.reconnect()
  }

  setStatus() {
    if (this.rws === null) {
      this.data.status = 'off'
      this.data.status_txt = "off"
    } else if (this.rws.readyState == 3 /*closed*/) {
      this.data.status = 'err'
    } else if (this.rws.readyState == 1 /*open*/ && this.rws.bufferedAmount == 0) {
      this.data.status = "ok"
      this.data.status_txt = "OK"
    } else {
      this.data.status = 'bad'
      this.data.status_txt = `${state_txt[this.rws.readyState]}, ${this.rws.bufferedAmount} queued`
    }
  }

  stop() {
    if (this.rws) {
      console.log("WS: closing")
      this.rws.close()
    }
    this.rws = null
    this.setStatus()
  }

  onOpen() {
    console.log("WS opened")
    this.setStatus()
    const msg = {
      topic   : "$ctrl",
      payload : this.get_config && this.first_connect ? "start" : "continue",
    }
    this.rws.send(JSON.stringify(msg))
    this.first_connect = false
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
    // FIXME: need to support set/unset/download message kinds
    if (typeof m !== 'object' || typeof m.topic !== 'string' || m.payload === undefined) {
      console.log("WS rx: message is missing topic and/or payload", m)
      return
    }
    console.log("WS rx:", m)
    this.storeInsert("set", m.topic, m.payload)
    this.setStatus()
  }

  onError(err) {
    //console.log("WS error:", err)
    console.log("WS error:", err.message || " ... no details")
    this.data.status_txt = err.message ? `error: ${err.message}` : "error"
  }

  serverSend(topic, payload) {
    if (this.rws) {
      this.rws.send(JSON.stringify({topic, payload}))
      if (this.rws.bufferedAmount > 0 && this.checker === null) {
        this.checker = window.setInterval(()=> {
          this.setStatus()
          if (this.rws.bufferedAmount === 0) {
            window.clearInterval(this.checker)
            this.checker = null
          }
        }, 1000)
      }
    }
  }
}
