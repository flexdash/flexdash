<!-- UnknownWidget - display something useful for unknown widgets
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="text-center unknown">unknown<br>widget</div>
</template>

<style scoped>
  .unknown { color: darkred; }
</style>

<script scoped>
export default {
  name: 'UnknownWidget__',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Display something for unknown widgets.
`,

}
</script>
