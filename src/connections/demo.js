/* Demo - Fake back-end server that sends a little bit of pseudo-random demo data so we
   can try things out without having to connect anywhere.
   This file contains the code that actually generates the data.
   Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
*/

const series = [ 'kitchen', 'bedroom', 'study', 'living room', 'guest room' ]

const welcome_text = `
# Welcome to FlexDash

You are seeing the FlexDash demo dashboard. It shows a variety of _widgets_ spread across
multiple _tabs_. Each tab can have multiple _grids_ that lay out the widgets and that can be
rolled up and down.

### Getting started

The demo dashboard does not connect to any server and instead displays randomly generated data.
To connect to a server switch to the next "websock" tab and read the instructions there.

To edit the dashboard's configuration, switch to edit mode using the settings icon at
the top-right.
In edit mode all the items on the page have a little pencil icon, click on that to
bring up an editing card. The exception to the pencil icon are the grid, which have a
toolbar across the page.

All editing is instantaneous while the dashboard remains live. If you make
a mistake, use the undo button at the top right. Unless you hook up a server connection
and configure the server to persist the config, all changes you make here are in browser
memory only and are lost when you refresh the page.
`

const websock_text = `# Websocket server connection

FlexDash can establish a simple websocket connection to a server. This connection allows:
- sending data from the server to FlexDash for display
- sending user input from FlexDash to the server
- persisting the FlexDash configuration on the server

The communication protocol uses very simple \`{"topic":"foo", "payload":199}\` type of messages
where the topic establishes the binding between the data and a widget in FlexDash.

### Connecting to Node-Red

Before connecting to Node-Red the latter needs just two nodes to accept websocket connections:
- a \`websocket-out\` node to send data configured as follows:
- the type set to "listen on"
- the path set to "Add new websocket listener" and, using the pencil button, the listener's path set to \`/ws/flexdash\` and "send/receive" to "entire message".
- an inject node with the topic set to \`ws_data\` and the payload set to some short string like "hello" or some number
- the inject node connected to the websocket-out node

This should look something like this: ![inject into websocket](/img/howto-ws-2nodes.png)

Now deploy those two nodes and open the connection editing panel here in FlexDash using the
network icon at the top-right. Set the websocket address to the Node-Red server's hostname,
port, and a path of \`/ws/flexdash\` (this needs to match the path set in the websocket listener
in Node-Red). The address should look something like \`ws://localhost:1880/ws/flexdash\`.
Then enable the websocket and the status should shortly change to connected.

Once the connection is established, hit the inject node button and the value set in its payload
will show up in the stats widget to the right of this text widget. It is now possible to wire
additional nodes into the \`websocket-out\` to send values to other widgets. It is also possible
to instantiate additional \`websocket-out\` nodes if that is more convenient.

To bind new data values to a new widget, ensure that the \`msg.topic\` of those values is unique,
add the desired widget to the grid (you may have to turn on _edit mode_ using the settings menu
at the top-right), and set the widget's input (typically _value_) to be linked to the topic.
`

const demo_config = {
  "dash": {
      "title": "FlexDash",
      "tabs": [ "t00000", "t00002", "t00001" ],
  },
  "conn": {
      "demo": { "enabled": true },
      "websock": { "enabled": false, "address": "" },
  },
  "tabs": {
      "t00000": { "id":"t00000", "icon":"view-dashboard", "grids": ["g00000"] },
      "t00002": { "id":"t00002", "title":"websock", "icon":"resistor-nodes", "grids":["g00003"] },
      "t00001": { "id":"t00001", "icon":"home-thermometer", "grids": ["g00001", "g00002"] }
  },
  "grids": {
      "g00000": { "id": "g00000", "kind": "FixedGrid",
                  "widgets": [ "w00001", "w00000", "w00003", "w00002", "w00009", "w00006",
                               "w00007", "w00008", "w00010", "w00011", "w00012", "w00013",
                               "w00014" ] },
      "g00001": { "id": "g00001", "kind": "FixedGrid", "widgets": [] },
      "g00002": { "id": "g00002", "kind": "FixedGrid", "widgets": [] },
      "g00003": { "id": "g00003", "kind": "FixedGrid", "widgets": ["w00015","w00016"] },
  },
  "widgets": {
      "w00001": { "kind": "Markdown", "id": "w00001", "cols": 3, "rows": 5, "dynamic": {},
                  "static": { "title": "", "text": welcome_text } },
      "w00015": { "kind": "Markdown", "id": "w00015", "cols": 4, "rows": 5, "dynamic": {},
                  "static": { "title": "", "text": websock_text } },
      "w00000": { "kind": "Stat", "id": "w00000",
                  "static": { "title": "Bedroom", "value": "cold", "unit": "F" },
                  "dynamic": { "value": "bedroom" }, "rows": 1, "cols": 1 },
      "w00002": { "kind": "Stat", "id": "w00002",
                  "static": { "title": "Guest Room", "unit": "F" },
                  "dynamic": { "value": "guest room" }, "rows": 1, "cols": 1 },
      "w00003": { "kind": "Gauge", "id": "w00003",
                  "static": { "title": "Living Room", "value": 50, "arc": 270, "center": true,
                              "unit": "F", "needle_color": "red", "min": 30 },
                  "dynamic": { "value": "living room" }, "rows": 2, "cols": 2 },
      "w00006": { "kind": "Gauge", "id": "w00006",
                  "static": {"title":"Kitchen", "color":"lightblue", "arc":90, "unit":"F","min":0},
                  "dynamic": { "value": "kitchen" }, "rows": 1, "cols": 1 },
      "w00007": { "kind": "Toggle", "id": "w00007",
                  "static": { "title": "light", "off_value": "0", "on_value": "ON",
                              "color": "secondary", "value": "ON" },
                  "dynamic": { "_output": "light", "value": "light" }, "rows": 1, "cols": 1 },
      "w00008": { "kind": "PushButton", "id": "w00008",
                  "static": { "title": "launch", "color": "secondary", "output_value": "ON",
                              "icon": "rocket-launch", "tooltip": "Next stop: Mars!" },
                  "dynamic": { "_output": "light" }, "rows": 1, "cols": 1 },
      "w00009": { "kind": "PushButton", "id": "w00009",
                  "static": { "title": "", "icon": "watering-can" },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w00010": { "kind": "Gauge", "id": "w00010",
                  "static": { "title":"Kitchen", "arc":180, "base_color":"lightgreen",
                              "color":"blue", "unit":"F", "radius":90, "needle_color":"white" },
                  "dynamic": { "value": "kitchen" }, "rows": 1, "cols": 1 },
      "w00011": { "kind": "Sparkchart", "id": "w00011",
                  "static": { "title":"Livingrm", "color":"green", "line_width":4, "fill":true },
                  "dynamic": { "value": "living room" }, "rows": 1, "cols": 1 },
      "w00012": { "kind": "Sparkchart", "id": "w00012",
                  "static": { "title": "Living Room", "bars": true },
                  "dynamic": { "value": "living room" }, "rows": 1, "cols": 1 },
      "w00013": { "kind": "Sparkchart", "id": "w00013",
                  "static": { "title": "Kitchen" },
                  "dynamic": { "value": "kitchen" }, "rows": 1, "cols": 2 },
      "w00014": { "kind": "TimePlot", "id": "w00014",
                  "static": { "title": "Temperatures" },
                  "dynamic": { "data": "temp_data", "options": "temp_opts" }, "rows":4, "cols":4 },
      "w00016": { "kind": "Stat", "id": "w00016",
                  "static": { "title": "ws_data", "unit": "" },
                  "dynamic": { "value": "ws_data" }, "rows": 1, "cols": 1 }
    }
}

const plot_opts = {
    series: [
        { label: "time" },
        { label: "Sensor 1", scale: "C", value: "v.toFixed(1) + '°C'"},
        { label: "Sensor 2", scale: "C", value: "v.toFixed(1) + '°C'"},
        { label: "Sensor 3", scale: "C", value: "v.toFixed(1) + '°C'"}, ],
    axes: [ {}, {
            scale: "F",
            values: /*(u, vv, s) =>*/ 'vv.map(v => v + "°F")',
        }, {
            scale: "C",
            values: /*(u, vv, s) =>*/ 'vv.map(v => v + "°C")',
            side: 1,
            grid: {show: false},
        } ],
    scales: {
        "F": { from: "C", range: /*(u, min, max) =>*/ '[ min*9/5+32, max*9/5+32 ]' }, },
}

import Vue from 'vue'
import randomStepper from '/src/utils/random-stepper.js'

export default class DemoConnection {
  constructor (serverSend, storeInsert) {
    this.serverSend = serverSend
    this.storeInsert = storeInsert
    this.active = false
    this.timers = []
    // data fed into the Vue reactivity system
    this.data = Vue.observable({
      last_msg: {topic:null, payload:null}, // last message sent for display
      status: 'off',
    })
    return this
  }

  start() {
    this.active = true
    // send dashboard configuration
    this.storeInsert({topic: '$config', payload: demo_config})
    // start interval timers to send data for stats, gauges, etc
    for (let i=0; i<series.length; i++) {
      const rs = randomStepper(40, 80)
      this.timers.push(window.setInterval(()=> this.tick(series[i], rs), 5000+i*1000))
      this.tick(series[i], rs)
    }
    // send time plot config and start interval timer for plot
    this.storeInsert({topic: 'temp_opts', payload: plot_opts})
    const rs = [randomStepper(20, 110), randomStepper(20, 110), randomStepper(20, 110)]
    this.timers.push(window.setInterval(()=>this.plot(rs), 3000))
    this.plot(rs)
    this.data.status = 'ok'
  }

  stop() {
    // kill all the timers
    this.timers.map((t) => window.clearInterval(t))
    this.timer = []
    this.active = false
    this.data.last_msg.topic = null
    this.data.status = 'off'
  }

  // internal functions

  send(msg) {
    Vue.set(this.data, 'last_msg', msg)
    this.storeInsert(msg)
  }

  tick(s, rs) {
    const t = rs()
    //console.log(`Demo: demo_${s}=${t}`)
    this.send({topic: `${s}`, payload: t})
  }

  plot(rs) {
    let data = [ Date.now()/1000, rs[0](), rs[1](), rs[2]() ]
    this.send({topic: 'temp_data', payload: data})
  }
}
