import Vue from 'vue'
import { myMount } from './mounts.js'
import Dash from "@/Dash.vue"
import { default as store, StoreReinit } from '@/store.js'

import FixedGrid from "@/grids/fixed-grid.vue"
Vue.component('FixedGrid', FixedGrid)

const transitionStub = () => ({ render(h) {
  return h('span', this.$options._renderChildren) } })

describe('Dash', () => {

  beforeEach(()=>{
    StoreReinit()
    store.initDash()
    window.gridPalette = { FixedGrid: {} }
  })

  it('displays the app title with empty config', () => {
    const wrapper = myMount(Dash, {})
    expect(wrapper.isVueInstance).toBeTruthy()
    expect(wrapper.find("v-toolbar-title-stub").html()).toContain("FlexDash")
  })

  it('displays one tab with one grid', () => {
    const wrapper = myMount(Dash, {})
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

  it('displays the two tab with multiple grids', async () => {
    store.qMutation('add grid', [
      [ 'grids/g2', { "id": "g2", "kind": "h6", "widgets": [] } ],
      [ 'grids/g00001/kind', "h6" ],
      [ 'tabs/t00001/grids/1', "g2" ],
      [ 'tabs/t00002', { id:'t00002', icon: 'view-nothing', grids:['g2']} ],
      [ 'dash/tabs/1', "t00002" ],
    ])
    const wrapper = myMount(Dash, {
      stubs: {
        transition: transitionStub(),
        // prevent a bunch of subcomponents from loading by providing a custom render function
        fixedGrid: { render(h) { return h('h6', []) }},
        uib: { render(h) { return h('h5', []) }},
        demo: { render(h) { return h('h5', []) }},
      },
    }, true)
    await Vue.nextTick()
    //console.log(wrapper.html())
    const tabs = wrapper.findAll(".v-tab .v-icon")
    expect(tabs).toHaveLength(4) // each tab shows up in the tab bar and in the left nav for mobile
    expect(tabs.at(0).classes()).toContain("mdi-view-dashboard")
    expect(tabs.at(1).classes()).toContain("mdi-view-nothing")
    //console.log("Main", wrapper.find("main").html())
    expect(wrapper.findAll("h6").length).toBe(2)
  })

})
