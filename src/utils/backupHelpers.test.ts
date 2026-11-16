import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAvailableAcademicYears,
  getAcademicYearStats,
  createBackupPayload,
  buildBackupFilename,
  parseAndValidateBackupJson,
  mergeAssessmentsByKey,
  mergeRecordsById,
  DatabaseSnapshotData
} from './backupHelpers';
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_CLASSES,
  INITIAL_TEACHERS,
  INITIAL_STUDENTS,
  INITIAL_SUB_CHARACTERS,
  INITIAL_INDICATORS,
  INITIAL_GRADE_OPTIONS,
  INITIAL_USERS,
  INITIAL_ACTIVITY_LOGS
} from '../data/initialData';
import { AssessmentRecord } from '../types';

const sampleAssessments: AssessmentRecord[] = [
  {
    id: 'as-1',
    studentId: 's-1',
    studentNis: '26270101',
    academicYear: '2026/2027',
    semester: '1',
    className: '1A',
    status: 'final',
    items: {},
    updatedAt: '2026-11-10T00:00:00.000Z',
    updatedBy: 'Guru 1A'
  },
  {
    id: 'as-2',
    studentId: 's-2',
    studentNis: '26270102',
    academicYear: '2026/2027',
    semester: '2',
    className: '1A',
    status: 'draft',
    items: {},
    updatedAt: '2026-11-11T00:00:00.000Z',
    updatedBy: 'Guru 1A'
  },
  {
    id: 'as-3',
    studentId: 's-1',
    studentNis: '26270101',
    academicYear: '2025/2026',
    semester: '2',
    className: '1A',
    status: 'final',
    items: {},
    updatedAt: '2026-06-15T00:00:00.000Z',
    updatedBy: 'Guru 1A'
  }
];

const baseSnapshot: DatabaseSnapshotData = {
  schoolProfile: INITIAL_SCHOOL_PROFILE,
  classes: INITIAL_CLASSES,
  teachers: INITIAL_TEACHERS,
  students: INITIAL_STUDENTS,
  subCharacters: INITIAL_SUB_CHARACTERS,
  indicators: INITIAL_INDICATORS,
  gradeOptions: INITIAL_GRADE_OPTIONS,
  assessments: sampleAssessments,
  users: INITIAL_USERS,
  activityLogs: INITIAL_ACTIVITY_LOGS
};

describe('backupHelpers - Backup & Restore Per Tahun Ajaran', () => {
  it('Mengumpulkan daftar Tahun Ajaran unik secara terurut terbaru', () => {
    const years = getAvailableAcademicYears(sampleAssessments, '2027/2028');
    assert.deepEqual(years, ['2027/2028', '2026/2027', '2025/2026']);
  });

  it('Menghitung statistik penilaian per Tahun Ajaran dengan akurat', () => {
    const stats = getAcademicYearStats(sampleAssessments, '2026/2027');
    assert.equal(stats.totalAssessments, 2);
    assert.equal(stats.finalCount, 1);
    assert.equal(stats.draftCount, 1);
    assert.equal(stats.semester1Count, 1);
    assert.equal(stats.semester2Count, 1);
  });

  it('Membuat payload backup per Tahun Ajaran dan memfilter penilaian sesuai tahun & semester', () => {
    const payload = createBackupPayload(baseSnapshot, {
      academicYear: '2026/2027',
      semester: '1',
      exportedAt: '2026-11-15T10:00:00.000Z'
    });

    assert.equal(payload.backupScope, 'academic_year');
    assert.equal(payload.academicYear, '2026/2027');
    assert.equal(payload.semester, '1');
    assert.equal(payload.assessments.length, 1);
    assert.equal(payload.assessments[0].id, 'as-1');
    assert.equal(payload.students.length, INITIAL_STUDENTS.length);

    const filename = buildBackupFilename('2026/2027', 'ALL', new Date('2026-11-15T00:00:00.000Z'));
    assert.equal(filename, 'Backup_ERapor_AlJannah_TA_2026-2027_2026-11-15.json');
  });

  it('Memvalidasi dan membuat pratinjau JSON backup (termasuk menolak format salah)', () => {
    const payload = createBackupPayload(baseSnapshot, {
      academicYear: '2025/2026',
      semester: 'ALL'
    });
    const preview = parseAndValidateBackupJson(JSON.stringify(payload));
    assert.equal(preview.isValid, true);
    assert.equal(preview.counts.assessments, 1);
    assert.equal(preview.scopeLabel, 'Tahun Ajaran 2025/2026 (Semester 1 & 2)');

    assert.throws(() => parseAndValidateBackupJson('{invalid'), /JSON yang valid/);
    assert.throws(() => parseAndValidateBackupJson('{"foo": 1}'), /Struktur berkas cadangan/);
  });

  it('Menggabungkan penilaian per Tahun Ajaran tanpa menimpa Tahun Ajaran lain saat mode merge', () => {
    const existing = [sampleAssessments[0], sampleAssessments[1]]; // TA 2026/2027
    const incomingFromArchive = [sampleAssessments[2]]; // TA 2025/2026
    const merged = mergeAssessmentsByKey(existing, incomingFromArchive);

    assert.equal(merged.length, 3);
    assert.ok(merged.some(a => a.academicYear === '2026/2027' && a.semester === '1'));
    assert.ok(merged.some(a => a.academicYear === '2025/2026' && a.semester === '2'));

    const mergedStudents = mergeRecordsById(
      [{ id: 's-1', name: 'Lama' }],
      [{ id: 's-1', name: 'Baru' }, { id: 's-2', name: 'Kedua' }]
    );
    assert.equal(mergedStudents.length, 2);
    assert.equal(mergedStudents.find(s => s.id === 's-1')?.name, 'Baru');
  });
});
