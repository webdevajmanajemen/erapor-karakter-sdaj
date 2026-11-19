import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildReportCategoryRows, resolveReportIndicatorGradeAndNotes } from './reportHelpers';
import { AssessmentRecord, CharacterIndicator, SubCharacter } from '../types';

const sampleSubs: SubCharacter[] = [
  { id: 'sub-i-1', categoryId: 'ISLAM', name: 'Teguh Berakidah', order: 1 },
  { id: 'sub-i-2', categoryId: 'ISLAM', name: 'Taat Beribadah', order: 2 },
  { id: 'sub-i-3', categoryId: 'ISLAM', name: 'Berakhlak Mulia', order: 3 }
];

const sampleIndicators: CharacterIndicator[] = [
  {
    id: 'ind-i-1-1',
    subCharacterId: 'sub-i-1',
    categoryId: 'ISLAM',
    level: 1,
    name: 'Meyakini Allah SWT sebagai Tuhan Yang Maha Esa.',
    defaultDescriptionPrefix: 'Ananda beriman teguh.',
    descriptionPrefixA: 'Ananda beriman sangat teguh.',
    descriptionPrefixB: 'Ananda beriman baik.',
    descriptionPrefixC: 'Ananda perlu bimbingan.',
    order: 1
  },
  {
    id: 'ind-i-2-1',
    subCharacterId: 'sub-i-2',
    categoryId: 'ISLAM',
    level: 1,
    name: 'Melaksanakan ibadah wajib tepat waktu.',
    defaultDescriptionPrefix: '',
    descriptionPrefixA: '',
    descriptionPrefixB: '',
    descriptionPrefixC: '',
    order: 2
  }
];

describe('reportHelpers - Penanganan Indikator & Pilihan A/B/C Kosong di Cetak Rapor', () => {
  it('Mengisi "-" di Indikator Karakter dan Deskripsi Nilai jika level belum memiliki indikator di Data Karakter', () => {
    const rowsLevel3 = buildReportCategoryRows('ISLAM', 3, sampleSubs, sampleIndicators, undefined);
    assert.equal(rowsLevel3.length, 3);
    rowsLevel3.forEach(row => {
      assert.equal(row.indicatorName, '-');
      assert.equal(row.grade, '-');
      assert.equal(row.notes, '-');
      assert.equal(row.subName, '');
      assert.equal(row.isUnconfigured, true);
    });
  });

  it('Mengisi "-" di Deskripsi Nilai jika nilai A/B/C belum dipilih pada Penilaian Karakter', () => {
    const res = resolveReportIndicatorGradeAndNotes(sampleIndicators[0], undefined);
    assert.equal(res.grade, '-');
    assert.equal(res.notes, '-');
  });

  it('Mengisi "-" di Deskripsi Nilai jika nilai dipilih namun Awal Deskripsi A/B/C kosong dan tidak ada catatan', () => {
    const assessment: AssessmentRecord = {
      id: 'as-1',
      studentId: 's-1',
      studentNis: '26270101',
      academicYear: '2026/2027',
      semester: '1',
      className: '1A',
      status: 'draft',
      items: {
        'ind-i-2-1': {
          indicatorId: 'ind-i-2-1',
          grade: 'A',
          notes: '',
          updatedAt: '2026-11-19T00:00:00.000Z'
        }
      },
      updatedAt: '2026-11-19T00:00:00.000Z',
      updatedBy: 'Guru'
    };

    const res = resolveReportIndicatorGradeAndNotes(sampleIndicators[1], assessment);
    assert.equal(res.grade, 'A');
    assert.equal(res.notes, '-');
  });

  it('Menampilkan catatan penilaian dan/atau Awal Deskripsi A/B/C ketika nilai dan deskripsi tersedia', () => {
    const assessment: AssessmentRecord = {
      id: 'as-2',
      studentId: 's-1',
      studentNis: '26270101',
      academicYear: '2026/2027',
      semester: '1',
      className: '1A',
      status: 'final',
      items: {
        'ind-i-1-1': {
          indicatorId: 'ind-i-1-1',
          grade: 'B',
          notes: 'Ananda beriman baik saat berdoa bersama.',
          updatedAt: '2026-11-19T00:00:00.000Z'
        }
      },
      updatedAt: '2026-11-19T00:00:00.000Z',
      updatedBy: 'Guru'
    };

    const rowsLevel1 = buildReportCategoryRows('ISLAM', 1, sampleSubs, sampleIndicators, assessment);
    assert.equal(rowsLevel1[0].indicatorName, 'Meyakini Allah SWT sebagai Tuhan Yang Maha Esa.');
    assert.equal(rowsLevel1[0].grade, 'B');
    assert.equal(rowsLevel1[0].notes, 'Ananda beriman baik saat berdoa bersama.');

    // Sub-character 3 (sub-i-3) tidak punya indikator pada Level 1 -> diisi '-'
    assert.equal(rowsLevel1[2].indicatorName, '-');
    assert.equal(rowsLevel1[2].grade, '-');
    assert.equal(rowsLevel1[2].notes, '-');
  });
});
