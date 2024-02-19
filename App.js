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
	let markList = [];
	
	const handleInputChange = (event) => {
		const text = event.target.innerText;
		console.log(event.target.innerText);
		console.log(event.target.innerHTML);
		return;
		const searchedMarkList = createRangeMarkList(text);
		if(!compareRangeMarkList(markList, searchedMarkList)) {
			const rootMarkNode = createMarkTree(searchedMarkList, text);
			const rootDOMNode = divEditorRef.current;
			rootDOMNode.setAttribute("textHi", text.length);
			markList = searchedMarkList;
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
				textLo='0'
				textHi='1'
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
		case 'p': return 'span';
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
			case 'p': 
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
			case 'p': 
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
	//const singleMarkCodeBlockStack = [];
	//const lineBrStack = [];
	let lineOffset = 0;
	/*function unleashBrStack() {
		const length = lineBrStack.length;
		for(let i = 1; i < length; i++) {
			searchedMarkList.push(
				new MarkElement(
					lineBrStack[i].lo - 1,
					lineBrStack[i].lo,
					'br'
				)
			);
		}
		if(length > 0) {
			searchedMarkList.push(
			new MarkElement(
					lineBrStack[0].lo,
					lineBrStack[length - 1].hi,
					'p'
				)
			);
		}
		lineBrStack.length = 0;
	}*/
	
	for (const line of lines) {
		/*if(line.length === 0) {
			unleashBrStack();
			lineOffset += 1;
			continue;
		}*/
		
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
		/*if(patternMatched) {
			unleashBrStack();
		} else {
			lineBrStack.push(new Range(lineOffset, lineOffset + line.length));
		}*/
		lineOffset += line.length + 1;
	}
	// unleashBrStack();
	
	// searchedMarkList.sort((x, y) => x.lo !== y.lo ? x.lo - y.lo : (x.pattern === 'p' ? -1 : 1));
	searchedMarkList.sort((x, y) => x.lo - y.lo);
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

function compareRangeMarkList(a, b) {
	let isEqual = a.length === b.length;
	for (let i = 0; i < a.length; i++) {
		isEqual = isEqual && MarkElement.equal(a[i], b[i]);
	}
	return isEqual;
}

function createHTMLByTree(rootNode, text) {
	function scanTree(curNode) {
		if(curNode.pattern === 'br') {
			return React.createElement(curNode.tag);
		}
		
		const children = [];
		for(let i = 0; i < curNode.children.length; i++) {
			if(i > 0) {
				children.push(text.substring(curNode.children[i - 1].hi, curNode.children[i].lo));
			}
			children.push(scanTree(curNode.children[i]));
		}
		
		const leftPattern = curNode.leftPattern;
		const rightPattern = curNode.rightPattern;
		const tagType = curNode.tag;
		let leftTextTag = '', rightTextTag = '';
		
		if(curNode.isChildrenEmpty) {
			children.push(text.substring(curNode.lo + leftPattern.length, curNode.hi - rightPattern.length));
		} else {
			leftTextTag = text.substring(curNode.lo + leftPattern.length, curNode.leftmostChildTagPos);
			rightTextTag = text.substring(curNode.rightmostChildTagPos, curNode.hi - rightPattern.length);
		}
		return React.createElement(tagType, null, [leftTextTag].concat(children, [rightTextTag]));
	}
	return scanTree(rootNode);
}

function applyMarkTreeToEditorDOM(markRootNode, DOMRootNode, textContent) {
	const cursorPosition = getCursorPosition(DOMRootNode);
	let newCursorOffset = -1;
	let newCursorNode;
	
	function createTextNode(lo, hi) {
		const textNode = document.createTextNode(textContent.substring(lo, hi));
		const wrapNode = document.createElement('span');
		wrapNode.setAttribute("textLo", lo);
		wrapNode.setAttribute("textHi", hi);
		wrapNode.appendChild(textNode);
		if(cursorPosition >= lo && cursorPosition <= hi) {
			newCursorOffset = cursorPosition - lo;
			newCursorNode = textNode;
		}
		return wrapNode;
	}
	
	function addDOMNodeByMarkTree(markNode, DOMnode, lo, hi) {
		for(const markChild of markNode.children) {
			if(lo < markChild.lo) {
				DOMnode.appendChild(createTextNode(lo, markChild.lo));
			}
			const childDOMNode = document.createElement(markChild.tag);
			addDOMNodeByMarkTree(markChild, childDOMNode, markChild.lo, markChild.hi);
			DOMnode.appendChild(childDOMNode);
			lo = markChild.hi;
		}
		if(lo < hi) {
			DOMnode.appendChild(createTextNode(lo, hi));
		}
	}
	
	deleteDOMChildren(DOMRootNode);
	addDOMNodeByMarkTree(markRootNode, DOMRootNode, 0, textContent.length);
	setCursorPosition(newCursorNode, newCursorOffset);
}

function deleteDOMChildren(node) {
	while (node.firstChild) {
		deleteDOMChildren(node.firstChild);
		node.removeChild(node.firstChild);
	}
}

function getCursorPosition(DOMNode) {
	const range = window.getSelection().getRangeAt(0);
	return range.startOffset + parseInt(range.startContainer.parentNode.getAttribute('textLo'));
}

function setCursorPosition(targetNode, targetOffset) {
	if(targetNode === undefined) {
		return;
	}
	const range = document.createRange();
	range.setStart(targetNode, targetOffset);
	range.collapse(true);

	const selection = window.getSelection();
	selection.removeAllRanges();
	selection.addRange(range);
}
