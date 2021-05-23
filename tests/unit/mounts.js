import { createLocalVue } from "@vue/test-utils"
import { shallowMount, mount } from "@vue/test-utils"
import Vue from 'vue'
import Vuetify from 'vuetify'
import store from '/src/store.js'

const localVue = createLocalVue()
Vue.use(Vuetify)

export const transitionStub = () => ({ render(h) {
  return h('span', this.$options._renderChildren) } })

export function myMount(comp, options, real) {
  const vuetify = new Vuetify()
  const palette = { grids: {FixedGrid: {}}, widgets: {Stat:{}, Gauge:{}} }
  options = Object.assign({
    localVue, vuetify,
    provide: {palette},
    ...options})
  if (!options.provide) options.provide = {}
  options.provide.$config = store.config
  options.provide.$store = store
  return real? mount(comp, options) : shallowMount(comp, options)
}
