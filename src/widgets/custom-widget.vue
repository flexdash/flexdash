<!-- CustomWidget - Widget to display a custom, i.e., dynamically defined widget
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div v-if="(errors.length||import_error)" class="h-100 d-flex align-center justify-center" v-bind="$attrs">
    <v-btn variant="elevated" class="ma-auto" max-width="95%" density="default"
           @click="(show_error=!show_error)">
      error
    </v-btn>
  </div>
  <component v-else-if="component" :is="component"
             v-bind="{...bindings,...$attrs}" @send="$emit('send', $event)" />
  <div v-else class="text-center loading" style="line-height:1.2em" v-bind="$attrs">
    loading<br>widget...
  </div>

  <!-- dialog box to view the error text full-page -->
  <v-dialog v-model="show_error" max-width="100ex">
    <v-card class="d-flex flex-column height100">
      <!-- title bar with close button -->
      <v-card-title class="d-flex align-baseline width100 pl-6">
        <span>Custom widget error</span>
        <v-spacer></v-spacer>
        <v-btn elevation=0 icon @click="show_error=false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="flex-grow-1 pt-1">
        <!-- server-side compilation errors -->
        <div v-if="errors.length" style="display: content">
          <p v-for="(err,ix) in errors" :key="ix">{{err}}</p>
        </div>
        <!-- browser-side import errors -->
        <div v-else style="display: content">
          <!-- error message and source code -->
          <p>URL: <code>{{(import_error.fileName||url)}}</code></p>
          <p>
            <span v-if="import_error.lineNumber">
              line {{import_error.lineNumber}} col {{import_error.columnNumber}}:
            </span>
            &nbsp;<b>{{import_error.message}}</b>
          </p>
          <p class="font-weight-light">The browser console may have additional error messages...</p>
          <p v-if="source" class="pt-2">Source:<br>
            <pre class="pt-1 source">{{source}}</pre>
          </p>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

</template>

<style scoped>
  .loading { color: grey; }
  .source { line-height: 1.0em; }
  code { font-size: 80% }
</style>

<script scoped>

import { defineComponent } from 'vue'

export default {
  name: 'CustomWidget',
  help: `Display a dynamically defined widget.
`,

  props: {
    id: { type: String, required: true },
    styles: { type: String, default: "" }, // CSS styles to inject in <style> tag
    url: { type: Array, default: null }, // [URL,hash] for source code
    errors: { type: Array, default: () => [] },
    props: { type: Object, default: () => ({}) },
  },

  output: { default: null },
  emits: ['send'],

  data: () => ({
    component: null,
    import_error: null,
    show_error: false,
    source: null, // source code when showing error
  }),

  computed: {
    bindings() { return { ...this.props } },
  },

  watch: {
    url: {
      immediate: true,
      async handler(url_hash) {
        if (!Array.isArray(url_hash) || url_hash.length != 2) {
          this.component = null
          this.import_error = null
          return
        }
        const name = `${this.id}-${url_hash[1]}` // name of component
        const url = `${url_hash[0]}?h=${url_hash[1]}` // URL to fetch component source
        console.log(`CustomWidget ${name} loading ${url}`)
        try {
          const { default: mod } = await import(/*@vite-ignore*/ url)
          delete mod.name // we override with a unique synthetic name
          console.log(`component keys for ${name}:`, Object.keys(mod).join(' '), mod)
          // register if not already reg'd: the hash only changes if source changes
          if (!window.App.component(name)) window.App.component(name, defineComponent(mod))
          this.component = name
          this.import_error = null
          this.source = null
          if (!Array.isArray(this.errors) || this.errors.length == 0) this.show_error = false
        } catch (err) {
          const msg = `Error importing ${err.fileName}. Line ${err.lineNumber} col ${err.columnNumber}: ${err.message}`
          console.log(msg)
          this.component = null
          this.import_error = err
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
