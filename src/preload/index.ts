import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface SavePngResult {
  canceled: boolean
  filePath?: string
  error?: string
}

// Custom APIs for renderer
const api = {
  // resources 폴더의 이미지를 data URL로 읽어온다 (파일이 없으면 null)
  readImage: (filename: string): Promise<string | null> =>
    ipcRenderer.invoke('read-image', filename),
  // PNG data URL을 "다른 이름으로 저장" 대화상자를 띄워 파일로 저장한다.
  savePng: (dataUrl: string, defaultFileName: string): Promise<SavePngResult> =>
    ipcRenderer.invoke('save-png', dataUrl, defaultFileName)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
