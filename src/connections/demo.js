/* Demo - Fake back-end server that sends a little bit of pseudo-random demo data so we
   can try things out without having to connect anywhere.
   This file contains the code that actually generates the data.
   Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
*/

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
                               "w00014", "w00020", "w00021", "w00022", "w00023" ] },
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
                  "dynamic": { "value": "$demo/bedroom" }, "rows": 1, "cols": 1 },
      "w00002": { "kind": "Stat", "id": "w00002",
                  "static": { "title": "Bedroom", "unit": "F" },
                  "dynamic": { "value": "$demo/bedroom" }, "rows": 1, "cols": 1 },
      "w00003": { "kind": "Gauge", "id": "w00003",
                  "static": { "title": "Hilltop", "value": 50, "arc": 270, "center": true,
                              "unit": "F", "needle_color": "red", "min": 30 },
                  "dynamic": { "value": "$demo/hilltop" }, "rows": 2, "cols": 2 },
      "w00006": { "kind": "Gauge", "id": "w00006",
                  "static": {"title":"Kitchen", "color":"lightblue", "arc":90, "unit":"F","min":0},
                  "dynamic": { "value": "$demo/kitchen" }, "rows": 1, "cols": 1 },
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
                  "dynamic": { "value": "$demo/kitchen" }, "rows": 1, "cols": 1 },
      "w00011": { "kind": "Sparkchart", "id": "w00011",
                  "static": { "title":"Hilltop", "color":"green", "line_width":4, "fill":true },
                  "dynamic": { "value": "$demo/hilltop" }, "rows": 1, "cols": 1 },
      "w00012": { "kind": "Sparkchart", "id": "w00012",
                  "static": { "title": "Hilltop", "bars": true },
                  "dynamic": { "value": "$demo/hilltop" }, "rows": 1, "cols": 1 },
      "w00013": { "kind": "Sparkchart", "id": "w00013",
                  "static": { "title": "Kitchen" },
                  "dynamic": { "value": "$demo/kitchen" }, "rows": 1, "cols": 2 },
      "w00014": { "kind": "TimePlot", "id": "w00014",
                  "static": { "title": "Temperatures", "left_unit": "°F", "left_decimals": 0,
                              "labels": Array.from({length:10},((_,i)=>"Sensor "+(i+1))) },
                  "dynamic": { "data": "$demo/plot" }, "rows":4, "cols":4 },
      "w00016": { "kind": "Stat", "id": "w00016",
                  "static": { "title": "ws_data", "unit": "" },
                  "dynamic": { "value": "ws_data" }, "rows": 1, "cols": 1 },
      "w00020": { "kind": "RandomValue", "id": "w00020", "output": "$demo/kitchen",
                  "static": { "title": "Rnd Kitchen", "min": 50, "max": 90 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w00021": { "kind": "RandomValue", "id": "w00021", "output": "$demo/hilltop",
                  "static": { "title": "Rnd Hilltop", "min": 20, "max": 90, "seconds": 6 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w00022": { "kind": "RandomValue", "id": "w00022", "output": "$demo/bedroom",
                  "static": { "title": "Rnd Bedroom", "min": 50, "max": 90, "seconds": 4 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w00023": { "kind": "RandomArray", "id": "w00023", "output": "$demo/plot",
                  "static": { "title":"Rnd Plot", "min":50, "max":90, "seconds":7, "length":11 },
                  "dynamic": {}, "rows": 1, "cols": 1 }
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
    this.storeInsert = storeInsert
    this.active = false
    // data fed into the Vue reactivity system
    this.data = Vue.observable({
      status: 'off',
    })
    return this
  }

  start() {
    this.active = true
    // send dashboard configuration
    this.storeInsert({topic: '$config', payload: demo_config})
  }

  stop() {
    // kill all the timers
    this.active = false
    this.data.status = 'off'
  }

}
