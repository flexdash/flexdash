/* Sockio - Socket.io connection to back-end server.
   This file contains the code that connects to the server.
   Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
*/

import { io } from "socket.io-client"

const state_txt = ['connecting', 'connected', 'closing', 'closed']

const namespace = ""

export default class SockioConnection {

  constructor (store, recvMsg, doAuth) {
    this.recvMsg = recvMsg
    this.doAuth = doAuth
    this.sock = null
    this.checker = null // interval timer to check unsent messages
    this.reqId = 100
    this.requests = {}

    // data fed into the Vue reactivity system
    this.data = {
      last_msg: {topic:null, payload:null}, // last message sent for display
      status: 'off',
      status_txt: 'off',
    }

    return this
  }

  // start a connection, config is store.$config.conn.sockio
  // has: enabled, config, hostname, path, tls
  start(config) {
    this.data.status = 'bad'

    // determine path from url
    const method = config.tls ? "https" : "http"

    // connect
    const opts = { path: config.path, withCredentials: true} // transports:["polling","websocket"] }
    const url = method + '://' + config.hostname + '/' + namespace // not really a url...
    console.log("Socket IO server address:", url)
    console.log("Socket IO options:", JSON.stringify(opts))
    this.sock = io(url, opts)

    // handle connection error
    this.sock.on("connect_error", (err) => {
      console.log("SIO connect error:", err, err.data)
      let message = err.data?.message || err.toString()
      this.data.status = 'err'
      this.data.status_txt = message
      if (message == 'unauthorized') {
        this.stop()
        if (err.data?.url && !err.data.url.startsWith('http'))
          err.data.url = method + '://' + config.hostname + err.data.url
        this.doAuth(err.data)
      }
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
    })

    // handle set message
    this.sock.on("set", (topic, payload) => {
      //console.log("SIO rx:", topic, payload)
      if (typeof topic !== 'string') {
        console.log("SIO rx: message is missing topic", topic)
        return
      }
      //console.log("SIO rx:", m)
      this.recvMsg("set", topic, payload)
      this.setStatus()
    })

    // handle unset (delete) message
    this.sock.on("unset", topic => {
      //console.log("SIO rx:", topic, payload)
      if (typeof topic !== 'string') {
        console.log("SIO rx: message is missing topic", topic)
        return
      }
      //console.log("SIO rx:", m)
      this.recvMsg("unset", topic)
      this.setStatus()
    })

    // handle download message
    this.sock.on("download", (url, filename) => {
      if (typeof url !== 'string') {
        console.log("SIO rx download: message is missing url", url)
        return
      }
      let base = method + '://' + config.hostname + config.path
      base = base.replace(/[^/]*$/, '')
      console.log("SIO rx download:", url, filename, base)
      this.recvMsg("download", url, filename, base)
      this.setStatus()
    })

    // handle resp message (response to request)
    this.sock.on("resp", (id, payload) => {
      console.log("SIO resp:", id, payload)
      if (this.requests[id]) {
        this.requests[id](payload)
        delete this.requests[id]
      }
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

  // send a "regular" one-way message to the server with a topic and a payload
  serverSend(topic, payload, kind="msg") {
    console.log("serverSend, kind=" + kind)
    if (this.sock) {
      this.sock.emit(kind, topic, payload)
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

  // send a request to the server with a topic and a payload and resolve the promise when a
  // response comes back or reject it on timeout. serverQuery returns a promise!
  serverQuery(topic, payload, kind="req") {
    console.log("serverQuery, kind=" + kind)
    return new Promise((resolve, reject) => {
      if (!this.sock) return reject("SIO: not connected")
      let id = this.reqId++
      this.requests[id] = resolve
      this.sock.emit(kind, id, topic, payload)
      setTimeout(() => {
        if (this.requests[id]) {
          delete this.requests[id]
          reject("SIO: timeout")
        }
      }, 30000) // FIXME: hardcoded timeout
    })
  }

}
