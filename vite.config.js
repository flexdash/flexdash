import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from '@vuetify/vite-plugin'
import visualizer from 'rollup-plugin-visualizer'


// https://vitejs.dev/config/
export default defineConfig(({mode}) => ({
  base: './',
  plugins: [
    //{name:'RINFO', resolveId: (s, i, o) => { console.log("RESOLVEID: " + s + " from " + i + " w/" + o)}},
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
  define: {
    // pull-in the FlexDash version from package.json
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
  },
  resolve: {
    alias: mode == 'production' ? {
      'vue': 'vue/dist/vue.esm-browser.prod.js',
    } : {},
  },
  // server: { fs: { allow: [ '.', '../mylib' ] }, },
  build: {
    minify: false, // for debugging
    target: 'esnext',
    manifest: true,
    chunkSizeWarningLimit: 2000,
    dynamicImportVarsOptions: { // don't eval/rewrite dynamic import statements
      exclude: ["./src/utils/palette-loader.js"]
    },
    rollupOptions: {
      external: ['vue' ], // don't include in bundle
      output: {
        paths: {
          vue: './vue.esm-browser.prod.js',
        },
      },
      plugins: [
      ],
    },
  }
}))

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
