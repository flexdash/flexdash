<template>
      <svg class="gauge" :view-box.camel="vbox" :preserve-aspect-ratio.camel=ar>
        <circle class="gauge-base" cx=0 cy=0 fill="transparent"
                :r=stroke_radius :stroke=base_color :stroke-width=stroke_width
                :transform=xform :stroke-dasharray=stroke_bdash
        />
        <circle class="gauge-stroke" cx=0 cy=0 fill="transparent"
                :r=stroke_radius :stroke=color :stroke-width=stroke_width
                :transform=xform :stroke-dasharray=stroke_sdash
        />
        <line class="gauge-needle" :x1="needle_start" :y1=0 :x2=100 :y2=0 :stroke="needle_color"
              stroke-width=2 :transform="nform"
        />
      </svg>
</template>

<script scoped>
  module.exports = {
    props: {
      min: { type: Number, default: 0 }, // minimum value
      max: { type: Number, default: 100 }, // maximum value
      value: { type: Number, default: 30 }, // current value to show
      color: { type: String, default: '#00b500' },  // color of filled segment
      base_color: { type: String, default: 'lightgrey' },  // color of unfilled segment
      needle_color: { type: String, default: 'white' },  // color of needle
      radius: { type: Number, default: 70 },  // inner radius, outer being 100
      arc: { type: Number, default: 270 }, // number of degrees total for the ghauge arc
      stretch: { type: Boolean, default: false },  // false: 2:1 aspect ratio, true: stretch
    },

    computed: {
      frac: function() {
        let frac = (this.value-this.min) / (this.max-this.min);
        return Math.min(1, Math.max(0, frac));
      },
      stroke_width : function() { return 100 - this.radius },
      stroke_radius: function() { return 100 - this.stroke_width/2 },
      needle_start: function() { return 100 - 1.25 * this.stroke_width },
      circumference: function() { return this.stroke_radius * 2 * Math.PI },
      stroke_bdash: function() {
        arc_length = this.arc * this.circumference / 360;
        return `${arc_length} ${this.circumference}`;
      },
      stroke_sdash: function() {
        arc_length = this.arc * this.frac * this.circumference / 360;
        return `${arc_length} ${this.circumference}`;
      },
      xform : function() { return `rotate(${270 - this.arc/2}, 0, 0)`; },
      nform : function() { return `rotate(${270 - this.arc/2 + this.arc*this.frac}, 0, 0)`; },
      ar: function() { return this.stretch ? 'none' : 'xMidYMid' },
      vbox: function() {
        let r = this.arc >= 180 ? 100 : this.needle_start;
        let a = (this.arc-180)/2*Math.PI/180;
        let ysz = 100 + r * Math.sin(a);
        let xsz = this.arc >= 180 ? 200 : 200 * Math.cos(a);
        return `-${xsz/2} -100 ${xsz} ${ysz}`;
      },
    },
  }
</script>

<style scoped>
  div.gauge { padding: 0.5ex; height: 100%; width: 100%; }
  svg.gauge { width:100%; height: 100%; }
</script>
