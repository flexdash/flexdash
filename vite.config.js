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
  define: {
    // pull-in the package version from package.json
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
  },
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
