'use strict';

var Mustache = require("mustache");
var terminal = document.getElementById("terminal");
var template = `
  <i class="fa fa-arrow-right" aria-hidden="true"></i>
  <div class="terminal-dir">/home/george</div>
  <input type="text" class="terminal-button" value="{{ text }}" {{ attributes }}></input>
`;

Mustache.parse(template);

function submitLine(content, before=null, disabled=true) {
  var line = document.createElement('div');
  line.setAttribute('class', 'terminal-line');

  var parameters = { text: content };
  if (disabled) {
    parameters["attributes"] = "disabled";
  }

  var rendered = Mustache.render(template, parameters);
  line.innerHTML = rendered;
  terminal.insertBefore(line, before);

  return line;
}

function handler(line) {
  return function(event) {
    if (event.keyCode == 13) {
      submitLine(event.target.value, line);  
      event.target.focus();
      event.target.value = "";
    }
  };
}

module.exports = function() {
  var line = submitLine("", null, false);
  document.getElementsByClassName("terminal-button")[0].addEventListener("keydown", handler(line));
};
