'use strict'

var App = new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  components: {
    'orchard-vtable': httpVueLoader('orchard-vtable.vue'),
    'stat': httpVueLoader('stat.vue'),
    'gauge': httpVueLoader('gauge.vue'),
    'array': httpVueLoader('array.vue'),
    'upv': httpVueLoader('upv.vue'),
  },

  data: {
    appTitle: 'DashTest',
    sidebar: false, // disabled for now
    nr: {}, // data coming in from node-red
    msgCount: 0,
  },

  // Called after the Vue app has been created.
  created: function() {
    //uibuilder.debug(true);
    uibuilder.start(this); // pass vue app
  },

  // Called after vue components loaded and DOM built.
  mounted: function() {
    const self = this;

    // Register to process messages from node-red.
    uibuilder.onChange('msg', function(msg) {
      app.lastMsg = msg;
      //console.log(msg);

      // Process hot reload messages to automatically reload the page on source file change.
      if (msg.topic === "hot-reload") {
        console.log("HOT RELOAD");
        window.location.reload(true);
        return;
      }

      // Stash away the data as long as the message has a topic and a payload.
      if (!('topic' in msg && 'payload' in msg)) return;

      // Interpret the topic string as a hierarchy of object "levels" separated by dots.
      let tt = msg.topic.split("."); // split levels of hierarchy
      let nr = self.nr; // start at root
      let t = tt.pop(); // separate off last level
      tt.forEach(function(v) {
        if (!(v in nr)) Vue.set(nr, v, {});
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
        Vue.set(nr, t, []);
      }
      if (pIsArray && Array.isArray(nr[t])) {
        // We got arrays: append and trim
        let excess = nr[t].length + msg.payload.length - 1000;
        if (excess <= 0)
          nr[t] = nr[t].concat(msg.payload);
        else
          nr[t] = nr[t].slice(excess).concat(msg.payload);
        let l = nr[t].length;
        console.log(`Appended ${msg.payload.length} to ${t}, now ${l}`, nr[t]);
      } else {
        // Use Vue.set 'cause we will add new props to nr.
        Vue.set(nr, t, msg.payload);
        console.log("Updating " + t + " with:", msg.payload);
      }

      self.msgCount++;
    });
  },
});
