import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapSchoolProfileToRow,
  mapRowToSchoolProfile,
  mapTeacherToRow,
  mapRowToTeacher,
  mapStudentToRow,
  mapRowToStudent,
  mapIndicatorToRow,
  mapRowToIndicator,
  mapAssessmentToRow,
  mapRowToAssessment,
  resolveSupabaseCredentials
} from './supabaseService';
import { INITIAL_SCHOOL_PROFILE } from '../data/initialData';

describe('supabaseService - Row Mappers & Credential Resolution', () => {
  it('Memetakan SchoolProfile bolak-balik camelCase <-> snake_case secara akurat', () => {
    const row = mapSchoolProfileToRow(INITIAL_SCHOOL_PROFILE);
    assert.equal(row.id, 'default');
    assert.equal(row.active_academic_year, INITIAL_SCHOOL_PROFILE.activeAcademicYear);
    assert.equal(row.active_semester, INITIAL_SCHOOL_PROFILE.activeSemester);

    const parsed = mapRowToSchoolProfile(row);
    assert.equal(parsed.name, INITIAL_SCHOOL_PROFILE.name);
    assert.equal(parsed.headmasterName, INITIAL_SCHOOL_PROFILE.headmasterName);
    assert.deepEqual(parsed.titiMangsaSemester1, INITIAL_SCHOOL_PROFILE.titiMangsaSemester1);
  });

  it('Memetakan Teacher dengan Kode Guru (tanpa NIP) dan Guru Bidang', () => {
    const row = mapTeacherToRow({
      id: 't-10',
      code: 'KG010',
      name: 'Ustadz Hasan',
      gender: 'L',
      role: 'Guru Bidang',
      assignedClass: '',
      teachingClass: 'Semua Kelas',
      phone: '081234',
      email: 'hasan@aljannah.sch.id'
    });
    assert.equal(row.code, 'KG010');
    assert.equal(row.teaching_class, 'Semua Kelas');

    const back = mapRowToTeacher(row);
    assert.equal(back.code, 'KG010');
    assert.equal(back.role, 'Guru Bidang');
    assert.equal(back.teachingClass, 'Semua Kelas');
  });

  it('Memetakan Student termasuk NISN dan NIS', () => {
    const row = mapStudentToRow({
      id: 's-1',
      nis: '26270101',
      nisn: '0151234567',
      name: 'Rayyan',
      gender: 'L',
      status: 'Reguler',
      className: '1A',
      parentName: 'Budi'
    });
    assert.equal(row.nisn, '0151234567');
    const back = mapRowToStudent(row);
    assert.equal(back.nisn, '0151234567');
    assert.equal(back.className, '1A');
  });

  it('Memetakan CharacterIndicator termasuk level & Awal Deskripsi A/B/C', () => {
    const row = mapIndicatorToRow({
      id: 'ind-1',
      subCharacterId: 'sub-1',
      categoryId: 'ISLAM',
      level: 2,
      name: 'Menjaga shalat',
      defaultDescriptionPrefix: 'Default A',
      descriptionPrefixA: 'Prefix A',
      descriptionPrefixB: 'Prefix B',
      descriptionPrefixC: 'Prefix C',
      order: 1
    });
    assert.equal(row.level, 2);
    assert.equal(row.description_prefix_a, 'Prefix A');
    assert.equal(row.description_prefix_b, 'Prefix B');
    assert.equal(row.description_prefix_c, 'Prefix C');

    const back = mapRowToIndicator(row);
    assert.equal(back.level, 2);
    assert.equal(back.descriptionPrefixA, 'Prefix A');
    assert.equal(back.descriptionPrefixB, 'Prefix B');
    assert.equal(back.descriptionPrefixC, 'Prefix C');
  });

  it('Memetakan AssessmentRecord beserta JSONB items', () => {
    const row = mapAssessmentToRow({
      id: 'as-26270101-2026-2027-sem1',
      studentId: 's-1',
      studentNis: '26270101',
      academicYear: '2026/2027',
      semester: '1',
      className: '1A',
      status: 'final',
      items: {
        'ind-1': { indicatorId: 'ind-1', grade: 'A', notes: 'Bagus', updatedAt: '2026-11-14T00:00:00.000Z' }
      },
      updatedAt: '2026-11-14T00:00:00.000Z',
      updatedBy: 'Ahmad'
    });
    const back = mapRowToAssessment(row);
    assert.equal(back.items['ind-1'].grade, 'A');
    assert.equal(back.status, 'final');
  });

  it('Menentukan sumber kredensial Supabase dengan fallback aman', () => {
    const none = resolveSupabaseCredentials(null);
    assert.equal(none.source, 'none');

    const cfg = resolveSupabaseCredentials({ url: 'https://demo.supabase.co', anonKey: 'anon-key' });
    assert.equal(cfg.source, 'config');
    assert.equal(cfg.url, 'https://demo.supabase.co');
  });
});
