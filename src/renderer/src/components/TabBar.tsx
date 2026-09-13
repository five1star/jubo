export type TabKey = 'front' | 'back'

interface TabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'front', label: '앞면' },
  { key: 'back', label: '뒷면' }
]

function TabBar({ active, onChange }: TabBarProps): React.JSX.Element {
  return (
    <div className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`tab-bar__item${active === tab.key ? ' is-active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default TabBar
