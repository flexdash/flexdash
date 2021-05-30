import{n as e,r as t}from"./index.af32e0ef.js";import{k as i}from"./vuetify.50e96a45.js";import"./vue.1457ee3a.js";const a={};var o=e({name:"RandomValue",help:"Produce and display a random value for demo purposes.\nThe RandomValue widget sends a pseudo-random value into a store topic primarily for demo purposes.\nThe random values follow a trend so the values don't jump around like crazy.\nOriginally from https://stackoverflow.com/a/22080644.",props:{min:{type:Number,default:0,tip:"Minimum value produced by random walk"},max:{type:Number,default:100,tip:"Maximum value produced by random walk"},seconds:{type:Number,default:5,tip:"Interval at which values are produced in seconds"},round:{type:Number,default:.1,tip:"Rounding of values produced, 0.1 -> one decimal"}},output:{default:"$demo_1",tip:"Random value output"},data:()=>({clr_timer:null,val:"",ticker:""}),computed:{stepper(){return console.log("producing new stepper"),t(this.min,this.max,this.round)}},watch:{val(){if(0==this.val.length)return;const e=this.val.charAt(0),t=this.val.substr(1);this.ticker+=e,window.setTimeout((()=>{this.val=t}),100*this.seconds)}},mounted(){const e=()=>{const t=this.stepper();this.val=` ${t}`,this.$emit("send",t),this.clr_timer=window.setTimeout(e,1e3*this.seconds)};e()},beforeDestroy(){this.clr_timer&&(window.clearTimeout(this.clr_timer),this.clr_timer=null)}},(function(){var e=this,t=e.$createElement,a=e._self._c||t;return a(i,{staticClass:"pa-0 width100 d-flex justify-end align-center height100",staticStyle:{overflow:"hidden"}},[a("div",{staticClass:"ticker"},[e._v(e._s(e.ticker))])])}),[],!1,(function(e){for(let t in a)this[t]=a[t]}),"be641bc8",null,null);o.options.__file="src/widgets/random-value.vue";var r=o.exports;export default r;
