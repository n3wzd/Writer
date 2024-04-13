import { MarkData } from "./class.js";

export const mathJaxClassName = 'mathJax';

export const markDataDBSingle = [
  new MarkData({
    pattern: "#",
    tag: "h1",
    applyEffectOnPattern: true,
    leftPatternLength: 2,
  }),
  new MarkData({
    pattern: "##",
    tag: "h2",
    applyEffectOnPattern: true,
    leftPatternLength: 3,
  }),
  new MarkData({
    pattern: "###",
    tag: "h3",
    applyEffectOnPattern: true,
    leftPatternLength: 4,
  }),
  new MarkData({
    pattern: "####",
    tag: "h4",
    applyEffectOnPattern: true,
    leftPatternLength: 5,
  }),
  new MarkData({
    pattern: "#####",
    tag: "h5",
    applyEffectOnPattern: true,
    leftPatternLength: 6,
  }),
  new MarkData({
    pattern: "######",
    tag: "h6",
    applyEffectOnPattern: true,
    leftPatternLength: 7,
  }),
  new MarkData({
    pattern: ">",
    tag: "blockquote",
    applyEffectOnPattern: true,
    leftPatternLength: 2,
  }),
];

export const markDataDBDouble = [
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

export const markDataDBOnlyLine = [
  new MarkData({
    pattern: "---",
    tag: "hr",
  }),
];

export const markDataDBCodeBlock = new MarkData({
  tag: "code",
});

export const markDataDBCodeBlockPattern = "```";

export const markDataDBUList = new MarkData({
  tag: "ul",
});

export const markDataDBUListItem = new MarkData({
  pattern: "-",
  tag: "li",
});

export const markDataDBOList = new MarkData({
  tag: "ol",
});

export const markDataDBOListItem = new MarkData({
  pattern: "1.",
  tag: "li",
});

export const markDataDBTableBasis = new MarkData({
  pattern: "|",
});

export const markDataDBTable = new MarkData({
  tag: "table",
});

export const markDataDBThead = new MarkData({
  tag: "thead",
});

export const markDataDBTbody = new MarkData({
  tag: "tbody",
});

export const markDataDBTr = new MarkData({
  tag: "tr",
});

export const markDataDBTd = new MarkData({
  tag: "td",
});

export const markDataDBTh = new MarkData({
  tag: "th",
});

export const markPatternDBComment = new MarkData({
  styleClass: "editor-comment",
  pattern: "\\",
  tag: "span",
});

export const htmlCodeBlockClass = "code-block";

export const markDataDBimg = new MarkData({
  tag: "img",
});

export const markDataDBlink = new MarkData({
  tag: "a",
});
