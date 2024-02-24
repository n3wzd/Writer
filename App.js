import React, { useState, useRef, useEffect } from 'react';

const defaultTitle = 'New Document';

export default function App() {
  return <Center />;
}

function Center() {
  return (
    <>
	  <CenterTitle />
      <CenterContent />
    </>
  );
}

function CenterTitle() {
  let text = defaultTitle;
  return <div contentEditable='true'><h1>{text}</h1></div>
}

function CenterContent() {
	const divEditorRef = useRef();
	
	const handleInputChange = (event) => {
		let text = compatibleLineBreakToChrome(event.target.innerText);
		if(text === '\n') {
			if (event.nativeEvent.inputType === "deleteContentBackward" || event.nativeEvent.inputType === "deleteContentForward") {
				deleteDOMChildren(divEditorRef.current);
				return;
			}
		}
		
		if(true) {
			const searchedMarkList = createRangeMarkList(text);
			const rootMarkNode = createMarkTree(searchedMarkList, text);
			const rootDOMNode = divEditorRef.current;
			applyMarkTreeToEditorDOM(rootMarkNode, rootDOMNode, text);
		}
	};
	
	return (
		<>
			<div
				ref={divEditorRef}
				contentEditable={true}
				onInput={handleInputChange}
				style={{ border: '1px solid #ccc', padding: '8px' }}
			/>
		</>
	);
}

////////////////////// INTERNAL //////////////////////
const patternTitleList = ['# ', '## ', '### ', '#### ', '##### ', '###### '];
const patternOnlyLine = '---';
const patternCodeBlock = '```';
const patternCharList = ['~~', '**', '__', '*', '_', '`'];
const patternComment = '\\';

function convertPatternToTag(pattern) {
	switch(pattern) {
		// case '---': return 'h1';
		// case '```': return 'i';
		case '# ': return 'h1';
		case '## ': return 'h2';
		case '### ': return 'h3';
		case '#### ': return 'h4';
		case '##### ': return 'h5';
		case '###### ': return 'h6';
		case '**': 
		case '_': return 'b';
		case '*': 
		case '__': return 'em';
		case '~~': return 's';
		// case '`': return 'b';
		case 'div': return 'div';
		case 'br': return 'br';
		default: return 'span';
	}
}

class MarkTreeNode {
	constructor(lo, hi, pattern) {
		this.lo = lo;
		this.hi = hi;
		this.pattern = pattern;
		this.children = [];
	}
	
	pushChild(child) {
		this.children.push(child);
	}
	
	get tag() {
		return convertPatternToTag(this.pattern);
	}
	
	get isChildrenEmpty() {
		return this.children.length <= 0;
	}
	get leftmostChildTagPos() {
		return this.isChildrenEmpty ? this.hi : this.children[0].lo;
	}
	get rightmostChildTagPos() {            
		return this.isChildrenEmpty ? this.lo : this.children[this.children.length - 1].hi;
	}
	get leftPattern() {
		switch(this.pattern) {
			case '# ': 
			case '## ':
			case '### ': 
			case '#### ': 
			case '##### ': 
			case '###### ': 
			case '**': 
			case '_': 
			case '*': 
			case '__': 
			case '~~': return this.pattern;
			case 'div': 
			case 'br': 
			default: return '';
		}
	}
	
	get rightPattern() {
		switch(this.pattern) {
			case '# ': 
			case '## ':
			case '### ': 
			case '#### ': 
			case '##### ': 
			case '###### ': return '';
			case '**': 
			case '_': 
			case '*': 
			case '__': 
			case '~~': return this.pattern;
			case 'div': 
			case 'br': 
			default: return '';
		}
	}
}

class MarkElement {
	constructor(lo, hi, pattern) {
		this.lo = lo;
		this.hi = hi;
		this.pattern = pattern;
	}
	
	static equal(a, b) {
		return a.lo === b.lo && a.hi === b.hi && a.pattern === b.pattern;
	}
}

function createRangeMarkList(textContent) {
	const searchedMarkList = [];
	class SingleMarkElement {
		constructor(pos, pattern) {
			this.pos = pos;
			this.pattern = pattern;
		}
	}
	class Range {
		constructor(lo, hi) {
			this.lo = lo;
			this.hi = hi;
		}
	}
	
	function scanLine(line, lineOffset, skipPos) {
		const singleMarkCharStack = [];
		function findMatch(item) {
			let matched = false;
			let idx = singleMarkCharStack.length - 1;
			while(idx >= 0) {
				if(singleMarkCharStack[idx].pattern === item.pattern) {
					matched = true;
					break;
				}
				idx--;
			}
			if(matched) {
				searchedMarkList.push(
					new MarkElement(
						singleMarkCharStack[idx].pos,
						item.pos + item.pattern.length,
						item.pattern
					)
				);
				while(idx < singleMarkCharStack.length) {
					singleMarkCharStack.pop();
				}
			}
			return matched;
		}
		
		for (let i = skipPos; i < line.length; i++) {
			if(i <= line.length - patternComment.length) {
				const lineSeg = line.substring(i, i + patternComment.length);
				if(patternComment === lineSeg) {
					i += patternComment.length;
					continue;
				}
			}
			for(const pattern of patternCharList) {
				const patternLength = pattern.length;
				if(i > line.length - pattern.length) {
					continue;
				}
				const lineSeg = line.substring(i, i + patternLength);
				if(pattern === lineSeg) {
					const item = new SingleMarkElement(i + lineOffset, pattern);
					if(!findMatch(item)) {
						singleMarkCharStack.push(item);
					} else {
						i += patternLength - 1;
					}
					break;
				}
			}
		}
	}
	
	const lines = textContent.split('\n');
	let lineOffset = 0;
	
	for (const line of lines) {
		let patternMatched = false;
		let skipPos = 0;
		/*if(patternOnlyLine.length === line.length) {
			const lineSeg = line.substring(0, patternOnlyLine.length);
			if(patternOnlyLine === lineSeg) {
				searchedMarkList.push(
					new MarkElement(
						lineOffset,
						lineOffset + line.length,
						patternOnlyLine
					)
				);
				patternMatched = true;
				skipPos += line.length;
			}
		}
		
		if(patternCodeBlock.length === line.length) {
			const lineSeg = line.substring(0, patternCodeBlock.length);
			if(patternCodeBlock === lineSeg) {
				if(singleMarkCodeBlockStack.length > 0) {
					searchedMarkList.push(
						new MarkElement(
							singleMarkCodeBlockStack.pop(),
							lineOffset + line.length,
							patternCodeBlock
						)
					);
				} else {
					singleMarkCodeBlockStack.push(lineOffset);
				}
				patternMatched = true;
				skipPos += line.length;
			}
		}*/
		
		for(const pattern of patternTitleList) {
			const patternLength = pattern.length;
			if(patternLength > line.length) {
				continue;
			}
			const lineSeg = line.substring(0, patternLength);
			if(pattern === lineSeg) {
				searchedMarkList.push(
					new MarkElement(
						lineOffset,
						lineOffset + line.length,
						pattern
					)
				);
				patternMatched = true;
				skipPos += patternLength;
				break;
			}
		}
		
		scanLine(line, lineOffset, skipPos);
		searchedMarkList.push(new MarkElement(lineOffset, lineOffset + line.length, 'div'));
		lineOffset += line.length + 1;
	}
	searchedMarkList.sort((x, y) => (x.lo !== y.lo) ? x.lo - y.lo : ((x.hi !== y.hi) ? y.hi - x.hi : (x.tag === 'div') ? 1 : -1));
	return searchedMarkList;
}

function createMarkTree(searchedMarkList, text) {
	const rootNode = new MarkTreeNode(0, text.length, 'div');
	const nodeStack = [];
	
	let curNode = rootNode;
	for (let i = 0; i < searchedMarkList.length; i++) {
		const element = searchedMarkList[i];
		const newNode = new MarkTreeNode(element.lo, element.hi, element.pattern);
		while(curNode.hi < newNode.hi) {
			curNode = nodeStack.pop();
		}
		curNode.pushChild(newNode);
		nodeStack.push(curNode);
		curNode = newNode;
	}
	return rootNode;
}

function applyMarkTreeToEditorDOM(markRootNode, DOMRootNode, textContent) {
	const cursorPosition = getCursorPosition(DOMRootNode, textContent);
	function addDOMNodeByMarkTree(markNode, DOMnode, lo, hi) {
		if(lo === hi) {
			DOMnode.appendChild(document.createElement('br'));
		}
		for(const markChild of markNode.children) {
			if(lo < markChild.lo && DOMnode !== DOMRootNode) {
				DOMnode.appendChild(document.createTextNode(textContent.substring(lo, markChild.lo)));
			}
			const childDOMNode = document.createElement(markChild.tag);
			addDOMNodeByMarkTree(markChild, childDOMNode, markChild.lo, markChild.hi);
			DOMnode.appendChild(childDOMNode);
			lo = markChild.hi;
		}
		if(lo < hi && DOMnode !== DOMRootNode) {
			DOMnode.appendChild(document.createTextNode(textContent.substring(lo, hi)));
		}
	}
	deleteDOMChildren(DOMRootNode);
	addDOMNodeByMarkTree(markRootNode, DOMRootNode, 0, textContent.length);
	setCursorPosition(DOMRootNode, cursorPosition);
}

function deleteDOMChildren(node) {
	while (node.firstChild) {
		deleteDOMChildren(node.firstChild);
		node.removeChild(node.firstChild);
	}
}

function getCursorPosition(DOMNode, text) {
	const range = window.getSelection().getRangeAt(0);
	const tempRange = range.cloneRange();
    tempRange.selectNodeContents(DOMNode);
    tempRange.setEnd(range.endContainer, range.endOffset);
	
	let row = 0;
	let curLineNode = range.endContainer;
	if(curLineNode !== DOMNode) {
		while(curLineNode.parentNode !== DOMNode) {
			curLineNode = curLineNode.parentNode;
		}
		const lines = DOMNode.childNodes;
		for (; row < lines.length; row++) {
			if (lines[row] === curLineNode) {
				break;
			}
		}
	}
	
	let column = tempRange.toString().length;
	const lines = text.split('\n');
	for(let i = 0; i < row; i++) {
		column -= lines[i].length;
	}
	
	return {
		row: row,
		column: column,
	}
}

function setCursorPosition(DOMNode, cursorPosition) {
	const {row, column} = cursorPosition;
	let targetNode, targetOffset, offset = 0;
	function scanTextNodes(node) {
		if (node.nodeType === Node.TEXT_NODE) {
			const textLength = node.nodeValue.length;
			if(offset + textLength >= column) {
				targetNode = node;
				targetOffset = column - offset;
				
			} else {
				offset += textLength;
			}
		} else if (node.tagName === 'BR') {
			targetNode = node;
			targetOffset = column - offset;
		} else {
			for (const child of node.childNodes) {
				scanTextNodes(child);
				if(targetNode !== undefined) {
					break;
				}
			}
		}
	}
	scanTextNodes(DOMNode.childNodes[row]);
	
	const range = document.createRange();
	range.setStart(targetNode, targetOffset);
	range.collapse(true);

	const selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange(range);
}

function compatibleLineBreakToChrome(text) {
	return text.replace(/\n\n/g, '\n');
}
