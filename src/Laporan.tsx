import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function Laporan() {
  const [laporanData, setLaporanData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [daftarBulan, setDaftarBulan] = useState<string[]>([])
  
  const [bulanFilter, setBulanFilter] = useState(new Date().toISOString().substring(0, 7))

  useEffect(() => {
    ambilDataLaporan()
  }, [bulanFilter])

  const ambilDataLaporan = async () => {
    setLoading(true)
    try {
      const { data: barangs } = await supabase.from('barangs').select('*')
      const { data: masuk } = await supabase.from('barang_masuk').select('*')
      const { data: keluar } = await supabase.from('barang_keluar').select('*')

      const tanggalMasuk = (masuk || []).map(m => m.created_at.substring(0, 7))
      const tanggalKeluar = (keluar || []).map(k => k.created_at.substring(0, 7))
      const semuaTanggal = [...tanggalMasuk, ...tanggalKeluar, new Date().toISOString().substring(0, 7)]
      const unikBulan = Array.from(new Set(semuaTanggal)).sort().reverse()
      setDaftarBulan(unikBulan)

      const rekap = (barangs || []).map((brg, index) => {
        const masukBulanIni = (masuk || []).filter(m => m.kode_barang === brg.kode_barang && m.created_at.substring(0, 7) === bulanFilter).reduce((sum, item) => sum + item.jumlah, 0)
        const keluarBulanIni = (keluar || []).filter(k => k.kode_barang === brg.kode_barang && k.created_at.substring(0, 7) === bulanFilter).reduce((sum, item) => sum + item.jumlah, 0)

        const masukSetelah = (masuk || []).filter(m => m.kode_barang === brg.kode_barang && m.created_at.substring(0, 7) > bulanFilter).reduce((sum, item) => sum + item.jumlah, 0)
        const keluarSetelah = (keluar || []).filter(k => k.kode_barang === brg.kode_barang && k.created_at.substring(0, 7) > bulanFilter).reduce((sum, item) => sum + item.jumlah, 0)

        const jumlahAkhir = brg.stok - masukSetelah + keluarSetelah
        const jumlahAwal = jumlahAkhir - masukBulanIni + keluarBulanIni

        return {
          no: index + 1,
          nama_produk: brg.nama_barang,
          kode_produk: brg.kode_barang,
          jumlah_awal: jumlahAwal,
          pemasukan: masukBulanIni,
          pengeluaran: keluarBulanIni,
          jumlah_akhir: jumlahAkhir
        }
      })

      setLaporanData(rekap)
    } catch (error) {
      console.error("Gagal mengambil laporan:", error)
    }
    setLoading(false)
  }

  const namaBulanTampil = new Date(bulanFilter + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="p-8">
      {/* Trik CSS: Sembunyikan Sidebar & Header Utama khusus saat Print */}
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#394059]">📄 Laporan Stok Bulanan</h2>
            <p className="text-sm text-slate-500 mt-1">Pilih bulan dan cetak ke PDF</p>
          </div>
          
          <div className="flex gap-3 items-center w-full md:w-auto">
            <select 
              className="border border-slate-200 rounded-xl p-2.5 outline-none focus:border-[#01BFD7] text-sm font-bold text-[#394059] flex-1 md:w-48 transition"
              value={bulanFilter}
              onChange={(e) => setBulanFilter(e.target.value)}
            >
              {daftarBulan.map(bln => (
                <option key={bln} value={bln}>
                  {new Date(bln + '-01').toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 bg-[#01BFD7] hover:brightness-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#01BFD7]/30 transition"
            >
              <span>🖨️</span> Cetak PDF
            </button>
          </div>
        </div>

        {/* Tabel Modern Ala Web */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F4F7FC] text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-4 text-center">No</th>
                <th className="p-4">Nama Produk</th>
                <th className="p-4">Kode Produk</th>
                <th className="p-4 text-center">Awal Bulan</th>
                <th className="p-4 text-center">Masuk</th>
                <th className="p-4 text-center">Keluar</th>
                <th className="p-4 text-center">Akhir Bulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Menghitung kalkulasi data...</td></tr>
              ) : laporanData.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Belum ada data barang.</td></tr>
              ) : (
                laporanData.map((item) => (
                  <tr key={item.kode_produk} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-center text-slate-400">{item.no}</td>
                    <td className="p-4 text-[#394059] font-bold">{item.nama_produk}</td>
                    <td className="p-4 text-[#01BFD7]">{item.kode_produk}</td>
                    <td className="p-4 text-center text-slate-600">{item.jumlah_awal}</td>
                    <td className="p-4 text-center text-[#46FF23] font-bold">+{item.pemasukan}</td>
                    <td className="p-4 text-center text-rose-500 font-bold">-{item.pengeluaran}</td>
                    <td className="p-4 text-center text-[#394059] font-black text-lg">{item.jumlah_akhir}</td>
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
          <h1 className="text-2xl font-bold text-black mb-1">PT. GAYATRI (G-ACCESS) - Laporan Stok Gudang</h1>
          <h2 className="text-xl font-bold text-black mb-3">{namaBulanTampil}</h2>
          <p className="text-sm text-black">Alamat: Jl. Contoh Alamat No.123, Kota Data</p>
          <p className="text-sm text-black">Nomor Telepon: (021) 123-4567</p>
          <p className="text-sm text-black">email: admin@g-access.com, website: www.g-access.com</p>
        </div>

        <table className="w-full text-center text-sm border-collapse border border-black text-black">
          <thead>
            <tr>
              <th className="border border-black p-3 font-bold">No.</th>
              <th className="border border-black p-3 font-bold">Nama Produk</th>
              <th className="border border-black p-3 font-bold">Kode Produk</th>
              <th className="border border-black p-3 font-bold">Jumlah<br/>Awal<br/>Bulan<br/>(Unit)</th>
              <th className="border border-black p-3 font-bold">Pemasukan<br/>(Unit)</th>
              <th className="border border-black p-3 font-bold">Pengeluaran<br/>(Unit)</th>
              <th className="border border-black p-3 font-bold">Jumlah<br/>Akhir<br/>Bulan<br/>(Unit)</th>
            </tr>
          </thead>
          <tbody>
            {laporanData.map((item) => (
              <tr key={item.kode_produk}>
                <td className="border border-black p-2">{item.no}</td>
                <td className="border border-black p-2 text-left font-medium">{item.nama_produk}</td>
                <td className="border border-black p-2">{item.kode_produk}</td>
                <td className="border border-black p-2 font-semibold">{item.jumlah_awal}</td>
                <td className="border border-black p-2">{item.pemasukan}</td>
                <td className="border border-black p-2">{item.pengeluaran}</td>
                <td className="border border-black p-2 font-bold">{item.jumlah_akhir}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-16 flex justify-end">
          <div className="text-center">
            <p className="text-sm text-black mb-16">Mengetahui,<br/>Kepala Gudang</p>
            <p className="text-sm text-black font-bold underline">_________________</p>
          </div>
        </div>
      </div>
      
    </div>
  )
}