import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function Laporan() {
  const dateNow = new Date()
  
  // State untuk Filter Bulan & Tahun
  const [bulan, setBulan] = useState(dateNow.getMonth() + 1)
  const [tahun, setTahun] = useState(dateNow.getFullYear())
  
  const [laporanData, setLaporanData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const namaBulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const tahunList = [2024, 2025, 2026, 2027, 2028, 2029, 2030]

  // Otomatis mengambil data ulang setiap kali dropdown Bulan atau Tahun diganti
  useEffect(() => {
    ambilDataLaporan()
  }, [bulan, tahun])

  const ambilDataLaporan = async () => {
    setLoading(true)

    const { data: barangs } = await supabase.from('barangs').select('*').order('nama_barang', { ascending: true })
    const { data: masuk } = await supabase.from('barang_masuk').select('*')
    const { data: keluar } = await supabase.from('barang_keluar').select('*')

    let report: any[] = []

    if (barangs) {
      barangs.forEach(b => {
        let masukBulanIni = 0
        let keluarBulanIni = 0
        let masukSetelah = 0
        let keluarSetelah = 0

        // FUNGSI PENCOCOKAN BARANG SUPER AKURAT
        const cekMatch = (trx: any) => {
          if (trx.kode_barang && trx.kode_barang !== '-' && trx.kode_barang === b.kode_barang) return true
          if (trx.nama_barang && b.nama_barang && trx.nama_barang.toLowerCase() === b.nama_barang.toLowerCase()) return true
          return false
        }

        // Hitung Transaksi Masuk
        if (masuk) {
          masuk.forEach(m => {
            if (cekMatch(m)) {
              const d = new Date(m.created_at)
              const mBulan = d.getMonth() + 1
              const mTahun = d.getFullYear()

              if (mBulan === bulan && mTahun === tahun) masukBulanIni += (m.jumlah || 0)
              if (mTahun > tahun || (mTahun === tahun && mBulan > bulan)) masukSetelah += (m.jumlah || 0)
            }
          })
        }

        // Hitung Transaksi Keluar
        if (keluar) {
          keluar.forEach(k => {
            if (cekMatch(k)) {
              const d = new Date(k.created_at)
              const kBulan = d.getMonth() + 1
              const kTahun = d.getFullYear()

              if (kBulan === bulan && kTahun === tahun) keluarBulanIni += (k.jumlah || 0)
              if (kTahun > tahun || (kTahun === tahun && kBulan > bulan)) keluarSetelah += (k.jumlah || 0)
            }
          })
        }

        // RUMUS MENGHITUNG MUNDUR (REVERSE CALCULATION)
        const stokSekarang = b.stok || 0
        const akhir = stokSekarang - masukSetelah + keluarSetelah
        const awal = akhir - masukBulanIni + keluarBulanIni

        report.push({
          ...b,
          awal,
          masuk: masukBulanIni,
          keluar: keluarBulanIni,
          akhir
        })
      })
    }

    setLaporanData(report)
    setLoading(false)
  }

  const tanggalCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  const bulanInfoCetak = `${namaBulanList[bulan - 1]} ${tahun}`

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
            <h2 className="text-2xl font-bold text-[#394059] flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#01BFD7] mr-3 inline-block"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Laporan Stok Bulanan
            </h2>
            <p className="text-sm text-slate-500 mt-1">Pilih bulan dan cetak ke PDF</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            
            {/* DROPDOWN FILTER BULAN & TAHUN */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full sm:w-auto">
              <select 
                value={bulan} 
                onChange={(e) => setBulan(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-[#394059] outline-none cursor-pointer pl-4 pr-2 py-2.5 hover:bg-slate-50 transition"
              >
                {namaBulanList.map((nama, idx) => (
                  <option key={idx} value={idx + 1}>{nama}</option>
                ))}
              </select>
              <div className="w-px h-6 bg-slate-200"></div>
              <select 
                value={tahun} 
                onChange={(e) => setTahun(Number(e.target.value))}
                className="bg-transparent text-sm font-bold text-[#394059] outline-none cursor-pointer pl-2 pr-4 py-2.5 hover:bg-slate-50 transition"
              >
                {tahunList.map((thn) => (
                  <option key={thn} value={thn}>{thn}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 shadow-md transition flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Cetak PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-[#F4F7FC] text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-4 text-center">No</th>
                  <th className="p-4">Kode Produk</th>
                  <th className="p-4">Nama Produk</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4 text-center text-slate-600 bg-slate-50/50">Awal Bulan</th>
                  <th className="p-4 text-center text-emerald-600 bg-emerald-50/50">Masuk</th>
                  <th className="p-4 text-center text-rose-600 bg-rose-50/50">Keluar</th>
                  <th className="p-4 text-center text-[#2C344A] bg-slate-50/80">Akhir Bulan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400 animate-pulse">Menyusun laporan...</td></tr>
                ) : laporanData.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">Belum ada data barang.</td></tr>
                ) : (
                  laporanData.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 text-center text-slate-400">{index + 1}</td>
                      <td className="p-4 font-bold text-[#01BFD7]">{item.kode_barang || '-'}</td>
                      <td className="p-4 font-semibold text-[#394059]">{item.nama_barang}</td>
                      <td className="p-4 text-slate-500">{item.kategori || '-'}</td>
                      <td className="p-4 text-center font-medium text-slate-600">{item.awal}</td>
                      <td className="p-4 text-center font-bold text-emerald-500">+{item.masuk}</td>
                      <td className="p-4 text-center font-bold text-rose-500">-{item.keluar}</td>
                      <td className="p-4 text-center font-black text-[#394059] text-base">{item.akhir}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="hidden print:block text-black p-4">
        <div className="text-center mb-8 border-b-[3px] border-black pb-4">
          <h1 className="text-2xl font-black text-black uppercase mb-1">PT. GAYATRI LINTAS NUSANTARA - POP PACITAN</h1>
          <h2 className="text-lg font-bold text-black uppercase mb-2">Laporan Rekapitulasi Stok Gudang</h2>
          <p className="text-sm text-black mb-1">Alamat: RT 01 RW 05, Dusun Krajan, Desa Kedungbendo, Kecamatan Arjosari, Kabupaten Pacitan</p>
          <p className="text-sm text-black mb-3">Email: gayatripoppacitan@gmail.com</p>
          <p className="text-sm text-black font-semibold">Periode: {bulanInfoCetak}</p>
        </div>

        <table className="w-full text-center text-sm border-collapse border border-black text-black mb-12">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-3 font-bold w-12">No.</th>
              <th className="border border-black p-3 font-bold">Kode Produk</th>
              <th className="border border-black p-3 font-bold text-left">Nama Produk</th>
              <th className="border border-black p-3 font-bold">Kategori</th>
              <th className="border border-black p-3 font-bold">Jumlah Awal<br/>(Unit)</th>
              <th className="border border-black p-3 font-bold">Pemasukan<br/>(Unit)</th>
              <th className="border border-black p-3 font-bold">Pengeluaran<br/>(Unit)</th>
              <th className="border border-black p-3 font-bold">Jumlah Akhir<br/>(Unit)</th>
            </tr>
          </thead>
          <tbody>
            {laporanData.map((item, index) => (
              <tr key={item.id}>
                <td className="border border-black p-2">{index + 1}</td>
                <td className="border border-black p-2">{item.kode_barang || '-'}</td>
                <td className="border border-black p-2 text-left font-medium">{item.nama_barang}</td>
                <td className="border border-black p-2">{item.kategori || '-'}</td>
                <td className="border border-black p-2">{item.awal}</td>
                <td className="border border-black p-2">{item.masuk}</td>
                <td className="border border-black p-2">{item.keluar}</td>
                <td className="border border-black p-2 font-bold">{item.akhir}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end pr-12 mt-16">
          <div className="text-center">
            <p className="text-sm text-black mb-20">Mengetahui,<br/>Kepala Gudang</p>
            <div className="w-48 border-b border-black"></div>
          </div>
        </div>
      </div>
    </div>
  )
}