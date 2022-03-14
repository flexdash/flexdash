import { createVuePlugin } from 'vite-plugin-vue2'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import visualizer from 'rollup-plugin-visualizer'
import compress from 'vite-plugin-compress'
import gen_start_js from './rollup-plugin-start-js.js'

// function watchResolve() {
//   return {
//     name: 'watch-resolve', // required, will show up in warnings and errors
//     resolveId(id) {
//       console.log("resolving: " + id)
//       if (id.startsWith('uplot')) {
//         return `${__dirname}/node_modules/${id}`
//       }
//     },
//     load(id) {
//       console.log("loading: " + id)
//     }
//   }
// }

export default {
  base: './',
  plugins: [
    //watchResolve(),
    createVuePlugin(),
    // unplugin-vue-components https://github.com/antfu/unplugin-vue-components
    Components({
      directives: false, // auto import for directives
      resolvers: [
        VuetifyResolver(),
      ],
    }),
    //compress({verbose: true}),
    visualizer({
      filename: "stats/stats.html",
      title: "FlexDash Rollup",
      brotliSize: true,
      gzipSize: true,
    }),
  ],
  define: {
    // pull-in the package version from package.json
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
  },
  build: {
    manifest: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      plugins: [gen_start_js()],
      output: {
        manualChunks: {
          vuetify: ["vuetify/lib"],
          vue: ["vue"],
          'vue3-sfc-loader': ["vue3-sfc-loader", "vue3-sfc-loader/dist/vue2-sfc-loader"],
        },
      },
    },
  },
}
