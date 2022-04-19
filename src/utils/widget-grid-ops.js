// widget-grid-ops - Functions used in grids to add/remove/reorder widgets.
// Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file

export default {

  addWidget(kind) {
    const widget_ix = this.$store.addWidget(this.id, kind)
    this.edit_ix = widget_ix // start editing the new widget
  },

  // handle widget delete event coming up from widget-edit
  deleteWidget(ix) {
    this.$store.deleteWidget(this.id, ix)
    this.edit_ix = null
  },

  // handle widget clone event coming up from widget-edit
  cloneWidget(ix) {
    // start by adding a new widget of the same kind to the end of the grid
    let widget_ix, widget_id
    const is_grid = this.is.startsWith('g') // vs. is panel
    if (is_grid) {
        const old_w = this.$store.widgetByID(this.$store.widgetIDByIX(this.grid, ix))
        widget_ix = this.$store.addWidget(this.id, old_w.kind)
        widget_id = this.$store.widgetIDByIX(this.grid, widget_ix)
    } else {
        const old_w = this.$store.widgetByID(this.$store.widgetIDByPanelIX(this.id, ix))
        widget_ix = this.$store.addPanelWidget(this.id, old_w.kind)
        widget_id = this.$store.widgetIDByPanelIX(this.id, widget_ix)
    }
    // copy the properties over
    const props = JSON.parse(JSON.stringify(old_w)) // clone and clean of observers
    delete props.id
    this.$store.updateWidget(widget_id, props)
    // move clone up to be just behind original
    if (widget_ix != ix+1) {
      let ww = is_grid ? [ ...this.grid.widgets ] : [ ...this.widgets ] // clone
      ww.copyWithin(ix+2, ix+1) // shift widgets up
      ww[ix+1] = widget_id
      if (is_grid) {
        this.$store.updateGrid(this.id, { widgets: ww })
      } else {
        this.$store.updateWidgetProp(this.id, 'static', 'widgets', ww)  
      }
    }
    this.edit_ix = ix+1
  },

  // move a widget up/down (dir=-1/1)
  moveWidget(ix, dir) {
    console.log(`Moving widget #${ix} by ${dir}`)
    const is_grid = this.id.startsWith('g') // vs. is panel
    const widgets = is_grid ? this.grid.widgets : this.widgets
    if (!(ix+dir >= 0 && ix+dir < widgets.length)) return
    let ww = [ ...widgets ] // clone
    let w = ww[ix]; ww[ix] = ww[ix+dir]; ww[ix+dir] = w // swap
    if (is_grid) this.$store.updateGrid(this.id, { widgets: ww })
    else this.$store.updateWidgetProp(this.id, 'static', 'widgets', ww)
    this.edit_ix += dir
  },

  // teleport the widget to a different grid or panel
  teleportWidget(widget_id, src_id, dest_id) {
    console.log(`Teleport widget ${widget_id} from ${src_id} to ${dest_id}`)
    this.edit_ix = null
    this.$store.moveWidget(widget_id, src_id, dest_id)
  },

  // paste a widget
  pasteWidget(ev) {
    // Stop data actually being pasted into div
    ev.stopPropagation()
    ev.preventDefault()
    // Get pasted data via clipboard API
    let clipboardData = ev.clipboardData || window.clipboardData
    let pastedData = clipboardData.getData('Text')
    this.pasting = false
    // Validate pasted text
    console.log(pastedData)
    try {
      let w = JSON.parse(pastedData)
      if ('id' in w && 'kind' in w) {
        if (w.kind in this.palette.widgets) {
          const widget_ix = this.$store.addWidget(this.id, w.kind)
          delete w.id
          delete w.kind
          const is_grid = this.is.startsWith('g') // vs. is panel
          if (is_grid) this.$store.updateWidget(this.$store.widgetIDByIX(this.grid, widget_ix), w)
          else this.$store.updateWidget(this.$store.widgetIDByPanelIX(this.id, widget_ix), w)
        } else {
          console.log(`Widget kind '${w.kind}' not found`)
        }
      }
    } catch(e) {
      console.log(e)
    }
  },
  clearPasteDiv() { this.$refs.pasteDiv.firstChild.innerHTML = "" },

}
