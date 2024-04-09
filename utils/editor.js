import { setCursorPosition } from "./cursor.js";

export function applyMarkTreeToEditorDOM(
  markRootNode,
  DOMRootNode,
  text,
  cursorPos
) {
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

export function applyMarkTreeToHTMLDOM(markRootNode, DOMRootNode, text) {
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

function deleteDOMChildren(node) {
  while (node.firstChild) {
    deleteDOMChildren(node.firstChild);
    node.removeChild(node.firstChild);
  }
}
