import { useState } from 'react'
import { supabase } from './supabase'

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('') 
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    const formatUsername = username.toLowerCase().trim().replace(/\s+/g, '')
    const systemEmail = `${formatUsername}@gaccess.system`

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: systemEmail, password })
      if (error) {
        setErrorMsg('Username atau kata sandi salah!')
        setLoading(false)
      } else {
        onLoginSuccess() 
      }
    } else {
      const { error } = await supabase.auth.signUp({ 
        email: systemEmail, 
        password: password,
        options: {
          data: { email_asli: email, username: formatUsername }
        }
      })
      if (error) {
        setErrorMsg(`Gagal: ${error.message}`)
      } else {
        await supabase.auth.signOut()
        setSuccessMsg('Akun berhasil dibuat! Silakan masuk.')
        setIsLogin(true) 
        setPassword('') 
        setEmail('')
      }
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full font-sans bg-white overflow-hidden">
      
      {/* BACKGROUND DIAGONAL KANAN (Biru Dongker Resmi) */}
      <div 
        className="hidden md:block absolute inset-0 bg-[#0c3966] z-0"
        style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 35% 100%)' }}
      ></div>

      {/* BACKGROUND MOBILE */}
      <div 
        className="md:hidden absolute inset-0 bg-[#0c3966] z-0 top-[35%]"
        style={{ clipPath: 'polygon(0 15%, 100% 0, 100% 100%, 0 100%)' }}
      ></div>

      <div className="relative z-10 flex flex-col md:flex-row w-full min-h-screen">
        
        {/* SISI KIRI: Branding (Sekarang Rata Tengah & Proporsional) */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center text-center p-8 md:pr-16 lg:pr-32 h-[40vh] md:h-screen">
          <img 
            src="/g-access-simbol.png" 
            alt="Logo G-Access" 
            className="w-28 md:w-32 lg:w-40 mb-8 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500" 
          />
          
          <h1 className="text-4xl lg:text-5xl font-black text-[#0c3966] tracking-widest uppercase mb-3">
            G-Inventory
          </h1>
          
          <p className="text-slate-500 text-xs lg:text-sm font-bold tracking-[0.2em] uppercase mb-12">
            Manajemen Inventaris & Stok Gudang
          </p>
          
          {/* Info PT dengan Aksen Garis Cyan */}
          <div className="flex flex-col items-center mt-2">
            <div className="w-12 h-1 bg-[#01BFD7] rounded-full mb-5"></div>
            <h2 className="text-xs lg:text-sm font-extrabold text-[#0c3966] uppercase tracking-[0.2em]">
              PT. Gayatri Lintas Nusantara
            </h2>
            <p className="text-[10px] lg:text-xs text-[#01BFD7] font-bold uppercase tracking-[0.3em] mt-2">
              POP Pacitan
            </p>
          </div>
        </div>

        {/* SISI KANAN: Form Login Formal */}
        <div className="w-full md:w-1/2 flex justify-center items-center p-8 md:pr-16 lg:pr-32 h-[60vh] md:h-screen">
          <div className="w-full max-w-sm">
            
            {errorMsg && <div className="bg-rose-500/20 text-rose-100 text-sm font-medium p-3 rounded mb-6 border border-rose-500/30">{errorMsg}</div>}
            {successMsg && <div className="bg-emerald-500/20 text-emerald-100 text-sm font-medium p-3 rounded mb-6 border border-emerald-500/30">{successMsg}</div>}

            <form onSubmit={handleSubmit} className="w-full">
              <div className="mb-5">
                <label className="block text-white text-xs font-medium mb-2 uppercase tracking-wide">
                  Username
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Masukkan username"
                  className="w-full bg-white text-slate-800 px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm font-medium transition-all"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {!isLogin && (
                <div className="mb-5">
                  <label className="block text-white text-xs font-medium mb-2 uppercase tracking-wide">
                    Email Asli
                  </label>
                  <input 
                    type="email" 
                    required
                    placeholder="nama@email.com"
                    className="w-full bg-white text-slate-800 px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm font-medium transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-white text-xs font-medium mb-2 uppercase tracking-wide">
                  Kata Sandi
                </label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white text-slate-800 px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-[#01BFD7] text-sm font-medium transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex justify-between items-center mb-8 text-xs font-medium">
                <div className="text-slate-300">
                  {isLogin ? 'Belum punya akun?' : 'Sudah punya akses?'}
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setErrorMsg('')
                    setSuccessMsg('')
                  }}
                  className="text-[#01BFD7] hover:text-white transition"
                >
                  {isLogin ? 'Daftar sekarang' : 'Masuk sekarang'}
                </button>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#01BFD7] hover:bg-cyan-400 text-[#0c3966] font-bold py-3.5 rounded text-sm tracking-widest uppercase transition-colors disabled:opacity-70 shadow-lg shadow-[#01BFD7]/20"
              >
                {loading ? 'MEMPROSES...' : (isLogin ? 'MASUK' : 'DAFTAR')}
              </button>
            </form>

          </div>
        </div>
        
      </div>
    </div>
  )
}