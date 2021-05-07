console.log("NODE_ENV", process.env.NODE_ENV)

module.exports = {
  devServer: {
    // see https://forum.vuejs.org/t/vue-config-js-for-dev-and-build/113174/3
    public: process.env['DEV_SERVER'],
  },

  transpileDependencies: [
    'vuetify'
  ],

  publicPath: process.env.NODE_ENV === 'production' ? '/d/' : '/',

  // see https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-plugin
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = process.env.NODE_ENV == 'production' ?
          'Dash' : 'Test Dash'  // htmlWebpackPlugin.options.title
      return args
      })
  },
/*
  chainWebpack: config => {
    config.plugin('define').tap(defs => {
      defs[0].['process.env']['PACKAGE_VERSION'] = ''
      return defs
      })
  }, */
}
