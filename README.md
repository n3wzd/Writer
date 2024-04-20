# Writer
사용자가 Markdown 형식의 텍스트를 작성하고 실시간으로 미리보기할 수 있는 React기반 웹 애플리케이션입니다.

- Markdown 텍스트 작성 가능
- 실시간 편집기, HTML 뷰어 업데이트
- 여러 텍스트 파일 저장 가능
- 텍스트 파일 생성, 폴더 생성, 이름 변경, 파일 삭제
- 텍스트 파일 MD 또는 HTML 파일로 저장하기
- MD, TEXT 파일 불러오기

![example](example.png)

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
├── App.js: 메인 레이아웃
└── index.js
```
