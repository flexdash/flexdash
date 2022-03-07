// Dynamically compile and load a single-file-component widget
// Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file

import Vue from 'vue'

const compiling = {} // modules that are being compiled
const moduleCache = Object.assign(Object.create(null), { vue: Vue })
const loaderOptions = {
  moduleCache,

  async getFile(url) {
    console.log('getFile:', url)
    if (compiling[url]) {
      const dataPromise = new Promise((res, rej) => res(compiling[url]))
      return { getContentData(asBinary) { return dataPromise }, type: '.vue' }
    }
    const res = await fetch(url)
    if (!res.ok)
      throw Object.assign(new Error(res.statusText + ' ' + url), { res })
    return {
      getContentData: asBinary => asBinary ? res.arrayBuffer() : res.text(),
    }
  },

  addStyle(textContent) {
    const style = Object.assign(document.createElement('style'), { textContent })
    const ref = document.head.getElementsByTagName('style')[0] || null
    document.head.insertBefore(style, ref)
  },
}

// On first call, register Vuetify components, on subsequent calls, just return the first-run promise
let vuetifyRegistered = () => {
  const prom = registerVuetify()
  vuetifyRegistered = () => prom
}

async function registerVuetify() {
  console.log("awaiting vuetify/lib")
  const vv = await import('vuetify/lib')
  console.log("got vuetify/lib")
  const list = []
  Object.keys(vv).forEach(k => {
    if (k.startsWith('V')) {
      Vue.component(k, vv[k])
      list.push(k)
    }
  })
  console.log("Registered Vuetify components:", list.join(', '))
}

export default function (name, source, palette) {
  if (compiling[name]) return
  console.log("Dynamically loading SFC", name)

  async function doit() {
    try {
      await vuetifyRegistered()
      const {loadModule} = await import('vue3-sfc-loader/dist/vue2-sfc-loader.js')
      compiling[name] = source
      const component = await loadModule(name, loaderOptions)
      delete compiling[name]
      Vue.component(name, component)
      Vue.set(palette, name, component)
      console.log("Loaded SFC", name)
    } catch (e) {
      delete compiling[name]
      console.log("Error loading SFC", name, e)
    }
  }
  doit().then(() => {})
}
