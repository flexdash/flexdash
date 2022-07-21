<!-- Markdown - component to display some very simple Markdown.
     Copyright ©2021 Thorsten von Eicken, MIT license, see LICENSE file
-->
<template>
  <span v-html="md_render" class="md"></span>
</template>

<style>
.md h1 { font-size: 1.375rem; font-weight: 900; margin: 12px 0px 12px; }
.md h2 { font-size: 1.2rem;   font-weight: 700; margin: 12px 0px 8px; }
.md h3 { font-size: 1.0rem;   font-weight: 700; margin: 12px 0px 8px; }
.md h4 { font-size: 0.875rem; font-weight: 700; margin: 8px 0px 4px; }
.md h5 { font-size: 0.875rem; font-weight: 500; margin: 8px 0px 4px; }
.md h6 { font-size: 0.875rem; font-weight: 500; margin: 8px 0px 4px; }
.md { line-height: 1.10rem; padding-top: 0px; padding-bottom: 0px; }
.md code { padding: 0.2em 0em; }
.md ul { margin-bottom: 16px; }
.md ol { margin-bottom: 16px; }
.md img { width: 100%; }
</style>

<script scoped>
export default {
  name: 'Md',

  computed: {
    md_render() {
      const def_slot = this.$slots.default
      const text = (def_slot && def_slot()[0].children?.trim()) || ""
      //console.log("Before:", text.replace(/\n/g, "\\n"))
      //console.log("After:", tfmarkdown(text, true))
      return tfmarkdown(text, true)
    },
  },

/*
  data() { return {
    md_render: "",
  }},

  mounted() {
    const def_slot = this.$slots.default
    const text = (def_slot && def_slot()[0].children?.trim()) || ""
    //console.log("Before:", text.replace(/\n/g, "\\n"))
    //console.log("After:", tfmarkdown(text, true))
    this.md_render = tfmarkdown(text, true)
  },

  beforeUpdate() {
    const def_slot = this.$slots.default
    const text = (def_slot && def_slot()[0].children?.trim()) || ""
    //console.log("Before update:", text.replace(/\n/g, "\\n"))
    //console.log("After:", tfmarkdown(text, true))
    this.md_render = tfmarkdown(text, true)
  },
  */
}


function tfmarkdown(md, disableHtml) {
  if (disableHtml) {
    var d = document.createElement('div');
    d.innerText = md;
    md = d.innerHTML;
    md = md.replace(/<br>/g, '\n');
  }

  // Titles
  md = md.replace(/^(#+)\s(.*)/gm, function(all, hashcount, title){
    var hc = hashcount.length;
    return '<h'+hc+'>'+title+'</h'+hc+'>';
  });
  md = md.replace(/^(.*)\n([=-]{2,})/gm, function(all, title, ttype){
    var hc = ttype[0] === '=' ? '1' : '2';
    return '<h'+hc+'>'+title+'</h'+hc+'>';
  });

  // Blockquotes and code blocks
  md = md.replace(/^>\s((.+\n{0,1})+)/gm, function(all, text){
    text = text.replace(/(\n>\s|\n)/g, '<br />\n');
    return '<blockquote>'+text+'</blockquote>';
  });
  md = md.replace(/^(((\t+|\s{2,}).*\n)+)/gm, function(all, text){
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    text = text.replace(/\n/g, '<br />\n');
    return '<code>'+text+'</code>\n';
  });

  // Ordered and unordered lists
  md = md.replace(/^([-*]\s.+\n?)+/gm, function(all){
    all = all.replace(/^[-*]\s(.*)\n?/gm, '<li>$1</li>');
    return '<ul>'+all+'</ul>';
  });
  md = md.replace(/^([0-9]+\.\s.+\n?)+/gm, function(all){
    all = all.replace(/^[0-9]+\.\s(.*)\n?/gm, '<li>$1</li>');
    return '<ol>'+all+'</ol>';
  });

  // Simple (non-markdown) tables
  md = md.replace(/^(\|.*\n)+/gm, function(a) {
    var rows = a.split(/\n/g);
    var out = ['<table>']
    for (var i=0; i<rows.length; i++) {
      out.push('<tr>');
      var cols = rows[i].split(/\|/g);
      for (var j=1; j<cols.length; j++) {
        out.push('<td>');
        out.push(cols[j]);
        out.push('</td>');
      }
      out.push('</tr>');
    }
    out.push('</table>\n');
    return out.join('');
  });

  // Paragraphs
  //md = md.replace(/(^|\n{2,})([^<])(.*?)([^>])($|\n{2,})/sg, "\n<p>$2$3$4</p>\n");
  md = md.split(/\n{2,}/).map(txt => txt.replace(/^([^<].*[^>])$/s, "<p>$1</p>")).join('\n')

  // Bold, italics, code, links, images
  md = md.replace(/`(.*?)`/g, function(all, text) {
    if (text == '') return '&#96;'
    text = text.replace(/_/g, '&#95;')
    text = text.replace(/\*/g, '&#42;')
    text = text.replace(/\[/g, '&#91;')
    return '<code>' + text + '</code>'
  });
  md = md.replace(/(\*\*|__)(.*?)(\*\*|__)/g, '<b>$2</b>');
  md = md.replace(/[*_](.*?)[*_]/g, '<i>$1</i>');
  md = md.replace(/([^\]][^(])(https?:\/\/.*?)([\s<]|[.,);][\s<])/g, '$1<a href="$2">$2</a>$3');
  md = md.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
  md = md.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Reference-style links
  md = md.replace(/\[(.*?)\]\s*\[(.*?)\]/g, function(all, text, ref) {
    var path = '';
    ref = ref.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    md.replace(new RegExp('\\['+ref+'\\]:\\s*(.*)'), function(all2, path2) {
      path = path2;
    });
    return '<a href="'+path+'">'+text+'</a>';
  });

  // Remove reference lines
  md = md.replace(/\[.*\]:.*/g, '');

  // Paragraphs -- doesn't work, puts </P. at end of first line of para
  //md = md.replace(/(^|\n{2,})([^<])(.*)/g, '\n<p>$2$3</p>');

  // Remove extra line breaks etc
  md = md.replace('<code><br />', '<code>');

  return md;
}

/* The above tf-markdown implementation comes from
   https://github.com/twofront/TF-Markdown
   and is licensed as follows:

The MIT License (MIT)

Copyright (c) 2014 Two Front Productions Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
</script>
