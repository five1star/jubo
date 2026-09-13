import { useEffect, useState } from 'react'

interface UseJuboImageResult {
  src: string | null
  loading: boolean
}

interface LoadedImage {
  filename: string
  src: string | null
}

/** resources 폴더의 이미지 파일을 메인 프로세스를 통해 data URL로 불러온다. */
export function useJuboImage(filename: string): UseJuboImageResult {
  const [loaded, setLoaded] = useState<LoadedImage | null>(null)

  useEffect(() => {
    let active = true

    window.api.readImage(filename).then((dataUrl) => {
      if (active) setLoaded({ filename, src: dataUrl })
    })

    return () => {
      active = false
    }
  }, [filename])

  // loaded가 아직 이번 filename에 대한 결과가 아니면(=요청 중) 로딩 상태로 취급한다.
  if (loaded?.filename !== filename) {
    return { src: null, loading: true }
  }
  return { src: loaded.src, loading: false }
}
