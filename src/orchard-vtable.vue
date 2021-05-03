<template>
  <v-dialog v-model="dialog" max-width="600px">
    <!-- Normal stuff to show: the valve table -->
    <template v-slot:activator="{ on, attrs }">
      <v-simple-table dense>
        <template v-slot:default>
          <thead><tr>
            <th class="text-left">circuit</th>
            <th class="text-right">every</th>
            <th class="text-right">src</th>
            <th class="text-right">for</th>
            <th class="text-center">last</th>
            <th class="text-center">next</th>
            <th class="text-center"></th>
          </tr></thead>
          <tbody><tr v-for="(v, vnum) in valves_disp">
            <td class="text-left">{{ v.num }}. {{ names[vnum] }}</td>
            <td class="text-right">{{ v.intDays }}d</td>
            <td class="text-right">{{ v.srcName }}</td>
            <td class="text-right">{{ v.durMin }}m</td>
            <td class="text-center">{{ v.last.dow() }} {{ v.last.dom() }}</td>
            <td class="text-center">{{ v.next }}</td>
            <td class="text-center"><v-btn small
              @click="start_edit(vnum, on.click, $event)" v-bind="attrs">edit</v-btn></td>
          </tr></tbody>
        </template>
      </v-simple-table>
    </template>
    <!-- Dialog box to show: editing a valve -->
    <v-card>
      <v-card-title>
        <span class="headline">Edit valve {{edit_vnum+1}}: {{names[edit_vnum]}}</span>
        <v-spacer></v-spacer>
        <v-switch class="mr-6" label="enabled" v-model="set_enabled"></v-switch>
      </v-card-title>
      <v-card-text>
        <v-container class="text-body-1 text--primary font-weight-regular">
          <!-- set interval -->
          <edit-plus-minus :range="[1,2,3,4,5,6,7,8,9,10,14]" v-bind:value.sync="set_interval"
              unit="days">Interval:</edit-plus-minus>
          <!-- set duration -->
          <edit-plus-minus :range="[5,30,60,90,120,240]" v-bind:value.sync="set_duration"
              unit="minutes">Duration:</edit-plus-minus>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="dialog=false">Cancel</v-btn>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="save_edit()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script scoped>
  module.exports = {
    components: {
      'edit-plus-minus': httpVueLoader('edit-plus-minus.vue'),
    },

    props: {
      names: { type: Array },
      valves: { default: function() { return []; } },
      done_today: { default: false },
      sched_valve: { default: null },
    },

    data: function() { return {
      // variables used for edit pop-up dialog
      dialog: null, // true while pop-up is active, set to false to close it
      set_enabled: null,   // enable switch within dialog
      set_interval: null,  // value adjusted within dialog
      set_duration: null,  // value adjusted within dialog
      edit_vnum: "?",  // valve number being edited
    }},

    computed: {
      valves_disp: function() {
        console.log("valves_disp:", this.valves);
        return this.valves.map((v,i) => {
          v.num = i+1;
          v.intDays = Math.round(v.int/24/3600); // seconds -> days interval
          v.srcName = v.src ? "grey" : "well";
          v.durMin = Math.round(v.dur/60); // seconds -> minutes
          v.last = new Date(v.last_at*1000); // unix time -> JS Date

          // figure out when the valve waters next
          let nxt = v.last_at + v.int;
          let eod = new Date();
          eod.setHours(23, 59, 59);
          eod = eod.valueOf() / 1000;
          if (!v.en) {
            v.next = "OFF";
          } else if (nxt < eod) {
            v.next = this.done_today || this.sched_valve > i ? "tomorrow" : "today";
          } else {
            nxt = new Date(nxt*1000);
            v.next = nxt.dow() + " " + nxt.dom();
          }

          return v;
        });
      },
    },

    methods: {
      // handler for clicking an edit button, receives valve number, the function (of v-dialog) to
      // propagate the event to, and the event itself.
      start_edit: function(vnum, f, ev) {
        //console.log("Start edit valve ", vnum, " event:", ev);
        this.edit_vnum = vnum;
        this.set_enabled  = this.valves_disp[vnum].en;
        this.set_duration = this.valves_disp[vnum].durMin;
        this.set_interval = this.valves_disp[vnum].intDays;
        f(ev);
      },

      save_edit: function(f, ev) {
        console.log("Save edit!", "vnum="+this.edit_vnum, "intv="+this.set_interval, "dur="+this.set_duration);
        this.dialog = false;
        if (typeof this.edit_vnum === 'number') {
          let vnum = this.edit_vnum;
          // update values!!!
          this.valves[vnum].en  = !!this.set_enabled;
          this.valves[vnum].dur = this.set_duration * 60; // minutes -> seconds
          this.valves[vnum].int = this.set_interval * 24 * 3600; // days -> seconds
        }
        this.edit_vnum = null;
      },
    },
  }
</script>
