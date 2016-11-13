const electron = require('electron');
const clipboard = electron.clipboard;
const CodeMirror = require('codemirror');
const Pos = CodeMirror.Pos;

function flashSelection(cm) {
  cm.setExtending(false);
  cm.setCursor(cm.getCursor());
}

function swapLineUp(cm) {

}

function swapLineDown(cm) {

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
