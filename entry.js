// mv index.html -> dist/index.html
require('file?name=[name].[ext]!./app/assets/index.html');
// include stylesheets
require("./app/stylesheets/main.scss")
// include font awesome
require("font-awesome/css/font-awesome.css")
// run javascripts
require("./content.js")()
