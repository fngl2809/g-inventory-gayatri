import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function DataBarang() {
  const [barangs, setBarangs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
    (b.kode_barang && b.kode_barang.toLowerCase().includes(search.toLowerCase())) ||
    (b.kategori && b.kategori.toLowerCase().includes(search.toLowerCase()))
  )

  const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="p-8">
      <style>{`
        @media print {
          aside, header { display: none !important; }
          main { overflow: visible !important; height: auto !important; padding: 0 !important; background: white !important; }
          body { background-color: white !important; }
        }
      `}</style>

      <div className="print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#394059] flex items-center gap-2"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#01BFD7] mr-3 inline-block"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>Data Barang</h2>
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
            <button 
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 shadow-md transition flex items-center justify-center gap-2"
            >
              <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 inline-block"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg></span> PDF
            </button>
            <button 
              onClick={() => { setFormData({ kode_barang: '', nama_barang: '', kategori: '', stok: 0, stok_minimum: 5, satuan: 'pcs', lokasi: '' }); setEditId(null); setShowForm(true); }}
              className="w-full sm:w-auto bg-[#01BFD7] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-95 shadow-md shadow-[#01BFD7]/30 transition"
            >
              + Tambah Barang
            </button>
          </div>
        </div>

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
                    <td className="p-4 font-bold text-[#01BFD7]">{item.kode_barang || '-'}</td>
                    <td className="p-4 font-semibold text-[#394059]">{item.nama_barang}</td>
                    <td className="p-4 text-slate-500">{item.kategori || '-'}</td>
                    <td className="p-4 text-center font-black text-[#394059] text-base">{item.stok}</td>
                    <td className="p-4 text-center text-slate-400">{item.stok_minimum || 5}</td>
                    <td className="p-4 text-center">
                      {item.stok <= 0 ? <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Habis</span> : item.stok <= (item.stok_minimum || 5) ? <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Menipis</span> : <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#46FF23]/20 text-green-700">Aman</span>}
                    </td>
                    <td className="p-4 text-center flex justify-center gap-2">
                      <button onClick={() => { setFormData(item); setEditId(item.id); setShowForm(true); }} className="text-amber-500 hover:text-amber-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-amber-500 transition-colors"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                      <button onClick={() => handleHapus(item.id)} className="text-rose-400 hover:text-rose-600"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-rose-500 transition-colors"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="hidden print:block text-black p-4">
        {/* KOP SURAT RESMI */}
        <div className="text-center mb-8 border-b-[3px] border-black pb-4">
          <h1 className="text-2xl font-black text-black uppercase mb-1">PT. GAYATRI LINTAS NUSANTARA - POP PACITAN</h1>
          <h2 className="text-lg font-bold text-black uppercase mb-2">Daftar Stok Barang</h2>
          <p className="text-sm text-black mb-1">Alamat: RT 01 RW 05, Dusun Krajan, Desa Kedungbendo, Kecamatan Arjosari, Kabupaten Pacitan</p>
          <p className="text-sm text-black mb-3">Email: gayatripoppacitan@gmail.com</p>
          <p className="text-sm text-black font-semibold">Dicetak pada: {tanggalCetak}</p>
        </div>

        <table className="w-full text-center text-sm border-collapse border border-black text-black mb-12">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-3 font-bold w-12">No.</th>
              <th className="border border-black p-3 font-bold w-32">Kode Produk</th>
              <th className="border border-black p-3 font-bold text-left">Nama Produk</th>
              <th className="border border-black p-3 font-bold">Kategori</th>
              <th className="border border-black p-3 font-bold w-32">Stok Tersedia</th>
            </tr>
          </thead>
          <tbody>
            {dataTampil.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black p-2">{index + 1}</td>
                <td className="border border-black p-2">{item.kode_barang || '-'}</td>
                <td className="border border-black p-2 text-left font-medium">{item.nama_barang}</td>
                <td className="border border-black p-2">{item.kategori || '-'}</td>
                <td className="border border-black p-2 font-bold">{item.stok}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* KOLOM TANDA TANGAN */}
        <div className="flex justify-end pr-12 mt-16">
          <div className="text-center">
            <p className="text-sm text-black mb-20">Mengetahui,<br/>Kepala Gudang</p>
            <div className="w-48 border-b border-black"></div>
          </div>
        </div>
      </div>

      {/* Modal Form Tambah/Edit */}
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
                  <label className="block text-xs font-bold text-[#394059] mb-1">
                    Kode Barang <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <input type="text" className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm uppercase" value={formData.kode_barang} onChange={(e) => setFormData({...formData, kode_barang: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#394059] mb-1">Kategori <span className="text-slate-400 font-normal">(Opsional)</span></label>
                  <input type="text" className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm uppercase" value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value.toUpperCase()})} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Nama Barang</label>
                <input type="text" required className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm uppercase" value={formData.nama_barang} onChange={(e) => setFormData({...formData, nama_barang: e.target.value.toUpperCase()})} />
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