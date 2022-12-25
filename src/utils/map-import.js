// dynamic-import -- Allow bundled libraries to be dynamically imported
// Copyright ©2022 Thorsten von Eicken, MIT license, see LICENSE file

import 'es-module-shims'

// ===== the following deals with dynamically loaded widgets, specifically, their imports
// the old method was to define some globals that custom widgets could use, but the new
// way is to use import maps courtesy of es-module-shims.
// The globals should be removed at some point, although we still need to make sure all
// of Vue and Vuetify is pulled in (no treeshaking optimization for those).

const createBlob = (source, type = 'text/javascript') => URL.createObjectURL(new Blob([source], { type }));

export default function(import_map) {
  // convert the global var names in the import_map values to a URL from a blob
  // that re-exports the global var as a module
  const imap = { imports: {} }
  for (const key in import_map) {
    const global_var = import_map[key]
    let source = `// Import ${key} from global ${global_var}\n`
    // create export statements
    if (window[global_var].default) {
      source += `export default ${global_var}.default\n`
    }
    for (const key in window[global_var]) {
      if (key !== 'default') {
        source += `export const ${key} = ${global_var}.${key}\n`
      }
    }
    // create a blob URL for the source and add to import map
    const blobUrl = createBlob(source)
    imap.imports[key] = blobUrl
  }
  importShim.addImportMap(imap)
  console.log("Import map: ", JSON.stringify(importShim.getImportMap()))
}
