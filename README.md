FlexDash: A Flexible Web Dashboard
==================================

**WARNING: this is demo ware at this point**

FlexDash is a dashboard that runs in the browser and is fully self-contained:
feed it data over a websocket and save its config as a blob on the server and
you can build your dashboard with ease.

In more detail:
- The dashboard is built with Vue and Vuetify and uses web components to display
  typical IoT or home automation widgets: gauges, sparklines, plots, switches,
  data tables, etc.
- Serving up the dashboard is easy: it's just a bunch of static files.
  Editing and configuring the set of widgets is done directly in the browser.
- The dashboard connects to a server via a websocket (using socket.io at the moment),
  that's how it expects to be fed data. The data consists of simple json
  messages with a (hierarchical) topic and a payload. The widgets can then
  be hooked up to a specific topic and as data comes in for that topic it
  is displayed.
- The dashboard's configuration is saved over the websocket as a special
  topic. So the server should persist that topic's payload and replay
  it when a client connects.
- The dashboard is targeted to be used with Node-Red, but it is really
  very independent of Node-Red and could be hooked up to something as
  simple as a microcontroller, such as an esp32.

## Getting started

See the live demo at https://tve.github.io/flexdash. The data you see is randomly generated
internally, just enough to be able to play around a little. To do anything
you need to enable edit mode using the gears menu at the top-right.

Known issues:
- Lots of stuff to fix and improve everywhere!
- The two tabs are hard-coded, there is currently no way to change that.
- The second tab has two grids, which is not really useful yet 'cause one can't change
  the properties of a grid.
- The first widget on a grid showing the number of widgets is not removable or
  editable, it's a "debug feature".
- It's currently not possible to configure a widget's output (for example for a button
  or switch), the functionality is there and used to work but is broken
  right now. (Since there's no server in demo mode I've prioritized
  other stuff.)
- When saving a config change it currently takes 1-2 seconds even though there's
  no slow connection or server, it's just a delay built-in for the demo (and testing).
- The autocomplete used to bind a data variable to a widget input is only
  usable for a flat namespace, not for a tree. That's OK for the demo
  'cause it only produces simple variable names, but needs to be fixed.

While FlexDash can be used with Node-red the instructions for hooking
it up are not ready yet... Stay tuned...

To develop on FlexDash you should clone the repo, do an `npm install` and
"have at it". Serving it up locally is done using `npm run serve`.

## Quick architecture overview

- FlexDash uses the Vue 2 web framework and the Vuetify component
  library for the UI, not much else.
  Moving to Vue 3 would be awesome but Vuetify doesn't support it
  yet, other component libraries for Vue don't either...
- At the very bottom layer of the UI are the widgets that show some
  data visualization. They are all loaded from `src/widgets` and are
  mostly pretty simple wrappers around some generic web component or
  some html/css/svg/... Writing new widgets is expected to be the
  main way to customize FlexDash.
- The top-level component is in `src/Dash.vue`, it manages the top-nav and
  plops down the appropriate grid for the selected tab.
- The two icons at the top right next to the gear menu are the data connections.
  Right now there's the demo from `src/components/demo.vue` and the
  disabled uibuilder socket.io connection from `src/components/uib.vue`.
- The grid is in `src/grids/fixed-grid.vue` and deals with laying out the
  widgets. It's a simple HTML grid currently. It also manages the editing,
  including the buttons in the toolbar at the top and dealing with
  cancel/save actions.
- The way editing happens is that the grid has the saved config as well as
  an edited config. When a widget is being edited the grid passes the edit config
  down into it, which makes any change happen immediately.
  If the user hits cancel the grid simply reverts to passing the saved config down.
  If the user hits save, the grid sends the changes up via an event and
  Dash.vue sends it off to the server. 
  There the changes need to round-trip to ultimately update the 
  saved config held by the grid.
- The grid is populated by widgets, the top level of that is
  `src/components/widget-edit.vue` which implements the actual editing
  "drawer". It deals with figuring out the types of the inputs and 
  producing the right input field.
- Below that sits `src/components/widget-wrapper.vue` which manages the
  live data feeds to the widgets. The configuration is passed down the
  component hierarchy but the data is bound by widget-wrapper to
  flow "directly" from the data store to the widget component.
  This data flow is reactive (like just about everything else) so
  widgets update as soon as new data shows up in the store.
- The store is a simple object tree representing the topics and
  having data (payload) at the leaves. It is updated as data comes in
  from the server and any property of a widget can be bound to
  any value in the store (or be configured to a static value).
  Given the appropriate binding, it is thus possible to update the title,
  line thickness, color, or any propety of a widget by sending data
  from the server.
- The configuration of the dashboard is also held in the store
  under a top-level `$config` key. It consists of shallow denormalized
  arrays for tabs, grids, and widgets. Each entity has an ID and the
  hierarchy is connected by ID reference, e.g., a grid has an array
  of the widgets IDs it contains. The configuration for the demo
  mode can be found in `src/components/demo.vue`.
- There a start at unit tests in `tests/unit` but they haven't kept up.

