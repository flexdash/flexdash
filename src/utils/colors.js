// color utilities

import colors from 'vuetify/lib/util/colors'

const colorNotFound = '#888' // color returned when we can't parse/find the color

// convert a color name to hash-hex using the vuetify color palette, e.g. red -> #f44336
// to support theme color names, pass this.$vuetify.theme.current.colors
export function color2hhex(color, theme_colors) {
  color = color.toString().toLowerCase()
  if (color.startsWith('#')) return color

  // handle theme colors
  if (theme_colors && color in theme_colors) return theme_colors[color]

  // handle material design palette colors
  let cc = color.split('-')
  console.log(`cc0: ${JSON.stringify(cc)}`)
  if (cc.length > 4) return colorNotFound
  if (cc.length == 4 || cc.length == 2) {
    // first two are color name, e.g. deep-purple or deep-purple-lighten-3
    let cap = cc[1].charAt(0).toUpperCase() + cc[1].slice(1)
    cc.splice(0, 2, cc[0] + cap) // deepPurple
  }
  console.log(`cc1: ${JSON.stringify(cc)}`)
  if (cc[0] in colors.shades) return colors.shades[cc[0]] // black, white, transparent
  if (!(cc[0] in colors)) return colorNotFound
  const shade = cc.length > 1 ? cc[1]+cc[2] : 'base'
  console.log(`shade: ${shade} -> ${colors[cc[0]][shade]}`)
  return colors[cc[0]][shade] || colorNotFound
}
