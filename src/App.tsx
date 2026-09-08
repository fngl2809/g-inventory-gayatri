import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import DataBarang from './DataBarang'
import BarangMasuk from './BarangMasuk'
import BarangKeluar from './BarangKeluar'
import StokMinimum from './StokMinimum'
import Laporan from './Laporan'
import Login from './Login'

export default function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard')
  const [session, setSession] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false) // State baru untuk Dropdown Profil

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  const handleLogout = async () => {
    if(window.confirm('Yakin ingin keluar dari sistem?')) {
      await supabase.auth.signOut()
    }
  }

  const handleDeleteAccount = () => {
    if(window.confirm('PERINGATAN: Yakin ingin menghapus akun ini?')) {
      alert('Sistem: Untuk menjaga riwayat transaksi gudang, penghapusan akun Admin hanya bisa dilakukan melalui Dashboard Supabase oleh Super Admin.')
    }
  }

  const [stats, setStats] = useState({ totalJenis: 0, totalStok: 0, totalMasuk: 0, totalKeluar: 0 })
  const [kategoriStats, setKategoriStats] = useState<any>({})
  const [stokMenipis, setStokMenipis] = useState<any[]>([])
  const [aktivitas, setAktivitas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeMenu === 'dashboard') {
      ambilDataDashboard()
    }
  }, [activeMenu])

  const ambilDataDashboard = async () => {
    setIsLoading(true)
    try {
      const { data: barangs } = await supabase.from('barangs').select('*')
      let tJenis = 0; let tStok = 0; let kateg: any = {}; let menipis: any[] = [];
      
      if (barangs) {
        tJenis = barangs.length
        barangs.forEach(b => {
          tStok += (b.stok || 0)
          const kat = (b.kategori || 'Lainnya').trim()
          kateg[kat] = (kateg[kat] || 0) + 1
          
          if (b.stok <= (b.stok_minimum || 5)) {
            menipis.push(b)
          }
        })
        menipis.sort((a, b) => a.stok - b.stok)
        setStokMenipis(menipis.slice(0, 4))
        setKategoriStats(kateg)
      }

      const { data: masuk } = await supabase.from('barang_masuk').select('*').order('created_at', { ascending: false })
      let tMasuk = 0; let actMasuk: any[] = [];
      if (masuk) {
        masuk.forEach(m => tMasuk += (m.jumlah || 0))
        actMasuk = masuk.slice(0, 5).map(m => ({ ...m, tipe: 'Masuk' }))
      }

      const { data: keluar } = await supabase.from('barang_keluar').select('*').order('created_at', { ascending: false })
      let tKeluar = 0; let actKeluar: any[] = [];
      if (keluar) {
        keluar.forEach(k => tKeluar += (k.jumlah || 0))
        actKeluar = keluar.slice(0, 5).map(k => ({ ...k, tipe: 'Keluar' }))
      }

      const gabunganAct = [...actMasuk, ...actKeluar]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)

      setStats({ totalJenis: tJenis, totalStok: tStok, totalMasuk: tMasuk, totalKeluar: tKeluar })
      setAktivitas(gabunganAct)
    } catch (error) {
      console.error("Gagal mengambil data dashboard:", error)
    }
    setIsLoading(false)
  }

  const colorsHex = ['#01BFD7', '#46FF23', '#FBBF24', '#FB7185', '#A855F7', '#94A3B8']
  const totalKategoriItems = Object.values(kategoriStats).reduce((a: any, b: any) => a + b, 0) as number
  let currentPercent = 0
  
  const gradientStops = Object.entries(kategoriStats).map(([nama, jumlah], idx) => {
    const percent = ((jumlah as number) / totalKategoriItems) * 100
    const start = currentPercent
    const end = currentPercent + percent
    currentPercent = end
    return `${colorsHex[idx % colorsHex.length]} ${start}% ${end}%`
  }).join(', ')

  const activeUsername = session?.user?.user_metadata?.username || 'Admin'
  const inisial = activeUsername.substring(0, 2).toUpperCase()

  return (
    <>
      {!session ? (
        <Login onLoginSuccess={() => console.log("Berhasil Login")} />
      ) : (
        <div className="flex h-screen bg-[#F4F7FC] font-sans antialiased text-slate-800">
          
          {/* SIDEBAR (Logout Sudah Dihapus & Logo Diperbarui) */}
          <aside className="w-64 bg-[#394059] text-white flex flex-col justify-between shadow-xl flex-shrink-0">
            <div>
              <div className="py-6 px-4 border-b border-white/10 flex flex-col justify-center items-center min-h-[150px] gap-1">
                <img 
                  src="/logo.png" 
                  alt="Logo G-Access" 
                  className="w-44 h-auto object-contain drop-shadow-md mb-3" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; document.getElementById('fallback-text')!.style.display = 'block'; }} 
                />
                <h1 id="fallback-text" className="hidden font-extrabold text-2xl tracking-wider text-[#01BFD7] mb-2">G-ACCESS</h1>
                
                <div className="text-center flex flex-col items-center">
                  <h1 className="font-black text-sm text-[#01BFD7] tracking-widest uppercase mb-1.5">G-Inventory</h1>
                  <h2 className="font-bold text-[10px] text-white tracking-widest uppercase leading-tight">PT. Gayatri Lintas Nusantara</h2>
                  <p className="text-[9px] text-slate-400 tracking-widest uppercase mt-1">POP Pacitan</p>
                </div>
              </div>

              <nav className="p-4 space-y-1 text-sm font-medium">
                <button onClick={() => setActiveMenu('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeMenu === 'dashboard' ? 'bg-[#01BFD7] text-white shadow-md shadow-[#01BFD7]/30' : 'text-slate-300 hover:bg-white/10'}`}><span>🏠</span> Dashboard</button>
                <button onClick={() => setActiveMenu('barang')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeMenu === 'barang' ? 'bg-[#01BFD7] text-white shadow-md shadow-[#01BFD7]/30' : 'text-slate-300 hover:bg-white/10'}`}><span>📦</span> Data Barang</button>
                <button onClick={() => setActiveMenu('masuk')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeMenu === 'masuk' ? 'bg-[#01BFD7] text-white shadow-md shadow-[#01BFD7]/30' : 'text-slate-300 hover:bg-white/10'}`}><span>📥</span> Barang Masuk</button>
                <button onClick={() => setActiveMenu('keluar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeMenu === 'keluar' ? 'bg-[#01BFD7] text-white shadow-md shadow-[#01BFD7]/30' : 'text-slate-300 hover:bg-white/10'}`}><span>📤</span> Barang Keluar</button>
                <button onClick={() => setActiveMenu('minimum')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeMenu === 'minimum' ? 'bg-[#01BFD7] text-white shadow-md shadow-[#01BFD7]/30' : 'text-slate-300 hover:bg-white/10'}`}><span>⚠️</span> Stok Minimum</button>
                <button onClick={() => setActiveMenu('laporan')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeMenu === 'laporan' ? 'bg-[#01BFD7] text-white shadow-md shadow-[#01BFD7]/30' : 'text-slate-300 hover:bg-white/10'}`}><span>📄</span> Laporan</button>
              </nav>
            </div>
            <div className="p-4 border-t border-white/10 text-xs text-slate-400 text-center">© 2026 G-Access System</div>
          </aside>

          {/* KONTEN UTAMA */}
          <main className="flex-1 flex flex-col overflow-y-auto" onClick={() => showProfileMenu && setShowProfileMenu(false)}>
            
            {/* HEADER ATAS (Dengan Menu Dropdown) */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm flex-shrink-0 relative z-40">
              <div>
                <h2 className="text-xl font-bold text-[#394059] capitalize">Hai, {activeUsername} 👋</h2>
                <p className="text-xs text-slate-400">Selamat datang di Sistem Informasi Stok Barang G-Access</p>
              </div>
              
              {/* Profil & Dropdown */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
                  className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-xl transition"
                >
                  <div className="w-10 h-10 rounded-full bg-[#01BFD7]/10 text-[#01BFD7] font-bold flex items-center justify-center border border-[#01BFD7]/30 uppercase">
                    {inisial}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#394059] leading-none capitalize">{activeUsername}</p>
                    <span className="text-[11px] text-[#01BFD7]">Administrator</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {/* Kotak Menu Muncul Saat Diklik */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50">
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#01BFD7] flex items-center gap-3 transition">
                      <span>🚪</span> Keluar
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button onClick={handleDeleteAccount} className="w-full text-left px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition">
                      <span>🗑️</span> Hapus Akun
                    </button>
                  </div>
                )}
              </div>
            </header>

            {/* HALAMAN DASHBOARD */}
            {activeMenu === 'dashboard' && (
              <div className="p-8 space-y-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64"><p className="text-slate-400 font-medium">Sedang menghitung data gudang...</p></div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                        <div className="w-14 h-14 rounded-2xl bg-[#01BFD7]/10 border border-[#01BFD7]/20 flex items-center justify-center text-2xl text-[#01BFD7]">📦</div>
                        <div>
                          <span className="text-xs font-semibold text-[#01BFD7] uppercase tracking-wider">Total Jenis Barang</span>
                          <div className="flex items-baseline gap-1 mt-1"><span className="text-2xl font-black text-[#394059]">{stats.totalJenis}</span><span className="text-xs text-slate-400">jenis</span></div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                        <div className="w-14 h-14 rounded-2xl bg-[#46FF23]/10 border border-[#46FF23]/30 flex items-center justify-center text-2xl text-[#394059]">✅</div>
                        <div>
                          <span className="text-xs font-semibold text-[#394059] uppercase tracking-wider">Total Stok Tersedia</span>
                          <div className="flex items-baseline gap-1 mt-1"><span className="text-2xl font-black text-[#394059]">{stats.totalStok}</span><span className="text-xs text-slate-400">unit</span></div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl text-amber-600">📥</div>
                        <div>
                          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Barang Masuk</span>
                          <div className="flex items-baseline gap-1 mt-1"><span className="text-2xl font-black text-[#394059]">{stats.totalMasuk}</span><span className="text-xs text-slate-400">unit</span></div>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-2xl text-rose-600">📤</div>
                        <div>
                          <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">Barang Keluar</span>
                          <div className="flex items-baseline gap-1 mt-1"><span className="text-2xl font-black text-[#394059]">{stats.totalKeluar}</span><span className="text-xs text-slate-400">unit</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-base font-bold text-[#394059] flex items-center gap-2 mb-6"><span>📊</span> Stok per Kategori</h3>
                        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                          <div 
                            className="relative w-32 h-32 rounded-full flex items-center justify-center shadow-sm"
                            style={{ background: `conic-gradient(${gradientStops || '#e2e8f0 0% 100%'})` }}
                          >
                            <div className="absolute w-24 h-24 bg-white rounded-full"></div>
                            <div className="relative text-center z-10">
                              <p className="text-xl font-black text-[#394059]">{Object.keys(kategoriStats).length}</p>
                              <p className="text-[10px] text-slate-400 uppercase">Kategori</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-xs font-medium w-full sm:w-auto">
                            {Object.entries(kategoriStats).slice(0, 5).map(([nama, jumlah], idx) => (
                              <div key={nama} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorsHex[idx % colorsHex.length] }}></span>
                                  <span className="text-slate-600">{nama}</span>
                                </div>
                                <b className="text-[#394059]">{String(jumlah)} jenis</b>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-base font-bold text-[#394059] flex items-center gap-2"><span>🚨</span> Stok Menipis / Habis</h3>
                          <button onClick={() => setActiveMenu('minimum')} className="text-xs text-[#01BFD7] font-semibold hover:underline">Lihat Semua</button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-[#F4F7FC] text-slate-400 uppercase text-[10px]">
                              <tr><th className="py-2.5 px-3">Nama Barang</th><th className="py-2.5 px-3 text-center">Stok</th><th className="py-2.5 px-3 text-center">Minimum</th><th className="py-2.5 px-3 text-center">Status</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {stokMenipis.length === 0 ? (
                                <tr><td colSpan={4} className="py-6 text-center text-slate-400">Semua stok barang dalam kondisi aman! ✅</td></tr>
                              ) : (
                                stokMenipis.map(item => (
                                  <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="py-3 px-3 font-semibold text-[#394059]">{item.nama_barang}</td>
                                    <td className={`py-3 px-3 text-center font-bold ${item.stok <= 0 ? 'text-red-600' : 'text-amber-500'}`}>{item.stok}</td>
                                    <td className="py-3 px-3 text-center">{item.stok_minimum || 5}</td>
                                    <td className="py-3 px-3 text-center">
                                      {item.stok <= 0 ? <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Habis</span> : <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Menipis</span>}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-[#394059] flex items-center gap-2"><span>🕒</span> Aktivitas Transaksi Terbaru</h3>
                        <button onClick={() => setActiveMenu('laporan')} className="text-xs text-[#01BFD7] font-semibold hover:underline">Lihat Laporan</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-[#F4F7FC] text-slate-400 uppercase text-[10px]">
                            <tr><th className="py-3 px-4">Waktu</th><th className="py-3 px-4">Jenis</th><th className="py-3 px-4">Nama Barang</th><th className="py-3 px-4 text-center">Jumlah</th><th className="py-3 px-4">Keterangan</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {aktivitas.length === 0 ? (
                              <tr><td colSpan={5} className="py-6 text-center text-slate-400">Belum ada aktivitas transaksi.</td></tr>
                            ) : (
                              aktivitas.map((act, idx) => {
                                const wkt = new Date(act.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })
                                const isMasuk = act.tipe === 'Masuk'
                                return (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="py-3 px-4 text-slate-400">{wkt}</td>
                                    <td className="py-3 px-4"><span className={`font-bold ${isMasuk ? 'text-[#46FF23]' : 'text-rose-500'}`}>{act.tipe}</span></td>
                                    <td className="py-3 px-4 font-semibold text-[#394059]">{act.nama_barang}</td>
                                    <td className={`py-3 px-4 text-center font-bold ${isMasuk ? 'text-[#46FF23]' : 'text-rose-500'}`}>{isMasuk ? '+' : '-'}{act.jumlah}</td>
                                    <td className="py-3 px-4 text-slate-500">{act.keterangan || '-'}</td>
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

            {activeMenu === 'barang' && <DataBarang />}
            {activeMenu === 'masuk' && <BarangMasuk />}
            {activeMenu === 'keluar' && <BarangKeluar />}
            {activeMenu === 'minimum' && <StokMinimum />}
            {activeMenu === 'laporan' && <Laporan />}

          </main>
        </div>
      )}
    </>
  )
}