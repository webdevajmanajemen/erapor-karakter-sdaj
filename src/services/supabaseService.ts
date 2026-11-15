import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
import { INITIAL_SCHOOL_PROFILE } from '../data/initialData';

export interface SupabaseDatabaseSnapshot {
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

declare const __SUPABASE_URL_FALLBACK__: string | undefined;
declare const __SUPABASE_ANON_KEY_FALLBACK__: string | undefined;

export function getEnvSupabaseConfig(): { url: string; anonKey: string } {
  const viteUrl =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? String(import.meta.env.VITE_SUPABASE_URL || '').trim()
      : '';
  const viteKey =
    typeof import.meta !== 'undefined' && (import.meta as any).env
      ? String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
      : '';
  const fallbackUrl =
    typeof __SUPABASE_URL_FALLBACK__ !== 'undefined'
      ? String(__SUPABASE_URL_FALLBACK__ || '').trim()
      : '';
  const fallbackKey =
    typeof __SUPABASE_ANON_KEY_FALLBACK__ !== 'undefined'
      ? String(__SUPABASE_ANON_KEY_FALLBACK__ || '').trim()
      : '';

  return {
    url: viteUrl || fallbackUrl,
    anonKey: viteKey || fallbackKey
  };
}

export function resolveSupabaseCredentials(savedConfig?: Partial<SupabaseConfig> | null): {
  url: string;
  anonKey: string;
  source: 'env' | 'config' | 'none';
} {
  const envCfg = getEnvSupabaseConfig();
  if (envCfg.url && envCfg.anonKey) {
    return { url: envCfg.url, anonKey: envCfg.anonKey, source: 'env' };
  }
  const cfgUrl = String(savedConfig?.url || '').trim();
  const cfgKey = String(savedConfig?.anonKey || '').trim();
  if (cfgUrl && cfgKey) {
    return { url: cfgUrl, anonKey: cfgKey, source: 'config' };
  }
  return { url: '', anonKey: '', source: 'none' };
}

let cachedClient: SupabaseClient | null = null;
let cachedClientKey = '';

export function createSupabaseClientInstance(url: string, anonKey: string): SupabaseClient {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  const cacheKey = `${cleanUrl}::${cleanKey}`;
  if (cachedClient && cachedClientKey === cacheKey) {
    return cachedClient;
  }
  cachedClient = createClient(cleanUrl, cleanKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  cachedClientKey = cacheKey;
  return cachedClient;
}

// ---------- Pure Row Mappers (camelCase <-> snake_case) ----------

export function mapSchoolProfileToRow(profile: SchoolProfile) {
  return {
    id: 'default',
    name: profile.name,
    npsn: profile.npsn,
    phase: profile.phase,
    level: profile.level,
    address: profile.address,
    village: profile.village,
    district: profile.district,
    city: profile.city,
    province: profile.province,
    phone: profile.phone,
    email: profile.email,
    website: profile.website,
    logo_url: profile.logoUrl,
    headmaster_name: profile.headmasterName,
    headmaster_nip: profile.headmasterNip,
    active_academic_year: profile.activeAcademicYear,
    active_semester: profile.activeSemester,
    titi_mangsa_sem1: profile.titiMangsaSemester1,
    titi_mangsa_sem2: profile.titiMangsaSemester2,
    updated_at: new Date().toISOString()
  };
}

export function mapRowToSchoolProfile(row: any): SchoolProfile {
  return {
    name: row.name || INITIAL_SCHOOL_PROFILE.name,
    npsn: row.npsn || INITIAL_SCHOOL_PROFILE.npsn,
    phase: row.phase || INITIAL_SCHOOL_PROFILE.phase,
    level: row.level || INITIAL_SCHOOL_PROFILE.level,
    address: row.address || INITIAL_SCHOOL_PROFILE.address,
    village: row.village || INITIAL_SCHOOL_PROFILE.village,
    district: row.district || INITIAL_SCHOOL_PROFILE.district,
    city: row.city || INITIAL_SCHOOL_PROFILE.city,
    province: row.province || INITIAL_SCHOOL_PROFILE.province,
    phone: row.phone || INITIAL_SCHOOL_PROFILE.phone,
    email: row.email || INITIAL_SCHOOL_PROFILE.email,
    website: row.website || INITIAL_SCHOOL_PROFILE.website,
    logoUrl:
      !row.logo_url || String(row.logo_url).includes('facebook.com')
        ? INITIAL_SCHOOL_PROFILE.logoUrl
        : row.logo_url,
    headmasterName: row.headmaster_name || INITIAL_SCHOOL_PROFILE.headmasterName,
    headmasterNip: row.headmaster_nip || INITIAL_SCHOOL_PROFILE.headmasterNip,
    activeAcademicYear: row.active_academic_year || INITIAL_SCHOOL_PROFILE.activeAcademicYear,
    activeSemester: row.active_semester === '2' ? '2' : '1',
    titiMangsaSemester1: row.titi_mangsa_sem1 || INITIAL_SCHOOL_PROFILE.titiMangsaSemester1,
    titiMangsaSemester2: row.titi_mangsa_sem2 || INITIAL_SCHOOL_PROFILE.titiMangsaSemester2
  };
}

export function mapTeacherToRow(teacher: Teacher) {
  return {
    id: teacher.id,
    code: teacher.code.trim(),
    name: teacher.name,
    gender: teacher.gender,
    role: teacher.role,
    assigned_class: teacher.assignedClass || '',
    teaching_class: teacher.teachingClass || '',
    phone: teacher.phone || '',
    email: teacher.email || ''
  };
}

export function mapRowToTeacher(row: any): Teacher {
  const role = row.role === 'Guru Bidang Studi' ? 'Guru Bidang' : row.role || 'Guru Kelas';
  return {
    id: row.id,
    code: String(row.code || '').trim(),
    name: row.name || '',
    gender: row.gender === 'P' ? 'P' : 'L',
    role,
    assignedClass: row.assigned_class || '',
    teachingClass: row.teaching_class ?? (row.assigned_class || ''),
    phone: row.phone || '',
    email: row.email || ''
  };
}

export function mapClassToRow(cls: ClassItem) {
  return {
    id: cls.id,
    name: cls.name,
    level: cls.level,
    phase: cls.phase,
    homeroom_teacher_id: cls.homeroomTeacherId || null
  };
}

export function mapRowToClass(row: any): ClassItem {
  return {
    id: row.id,
    name: row.name,
    level: Number(row.level) || 1,
    phase: row.phase || 'Fase A',
    homeroomTeacherId: row.homeroom_teacher_id || undefined
  };
}

export function mapStudentToRow(student: Student) {
  return {
    id: student.id,
    nis: student.nis.trim(),
    nisn: student.nisn || '',
    name: student.name,
    gender: student.gender,
    status: student.status || 'Reguler',
    class_name: student.className,
    parent_name: student.parentName,
    notes: student.notes || ''
  };
}

export function mapRowToStudent(row: any): Student {
  return {
    id: row.id,
    nis: String(row.nis || '').trim(),
    nisn: row.nisn || '',
    name: row.name || '',
    gender: row.gender === 'P' ? 'P' : 'L',
    status: row.status === 'Inklusi' ? 'Inklusi' : 'Reguler',
    className: row.class_name || '',
    parentName: row.parent_name || '',
    notes: row.notes || ''
  };
}

export function mapSubCharacterToRow(sub: SubCharacter) {
  return {
    id: sub.id,
    category_id: sub.categoryId,
    name: sub.name,
    order: sub.order
  };
}

export function mapRowToSubCharacter(row: any): SubCharacter {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    order: Number(row.order) || 1
  };
}

export function mapIndicatorToRow(ind: CharacterIndicator) {
  return {
    id: ind.id,
    sub_character_id: ind.subCharacterId,
    category_id: ind.categoryId,
    level: ind.level || 1,
    name: ind.name,
    default_description_prefix: ind.defaultDescriptionPrefix || ind.descriptionPrefixA || '',
    description_prefix_a: ind.descriptionPrefixA ?? ind.defaultDescriptionPrefix ?? '',
    description_prefix_b: ind.descriptionPrefixB ?? ind.defaultDescriptionPrefix ?? '',
    description_prefix_c: ind.descriptionPrefixC ?? ind.defaultDescriptionPrefix ?? '',
    order: ind.order
  };
}

export function mapRowToIndicator(row: any): CharacterIndicator {
  const defaultPrefix = row.default_description_prefix || row.description_prefix_a || '';
  return {
    id: row.id,
    subCharacterId: row.sub_character_id,
    categoryId: row.category_id,
    level: Number(row.level) || 1,
    name: row.name,
    defaultDescriptionPrefix: defaultPrefix,
    descriptionPrefixA: row.description_prefix_a ?? defaultPrefix,
    descriptionPrefixB: row.description_prefix_b ?? defaultPrefix,
    descriptionPrefixC: row.description_prefix_c ?? defaultPrefix,
    order: Number(row.order) || 1
  };
}

export function mapGradeOptionToRow(opt: GradeOption) {
  return {
    code: opt.code,
    label: opt.label,
    description: opt.description
  };
}

export function mapRowToGradeOption(row: any): GradeOption {
  return {
    code: row.code,
    label: row.label,
    description: row.description
  };
}

export function mapAssessmentToRow(record: AssessmentRecord) {
  return {
    id: record.id,
    student_id: record.studentId || '',
    student_nis: record.studentNis,
    academic_year: record.academicYear,
    semester: record.semester,
    class_name: record.className,
    status: record.status,
    items: record.items || {},
    general_notes: record.generalNotes || '',
    updated_at: record.updatedAt || new Date().toISOString(),
    updated_by: record.updatedBy || ''
  };
}

export function mapRowToAssessment(row: any): AssessmentRecord {
  return {
    id: row.id,
    studentId: row.student_id || '',
    studentNis: row.student_nis,
    academicYear: row.academic_year,
    semester: row.semester === '2' ? '2' : '1',
    className: row.class_name,
    status: row.status === 'final' ? 'final' : 'draft',
    items: row.items || {},
    generalNotes: row.general_notes || '',
    updatedAt: row.updated_at || new Date().toISOString(),
    updatedBy: row.updated_by || ''
  };
}

export function mapUserToRow(user: UserAccount) {
  return {
    id: user.id,
    username: user.username.trim(),
    password: user.password || '',
    name: user.name,
    role: user.role,
    teacher_id: user.teacherId || null
  };
}

export function mapRowToUser(row: any): UserAccount {
  return {
    id: row.id,
    username: row.username,
    password: row.password || undefined,
    name: row.name,
    role: row.role === 'admin' ? 'admin' : 'teacher',
    teacherId: row.teacher_id || undefined
  };
}

export function mapActivityLogToRow(log: ActivityLog) {
  return {
    id: log.id,
    type: log.type,
    title: log.title,
    description: log.description,
    timestamp: log.timestamp,
    user_name: log.userName
  };
}

export function mapRowToActivityLog(row: any): ActivityLog {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    timestamp: row.timestamp,
    userName: row.user_name || ''
  };
}

// ---------- Connection & Live CRUD Helpers ----------

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ ok: boolean; hasTables: boolean; message: string }> {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    if (!cleanUrl || !cleanKey) {
      return { ok: false, hasTables: false, message: 'Project URL dan Anon Key wajib diisi.' };
    }
    const client = createSupabaseClientInstance(cleanUrl, cleanKey);
    const { error } = await client.from('school_profile').select('id').limit(1);

    if (error) {
      const msg = error.message || '';
      const code = (error as any).code || '';
      if (
        code === 'PGRST205' ||
        code === '42P01' ||
        msg.includes('does not exist') ||
        msg.includes('Could not find the table')
      ) {
        return {
          ok: false,
          hasTables: false,
          message:
            'Kredensial valid, tetapi tabel database belum dibuat di Supabase. Silakan jalankan Skema DDL di SQL Editor Supabase terlebih dahulu.'
        };
      }
      return {
        ok: false,
        hasTables: false,
        message: `Gagal terhubung ke Supabase: ${msg}`
      };
    }

    return {
      ok: true,
      hasTables: true,
      message: 'Koneksi ke database PostgreSQL Supabase berhasil & seluruh tabel siap digunakan.'
    };
  } catch (err: any) {
    return {
      ok: false,
      hasTables: false,
      message: `Kesalahan jaringan/konfigurasi: ${err?.message || String(err)}`
    };
  }
}

export async function fetchAllFromSupabase(client: SupabaseClient): Promise<{
  isEmptyDatabase: boolean;
  snapshot: Partial<SupabaseDatabaseSnapshot>;
}> {
  const [
    profileRes,
    teachersRes,
    classesRes,
    studentsRes,
    subsRes,
    indsRes,
    gradesRes,
    assessmentsRes,
    usersRes,
    logsRes
  ] = await Promise.all([
    client.from('school_profile').select('*').limit(1),
    client.from('teachers').select('*').order('code', { ascending: true }),
    client.from('classes').select('*').order('level', { ascending: true }).order('name', { ascending: true }),
    client.from('students').select('*').order('name', { ascending: true }),
    client.from('sub_characters').select('*').order('order', { ascending: true }),
    client.from('character_indicators').select('*').order('level', { ascending: true }).order('order', { ascending: true }),
    client.from('grade_options').select('*').order('code', { ascending: true }),
    client.from('assessments').select('*'),
    client.from('app_users').select('*'),
    client.from('activity_logs').select('*').order('timestamp', { ascending: false }).limit(60)
  ]);

  const errors = [
    profileRes.error,
    teachersRes.error,
    classesRes.error,
    studentsRes.error,
    subsRes.error,
    indsRes.error,
    gradesRes.error,
    assessmentsRes.error,
    usersRes.error,
    logsRes.error
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(`Gagal memuat data dari Supabase: ${errors[0]!.message}`);
  }

  const hasProfile = (profileRes.data?.length || 0) > 0;
  const hasSubs = (subsRes.data?.length || 0) > 0;
  const hasUsers = (usersRes.data?.length || 0) > 0;
  const isEmptyDatabase = !hasProfile && !hasSubs && !hasUsers;

  return {
    isEmptyDatabase,
    snapshot: {
      schoolProfile: hasProfile ? mapRowToSchoolProfile(profileRes.data![0]) : undefined,
      teachers: (teachersRes.data || []).map(mapRowToTeacher),
      classes: (classesRes.data || []).map(mapRowToClass),
      students: (studentsRes.data || []).map(mapRowToStudent),
      subCharacters: (subsRes.data || []).map(mapRowToSubCharacter),
      indicators: (indsRes.data || []).map(mapRowToIndicator),
      gradeOptions: (gradesRes.data || []).map(mapRowToGradeOption),
      assessments: (assessmentsRes.data || []).map(mapRowToAssessment),
      users: (usersRes.data || []).map(mapRowToUser),
      activityLogs: (logsRes.data || []).map(mapRowToActivityLog)
    }
  };
}

export async function seedAllToSupabase(
  client: SupabaseClient,
  snapshot: SupabaseDatabaseSnapshot
): Promise<void> {
  // 1. Independent / parent tables first
  const r1 = await client.from('school_profile').upsert(mapSchoolProfileToRow(snapshot.schoolProfile), { onConflict: 'id' });
  if (r1.error) throw new Error(`school_profile: ${r1.error.message}`);

  if (snapshot.gradeOptions.length > 0) {
    const r = await client.from('grade_options').upsert(snapshot.gradeOptions.map(mapGradeOptionToRow), { onConflict: 'code' });
    if (r.error) throw new Error(`grade_options: ${r.error.message}`);
  }

  if (snapshot.subCharacters.length > 0) {
    const r = await client.from('sub_characters').upsert(snapshot.subCharacters.map(mapSubCharacterToRow), { onConflict: 'id' });
    if (r.error) throw new Error(`sub_characters: ${r.error.message}`);
  }

  if (snapshot.indicators.length > 0) {
    const r = await client.from('character_indicators').upsert(snapshot.indicators.map(mapIndicatorToRow), { onConflict: 'id' });
    if (r.error) throw new Error(`character_indicators: ${r.error.message}`);
  }

  if (snapshot.teachers.length > 0) {
    const r = await client.from('teachers').upsert(snapshot.teachers.map(mapTeacherToRow), { onConflict: 'id' });
    if (r.error) throw new Error(`teachers: ${r.error.message}`);
  }

  if (snapshot.classes.length > 0) {
    const r = await client.from('classes').upsert(snapshot.classes.map(mapClassToRow), { onConflict: 'id' });
    if (r.error) throw new Error(`classes: ${r.error.message}`);
  }

  if (snapshot.students.length > 0) {
    const r = await client.from('students').upsert(snapshot.students.map(mapStudentToRow), { onConflict: 'id' });
    if (r.error) throw new Error(`students: ${r.error.message}`);
  }

  if (snapshot.assessments.length > 0) {
    const r = await client.from('assessments').upsert(snapshot.assessments.map(mapAssessmentToRow), { onConflict: 'id' });
    if (r.error) throw new Error(`assessments: ${r.error.message}`);
  }

  if (snapshot.users.length > 0) {
    const r = await client.from('app_users').upsert(snapshot.users.map(mapUserToRow), { onConflict: 'id' });
    if (r.error) throw new Error(`app_users: ${r.error.message}`);
  }

  if (snapshot.activityLogs.length > 0) {
    const r = await client.from('activity_logs').upsert(snapshot.activityLogs.slice(0, 60).map(mapActivityLogToRow), { onConflict: 'id' });
    if (r.error) throw new Error(`activity_logs: ${r.error.message}`);
  }
}

export async function upsertSchoolProfileDb(client: SupabaseClient, profile: SchoolProfile): Promise<void> {
  const { error } = await client.from('school_profile').upsert(mapSchoolProfileToRow(profile), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function upsertClassDb(client: SupabaseClient, cls: ClassItem): Promise<void> {
  const { error } = await client.from('classes').upsert(mapClassToRow(cls), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function upsertClassesDb(client: SupabaseClient, classes: ClassItem[]): Promise<void> {
  if (classes.length === 0) return;
  const { error } = await client.from('classes').upsert(classes.map(mapClassToRow), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteClassDb(client: SupabaseClient, classId: string): Promise<void> {
  const { error } = await client.from('classes').delete().eq('id', classId);
  if (error) throw new Error(error.message);
}

export async function upsertTeacherDb(client: SupabaseClient, teacher: Teacher): Promise<void> {
  const { error } = await client.from('teachers').upsert(mapTeacherToRow(teacher), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteTeacherDb(client: SupabaseClient, teacherId: string): Promise<void> {
  const { error } = await client.from('teachers').delete().eq('id', teacherId);
  if (error) throw new Error(error.message);
}

export async function upsertStudentDb(client: SupabaseClient, student: Student): Promise<void> {
  const { error } = await client.from('students').upsert(mapStudentToRow(student), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function bulkUpdateStudentsClassDb(
  client: SupabaseClient,
  studentIds: string[],
  targetClassName: string
): Promise<void> {
  if (studentIds.length === 0) return;
  const { error } = await client
    .from('students')
    .update({ class_name: targetClassName })
    .in('id', studentIds);
  if (error) throw new Error(error.message);
}

export async function deleteStudentDb(client: SupabaseClient, studentId: string): Promise<void> {
  const { error } = await client.from('students').delete().eq('id', studentId);
  if (error) throw new Error(error.message);
}

export async function upsertSubCharacterDb(client: SupabaseClient, sub: SubCharacter): Promise<void> {
  const { error } = await client.from('sub_characters').upsert(mapSubCharacterToRow(sub), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteSubCharacterDb(client: SupabaseClient, subId: string): Promise<void> {
  const { error } = await client.from('sub_characters').delete().eq('id', subId);
  if (error) throw new Error(error.message);
}

export async function upsertIndicatorDb(client: SupabaseClient, ind: CharacterIndicator): Promise<void> {
  const { error } = await client.from('character_indicators').upsert(mapIndicatorToRow(ind), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function deleteIndicatorDb(client: SupabaseClient, indicatorId: string): Promise<void> {
  const { error } = await client.from('character_indicators').delete().eq('id', indicatorId);
  if (error) throw new Error(error.message);
}

export async function upsertGradeOptionsDb(client: SupabaseClient, options: GradeOption[]): Promise<void> {
  if (options.length === 0) return;
  const { error } = await client.from('grade_options').upsert(options.map(mapGradeOptionToRow), { onConflict: 'code' });
  if (error) throw new Error(error.message);
}

export async function upsertAssessmentDb(client: SupabaseClient, record: AssessmentRecord): Promise<void> {
  const { error } = await client
    .from('assessments')
    .upsert(mapAssessmentToRow(record), { onConflict: 'student_nis,academic_year,semester' });
  if (error) throw new Error(error.message);
}

export async function syncUsersDb(client: SupabaseClient, users: UserAccount[]): Promise<void> {
  const { data: existing } = await client.from('app_users').select('id');
  const keepIds = new Set(users.map(u => u.id));
  const deleteIds = (existing || []).map((r: any) => r.id).filter((id: string) => !keepIds.has(id));
  if (deleteIds.length > 0) {
    const delRes = await client.from('app_users').delete().in('id', deleteIds);
    if (delRes.error) throw new Error(delRes.error.message);
  }
  if (users.length > 0) {
    const upRes = await client.from('app_users').upsert(users.map(mapUserToRow), { onConflict: 'id' });
    if (upRes.error) throw new Error(upRes.error.message);
  }
}

export async function insertActivityLogDb(client: SupabaseClient, log: ActivityLog): Promise<void> {
  const { error } = await client.from('activity_logs').upsert(mapActivityLogToRow(log), { onConflict: 'id' });
  if (error) throw new Error(error.message);
}

export async function clearDummyDataInSupabase(client: SupabaseClient): Promise<void> {
  const r1 = await client.from('assessments').delete().neq('id', '');
  if (r1.error) throw new Error(r1.error.message);
  const r2 = await client.from('students').delete().neq('id', '');
  if (r2.error) throw new Error(r2.error.message);
  const r3 = await client.from('classes').update({ homeroom_teacher_id: null }).neq('id', '');
  if (r3.error) throw new Error(r3.error.message);
  const r4 = await client.from('teachers').delete().neq('id', '');
  if (r4.error) throw new Error(r4.error.message);
}
