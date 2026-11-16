import React, { useState, useEffect, useCallback } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { ToastProvider, useToast } from './context/ToastContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AdminLoginModal } from './components/auth/AdminLoginModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { SchoolProfileView } from './components/school-profile/SchoolProfileView';
import { TeachersView } from './components/teachers/TeachersView';
import { ClassesView } from './components/classes/ClassesView';
import { StudentsView } from './components/students/StudentsView';
import { CharactersView } from './components/characters/CharactersView';
import { AssessmentsView } from './components/assessments/AssessmentsView';
import { ReportsView } from './components/reports/ReportsView';
import { BackupView } from './components/backup/BackupView';
import { SettingsView } from './components/settings/SettingsView';
import * as storage from './services/storageService';
import { RestoreMode } from './utils/backupHelpers';
import { authenticateAdmin, isAdminOnlyTab } from './utils/assessmentHelpers';
import {
  SchoolProfile,
  ClassItem,
  Teacher,
  Student,
  SubCharacter,
  CharacterIndicator,
  GradeOption,
  AssessmentRecord,
  UserAccount,
  ActivityLog,
  SupabaseConfig
} from './types';

function MainApp() {
  const { success, info, error } = useToast();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Target class memory when switching views
  const [preselectedClassForAssessment, setPreselectedClassForAssessment] = useState<string>('');
  const [preselectedClassForReports, setPreselectedClassForReports] = useState<string>('');

  // Admin authentication state
  const [adminUser, setAdminUser] = useState<UserAccount | null>(storage.getAdminSession);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [pendingAdminTab, setPendingAdminTab] = useState<NavTab | null>(null);
  const isAdminLoggedIn = Boolean(adminUser && adminUser.role === 'admin');

  // Core Data States
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(storage.getSchoolProfile);
  const [classes, setClasses] = useState<ClassItem[]>(storage.getClasses);
  const [teachers, setTeachers] = useState<Teacher[]>(storage.getTeachers);
  const [students, setStudents] = useState<Student[]>(storage.getStudents);
  const [subCharacters, setSubCharacters] = useState<SubCharacter[]>(storage.getSubCharacters);
  const [indicators, setIndicators] = useState<CharacterIndicator[]>(storage.getIndicators);
  const [gradeOptions, setGradeOptions] = useState<GradeOption[]>(storage.getGradeOptions);
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(storage.getAssessments);
  const [users, setUsers] = useState<UserAccount[]>(storage.getUsers);
  const [activeUser, setActiveUser] = useState<UserAccount>(storage.getActiveUser);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(storage.getActivityLogs);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(storage.getSupabaseConfig);
  const [syncStatus, setSyncStatus] = useState(storage.getSyncStatus);

  // Refresh all state from storage
  const reloadAllData = useCallback(() => {
    setSchoolProfile(storage.getSchoolProfile());
    setClasses(storage.getClasses());
    setTeachers(storage.getTeachers());
    setStudents(storage.getStudents());
    setSubCharacters(storage.getSubCharacters());
    setIndicators(storage.getIndicators());
    setGradeOptions(storage.getGradeOptions());
    setAssessments(storage.getAssessments());
    setUsers(storage.getUsers());
    setActiveUser(storage.getActiveUser());
    setAdminUser(storage.getAdminSession());
    setActivityLogs(storage.getActivityLogs());
    setSupabaseConfig(storage.getSupabaseConfig());
    setSyncStatus(storage.getSyncStatus());
  }, []);

  // Initialize and subscribe + initial sync from Supabase
  useEffect(() => {
    storage.initializeStorageIfNeeded();
    reloadAllData();
    storage.syncFromSupabaseOnStartup().then(res => {
      reloadAllData();
      if (res.error) {
        error('Koneksi Supabase Bermasalah', res.error);
      }
    });
    const unsubscribe = storage.subscribeToDataChanges(() => {
      reloadAllData();
    });
    const unsubscribeErr = storage.subscribeToSyncErrors(msg => {
      error('Sinkronisasi Supabase Gagal', msg);
    });
    return () => {
      unsubscribe();
      unsubscribeErr();
    };
  }, [reloadAllData, error]);

  // Handle Tab Navigation with Admin Guard
  const handleSelectTab = (tab: NavTab) => {
    if (isAdminOnlyTab(tab) && !isAdminLoggedIn) {
      setPendingAdminTab(tab);
      setIsAdminLoginOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  // Handle Admin Login
  const handleAdminLogin = (username: string, password: string): boolean => {
    const matched = authenticateAdmin(username, password, users);
    if (!matched) {
      return false;
    }
    storage.setAdminSession(matched);
    setAdminUser(matched);
    success('Login Administrator Berhasil', `Selamat datang, ${matched.name} (@${matched.username}).`);
    if (pendingAdminTab) {
      setActiveTab(pendingAdminTab);
      setPendingAdminTab(null);
    }
    return true;
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    storage.setAdminSession(null);
    setAdminUser(null);
    if (isAdminOnlyTab(activeTab)) {
      setActiveTab('dashboard');
    }
    info('Logout Administrator', 'Sesi administrator telah diakhiri.');
  };

  // Export JSON Backup
  const handleExportJson = () => {
    const jsonStr = storage.exportDatabaseToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `Backup_Rapor_AlJannah_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Cadangan Diunduh', 'Berkas JSON cadangan database berhasil disimpan.');
  };

  // Import JSON Backup
  const handleImportJson = async (jsonString: string, mode: RestoreMode = 'replace') => {
    const res = await storage.importDatabaseFromJson(jsonString, mode);
    reloadAllData();
    return res;
  };

  // Page titles
  const pageDetails = {
    dashboard: {
      title: 'Dashboard Perkembangan Karakter',
      subtitle: 'Ringkasan capaian, statistik sekolah, dan status pengisian rapor aktif'
    },
    'school-profile': {
      title: 'Profil & Identitas Sekolah',
      subtitle: 'Data lembaga, pimpinan, tahun ajaran aktif, dan titi mangsa rapor'
    },
    teachers: {
      title: 'Manajemen Data Guru',
      subtitle: 'Daftar pendidik, penugasan wali kelas, dan kontak pengajar'
    },
    classes: {
      title: 'Manajemen Data Rombel Kelas',
      subtitle: 'Pengaturan rombongan belajar, jenjang tingkat 1-6, fase, dan wali kelas'
    },
    students: {
      title: 'Manajemen Data Siswa',
      subtitle: 'Buku induk peserta didik, status inklusi, dan kenaikan kelas'
    },
    characters: {
      title: 'Master Karakter & Indikator',
      subtitle: 'Struktur hierarki Karakter Islam (Biru), Alam (Hijau), dan Sains (Oren/Kuning)'
    },
    assessments: {
      title: 'Penilaian Perkembangan Karakter',
      subtitle: 'Pengisian nilai predikat dan narasi observasi per kelas dengan autosave'
    },
    reports: {
      title: 'Cetak & Unduh Rapor Karakter',
      subtitle: 'Format resmi cetak A4 / F4 Legal dengan kop surat dan tanda tangan lengkap'
    },
    backup: {
      title: 'Backup & Restore Database',
      subtitle: 'Cadangkan database per tahun ajaran maupun keseluruhan serta pulihkan sewaktu-waktu'
    },
    settings: {
      title: 'Pengaturan Sistem & Database',
      subtitle: 'Pengelolaan pengguna, hak akses, integrasi Supabase, dan cadangan data'
    }
  }[activeTab];

  const isBlockedAdminTab = isAdminOnlyTab(activeTab) && !isAdminLoggedIn;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isAdminLoggedIn={isAdminLoggedIn}
        adminUser={adminUser}
        onOpenAdminLogin={() => {
          setPendingAdminTab(null);
          setIsAdminLoginOpen(true);
        }}
        onLogoutAdmin={handleAdminLogout}
        schoolName={schoolProfile.name}
        logoUrl={schoolProfile.logoUrl}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen min-w-0">
        <Header
          pageTitle={pageDetails.title}
          pageSubtitle={pageDetails.subtitle}
          schoolProfile={schoolProfile}
          isAdminLoggedIn={isAdminLoggedIn}
          adminUser={adminUser}
          syncMode={syncStatus.mode}
          isSyncing={syncStatus.isSyncing}
          onOpenAdminLogin={() => {
            setPendingAdminTab(null);
            setIsAdminLoginOpen(true);
          }}
          onLogoutAdmin={handleAdminLogout}
          onOpenMobileSidebar={() => setIsOpenMobileSidebar(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isBlockedAdminTab ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-10 text-center max-w-lg mx-auto mt-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Akses Khusus Administrator
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Halaman <strong>{pageDetails.title}</strong> hanya dapat diakses oleh Administrator. Silakan login terlebih dahulu.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Kembali ke Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingAdminTab(activeTab);
                    setIsAdminLoginOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Login Administrator</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  schoolProfile={schoolProfile}
                  students={students}
                  teachers={teachers}
                  classes={classes}
                  assessments={assessments}
                  activityLogs={activityLogs}
                  activeUser={adminUser || activeUser}
                  isAdminLoggedIn={isAdminLoggedIn}
                  onNavigate={handleSelectTab}
                />
              )}

              {activeTab === 'school-profile' && isAdminLoggedIn && (
                <SchoolProfileView
                  profile={schoolProfile}
                  onSaveProfile={storage.saveSchoolProfile}
                />
              )}

              {activeTab === 'teachers' && isAdminLoggedIn && (
                <TeachersView
                  teachers={teachers}
                  classes={classes}
                  onAddTeacher={storage.addTeacher}
                  onUpdateTeacher={storage.updateTeacher}
                  onDeleteTeacher={storage.deleteTeacher}
                />
              )}

              {activeTab === 'classes' && isAdminLoggedIn && (
                <ClassesView
                  classes={classes}
                  teachers={teachers}
                  students={students}
                  onAddClass={storage.addClass}
                  onUpdateClass={storage.updateClass}
                  onDeleteClass={storage.deleteClass}
                  onNavigateToAssessments={(cName) => {
                    setPreselectedClassForAssessment(cName);
                    setActiveTab('assessments');
                  }}
                  onNavigateToReports={(cName) => {
                    setPreselectedClassForReports(cName);
                    setActiveTab('reports');
                  }}
                />
              )}

              {activeTab === 'students' && isAdminLoggedIn && (
                <StudentsView
                  students={students}
                  classes={classes}
                  activeUser={adminUser || activeUser}
                  onAddStudent={storage.addStudent}
                  onUpdateStudent={storage.updateStudent}
                  onDeleteStudent={storage.deleteStudent}
                  onPromoteStudents={storage.promoteStudents}
                />
              )}

              {activeTab === 'characters' && (
                <CharactersView
                  subCharacters={subCharacters}
                  indicators={indicators}
                  gradeOptions={gradeOptions}
                  onSaveSubCharacter={storage.addOrUpdateSubCharacter}
                  onDeleteSubCharacter={storage.deleteSubCharacter}
                  onSaveIndicator={storage.addOrUpdateIndicator}
                  onDeleteIndicator={storage.deleteIndicator}
                  onSaveGradeOptions={storage.saveGradeOptions}
                />
              )}

              {activeTab === 'assessments' && (
                <AssessmentsView
                  students={students}
                  classes={classes}
                  teachers={teachers}
                  schoolProfile={schoolProfile}
                  subCharacters={subCharacters}
                  indicators={indicators}
                  gradeOptions={gradeOptions}
                  assessments={assessments}
                  activeUser={adminUser || activeUser}
                  onSaveAssessment={storage.saveAssessmentRecord}
                  initialSelectedClass={preselectedClassForAssessment}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  students={students}
                  teachers={teachers}
                  classes={classes}
                  schoolProfile={schoolProfile}
                  subCharacters={subCharacters}
                  indicators={indicators}
                  gradeOptions={gradeOptions}
                  assessments={assessments}
                  initialSelectedClass={preselectedClassForReports}
                />
              )}

              {activeTab === 'backup' && isAdminLoggedIn && (
                <BackupView
                  schoolProfile={schoolProfile}
                  teachers={teachers}
                  classes={classes}
                  students={students}
                  indicators={indicators}
                  assessments={assessments}
                  onExportByYear={storage.exportDatabaseByYearToJson}
                  onRestoreJson={handleImportJson}
                />
              )}

              {activeTab === 'settings' && isAdminLoggedIn && (
                <SettingsView
                  schoolProfile={schoolProfile}
                  users={users}
                  teachers={teachers}
                  classes={classes}
                  students={students}
                  subCharacters={subCharacters}
                  indicators={indicators}
                  gradeOptions={gradeOptions}
                  activeUser={adminUser || activeUser}
                  supabaseConfig={supabaseConfig}
                  onUpdateSchoolProfile={storage.saveSchoolProfile}
                  onUpdateUsers={storage.saveUsers}
                  onUpdateSupabaseConfig={storage.saveSupabaseConfig}
                  onResetDefaultData={storage.resetToDefaultData}
                  onClearDummyData={storage.clearAllDummyData}
                  onExportJson={handleExportJson}
                  onImportJson={handleImportJson}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Administrator Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => {
          setIsAdminLoginOpen(false);
          setPendingAdminTab(null);
        }}
        onLogin={handleAdminLogin}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
