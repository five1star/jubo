import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { BoxPosition, TextPosition } from '../juboLayout'

interface JuboCanvasProps {
  /** useJuboImage가 이미 로드에 성공했을 때만 렌더링되므로 항상 값이 있다 */
  src: string
  positions: Record<string, TextPosition>
  values: Record<string, string>
  /** 광고처럼 개수가 늘어나는 번호 목록을 그려 넣을 사각 영역 (없으면 목록을 그리지 않는다) */
  adBox?: BoxPosition
  /** adBox에 그릴 목록 값. 빈 문자열/공백뿐인 항목은 제외하고 1번부터 다시 번호를 매긴다. */
  ads?: string[]
}

export interface JuboCanvasHandle {
  /** 현재 캔버스를 PNG data URL로 반환한다 (아직 그려지지 않았으면 null) */
  toDataURL: () => string | null
}

const FONT_FAMILY = '"Apple SD Gothic Neo", "Malgun Gothic", sans-serif'

interface AdLine {
  /** box.x 기준 상대 x (줄바꿈으로 이어지는 줄은 번호 폭만큼 들여쓴다) */
  x: number
  /** box.y 기준 상대 y */
  y: number
  text: string
}

/** 한 글자씩 측정하며 maxWidth를 넘기지 않도록 잘라 여러 줄로 만든다 (한글은 단어 간 공백이 없을 수 있어 글자 단위로 처리). */
function wrapTextToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text) return ['']
  const lines: string[] = []
  let current = ''
  for (const ch of text) {
    const trial = current + ch
    if (current && ctx.measureText(trial).width > maxWidth) {
      lines.push(current)
      current = ch
    } else {
      current = trial
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

/** 주어진 글자 크기에서 "1. 내용" 형태 번호 목록의 줄바꿈 결과와 전체 높이를 계산한다. */
function layoutAds(
  ctx: CanvasRenderingContext2D,
  ads: string[],
  box: BoxPosition,
  fontFamily: string,
  fontSize: number
): { lines: AdLine[]; totalHeight: number } {
  ctx.font = `600 ${fontSize}px ${fontFamily}`
  const lineHeight = fontSize * 1.4
  const itemGap = fontSize * 0.55
  // 항목 수 기준으로 가장 긴 번호("12. " 등) 폭을 미리 확보해 둬야, 이어지는 줄이 번호 밑으로 정렬된다.
  const numberWidth = ctx.measureText(`${ads.length}. `).width
  const maxTextWidth = Math.max(10, box.width - numberWidth)

  const lines: AdLine[] = []
  let y = 0
  ads.forEach((ad, index) => {
    const prefix = `${index + 1}. `
    const wrapped = wrapTextToWidth(ctx, ad, maxTextWidth)
    wrapped.forEach((segment, segIndex) => {
      const isFirst = segIndex === 0
      lines.push({
        x: isFirst ? 0 : numberWidth,
        y,
        text: isFirst ? prefix + segment : segment
      })
      y += lineHeight
    })
    y += itemGap
  })

  const totalHeight = lines.length > 0 ? y - itemGap : 0
  return { lines, totalHeight }
}

/**
 * box.height를 절대 넘지 않는 선에서 가장 큰 글자 크기를 찾는다.
 * maxFontSize부터 1px씩 줄여보다가 처음으로 들어맞는 크기를 쓰고,
 * minFontSize로도 넘치면(항목이 아주 많은 경우) 실제로 다 들어갈 때까지 계속 줄인다.
 */
function fitAdsFontSize(
  ctx: CanvasRenderingContext2D,
  ads: string[],
  box: BoxPosition,
  fontFamily: string
): { lines: AdLine[]; fontSize: number } {
  const maxFontSize = box.maxFontSize ?? 42
  const minFontSize = box.minFontSize ?? 14

  for (let size = maxFontSize; size >= minFontSize; size -= 1) {
    const result = layoutAds(ctx, ads, box, fontFamily, size)
    if (result.totalHeight <= box.height) {
      return { lines: result.lines, fontSize: size }
    }
  }

  // 안전장치: 최소 크기로도 넘치면 실제로 영역을 벗어나지 않을 때까지 더 줄인다.
  let size = minFontSize
  let result = layoutAds(ctx, ads, box, fontFamily, size)
  while (result.totalHeight > box.height && size > 4) {
    size -= 1
    result = layoutAds(ctx, ads, box, fontFamily, size)
  }
  return { lines: result.lines, fontSize: size }
}

/** 주보 이미지를 그리고, 그 위에 입력된 텍스트를 각 위치에 겹쳐 그리는 캔버스. */
const JuboCanvas = forwardRef<JuboCanvasHandle, JuboCanvasProps>(function JuboCanvas(
  { src, positions, values, adBox, ads },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  // src가 바뀔 때마다 이미지를 새로 로드
  useEffect(() => {
    const img = new Image()
    img.onload = () => setImage(img)
    img.src = src
  }, [src])

  // 이미지가 로드되어 있거나 입력값이 바뀔 때마다 다시 그린다.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !image) return

    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    ctx.drawImage(image, 0, 0)

    for (const [key, pos] of Object.entries(positions)) {
      const text = values[key]?.trim()
      if (!text) continue

      ctx.font = `${pos.fontWeight ?? 500} ${pos.fontSize}px ${FONT_FAMILY}`
      ctx.fillStyle = pos.color ?? '#1a1a1a'
      ctx.textAlign = pos.align ?? 'center'
      ctx.textBaseline = 'middle'

      if (pos.multiline) {
        // 첫 줄은 항상 pos.y(라벨과 같은 높이)에 고정하고, 줄바꿈이 늘어날 때마다 아래로만 이어 그린다.
        const lines = text.split('\n')
        const lineHeight = pos.fontSize * 1.2
        lines.forEach((line, index) => {
          ctx.fillText(line, pos.x, pos.y + index * lineHeight)
        })
      } else {
        ctx.fillText(text, pos.x, pos.y)
      }
    }

    if (adBox && ads) {
      const filtered = ads.map((item) => item.trim()).filter((item) => item.length > 0)
      if (filtered.length > 0) {
        const fontFamily = adBox.fontFamily ?? FONT_FAMILY
        const { lines, fontSize } = fitAdsFontSize(ctx, filtered, adBox, fontFamily)
        ctx.font = `600 ${fontSize}px ${fontFamily}`
        ctx.fillStyle = adBox.color ?? '#ffffff'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        for (const line of lines) {
          ctx.fillText(line.text, adBox.x + line.x, adBox.y + line.y)
        }
      }
    }
  }, [image, positions, values, adBox, ads])

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? null
  }))

  return <canvas ref={canvasRef} className="jubo-side__canvas" />
})

export default JuboCanvas
