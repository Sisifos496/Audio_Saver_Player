import { useEffect, useState, useRef } from "react";
import { supabase } from "./backend/supabase.ts"

function Notes(){
    const [userEmail, setUserEmail] = useState("")
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
            </div>
        </div>
    )
}

export default Notes;