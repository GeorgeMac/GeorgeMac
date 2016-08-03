'use strict';

var Mustache = require("mustache");
var pathr = require("path");
var terminal = document.getElementById("terminal");
var template = `
  <i class="fa fa-arrow-right" aria-hidden="true"></i>
  <div class="terminal-dir">/home/george</div>
  <input type="text" class="terminal-button" value="{{ text }}" {{ attributes }}></input>
`;

class Session {
  constructor(pwd, fs) {
    this.pwd = pwd;
    this.fs = fs;
    this.commands = {
      'ls': this.ls.bind(this)
    };
  }

  ls(args=[]) {
    var files = [];
    var path = args.length == 0 ? '.' : args[0];
    if (path == '') {
      path = '.'
    }

    var format = (path) => {
      // <span/>
      var span = document.createElement('span');
      // command output
      var content = document.createTextNode(path);
      // <span>command output</span>
      span.appendChild(content);
      return span;
    };

    return this.walk(path, function(path, result) {
      switch(typeof result) {
        // when the result is a string, we have a file
        case 'string':
          return format(path);
        // when the result is an object, we have a directory
        case 'object':
          if (!Array.isArray(result)) {
            result = Object.keys(result)
          }

          return result.map(format)
      }

      // I don't know what we had there
      return format("something went wrong");
    },
    function(path){
      return format("ls: cannot access " + path + ": No such file or directory");
    });
  }

  walk(path, found, error=(path) => { console.log(path) }) {
    // strip trailing slashes
    path = pathr.resolve(this.pwd, path);
    // split path on separator
    var parts = path == '/' ? [] : path.split('/');
    // remove first blank
    parts.shift();

    // traverse the filesystem
    var result = this.fs;
    for (var part = parts.shift(); part !== undefined && result != undefined; part = parts.shift()) {
      result = result[part];
    }

    // if nothing can be found call error, otherwise, call found
    return result === undefined ? error(path) : found(path, result)
  }

  execute(line) {
    var args = line.replace(/[ ]{2,}/, " ").trim().split(' ');
    var command_str = args.shift();
    var command = this.commands[command_str];
    if (command !== undefined) {
      return command(args);
    }

    return document.createTextNode("command not found: " + command_str);
  }
}

var session = new Session('/home/george', {
  'home': {
    'george': {
      'blog': {'welcome.md': ''},
      'README.md': "Some file contents"
    }
  }
});

Mustache.parse(template);

// submitLine() creates a new terminal line in the terminal
// if `before` is null it is added to the bottom of the terminal,
// otherwise, it is placed before the provided `before` Node.
// if disabled is true (default), then the input created has an attribute "disabled".
// if cb is defined, it is called at the end of the function, 
// with the newly generated line Node.
function submitLine(content, before=null, disabled=true, cb=(line) => {}) {
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
        var result = session.execute(value);
        if (Array.isArray(result)) {
          result.map((item) => {
            line.appendChild(item)
          });
        } else {
          line.appendChild(result);
        }
      });  
      event.target.focus();
      event.target.value = "";
    }
  };
}

module.exports = function() {
  // map a click on to the terminal, to focus on the input
  terminal.addEventListener("click", () => {
    var buttons = document.getElementsByClassName("terminal-button");
    [].forEach.call(buttons, (input) => {
      if (!input.getAttribute("disabled")) {
        input.focus();
      }
    });
  });

  // create the input line
  submitLine("", null, false, (line) => {
    document.getElementsByClassName("terminal-button")[0].addEventListener("keydown", handler(line));
  });
};
