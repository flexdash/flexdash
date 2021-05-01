# Test dashboard using Vuetify
==============================

This is a Node-Red test dashboard using uibuilder, Vue.js, and Vuetify.

To run it, you need to install the following npm modules:
- node-red-contrib-uibuilder
- vue
- vuetify
- socket.io
- roboto-fontface
- http-vue-loader
- vue-svg-gauge

Drop the files in this repo into `/uibuilder/d-test` in your http root folder
and load the flow from `flow.js` (the `flow.js` file does not need to be copied 
to the http root folder).

Start the flow and navigate to http://localhost:1880/d-test
