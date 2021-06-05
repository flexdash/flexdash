<!-- IFrame - Widget to embed something smallish from another site.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <iframe :src="url" width="100%" height="100%"
          frameborder="0" marginheight="0" marginwidth="0"></iframe>
</template>

<style scoped>
iframe {
  padding: 4px 4px 4px 4px; border: 0px;
  width:100%; height:100%;
  object-position: center top;
}
</style>

<script scoped>
export default {
  name: 'IFrame',
  // help displayed in the UI: the first line is used in the widgets menu and is always shown in
  // the edit card. Successive lines can be expanded in the card and are markdown-formatted.
  help: `Embed another site.
The IFrame widget embeds another site. This is handy to embed a chart or image. To embed a
full page see the i-frame grid.`,

  props: {
    url: { type: String, default: 'https://user-images.githubusercontent.com/19274367/' +
           '45430032-b6a5a180-b6a4-11e8-9645-a0497ef044f3.png'},
  },

}
</script>
