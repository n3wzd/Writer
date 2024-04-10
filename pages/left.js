import React, { useState, useRef, useEffect } from "react";
import {
  fileIcon,
  folderIcon,
  fileAddIcon,
  folderAddIcon,
  deleteIcon,
  editIcon,
} from "../components/icons.js";
import { MenuTabButton } from "../components/menu-tab-button.js";
import { FileManager } from "../datas/file-manager.js";

const fileManager = new FileManager();

export function Left({ editorFile, onFileUpdate, onFileRename }) {
  const [state, setState] = useState(true);
  const [menuVisible, setMenuVisible] = useState(true);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [popupVisible, setPopupVisible] = useState(false);
  const [selectedFileId, setselectedFileId] = useState();
  const [renameVisible, setRenameVisible] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const renameInputRef = useRef();

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
    setselectedFileId(id);
    setState(!state);
  }

  function closeContextMenu() {
    setPopupVisible(false);
  }

  function handleFileUpdate(newFileId) {
    setselectedFileId(newFileId);
    onFileUpdate(fileManager.getFileById(newFileId));
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
    handleFileUpdate(newFileId);
    closeContextMenu();
  }

  function popupRenameFile() {
    showRenameInput(selectedFileId);
    closeContextMenu();
  }

  function popupDeleteFile() {
    fileManager.deleteFile(selectedFileId);
    setState(!state);
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

  const handleDragStart = (event, id) => {
    setDraggedItem(id);
    event.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = event => {
    event.preventDefault();
  };

  const handleDrop = (event, id) => {
    event.preventDefault();
    fileManager.moveFile(draggedItem, id);
    setDraggedItem(null);
  };

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
              : () => handleFileUpdate(file.id)
          }
          onContextMenu={(event) => showContextMenu(event, file)}
          style={{ paddingLeft: depth * 15 }}
          tabIndex={0}
          onKeyDown={(event) => handleListHotKeyDown(event, file)}
          draggable
          onDragStart={event => handleDragStart(event, file.id)}
          onDragOver={handleDragOver}
          onDrop={event => handleDrop(event, file.id)}
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
        className={
          "layout-left " + (menuVisible ? "menuAppear" : "menuDisappear")
        }
        onContextMenu={(event) => showContextMenu(event)}
      >
        <div className="button-container">
          <button onClick={() => popupAddFile(true)}>{fileAddIcon}</button>
          <button onClick={() => popupAddFile(false)}>{folderAddIcon}</button>
          <button onClick={canSetFile() ? popupDeleteFile : null}>
            {deleteIcon}
          </button>
          <button onClick={canSetFile() ? popupRenameFile : null}>
            {editIcon}
          </button>
        </div>
        {listMaker(fileManager.rootDir)}
      </div>
      {MenuTabButton(menuVisible, toggleMenuVisible, 90)}
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
