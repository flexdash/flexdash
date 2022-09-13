// widget-grid-ops - Functions used in grids to add/remove/reorder widgets.
// Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file

export default {

  addWidget(kind) {
    const widget_ix = this.$store.addWidget(this.id, kind)
    this.edit_ix = widget_ix // start editing the new widget
  },

  // handle widget delete event coming up from widget-edit
  // Caution: does not deal with widget groups!
  deleteWidget(ix) {
    this.$store.deleteWidget(this.id, ix)
    this.edit_ix = null
  },

  // handle widget clone event coming up from widget-edit
  // Caution: does not deal with widget groups!
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

  // if widget is in a group, return ix of first widget in group, else return ix unchanged
  firstInGroup(widgets, ix) {
    const w_ix = this.$store.widgetByID(widgets[ix])
    if (! w_ix.group) return ix
    const group = w_ix.group
    while (ix > 0 && this.$store.widgetByID(widgets[ix-1]).group == group) ix--
    return ix
  },

  // return size of widget group, or 1 if non-grouped widget
  groupSize(widgets, ix) {
    if (widgets[ix].startsWith('x')) return 1 // non-existant/disabled widget
    const w_ix = this.$store.widgetByID(widgets[ix])
    if (! w_ix.group) return 1
    const first = this.firstInGroup(widgets, ix)
    const group = w_ix.group
    while (ix+1 < widgets.length &&
        !widgets[ix+1].startsWith('x') &&
        this.$store.widgetByID(widgets[ix+1]).group == group) {
      ix++
    }
    return ix - first + 1
  },

  // move a widget up/down (dir=-1/1)
  moveWidget(ix, dir) {
    const is_grid = this.id.startsWith('g') // vs. is panel
    const widgets = is_grid ? this.grid.widgets : this.widgets
    // if the widget is in a group, move the first widget of the group
    ix = this.firstInGroup(widgets, ix)
    // figure out distance to move and adjust dir
    const gs = this.groupSize(widgets, ix)
    if (dir < 0) {
      if (ix == 0) return
      dir = -this.groupSize(widgets, ix-1)
    } else {
      if (ix+gs >= widgets.length) return
      dir = this.groupSize(widgets, ix+gs)
    }
    console.log(`moveWidget: ix=${ix}, gs=${gs}, dir=${dir}`)
    // perform move
    let ww = [ ...widgets ] // clone
    let w = ww.splice(ix, gs) // remove widget/group
    ww.splice(ix+dir, 0, ...w) // insert widget/group
    if (is_grid) this.$store.updateGrid(this.id, { widgets: ww })
    else this.$store.updateWidgetProp(this.id, 'static', 'widgets', ww)
    this.edit_ix += dir
  },

  // move a widget up/down (dir=-1/1)
  moveWidgetOLD(ix, dir) {
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
