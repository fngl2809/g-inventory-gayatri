import { useState } from 'react'
import { supabase } from './supabase'

interface LoginProps {
  onLoginSuccess: () => void
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // State untuk mengatur mode Login atau Daftar
  const [isLogin, setIsLogin] = useState(true)
  
  // State khusus Email & Password (Username dihapus karena sudah pakai email murni)
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

    if (isLogin) {
      // PROSES LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg('Login gagal: Email atau kata sandi salah.')
      } else {
        onLoginSuccess()
      }
    } else {
      // PROSES DAFTAR AKUN BARU
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          // Otomatis mengambil kata sebelum '@' sebagai nama profil (Contoh: budi@gmail.com -> budi)
          data: { username: email.split('@')[0] } 
        }
      })
      
      if (error) {
        setErrorMsg(`Gagal mendaftar: ${error.message}`)
      } else {
        // Keluar otomatis setelah daftar agar user harus login manual
        await supabase.auth.signOut() 
        setSuccessMsg('Akun berhasil dibuat! Silakan masuk menggunakan email tersebut.')
        setIsLogin(true) // Kembalikan tampilan ke mode Login
        setPassword('') // Kosongkan password demi keamanan
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen w-full bg-white font-sans overflow-hidden">
      
      {/* SISI KIRI - LOGO & INFORMASI (Sesuai Desain Baru) */}
      <div className="hidden md:flex w-full md:w-[55%] flex-col items-center justify-center p-8 z-10 relative">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">
            <img 
              src="/logo.png" 
              alt="G-Access Logo" 
              className="w-48 h-auto object-contain drop-shadow-lg"
              onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('logo-text')!.style.display = 'block'; }}
            />
            <h1 id="logo-text" className="hidden font-extrabold text-5xl tracking-wider text-[#01BFD7]">G-ACCESS</h1>
          </div>

          <h1 className="text-4xl font-black text-[#122A45] tracking-widest mb-3">G-INVENTORY</h1>
          <p className="text-sm font-bold text-slate-400 tracking-widest mb-8">MANAJEMEN INVENTARIS & STOK GUDANG</p>
          
          <div className="w-12 h-1 bg-[#01BFD7] mb-8"></div>

          <h2 className="text-sm font-black text-[#122A45] tracking-widest">PT. GAYATRI LINTAS NUSANTARA</h2>
          <p className="text-[11px] font-bold text-[#01BFD7] tracking-widest mt-2">POP PACITAN</p>
        </div>
      </div>

      {/* SISI KANAN - FORM LOGIN / DAFTAR (Warna Biru Dongker & Miring) */}
      <div 
        className="w-full md:w-[55%] bg-[#122A45] flex items-center justify-center p-8 md:p-16 relative md:-ml-[10%] z-20 md:[clip-path:polygon(15%_0,100%_0,100%_100%,0%_100%)]"
      >
        <div className="w-full max-w-sm md:pl-12">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Pesan Notifikasi Sukses/Gagal */}
            {errorMsg && <div className="bg-red-500/20 border border-red-500/50 text-red-100 p-3 rounded-lg text-sm font-semibold">{errorMsg}</div>}
            {successMsg && <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 p-3 rounded-lg text-sm font-semibold">{successMsg}</div>}

            {/* Kolom EMAIL */}
            <div>
              <label className="block text-[11px] font-bold text-white tracking-wider mb-2">EMAIL</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh@office.com"
                className="w-full bg-[#EEF2F6] text-[#122A45] px-4 py-3 rounded-md outline-none focus:ring-2 focus:ring-[#01BFD7] font-medium"
              />
            </div>

            {/* Kolom KATA SANDI */}
            <div>
              <label className="block text-[11px] font-bold text-white tracking-wider mb-2">KATA SANDI</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#EEF2F6] text-[#122A45] px-4 py-3 rounded-md outline-none focus:ring-2 focus:ring-[#01BFD7] font-medium"
              />
            </div>

            {/* Tombol Ganti Mode (Daftar / Masuk) */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-300">
                {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
              </span>
              <button 
                type="button" 
                onClick={() => {
                  setIsLogin(!isLogin)
                  setErrorMsg('')
                  setSuccessMsg('')
                }}
                className="text-xs text-[#01BFD7] hover:text-white transition font-semibold"
              >
                {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
              </button>
            </div>

            {/* Tombol Submit Form */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#01BFD7] hover:bg-[#00a8bd] text-white font-bold py-3.5 rounded-md transition tracking-wider mt-4 disabled:opacity-50"
            >
              {loading ? 'MEMPROSES...' : (isLogin ? 'MASUK' : 'DAFTAR')}
            </button>

          </form>
        </div>
      </div>

    </div>
  )
}