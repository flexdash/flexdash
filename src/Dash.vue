<template>
  <v-app>

    <v-navigation-drawer v-model="sidebar" app>
    </v-navigation-drawer>

    <v-app-bar dense app>
      <span class="hidden-sm-and-up">
        <v-app-bar-nav-icon @click="sidebar = !sidebar"></v-app-bar-nav-icon>
      </span>
      <v-app-bar-title>{{ appTitle }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-tabs v-model=tab>
        <v-tab v-for="t in tabs" :key="t.key"><v-icon large>mdi-{{t.icon}}</v-icon></v-tab>
      </v-tabs>
    </v-app-bar>

    <v-main>
      <v-tabs-items v-model="tab">
        <v-tab-item v-for="t in tabs" :key="t.key">
          <component v-bind:is="t.component" :nr="nr"></component>
        </v-tab-item>
      </v-tabs-items>
    </v-main>

  </v-app>
</template>

<script scoped>
import uibuilder from '../public/uibuilderfe.js'

import EmptyTab from './tabs/empty'
import DashTab from './tabs/dash'
import OrchardTab from './tabs/orchard'
import PlotTab from './tabs/plot'

export default {
  name: 'Dash',

  components: {
    EmptyTab,
    DashTab,
    OrchardTab,
    PlotTab,
  },

  data: () => ({
    appTitle: 'DashTest',
    sidebar: false, // disabled for now
    nr: {}, // data coming in from node-red
    msgCount: 0,
    tab: null, // which tab we're on
    tabs: [
      { key:'dash', icon:'tablet-dashboard', component: DashTab },
      { key:'plot', icon:'chart-line', component: PlotTab },
      { key:'orchard', icon:'tree', component: OrchardTab },
      { key:'empty', icon:'flask-empty', component: EmptyTab },
    ],
  }),

  // Called after the Vue app has been created.
  created() {
    //let self = this;
    let nodered = process.env.VUE_APP_NR_SERVER + "/" + process.env.VUE_APP_UIB_NAME
    // start uibuilder loaded from installed npm package
    uibuilder.debug(true)
    uibuilder.start({
      namespace: nodered, ioPath: "/uibuilder/vendor/socket.io", vueApp: self,
    })

    /* // load uibuilder dynamically from server
    let uibuilderfe = nodered + "/uibuilderfe.js"
    console.log("Loading uibuilder from", uibuilderfe, "(env=", process.env.NODE_ENV, ")")
    this.$loadScript(uibuilderfe)
      .then(() => {
        window.uibuilder.debug(true)
        window.uibuilder.start({
          //namespace: "https://core2.voneicken.com:1880/d-test",
          namespace: nodered,
          ioPath: "/uibuilder/vendor/socket.io",
          vueApp: self,
        })
      })
      .catch((err) => {
        console.log("Loading uibuilderfe.js failed:", err)
      })
      */
  },

  // Called after vue components are loaded and DOM built.
  mounted: function() {
    const self = this;

    // Register to process messages from node-red.
    uibuilder.onChange('msg', function(msg) {
      // Process hot reload messages to automatically reload the page on source file change.
      if (msg.topic === "hot-reload") {
        console.log("HOT RELOAD");
        window.location.reload(true);
        return;
      }

      // Stash away the data as long as the message has a topic and a payload.
      if (!('topic' in msg && 'payload' in msg)) return;

      let t0 = Date.now();

      // Interpret the topic string as a hierarchy of object "levels" separated by dots.
      let tt = msg.topic.split("."); // split levels of hierarchy
      let nr = self.nr; // start at root
      let t = tt.pop(); // separate off last level
      tt.forEach(function(v) {
        if (!(v in nr)) self.$set(nr, v, {});
        if (typeof nr[v] !== Object) {
          console.log(`Level '${v}' of topic ${msg.topic} is not an object`);
          return;
        }
        nr = nr[v];
      });
      // now nr[t] is the field to update

      // perform the update
      let pIsArray = Array.isArray(msg.payload);
      if (pIsArray && (!(t in nr) || nr[t] === null)) {
        self.$set(nr, t, []);
      }
      if (pIsArray && Array.isArray(nr[t])) {
        // We got arrays: append and trim
        let excess = nr[t].length + msg.payload.length - 1000;
        if (excess <= 0)
          nr[t] = nr[t].concat(msg.payload);
        else
          nr[t] = nr[t].slice(excess).concat(msg.payload);
        let l = nr[t].length;
        let dt = Date.now() - t0
        console.log(`Appended ${msg.payload.length} to ${t}, now ${l}, took ${dt}ms`) // , nr[t])
      } else {
        // Use Vue.set 'cause we will add new props to nr.
        self.$set(nr, t, msg.payload);
        let dt = Date.now() - t0
        console.log(`Updating ${t} with: ${msg.payload}, took ${dt}ms`);
      }

      self.msgCount++;
    });
  },
};
</script>

<style>
/* Cloak elements on initial load to hide the possible display of {{ ... }} 
 * Add to the app tag or to specific tags
 * To display "loading...", change to the following:
 *    [v-cloak] > * { display:none }
 *    [v-cloak]::before { content: "loading…" }
 */
[v-cloak] { display: none; }
.v-main { background-color: #eee; }

.width100 { width: 100%; }
.unit { font-size: 70%; vertical-align: 20%; margin-left: 0.1em; }

.g-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
  gap: 0.5em;
  grid-auto-flow: dense;
}
.g-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7em, 1fr));
  grid-auto-rows: 4.5em;
  gap: 0.5em;
  grid-auto-flow: dense;
}
.g-grid-margin { margin: 0.5em; }
.g-2w { grid-column: span 2; }
.g-2w-2h { grid-column: span 2; grid-row: span 2; }
.g-3w { grid-column: span 3; }
.g-3w-2h { grid-column: span 3; grid-row: span 2; }
.g-4w-2h { grid-column: span 4; grid-row: span 2; }
.g-in-card .v-card { background-color:#eeeeee; }

</style>
