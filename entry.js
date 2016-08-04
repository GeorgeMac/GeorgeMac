// mv index.html -> dist/index.html
require('file?name=[name].[ext]!./app/assets/index.html');
// include stylesheets
require("./app/stylesheets/main.scss")
// include font awesome
require("font-awesome/css/font-awesome.css")
// CustomEvent polyfill
require('./app/polyfill/custom_event.js')
// run javascripts
require("./content.js")()
