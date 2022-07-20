<!-- AuthUserPassword - Authenticate using username and password
     Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file
-->

<template>
  <v-card>
    <v-card-title class="d-flex align-start">
      <div class="d-flex flex-column">
        <span>Authentication required to access:</span>
        <span style="font-size: 120%" class="mt-4">{{config.realm}}</span>
      </div>
      <v-spacer></v-spacer>
      <v-btn elevation=0 icon @click="$emit('change', 'failed')" class="ml-6 mt-n1">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text>
      <form @submit.prevent>
        <div v-if="error" class="mt-6 mb-4" style="color: #aa3333">{{error}}</div>
        <v-text-field v-model="user" label="User/login ID" :autofocus="!config.fixed_user"
          :disabled="config.fixed_user">
        </v-text-field>
        <v-text-field v-model="password" label="Password" :autofocus="config.fixed_user"
          :type="show_pass ? 'text' : 'password'"
          :append-icon="show_pass ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append="show_pass=!show_pass">
        </v-text-field>
        <div class="d-flex mt-6">
          <v-btn @click="$emit('change', 'failed')">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" type="submit" @click="doLogin" @disable="!!req">Login</v-btn>
        </div>
      </form>
    </v-card-text>
  </v-card>
</template>

<script scoped>

export default {
  name: "AuthUserPassword",

  props: {
    config: { type: Object, required: true },
  },

  data() {
    return {
      user: this.config.user || "",
      password: "",
      show_pass: false,
      error: "",
      req: null,
    }
  },

  methods: {
    doLogin() {
      //console.log("doLogin", 'user='+this.user, 'pass='+this.password)
      this.req = fetch(this.config.url, {
        method: "POST",
        mode: 'cors',
        cache: 'no-cache',
        redirect: 'follow',
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: this.user,
          password: this.password,
        }),
      }).then(res => {
        if (res.ok) {
          this.error = null
          this.$emit('change', 'success')
        } else if (res.status == 401) {
          throw Error("Invalid user/password")
        } else {
          throw Error(`Server responded with '${res.statusText}'`)
        }
      }).catch(err => {
        console.log("doLogin", err)
        this.error = err.toString()
        this.req = null
      })
    },

    doCancel() {
      this.$emit('change', 'failed')
    },
  },
}

</script>
