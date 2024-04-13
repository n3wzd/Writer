import { TextPosition } from "../datas/class.js";
import { compatibleLineBreak } from "./html.js";

export function getCursorPosition(rootDOMNode, text) {
  if (!window.getSelection().rangeCount > 0) {
    return new TextPosition();
  }
  const range = window.getSelection().getRangeAt(0);
  const lines = text.split("\n");

  function getRow() {
    const tempRange = range.cloneRange();
    const textNode = document.createTextNode("1");
    tempRange.insertNode(textNode);

    const newLines = compatibleLineBreak(rootDOMNode.innerText).split("\n");
    let row = 0;
    for (; row < lines.length; row++) {
      if (newLines[row] !== lines[row]) {
        break;
      }
    }
    tempRange.selectNode(textNode);
    tempRange.deleteContents();
    return row;
  }

  const row = getRow();
  const tempRange = range.cloneRange();
  tempRange.selectNodeContents(rootDOMNode);
  tempRange.setEnd(range.startContainer, range.startOffset);

  const offset = tempRange.toString().length;
  let column = offset;
  for (let i = 0; i < row; i++) {
    column -= lines[i].length;
  }
  return new TextPosition(row, column, offset);
}

export function setCursorPosition(targetNode, targetOffset) {
  if (!window.getSelection().rangeCount > 0 || !(targetNode instanceof Node)) {
    return;
  }
  const range = document.createRange();
  range.setStart(targetNode, targetOffset);
  range.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}
