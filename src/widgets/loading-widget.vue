<!-- UnknownWidget - display something useful for unknown widgets
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div class="text-center loading" style="line-height:1.2em">loading<br>widget...</div>
</template>

<style scoped>
  .loading { color: grey; }
</style>

<script scoped>
export default {
  name: 'LoadingWidget__',
  help: `Display something for widgets that are still loading.
`,
}
</script>
