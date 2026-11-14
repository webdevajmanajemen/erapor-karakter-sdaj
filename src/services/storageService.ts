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

const KEYS = {
  SCHOOL_PROFILE: 'aljannah_school_profile',
  CLASSES: 'aljannah_classes',
  TEACHERS: 'aljannah_teachers',
  STUDENTS: 'aljannah_students',
  SUB_CHARACTERS: 'aljannah_sub_characters',
  INDICATORS: 'aljannah_indicators',
  GRADE_OPTIONS: 'aljannah_grade_options',
  USERS: 'aljannah_users',
  ACTIVE_USER: 'aljannah_active_user',
  ASSESSMENTS: 'aljannah_assessments',
  ACTIVITY_LOGS: 'aljannah_activity_logs',
  SUPABASE_CONFIG: 'aljannah_supabase_config',
  ADMIN_SESSION: 'aljannah_admin_session'
};

type StorageChangeListener = () => void;
const listeners: Set<StorageChangeListener> = new Set();

export function subscribeToDataChanges(listener: StorageChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
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

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to read ${key} from storage`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyChange();
  } catch (e) {
    console.error(`Failed to write ${key} to storage`, e);
  }
}

export function initializeStorageIfNeeded(): void {
  const existingProfileRaw = localStorage.getItem(KEYS.SCHOOL_PROFILE);
  if (!existingProfileRaw) {
    localStorage.setItem(KEYS.SCHOOL_PROFILE, JSON.stringify(INITIAL_SCHOOL_PROFILE));
  } else {
    try {
      const parsed = JSON.parse(existingProfileRaw);
      if (!parsed.logoUrl || parsed.logoUrl.includes('facebook.com')) {
        parsed.logoUrl = INITIAL_SCHOOL_PROFILE.logoUrl;
        localStorage.setItem(KEYS.SCHOOL_PROFILE, JSON.stringify(parsed));
      }
    } catch {
      localStorage.setItem(KEYS.SCHOOL_PROFILE, JSON.stringify(INITIAL_SCHOOL_PROFILE));
    }
  }
  if (!localStorage.getItem(KEYS.CLASSES)) {
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  }
  if (!localStorage.getItem(KEYS.TEACHERS)) {
    localStorage.setItem(KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
  } else {
    try {
      const parsedTeachers = JSON.parse(localStorage.getItem(KEYS.TEACHERS) || '[]');
      if (Array.isArray(parsedTeachers)) {
        const legacyDemoNipToCode: Record<string, string> = {
          '19840315 200801 1 007': 'KG001',
          '19881120 201101 2 012': 'KG002',
          '19900214 201402 1 005': 'KG003',
          '19920805 201601 2 018': 'KG004',
          '19870619 201001 1 009': 'KG005',
          '19940110 201802 2 021': 'KG006'
        };
        const normalized = parsedTeachers.map((t: any, idx: number) => {
          const rawCode = String(t.code || t.nip || '').trim();
          const migratedCode = legacyDemoNipToCode[rawCode] || rawCode || `KG${String(idx + 1).padStart(3, '0')}`;
          const normalizedRole =
            t.role === 'Guru Bidang Studi' ? 'Guru Bidang' : t.role || 'Guru Kelas';
          const { nip: _removedNip, ...rest } = t;
          return {
            ...rest,
            code: migratedCode,
            role: normalizedRole,
            teachingClass: t.teachingClass ?? (t.assignedClass || (normalizedRole === 'Guru Bidang' ? 'Semua Kelas' : ''))
          };
        });
        localStorage.setItem(KEYS.TEACHERS, JSON.stringify(normalized));
      }
    } catch {
      localStorage.setItem(KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
    }
  }
  if (!localStorage.getItem(KEYS.STUDENTS)) {
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  }
  if (!localStorage.getItem(KEYS.SUB_CHARACTERS)) {
    localStorage.setItem(KEYS.SUB_CHARACTERS, JSON.stringify(INITIAL_SUB_CHARACTERS));
  }
  const rawIndicators = localStorage.getItem(KEYS.INDICATORS);
  if (!rawIndicators) {
    localStorage.setItem(KEYS.INDICATORS, JSON.stringify(INITIAL_INDICATORS));
  } else {
    try {
      const parsedInd = JSON.parse(rawIndicators);
      if (Array.isArray(parsedInd)) {
        const upgraded = parsedInd.map((ind: any) => {
          const fallback = INITIAL_INDICATORS.find(init => init.id === ind.id);
          return {
            ...ind,
            level: ind.level || 1,
            descriptionPrefixA: ind.descriptionPrefixA ?? fallback?.descriptionPrefixA ?? ind.defaultDescriptionPrefix ?? '',
            descriptionPrefixB: ind.descriptionPrefixB ?? fallback?.descriptionPrefixB ?? ind.defaultDescriptionPrefix ?? '',
            descriptionPrefixC: ind.descriptionPrefixC ?? fallback?.descriptionPrefixC ?? ind.defaultDescriptionPrefix ?? ''
          };
        });
        // If still on old 9 items without level 2, update to INITIAL_INDICATORS
        if (upgraded.length <= 9) {
          localStorage.setItem(KEYS.INDICATORS, JSON.stringify(INITIAL_INDICATORS));
        } else {
          localStorage.setItem(KEYS.INDICATORS, JSON.stringify(upgraded));
        }
      }
    } catch {
      localStorage.setItem(KEYS.INDICATORS, JSON.stringify(INITIAL_INDICATORS));
    }
  }
  if (!localStorage.getItem(KEYS.GRADE_OPTIONS)) {
    localStorage.setItem(KEYS.GRADE_OPTIONS, JSON.stringify(INITIAL_GRADE_OPTIONS));
  }
  const rawUsers = localStorage.getItem(KEYS.USERS);
  if (!rawUsers) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  } else {
    try {
      const parsedUsers = JSON.parse(rawUsers);
      if (Array.isArray(parsedUsers)) {
        const hasWebdevaj = parsedUsers.some((u: any) => u.role === 'admin' && u.username === 'webdevaj');
        let migratedUsers = parsedUsers.map((u: any) => {
          if (u.id === 'u-admin' && u.username === 'admin') {
            return { ...u, username: 'webdevaj', password: u.password || '@w3bd3vAJ', name: 'Administrator' };
          }
          if (u.role === 'admin' && u.username === 'webdevaj' && !u.password) {
            return { ...u, password: '@w3bd3vAJ' };
          }
          return u;
        });
        if (!hasWebdevaj && !migratedUsers.some((u: any) => u.username === 'webdevaj')) {
          migratedUsers = [INITIAL_USERS[0], ...migratedUsers];
        }
        localStorage.setItem(KEYS.USERS, JSON.stringify(migratedUsers));
      }
    } catch {
      localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
  }
  if (!localStorage.getItem(KEYS.ACTIVE_USER)) {
    localStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(INITIAL_USERS[1] || INITIAL_USERS[0]));
  }
  if (!localStorage.getItem(KEYS.ASSESSMENTS)) {
    localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
  }
  if (!localStorage.getItem(KEYS.ACTIVITY_LOGS)) {
    localStorage.setItem(KEYS.ACTIVITY_LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
  }
  if (!localStorage.getItem(KEYS.SUPABASE_CONFIG)) {
    localStorage.setItem(
      KEYS.SUPABASE_CONFIG,
      JSON.stringify({
        url: '',
        anonKey: '',
        isConnected: false,
        autoSync: false
      } as SupabaseConfig)
    );
  }
}

// School Profile
export function getSchoolProfile(): SchoolProfile {
  const profile = getItem<SchoolProfile>(KEYS.SCHOOL_PROFILE, INITIAL_SCHOOL_PROFILE);
  // Auto-upgrade legacy Facebook link or empty logo to official local Al-Jannah logo
  if (!profile.logoUrl || profile.logoUrl.includes('facebook.com')) {
    profile.logoUrl = '/assets/aistudio/logo-AJ-rapor_c08ed6e7.png';
    setItem(KEYS.SCHOOL_PROFILE, profile);
  }
  return profile;
}

export function saveSchoolProfile(profile: SchoolProfile): void {
  setItem(KEYS.SCHOOL_PROFILE, profile);
  addActivityLog('school', 'Profil Sekolah Diperbarui', `Informasi sekolah dan titi mangsa telah diperbarui.`);
}

// Classes
export function getClasses(): ClassItem[] {
  return getItem<ClassItem[]>(KEYS.CLASSES, INITIAL_CLASSES);
}

export function saveClasses(classes: ClassItem[]): void {
  setItem(KEYS.CLASSES, classes);
}

export function addClass(newClass: ClassItem): void {
  const current = getClasses();
  if (current.some(c => c.name.toLowerCase() === newClass.name.toLowerCase())) {
    throw new Error(`Kelas ${newClass.name} sudah ada.`);
  }
  saveClasses([...current, newClass]);
  addActivityLog('system', 'Kelas Baru Ditambahkan', `Kelas ${newClass.name} berhasil dibuat.`);
}

export function updateClass(updated: ClassItem): void {
  const current = getClasses();
  saveClasses(current.map(c => (c.id === updated.id ? updated : c)));
}

export function deleteClass(classId: string): void {
  const current = getClasses();
  const cls = current.find(c => c.id === classId);
  saveClasses(current.filter(c => c.id !== classId));
  if (cls) {
    addActivityLog('system', 'Kelas Dihapus', `Kelas ${cls.name} telah dihapus.`);
  }
}

// Teachers
export function getTeachers(): Teacher[] {
  const raw = getItem<any[]>(KEYS.TEACHERS, INITIAL_TEACHERS);
  if (!Array.isArray(raw)) return INITIAL_TEACHERS;
  return raw.map((t, idx) => ({
    ...t,
    code: String(t.code || t.nip || `KG${String(idx + 1).padStart(3, '0')}`).trim(),
    role: t.role === 'Guru Bidang Studi' ? 'Guru Bidang' : (t.role || 'Guru Kelas'),
    assignedClass: t.assignedClass || '',
    teachingClass: t.teachingClass ?? (t.assignedClass || '')
  }));
}

export function saveTeachers(teachers: Teacher[]): void {
  setItem(KEYS.TEACHERS, teachers);
}

export function addTeacher(teacher: Omit<Teacher, 'id'>): Teacher {
  const current = getTeachers();
  const normalizedCode = teacher.code.trim().toUpperCase();
  if (current.some(t => t.code.trim().toUpperCase() === normalizedCode)) {
    throw new Error(`Kode Guru "${teacher.code}" sudah digunakan oleh guru lain.`);
  }
  // Check homeroom validation
  if (teacher.role === 'Wali Kelas' && teacher.assignedClass) {
    const existingHomeroom = current.find(
      t => t.role === 'Wali Kelas' && t.assignedClass === teacher.assignedClass
    );
    if (existingHomeroom) {
      throw new Error(`Kelas ${teacher.assignedClass} sudah memiliki Wali Kelas: ${existingHomeroom.name}. Satu kelas hanya boleh memiliki satu wali kelas.`);
    }
  }

  const newTeacher: Teacher = {
    ...teacher,
    code: teacher.code.trim(),
    id: 't-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
  };
  saveTeachers([...current, newTeacher]);

  // Update class homeroom teacher reference if applicable
  if (newTeacher.role === 'Wali Kelas' && newTeacher.assignedClass) {
    const classes = getClasses();
    const updated = classes.map(c =>
      c.name === newTeacher.assignedClass ? { ...c, homeroomTeacherId: newTeacher.id } : c
    );
    saveClasses(updated);
  }

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
  saveTeachers(current.map(t => (t.id === updatedTeacher.id ? updatedTeacher : t)));

  // Update classes table homeroom mapping
  const classes = getClasses();
  const updatedClasses = classes.map(c => {
    if (updatedTeacher.role === 'Wali Kelas' && c.name === updatedTeacher.assignedClass) {
      return { ...c, homeroomTeacherId: updatedTeacher.id };
    }
    if (c.homeroomTeacherId === updatedTeacher.id && c.name !== updatedTeacher.assignedClass) {
      return { ...c, homeroomTeacherId: undefined };
    }
    return c;
  });
  saveClasses(updatedClasses);

  addActivityLog('teacher', 'Data Guru Diperbarui', `Informasi ${updatedTeacher.name} telah diperbarui.`);
}

export function deleteTeacher(teacherId: string): void {
  const current = getTeachers();
  const t = current.find(i => i.id === teacherId);
  saveTeachers(current.filter(i => i.id !== teacherId));

  // Remove from class homeroom mapping
  const classes = getClasses();
  saveClasses(classes.map(c => (c.homeroomTeacherId === teacherId ? { ...c, homeroomTeacherId: undefined } : c)));

  if (t) {
    addActivityLog('teacher', 'Guru Dihapus', `${t.name} (${t.code}) telah dihapus dari sistem.`);
  }
}

// Students
export function getStudents(): Student[] {
  return getItem<Student[]>(KEYS.STUDENTS, INITIAL_STUDENTS);
}

export function saveStudents(students: Student[]): void {
  setItem(KEYS.STUDENTS, students);
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
  saveStudents([...current, newStudent]);
  addActivityLog('student', 'Siswa Baru Ditambahkan', `${newStudent.name} (NIS: ${newStudent.nis}) kelas ${newStudent.className}.`);
  return newStudent;
}

export function updateStudent(student: Student): void {
  const current = getStudents();
  const duplicateNis = current.find(s => s.id !== student.id && s.nis.trim() === student.nis.trim());
  if (duplicateNis) {
    throw new Error(`NIS "${student.nis}" sudah terdaftar untuk siswa lain: ${duplicateNis.name}.`);
  }
  saveStudents(current.map(s => (s.id === student.id ? student : s)));
  addActivityLog('student', 'Data Siswa Diperbarui', `Data siswa ${student.name} diperbarui.`);
}

export function deleteStudent(studentId: string): void {
  const current = getStudents();
  const student = current.find(s => s.id === studentId);
  saveStudents(current.filter(s => s.id !== studentId));
  if (student) {
    addActivityLog('student', 'Siswa Dihapus', `Data siswa ${student.name} (NIS: ${student.nis}) dihapus.`);
  }
}

// Bulk Class Promotion / Transfer
export function promoteStudents(studentIds: string[], targetClassName: string): void {
  const current = getStudents();
  const updated = current.map(s => (studentIds.includes(s.id) ? { ...s, className: targetClassName } : s));
  saveStudents(updated);
  addActivityLog(
    'student',
    'Kenaikan / Pindah Kelas',
    `${studentIds.length} siswa berhasil dipindahkan ke kelas ${targetClassName}. Riwayat penilaian tetap tersimpan aman.`
  );
}

// Characters & Indicators
export function getSubCharacters(): SubCharacter[] {
  return getItem<SubCharacter[]>(KEYS.SUB_CHARACTERS, INITIAL_SUB_CHARACTERS);
}

export function saveSubCharacters(subs: SubCharacter[]): void {
  setItem(KEYS.SUB_CHARACTERS, subs);
}

export function addOrUpdateSubCharacter(sub: SubCharacter): void {
  const current = getSubCharacters();
  const index = current.findIndex(s => s.id === sub.id);
  if (index >= 0) {
    current[index] = sub;
    saveSubCharacters([...current]);
  } else {
    saveSubCharacters([...current, sub]);
  }
  addActivityLog('system', 'Sub Karakter Disimpan', `Sub karakter "${sub.name}" disimpan.`);
}

export function deleteSubCharacter(subId: string): void {
  const current = getSubCharacters();
  saveSubCharacters(current.filter(s => s.id !== subId));
  // Also remove indicators under this sub-character
  const indicators = getIndicators();
  saveIndicators(indicators.filter(ind => ind.subCharacterId !== subId));
}

export function getIndicators(): CharacterIndicator[] {
  const current = getItem<CharacterIndicator[]>(KEYS.INDICATORS, INITIAL_INDICATORS);
  if (!Array.isArray(current)) return INITIAL_INDICATORS;
  return current.map(ind => {
    const fallback = INITIAL_INDICATORS.find(init => init.id === ind.id);
    return {
      ...ind,
      level: ind.level || 1,
      descriptionPrefixA: ind.descriptionPrefixA ?? fallback?.descriptionPrefixA ?? ind.defaultDescriptionPrefix ?? '',
      descriptionPrefixB: ind.descriptionPrefixB ?? fallback?.descriptionPrefixB ?? ind.defaultDescriptionPrefix ?? '',
      descriptionPrefixC: ind.descriptionPrefixC ?? fallback?.descriptionPrefixC ?? ind.defaultDescriptionPrefix ?? ''
    };
  });
}

export function saveIndicators(inds: CharacterIndicator[]): void {
  setItem(KEYS.INDICATORS, inds);
}

export function addOrUpdateIndicator(ind: CharacterIndicator): void {
  const current = getIndicators();
  const index = current.findIndex(i => i.id === ind.id);
  if (index >= 0) {
    current[index] = ind;
    saveIndicators([...current]);
  } else {
    saveIndicators([...current, ind]);
  }
  addActivityLog('system', 'Indikator Karakter Disimpan', `Indikator "${ind.name}" disimpan.`);
}

export function deleteIndicator(indicatorId: string): void {
  const current = getIndicators();
  saveIndicators(current.filter(i => i.id !== indicatorId));
}

export function getGradeOptions(): GradeOption[] {
  return getItem<GradeOption[]>(KEYS.GRADE_OPTIONS, INITIAL_GRADE_OPTIONS);
}

export function saveGradeOptions(options: GradeOption[]): void {
  setItem(KEYS.GRADE_OPTIONS, options);
}

// Assessments
export function getAssessments(): AssessmentRecord[] {
  return getItem<AssessmentRecord[]>(KEYS.ASSESSMENTS, INITIAL_ASSESSMENTS);
}

export function saveAssessments(records: AssessmentRecord[]): void {
  setItem(KEYS.ASSESSMENTS, records);
}

export function getAssessmentForStudent(
  studentNis: string,
  academicYear: string,
  semester: '1' | '2'
): AssessmentRecord | undefined {
  const all = getAssessments();
  return all.find(
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
  const updatedRecord = {
    ...record,
    updatedAt: now
  };

  if (index >= 0) {
    all[index] = updatedRecord;
    saveAssessments([...all]);
  } else {
    saveAssessments([...all, updatedRecord]);
  }

  const student = getStudents().find(s => s.nis === record.studentNis);
  const studentName = student ? student.name : record.studentNis;
  addActivityLog(
    'assessment',
    record.status === 'final' ? 'Penilaian Rapor Difinalisasi' : 'Draft Penilaian Disimpan',
    `Penilaian untuk ${studentName} (Kelas ${record.className}, Sem ${record.semester} ${record.academicYear}) diperbarui.`,
    record.updatedBy
  );
}

// Users and Authentication State
export function getUsers(): UserAccount[] {
  const current = getItem<UserAccount[]>(KEYS.USERS, INITIAL_USERS);
  if (!Array.isArray(current)) return INITIAL_USERS;
  return current.map(u => {
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
  setItem(KEYS.USERS, users);
}

export function getActiveUser(): UserAccount {
  return getItem<UserAccount>(KEYS.ACTIVE_USER, INITIAL_USERS[1] || INITIAL_USERS[0]);
}

export function setActiveUser(user: UserAccount): void {
  setItem(KEYS.ACTIVE_USER, user);
}

export function getAdminSession(): UserAccount | null {
  try {
    const raw = localStorage.getItem(KEYS.ADMIN_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserAccount;
    return parsed && parsed.role === 'admin' ? parsed : null;
  } catch {
    return null;
  }
}

export function setAdminSession(user: UserAccount | null): void {
  try {
    if (user) {
      localStorage.setItem(KEYS.ADMIN_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.ADMIN_SESSION);
    }
    notifyChange();
  } catch (e) {
    console.error('Failed to update admin session', e);
  }
}

// Activity Logs
export function getActivityLogs(): ActivityLog[] {
  return getItem<ActivityLog[]>(KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
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
  // Keep last 60 logs
  const updated = [newLog, ...current].slice(0, 60);
  setItem(KEYS.ACTIVITY_LOGS, updated);
}

// Supabase Configuration
export function getSupabaseConfig(): SupabaseConfig {
  return getItem<SupabaseConfig>(KEYS.SUPABASE_CONFIG, {
    url: '',
    anonKey: '',
    isConnected: false,
    autoSync: false
  });
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  setItem(KEYS.SUPABASE_CONFIG, config);
  addActivityLog('system', 'Konfigurasi Supabase Diperbarui', `Pengaturan koneksi Supabase telah disimpan.`);
}

// Reset / Clear Dummy
export function resetToDefaultData(): void {
  localStorage.setItem(KEYS.SCHOOL_PROFILE, JSON.stringify(INITIAL_SCHOOL_PROFILE));
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  localStorage.setItem(KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
  localStorage.setItem(KEYS.SUB_CHARACTERS, JSON.stringify(INITIAL_SUB_CHARACTERS));
  localStorage.setItem(KEYS.INDICATORS, JSON.stringify(INITIAL_INDICATORS));
  localStorage.setItem(KEYS.GRADE_OPTIONS, JSON.stringify(INITIAL_GRADE_OPTIONS));
  localStorage.setItem(KEYS.USERS, JSON.stringify(INITIAL_USERS));
  localStorage.setItem(KEYS.ACTIVE_USER, JSON.stringify(INITIAL_USERS[0]));
  localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(INITIAL_ASSESSMENTS));
  localStorage.setItem(KEYS.ACTIVITY_LOGS, JSON.stringify(INITIAL_ACTIVITY_LOGS));
  notifyChange();
  addActivityLog('system', 'Data Direset', 'Semua data dikembalikan ke data default bawaan SD Islam Alam & Sains Al-Jannah.');
}

export function clearAllDummyData(): void {
  // Clear dummy students, teachers, and assessments, keep structure, school profile & indicators
  localStorage.setItem(KEYS.STUDENTS, JSON.stringify([]));
  localStorage.setItem(KEYS.TEACHERS, JSON.stringify([]));
  localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify([]));
  // reset homeroom teachers in classes
  const classes = getClasses().map(c => ({ ...c, homeroomTeacherId: undefined }));
  localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
  notifyChange();
  addActivityLog('system', 'Data Contoh Dibersihkan', 'Semua data contoh guru, siswa, dan penilaian telah dibersihkan. Sistem siap untuk data riil sekolah.');
}

// Full Export and Import
export function exportDatabaseToJson(): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
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
  return JSON.stringify(data, null, 2);
}

export function importDatabaseFromJson(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data.schoolProfile || !data.indicators) {
      throw new Error('Format berkas cadangan (backup) tidak valid.');
    }
    if (data.schoolProfile) localStorage.setItem(KEYS.SCHOOL_PROFILE, JSON.stringify(data.schoolProfile));
    if (data.classes) localStorage.setItem(KEYS.CLASSES, JSON.stringify(data.classes));
    if (data.teachers) localStorage.setItem(KEYS.TEACHERS, JSON.stringify(data.teachers));
    if (data.students) localStorage.setItem(KEYS.STUDENTS, JSON.stringify(data.students));
    if (data.subCharacters) localStorage.setItem(KEYS.SUB_CHARACTERS, JSON.stringify(data.subCharacters));
    if (data.indicators) localStorage.setItem(KEYS.INDICATORS, JSON.stringify(data.indicators));
    if (data.gradeOptions) localStorage.setItem(KEYS.GRADE_OPTIONS, JSON.stringify(data.gradeOptions));
    if (data.assessments) localStorage.setItem(KEYS.ASSESSMENTS, JSON.stringify(data.assessments));
    if (data.users) localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
    if (data.activityLogs) localStorage.setItem(KEYS.ACTIVITY_LOGS, JSON.stringify(data.activityLogs));
    notifyChange();
    addActivityLog('system', 'Restore Data Berhasil', 'Database berhasil dipulihkan dari berkas cadangan JSON.');
    return true;
  } catch (e) {
    console.error('Import failed', e);
    throw e;
  }
}
