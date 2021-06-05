<!-- MasonryBrick - A brick in a masonry layout that automatically adjusts its row-span so its
     content fits
-->

<template>
  <div class="masonry-brick" :style="style">
    <slot></slot>
  </div>
</template>

<style>
.masonry-brick > * { overflow: hidden; }
</style>

<script scoped>
export default {
  name: "MasonryBrick",

  props: {
    cols: { default: 1 },
  },

  computed: {
    style() { return { "grid-column-end": `span ${this.cols}` } },
  },

}
</script>
