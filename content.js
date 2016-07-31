'use strict';

var Mustache = require("mustache");
var terminal = document.getElementById("terminal");
var template = `
  <i class="fa fa-arrow-right" aria-hidden="true"></i>
  <div class="terminal-dir">/home/george</div>
  <input type="text" class="terminal-button" value="{{ text }}" {{ attributes }}></input>
`;

Mustache.parse(template);

// submitLine() creates a new terminal line in the terminal
// if `before` is null it is added to the bottom of the terminal,
// otherwise, it is placed before the provided `before` Node.
// if disabled is true (default), then the input created has an attribute "disabled".
// if cb is defined, it is called at the end of the function, 
// with the newly generated line Node.
function submitLine(content, before=null, disabled=true, cb=function(line){}) {
  var line = document.createElement('div');
  line.setAttribute('class', 'terminal-line');

  var parameters = { text: content };
  if (disabled) {
    parameters["attributes"] = "disabled";
  }

  var rendered = Mustache.render(template, parameters);
  line.innerHTML = rendered;
  terminal.insertBefore(line, before);

  cb(line);
}

// handler() return a closure wrapping the provided `line`
// The returned closure calls submitLine on every event
// where the KeyCode is 13 (<enter> key) and provides the
// call with the wrapped line.
function handler(line) {
  return function(event) {
    if (event.keyCode == 13) {
      var value = event.target.value;
      submitLine(value, line, true, function(line) {
        var text = document.createTextNode("command not found: " + value);
        line.appendChild(text);
      });  
      event.target.focus();
      event.target.value = "";
    }
  };
}

module.exports = function() {
  submitLine("", null, false, function(line) {
    document.getElementsByClassName("terminal-button")[0].addEventListener("keydown", handler(line));
  });
};
