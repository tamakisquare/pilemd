const electron = require('electron');
const clipboard = electron.clipboard;
const CodeMirror = require('codemirror');
const Pos = CodeMirror.Pos;

function flashSelection(cm) {
  cm.setExtending(false);
  cm.setCursor(cm.getCursor());
}

function swapLineUp(cm) {
  if (cm.isReadOnly()) return CodeMirror.Pass
  var ranges = cm.listSelections(), linesToMove = [], at = cm.firstLine() - 1, newSels = [];
  for (var i = 0; i < ranges.length; i++) {
    var range = ranges[i], from = range.from().line - 1, to = range.to().line;
    newSels.push({anchor: Pos(range.anchor.line - 1, range.anchor.ch),
                  head: Pos(range.head.line - 1, range.head.ch)});
    if (range.to().ch == 0 && !range.empty()) --to;
    if (from > at) linesToMove.push(from, to);
    else if (linesToMove.length) linesToMove[linesToMove.length - 1] = to;
    at = to;
  }

  cm.operation(function() {
    for (var i = 0; i < linesToMove.length; i += 2) {
      var from = linesToMove[i], to = linesToMove[i + 1];
      var line = cm.getLine(from);
      cm.replaceRange("", Pos(from, 0), Pos(from + 1, 0), "+swapLine");
      if (to > cm.lastLine())
        cm.replaceRange("\n" + line, Pos(cm.lastLine()), null, "+swapLine");
      else
        cm.replaceRange(line + "\n", Pos(to, 0), null, "+swapLine");
    }
    cm.setSelections(newSels);
    cm.scrollIntoView();
  });
}

function swapLineDown(cm) {
  if (cm.isReadOnly()) return CodeMirror.Pass
  var ranges = cm.listSelections(), linesToMove = [], at = cm.lastLine() + 1;
  for (var i = ranges.length - 1; i >= 0; i--) {
    var range = ranges[i], from = range.to().line + 1, to = range.from().line;
    if (range.to().ch == 0 && !range.empty()) from--;
    if (from < at) linesToMove.push(from, to);
    else if (linesToMove.length) linesToMove[linesToMove.length - 1] = to;
    at = to;
  }
  cm.operation(function() {
    for (var i = linesToMove.length - 2; i >= 0; i -= 2) {
      var from = linesToMove[i], to = linesToMove[i + 1];
      var line = cm.getLine(from);
      if (from == cm.lastLine())
        cm.replaceRange("", Pos(from - 1), Pos(from), "+swapLine");
      else
        cm.replaceRange("", Pos(from, 0), Pos(from + 1, 0), "+swapLine");
      cm.replaceRange(line + "\n", Pos(to, 0), null, "+swapLine");
    }
    cm.scrollIntoView();
  });
}

/* Electron things */
function killLine(cm) {
  flashSelection(cm);
  var c = cm.getCursor();
  var thisLine = cm.getRange(c, {line: c.line + 1, ch: 0});
  if (thisLine == '\n') {
    clipboard.writeText('\n');
    cm.replaceRange('', c, {line: c.line + 1, ch: 0});
  } else {
    clipboard.writeText(cm.getRange(c, {line: c.line}));
    cm.replaceRange('', c, {line: c.line});
  }
}

function copyText(cm) {
  var text = cm.getSelection();
  if (text.length > 0) {
    clipboard.writeText(text);
  }
}

function cutText(cm) {
  var text = cm.getSelection();
  if (text.length > 0) {
    clipboard.writeText(text);
    cm.replaceSelection('');
  }
}

function pasteText(cm) {
  cm.replaceSelection(clipboard.readText());
}

module.exports = {
  killLine: killLine,
  copyText: copyText,
  cutText: cutText,
  pasteText: pasteText,
  swapLineDown: swapLineDown,
  swapLineUp: swapLineUp
};
