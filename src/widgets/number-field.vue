<!-- NumberField - Simple numeric input field, sends a message when changed
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
     
    -->
    <template>
      <v-text-field variant="plain" density="compact" class="my-auto px-2 w-100 flex-grow-0"
                  hide-details single-line v-bind="bindings" :class="classes" type="number"
                  v-model="value" @keyup.enter="submit" @update:focused="focusChg">
    </v-text-field>
</template>

<style scoped>
  .v-input :deep(input) { padding-top: 2px; }
  .v-input.left :deep(input) { text-align: left; }
  .v-input.center :deep(input) { text-align: center; }
  .v-input.right :deep(input) { text-align: right; }
</style>

<script scoped>
export default {
  name: 'NumberField',

  help: `Simple numeric input field.
The number field sends a message with its contents when the field looses focus (or on enter).`,

  props: {
    enabled: { default: true },
    color: { default: "transparent" },
    value: { default: "", tip: 'Value shown in the number field' },
    align: { default: "center", tip: 'Number alignment: left, center, right' },
  },

  output: { default: null },

  computed: {
    // actual bindings passed into v-btn
    bindings() { return {
      disabled: !this.enabled,
      bgColor: this.color,
    }},
    classes() { return [ this.align ] },
  },

  methods: {
    focusChg(ev) {
      if (!ev) this.$emit('send', this.value)
    },
    submit(ev) {
      document.activeElement.blur() // remove focus from input field
      this.$emit('send', this.value)
    },
  },

}
</script>
