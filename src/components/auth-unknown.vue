<!-- AuthUnknown - Error dialog when authentication method is unknown
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-card>
    <v-card-title class="d-flex">
      <span>Authentication required</span>
      <v-spacer></v-spacer>
      <v-btn elevation=0 icon @click="$emit('change', 'failed')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      Sorry, but the connection to the server requires an unknown authentication method:
      <v-simple-table dense fixed-header>
        <template v-slot:default>
          <tbody>
            <tr v-for="val, key in config" :key="key">
              <td align="right" class="px-1"><b>{{key}}:</b></td>
              <td class="px-2">{{val}}</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card-text>
  </v-card>
</template>

<script scoped>

export default {
  name: "AuthUnknown",

  props: {
    config: { type: Object, required: true },
  },
}

</script>
