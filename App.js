import React, { useRef, useState, useEffect } from "react";
import "./App.css";

class EditorFile {
  constructor(id, name = "", text = "") {
    this.id = id;
    this.name = name;
    this.text = text;
  }
}

class EditorDirectory {
  constructor(id, name = "") {
    this.id = id;
    this.name = name;
    this.files = [];
    this.isFold = false;
  }
}

const defaultTitle = "New Document";
const mainDirectory = new EditorDirectory();

const test = new EditorDirectory(6, "Directory 1");
test.files = [
  new EditorFile(4, "Untitled 4", "test 4"),
  new EditorFile(5, "Untitled 5", "test 5"),
];
mainDirectory.files = [
  new EditorFile(1, "Untitled 1", "test 1"),
  new EditorFile(2, "Untitled 2", "test 2"),
  test,
  new EditorFile(3, "Untitled 3", "test 3"),
];

export default function App() {
  const [editorFile, setEditorFile] = useState(new EditorFile());

  const handleFileClick = (file) => {
    setEditorFile(file);
  };

  return (
    <div className="layout-main">
      <Left onFileClick={handleFileClick} />
      <Center editorFile={editorFile} />
    </div>
  );
}

function Center({ editorFile }) {
  const divTitleRef = useRef();
  const divEditorRef = useRef();
  const divHTMLRef = useRef();
  const textPosDisplayRef = useRef();

  let curEditorState = new EditorState();
  const undoStateStk = [];
  const redoStateStk = [];
  const undoTime = 500;
  let undoTimeID = null;

  useEffect(() => {
    divTitleRef.current.value = editorFile.name;
    divEditorRef.current.innerText = editorFile.text;
    inputChange(editorFile.text);
    updateCursorDisplay(new TextPosition());
  });

  function handleInputChange(event) {
    if (allowCompositeEditorDOM(event)) {
      inputChange(event.target.innerText);
    }
  }

  function handleSelectChange(event) {
    const text = compatibleLineBreak(event.target.innerText);
    updateCursorDisplay(getCursorPosition(divEditorRef.current, text));
  }

  function handleCompositionEnd(event) {
    inputChange(event.target.innerText);
  }

  function handleKeyDown(event) {
    const keyinputZ = ["z", "Z"].includes(event.key);
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
    } else if (event.ctrlKey && event.shiftKey && keyinputZ) {
      event.preventDefault();
      if (redoStateStk.length > 0) {
        const curText = compatibleLineBreak(divEditorRef.current.innerText);
        const cursorPos = getCursorPosition(divEditorRef.current, curText);
        undoStateStk.push(new EditorState(curText, cursorPos));

        const { text: newText, cursorPosition: newPos } = redoStateStk.pop();
        updateEditorDOM(newText, newPos);
        updateCursorDisplay(newPos);
        curEditorState = new EditorState(newText, newPos);
      }
    } else if (event.ctrlKey && keyinputZ) {
      event.preventDefault();
      if (undoStateStk.length > 0) {
        const curText = compatibleLineBreak(divEditorRef.current.innerText);
        const cursorPos = getCursorPosition(divEditorRef.current, curText);
        redoStateStk.push(new EditorState(curText, cursorPos));

        const { text: newText, cursorPosition: newPos } = undoStateStk.pop();
        updateEditorDOM(newText, newPos);
        updateCursorDisplay(newPos);
        curEditorState = new EditorState(newText, newPos);
      }
    }
  }

  function inputChange(text) {
    const newText = compatibleLineBreak(text);
    const cursorPos = getCursorPosition(divEditorRef.current, newText);
    updateEditorDOM(newText, cursorPos);
    updateCursorDisplay(cursorPos);

    if (undoTimeID !== null) {
      clearTimeout(undoTimeID);
    } else {
      undoStateStk.push(
        new EditorState(curEditorState.text, curEditorState.cursorPosition)
      );
    }
    undoTimeID = setTimeout(() => {
      undoTimeID = null;
    }, undoTime);
    curEditorState = new EditorState(newText, cursorPos);
    redoStateStk.length = 0;
  }

  function updateCursorDisplay(pos) {
    textPosDisplayRef.current.innerText = `Ln ${pos.row}, Col ${pos.column}`;
  }

  function updateEditorDOM(text, cursorPos) {
    const [resultEditorList, resultHTMLList] = createRangeMarkList(text);
    const rootMarkEditorNode = createMarkTree(resultEditorList, text);
    const rootMarkHTMLNode = createMarkTree(resultHTMLList, text);
    applyMarkTreeToEditorDOM(
      rootMarkEditorNode,
      divEditorRef.current,
      text,
      cursorPos
    );
    applyMarkTreeToHTMLDOM(rootMarkHTMLNode, divHTMLRef.current, text);
  }

  function allowCompositeEditorDOM(event) {
    return event.nativeEvent.inputType !== "insertCompositionText";
  }

  return (
    <div className="layout-center">
      <input className="layout-center-title" ref={divTitleRef} type="text" />
      <div className="layout-center-content">
        <pre
          className="content-box"
          ref={divEditorRef}
          contentEditable={true}
          onInput={handleInputChange}
          onSelect={handleSelectChange}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
        />
        <pre className="content-box" ref={divHTMLRef} />
      </div>
      <span className="layout-center-nav" ref={textPosDisplayRef} />
    </div>
  );
}

function Left({ onFileClick }) {
  const [state, setState] = useState();

  function toggleFoldDirectory(directory) {
    // Not Updated (should use file.id)
    // directory.isFold = !directory.isFold;
    setState();
  }

  function listMaker(directory) {
    return (
      <ul>
        {directory.files.map((file, idx) =>
          file instanceof EditorDirectory ? (
            <>
              <li
                key={idx}
                className="directory"
                onClick={() => toggleFoldDirectory(file)}
              >
                {file.name}
              </li>
              {file.isFold ? null : listMaker(file)}
            </>
          ) : (
            <li key={idx} className="file" onClick={() => onFileClick(file)}>
              {file.name}
            </li>
          )
        )}
      </ul>
    );
  }

  return <div className="layout-left">{listMaker(mainDirectory)}</div>;
}

////////////////////// INTERNAL //////////////////////
class MarkData {
  constructor({
    styleClass = null,
    pattern = "",
    tag = "",
    isDouble = false,
    leftPatternBonus = 0,
    applyEffectOnPattern = false,
    lineData = false,
    imgData = null,
    styleClassHTML = null,
  }) {
    this.stylePrefix = "editor-";
    this.styleClass = styleClass === null ? this.stylePrefix + tag : styleClass;
    this.pattern = pattern;
    this.tag = tag;
    this.isDouble = isDouble;
    this.leftPatternBonus = leftPatternBonus;
    this.applyEffectOnPattern = applyEffectOnPattern;
    this.lineData = lineData;
    this.imgData = imgData;
    this.styleClassHTML = styleClassHTML;
  }
  get leftPatternLength() {
    return this.pattern.length + this.leftPatternBonus;
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

class EditorState {
  constructor(text = "", cursorPosition = new TextPosition()) {
    this.text = text;
    this.cursorPosition = cursorPosition;
  }
}

const markDataDBSingle = [
  new MarkData({
    pattern: "#",
    tag: "h1",
    applyEffectOnPattern: true,
    leftPatternBonus: 1,
  }),
  new MarkData({
    pattern: "##",
    tag: "h2",
    applyEffectOnPattern: true,
    leftPatternBonus: 1,
  }),
  new MarkData({
    pattern: "###",
    tag: "h3",
    applyEffectOnPattern: true,
    leftPatternBonus: 1,
  }),
  new MarkData({
    pattern: "####",
    tag: "h4",
    applyEffectOnPattern: true,
    leftPatternBonus: 1,
  }),
  new MarkData({
    pattern: "#####",
    tag: "h5",
    applyEffectOnPattern: true,
    leftPatternBonus: 1,
  }),
  new MarkData({
    pattern: "######",
    tag: "h6",
    applyEffectOnPattern: true,
    leftPatternBonus: 1,
  }),
  new MarkData({
    pattern: ">",
    tag: "blockquote",
    applyEffectOnPattern: true,
    leftPatternBonus: 1,
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
});
const markDataDBCodeBlockPattern = "```";
const markDataDBUList = new MarkData({
  tag: "ul",
});
const markDataDBUListItem = new MarkData({
  pattern: "-",
  tag: "li",
});
const markDataDBOList = new MarkData({
  tag: "ol",
});
const markDataDBOListItem = new MarkData({
  pattern: "1.",
  tag: "li",
});
const markDataDBTableBasis = new MarkData({
  pattern: "|",
});
const markDataDBTable = new MarkData({
  tag: "table",
});
const markDataDBThead = new MarkData({
  tag: "thead",
});
const markDataDBTbody = new MarkData({
  tag: "tbody",
});
const markDataDBTr = new MarkData({
  tag: "tr",
});
const markDataDBTd = new MarkData({
  tag: "td",
});
const markDataDBTh = new MarkData({
  tag: "th",
});
const markPatternDBComment = new MarkData({
  styleClass: "editor-comment",
  pattern: "\\",
  tag: "span",
});
const htmlCodeBlockClass = "code-block";

function createRangeMarkList(textContent) {
  const [resultEditorList, resultHTMLList] = [[], []];
  const lines = textContent.split("\n");
  const applyLinePattern = new Array(lines.length).fill(true);
  const paragraphSep = [-1, lines.length];
  const lineOffsetDB = [0];
  function addMarkData(lo, hi, markData) {
    const range = new MarkRange(lo, hi, markData);
    resultEditorList.push(range);
    resultHTMLList.push(range);
  }
  for (let row = 1; row < lines.length; row++) {
    lineOffsetDB[row] = lineOffsetDB[row - 1] + lines[row - 1].length + 1;
  }

  function scanLargeCodeBlock() {
    let prevRow = -1;
    for (let row = 0; row < lines.length; row++) {
      const line = lines[row];
      const pattern = markDataDBCodeBlockPattern;
      const offset = lineOffsetDB[row];
      if (line === pattern) {
        if (prevRow === -1) {
          prevRow = row;
        } else {
          const prevOffset = lineOffsetDB[prevRow];
          resultHTMLList.push(
            new MarkRange(prevOffset, offset + line.length, markDataDBCodeBlock)
          );
          resultHTMLList.push(
            new MarkRange(
              prevOffset,
              offset + line.length,
              new MarkData({ tag: "pre", styleClassHTML: htmlCodeBlockClass })
            )
          );
          function addPattern(p) {
            addMarkData(p, p + 3, new MarkData({ pattern: pattern }));
          }
          addPattern(prevOffset);
          addPattern(offset);
          for (let r = prevRow; r <= row; r++) {
            paragraphSep.push(r);
          }
          for (let r = prevRow + 1; r < row; r++) {
            resultEditorList.push(
              new MarkRange(
                lineOffsetDB[r],
                lineOffsetDB[r] + lines[r].length,
                markDataDBCodeBlock
              )
            );
          }
          applyLinePattern.fill(false, prevRow, row + 1);
          prevRow = -1;
        }
      }
    }
  }
  scanLargeCodeBlock();

  function scanListPattern() {
    const usedLine = new Array(lines.length).fill(false);
    const listData = [markDataDBUList, markDataDBOList];
    const listItem = [markDataDBUListItem, markDataDBOListItem];
    let row = 0;
    function getItemPattern(type, order) {
      return type === 1 ? `${order}.` : listItem[type].pattern;
    }
    function detectListPattern(depth, type, order = 1) {
      const line = lines[row];
      const pattern = getItemPattern(type, order);
      function detectTap() {
        let ok = true;
        for (let i = 0; i < depth; i++) {
          ok = ok && line[i] === "\t";
        }
        return ok;
      }
      if (depth + pattern.length < line.length) {
        const lineSeg = line.substring(depth, depth + pattern.length);
        const space = line[depth + pattern.length].charCodeAt();
        return (
          pattern === lineSeg &&
          (space === 32 || space === 160) &&
          applyLinePattern[row] &&
          detectTap()
        );
      }
      return false;
    }
    function scanLine(depth, type) {
      const listLo = row;
      let innerListWeight = 0;
      function applyResult() {
        const listHi = --row;
        resultHTMLList.push(
          new MarkRange(
            lineOffsetDB[listLo],
            lineOffsetDB[listHi] + lines[listHi].length,
            listData[type]
          )
        );
        for (let r = listLo; r <= listHi; r++) {
          if (!usedLine[r]) {
            addMarkData(
              lineOffsetDB[r],
              lineOffsetDB[r] + lines[r].length,
              new MarkData({
                pattern: getItemPattern(type, r - listLo + 1),
                tag: listItem[type].tag,
                leftPatternBonus: depth + 1,
              })
            );
            usedLine[r] = true;
            paragraphSep.push(r);
          }
        }
      }
      for (; row < lines.length; row++) {
        let isNewList = false;
        for (let t = 0; t < listData.length; t++) {
          if (detectListPattern(depth + 1, t)) {
            innerListWeight += scanLine(depth + 1, t);
            isNewList = true;
          }
        }
        if (
          !isNewList &&
          !detectListPattern(depth, type, row - listLo + 1 - innerListWeight)
        ) {
          applyResult();
          return row - listLo + 1;
        }
      }
      applyResult();
      return row - listLo + 1;
    }
    for (; row < lines.length; row++) {
      for (let t = 0; t < listData.length; t++) {
        if (detectListPattern(0, t)) {
          scanLine(0, t);
        }
      }
    }
  }
  scanListPattern();

  function scanTablePattern() {
    function getTdFromCenter(row) {
      if (applyLinePattern[row]) {
        const items = lines[row].split(markDataDBTableBasis.pattern);
        if (items.length > 1) {
          let ok = items[0] === "" && items[items.length - 1] === "";
          for (let i = 1; i < items.length - 1; i++) {
            ok = ok && items[i] === "---";
          }
          if (ok) {
            return items.length - 2;
          }
        }
      }
      return 0;
    }
    function detectRowIntegrity(row, td) {
      if (applyLinePattern[row]) {
        const items = lines[row].split(markDataDBTableBasis.pattern);
        if (items.length > 1) {
          return (
            items[0] === "" &&
            items[items.length - 1] === "" &&
            items.length - 2 === td
          );
        }
      }
      return false;
    }
    function getBodyHeight(base, td) {
      let row = base;
      for (; row < lines.length; row++) {
        if (!detectRowIntegrity(row, td)) {
          break;
        }
      }
      return row - base;
    }
    function applyResult(baseRow, td, bodyHeight) {
      const tableLo = baseRow - 1;
      const tableHi = baseRow + bodyHeight;
      function addLineToHTML(lo, hi, data) {
        resultHTMLList.push(
          new MarkRange(
            lineOffsetDB[lo],
            lineOffsetDB[hi] + lines[hi].length,
            data
          )
        );
      }
      addLineToHTML(tableLo, tableHi, markDataDBTable);
      addLineToHTML(tableLo, tableLo, markDataDBThead);
      addLineToHTML(baseRow, tableHi, markDataDBTbody);
      for (let row = tableLo; row <= tableHi; row++) {
        if (row === baseRow) {
          continue;
        }
        paragraphSep.push(row);
        addLineToHTML(row, row, markDataDBTr);
        const items = lines[row].split(markDataDBTableBasis.pattern);
        let col = lineOffsetDB[row] + 1;
        for (let i = 1; i < items.length - 1; i++) {
          const markData = row === tableLo ? markDataDBTh : markDataDBTd;
          resultHTMLList.push(
            new MarkRange(col, col + items[i].length, markData)
          );
          col += items[i].length + 1;
        }
      }
      for (let row = tableLo; row <= tableHi; row++) {
        if (row === baseRow) {
          addMarkData(
            lineOffsetDB[row],
            lineOffsetDB[row] + lines[row].length,
            new MarkData({ pattern: lines[row] })
          );
          continue;
        }
        const regex = /\|/g;
        let match;
        while ((match = regex.exec(lines[row])) !== null) {
          const pos = lineOffsetDB[row] + match.index;
          addMarkData(pos, pos + 1, markDataDBTableBasis);
        }
      }
    }
    for (let row = 1; row < lines.length; row++) {
      const td = getTdFromCenter(row);
      if (td > 0) {
        const isHead = detectRowIntegrity(row - 1, td);
        const bodyHeight = getBodyHeight(row + 1, td);
        if (bodyHeight > 0 && isHead) {
          applyResult(row, td, bodyHeight);
          row += bodyHeight;
        }
      }
    }
  }
  scanTablePattern();

  function scanDoublePatternInLine(row) {
    const line = lines[row];
    const stk = [];
    class Item {
      constructor(pos, markData) {
        this.pos = pos;
        this.markData = markData;
      }
    }
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
        if (item.markData.tag === "code") {
          resultHTMLList.push(
            new MarkRange(
              lo,
              hi,
              new MarkData({ tag: "span", styleClassHTML: htmlCodeBlockClass })
            )
          );
        }
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
          const lo = i + lineOffsetDB[row];
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
          const item = new Item(i + lineOffsetDB[row], data);
          if (!findMatch(item)) {
            stk.push(item);
          }
          i += patternLength - 1;
          break;
        }
      }
    }
  }
  function scanOnlyLinePatternInLine(row) {
    const line = lines[row];
    for (const data of markDataDBOnlyLine) {
      const patternLength = data.pattern.length;
      const lineSeg = line.substring(0, patternLength);
      if (data.pattern === lineSeg) {
        addMarkData(lineOffsetDB[row], lineOffsetDB[row] + line.length, data);
        paragraphSep.push(row);
      }
    }
  }
  function scanSinglePatternInLine(row) {
    const line = lines[row];
    for (const data of markDataDBSingle) {
      const patternLength = data.pattern.length;
      if (patternLength + 1 <= line.length) {
        const lineSeg = line.substring(0, patternLength);
        const space = line[patternLength].charCodeAt();
        if (data.pattern === lineSeg && (space === 32 || space === 160)) {
          addMarkData(lineOffsetDB[row], lineOffsetDB[row] + line.length, data);
          paragraphSep.push(row);
        }
      }
    }
  }
  function scanImagePatternInLine(row) {
    const line = lines[row];
    if (line[0] !== "!" || line[1] !== "[") {
      return;
    }
    let i = 2;
    for (; i < line.length; i++) {
      if (line[i] === "]") {
        break;
      }
    }
    if (line[i + 1] !== "(") {
      return;
    }
    const centerPos = i;
    for (i += 2; i < line.length; i++) {
      if (line[i] === ")") {
        break;
      }
    }
    if (i !== line.length - 1) {
      return;
    }
    const start = lineOffsetDB[row];
    resultHTMLList.push(
      new MarkRange(
        start,
        start + line.length,
        new MarkData({
          tag: "img",
          imgData: {
            src: line.substring(centerPos + 2, line.length - 1),
            alt: line.substring(2, centerPos),
          },
        })
      )
    );
    addMarkData(
      start,
      start + line.length,
      new MarkData({
        pattern: line,
      })
    );
    paragraphSep.push(row);
  }
  function scanSingleLine(row) {
    scanOnlyLinePatternInLine(row);
    scanSinglePatternInLine(row);
    scanImagePatternInLine(row);
    scanDoublePatternInLine(row);
    if (lines[row].length === 0) {
      paragraphSep.push(row);
    }
  }
  function scanAllLine() {
    for (let row = 0; row < lines.length; row++) {
      const lineOffset = lineOffsetDB[row];
      const line = lines[row];
      if (applyLinePattern[row]) {
        scanSingleLine(row);
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
    }
  }
  scanAllLine();

  function scanParagraphPattern() {
    paragraphSep.sort((a, b) => a - b);
    for (let p = 0; p < paragraphSep.length - 1; p++) {
      const [rowLo, rowHi] = [paragraphSep[p] + 1, paragraphSep[p + 1] - 1];
      if (rowHi - rowLo >= 0) {
        resultHTMLList.push(
          new MarkRange(
            lineOffsetDB[rowLo],
            lineOffsetDB[rowHi] + lines[rowHi].length,
            new MarkData({ tag: "p" })
          )
        );
        for (let r = rowLo; r < rowHi; r++) {
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
        : x.markData.lineData ||
          x.markData.styleClassHTML === htmlCodeBlockClass
        ? -1
        : 1
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

function applyMarkTreeToEditorDOM(markRootNode, DOMRootNode, text, cursorPos) {
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
    for (const markChild of markNode.children) {
      if (lo < markChild.lo) {
        appendTextNode(DOMnode, lo, markChild.lo);
      }
      const childDOMNode = document.createElement(
        markChild.markData.lineData ? "div" : "span"
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
  tempRange.setEnd(range.endContainer, range.endOffset);

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
      if (lo < markChild.lo) {
        appendTextNode(DOMnode, lo, markChild.lo);
      }
      if (markChild.markData.hasTag) {
        const childDOMNode = document.createElement(markChild.markData.tag);
        if (markChild.markData.imgData !== null) {
          childDOMNode.setAttribute("src", markChild.markData.imgData.src);
          childDOMNode.setAttribute("alt", markChild.markData.imgData.alt);
        }
        if (markChild.markData.styleClassHTML !== null) {
          childDOMNode.setAttribute("class", markChild.markData.styleClassHTML);
        }
        addDOMNodeByMarkTree(
          markChild,
          childDOMNode,
          markChild.lo + markChild.markData.leftPatternLength,
          markChild.hi - markChild.markData.rightPatternLength
        );
        DOMnode.appendChild(childDOMNode);
      }
      lo = markChild.hi;
    }
    if (lo < hi) {
      appendTextNode(DOMnode, lo, hi);
    }
  }
  deleteDOMChildren(DOMRootNode);
  addDOMNodeByMarkTree(markRootNode, DOMRootNode, 0, text.length);
}
