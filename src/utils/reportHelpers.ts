import {
  AssessmentRecord,
  CharacterCategory,
  CharacterIndicator,
  GradeCode,
  SubCharacter
} from '../types';

export interface ReportTableRow {
  key: string;
  subName: string;
  indicatorName: string;
  grade: GradeCode | '-';
  notes: string;
  isUnconfigured: boolean;
}

export function resolveReportIndicatorGradeAndNotes(
  indicator: CharacterIndicator,
  assessment?: AssessmentRecord
): { grade: GradeCode | '-'; notes: string } {
  const item = assessment?.items?.[indicator.id];
  const rawGrade = item?.grade;
  const grade: GradeCode | '-' =
    rawGrade === 'A' || rawGrade === 'B' || rawGrade === 'C' ? rawGrade : '-';

  const customNotes = (item?.notes || '').trim();
  if (customNotes) {
    return { grade, notes: customNotes };
  }

  if (grade === 'A') {
    const prefixA = (indicator.descriptionPrefixA || '').trim();
    return { grade, notes: prefixA || '-' };
  }
  if (grade === 'B') {
    const prefixB = (indicator.descriptionPrefixB || '').trim();
    return { grade, notes: prefixB || '-' };
  }
  if (grade === 'C') {
    const prefixC = (indicator.descriptionPrefixC || '').trim();
    return { grade, notes: prefixC || '-' };
  }

  // Belum ada pilihan nilai A/B/C -> Deskripsi Nilai diisi "-"
  return { grade: '-', notes: '-' };
}

export function buildReportCategoryRows(
  category: CharacterCategory,
  studentClassLevel: number,
  subCharacters: SubCharacter[],
  indicators: CharacterIndicator[],
  assessment?: AssessmentRecord
): ReportTableRow[] {
  const catSubs = subCharacters
    .filter(s => s.categoryId === category)
    .sort((a, b) => a.order - b.order);

  const levelIndicators = indicators
    .filter(i => (i.level || 1) === studentClassLevel && i.categoryId === category)
    .sort((a, b) => a.order - b.order);

  if (levelIndicators.length === 0) {
    const rowCount = Math.max(catSubs.length, 1);
    return Array.from({ length: rowCount }, (_, idx) => ({
      key: `empty-${category}-${studentClassLevel}-${idx}`,
      subName: '',
      indicatorName: '-',
      grade: '-',
      notes: '-',
      isUnconfigured: true
    }));
  }

  const rows: ReportTableRow[] = [];
  const usedIndicatorIds = new Set<string>();

  if (catSubs.length > 0) {
    catSubs.forEach(sub => {
      const subInds = levelIndicators.filter(i => i.subCharacterId === sub.id);
      if (subInds.length === 0) {
        rows.push({
          key: `empty-${sub.id}-${studentClassLevel}`,
          subName: '',
          indicatorName: '-',
          grade: '-',
          notes: '-',
          isUnconfigured: true
        });
      } else {
        subInds.forEach(ind => {
          usedIndicatorIds.add(ind.id);
          const indName = (ind.name || '').trim();
          if (!indName) {
            rows.push({
              key: ind.id,
              subName: '',
              indicatorName: '-',
              grade: '-',
              notes: '-',
              isUnconfigured: true
            });
          } else {
            const { grade, notes } = resolveReportIndicatorGradeAndNotes(ind, assessment);
            rows.push({
              key: ind.id,
              subName: sub.name,
              indicatorName: indName,
              grade,
              notes,
              isUnconfigured: false
            });
          }
        });
      }
    });
  }

  // Append any remaining indicators for this level/category whose subCharacterId was not in catSubs
  levelIndicators
    .filter(ind => !usedIndicatorIds.has(ind.id))
    .forEach(ind => {
      const indName = (ind.name || '').trim();
      const subName = catSubs.find(s => s.id === ind.subCharacterId)?.name || '';
      if (!indName) {
        rows.push({
          key: ind.id,
          subName: '',
          indicatorName: '-',
          grade: '-',
          notes: '-',
          isUnconfigured: true
        });
      } else {
        const { grade, notes } = resolveReportIndicatorGradeAndNotes(ind, assessment);
        rows.push({
          key: ind.id,
          subName,
          indicatorName: indName,
          grade,
          notes,
          isUnconfigured: false
        });
      }
    });

  return rows;
}
