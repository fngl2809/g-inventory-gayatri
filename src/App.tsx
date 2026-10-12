import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import DataBarang from './DataBarang'
import BarangMasuk from './BarangMasuk'
import BarangKeluar from './BarangKeluar'
import StokMinimum from './StokMinimum'
import Laporan from './Laporan'
import Login from './Login'
import InventarisServer from './InventarisServer'
import KelolaAkun from './KelolaAkun'

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [session, setSession] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const [userRole, setUserRole] = useState('user') 
  const [userName, setUserName] = useState('Pengguna')

  // ==========================================
  // LOGIKA SAPAAN WAKTU OTOMATIS
  // ==========================================
  const getSapaanWaktu = () => {
    const jam = new Date().getHours()
    if (jam >= 5 && jam < 11) return 'Selamat Pagi'
    if (jam >= 11 && jam < 15) return 'Selamat Siang'
    if (jam >= 15 && jam < 18) return 'Selamat Sore'
    return 'Selamat Malam'
  }
  const sapaanWaktu = getSapaanWaktu()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user?.email) cekDataPengguna(session.user.email)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user?.email) cekDataPengguna(session.user.email)
    })
  }, [])

  const cekDataPengguna = async (email: string) => {
    const { data } = await supabase.from('data_pengguna').select('nama, role').eq('email', email).single()
    if (data) {
      setUserName(data.nama)
      setUserRole(data.role)
    } else {
      setUserName(email.split('@')[0])
      setUserRole('user')
    }
  }

  const handleLogout = async () => {
    if(window.confirm('Yakin ingin keluar dari sistem?')) await supabase.auth.signOut()
  }

  const handleDeleteAccount = () => {
    if(window.confirm('PERINGATAN: Yakin ingin menghapus akun ini?')) alert('Sistem: Penghapusan akun hanya bisa dilakukan oleh Super Admin.')
  }

  const [stats, setStats] = useState({ totalJenis: 0, totalStok: 0, totalMasuk: 0, totalKeluar: 0 })
  const [kategoriStats, setKategoriStats] = useState<any>({})
  const [stokMenipis, setStokMenipis] = useState<any[]>([])
  const [aktivitas, setAktivitas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeMenu === 'dashboard') ambilDataDashboard()
  }, [activeMenu])

  const ambilDataDashboard = async () => {
    setIsLoading(true)
    try {
      const dateNow = new Date()
      const currentMonth = dateNow.getMonth()
      const currentYear = dateNow.getFullYear()

      const { data: barangs } = await supabase.from('barangs').select('*')
      let tJenis = 0; let tStok = 0; let kateg: any = {}; let menipis: any[] = [];
      
      if (barangs) {
        tJenis = barangs.length
        barangs.forEach(b => {
          tStok += (b.stok || 0)
          const kat = (b.kategori || 'Lainnya').trim()
          kateg[kat] = (kateg[kat] || 0) + 1
          if (b.stok <= (b.stok_minimum || 5)) menipis.push(b)
        })
        menipis.sort((a, b) => a.stok - b.stok)
        setStokMenipis(menipis.slice(0, 5)) 
        setKategoriStats(kateg)
      }

      const { data: masuk } = await supabase.from('barang_masuk').select('*').order('created_at', { ascending: false })
      const { data: keluar } = await supabase.from('barang_keluar').select('*').order('created_at', { ascending: false })
      
      let tMasukBulanan = 0; let tKeluarBulanan = 0;
      let actMasuk: any[] = []; let actKeluar: any[] = [];

      if (masuk) {
        masuk.forEach(m => {
          const mDate = new Date(m.created_at)
          if(mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear) tMasukBulanan += (m.jumlah || 0)
        })
        actMasuk = masuk.slice(0, 5).map(m => ({ ...m, tipe: 'Masuk' }))
      }

      if (keluar) {
        keluar.forEach(k => {
          const kDate = new Date(k.created_at)
          if(kDate.getMonth() === currentMonth && kDate.getFullYear() === currentYear) tKeluarBulanan += (k.jumlah || 0)
        })
        actKeluar = keluar.slice(0, 5).map(k => ({ ...k, tipe: 'Keluar' }))
      }

      const gabunganAct = [...actMasuk, ...actKeluar].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

      setStats({ totalJenis: tJenis, totalStok: tStok, totalMasuk: tMasukBulanan, totalKeluar: tKeluarBulanan })
      setAktivitas(gabunganAct)
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error)
    }
    setIsLoading(false)
  }

  // Grafik Kategori CSS
  const colorsHex = ['#01BFD7', '#46FF23', '#FBBF24', '#FB7185', '#A855F7', '#94A3B8']
  const totalKategoriItems = Object.values(kategoriStats).reduce((a: any, b: any) => a + b, 0) as number
  let currentPercent = 0
  
  const gradientStops = totalKategoriItems > 0 
    ? Object.entries(kategoriStats).map(([_, jumlah], idx) => {
        const percent = ((jumlah as number) / totalKategoriItems) * 100
        const start = currentPercent
        const end = currentPercent + percent
        currentPercent = end
        return `${colorsHex[idx % colorsHex.length]} ${start}% ${end}%`
      }).join(', ')
    : '#e2e8f0 0% 100%'

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu)
    setIsSidebarOpen(false)
  }

  return (
    <>
      {!session ? (
        <Login onLoginSuccess={() => console.log("Berhasil Login")} />
      ) : (
        <div className="flex h-screen bg-[#F4F7FC] font-sans antialiased text-slate-800 overflow-hidden">
          
          {isSidebarOpen && <div className="fixed inset-0 bg-[#394059]/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

          {/* SIDEBAR */}
          <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#2C344A] text-white flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col h-full">
              <div className="py-6 px-4 border-b border-white/5 flex flex-col justify-center items-center min-h-[150px] gap-1 relative">
                <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 md:hidden text-slate-400 hover:text-white"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                <img src="/logo.png" alt="Logo" className="w-44 h-auto object-contain drop-shadow-md mb-3" onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('fallback-text')!.style.display = 'block'; }} />
                <h1 id="fallback-text" className="hidden font-extrabold text-2xl tracking-wider text-[#01BFD7] mb-2">G-ACCESS</h1>
                <div className="text-center flex flex-col items-center">
                  <h1 className="font-black text-sm text-[#01BFD7] tracking-widest uppercase mb-1.5">G-Inventory</h1>
                  <h2 className="font-bold text-[10px] text-white tracking-widest uppercase leading-tight">PT. Gayatri Lintas Nusantara</h2>
                  <p className="text-[9px] text-slate-400 tracking-widest uppercase mt-1">POP Pacitan</p>
                </div>
              </div>

              <nav className="p-4 space-y-2 text-sm font-medium flex-1 overflow-y-auto">
                <button onClick={() => handleMenuClick('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeMenu === 'dashboard' ? 'bg-[#01BFD7] text-white shadow-lg shadow-[#01BFD7]/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> Dashboard</button>
                <button onClick={() => handleMenuClick('barang')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeMenu === 'barang' ? 'bg-[#01BFD7] text-white shadow-lg shadow-[#01BFD7]/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> Data Barang</button>
                <button onClick={() => handleMenuClick('server')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeMenu === 'server' ? 'bg-[#01BFD7] text-white shadow-lg shadow-[#01BFD7]/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg> Inventaris Server</button>
                <button onClick={() => handleMenuClick('masuk')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeMenu === 'masuk' ? 'bg-[#01BFD7] text-white shadow-lg shadow-[#01BFD7]/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Barang Masuk</button>
                <button onClick={() => handleMenuClick('keluar')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeMenu === 'keluar' ? 'bg-[#01BFD7] text-white shadow-lg shadow-[#01BFD7]/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> Barang Keluar</button>
                <button onClick={() => handleMenuClick('minimum')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeMenu === 'minimum' ? 'bg-[#01BFD7] text-white shadow-lg shadow-[#01BFD7]/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Stok Minimum</button>
                <button onClick={() => handleMenuClick('laporan')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeMenu === 'laporan' ? 'bg-[#01BFD7] text-white shadow-lg shadow-[#01BFD7]/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Laporan</button>

                {userRole === 'superadmin' && (
                  <>
                    <div className="border-t border-white/5 my-3 pt-3"></div>
                    <button onClick={() => handleMenuClick('kelola_akun')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${activeMenu === 'kelola_akun' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-amber-400 hover:bg-white/5 hover:text-amber-300'}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> 
                      Kelola Akun
                    </button>
                  </>
                )}
              </nav>

              <div className="p-4 border-t border-white/5">
                <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold">© 2026 G-Access System</p>
              </div>
            </div>
          </aside>

          {/* KONTEN UTAMA */}
          <main className="flex-1 flex flex-col overflow-y-auto" onClick={() => showProfileMenu && setShowProfileMenu(false)}>
            
            <header className="bg-white border-b border-slate-200/60 px-6 md:px-10 py-5 flex items-center justify-between shadow-sm flex-shrink-0 relative z-30">
              <div className="flex items-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsSidebarOpen(true); }} 
                  className="md:hidden mr-4 p-2 bg-slate-50 rounded-lg text-slate-500 hover:text-[#01BFD7] transition"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-[#2C344A] capitalize tracking-tight">{sapaanWaktu}, {userName} 👋</h2>
                  <p className="text-[11px] md:text-xs text-slate-400 font-medium hidden sm:block mt-0.5">Ringkasan aktivitas gudang G-Access hari ini.</p>
                </div>
              </div>
              
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }} className="flex items-center gap-3 hover:bg-slate-50 py-1.5 px-2 rounded-2xl transition cursor-pointer">
                  
                  {/* IKON SILUET ORANG BERDASARKAN LEVEL */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 shadow-sm transition-transform hover:scale-105 ${
                    userRole === 'superadmin' ? 'text-amber-500 border-amber-300' : 
                    userRole === 'admin' ? 'text-blue-500 border-blue-300' : 
                    'text-[#01BFD7] border-[#01BFD7]'
                  }`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-[#2C344A] leading-none capitalize mb-1">{userName}</p>
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${
                      userRole === 'superadmin' ? 'text-amber-500' : 
                      userRole === 'admin' ? 'text-blue-500' : 
                      'text-[#01BFD7]'
                    }`}>
                      {userRole === 'superadmin' ? 'Super Admin' : userRole === 'admin' ? 'Admin' : 'Teknisi'}
                    </span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 ml-1"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#01BFD7] flex items-center gap-3 transition"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Keluar</button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button onClick={handleDeleteAccount} className="w-full text-left px-5 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Hapus Akun</button>
                  </div>
                )}
              </div>
            </header>

            {/* DASHBOARD KONTEN */}
            {activeMenu === 'dashboard' && (
              <div className="p-6 md:p-10 space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64"><p className="text-slate-400 font-medium animate-pulse">Memuat data gudang...</p></div>
                ) : (
                  <>
                    {/* BARIS 1: 4 KOTAK STATISTIK (DIPERKECIL SEKITAR 90%) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-[#01BFD7] flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                        </div>
                        <div>
                          <span className="text-[9px] md:text-[10px] font-extrabold text-[#01BFD7] uppercase tracking-wider block mb-0.5">Total Jenis</span>
                          <div className="flex items-baseline gap-1"><span className="text-xl md:text-2xl font-black text-[#2C344A] tracking-tight">{stats.totalJenis}</span></div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div>
                          <span className="text-[9px] md:text-[10px] font-extrabold text-[#2C344A] uppercase tracking-wider block mb-0.5">Total Barang</span>
                          <div className="flex items-baseline gap-1"><span className="text-xl md:text-2xl font-black text-[#2C344A] tracking-tight">{stats.totalStok}</span></div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] md:text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">Barang Masuk</span>
                            <span className="text-[7px] font-extrabold text-amber-600 bg-amber-100 px-1 py-0.5 rounded-sm">Bulan Ini</span>
                          </div>
                          <div className="flex items-baseline gap-1"><span className="text-xl md:text-2xl font-black text-[#2C344A] tracking-tight">{stats.totalMasuk}</span></div>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] md:text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">Barang Keluar</span>
                            <span className="text-[7px] font-extrabold text-rose-500 bg-rose-100 px-1 py-0.5 rounded-sm">Bulan Ini</span>
                          </div>
                          <div className="flex items-baseline gap-1"><span className="text-xl md:text-2xl font-black text-[#2C344A] tracking-tight">{stats.totalKeluar}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* BARIS 2: KATEGORI & STOK MENIPIS (UKURAN TETAP UTUH SEPERTI GAMBAR) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* CARD DIAGRAM LINGKARAN KATEGORI */}
                      <div className="lg:col-span-5 bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <h3 className="text-base font-bold text-[#2C344A] flex items-center gap-2 mb-8">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#01BFD7]"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg> 
                          Stok per Kategori
                        </h3>
                        <div className="flex flex-col sm:flex-row items-center justify-around gap-8 py-2">
                          <div className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-lg" style={{ background: `conic-gradient(${gradientStops})` }}>
                            <div className="absolute w-24 h-24 bg-white rounded-full shadow-inner"></div>
                            <div className="relative text-center z-10">
                              <p className="text-2xl font-black text-[#2C344A]">{Object.keys(kategoriStats).length}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Kategori</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3 text-sm font-medium w-full sm:w-auto">
                            {Object.entries(kategoriStats).slice(0, 5).map(([nama, jumlah], idx) => (
                              <div key={nama} className="flex items-center justify-between gap-5">
                                <div className="flex items-center gap-3">
                                  <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: colorsHex[idx % colorsHex.length] }}></span>
                                  <span className="text-slate-600 font-semibold">{nama}</span>
                                </div>
                                <b className="text-[#2C344A] bg-slate-50 px-2 py-0.5 rounded-md">{String(jumlah)} jenis</b>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CARD TABEL STOK MENIPIS */}
                      <div className="lg:col-span-7 bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-base font-bold text-[#2C344A] flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                            Stok Menipis / Habis
                          </h3>
                          <button onClick={() => handleMenuClick('minimum')} className="text-xs text-[#01BFD7] font-bold hover:underline bg-[#01BFD7]/5 px-3 py-1.5 rounded-lg transition-colors">Lihat Semua</button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm text-slate-600 min-w-[400px]">
                            <thead className="bg-[#F8FAFC] text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                              <tr>
                                <th className="py-3.5 px-4 rounded-l-xl">Nama Barang</th>
                                <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                                <th className="py-3.5 px-4 text-center">Batas Minimum</th>
                                <th className="py-3.5 px-4 text-center rounded-r-xl">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {stokMenipis.length === 0 ? (
                                <tr><td colSpan={4} className="py-8 text-center text-slate-400">Semua stok barang dalam kondisi aman! ✅</td></tr>
                              ) : (
                                stokMenipis.map(item => (
                                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group cursor-default">
                                    <td className="py-4 px-4 font-bold text-[#2C344A] whitespace-nowrap">{item.nama_barang}</td>
                                    <td className={`py-4 px-4 text-center font-bold ${item.stok <= 0 ? 'text-red-500' : 'text-amber-500'}`}>{item.stok}</td>
                                    <td className="py-4 px-4 text-center text-slate-400">{item.stok_minimum || 5}</td>
                                    <td className="py-4 px-4 text-center">
                                      {item.stok <= 0 
                                        ? <span className="px-3 py-1.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-500 ring-1 ring-red-100">HABIS</span> 
                                        : <span className="px-3 py-1.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-500 ring-1 ring-amber-100">MENIPIS</span>
                                      }
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* BARIS 3: TABEL AKTIVITAS TRANSAKSI */}
                    <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-bold text-[#2C344A] flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          Aktivitas Transaksi Terbaru
                        </h3>
                        <button onClick={() => handleMenuClick('laporan')} className="text-xs text-[#01BFD7] font-bold hover:underline bg-[#01BFD7]/5 px-3 py-1.5 rounded-lg transition-colors">Lihat Laporan</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
                          <thead className="bg-[#F8FAFC] text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                            <tr>
                              <th className="py-3.5 px-5 rounded-l-xl">Waktu</th>
                              <th className="py-3.5 px-5">Jenis</th>
                              <th className="py-3.5 px-5">Nama Barang</th>
                              <th className="py-3.5 px-5 text-center">Jumlah</th>
                              <th className="py-3.5 px-5 rounded-r-xl">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {aktivitas.length === 0 ? (
                              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Belum ada aktivitas transaksi.</td></tr>
                            ) : (
                              aktivitas.map((act, idx) => {
                                const wkt = new Date(act.created_at).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':')
                                const isMasuk = act.tipe === 'Masuk'
                                return (
                                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors cursor-default">
                                    <td className="py-4 px-5 text-slate-400 font-medium whitespace-nowrap">{wkt}</td>
                                    <td className="py-4 px-5">
                                      <span className={`font-extrabold text-[11px] uppercase tracking-wider ${isMasuk ? 'text-emerald-500' : 'text-rose-500'}`}>{act.tipe}</span>
                                    </td>
                                    <td className="py-4 px-5 font-bold text-[#2C344A] whitespace-nowrap">{act.nama_barang}</td>
                                    <td className={`py-4 px-5 text-center font-black ${isMasuk ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {isMasuk ? '+' : '-'}{act.jumlah}
                                    </td>
                                    <td className="py-4 px-5 text-slate-500">{act.keterangan || '-'}</td>
                                  </tr>
                                )
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* HALAMAN MANAJEMEN AKUN */}
            {activeMenu === 'kelola_akun' && userRole === 'superadmin' && (
              <div className="p-4 md:p-8 space-y-6">
                <KelolaAkun />
              </div>
            )}

            {/* Menu Lainnya */}
            {activeMenu === 'barang' && <DataBarang />}
            {activeMenu === 'masuk' && <BarangMasuk />}
            {activeMenu === 'keluar' && <BarangKeluar />}
            {activeMenu === 'minimum' && <StokMinimum />}
            {activeMenu === 'laporan' && <Laporan />}
            {activeMenu === 'server' && <InventarisServer />}

          </main>
        </div>
      )}
    </>
  )
}