import { useState } from 'react'
import TabBar, { TabKey } from './components/TabBar'
import JuboSide, { JuboFieldConfig } from './components/JuboSide'
import { BACK_AD_BOX, BACK_TEXT_POSITIONS, FRONT_TEXT_POSITIONS } from './juboLayout'

/** 광고 입력 최소 개수. 이보다 적게는 삭제할 수 없다. */
const MIN_AD_COUNT = 4

const FRONT_FIELDS: JuboFieldConfig[] = [
  { key: 'title', label: '주보 제목' },
  { key: 'openingHymn', label: '시작 찬송' },
  { key: 'prePrayerHymn', label: '기도 전 찬송' },
  { key: 'representativePrayer', label: '대표 기도' },
  { key: 'scripture', label: '성경 본문' },
  { key: 'worshipPraise', label: '예배 찬양' },
  { key: 'sermonTitle', label: '말씀 제목' },
  { key: 'offeringPrayer', label: '헌금 기도' }
]

// 뒷면 우하단 "봉사표" 입력 항목
const BACK_FIELDS: JuboFieldConfig[] = [
  { key: 'serviceRepresentativePrayer', label: '대표기도' },
  { key: 'serviceOfferingPrayer', label: '헌금기도' },
  { key: 'serviceOfferingCommittee', label: '헌금위원' },
  { key: 'serviceGuide', label: '안내' },
  { key: 'serviceFlowers', label: '헌화' },
  { key: 'serviceCleaning', label: '청소', multiline: true }
]

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>('front')
  const [frontValues, setFrontValues] = useState<Record<string, string>>({})
  const [backValues, setBackValues] = useState<Record<string, string>>({})
  const [adValues, setAdValues] = useState<string[]>(Array(MIN_AD_COUNT).fill(''))

  function handleAdChange(index: number, value: string): void {
    setAdValues((prev) => prev.map((item, i) => (i === index ? value : item)))
  }

  function handleAddAd(): void {
    setAdValues((prev) => [...prev, ''])
  }

  function handleRemoveAd(index: number): void {
    setAdValues((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="app">
      <TabBar active={activeTab} onChange={setActiveTab} />
      <div className="app__content">
        {activeTab === 'front' ? (
          <JuboSide
            image="1.png"
            positions={FRONT_TEXT_POSITIONS}
            fields={FRONT_FIELDS}
            values={frontValues}
            onChange={(key, value) => setFrontValues((prev) => ({ ...prev, [key]: value }))}
            saveLabel="주보 앞면 이미지 저장"
            defaultFileName="주보-앞면.png"
          />
        ) : (
          <JuboSide
            image="2.png"
            positions={BACK_TEXT_POSITIONS}
            fields={BACK_FIELDS}
            values={backValues}
            onChange={(key, value) => setBackValues((prev) => ({ ...prev, [key]: value }))}
            fieldsLabel="봉사표"
            saveLabel="주보 뒷면 이미지 저장"
            defaultFileName="주보-뒷면.png"
            adBox={BACK_AD_BOX}
            adSection={{
              label: '광고',
              items: adValues,
              onItemChange: handleAdChange,
              onAdd: handleAddAd,
              onRemove: handleRemoveAd,
              minCount: MIN_AD_COUNT
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
