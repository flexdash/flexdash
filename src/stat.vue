<template>
  <v-dialog v-model="dialog" max-width="600px">
    <!-- Normal stuff to show: A simple value -->
    <template v-slot:activator="{ on, attrs }">
      <v-card v-bind="attrs" v-on="on">
        <v-card-text class="d-flex pa-0 pt-1">
          <span class="mx-auto">{{title}}</span>
        </v-card-text>
        <v-card-title class="headline pa-0">
          <span class="mx-auto">{{valTxt}}<span class="unit">{{unitTxt}}</span></span>
        </v-card-title>
      </v-card>
    </template>
    <!-- Dialog box to show: editing a valve -->
    <v-card>
      <v-card-title>
        <span class="headline">{{title}}</span>
        <v-spacer></v-spacer>
        <v-btn @click="dialog=false">Close</v-btn>
      </v-card-title>
      <v-card-text>
        <p>Imagine a chart here...</p>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script scoped>
  module.exports = {

    props: {
      title: String,
      unit: String,
      value: { default: null },
    },

    data: function() { return {
      dialog: null, // true while pop-up is active, set to false to close it
    }},

    computed: {
      unitTxt: function() { return this.value === "DEAD" ? "" : this.unit; },
      valTxt: function() {
        if (typeof this.value == 'number') return Math.round(this.value*10.0)/10.0
        else if (this.value === null) return "DEAD";
        else return this.value;
      },
    },

  }
</script>
