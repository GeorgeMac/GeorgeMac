'use strict';

var pathr = require("path");
var mustache = require("mustache");
var hljs = require("highlight.js");

var line_template = `
  <div class="terminal-control">
    <i class="fa fa-arrow-right" aria-hidden="true"></i>
    <div class="terminal-dir">{{ pwd }}</div>
  </div>
  <div class="column">
    <input type="text" class="terminal-input" value="{{ text }}" {{ attributes }}></input>
  </div>
`;

mustache.parse(line_template);

class Line {
  constructor(content, dir, trigger=function(input) {}) {
    this.node = document.createElement('div');
    this.node.setAttribute('class', 'terminal-line columns');
    this.node.innerHTML = mustache.render(line_template, { text: content, pwd: dir });
    this.node.getElementsByTagName('input')[0].addEventListener('keydown', this.submit.bind(this));

    this.result = document.createElement('div');
    this.result.setAttribute('class', 'terminal-result columns');

    this.trigger = trigger;
  }

  setOutput(output, pwd) {
    this.disable();
    this.node.removeEventListener('keydown', this.submit);

    // build line result
    if (Array.isArray(output)) {
      output.map((item) => {
        this.result.appendChild(item);
      });
    } else {
      this.result.appendChild(output);
    }
  }

  focus() {
    this.getInputNode().focus();
  }

  disable() {
    this.getInputNode().setAttribute('disabled', '');
  }

  hide() {
    [ this.node, this.result ].map((node) => { node.setAttribute('style', 'display: none') } );
  }

  getInputNode() {
    return this.node.getElementsByClassName('terminal-input')[0]
  }

  submit(event) {
    if (event.keyCode == 13) {
      event.preventDefault();
      this.trigger(event.target.value);
    }
  };

  appendTo(target) {
    target.appendChild(this.node);
    target.appendChild(this.result);
  }
}

class Session {
  constructor(pwd, fs) {
    this.fs = fs;
    this.pwd = pwd;
    this.terminal = document.getElementById("terminal");
    this.terminal.addEventListener('terminalinput', this.submit.bind(this));
    this.terminal.addEventListener('click', this.click.bind(this));

    // initial input event
    this.lines = [];
    // submit first line
    this.submit(Session.inputEvent(""));

    // setup commands to be issued
    this.commands = {
      'cd': this.cd.bind(this),
      'ls': this.ls.bind(this),
      'cat': this.cat.bind(this),
      'clear': this.clear.bind(this),
      'history': this.history.bind(this),
      'open': this.open.bind(this),
    };
  }

  static inputEvent(input) {
    return new CustomEvent('terminalinput', { detail: input });
  }

  createInput() {
    var terminal = this.terminal;
    return new Line("", this.pwd, function(input) {
      terminal.dispatchEvent(Session.inputEvent(input));
    });
  }

  click(event) {
    // focus on current input
    this.lines[0].focus();
  }

  submit(event) {
    if (event.type != 'terminalinput') {
      return
    }

    // get previous line
    var line = this.lines[0];
    if (line !== undefined) {
      // execute submission
      var result = this.execute(event.detail);

      // set output on previous line
      line.setOutput(result, this.pwd);
    }

    // new blank input line
    line = this.createInput();

    // add to terminal
    line.appendTo(this.terminal);

    // focus on new line
    line.focus();

    // put new line on the front of out lines arrays
    this.lines.unshift(line);
  }

  cat(args=[]) {
    // we're only interested in the first argument
    var path = args.length == 0 ? '' : args[0];

    // save verbose binding madness
    var span = this.span;

    return this.resolve(path, ((path, result) => {
      if (typeof result == "object") {
        return span("cat: " + path + ": Is a directory")
      }

      var ext = pathr.extname(path).substr(1);

      var pre = document.createElement('pre');
      var code = document.createElement('code');
      pre.appendChild(code);

      code.setAttribute('class', ext);

      var content = document.createTextNode(result);
      code.appendChild(content);

      hljs.highlightBlock(code);

      return pre;
    }).bind(this), (path) => {
      return span("cat: " + path + ": No such file or directory")
    });
  }

  cd(args=[]) {
    // we're only interested in the first argument
    var path = args.length == 0 ? '' : args[0];

    // save verbose binding madness
    var span = this.span;

    return this.resolve(path, ((path, result) => {
      if (typeof result == "string") {
        return span("cd: not a directory: " + path)
      }

      this.pwd = path;

      return span("")
    }).bind(this), (path) => {
      return span("cd: no such file or directory: " + path)
    });
  }

  ls(args=[]) {
    // we're only interested in the first argument
    var path = args.length == 0 ? '' : args[0];

    // save verbose binding madness
    var span = this.span;

    // resolve the path provided
    return this.resolve(path, function(path, result) {
      switch(typeof result) {
        // when the result is a string, we have a file
        case 'string':
          return span(path);
        // when the result is an object, we have a directory
        case 'object':
          if (!Array.isArray(result)) {
            result = Object.keys(result)
          }

          return result.map(span)
      }

      // I don't know what we had there
      return span("something went wrong");
    }, (path)=>{ return span("ls: cannot access " + path + ": No such file or directory") });
  }

  clear(args=[]) {
    this.lines.map((line) => { line.hide() });
    return this.span("");
  }

  open(args=[]) {
    var browser = document.getElementById("browser");
    browser.setAttribute("class", "modal is-active");

    var cancels = browser.getElementsByClassName("modal-cancel");
    [].forEach.call(cancels, (cancel) => {
      cancel.addEventListener("click", (event) => { browser.setAttribute("class", "modal") });
    });

    return this.span("");
  }

  history(args=[]) {
    return this.lines.map(function(line) {
      var div = document.createElement('div');
      div.setAttribute('style', 'width: 100%');

      var content = document.createTextNode(line.getInputNode().value);
      div.appendChild(content);

      return div;
    });
  }

  resolve(path, found, error=(path) => { console.log(path) }) {
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

  execute(input) {
    if (input == "") {
      var span = this.span("");
      span.setAttribute('style', 'display: none;');
      return span
    }

    var args = input.replace(/[ ]{2,}/, " ").trim().split(' ');
    var command_str = args.shift();
    var command = this.commands[command_str];
    if (command !== undefined) {
      return command(args);
    }

    return this.span("command not found: " + command_str);
  }

  span(path) {
    // <span/>
    var span = document.createElement('span');
    // command output
    var content = document.createTextNode(path);
    // <span>command output</span>
    span.appendChild(content);
    return span;
  }
}

module.exports = Session;
