import Vue from 'vue'
import { myMount } from './mounts.js'
import WidgetWrap from "@/components/widget-wrap.vue"
import { default as store, StoreReinit } from '@/store.js'

import Stat from "@/widgets/stat.vue"
import Gauge from "@/widgets/gauge.vue"

const config1 = {
  kind: 'Stat', id: "w1", static: { title: "t1", unit: "F" }, dynamic: { value: "foo" }
}

const options = {
  provide: { sendSrv: () => {} },
  components: { Stat, Gauge },
}

describe('WidgetWrap', () => {

  beforeEach(() => {
    window.widgetPalette = {
      Stat: { props: { unit: { type: String }, value: { type: Number } } },
      Gauge: { props: { title: { type: String } } },
    }
  })

  afterEach(() => { delete window.widgetPalette })

  it("renders an empty title if the child doesn't", () => {
    const config = { kind: 'Stat' }
    const wrapper = myMount(WidgetWrap, { propsData: { config }, ...options })
    expect(wrapper.isVueInstance).toBeTruthy()
    expect(wrapper.find("span").text()).toBe("--")
  })

  it("renders a title if the child doesn't", () => {
    const config = { kind: 'Stat', static: { title: "t1" } }
    const wrapper = myMount(WidgetWrap, { propsData: { config }, ...options })
    expect(wrapper.find("span").text()).toBe("t1")
  })

  it("lets the child render the title", () => {
    const config = { kind: 'Gauge', static: { title: "t1" } }
    const wrapper = myMount(WidgetWrap, { propsData: { config }, ...options })
    expect(wrapper.find("span").exists()).toBe(false)
  })

  it("renders an edit button in editMode", () => {
    const config = { kind: 'Stat' }
    const parentComponent = { data() { return {editMode:true} } }
    const wrapper = myMount(WidgetWrap, { propsData: { config }, parentComponent, ...options })
    //console.log("HTML:", wrapper.html())
    expect(wrapper.find("v-btn-stub").exists()).toBe(true)
  })

  it("renders _no_ edit button if editMode is off", () => {
    const config = { kind: 'Stat' }
    const parentComponent = { data() { return {editMode:false} } }
    const wrapper = myMount(WidgetWrap, { propsData: { config }, parentComponent, ...options })
    expect(wrapper.find("v-btn-stub").exists()).toBe(false)
  })

  it("creates static bindings", () => {
    const config = { kind: 'Stat', static: { unit: "F" } }
    const wrapper = myMount(WidgetWrap, { propsData: { config }, ...options })
    expect(wrapper.find("stat-stub").attributes()).toHaveProperty('unit', 'F')
  })

  describe('dynamic bindings', ()=>{
    beforeEach(()=>{ StoreReinit() })

    it("creates dynamic bindings", () => {
      store.insertData('temp1', 99)
      const config = { kind: 'Stat', dynamic: { value: "temp1" } }
      const wrapper = myMount(WidgetWrap, { propsData: { config }, ...options })
      expect(wrapper.find("stat-stub").attributes()).toHaveProperty('value', '99')
    })

    it("creates dynamic bindings that update", async () => {
      store.insertData('temp1', 99)
      const config = { kind: 'Stat', dynamic: { value: "temp1" } }
      const wrapper = myMount(WidgetWrap, { propsData: { config }, ...options })
      expect(wrapper.isVueInstance).toBeTruthy()
      expect(wrapper.find("stat-stub").attributes()).toHaveProperty('value', '99')
      store.sd.temp1 = 101
      await Vue.nextTick()
      expect(wrapper.find("stat-stub").attributes()).toHaveProperty('value', '101')
    })

    it("updates dynamic bindings and they update", async () => {
      store.insertData('temp1', 99)
      store.insertData('temp2', 102)
      const config = { kind: 'Stat', dynamic: { value: "temp1" } }
      const wrapper = myMount(WidgetWrap, { propsData: { config }, ...options })
      expect(wrapper.find("stat-stub").attributes()).toHaveProperty('value', '99')
      // change what we're looking at
      config.dynamic.value = "temp2"
      await Vue.nextTick()
      expect(wrapper.find("stat-stub").attributes()).toHaveProperty('value', '102')
      // change the value of what we're looking at
      store.sd.temp2 = 103
      await Vue.nextTick()
      expect(wrapper.find("stat-stub").attributes()).toHaveProperty('value', '103')
    })
  })

})
