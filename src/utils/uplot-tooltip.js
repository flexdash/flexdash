// Tooltip for uPlot, adapted from https://github.com/leeoniya/uPlot/blob/master/demos/tooltips.html
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

export default function (opts) {

  let left_off = 0, top_off = 0 // offset of u-over WRT .u-tooltip-attach
  let attach = null // element to which we attach the tooltip

  // initialize tooltip, cannot use init callback 'cause uPlot calls it before the DOM elements
  // are rendered with the result that offsetParent, offsetLeft, etc are null, so that doesn't help us...
  function ready(u) {
    if (attach != null) console.log("uplot-tooltip bug? Tooltip already initialized")
    // find parent to attach tooltip
    // we attach to an element with class u-tooltip-attach, which is typically the window content,
    // so tooltips don't get cropped by the border of the plot/widget
    let over = u.over
    if (!over) {
      console.log(`uplot-tooltip bug? u.over is undefined`)
      return // odd conditions where uPlot is initialized but DOM not shown??
    }
    attach = over
    //console.log(over)

    let lastParent = null
    left_off = top_off = 0
    while (!over.classList.contains("u-tooltip-attach") && over.tagName != "BODY") {
      //console.log(`${over.classList} ${over.offsetLeft} ${over.offsetTop}`)
      if (over.offsetParent != lastParent) {
        left_off += over.offsetLeft
        top_off += over.offsetTop
        lastParent = over.offsetParent
      }
      over = over.parentElement
      if (!over) {
        console.log(`uplot-tooltip: u.over is not in DOM?`)
        attach = null // this way ready() gets called again later
        return
      }
    }
    attach = over
    //console.log(`left_off=${left_off} top_off=${top_off}`)

    // create a DOM element in the uPLot overlay to show the cursor tooltip
    let ttc = u.cursortt = document.createElement("div")
    let cls = "u-tooltip"
    if (opts?.class) cls += " " + opts.class
    ttc.className = cls
    ttc.style.pointerEvents = "none"
    //ttc.style.position = "absolute";
    //ttc.style.background = "rgba(0,0,255,0.1)";
    over.appendChild(ttc)

    function hideTips() { ttc.style.display = "none" }
    function showTips() { ttc.style.display = null }

    u.over.addEventListener("mouseleave", ()=> { if (!u.cursor._lock) hideTips() })
    u.over.addEventListener("mouseenter", ()=> showTips() )

    showTips() // hideTips();
  }

  function setCursor(u) {
    if (attach === null) ready(u) // needed after setSize...
    const {left, top, idx} = u.cursor
    
    if (idx === null) {
      u.cursortt.innerHTML = ""
      return
    }
    
    const cw = u.over.clientWidth
    const aw = attach.offsetParent.clientWidth
    //console.log(`SC: left=${left} left_off=${left_off} cw=${cw} aw=${aw}`)
    if (left < cw/2) {
      u.cursortt.style.left = (left_off + left+20) + "px"
      u.cursortt.style.right = "auto"
    } else {
      u.cursortt.style.right = (aw - left_off - left + 20) + "px"
      u.cursortt.style.left = "auto"
    }

    const ch = u.over.clientHeight
    //if (top < ch/2) {
      u.cursortt.style.top = top_off + (top+10) + "px"
      u.cursortt.style.bottom = "auto"
    //} else {
      //u.cursortt.style.bottom = top_off + (ch-top+10) + "px"
      //u.cursortt.style.top = "auto"
    //}

    // use the legend's formatter to format each series (incl. time)
    let html = "<table>"
    u.series.forEach((s, i) => {
      if (s.show) {
        //const yVal = u.data[i][idx] // this fails for removed duplicate values (timeline plot)
        const yVal = u.data[i][u.legend.idxs[i]]
        const yTxt = yVal != null ? s.value(u, yVal, i, idx) : "?"
        if (i==0) html += `<tr><th colspan="2">${yTxt}</th></tr>`
        else      html += '<tr><td><div class="u-marker" style="border-color: ' + s._stroke +
                          `"></div>${s.label}</td><td>${yTxt}</td></tr>`
      }
    })
    u.cursortt.innerHTML = html + "</table>"
  }

  function setSize(u) {
    if (attach && u.cursortt) attach.removeChild(u.cursortt)
    attach = null // force recalculation of left_off/top_off
  }

  function destroy(u) {
    if (attach && u.cursortt) attach.removeChild(u.cursortt)
    u.cursortt = null
  }

  return {
    hooks: {
      //init,
      ready,
      setCursor,
      setSize,
      destroy,
      // draw: (u)=>console.log("uPlot draw", u.cursor.left),
      // syncRect: ()=>console.log("uPlot syncRect"),
      //setScale: [ (u, key) => { console.log('setScale', key); } ],
      //setSeries: [ (u, idx) => { console.log('setSeries', idx); } ],
    },
  }
}
