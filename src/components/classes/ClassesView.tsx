import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Users,
  ClipboardCheck,
  Printer,
  AlertCircle,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { ClassItem, Teacher, Student } from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import { NavTab } from '../layout/Sidebar';

interface ClassesViewProps {
  classes: ClassItem[];
  teachers: Teacher[];
  students: Student[];
  onAddClass: (newClass: ClassItem) => void;
  onUpdateClass: (updated: ClassItem) => void;
  onDeleteClass: (classId: string) => void;
  onNavigateToAssessments: (className: string) => void;
  onNavigateToReports: (className: string) => void;
}

export function ClassesView({
  classes,
  teachers,
  students,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onNavigateToAssessments,
  onNavigateToReports
}: ClassesViewProps) {
  const { success, error } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  // Form Fields
  const [className, setClassName] = useState('');
  const [level, setLevel] = useState<number>(1);
  const [phase, setPhase] = useState('Fase A');
  const [homeroomTeacherId, setHomeroomTeacherId] = useState('');

  // Delete Confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setClassName('');
    setLevel(1);
    setPhase('Fase A');
    setHomeroomTeacherId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: ClassItem) => {
    setEditingClass(c);
    setClassName(c.name);
    setLevel(c.level);
    setPhase(c.phase);
    setHomeroomTeacherId(c.homeroomTeacherId || '');
    setIsModalOpen(true);
  };

  const handleLevelChange = (lvl: number) => {
    setLevel(lvl);
    if (lvl <= 2) setPhase('Fase A');
    else if (lvl <= 4) setPhase('Fase B');
    else setPhase('Fase C');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      error('Nama kelas tidak boleh kosong.');
      return;
    }

    try {
      if (editingClass) {
        onUpdateClass({
          ...editingClass,
          name: className.trim(),
          level,
          phase,
          homeroomTeacherId: homeroomTeacherId || undefined
        });
        success('Data Kelas Diperbarui', `Kelas ${className} berhasil disimpan.`);
      } else {
        const newClass: ClassItem = {
          id: 'c-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          name: className.trim(),
          level,
          phase,
          homeroomTeacherId: homeroomTeacherId || undefined
        };
        onAddClass(newClass);
        success('Kelas Ditambahkan', `Kelas ${className} berhasil dibuat.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      error('Gagal Menyimpan Kelas', err.message);
    }
  };

  const handleDelete = (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return;

    // Check if there are active students enrolled
    const enrolled = students.filter(s => s.className === cls.name);
    if (enrolled.length > 0) {
      error(
        'Tidak Dapat Menghapus Kelas',
        `Masih terdapat ${enrolled.length} siswa di Kelas ${cls.name}. Pindahkan siswa terlebih dahulu.`
      );
      setDeleteConfirmId(null);
      return;
    }

    onDeleteClass(id);
    success('Kelas Dihapus', `Kelas ${cls.name} telah dihapus.`);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Manajemen Data Rombongan Kelas
            </h2>
            <p className="text-xs text-slate-500">
              Kelola daftar kelas, penetapan tingkat, fase kurikulum, dan wali kelas pengampu
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas Baru
        </button>
      </div>

      {/* Class Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Rombel Kelas
          </span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{classes.length}</p>
          <p className="text-xs text-slate-400 mt-1">Kelas aktif tahun ajaran berjalan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Fase Kurikulum
          </span>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold">Fase A (1-2)</span>
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">Fase B (3-4)</span>
            <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold">Fase C (5-6)</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Standar Kurikulum Merdeka</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Rata-rata Siswa / Kelas
          </span>
          <p className="text-3xl font-extrabold text-blue-900 mt-2">
            {classes.length > 0 ? (students.length / classes.length).toFixed(1) : 0}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total {students.length} siswa terdaftar</p>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 border-b border-slate-100 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 text-center w-14">No</th>
                <th className="py-3.5 px-4">Nama Kelas</th>
                <th className="py-3.5 px-4 text-center">Tingkat</th>
                <th className="py-3.5 px-4">Fase</th>
                <th className="py-3.5 px-4">Wali Kelas Pengampu</th>
                <th className="py-3.5 px-4 text-center">Jumlah Siswa</th>
                <th className="py-3.5 px-4 text-center w-48">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    Belum ada kelas. Klik "Tambah Kelas Baru" untuk membuat rombongan belajar.
                  </td>
                </tr>
              ) : (
                classes.map((cls, idx) => {
                  const studentCount = students.filter(s => s.className === cls.name).length;
                  const homeroom = teachers.find(
                    t => t.id === cls.homeroomTeacherId || (t.role === 'Wali Kelas' && t.assignedClass === cls.name)
                  );

                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-base">
                        Kelas {cls.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        Tingkat {cls.level}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800">
                          {cls.phase}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                        {homeroom ? (
                          <div className="flex items-center gap-1.5 text-slate-900">
                            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>{homeroom.name}</span>
                          </div>
                        ) : (
                          <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-bold">
                            Belum Ditentukan
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-xs">
                          {studentCount} Siswa
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onNavigateToAssessments(cls.name)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title={`Buka Penilaian Kelas ${cls.name}`}
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigateToReports(cls.name)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                            title={`Cetak Rapor Kelas ${cls.name}`}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cls)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Edit Kelas"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(cls.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Kelas"
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

      {/* Modal Add / Edit Class */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Rombel Kelas' : 'Tambah Rombel Kelas Baru'}
        subtitle="Konfigurasi nama kelas, tingkat, fase, dan wali kelas"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Rombel Kelas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={className}
              onChange={e => setClassName(e.target.value.toUpperCase())}
              placeholder="Contoh: 1A, 2B, 3A, dst."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tingkat Kelas (Level) <span className="text-rose-500">*</span>
              </label>
              <select
                value={level}
                onChange={e => handleLevelChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6].map(lvl => (
                  <option key={lvl} value={lvl}>
                    Kelas {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fase Kurikulum <span className="text-rose-500">*</span>
              </label>
              <select
                value={phase}
                onChange={e => setPhase(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Fase A">Fase A (Kelas 1 - 2)</option>
                <option value="Fase B">Fase B (Kelas 3 - 4)</option>
                <option value="Fase C">Fase C (Kelas 5 - 6)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tugaskan Wali Kelas (Opsional)
            </label>
            <select
              value={homeroomTeacherId}
              onChange={e => setHomeroomTeacherId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Belum Ditentukan --</option>
              {teachers
                .filter(t => t.role === 'Wali Kelas')
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
            >
              Simpan Kelas
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Delete Class */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Hapus Rombel Kelas"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <p className="text-sm font-semibold text-slate-800">
              Apakah Anda yakin ingin menghapus kelas ini?
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
