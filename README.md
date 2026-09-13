# jubo

교회 주보(예배 순서지)를 만드는 Electron 데스크톱 앱입니다.

미리 준비된 주보 템플릿 이미지(`resources/1.png` 앞면, `resources/2.png` 뒷면) 위에 시작 찬송, 대표 기도, 성경 본문, 말씀 제목 같은 예배 순서와, 뒷면의 봉사표(대표기도·헌금기도·안내·청소 등 담당자)와 광고 목록을 화면에서 입력하면, 그 값이 캔버스에 실시간으로 겹쳐 그려집니다. 앞면/뒷면 탭을 오가며 입력을 마친 뒤 저장 버튼을 누르면 완성된 주보를 PNG 이미지로 내려받을 수 있습니다.

- **앞면**: 주보 제목, 시작 찬송, 기도 전 찬송, 대표 기도, 성경 본문, 예배 찬양, 말씀 제목, 헌금 기도
- **뒷면 · 봉사표**: 대표기도, 헌금기도, 헌금위원, 안내, 헌화, 청소(여러 줄 입력) 담당자
- **뒷면 · 광고**: 항목을 자유롭게 추가/삭제할 수 있는 번호 매김 목록으로, 글자 크기가 영역에 맞춰 자동으로 줄어듭니다

Electron + React + TypeScript로 만들어졌으며 electron-vite로 빌드합니다.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
