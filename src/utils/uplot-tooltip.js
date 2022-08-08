// Tooltip for uPlot, adapted from https://github.com/leeoniya/uPlot/blob/master/demos/tooltips.html
// Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file

export default function (uplot) {

  let left_off = 0, top_off = 0 // offset of u-over WRT .u-tooltip-attach
  let attach = null // element to which we attach the tooltip

  // problem: uplot calls init before the DOM elements are rendered with the result that
  // offsetParent, offsetLeft, etc are null, so that doesn't help us...
  function _init(u) { // , opts, data) {
    // find parent to attach tooltip
    // we attach to an element with class u-tooltip-attach, which is typically the window content,
    // so tooltips don't get cropped by the border of the plot/widget
    let over = u.over
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
      //console.log(over)
    }
    attach = over
    //console.log(`left_off=${left_off} top_off=${top_off}`)

    // create a DOM element in the uPLot overlay to show the cursor tooltip
    let ttc = u.cursortt = document.createElement("div");
    ttc.className = "u-tooltip";
    ttc.innerHTML = "(x,y)";
    ttc.style.pointerEvents = "none";
    //ttc.style.position = "absolute";
    //ttc.style.background = "rgba(0,0,255,0.1)";
    over.appendChild(ttc);

    function hideTips() { ttc.style.display = "none" }
    function showTips() { ttc.style.display = null }

    u.over.addEventListener("mouseleave", ()=> { if (!u.cursor._lock) hideTips() })
    u.over.addEventListener("mouseenter", ()=> showTips() );

    showTips() // hideTips();
  }

  function setCursor(u) {
    if (attach === null) _init(u)
    const {left, top, idx} = u.cursor
    
    if (idx === null) {
      u.cursortt.innerHTML = ""
      return
    }
    
    const cw = u.over.clientWidth
    const aw = attach.offsetParent.clientWidth
    console.log(`SC: left=${left} left_off=${left_off} cw=${cw} aw=${aw}`)
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
        const yVal = u.data[i][idx]
        const yTxt = yVal != null ? s.value(u, yVal) : "?"
        if (i==0) html += `<tr><th colspan="2">${yTxt}</th></tr>`
        else      html += '<tr><td><div class="u-marker" style="border-color: ' + s._stroke +
                          `"></div>${s.label}</td><td>${yTxt}</td></tr>`
      }
    })
    u.cursortt.innerHTML = html + "</table>"
  }

  function setSize(u) {
    attach = null // force recalculation of left_off/top_off
  }


  return {
    hooks: {
      //init,
      setCursor,
      setSize,
      //setScale: [ (u, key) => { console.log('setScale', key); } ],
      //setSeries: [ (u, idx) => { console.log('setSeries', idx); } ],
    },
  }
}
