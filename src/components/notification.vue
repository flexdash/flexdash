<!-- Notification -- Display a stack of notifications at the top of the window
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-snackbar top fixed class="mt-5" color="notification" v-model="snackbar" timeout="3000">
    <div v-for="(note, ix) in notes" :key="note.ts"
         class="d-flex justify-left align-center"
         :style="note_style[ix]">
      <span class="mr-auto">{{note.text}}</span>
      <v-btn size="small" variant="text" @click="deleteItem(ix)">Close</v-btn>
    </div>
  </v-snackbar>
</template>

<script scoped>

var singleton = null

export default {
  name: "Notification",

  props: {
    count: { type: Number, default: 10 },
  },

  data: () => ({
    snackbar: false,
    color: null,
    notes: [],
  }),

  created() { if (!singleton) singleton = this },

  computed: {
    note_style() { return this.notes.map(n => ({
      color: n.color
    }))},
  },

  methods: {
    notify(text, color) {
      let ts = new Date()
      this.notes.unshift({ ts, text, color })
      while (this.notes.length > this.count) this.notes.pop()
      this.snackbar = true
    },

    deleteItem(ix) {
      this.notes.splice(ix, 1)
      if (this.notes.length === 0) this.snackbar = false
    },
  },
}

export function notify(text, color=null) {
  if (singleton) singleton.notify(text, color && `rgb(var(--v-theme-${color}))`)
}

</script>
