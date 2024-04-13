export function compatibleLineBreak(text) {
  const newlineCount = (text.match(/\n/g) || []).length;
  const tempText = newlineCount % 2 === 1 ? text.replace(/\n$/, "") : text;
  return tempText.replace(/\n\n/g, "\n");
}

export function getLineLengthByRow(row, rootDOMNode) {
  const newLines = compatibleLineBreak(rootDOMNode.innerText).split("\n");
  return newLines[row].length;
}

export function escapeHtml(text) {
  return text.replace(/[&<>"'`]/g, function (match) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "`": "&#x60;",
    }[match];
  });
}
