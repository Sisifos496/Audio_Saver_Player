import { supabase } from "./backend/supabase.ts"
import { useState } from "react"

function Authentication() {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const signUp = async () => {
        if (!email || !password) {
            alert("Please fill in all fields")
            return
        }
        if (password.length < 6) {
            alert("Password must be at least 6 characters long")
            return
        }
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: "/home"
                }
            })
            if (error) {
                console.error("Signup error:", error)
                alert(`Error: ${error.message}`)
            } else {
                console.log("Success:", data)
                alert("Check your email for confirmation.")
            }
        } catch (err) {
            console.error("Unexpected error:", err)
            alert("An unexpected error occurred")
        }}

    const Login = async () => {
        if (!email || !password) {
            alert("Please fill in all fields")
            return
        }
        if (password.length < 6) {
            alert("Password must be at least 6 characters long")
            return
        }
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,

            })
            if (error) {
                console.error("Login error:", error)
                alert(`Error: ${error.message}`)
            } else {
                console.log("Success:", data)
                window.location.href = '/home';
            }
        } catch (err) {
            console.error("Unexpected error:", err)
            alert("An unexpected error occurred")
        }}

    return (
        <div className='bg-[#22221E]'>
            <div className="flex justify-center items-center h-screen">
                <div className="flex flex-row bg-[#59ADFD] shadow-xl h-[60%] w-[70%] rounded-[10px] text-gray-800">
                    <div className="flex flex-col justify-center items-center w-full gap-6">
                        <p className="bg-blue-500 text-xl pl-12 pr-12 pt-3 pb-3 rounded-md">Welcome To Chelly</p>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="rounded-md w-[40%] h-10 p-2"/>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="rounded-md w-[40%] h-10 p-2"/>
                        <div className="flex flex-row">
                            <button className="bg-blue-500 pl-16 pr-16 pt-3 pb-3 rounded-md" onClick={Login}>Login</button>
                            <button className="bg-blue-500 pl-16 pr-16 pt-3 pb-3 rounded-md ml-4" onClick={signUp}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Authentication;