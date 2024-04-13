import React, { useState } from "react";
import { MenuTabButton } from "../components/menu-tab-button.js";
import { exportIcon, importIcon } from "../components/icons.js";
import { compatibleLineBreak, escapeHtml } from "../utils/html.js";
import { FileManager } from "../datas/file-manager.js";
import "../styles/main.css";
import "../styles/pages-right.css";

const fileManager = new FileManager();

export function Right({ editorFile, onFileUpdate }) {
  const [menuVisible, setMenuVisible] = useState(true);

  function toggleMenuVisible() {
    setMenuVisible(!menuVisible);
  }

  function downloadFile(type, data, fileName) {
    const blob = new Blob([data], {
      type: type,
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  function exportMarkdownFile() {
    downloadFile(
      "text/plain",
      compatibleLineBreak(editorFile.text),
      `${editorFile.name}.md`
    );
  }

  function exportHTMLFile() {
    const body = editorFile.htmlRef.outerHTML
      .replace(
        /(<\/(?:|p|blockquote|ul|ol|li|h1|h2|h3|h4|h5|h6|pre|table|thead|tbody|tr)>)/g,
        "$1\n"
      )
      .replace(/(<(?:pre[^>]+|ul|ol|table|thead|tbody)>)/g, "$1\n");
    const htmlData = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${escapeHtml(
      editorFile.name
    )}</title>\n<link rel="stylesheet" href="App.css"/>\n</head>\n<body class="writer">\n${body}</body>\n</html>`;
    downloadFile("text/html", htmlData, `${editorFile.name}.html`);
  }

  function importMarkdownFile() {
    const fileInput = document.createElement("input");
    fileInput.setAttribute("type", "file");
    fileInput.setAttribute("accept", ".txt, .md");
    fileInput.addEventListener("change", function (event) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = function (event) {
        const newFileId = fileManager.addFile(null, file.name);
        fileManager.updateFileText(newFileId, event.target.result);
        onFileUpdate(fileManager.getFileById(newFileId));
      };
      reader.readAsText(file);
      document.body.removeChild(fileInput);
    });
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  function getLi(onClick, icon, title, subtitle) {
    return (
      <li onClick={onClick}>
        {icon}
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </li>
    );
  }

  return (
    <>
      {MenuTabButton(menuVisible, toggleMenuVisible, 270)}
      <div
        className={
          "layout-right " + (menuVisible ? "menuAppear" : "menuDisappear")
        }
      >
        <ul>
          {getLi(
            exportMarkdownFile,
            exportIcon,
            "Export as Markdown",
            "Save the md file."
          )}
          {getLi(
            exportHTMLFile,
            exportIcon,
            "Export as HTML",
            "Generate an HTML page."
          )}
          {getLi(
            importMarkdownFile,
            importIcon,
            "Import Markdown",
            "Import the md file."
          )}
        </ul>
      </div>
    </>
  );
}
