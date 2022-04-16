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

This should look something like this: ![inject into websocket](./img/howto-ws-2nodes.png)

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

![feed switch into light](./img/howto-ws-inout.png)

If you use the "switch" and "light" topics the toggle node on this page should control the value
of the stat node via Node-Red.

The websocket demo flows mentioned above are available
for [download](/flexdash/misc/ws-demo-flow.json).
`

const websock_save_text = `# Saving the config

To really use the dashboard its configuration needs to be saved somewhere, otherwise it
comes up with the demo config every time, which is not much fun.
To save the dashboard two things are necessary:
- the dashboard needs to be launched such that it immediately connects to the server that holds the config
- the server needs to have some code to save config changes and send the config when the dashboard starts up

### Connecting via websocket at launch

To connect to a server at launch the websocket address must be encoded in the URL
query string using a \`ws\` query string parameter,
for example, assuming the dashboard is launched from github and should connect to
a local Node-RED instance, the URL might look as follows:

https://tve.github.io/flexdash/?ws=ws://localhost:1880/ws/flexdash

A simple method for getting this URL is to configure and connect the websocket in the
dashboard's network configuration and then use the \`reload\` button at the bottom of
the config panel.

Note that it is further possible to jump straight to a specific tab by adding the tab
name or the tab's icon name as anchor, for example:

https://tve.github.io/flexdash/?ws=ws://localhost:1880/ws/flexdash#websock

### Saving the dashboard config on the server end

The dashboard saves the configuration by sending messages to a topic starting with \`$config\`
and a payload consisting of a JSON structure or \`null\` in order to prune the config.

`

const sockio_text = `# Socket.io server connection

FlexDash can establish a socket.io connection to a server. This connection allows:
- sending data from the server to FlexDash for display
- sending user input from FlexDash to the server
- persisting the FlexDash configuration on the server

The socket.io connection is intended to be used with Node-RED but isn't really specific
to Node-RED. The easiest way to get started is to install node-red-contrib-flexdash in Node-RED,
load the [demo flow](/flexdash/misc/sio-demo-flow.json) and to open the network
configuration panel here using the network icon in the upper-right corner and configure the
socket.io connection to connect to Node-RED.

### 1. Installation

Choose your preferred method for installing nodes in Node-RED. The current package version is
0.1.1 :-). The package is on npmjs: https://www.npmjs.com/package/node-red-contrib-flexdash

Create a new flow with the demo set-up: [demo flow](/flexdash/misc/sio-demo-flow.json).
You should check the options for the flexdash config node, the defaults should work...
The flow should look as follows:

![flexdash demo flow](./img/sio-demo-flow.png)

### 2. Connect the dashboard to Node-RED

Open the network configuration in FlexDash and point the socket.io connection at your Node-RED
server. Don't forget the port with the hostname, e.g. \`localhost:1880\`. You should end up with
a green OK after the socket.io heading. In case of failure, check the browser's developer console
for error messages (yes, there's room for improvement here).

### 3. Try the test nodes

Once connected you can try out the test nodes: hitting the inject node should show "hello" in
the stat widget in the dashboard. Flipping the light switch in the dashboard widget should output
a message in the debug node in NR and the round-trip message should change the switch text as well
as the adjoining stat node's text.

### 4. Switch from demo to real dashboard

When you brought up the dashboard it had no connection and established a "demo connection".
The socket.io connection you added is only used as additional method for sending/receiving data.
The dashboard configuration is not saved anywhere! So if you reload the browser you're back to
demo square one.

To work with a persistent configuration two things are necessary:
1. load the dashboard from a real network connection that supports config saving
2. ensure that the server at the other end actually persists the config

For step 1 the dashboard needs to be loaded with a query string that configures the server
connection from the get-go. For socket.io use a query string of the form
\`sio=http://example.com:1234/path\`, which, assuming you're running Node-Red locally
might look as follows:

  https://tve.github.io/flexdash/?sio=http://localhost:1880/io/flexdash/

Note that you can also use https for the socket.io and that the \`/io/flexdash\` path
must match the flexdash configuration node options in Node-RED.

If you use a URL as above, you should see the dashboard connect to your server and not show
the demo stuff anymore. It's now your own config, which starts out empty. You can, however,
add the demo tabs back using the inject buttons in the demo section of the server connections
settings dialog.

For step 2, i.e., to ensure that the server persists the dashboard configuration you may need to
edit the Node-RED settings.js. Specifically, you need a context store that uses the local filesystem instead of just memory. See the guide on
[working with context storage](https://nodered.org/docs/user-guide/context) for background, but the
short is to locate the "contextStorage" setting in the \`settings.js\` and enable a context
store with \`localfilesystem\`. Mine looks as follows, giving me a default memory context store
and an optional persistent one:

    contextStorage: {
        default: { module: "memory" },
        persistent: { module: "localfilesystem" }
    },

You then need to edit the FlexDash configuration node and set the context store name
("persistent" in my case), unless you opted to make the default context store backed
by the filesystem.

After editing the settings you will have to restart Node-RED.
(I wish there was an easier way to make all this happen.)

Once all the above is done do test the result! An easy way is to pull up the empty dashboard
and inject one of the demo tabs. Then reload the browser and it should come right back with
the dashboard that has the added demo tab. Then restart Node-RED and reload the browser again
and you should still get the same dashboard with the added demo tab. If the demo tab is gone
the localfilesystem context store didn't work.

At this point any changes you make to the dashboard are persistent. You can inspect the
actual config in the Node-RED admin UI using the context store panel under the global
context variables.
`

const panel_text = `# Panel demo
It is often desirable to arrange controls visually in a specific way and this can be achieved
in FlexDash using either custom compound widgets or using panels. A compound widget is a vue
component that primarily consists of an arrangement of other widgets. The three thermostat
widgets on this tab are an example. An alternative is to use a panel and place existing
widgets into the panel.

The custom compound widget is more flexible but also more work to write and test. It is useful
when additional custom logic is needed that a panel cannot provide.
`

// Demo configuration with multiple tabs and help text.
// Note that the tabs, grid, widgets use IDs that have one less digit than the auto-generated ones
// by the dashboard's edit functionality, this ensures the demo stuff can be injected without
// risk of collisions.
const demo_tabs = {
  // random data demo
  "Widget sampler": {
    "tabs": { "t0000": { "id":"t0000", "icon":"dice-multiple", "grids": ["g0000"] } }, // "view-dashboard"
    "grids": {
      "g0000": { "id": "g0000", "kind": "StdGrid",
                 "widgets": [ "w0001", "w0000", "w0003", "w0002", "w0009", "w0006",
                              "w0007", "w0008", "w0010", "w0011", "w0012", "w0013",
                              "w0014", "w0020", "w0021", "w0022", "w0023", "w0024" ] } },
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
      "w0011": { "kind": "SparkLine", "id": "w0011",
                  "static": { "title":"Hilltop", "color":"green", "line_width":4, "fill":true },
                  "dynamic": { "value": "$demo/hilltop" }, "rows": 1, "cols": 1 },
      "w0012": { "kind": "SparkLine", "id": "w0012",
                  "static": { "title": "Hilltop", "bars": true },
                  "dynamic": { "value": "$demo/hilltop" }, "rows": 1, "cols": 1 },
      "w0013": { "kind": "SparkLine", "id": "w0013",
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
      "w0024": { "kind": "IFrame", "id": "w0024",
                  "static": { "title":"", "url":"https://user-images.githubusercontent.com/19274367/45430032-b6a5a180-b6a4-11e8-9645-a0497ef044f3.png"},
                  "rows": 2, "cols": 2 },
    }
  },

  // socket-io demo
  "Socket.IO demo": {
    "tabs": {
      "t0005": { "id":"t0005", "title":"sockio", "icon":"lightning-bolt", "grids":["g0005"] } },
    "grids": {
      "g0005": { "id": "g0005", "kind": "StdGrid",
                  "widgets": ["w0030","w0031","w0032","w0033"] } },
    "widgets": {
      "w0030": { "kind": "Markdown", "id": "w0030", "cols": 4, "rows": 5, "dynamic": {},
                  "static": { "title": "", "text": sockio_text } },
      "w0031": { "kind": "Stat", "id": "w0031",
                  "static": { "title": "ws_data", "unit": "" },
                  "dynamic": { "value": "ws_data" }, "rows": 1, "cols": 1 },
      "w0032": { "kind": "Toggle", "id": "w0032",
                  "static": { "title": "Light switch", "on_value":"ON", "off_value":"OFF"},
                  "dynamic": { "value": "light" }, "output": "switch", "rows": 1, "cols": 1 },
      "w0033": { "kind": "Stat", "id": "w0033",
                  "static": { "title": "Light", "unit": "" },
                  "dynamic": { "value": "light" }, "rows": 1, "cols": 1 },
    }
  },

  // websocket demo
  "Websocket demo": {
    "tabs": {
      "t0001": { "id":"t0001", "title":"websock", "icon":"resistor-nodes", "grids":["g0001"] } },
    "grids": {
      "g0001": { "id": "g0001", "kind": "StdGrid",
                  "widgets": ["w0015","w0016","w0017","w0018","w0019"] } },
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
      "w0019": { "kind": "Markdown", "id": "w0019", "cols": 4, "rows": 4, "dynamic": {},
                  "static": { "title": "", "text": websock_save_text } },
    }
  },

  // thermostat and panel demo
  "Panel demo": {
    "tabs": {
      "t0006": { "id":"t0006", "title":"panel", "icon":"grid", "grids":["g0006"] } },
    "grids": {
      "g0006": { "id": "g0006", "kind": "StdGrid",
                  "widgets": [ "w07683","w05842","w05997","w0036","w08990","w0037","w0038","w0039" ],
    }},
    "widgets": {
      "w0036": { "kind": "Markdown", "id": "w0036", "cols": 3, "rows": 2, "dynamic": {},
                  "static": { "title": "", "text": panel_text } },
      "w07683": {"kind":"Thermostat","rows":3,"cols":1,"id":"w07683","output":null,
                 "static":{"title":"House","active":false,"active_label":"Heat"},
                 "dynamic":{"temperature":"$demo/panel/house"}},
      "w05842": {"kind":"Thermostat","rows":3,"cols":1,"id":"w05842","output":null,
                 "static":{"title":"Bedroom","active":false,"active_label":"Heat"},
                 "dynamic":{"temperature":"$demo/panel/bedroom"}},
      "w05997": {"kind":"Thermostat","rows":3,"cols":1,"id":"w05997","output":null,
                 "static":{"title":"Guest room","active":false,"active_label":"Heat"},
                 "dynamic":{"temperature":"$demo/panel/guestrm"}},
      "w08990": {"kind":"Panel","rows":3,"cols":4,
                 "static":{"title":"Heating","widgets":["w00755","w02236","w04405","w05899",
                           "w04096","w02351","w09184","w00814","w02419","w04709","w09509",
                           "w07258","w07973","w06643","w09371","w01797"]},
                 "dynamic":{},"id":"w08990"},
      "w02236": {"kind":"Gauge","rows":2,"cols":2,
                 "static":{"title":"House","arc":120,"low_threshold":60,"min":50,"unit":"F"},
                 "dynamic":{"value":"$demo/panel/house"},"id":"w02236"},
      "w04405": {"kind":"Gauge","rows":2,"cols":2,
                 "static":{"title":"Bedroom","arc":120,"low_threshold":60,"min":50,"unit":"F"},
                 "dynamic":{"value":"$demo/panel/bedroom"},"id":"w04405"},
      "w05899": {"kind":"Gauge","rows":2,"cols":2,
                 "static":{"title":"Guest room","arc":120,"low_threshold":60,"min":50,"unit":"F"},
                 "dynamic":{"value":"$demo/panel/guestrm"},"id":"w05899"},
      "w00755": {"kind":"Toggle","rows":2,"cols":2,
                 "static":{"title":"Enable","value":"ON","on_value":"ON","show_value":false},
                 "dynamic":{},"id":"w00755","output":null,"output_hint":null},
      "w04096": {"kind":"Label","rows":1,"cols":2,
                 "static":{"title":"","label":"Day:","justify":"right"}, "dynamic":{},"id":"w04096"},
      "w02351": {"kind":"ValueSequence","rows":1,"cols":2,
                 "static":{"title":"","range":["off",60,"...",80],"unit":"F","value":70},
                 "dynamic":{},"id":"w02351","output":null,"output_hint":"outputs value selected"},
      "w09184": {"kind":"ValueSequence","rows":1,"cols":2,
                 "static":{"title":"","range":["off",60,"...",80],"unit":"F","value":70},
                 "dynamic":{},"id":"w09184","output":null,"output_hint":"outputs value selected"},
      "w00814": {"kind":"ValueSequence","rows":1,"cols":2,
                 "static":{"title":"","range":["off",60,"...",80],"unit":"F","value":70},
                 "dynamic":{},"id":"w00814","output":null,"output_hint":"outputs value selected"},
      "w04709": {"kind":"ValueSequence","rows":1,"cols":2,
                 "static":{"title":"","range":["off",60,"...",80],"unit":"F","value":65},
                 "dynamic":{},"id":"w04709","output":null,"output_hint":"outputs value selected"},
      "w02419": {"kind":"Label","rows":1,"cols":2,"static":{"title":"","label":"Night:","justify":"right"},
                 "dynamic":{},"id":"w02419"},
      "w09509": {"kind":"ValueSequence","rows":1,"cols":2,
                 "static":{"title":"","range":["off",60,"...",80],"unit":"F","value":65},
                 "dynamic":{},"id":"w09509","output":null,"output_hint":"outputs value selected"},
      "w07258": {"kind":"ValueSequence","rows":1,"cols":2,
                 "static":{"title":"","range":["off",60,"...",80],"unit":"F","value":65},
                 "dynamic":{},"id":"w07258","output":null,"output_hint":"outputs value selected"},
      "w07973": {"kind":"Label","rows":1,"cols":2,"static":{"title":"","label":"Heat:","justify":"right"},
                 "dynamic":{},"id":"w07973"},
      "w06643": {"kind":"Stat","rows":1,"cols":2,"static":{"title":"","value":"OFF","chip":true},
                 "dynamic":{},"id":"w06643"},
      "w09371": {"kind":"Stat","rows":1,"cols":2,
                 "static":{"title":"","value":"ON","chip":true,"color":"#C5E1A5"},
                 "dynamic":{},"id":"w09371"},
      "w01797": {"kind":"Stat","rows":1,"cols":2,"static":{"title":"","value":"OFF","chip":true},
                 "dynamic":{},"id":"w01797"},
      "w0037": { "kind": "RandomValue", "id": "w0037", "output": "$demo/panel/house",
                  "static": { "title": "Rnd House", "min": 50, "max": 90 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w0038": { "kind": "RandomValue", "id": "w0038", "output": "$demo/panel/guestrm",
                  "static": { "title": "Rnd Guestrm", "min": 50, "max": 90, "seconds": 6 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
      "w0039": { "kind": "RandomValue", "id": "w0039", "output": "$demo/panel/bedroom",
                  "static": { "title": "Rnd Bedroom", "min": 50, "max": 90, "seconds": 4 },
                  "dynamic": {}, "rows": 1, "cols": 1 },
    },
  },



/*
  // iframe demo
  "IFrame": {
    "tabs": {
      "t0002": { "id":"t0002", "title":"iframe", "icon":"grid", "grids":["g0002","g0003"] } },
    "grids": {
      "g0002": { "id": "g0002", "kind": "StdGrid", "widgets": ["w0040"] },
      "g0003": { "id": "g0003", "kind": "IFrameGrid",
                 "url": "http://core.voneicken.com:1880/ui/#!/1" } },
    "widgets": {
      "w0040": { "kind": "Markdown", "id": "w0040", "cols": 4, "rows": 1, "dynamic": {},
                  "static": { "title": "", "text": "Hello Iframe!" } },
    }
  },

  // iframe demo #2
  "Embed Node-Red": {
    "tabs": {
      "t0003": { "id":"t0003", "title":"veggie", "icon":"collage",
                 "url": "http://core.voneicken.com:1880/ui/#!/1", "slot": "a" },
      "t0004": { "id":"t0004", "title":"orchard", "icon":"collage",
                 "url": "http://core.voneicken.com:1880/ui/#!/2", "slot": "a" },
    },
  },
*/
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

import randomStepper from '/src/utils/random-stepper.js'

export default class DemoConnection {
  constructor (store, storeInsert) {
    this.storeInsert = storeInsert
    this.store = store
    this.name = "demo"
    // data fed into the Vue reactivity system
    this.data = {
      status: 'off',
    }
    this.demos = Object.keys(demo_tabs) // used in UI to choose demo to inject
    return this
  }

  // start injects the full demo config
  start() {
    this.data.status = 'ok'
    // send dashboard configuration
    Object.keys(demo_tabs).forEach((t)=> this.inject(t))

    /* hack to add a bunch of node-red dashboard iframes
    this.storeInsert(`$config/dash/nodered`, {
      url: "http://core.voneicken.com:1880/ui/#!/",
      count: 11,
    })*/

  }

  // inject injects just one of the demo tabs
  inject(tab) {
    if (!(tab in demo_tabs)) return
    // if the config is empty, we need to inject with topic==$config to set "gotConfig",
    // not liking this, but we'll see how the demo stuff evolves...
    // We inject by using the store's qMutation directly such that if we have a connection
    // the demo tab gets sent to the server.
    if (!this.store.config.dash.tabs) {
      const conn = this.store.config.conn || {}
      console.log("Demo injecting $config")
      this.store.qMutation('demo init', [
        [ 'dash', {title:"FlexDash", tabs:[]} ],
        [ 'tabs', {} ],
        [ 'grids', {} ],
        [ 'widgets', {} ],
        [ 'conn', conn ],
      ])
    }

    const tabs = Object.keys(demo_tabs[tab].tabs) //.filter(t => !(t in this.store.config.tabs))
    if (tabs.length == 0) return
    const mutation = [ [ "dash/tabs", this.store.config.dash.tabs.concat(tabs) ] ]
    for (let type in demo_tabs[tab]) {
      for (let id in demo_tabs[tab][type]) {
        mutation.push([`${type}/${id}`, demo_tabs[tab][type][id]])
      }
    }
    //console.log(`Demo injecting demo tab ${tab}`)
    //console.log("mutation", mutation)
    this.store.qMutation(`demo tab ${tab}`, mutation)
  }

  stop() {
    // kill all the timers
    this.data.status = 'off'
  }

  // send a message to the server -- we're a demo, we have no server...
  serverSend(topic, payload) { }
}
