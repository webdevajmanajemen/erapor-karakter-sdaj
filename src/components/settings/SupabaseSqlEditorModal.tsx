import React, { useState, useMemo } from 'react';
import {
  Database,
  Copy,
  Check,
  Download,
  ExternalLink,
  Code2,
  Sparkles,
  BookOpen,
  Server
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';
import {
  SchoolProfile,
  Teacher,
  ClassItem,
  Student,
  SubCharacter,
  CharacterIndicator,
  GradeOption,
  UserAccount
} from '../../types';

interface SupabaseSqlEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolProfile: SchoolProfile;
  teachers: Teacher[];
  classes: ClassItem[];
  students: Student[];
  subCharacters: SubCharacter[];
  indicators: CharacterIndicator[];
  gradeOptions: GradeOption[];
  users?: UserAccount[];
}

export function SupabaseSqlEditorModal({
  isOpen,
  onClose,
  schoolProfile,
  teachers,
  classes,
  students,
  subCharacters,
  indicators,
  gradeOptions,
  users = []
}: SupabaseSqlEditorModalProps) {
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState<'ddl' | 'seed' | 'guide'>('ddl');
  const [copied, setCopied] = useState(false);

  // Generate DDL Schema Script
  const ddlSqlScript = useMemo(() => {
    return `-- ==============================================================================
-- E-RAPOR KARAKTER SD ISLAM ALAM & SAINS AL-JANNAH
-- SKEMA STRUKTUR DATABASE LENGKAP UNTUK SUPABASE (POSTGRESQL)
-- ==============================================================================

-- 1. EKSTENSI UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL PROFIL SEKOLAH
CREATE TABLE IF NOT EXISTS public.school_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    name TEXT NOT NULL DEFAULT 'SD ISLAM ALAM & SAINS AL-JANNAH',
    npsn TEXT NOT NULL DEFAULT '20228891',
    phase TEXT DEFAULT 'Fase A, B, dan C',
    level TEXT DEFAULT 'Sekolah Dasar (SD)',
    address TEXT DEFAULT 'Jl. Jambore Raya No. 4, Pondok Ranggon, Harjamukti',
    village TEXT DEFAULT 'Harjamukti',
    district TEXT DEFAULT 'Cimanggis',
    city TEXT DEFAULT 'Kota Depok',
    province TEXT DEFAULT 'Jawa Barat',
    phone TEXT DEFAULT '(021) 8731111 / 8730999',
    email TEXT DEFAULT 'info@sekolah-aljannah.sch.id',
    website TEXT DEFAULT 'www.sekolah-aljannah.sch.id',
    logo_url TEXT DEFAULT '/assets/aistudio/logo-AJ-rapor_c08ed6e7.png',
    headmaster_name TEXT DEFAULT 'Hj. Siti Aminah, S.Pd., M.M.',
    headmaster_nip TEXT DEFAULT '19780512 200501 2 004',
    active_academic_year TEXT DEFAULT '2026/2027',
    active_semester TEXT DEFAULT '1',
    titi_mangsa_sem1 JSONB DEFAULT '{"day": "19", "month": "Desember", "year": "2026"}'::jsonb,
    titi_mangsa_sem2 JSONB DEFAULT '{"day": "19", "month": "Juni", "year": "2027"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL GURU & WALI KELAS
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('L', 'P')) NOT NULL,
    role TEXT NOT NULL DEFAULT 'Guru Kelas',
    assigned_class TEXT DEFAULT '',
    teaching_class TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL ROMBONGAN KELAS
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 6),
    phase TEXT NOT NULL DEFAULT 'Fase A',
    homeroom_teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABEL SISWA
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    nis TEXT UNIQUE NOT NULL,
    nisn TEXT DEFAULT '',
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('L', 'P')) NOT NULL,
    status TEXT DEFAULT 'Reguler' CHECK (status IN ('Reguler', 'Inklusi')),
    class_name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nisn TEXT DEFAULT '';

-- 6. TABEL SUB KARAKTER (ISLAM, ALAM, SAINS)
CREATE TABLE IF NOT EXISTS public.sub_characters (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL CHECK (category_id IN ('ISLAM', 'ALAM', 'SAINS')),
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 1 NOT NULL
);

-- 7. TABEL INDIKATOR KARAKTER (PER LEVEL 1-6 + AWAL DESKRIPSI A/B/C)
CREATE TABLE IF NOT EXISTS public.character_indicators (
    id TEXT PRIMARY KEY,
    sub_character_id TEXT NOT NULL REFERENCES public.sub_characters(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL CHECK (category_id IN ('ISLAM', 'ALAM', 'SAINS')),
    level INTEGER NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 6),
    name TEXT NOT NULL,
    default_description_prefix TEXT DEFAULT '',
    description_prefix_a TEXT DEFAULT '',
    description_prefix_b TEXT DEFAULT '',
    description_prefix_c TEXT DEFAULT '',
    "order" INTEGER DEFAULT 1 NOT NULL
);
ALTER TABLE public.character_indicators ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.character_indicators ADD COLUMN IF NOT EXISTS description_prefix_a TEXT DEFAULT '';
ALTER TABLE public.character_indicators ADD COLUMN IF NOT EXISTS description_prefix_b TEXT DEFAULT '';
ALTER TABLE public.character_indicators ADD COLUMN IF NOT EXISTS description_prefix_c TEXT DEFAULT '';

-- 8. TABEL OPSI NILAI & PREDIKAT
CREATE TABLE IF NOT EXISTS public.grade_options (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT NOT NULL
);

-- 9. TABEL PENILAIAN PERKEMBANGAN KARAKTER (ASSESSMENTS)
CREATE TABLE IF NOT EXISTS public.assessments (
    id TEXT PRIMARY KEY,
    student_id TEXT DEFAULT '',
    student_nis TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    semester TEXT NOT NULL,
    class_name TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
    items JSONB DEFAULT '{}'::jsonb NOT NULL,
    general_notes TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by TEXT DEFAULT '',
    CONSTRAINT unique_student_semester_assessment UNIQUE (student_nis, academic_year, semester)
);
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS student_id TEXT DEFAULT '';

-- 10. TABEL AKUN PENGGUNA & ADMINISTRATOR
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT '',
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
    teacher_id TEXT
);

-- 11. TABEL LOG AKTIVITAS SISTEM
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_name TEXT DEFAULT ''
);

-- 12. INDEKS OPTIMASI PENCARIAN & QUERY
CREATE INDEX IF NOT EXISTS idx_teachers_role ON public.teachers(role);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_name);
CREATE INDEX IF NOT EXISTS idx_assessments_lookup ON public.assessments(student_nis, academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_assessments_class ON public.assessments(class_name);
CREATE INDEX IF NOT EXISTS idx_indicators_category_level ON public.character_indicators(category_id, level);

-- 13. KEBIJAKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.school_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 14. BUAT POLICY AKSES CRUD LENGKAP UNTUK APLIKASI (ANON & AUTHENTICATED)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.school_profile;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.school_profile FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.teachers;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.teachers FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.classes;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.classes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.students;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.students FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.sub_characters;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.sub_characters FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.character_indicators;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.character_indicators FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.grade_options;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.grade_options FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.assessments;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.assessments FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.app_users;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.app_users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Allow All For Anon and Authenticated" ON public.activity_logs;
    CREATE POLICY "Allow All For Anon and Authenticated" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
END $$;
`;
  }, []);

  // Generate Seed DML Script
  const seedSqlScript = useMemo(() => {
    const escapeSql = (str: string | undefined | null) => {
      if (!str) return "''";
      return `'${str.replace(/'/g, "''")}'`;
    };

    let sql = `-- ==============================================================================
-- E-RAPOR KARAKTER SD ISLAM ALAM & SAINS AL-JANNAH
-- SKRIP DATA AWAL (SEED DATA INSERT / UPSERT)
-- ==============================================================================

-- 1. DATA AWAL PROFIL SEKOLAH
INSERT INTO public.school_profile (
    id, name, npsn, phase, level, address, village, district, city, province,
    phone, email, website, logo_url, headmaster_name, headmaster_nip,
    active_academic_year, active_semester, titi_mangsa_sem1, titi_mangsa_sem2
) VALUES (
    'default',
    ${escapeSql(schoolProfile.name)},
    ${escapeSql(schoolProfile.npsn)},
    ${escapeSql(schoolProfile.phase)},
    ${escapeSql(schoolProfile.level)},
    ${escapeSql(schoolProfile.address)},
    ${escapeSql(schoolProfile.village)},
    ${escapeSql(schoolProfile.district)},
    ${escapeSql(schoolProfile.city)},
    ${escapeSql(schoolProfile.province)},
    ${escapeSql(schoolProfile.phone)},
    ${escapeSql(schoolProfile.email)},
    ${escapeSql(schoolProfile.website)},
    ${escapeSql(schoolProfile.logoUrl)},
    ${escapeSql(schoolProfile.headmasterName)},
    ${escapeSql(schoolProfile.headmasterNip)},
    ${escapeSql(schoolProfile.activeAcademicYear)},
    ${escapeSql(schoolProfile.activeSemester)},
    ${escapeSql(JSON.stringify(schoolProfile.titiMangsaSemester1))}::jsonb,
    ${escapeSql(JSON.stringify(schoolProfile.titiMangsaSemester2))}::jsonb
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, active_academic_year = EXCLUDED.active_academic_year;

-- 2. DATA OPSI PREDIKAT NILAI
INSERT INTO public.grade_options (code, label, description) VALUES
    ('A', 'Berkembang Sangat Baik', 'Siswa secara konsisten dan mandiri menunjukkan indikator karakter tersebut melampaui harapan usia.'),
    ('B', 'Berkembang Sesuai Harapan', 'Siswa mampu menunjukkan indikator karakter tersebut secara konsisten sesuai capaian tahap perkembangannya.'),
    ('C', 'Perlu Bimbingan', 'Siswa masih memerlukan pendampingan dan stimulus dari guru/orang tua dalam menumbuhkan indikator karakter tersebut.')
ON CONFLICT (code) DO NOTHING;

-- 3. DATA SUB KARAKTER
INSERT INTO public.sub_characters (id, category_id, name, "order") VALUES
`;
    sql += subCharacters
      .map(s => `    (${escapeSql(s.id)}, ${escapeSql(s.categoryId)}, ${escapeSql(s.name)}, ${s.order})`)
      .join(',\n');
    sql += `\nON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "order" = EXCLUDED."order";\n\n`;

    // 4. Indicators (with level and descriptionPrefixA/B/C)
    sql += `-- 4. DATA INDIKATOR KARAKTER (LEVEL & AWAL DESKRIPSI A/B/C)\nINSERT INTO public.character_indicators (id, sub_character_id, category_id, level, name, default_description_prefix, description_prefix_a, description_prefix_b, description_prefix_c, "order") VALUES\n`;
    sql += indicators
      .map(
        i =>
          `    (${escapeSql(i.id)}, ${escapeSql(i.subCharacterId)}, ${escapeSql(i.categoryId)}, ${i.level || 1}, ${escapeSql(i.name)}, ${escapeSql(i.defaultDescriptionPrefix)}, ${escapeSql(i.descriptionPrefixA || i.defaultDescriptionPrefix)}, ${escapeSql(i.descriptionPrefixB || i.defaultDescriptionPrefix)}, ${escapeSql(i.descriptionPrefixC || i.defaultDescriptionPrefix)}, ${i.order})`
      )
      .join(',\n');
    sql += `\nON CONFLICT (id) DO UPDATE SET level = EXCLUDED.level, name = EXCLUDED.name, description_prefix_a = EXCLUDED.description_prefix_a, description_prefix_b = EXCLUDED.description_prefix_b, description_prefix_c = EXCLUDED.description_prefix_c;\n\n`;

    // 5. Teachers
    if (teachers.length > 0) {
      sql += `-- 5. DATA GURU & WALI KELAS\nINSERT INTO public.teachers (id, code, name, gender, role, assigned_class, teaching_class, phone, email) VALUES\n`;
      sql += teachers
        .map(
          t =>
            `    (${escapeSql(t.id)}, ${escapeSql(t.code)}, ${escapeSql(t.name)}, ${escapeSql(t.gender)}, ${escapeSql(t.role)}, ${escapeSql(t.assignedClass)}, ${escapeSql(t.teachingClass)}, ${escapeSql(t.phone)}, ${escapeSql(t.email)})`
        )
        .join(',\n');
      sql += `\nON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, assigned_class = EXCLUDED.assigned_class, teaching_class = EXCLUDED.teaching_class;\n\n`;
    }

    // 6. Classes
    if (classes.length > 0) {
      sql += `-- 6. DATA KELAS\nINSERT INTO public.classes (id, name, level, phase, homeroom_teacher_id) VALUES\n`;
      sql += classes
        .map(
          c =>
            `    (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${c.level}, ${escapeSql(c.phase)}, ${c.homeroomTeacherId ? escapeSql(c.homeroomTeacherId) : 'NULL'})`
        )
        .join(',\n');
      sql += `\nON CONFLICT (name) DO UPDATE SET homeroom_teacher_id = EXCLUDED.homeroom_teacher_id;\n\n`;
    }

    // 7. Students
    if (students.length > 0) {
      sql += `-- 7. DATA SISWA\nINSERT INTO public.students (id, nis, nisn, name, gender, status, class_name, parent_name, notes) VALUES\n`;
      sql += students
        .map(
          s =>
            `    (${escapeSql(s.id)}, ${escapeSql(s.nis)}, ${escapeSql(s.nisn)}, ${escapeSql(s.name)}, ${escapeSql(s.gender)}, ${escapeSql(s.status)}, ${escapeSql(s.className)}, ${escapeSql(s.parentName)}, ${escapeSql(s.notes)})`
        )
        .join(',\n');
      sql += `\nON CONFLICT (nis) DO UPDATE SET nisn = EXCLUDED.nisn, name = EXCLUDED.name, class_name = EXCLUDED.class_name, parent_name = EXCLUDED.parent_name;\n\n`;
    }

    // 8. Users
    if (users.length > 0) {
      sql += `-- 8. DATA AKUN PENGGUNA & ADMINISTRATOR\nINSERT INTO public.app_users (id, username, password, name, role, teacher_id) VALUES\n`;
      sql += users
        .map(
          u =>
            `    (${escapeSql(u.id)}, ${escapeSql(u.username)}, ${escapeSql(u.password)}, ${escapeSql(u.name)}, ${escapeSql(u.role)}, ${u.teacherId ? escapeSql(u.teacherId) : 'NULL'})`
        )
        .join(',\n');
      sql += `\nON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username, password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role;\n\n`;
    }

    return sql;
  }, [schoolProfile, teachers, classes, students, subCharacters, indicators, users]);

  const activeContent = activeTab === 'ddl' ? ddlSqlScript : seedSqlScript;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    success('Skrip SQL Tersalin!', 'Query SQL siap ditempel (paste) di SQL Editor Supabase Anda.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSql = () => {
    const filename = activeTab === 'ddl' ? 'sd_aljannah_supabase_schema.sql' : 'sd_aljannah_seed_data.sql';
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Berkas SQL Terunduh', `File ${filename} berhasil disimpan ke komputer.`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Supabase Query SQL Editor & Integrasi Cloud" maxWidth="5xl">
      <div className="flex flex-col h-[78vh] space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('ddl')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ddl'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              1. Skema DDL (Tabel & RLS)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seed')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'seed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Database className="w-4 h-4" />
              2. Data Awal (Seed INSERT)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              3. Panduan Integrasi Supabase
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'guide' && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin di Clipboard!' : 'Salin Skrip SQL'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSql}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh .SQL</span>
                </button>
              </>
            )}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Supabase Dashboard</span>
            </a>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'guide' ? (
          <div className="flex-1 overflow-y-auto pr-2 space-y-5 text-slate-800 text-sm">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-amber-500/10 border border-emerald-200/70">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Langkah Menghubungkan E-Rapor Karakter ke Database Supabase (CRUD Real-Time)
              </h3>
              <p className="text-xs text-slate-600">
                Aplikasi kini melakukan CRUD langsung ke database PostgreSQL Supabase tanpa menyimpan data ke localStorage browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">Buat Project Baru di Supabase</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    supabase.com/dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                  , buat project baru (misal: <em>erapor-aljannah</em>), pilih region <strong>Singapore</strong>, dan tunggu hingga database aktif.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">Jalankan Skema DDL di SQL Editor</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Buka menu <strong>SQL Editor &rarr; New query</strong> di Supabase. Salin skrip dari tab <strong>1. Skema DDL (Tabel &amp; RLS)</strong>, tempel lalu klik <strong>Run</strong> untuk membuat 10 tabel dan kebijakan RLS.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">Isi Data Awal (Opsional / Otomatis)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Anda dapat menjalankan query pada tab <strong>2. Data Awal (Seed INSERT)</strong> di SQL Editor, atau langsung menghubungkan aplikasi — jika database masih kosong, aplikasi akan otomatis mengirim data awal saat terhubung.
                </p>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">Salin Project URL &amp; Anon Key</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Masuk ke <strong>Project Settings &rarr; API</strong> (atau Data API &amp; API Keys) di Supabase, lalu salin <strong>Project URL</strong> dan <strong>anon public key</strong> ke form Pengaturan aplikasi (atau set <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_URL</code> dan <code className="bg-slate-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> di file <code className="bg-slate-100 px-1 rounded">.env</code>).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-slate-400 text-xs rounded-t-xl font-mono border-b border-slate-800">
              <span className="flex items-center gap-2 text-slate-200 font-semibold">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                {activeTab === 'ddl' ? 'sd_aljannah_supabase_schema.sql (DDL)' : 'sd_aljannah_seed_data.sql (DML)'}
              </span>
              <span>{activeTab === 'ddl' ? '10 Tabel + Indeks + 10 RLS Policies' : 'Data Master, Indikator A/B/C & Akun'}</span>
            </div>

            <div className="flex-1 bg-slate-950 p-4 rounded-b-xl overflow-auto border border-slate-800 font-mono text-xs leading-relaxed text-emerald-300 select-all">
              <pre className="whitespace-pre">{activeContent}</pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
