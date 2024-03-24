import React, { useRef, useState, useEffect } from "react";
import "./App.css";

class FileManager {
  constructor() {
    this.fileIdGenerator = 0;
    this.rootDir = this.createDirectory();
    this.dummyFile = this.createFile();
    this.fileMap = new Map();
    this.fileCount = 1;
    this.rootDir.files = [this.createFile("Untitled", "")];
  }

  generateFileID() {
    return this.fileIdGenerator++;
  }

  getFileById(id) {
    const file = this.fileMap.get(id);
    return file === undefined ? null : file;
  }

  isFileExists(id) {
    return this.getFileById(id) !== null;
  }

  createFile(name = "", text = "", parentDir = null) {
    const file = {
      id: this.generateFileID(),
      name: name,
      parentDir: parentDir === null ? this.rootDir : parentDir,
      text: text,
    };
    this.registerFileToMap(file);
    return file;
  }

  createDirectory(name = "", parentDir = null) {
    const file = {
      id: this.generateFileID(),
      name: name,
      parentDir: parentDir === null ? this.rootDir : parentDir,
      files: [],
      isFold: false,
    };
    this.registerFileToMap(file);
    return file;
  }

  registerFileToMap(file) {
    if (this.fileMap) {
      this.fileMap.set(file.id, file);
    }
  }

  isDirectory(id) {
    return this.getFileById(id).files !== undefined;
  }

  toggleDirectoryFold(id) {
    const dir = this.getFileById(id);
    dir.isFold = !dir.isFold;
  }

  setDirectoryFold(id, value) {
    const dir = this.getFileById(id);
    dir.isFold = value;
  }

  renameFile(id, name) {
    this.getFileById(id).name = name;
  }

  updateFileText(id, text) {
    this.getFileById(id).text = text;
  }

  addFile(parentId, name) {
    const file = this.createFile(name, "", this.getFileById(parentId));
    file.parentDir.files.push(file);
    this.fileCount++;
    return file.id;
  }

  addDirectory(parentId, name) {
    const file = this.createDirectory(name, this.getFileById(parentId));
    file.parentDir.files.push(file);
    return file.id;
  }

  deleteFile(id) {
    const file = this.getFileById(id);
    if (this.isDirectory(file.id)) {
      for (const subFile of file.files) {
        this.deleteFile(subFile.id);
      }
    } else {
      this.fileCount--;
    }
    file.parentDir.files = file.parentDir.files.filter((item) => item !== file);
    this.fileMap.delete(id);
  }

  getNearestDir(id) {
    const file = this.getFileById(id);
    return file === null
      ? null
      : this.isDirectory(file.id)
      ? file.id
      : file.parentDir.id;
  }

  resetDummyFile() {
    this.dummyFile.name = "";
    this.dummyFile.text = "";
  }
}

const fileManager = new FileManager();

export default function App() {
  const [state, setState] = useState(true);
  const [editorFile, setEditorFile] = useState(fileManager.rootDir.files[0]);

  function handleFileUpdate(file) {
    if (
      fileManager.isFileExists(file.id) &&
      !fileManager.isDirectory(file.id)
    ) {
      setEditorFile(file);
    }
  }

  function handleFileRename() {
    setState(!state);
  }

  function handleEditorNameUpdate(name) {
    editorFile.name = name;
    setState(!state);
  }

  function handleEditorTextUpdate(text) {
    editorFile.text = text;
  }

  return (
    <div className="layout-main">
      <Left
        editorFile={editorFile}
        onFileUpdate={handleFileUpdate}
        onFileRename={handleFileRename}
      />
      <Center
        editorFile={editorFile}
        onEditorNameUpdate={handleEditorNameUpdate}
        onEditorTextUpdate={handleEditorTextUpdate}
      />
    </div>
  );
}

function Center({ editorFile, onEditorNameUpdate, onEditorTextUpdate }) {
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

  function handleTitleInputEnd(event) {
    onEditorNameUpdate(divTitleRef.current.value);
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
    onEditorTextUpdate(divEditorRef.current.innerText);

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
      <input
        className="layout-center-title"
        ref={divTitleRef}
        onBlur={handleTitleInputEnd}
        type="text"
      />
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

function Left({ editorFile, onFileUpdate, onFileRename }) {
  const [state, setState] = useState(true);
  const [menuVisible, setMenuVisible] = useState(true);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedFileId, setselectedFileId] = useState();
  const [renameVisible, setRenameVisible] = useState(false);
  const renameInputRef = useRef();

  const fileIcon = (
    <svg width="18" height="18" viewBox="4 -6 14 22">
      <path
        d="M11 0H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM7 1v4H3V1h4zm6 12H3V6h10v7z"
        fill="#777777"
      />
    </svg>
  );
  const folderIcon = (
    <svg width="18" height="18" viewBox="4 -6 14 22">
      <path
        fill="#777777"
        d="M14.5 3H5.414l-1.707-1.707A.996.996 0 0 0 3.5 1H2.5C1.67157 1 1 1.67157 1 2.5v10c0 .8284.67157 1.5 1.5 1.5h11c.8284 0 1.5-.6716 1.5-1.5v-9c0-.2761-.2239-.5-.5-.5z"
      />
    </svg>
  );

  useEffect(() => {
    if (renameInputRef.current) {
      const file = fileManager.getFileById(selectedFileId);
      renameInputRef.current.value = file === null ? "" : file.name;
      renameInputRef.current.focus();
    }
  });

  function toggleMenuVisible() {
    setMenuVisible(!menuVisible);
  }

  function toggleDirectoryFold(id) {
    fileManager.toggleDirectoryFold(id);
    setState(!state);
  }

  function closeContextMenu() {
    setPopupVisible(false);
  }

  function popupAddFile(isFile) {
    const parentId = fileManager.getNearestDir(selectedFileId);
    if (
      fileManager.isFileExists(parentId) &&
      fileManager.isDirectory(parentId)
    ) {
      fileManager.setDirectoryFold(parentId, false);
    }
    const newFileId = isFile
      ? fileManager.addFile(parentId, "New File")
      : fileManager.addDirectory(parentId, "New Folder");
    showRenameInput(newFileId);
    onFileUpdate(newFileId);
    closeContextMenu();
  }

  function popupRenameFile() {
    showRenameInput(selectedFileId);
    closeContextMenu();
  }

  function popupDeleteFile() {
    fileManager.deleteFile(selectedFileId);
    closeContextMenu();
  }

  function showContextMenu(event, file = fileManager.rootDir) {
    event.preventDefault();
    event.stopPropagation();
    setPopupPosition({ x: event.clientX, y: event.clientY });
    setPopupVisible(true);
    setselectedFileId(file.id);
    window.addEventListener("click", closeContextMenu, { once: true });
  }

  function preventCloseContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  function showRenameInput(fileId) {
    setRenameVisible(true);
    setselectedFileId(fileId);
  }

  function submitRenameInput(event) {
    const newName = event.target.value;
    if (newName !== "") {
      fileManager.renameFile(selectedFileId, event.target.value);
      onFileRename();
    }
    setRenameVisible(false);
  }

  function handleListHotKeyDown(event, file) {
    if (event.key === "Delete" || event.key === "Backspace") {
      fileManager.deleteFile(file.id);
      setState(!state);
    } else if (event.key === "F2") {
      showRenameInput(file.id);
    }
  }

  function getLi(file, depth) {
    const isDir = fileManager.isDirectory(file.id);
    return (
      <>
        <li
          key={file.id}
          className={editorFile.id === file.id ? "selected" : ""}
          onClick={
            isDir
              ? () => toggleDirectoryFold(file.id)
              : () => onFileUpdate(file)
          }
          onContextMenu={(event) => showContextMenu(event, file)}
          style={{ paddingLeft: depth * 15 }}
          tabIndex={0}
          onKeyDown={(event) => handleListHotKeyDown(event, file)}
        >
          {isDir ? folderIcon : fileIcon}
          {selectedFileId === file.id && renameVisible ? (
            <input
              type="text"
              className="text-input"
              ref={renameInputRef}
              onBlur={submitRenameInput}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  submitRenameInput(event);
                }
              }}
              style={{ width: 200 - depth * 15 }}
            ></input>
          ) : (
            <span>{file.name}</span>
          )}
        </li>
        {!isDir || file.isFold ? null : listMaker(file, depth + 1)}
      </>
    );
  }

  function canSetFile() {
    return fileManager.isFileExists(selectedFileId);
  }

  function listMaker(dir, depth = 1) {
    return <ul>{dir.files.map((file) => getLi(file, depth))}</ul>;
  }
  return (
    <>
      <div
        className="layout-left"
        onContextMenu={(event) => showContextMenu(event)}
      >
        {menuVisible && (
          <div className="layout-left-menu">
            {listMaker(fileManager.rootDir)}
          </div>
        )}
        <button className="layout-tab-button" onClick={toggleMenuVisible}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            style={{
              transform: menuVisible ? "rotate(90deg)" : "rotate(270deg)",
            }}
          >
            <path fill="#777777" d="M7 10l6 6 6-6z"></path>
          </svg>
        </button>
      </div>
      {popupVisible && (
        <div
          className="popup-menu"
          style={{ left: popupPosition.x, top: popupPosition.y }}
        >
          <ul>
            <li onClick={() => popupAddFile(true)}>New File</li>
            <li onClick={() => popupAddFile(false)}>New Folder</li>
            <hr />
            <li
              className={canSetFile() ? "" : "disabled"}
              onClick={canSetFile() ? popupRenameFile : preventCloseContextMenu}
            >
              Rename
            </li>
            <li
              className={canSetFile() ? "" : "disabled"}
              onClick={canSetFile() ? popupDeleteFile : preventCloseContextMenu}
            >
              Delete
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

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
    function applyResult(baseRow, bodyHeight) {
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
          applyResult(row, bodyHeight);
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
