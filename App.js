import React, { useRef } from "react";
import "./App.css";

const defaultTitle = "New Document";

export default function App() {
  return <Center />;
}

function Center() {
  return (
    <>
      <CenterTitle />
      <CenterContent />
    </>
  );
}

function CenterTitle() {
  let text = defaultTitle;
  return (
    <div contentEditable="true">
      <h1>{text}</h1>
    </div>
  );
}

function CenterContent() {
  const divEditorRef = useRef();
  const divHTMLRef = useRef();
  const textPosDisplayRef = useRef();
  let cursorPosition = new TextPosition();

  function handleInputChange(event) {
    if (allowCompositeEditorDOM(event)) {
      updateEditorDOM(compatibleLineBreak(event.target.innerText));
    }
  }

  function handleSelectChange(event) {
    updateCursorPosition(compatibleLineBreak(event.target.innerText));
  }

  function handleCompositionEnd(event) {
    updateEditorDOM(compatibleLineBreak(event.target.innerText));
  }

  function handleKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
      if (!window.getSelection().rangeCount > 0) {
        return;
      }
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode("\t");

      range.collapse(true);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function updateCursorPosition(text) {
    cursorPosition = getCursorPosition(divEditorRef.current, text);
    textPosDisplayRef.current.innerText = `row: ${cursorPosition.row}, column: ${cursorPosition.column}`;
    return cursorPosition;
  }

  function updateEditorDOM(text) {
    const [resultEditorList, resultHTMLList] = createRangeMarkList(text);
    const rootMarkEditorNode = createMarkTree(resultEditorList, text);
    const rootMarkHTMLNode = createMarkTree(resultHTMLList, text);
    applyMarkTreeToEditorDOM(rootMarkEditorNode, divEditorRef.current, text);
    applyMarkTreeToHTMLDOM(rootMarkHTMLNode, divHTMLRef.current, text);
  }

  function allowCompositeEditorDOM(event) {
    return event.nativeEvent.inputType !== "insertCompositionText";
  }

  return (
    <>
      <div className="center-content">
        <div
          className="content-box"
          ref={divEditorRef}
          contentEditable={true}
          onInput={handleInputChange}
          onSelect={handleSelectChange}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
        />
        <div className="content-box" ref={divHTMLRef} />
      </div>
      <span ref={textPosDisplayRef} />
    </>
  );
}

////////////////////// INTERNAL //////////////////////
class MarkData {
  constructor({
    styleClass = null,
    pattern = "",
    tag = "",
    isDouble = false,
    spaceAfterPattern = 0,
    applyEffectOnPattern = false,
    lineData = false,
    multiLineData = false,
  }) {
    this.stylePrefix = "editor-";
    this.styleClass = styleClass === null ? this.stylePrefix + tag : styleClass;
    this.pattern = pattern;
    this.tag = tag;
    this.isDouble = isDouble;
    this.spaceAfterPattern = spaceAfterPattern;
    this.applyEffectOnPattern = applyEffectOnPattern;
    this.lineData = lineData;
    this.multiLineData = multiLineData;
  }
  get leftPatternLength() {
    return this.pattern.length + this.spaceAfterPattern;
  }
  get rightPatternLength() {
    return this.isDouble ? this.pattern.length : 0;
  }
  get hasStyle() {
    return this.styleClass !== this.stylePrefix;
  }
  get hasTag() {
    return this.tag !== "";
  }
}

class MarkRange {
  constructor(lo, hi, markData) {
    this.lo = lo;
    this.hi = hi;
    this.markData = markData;
  }
}

class MarkTreeNode {
  constructor(lo, hi, markData) {
    this.lo = lo;
    this.hi = hi;
    this.markData = markData;
    this.children = [];
  }

  pushChild(child) {
    this.children.push(child);
  }
}

class TextPosition {
  constructor(row = 0, column = 0, offset = 0) {
    this.row = row;
    this.column = column;
    this.offset = offset;
  }
}

const markDataDBSingle = [
  new MarkData({
    pattern: "#",
    tag: "h1",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    pattern: "##",
    tag: "h2",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    pattern: "###",
    tag: "h3",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    pattern: "####",
    tag: "h4",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    pattern: "#####",
    tag: "h5",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    pattern: "######",
    tag: "h6",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    pattern: ">",
    tag: "blockquote",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
];
const markDataDBDouble = [
  new MarkData({
    pattern: "~~",
    tag: "del",
    isDouble: true,
  }),
  new MarkData({
    pattern: "**",
    tag: "strong",
    isDouble: true,
  }),
  new MarkData({
    pattern: "__",
    tag: "em",
    isDouble: true,
  }),
  new MarkData({
    pattern: "*",
    tag: "em",
    isDouble: true,
  }),
  new MarkData({
    pattern: "_",
    tag: "strong",
    isDouble: true,
  }),
  new MarkData({
    pattern: "`",
    tag: "code",
    isDouble: true,
    applyEffectOnPattern: true,
  }),
  new MarkData({
    pattern: "^",
    tag: "sup",
    isDouble: true,
    applyEffectOnPattern: true,
  }),
  new MarkData({
    pattern: "~",
    tag: "sub",
    isDouble: true,
    applyEffectOnPattern: true,
  }),
];
const markDataDBOnlyLine = [
  new MarkData({
    pattern: "---",
    tag: "hr",
  }),
];

const markDataDBCodeBlock = new MarkData({
  tag: "code",
  multiLineData: true,
});
const markDataDBCodeBlockPattern = "```";
const markDataDBUList = new MarkData({
  tag: "ul",
  multiLineData: true,
});
const markDataDBUListItem = new MarkData({
  pattern: "-",
  tag: "li",
  spaceAfterPattern: 1,
});
const markPatternDBComment = new MarkData({
  styleClass: "editor-comment",
  pattern: "\\",
  tag: "span",
});
const lineBaseAttributeName = "data-line-base";
const lineCntAttributeName = "data-line-cnt";

function createRangeMarkList(textContent) {
  const [resultEditorList, resultHTMLList] = [[], []];
  const lines = textContent.split("\n");
  const isLineUsed = new Array(lines.length).fill(false);
  const paragraphSep = [-1, lines.length];
  const lineOffsetDB = new Array(lines.length);
  function addMarkData(lo, hi, markData) {
    const range = new MarkRange(lo, hi, markData);
    resultEditorList.push(range);
    resultHTMLList.push(range);
  }

  function scanLargeCodeBlock() {
    let prevOffset = -1;
    let prevRow = -1;
    for (let row = 0, offset = 0; row < lines.length; row++) {
      const line = lines[row];
      const pattern = markDataDBCodeBlockPattern;
      if (line === pattern) {
        if (prevOffset === -1) {
          prevOffset = offset;
          prevRow = row;
        } else {
          addMarkData(prevOffset, offset + line.length, markDataDBCodeBlock);
          function addPattern(p) {
            addMarkData(p, p + 3, new MarkData({ pattern: pattern }));
          }
          addPattern(prevOffset);
          addPattern(offset);
          paragraphSep.push(prevRow);
          paragraphSep.push(row);
          isLineUsed.fill(true, prevRow, row + 1);
          prevOffset = -1;
        }
      }
      offset += lines[row].length + 1;
    }
  }
  scanLargeCodeBlock();

  function scanListPattern(baseOffset) {
    let prevOffset = -1;
    let prevRow = -1;
    let ok = false;
    for (let row = 0, offset = 0; row < lines.length; row++) {
      const line = lines[row];
      const pattern = markDataDBUListItem.pattern;
      const patternLength = pattern.length;
      if (patternLength < line.length) {
        const lineSeg = line.substring(0, patternLength);
        const space = line[patternLength].charCodeAt();
        ok =
          pattern === lineSeg &&
          (space === 32 || space === 160) &&
          !isLineUsed[row];
      }
      if (ok) {
        isLineUsed[row] = true;
        addMarkData(offset, offset + line.length, markDataDBUListItem);
        if (prevOffset === -1) {
          prevOffset = offset;
          prevRow = row;
        }
      } else {
        if (prevOffset !== -1) {
          addMarkData(prevOffset, offset + line.length, markDataDBUList);
          prevOffset = -1;
          for (let i = prevRow; i <= row; i++) {
            paragraphSep.push(i);
          }
        }
      }
      offset += lines[row].length + 1;
    }
  }
  scanListPattern(0);

  function scanDoublePatternInLine(line, lineOffset) {
    class Item {
      constructor(pos, markData) {
        this.pos = pos;
        this.markData = markData;
      }
    }
    const stk = [];
    function findMatch(item) {
      let matched = false;
      let idx = stk.length - 1;
      while (idx >= 0) {
        if (stk[idx].markData.pattern === item.markData.pattern) {
          matched = true;
          break;
        }
        idx--;
      }
      if (matched) {
        const lo = stk[idx].pos;
        const hi = item.pos + item.markData.pattern.length;
        addMarkData(lo, hi, item.markData);
        while (idx < stk.length) {
          stk.pop();
        }
      }
      return matched;
    }

    for (let i = 0; i < line.length; i++) {
      if (line[i] === markPatternDBComment.pattern && i < line.length - 1) {
        function isSpecialCharacter(char) {
          return /[!@#$%^&*(),.?":{}|<>~\`\+\=\-\_\[\]\/\'\|\\]/.test(char);
        }
        if (isSpecialCharacter(line[i + 1])) {
          const lo = i + lineOffset;
          addMarkData(lo, lo + 2, markPatternDBComment);
          i += 1;
          continue;
        }
      }
      for (const data of markDataDBDouble) {
        const patternLength = data.pattern.length;
        if (i > line.length - patternLength) {
          continue;
        }
        const lineSeg = line.substring(i, i + patternLength);
        if (data.pattern === lineSeg) {
          const item = new Item(i + lineOffset, data);
          if (!findMatch(item)) {
            stk.push(item);
          }
          i += patternLength - 1;
          break;
        }
      }
    }
  }
  function scanOnlyLinePatternInLine(line, lineOffset, row) {
    for (const data of markDataDBOnlyLine) {
      const patternLength = data.pattern.length;
      const lineSeg = line.substring(0, patternLength);
      if (data.pattern === lineSeg) {
        addMarkData(lineOffset, lineOffset + line.length, data);
        paragraphSep.push(row);
      }
    }
  }
  function scanSinglePatternInLine(line, lineOffset, row) {
    for (const data of markDataDBSingle) {
      const patternLength = data.pattern.length;
      if (patternLength + 1 <= line.length) {
        const lineSeg = line.substring(0, patternLength);
        const space = line[patternLength].charCodeAt();
        if (data.pattern === lineSeg && (space === 32 || space === 160)) {
          addMarkData(lineOffset, lineOffset + line.length, data);
          paragraphSep.push(row);
        }
      }
    }
  }
  function scanSingleLine(line, lineOffset, row) {
    scanOnlyLinePatternInLine(line, lineOffset);
    scanSinglePatternInLine(line, lineOffset, row);
    scanDoublePatternInLine(line, lineOffset, row);
    if (line.length === 0) {
      paragraphSep.push(row);
    }
  }
  function scanAllLine() {
    let lineOffset = 0;
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];
      if (!isLineUsed[row]) {
        scanSingleLine(line, lineOffset, row);
      }
      resultEditorList.push(
        new MarkRange(
          lineOffset,
          lineOffset + line.length,
          new MarkData({
            lineData: true,
          })
        )
      );
      lineOffsetDB[row] = lineOffset;
      lineOffset += lines[row].length + 1;
    }
  }
  scanAllLine();

  function scanParagraphPattern() {
    paragraphSep.sort((a, b) => a - b);
    for (let p = 0; p < paragraphSep.length - 1; p++) {
      const [loR, hiR] = [paragraphSep[p] + 1, paragraphSep[p + 1] - 1];
      if (hiR - loR >= 0) {
        resultHTMLList.push(
          new MarkRange(
            lineOffsetDB[loR],
            lineOffsetDB[hiR] + lines[hiR].length,
            new MarkData({ tag: "p" })
          )
        );
        for (let r = loR; r < hiR; r++) {
          const pos = lineOffsetDB[r] + lines[r].length + 1;
          resultHTMLList.push(
            new MarkRange(pos, pos, new MarkData({ tag: "br" }))
          );
        }
      }
    }
  }
  scanParagraphPattern();

  function sortList(list) {
    list.sort((x, y) =>
      x.lo !== y.lo
        ? x.lo - y.lo
        : x.hi !== y.hi
        ? y.hi - x.hi
        : x.lineData
        ? 1
        : -1
    );
  }
  sortList(resultEditorList);
  sortList(resultHTMLList);
  return [resultEditorList, resultHTMLList];
}

function createMarkTree(markList, text) {
  const rootNode = new MarkTreeNode(
    0,
    text.length,
    new MarkData({ multiLineData: true })
  );
  const nodeStack = [];

  let curNode = rootNode;
  for (let i = 0; i < markList.length; i++) {
    const range = markList[i];
    const newNode = new MarkTreeNode(range.lo, range.hi, range.markData);
    while (curNode.hi < newNode.hi) {
      curNode = nodeStack.pop();
    }
    curNode.pushChild(newNode);
    nodeStack.push(curNode);
    curNode = newNode;
  }
  return rootNode;
}

function applyMarkTreeToEditorDOM(markRootNode, DOMRootNode, text) {
  const cursorPos = getCursorPosition(DOMRootNode, text);
  let targetNode,
    targetOffset,
    row = 0;
  function appendTextNode(DOMnode, lo, hi) {
    const textSeg = text.substring(lo, hi).replace(/\n/g, "");
    if (textSeg !== "") {
      const textNode = document.createTextNode(textSeg);
      searchCursorNode(textNode, lo - row, hi - row);
      DOMnode.appendChild(textNode);
    }
  }
  function searchCursorNode(node, lo, hi) {
    if (
      row === cursorPos.row &&
      lo <= cursorPos.offset &&
      hi >= cursorPos.offset
    ) {
      targetNode = node;
      targetOffset = cursorPos.offset - lo;
    }
  }

  function addDOMNodeByMarkTree(markNode, DOMnode, lo, hi) {
    if (lo === hi && markNode.markData.lineData) {
      DOMnode.appendChild(document.createElement("br"));
      searchCursorNode(DOMnode, lo - row, hi + 1 - row);
    }
    const prevRow = row;
    if (markNode.markData.multiLineData) {
      DOMnode.setAttribute(lineBaseAttributeName, row);
    }

    for (const markChild of markNode.children) {
      if (lo < markChild.lo) {
        appendTextNode(DOMnode, lo, markChild.lo);
      }
      const childDOMNode = document.createElement(
        markChild.markData.lineData || markChild.markData.multiLineData
          ? "div"
          : "span"
      );
      if (markChild.markData.hasStyle) {
        childDOMNode.setAttribute("class", markChild.markData.styleClass);
      }
      const leftLength = markChild.markData.leftPatternLength;
      const rightLength = markChild.markData.rightPatternLength;
      function applyChild(patternTarget) {
        const newLo = markChild.lo + leftLength;
        const newHi = markChild.hi - rightLength;
        if (leftLength > 0) {
          const leftTag = document.createElement("span");
          appendTextNode(leftTag, markChild.lo, newLo);
          leftTag.setAttribute("class", "editor-pattern");
          patternTarget.appendChild(leftTag);
        }
        addDOMNodeByMarkTree(markChild, childDOMNode, newLo, newHi);
        DOMnode.appendChild(childDOMNode);
        if (rightLength > 0) {
          const rightTag = document.createElement("span");
          appendTextNode(rightTag, newHi, markChild.hi);
          rightTag.setAttribute("class", "editor-pattern");
          patternTarget.appendChild(rightTag);
        }
      }
      if (markChild.markData.applyEffectOnPattern) {
        applyChild(childDOMNode);
      } else {
        applyChild(DOMnode);
      }
      lo = markChild.hi;
      row += markChild.markData.lineData ? 1 : 0;
    }
    if (lo < hi) {
      appendTextNode(DOMnode, lo, hi);
    }

    if (markNode.markData.multiLineData) {
      DOMnode.setAttribute(lineCntAttributeName, row - prevRow);
    }
  }
  deleteDOMChildren(DOMRootNode);
  addDOMNodeByMarkTree(markRootNode, DOMRootNode, 0, text.length);
  setCursorPosition(targetNode, targetOffset);
}

function deleteDOMChildren(node) {
  while (node.firstChild) {
    deleteDOMChildren(node.firstChild);
    node.removeChild(node.firstChild);
  }
}

function getCursorPosition(rootDOMNode, text) {
  if (!window.getSelection().rangeCount > 0) {
    return new TextPosition();
  }
  const range = window.getSelection().getRangeAt(0);
  const tempRange = range.cloneRange();
  tempRange.selectNodeContents(rootDOMNode);
  tempRange.setEnd(range.endContainer, range.endOffset);

  let row = 0;
  function trackParent(node) {
    const parentNode = node.parentNode;
    if (!(parentNode instanceof Element)) {
      return;
    }
    if (parentNode.hasAttribute(lineBaseAttributeName)) {
      row = parseInt(parentNode.getAttribute(lineBaseAttributeName));
      const children = parentNode.childNodes;
      for (let i = 0; i < children.length; i++) {
        if (children[i] === node) {
          break;
        }
        row += children[i].hasAttribute(lineCntAttributeName)
          ? parseInt(children[i].getAttribute(lineCntAttributeName))
          : 1;
      }
      return;
    }
    trackParent(node.parentNode);
  }
  trackParent(range.endContainer);

  const lines = text.split("\n");
  const offset = tempRange.toString().length;
  let column = offset;
  for (let i = 0; i < row; i++) {
    column -= lines[i].length;
  }
  return new TextPosition(row, column, offset);
}

function setCursorPosition(targetNode, targetOffset) {
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

function compatibleLineBreak(text) {
  const newlineCount = (text.match(/\n/g) || []).length;
  const tempText = newlineCount % 2 === 1 ? text.replace(/\n$/, "") : text;
  return tempText.replace(/\n\n/g, "\n");
}

function applyMarkTreeToHTMLDOM(markRootNode, DOMRootNode, text) {
  function appendTextNode(DOMnode, lo, hi) {
    const textSeg = text.substring(lo, hi).replace(/\n/g, "");
    if (textSeg !== "") {
      DOMnode.appendChild(document.createTextNode(textSeg));
    }
  }
  function addDOMNodeByMarkTree(markNode, DOMnode, lo, hi) {
    for (const markChild of markNode.children) {
      if (!markChild.markData.hasTag) {
        lo = markChild.hi;
        continue;
      }
      if (lo < markChild.lo) {
        appendTextNode(DOMnode, lo, markChild.lo);
      }
      const childDOMNode = document.createElement(markChild.markData.tag);
      addDOMNodeByMarkTree(
        markChild,
        childDOMNode,
        markChild.lo + markChild.markData.leftPatternLength,
        markChild.hi - markChild.markData.rightPatternLength
      );
      DOMnode.appendChild(childDOMNode);
      lo = markChild.hi;
    }
    if (lo < hi) {
      appendTextNode(DOMnode, lo, hi);
    }
  }
  deleteDOMChildren(DOMRootNode);
  addDOMNodeByMarkTree(markRootNode, DOMRootNode, 0, text.length);
}
