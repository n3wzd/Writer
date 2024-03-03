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

  function updateCursorPosition(text) {
    cursorPosition = getCursorPosition(divEditorRef.current, text);
    textPosDisplayRef.current.innerText = `row: ${cursorPosition.row}, column: ${cursorPosition.column}`;
    return cursorPosition;
  }

  function updateEditorDOM(text) {
    const rootMarkNode = createMarkTree(text);
    const rootDOMNode = divEditorRef.current;
    applyMarkTreeToEditorDOM(rootMarkNode, rootDOMNode, text);
    applyMarkTreeToHTMLDOM(rootMarkNode, divHTMLRef.current, text);
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
          style={{ border: "1px solid #ccc", padding: "8px" }}
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
    styleClass = "",
    pattern = "",
    tag = "",
    isDouble = false,
    isLineData = false,
    applyEffectOnPattern = false,
    onlySingleLine = false,
    containLineData = false,
    spaceAfterPattern = 0,
  }) {
    this.styleClass = styleClass;
    this.pattern = pattern;
    this.tag = tag;
    this.isDouble = isDouble;
    this.isLineData = isLineData;
    this.applyEffectOnPattern = applyEffectOnPattern;
    this.onlySingleLine = onlySingleLine;
    this.containLineData = containLineData;
    this.spaceAfterPattern = spaceAfterPattern;
  }
  get leftPatternLength() {
    return this.pattern.length + this.spaceAfterPattern;
  }
  get rightPatternLength() {
    return this.isDouble ? this.pattern.length : 0;
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
    styleClass: "editor-h1",
    pattern: "#",
    tag: "h1",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    styleClass: "editor-h2",
    pattern: "##",
    tag: "h2",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    styleClass: "editor-h3",
    pattern: "###",
    tag: "h3",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    styleClass: "editor-h4",
    pattern: "####",
    tag: "h4",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    styleClass: "editor-h5",
    pattern: "#####",
    tag: "h5",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    styleClass: "editor-h6",
    pattern: "######",
    tag: "h6",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
  new MarkData({
    styleClass: "editor-blockquote",
    pattern: ">",
    tag: "blockquote",
    applyEffectOnPattern: true,
    spaceAfterPattern: 1,
  }),
];
const markDataDBDouble = [
  new MarkData({
    styleClass: "editor-del",
    pattern: "~~",
    tag: "del",
    isDouble: true,
  }),
  new MarkData({
    styleClass: "editor-strong",
    pattern: "**",
    tag: "strong",
    isDouble: true,
  }),
  new MarkData({
    styleClass: "editor-em",
    pattern: "__",
    tag: "em",
    isDouble: true,
  }),
  new MarkData({
    styleClass: "editor-em",
    pattern: "*",
    tag: "em",
    isDouble: true,
  }),
  new MarkData({
    styleClass: "editor-strong",
    pattern: "_",
    tag: "strong",
    isDouble: true,
  }),
  new MarkData({
    styleClass: "editor-code",
    pattern: "`",
    tag: "code",
    isDouble: true,
    applyEffectOnPattern: true,
  }),
  new MarkData({
    styleClass: "editor-sup",
    pattern: "^",
    tag: "sup",
    isDouble: true,
    applyEffectOnPattern: true,
  }),
  new MarkData({
    styleClass: "editor-sub",
    pattern: "~",
    tag: "sub",
    isDouble: true,
    applyEffectOnPattern: true,
  }),
];
const markDataDBOnlyLine = [
  new MarkData({
    styleClass: "editor-horizon",
    pattern: "---",
    tag: "hr",
  }),
];
const markPatternDBComment = "\\";
const lineBaseAttributeName = "data-line-base";
const lineCntAttributeName = "data-line-cnt";

function createRangeMarkList(textContent) {
  const resultList = [];
  function scanDoublePatternInLine(line, lineOffset) {
    class SingleMarkElement {
      constructor(pos, markData) {
        this.pos = pos;
        this.markData = markData;
      }
    }
    const singleMarkCharStack = [];
    function findMatch(element) {
      let matched = false;
      let idx = singleMarkCharStack.length - 1;
      while (idx >= 0) {
        if (
          singleMarkCharStack[idx].markData.pattern === element.markData.pattern
        ) {
          matched = true;
          break;
        }
        idx--;
      }
      if (matched) {
        const lo = singleMarkCharStack[idx].pos;
        const hi = element.pos + element.markData.pattern.length;
        resultList.push(new MarkRange(lo, hi, element.markData));
        while (idx < singleMarkCharStack.length) {
          singleMarkCharStack.pop();
        }
      }
      return matched;
    }

    for (let i = 0; i < line.length; i++) {
      if (i <= line.length - markPatternDBComment.length) {
        const lineSeg = line.substring(i, i + markPatternDBComment.length);
        if (markPatternDBComment === lineSeg) {
          i += markPatternDBComment.length;
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
          const element = new SingleMarkElement(i + lineOffset, data);
          if (!findMatch(element)) {
            singleMarkCharStack.push(element);
          }
          i += patternLength - 1;
          break;
        }
      }
    }
  }

  const lines = textContent.split("\n");
  const isLineUsed = new Array(lines.length).fill(false);
  function scanLargeCodeBlock() {
    let prevPos = -1;
    let prevRow = -1;
    let curPos = 0;
    for (let curRow = 0; curRow < lines.length; curRow++) {
      const line = lines[curRow];
      const pattern = "```";
      if (line === pattern) {
        if (prevPos === -1) {
          prevPos = curPos;
          prevRow = curRow;
        } else {
          resultList.push(
            new MarkRange(
              prevPos,
              curPos + line.length,
              new MarkData({
                styleClass: "editor-code",
                tag: "code",
                containLineData: true,
              })
            )
          );
          function addPattern(p) {
            resultList.push(
              new MarkRange(p, p + 3, new MarkData({ pattern: "```" }))
            );
          }
          addPattern(prevPos);
          addPattern(curPos);
          isLineUsed.fill(true, prevRow, curRow + 1);
          prevPos = -1;
        }
      }
      curPos += line.length + 1;
    }
  }
  scanLargeCodeBlock();

  function scanSinglePattern() {
    let lineOffset = 0;
    for (let r = 0; r < lines.length; r++) {
      const line = lines[r];
      let singleLineMatched = false;

      if (!isLineUsed[r]) {
        for (const data of markDataDBOnlyLine) {
          const patternLength = data.pattern.length;
          const lineSeg = line.substring(0, patternLength);
          if (data.pattern === lineSeg) {
            resultList.push(
              new MarkRange(lineOffset, lineOffset + line.length, data)
            );
            singleLineMatched = true;
            break;
          }
        }
        for (const data of markDataDBSingle) {
          const patternLength = data.pattern.length;
          if (patternLength + 1 > line.length) {
            continue;
          }
          const lineSeg = line.substring(0, patternLength);
          const space = line[patternLength].charCodeAt();
          if (data.pattern === lineSeg && (space === 32 || space === 160)) {
            resultList.push(
              new MarkRange(lineOffset, lineOffset + line.length, data)
            );
            singleLineMatched = true;
            break;
          }
        }
        scanDoublePatternInLine(line, lineOffset);
      }

      resultList.push(
        new MarkRange(
          lineOffset,
          lineOffset + line.length,
          new MarkData({
            isLineData: true,
            onlySingleLine: singleLineMatched,
          })
        )
      );
      lineOffset += line.length + 1;
    }
  }
  scanSinglePattern();

  resultList.sort((x, y) =>
    x.lo !== y.lo
      ? x.lo - y.lo
      : x.hi !== y.hi
      ? y.hi - x.hi
      : x.isLineData
      ? 1
      : -1
  );
  return resultList;
}

function createMarkTree(text) {
  const markList = createRangeMarkList(text);
  const rootNode = new MarkTreeNode(
    0,
    text.length,
    new MarkData({ containLineData: true })
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
  function checkLineBreak(lo, hi) {
    return text.substring(lo, hi) === "\n";
  }
  function createTextNode(lo, hi) {
    const textNode = document.createTextNode(text.substring(lo, hi));
    searchCursorNode(textNode, lo - row, hi - row);
    return textNode;
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
    if (lo === hi && markNode.markData.isLineData) {
      DOMnode.appendChild(document.createElement("br"));
      searchCursorNode(DOMnode, lo - row, hi + 1 - row);
      return;
    }
    let prevRow = row;
    if (markNode.markData.containLineData) {
      DOMnode.setAttribute(lineBaseAttributeName, row);
    }

    for (const markChild of markNode.children) {
      if (lo < markChild.lo && !checkLineBreak(lo, markChild.lo)) {
        DOMnode.appendChild(createTextNode(lo, markChild.lo));
      }
      const childDOMNode = document.createElement(
        markChild.markData.isLineData ? "div" : "span"
      );
      if (markChild.markData.styleClass !== "") {
        childDOMNode.setAttribute("class", markChild.markData.styleClass);
      }
      const leftLength = markChild.markData.leftPatternLength;
      const rightLength = markChild.markData.rightPatternLength;
      function applyChild(patternTarget) {
        const newLo = markChild.lo + leftLength;
        const newHi = markChild.hi - rightLength;
        if (leftLength > 0) {
          const leftTag = document.createElement("span");
          leftTag.appendChild(createTextNode(markChild.lo, newLo));
          leftTag.setAttribute("class", "editor-pattern");
          patternTarget.appendChild(leftTag);
        }
        addDOMNodeByMarkTree(markChild, childDOMNode, newLo, newHi);
        DOMnode.appendChild(childDOMNode);
        if (rightLength > 0) {
          const rightTag = document.createElement("span");
          rightTag.appendChild(createTextNode(newHi, markChild.hi));
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
      row += markChild.markData.isLineData ? 1 : 0;
    }
    if (lo < hi && !checkLineBreak(lo, hi)) {
      DOMnode.appendChild(createTextNode(lo, hi));
    }

    if (markNode.markData.containLineData) {
      DOMnode.setAttribute(lineCntAttributeName, row - prevRow);
    }
  }
  deleteDOMChildren(DOMRootNode);
  addDOMNodeByMarkTree(markRootNode, DOMRootNode, 0, text.length, 0);
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
  if (!window.getSelection().rangeCount > 0 || !targetNode) {
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

function applyMarkTreeToHTMLDOM(markRootNode, DOMRootNode, textContent) {
  function addDOMNodeByMarkTree(markNode, DOMnode, lo, hi) {
    for (const markChild of markNode.children) {
      if (markChild.markData.tag === "") {
        lo = markChild.hi;
        continue;
      }
      if (lo < markChild.lo) {
        DOMnode.appendChild(
          document.createTextNode(textContent.substring(lo, markChild.lo))
        );
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
      DOMnode.appendChild(
        document.createTextNode(textContent.substring(lo, hi))
      );
    }
  }
  deleteDOMChildren(DOMRootNode);

  function isSingleLine(markNode) {
    return markNode.lo === markNode.hi || markNode.markData.onlySingleLine;
  }
  function scanLineNodes(markNode, DOMnode) {
    let paragraphActiveFlag = false;
    let paragraphNode;
    for (const markChild of markNode.children) {
      if (markChild.markData.containLineData) {
        const areaTag = document.createElement(markChild.markData.tag);
        DOMnode.appendChild(areaTag);
        scanLineNodes(markChild, areaTag);
        paragraphActiveFlag = false;
      } else {
        if (paragraphActiveFlag) {
          if (!isSingleLine(markChild)) {
            paragraphNode.appendChild(document.createElement("br"));
          } else {
            paragraphActiveFlag = false;
          }
        } else {
          if (!isSingleLine(markChild)) {
            paragraphNode = document.createElement("p");
            DOMnode.appendChild(paragraphNode);
            paragraphActiveFlag = true;
          }
        }
        if (paragraphActiveFlag) {
          addDOMNodeByMarkTree(
            markChild,
            paragraphNode,
            markChild.lo,
            markChild.hi
          );
        } else {
          addDOMNodeByMarkTree(markChild, DOMnode, markChild.lo, markChild.hi);
        }
      }
    }
  }
  scanLineNodes(markRootNode, DOMRootNode);
}
