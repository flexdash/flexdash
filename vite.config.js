import ViteComponents, { VuetifyResolver } from 'vite-plugin-components'
import { createVuePlugin } from 'vite-plugin-vue2'
import visualizer from 'rollup-plugin-visualizer'
import compress from 'vite-plugin-compress'
import gen_start_js from './rollup-plugin-start-js.js'

export default {
  base: './',
  plugins: [
    createVuePlugin(),
    ViteComponents({
      dirs: ['/src/components', '/src/connections'],
      customComponentResolvers: [VuetifyResolver()],
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
