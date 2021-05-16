<!-- Demo - Fake back-end server that sends a little bit of pseudo-random demo data so we
     can try things out without having to connect anywhere.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="mx-2">
    <v-tooltip bottom>
      <template v-slot:activator="{on}">
        <v-btn small icon :color="color" v-on="{click:handleChange, ...on}">
          <v-icon>mdi-dice-multiple</v-icon>
        </v-btn>
      </template>
      <span>Enable random demo data to be fed into demo_*.</span>
    </v-tooltip>
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

const demo_config = {
  "tabs": [
      { "id": "t0", "icon": "view-dashboard", "grids": [ "g0" ] },
      { "id": "t1", "icon": "home-thermometer", "grids": [ "g1", "g2" ] }
  ],
  "grids": {
      "g0": { "id": "g0", "kind": "fixed-grid",
              "widgets": [ "0", "3", "2", "9", "6", "7", "8", "10", "11", "12", "13", "14" ]
      },
      "g1": { "id": "g1", "kind": "fixed-grid", "widgets": [] },
      "g2": { "id": "g2", "kind": "fixed-grid", "widgets": [] }
  },
  "widgets": {
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
             "static": { "title": "Livingrm", "color": "green", "line_width": 4, "fill": 0 },
             "dynamic": { "value": "living room" }, "rows": 1, "cols": 1 },
      "12": { "kind": "Sparkchart", "id": "12",
             "static": { "title": "Living Room", "bars": 1 },
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

export default {
  name: 'Demo',

  data: () => ({
    enable: true,
    timers: [],
  }),

  computed: {
    color() { return this.enable ? "green" : null },
  },

  // Called after vue components are loaded and DOM built.
  mounted() {
    if (this.enable) {
      // if the demo stuff is enabled at mount time we kick everything off here
      this.enable = false
      this.handleChange()
      window.setTimeout(this.tick, 3000)
    }
  },

  methods: {
    // handle a demo switch toggle
    handleChange() {
      this.enable = !this.enable
      console.log("Demo switch changed to", this.enable)
      if (this.enable) {
        // send dashboard configuration
        this.$emit('msg', {topic: '$config', payload: demo_config})
        // start interval timers to send data for stats, gauges, etc
        for (let i=0; i<series.length; i++)
          this.timers.push(window.setInterval(()=>this.tick(series[i]), 5000+i*1000))
        // send time plot config and start interval timer for plot
        this.$emit('msg', {topic: 'temp_opts', payload: plot_opts})
        this.timers.push(window.setInterval(this.plot, 1000))
      } else {
        // kill all the timers
        this.timers.map((t) => window.clrInterval(t))
        this.timer = []
      }
    },

    tick(s) {
      const t = Math.round(10*randomStepper(s))/10
      //console.log(`Demo: demo_${s}=${t}`)
      this.$emit('msg', {topic: `${s}`, payload: t})
    },

    plot() {
      let data = [ Date.now()/1000, Math.round(10*randomStepper("p1"))/10,
          Math.round(10*randomStepper("p2"))/10, Math.round(10*randomStepper("p3"))/10 ]
      this.$emit('msg', {topic: 'temp_data', payload: data})
    },
  },

}
</script>
