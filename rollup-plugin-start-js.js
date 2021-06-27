export default function gen_start_js() {
  console.log("gen_start_js")
  return {
    name: 'gen-start-js', // this name will show up in warnings and errors
    generateBundle(options, bundle, isWrite) {
      const entries = Object.keys(bundle).filter(name => bundle[name].isEntry)
      this.warn(`entries: ${entries.join(" ")}`)
      const entry = bundle[entries[0]] // we assume there's only one
      const css = Object.keys(bundle).filter(name =>
        bundle[name].name && bundle[name].name.match(/^(vuetify|index)\.css/)
      )
      this.warn(`css: ${css.join(" ")}`)
      //this.warn(`options: ${JSON.stringify(options)}`)

      /*
      Object.entries(bundle).forEach(([name, info]) => {
        this.warn(name)
        Object.keys(info).forEach(k => {
          if (k == 'source' || k == 'code' || k == 'modules') return
          this.warn(` ${k}: ${JSON.stringify(info[k])}`)
        })
      })
      */

      this.emitFile({type: 'asset', fileName: 'start.js', source: `
const css = ${JSON.stringify(css.map(f => './'+f))}
const pre = ${JSON.stringify(entry.imports.map(f => './'+f))}

const head = document.getElementsByTagName('head')[0]
css.forEach(f => {
  const html = '<link rel="stylesheet" href="' + f + '">'
  head.insertAdjacentHTML('beforeend', html)
})
pre.forEach(f => {
  const html = '<link rel="modulepreload" href="' + f + '">'
  head.insertAdjacentHTML('beforeend', html)
})
import "./${entry.fileName}"
      `})
    },
    xwriteBundle(options, bundle) {
      this.warn("writeBundle: " + JSON.stringify(bundle))
    },
  };
}
