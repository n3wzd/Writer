Writer
> Web application where users can write Markdown text and preview it in real-time.

![example](example.png)

- Write Markdown text
- Real-time editor with HTML viewer updates
- Ability to save multiple text files
- Create text files, create folders, rename files, and delete files
- Save text files as MD or HTML
- Import MD or TEXT files

## Stack
- React

##
```
src/
│
├── components/: Reusable components
│   ├── icons.js: SVG icon components
│   └── menu-tab-button.js: Menu tab button
│
├── datas/: Classes, singletons, constants
│   ├── class.js: Various classes
│   ├── file-manager.js: FileManager singleton for managing files
│   ├── global-data.js: GlobalData singleton for global variables
│   └── markdown.js: Markdown-related constants
│
├── pages/: Layout UI components
│   ├── center.js: Center layout UI
│   ├── left.js: Left layout UI
│   └── right.js: Right layout UI
│
├── styles/: Stylesheets
│   ├── editor.css: Stylesheet for the Markdown editor
│   ├── html.css: Stylesheet for the HTML viewer
│   ├── main.css: Global stylesheet
│   ├── pages-center.css: Stylesheet for the Center component
│   ├── pages-left.css: Stylesheet for the Left component
│   └── pages-right.css: Stylesheet for the Right component
│
├── utils/: Utility functions
│   ├── cursor.js: Functions for cursor position detection and setting
│   ├── editor.js: DOM rendering engine algorithm
│   ├── html.js: HTML text parsing functions
│   └── markdown.js: Markdown tree generation algorithm
│
├── App.js: Main layout
└── index.js
```

# Writer
> 사용자가 Markdown 형식의 텍스트를 작성하고 실시간으로 미리보기할 수 있는 웹 애플리케이션입니다.

![example](example.png)

- Markdown 텍스트 작성 가능
- 실시간 편집기, HTML 뷰어 업데이트
- 여러 텍스트 파일 저장 가능
- 텍스트 파일 생성, 폴더 생성, 이름 변경, 파일 삭제
- 텍스트 파일 MD 또는 HTML 파일로 저장하기
- MD, TEXT 파일 불러오기

## Stack
- React

## Structure
```
src/
│
├── components/: 재사용 가능한 컴포넌트
│   ├── icons.js: svg 아이콘 컴포넌트
│   └── menu-tab-button.js: 메뉴 탭 버튼
│
├── datas/: 클래스, 싱글톤, 상수
│   ├── class.js: 각종 클래스
│   ├── file-manaer.js: 파일을 관리하는 FileManager 싱글톤
│   ├── global-data.js: 전역 변수를 담은 GlobalData 싱글톤
│   └── markdown.js: Markdown 관련 상수
│
├── pages/: 레이아웃 UI 컴포넌트
│   ├── center.js: Center 레이아웃 UI
│   ├── left.js: Left 레이아웃 UI
│   └── right.js: Right 레이아웃 UI
│
├── styles/: 스타일시트
│   ├── editor.css: Markdown 편집기 스타일시트
│   ├── html.css: HTML 뷰어 스타일시트
│   ├── main.css: 전역 스타일시트
│   ├── pages-center.css: Center 컴포넌트 스타일시트
│   ├── pages-left.css: Left 컴포넌트 스타일시트
│   └── pages-right.css: Right 컴포넌트 스타일시트
│
├── utils/: 유틸리티 함수
│   ├── cursor.js: 커서 위치 탐색, 설정 함수
│   ├── editor.js: DOM 렌더링 엔진 알고리즘
│   ├── html.js: html 텍스트 파싱 함수
│   └── markdown.js: Markdown 트리 생성 알고리즘
│
├── App.js: 메인 레이아웃
└── index.js
```
