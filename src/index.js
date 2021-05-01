'use strict'

var App = new Vue({
  el: '#app',
  vuetify: new Vuetify(),
  components: {
    'orchard-vtable': httpVueLoader('orchard-vtable.vue'),
    'stat': httpVueLoader('stat.vue'),
    'gauge': httpVueLoader('gauge.vue'),
    'array': httpVueLoader('array.vue'),
  },

  data: {
    appTitle: 'DashTest',
    sidebar: false, // disabled for now
    nr: {}, // data coming in from node-red
    msgCount: 0,
  },

  // Called after the Vue app has been created.
  created: function() {
    // Need to pass all the details to uibuilder 'cause we use a subdir (d/test).
    uibuilder.debug(true);
    uibuilder.start({
      ioPath: "/uibuilder/vendor/socket.io",
      namespace: "/d/test",
      vueApp: this}
    );
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
      if (msg.topic && typeof msg.payload !== 'undefined') {
        // Use Vue.set 'cause we will add new props to self.nr.
        Vue.set(self.nr, msg.topic, msg.payload);
        console.log("Updating " + msg.topic + " with:", msg.payload);
        self.msgCount++;
      }
    });
  },
});
