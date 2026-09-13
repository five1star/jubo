import { useRef, useState } from 'react'
import { useJuboImage } from '../hooks/useJuboImage'
import JuboCanvas, { JuboCanvasHandle } from './JuboCanvas'
import type { BoxPosition, TextPosition } from '../juboLayout'

export interface JuboFieldConfig {
  key: string
  label: string
  /** true면 입력을 여러 줄 텍스트에어리어로 받는다 (Enter로 줄바꿈) */
  multiline?: boolean
}

/** "광고"처럼 + 버튼으로 계속 늘어나는 번호 목록 입력 섹션 설정. */
export interface AdSectionConfig {
  /** 입력 위에 표시할 제목 (예: '광고') */
  label: string
  items: string[]
  onItemChange: (index: number, value: string) => void
  onAdd: () => void
  /** 지정하면 각 입력 옆에 삭제 버튼이 생긴다 (minCount 이하 개수로는 줄일 수 없다) */
  onRemove?: (index: number) => void
  /** 삭제로 줄일 수 없는 최소 입력 개수 (기본 0) */
  minCount?: number
}

interface JuboSideProps {
  /** resources 폴더 안의 이미지 파일명 (예: '1.png') */
  image: string
  /** 입력값을 이미지 위 어느 좌표에 그릴지 (필드 key -> 위치) */
  positions: Record<string, TextPosition>
  fields: JuboFieldConfig[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
  /** 입력 항목이 아직 없을 때 우측에 보여줄 안내 문구 */
  emptyMessage?: string
  /** fields 목록 위에 표시할 섹션 제목 (예: '봉사표') */
  fieldsLabel?: string
  /** 저장 버튼 라벨 (예: '주보 앞면 이미지 저장') */
  saveLabel: string
  /** 저장 대화상자에 기본으로 채워질 파일명 */
  defaultFileName: string
  /** 광고 목록을 그려 넣을 사각 영역 */
  adBox?: BoxPosition
  /** 광고 입력 섹션 (없으면 렌더링하지 않는다) */
  adSection?: AdSectionConfig
}

/** 좌측 주보 이미지(+텍스트 미리보기) + 우측 입력 폼으로 구성된 화면. 앞면/뒷면 탭에서 공용으로 사용. */
function JuboSide({
  image,
  positions,
  fields,
  values,
  onChange,
  emptyMessage,
  fieldsLabel,
  saveLabel,
  defaultFileName,
  adBox,
  adSection
}: JuboSideProps): React.JSX.Element {
  const { src, loading } = useJuboImage(image)
  const canvasHandleRef = useRef<JuboCanvasHandle>(null)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // IPC(메인 프로세스의 "다른 이름으로 저장" 대화상자)를 쓸 수 없을 때의 대안:
  // 브라우저 다운로드 방식으로 렌더러에서 바로 파일을 내려받는다.
  function downloadDataUrl(dataUrl: string, fileName: string): void {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  async function handleSave(): Promise<void> {
    const dataUrl = canvasHandleRef.current?.toDataURL()
    if (!dataUrl) return

    setSaving(true)
    setStatusMessage(null)
    try {
      if (typeof window.api?.savePng !== 'function') {
        throw new Error('savePng API를 사용할 수 없습니다')
      }
      const result = await window.api.savePng(dataUrl, defaultFileName)
      if (result.canceled) {
        setStatusMessage(null)
      } else if (result.error) {
        setStatusMessage(`저장 실패: ${result.error}`)
      } else if (result.filePath) {
        setStatusMessage(`저장했습니다: ${result.filePath}`)
      }
    } catch (error) {
      // 메인 프로세스 IPC가 안 붙어 있는 경우 다운로드로 대체
      console.error('[jubo] savePng IPC 실패, 다운로드로 대체합니다', error)
      downloadDataUrl(dataUrl, defaultFileName)
      setStatusMessage(`다운로드 폴더에 저장했습니다: ${defaultFileName}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="jubo-side">
      <div className="jubo-side__preview">
        {loading && <div className="jubo-side__placeholder">이미지를 불러오는 중...</div>}
        {!loading && !src && (
          <div className="jubo-side__placeholder">resources/{image} 파일을 찾을 수 없습니다.</div>
        )}
        {!loading && src && (
          <JuboCanvas
            ref={canvasHandleRef}
            src={src}
            positions={positions}
            values={values}
            adBox={adBox}
            ads={adSection?.items}
          />
        )}
      </div>
      <div className="jubo-side__form">
        {fields.length === 0 && !adSection && emptyMessage && (
          <p className="jubo-side__empty">{emptyMessage}</p>
        )}
        {adSection && (
          <div className="jubo-ad-section">
            <span className="jubo-field__label">{adSection.label}</span>
            <div className="jubo-ad-list">
              {adSection.items.map((value, index) => {
                const canRemove =
                  adSection.onRemove !== undefined && index >= (adSection.minCount ?? 0)
                return (
                  <div className="jubo-ad-item" key={index}>
                    <span className="jubo-ad-item__number">{index + 1}.</span>
                    <input
                      type="text"
                      className="jubo-field__input jubo-ad-item__input"
                      value={value}
                      onChange={(event) => adSection.onItemChange(index, event.target.value)}
                      placeholder={`광고 ${index + 1}`}
                    />
                    {canRemove && (
                      <button
                        type="button"
                        className="jubo-ad-item__remove"
                        onClick={() => adSection.onRemove?.(index)}
                        aria-label={`광고 ${index + 1} 삭제`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <button type="button" className="jubo-ad-add" onClick={adSection.onAdd}>
              + 광고 추가
            </button>
          </div>
        )}
        {fields.length > 0 && fieldsLabel && (
          <span className="jubo-field__label">{fieldsLabel}</span>
        )}
        {fields.map((field) => (
          <label key={field.key} className="jubo-field">
            <span className="jubo-field__label">{field.label}</span>
            {field.multiline ? (
              <textarea
                className="jubo-field__input jubo-field__textarea"
                rows={2}
                value={values[field.key] ?? ''}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.label}
              />
            ) : (
              <input
                type="text"
                className="jubo-field__input"
                value={values[field.key] ?? ''}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.label}
              />
            )}
          </label>
        ))}
        <button
          type="button"
          className="jubo-save-button"
          onClick={handleSave}
          disabled={saving || !src}
        >
          {saving ? '저장 중...' : saveLabel}
        </button>
        {statusMessage && <p className="jubo-side__status">{statusMessage}</p>}
      </div>
    </div>
  )
}

export default JuboSide
