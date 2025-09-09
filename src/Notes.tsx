import { useEffect, useState, useRef } from "react";
import { supabase } from "./backend/supabase.ts"

function Notes(){
    const [userEmail, setUserEmail] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [notes, setNotes] = useState([])
    const currentUserRef = useRef(null)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error || !user) {
                    window.location.href = '/auth';
                    return;
                }
                currentUserRef.current = user.id
                setUserEmail(user.email || 'No email associated with this account')
                await loadNotes(); 
            } catch (error) {
                console.error("Error checking authentication:", error);
                window.location.href = '/auth';
            }
        };
    
        checkAuth();
      }, []);

    const logOut = async() => {
        const { error } = await supabase.auth.signOut()
            if (error) {
                console.error('Error signing out:', error)
            } 
            else {
                window.location.href = '/auth'
            }
    }
    
    const directToHome = () => {
        window.location.href = '/home'
    }

    const saveNote = async () => {
        if (!title.trim() || !content.trim()) {
            alert('Please enter both title and content');
            return;
        }

        try {
            const userId = currentUserRef.current;
            const cleanTitle = title.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
            
            const noteBlob = new Blob([content], { type: 'text/plain' });
            
            const { error: uploadError } = await supabase
                .storage
                .from('notes-storage')
                .upload(`${userId}/notes/${cleanTitle}.txt`, noteBlob, {
                    contentType: 'text/plain'
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: urlData, error: urlError } = await supabase
                .storage
                .from('notes-storage')
                .createSignedUrl(`${userId}/notes/${cleanTitle}.txt`, 3600);

            if (urlError) {
                throw urlError;
            }

            setTitle("");
            setContent("");
            loadNotes();
            alert('Note saved successfully!');

        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note: ' + error.message);
        }
    };

    const loadNotes = async () => {
        try {
            const userId = currentUserRef.current;
            const { data, error } = await supabase
                .storage
                .from('notes-storage')
                .list(`${userId}/notes`);

            if (error) {
                throw error;
            }

            const noteFiles = data.filter(file => file.name !== '.emptyFolderPlaceholder');
            
            const loadedNotes = await Promise.all(
                noteFiles.map(async (file) => {
                    const { data: noteData, error: noteError } = await supabase
                        .storage
                        .from('notes-storage')
                        .download(`${userId}/notes/${file.name}`);

                    if (noteError) {
                        console.error('Error loading note:', noteError);
                        return null;
                    }

                    const content = await noteData.text();
                    return {
                        title: file.name.replace('.txt', ''),
                        content: content
                    };
                })
            );

            setNotes(loadedNotes.filter(note => note !== null));
        } catch (error) {
            console.error('Error loading notes:', error);
            alert('Failed to load notes: ' + error.message);
        }
    };

    const handleNoteSelect = (note) => {
        setTitle(note.title);
        setContent(note.content);
    };

    return (
        <div className='bg-[#22221E]'>
            <div className="flex flex-col justify-center items-center h-screen">
                <div className='absolute top-4 left-4'>
                    <button onClick={directToHome}>Audio</button>
                </div>
                <div className='absolute top-4 right-4 flex flex-col items-end'>
                    <p className="text-white">{userEmail}</p>
                    <button onClick={logOut} className='mb-[5%] text-white hover:opacity-90'>
                        Log Out
                    </button>
                </div>
                <div className="flex flex-row bg-[#59ADFD] shadow-xl h-[60%] w-[70%] rounded-[10px] text-gray-800">
                    <div className="bg-[#3F82FD] w-[25%] pl-4 pr-4 rounded-[10px]">
                        <div className='flex flex-col gap-4 pt-4'>
                            {notes.map((note, index) => (
                                <div
                                    key={index}
                                    className={`flex justify-center hover:cursor-pointer pt-3 px-2 
                                        break-words whitespace-normal overflow-hidden
                                        text-xl
                                        ${title === note.title ? 'font-bold' : ''}`}
                                    onClick={() => handleNoteSelect(note)}
                                >
                                    {note.title}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col justify-center items-center w-[75%] pl-4 pr-4">
                        <div className="flex flex-col justify-center items-center w-[20px] mb-4">
                            <input 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-sm font-bold p-1 rounded-[4px]" 
                                placeholder="Title..."
                            />
                        </div>
                        <div className="flex flex-col justify-center items-center w-[75%] pl-4 pr-4">
                            <textarea 
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="resize-none rounded-[10px] w-[700px] h-[400px] p-3" 
                                name="textarea"
                            />

                        </div>
                        <div className="flex flex-col justify-center items-center w-full mt-4">
                            <button
                                onClick={saveNote}
                                className="mt-4 bg-[#22221E] text-white px-4 py-2 rounded-lg hover:opacity-90"
                            >
                                Save Note
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Notes;