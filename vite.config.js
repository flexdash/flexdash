import ViteComponents, { VuetifyResolver } from 'vite-plugin-components'
import { createVuePlugin } from 'vite-plugin-vue2'
import visualizer from 'rollup-plugin-visualizer'

export default {
  base: './',
  plugins: [
    createVuePlugin(),
    ViteComponents({
      dirs: ['/src/components', '/src/connections'],
      customComponentResolvers: [VuetifyResolver()],
    }),
    visualizer({
      filename: "stats/stats.html",
      title: "FlexDash Rollup",
      brotliSize: true,
      gzipSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vuetify: ["vuetify/lib"],
          vue: ["vue"],
        },
      },
    },
  },
}
