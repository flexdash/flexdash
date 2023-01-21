<!-- Component loader - Load custom components for use within widgets.
     Copyright ©2023 Thorsten von Eicken, MIT license, see LICENSE file
-->

<!-- This component doesn't currently have a UI. It is a component so it can easily participate 
     in the reactivity-driven updates of the $config state. In the future, it might display a UI
     showing the list of loaded components for troubleshooting purposes
-->

<template>
  <div style="display: none"></div>
</template>

<script>
export default {
  name: "ComponentLoader",

  props: {
    // array of component definitions indexed by (kebab-case) component name, with
    // values of { name, url, styles }
    components: { type: Object, required: true },
  },
  watch: {
    components: {
      deep: true,
      immediate: true,
      handler(newVal, oldVal) {
        for (const name in newVal) {
          if (name in oldVal) {
            console.log(`ComponentLoader: updating ${name}`)
          }
          // Note: Vue cannot remove components that have been deleted
        }
      },
    },
  },
}
</script>
