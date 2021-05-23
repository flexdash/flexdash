import ViteComponents, { VuetifyResolver } from 'vite-plugin-components'
import { createVuePlugin } from 'vite-plugin-vue2'

export default {
  base: '/flexdash/',
  plugins: [
    createVuePlugin(),
    ViteComponents({
      dirs: ['/src/components', '/src/connections'],
      customComponentResolvers: [VuetifyResolver()],
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vuetify: ["vuetify"],
          vue: ["vue"],
        },
      },
    },
  },
}
