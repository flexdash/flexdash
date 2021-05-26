<!-- Markdown - Widget to display some (poor man's) Markdown, such as instructions.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <div style="width:100%; height:100%;overflow-y:scroll;">
    <v-card-text v-if="title" class="font-weight-bold px-0 pt-1 mb-n1 d-flex">
      <span class="mx-auto">{{title}}</span>
    </v-card-text>
    <v-card-text class="pt-0">
      <md class="pt-1" style="width:100%">{{text}}</md>
    </v-card-text>
  </div>
</template>

<script scoped>
import md from '/src/components/md.vue'

export default {
  name: 'Markdown',

  components: { md },

  help: `Render text using simple MarkDown.
This widget supports the following MarkDown formatting:

- paragraphs separated by an empty line
- \`_\`_italics_\`_\`, \`*\`*italics*\`*\`, \`__\`__bold__\`__\`, \`**\`**bold**\`**\`, \`\`\`code\`\`\`
- unordered lists (lines starting with \`- \`X or \`* \`), ordered lists (lines starting with \`[0-9]. \`)
- headings (lines starting with \`# \` through \`###### \` or lines followed by \`==\` for H1 and \`--\` for H2)
- block quotes (lines starting with \`> \`)
- code blocks (lines indented by 2 or more spaces, sorry, but \`\`\`\`\`\` is not supported)
- links as https://example.com or using \`[alt text](url)\`
- images using \`![alt text](url)\` (\`width:100%\` is applied)
- simple tables by starting lines with \`|\` and separating columns also with \`|\`
`,

  props: {
    title: { default: "Markdown" },
    text: { type: String, default: "- _Hello_ __!__" },
  },

}
</script>
