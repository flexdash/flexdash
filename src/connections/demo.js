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

The communication protocol uses very simple topic + payload messages,
such as \`{"topic":"foo", "payload":199}\`,
where the topic establishes the binding between the data and a widget in FlexDash.

### Connecting to Node-Red

Before connecting to Node-Red the latter needs two nodes to send websocket data:

1- A \`websocket-out\` node to send data configured as follows:
- the type set to "listen on"
- the path set to "Add new websocket listener" and, using the pencil button, the listener's path set to \`/ws/flexdash\` and "send/receive" to "entire message".

2- An inject node with the topic set to \`ws_data\` and the payload set to some short string like
"hello" or some number
- the inject node connected to the websocket-out node

This should look something like this: ![inject into websocket](/flexdash/img/howto-ws-2nodes.png)

Now deploy those two nodes and open the connection editing panel here in FlexDash using the
network icon at the top-right. Set the websocket address to the Node-Red server's hostname,
port, and a path of \`/ws/flexdash\` (this needs to match the path set in the websocket listener
in Node-Red). The address should look something like \`ws://localhost:1880/ws/flexdash\`.
Then enable the websocket and the status should shortly change to _connected_.

Once the connection is established, hit the inject node button and the value set in its payload
will show up in the stats widget to the right of this text widget. It is now possible to wire
additional nodes into the \`websocket-out\` to send values to other widgets. It is also possible
to instantiate additional \`websocket-out\` nodes if that is more convenient.

To bind new data values to a new widget, ensure that the \`msg.topic\` of those values is unique,
add the desired widget to the grid (turn on _edit mode_ using the settings menu
at the top-right), and set the widget's input (typically _value_) to be linked to the topic.

### Sending user input to Node-Red

Sending user input from a toggle widget or a push button widget to Node-Red is simple as well:
- Instantiate a \`websocket-in\` node and configure it to use the same "listen on" path as the \`websocket-out\`.
- Add a \`switch\` node set to filter the desired topic, switch" in this example.
- Hook up a debug node to see the messages or, alternatively, add a \`change\` node to set the topic to "light" and feed that into a \`websocket-out\`, this second option might look like this:

![feed switch into light](/flexdash/img/howto-ws-inout.png)

If you use the "switch" and "light" topics the toggle node on this page should control the value
of the stat node via Node-Red.

The websocket demo flows mentioned above are available
for [download](/flexdash/misc/ws-demo-flow.json).

### Opening the websocket at load

Instead of configuring the websocket connection each time the dashboard is loaded it is
possible to encode the websocket address in the URL using a \`ws\` query string parameter,
for example:

https://tve.github.io/flexdash/?ws=ws://localhost:1880/ws/flexdash

It is further possible to jump straight to a specific tab by adding the tab name or the
tab's icon name as anchor, for example:

https://tve.github.io/flexdash/?ws=ws://localhost:1880/ws/flexdash#websock

### Saving the dashboard config over websocket

... not yet implemented: stay tuned!
`

// Demo configuration with multiple tabs and help text.
// Note that the tabs, grid, widgets use IDs that have one less digit than the auto-generated ones
// by the dashboard's edit functionality, this ensures the demo stuff can be injected without
// risk of collisions.
const demo_tabs = {
  // random data demo
  "t0000": {
    "tabs": { "t0000": { "id":"t0000", "icon":"dice-multiple", "grids": ["g0000"] } }, // "view-dashboard"
    "grids": {
      "g0000": { "id": "g0000", "kind": "FixedGrid",
                 "widgets": [ "w0001", "w0000", "w0003", "w0002", "w0009", "w0006",
                              "w0007", "w0008", "w0010", "w0011", "w0012", "w0013",
                              "w0014", "w0020", "w0021", "w0022", "w0023" ] } },
    "widgets": {
      "w0001": { "kind": "Markdown", "id": "w0001", "cols": 3, "rows": 5, "dynamic": {},
                  "static": { "title": "", "text": welcome_text } },
      "w0000": { "kind": "Stat", "id": "w0000",
                  "static": { "title": "Bedroom", "value": "cold", "unit": "F" },
                  "dynamic": { "value": "$demo/bedroom" }, "rows": 1, "cols": 1 },
      "w0002": { "kind": "Stat", "id": "w0002",
                  "static": { "title": "Bedroom", "unit": "F" },
                  "dynamic": { "value": "$demo/bedroom" }, "rows": 1, "cols": 1 },
      "w0003": { "kind": "Gauge", "id": "w0003",
                  "static": { "title": "Hilltop", "value": 50, "arc": 270, "center": true,
                              "unit": "F", "needle_color": "red", "min": 30 },
                  "dynamic": { "value": "$demo/hilltop" }, "rows": 2, "cols": 2 },
      "w0006": { "kind": "Gauge", "id": "w0006",
                  "static": {"title":"Kitchen", "color":"lightblue", "arc":90, "unit":"F","min":0},
                  "dynamic": { "value": "$demo/kitchen" }, "rows": 1, "cols": 1 },
      "w0007": { "kind": "Toggle", "id": "w0007",
                  "static": { "title": "light", "off_value": "0", "on_value": "ON",
                              "color": "secondary", "value": "ON" },
                  "dynamic": { "_output": "light", "value": "light" }, "rows": 1, "cols": 1 },
      "w0008": { "kind": "PushButton", "id": "w0008",
                  "static": { "title": "launch", "color": "secondary", "output_value": "ON",
                              "icon": "rocket-launch", "tooltip": "Next stop: Mars!" },
                  "dynamic": { "_output": "light" }, "rows": 1, "cols": 1 },
      "w0009": { "kind": "PushButton", "id": "w0009",
                  "static": { "title": "", "icon": "watering-can" },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w0010": { "kind": "Gauge", "id": "w0010",
                  "static": { "title":"Kitchen", "arc":180, "base_color":"lightgreen",
                              "color":"blue", "unit":"F", "radius":90, "needle_color":"white" },
                  "dynamic": { "value": "$demo/kitchen" }, "rows": 1, "cols": 1 },
      "w0011": { "kind": "Sparkchart", "id": "w0011",
                  "static": { "title":"Hilltop", "color":"green", "line_width":4, "fill":true },
                  "dynamic": { "value": "$demo/hilltop" }, "rows": 1, "cols": 1 },
      "w0012": { "kind": "Sparkchart", "id": "w0012",
                  "static": { "title": "Hilltop", "bars": true },
                  "dynamic": { "value": "$demo/hilltop" }, "rows": 1, "cols": 1 },
      "w0013": { "kind": "Sparkchart", "id": "w0013",
                  "static": { "title": "Kitchen" },
                  "dynamic": { "value": "$demo/kitchen" }, "rows": 1, "cols": 2 },
      "w0014": { "kind": "TimePlot", "id": "w0014",
                  "static": { "title": "Temperatures", "left_unit": "°F", "left_decimals": 0,
                              "labels": Array.from({length:10},((_,i)=>"Sensor "+(i+1))) },
                  "dynamic": { "data": "$demo/plot" }, "rows":4, "cols":4 },
      "w0020": { "kind": "RandomValue", "id": "w0020", "output": "$demo/kitchen",
                  "static": { "title": "Rnd Kitchen", "min": 50, "max": 90 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w0021": { "kind": "RandomValue", "id": "w0021", "output": "$demo/hilltop",
                  "static": { "title": "Rnd Hilltop", "min": 20, "max": 90, "seconds": 6 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w0022": { "kind": "RandomValue", "id": "w0022", "output": "$demo/bedroom",
                  "static": { "title": "Rnd Bedroom", "min": 50, "max": 90, "seconds": 4 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w0023": { "kind": "RandomArray", "id": "w0023", "output": "$demo/plot",
                  "static": { "title":"Rnd Plot", "min":50, "max":90, "seconds":7, "length":11 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
    }
  },

  // websocket demo
  "t0001": {
    "tabs": {
      "t0001": { "id":"t0001", "title":"websock", "icon":"resistor-nodes", "grids":["g0001"] } },
    "grids": {
      "g0001": { "id": "g0001", "kind": "FixedGrid",
                  "widgets": ["w0015","w0016","w0017","w0018"] } },
    "widgets": {
      "w0015": { "kind": "Markdown", "id": "w0015", "cols": 4, "rows": 5, "dynamic": {},
                  "static": { "title": "", "text": websock_text } },
      "w0016": { "kind": "Stat", "id": "w0016",
                  "static": { "title": "ws_data", "unit": "" },
                  "dynamic": { "value": "ws_data" }, "rows": 1, "cols": 1 },
      "w0017": { "kind": "Toggle", "id": "w0017",
                  "static": { "title": "Light switch", "on_value":"ON", "off_value":"OFF"},
                  "dynamic": { "value": "light" }, "output": "switch", "rows": 1, "cols": 1 },
      "w0018": { "kind": "Stat", "id": "w0018",
                  "static": { "title": "Light", "unit": "" },
                  "dynamic": { "value": "light" }, "rows": 1, "cols": 1 },
    }
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
import store from '/src/store.js' // not happy about this...

export default class DemoConnection {
  constructor (serverSend, storeInsert) {
    this.storeInsert = storeInsert
    // data fed into the Vue reactivity system
    this.data = Vue.observable({
      status: 'off',
    })
    return this
  }

  // start injects the full demo config
  start() {
    this.data.status = 'ok'
    // send dashboard configuration
    Object.keys(demo_tabs).sort().forEach((t)=> this.inject(t))

  }

  // inject injects just one of the demo tabs
  inject(tab) {
    if (!(tab in demo_tabs)) return
    // if the config is empty, we need to inject with topic==$config to set "gotConfig",
    // not liking this, but we'll see how the demo stuff evolves...
    if (!store.config.dash.tabs) {
      const conn = store.config.conn || {}
      console.log("Demo injecting $config")
      this.storeInsert({topic: `$config`, payload: {
        dash: {title:"FlexDash", tabs:[]}, tabs:{}, grids:{}, widgets:{}, conn:conn}
      })
    }
    for (let type in demo_tabs[tab]) {
      for (let id in demo_tabs[tab][type]) {
        console.log(`Demo injecting $config/${type}/${id}`)
        this.storeInsert({topic: `$config/${type}/${id}`, payload: demo_tabs[tab][type][id]})
      }
    }
    if (!store.config.dash.tabs.includes(tab)) {
      const ix = store.config.dash.tabs.length
      console.log(`Demo injecting $config/dash/tabs/${ix}`)
      this.storeInsert({topic: `$config/dash/tabs/${ix}`, payload: tab})
    }
  }

  stop() {
    // kill all the timers
    this.data.status = 'off'
  }

}
