FlexDash: A Flexible Web Dashboard
==================================

**WARNING: this is demo ware at this point**

FlexDash is a dashboard that runs in the browser and is fully self-contained:
feed it data over a websocket and save its config as a blob on the server and
you can build your dashboard with ease.

Special support for Node-RED is available in the form of a couple of FlexDash
nodes in the
[node-red-contrib-flexdash](https://www.npmjs.com/package/node-red-contrib-flexdash)
npm package.

In more detail:
- The dashboard is built with Vue and Vuetify and uses web components to display
  typical IoT or home automation widgets: gauges, sparklines, plots, switches,
  data tables, etc.
- Serving up the dashboard is easy: it's just a bunch of static files.
  Editing and configuring the set of widgets is done directly in the browser.
- The dashboard connects to a server via a websocket or using socket.io,
  that's how it expects to be fed data. The data consists of simple json
  messages with a (hierarchical) topic and a payload. The widgets can then
  be hooked up to a specific topic and as data comes in for that topic it
  is displayed.
- The dashboard's configuration is saved over the websocket as a special
  topic. So the server should persist that topic's payload and replay
  it when a client connects.
- The dashboard is targeted to be used with Node-RED, but it is really
  very independent of Node-RED and could be hooked up to something as
  simple as a microcontroller, such as an esp32.

## Getting started

See the live demo at https://tve.github.io/flexdash. The data you see is randomly generated
internally, just enough to be able to play around a little. To do anything
you need to enable edit mode using the gears menu at the top-right.

## Concepts

There are few core concepts in FlexDash that drive its functioning as well as user interface.

### Topic tree

The topic tree is the concept used by FlexDash to organize data and, in particular, connect
data sent by the server to widgets that display it. The topic tree is similar to pub/sub topics as
used in MQTT, but not exactly.

The short description is that the server sends data using JSON messages that contain a topic
property and a payload property. Each widget in the dashboard is then linked (you could
say "subscribes to") a topic (or multiple) and displays the data in the payload. Topics are
hierarchical using a slash as delimiter. A simple message might be something like:
```
{ "topic": "sensors/house/bedroom/temperature", "payload": 65 }
```
And you might have a gauge widget whose `value` input is linked to that topic and then
displays the last received temperature.

#### Arrays and objects

The topic tree does not have to contain just simple values, it can also contain arrays and objects.
Unlike most pub/sub topics a topic in FlexDash is really a path in a large JSON data structure and
incoming messages insert data into that data structure. WHat this means is best described by
example. Suppose the server sends a message like:
```
{ "topic": "sensors/house/bedroom",
  "payload": { "temperature": 65, "humidity": 43, "temp_color": "green", "temp_unit": "°F" }
}
```
Here the payload is an object and it replaces the subtree rooted at `sensors/house/bedroom`.
The gauge in the previous example can still be bound to `sensors/house/bedroom/temperature`
and in addition, the gauge's _unit_ input can be bound to `sensors/house/bedroom/temp_unit`
and its _color_ input to `sensors/house/bedroom/temp_color`.

To display a time series plot the server might send a message like:
```
{ "topic": "timeseries/house/temperatures/data",
  "payload": [ [ 1623846600, 65, 72 ], [ 1623846900, 65.5, 72 ], ..., [ 1623889200, 68, 66 ] ]
}
```
This data consists of an array of "rows" where each row has a unit epoch timestamp and two values.
This type of data can be displayed by linking the input of a TimePlot widget to the above topic.
The server can, in addition, send a second message with the names of the series being displayed,
for example:
```
{ "topic": "timeseries/house/temperatures/series",
  "payload": [ "bedroom", "living room" ]
}
```
and this can be linked to the _labels_ input of the TimePlot widget.

### Tabs, grids, panels, widgets

The FlexDash UI is organized hierarchically in tabs, grids, panels, and widgets.

__Tabs__ are full pages that display information. Each tab has an icon and/or a name and these are
shown in the top-nav or the "hamburger button" left-nav on small devices.

Each tab can have one or multiple __grids__ filled with widgets. Each grid spans the full width of
the page and has variable height depending on the widgets it contains. The standard grid uses the
relatively new CSS grid functionality configured as follows:

- each grid column has a minimum width and the browser places as many columns as fit the
window and then expands all the columns just enough to fill the window width
- each grid row has a fixed height approx 1/2 of the column width
- widgets can be configured to span multiple rows and columns
- all widgets in a grid are in a 1-dimensional array, the are dropped into the grid starting at the
  top-left corner and going across to the right and then wrapping to the next row
- when widgets span columns this can cause gaps (a large widget doesn't fit at the end of a row and
  wraps to the next row), small widgets that come later in the array are "moved up" by the browser
  to fill these gaps (to-do item: provide a UI option to turn this behavior off)

Overall the grid provides a "responsive" layout that reflows as needed on smaller displays and uses
the full width on larger ones. One constraint is that the grid always has as many columns as the
widest widget. So if a grid has a 6-column wide widget that is the grid's narrowest configuration
and is then likely to be wider than a cell phone display, for example.

A __widget__ is a display element that visualizes some data. It looks like a card in the UI and may
have a title. Each widget has a number of inputs that can be configured using the pencil edit icon
in its top-right corner. Each input can have a static value, for example, setting the _color_ to
"red", or it can be linked/bound/subscribed to a topic as described in the previous section.

There is a special __panel__ widget that can contain other widgets. The panel is an empty card
that can be configured to contain a CSS grid with N columns and M rows. This grid can then be filled
just like the tabs' grid. The important difference is that the panel's CSS grid does not reflow or
change with display size. Once configured to have a certain number of rows and columns and filled
with an arrangement of widgets everything will stay exactly like that regardless of display or
browser window resizing. This allows complex arrangements of widgets to be created that contain a
number of visualizations and input elements whose placement relative to one another is important.
Note that widgets placed into a panel do not have a card background: they sit flat in the panel's
card.

The following screen shot shows: [tbd...]

### User input and Output events

User input (for example toggling a switch widget) also involves messages with topics, but
these are not related to the topic tree above. Widgets that implement user input have one
_output_ which is linked to a topic. On user input the widget sends a JSON message
with the configured topic and a payload representing the input to the server.

The most tricky aspect of user input is the combination of direct visual feedback in FlexDash and
the loop-back via the server showing effects of the action. It's easy to create situations that are
confusing or misleading.

A simple example is an ON button. When the user clicks the button the visual feedback consists of
the button looking depressed for the brief duration of the click. Then a message goes to the server
and causes some change and perhaps the server sends a message to FlexDash to turn a Stat widget from
"OFF" to "ON".

A more tricky example is a toggle switch used to turn a light on/off, the reason being that the
toggle is really both an indicator and an actuator: it shows the current state and it allows the
user to change that state. When the user clicks on the toggle FlexDash has to show the toggle
moving from one state to the other or it could be rather confusing. Then it sends a message to the
server which must turn it back around to send the updated state back to FlexDash, this should have
no visual effect because it should essentially confirm the change that FlexDash already performed.
This loop-back is nevertheless required because other browser instances do not see the user action
and need the message from the server to correctly reflect the new light switch state.

In the case of the toggle it would be possible to omit the local visual feedback because the
loop-back through the server ought to happen in less than a second and so while the visual change of
the switch might feel sluggish upon clicking it would be OK. But that is not the case for sliders or
increment/decrement buttons on a numeric input. For this reason FlexDash widgets always provide
immediate local visual feedback even though this risks being misleading if the message to the server
gets lost.

### Loading the dashboard

FlexDash consists of a bunch of static files that the browser loads. Once loaded, the web app then
connects to a server (or multiple) to receive data and send user input. The FlexDash files can
be hosted anywhere subject to a few constraints due to the various "same origin" policies
enforced by browsers.

There are two hosted versions of FlexDash that can be accessed via `tve/github.io/flexdash` either
using HTTP or using HTTPS. The details will probably undergo a few more changes in order to make
everything more convenient...

Another recommended set-up is to server the FlexDash files from the same server that will provide
the data connection. When using Node-RED this can be done by enabling the static web server in
the `settings.js` and unpacking the archive (_oops, not readily available yet_) in a directory.

The "same origin" policies cause the following constraints:
- If FlexDash is served by the same server that will also provide the data connection then
  everything is easy, "same server" means same protocol (http vs https), same hostname (or IP
  address), and same port (if any of these differ it's not the "same origin").
- If FlexDash is served via HTTPS it is effectively impossible to establish a data connection via
  HTTP, instead, FlexDash has to be served via HTTP as well, or better yet, the data server should
  be upgraded to HTTPS.
- If FlexDash is served by a different server than the one it connects to for data the data server
  has to have CORS configured to allow the connection. Specifically, CORS needs to be configured to
  allow the server that serves up FlexDash as origin.

Details about CORS: CORS stands for
[Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Glossary/CORS) and it's
purpose is to protect access to a data/API server. The primary threat is as follows. Suppose
you access your data server using it's normal web app and, after logging in, your browser stores
your login session cookie. You then happen to visit an innocuous looking web site but under the
hood, invisible to you, the pages served by that web site connect from your browser to your data
server and start to issue API commands. Because your server stored that cookie and includes the
cookie in all calls to your data server these commands will be authorized and potentially
perform nefarious actions.

What configuring CORS entails is for your data server to tell the browser via a response header that
it will accept a data connection / API calls from a web app served off a specific domain. So suppose
your data server is `https://my-node-red.example.com:1880` and you are using the hosted FlexDash
from `https://tve.github.com` then the data server needs to respond with a
`Access-Control-Allowed-Origins: https://tve.github.com` header or
`Access-Control-Allowed-Origins: *`. If you use the FlexDash NPM module in Node-RED then it
has support for the CORS configuration and is permissive by default.

### Server connections and saving the configuration

...

## Quick architecture overview (OUTDATED)

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

## Scripts

```bash
  npm run dev # start dev server
  npm run build # build for production
  npm run serve # locally preview production build
```
