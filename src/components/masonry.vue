<!-- Masonry - Simple masonry layout, adapted from https://w3bits.com/css-grid-masonry/
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <div class="masonry">
    <slot></slot>
  </div>
</template>

<style scoped>
.masonry {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20em, 1fr));
  grid-auto-rows: 16px;
  grid-gap: 2em;
}
</style>

<script scoped>
export default {
  name: "Masonry",

  mounted() {
    this.resizeBricks()
    const ro = new ResizeObserver(()=> {
      //console.log("Masonry resized")
      this.resizeBricks()
    }).observe(this.$el)
    if (ro) this.ro = ()=> ro.unobserve(this.$el)
  },
  beforeDestroy() {
    if (this.ro) this.ro()
    this.ro = undefined
  },

  methods: {
    // Resize a masonry brick from https://w3bits.com/css-grid-masonry/
    resizeBrick(brick, rowHeight, rowGap) {
      // Spanning for any brick = S
      // Grid's row-gap = G
      // Size of grid's implicitly create row-track = R
      // Height of item content = H
      // Net height of the item = H1 = H + G
      // Net height of the implicit row-track = T = G + R
      // S = H1 / T
      const inner = brick.children[0]
      //const H = inner.getBoundingClientRect().height
      const H = inner.clientHeight
      const rowSpan = Math.ceil((H+rowGap)/(rowHeight+rowGap))
      const span = 'span '+rowSpan
      //console.log(`Masonry: H=${Math.round(H)} R=${rowHeight} G=${rowGap}`,
      //  `span=${brick.style.gridRowEnd} -> ${rowSpan}`)

      if (rowSpan > 0 && brick.style.gridRowEnd != span)
        brick.style.gridRowEnd = 'span '+rowSpan
    },

    resizeBricks() {
      const grid_style = window.getComputedStyle(this.$el)
      const rowGap = parseInt(grid_style.getPropertyValue('grid-row-gap'))
      const rowHeight = parseInt(grid_style.getPropertyValue('grid-auto-rows'))
      for (let brick of this.$children) {
        this.resizeBrick(brick.$el, rowHeight, rowGap)
      }
    }

  },
}
</script>
