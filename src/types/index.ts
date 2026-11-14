export type Gender = 'L' | 'P';
export type StudentStatus = 'Reguler' | 'Inklusi';
export type TeacherRole = 'Wali Kelas' | 'Guru Kelas' | 'Guru Bidang';
export type UserRole = 'admin' | 'teacher';
export type CharacterCategory = 'ISLAM' | 'ALAM' | 'SAINS';
export type GradeCode = 'A' | 'B' | 'C';
export type AssessmentStatus = 'belum' | 'draft' | 'final';

export interface TitiMangsa {
  day: string;
  month: string;
  year: string;
}

export interface SchoolProfile {
  name: string;
  npsn: string;
  phase: string;
  level: string;
  address: string;
  village: string;
  district: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  headmasterName: string;
  headmasterNip: string;
  activeAcademicYear: string;
  activeSemester: '1' | '2';
  titiMangsaSemester1: TitiMangsa;
  titiMangsaSemester2: TitiMangsa;
}

export interface Teacher {
  id: string;
  code: string;
  name: string;
  gender: Gender;
  role: TeacherRole;
  assignedClass: string;
  teachingClass?: string;
  phone?: string;
  email?: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn?: string;
  name: string;
  gender: Gender;
  status: StudentStatus;
  className: string;
  parentName: string;
  notes?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  level: number;
  phase: string;
  homeroomTeacherId?: string;
}

export interface SubCharacter {
  id: string;
  categoryId: CharacterCategory;
  name: string;
  order: number;
}

export interface CharacterIndicator {
  id: string;
  subCharacterId: string;
  categoryId: CharacterCategory;
  level: number; // Tingkat kelas 1 - 6
  name: string;
  defaultDescriptionPrefix: string;
  descriptionPrefixA?: string;
  descriptionPrefixB?: string;
  descriptionPrefixC?: string;
  order: number;
}

export interface GradeOption {
  code: GradeCode;
  label: string;
  description: string;
}

export interface AssessmentItem {
  indicatorId: string;
  grade: GradeCode | '';
  notes: string;
  updatedAt: string;
}

export interface AssessmentRecord {
  id: string;
  studentId: string;
  studentNis: string;
  academicYear: string;
  semester: '1' | '2';
  className: string;
  status: 'draft' | 'final';
  items: Record<string, AssessmentItem>;
  generalNotes?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  teacherId?: string;
  avatar?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'student' | 'teacher' | 'assessment' | 'report' | 'school' | 'system';
  title: string;
  description: string;
  userName: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  autoSync: boolean;
}
