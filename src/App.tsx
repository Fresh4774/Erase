/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/control-has-associated-label */
import { ArrowLeftIcon } from '@heroicons/react/outline'
import { useEffect, useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import Button from './components/Button'
import FileSelect from './components/FileSelect'
import Modal from './components/Modal'
import Editor from './Editor'
import { resizeImageFile } from './utils'
import Progress from './components/Progress'
import { downloadModel } from './adapters/cache'
import * as m from './paraglide/messages'
import { languageTag, onSetLanguageTag } from './paraglide/runtime'

function App() {
  const [file, setFile] = useState<File>()
  const [, setStateLanguageTag] = useState<'en' | 'zh'>('en')

  onSetLanguageTag(() => setStateLanguageTag(languageTag()))

  const [showAbout, setShowAbout] = useState(false)
  const modalRef = useRef(null)

  const [downloadProgress, setDownloadProgress] = useState(100)

  useEffect(() => {
    downloadModel('inpaint', setDownloadProgress)
  }, [])

  useClickAway(modalRef, () => {
    setShowAbout(false)
  })

  async function startWithDemoImage(img: string) {
    const imgBlob = await fetch(`/examples/${img}.jpeg`).then(r => r.blob())
    setFile(new File([imgBlob], `${img}.jpeg`, { type: 'image/jpeg' }))
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="z-10 shadow flex flex-row items-center md:justify-between h-14">
        <Button
          className={[
            file ? '' : 'opacity-50 pointer-events-none',
            'pl-1 pr-1 mx-1 sm:mx-5',
          ].join(' ')}
          icon={<ArrowLeftIcon className="w-6 h-6" />}
          onClick={() => {
            setFile(undefined)
          }}
        >
          <div className="md:w-[290px]">
            <span className="hidden sm:inline select-none">
              {m.start_new()}
            </span>
          </div>
        </Button>
      </header>

      <main
        style={{
          height: 'calc(100vh - 56px)',
        }}
        className=" relative"
      >
        {file ? (
          <Editor file={file} />
        ) : (
          <>
            <div className="flex h-full flex-1 flex-col items-center justify-center overflow-hidden">
              <div className="h-72 sm:w-1/2 max-w-5xl">
                <FileSelect
                  onSelection={async f => {
                    const { file: resizedFile } = await resizeImageFile(
                      f,
                      1024 * 4
                    )
                    setFile(resizedFile)
                  }}
                />
              </div>
              <div className="flex flex-col sm:flex-row pt-10 items-center justify-center cursor-pointer">
                <span className="text-gray-500">{m.try_it_images()}</span>
                <div className="flex space-x-2 sm:space-x-4 px-4">
                  {['dog', 'car', 'bird', 'bag', 'jacket', 'shoe', 'paris'].map(
                    image => (
                      <div
                        key={image}
                        onClick={() => startWithDemoImage(image)}
                        role="button"
                        onKeyDown={() => startWithDemoImage(image)}
                        tabIndex={-1}
                      >
                        <img
                          className="rounded-md hover:opacity-75 w-auto h-25"
                          src={`examples/${image}.jpeg`}
                          alt={image}
                          style={{ height: '100px' }}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showAbout && (
        <Modal>
          <div ref={modalRef} className="text-xl space-y-5">
            <p>
              <a
                href="https://github.com/lxfater/inpaint-web"
                style={{ color: 'blue' }}
                rel="noreferrer"
                target="_blank"
              >
                Inpaint-web
              </a>{' '}
            </p>
            <p>
              {' '}
              For any questions, please go to:{' '}
              <a
                href="https://github.com/lxfater/inpaint-web"
                style={{ color: 'blue' }}
                rel="noreferrer"
                target="_blank"
              >
                Inpaint-web
              </a>{' '}
              to provide feedback.
            </p>
          </div>
        </Modal>
      )}
      {!(downloadProgress === 100) && (
        <Modal>
          <div className="text-xl space-y-5">
            <p>{m.inpaint_model_download_message()}</p>
            <Progress percent={downloadProgress} />
          </div>
        </Modal>
      )}
    </div>
  )
}

export default App
