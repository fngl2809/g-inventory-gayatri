import { useState } from 'react'
import { supabase } from './supabase'

export default function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State untuk Data Pengguna (Hanya saat Register)
  const [nama, setNama] = useState('')
  const [role, setRole] = useState('user')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isRegister) {
        // PROSES REGISTER
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (authError) throw authError

        if (data.user) {
          const { error: dbError } = await supabase
            .from('data_pengguna')
            .insert([
              { 
                id_user: data.user.id,
                email: email,
                nama: nama,
                role: role
              }
            ])
            
          if (dbError) throw dbError
          
          alert('Pendaftaran berhasil! Silakan login.')
          setIsRegister(false) // Kembali ke mode login
        }
      } else {
        // PROSES LOGIN
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (authError) throw authError
        
        onLoginSuccess()
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#1E2536] font-sans">
      
      {/* BAGIAN KIRI: BRANDING & LOGO (Sekarang Dark Mode supaya logo putih terlihat) */}
      <div className="hidden lg:flex w-[55%] flex-col justify-center items-center relative overflow-hidden bg-[#2C344A]">
        {/* Dekorasi Background */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#01BFD7] rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        
        <div className="z-10 flex flex-col items-center text-center px-10">
          <img 
            src="/logo.png" 
            alt="Logo G-Access" 
            className="w-72 h-auto object-contain drop-shadow-2xl mb-6 transition-transform hover:scale-105" 
            onError={(e) => { 
              e.currentTarget.style.display = 'none'; 
              document.getElementById('fallback-text-login')!.style.display = 'block'; 
            }} 
          />
          <h1 id="fallback-text-login" className="hidden font-extrabold text-5xl tracking-wider text-[#01BFD7] mb-6 drop-shadow-lg">G-ACCESS</h1>
          
          <h1 className="font-black text-4xl text-white tracking-widest uppercase mb-3 drop-shadow-md">G-Inventory</h1>
          <p className="font-medium text-sm text-slate-400 tracking-[0.2em] uppercase mb-8">Manajemen Inventaris & Stok Gudang</p>
          
          <div className="w-16 h-1 bg-[#01BFD7] rounded-full mb-8"></div>
          
          <h2 className="font-black text-lg text-white tracking-widest uppercase leading-tight drop-shadow-sm">PT. Gayatri Lintas Nusantara</h2>
          <p className="text-xs font-bold text-[#01BFD7] tracking-widest uppercase mt-2">POP Pacitan</p>
        </div>
      </div>

      {/* BAGIAN KANAN: FORM LOGIN/REGISTER */}
      <div className="w-full lg:w-[45%] bg-[#394059] flex flex-col justify-center px-8 sm:px-16 md:px-24 shadow-[-20px_0_40px_rgba(0,0,0,0.2)] z-20 relative">
        <div className="w-full max-w-sm mx-auto">
          
          {/* Header Form */}
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-white mb-2">{isRegister ? 'Buat Akun Baru' : 'Selamat Datang'}</h2>
            <p className="text-slate-400 text-sm font-medium">
              {isRegister ? 'Daftarkan data diri Anda untuk mengakses sistem.' : 'Silakan masuk menggunakan akun Anda.'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs font-bold p-4 rounded-xl mb-6 flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {isRegister && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">Nama Lengkap</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </span>
                    <input 
                      type="text" 
                      required
                      placeholder="Masukkan nama Anda"
                      className="w-full bg-[#2C344A] border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#01BFD7] focus:ring-1 focus:ring-[#01BFD7] transition-all text-sm font-medium placeholder-slate-500"
                      value={nama} onChange={(e) => setNama(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">Role / Jabatan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    </span>
                    <select 
                      className="w-full bg-[#2C344A] border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#01BFD7] focus:ring-1 focus:ring-[#01BFD7] transition-all text-sm font-medium cursor-pointer appearance-none"
                      value={role} onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="user">Teknisi / User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">Email Office</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </span>
                <input 
                  type="email" 
                  required
                  placeholder="admin@gayatri.com"
                  className="w-full bg-[#2C344A] border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#01BFD7] focus:ring-1 focus:ring-[#01BFD7] transition-all text-sm font-medium placeholder-slate-500"
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">Kata Sandi</label>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-slate-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </span>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#2C344A] border border-white/10 text-white rounded-xl pl-12 pr-4 py-3 outline-none focus:border-[#01BFD7] focus:ring-1 focus:ring-[#01BFD7] transition-all text-sm font-medium placeholder-slate-500 tracking-widest"
                  value={password} onChange={(e) => setPassword(e.target.value)} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#01BFD7] text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-wider hover:brightness-110 shadow-lg shadow-[#01BFD7]/20 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (isRegister ? 'Mendaftarkan...' : 'Memverifikasi...') : (isRegister ? 'Daftar Sekarang' : 'Masuk Ke Sistem')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm font-medium text-slate-400">
              {isRegister ? 'Sudah memiliki akun? ' : 'Belum memiliki akun? '}
              <button 
                onClick={() => { setIsRegister(!isRegister); setError(null); }} 
                className="text-[#01BFD7] font-bold hover:underline"
              >
                {isRegister ? 'Masuk di sini' : 'Daftar sekarang'}
              </button>
            </p>
          </div>
          
        </div>
      </div>

    </div>
  )
}