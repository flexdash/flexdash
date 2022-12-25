// init es-module-shims
// this is in prelude.js which must be loaded via script tag before main.js because otherwise
// es-module-shims loads before the options are set. Recall that imports are hoisted to the top...

window.esmsInitOptions = {
    shimMode: true, // shimMode requird to support multiple dynamic import maps
    // Skip source analysis of certain URLs for full native passthrough
    skip: "^https?:.*\/assets\/index\.[a-z0-9]{8}\.js$", // bundled FlexDash
    mapOverrides: true, // Permit overrides to import maps (used by custom widget HMR)
  
    // -- Hooks --
    // // Module load error
    // onerror: (e) => { /*...*/ }, // default noop
    // // Called when polyfill mode first engages
    // onpolyfill: () => {}, // default logs to the console
    // // Hook all module resolutions
    // resolve: (id, parentUrl, resolve) => resolve(id, parentUrl), // default is spec resolution
    // // Hook source fetch function
    // fetch: (url, options) => fetch(url, options), // default is native
    // // Hook import.meta construction
    // meta: (meta, url) => void, // default is noop
    // // Hook top-level imports
    // onimport: (url, options, parentUrl) => void // default is noop
  }
  