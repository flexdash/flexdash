import{n as t,w as i}from"./index.af32e0ef.js";import{h as e,k as s,a as o,f as n,t as l,i as a,d as r,j as d,B as c,l as p,_ as u,e as g,b as h,C as _,D as f,w as m,c as v,g as w,E as y,F as b,s as k,u as x,G as $,v as C,H as S,I as E}from"./vuetify.50e96a45.js";import{m as j}from"./md.138023a1.js";import"./vue.1457ee3a.js";const W={name:"WidgetWrap",props:{suppress_output:{type:Boolean,default:!0},color:{type:String,default:void 0},config:{type:Object,required:!0}},data:()=>({watchers:[],bindings:{},full_page:!1}),computed:{title(){return this.bindings.title||"--"},child_props(){const t=this.palette.widgets;return this.config.kind in t&&t[this.config.kind].props||{}},can_full_page(){const t=this.palette.widgets;return this.config.kind in t&&t[this.config.kind].full_page}},watch:{config:{immediate:!0,deep:!0,handler(t){this.genBindings(t)}}},inject:["$store","palette"],methods:{addDynBinding(t,e){const s=this;let o=e.split("/").filter((t=>t.length>0));if(0==o.length)return null;const n=o.pop(),l=i(this.$store.sd,o);n in l||s.$set(l,n,void 0);return this.$watch((()=>l[n]),(i=>{s.updateBindingValue(t,i)}),{deep:!0,immediate:!0})},removeWatchers(){this.watchers.forEach((t=>{t()})),this.watchers.length=0},genBindings(t){this.removeWatchers(),this.bindings={},t&&(Object.keys(t.static||{}).forEach((i=>{void 0!==t.static[i]&&this.$set(this.bindings,i,t.static[i])})),Object.keys(t.dynamic||{}).forEach((i=>{void 0!==t.dynamic[i]&&this.watchers.push(this.addDynBinding(i,t.dynamic[i]))})))},updateBindingValue(t,i){if(!(t in this.child_props))return void console.log(`Warning: updating value for ${t}, but ${this.config.kind} has no ${t}:`,JSON.stringify(this.child_props));let e=this.child_props[t].type;if(e===Boolean)"number"==typeof i?i=!!i:"string"==typeof i?(i=i.toLowerCase(),i=["true","ok","1","yes"].includes(i)):"boolean"!=typeof i&&(i=void 0);else if(e===Number)"string"==typeof i?i=parseFloat(i):"boolean"==typeof i?i=i?1:0:"number"!=typeof i&&(i=void 0),void 0!==i&&(i=Number.parseFloat(i.toPrecision(4)));else if(e===String)typeof i===Number?i=i.toString():typeof i!==String&&(i=JSON.stringify(i));else if((e===Array||e===Object)&&"string"==typeof i)try{i=JSON.parse(i)}catch(s){i=void 0,console.log(`Cannot convert string value for ${t} to ${e.name}`)}this.$set(this.bindings,t,i)},handleEdit(){console.log("handleEdit() in widget-wrap"),this.$emit("edit","toggle")},toggleFullPage(){this.full_page=!this.full_page},sendData(t){let i=this.config.output;!this.suppress_output&&i?(i.startsWith("$demo")||console.log(`Widget ${this.config.kind}[${this.config.id}] sending ${i} <-`,t),this.$root.serverSend(i,t)):console.log(`Output of widget ${this.config.kind}[${this.config.id}] suppressed`)}}},O={};var B=t(W,(function(){var t=this,i=t.$createElement,l=t._self._c||i;return l(e,{class:t.full_page?"full-page":void 0,staticStyle:{overflow:"hidden"},attrs:{color:t.color}},["title"in t.child_props?t.$root.editMode?l("div",{staticStyle:{position:"absolute","z-index":"5",right:"0",top:"0.5ex"}},[l(o,{staticClass:"justify-end align-start mt-n1",attrs:{small:"",icon:""},on:{click:t.handleEdit}},[l(n,{attrs:{small:""}},[t._v("mdi-pencil")])],1)],1):t._e():l(s,{staticClass:"d-flex pa-0 pt-1 mb-n1"},[t.title?l("span",{staticClass:"mx-auto"},[t._v(t._s(t.title))]):t._e(),t.$root.editMode?l(o,{staticClass:"justify-end align-start mt-n1",attrs:{small:"",icon:""},on:{click:t.handleEdit}},[l(n,{attrs:{small:""}},[t._v("mdi-pencil")])],1):t._e()],1),t.can_full_page&&!t.$root.editMode?l("div",{staticClass:"full-page-btn",staticStyle:{position:"absolute",right:"0",top:"0.5ex"}},[l(o,{staticClass:"justify-center align-center mt-n1",attrs:{small:"",icon:""},on:{click:t.toggleFullPage}},[l(n,{attrs:{small:""}},[t._v(t._s(t.full_page?"mdi-arrow-collapse":"mdi-arrow-expand"))])],1)],1):t._e(),l(t.config.kind,t._b({ref:"comp",tag:"component",on:{send:function(i){return t.sendData(i)}}},"component",t.bindings,!1))],1)}),[],!1,(function(t){for(let i in O)this[i]=O[i]}),"0d4eb3d7",null,null);B.options.__file="src/components/widget-wrap.vue";const M={name:"WidgetEdit",components:{WidgetWrap:B.exports,md:j},inject:["$store","palette"],props:{id:{type:String,required:!0},grid_id:{type:String,require:!0},edit_active:{type:Boolean,default:!1}},data:()=>({widget:{},prop_static:{},sd_keys:[],reposition:!0,edit_help:!1,suppress_output:!0,child_props:{},prop_info:{},dialog:!1,dialog_prop:null}),created(){console.log("Created widget",this.id);const t=this.$store.widgetByID(this.id);void 0===t.static&&(t.static={}),void 0===t.dynamic&&(t.dynamic={});let i={};const e=this.palette.widgets;t.kind in e&&(i=e[t.kind].props||{});const s={String:"mdi-format-quote-close",Number:"mdi-numeric",Boolean:"mdi-yin-yang",Array:"mdi-code-brackets",Object:"mdi-code-braces"};let o={};for(let n in i){let t=i[n].type||String;[String,Number,Boolean,Array,Object].includes(t)||(t=String);let e=i[n].tip||t.name;void 0!==i[n].default&&(e+=`, default: ${i[n].default}`);let l=s[t.name];o[n]={type:t,default:i[n].default,validator:i[n].validator,hint:e,icon:l,dynamic:i[n].dynamic}}for(const n in o)!o[n].dynamic||n in t.dynamic||n in t.static||(t.dynamic[n]=o[n].dynamic);if(t.kind in e&&e[t.kind].output){const i=e[t.kind].output;"string"==typeof i?("output"in t||(t.output=i),t.output_hint=null):("output"in t||(t.output=e[t.kind].output.default||null),t.output_hint=e[t.kind].output.tip||null)}this.widget=t,this.child_props=i,this.prop_info=o,this.edit_active&&this.propStatic()},computed:{edit_props(){return Object.keys(this.child_props).filter((t=>"title"!==t)).sort()},child_help(){const t=this.palette.widgets;if(this.widget.kind in t)return t[this.widget.kind].help},child_help_title(){return this.child_help?this.child_help.replace(/[.\n].*/s,""):null},child_help_text(){return this.child_help?this.child_help.replace(/^.*?[.\n]\s/s,""):null},widgetStyle(){return`${`grid-row-start: span ${this.widget.rows||1}`}; ${`grid-column-start: span ${this.widget.cols||1}`};`}},watch:{edit_active(t){t&&(this.propStatic(),this.sd_keys=Object.keys(this.$store.sd).sort())}},methods:{propStatic(){this.prop_static=Object.fromEntries(Object.keys(this.child_props).map((t=>[t,t in this.widget.dynamic?0:1])))},propVal(t){return void 0!==this.widget.static[t]?this.widget.static[t]:this.prop_info[t].default},toggleStatic(t,i){this.prop_static[t]=i,i&&(this.widget.dynamic[t]=void 0)},toggleEdit(){this.$emit("edit",!this.edit_active)},endEdit(){this.$emit("edit",!1)},handleEdit(t,i,e){if(console.log("edit:",t,i,e),t in this.widget){if("title"!=i){if(!(i in this.child_props))return;this.child_props[i].type===Number&&"string"==typeof e&&(e=Number.parseFloat(e))}this.$store.updateWidgetProp(this.id,t,i,e)}},handleEditOutput(t){console.log("edit: output:",t),this.$store.updateWidget(this.id,{output:t})},popupTextField(t){this.dialog?this.dialog=!1:(this.dialog_prop=t,this.dialog=!0)},adjustRows(t){const i=this.widget;i.rows=(i.rows||1)+t,i.rows<1&&(i.rows=1),i.rows>16&&(i.rows=16),this.reposition=!1,this.$nextTick((()=>{this.reposition=!0}))},adjustCols(t){const i=this.widget;i.cols=(i.cols||1)+t,i.cols<1&&(i.cols=1),i.cols>16&&(i.cols=16),this.reposition=!1,this.$nextTick((()=>{this.reposition=!0}))},moveWidget(t){this.$emit("move",t),this.reposition=!1,this.$nextTick((()=>{this.reposition=!0}))}}},N={};var D=t(M,(function(){var t=this,i=t.$createElement,b=t._self._c||i;return b("div",{staticClass:"widget-edit",style:t.widgetStyle},[b(l,{attrs:{value:t.edit_active&&t.reposition,"offset-y":"","allow-overflow":"","min-width":"80%","content-class":"popup-spacer","close-on-content-click":!1,"close-on-click":!1},scopedSlots:t._u([{key:"activator",fn:function(i){return[b("widget-wrap",{attrs:{config:t.widget,suppress_output:t.suppress_output&&t.edit_active,color:t.edit_active?"highlight":"","not-used":i},on:{edit:t.toggleEdit}})]}}])},[b(e,{attrs:{color:"panel"}},[b(a,{staticClass:"d-flex align-baseline pb-6"},[b("span",[t._v("Edit "+t._s(t.widget.kind)+" widget")]),b(r,{staticClass:"ml-3 mt-0 text-h6 flex-grow-0",attrs:{dense:"",value:t.widget.static.title,"hide-details":!0},on:{input:function(i){return t.handleEdit("static","title",i)}}}),b(d),b(o,{attrs:{elevation:"0",icon:""},on:{click:t.endEdit}},[b(n,[t._v("mdi-close")])],1)],1),t.child_help?b(s,{staticClass:"pb-0"},[t.child_help_title?b("h3",[t._v(t._s(t.child_help_title)+" "),t.child_help_text?b(o,{staticClass:"ml-1",attrs:{"x-small":"",text:"",value:t.edit_help},on:{click:function(i){t.edit_help=!t.edit_help}}},[t._v(" "+t._s(t.edit_help?"less...":"more..."))]):t._e()],1):t._e(),t.edit_help?b("md",[t._v(t._s(t.child_help_text))]):t._e()],1):t._e(),t.edit_active?b(s,[b(c,{staticClass:"pa-0",attrs:{fluid:""}},[b(p,{attrs:{align:"center"}},[b(u,{staticClass:"d-flex",attrs:{cols:"6",sm:"4"}},[b(o,{attrs:{small:""},on:{click:function(i){return t.$emit("delete")}}},[t._v("Delete widget")])],1),b(u,{staticClass:"d-flex",attrs:{cols:"6",sm:"2"}},[b(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(i){var e=i.on;return[b(o,t._g({staticClass:"ml-2",attrs:{small:"",icon:""},on:{click:function(i){return t.moveWidget(-1)}}},e),[b(n,[t._v("mdi-arrow-up-bold")])],1)]}}],null,!1,4110266859)},[b("span",[t._v("Move widget towards the top-left of the grid")])]),b(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(i){var e=i.on;return[b(o,t._g({attrs:{small:"",icon:""},on:{click:function(i){return t.moveWidget(1)}}},e),[b(n,[t._v("mdi-arrow-down-bold")])],1)]}}],null,!1,171324591)},[b("span",[t._v("Move widget towards the bottom-right of the grid")])])],1),b(u,{staticClass:"d-flex",attrs:{cols:"12",sm:"6",md:"4"}},[b(o,{staticClass:"ml-2",attrs:{small:"",icon:""},on:{click:function(i){return t.adjustRows(-1)}}},[b(n,[t._v("mdi-minus")])],1),b(h,{attrs:{small:""}},[t._v(t._s(t.widget.rows)+" row"+t._s(t.widget.rows>1?"s":""))]),b(o,{attrs:{small:"",icon:""},on:{click:function(i){return t.adjustRows(1)}}},[b(n,[t._v("mdi-plus")])],1),b(o,{staticClass:"ml-2",attrs:{small:"",icon:""},on:{click:function(i){return t.adjustCols(-1)}}},[b(n,[t._v("mdi-minus")])],1),b(h,{attrs:{small:""}},[t._v(t._s(t.widget.cols)+" col"+t._s(t.widget.cols>1?"s":""))]),b(o,{attrs:{small:"",icon:""},on:{click:function(i){return t.adjustCols(1)}}},[b(n,[t._v("mdi-plus")])],1)],1)],1),b(p,{attrs:{align:"center"}},t._l(t.edit_props,(function(i){return b(u,{key:i,staticClass:"d-flex",attrs:{cols:"12",sm:"6",md:"4"}},[b(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(e){var s=e.on,l=e.attrs;return[b(_,{staticClass:"mt-2 mr-1",attrs:{mandatory:"",dense:"",value:t.prop_static[i],"background-color":"rgba(0,0,0,0)",color:"primary"},on:{change:function(e){return t.toggleStatic(i,e)}}},[b(o,t._g(t._b({attrs:{"x-small":"",icon:""}},"v-btn",l,!1),s),[b(n,[t._v("mdi-link-variant")])],1),b(o,t._g(t._b({attrs:{"x-small":"",icon:""}},"v-btn",l,!1),s),[b(n,[t._v(t._s(t.prop_info[i].icon))])],1)],1)]}}],null,!0)},[b("span",[t._v("Toggle dynamic link vs. literal value")])]),t.prop_static[i]?t.prop_info[i].type===Number?b(r,{attrs:{label:i,type:"number",dense:"",hint:t.prop_info[i].hint,value:t.propVal(i)},on:{input:function(e){return t.handleEdit("static",i,e)}}}):t.prop_info[i].type===Boolean?b(m,{staticClass:"mt-0 ml-2",attrs:{label:i,hint:t.prop_info[i].hint,"input-value":t.propVal(i)},on:{change:function(e){return t.handleEdit("static",i,e)}}}):t.prop_info[i].type===Array?b(r,{attrs:{label:i,dense:"",value:t.widget.static[i]||t.prop_info[i].default},on:{input:function(e){return t.handleEdit("static",i,e)}}}):t.prop_info[i].type===Object?b(r,{attrs:{label:i,dense:"",hint:t.prop_info[i].hint,value:t.widget.static[i]||t.prop_info[i].default},on:{input:function(e){return t.handleEdit("static",i,e)}}}):b(r,{staticClass:"w-edit",attrs:{label:i,dense:"",hint:t.prop_info[i].hint,value:t.widget.static[i]||t.prop_info[i].default},on:{input:function(e){return t.handleEdit("static",i,e)}},scopedSlots:t._u([{key:"append-outer",fn:function(){return[b(o,{attrs:{icon:"","x-small":""},on:{click:function(e){return t.popupTextField(i)}}},[b(n,[t._v("mdi-arrow-expand-all")])],1)]},proxy:!0}],null,!0)}):b(f,{attrs:{label:i,clearable:"",dense:"","persistent-hint":"",hint:"topic (/-separated path)",items:t.sd_keys,value:t.widget.dynamic[i]},on:{input:function(e){return t.handleEdit("dynamic",i,e)}}})],1)})),1),"output"in t.widget?b(p,{attrs:{align:"center"}},[b(u,{staticClass:"d-flex",attrs:{cols:"12",sm:"6",md:"4"}},[b(f,{attrs:{label:"output binding",clearable:"",dense:"","persistent-hint":"",hint:"topic (/-separated path)",items:t.sd_keys,value:t.widget.output},on:{input:function(i){return t.handleEditOutput(i)}}})],1),b(u,{staticClass:"d-flex",attrs:{cols:"12",sm:"6",md:"4"}},[b(v,{attrs:{label:"suppress output while editing"},model:{value:t.suppress_output,callback:function(i){t.suppress_output=i},expression:"suppress_output"}})],1)],1):t._e()],1)],1):t._e(),b(w,{attrs:{"content-class":"height80 widget-edit-dialog","max-width":"100ex"},model:{value:t.dialog,callback:function(i){t.dialog=i},expression:"dialog"}},[t.dialog?b(e,{staticClass:"d-flex flex-column height100"},[b(a,{staticClass:"d-flex align-baseline"},[b("span",[t._v("Edit "),b("span",{staticStyle:{"font-weight":"700"}},[t._v(t._s(t.dialog_prop))])]),b(d),b(o,{attrs:{elevation:"0",icon:""},on:{click:function(i){t.dialog=!1}}},[b(n,[t._v("mdi-close")])],1)],1),b(s,{staticClass:"flex-grow-1"},[b(y,{staticClass:"height100",attrs:{dense:"","hide-details":"",filled:"",value:t.widget.static[t.dialog_prop]||t.prop_info[t.dialog_prop].default},on:{change:function(i){return t.handleEdit("static",t.dialog_prop,i)}}})],1)],1):t._e()],1)],1)],1)],1)}),[],!1,(function(t){for(let i in N)this[i]=N[i]}),null,null,null);D.options.__file="src/components/widget-edit.vue";var R=D.exports;const F={};var T=t({name:"FixedGrid",components:{WidgetEdit:R},inject:["$store","$config","palette"],props:{id:{type:String}},data:()=>({add_menu:null,edit_ix:null,rolledup:!1}),computed:{grid(){return this.$store.gridByID(this.id)},rollupMini(){return!this.$root.editMode&&!this.grid.title},rollupMaxi(){return!this.$root.editMode&&this.grid.title},rollerClasses(){return["d-flex","roller",this.grid.widgets.length>0&&!this.rolledup&&"roller__minimal"]},widgets(){return console.log("Palette:",this.palette.widgets),Object.fromEntries(Object.keys(this.palette.widgets).sort().map((t=>[t,(this.palette.widgets[t].help||"").replace(/^([^.\n]{0,80}).*/s,"$1")])))}},methods:{toggleEdit(t,i){this.edit_ix=i?t:null},addWidget(t){const i=this.$store.addWidget(this.id,t);this.edit_ix=i},deleteWidget(t){this.$store.deleteWidget(this.id,t),this.edit_ix=null},moveWidget(t,i){if(console.log(`Moving widget #${t} by ${i}`),!(t+i>=0&&t+i<this.grid.widgets.length))return;let e=[...this.grid.widgets],s=e[t];e[t]=e[t+i],e[t+i]=s,this.$store.updateGrid(this.id,{widgets:e}),this.edit_ix+=i},toggleRoll(){this.rolledup=!this.rolledup},changeTitle(t){this.$store.updateGrid(this.id,{title:t})}}},(function(){var t=this,i=t.$createElement,e=t._self._c||i;return e("div",{staticClass:"u-tooltip-attach"},[t.rollupMini?e("div",{class:t.rollerClasses},[e(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(i){var s=i.on;return[e(o,t._g({staticClass:"mx-auto",attrs:{"x-small":"",icon:"",height:"24px"},on:{click:t.toggleRoll}},s),[e(n,[t._v("mdi-arrow-"+t._s(t.rolledup?"down":"up")+"-drop-circle")])],1)]}}],null,!1,3656355880)},[e("span",[t._v("Roll widgets up/down")])])],1):t._e(),t.rollupMaxi?e(b,{staticClass:"d-flex justify-start",attrs:{dense:"",flat:"",height:"36",color:"background"}},[e(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(i){var s=i.on;return[e(o,t._g({staticClass:"mx-auto",attrs:{"x-small":"",icon:"",height:"24px"},on:{click:t.toggleRoll}},s),[e(n,[t._v("mdi-arrow-"+t._s(t.rolledup?"down":"up")+"-drop-circle")])],1)]}}],null,!1,3656355880)},[e("span",[t._v("Roll widgets up/down")])]),e(k,[t._v(t._s(t.grid.title))])],1):t._e(),t.$root.editMode?e(b,{staticClass:"editmode",attrs:{dense:"",flat:"",color:"background"}},[e(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(i){var s=i.on;return[e(o,t._g({staticClass:"mr-4",attrs:{small:"",icon:"",color:"grey"},on:{click:t.toggleRoll}},s),[e(n,[t._v("mdi-arrow-"+t._s(t.rolledup?"down":"up")+"-drop-circle")])],1)]}}],null,!1,527658409)},[e("span",[t._v("Roll widgets up/down")])]),e(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(i){var s=i.on;return[e(r,t._g({staticClass:"mr-6 flex-grow-0",staticStyle:{width:"20ex"},attrs:{"single-line":"",dense:"","hide-details":"",label:"title",value:t.grid.title},on:{change:t.changeTitle}},s))]}}],null,!1,529640478)},[e("span",[t._v("Title to show at top of grid, if empty the grid bar is thinner")])]),e("div",[e(l,{attrs:{"offset-y":""},scopedSlots:t._u([{key:"activator",fn:function(i){var s=i.on,l=i.attrs;return[e(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(i){var a=i.on;return[e(o,t._g(t._b({attrs:{small:"",icon:"",color:"primary"}},"v-btn",l,!1),Object.assign({},a,s)),[e(n,[t._v("mdi-card-plus")])],1)]}}],null,!0)},[e("span",[t._v("Add a widget to the end of the grid")])])]}}],null,!1,4148765622),model:{value:t.add_menu,callback:function(i){t.add_menu=i},expression:"add_menu"}},[e(x,[e($,[t._v("Add Widget to the end of the grid")]),t._l(t.widgets,(function(i,s){return e(C,{key:s,attrs:{link:""},on:{click:function(i){return t.addWidget(s)}}},[e(S,[t._v(t._s(s))]),i?e(E,[t._v(t._s(i))]):t._e()],1)}))],2)],1)],1),e(d),e(g,{attrs:{bottom:""},scopedSlots:t._u([{key:"activator",fn:function(i){var s=i.on;return[e(o,t._g({staticClass:"mc-auto",attrs:{small:""},on:{click:function(i){return t.$emit("delete")}}},s),[t._v(" Delete grid ")])]}}],null,!1,1535469378)},[e("span",[t._v("Delete this grid and all its widgets")])])],1):t._e(),t.rolledup?t._e():e(c,{staticClass:"g-grid-small pt-0",attrs:{fluid:""}},t._l(t.grid.widgets,(function(i,s){return e("widget-edit",{key:i,attrs:{id:i,grid_id:t.id,edit_active:s==t.edit_ix},on:{edit:function(i){return t.toggleEdit(s,i)},move:function(i){return t.moveWidget(s,i)},delete:function(i){return t.deleteWidget(s)}}})})),1)],1)}),[],!1,(function(t){for(let i in F)this[i]=F[i]}),"b21f114e",null,null);T.options.__file="src/grids/fixed-grid.vue";var A=T.exports;export default A;
