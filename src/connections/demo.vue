<!-- Demo - Fake back-end server that sends a little bit of pseudo-random demo data so we
     can try things out without having to connect anywhere.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div style="display: content;">
    <v-list-item-title>Demo</v-list-item-title>
    <v-list-item-content>
      <span>Random data for demo purposes.</span>
    </v-list-item-content>
  </div>
</template>

<script scoped>

const series = [ 'kitchen', 'bedroom', 'study', 'living room', 'guest room' ]

// https://stackoverflow.com/a/22080644
const randomStepper = (() => {
  let state = {}

  return (key) => {
    let [value, phase, w, x2] = state[key] || [70, 0, 0, 0]

    function step() {
      let z
      if (!phase) {
          let x1
          do {
              x1 = 2.0 * Math.random() - 1.0;
              x2 = 2.0 * Math.random() - 1.0;
              w = x1 * x1 + x2 * x2;
          } while (w >= 1.0);
          w = Math.sqrt((-2.0 * Math.log(w)) / w);
          z = x1 * w;
      } else {
          z = x2 * w;
      }
      phase ^= 1;

      return z;
    }
    let min = 50, max = 90, r
    do { r = step(); } while (value + r < min || value + r > max);
    value += r;
    state[key] = [value, phase, w, x2]
    return value
  }
})()

const welcome_text = `
# Welcome to FlexDash

You are seeing the FlexDash demo dashboard. It shows a variety of _widgets_ spread across
multiple _tabs_. Each tab can have multiple _grids_ that lay out the widgets and that can be
rolled up and down.

### Getting started

The demo dashboard does not connect to any server and instead displays randomly generated data.
To connect to a server, use the _mdi-network_ icon at the top right (not implemented yet).

To edit the dashboard's configuration, switch to edit mode using the settings icon at
the top-right. All editing is instantaneous while the dashboard remains live. If you make
a mistake, use the undo button at the top right.

### Feeding data into FlexDash

_to be continued_ ...
`

const demo_config = {
  "dash": {
      "title": "FlexDash",
      "tabs": [ "t00000", "t00001" ]
  },
  "tabs": {
      "t00000": { "id": "t00000", "icon": "view-dashboard", "grids": [ "g0" ] },
      "t00001": { "id": "t00001", "icon": "home-thermometer", "grids": [ "g1", "g2" ] }
  },
  "grids": {
      "g0": { "id": "g0", "kind": "FixedGrid",
              "widgets": [ "1", "0", "3", "2", "9", "6", "7", "8", "10", "11", "12", "13", "14" ]
      },
      "g1": { "id": "g1", "kind": "FixedGrid", "widgets": [] },
      "g2": { "id": "g2", "kind": "FixedGrid", "widgets": [] }
  },
  "widgets": {
      "1": { "kind": "Markdown", "id": "1", "cols": 3, "rows": 3, "dynamic": {},
            "static": { "title": "", "text": welcome_text } },
      "0": { "kind": "Stat", "id": "0",
             "static": { "title": "Bedroom", "value": "cold", "unit": "F" },
             "dynamic": { "value": "bedroom" }, "rows": 1, "cols": 1 },
      "2": { "kind": "Stat", "id": "2",
             "static": { "title": "Guest Room", "unit": "F" },
             "dynamic": { "value": "guest room" }, "rows": 1, "cols": 1 },
      "3": { "kind": "Gauge", "id": "3",
             "static": { "title": "Living Room", "value": 50, "arc": 270, "center": true,
                         "unit": "F", "needle_color": "red", "min": 30 },
             "dynamic": { "value": "living room" }, "rows": 2, "cols": 2 },
      "6": { "kind": "Gauge", "id": "6",
             "static": { "title": "Kitchen", "color": "lightblue", "arc": 90, "unit":"F", "min":0},
             "dynamic": { "value": "kitchen" }, "rows": 1, "cols": 1 },
      "7": { "kind": "Toggle", "id": "7",
             "static": { "title": "light", "off_value": "0", "on_value": "ON",
                         "color": "secondary", "value": "ON" },
             "dynamic": { "_output": "light", "value": "light" }, "rows": 1, "cols": 1 },
      "8": { "kind": "PushButton", "id": "8",
             "static": { "title": "launch", "color": "secondary", "output_value": "ON",
                         "icon": "rocket-launch", "tooltip": "Next stop: Mars!" },
             "dynamic": { "_output": "light" }, "rows": 1, "cols": 1 },
      "9": { "kind": "PushButton", "id": "9",
             "static": { "title": "", "icon": "watering-can" },
             "dynamic": {}, "rows": 1, "cols": 1 },
      "10": { "kind": "Gauge", "id": "10",
             "static": { "title": "Kitchen", "arc":180, "base_color": "lightgreen", "color":"blue",
                         "unit": "F", "radius": 90, "needle_color": "white" },
             "dynamic": { "value": "kitchen" }, "rows": 1, "cols": 1 },
      "11": { "kind": "Sparkchart", "id": "11",
             "static": { "title": "Livingrm", "color": "green", "line_width": 4, "fill": true },
             "dynamic": { "value": "living room" }, "rows": 1, "cols": 1 },
      "12": { "kind": "Sparkchart", "id": "12",
             "static": { "title": "Living Room", "bars": true },
             "dynamic": { "value": "living room" }, "rows": 1, "cols": 1 },
      "13": { "kind": "Sparkchart", "id": "13",
             "static": { "title": "Kitchen" },
             "dynamic": { "value": "kitchen" }, "rows": 1, "cols": 2 },
      "14": { "kind": "TimePlot", "id": "14",
             "static": { "title": "Temperatures" },
             "dynamic": { "data": "temp_data", "options": "temp_opts" }, "rows": 4, "cols": 4 }
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

class DemoConnection {
  constructor () {
    this.active = false
    this.timers = []
    return this
  }

  start(sendMsg) {
    this.sendMsg = sendMsg
    this.active = true
    // send dashboard configuration
    this.sendMsg({topic: '$config', payload: demo_config})
    // start interval timers to send data for stats, gauges, etc
    for (let i=0; i<series.length; i++) {
      this.timers.push(window.setInterval(()=>this.tick(series[i]), 5000+i*1000))
      this.tick(series[i])
    }
    // send time plot config and start interval timer for plot
    this.sendMsg({topic: 'temp_opts', payload: plot_opts})
    this.timers.push(window.setInterval(()=>this.plot, 3000))
    this.plot()
  }

  stop() {
    // kill all the timers
    this.timers.map((t) => window.clrInterval(t))
    this.timer = []
    this.active = false
  }

  status() {
    return "OK"
  }

  // internal functions

  tick(s) {
    const t = Math.round(10*randomStepper(s))/10
    //console.log(`Demo: demo_${s}=${t}`)
    this.sendMsg({topic: `${s}`, payload: t})
  }

  plot() {
    let data = [ Date.now()/1000, Math.round(10*randomStepper("p1"))/10,
        Math.round(10*randomStepper("p2"))/10, Math.round(10*randomStepper("p3"))/10 ]
    this.sendMsg({topic: 'temp_data', payload: data})
  }
}

// singleton for now
const connection = new DemoConnection()
export { connection }

// Vue component to display configuration dialog
export default {
  name: 'DemoConnection',

  data: () => ({
    enable: true,
  }),

  computed: {
    color() { return this.enable ? "green" : null },
  },

}

</script>
