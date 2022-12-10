<!-- TextField - Single line editable text field, sends a message when changed
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
     
    -->
    <template>
      <v-text-field variant="plain" density="compact" class="my-auto px-2 w-100 flex-grow-0"
                  hide-details single-line v-bind="bindings" :class="classes"
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
  name: 'TextField',

  help: `Single line text field.
The text field sends a message with its contents when the field looses focus (or on enter).`,

  props: {
    enabled: { default: true },
    color: { default: "transparent" },
    text: { default: "", tip: 'Text shown in the text field' },
    align: { default: "center", tip: 'Text alignment: left, center, right' },
  },

  data: () => ({
    value: "",
  }),

  watch: {
    text: { immediate: true, handler(val) { this.value = val } },
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
      document.activeElement.blur() // remove focus from text field
      this.$emit('send', this.value)
    },
  },

}
</script>
