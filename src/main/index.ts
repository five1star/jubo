import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// 앞면/뒷면 주보 이미지가 들어있는 폴더. 개발/빌드 결과물(out/main) 기준으로
// 두 단계 위인 프로젝트 루트의 resources 폴더를 가리킨다.
const RESOURCES_DIR = join(__dirname, '../../resources')

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg'
}

// 렌더러가 <img>로 바로 쓸 수 있도록 resources 폴더의 이미지를 data URL로 읽어 반환.
// 파일이 없으면 null을 반환해 렌더러가 안내 문구를 보여줄 수 있게 한다.
async function readResourceImage(filename: string): Promise<string | null> {
  try {
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const mime = MIME_BY_EXT[ext] ?? 'application/octet-stream'
    const buffer = await readFile(join(RESOURCES_DIR, filename))
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch (error) {
    console.error(`[read-image] failed to read "${filename}"`, error)
    return null
  }
}

interface SavePngResult {
  canceled: boolean
  filePath?: string
  error?: string
}

// 캔버스에서 넘어온 PNG data URL을 "다른 이름으로 저장" 대화상자를 띄워 파일로 저장한다.
async function savePngFile(
  senderWindow: BrowserWindow | null,
  dataUrl: string,
  defaultFileName: string
): Promise<SavePngResult> {
  const options = {
    title: '이미지 저장',
    defaultPath: defaultFileName,
    filters: [{ name: 'PNG 이미지', extensions: ['png'] }]
  }
  const { canceled, filePath } = senderWindow
    ? await dialog.showSaveDialog(senderWindow, options)
    : await dialog.showSaveDialog(options)

  if (canceled || !filePath) {
    return { canceled: true }
  }

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
  await writeFile(filePath, Buffer.from(base64, 'base64'))
  return { canceled: false, filePath }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 주보 이미지 로딩: 상위 폴더 접근을 막기 위해 단순 파일명만 허용
  ipcMain.handle('read-image', (_event, filename: string) => {
    if (typeof filename !== 'string' || !/^[\w.-]+$/.test(filename)) {
      console.error(`[read-image] invalid filename: ${filename}`)
      return null
    }
    return readResourceImage(filename)
  })

  // 미리보기 캔버스를 PNG로 내보내기: "다른 이름으로 저장" 대화상자 → 파일 쓰기
  ipcMain.handle('save-png', async (event, dataUrl: string, defaultFileName: string) => {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
      console.error('[save-png] invalid dataUrl')
      return { canceled: true }
    }
    try {
      const senderWindow = BrowserWindow.fromWebContents(event.sender)
      return await savePngFile(senderWindow, dataUrl, defaultFileName || 'jubo.png')
    } catch (error) {
      console.error('[save-png] failed to save file', error)
      return { canceled: true, error: (error as Error).message }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
