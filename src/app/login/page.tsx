'use client' // Esto es vital para que funcione el formulario

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase' // Nota: ajusté la ruta según tu imagen
import { useRouter } from 'next/navigation'

export default function LoginPage() { // <--- ESTE ES EL DEFAULT EXPORT
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      router.push('/') 
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <form onSubmit={handleLogin} className="p-8 border rounded-lg shadow-sm w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Iniciar Sesión</h1>
        <input
          type="email"
          placeholder="Correo"
          className="w-full p-2 mb-4 border rounded text-black bg-gray-50"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 mb-6 border rounded text-black bg-gray-50"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}