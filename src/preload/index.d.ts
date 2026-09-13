import { ElectronAPI } from '@electron-toolkit/preload'
import type { SavePngResult } from './index'

interface Api {
  readImage: (filename: string) => Promise<string | null>
  savePng: (dataUrl: string, defaultFileName: string) => Promise<SavePngResult>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
