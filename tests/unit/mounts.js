import { createLocalVue } from "@vue/test-utils"
import { shallowMount, mount } from "@vue/test-utils"
import Vue from 'vue'
import Vuetify from 'vuetify'

const localVue = createLocalVue()
Vue.use(Vuetify)

export const transitionStub = () => ({ render(h) {
  return h('span', this.$options._renderChildren) } })

export function myMount(comp, options, real) {
  const vuetify = new Vuetify()
  options = Object.assign({
    localVue, vuetify,
    data: () => ({
        appTitle : "fooey",
        gotConfig : true,
        tab : 0,
      }),
    ...options})
  return real? mount(comp, options) : shallowMount(comp, options)
}
