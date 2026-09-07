import { useState } from 'react'
import { supabase } from './supabase'

// PERBAIKAN DI BARIS INI: Menambahkan { onLoginSuccess } agar tidak error merah
export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('') 
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    // Trik agar login bisa murni pakai Username
    const formatUsername = username.toLowerCase().trim().replace(/\s+/g, '')
    const systemEmail = `${formatUsername}@gaccess.system`

    if (isLogin) {
      // PROSES LOGIN (Hanya Username & Password)
      const { error } = await supabase.auth.signInWithPassword({ email: systemEmail, password })
      if (error) {
        setErrorMsg('Username atau kata sandi salah!')
        setLoading(false)
      } else {
        onLoginSuccess() // Beri tahu App.tsx bahwa login berhasil!
      }
    } else {
      // PROSES REGISTER (Username, Email Asli, & Password)
      const { error } = await supabase.auth.signUp({ 
        email: systemEmail, 
        password: password,
        options: {
          data: {
            email_asli: email, // Menyimpan email asli di profil Supabase
            username: formatUsername
          }
        }
      })
      
      if (error) {
        // Tampilkan pesan asli dari Supabase agar kita tahu penyebab pastinya
        setErrorMsg(`Gagal: ${error.message}`)
      } else {
        // Trik: Paksa logout langsung setelah daftar agar tidak otomatis masuk ke web
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
    <div className="flex min-h-screen w-full font-sans bg-white">
      
      {/* SISI KIRI: Branding & Informasi */}
      <div className="hidden md:flex flex-col justify-center w-1/2 bg-gradient-to-br from-[#0c3966] via-[#104e8b] to-[#01BFD7] p-16 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#01BFD7] opacity-20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 border border-white/30 rounded-full px-4 py-1.5 text-white/90 text-xs font-medium mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
            Sistem Inventaris G-Access
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            Kelola Stok Gudang<br />Lebih Cepat & Akurat.
          </h1>
          
          <p className="text-base text-white/80 max-w-md mb-12 leading-relaxed">
            Sistem informasi manajemen inventaris PT. Gayatri yang dirancang khusus untuk memantau pergerakan barang, stok minimum, dan laporan transaksi secara real-time.
          </p>

          <div className="flex gap-3">
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs px-4 py-2 rounded-full font-medium">Data Real-time</span>
            <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs px-4 py-2 rounded-full font-medium">Export PDF & Excel</span>
          </div>
        </div>
      </div>

      {/* SISI KANAN: Form Login / Register */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          
          <div className="mb-8">
            <h2 className="text-3xl font-black text-[#0c3966] mb-2">
              {isLogin ? 'Selamat datang kembali' : 'Buat Akun Baru'}
            </h2>
            <p className="text-slate-500 text-sm">
              {isLogin ? 'Masuk ke akun G-Access kamu.' : 'Daftarkan data diri untuk akses sistem.'}
            </p>
          </div>

          {errorMsg && <div className="bg-rose-50 text-rose-600 text-sm font-bold p-4 rounded-xl mb-6 border border-rose-100">{errorMsg}</div>}
          {successMsg && <div className="bg-emerald-50 text-emerald-600 text-sm font-bold p-4 rounded-xl mb-6 border border-emerald-100">{successMsg}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field Username (Tampil di Login & Register) */}
            <div>
              <label className="block text-xs font-bold text-[#0c3966] mb-2">Username</label>
              <input 
                type="text" 
                required
                placeholder="contoh: admin123"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#01BFD7] focus:bg-white text-sm font-medium text-slate-700 transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Field Email (HANYA tampil saat Register) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-[#0c3966] mb-2">Email Asli</label>
                <input 
                  type="email" 
                  required
                  placeholder="nama@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#01BFD7] focus:bg-white text-sm font-medium text-slate-700 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            {/* Field Password (Tampil di Login & Register) */}
            <div className="relative">
              <label className="block text-xs font-bold text-[#0c3966] mb-2">Kata Sandi</label>
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 outline-none focus:border-[#01BFD7] focus:bg-white text-sm font-medium text-slate-700 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-9 text-slate-400 hover:text-[#01BFD7]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
                  ) : (
                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                  )}
                </svg>
              </button>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#104e8b] hover:bg-[#0c3966] text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#104e8b]/20 transition mt-4 disabled:opacity-70"
            >
              {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar Akun')}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setErrorMsg('')
                setSuccessMsg('')
              }}
              className="text-[#01BFD7] font-bold hover:underline"
            >
              {isLogin ? 'Daftar' : 'Masuk'}
            </button>
          </div>

        </div>
      </div>
      
    </div>
  )
}