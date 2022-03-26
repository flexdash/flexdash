import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from '@vuetify/vite-plugin'
import visualizer from 'rollup-plugin-visualizer'

// const path = require('path')
// function dynloader() { return {
//   name: 'dynloader',
//   resolveId(source, importer, opts) {
//     if (source.match(/^vuetify\//)) {
//       //const id = path.resolve(__dirname, 'node_modules', source)
//       const id = path.join('/node_modules', source)
//       console.log("********** resolveId: " + source + " from " + importer + " -> " + id) // " opts: " + JSON.stringify(opts))
//       return id
//     }
//   }
// }}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    //{name:'RINFO', resolveId: (s, i, o) => { console.log("RESOLVEID: " + s + " from " + i + " w/" + o)}},
    vue(),
    vuetify({ // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
      autoImport: true,
    }),
    //dynloader(),
    visualizer({
      filename: "stats/stats.html",
      title: "FlexDash Rollup",
      brotliSize: true,
      gzipSize: true,
    }),
  ],
  define: {
    // pull-in the FlexDash version from package.json
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
  },
  resolve: {
    alias: {
      //'@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    //fs: { allow: [ '.', '../mylib' ] },
  },
  build: {
    manifest: true,
    chunkSizeWarningLimit: 2000,
    dynamicImportVarsOptions: { // don't eval/rewrite dynamic import statements
      exclude: ["./src/main.js"]
    },
    rollupOptions: {
      external: ['vue', 'vuetify/lib'], // don't include in bundle
      output: {
        paths: {
          vue: '/assets/vue.esm-browser.js',
          vuetify: '/assets/vuetify.esm.js',
        }
      }
    }
  }
})
