import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function StokMinimum() {
  const [barangs, setBarangs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ambilData()
  }, [])

  const ambilData = async () => {
    const { data } = await supabase.from('barangs').select('*').order('stok', { ascending: true })
    if (data) {
      // 🚨 Filter super canggih: Hanya ambil barang yang stoknya lebih kecil/sama dengan minimum
      const menipis = data.filter(b => b.stok <= (b.stok_minimum || 5))
      setBarangs(menipis)
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#394059]"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#01BFD7] mr-3 inline-block"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> Pantauan Stok Minimum</h2>
        <p className="text-sm text-slate-500 mt-1">Daftar barang inventaris yang perlu segera di-restok</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* DIV PEMBUNGKUS UNTUK SCROLL HP */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[800px]">
            <thead className="bg-[#F4F7FC] text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="p-4 text-center">No</th>
                <th className="p-4">Kode Barang</th>
                <th className="p-4">Nama Barang</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-center">Sisa Stok</th>
                <th className="p-4 text-center">Batas Minimum</th>
                <th className="p-4 text-center">Status Kritis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400">Memeriksa gudang...</td></tr>
              ) : barangs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 bg-emerald-50/50">
                    <div className="text-4xl mb-3">✅</div>
                    <h3 className="font-bold text-emerald-700 text-lg">Gudang Aman Terkendali!</h3>
                    <p className="text-emerald-600/70">Tidak ada barang yang menipis atau habis saat ini.</p>
                  </td>
                </tr>
              ) : (
                barangs.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-center font-medium text-slate-400">{index + 1}</td>
                    <td className="p-4 font-bold text-[#01BFD7]">{item.kode_barang}</td>
                    <td className="p-4 text-[#394059] font-semibold">{item.nama_barang}</td>
                    <td className="p-4 text-slate-500">{item.kategori}</td>
                    <td className="p-4 text-center font-black text-rose-500 text-lg">{item.stok}</td>
                    <td className="p-4 text-center text-slate-500">{item.stok_minimum || 5}</td>
                    <td className="p-4 text-center">
                      {item.stok <= 0 ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 shadow-sm">Habis Total</span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">Menipis</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}