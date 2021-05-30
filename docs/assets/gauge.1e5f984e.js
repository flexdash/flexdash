import{n as t}from"./index.af32e0ef.js";import{k as e}from"./vuetify.50e96a45.js";import"./vue.1457ee3a.js";const r={name:"SvgGauge",props:{min:{type:Number,default:0},max:{type:Number,default:100},value:{type:Number,default:30},color:{type:String,default:"--v-purple-base"},base_color:{type:String,default:"lightgrey"},needle_color:{type:String,default:"white"},radius:{type:Number,default:70},arc:{type:Number,default:270},stretch:{type:Boolean,default:!1}},computed:{frac(){let t=(this.value-this.min)/(this.max-this.min);return Math.min(1,Math.max(0,t))},stroke_width(){return 100-this.radius},stroke_radius(){return 100-this.stroke_width/2},needle_start(){return 100-1.25*this.stroke_width},circumference(){return 2*this.stroke_radius*Math.PI},stroke_bdash(){return`${this.arc*this.circumference/360} ${this.circumference}`},stroke_sdash(){return`${this.arc*this.frac*this.circumference/360} ${this.circumference}`},xform(){return`rotate(${270-this.arc/2}, 0, 0)`},nform(){return`rotate(${270-this.arc/2+this.arc*this.frac}, 0, 0)`},ar(){return this.stretch?"none":"xMidYMid"},vbox(){let t=this.arc>=180?100:this.needle_start,e=(this.arc-180)/2*Math.PI/180,r=100+t*Math.sin(e),a=this.arc>=180?200:200*Math.cos(e);return`-${a/2} -100 ${a} ${r}`}}},a={};var s=t(r,(function(){var t=this,e=t.$createElement,r=t._self._c||e;return r("svg",{staticClass:"gauge",attrs:{viewBox:t.vbox,preserveAspectRatio:t.ar}},[r("circle",{staticClass:"gauge-base",attrs:{cx:"0",cy:"0",fill:"transparent",r:t.stroke_radius,stroke:t.base_color,"stroke-width":t.stroke_width,transform:t.xform,"stroke-dasharray":t.stroke_bdash}}),r("circle",{staticClass:"gauge-stroke",attrs:{cx:"0",cy:"0",fill:"transparent",r:t.stroke_radius,stroke:t.color,"stroke-width":t.stroke_width,transform:t.xform,"stroke-dasharray":t.stroke_sdash}}),r("line",{staticClass:"gauge-needle",attrs:{x1:t.needle_start,y1:0,x2:100,y2:0,stroke:t.needle_color,"stroke-width":"2",transform:t.nform}})])}),[],!1,(function(t){for(let e in a)this[e]=a[e]}),null,null,null);s.options.__file="src/components/svg-gauge.vue";const i={name:"Gauge",help:"Simple SVG gauge.",components:{SvgGauge:s.exports},props:{value:{type:Number,default:null,dynamic:"$demo_random"},unit:{type:String,default:"",tip:"superscript after the value"},title:{type:String,default:"Gauge"},arc:{type:Number,default:90,tip:"degrees spanned by the arc of the gauge",validator:t=>t>10&&t<=360},center:{type:Boolean,default:!1,tip:"center the text in the gauge, else bottom"},min:{type:Number,default:0,tip:"minimum value"},max:{type:Number,default:100,tip:"maximum value"},color:{type:String,default:"green",tip:"color of filled segment"},base_color:{type:String,default:"lightgrey",tip:"color of unfilled segment"},needle_color:{type:String,default:"white",tip:"color of needle"},radius:{type:Number,default:70,tip:"inner radius, outer being 100"},stretch:{type:Boolean,default:!1,tip:"false: 2:1 aspect ratio, true: stretch"}},computed:{txt_valign(){return(null!==this.center?this.center:!(this.arc<200))?"my-auto":"mt-auto"},gauge_valign(){return this.arc<180?"height:auto;":""},unitTxt(){return"--"===this.value?"":this.unit},valTxt(){return"number"==typeof this.value?Math.round(10*this.value)/10:null===this.value?"--":this.value}}},u={};var l=t(i,(function(){var t=this,r=t.$createElement,a=t._self._c||r;return a("div",{staticClass:"gauge-card d-flex"},[a("svg-gauge",t._b({style:t.gauge_valign,attrs:{value:t.value}},"svg-gauge",t.$props,!1)),a("div",{staticClass:"gauge-card--label d-flex flex-column mx-auto",class:t.txt_valign},[a(e,{staticClass:"gauge-value d-flex pa-0 width100"},[a("span",{staticClass:"mx-auto"},[t._v(t._s(t.valTxt)),a("span",{staticClass:"unit"},[t._v(t._s(t.unitTxt))])])]),t.title?a(e,{staticClass:"gauge-title d-flex pa-0"},[a("span",{staticClass:"mx-auto"},[t._v(t._s(t.title))])]):t._e()],1)],1)}),[],!1,(function(t){for(let e in u)this[e]=u[e]}),"6fd619c3",null,null);l.options.__file="src/widgets/gauge.vue";var n=l.exports;export default n;
