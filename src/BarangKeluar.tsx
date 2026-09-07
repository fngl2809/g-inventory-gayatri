import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function BarangKeluar() {
  const [riwayatKeluar, setRiwayatKeluar] = useState<any[]>([])
  const [daftarBarang, setDaftarBarang] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    kode_barang: '',
    nama_barang: '',
    jumlah: 0,
    keterangan: ''
  })

  useEffect(() => {
    ambilData()
  }, [])

  const ambilData = async () => {
    const { data: dataKeluar } = await supabase.from('barang_keluar').select('*').order('created_at', { ascending: false })
    if (dataKeluar) setRiwayatKeluar(dataKeluar)

    const { data: dataBarang } = await supabase.from('barangs').select('*').order('nama_barang', { ascending: true })
    if (dataBarang) setDaftarBarang(dataBarang)

    setLoading(false)
  }

  const handlePilihBarang = (kode: string) => {
    const barangTerpilih = daftarBarang.find(b => b.kode_barang === kode)
    if (barangTerpilih) {
      setFormData({
        ...formData,
        kode_barang: barangTerpilih.kode_barang,
        nama_barang: barangTerpilih.nama_barang
      })
    }
  }

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // 1. CEK STOK DULU! Pastikan stok tidak minus
    const barangTerkait = daftarBarang.find(b => b.kode_barang === formData.kode_barang)
    if (barangTerkait) {
      if (formData.jumlah > barangTerkait.stok) {
        alert(`❌ Stok tidak cukup! Stok ${barangTerkait.nama_barang} saat ini hanya tersisa ${barangTerkait.stok}.`)
        setIsSubmitting(false)
        return // Hentikan proses simpan
      }
    }

    // 2. Simpan ke tabel riwayat barang_keluar
    const { error: errKeluar } = await supabase.from('barang_keluar').insert([{
      kode_barang: formData.kode_barang,
      nama_barang: formData.nama_barang,
      jumlah: formData.jumlah,
      keterangan: formData.keterangan,
      oleh: 'Admin'
    }])

    if (errKeluar) {
      alert('Gagal mencatat barang keluar: ' + errKeluar.message)
      setIsSubmitting(false)
      return
    }

    // 3. UPDATE (kurangi) stok di tabel barangs
    if (barangTerkait) {
      const stokBaru = barangTerkait.stok - formData.jumlah
      await supabase.from('barangs').update({ stok: stokBaru }).eq('kode_barang', formData.kode_barang)
    }

    setShowForm(false)
    ambilData() 
    setFormData({ kode_barang: '', nama_barang: '', jumlah: 0, keterangan: '' })
    setIsSubmitting(false)
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#394059]">📤 Barang Keluar</h2>
          <p className="text-sm text-slate-500 mt-1">Catat pengeluaran barang untuk instalasi/teknisi</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-[#01BFD7] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-95 shadow-md shadow-[#01BFD7]/30 transition"
        >
          - Catat Barang Keluar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F4F7FC] text-slate-500 font-semibold border-b border-slate-100">
            <tr>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Kode</th>
              <th className="p-4">Nama Barang</th>
              <th className="p-4 text-center">Jumlah Keluar</th>
              <th className="p-4">Tujuan / Keterangan</th>
              <th className="p-4">Oleh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Memuat data transaksi...</td></tr>
            ) : riwayatKeluar.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500 bg-slate-50/50">
                  <div className="text-3xl mb-2">🚚</div> Belum ada riwayat barang keluar.
                </td>
              </tr>
            ) : (
              riwayatKeluar.map((item) => {
                const tgl = new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-500">{tgl}</td>
                    <td className="p-4 font-bold text-[#01BFD7]">{item.kode_barang}</td>
                    <td className="p-4 font-semibold text-[#394059]">{item.nama_barang}</td>
                    <td className="p-4 text-center font-bold text-rose-500 text-base">-{item.jumlah}</td>
                    <td className="p-4 text-slate-600">{item.keterangan || '-'}</td>
                    <td className="p-4 text-slate-500 text-xs">{item.oleh}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#394059]/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#394059] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Catat Barang Keluar</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-[#01BFD7] text-xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSimpan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Pilih Barang</label>
                <select 
                  required
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition text-[#394059] font-medium"
                  value={formData.kode_barang}
                  onChange={(e) => handlePilihBarang(e.target.value)}
                >
                  <option value="" disabled>-- Pilih Barang dari Gudang --</option>
                  {daftarBarang.map(b => (
                    <option key={b.id} value={b.kode_barang}>
                      {b.kode_barang} - {b.nama_barang} (Sisa: {b.stok})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Jumlah Keluar</label>
                <input 
                  type="number" min="1" required
                  placeholder="Contoh: 2"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition"
                  value={formData.jumlah || ''}
                  onChange={(e) => setFormData({...formData, jumlah: parseInt(e.target.value) || 0})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Tujuan / Keterangan</label>
                <input 
                  type="text" required
                  placeholder="Contoh: Instalasi Pelanggan A / Teknisi Budi"
                  className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:border-[#01BFD7] text-sm transition"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
                <button type="submit" disabled={isSubmitting || !formData.kode_barang} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-[#01BFD7] hover:brightness-95 transition disabled:opacity-50">
                  {isSubmitting ? 'Memproses...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}