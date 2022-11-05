<!-- Slider - Numeric slider input, sends a message when changed
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
    -->
    <template>
      <v-slider density="compact" :class="classes"
                  hide-details single-line v-bind="bindings"
                  v-model="value" @update:modelValue="updated"
                  @update:focused="focusChg" @mouseup="send" @keyup.enter="send">
    </v-slider>
</template>

<style scoped>
.v-input, .v-input :deep(.v-input__control) { min-height: 30px; }  
</style>

<script scoped>
export default {
  name: 'Slider',

  help: `Numeric slider input.
The slider sends a message with its contents when the slider knob is released, enter is pressed,
or the lider looses focus.`,

  props: {
    enabled: { type: Boolean, default: true },
    color: { type: String, default: "" },
    value: { type: Number, default: "", tip: 'Value shown in the number field' },
    min: { type: Number, default: 0, tip: 'Minimum value' },
    max: { type: Number, default: 100, tip: 'Maximum value' },
    step: { type: Number, default: 1, tip: 'Step size' },
    thumb_label: { type: Boolean, default: false, tip: 'Show thumb label when using slider' },
    ticks: { type: Boolean, default: false, tip: 'Show tick marks' },
    vertical: { type: Boolean, default: false, tip: 'Show vertical slider instead of horizontal' },
  },

  output: { default: null },

  computed: {
    // actual bindings passed into v-btn
    bindings() { return {
      disabled: !this.enabled,
      color: this.color,
      min: this.min,
      max: this.max,
      step: this.step,
      thumbLabel: this.thumb_label,
      showTicks: this.ticks ? "always" : false,
      direction: this.vertical ? "vertical" : "horizontal",
    }},
    classes() {
      return this.vertical ?
        ['py-4', 'flex-grow-1', 'flex-shrink-1'] :
        ['my-auto', this.thumb_label ? 'px-5' : 'px-4', 'w-100', 'flex-grow-0']
    },
  },

  methods: {
    focusChg(ev) {
      if (!ev) this.$emit('send', this.value)
    },
    send(ev) {
      this.$emit('send', this.value)
    },
    updated(ev) {
      //this.$emit('send', this.value)
    },

  },

}
</script>
