<template>
  <v-container fluid class="g-grid">
    <!-- Orchard status -->
    <v-card>
      <v-card-title>Orchard status</v-card-title>
      <div class="g-grid-small g-grid-margin g-in-card">
        <stat title="watering" unit="" :value="orchardWatering"></stat>
        <stat title="live" unit="" :value="orchardLiveTxt"></stat>
        <stat title="gallons" unit="" :value="orchardGallons"></stat>
        <stat title="start at" unit="" :value="orchardStartAt"></stat>
      </div>
    </v-card>
    <!-- Orchard valve table -->
    <v-card class="g-2w-2h">
      <v-card-title>Orchard valves</v-card-title>
      <orchard-vtable
          v-bind="nr.orchard_state"
          v-bind:names='["large citrus", "top citrus", "lower citrus", "apricots", "avocado", "old stone", "new stone", "windbreak"]'/>
    </v-card>
  </v-container>
</template>

<script scoped>

import Stat from '/src/components/stat'
import OrchardVtable from '/src/components/orchard-vtable'

export default {
  name: 'DashTab',

  components: {
    Stat,
    OrchardVtable,
  },

  props: {
    nr: null,
  },

  computed: {
    orchardLiveTxt: function() {
      let os = this.nr.orchard_state;
      if (!os || !os.at) return "?";
      let at = new Date(os.at*1000);
      return at.dow() + " " + at.dom();
    },
    orchardWatering: function() {
      let os = this.nr.orchard_state;
      if (!os) return "?";
      if (typeof os.sched_valve === 'number') return `ckt ${os.sched_valve+1} now`;
      return os.done_today ? "tomorrow" : "today";
    },
    orchardGallons: function() {
      let os = this.nr.orchard_state;
      if (!os || !os.gallons) return "?";
      return Math.round(os.gallons);
    },
    orchardStartAt: function() {
      let os = this.nr.orchard_state;
      if (!os || !os.sched_start_min) return "?";
      let min = os.sched_start_min % 60;
      if (min < 10) min = "0"+min;
      return `${Math.trunc(os.sched_start_min/60)}:${min}`;
    },
  },

}

</script>
