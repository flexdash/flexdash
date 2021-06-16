<!-- Thermostat - Widget showing a temperature day/night setpoints, and an on/off status.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="flex-grow-1 width100 d-flex flex-column justify-space-around align-center">
    <gauge v-bind="gaugeProps"></gauge>
    <value-sequence :range="set_range" :value="day_setpoint" :unit="unit"
                    label="— Day —" :label_above="true" style="font-size: 80%;">
    </value-sequence>
    <value-sequence :range="set_range" :value="night_setpoint" :unit="unit"
                    label="— Night —" :label_above="true" style="font-size: 80%;">
    </value-sequence>
    <div class="text-body-2 mb-1">{{active_label}}:
      <v-chip small>{{active?"ON":"OFF"}}</v-chip></div>
  </div>
</template>

<style scoped>
.unit { vertical-align: 15%; margin-left: 0.1em; font-size: 80%; }
</style>

<script scoped>
import Gauge from '/src/widgets/gauge.vue'
import ValueSequence from '/src/widgets/value-sequence.vue'
import EditPlusMinus from '/src/components/edit-plus-minus.vue'

export default {
  name: 'Thermostat',
  help: `Thermostat control with gauge and day/night setpoints.`,
  components: {Gauge, EditPlusMinus},

  props: {
    // for the gauge:
    unit: { type: String, default: "°F", tip: "unit shown after temperatures" },
    temperature: { default: null, dynamic: "$demo_random", tip: "temperature shown by gauge" },
    min: { type: Number, default: 50, tip: "minimum of gauge range" },
    max: { type: Number, default: 100, tip: "maximum of gauge range" },
    color: { type: String, default: "green", tip: "gauge color between low/high thresholds" },
    low_color: { type: String, default: "blue", tip: "gauge color below low threshold" },
    high_color: { type: String, default: "pink", tip: "gauge color above high threshold" },
    low_threshold: { type: Number, default: 62,
                     tip: "temperature for color change, null to disable" },
    high_threshold: { type: Number, default: 80,
                      tip: "temperature for color change, null to disable" },
    // for the setpoints
    day_setpoint: { type: Number, default: 70, tip: "target temperature during the day" },
    night_setpoint: { type: Number, default: 65, tip: "target temperature during the night" },
    setpoint_min: { type: Number, default: 60, tip: "minimum possible setpoint" },
    setpoint_max: { type: Number, default: 80, tip: "maximum possible setpoint" },
    // for the current state
    active: { type: Boolean, dynamic: "", tip: "appliance active boolean" },
    active_label: { type: String, default: "Heater", tip: "label next to active status" },
  },

  output: { default: null, tip: 'outputs setpoint as `{"day"|"night": value}`' },

  computed: {
    // put together all the props to pass down to the gauge widget
    gaugeProps() { return {
      min: this.min,
      max: this.max,
      value: this.temperature,
      color: this.gaugeColor,
      low_color: this.low_color,
      high_color: this.high_color,
      low_threshold: this.low_threshold,
      high_threshold: this.high_threshold,
      arc: 120,
      title: "",
      unit: this.unit,
    }},

    // range to pass into ValueSequence widget
    set_range() { return [this.setpoint_min, "...", this.setpoint_max] },
  },
}
</script>
