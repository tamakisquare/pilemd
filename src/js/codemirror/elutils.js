const electron = require('electron');
const clipboard = electron.clipboard;


function flashSelection(cm) {
  cm.setExtending(false);
  cm.setCursor(cm.getCursor());
}

function swapLineUp(cm) {

}

function swapLineDown(cm) {

}

function deleteLine(cm) {
  flashSelection(cm);
  var c = cm.getCursor();
  var doc = cm.doc;

  var to;
  if (c.line < doc.lineCount()-1) {
    to = {line: c.line + 1, ch: 0};
  }
  else {
    to = {line: c.line, ch: doc.getLine(c.line).length};
  }

  cm.replaceRange('', {line: c.line, ch: 0}, to);
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
  deleteLine: deleteLine
};
