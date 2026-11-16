import React, { useState, useMemo, useRef } from 'react';
import {
  HardDriveDownload,
  Download,
  Upload,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Database,
  RefreshCw,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  SchoolProfile,
  ClassItem,
  Teacher,
  Student,
  CharacterIndicator,
  AssessmentRecord
} from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import * as storage from '../../services/storageService';
import {
  BackupPreviewInfo,
  BackupSemesterFilter,
  RestoreMode,
  buildBackupFilename,
  filterAssessmentsForBackup,
  getAcademicYearStats,
  getAvailableAcademicYears,
  parseAndValidateBackupJson
} from '../../utils/backupHelpers';

interface BackupViewProps {
  schoolProfile: SchoolProfile;
  teachers: Teacher[];
  classes: ClassItem[];
  students: Student[];
  indicators: CharacterIndicator[];
  assessments: AssessmentRecord[];
  onExportByYear: (academicYear: string, semester: BackupSemesterFilter) => string;
  onRestoreJson: (
    jsonString: string,
    mode: RestoreMode
  ) => Promise<{ syncedToSupabase: boolean; scopeLabel: string; restoredAssessments: number }>;
}

export function BackupView({
  schoolProfile,
  teachers,
  classes,
  students,
  indicators,
  assessments,
  onExportByYear,
  onRestoreJson
}: BackupViewProps) {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableYears = useMemo(
    () => getAvailableAcademicYears(assessments, schoolProfile.activeAcademicYear),
    [assessments, schoolProfile.activeAcademicYear]
  );

  // Backup selection state
  const [selectedYear, setSelectedYear] = useState<string>(
    schoolProfile.activeAcademicYear || availableYears[0] || 'ALL'
  );
  const [selectedSemester, setSelectedSemester] = useState<BackupSemesterFilter>('ALL');

  // Restore upload & preview state
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [rawJsonContent, setRawJsonContent] = useState<string>('');
  const [backupPreview, setBackupPreview] = useState<BackupPreviewInfo | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<RestoreMode>('merge');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const syncStatus = storage.getSyncStatus();

  // Stats for currently selected backup scope
  const selectedAssessmentsCount = useMemo(() => {
    const effectiveSem: BackupSemesterFilter = selectedYear === 'ALL' ? 'ALL' : selectedSemester;
    return filterAssessmentsForBackup(assessments, selectedYear, effectiveSem).length;
  }, [assessments, selectedYear, selectedSemester]);

  const yearStatsList = useMemo(
    () => availableYears.map(year => getAcademicYearStats(assessments, year)),
    [availableYears, assessments]
  );

  const triggerDownload = (year: string, semester: BackupSemesterFilter) => {
    const effectiveSemester: BackupSemesterFilter = year === 'ALL' ? 'ALL' : semester;
    const jsonString = onExportByYear(year, effectiveSemester);
    const filename = buildBackupFilename(year, effectiveSemester);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const scopeMsg =
      year === 'ALL'
        ? 'seluruh tahun ajaran'
        : `Tahun Ajaran ${year}${effectiveSemester === 'ALL' ? '' : ` Semester ${effectiveSemester}`}`;
    success('Backup Berhasil Diunduh', `Berkas cadangan ${scopeMsg} (${filename}) telah disimpan.`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setBackupPreview(null);
    setRawJsonContent('');
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = String(evt.target?.result || '');
        const preview = parseAndValidateBackupJson(text);
        setRawJsonContent(text);
        setBackupPreview(preview);
        setRestoreMode(preview.payload.backupScope === 'academic_year' ? 'merge' : 'replace');
      } catch (err: any) {
        const msg = err?.message || 'Format berkas cadangan tidak valid.';
        setParseError(msg);
        error('Berkas Tidak Valid', msg);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearUpload = () => {
    setSelectedFileName('');
    setRawJsonContent('');
    setBackupPreview(null);
    setParseError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!rawJsonContent) return;
    setIsRestoring(true);
    try {
      const result = await onRestoreJson(rawJsonContent, restoreMode);
      setIsConfirmModalOpen(false);
      handleClearUpload();
      success(
        'Database Berhasil Dipulihkan',
        `${result.scopeLabel} (${result.restoredAssessments} data penilaian)${
          result.syncedToSupabase
            ? ' berhasil dipulihkan dan disinkronkan ke Supabase.'
            : ' berhasil dipulihkan ke sesi aplikasi.'
        }`
      );
    } catch (err: any) {
      error('Gagal Memulihkan Database', err?.message || 'Terjadi kesalahan saat restore database.');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <HardDriveDownload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Backup &amp; Restore Database
            </h2>
            <p className="text-xs text-slate-500">
              Cadangkan data per tahun ajaran maupun seluruh sistem dan pulihkan sewaktu-waktu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 tabular-nums">
          <span>
            TA Aktif: <strong className="text-slate-900">{schoolProfile.activeAcademicYear}</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Total Penilaian: <strong className="text-slate-900">{assessments.length}</strong>
          </span>
        </div>
      </div>

      {/* Main 2-Column Layout (mirip menu Pengaturan) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Backup Per Tahun Ajaran & Upload Restore */}
        <div className="space-y-6">
          {/* Card 1: Backup Database Per Tahun Ajaran */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-600" />
                Backup Database (Per Tahun Ajaran)
              </h3>
              <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                Format JSON
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Pilih tahun ajaran yang ingin dicadangkan. Berkas backup tetap menyertakan data master (profil sekolah, guru, kelas, siswa, dan indikator karakter) agar dapat dipulihkan secara mandiri kapan pun dibutuhkan.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="backup-academic-year"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Pilih Tahun Ajaran
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="backup-academic-year"
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Semua Tahun Ajaran</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>
                        TA {year}
                        {year === schoolProfile.activeAcademicYear ? ' (Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="backup-semester"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  Cakupan Semester
                </label>
                <select
                  id="backup-semester"
                  value={selectedYear === 'ALL' ? 'ALL' : selectedSemester}
                  disabled={selectedYear === 'ALL'}
                  onChange={e => setSelectedSemester(e.target.value as BackupSemesterFilter)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="ALL">Semua Semester (Sem 1 &amp; 2)</option>
                  <option value="1">Semester 1 (Ganjil)</option>
                  <option value="2">Semester 2 (Genap)</option>
                </select>
              </div>
            </div>

            {/* Summary Metrics (Clean unboxed hairline divider grid) */}
            <div className="grid grid-cols-5 gap-2 py-3 border-y border-slate-100 text-center tabular-nums">
              <div>
                <p className="text-[11px] text-slate-500">Penilaian</p>
                <p className="text-base font-extrabold text-blue-700 mt-0.5">
                  {selectedAssessmentsCount}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Siswa</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">{students.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Guru</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">{teachers.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Kelas</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">{classes.length}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Indikator</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {indicators.length}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => triggerDownload(selectedYear, selectedSemester)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {selectedYear === 'ALL'
                    ? 'Unduh Backup Lengkap (JSON)'
                    : `Unduh Backup TA ${selectedYear}`}
                </span>
              </button>
            </div>

            {/* Quick Table Per Academic Year */}
            <div className="pt-2 space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Daftar Tahun Ajaran Tersedia di Database
              </p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-3.5 py-2 font-bold">Tahun Ajaran</th>
                      <th className="px-3 py-2 font-bold text-right">Final</th>
                      <th className="px-3 py-2 font-bold text-right">Draft</th>
                      <th className="px-3.5 py-2 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {yearStatsList.map(stat => (
                      <tr key={stat.academicYear} className="hover:bg-slate-50/80">
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {stat.academicYear}
                          {stat.academicYear === schoolProfile.activeAcademicYear && (
                            <span className="ml-2 text-[11px] font-semibold text-emerald-700">
                              · Aktif
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-emerald-700 font-semibold">
                          {stat.finalCount}
                        </td>
                        <td className="px-3 py-2.5 text-right text-amber-700 font-semibold">
                          {stat.draftCount}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => triggerDownload(stat.academicYear, 'ALL')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Unduh</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Card 2: Restore / Upload Ulang Database */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600" />
                Restore / Upload Ulang Database
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Unggah .json</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Pilih berkas cadangan <code className="font-mono text-slate-700">.json</code> untuk melihat pratinjau isi datanya terlebih dahulu sebelum memulihkan ke database.
            </p>

            <input
              id="restore-backup-file"
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 min-w-0 py-3 px-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileJson className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {selectedFileName ? `File dipilih: ${selectedFileName}` : 'Pilih Berkas Backup (.json)'}
                </span>
              </button>

              {(selectedFileName || parseError) && (
                <button
                  type="button"
                  onClick={handleClearUpload}
                  aria-label="Hapus pilihan berkas backup"
                  className="p-3 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {parseError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {backupPreview && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Pratinjau Berkas Backup Siap Dipulihkan
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      v{backupPreview.payload.version}
                    </span>
                  </div>

                  <div className="text-slate-600 space-y-1 tabular-nums">
                    <p>
                      Cakupan: <strong className="text-slate-900">{backupPreview.scopeLabel}</strong>
                    </p>
                    <p>
                      Tanggal Cadangan:{' '}
                      <strong className="text-slate-900">
                        {formatDateTime(backupPreview.exportedAt)}
                      </strong>
                    </p>
                    <p className="pt-1 text-[11px] text-slate-600">
                      Penilaian: <strong>{backupPreview.counts.assessments}</strong> · Siswa:{' '}
                      <strong>{backupPreview.counts.students}</strong> · Guru:{' '}
                      <strong>{backupPreview.counts.teachers}</strong> · Kelas:{' '}
                      <strong>{backupPreview.counts.classes}</strong> · Indikator:{' '}
                      <strong>{backupPreview.counts.indicators}</strong>
                    </p>
                  </div>
                </div>

                {/* Restore Mode Selector */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">Pilih Mode Pemulihan Database:</p>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="restore-mode"
                      value="merge"
                      checked={restoreMode === 'merge'}
                      onChange={() => setRestoreMode('merge')}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">
                        Gabung / Perbarui Tahun Ajaran (Disarankan untuk Backup Per TA)
                      </p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Menambahkan atau memperbarui data penilaian untuk tahun ajaran di berkas ini tanpa menghapus data tahun ajaran lain yang sudah tersimpan.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="restore-mode"
                      value="replace"
                      checked={restoreMode === 'replace'}
                      onChange={() => setRestoreMode('replace')}
                      className="mt-0.5 accent-amber-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">
                        Pulihkan Penuh / Timpa Data Saat Ini
                      </p>
                      <p className="text-slate-500 mt-0.5 leading-relaxed">
                        Mengganti seluruh data sesi aplikasi dengan isi berkas cadangan ini (cocok saat memulihkan backup lengkap).
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleClearUpload}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Pulihkan ke Database Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Panduan & Langkah-Langkah Backup & Restore */}
        <div className="space-y-6">
          {/* Card 3: Langkah-Langkah Backup & Restore */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                Langkah-Langkah Backup &amp; Restore
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">Panduan Admin</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900">Pilih Tahun Ajaran yang Akan Dicadangkan</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Pada panel kiri, pilih tahun ajaran tertentu (misalnya <strong>2026/2027</strong>) atau pilih <strong>Semua Tahun Ajaran (Lengkap)</strong>. Anda juga bisa memfilter per semester atau langsung klik tombol <strong>Unduh</strong> di tabel daftar tahun ajaran.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900">Unduh &amp; Simpan Berkas Cadangan (.json)</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Klik <strong>Unduh Backup</strong> untuk menyimpan berkas <code className="font-mono bg-white px-1 rounded border border-slate-200">.json</code> ke komputer atau Google Drive sekolah sebagai arsip resmi akhir semester / akhir tahun ajaran.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-900">Upload Ulang Berkas Saat Dibutuhkan</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Sewaktu-waktu Anda membutuhkan data lama kembali atau pindah database, buka panel <strong>Restore / Upload Ulang Database</strong> lalu klik <strong>Pilih Berkas Backup (.json)</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <p className="font-bold text-slate-900">Periksa Pratinjau &amp; Pilih Mode Restore</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Periksa tahun ajaran dan jumlah data pada kotak pratinjau. Pilih mode <strong>Gabung / Perbarui Tahun Ajaran</strong> agar data tahun ajaran lain tidak terhapus saat memulihkan arsip satu tahun ajaran.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                  5
                </span>
                <div>
                  <p className="font-bold text-slate-900">Konfirmasi &amp; Sinkronisasi ke Supabase</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Klik <strong>Pulihkan ke Database Sekarang</strong> dan konfirmasi. Jika aplikasi terhubung ke Supabase, seluruh data yang dipulihkan otomatis disimpan ke tabel PostgreSQL Supabase.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Status Koneksi Database & Akses Keamanan */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Status Sinkronisasi Cloud
              </h3>
              <span className="text-xs font-bold text-slate-700">
                {syncStatus.mode === 'supabase' ? 'Supabase Terhubung' : 'Mode Sesi Lokal'}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                syncStatus.mode === 'supabase'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              {syncStatus.mode === 'supabase' ? (
                <p>
                  <strong>Siap Sinkronisasi Otomatis:</strong> Berkas yang Anda pulihkan akan langsung tersimpan permanen ke database PostgreSQL Supabase (
                  {syncStatus.source === 'env' ? 'Koneksi Global' : 'Koneksi Lokal Browser'}).
                </p>
              ) : (
                <p>
                  <strong>Perhatian:</strong> Aplikasi belum tersambung ke Supabase. Anda tetap bisa mengunduh dan memulihkan cadangan di sesi saat ini, atau hubungkan Supabase terlebih dahulu di menu <strong>Pengaturan</strong> agar hasil restore tersimpan permanen ke cloud.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Halaman Backup &amp; Restore Database hanya dapat diakses oleh Administrator.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isRestoring && setIsConfirmModalOpen(false)}
        title="Konfirmasi Pulihkan Database"
        subtitle="Pastikan cakupan berkas dan mode pemulihan sudah sesuai"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 text-amber-600">
            <AlertTriangle className="w-7 h-7 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <p className="font-bold text-slate-900">
                Pulihkan data dari berkas <span className="font-mono">{selectedFileName}</span>?
              </p>
              {backupPreview && (
                <p>
                  Cakupan: <strong>{backupPreview.scopeLabel}</strong> ({backupPreview.counts.assessments} penilaian).
                </p>
              )}
              <p>
                Mode terpilih:{' '}
                <strong>
                  {restoreMode === 'merge'
                    ? 'Gabung / Perbarui Tahun Ajaran'
                    : 'Pulihkan Penuh / Timpa Data Saat Ini'}
                </strong>
                .
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isRestoring}
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isRestoring}
              onClick={handleConfirmRestore}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isRestoring ? 'Memulihkan...' : 'Ya, Pulihkan Sekarang'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
