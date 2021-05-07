<template>
  <div style="display: contents">
    <!--stat title="array" unit="" :value="count" ref="me"></stat-->
    <slot v-for="c in array" v-bind="c"></slot>
  </div>
</template>

<script scoped>
//import Stat from './stat';

export default {
  name: 'ComponentArray',

  components: {
    //Stat,
  },

  props: {
    array: { type: Array, default: () => { return []; } },
  },

  computed: {
    count: function() { return this.array.length; },
  },

}
</script>
