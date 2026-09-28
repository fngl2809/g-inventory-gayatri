import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function InventarisServer() {
  const [dataInventaris, setDataInventaris] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // State untuk Modal Edit
  const [showEditForm, setShowEditForm] = useState(false)
  const [editData, setEditData] = useState({ id: '', lokasi_server: '', nama_barang: '', jumlah_keterangan: '', status: '' })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterServer, setFilterServer] = useState('Semua') 

  const [formData, setFormData] = useState({
    lokasi_server: '',
    nama_barang: '',
    jumlah_keterangan: '',
    status: 'Terpakai'
  })

  useEffect(() => {
    ambilData()
  }, [])

  // ================= 1. READ DATA =================
  const ambilData = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('inventaris_server')
      .select('*')
      .order('lokasi_server', { ascending: true })

    if (data) setDataInventaris(data)
    setLoading(false)
  }

  // ================= 2. CREATE DATA =================
  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from('inventaris_server').insert([{
      lokasi_server: formData.lokasi_server,
      nama_barang: formData.nama_barang,
      jumlah_keterangan: formData.jumlah_keterangan,
      status: formData.status
    }])

    if (error) {
      alert('Gagal menyimpan data: ' + error.message)
    } else {
      setShowForm(false)
      ambilData()
      setFormData({
        lokasi_server: '',
        nama_barang: '',
        jumlah_keterangan: '',
        status: 'Terpakai'
      })
    }
    setIsSubmitting(false)
  }

  // ================= 3. UPDATE DATA (EDIT) =================
  const openEditModal = (item: any) => {
    setEditData(item) // Masukkan data baris yang diklik ke form edit
    setShowEditForm(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase
      .from('inventaris_server')
      .update({
        lokasi_server: editData.lokasi_server,
        nama_barang: editData.nama_barang,
        jumlah_keterangan: editData.jumlah_keterangan,
        status: editData.status
      })
      .eq('id', editData.id)

    if (error) {
      alert('Gagal mengupdate data: ' + error.message)
    } else {
      setShowEditForm(false)
      ambilData() // Refresh data
    }
    setIsSubmitting(false)
  }

  // ================= 4. DELETE DATA (HAPUS) =================
  const handleHapus = async (id: string | number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
      const { error } = await supabase
        .from('inventaris_server')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Gagal menghapus data: ' + error.message)
      } else {
        ambilData() // Refresh data setelah dihapus
      }
    }
  }

  // Logika Filter Dropdown
  const dataTampil = filterServer === 'Semua' 
    ? dataInventaris 
    : dataInventaris.filter(item => item.lokasi_server === filterServer)

  const daftarServerUnik = ['Semua', ...Array.from(new Set(dataInventaris.map(item => item.lokasi_server)))]

  return (
    // p-4 untuk HP (padding kecil), md:p-8 untuk Laptop (padding besar)
    <div className="p-4 md:p-8"> 
      
      {/* Header & Filter - Bisa numpuk di HP, berjejer di Laptop */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#394059] flex items-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#01BFD7] mr-3 md:w-7 md:h-7 shrink-0"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg> 
            Inventaris Server
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Data alat dan barang yang ada di setiap lokasi server</p>
        </div>
        
        {/* Tombol filter & tambah - Menyesuaikan lebar layar */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <select 
            className="w-full sm:w-auto border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#01BFD7] text-sm text-[#394059] font-medium bg-white"
            value={filterServer}
            onChange={(e) => setFilterServer(e.target.value)}
          >
            {daftarServerUnik.map((server, idx) => (
              <option key={idx} value={server}>{server === 'Semua' ? 'Tampilkan Semua Server' : server}</option>
            ))}
          </select>

          <button 
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto bg-[#01BFD7] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-95 shadow-md shadow-[#01BFD7]/30 transition shrink-0 flex justify-center items-center"
          >
            + Tambah Aset
          </button>
        </div>
      </div>

      {/* Tabel Inventaris - Dengan Fitur Geser Kanan-Kiri di HP (overflow-x-auto) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          {/* min-w-[800px] memaksa tabel tetap lebar, memicu scroll di HP */}
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[#F4F7FC] text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-4 whitespace-nowrap">Lokasi Server</th>
                <th className="p-4 whitespace-nowrap">Nama & Tipe Barang</th>
                <th className="p-4 whitespace-nowrap">Total / Keterangan</th>
                <th className="p-4 text-center whitespace-nowrap">Status</th>
                <th className="p-4 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Memuat data inventaris...</td></tr>
              ) : dataTampil.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 bg-slate-50/50">
                    <div className="text-3xl mb-2">🖥️</div> Belum ada data inventaris server.
                  </td>
                </tr>
              ) : (
                dataTampil.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-bold text-[#394059] capitalize">{item.lokasi_server}</td>
                    <td className="p-4 font-semibold text-[#01BFD7] capitalize">{item.nama_barang}</td>
                    <td className="p-4 text-slate-600 capitalize">{item.jumlah_keterangan}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        item.status === 'Terpakai' 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-red-100 text-red-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {/* Tombol Aksi */}
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(item)} 
                          className="p-2 text-[#01BFD7] hover:bg-cyan-50 rounded-lg transition" title="Edit">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button 
                          onClick={() => handleHapus(item.id)} 
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Hapus">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= DATALIST REUSABLE ================= */}
      {/* Ini adalah komponen yang menampung daftar lokasi server untuk dropdown form */}
      <datalist id="lokasi-server-list">
        {daftarServerUnik
          .filter(server => server !== 'Semua') // Pastikan kata "Semua" tidak masuk ke pilihan form
          .map((server, idx) => (
            <option key={idx} value={server} />
        ))}
      </datalist>

      {/* ================= MODAL TAMBAH ================= */}
      {showForm && (
        <div className="fixed inset-0 bg-[#394059]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#394059] p-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">Tambah Aset Server</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-[#01BFD7] text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSimpan} className="p-5 md:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Lokasi Server</label>
                <input 
                  type="text" 
                  list="lokasi-server-list" /* Menghubungkan input dengan Datalist di atas */
                  required 
                  placeholder="Contoh: Server Temon..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition capitalize"
                  value={formData.lokasi_server} 
                  onChange={(e) => setFormData({...formData, lokasi_server: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Nama & Tipe Barang</label>
                <input type="text" required placeholder="Contoh: Mikrotik RB750Gr3"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition"
                  value={formData.nama_barang} onChange={(e) => setFormData({...formData, nama_barang: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Total / Keterangan</label>
                <input type="text" required placeholder="Contoh: 2 Unit"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition"
                  value={formData.jumlah_keterangan} onChange={(e) => setFormData({...formData, jumlah_keterangan: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Status Penggunaan</label>
                <select 
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition text-[#394059] font-medium"
                  value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Terpakai">Terpakai</option>
                  <option value="Tidak Terpakai">Tidak Terpakai</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#01BFD7] hover:brightness-95 transition disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT ================= */}
      {showEditForm && (
        <div className="fixed inset-0 bg-[#394059]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-[#394059] p-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">Edit Aset Server</h3>
              <button onClick={() => setShowEditForm(false)} className="text-slate-400 hover:text-[#01BFD7] text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-5 md:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Lokasi Server</label>
                <input 
                  type="text" 
                  list="lokasi-server-list" /* Menghubungkan input edit dengan Datalist juga */
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition capitalize"
                  value={editData.lokasi_server} 
                  onChange={(e) => setEditData({...editData, lokasi_server: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Nama & Tipe Barang</label>
                <input type="text" required 
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition"
                  value={editData.nama_barang} onChange={(e) => setEditData({...editData, nama_barang: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Total / Keterangan</label>
                <input type="text" required 
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition"
                  value={editData.jumlah_keterangan} onChange={(e) => setEditData({...editData, jumlah_keterangan: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Status Penggunaan</label>
                <select 
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition text-[#394059] font-medium"
                  value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})}
                >
                  <option value="Terpakai">Terpakai</option>
                  <option value="Tidak Terpakai">Tidak Terpakai</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#01BFD7] hover:brightness-95 transition disabled:opacity-50">
                  {isSubmitting ? 'Menyimpan...' : 'Update Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}