// Vite config for FlexDash
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import visualizer from 'rollup-plugin-visualizer'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({mode}) => { return {
  base: './',
  plugins: [
    vue(),
    vuetify({ // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
      autoImport: true,
    }),
    visualizer({
      filename: "stats/stats.html",
      title: "FlexDash Rollup",
      brotliSize: true,
      gzipSize: true,
    }),
  ],
  resolve: { alias: [
    // alias vuetify/lib for dev mode, without the use of new Vuetify components in external
    // modules gets an error that vuetify/lib/components/VXxx is not found
    { find: 'vuetify/lib', replacement: path.resolve(__dirname, '/node_modules/vuetify/lib') },
  ]},
  define: {
    // pull-in the FlexDash version from package.json
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
  },
  // server: { fs: { allow: [ '.', '../mylib' ] }, },
  build: {
    //minify: false, // for debugging
    target: 'esnext',
    manifest: true,
    chunkSizeWarningLimit: 600,
    dynamicImportVarsOptions: { // don't eval/rewrite dynamic import statements
      exclude: ["./src/utils/palette-loader.js"]
    },
  }
}})


//=== old stuff from various experiments, delete at some point...

// Use pre-built vue dist file:
// resolve: {
//   alias: mode == 'production' ? {
//     'vue': 'vue/dist/vue.esm-browser.prod.js',
//   } : {},
// },
// rollupOptions: {
//   external: ['vue'], // don't include in bundle
//   output: {
//     paths: {
//       vue: './vue.esm-browser.prod.js',
//     },
//   },
//   plugins: [
//   ],
// },

// Sample simple vite plugin:
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
