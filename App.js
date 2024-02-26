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
  }

  function updateEditorDOM(text) {
    updateCursorPosition(text);
    const searchedMarkList = createRangeMarkList(text);
    const rootMarkNode = createMarkTree(searchedMarkList, text);
    const rootDOMNode = divEditorRef.current;
    applyMarkTreeToEditorDOM(rootMarkNode, rootDOMNode, text);
    applyMarkTreeToHTMLDOM(rootMarkNode, divHTMLRef.current, text);
    setCursorPosition(rootDOMNode, cursorPosition);
  }

  function allowCompositeEditorDOM(event) {
    return event.nativeEvent.inputType !== "insertCompositionText";
  }

  return (
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
      <span ref={textPosDisplayRef} />
    </div>
  );
}

////////////////////// INTERNAL //////////////////////
class MarkData {
  constructor({
    styleClass = "",
    pattern = "",
    tag = "",
    isDouble = false,
    isLine = false,
    isRoot = false,
    applyStyleToHTML = false,
    applyEffectOnPattern = false,
  }) {
    this.styleClass = styleClass;
    this.pattern = pattern;
    this.tag = tag;
    this.isDouble = isDouble;
    this.isLine = isLine;
    this.isRoot = isRoot;
    this.applyStyleToHTML = applyStyleToHTML;
    this.applyEffectOnPattern = applyEffectOnPattern;
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

  get pattern() {
    return this.markData.pattern;
  }
  get tag() {
    return this.markData.tag;
  }
  get styleClass() {
    return this.markData.styleClass;
  }
  get isLine() {
    return this.markData.isLine;
  }
  get isRoot() {
    return this.markData.isRoot;
  }
  get applyStyleToHTML() {
    return this.markData.applyStyleToHTML;
  }
  get applyEffectOnPattern() {
    return this.markData.applyEffectOnPattern;
  }
  get leftPattern() {
    return this.markData.pattern;
  }
  get rightPattern() {
    return this.markData.isDouble ? this.markData.pattern : "";
  }
}

class TextPosition {
  constructor(row = 0, column = 0) {
    this.row = row;
    this.column = column;
  }
}

const markDataDBSingle = [
  new MarkData({
    styleClass: "editor-h1",
    pattern: "#",
    tag: "h1",
    applyEffectOnPattern: true,
  }),
  new MarkData({
    styleClass: "editor-h2",
    pattern: "##",
    tag: "h2",
    applyEffectOnPattern: true,
  }),
  new MarkData({
    styleClass: "editor-h3",
    pattern: "###",
    tag: "h3",
    applyEffectOnPattern: true,
  }),
  new MarkData({
    styleClass: "editor-h4",
    pattern: "####",
    tag: "h4",
    applyEffectOnPattern: true,
  }),
  new MarkData({
    styleClass: "editor-h5",
    pattern: "#####",
    tag: "h5",
    applyEffectOnPattern: true,
  }),
  new MarkData({
    styleClass: "editor-h6",
    pattern: "######",
    tag: "h6",
    applyEffectOnPattern: true,
  }),
  new MarkData({
    styleClass: "editor-blockquote",
    pattern: ">",
    tag: "blockquote",
    applyEffectOnPattern: true,
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
//const patternCodeBlock = "```";
const markDataDBParagrpah = new MarkData({ isLine: true });
const markDataDBRoot = new MarkData({ isRoot: true });
const markPatternDBComment = "\\";

function createRangeMarkList(textContent) {
  const searchedMarkList = [];
  class SingleMarkElement {
    constructor(pos, markData) {
      this.pos = pos;
      this.markData = markData;
    }
  }
  class Range {
    constructor(lo, hi) {
      this.lo = lo;
      this.hi = hi;
    }
  }

  function scanLine(line, lineOffset, skipPos) {
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
        searchedMarkList.push(new MarkRange(lo, hi, element.markData));
        while (idx < singleMarkCharStack.length) {
          singleMarkCharStack.pop();
        }
      }
      return matched;
    }

    for (let i = skipPos; i < line.length; i++) {
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
  let lineOffset = 0;

  for (const line of lines) {
    let patternMatched = false;
    let skipPos = 0;

    for (const data of markDataDBOnlyLine) {
      const patternLength = data.pattern.length;
      const lineSeg = line.substring(0, patternLength);
      if (data.pattern === lineSeg) {
        searchedMarkList.push(
          new MarkRange(lineOffset, lineOffset + line.length, data)
        );
        patternMatched = true;
        skipPos += patternLength;
        break;
      }
    }

    /*if(patternCodeBlock.length === line.length) {
			const lineSeg = line.substring(0, patternCodeBlock.length);
			if(patternCodeBlock === lineSeg) {
				if(singleMarkCodeBlockStack.length > 0) {
					searchedMarkList.push(
						new MarkRange(
							singleMarkCodeBlockStack.pop(),
							lineOffset + line.length,
							patternCodeBlock
						)
					);
				} else {
					singleMarkCodeBlockStack.push(lineOffset);
				}
				patternMatched = true;
				skipPos += line.length;
			}
		}*/

    for (const data of markDataDBSingle) {
      const patternLength = data.pattern.length;
      if (patternLength + 1 > line.length) {
        continue;
      }
      const lineSeg = line.substring(0, patternLength);
      const space = line[patternLength].charCodeAt();
      if (data.pattern === lineSeg && (space === 32 || space === 160)) {
        searchedMarkList.push(
          new MarkRange(lineOffset, lineOffset + line.length, data)
        );
        patternMatched = true;
        skipPos += patternLength;
        break;
      }
    }

    scanLine(line, lineOffset, skipPos);
    searchedMarkList.push(
      new MarkRange(lineOffset, lineOffset + line.length, markDataDBParagrpah)
    );
    lineOffset += line.length + 1;
  }
  searchedMarkList.sort((x, y) =>
    x.lo !== y.lo
      ? x.lo - y.lo
      : x.hi !== y.hi
      ? y.hi - x.hi
      : x.isLine
      ? 1
      : -1
  );
  return searchedMarkList;
}

function createMarkTree(searchedMarkList, text) {
  const rootNode = new MarkTreeNode(0, text.length, markDataDBRoot);
  const nodeStack = [];

  let curNode = rootNode;
  for (let i = 0; i < searchedMarkList.length; i++) {
    const range = searchedMarkList[i];
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

function applyMarkTreeToEditorDOM(markRootNode, DOMRootNode, textContent) {
  function addDOMNodeByMarkTree(markNode, DOMnode, lo, hi) {
    if (lo === hi && markNode.isLine) {
      DOMnode.appendChild(document.createElement("br"));
    }
    for (const markChild of markNode.children) {
      if (lo < markChild.lo && !markNode.isRoot) {
        DOMnode.appendChild(
          document.createTextNode(textContent.substring(lo, markChild.lo))
        );
      }

      const childDOMNode = document.createElement(
        markChild.isLine ? "div" : "span"
      );
      if (markChild.styleClass !== "") {
        childDOMNode.setAttribute("class", markChild.styleClass);
      }

      const leftLength = markChild.leftPattern.length;
      const rightLength = markChild.rightPattern.length;
      const leftTag = document.createElement("span");
      leftTag.appendChild(
        document.createTextNode(
          textContent.substring(markChild.lo, markChild.lo + leftLength)
        )
      );
      leftTag.setAttribute("class", "editor-pattern");
      const rightTag = document.createElement("span");
      rightTag.appendChild(
        document.createTextNode(
          textContent.substring(markChild.hi - rightLength, markChild.hi)
        )
      );
      rightTag.setAttribute("class", "editor-pattern");

      if (markChild.applyEffectOnPattern) {
        if (leftLength > 0) {
          childDOMNode.appendChild(leftTag);
        }
        addDOMNodeByMarkTree(
          markChild,
          childDOMNode,
          markChild.lo + leftLength,
          markChild.hi - rightLength
        );
        DOMnode.appendChild(childDOMNode);
        if (rightLength > 0) {
          childDOMNode.appendChild(rightTag);
        }
      } else {
        if (leftLength > 0) {
          DOMnode.appendChild(leftTag);
        }
        addDOMNodeByMarkTree(
          markChild,
          childDOMNode,
          markChild.lo + leftLength,
          markChild.hi - rightLength
        );
        DOMnode.appendChild(childDOMNode);
        if (rightLength > 0) {
          DOMnode.appendChild(rightTag);
        }
      }
      lo = markChild.hi;
    }
    if (lo < hi && !markNode.isRoot) {
      DOMnode.appendChild(
        document.createTextNode(textContent.substring(lo, hi))
      );
    }
  }
  deleteDOMChildren(DOMRootNode);
  addDOMNodeByMarkTree(markRootNode, DOMRootNode, 0, textContent.length);
}

function deleteDOMChildren(node) {
  while (node.firstChild) {
    deleteDOMChildren(node.firstChild);
    node.removeChild(node.firstChild);
  }
}

function getCursorPosition(DOMNode, text) {
  if (!window.getSelection().rangeCount > 0) {
    return new TextPosition();
  }
  const range = window.getSelection().getRangeAt(0);
  const tempRange = range.cloneRange();
  tempRange.selectNodeContents(DOMNode);
  tempRange.setEnd(range.endContainer, range.endOffset);

  let row = 0;
  let curLineNode = range.endContainer;
  if (curLineNode !== DOMNode) {
    while (curLineNode.parentNode !== DOMNode) {
      curLineNode = curLineNode.parentNode;
    }
    const lines = DOMNode.childNodes;
    for (; row < lines.length; row++) {
      if (lines[row] === curLineNode) {
        break;
      }
    }
  }

  let column = tempRange.toString().length;
  const lines = text.split("\n");
  for (let i = 0; i < row; i++) {
    column -= lines[i].length;
  }

  return new TextPosition(row, column);
}

function setCursorPosition(DOMNode, cursorPosition) {
  if (!window.getSelection().rangeCount > 0) {
    return;
  }
  const { row, column } = cursorPosition;
  let targetNode,
    targetOffset,
    offset = 0;
  function scanTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.nodeValue.length;
      if (offset + textLength >= column) {
        targetNode = node;
        targetOffset = column - offset;
      } else {
        offset += textLength;
      }
    } else if (node.tagName === "BR") {
      targetNode = node;
      targetOffset = column - offset;
    } else {
      for (const child of node.childNodes) {
        scanTextNodes(child);
        if (targetNode !== undefined) {
          break;
        }
      }
    }
  }
  scanTextNodes(DOMNode.childNodes[row]);

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
      if (lo < markChild.lo) {
        DOMnode.appendChild(
          document.createTextNode(textContent.substring(lo, markChild.lo))
        );
      }
      const childDOMNode = document.createElement(markChild.tag);
      addDOMNodeByMarkTree(
        markChild,
        childDOMNode,
        markChild.lo + markChild.leftPattern.length,
        markChild.hi - markChild.rightPattern.length
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

  let paragraphFlag = true;
  let paragraphNode;
  for (const markChild of markRootNode.children) {
    if (paragraphFlag) {
      if (markChild.lo !== markChild.hi) {
        paragraphNode = document.createElement("p");
        DOMRootNode.appendChild(paragraphNode);
        paragraphFlag = false;
      }
    } else {
      if (markChild.lo !== markChild.hi) {
        paragraphNode.appendChild(document.createElement("br"));
      } else {
        paragraphFlag = true;
      }
    }
    addDOMNodeByMarkTree(markChild, paragraphNode, markChild.lo, markChild.hi);
  }
}
