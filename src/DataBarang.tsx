import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function DataBarang() {
  const [barangs, setBarangs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // State untuk form Tambah/Edit
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    kode_barang: '', nama_barang: '', kategori: '', 
    stok: 0, stok_minimum: 5, satuan: 'pcs', lokasi: ''
  })

  useEffect(() => {
    ambilData()
  }, [])

  const ambilData = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('barangs').select('*').order('id', { ascending: true })
    if (data) setBarangs(data)
    setLoading(false)
  }

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('barangs').update(formData).eq('id', editId)
    } else {
      await supabase.from('barangs').insert([formData])
    }
    setShowForm(false)
    setEditId(null)
    ambilData()
  }

  const handleHapus = async (id: number) => {
    if (window.confirm('Yakin ingin menghapus barang ini?')) {
      await supabase.from('barangs').delete().eq('id', id)
      ambilData()
    }
  }

  const dataTampil = barangs.filter(b => 
    b.nama_barang.toLowerCase().includes(search.toLowerCase()) ||
    b.kode_barang.toLowerCase().includes(search.toLowerCase()) ||
    (b.kategori && b.kategori.toLowerCase().includes(search.toLowerCase()))
  )

  const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-8">
      {/* Trik CSS Khusus Print */}
      <style>{`
        @media print {
          aside, header { display: none !important; }
          main { overflow: visible !important; height: auto !important; padding: 0 !important; background: white !important; }
          body { background-color: white !important; }
        }
      `}</style>

      {/* =========================================
          TAMPILAN WEB (Sembunyi Saat di Print)
          ========================================= */}
      <div className="print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#394059] flex items-center gap-2">📦 Data Barang</h2>
            <p className="text-sm text-slate-500 mt-1">Kelola data barang inventaris G-Access</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
              <input 
                type="text" placeholder="Cari barang..." 
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2 outline-none focus:border-[#01BFD7] text-sm"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Tombol Cetak Baru */}
            <button 
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 shadow-md transition flex items-center justify-center gap-2"
            >
              <span>🖨️</span> PDF
            </button>
            <button 
              onClick={() => { setFormData({ kode_barang: '', nama_barang: '', kategori: '', stok: 0, stok_minimum: 5, satuan: 'pcs', lokasi: '' }); setEditId(null); setShowForm(true); }}
              className="w-full sm:w-auto bg-[#01BFD7] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-95 shadow-md shadow-[#01BFD7]/30 transition"
            >
              + Tambah Barang
            </button>
          </div>
        </div>

        {/* Tabel Web */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F4F7FC] text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-4 text-center">No</th>
                <th className="p-4">Kode Barang</th>
                <th className="p-4">Nama Barang</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-center">Stok</th>
                <th className="p-4 text-center">Minimum</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
              ) : dataTampil.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-500">Barang tidak ditemukan.</td></tr>
              ) : (
                dataTampil.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-center text-slate-400">{index + 1}</td>
                    <td className="p-4 font-bold text-[#01BFD7]">{item.kode_barang}</td>
                    <td className="p-4 font-semibold text-[#394059]">{item.nama_barang}</td>
                    <td className="p-4 text-slate-500">{item.kategori}</td>
                    <td className="p-4 text-center font-black text-[#394059] text-base">{item.stok}</td>
                    <td className="p-4 text-center text-slate-400">{item.stok_minimum || 5}</td>
                    <td className="p-4 text-center">
                      {item.stok <= 0 ? <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Habis</span> : item.stok <= (item.stok_minimum || 5) ? <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Menipis</span> : <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#46FF23]/20 text-green-700">Aman</span>}
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button onClick={() => { setFormData(item); setEditId(item.id); setShowForm(true); }} className="text-amber-500 hover:text-amber-600">✏️</button>
                      <button onClick={() => handleHapus(item.id)} className="text-rose-400 hover:text-rose-600">🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================
          TAMPILAN KERTAS PRINT (Sembunyi di Web)
          ========================================= */}
      <div className="hidden print:block text-black p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-1">PT. GAYATRI (G-ACCESS)</h1>
          <h2 className="text-xl font-bold text-black mb-3">Daftar Stok Barang</h2>
          <p className="text-sm text-black">Dicetak pada: {tanggalCetak}</p>
        </div>

        <table className="w-full text-center text-sm border-collapse border border-black text-black">
          <thead>
            <tr>
              <th className="border border-black p-3 font-bold w-12">No.</th>
              <th className="border border-black p-3 font-bold w-48">Kode Produk</th>
              <th className="border border-black p-3 font-bold text-left">Nama Produk</th>
              <th className="border border-black p-3 font-bold w-32">Stok Tersedia</th>
            </tr>
          </thead>
          <tbody>
            {dataTampil.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black p-2">{index + 1}</td>
                <td className="border border-black p-2">{item.kode_barang}</td>
                <td className="border border-black p-2 text-left font-medium">{item.nama_barang}</td>
                <td className="border border-black p-2 font-bold">{item.stok}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form Tambah/Edit (Print Hidden otomatis ikut pembungkus jika ditaruh di luar, tapi amannya kita beri class) */}
      {showForm && (
        <div className="fixed inset-0 bg-[#394059]/40 backdrop-blur-sm flex items-center justify-center z-50 print:hidden">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#394059] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{editId ? 'Edit Data Barang' : 'Tambah Barang Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-[#01BFD7] text-xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSimpan} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#394059] mb-1">Kode Barang</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm uppercase" value={formData.kode_barang} onChange={(e) => setFormData({...formData, kode_barang: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#394059] mb-1">Kategori</label>
                  <input type="text" className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm" value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Nama Barang</label>
                <input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm" value={formData.nama_barang} onChange={(e) => setFormData({...formData, nama_barang: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#394059] mb-1">Stok Awal</label>
                  <input type="number" required min="0" className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm" value={formData.stok} onChange={(e) => setFormData({...formData, stok: parseInt(e.target.value) || 0})} disabled={!!editId} />
                  {editId && <span className="text-[10px] text-rose-500 mt-1 block">Stok hanya bisa diubah via menu Transaksi.</span>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#394059] mb-1">Batas Minimum Stok</label>
                  <input type="number" required min="1" className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm" value={formData.stok_minimum} onChange={(e) => setFormData({...formData, stok_minimum: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#01BFD7] hover:brightness-95 transition">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}