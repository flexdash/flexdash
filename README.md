Test dashboard using Vuetify
============================

This is a Node-Red test dashboard using uibuilder, Vue.js, and Vuetify.
The dashboard uses a simple tabbed interface and shows a small number of
tabs with test components that display data coming from node-red.
A sample flow is provided that populates the dashboard with test data.

This project uses vue-cli to build the UI. This has the benefit of
providing all the amenities of modern javascript coding, including
automatic hot-reload when a source file is changed.

The way it works in development mode is that you run vue-cli-service
on your dev machine (e.g. laptop) which serves-up the UI components
from this source tree. The browser connects to the node-red server only
to receive (and send) event streams.

For production mode, vue-cli-service is run to produce a dist package
that can be dropped onto any static web server, including node-red's
static file-serving directory. Note that this project does not use
the file serving capabilities of the uibuilder nodes at all.


## Project setup

The node-red installation need to include uibuilder, however, it needs a
small patch to support CORS which is described in
https://github.com/TotallyInformation/node-red-contrib-uibuilder/pull/131
Until that gets merged, the easiest is to install
`tve/node-red-contrib-uibuilder` in node-red instead of
TotallyInformation's version.

To bring this project to life, install vue-cli (e.g. `apt install vue-cli`
on Ubuntu) and install all the dependencies of this repo locally.
```
npm install
```

Open your node-red admin UI and import `flow.js`.

### Compiles and hot-reloads for development
Edit `.env.development` to reflect where you point your browser to get the
UI and where the UI needs to connect to get to node-red. Then start the dev
server for the UI:
```
npm run serve
```
or
```
vue-cli-service serve
```

### Compiles and minifies for production
Edit `.env.production` to reflect your node-red environment.
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
