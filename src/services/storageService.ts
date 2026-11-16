import { SupabaseClient } from '@supabase/supabase-js';
import {
  SchoolProfile,
  ClassItem,
  Teacher,
  Student,
  SubCharacter,
  CharacterIndicator,
  GradeOption,
  UserAccount,
  AssessmentRecord,
  ActivityLog,
  SupabaseConfig
} from '../types';
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_CLASSES,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_SUB_CHARACTERS,
  INITIAL_INDICATORS,
  INITIAL_GRADE_OPTIONS,
  INITIAL_USERS,
  INITIAL_ASSESSMENTS,
  INITIAL_ACTIVITY_LOGS
} from '../data/initialData';
import {
  resolveSupabaseCredentials,
  createSupabaseClientInstance,
  testSupabaseConnection,
  fetchAllFromSupabase,
  seedAllToSupabase,
  upsertSchoolProfileDb,
  upsertClassDb,
  upsertClassesDb,
  deleteClassDb,
  upsertTeacherDb,
  deleteTeacherDb,
  upsertStudentDb,
  bulkUpdateStudentsClassDb,
  deleteStudentDb,
  upsertSubCharacterDb,
  deleteSubCharacterDb,
  upsertIndicatorDb,
  deleteIndicatorDb,
  upsertGradeOptionsDb,
  upsertAssessmentDb,
  syncUsersDb,
  insertActivityLogDb,
  clearDummyDataInSupabase,
  SupabaseDatabaseSnapshot
} from './supabaseService';
import {
  BackupSemesterFilter,
  RestoreMode,
  createBackupPayload,
  parseAndValidateBackupJson,
  mergeAssessmentsByKey,
  mergeRecordsById
} from '../utils/backupHelpers';

// Only connection metadata & admin session key are stored in browser storage;
// all application domain data lives in memory + Supabase PostgreSQL (no localStorage data tables).
const CONFIG_STORAGE_KEY = 'aljannah_supabase_config';
const ADMIN_SESSION_KEY = 'aljannah_admin_session';

const LEGACY_DATA_KEYS = [
  'aljannah_school_profile',
  'aljannah_classes',
  'aljannah_teachers',
  'aljannah_students',
  'aljannah_sub_characters',
  'aljannah_indicators',
  'aljannah_grade_options',
  'aljannah_users',
  'aljannah_active_user',
  'aljannah_assessments',
  'aljannah_activity_logs'
];

interface MemoryStore {
  schoolProfile: SchoolProfile;
  classes: ClassItem[];
  teachers: Teacher[];
  students: Student[];
  subCharacters: SubCharacter[];
  indicators: CharacterIndicator[];
  gradeOptions: GradeOption[];
  users: UserAccount[];
  activeUser: UserAccount;
  assessments: AssessmentRecord[];
  activityLogs: ActivityLog[];
  supabaseConfig: SupabaseConfig;
}

const memoryStore: MemoryStore = {
  schoolProfile: { ...INITIAL_SCHOOL_PROFILE },
  classes: INITIAL_CLASSES.map(c => ({ ...c })),
  teachers: INITIAL_TEACHERS.map(t => ({ ...t })),
  students: INITIAL_STUDENTS.map(s => ({ ...s })),
  subCharacters: INITIAL_SUB_CHARACTERS.map(sc => ({ ...sc })),
  indicators: INITIAL_INDICATORS.map(i => ({ ...i })),
  gradeOptions: INITIAL_GRADE_OPTIONS.map(g => ({ ...g })),
  users: INITIAL_USERS.map(u => ({ ...u })),
  activeUser: { ...(INITIAL_USERS[1] || INITIAL_USERS[0]) },
  assessments: INITIAL_ASSESSMENTS.map(a => ({ ...a })),
  activityLogs: INITIAL_ACTIVITY_LOGS.map(l => ({ ...l })),
  supabaseConfig: {
    url: '',
    anonKey: '',
    isConnected: false,
    autoSync: false
  }
};

let activeSupabaseClient: SupabaseClient | null = null;
let isSyncingToSupabase = false;
let lastSupabaseError: string | null = null;

type StorageChangeListener = () => void;
type SyncErrorListener = (message: string) => void;
const listeners: Set<StorageChangeListener> = new Set();
const errorListeners: Set<SyncErrorListener> = new Set();

export function subscribeToDataChanges(listener: StorageChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeToSyncErrors(listener: SyncErrorListener): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

function notifyChange(): void {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error in change listener', e);
    }
  });
}

function notifySyncError(message: string): void {
  lastSupabaseError = message;
  errorListeners.forEach(fn => {
    try {
      fn(message);
    } catch (e) {
      console.error('Error in sync error listener', e);
    }
  });
  notifyChange();
}

function readStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CONFIG_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as SupabaseConfig;
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        isConnected: Boolean(parsed.isConnected),
        autoSync: Boolean(parsed.autoSync)
      };
    }
  } catch {
    // ignore
  }
  return { url: '', anonKey: '', isConnected: false, autoSync: false };
}

function writeStoredSupabaseConfig(config: SupabaseConfig): void {
  memoryStore.supabaseConfig = config;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    }
  } catch (e) {
    console.error('Failed to store Supabase config', e);
  }
}

function ensureSupabaseClient(): SupabaseClient | null {
  if (activeSupabaseClient) return activeSupabaseClient;
  const creds = resolveSupabaseCredentials(memoryStore.supabaseConfig);
  if (creds.url && creds.anonKey && (creds.source === 'env' || memoryStore.supabaseConfig.isConnected)) {
    activeSupabaseClient = createSupabaseClientInstance(creds.url, creds.anonKey);
    return activeSupabaseClient;
  }
  return null;
}

function runSupabaseWrite(label: string, op: (client: SupabaseClient) => Promise<void>): void {
  const client = ensureSupabaseClient();
  if (!client) return;

  isSyncingToSupabase = true;
  notifyChange();

  op(client)
    .then(() => {
      lastSupabaseError = null;
    })
    .catch((err: any) => {
      console.error(`Supabase CRUD error (${label}):`, err);
      notifySyncError(`Gagal menyimpan ${label} ke Supabase: ${err?.message || String(err)}`);
    })
    .finally(() => {
      isSyncingToSupabase = false;
      notifyChange();
    });
}

export function getSyncStatus(): {
  mode: 'supabase' | 'memory';
  source: 'env' | 'config' | 'none';
  isSyncing: boolean;
  lastError: string | null;
} {
  const client = ensureSupabaseClient();
  const creds = resolveSupabaseCredentials(memoryStore.supabaseConfig);
  return {
    mode: client ? 'supabase' : 'memory',
    source: client ? creds.source : 'none',
    isSyncing: isSyncingToSupabase,
    lastError: lastSupabaseError
  };
}

export function initializeStorageIfNeeded(): void {
  // Remove legacy localStorage data tables so the app no longer stores app records in localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      LEGACY_DATA_KEYS.forEach(k => localStorage.removeItem(k));
    }
  } catch {
    // ignore
  }

  const storedCfg = readStoredSupabaseConfig();
  const creds = resolveSupabaseCredentials(storedCfg);
  if (creds.source === 'env') {
    memoryStore.supabaseConfig = {
      url: creds.url,
      anonKey: creds.anonKey,
      isConnected: true,
      autoSync: true
    };
    activeSupabaseClient = createSupabaseClientInstance(creds.url, creds.anonKey);
  } else {
    memoryStore.supabaseConfig = storedCfg;
    if (storedCfg.url && storedCfg.anonKey && storedCfg.isConnected) {
      activeSupabaseClient = createSupabaseClientInstance(storedCfg.url, storedCfg.anonKey);
    }
  }
}

function applySnapshotToMemory(snapshot: Partial<SupabaseDatabaseSnapshot>): void {
  if (snapshot.schoolProfile) memoryStore.schoolProfile = snapshot.schoolProfile;
  if (snapshot.classes) memoryStore.classes = snapshot.classes;
  if (snapshot.teachers) memoryStore.teachers = snapshot.teachers;
  if (snapshot.students) memoryStore.students = snapshot.students;
  if (snapshot.subCharacters) memoryStore.subCharacters = snapshot.subCharacters;
  if (snapshot.indicators) memoryStore.indicators = snapshot.indicators;
  if (snapshot.gradeOptions && snapshot.gradeOptions.length > 0) memoryStore.gradeOptions = snapshot.gradeOptions;
  if (snapshot.assessments) memoryStore.assessments = snapshot.assessments;
  if (snapshot.users && snapshot.users.length > 0) memoryStore.users = snapshot.users;
  if (snapshot.activityLogs) memoryStore.activityLogs = snapshot.activityLogs;
}

function buildCurrentSnapshot(): SupabaseDatabaseSnapshot {
  return {
    schoolProfile: getSchoolProfile(),
    classes: getClasses(),
    teachers: getTeachers(),
    students: getStudents(),
    subCharacters: getSubCharacters(),
    indicators: getIndicators(),
    gradeOptions: getGradeOptions(),
    assessments: getAssessments(),
    users: getUsers(),
    activityLogs: getActivityLogs()
  };
}

export async function syncFromSupabaseOnStartup(): Promise<{
  connected: boolean;
  seeded?: boolean;
  error?: string;
}> {
  const creds = resolveSupabaseCredentials(memoryStore.supabaseConfig);
  if (!creds.url || !creds.anonKey) {
    return { connected: false };
  }
  if (creds.source === 'config' && !memoryStore.supabaseConfig.isConnected) {
    return { connected: false };
  }

  try {
    const client = createSupabaseClientInstance(creds.url, creds.anonKey);
    activeSupabaseClient = client;
    isSyncingToSupabase = true;
    notifyChange();

    const { isEmptyDatabase, snapshot } = await fetchAllFromSupabase(client);
    if (isEmptyDatabase) {
      // Seed initial school structure on first connection to an empty Supabase database
      await seedAllToSupabase(client, buildCurrentSnapshot());
      lastSupabaseError = null;
      return { connected: true, seeded: true };
    }

    applySnapshotToMemory(snapshot);
    lastSupabaseError = null;
    return { connected: true, seeded: false };
  } catch (err: any) {
    const msg = err?.message || String(err);
    lastSupabaseError = msg;
    return { connected: false, error: msg };
  } finally {
    isSyncingToSupabase = false;
    notifyChange();
  }
}

export async function connectAndTestSupabase(
  url: string,
  anonKey: string
): Promise<{ ok: boolean; hasTables: boolean; seeded?: boolean; message: string }> {
  const testRes = await testSupabaseConnection(url, anonKey);
  if (!testRes.ok) {
    writeStoredSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected: false,
      autoSync: false
    });
    activeSupabaseClient = null;
    notifyChange();
    return testRes;
  }

  const client = createSupabaseClientInstance(url.trim(), anonKey.trim());
  activeSupabaseClient = client;

  const newConfig: SupabaseConfig = {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConnected: true,
    autoSync: true
  };
  writeStoredSupabaseConfig(newConfig);

  try {
    isSyncingToSupabase = true;
    notifyChange();
    const { isEmptyDatabase, snapshot } = await fetchAllFromSupabase(client);
    let seeded = false;
    if (isEmptyDatabase) {
      await seedAllToSupabase(client, buildCurrentSnapshot());
      seeded = true;
    } else {
      applySnapshotToMemory(snapshot);
    }
    lastSupabaseError = null;
    notifyChange();
    return {
      ok: true,
      hasTables: true,
      seeded,
      message: seeded
        ? 'Berhasil terhubung ke Supabase & data awal berhasil dikirim ke database!'
        : 'Berhasil terhubung & menyinkronkan data dari database Supabase!'
    };
  } catch (err: any) {
    return {
      ok: false,
      hasTables: testRes.hasTables,
      message: err?.message || 'Gagal membaca tabel Supabase.'
    };
  } finally {
    isSyncingToSupabase = false;
    notifyChange();
  }
}

export async function pushCurrentDataToSupabase(): Promise<void> {
  const client = ensureSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum terhubung. Simpan Project URL dan Anon Key terlebih dahulu.');
  }
  isSyncingToSupabase = true;
  notifyChange();
  try {
    await seedAllToSupabase(client, buildCurrentSnapshot());
    lastSupabaseError = null;
  } finally {
    isSyncingToSupabase = false;
    notifyChange();
  }
}

export async function refreshFromSupabase(): Promise<void> {
  const client = ensureSupabaseClient();
  if (!client) {
    throw new Error('Supabase belum terhubung.');
  }
  isSyncingToSupabase = true;
  notifyChange();
  try {
    const { snapshot } = await fetchAllFromSupabase(client);
    applySnapshotToMemory(snapshot);
    lastSupabaseError = null;
  } finally {
    isSyncingToSupabase = false;
    notifyChange();
  }
}

export function disconnectSupabase(): void {
  activeSupabaseClient = null;
  lastSupabaseError = null;
  writeStoredSupabaseConfig({
    url: memoryStore.supabaseConfig.url,
    anonKey: memoryStore.supabaseConfig.anonKey,
    isConnected: false,
    autoSync: false
  });
  notifyChange();
}

// ---------- School Profile ----------

export function getSchoolProfile(): SchoolProfile {
  const profile = memoryStore.schoolProfile;
  if (!profile.logoUrl || profile.logoUrl.includes('facebook.com')) {
    profile.logoUrl = '/assets/aistudio/logo-AJ-rapor_c08ed6e7.png';
  }
  return profile;
}

export function saveSchoolProfile(profile: SchoolProfile): void {
  memoryStore.schoolProfile = profile;
  notifyChange();
  runSupabaseWrite('Profil Sekolah', client => upsertSchoolProfileDb(client, profile));
  addActivityLog('school', 'Profil Sekolah Diperbarui', `Informasi sekolah dan titi mangsa telah diperbarui.`);
}

// ---------- Classes ----------

export function getClasses(): ClassItem[] {
  return memoryStore.classes;
}

export function saveClasses(classes: ClassItem[]): void {
  memoryStore.classes = classes;
  notifyChange();
  runSupabaseWrite('Data Kelas', client => upsertClassesDb(client, classes));
}

export function addClass(newClass: ClassItem): void {
  const current = getClasses();
  if (current.some(c => c.name.toLowerCase() === newClass.name.toLowerCase())) {
    throw new Error(`Kelas ${newClass.name} sudah ada.`);
  }
  memoryStore.classes = [...current, newClass];
  notifyChange();
  runSupabaseWrite('Tambah Kelas', client => upsertClassDb(client, newClass));
  addActivityLog('system', 'Kelas Baru Ditambahkan', `Kelas ${newClass.name} berhasil dibuat.`);
}

export function updateClass(updated: ClassItem): void {
  const current = getClasses();
  memoryStore.classes = current.map(c => (c.id === updated.id ? updated : c));
  notifyChange();
  runSupabaseWrite('Update Kelas', client => upsertClassDb(client, updated));
}

export function deleteClass(classId: string): void {
  const current = getClasses();
  const cls = current.find(c => c.id === classId);
  memoryStore.classes = current.filter(c => c.id !== classId);
  notifyChange();
  runSupabaseWrite('Hapus Kelas', client => deleteClassDb(client, classId));
  if (cls) {
    addActivityLog('system', 'Kelas Dihapus', `Kelas ${cls.name} telah dihapus.`);
  }
}

// ---------- Teachers ----------

export function getTeachers(): Teacher[] {
  return memoryStore.teachers.map((t, idx) => ({
    ...t,
    code: String(t.code || `KG${String(idx + 1).padStart(3, '0')}`).trim(),
    role: (t.role as string) === 'Guru Bidang Studi' ? 'Guru Bidang' : t.role || 'Guru Kelas',
    assignedClass: t.assignedClass || '',
    teachingClass: t.teachingClass ?? (t.assignedClass || '')
  }));
}

export function saveTeachers(teachers: Teacher[]): void {
  memoryStore.teachers = teachers;
  notifyChange();
}

export function addTeacher(teacher: Omit<Teacher, 'id'>): Teacher {
  const current = getTeachers();
  const normalizedCode = teacher.code.trim().toUpperCase();
  if (current.some(t => t.code.trim().toUpperCase() === normalizedCode)) {
    throw new Error(`Kode Guru "${teacher.code}" sudah digunakan oleh guru lain.`);
  }
  if (teacher.role === 'Wali Kelas' && teacher.assignedClass) {
    const existingHomeroom = current.find(
      t => t.role === 'Wali Kelas' && t.assignedClass === teacher.assignedClass
    );
    if (existingHomeroom) {
      throw new Error(
        `Kelas ${teacher.assignedClass} sudah memiliki Wali Kelas: ${existingHomeroom.name}. Satu kelas hanya boleh memiliki satu wali kelas.`
      );
    }
  }

  const newTeacher: Teacher = {
    ...teacher,
    code: teacher.code.trim(),
    id: 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
  };
  memoryStore.teachers = [...current, newTeacher];

  let updatedClasses: ClassItem[] | null = null;
  if (newTeacher.role === 'Wali Kelas' && newTeacher.assignedClass) {
    updatedClasses = getClasses().map(c =>
      c.name === newTeacher.assignedClass ? { ...c, homeroomTeacherId: newTeacher.id } : c
    );
    memoryStore.classes = updatedClasses;
  }
  notifyChange();

  runSupabaseWrite('Tambah Guru', async client => {
    await upsertTeacherDb(client, newTeacher);
    if (updatedClasses) {
      await upsertClassesDb(client, updatedClasses);
    }
  });

  addActivityLog('teacher', 'Guru Ditambahkan', `${newTeacher.name} (${newTeacher.code}) berhasil ditambahkan.`);
  return newTeacher;
}

export function updateTeacher(teacher: Teacher): void {
  const current = getTeachers();
  const normalizedCode = teacher.code.trim().toUpperCase();
  const duplicateCode = current.find(
    t => t.id !== teacher.id && t.code.trim().toUpperCase() === normalizedCode
  );
  if (duplicateCode) {
    throw new Error(`Kode Guru "${teacher.code}" sudah digunakan oleh guru lain: ${duplicateCode.name}.`);
  }

  if (teacher.role === 'Wali Kelas' && teacher.assignedClass) {
    const existingHomeroom = current.find(
      t => t.id !== teacher.id && t.role === 'Wali Kelas' && t.assignedClass === teacher.assignedClass
    );
    if (existingHomeroom) {
      throw new Error(`Kelas ${teacher.assignedClass} sudah memiliki Wali Kelas: ${existingHomeroom.name}.`);
    }
  }

  const updatedTeacher: Teacher = {
    ...teacher,
    code: teacher.code.trim()
  };
  memoryStore.teachers = current.map(t => (t.id === updatedTeacher.id ? updatedTeacher : t));

  const updatedClasses = getClasses().map(c => {
    if (updatedTeacher.role === 'Wali Kelas' && c.name === updatedTeacher.assignedClass) {
      return { ...c, homeroomTeacherId: updatedTeacher.id };
    }
    if (c.homeroomTeacherId === updatedTeacher.id && c.name !== updatedTeacher.assignedClass) {
      return { ...c, homeroomTeacherId: undefined };
    }
    return c;
  });
  memoryStore.classes = updatedClasses;
  notifyChange();

  runSupabaseWrite('Update Guru', async client => {
    await upsertTeacherDb(client, updatedTeacher);
    await upsertClassesDb(client, updatedClasses);
  });

  addActivityLog('teacher', 'Data Guru Diperbarui', `Informasi ${updatedTeacher.name} telah diperbarui.`);
}

export function deleteTeacher(teacherId: string): void {
  const current = getTeachers();
  const t = current.find(i => i.id === teacherId);
  memoryStore.teachers = current.filter(i => i.id !== teacherId);

  const updatedClasses = getClasses().map(c =>
    c.homeroomTeacherId === teacherId ? { ...c, homeroomTeacherId: undefined } : c
  );
  memoryStore.classes = updatedClasses;
  notifyChange();

  runSupabaseWrite('Hapus Guru', async client => {
    await upsertClassesDb(client, updatedClasses);
    await deleteTeacherDb(client, teacherId);
  });

  if (t) {
    addActivityLog('teacher', 'Guru Dihapus', `${t.name} (${t.code}) telah dihapus dari sistem.`);
  }
}

// ---------- Students ----------

export function getStudents(): Student[] {
  return memoryStore.students;
}

export function saveStudents(students: Student[]): void {
  memoryStore.students = students;
  notifyChange();
}

export function addStudent(student: Omit<Student, 'id'>): Student {
  const current = getStudents();
  if (current.some(s => s.nis.trim() === student.nis.trim())) {
    throw new Error(`NIS "${student.nis}" sudah terdaftar untuk siswa lain.`);
  }
  const newStudent: Student = {
    ...student,
    id: 's-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
  };
  memoryStore.students = [...current, newStudent];
  notifyChange();

  runSupabaseWrite('Tambah Siswa', client => upsertStudentDb(client, newStudent));
  addActivityLog(
    'student',
    'Siswa Baru Ditambahkan',
    `${newStudent.name} (NIS: ${newStudent.nis}) kelas ${newStudent.className}.`
  );
  return newStudent;
}

export function updateStudent(student: Student): void {
  const current = getStudents();
  const duplicateNis = current.find(s => s.id !== student.id && s.nis.trim() === student.nis.trim());
  if (duplicateNis) {
    throw new Error(`NIS "${student.nis}" sudah terdaftar untuk siswa lain: ${duplicateNis.name}.`);
  }
  memoryStore.students = current.map(s => (s.id === student.id ? student : s));
  notifyChange();

  runSupabaseWrite('Update Siswa', client => upsertStudentDb(client, student));
  addActivityLog('student', 'Data Siswa Diperbarui', `Data siswa ${student.name} diperbarui.`);
}

export function deleteStudent(studentId: string): void {
  const current = getStudents();
  const student = current.find(s => s.id === studentId);
  memoryStore.students = current.filter(s => s.id !== studentId);
  notifyChange();

  runSupabaseWrite('Hapus Siswa', client => deleteStudentDb(client, studentId));
  if (student) {
    addActivityLog('student', 'Siswa Dihapus', `Data siswa ${student.name} (NIS: ${student.nis}) dihapus.`);
  }
}

export function promoteStudents(studentIds: string[], targetClassName: string): void {
  const current = getStudents();
  memoryStore.students = current.map(s =>
    studentIds.includes(s.id) ? { ...s, className: targetClassName } : s
  );
  notifyChange();

  runSupabaseWrite('Kenaikan Kelas Siswa', client =>
    bulkUpdateStudentsClassDb(client, studentIds, targetClassName)
  );
  addActivityLog(
    'student',
    'Kenaikan / Pindah Kelas',
    `${studentIds.length} siswa berhasil dipindahkan ke kelas ${targetClassName}. Riwayat penilaian tetap tersimpan aman.`
  );
}

// ---------- Characters & Indicators ----------

export function getSubCharacters(): SubCharacter[] {
  return memoryStore.subCharacters;
}

export function saveSubCharacters(subs: SubCharacter[]): void {
  memoryStore.subCharacters = subs;
  notifyChange();
}

export function addOrUpdateSubCharacter(sub: SubCharacter): void {
  const current = getSubCharacters();
  const index = current.findIndex(s => s.id === sub.id);
  if (index >= 0) {
    const next = [...current];
    next[index] = sub;
    memoryStore.subCharacters = next;
  } else {
    memoryStore.subCharacters = [...current, sub];
  }
  notifyChange();

  runSupabaseWrite('Simpan Sub Karakter', client => upsertSubCharacterDb(client, sub));
  addActivityLog('system', 'Sub Karakter Disimpan', `Sub karakter "${sub.name}" disimpan.`);
}

export function deleteSubCharacter(subId: string): void {
  memoryStore.subCharacters = getSubCharacters().filter(s => s.id !== subId);
  memoryStore.indicators = getIndicators().filter(ind => ind.subCharacterId !== subId);
  notifyChange();

  runSupabaseWrite('Hapus Sub Karakter', client => deleteSubCharacterDb(client, subId));
}

export function getIndicators(): CharacterIndicator[] {
  return memoryStore.indicators.map(ind => {
    const fallback = INITIAL_INDICATORS.find(init => init.id === ind.id);
    return {
      ...ind,
      level: ind.level || 1,
      descriptionPrefixA:
        ind.descriptionPrefixA ?? fallback?.descriptionPrefixA ?? ind.defaultDescriptionPrefix ?? '',
      descriptionPrefixB:
        ind.descriptionPrefixB ?? fallback?.descriptionPrefixB ?? ind.defaultDescriptionPrefix ?? '',
      descriptionPrefixC:
        ind.descriptionPrefixC ?? fallback?.descriptionPrefixC ?? ind.defaultDescriptionPrefix ?? ''
    };
  });
}

export function saveIndicators(inds: CharacterIndicator[]): void {
  memoryStore.indicators = inds;
  notifyChange();
}

export function addOrUpdateIndicator(ind: CharacterIndicator): void {
  const current = getIndicators();
  const index = current.findIndex(i => i.id === ind.id);
  if (index >= 0) {
    const next = [...current];
    next[index] = ind;
    memoryStore.indicators = next;
  } else {
    memoryStore.indicators = [...current, ind];
  }
  notifyChange();

  runSupabaseWrite('Simpan Indikator Karakter', client => upsertIndicatorDb(client, ind));
  addActivityLog('system', 'Indikator Karakter Disimpan', `Indikator "${ind.name}" disimpan.`);
}

export function deleteIndicator(indicatorId: string): void {
  memoryStore.indicators = getIndicators().filter(i => i.id !== indicatorId);
  notifyChange();

  runSupabaseWrite('Hapus Indikator', client => deleteIndicatorDb(client, indicatorId));
}

export function getGradeOptions(): GradeOption[] {
  return memoryStore.gradeOptions;
}

export function saveGradeOptions(options: GradeOption[]): void {
  memoryStore.gradeOptions = options;
  notifyChange();
  runSupabaseWrite('Simpan Opsi Predikat', client => upsertGradeOptionsDb(client, options));
}

// ---------- Assessments ----------

export function getAssessments(): AssessmentRecord[] {
  return memoryStore.assessments;
}

export function saveAssessments(records: AssessmentRecord[]): void {
  memoryStore.assessments = records;
  notifyChange();
}

export function getAssessmentForStudent(
  studentNis: string,
  academicYear: string,
  semester: '1' | '2'
): AssessmentRecord | undefined {
  return getAssessments().find(
    a => a.studentNis === studentNis && a.academicYear === academicYear && a.semester === semester
  );
}

export function saveAssessmentRecord(record: AssessmentRecord): void {
  const all = getAssessments();
  const index = all.findIndex(
    a =>
      a.studentNis === record.studentNis &&
      a.academicYear === record.academicYear &&
      a.semester === record.semester
  );

  const now = new Date().toISOString();
  const updatedRecord: AssessmentRecord = {
    ...record,
    updatedAt: now
  };

  if (index >= 0) {
    const next = [...all];
    next[index] = updatedRecord;
    memoryStore.assessments = next;
  } else {
    memoryStore.assessments = [...all, updatedRecord];
  }
  notifyChange();

  runSupabaseWrite('Simpan Penilaian Karakter', client => upsertAssessmentDb(client, updatedRecord));

  const student = getStudents().find(s => s.nis === record.studentNis);
  const studentName = student ? student.name : record.studentNis;
  addActivityLog(
    'assessment',
    record.status === 'final' ? 'Penilaian Rapor Difinalisasi' : 'Draft Penilaian Disimpan',
    `Penilaian untuk ${studentName} (Kelas ${record.className}, Sem ${record.semester} ${record.academicYear}) diperbarui.`,
    record.updatedBy
  );
}

// ---------- Users and Authentication State ----------

export function getUsers(): UserAccount[] {
  return memoryStore.users.map(u => {
    if (u.id === 'u-admin' && u.username === 'admin') {
      return { ...u, username: 'webdevaj', password: u.password || '@w3bd3vAJ', name: 'Administrator' };
    }
    if (u.role === 'admin' && u.username === 'webdevaj' && !u.password) {
      return { ...u, password: '@w3bd3vAJ' };
    }
    return u;
  });
}

export function saveUsers(users: UserAccount[]): void {
  memoryStore.users = users;
  notifyChange();
  runSupabaseWrite('Akun Pengguna', client => syncUsersDb(client, users));
}

export function getActiveUser(): UserAccount {
  return memoryStore.activeUser;
}

export function setActiveUser(user: UserAccount): void {
  memoryStore.activeUser = user;
  notifyChange();
}

export function getAdminSession(): UserAccount | null {
  try {
    const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(ADMIN_SESSION_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserAccount;
    return parsed && parsed.role === 'admin' ? parsed : null;
  } catch {
    return null;
  }
}

export function setAdminSession(user: UserAccount | null): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (user) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    }
    notifyChange();
  } catch (e) {
    console.error('Failed to update admin session', e);
  }
}

// ---------- Activity Logs ----------

export function getActivityLogs(): ActivityLog[] {
  return memoryStore.activityLogs;
}

export function addActivityLog(
  type: ActivityLog['type'],
  title: string,
  description: string,
  userName?: string
): void {
  const current = getActivityLogs();
  const activeUser = getActiveUser();
  const newLog: ActivityLog = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    timestamp: new Date().toISOString(),
    type,
    title,
    description,
    userName: userName || activeUser.name
  };
  memoryStore.activityLogs = [newLog, ...current].slice(0, 60);
  notifyChange();

  runSupabaseWrite('Log Aktivitas', client => insertActivityLogDb(client, newLog));
}

// ---------- Supabase Configuration ----------

export function getSupabaseConfig(): SupabaseConfig {
  const creds = resolveSupabaseCredentials(memoryStore.supabaseConfig);
  if (creds.source === 'env') {
    return {
      url: creds.url,
      anonKey: creds.anonKey,
      isConnected: true,
      autoSync: true
    };
  }
  return memoryStore.supabaseConfig;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  writeStoredSupabaseConfig(config);
  if (config.url && config.anonKey && config.isConnected) {
    activeSupabaseClient = createSupabaseClientInstance(config.url, config.anonKey);
  } else {
    activeSupabaseClient = null;
  }
  notifyChange();
}

// ---------- Reset / Clear Dummy / Export / Import ----------

export function resetToDefaultData(): void {
  memoryStore.schoolProfile = { ...INITIAL_SCHOOL_PROFILE };
  memoryStore.classes = INITIAL_CLASSES.map(c => ({ ...c }));
  memoryStore.teachers = INITIAL_TEACHERS.map(t => ({ ...t }));
  memoryStore.students = INITIAL_STUDENTS.map(s => ({ ...s }));
  memoryStore.subCharacters = INITIAL_SUB_CHARACTERS.map(sc => ({ ...sc }));
  memoryStore.indicators = INITIAL_INDICATORS.map(i => ({ ...i }));
  memoryStore.gradeOptions = INITIAL_GRADE_OPTIONS.map(g => ({ ...g }));
  memoryStore.users = INITIAL_USERS.map(u => ({ ...u }));
  memoryStore.assessments = INITIAL_ASSESSMENTS.map(a => ({ ...a }));
  memoryStore.activityLogs = INITIAL_ACTIVITY_LOGS.map(l => ({ ...l }));
  notifyChange();

  runSupabaseWrite('Reset Data Default', client => seedAllToSupabase(client, buildCurrentSnapshot()));
  addActivityLog('system', 'Data Direset', 'Semua data dikembalikan ke data default bawaan SD Islam Alam & Sains Al-Jannah.');
}

export function clearAllDummyData(): void {
  memoryStore.students = [];
  memoryStore.teachers = [];
  memoryStore.assessments = [];
  memoryStore.classes = getClasses().map(c => ({ ...c, homeroomTeacherId: undefined }));
  notifyChange();

  runSupabaseWrite('Bersihkan Data Contoh', client => clearDummyDataInSupabase(client));
  addActivityLog(
    'system',
    'Data Contoh Dibersihkan',
    'Semua data contoh guru, siswa, dan penilaian telah dibersihkan. Sistem siap untuk data riil sekolah.'
  );
}

export function exportDatabaseByYearToJson(
  academicYear: string = 'ALL',
  semester: BackupSemesterFilter = 'ALL'
): string {
  const payload = createBackupPayload(buildCurrentSnapshot(), {
    academicYear,
    semester
  });
  return JSON.stringify(payload, null, 2);
}

export function exportDatabaseToJson(): string {
  return exportDatabaseByYearToJson('ALL', 'ALL');
}

export async function importDatabaseFromJson(
  jsonString: string,
  mode: RestoreMode = 'replace'
): Promise<{ syncedToSupabase: boolean; scopeLabel: string; restoredAssessments: number }> {
  try {
    const preview = parseAndValidateBackupJson(jsonString);
    const data = preview.payload;

    if (mode === 'merge') {
      memoryStore.schoolProfile = data.schoolProfile || memoryStore.schoolProfile;
      if (data.classes.length > 0) {
        memoryStore.classes = mergeRecordsById(memoryStore.classes, data.classes);
      }
      if (data.teachers.length > 0) {
        memoryStore.teachers = mergeRecordsById(memoryStore.teachers, data.teachers);
      }
      if (data.students.length > 0) {
        memoryStore.students = mergeRecordsById(memoryStore.students, data.students);
      }
      if (data.subCharacters.length > 0) {
        memoryStore.subCharacters = mergeRecordsById(memoryStore.subCharacters, data.subCharacters);
      }
      if (data.indicators.length > 0) {
        memoryStore.indicators = mergeRecordsById(memoryStore.indicators, data.indicators);
      }
      if (data.gradeOptions.length > 0) {
        const gradeMap = new Map(memoryStore.gradeOptions.map(g => [g.code, g]));
        data.gradeOptions.forEach(g => gradeMap.set(g.code, g));
        memoryStore.gradeOptions = Array.from(gradeMap.values());
      }
      memoryStore.assessments = mergeAssessmentsByKey(memoryStore.assessments, data.assessments);
      if (data.users.length > 0) {
        memoryStore.users = mergeRecordsById(memoryStore.users, data.users);
      }
    } else {
      if (data.schoolProfile) memoryStore.schoolProfile = data.schoolProfile;
      if (data.classes) memoryStore.classes = data.classes;
      if (data.teachers) memoryStore.teachers = data.teachers;
      if (data.students) memoryStore.students = data.students;
      if (data.subCharacters) memoryStore.subCharacters = data.subCharacters;
      if (data.indicators) memoryStore.indicators = data.indicators;
      if (data.gradeOptions) memoryStore.gradeOptions = data.gradeOptions;
      if (data.assessments) memoryStore.assessments = data.assessments;
      if (data.users && data.users.length > 0) memoryStore.users = data.users;
      if (data.activityLogs) memoryStore.activityLogs = data.activityLogs;
    }

    notifyChange();

    const client = ensureSupabaseClient();
    let syncedToSupabase = false;
    if (client) {
      isSyncingToSupabase = true;
      notifyChange();
      try {
        await seedAllToSupabase(client, buildCurrentSnapshot());
        lastSupabaseError = null;
        syncedToSupabase = true;
      } finally {
        isSyncingToSupabase = false;
        notifyChange();
      }
    }

    addActivityLog(
      'system',
      'Restore Data Berhasil',
      `Database dipulihkan (${preview.scopeLabel}, mode: ${mode === 'merge' ? 'Gabung Tahun Ajaran' : 'Pulihkan Penuh'}).`
    );

    return {
      syncedToSupabase,
      scopeLabel: preview.scopeLabel,
      restoredAssessments: data.assessments.length
    };
  } catch (e) {
    console.error('Import failed', e);
    throw e;
  }
}
