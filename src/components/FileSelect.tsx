import { useState } from 'react'
import * as m from '../paraglide/messages'

type FileSelectProps = {
  onSelection: (file: File) => void
}

export default function FileSelect(props: FileSelectProps) {
  const { onSelection } = props

  const [dragHover, setDragHover] = useState(false)
  const [uploadElemId] = useState(`file-upload-${Math.random().toString()}`)

  function onFileSelected(file: File) {
    if (!file) {
      return
    }
    const isImage = file.type.match('image.*')
    if (!isImage) {
      return
    }
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('file too large')
      }
      onSelection(file)
    } catch (e) {
      // eslint-disable-next-line
      alert(`error: ${(e as any).message}`)
    }
  }

  async function getFile(entry: any): Promise<File> {
    return new Promise(resolve => {
      entry.file((file: File) => resolve(file))
    })
  }

  /* eslint-disable no-await-in-loop */

  async function getAllFileEntries(items: DataTransferItemList) {
    const fileEntries: Array<File> = []
    const queue = []
    for (let i = 0; i < items.length; i += 1) {
      queue.push(items[i].webkitGetAsEntry())
    }
    while (queue.length > 0) {
      const entry = queue.shift()
      if (entry?.isFile) {
        const file = await getFile(entry)
        fileEntries.push(file)
      } else if (entry?.isDirectory) {
        queue.push(
          ...(await readAllDirectoryEntries((entry as any).createReader()))
        )
      }
    }
    return fileEntries
  }

  async function readAllDirectoryEntries(directoryReader: any) {
    const entries = []
    let readEntries = await readEntriesPromise(directoryReader)
    while (readEntries.length > 0) {
      entries.push(...readEntries)
      readEntries = await readEntriesPromise(directoryReader)
    }
    return entries
  }

  /* eslint-enable no-await-in-loop */

  async function readEntriesPromise(directoryReader: any): Promise<any> {
    return new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject)
    })
  }

  async function handleDrop(ev: React.DragEvent) {
    ev.preventDefault()
    const items = await getAllFileEntries(ev.dataTransfer.items)
    setDragHover(false)
    onFileSelected(items[0])
  }

  return (
    <label
      htmlFor={uploadElemId}
      className="block w-full h-full group relative cursor-pointer rounded-md font-medium focus-within:outline-none"
    >
      <div
        className={[
          'w-full h-full flex items-center justify-center px-6 pt-5 pb-6 text-xl',
          'border-4 border-dashed rounded-md',
          'hover:border-black hover:bg-primary',
          'text-center',
          dragHover ? 'border-black bg-primary' : 'bg-gray-100 border-gray-300',
        ].join(' ')}
        onDrop={handleDrop}
        onDragOver={ev => {
          ev.stopPropagation()
          ev.preventDefault()
          setDragHover(true)
        }}
        onDragLeave={() => setDragHover(false)}
      >
        <input
          id={uploadElemId}
          name={uploadElemId}
          type="file"
          className="sr-only"
          onChange={ev => {
            const file = ev.currentTarget.files?.[0]
            if (file) {
              onFileSelected(file)
            }
          }}
          accept="image/png, image/jpeg, image/webp"
        />
        <p>{m.drop_zone()}</p>
      </div>
    </label>
  )
}
