import React, { useState } from 'react';
import {
  School,
  Save,
  Upload,
  Calendar,
  CheckCircle,
  Building,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Sparkles
} from 'lucide-react';
import { SchoolProfile } from '../../types';
import { useToast } from '../../context/ToastContext';
import { SchoolLogo } from '../ui/SchoolLogo';

interface SchoolProfileViewProps {
  profile: SchoolProfile;
  onSaveProfile: (updated: SchoolProfile) => void;
}

const ACADEMIC_YEAR_OPTIONS = [
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030'
];

const MONTH_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function SchoolProfileView({ profile, onSaveProfile }: SchoolProfileViewProps) {
  const { success, error } = useToast();
  const [formData, setFormData] = useState<SchoolProfile>({ ...profile });
  const [customYearInput, setCustomYearInput] = useState('');
  const [isCustomYear, setIsCustomYear] = useState(!ACADEMIC_YEAR_OPTIONS.includes(profile.activeAcademicYear));

  const handleChange = (field: keyof SchoolProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTitiMangsaChange = (
    semester: 'titiMangsaSemester1' | 'titiMangsaSemester2',
    field: 'day' | 'month' | 'year',
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [semester]: {
        ...prev[semester],
        [field]: value
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        error('Ukuran logo maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        handleChange('logoUrl', result);
        success('Logo sekolah berhasil dimuat');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const yearToSave = isCustomYear && customYearInput.trim() ? customYearInput.trim() : formData.activeAcademicYear;
      const updated: SchoolProfile = {
        ...formData,
        activeAcademicYear: yearToSave
      };
      onSaveProfile(updated);
      success('Profil Sekolah Tersimpan', 'Data identitas sekolah, kepala sekolah, dan titi mangsa rapor berhasil diperbarui.');
    } catch (err: any) {
      error('Gagal Menyimpan', err.message || 'Terjadi kesalahan sistem.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Pengaturan Profil Sekolah
            </h2>
            <p className="text-xs text-slate-500">
              Data ini otomatis digunakan pada kop surat, identitas siswa, dan titi mangsa rapor
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Identitas Sekolah & Kepala Sekolah */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Identitas Sekolah */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Identitas Satuan Pendidikan</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold text-slate-900"
                  placeholder="SD ISLAM ALAM & SAINS AL-JANNAH"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NPSN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.npsn}
                  onChange={e => handleChange('npsn', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="20228891"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jenjang / Level
                </label>
                <input
                  type="text"
                  value={formData.level}
                  onChange={e => handleChange('level', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="Sekolah Dasar (SD)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Fase Kurikulum
                </label>
                <input
                  type="text"
                  value={formData.phase}
                  onChange={e => handleChange('phase', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="Fase A, B, dan C"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Lengkap Jalan
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="Jl. Jambore Raya No. 4, Pondok Ranggon, Harjamukti"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kelurahan / Desa
                </label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={e => handleChange('village', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="Harjamukti"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={e => handleChange('district', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="Cimanggis"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kabupaten / Kota
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="Kota Depok"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={e => handleChange('province', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="Jawa Barat"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Telepon / Kontak
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="(021) 8731111"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Resmi
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="info@sekolah-aljannah.sch.id"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Situs Web Resmi
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={e => handleChange('website', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="www.sekolah-aljannah.sch.id"
                />
              </div>
            </div>
          </div>

          {/* Card: Kepala Sekolah */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Identitas Kepala Sekolah</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Kepala Sekolah Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.headmasterName}
                  onChange={e => handleChange('headmasterName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="Hj. Siti Aminah, S.Pd., M.M."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={formData.headmasterNip}
                  onChange={e => handleChange('headmasterNip', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                  placeholder="19780512 200501 2 004"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Logo & Pengaturan Akademik & Titi Mangsa */}
        <div className="space-y-6">
          {/* Logo Sekolah */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-left pb-2 border-b border-slate-100">
              Logo Resmi Sekolah
            </h3>

            <div className="flex flex-col items-center justify-center py-2">
              <SchoolLogo size="xl" logoUrl={formData.logoUrl} className="mb-3" />
              <p className="text-xs text-slate-500 max-w-xs">
                {formData.logoUrl ? 'Logo resmi Al-Jannah aktif' : 'Menggunakan logo default Al-Jannah'}
              </p>
            </div>

            <div className="space-y-2.5 text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tautan / URL Berkas Logo
                </label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={e => handleChange('logoUrl', e.target.value)}
                  placeholder="/assets/aistudio/logo-AJ-rapor_c08ed6e7.png"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={() => handleChange('logoUrl', '/assets/aistudio/logo-AJ-rapor_c08ed6e7.png')}
                className="w-full text-center px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-colors cursor-pointer"
              >
                ✓ Terapkan Logo Resmi Al-Jannah (AJ Rapor)
              </button>

              <div className="flex flex-col gap-2 pt-1">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Berkas Logo Baru (PNG / JPG)</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>

                {formData.logoUrl && formData.logoUrl !== '/assets/aistudio/logo-AJ-rapor_c08ed6e7.png' && (
                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '/assets/aistudio/logo-AJ-rapor_c08ed6e7.png')}
                    className="text-xs text-blue-600 hover:underline text-center cursor-pointer"
                  >
                    Kembalikan ke Logo Resmi AJ Rapor
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pengaturan Akademik Aktif */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                Pengaturan Akademik
              </h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tahun Ajaran Aktif
              </label>
              <select
                value={isCustomYear ? 'custom' : formData.activeAcademicYear}
                onChange={e => {
                  if (e.target.value === 'custom') {
                    setIsCustomYear(true);
                  } else {
                    setIsCustomYear(false);
                    handleChange('activeAcademicYear', e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold"
              >
                {ACADEMIC_YEAR_OPTIONS.map(yr => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
                <option value="custom">+ Tahun Ajaran Lainnya...</option>
              </select>

              {isCustomYear && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customYearInput}
                    onChange={e => {
                      setCustomYearInput(e.target.value);
                      handleChange('activeAcademicYear', e.target.value);
                    }}
                    placeholder="Contoh: 2030/2031"
                    className="w-full px-3.5 py-2 rounded-xl border border-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Semester Aktif
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('activeSemester', '1')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    formData.activeSemester === '1'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semester 1 (Ganjil)
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('activeSemester', '2')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    formData.activeSemester === '2'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semester 2 (Genap)
                </button>
              </div>
            </div>
          </div>

          {/* Pengaturan Tanggal Titi Mangsa Rapor */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider pb-2 border-b border-slate-100">
              Tanggal Titi Mangsa Rapor
            </h3>

            {/* Semester 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2.5">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Titi Mangsa Semester 1
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Tanggal</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.titiMangsaSemester1.day}
                    onChange={e => handleTitiMangsaChange('titiMangsaSemester1', 'day', e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Bulan</label>
                  <select
                    value={formData.titiMangsaSemester1.month}
                    onChange={e => handleTitiMangsaChange('titiMangsaSemester1', 'month', e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    {MONTH_OPTIONS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Tahun</label>
                  <input
                    type="number"
                    value={formData.titiMangsaSemester1.year}
                    onChange={e => handleTitiMangsaChange('titiMangsaSemester1', 'year', e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Output: Depok, {formData.titiMangsaSemester1.day} {formData.titiMangsaSemester1.month} {formData.titiMangsaSemester1.year}
              </p>
            </div>

            {/* Semester 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-2.5">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Titi Mangsa Semester 2
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Tanggal</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.titiMangsaSemester2.day}
                    onChange={e => handleTitiMangsaChange('titiMangsaSemester2', 'day', e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Bulan</label>
                  <select
                    value={formData.titiMangsaSemester2.month}
                    onChange={e => handleTitiMangsaChange('titiMangsaSemester2', 'month', e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    {MONTH_OPTIONS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500">Tahun</label>
                  <input
                    type="number"
                    value={formData.titiMangsaSemester2.year}
                    onChange={e => handleTitiMangsaChange('titiMangsaSemester2', 'year', e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Output: Depok, {formData.titiMangsaSemester2.day} {formData.titiMangsaSemester2.month} {formData.titiMangsaSemester2.year}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
