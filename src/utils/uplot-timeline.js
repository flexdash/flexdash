// Timeline "horizontal bars" for uPlot, adapted from view-source:https://leeoniya.github.io/uPlot/demos/timeline-discrete.html
// Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file

import uPlot from 'uplot'

//===== distribute bars evenly
function roundDec(val, dec) {
  return Math.round(val * (dec = 10**dec)) / dec;
}

const SPACE_BETWEEN = 1;
const SPACE_AROUND  = 2;
const SPACE_EVENLY  = 3;

const coord = (i, offs, iwid, gap) => roundDec(offs + i * (iwid + gap), 6);

function distr(numItems, sizeFactor, justify, onlyIdx, each) {
  let space = 1 - sizeFactor;

  let gap =  (
      justify == SPACE_BETWEEN ? space / (numItems - 1) :
      justify == SPACE_AROUND  ? space / (numItems    ) :
      justify == SPACE_EVENLY  ? space / (numItems + 1) : 0
  );

  if (isNaN(gap) || gap == Infinity)
      gap = 0;

  let offs = (
      justify == SPACE_BETWEEN ? 0       :
      justify == SPACE_AROUND  ? gap / 2 :
      justify == SPACE_EVENLY  ? gap     : 0
  );

  let iwid = sizeFactor / numItems;
  let _iwid = roundDec(iwid, 6);

  if (onlyIdx == null) {
      for (let i = 0; i < numItems; i++)
          each(i, coord(i, offs, iwid, gap), _iwid);
  }
  else
      each(onlyIdx, coord(onlyIdx, offs, iwid, gap), _iwid);
}

//===== QuadTree https://github.com/leeoniya/uPlot/blob/master/demos/lib/quadtree.js

function pointWithin(px, py, rlft, rtop, rrgt, rbtm) {
  return px >= rlft && px <= rrgt && py >= rtop && py <= rbtm;
}

const MAX_OBJECTS = 10;
const MAX_LEVELS  = 4;

class Quadtree {
  constructor (x, y, w, h, l) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.l = l || 0;
    this.o = [];
    this.q = null;
  }

  split() {
    let t = this,
      x = t.x,
      y = t.y,
      w = t.w / 2,
      h = t.h / 2,
      l = t.l + 1;

    t.q = [
      // top right
      new Quadtree(x + w, y,     w, h, l),
      // top left
      new Quadtree(x,     y,     w, h, l),
      // bottom left
      new Quadtree(x,     y + h, w, h, l),
      // bottom right
      new Quadtree(x + w, y + h, w, h, l),
    ];
  }

  // invokes callback with index of each overlapping quad
  quads(x, y, w, h, cb) {
    let t            = this,
      q            = t.q,
      hzMid        = t.x + t.w / 2,
      vtMid        = t.y + t.h / 2,
      startIsNorth = y     < vtMid,
      startIsWest  = x     < hzMid,
      endIsEast    = x + w > hzMid,
      endIsSouth   = y + h > vtMid;

    // top-right quad
    startIsNorth && endIsEast && cb(q[0]);
    // top-left quad
    startIsWest && startIsNorth && cb(q[1]);
    // bottom-left quad
    startIsWest && endIsSouth && cb(q[2]);
    // bottom-right quad
    endIsEast && endIsSouth && cb(q[3]);
  }

  add(o) {
    let t = this;

    if (t.q != null) {
      t.quads(o.x, o.y, o.w, o.h, q => {
        q.add(o);
      });
    }
    else {
      let os = t.o;

      os.push(o);

      if (os.length > MAX_OBJECTS && t.l < MAX_LEVELS) {
        t.split();

        for (let i = 0; i < os.length; i++) {
          let oi = os[i];

          t.quads(oi.x, oi.y, oi.w, oi.h, q => {
            q.add(oi);
          });
        }

        t.o.length = 0;
      }
    }
  }

  get(x, y, w, h, cb) {
    let t = this;
    let os = t.o;

    for (let i = 0; i < os.length; i++)
      cb(os[i]);

    if (t.q != null) {
      t.quads(x, y, w, h, q => {
        q.get(x, y, w, h, cb);
      });
    }
  }

  clear() {
    this.o.length = 0;
    this.q = null;
  }
};

//===== Timeline plugin

export default function (opts) {

  const { round, min, max, ceil } = Math;

  // function incrRound(num, incr) {
  //   return round(num / incr) * incr;
  // }

  const { mode, count, fill, stroke } = opts;

  const pxRatio = devicePixelRatio;

  const laneWidth = 0.9;
  const laneDistr = SPACE_BETWEEN;

  const font = round(14 * pxRatio) + "px Arial";

  function walk(yIdx, count, dim, draw) {
    distr(count, laneWidth, laneDistr, yIdx, (i, offPct, dimPct) => {
      let laneOffPx = dim * offPct;
      let laneWidPx = dim * dimPct;

      draw(i, laneOffPx, laneWidPx);
    });
  }

  const size = opts.size ?? [0.6, Infinity];
  const align = opts.align ?? 0;

  const gapFactor = 1 - size[0];
  const maxWidth = (size[1] ?? inf) * pxRatio;

  const fillPaths = new Map();
  const strokePaths = new Map();

  function drawBoxes(ctx) {
    fillPaths.forEach((fillPath, fillStyle) => {
      ctx.fillStyle = fillStyle;
      ctx.fill(fillPath);
    });

    strokePaths.forEach((strokePath, strokeStyle) => {
      ctx.strokeStyle = strokeStyle;
      ctx.stroke(strokePath);
    });

    fillPaths.clear();
    strokePaths.clear();
  }

  function putBox(ctx, rect, xOff, yOff, lft, top, wid, hgt, strokeWidth, iy, ix, value) {
    let fillStyle = fill(iy + 1, ix, value);
    let fillPath = fillPaths.get(fillStyle);

    if (fillPath == null)
      fillPaths.set(fillStyle, fillPath = new Path2D());

    rect(fillPath, lft, top, wid, hgt);

    if (strokeWidth) {
      let strokeStyle = stroke(iy + 1, ix, value);
      let strokePath = strokePaths.get(strokeStyle);

      if (strokePath == null)
        strokePaths.set(strokeStyle, strokePath = new Path2D());

      rect(strokePath, lft + strokeWidth / 2, top + strokeWidth / 2, wid - strokeWidth, hgt - strokeWidth);
    }

    qt.add({
      x: round(lft - xOff),
      y: round(top - yOff),
      w: wid,
      h: hgt,
      sidx: iy + 1,
      didx: ix
    });
  }

  function drawPaths(u, sidx, idx0, idx1) {
    uPlot.orient(u, sidx, (series, dataX, dataY, scaleX, scaleY, valToPosX, valToPosY, xOff, yOff, xDim, yDim, moveTo, lineTo, rect) => {
      let strokeWidth = round((series.width || 0) * pxRatio);

      u.ctx.save();
      rect(u.ctx, u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
      u.ctx.clip();

      walk(sidx - 1, count, yDim, (iy, y0, hgt) => {
        // draw spans
        if (mode == 1) {
          for (let ix = 0; ix < dataY.length; ix++) {
            if (dataY[ix] != null) {
              let lft = round(valToPosX(dataX[ix], scaleX, xDim, xOff));

              let nextIx = ix;
              while (dataY[++nextIx] === undefined && nextIx < dataY.length) { }

              // to now (not to end of chart)
              let rgt = nextIx == dataY.length ? xOff + xDim + strokeWidth : round(valToPosX(dataX[nextIx], scaleX, xDim, xOff));

              putBox(
                u.ctx,
                rect,
                xOff,
                yOff,
                lft,
                round(yOff + y0),
                rgt - lft,
                round(hgt),
                strokeWidth,
                iy,
                ix,
                dataY[ix]
              );

              ix = nextIx - 1;
            }
          }
        }
        // draw matrix
        else {
          let colWid = valToPosX(dataX[1], scaleX, xDim, xOff) - valToPosX(dataX[0], scaleX, xDim, xOff);
          let gapWid = colWid * gapFactor;
          let barWid = round(min(maxWidth, colWid - gapWid) - strokeWidth);
          let xShift = align == 1 ? 0 : align == -1 ? barWid : barWid / 2;

          for (let ix = idx0; ix <= idx1; ix++) {
            if (dataY[ix] != null) {
              // TODO: all xPos can be pre-computed once for all series in aligned set
              let lft = valToPosX(dataX[ix], scaleX, xDim, xOff);

              putBox(
                u.ctx,
                rect,
                xOff,
                yOff,
                round(lft - xShift),
                round(yOff + y0),
                barWid,
                round(hgt),
                strokeWidth,
                iy,
                ix,
                dataY[ix]
              );
            }
          }
        }
      });

      u.ctx.lineWidth = strokeWidth;
      drawBoxes(u.ctx);

      u.ctx.restore();
    });

    return null;
  }

  function drawPoints(u, sidx, i0, i1) {
    u.ctx.save();
    u.ctx.rect(u.bbox.left, u.bbox.top, u.bbox.width, u.bbox.height);
    u.ctx.clip();

    u.ctx.font = font;
    u.ctx.fillStyle = "black";
    u.ctx.textAlign = mode == 1 ? "left" : "center";
    u.ctx.textBaseline = "middle";

    uPlot.orient(u, sidx, (series, dataX, dataY, scaleX, scaleY, valToPosX, valToPosY, xOff, yOff, xDim, yDim, moveTo, lineTo, rect) => {
      let strokeWidth = round((series.width || 0) * pxRatio);
      let textOffset = mode == 1 ? strokeWidth + 2 : 0;

      let y = round(yOff + yMids[sidx - 1]);

      for (let ix = 0; ix < dataY.length; ix++) {
        if (dataY[ix] != null) {
          let x = valToPosX(dataX[ix], scaleX, xDim, xOff) + textOffset;
          u.ctx.fillText(dataY[ix], x, y);
        }
      }
    });

    u.ctx.restore();

    return false;
  }

  let qt;
  let hovered = Array(count).fill(null);

  let yMids = Array(count).fill(0);
  let ySplits = Array(count).fill(0);

  let fmtDate = uPlot.fmtDate('{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}');
  let legendTimeValueEl = null;

  return {
    hooks: {
      init: u => {
        legendTimeValueEl = u.root.querySelector('.u-series:first-child .u-value');
      },
      drawClear: u => {
        qt = qt || new Quadtree(0, 0, u.bbox.width, u.bbox.height);

        qt.clear();

        // force-clear the path cache to cause drawBars() to rebuild new quadtree
        u.series.forEach(s => {
          s._paths = null;
        });
      },
      setCursor: u => {
        if (mode == 1) {
          let val = u.posToVal(u.cursor.left, 'x');
          // FIXME: should draw this in the left vertical axis
          //legendTimeValueEl.textContent = u.scales.x.time ? fmtDate(new Date(val * 1e3)) : val.toFixed(2);
        }
      },
    },
    opts: (u, opts) => {
      uPlot.assign(opts, {
        cursor: {
          //	x: false,
          y: false,
          points: { show: false },
          dataIdx: (u, seriesIdx, closestIdx, xValue) => {
            if (seriesIdx == 0)
              return closestIdx;

            let cx = round(u.cursor.left * pxRatio);

            if (cx >= 0) {
              let cy = yMids[seriesIdx - 1];

              hovered[seriesIdx - 1] = null;

              qt.get(cx, cy, 1, 1, o => {
                if (pointWithin(cx, cy, o.x, o.y, o.x + o.w, o.y + o.h))
                  hovered[seriesIdx - 1] = o;
              });
            }

            return hovered[seriesIdx - 1]?.didx;
          },
          points: {
            fill: "rgba(0,0,0,0.3)",
            bbox: (u, seriesIdx) => {
              let hRect = hovered[seriesIdx - 1];

              return {
                left: hRect ? round(hRect.x / devicePixelRatio) : -10,
                top: hRect ? round(hRect.y / devicePixelRatio) : -10,
                width: hRect ? round(hRect.w / devicePixelRatio) : 0,
                height: hRect ? round(hRect.h / devicePixelRatio) : 0,
              };
            }
          }
        },
        scales: {
          x: {
            range(u, min, max) {
              if (mode == 2) {
                let colWid = u.data[0][1] - u.data[0][0];
                let scalePad = colWid / 2;

                if (min <= u.data[0][0])
                  min = u.data[0][0] - scalePad;

                let lastIdx = u.data[0].length - 1;

                if (max >= u.data[0][lastIdx])
                  max = u.data[0][lastIdx] + scalePad;
              }

              return [min, max];
            }
          },
          y: {
            range: [0, 1],
          }
        }
      });

      uPlot.assign(opts.axes[0], {
        splits: mode == 2 ? (u, axisIdx, scaleMin, scaleMax, foundIncr, foundSpace) => {
          let splits = [];

          let dataIncr = u.data[0][1] - u.data[0][0];
          let skipFactor = ceil(foundIncr / dataIncr);

          for (let i = 0; i < u.data[0].length; i += skipFactor) {
            let v = u.data[0][i];

            if (v >= scaleMin && v <= scaleMax)
              splits.push(v);
          }

          return splits;
        } : null,
        grid: {
          show: mode != 2
        }
      });

      uPlot.assign(opts.axes[1], {
        splits: (u, axisIdx) => {
          walk(null, count, u.bbox.height, (iy, y0, hgt) => {
            // vertical midpoints of each series' timeline (stored relative to .u-over)
            yMids[iy] = round(y0 + hgt / 2);
            ySplits[iy] = u.posToVal(yMids[iy] / pxRatio, "y");
          });

          return ySplits;
        },
        values: () => Array(count).fill(null).map((v, i) => u.series[i + 1].label),
        gap: 5,
        //size: 70,
        grid: { show: false },
        ticks: { show: false },

        side: 3,
      });

      opts.series.forEach((s, i) => {
        if (i > 0) {
          s.paths = drawPaths
          if (!('points' in s) || s.points.show) s.points = { show: drawPoints }
          // uPlot.assign(s, {
          //   //	width: 0,
          //   //	pxAlign: false,
          //   //	stroke: "rgba(255,0,0,0.5)",
          //   paths: drawPaths,
          //   points: {
          //     //show: drawPoints
          //   }
          // });
        }
      });
    }
  };
}
