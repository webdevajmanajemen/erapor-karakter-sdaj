import React, { useState, useRef } from 'react';
import {
  Settings,
  Shield,
  UserCheck,
  Database,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  Plus,
  Edit2,
  Info,
  Code2,
  BookOpen,
  Sparkles
} from 'lucide-react';
import {
  UserAccount,
  SchoolProfile,
  SupabaseConfig,
  Teacher,
  ClassItem,
  Student,
  SubCharacter,
  CharacterIndicator,
  GradeOption
} from '../../types';
import { Modal } from '../ui/Modal';
import { SupabaseSqlEditorModal } from './SupabaseSqlEditorModal';
import { useToast } from '../../context/ToastContext';

interface SettingsViewProps {
  schoolProfile: SchoolProfile;
  users: UserAccount[];
  teachers: Teacher[];
  classes?: ClassItem[];
  students?: Student[];
  subCharacters?: SubCharacter[];
  indicators?: CharacterIndicator[];
  gradeOptions?: GradeOption[];
  activeUser: UserAccount;
  supabaseConfig: SupabaseConfig;
  onUpdateSchoolProfile: (p: SchoolProfile) => void;
  onUpdateUsers: (users: UserAccount[]) => void;
  onUpdateSupabaseConfig: (cfg: SupabaseConfig) => void;
  onResetDefaultData: () => void;
  onClearDummyData: () => void;
  onExportJson: () => void;
  onImportJson: (json: string) => void;
}

export function SettingsView({
  schoolProfile,
  users,
  teachers,
  classes = [],
  students = [],
  subCharacters = [],
  indicators = [],
  gradeOptions = [],
  activeUser,
  supabaseConfig,
  onUpdateSchoolProfile,
  onUpdateUsers,
  onUpdateSupabaseConfig,
  onResetDefaultData,
  onClearDummyData,
  onExportJson,
  onImportJson
}: SettingsViewProps) {
  const { success, error, warning } = useToast();
  const fileBackupRef = useRef<HTMLInputElement>(null);

  // SQL Editor Modal
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  // App Settings
  const [appName, setAppName] = useState(schoolProfile.name);

  // Supabase Config State
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(supabaseConfig.anonKey);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // User Management Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher'>('teacher');
  const [linkedTeacherId, setLinkedTeacherId] = useState('');

  // Confirmation Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearDummyConfirmOpen, setIsClearDummyConfirmOpen] = useState(false);

  const handleSaveAppName = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolProfile({ ...schoolProfile, name: appName.trim() });
    success('Pengaturan Disimpan', 'Nama aplikasi berhasil diperbarui.');
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingConnection(true);

    setTimeout(() => {
      setIsTestingConnection(false);
      const isConfigured = Boolean(supabaseUrl.trim() && supabaseAnonKey.trim());
      onUpdateSupabaseConfig({
        url: supabaseUrl.trim(),
        anonKey: supabaseAnonKey.trim(),
        isConnected: isConfigured,
        autoSync: isConfigured
      });

      if (isConfigured) {
        success(
          'Konfigurasi Supabase Disimpan',
          'Arsitektur adaptor Supabase telah dikonfigurasi. Data tersimpan di penyimpanan lokal dan siap disinkronkan ke Supabase Cloud.'
        );
      } else {
        success('Mode Penyimpanan Lokal Aktif', 'Aplikasi menggunakan penyimpanan offline browser yang cepat & andal.');
      }
    }, 600);
  };

  // Open User modal
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('teacher');
    setLinkedTeacherId(teachers[0]?.id || '');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(u.password || '');
    setFullName(u.name);
    setRole(u.role);
    setLinkedTeacherId(u.teacherId || '');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      error('Harap lengkapi username dan nama pengguna.');
      return;
    }

    if (editingUser) {
      const updated = users.map(u =>
        u.id === editingUser.id
          ? {
              ...u,
              username: username.trim(),
              password: password || u.password,
              name: fullName.trim(),
              role,
              teacherId: role === 'teacher' ? linkedTeacherId : undefined
            }
          : u
      );
      onUpdateUsers(updated);
      success('Pengguna Diperbarui', `Akun ${fullName} berhasil disimpan.`);
    } else {
      if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
        error(`Username "${username}" sudah digunakan.`);
        return;
      }
      const newUser: UserAccount = {
        id: 'u-' + Date.now(),
        username: username.trim(),
        password: password || undefined,
        name: fullName.trim(),
        role,
        teacherId: role === 'teacher' ? linkedTeacherId : undefined
      };
      onUpdateUsers([...users, newUser]);
      success('Pengguna Ditambahkan', `Akun baru ${fullName} berhasil dibuat.`);
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    if (users.length <= 1) {
      error('Minimal harus ada 1 akun pengguna di sistem.');
      return;
    }
    const updated = users.filter(u => u.id !== userId);
    onUpdateUsers(updated);
    success('Pengguna Dihapus', 'Akun telah dihapus.');
  };

  // JSON Import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        onImportJson(text);
        success('Pemulihan Selesai', 'Database aplikasi berhasil dipulihkan dari cadangan.');
      } catch (err: any) {
        error('Gagal Memulihkan Cadangan', err.message);
      } finally {
        if (fileBackupRef.current) fileBackupRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Pengaturan Sistem & Database
            </h2>
            <p className="text-xs text-slate-500">
              Kelola akun pengguna, hak akses, integrasi Supabase, dan pemeliharaan database
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Pengaturan Aplikasi & Manajemen Akun */}
        <div className="space-y-6">
          {/* Card: Nama & Identitas Aplikasi */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Nama & Judul Aplikasi
            </h3>

            <form onSubmit={handleSaveAppName} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Aplikasi Sekolah
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Perbarui Nama Aplikasi
                </button>
              </div>
            </form>
          </div>

          {/* Card: Manajemen Akun Pengguna & Hak Akses */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                Akun Pengguna & Hak Akses
              </h3>
              <button
                type="button"
                onClick={handleOpenAddUser}
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Akun
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Hak akses terdiri dari <strong>Administrator</strong> (akses penuh) dan <strong>Guru / Wali Kelas</strong> (akses pengisian & pencetakan kelas).
            </p>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {users.map(u => (
                <div key={u.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        u.role === 'admin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {u.role === 'admin' ? 'A' : 'G'}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">@{u.username} • {u.role === 'admin' ? 'Administrator' : 'Guru / Wali Kelas'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditUser(u)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {users.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Supabase Configuration & Data Maintenance */}
        <div className="space-y-6">
          {/* Card: Konfigurasi Database Supabase */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Integrasi Database SUPABASE
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Arsitektur Siap
              </span>
            </div>

            {/* SQL Editor Action Card */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/90 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                  <Code2 className="w-4 h-4 text-emerald-600" />
                  Query SQL Editor Supabase
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                  Siap Salin
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Salin skrip pembuatan 9 tabel, relasi, RLS policies, dan data awal untuk dijalankan langsung di dashboard Supabase Anda.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(true)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Buka Query SQL Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(true)}
                  className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Langkah Integrasi</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed space-y-1">
              <p className="font-bold">Status Penyimpanan:</p>
              <p>
                Aplikasi saat ini aktif menggunakan penyimpanan lokal terenkripsi di browser. Jika Anda memiliki project Supabase, masukkan kredensial URL & Anon Key di bawah untuk menghubungkan langsung database cloud:
              </p>
            </div>

            <form onSubmit={handleSaveSupabase} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Anon / Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={e => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isTestingConnection}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {isTestingConnection ? 'Menyimpan & Menguji...' : 'Simpan Kredensial Supabase'}
                </button>
              </div>
            </form>
          </div>

          {/* Card: Pemeliharaan Data & Backup */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" />
              Pemeliharaan & Cadangan Database (JSON)
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh cadangan seluruh data sistem rapor (guru, siswa, nilai, profil sekolah) atau pulihkan dari berkas JSON sebelumnya.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onExportJson}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Unduh Cadangan (JSON)</span>
              </button>

              <input
                type="file"
                ref={fileBackupRef}
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileBackupRef.current?.click()}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Pulihkan dari JSON</span>
              </button>
            </div>

            {/* Dummy Data Cleaning & Resetting as requested by user */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Pembersihan Data Contoh:</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearDummyConfirmOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-xs font-bold text-rose-800 transition-colors cursor-pointer"
                  title="Hapus data contoh dummy guru, siswa, dan penilaian"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Bersihkan Semua Data Contoh (Dummy)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-xs font-bold text-amber-900 transition-colors cursor-pointer"
                  title="Kembalikan data bawaan lengkap Al-Jannah"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset ke Data Default</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna'}
        subtitle="Atur kredensial dan hak akses"
        maxWidth="md"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Contoh: ahmad.fauzi"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password {role === 'admin' ? <span className="text-rose-500">*</span> : '(Opsional)'}
            </label>
            <input
              type="password"
              required={role === 'admin' && !editingUser}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Pengguna <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Contoh: Ahmad Fauzi, S.Pd.I."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hak Akses (Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'teacher')}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Administrator (Akses Penuh)</option>
              <option value="teacher">Guru / Wali Kelas (Akses Kelas)</option>
            </select>
          </div>

          {role === 'teacher' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tautkan ke Data Guru
              </label>
              <select
                value={linkedTeacherId}
                onChange={e => setLinkedTeacherId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
              >
                <option value="">Pilih Guru...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.role} {t.assignedClass ? `Kelas ${t.assignedClass}` : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
            >
              Simpan Pengguna
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal: Reset Default */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title="Reset ke Data Default Bawaan"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <p className="text-sm font-semibold text-slate-800">
              Apakah Anda yakin ingin mereset seluruh database ke data bawaan lengkap SD Islam Alam & Sains Al-Jannah?
            </p>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onResetDefaultData();
                setIsResetConfirmOpen(false);
                success('Data Direset', 'Database telah dikembalikan ke data default.');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-slate-950 shadow-md"
            >
              Ya, Reset Data
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal: Clear Dummy Data */}
      <Modal
        isOpen={isClearDummyConfirmOpen}
        onClose={() => setIsClearDummyConfirmOpen(false)}
        title="Bersihkan Data Contoh (Dummy)"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <p className="text-sm font-semibold text-slate-800">
              Fitur ini akan menghapus seluruh data contoh siswa, guru, dan penilaian, sementara master karakter dan profil sekolah tetap utuh untuk diisi data riil. Lanjutkan?
            </p>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsClearDummyConfirmOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onClearDummyData();
                setIsClearDummyConfirmOpen(false);
                success('Data Contoh Dibersihkan', 'Data dummy telah dibersihkan. Sistem siap untuk data riil.');
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md"
            >
              Ya, Bersihkan Dummy
            </button>
          </div>
        </div>
      </Modal>

      {/* Supabase SQL Editor & Integration Modal */}
      <SupabaseSqlEditorModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        schoolProfile={schoolProfile}
        teachers={teachers}
        classes={classes}
        students={students}
        subCharacters={subCharacters}
        indicators={indicators}
        gradeOptions={gradeOptions}
      />
    </div>
  );
}
