import Vue from 'vue'
import { myMount } from './mounts.js'
import Dash from "/src/dash.vue"
import { default as store, StoreReinit } from '/src/store.js'

import StdGrid from "/src/grids/fixed-grid.vue"
Vue.component('StdGrid', StdGrid)

const transitionStub = () => ({ render(h) {
  return h('span', this.$options._renderChildren) } })

describe('Dash', () => {

  beforeEach(()=>{
    StoreReinit()
    store.initDash()
  })

  it('displays the app title with empty config', () => {
    const wrapper = myMount(Dash, { })
    expect(wrapper.isVueInstance).toBeTruthy()
    console.log("APP TITLE", wrapper.html())
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

  it('displays the two tabs with multiple grids', async () => {
    store.qMutation('add grid', [
      [ 'grids/g2', { "id": "g2", "kind": "h6", "widgets": [] } ],
      [ 'grids/g00001/kind', "h6" ],
      [ 'tabs/t00001/grids/1', "g2" ],
      [ 'tabs/t00002', { id:'t00002', icon: 'view-nothing', grids:['g2']} ],
      [ 'dash/tabs/1', "t00002" ],
      [ 'dash/title', "TheDash" ],
    ])
    const wrapper = myMount(Dash, {
      stubs: {
        transition: transitionStub(),
      },
    })
    await Vue.nextTick()
    console.log("MULTIPLE GRIDS", wrapper.html())
    const tabs = wrapper.findAll("v-tab-stub v-icon-stub")
    expect(tabs).toHaveLength(4) // each tab shows up in the tab bar and in the left nav for mobile
    expect(tabs.at(0).text()).toContain("mdi-view-dashboard")
    expect(tabs.at(1).text()).toContain("mdi-view-nothing")
    expect(wrapper.find("#g00001").exists()).toBe(true)
    expect(wrapper.findAll("#g2").length).toBe(2)
  })

})
