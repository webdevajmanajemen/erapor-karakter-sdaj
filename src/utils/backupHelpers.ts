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
  ActivityLog
} from '../types';

export type BackupSemesterFilter = 'ALL' | '1' | '2';
export type RestoreMode = 'merge' | 'replace';

export interface DatabaseSnapshotData {
  schoolProfile: SchoolProfile;
  classes: ClassItem[];
  teachers: Teacher[];
  students: Student[];
  subCharacters: SubCharacter[];
  indicators: CharacterIndicator[];
  gradeOptions: GradeOption[];
  assessments: AssessmentRecord[];
  users: UserAccount[];
  activityLogs: ActivityLog[];
}

export interface BackupPayload extends DatabaseSnapshotData {
  version: string;
  exportedAt: string;
  backupScope: 'academic_year' | 'full';
  academicYear: string; // 'ALL' or e.g. '2026/2027'
  semester: BackupSemesterFilter;
  summary: {
    studentsCount: number;
    teachersCount: number;
    classesCount: number;
    indicatorsCount: number;
    assessmentsCount: number;
  };
}

export interface AcademicYearStats {
  academicYear: string;
  totalAssessments: number;
  finalCount: number;
  draftCount: number;
  semester1Count: number;
  semester2Count: number;
}

export interface BackupPreviewInfo {
  payload: BackupPayload;
  isValid: true;
  academicYearsInFile: string[];
  scopeLabel: string;
  exportedAt: string;
  counts: {
    students: number;
    teachers: number;
    classes: number;
    indicators: number;
    assessments: number;
  };
}

export function getAvailableAcademicYears(
  assessments: AssessmentRecord[],
  activeAcademicYear?: string
): string[] {
  const set = new Set<string>();
  if (activeAcademicYear && activeAcademicYear.trim()) {
    set.add(activeAcademicYear.trim());
  }
  assessments.forEach(a => {
    if (a.academicYear && a.academicYear.trim()) {
      set.add(a.academicYear.trim());
    }
  });
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export function getAcademicYearStats(
  assessments: AssessmentRecord[],
  academicYear: string
): AcademicYearStats {
  const matching = assessments.filter(a => a.academicYear === academicYear);
  return {
    academicYear,
    totalAssessments: matching.length,
    finalCount: matching.filter(a => a.status === 'final').length,
    draftCount: matching.filter(a => a.status === 'draft').length,
    semester1Count: matching.filter(a => a.semester === '1').length,
    semester2Count: matching.filter(a => a.semester === '2').length
  };
}

export function filterAssessmentsForBackup(
  assessments: AssessmentRecord[],
  academicYear: string,
  semester: BackupSemesterFilter = 'ALL'
): AssessmentRecord[] {
  return assessments.filter(a => {
    const matchYear = academicYear === 'ALL' || a.academicYear === academicYear;
    const matchSemester = semester === 'ALL' || a.semester === semester;
    return matchYear && matchSemester;
  });
}

export function createBackupPayload(
  snapshot: DatabaseSnapshotData,
  options?: {
    academicYear?: string;
    semester?: BackupSemesterFilter;
    exportedAt?: string;
  }
): BackupPayload {
  const academicYear = (options?.academicYear || 'ALL').trim() || 'ALL';
  const semester: BackupSemesterFilter = options?.semester || 'ALL';
  const exportedAt = options?.exportedAt || new Date().toISOString();

  const filteredAssessments = filterAssessmentsForBackup(
    snapshot.assessments,
    academicYear,
    semester
  );

  const backupScope: 'academic_year' | 'full' = academicYear === 'ALL' ? 'full' : 'academic_year';

  return {
    version: '2.0',
    exportedAt,
    backupScope,
    academicYear,
    semester,
    summary: {
      studentsCount: snapshot.students.length,
      teachersCount: snapshot.teachers.length,
      classesCount: snapshot.classes.length,
      indicatorsCount: snapshot.indicators.length,
      assessmentsCount: filteredAssessments.length
    },
    schoolProfile: snapshot.schoolProfile,
    classes: snapshot.classes,
    teachers: snapshot.teachers,
    students: snapshot.students,
    subCharacters: snapshot.subCharacters,
    indicators: snapshot.indicators,
    gradeOptions: snapshot.gradeOptions,
    assessments: filteredAssessments,
    users: snapshot.users,
    activityLogs: snapshot.activityLogs
  };
}

export function buildBackupFilename(
  academicYear: string,
  semester: BackupSemesterFilter = 'ALL',
  dateInput?: Date
): string {
  const dateStr = (dateInput || new Date()).toISOString().split('T')[0];
  if (academicYear === 'ALL') {
    return `Backup_ERapor_AlJannah_Lengkap_${dateStr}.json`;
  }
  const safeYear = academicYear.replace(/[^a-zA-Z0-9_-]+/g, '-');
  const semSuffix = semester === 'ALL' ? '' : `_Sem${semester}`;
  return `Backup_ERapor_AlJannah_TA_${safeYear}${semSuffix}_${dateStr}.json`;
}

export function parseAndValidateBackupJson(jsonString: string): BackupPreviewInfo {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Berkas bukan format JSON yang valid.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Isi berkas cadangan tidak valid.');
  }

  if (!parsed.schoolProfile || !Array.isArray(parsed.indicators)) {
    throw new Error(
      'Struktur berkas cadangan tidak sesuai (data profil sekolah atau indikator tidak ditemukan).'
    );
  }

  const assessments: AssessmentRecord[] = Array.isArray(parsed.assessments) ? parsed.assessments : [];
  const students: Student[] = Array.isArray(parsed.students) ? parsed.students : [];
  const teachers: Teacher[] = Array.isArray(parsed.teachers) ? parsed.teachers : [];
  const classes: ClassItem[] = Array.isArray(parsed.classes) ? parsed.classes : [];
  const subCharacters: SubCharacter[] = Array.isArray(parsed.subCharacters) ? parsed.subCharacters : [];
  const indicators: CharacterIndicator[] = Array.isArray(parsed.indicators) ? parsed.indicators : [];
  const gradeOptions: GradeOption[] = Array.isArray(parsed.gradeOptions) ? parsed.gradeOptions : [];
  const users: UserAccount[] = Array.isArray(parsed.users) ? parsed.users : [];
  const activityLogs: ActivityLog[] = Array.isArray(parsed.activityLogs) ? parsed.activityLogs : [];

  const academicYearsInFile = Array.from(
    new Set(assessments.map(a => a.academicYear).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));

  const academicYear = typeof parsed.academicYear === 'string' && parsed.academicYear.trim()
    ? parsed.academicYear.trim()
    : academicYearsInFile.length === 1
      ? academicYearsInFile[0]
      : 'ALL';

  const semester: BackupSemesterFilter =
    parsed.semester === '1' || parsed.semester === '2' ? parsed.semester : 'ALL';

  const backupScope: 'academic_year' | 'full' =
    parsed.backupScope === 'academic_year' || (academicYear !== 'ALL')
      ? 'academic_year'
      : 'full';

  const exportedAt =
    typeof parsed.exportedAt === 'string' && parsed.exportedAt
      ? parsed.exportedAt
      : new Date().toISOString();

  const payload: BackupPayload = {
    version: String(parsed.version || '1.0'),
    exportedAt,
    backupScope,
    academicYear,
    semester,
    summary: {
      studentsCount: students.length,
      teachersCount: teachers.length,
      classesCount: classes.length,
      indicatorsCount: indicators.length,
      assessmentsCount: assessments.length
    },
    schoolProfile: parsed.schoolProfile,
    classes,
    teachers,
    students,
    subCharacters,
    indicators,
    gradeOptions,
    assessments,
    users,
    activityLogs
  };

  let scopeLabel = 'Semua Tahun Ajaran (Lengkap)';
  if (academicYear !== 'ALL') {
    const semText = semester === 'ALL' ? 'Semester 1 & 2' : `Semester ${semester}`;
    scopeLabel = `Tahun Ajaran ${academicYear} (${semText})`;
  }

  return {
    payload,
    isValid: true,
    academicYearsInFile,
    scopeLabel,
    exportedAt,
    counts: {
      students: students.length,
      teachers: teachers.length,
      classes: classes.length,
      indicators: indicators.length,
      assessments: assessments.length
    }
  };
}

export function mergeAssessmentsByKey(
  existingAssessments: AssessmentRecord[],
  incomingAssessments: AssessmentRecord[]
): AssessmentRecord[] {
  const map = new Map<string, AssessmentRecord>();
  const makeKey = (a: AssessmentRecord) => `${a.studentNis}::${a.academicYear}::${a.semester}`;

  existingAssessments.forEach(item => {
    map.set(makeKey(item), item);
  });
  incomingAssessments.forEach(item => {
    map.set(makeKey(item), item);
  });

  return Array.from(map.values());
}

export function mergeRecordsById<T extends { id: string }>(
  existing: T[],
  incoming: T[]
): T[] {
  const map = new Map<string, T>();
  existing.forEach(item => map.set(item.id, item));
  incoming.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
}
