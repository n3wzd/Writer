import {
  markDataDBSingle,
  markDataDBDouble,
  markDataDBOnlyLine,
  markDataDBCodeBlock,
  markDataDBCodeBlockPattern,
  markDataDBUList,
  markDataDBUListItem,
  markDataDBOList,
  markDataDBOListItem,
  markDataDBTableBasis,
  markDataDBTable,
  markDataDBThead,
  markDataDBTbody,
  markDataDBTr,
  markDataDBTd,
  markDataDBTh,
  markPatternDBComment,
  htmlCodeBlockClass,
  markDataDBimg,
  markDataDBlink,
} from "../datas/markdown.js";
import { GlobalData } from "../datas/global-data.js";
import { MarkData, MarkRange, MarkTreeNode, RowState } from "../datas/class.js";

const global = new GlobalData();

export function createMarkTree(textContent) {
  const [resultEditorList, resultHTMLList] = [[], []];
  const lines = textContent.split("\n");
  const applyLinePattern = new Array(lines.length).fill(true);
  const ignoreStringPattern = new Array(lines.length).fill([]);
  const paragraphSep = [-1, lines.length];
  const lineOffsetDB = [0];
  function addMarkData(lo, hi, markData) {
    const range = new MarkRange(lo, hi, markData);
    resultEditorList.push(range);
    resultHTMLList.push(range);
  }
  for (let row = 1; row < lines.length; row++) {
    lineOffsetDB[row] = lineOffsetDB[row - 1] + lines[row - 1].length + 1;
    global.editorRowStates[row] = new RowState();
  }
  global.editorRowStates[0] = new RowState();

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
          paragraphSep.push(prevRow);
          paragraphSep.push(row);
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
      function getTabByDepth() {
        let tab = "";
        for (let i = 0; i < depth; i++) {
          tab += "\t";
        }
        return tab;
      }
      function applyResult() {
        const listHi = --row;
        let curOrder = 0;
        resultHTMLList.push(
          new MarkRange(
            lineOffsetDB[listLo],
            lineOffsetDB[listHi] + lines[listHi].length,
            listData[type]
          )
        );
        for (let r = listLo; r <= listHi; r++) {
          if (!usedLine[r]) {
            curOrder++;
            const curPattern = getItemPattern(type, curOrder);
            addMarkData(
              lineOffsetDB[r],
              lineOffsetDB[r] + lines[r].length,
              new MarkData({
                pattern: curPattern,
                tag: listItem[type].tag,
                leftPatternLength: depth + curPattern.length + 1,
              })
            );
            usedLine[r] = true;
            paragraphSep.push(r);
            global.editorRowStates[r] = new RowState(
              getTabByDepth() + curPattern + " ",
              getTabByDepth() + getItemPattern(type, curOrder + 1) + " ",
              lines[r].length === (getTabByDepth() + curPattern).length + 1
            );
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
        paragraphSep.push(row);
        if (row === baseRow) {
          continue;
        }
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

  function scanImagePatternInLine(row) {
    const line = lines[row];
    const regex = /\!\[([^\]]+)\]\(([^)]+)\)/g;
    let match = null;
    while((match = regex.exec(line)) !== null) {
      const start = lineOffsetDB[row];
      addMarkData(
        start + match.index, start + match.index + match[0].length,
        new MarkData({
          leftPatternLength: 2,
          rightPatternLength: 3 + match[2].length,
          tag: markDataDBimg.tag,
          htmlAttribute: [
            {name: 'alt', value: match[1]},
            {name: 'src', value: match[2]},
          ]
        })
      );
      ignoreStringPattern[row].push({ lo: match.index, hi: match.index + match[0].length });
    }
  }
  function scanLinkPatternInLine(row) {
    const line = lines[row];
    const regex = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;
    let match = null;
    while((match = regex.exec(line)) !== null) {
      const start = lineOffsetDB[row];
      addMarkData(
        start + match.index, start + match.index + match[0].length,
        new MarkData({
          leftPatternLength: 1,
          rightPatternLength: 3 + match[2].length,
          tag: markDataDBlink.tag,
          htmlAttribute: [
            {name: 'title', value: match[1]}, 
            {name: 'href', value: match[2]},
          ]
        })
      );
      ignoreStringPattern[row].push({ lo: match.index, hi: match.index + match[0].length });
    }
  }
  function scanDoublePatternInLine(row) {
    const line = lines[row];
    const stk = [];
    const skipRange = new Array(line.length).fill(false);
    class Item {
      constructor(pos, markData) {
        this.pos = pos;
        this.markData = markData;
      }
    }
    function createSkipRange() {
      for (const range of ignoreStringPattern) {
        skipRange.fill(true, range.lo, range.hi);
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
        if (item.markData.tag === "code") {
          function eraseInterTag(resStk) {
            let i = resStk.length - 1;
            while (resStk.length > 0 && lo < resStk[i].lo) {
              resStk.pop();
              i--;
            }
          }
          eraseInterTag(resultEditorList);
          eraseInterTag(resultHTMLList);
          resultHTMLList.push(
            new MarkRange(
              lo,
              hi,
              new MarkData({ tag: "span", styleClassHTML: htmlCodeBlockClass })
            )
          );
        }
        addMarkData(lo, hi, item.markData);
        while (idx < stk.length) {
          stk.pop();
        }
      }
      return matched;
    }

    createSkipRange();
    for (let i = 0; i < line.length; i++) {
      if(skipRange[i]){
        continue;
      }
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
          if (data.tag === "blockquote") {
            global.editorRowStates[row] = new RowState(
              data.pattern + " ",
              data.pattern + " ",
              patternLength + 1 === line.length
            );
          }
        }
      }
    }
  }
  function scanSingleLine(row) {
    scanOnlyLinePatternInLine(row);
    scanSinglePatternInLine(row);
    scanImagePatternInLine(row);
    scanLinkPatternInLine(row);
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
            new MarkData({ tag: "p", lineData: true })
          )
        );
        for (let r = rowLo; r < rowHi; r++) {
          const pos = lineOffsetDB[r] + lines[r].length;
          resultHTMLList.push(
            new MarkRange(pos, pos + 1, new MarkData({ tag: "br" }))
          );
        }
      }
    }
  }
  scanParagraphPattern();

  sortList(resultEditorList);
  sortList(resultHTMLList);
  return [linkMarkTree(resultEditorList, textContent), linkMarkTree(resultHTMLList, textContent)];
}

function sortList(list) {
  list.sort((x, y) =>
    x.lo !== y.lo
      ? x.lo - y.lo
      : x.hi !== y.hi
      ? y.hi - x.hi
      : x.markData.lineData || x.markData.styleClassHTML === htmlCodeBlockClass
      ? -1
      : 1
  );
}

export function linkMarkTree(markList, text) {
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
