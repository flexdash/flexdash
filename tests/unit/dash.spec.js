import Vue from 'vue'
import { myMount } from './mounts.js'
import Dash from "@/Dash.vue"

const transitionStub = () => ({ render(h) {
  return h('span', this.$options._renderChildren) } })

const config1 = {
  tabs: [{icon: "view-dashboard", "grids": [ "g0" ] }],
  grids: { "g0": { "id": "g0", "kind": "h6", "widgets": [] } },
}
const config2 = {
  tabs: [{icon: "view-dashboard", "grids": ["g0","g1"] },
         {icon: "view-nothing", "grids": [ "g2" ] }],
  grids: {
    "g0": { "id": "g0", "kind": "h6", "widgets": [] },
    "g1": { "id": "g1", "kind": "h6", "widgets": [] },
    "g2": { "id": "g2", "kind": "h6", "widgets": [] },
  },
}

describe('Dash', () => {

  it('displays the app title with empty config', () => {
    const wrapper = myMount(Dash, { mocks: { '$config': {} }})
    expect(wrapper.isVueInstance).toBeTruthy()
    expect(wrapper.find("v-toolbar-title-stub").html()).toContain("fooey")
  })

  it('displays one tab with one grid', () => {
    const wrapper = myMount(Dash, { mocks: { '$config': config1 }})
    //expect(wrapper.html()).toMatchSnapshot()
    expect(wrapper.find("v-tab-stub").html()).toContain("view-dashboard")
    expect(wrapper.findAll("v-tab-item-stub").length).toBe(1)
  })

  /*
  it('produces tabGrids correctly', () => {
    const wrapper = myMount(Dash, { mocks: { '$config': config2 }})
    //console.log("data:", wrapper.vm.tabGrids)
    expect(wrapper.vm.tabGrids).toHaveLength(2)
  })*/

  it('displays the first tab with two grids', async () => {
    const wrapper = myMount(Dash, {
      mocks: { '$config': config2 },
      stubs: {
        transition: transitionStub(),
        smallFixedGrid: { render(h) { return h('h6', []) }},
      },
    }, true)
    await Vue.nextTick()
    //expect(wrapper.html()).toMatchSnapshot()
    const tabs = wrapper.findAll(".v-tab .v-icon")
    expect(tabs).toHaveLength(2)
    expect(tabs.at(0).classes()).toContain("mdi-view-dashboard")
    expect(tabs.at(1).classes()).toContain("mdi-view-nothing")
    //console.log("Main", wrapper.find("main").html())
    expect(wrapper.findAll("h6").length).toBe(2)
  })

})
