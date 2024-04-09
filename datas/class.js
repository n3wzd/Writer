export class MarkData {
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

export class MarkRange {
  constructor(lo, hi, markData) {
    this.lo = lo;
    this.hi = hi;
    this.markData = markData;
  }
}

export class MarkTreeNode {
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

export class TextPosition {
  constructor(row = 0, column = 0, offset = 0) {
    this.row = row;
    this.column = column;
    this.offset = offset;
  }
}

export class EditorState {
  constructor(text = "", cursorPosition = new TextPosition()) {
    this.text = text;
    this.cursorPosition = cursorPosition;
  }
}

export class RowState {
  constructor(curToken = "", nextToken = "", isPlain = false) {
    this.curToken = curToken;
    this.nextToken = nextToken;
    this.isPlain = isPlain;
  }
}
