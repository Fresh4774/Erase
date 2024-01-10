/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useCallback, useEffect, useState } from 'react'

export function dataURItoBlob(dataURI: string) {
  const mime = dataURI.split(',')[0].split(':')[1].split(';')[0]
  const binary = atob(dataURI.split(',')[1])
  const array = []
  for (let i = 0; i < binary.length; i += 1) {
    array.push(binary.charCodeAt(i))
  }
  return new Blob([new Uint8Array(array)], { type: mime })
}

export function downloadImage(uri: string, name: string) {
  const link = document.createElement('a')
  link.href = uri
  link.download = name

  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  )

  setTimeout(() => {
    link.remove()
  }, 100)
}

export function loadImage(image: HTMLImageElement, src: string) {
  return new Promise((resolve, reject) => {
    const initSRC = image.src
    const img = image
    img.onload = resolve
    img.onerror = err => {
      img.src = initSRC
      reject(err)
    }
    img.src = src
  })
}

export function useImage(
  file: Blob | MediaSource
): [HTMLImageElement, boolean, (width: number, height: number) => void] {
  const [image, setImage] = useState(new Image())
  const [isLoaded, setIsLoaded] = useState(false)

  const adjustResolution = useCallback(
    (width, height) => {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = width
      canvas.height = height
      context.drawImage(image, 0, 0, width, height)
      const resizedImage = new Image()
      resizedImage.src = canvas.toDataURL()
      setImage(resizedImage)
    },
    [image]
  )

  useEffect(() => {
    const newImage = new Image()
    newImage.onload = () => {
      setIsLoaded(true)
    }
    newImage.src = URL.createObjectURL(file)
    setImage(newImage)

    return () => {
      newImage.onload = null
    }
  }, [file])

  return [image, isLoaded, adjustResolution]
}

interface ResizeImageFileResult {
  file: File
  resized: boolean
  originalWidth?: number
  originalHeight?: number
}
export function resizeImageFile(
  file: File,
  maxSize: number
): Promise<ResizeImageFileResult> {
  const reader = new FileReader()
  const image = new Image()
  const canvas = document.createElement('canvas')

  const resize = (): ResizeImageFileResult => {
    let { width, height } = image

    if (width > height) {
      if (width > maxSize) {
        height *= maxSize / width
        width = maxSize
      }
    } else if (height > maxSize) {
      width *= maxSize / height
      height = maxSize
    }

    if (width === image.width && height === image.height) {
      return { file, resized: false }
    }

    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('could not get context')
    }
    canvas.getContext('2d')?.drawImage(image, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg')
    const blob = dataURItoBlob(dataUrl)
    const f = new File([blob], file.name, {
      type: file.type,
    })
    return {
      file: f,
      resized: true,
      originalWidth: image.width,
      originalHeight: image.height,
    }
  }

  return new Promise((resolve, reject) => {
    if (!file.type.match(/image.*/)) {
      reject(new Error('Not an image'))
      return
    }
    reader.onload = (readerEvent: any) => {
      image.onload = () => resolve(resize())
      image.src = readerEvent.target.result
    }
    reader.readAsDataURL(file)
  })
}
