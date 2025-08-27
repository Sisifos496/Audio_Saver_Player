import { useState, useRef, useEffect, useCallback } from 'react'
import { PlayIcon, SkipBackIcon, SkipForwardIcon, PauseIcon } from 'lucide-react'
import { supabase } from "./backend/supabase.ts"

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState("")
  const [playingFileName, setPlayingFileName] = useState("")
  const [selectedFileArray, setSelectedFileArray] = useState([])

  const fileInputRef = useRef(null)
  const audioRef = useRef(null)
  const currentUserRef = useRef(null)
  const urlCacheRef = useRef(new Map())

  const getUserId = useCallback(async () => {
    if (currentUserRef.current) return currentUserRef.current
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || 'anonymous'
    currentUserRef.current = userId
    return userId
  }, [])

  const downloadListAudioFiles = useCallback(async () => {
    const userId = await getUserId()
    const { data, error } = await supabase
      .storage
      .from('audio-storage')
      .list(userId);
      
    if (error) {
      console.error('Error fetching audio files:', error);
      return;
    }

    const audioFilesOnly = data.filter(file => file.name !== '.emptyFolderPlaceholder');

    const audioFiles = await Promise.all(
      audioFilesOnly.map(async (file) => {
        const cached = urlCacheRef.current.get(file.name)
        if (cached && cached.expires > Date.now()) {
          return { name: file.name, url: cached.url }
        }

        const { data: signedData, error: signedError } = await supabase
          .storage
          .from('audio-storage')
          .createSignedUrl(`${userId}/${file.name}`, 3600); 

        if (signedError) {
          console.error('Error getting signed URL:', signedError);
          return null;
        }

        urlCacheRef.current.set(file.name, {
          url: signedData.signedUrl,
          expires: Date.now() + 3500000
        })

        return {
          name: file.name,
          url: signedData.signedUrl
        };
      })
    );

    const validFiles = audioFiles.filter(file => file !== null);
    setSelectedFileArray(prevFiles => {
      const newFiles = validFiles.filter(
        newFile => !prevFiles.some(existingFile => existingFile.name === newFile.name)
      );
      return [...prevFiles, ...newFiles];
    });
  }, [getUserId])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error || !user) {
          window.location.href = '/auth';
          return;
        }
        currentUserRef.current = user.id
        downloadListAudioFiles();
      } catch (error) {
        console.error("Error checking authentication:", error);
        window.location.href = '/auth';
      }
    };

    checkAuth();
  }, [downloadListAudioFiles]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, [])

  const handleFileSelect = useCallback(async (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    try {
      const userId = await getUserId()
      const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const uploadPath = `${userId}/${cleanFileName}`

      const { error } = await supabase 
        .storage
        .from('audio-storage')
        .upload(uploadPath, selectedFile)

      if (error) {
        console.error('Upload error:', error)
        alert('Upload failed: ' + error.message)
      } else {
        const { data: signedData, error: signedError } = await supabase
          .storage
          .from('audio-storage')
          .createSignedUrl(uploadPath, 3600);

        if (signedError) {
          console.error('Error getting signed URL:', signedError);
          return;
        }

        setSelectedFileArray(prev => [...prev, { name: cleanFileName, url: signedData.signedUrl }])
        setAudioUrl(signedData.signedUrl)
        setPlayingFileName(cleanFileName)
        setIsPlaying(false)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    }
  }, [getUserId])

  const handleAudioSelect = useCallback(async (audio) => {
  try {
    setAudioUrl(audio.url);
    setPlayingFileName(audio.name);
    setIsPlaying(false);
    audioRef.current?.load();
  } catch (error) {
    console.error('Error loading audio:', error);
    if (error.message.includes('400')) {
      console.log('Attempting to refresh signed URL...');
      await downloadListAudioFiles();
    }
    alert('Failed to load audio file. Please try again.');
  }
}, [downloadListAudioFiles]);

  const togglePlayingAudioState = useCallback(() => {
    if (!audioUrl || !audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  }, [audioUrl, isPlaying])

  const playNextTrack = useCallback(() => {
    if (selectedFileArray.length === 0) return;
    
    const currentIndex = selectedFileArray.findIndex(
      audio => audio.name === playingFileName
    );
    
    const nextIndex = currentIndex + 1;
    if (nextIndex < selectedFileArray.length) {
      handleAudioSelect(selectedFileArray[nextIndex]);
    } else {
      handleAudioSelect(selectedFileArray[0]);
    }
  }, [selectedFileArray, playingFileName, handleAudioSelect])

  const playPreviousTrack = useCallback(() => {
    if (selectedFileArray.length === 0) return;
    
    const currentIndex = selectedFileArray.findIndex(
      audio => audio.name === playingFileName
    );
    
    const previousIndex = currentIndex - 1;
    if (previousIndex >= 0) {
      handleAudioSelect(selectedFileArray[previousIndex]);
    } else {
      handleAudioSelect(selectedFileArray[selectedFileArray.length - 1]);
    }
  }, [selectedFileArray, playingFileName, handleAudioSelect])

  useEffect(() => {
    return () => {
      urlCacheRef.current.forEach(cached => {
        if (cached.url.startsWith('blob:')) {
          URL.revokeObjectURL(cached.url);
        }
      })
    };
  }, []);

  return (
    <div className='bg-[#22221E]'>
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-row bg-[#59ADFD] shadow-xl h-[60%] w-[70%] rounded-[10px] text-gray-800">
          <div className="bg-[#3F82FD] w-[25%] pl-4 pr-4 rounded-[10px]">
            <div className='flex flex-col gap-4'>
              {selectedFileArray.length > 0 ? (
                <ul className="w-full">
                  {selectedFileArray.map((audio, index) => (
                    <li
                      key={index}
                      className={`
                        flex justify-center hover:cursor-pointer pt-3 px-0 
                        break-all whitespace-normal overflow-hidden text-center
                        text-xs sm:text-sm md:text-base
                        ${playingFileName === audio.name ? 'font-bold' : ''}
                      `}
                      onClick={() => handleAudioSelect(audio)}
                      style={{ wordBreak: 'break-word', maxWidth: '100%' }}
                    >
                      {audio.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-gray-600 pt-3 text-xs sm:text-sm md:text-base">
                  Upload audio files to get started
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col w-full h-full">
            <div className='border-2 border-[#22221E] rounded-lg ml-12 mr-12 pt-12 pb-12 mt-20'>
              <div>
                <div className='flex justify-center font-bold text-sm sm:text-base md:text-lg'>
                  {playingFileName ? playingFileName : 'No audio file selected'}
                </div>
              </div>
              <div className='flex flex-row justify-center items-center gap-4'>
                <SkipBackIcon 
                  size={64} 
                  className="hover:opacity-[75%] hover:cursor-pointer active:opacity-[55%]"
                  onClick={playPreviousTrack}
                /> 
                <button 
                  onClick={togglePlayingAudioState}
                  className="focus:outline-none"
                >
                  {isPlaying ? 
                    <PauseIcon size={64} className="hover:opacity-[75%] hover:cursor-pointer active:opacity-[55%]" /> : 
                    <PlayIcon size={64} className="hover:opacity-[75%] hover:cursor-pointer active:opacity-[55%]" />
                  }
                </button>
                <SkipForwardIcon 
                  size={64} 
                  className="hover:opacity-[75%] hover:cursor-pointer active:opacity-[55%]"
                  onClick={playNextTrack}
                />
              </div>
              <div className="flex justify-center mt-4">
                <button 
                  onClick={openFileDialog}
                  className="bg-[#22221E] text-white px-4 py-2 rounded-lg hover:opacity-90"
                >
                  Upload New Audio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="audio/*" 
        style={{ display: 'none' }} 
      />
      <audio 
        ref={audioRef} 
        src={audioUrl || null}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => console.error('Audio error:', e)}
      />
    </div>
  )
}

export default App
