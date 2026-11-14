import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  ArrowUpRight,
  CheckSquare,
  Square,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, ClassItem, Gender, StudentStatus, UserAccount } from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface StudentsViewProps {
  students: Student[];
  classes: ClassItem[];
  activeUser: UserAccount;
  onAddStudent: (student: Omit<Student, 'id'>) => Student;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onPromoteStudents: (studentIds: string[], targetClass: string) => void;
}

export function StudentsView({
  students,
  classes,
  activeUser,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onPromoteStudents
}: StudentsViewProps) {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Multi-select for Class Promotion / Transfer
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [targetPromotionClass, setTargetPromotionClass] = useState('');

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form fields
  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [status, setStatus] = useState<StudentStatus>('Reguler');
  const [className, setClassName] = useState('');
  const [parentName, setParentName] = useState('');

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setNis('');
    setNisn('');
    setName('');
    setGender('L');
    setStatus('Reguler');
    setClassName(classes[0]?.name || '1A');
    setParentName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setNis(s.nis);
    setNisn(s.nisn || '');
    setName(s.name);
    setGender(s.gender);
    setStatus(s.status);
    setClassName(s.className);
    setParentName(s.parentName);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nis.trim() || !parentName.trim() || !className) {
      error('Harap lengkapi semua bidang bertanda bintang.');
      return;
    }

    try {
      if (editingStudent) {
        onUpdateStudent({
          ...editingStudent,
          nis: nis.trim(),
          nisn: nisn.trim() || undefined,
          name: name.trim(),
          gender,
          status,
          className,
          parentName: parentName.trim()
        });
        success('Data Siswa Diperbarui', `Informasi ${name} berhasil disimpan.`);
      } else {
        onAddStudent({
          nis: nis.trim(),
          nisn: nisn.trim() || undefined,
          name: name.trim(),
          gender,
          status,
          className,
          parentName: parentName.trim()
        });
        success('Siswa Berhasil Ditambahkan', `${name} didaftarkan di kelas ${className}.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      error('Gagal Menyimpan Siswa', err.message);
    }
  };

  const handleDelete = (id: string) => {
    try {
      onDeleteStudent(id);
      success('Siswa Dihapus', 'Data siswa berhasil dihapus.');
      setDeleteConfirmId(null);
      setSelectedStudentIds(prev => prev.filter(sid => sid !== id));
    } catch (err: any) {
      error('Gagal Menghapus', err.message);
    }
  };

  // Promotion / Transfer execution
  const handleExecutePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPromotionClass) {
      error('Pilih kelas tujuan kenaikan/pemindahan.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      error('Pilih minimal satu siswa.');
      return;
    }

    onPromoteStudents(selectedStudentIds, targetPromotionClass);
    success(
      'Kenaikan Kelas Berhasil',
      `${selectedStudentIds.length} siswa berhasil dipindahkan ke kelas ${targetPromotionClass}. Riwayat rapor semester terdahulu tetap terjaga aman.`
    );
    setSelectedStudentIds([]);
    setIsPromoteModalOpen(false);
  };

  // Toggle select all on current filtered view
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = classFilter === 'all' || s.className === classFilter;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [students, searchTerm, classFilter, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Download Excel Template for Student Import
  const handleDownloadTemplate = () => {
    const templateRows = [
      {
        'NIS': '26270199',
        'NISN': '0019283799',
        'Nama Siswa': 'Ahmad Zaki Al-Fatih',
        'Jenis Kelamin': 'Laki-Laki',
        'Status': 'Reguler',
        'Kelas': classes[0]?.name || '1A',
        'Nama Orang Tua / Wali': 'Budi Pratama, S.E.'
      },
      {
        'NIS': '26270200',
        'NISN': '0019283800',
        'Nama Siswa': 'Nadia Putri Azzahra',
        'Jenis Kelamin': 'Perempuan',
        'Status': 'Reguler',
        'Kelas': classes[0]?.name || '1A',
        'Nama Orang Tua / Wali': 'Dewi Lestari, S.Pd.'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateRows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 28 },
      { wch: 16 },
      { wch: 12 },
      { wch: 10 },
      { wch: 26 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Format Import Siswa');
    XLSX.writeFile(wb, 'Format_Import_Data_Siswa.xlsx');
    success('Format Diunduh', 'Template Excel Data Siswa berhasil diunduh.');
  };

  // Excel Export
  const handleExportExcel = () => {
    const dataToExport = students.map((s, idx) => ({
      'No': idx + 1,
      'NIS': s.nis,
      'NISN': s.nisn || '-',
      'Nama Siswa': s.name,
      'Jenis Kelamin': s.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
      'Status': s.status,
      'Kelas': s.className,
      'Nama Orang Tua / Wali': s.parentName
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
    XLSX.writeFile(wb, 'Data_Siswa_AlJannah.xlsx');
    success('Export Berhasil', 'Data siswa berhasil diunduh ke Excel.');
  };

  // Excel Import
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          error('Berkas Excel kosong atau format tidak sesuai.');
          return;
        }

        let imported = 0;
        let skipped = 0;

        rawData.forEach(row => {
          const nisVal = String(row['NIS'] || row['nis'] || '').trim();
          const nisnVal = String(row['NISN'] || row['nisn'] || '').trim();
          const nameVal = String(row['Nama Siswa'] || row['Nama'] || row['nama'] || '').trim();
          const jkRaw = String(row['Jenis Kelamin'] || row['JK'] || 'L').toUpperCase();
          const genderVal: Gender = jkRaw.startsWith('P') ? 'P' : 'L';
          const statusRaw = String(row['Status'] || 'Reguler').toLowerCase();
          const statusVal: StudentStatus = statusRaw.includes('inklusi') ? 'Inklusi' : 'Reguler';
          const classVal = String(row['Kelas'] || '1A').trim();
          const parentVal = String(row['Nama Orang Tua / Wali'] || row['Orang Tua'] || row['Orang Tua/Wali'] || '-').trim();

          if (nisVal && nameVal) {
            try {
              onAddStudent({
                nis: nisVal,
                nisn: nisnVal || undefined,
                name: nameVal,
                gender: genderVal,
                status: statusVal,
                className: classVal,
                parentName: parentVal
              });
              imported++;
            } catch {
              skipped++;
            }
          }
        });

        success('Impor Siswa Selesai', `${imported} siswa berhasil diimpor.${skipped > 0 ? ` (${skipped} data dilewati karena NIS terduplikasi).` : ''}`);
      } catch (err: any) {
        error('Gagal Membaca Excel', err.message);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Manajemen Data Siswa</h2>
            <p className="text-xs text-slate-500">
              Kelola data peserta didik, status inklusi, dan kenaikan rombongan kelas
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {selectedStudentIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setTargetPromotionClass(classes[0]?.name || '');
                setIsPromoteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md transition-colors animate-pulse"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Naik/Pindah Kelas ({selectedStudentIds.length})</span>
            </button>
          )}

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
            title="Unduh template format Excel untuk impor data siswa"
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
            Tambah Siswa
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
            placeholder="Cari berdasarkan nama siswa, NIS, atau nama orang tua..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Filter Kelas */}
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

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full md:w-36 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Semua Status</option>
            <option value="Reguler">Reguler</option>
            <option value="Inklusi">Inklusi</option>
          </select>
        </div>
      </div>

      {/* Table Data Siswa */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 text-center w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-700"
                    title="Pilih Semua"
                  >
                    {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-4">NISN / NIS</th>
                <th className="py-3.5 px-4">Nama Lengkap Siswa</th>
                <th className="py-3.5 px-3 text-center w-20">JK</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Kelas</th>
                <th className="py-3.5 px-4">Nama Orang Tua / Wali</th>
                <th className="py-3.5 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">
                    {searchTerm || classFilter !== 'all' || statusFilter !== 'all'
                      ? 'Tidak ditemukan siswa yang sesuai filter.'
                      : 'Belum ada data siswa. Silakan klik "Tambah Siswa" atau Impor Excel.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => {
                  const isSelected = selectedStudentIds.includes(s.id);

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(s.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-3 text-center text-xs font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 font-bold">
                        <div>{s.nis}</div>
                        {s.nisn && (
                          <div className="text-[10px] text-blue-700 font-semibold font-mono">
                            NISN: {s.nisn}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {s.name}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.gender === 'L' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {s.gender === 'L' ? 'L' : 'P'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'Inklusi'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs">
                          {s.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        {s.parentName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(s.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        subtitle="Lengkapi data siswa untuk buku induk dan rapor karakter"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NIS (Nomor Induk) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nis}
                onChange={e => setNis(e.target.value)}
                placeholder="Contoh: 26270101"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NISN (Nasional - Opsional)
              </label>
              <input
                type="text"
                value={nisn}
                onChange={e => setNisn(e.target.value)}
                placeholder="Contoh: 0019283741"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rombel Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={className}
                onChange={e => setClassName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.name}>
                    Kelas {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Siswa <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Muhammad Rayyan Al-Ghifari"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              >
                <option value="L">Laki-Laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status Siswa <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StudentStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              >
                <option value="Reguler">Reguler</option>
                <option value="Inklusi">Inklusi (Kebutuhan Khusus)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Orang Tua / Wali <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={parentName}
              onChange={e => setParentName(e.target.value)}
              placeholder="Contoh: Hendri Gunawan, S.T."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nama ini tercatat sebagai identitas orang tua / wali siswa.
            </p>
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
              Simpan Data Siswa
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Naik / Pindah Kelas */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Kenaikan / Pemindahan Rombel Kelas"
        subtitle={`Pindahkan ${selectedStudentIds.length} siswa terpilih ke kelas tujuan baru`}
        maxWidth="md"
      >
        <form onSubmit={handleExecutePromotion} className="space-y-4">
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            <strong>Keamanan Riwayat:</strong> Pemindahan rombel kelas ini tidak akan menghapus atau merusak riwayat penilaian rapor yang sudah tersimpan pada tahun ajaran dan semester sebelumnya.
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Rombel Kelas Tujuan:
            </label>
            <select
              value={targetPromotionClass}
              onChange={e => setTargetPromotionClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.name}>
                  Kelas {c.name} ({c.phase})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPromoteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-md"
            >
              Proses Pemindahan ({selectedStudentIds.length} Siswa)
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Hapus Data Siswa"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <p className="text-sm font-semibold text-slate-800">
              Apakah Anda yakin ingin menghapus data siswa ini?
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
