import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export default function KelolaAkun() {
  const [pengguna, setPengguna] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State untuk form Tambah/Edit
  const [formData, setFormData] = useState({ id: '', email: '', nama: '', role: 'user', password: '' })
  const [isEdit, setIsEdit] = useState(false)

  useEffect(() => {
    ambilData()
  }, [])

  const ambilData = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('data_pengguna').select('*').order('id', { ascending: true })
    if (data) setPengguna(data)
    setLoading(false)
  }

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (isEdit) {
      // UPDATE DATA
      const { error } = await supabase.from('data_pengguna')
        .update({ email: formData.email, nama: formData.nama, role: formData.role, password: formData.password })
        .eq('id', formData.id)
      if (error) alert('Gagal update: ' + error.message)
    } else {
      // TAMBAH DATA BARU
      const { error } = await supabase.from('data_pengguna')
        .insert([{ email: formData.email, nama: formData.nama, role: formData.role, password: formData.password }])
      if (error) alert('Gagal menyimpan: ' + error.message)
    }

    setShowForm(false)
    ambilData()
    setIsSubmitting(false)
  }

  const handleHapus = async (id: number, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus akun ${nama}?`)) {
      await supabase.from('data_pengguna').delete().eq('id', id)
      ambilData()
    }
  }

  const bukaFormTambah = () => {
    setFormData({ id: '', email: '', nama: '', role: 'user', password: '' })
    setIsEdit(false)
    setShowForm(true)
  }

  const bukaFormEdit = (item: any) => {
    setFormData(item)
    setIsEdit(true)
    setShowForm(true)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-[#394059] flex items-center gap-2">
            👑 Master Data Pengguna
          </h2>
          <p className="text-xs text-slate-500 mt-1">Halaman khusus Super Admin untuk mengelola hak akses aplikasi.</p>
        </div>
        <button onClick={bukaFormTambah} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md transition">
          + Tambah Akun
        </button>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-[#F4F7FC] text-slate-500 font-semibold border-b border-slate-100">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Nama</th>
              <th className="p-4 text-center">Role</th>
              <th className="p-4">Password</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Memuat data...</td></tr>
            ) : pengguna.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="p-4 font-semibold text-[#01BFD7]">{item.email}</td>
                <td className="p-4 text-[#394059] capitalize">{item.nama}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.role === 'superadmin' ? 'bg-amber-100 text-amber-600' : 
                    item.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.role}
                  </span>
                </td>
                <td className="p-4 text-slate-500 font-mono text-xs">{item.password}</td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => bukaFormEdit(item)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg">Edit</button>
                    <button onClick={() => handleHapus(item.id, item.nama)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM TAMBAH/EDIT */}
      {showForm && (
        <div className="fixed inset-0 bg-[#394059]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#394059] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{isEdit ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSimpan} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm" placeholder="contoh@office.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Nama</label>
                <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm" placeholder="Nama lengkap" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Role (Hak Akses)</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm">
                  <option value="superadmin">superadmin</option>
                  <option value="admin">admin</option>
                  <option value="user">user</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#394059] mb-1">Password</label>
                <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm" placeholder="Password akun" />
              </div>
              
              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-500 bg-slate-100">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500">{isEdit ? 'Update Akun' : 'Simpan Akun'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}