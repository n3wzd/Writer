import React, { useRef, useState, useEffect } from "react";
import { FileManager } from "./datas/file-manager.js";
import { Center } from "./pages/center.js";
import { Left } from "./pages/left.js";
import { Right } from "./pages/right.js";
import "./App.css";

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

  function handleEditorTextUpdate(text, htmlRef) {
    editorFile.text = text;
    editorFile.htmlRef = htmlRef;
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
      <Right editorFile={editorFile} onFileUpdate={handleFileUpdate} />
    </div>
  );
}
