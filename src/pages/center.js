import React, { useState, useRef, useEffect } from "react";
import { GlobalData } from "../datas/global-data.js";
import { getCursorPosition } from "../utils/cursor.js";
import {
  applyMarkTreeToEditorDOM,
  applyMarkTreeToHTMLDOM,
} from "../utils/editor.js";
import {
  compatibleLineBreak,
  getLineLengthByRow,
} from "../utils/html.js";
import { createRangeMarkList, createMarkTree } from "../utils/markdown.js";
import { EditorState, TextPosition } from "../datas/class.js";
import "../styles/main.css";
import "../styles/pages-center.css";
import "../styles/editor.css";
import "../styles/html.css";

const global = new GlobalData();

export function Center({ editorFile, onEditorNameUpdate, onEditorTextUpdate }) {
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
      inputChange(
        event.target.innerText,
        event.nativeEvent.inputType === "insertParagraph"
      );
    }
  }

  function handleTitleInputEnd() {
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

  function inputChange(text, isNewLine = false) {
    let newText = compatibleLineBreak(text);
    let cursorPos = getCursorPosition(divEditorRef.current, newText);

    if (isNewLine) {
      const curRowState = global.editorRowStates[cursorPos.row - 1];
      const nextText = curRowState.nextToken;
      if (curRowState.isPlain) {
        if (getLineLengthByRow(cursorPos.row, divEditorRef.current) === 0) {
          const i = cursorPos.offset + cursorPos.row;
          const segLen = curRowState.curToken.length;
          newText =
            newText.slice(0, i - (segLen + 1)) +
            newText.slice(i, newText.length);
          cursorPos.column -= segLen;
          cursorPos.offset -= segLen;
          cursorPos.row--;
        }
      } else if (nextText !== "") {
        if (
          getLineLengthByRow(cursorPos.row - 1, divEditorRef.current) >=
          curRowState.curToken.length
        ) {
          const i = cursorPos.offset + cursorPos.row;
          newText =
            newText.slice(0, i) + nextText + newText.slice(i, newText.length);
          cursorPos.column += nextText.length;
          cursorPos.offset += nextText.length;
        }
      }
    }

    updateEditorDOM(newText, cursorPos);
    updateCursorDisplay(cursorPos);
    onEditorTextUpdate(divEditorRef.current.innerText, divHTMLRef.current);

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
    const [rootMarkEditorNode, rootMarkHTMLNode] = createMarkTree(text);
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
