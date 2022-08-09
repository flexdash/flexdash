// 20 distinct colors from https://sashamaps.net/docs/resources/20-colors/ plus black&white
var colors = [
'#4363d8', '#3cb44b', '#ffe119', '#e6194b', '#42d4f4', '#911eb4', '#f58231',
'#469990', '#fabed4', '#bfef45', '#f032e6', '#dcbeff', '#9a6324', '#fffac8',
'#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9'];

var color_names = [
'blue', 'green', 'yellow', 'red', 'cyan', 'purple', 'orange',
'teal', 'pink', 'lime', 'magenta', 'lavender', 'brown', 'beige',
'maroon', 'mint', 'olive', 'apricot', 'navy', 'grey', 'from'];

function color_by_name(name) {
    if (name.startsWith("#")) return name
    const ix = color_names.indexOf(name)
    return ix >= 0 ? colors[ix] : '#cccccc'
}

export { colors, color_names, color_by_name }
