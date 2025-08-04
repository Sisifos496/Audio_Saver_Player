import { useState, useRef, useEffect } from 'react'
import { PlayIcon, SkipBackIcon, SkipForwardIcon, PauseIcon } from 'lucide-react'
import { supabase } from "./backend/supabase.ts"

function App() {
  useEffect(() => {
    const checkAuth = async () => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
          window.location.href = '/auth';
        }
      }).catch((error) => {
        console.error("Error checking authentication:", error);
        window.location.href = '/auth';
      });
    };

    checkAuth();
  }, []);
          
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")
  const [playingFileName, setPlayingFileName] = useState("")
  const [selectedFileArray, setSelectedFileArray] = useState([])

  const fileInputRef = useRef(null)
  const audioRef = useRef(null)

  const openFileDialog = () => {
    fileInputRef.current.click()
  }

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      try {
        const url = URL.createObjectURL(selectedFile)
        if (!selectedFileArray.some(audio => audio.name === selectedFile.name)) {
          setSelectedFileArray([...selectedFileArray, { name: selectedFile.name, url }])
        }
        setAudioUrl(url)
        setPlayingFileName(selectedFile.name)
        setIsPlaying(false)

        const timestamp = Date.now()
        const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uploadPath = `public/${timestamp}-${cleanFileName}`

        const { data, error } = await supabase 
          .storage
          .from('audio-storage')
          .upload(uploadPath, selectedFile)

        if (error) {
          console.error('Upload error:', error)
          alert('Upload failed: ' + error.message)
        } else {
          console.log('Upload successful:', data)
        }
      } catch (error) {
        console.error('Error:', error)
        alert('Error: ' + error.message)
      }
    }
  }

  const handleAudioSelect = (audio) => {
    setAudioUrl(audio.url)
    setPlayingFileName(audio.name)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.load()
    }
  }

  const togglePlayingAudioState = () => {
    if (!audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div className='bg-[#22221E]'>
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-row bg-[#59ADFD] shadow-xl h-[60%] w-[70%] rounded-[10px] text-gray-800">
          <div className="bg-[#3F82FD] w-[25%] pl-4 pt-4 pr-4 pt-4 rounded-[10px]">
            <div className='flex flex-col gap-4'>
              <ul>
                {selectedFileArray.map((audio, index) => (
                  <li
                    key={index}
                    className={`flex justify-center hover:cursor-pointer pt-3 ${playingFileName === audio.name ? 'font-bold' : ''}`}
                    onClick={() => handleAudioSelect(audio)}
                  >
                    {audio.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col w-full h-full">
            <div className='border-2 border-[#22221E] rounded-lg ml-12 mr-12 pt-12 pb-12 mt-20'>
              <div>
                <div className='flex justify-center font-bold'>
                  {playingFileName ? playingFileName : 'No audio file selected'}
                </div>
              </div>
              <div className='flex flex-row justify-center'>
                <SkipBackIcon size={64} className="ml-4 hover:opacity-[75%] hover:cursor-pointer active:opacity-[55%]" />
                <button onClick={togglePlayingAudioState}>
                  {isPlaying ? <PauseIcon size={64} className="hover:opacity-[75%] hover:cursor-pointer active:opacity-[55%]" /> : <PlayIcon size={64} className="hover:opacity-[75%] hover:cursor-pointer active:opacity-[55%]" />}
                </button>
                <SkipForwardIcon size={64} className="mr-4 hover:opacity-[75%] hover:cursor-pointer active:opacity-[55%]" />
              </div>
              <div className="flex justify-center">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept='audio/*' className='hidden' />
                {audioUrl && (
                  <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                )}
                <button onClick={openFileDialog}>Upload New Audio</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
