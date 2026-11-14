import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPrefixForGrade,
  applyGradePrefixToNotes,
  isAdminOnlyTab,
  canAccessTab,
  authenticateAdmin
} from './assessmentHelpers';
import { CharacterIndicator, UserAccount } from '../types';

const sampleIndicator: CharacterIndicator = {
  id: 'ind-1',
  subCharacterId: 'sub-1',
  categoryId: 'ISLAM',
  level: 1,
  name: 'Meyakini Allah SWT',
  defaultDescriptionPrefix: 'Ananda senantiasa menunjukkan keyakinan mantap.',
  descriptionPrefixA: 'Ananda senantiasa menunjukkan keyakinan mantap kepada Allah SWT.',
  descriptionPrefixB: 'Ananda menunjukkan keyakinan kepada Allah SWT sesuai harapan.',
  descriptionPrefixC: 'Ananda masih memerlukan bimbingan dalam meyakini nilai keimanan.',
  order: 1
};

describe('assessmentHelpers - Awal Deskripsi A/B/C & Akses Administrator', () => {
  it('Mengambil Awal Deskripsi sesuai nilai predikat A, B, C', () => {
    assert.equal(
      getPrefixForGrade(sampleIndicator, 'A'),
      'Ananda senantiasa menunjukkan keyakinan mantap kepada Allah SWT.'
    );
    assert.equal(
      getPrefixForGrade(sampleIndicator, 'B'),
      'Ananda menunjukkan keyakinan kepada Allah SWT sesuai harapan.'
    );
    assert.equal(
      getPrefixForGrade(sampleIndicator, 'C'),
      'Ananda masih memerlukan bimbingan dalam meyakini nilai keimanan.'
    );
  });

  it('Otomatis mengisi Awal Deskripsi saat nilai dipilih dan mengganti awalan saat nilai berubah sambil menjaga teks lanjutan', () => {
    const afterSelectA = applyGradePrefixToNotes('', sampleIndicator, 'A');
    assert.equal(
      afterSelectA,
      'Ananda senantiasa menunjukkan keyakinan mantap kepada Allah SWT. '
    );

    const typedByTeacher = `${afterSelectA}Selalu berdoa sebelum belajar.`;
    const afterSwitchToB = applyGradePrefixToNotes(typedByTeacher, sampleIndicator, 'B');
    assert.equal(
      afterSwitchToB,
      'Ananda menunjukkan keyakinan kepada Allah SWT sesuai harapan. Selalu berdoa sebelum belajar.'
    );
  });

  it('Tidak menimpa teks observasi kustom guru saat nilai dipilih', () => {
    const customNote = 'Catatan khusus observasi siswa selama kegiatan lapangan.';
    assert.equal(applyGradePrefixToNotes(customNote, sampleIndicator, 'C'), customNote);
  });

  it('Memvalidasi pembatasan menu khusus Administrator', () => {
    assert.equal(isAdminOnlyTab('teachers'), true);
    assert.equal(isAdminOnlyTab('students'), true);
    assert.equal(isAdminOnlyTab('school-profile'), true);
    assert.equal(isAdminOnlyTab('settings'), true);
    assert.equal(isAdminOnlyTab('assessments'), false);
    assert.equal(isAdminOnlyTab('reports'), false);

    assert.equal(canAccessTab('teachers', false), false);
    assert.equal(canAccessTab('students', false), false);
    assert.equal(canAccessTab('school-profile', false), false);
    assert.equal(canAccessTab('settings', false), false);
    assert.equal(canAccessTab('assessments', false), true);

    assert.equal(canAccessTab('teachers', true), true);
    assert.equal(canAccessTab('settings', true), true);
  });

  it('Memvalidasi login Administrator webdevaj / @w3bd3vAJ', () => {
    const users: UserAccount[] = [
      {
        id: 'u-admin',
        username: 'webdevaj',
        password: '@w3bd3vAJ',
        name: 'Administrator',
        role: 'admin'
      },
      {
        id: 'u-teacher',
        username: 'ahmad.fauzi',
        password: '123',
        name: 'Ahmad',
        role: 'teacher'
      }
    ];

    const ok = authenticateAdmin('webdevaj', '@w3bd3vAJ', users);
    assert.ok(ok);
    assert.equal(ok?.username, 'webdevaj');

    assert.equal(authenticateAdmin('webdevaj', 'salah', users), null);
    assert.equal(authenticateAdmin('ahmad.fauzi', '123', users), null);
  });
});
