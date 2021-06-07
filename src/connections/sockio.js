/* Sockio - Socket.io connection to back-end server.
   This file contains the code that connects to the server.
   Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
*/

import Vue from 'vue'
import { io } from "socket.io-client"

const state_txt = ['connecting', 'connected', 'closing', 'closed']

const namespace = ""

export default class SockioConnection {

  constructor (recvMsg) {
    this.recvMsg = recvMsg
    this.sock = null
    this.checker = null // interval timer to check unsent messages
    this.first_connect = true

    // data fed into the Vue reactivity system
    this.data = Vue.observable({
      last_msg: {topic:null, payload:null}, // last message sent for display
      status: 'off',
      status_txt: 'off',
    })

    return this
  }

  // start a connection, config is store.$config.conn.sockio
  // has: enabled, config, hostname, path, tls
  start(config) {
    this.data.status = 'bad'

    // determine path from url
    const method = config.tls ? "https" : "http"

    // connect
    const opts = { path: config.path, } // transports:["polling","websocket"] }
    const url = method + '://' + config.hostname + '/' + namespace // not really a url...
    console.log("Socket IO server address:", url)
    console.log("Socket IO options:", JSON.stringify(opts))
    this.sock = io(url, opts)

    // handle connection error
    this.sock.on("connect_error", (err) => {
      console.log("SIO connect error:", err)
      this.data.status = 'err'
      this.data.status_txt = err
    })

    // handle final disconnection
    this.sock.on("disconnect", (reason) => {
      console.log("SIO disconnect:", reason)
      if (reason === "io server disconnect") {
        // server closed, possible server restart?
        this.data.status = 'off'
        this.data.status_txt = "off"
        this.sock = null
      }
    })

    this.sock.on("connect", () => {
      console.log("SIO connected")
      this.setStatus()
      this.sock.emit("msg", "$ctrl",
          (config.config && this.first_connect) ? "start" : "continue")
      this.first_connect = false
    })

    // handle message received
    this.sock.on("msg", (topic, payload) => {
      console.log("SIO rx:", topic, payload)
      if (typeof topic !== 'string' || payload === undefined) {
        console.log("SIO rx: message is missing topic and/or payload", topic, payload)
        return
      }
      //console.log("SIO rx:", m)
      this.recvMsg(topic, payload)
      this.setStatus()
    })
  }

  setStatus() {
    if (this.sock === null) {
      this.data.status = 'off'
      this.data.status_txt = "off"
    } else if (this.sock.connected && this.sock.sendBuffer.length == 0) {
      this.data.status = "ok"
      this.data.status_txt = "OK"
    } else {
      this.data.status = 'bad'
      this.data.status_txt =
          `${this.sock.connected?"":"dis"}connected, ${this.sock.sendBuffer.length} queued`
    }
  }

  stop() {
    if (this.sock) {
      console.log("SIO: closing")
      this.sock.close()
    }
    this.sock = null
    this.setStatus()
  }

  serverSend(topic, payload) {
    if (this.sock) {
      this.sock.emit("msg", topic, payload)
      if (this.sock.sendBuffer.length > 0 && this.checker === null) {
        this.checker = window.setInterval(()=> {
          this.setStatus()
          if (this.sock.sendBuffer.length === 0) {
            window.clearInterval(this.checker)
            this.checker = null
          }
        }, 1000)
      }
    }
  }
}
