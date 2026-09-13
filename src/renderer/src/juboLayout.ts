/** 주보 이미지 위에 텍스트를 그릴 위치 정보 (원본 이미지 픽셀 좌표 기준) */
export interface TextPosition {
  x: number
  y: number
  fontSize: number
  color?: string
  fontWeight?: number | string
  align?: CanvasTextAlign
  /** true면 입력값의 줄바꿈(\n)마다 줄을 나눠 그리고, y는 전체 줄 블록의 세로 중앙이 된다. */
  multiline?: boolean
}

// resources/1.png (1550 x 2250) 기준으로 각 항목이 들어갈 좌표.
// 이미지 위 초록 배너(제목) 및 순서표의 빈 칸 중앙 좌표를 픽셀 분석으로 측정했다.
export const FRONT_TEXT_POSITIONS: Record<string, TextPosition> = {
  title: { x: 786, y: 433, fontSize: 47, color: '#000000', fontWeight: 700 },
  openingHymn: { x: 796, y: 644, fontSize: 45, color: '#000000' },
  prePrayerHymn: { x: 796, y: 968, fontSize: 45, color: '#000000' },
  representativePrayer: { x: 796, y: 1076, fontSize: 45, color: '#000000' },
  scripture: { x: 796, y: 1184, fontSize: 45, color: '#000000' },
  worshipPraise: { x: 796, y: 1292, fontSize: 45, color: '#000000' },
  sermonTitle: { x: 796, y: 1401, fontSize: 45, color: '#000000' },
  offeringPrayer: { x: 796, y: 1507, fontSize: 45, color: '#000000' }
}

// 뒷면 우하단 "봉사표" 표의 각 항목 라벨 오른쪽에, 라벨과 조금 간격을 두고 값을 적어 넣는다.
// (라벨 오른쪽 끝 x좌표를 픽셀 분석으로 구한 뒤 +24px 정도 간격을 준 값이며,
//  값들이 세로로 한 줄에 맞춰 보이도록 x를 한 값으로 통일했다. y는 라벨 중앙보다 5px 아래로 내렸다.)
export const BACK_TEXT_POSITIONS: Record<string, TextPosition> = {
  serviceRepresentativePrayer: { x: 1225, y: 1550, fontSize: 40, color: '#000000', align: 'left' },
  serviceOfferingPrayer: { x: 1225, y: 1654, fontSize: 40, color: '#000000', align: 'left' },
  serviceOfferingCommittee: { x: 1225, y: 1720, fontSize: 40, color: '#000000', align: 'left' },
  serviceGuide: { x: 1225, y: 1810, fontSize: 40, color: '#000000', align: 'left' },
  serviceFlowers: { x: 1225, y: 1914, fontSize: 40, color: '#000000', align: 'left' },
  // 청소는 텍스트에어리어로 입력받아 엔터로 두 줄까지 적을 수 있다.
  serviceCleaning: {
    x: 1225,
    y: 2018,
    fontSize: 40,
    color: '#000000',
    align: 'left',
    multiline: true
  }
}

/** 여러 줄의 목록(광고 등)을 자동 줄바꿈 + 자동 축소로 그려 넣을 사각 영역. */
export interface BoxPosition {
  x: number
  y: number
  width: number
  height: number
  color?: string
  fontFamily?: string
  /** 항목이 적을 때 사용할 최대 글자 크기 */
  maxFontSize?: number
  /** 항목이 많아져도 이 크기 밑으로는 최대한 줄이지 않으려는 기준값 (넘치면 더 줄어들 수 있음) */
  minFontSize?: number
}

// resources/2.png (1550 x 2250)의 "광고" 파란 영역 좌표.
// 파란 사각형 실측 범위 x:78~966, y:1522~2119 에서 여백 24px를 뺀 안전 영역이다.
export const BACK_AD_BOX: BoxPosition = {
  x: 102,
  y: 1546,
  width: 840,
  height: 549,
  color: '#000000',
  maxFontSize: 42,
  minFontSize: 14
}
