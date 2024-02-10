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
  return <div contenteditable='true'><h1>{text}</h1></div>
}

function CenterContent() {
	const [content, setContent] = useState('');
	const divRef = useRef();

	useEffect(() => {
		if (divRef.current) {
			divRef.current.innerHTML = setContent;
		}
	}, [content]);
	
	const handleInputChange = (event) => {
		const newText = event.target.innerText;
		setContent(createHTMLByMarkRangePattern(newText));
	};

	return (
		<>
			<div
				contentEditable={true}
				onInput={handleInputChange}
				style={{ border: '1px solid #ccc', padding: '8px' }}
			/>
			<div>
				{content}
			</div>
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
		case '---': return 'h1';
		case '```': return 'i';
		case '# ': return 'h1';
		case '## ': return 'h2';
		case '### ': return 'h3';
		case '#### ': return 'h4';
		case '##### ': return 'h5';
		case '###### ': return 'h6';
		case '**': 
		case '_': return 'b';
		case '*': 
		case '__': return 'i';
		case '~~': return 's';
		case '`': return 'b';
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
	
	get isChildrenEmpty() {
		return this.children.length <= 0;
	}
	
	get leftmostChildTagPos() {
		return this.isChildrenEmpty ? this.lo : this.children[0].lo;
	}
	
	get rightmostChildTagPos() {            
		return this.isChildrenEmpty ? this.hi : this.children[this.children.length - 1].hi;
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

	class markElement {
		constructor(lo, hi, pattern) {
			this.lo = lo;
			this.hi = hi;
			this.pattern = pattern;
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
					new markElement(
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
	const singleMarkCodeBlockStack = [];
	let lineOffset = 0;
	for (const line of lines) {
		let skipPos = 0;
		if(patternOnlyLine.length === line.length) {
			const lineSeg = line.substring(0, patternOnlyLine.length);
			if(patternOnlyLine === lineSeg) {
				searchedMarkList.push(
					new markElement(
						lineOffset,
						lineOffset + line.length,
						patternOnlyLine
					)
				);
				skipPos += line.length;
			}
		}
		
		if(patternCodeBlock.length === line.length) {
			const lineSeg = line.substring(0, patternCodeBlock.length);
			if(patternCodeBlock === lineSeg) {
				if(singleMarkCodeBlockStack.length > 0) {
					searchedMarkList.push(
						new markElement(
							singleMarkCodeBlockStack.pop(),
							lineOffset + line.length,
							patternCodeBlock
						)
					);
				} else {
					singleMarkCodeBlockStack.push(lineOffset);
				}
				skipPos += line.length;
			}
		}
		
		for(const pattern of patternTitleList) {
			const patternLength = pattern.length;
			if(patternLength > line.length) {
				continue;
			}
			const lineSeg = line.substring(0, patternLength);
			if(pattern === lineSeg) {
				searchedMarkList.push(
					new markElement(
						lineOffset,
						lineOffset + line.length,
						pattern
					)
				);
				skipPos += patternLength;
				break;
			}
		}
		
		scanLine(line, lineOffset, skipPos);
		lineOffset += line.length + 1;
	}
	searchedMarkList.sort((x, y) => x.lo - y.lo);
	return searchedMarkList;
}

function createMarkTree(textContent) {
	const searchedMarkList = createRangeMarkList(textContent);
	const rootNode = new MarkTreeNode(0, textContent.length, '');
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

function createHTMLByMarkRangePattern(text) {
	const rootNode = createMarkTree(text);
	console.log(rootNode);
	function scanTree(curNode) {
		const children = [];
		for(let i = 0; i < curNode.children.length; i++) {
			if(i > 0) {
				children.push(text.substring(curNode.children[i - 1].hi, curNode.children[i].lo));
			}
			children.push(scanTree(curNode.children[i]));
		}
		if(curNode.isChildrenEmpty) {
			children.push(text.substring(curNode.lo, curNode.hi));
		}
		
		const leftChild = text.substring(curNode.lo, curNode.leftmostChildTagPos);
		const rightChild = text.substring(curNode.rightmostChildTagPos, curNode.hi);
		const tag = convertPatternToTag(curNode.pattern);
		return React.createElement(tag, null, [leftChild].concat(children, [rightChild]));
	}
	const HTML = scanTree(rootNode);
	return HTML;
}
