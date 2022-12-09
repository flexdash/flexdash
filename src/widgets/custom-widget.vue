<!-- CustomWidget - Widget to display a custom, i.e., dynamically defined widget
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <component v-if="component" :is="component" v-bind="bindings" @send="$emit('send', $event)" />
  <div v-else style="display: contents">
    <div v-if="error" class="h-100 d-flex align-center justify-center">
      <v-btn variant="elevated" class="ma-auto" max-width="95%" density="default"
             @click="(show_error=!show_error)">
        error
      </v-btn>

      <!-- dialog box to view the error text full-page -->
      <v-dialog v-model="show_error" xxwidth="80%" max-width="100ex">
        <v-card class="d-flex flex-column height100">
          <!-- title bar with close button -->
          <v-card-title class="d-flex align-baseline width100 pl-6">
            <span>Custom widget import error</span>
            <v-spacer></v-spacer>
            <v-btn elevation=0 icon @click="show_error=false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <!-- pop-up content with error message and source code -->
          <v-card-text class="flex-grow-1 pt-1">
            <p>URL: <tt>{{(error.fileName||url)}}</tt></p>
            <p>
              <span v-if="error.lineNumber">Line {{error.lineNumber}} col {{error.columnNumber}}:</span>
              &nbsp;<b>{{error.message}}</b>
            </p>
            <p class="font-weight-light">The browser console may have additional error messages...</p>
            <p v-if="source" class="pt-2">Source:<br>
              <pre class="pt-1 source">{{source}}</pre>
            </p>
          </v-card-text>

        </v-card>
      </v-dialog>

    </div>
    <div v-else class="text-center loading" style="line-height:1.2em">loading<br>widget...</div>
  </div>
</template>

<style scoped>
  .loading { color: grey; }
  .source { line-height: 1.0em; }
  tt { font-size: 80% }
</style>

<script scoped>

import { defineComponent } from 'vue'

export default {
  name: 'CustomWidget',
  help: `Display a dynamically defined widget.
`,

  props: {
    id: { type: String, required: true },
    styles: { type: String, default: "" },
    url: { type: String, default: "" },
    name: { type: String, default: "" },
    props: { type: Object, default: () => ({}) },
  },

  output: { default: null },

  data: () => ({
    component: null,
    error: null,
    show_error: false,
    source: null, // source code when showing error
  }),

  computed: {
    bindings() { return { ...this.props } },
  },

  watch: {
    url: {
      immediate: true,
      async handler(url) {
        const name = `w${this.id}`
        console.log(`CustomWidget ${name} loading ${url}`)
        if (!url) return
        try {
          const { default: mod } = await import(/*@vite-ignore*/ url)
          delete mod.name // we override with a unique synthetic name
          console.log(`component keys for ${name}:`, Object.keys(mod).join(' '), mod)
          window.App.component(name, defineComponent(mod))
          this.component = name
          this.error = null
          this.source = null
        } catch (err) {
          const msg = `Error importing ${err.fileName}. Line ${err.lineNumber} col ${err.columnNumber}: ${err.message}`
          console.log(msg)
          this.component = null
          this.error = err
          // fetch source code for display
          try {
            const resp = await fetch(url)
            let source = await resp.text()
            source = source.split('\n').map((line, i) => {
              let ln = `${i+1}`
              ln = ' '.repeat(3-ln.length) + ln
              return `${ln}: ${line}`
          }).join('\n')
            this.source = source
          } catch (err) {
            console.log(`Error fetching source from ${url}: ${err}`)
          }
        }
      }
    },

    styles: {
      immediate: true,
      handler(styles) {
        const id = `style-${this.id}`
        const ref = document.getElementById(id)
        if (ref) {
          ref.innerHTML = styles
        } else {
          const style = document.createElement('style')
          style.id = id
          style.innerHTML = styles
          document.head.appendChild(style)
        }
      }
    },
  },

}
</script>
