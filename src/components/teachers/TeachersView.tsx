import React, { useState, useMemo, useRef } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Teacher, ClassItem, TeacherRole, Gender } from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface TeachersViewProps {
  teachers: Teacher[];
  classes: ClassItem[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => Teacher;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

export function TeachersView({
  teachers,
  classes,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}: TeachersViewProps) {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [role, setRole] = useState<TeacherRole>('Wali Kelas');
  const [teachingClass, setTeachingClass] = useState('');
  const [assignedClass, setAssignedClass] = useState('BUKAN_WALI_KELAS');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setCode('');
    setName('');
    setGender('L');
    setRole('Wali Kelas');
    const defaultClass = classes[0]?.name || '1A';
    setTeachingClass(defaultClass);
    setAssignedClass(defaultClass);
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setCode(t.code);
    setName(t.name);
    setGender(t.gender);
    setRole(t.role);
    setTeachingClass(t.teachingClass || t.assignedClass || '');
    setAssignedClass(t.role === 'Wali Kelas' && t.assignedClass ? t.assignedClass : 'BUKAN_WALI_KELAS');
    setPhone(t.phone || '');
    setEmail(t.email || '');
    setIsModalOpen(true);
  };

  const handleRoleChange = (newRole: TeacherRole) => {
    setRole(newRole);
    if (newRole !== 'Wali Kelas') {
      setAssignedClass('BUKAN_WALI_KELAS');
      if (newRole === 'Guru Bidang' && !teachingClass) {
        setTeachingClass('Semua Kelas');
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      error('Harap lengkapi Nama dan Kode Guru.');
      return;
    }

    const finalAssignedClass =
      role === 'Wali Kelas' && assignedClass !== 'BUKAN_WALI_KELAS' ? assignedClass : '';
    const finalTeachingClass = teachingClass || finalAssignedClass;

    try {
      if (editingTeacher) {
        onUpdateTeacher({
          ...editingTeacher,
          code: code.trim(),
          name: name.trim(),
          gender,
          role,
          assignedClass: finalAssignedClass,
          teachingClass: finalTeachingClass,
          phone: phone.trim(),
          email: email.trim()
        });
        success('Data Guru Diperbarui', `Informasi ${name} berhasil disimpan.`);
      } else {
        onAddTeacher({
          code: code.trim(),
          name: name.trim(),
          gender,
          role,
          assignedClass: finalAssignedClass,
          teachingClass: finalTeachingClass,
          phone: phone.trim(),
          email: email.trim()
        });
        success('Guru Berhasil Ditambahkan', `${name} telah didaftarkan dalam sistem.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      error('Gagal Menyimpan Guru', err.message || 'Terjadi kesalahan.');
    }
  };

  const handleDelete = (id: string) => {
    try {
      onDeleteTeacher(id);
      success('Data Guru Dihapus', 'Data guru telah dihapus dari sistem.');
      setDeleteConfirmId(null);
    } catch (err: any) {
      error('Gagal Menghapus', err.message);
    }
  };

  // Download Excel Template for Teacher Import
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'Kode Guru': 'KG007',
        'Nama Guru': 'Siti Fatimah, S.Pd.',
        'Jenis Kelamin': 'Perempuan',
        'Jabatan': 'Wali Kelas',
        'Kelas Mengajar': '4A',
        'Wali Kelas Dari': '4A',
        'Telepon': '081234567890',
        'Email': 'siti.fatimah@sekolah-aljannah.sch.id'
      },
      {
        'Kode Guru': 'KG008',
        'Nama Guru': 'Muhammad Iqbal, S.Si.',
        'Jenis Kelamin': 'Laki-Laki',
        'Jabatan': 'Guru Bidang',
        'Kelas Mengajar': 'Semua Kelas',
        'Wali Kelas Dari': 'Bukan Wali Kelas',
        'Telepon': '081298765432',
        'Email': 'iqbal@sekolah-aljannah.sch.id'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 32 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Format Import Guru');
    XLSX.writeFile(workbook, 'Format_Import_Data_Guru.xlsx');
    success('Format Diunduh', 'Template Excel Data Guru berhasil diunduh.');
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = teachers.map((t, index) => ({
      'No': index + 1,
      'Kode Guru': t.code,
      'Nama Guru': t.name,
      'Jenis Kelamin': t.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
      'Jabatan': t.role,
      'Kelas Mengajar': t.teachingClass || t.assignedClass || '-',
      'Wali Kelas Dari': t.assignedClass || 'Bukan Wali Kelas',
      'Telepon': t.phone || '-',
      'Email': t.email || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Guru');
    XLSX.writeFile(workbook, 'Data_Guru_AlJannah.xlsx');
    success('Export Berhasil', 'Berkas Excel Data Guru berhasil diunduh.');
  };

  // Import from Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          error('Berkas Excel kosong atau format tidak sesuai.');
          return;
        }

        let importedCount = 0;
        let skippedCount = 0;

        rawData.forEach(row => {
          const codeVal = String(
            row['Kode Guru'] || row['kode guru'] || row['Kode'] || row['NIP'] || row['nip'] || ''
          ).trim();
          const nameVal = String(row['Nama Guru'] || row['Nama'] || row['nama'] || '').trim();
          const jkRaw = String(row['Jenis Kelamin'] || row['JK'] || 'L').toUpperCase();
          const genderVal: Gender = jkRaw.startsWith('P') ? 'P' : 'L';
          const roleRaw = String(row['Jabatan'] || 'Wali Kelas').trim().toLowerCase();
          const roleVal: TeacherRole = roleRaw.includes('wali')
            ? 'Wali Kelas'
            : roleRaw.includes('bidang')
            ? 'Guru Bidang'
            : 'Guru Kelas';
          const teachingClassVal = String(row['Kelas Mengajar'] || row['Kelas'] || '').trim();
          const homeroomRaw = String(row['Wali Kelas Dari'] || row['Wali Kelas'] || '').trim();
          const assignedClassVal =
            roleVal === 'Wali Kelas'
              ? homeroomRaw && homeroomRaw.toLowerCase() !== 'bukan wali kelas'
                ? homeroomRaw
                : teachingClassVal && teachingClassVal.toLowerCase() !== 'semua kelas'
                ? teachingClassVal
                : ''
              : '';

          if (codeVal && nameVal) {
            try {
              onAddTeacher({
                code: codeVal,
                name: nameVal,
                gender: genderVal,
                role: roleVal,
                assignedClass: assignedClassVal,
                teachingClass: teachingClassVal || assignedClassVal,
                phone: String(row['Telepon'] || ''),
                email: String(row['Email'] || '')
              });
              importedCount++;
            } catch {
              skippedCount++;
            }
          }
        });

        success(
          'Impor Selesai',
          `${importedCount} guru berhasil diimpor.${skippedCount > 0 ? ` (${skippedCount} data dilewati karena Kode Guru duplikat atau bentrok wali kelas).` : ''}`
        );
      } catch (err: any) {
        error('Gagal Membaca Berkas Excel', err.message || 'Pastikan format berkas sesuai.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === 'all' || t.role === roleFilter;
      const matchClass =
        classFilter === 'all' ||
        t.assignedClass === classFilter ||
        t.teachingClass === classFilter;
      return matchSearch && matchRole && matchClass;
    });
  }, [teachers, searchTerm, roleFilter, classFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Manajemen Data Guru</h2>
            <p className="text-xs text-slate-500">
              Kelola data pengajar, kode guru, wali kelas, dan penugasan kelas mengajar
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv"
            onChange={handleImportExcel}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Unduh template format Excel untuk impor data guru"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Unduh Format Excel</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Impor dari Excel"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Impor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Ekspor ke Excel"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Guru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama guru atau Kode Guru..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filter Role */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Semua Jabatan</option>
            <option value="Wali Kelas">Wali Kelas</option>
            <option value="Guru Kelas">Guru Kelas</option>
            <option value="Guru Bidang">Guru Bidang</option>
          </select>

          {/* Filter Class */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="w-full md:w-36 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.name}>
                Kelas {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Data Guru */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">No</th>
                <th className="py-3.5 px-4">Kode Guru</th>
                <th className="py-3.5 px-4">Nama Lengkap Guru</th>
                <th className="py-3.5 px-4 text-center w-24">JK</th>
                <th className="py-3.5 px-4">Jabatan</th>
                <th className="py-3.5 px-4">Kelas Mengajar</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    {searchTerm || roleFilter !== 'all' || classFilter !== 'all'
                      ? 'Tidak ditemukan guru yang sesuai dengan kriteria pencarian.'
                      : 'Belum ada data guru. Klik "Tambah Guru" atau impor dari Excel.'}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t, index) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700 font-bold">
                      {t.code}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {t.name}
                      {t.email && <div className="text-[11px] font-normal text-slate-400">{t.email}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                        }`}
                      >
                        {t.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          t.role === 'Wali Kelas'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                            : t.role === 'Guru Bidang'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.role === 'Wali Kelas' && <UserCheck className="w-3.5 h-3.5 text-amber-600" />}
                        {t.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {t.teachingClass || t.assignedClass ? (
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                          {(t.teachingClass || t.assignedClass) === 'Semua Kelas'
                            ? 'Semua Kelas'
                            : `Kelas ${t.teachingClass || t.assignedClass}`}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Guru"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(t.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal Add / Edit Teacher */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Data Guru' : 'Tambah Guru Baru'}
        subtitle="Lengkapi data guru dan penugasan kelas"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kode Guru <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Contoh: KG001"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kode Guru diinput manual oleh administrator dan harus unik (misal: KG001).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Guru Lengkap & Gelar <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Ahmad Fauzi, S.Pd.I."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Kelamin <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jabatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={e => handleRoleChange(e.target.value as TeacherRole)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Wali Kelas">Wali Kelas</option>
                <option value="Guru Kelas">Guru Kelas</option>
                <option value="Guru Bidang">Guru Bidang</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kelas Mengajar
            </label>
            <select
              value={teachingClass}
              onChange={e => setTeachingClass(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Kelas Mengajar --</option>
              <option value="Semua Kelas">Semua Kelas (1 - 6)</option>
              {classes.map(c => (
                <option key={c.id} value={c.name}>
                  Kelas {c.name} ({c.phase})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
            <label className="block text-xs font-bold text-amber-950">
              Tugaskan Sebagai Wali Kelas: <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={assignedClass}
              onChange={e => {
                const val = e.target.value;
                setAssignedClass(val);
                if (val !== 'BUKAN_WALI_KELAS') {
                  if (role !== 'Wali Kelas') setRole('Wali Kelas');
                  if (!teachingClass) setTeachingClass(val);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="BUKAN_WALI_KELAS">Bukan Wali Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.name}>
                  Kelas {c.name} ({c.phase})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-amber-800">
              Pilih kelas jika guru bertugas sebagai wali kelas, atau pilih "Bukan Wali Kelas" untuk guru kelas / guru bidang.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0812..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@sekolah-aljannah.sch.id"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-98"
            >
              Simpan Data Guru
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Hapus Data Guru"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <p className="text-sm font-semibold text-slate-800">
              Apakah Anda yakin ingin menghapus data guru ini? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
