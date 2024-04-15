# Writer
## 1. 개요
이 웹 애플리케이션은 사용자가 Markdown 형식의 텍스트를 작성하고 실시간으로 미리보기할 수 있는 웹 기반 에디터입니다.

주요 기능:
- Markdown 텍스트 작성 가능
- 실시간으로 편집 영역, HTML 렌더링 영역 업데이트
- 여러 텍스트 파일 저장 가능
- 텍스트 파일 생성, 폴더 생성, 이름 변경, 파일 삭제
- 텍스트 파일 MD 또는 HTML 파일로 저장하기
- MD 파일 불러오기
이 프로젝트를 통해 Markdown을 사용하는 사용자들에게 더 나은 편의성을 제공하고, Markdown 에디팅 경험을 향상시킬 것으로 기대됩니다.

![example](example.png)

## 2. 기술 스택
React

## 3. 파일 구조
```
src/
│
├── components/: 재사용 가능한 컴포넌트들을 포함합니다.
│   ├── icons.js: 아이콘 컴포넌트
│   └── menu-tab-button.js: 메뉴 탭 버튼
│
├── datas/: 클래스, 싱글톤, 상수 등 데이터를 포함합니다.
│   ├── class.js: 보편적으로 쓰이는 클래스
│   ├── file-manaer.js: 파일을 관리하는 FileManager 싱글톤
│   ├── global-data.js: 전역 변수를 담은 GlobalData 싱글톤
│   └── markdown.js: Markdown 관련 상수
│
├── pages/: 애플리케이션의 각 페이지에 대한 컴포넌트들을 포함합니다.
│   ├── center.js: Center 레이아웃
│   ├── left.js: Left 레이아웃
│   └── right.js: Right 레이아웃
│
├── utils/: 여러 곳에서 사용될 수 있는 유틸리티 함수들을 포함합니다.
│   ├── cursor.js: 커서 위치 탐색, 설정 함수
│   ├── editor.js: DOM 설정 알고리즘
│   ├── html.js: html 파싱 함수
│   └── markdown.js: markdown 패턴 파싱 알고리즘
│
├── App.css: css 파일
├── App.js: 메인 레이아웃
└── index.js
```

## 4. 주요 컴포넌트
- **Center 컴포넌트**: 텍스트 편집 영역과 HTML 영역으로 구성된 React 컴포넌트입니다. 사용자가 텍스트를 입력할 때마다 실시간으로 편집 영역과 HTML 영역이 렌더링되어 업데이트됩니다.
- **Left 컴포넌트**: 텍스트 파일들을 관리하는 React 컴포넌트입니다. 현재 파일 구조를 표시하며, 파일 추가, 폴더 추가, 이름 변경, 파일 삭제 기능을 지원합니다. 토글 버튼으로 UI를 접었다 펼 수 있습니다.
- **Header 컴포넌트**: 기타 기능을 제공하는 React 컴포넌트입니다. MD 파일 저장, HTML 파일 저장, MD 파일 읽기 기능을 지원합니다. 토글 버튼으로 UI를 접었다 펼 수 있습니다.
