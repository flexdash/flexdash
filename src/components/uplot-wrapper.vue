<!-- uplot-wrapper sizes the uplot canvas in a widget and deals with resizing.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="px-1 width100 flex-grow-1 flex-shrink-1">
    <div v-if="error_message" class="uplot-message">
      <div class="mx-auto">{{error_message}}</div>
    </div>
    <div v-else style="display:contents" ref="uplot">
      <!-- uPlot is injected here -->
    </div>
  </div>
</template>

<style scoped>
/* note: scope doesn't work easily with uplot 'cause no uplot elt in template */
div :deep(.uplot) {
  width: 100%; height: 100%;
  display: flex; flex-flow: column nowrap; justify-content: flex-end; align-items: stretch;
  font-family: Roboto !important;
}
/* u-wrap needs to occupy the space not used by the legend, and it needs to be full-width, then
 * the resize observer can track its dimensions and set the canvas size appropriately */
div :deep(.u-wrap) { flex: 1 1 100px; min-height: 20px; width: 100% !important}
div :deep(.u-legend) { flex: 0 0 auto; }
div :deep(.u-legend) :deep(.u-marker) { width: 1.2ex; height: 1.2ex; }
div :deep(.u-legend) * {
  font: 0.75rem Roboto;
  vertical-align: baseline !important;
}

.uplot-message {
  position: absolute; top: 24px; left: 0px; z-index: 2;
  display: flex; width:100%; padding: 0 4px;
  background: rgba(128, 0, 0, 0.4);
  opacity: 0.8;
}

</style>

<script scoped>

import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'

function deepCopy(obj) {
  if (typeof obj !== 'object' || obj === null) return obj
  if (Array.isArray(obj)) return obj.map(deepCopy)
  return Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,deepCopy(v)]))
}

export default {
  name: "UplotWrapper",

  props: {
    options: { type: Object, default() {return null} }, // options as uPlot expects
    data: { // data as uPlot expects (array of series)
      type: Array,
      default() { return null },
      validator(v) { return v == null || Array.isArray(v) },
    },
    error_message: { type: String, default: null },
  },

  data() { return {
    ro: new ResizeObserver(()=>this.onResize()),
    ro_uwrap: null, // element being observed
    width: 40, // width in pixels
    dark_watcher: null, // watcher on $vuetify.theme.dark used to adjust chart colors
    is_dark: false, // true if dark theme is active
    // chart: null, // uPlot object instance, init'd in created() callback
  }},

  watch: {

    options(/*options, prevOptions*/) {
      this.destroy()
      this.create()
    },

    data: {
      immediate: true,
      deep: true,
      handler(data, /*prevData*/) { // FIXME: do we need to check that the data is new?
        if (data == null || data == []) {
          if (this.chart) this.destroy()
        } else if (this.chart) {
          this.chart.setData(data)
        } else {
          this.create()
        }
      }
    }
  },

  created() {
    this.chart = null // uPlot object instance (non-reactive)
    // theme switching, there must be an easier way to detect the current theme...
    this.dark_watcher = this.$watch(
      ()  => this.$vuetify.theme.global.current.dark,
      (v) => { this.is_dark = v; this.destroy(); this.create() },
      { deep: false })
    this.is_dark = this.$vuetify.theme.global.current.dark
  },

  mounted() {
    //if (this.chart) console.log("Warning: uPlot chart created too early")//no resizeObs before mount!
    this.create()
  },

  unmounted() {
    if (this.ro) this.ro.disconnect()
    this.ro = null // being paranoid...
    this.destroy()
    this.dark_watcher()
  },

  methods: {
    destroy() {
      if (this.ro) this.ro.disconnect()
      if (this.chart) {
        this.chart.destroy()
        this.chart = null
      }
    },

    observeSize() {
      this.ro.disconnect()
      const uplot = this.$el.lastElementChild
      if (!uplot) {
        console.log("UPW: cannot observe: no uplot")
        return { width: 0, height: 0 }
        }
      const uwrap = uplot.children[0]
      if (!uwrap) {
        console.log("UPW: cannot observe: no uwrap")
        return { width: 0, height: 0 }
      }
      this.ro_uwrap = uwrap

      //console.log("TPR: observing size")
      this.ro.observe(uwrap)
      this.$nextTick(this.onResize())
    },

    calcSize(el) {
      let width = this.options.width || el.clientWidth
      let height = this.options.height || el.clientHeight
      this.width = width
      return { width: width, height: height }
    },

    // receive resize event and change the size of the chart if necessary
    // for some reason, this gets called twice most of the time, prob a bug somewhere...
    onResize() {
      const c = this.chart
      //console.log(`uPlot onResize`)
      if (!c || !this.ro_uwrap) return;
      const newSz = this.calcSize(this.ro_uwrap)
      //console.log(`uPlot size chg ${c.width}x${c.height} -> ${newSz.width}x${newSz.height}`)
      if (c.width == newSz.width && c.height == newSz.height) return
      //console.log(`uPlot resized ${c.width}x${c.height} -> ${newSz.width}x${newSz.height}`)
      if (newSz.width == 0 || newSz.height == 0) return // this._destroy()
      else c.setSize(newSz);
    },

    create() {
      try {
        if (!this.data || this.data.length === 0) return
        if (!this.options || !this.options.series || this.options.series.length < 2) return
        // start with some size, will be corrected once stuff goes into the DOM, there must be a
        // better way...
        const opts = deepCopy(this.options)
        opts.width = 200
        opts.height= 150
        if (! opts.padding) opts.padding = [8, null, null, null] // reduce padding at top
        else if (opts.padding[0] !== null) opts.padding[0] = 8
        opts.plugins = this.options.plugins
        this.chart = new uPlot(opts, this.data, this.$refs.uplot)
        this.$nextTick(() => this.observeSize())
      } catch (e) {
        console.log("uPlotWrapper create: error creating chart", e)
        throw(e)
      }
    },

  },
}
</script>
