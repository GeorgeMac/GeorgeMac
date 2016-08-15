// mv index.html -> dist/index.html
require('file?name=[name].[ext]!./app/assets/index.html');
// include stylesheets
require("./app/stylesheets/main.scss");
// include font awesome
require("font-awesome/css/font-awesome.css");
// CustomEvent polyfill
require('./app/polyfill/custom_event.js');
// run javascripts
var Session = require("./session.js");

document.getElementById("logo").innerHTML = require("./app/assets/images/beard.svg");

var readme = `GeorgeMac.com
=============

> see: github.com/georgemac/georgemac

## Implemented Commands

cd: change directory
ls: list directory
cat: concatenate and print files (or just spit them out)
clear: clear the current session
history: see command history

## Now Supporting

- code highlighting! see output of cat

## Roadmap

1. tab completion
2. open - simple pretend web browser?
`

var session = new Session('/home/george', {
  'home': {
    'george': {
      'blog': {'welcome.md': ''},
      'README.md': readme
    }
  }
});
