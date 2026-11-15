import React from 'react';
import {
  Users,
  GraduationCap,
  Layers,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Printer,
  UserPlus,
  BookOpen,
  Calendar,
  Sparkles,
  TrendingUp,
  School,
  FileText
} from 'lucide-react';
import {
  SchoolProfile,
  Student,
  Teacher,
  ClassItem,
  AssessmentRecord,
  UserAccount
} from '../../types';
import { NavTab } from '../layout/Sidebar';

interface DashboardViewProps {
  schoolProfile: SchoolProfile;
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  assessments: AssessmentRecord[];
  activityLogs?: any[];
  activeUser: UserAccount;
  isAdminLoggedIn?: boolean;
  onNavigate: (tab: NavTab) => void;
  onSelectAssessmentStudent?: (studentId: string) => void;
}

export function DashboardView({
  schoolProfile,
  students,
  teachers,
  classes,
  assessments,
  isAdminLoggedIn = false,
  onNavigate
}: DashboardViewProps) {
  // Current active year and semester assessments
  const currentAssessments = assessments.filter(
    a =>
      a.academicYear === schoolProfile.activeAcademicYear &&
      a.semester === schoolProfile.activeSemester
  );

  const completedCount = currentAssessments.filter(a => a.status === 'final').length;
  const draftCount = currentAssessments.filter(a => a.status === 'draft').length;
  const totalStudents = students.length;
  const unassessedCount = Math.max(0, totalStudents - (completedCount + draftCount));
  const completionPercentage = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#174676] via-[#21619b] to-[#1a5276] p-6 sm:p-8 text-white shadow-lg border border-amber-400/30">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Tahun Ajaran {schoolProfile.activeAcademicYear} • Semester {schoolProfile.activeSemester}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Assalamu’alaikum Warahmatullahi Wabarakatuh
          </h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100 leading-relaxed font-normal">
            Selamat datang di <strong className="text-amber-300">Sistem Rapor Karakter {schoolProfile.name}</strong>.
            Platform integratif pemantauan dan asesmen perkembangan karakter <strong>Islam</strong>, <strong>Alam</strong>, dan <strong>Sains</strong> untuk Guru & Wali Kelas.
          </p>
        </div>


        {/* Decorative background shape */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden xl:block opacity-15 pointer-events-none">
          <BookOpen className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Siswa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Siswa
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{totalStudents}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Reguler: {students.filter(s => s.status === 'Reguler').length}</span>
            <span>Inklusi: {students.filter(s => s.status === 'Inklusi').length}</span>
          </div>
        </div>

        {/* Guru */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Guru
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{teachers.length}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Wali Kelas: {teachers.filter(t => t.role === 'Wali Kelas').length}</span>
            <span>Guru Lain: {teachers.filter(t => t.role !== 'Wali Kelas').length}</span>
          </div>
        </div>

        {/* Kelas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rombongan Kelas
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{classes.length}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Tingkat 1 - 6</span>
            <span>Fase A, B, C</span>
          </div>
        </div>

        {/* Penilaian */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Penilaian Selesai
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-3">{completedCount}</p>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Draft: {draftCount}</span>
            <span className="font-semibold text-purple-700">{completionPercentage}% Tuntas</span>
          </div>
        </div>
      </div>

      {/* Progress Card & Quick Actions (Clean layout without logs or class table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Progress Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Status Kelengkapan Penilaian Rapor Sekolah
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Semester {schoolProfile.activeSemester} Tahun Ajaran {schoolProfile.activeAcademicYear} — Seluruh Peserta Didik
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-blue-900">
                    {completionPercentage}%
                  </span>
                  <span className="text-xs font-bold text-slate-400">Tuntas</span>
                </div>
              </div>

              {/* Main Progress Bar */}
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner my-4">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(completedCount / (totalStudents || 1)) * 100}%` }}
                  title={`Final: ${completedCount} siswa`}
                />
                <div
                  className="bg-amber-400 transition-all duration-500"
                  style={{ width: `${(draftCount / (totalStudents || 1)) * 100}%` }}
                  title={`Draft: ${draftCount} siswa`}
                />
              </div>
            </div>

            {/* Badges Info */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wide">Sudah Selesai (Final)</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{completedCount} <span className="text-xs font-medium text-emerald-700">Siswa</span></p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                <p className="text-xs text-amber-800 font-bold uppercase tracking-wide">Dalam Proses (Draft)</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{draftCount} <span className="text-xs font-medium text-amber-700">Siswa</span></p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200">
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wide">Belum Dinilai</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{unassessedCount} <span className="text-xs font-medium text-slate-600">Siswa</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions */}
        <div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs h-full space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider text-slate-600 mb-2">
              Aksi Cepat Pengajar
            </h3>

            <button
              type="button"
              onClick={() => onNavigate('assessments')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-900 font-semibold text-sm transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Penilaian Karakter</p>
                  <p className="text-[11px] text-blue-700">Input nilai & narasi observasi</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-amber-950 font-semibold text-sm transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">Cetak Dokumen Rapor</p>
                  <p className="text-[11px] text-amber-800">Unduh PDF 2 Halaman per siswa/kelas</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700" />
            </button>

            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-800 font-semibold text-sm transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">Data Siswa</p>
                    <p className="text-[11px] text-slate-500">Daftar buku induk peserta didik</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={() => onNavigate('classes')}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-800 font-semibold text-sm transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">Data Kelas & Rombel</p>
                    <p className="text-[11px] text-slate-500">Pengaturan rombel & wali kelas</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
