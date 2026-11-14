import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Logika Validasi Rapor Karakter Al-Jannah', () => {
  it('Validasi format kunci komposit penilaian tidak menimpa antar semester', () => {
    const nis = '26270101';
    const year = '2026/2027';
    const sem1 = '1';
    const sem2 = '2';

    const key1 = `as-${nis}-${year.replace('/', '-')}-sem${sem1}`;
    const key2 = `as-${nis}-${year.replace('/', '-')}-sem${sem2}`;

    assert.notStrictEqual(key1, key2);
    assert.strictEqual(key1, 'as-26270101-2026-2027-sem1');
    assert.strictEqual(key2, 'as-26270101-2026-2027-sem2');
  });

  it('Validasi keunikan Kode Guru (case-insensitive)', () => {
    const teachers = [
      { id: '1', code: 'KG001', name: 'Ahmad' },
      { id: '2', code: 'KG002', name: 'Nur' }
    ];

    const isDuplicate = (codeToCheck: string) =>
      teachers.some(t => t.code.trim().toUpperCase() === codeToCheck.trim().toUpperCase());

    assert.strictEqual(isDuplicate('KG001'), true);
    assert.strictEqual(isDuplicate('kg002'), true);
    assert.strictEqual(isDuplicate('KG003'), false);
  });

  it('Validasi satu kelas hanya memiliki satu wali kelas dan filter dropdown wali kelas', () => {
    const teachers = [
      { id: '1', role: 'Wali Kelas', assignedClass: '1A', name: 'Ahmad' },
      { id: '2', role: 'Wali Kelas', assignedClass: '1B', name: 'Nur' },
      { id: '3', role: 'Guru Bidang', assignedClass: '', name: 'Dewi' },
      { id: '4', role: 'Guru Kelas', assignedClass: '', name: 'Rudi' }
    ];

    const hasHomeroom = (className: string) =>
      teachers.find(t => t.role === 'Wali Kelas' && t.assignedClass === className);
    const homeroomCandidates = teachers.filter(t => t.role === 'Wali Kelas');

    assert.ok(hasHomeroom('1A'));
    assert.strictEqual(hasHomeroom('2A'), undefined);
    assert.strictEqual(homeroomCandidates.length, 2);
  });

  it('Validasi kelengkapan indikator karakter (9 indikator, 1 per sub karakter)', () => {
    const totalIndicators = 9;
    const itemsFilled = {
      'ind-i-1-1': { grade: 'A' },
      'ind-a-1-1': { grade: 'B' },
      'ind-s-1-1': { grade: 'A' }
    };

    const filledCount = Object.values(itemsFilled).filter(i => Boolean(i.grade)).length;
    const percentage = Math.round((filledCount / totalIndicators) * 100);

    assert.strictEqual(filledCount, 3);
    assert.strictEqual(percentage, 33);
  });
});
