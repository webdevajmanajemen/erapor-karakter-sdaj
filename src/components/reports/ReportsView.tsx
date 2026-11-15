import React, { useState, useMemo, useRef } from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import {
  Student,
  Teacher,
  ClassItem,
  SchoolProfile,
  CharacterCategory,
  SubCharacter,
  CharacterIndicator,
  GradeOption,
  AssessmentRecord
} from '../../types';
import { SchoolLogo } from '../ui/SchoolLogo';
import { useToast } from '../../context/ToastContext';

interface ReportsViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: ClassItem[];
  schoolProfile: SchoolProfile;
  subCharacters: SubCharacter[];
  indicators: CharacterIndicator[];
  gradeOptions: GradeOption[];
  assessments: AssessmentRecord[];
  initialSelectedClass?: string;
}

export function ReportsView({
  students,
  teachers,
  classes,
  schoolProfile,
  subCharacters,
  indicators,
  gradeOptions,
  assessments,
  initialSelectedClass
}: ReportsViewProps) {
  const { success, error, info } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Paper Size: A4 (210x297mm) or F4/Legal (215x330mm)
  const [paperSize, setPaperSize] = useState<'A4' | 'F4'>('A4');

  // Filters
  const [academicYear, setAcademicYear] = useState(schoolProfile.activeAcademicYear);
  const [semester, setSemester] = useState<'1' | '2'>(schoolProfile.activeSemester);
  const [selectedClass, setSelectedClass] = useState<string>(() => initialSelectedClass || classes[0]?.name || '1A');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  React.useEffect(() => {
    if (initialSelectedClass) {
      setSelectedClass(initialSelectedClass);
    }
  }, [initialSelectedClass]);

  // Bulk mode
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Filtered students for chosen class
  const classStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  // Set initial selected student when class changes
  React.useEffect(() => {
    if (classStudents.length > 0 && (!selectedStudentId || !classStudents.some(s => s.id === selectedStudentId))) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [classStudents, selectedStudentId]);

  // Active student object
  const activeStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Active homeroom teacher
  const homeroomTeacher = useMemo(() => {
    if (!activeStudent) return undefined;
    const targetClass = classes.find(c => c.name === activeStudent.className);
    if (targetClass?.homeroomTeacherId) {
      return teachers.find(t => t.id === targetClass.homeroomTeacherId);
    }
    return teachers.find(t => t.role === 'Wali Kelas' && t.assignedClass === activeStudent.className);
  }, [activeStudent, classes, teachers]);

  // Titi Mangsa string
  const titiMangsaText = useMemo(() => {
    const tm = semester === '1' ? schoolProfile.titiMangsaSemester1 : schoolProfile.titiMangsaSemester2;
    return `${schoolProfile.city || 'Depok'}, ${tm.day} ${tm.month} ${tm.year}`;
  }, [semester, schoolProfile]);

  // Helper to find sub character name
  const getSubName = (subId: string) => {
    return subCharacters.find(s => s.id === subId)?.name || '';
  };

  // Unified Print & Download Action (Supports A4 & F4 Legal)
  const handlePrintOrDownload = async (action: 'download' | 'print' = 'download', studentToPrint = activeStudent) => {
    if (!studentToPrint) return;

    if (action === 'print') {
      window.print();
      return;
    }

    if (!reportRef.current) return;

    setIsGeneratingPdf(true);
    const paperLabel = paperSize === 'F4' ? 'F4 / Folio (215 × 330 mm)' : 'A4 (210 × 297 mm)';
    info('Menyiapkan Dokumen PDF', `Sedang memproses 2 halaman rapor format ${paperLabel}...`);

    try {
      const pageElements = reportRef.current.querySelectorAll<HTMLElement>('.print-page');
      if (pageElements.length === 0) {
        throw new Error('Elemen halaman rapor tidak ditemukan.');
      }

      const isF4 = paperSize === 'F4';
      const pdfFormat: [number, number] | 'a4' = isF4 ? [215, 330] : 'a4';
      const pageWidth = isF4 ? 215 : 210;
      const pageHeight = isF4 ? 330 : 297;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: pdfFormat
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        if (i > 0) {
          pdf.addPage(pdfFormat, 'portrait');
        }

        const canvas = await html2canvas(pageEl, {
          scale: 2.2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
      }

      const cleanName = studentToPrint.name.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanYear = academicYear.replace('/', '-');
      const filename = `Rapor_${cleanName}_Kelas${studentToPrint.className}_Sem${semester}_${paperSize}_${cleanYear}.pdf`;

      pdf.save(filename);
      success('PDF Rapor Siap & Diunduh', `Rapor 2 Halaman (${paperSize}) untuk ${studentToPrint.name} berhasil disimpan (${filename}).`);
    } catch (err: any) {
      error('Gagal Mengunduh PDF', err.message || 'Terjadi kesalahan perenderan PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Bulk print all students in class
  const handleBulkPrintClass = () => {
    setIsBulkMode(true);
    setTimeout(() => {
      window.print();
      setIsBulkMode(false);
    }, 400);
  };

  // Reusable Single Report Renderer: Produces Page 1 & Page 2
  const renderSingleReportContent = (student: Student, isBatch = false) => {
    const studentAssessment = assessments.find(
      a =>
        a.studentNis === student.nis &&
        a.academicYear === academicYear &&
        a.semester === semester
    );

    const studentHomeroom = (() => {
      const targetClass = classes.find(c => c.name === student.className);
      if (targetClass?.homeroomTeacherId) {
        return teachers.find(t => t.id === targetClass.homeroomTeacherId);
      }
      return teachers.find(t => t.role === 'Wali Kelas' && t.assignedClass === student.className);
    })();

    const targetClassItem = classes.find(c => c.name === student.className);
    const studentClassLevel = targetClassItem?.level || parseInt(student.className[0]) || 1;

    // Filter indicators by the student's class level (1-6)
    const levelIndicators = indicators.filter(i => (i.level || 1) === studentClassLevel);
    const effectiveIndicators = levelIndicators.length > 0 ? levelIndicators : indicators.filter(i => (i.level || 1) === 1);

    const islamIndicators = effectiveIndicators.filter(i => i.categoryId === 'ISLAM');
    const alamIndicators = effectiveIndicators.filter(i => i.categoryId === 'ALAM');
    const sainsIndicators = effectiveIndicators.filter(i => i.categoryId === 'SAINS');

    // Page styling based on selected paper size: A4 (210x297mm) vs F4/Legal (215x330mm)
    const isF4 = paperSize === 'F4';
    const pageStyle: React.CSSProperties = {
      padding: '10mm',
      width: isF4 ? '215mm' : '210mm',
      minHeight: isF4 ? '330mm' : '297mm',
      boxSizing: 'border-box'
    };

    return (
      <div key={student.id} className="report-student-wrapper space-y-10 print:space-y-0">
        {/* ========================================================= */}
        {/* HALAMAN 1: KOP, IDENTITAS SISWA, KARAKTER ISLAM & ALAM    */}
        {/* ========================================================= */}
        <div
          style={pageStyle}
          className={`print-page ${isF4 ? 'page-f4' : 'page-a4'} bg-white mx-auto text-slate-900 border border-slate-200/80 shadow-xl rounded-none flex flex-col justify-between print:border-none print:shadow-none print:m-0`}
        >
          {/* Main Content Area */}
          <div className="space-y-4">
            {/* KOP RAPOR RESMI DENGAN LOGO BESAR & TEKS TEGAS */}
            <div className="flex items-center gap-5 pb-3 border-b-2 border-slate-900">
              <div className="shrink-0">
                <SchoolLogo size="xl" logoUrl={schoolProfile.logoUrl} className="w-28 h-28 object-contain" />
              </div>
              <div className="text-center flex-1 pr-6">
                <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-950 uppercase font-serif">
                  RAPOR PERKEMBANGAN KARAKTER
                </h1>
                <h2 className="text-base sm:text-lg font-extrabold text-blue-900 uppercase tracking-wide mt-1">
                  {schoolProfile.name}
                </h2>
                <p className="text-xs text-slate-700 font-medium mt-1.5 leading-relaxed">
                  {schoolProfile.address}, {schoolProfile.village}, {schoolProfile.district}, {schoolProfile.city}, {schoolProfile.province}
                </p>
              </div>
            </div>

            {/* SUB HEADER TAHUN AJARAN */}
            <div className="text-center py-1.5 bg-slate-100 rounded-lg border border-slate-300 print:bg-slate-100">
              <p className="text-xs sm:text-[13px] font-black uppercase tracking-widest text-slate-900">
                TAHUN AJARAN {academicYear} — SEMESTER {semester === '1' ? '1 (GANJIL)' : '2 (GENAP)'}
              </p>
            </div>

            {/* IDENTITAS SISWA (SIMETRIS 2x2, FONT NAMA SISWA SEUKURAN DENGAN KOLOM LAIN, STATUS & FASE DIHAPUS) */}
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-8 text-xs font-medium pb-3 border-b-2 border-slate-300">
              <div className="flex items-center">
                <span className="w-28 text-slate-600 font-bold shrink-0">Nama Siswa</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">: {student.name}</span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-slate-600 font-bold shrink-0">Kelas</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">: Kelas {student.className}</span>
              </div>

              <div className="flex items-center">
                <span className="w-28 text-slate-600 font-bold shrink-0">NISN / NIS</span>
                <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                  : {student.nisn ? `${student.nisn} / ${student.nis}` : `- / ${student.nis}`}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-28 text-slate-600 font-bold shrink-0">Wali Kelas</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">: {studentHomeroom?.name || '-'}</span>
              </div>
            </div>

            {/* 1. KARAKTER ISLAM TABLE - WARNA BIRU */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 pb-1 border-b-2 border-blue-900">
                <span className="w-5 h-5 rounded bg-blue-900 text-white font-black text-xs flex items-center justify-center">
                  A
                </span>
                <h3 className="text-sm font-black uppercase text-blue-950 tracking-wider">
                  KARAKTER ISLAM
                </h3>
              </div>

              <table className="w-full text-xs text-left border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-blue-100/90 text-blue-950 font-extrabold uppercase text-xs">
                    <th className="border border-slate-400 py-2 px-2 text-center w-10">No</th>
                    <th className="border border-slate-400 py-2 px-3 w-[34%]">Indikator Karakter</th>
                    <th className="border border-slate-400 py-2 px-2 text-center w-14">Nilai</th>
                    <th className="border border-slate-400 py-2 px-3">Deskripsi Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {islamIndicators.map((ind, idx) => {
                    const item = studentAssessment?.items?.[ind.id];
                    const grade = item?.grade || '-';
                    const notes = item?.notes || ind.defaultDescriptionPrefix || '-';

                    return (
                      <tr key={ind.id} className="align-top">
                        <td className="border border-slate-400 py-2 px-2 text-center font-bold text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-400 py-2 px-3">
                          <div className="text-[11px] font-black text-blue-900 uppercase tracking-wide mb-0.5">
                            {getSubName(ind.subCharacterId)}
                          </div>
                          <div className="font-bold text-slate-950 leading-snug">
                            {ind.name}
                          </div>
                        </td>
                        <td className="border border-slate-400 py-2 px-2 text-center">
                          <span className="font-black text-lg text-blue-900">
                            {grade}
                          </span>
                        </td>
                        <td className="border border-slate-400 py-2 px-3 leading-relaxed text-slate-900 font-medium">
                          {notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. KARAKTER ALAM TABLE - WARNA HIJAU */}
            <div className="space-y-1.5 pt-1.5">
              <div className="flex items-center gap-2 pb-1 border-b-2 border-emerald-800">
                <span className="w-5 h-5 rounded bg-emerald-800 text-white font-black text-xs flex items-center justify-center">
                  B
                </span>
                <h3 className="text-sm font-black uppercase text-emerald-950 tracking-wider">
                  KARAKTER ALAM
                </h3>
              </div>

              <table className="w-full text-xs text-left border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-emerald-100/90 text-emerald-950 font-extrabold uppercase text-xs">
                    <th className="border border-slate-400 py-2 px-2 text-center w-10">No</th>
                    <th className="border border-slate-400 py-2 px-3 w-[34%]">Indikator Karakter</th>
                    <th className="border border-slate-400 py-2 px-2 text-center w-14">Nilai</th>
                    <th className="border border-slate-400 py-2 px-3">Deskripsi Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {alamIndicators.map((ind, idx) => {
                    const item = studentAssessment?.items?.[ind.id];
                    const grade = item?.grade || '-';
                    const notes = item?.notes || ind.defaultDescriptionPrefix || '-';

                    return (
                      <tr key={ind.id} className="align-top">
                        <td className="border border-slate-400 py-2 px-2 text-center font-bold text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-400 py-2 px-3">
                          <div className="text-[11px] font-black text-emerald-800 uppercase tracking-wide mb-0.5">
                            {getSubName(ind.subCharacterId)}
                          </div>
                          <div className="font-bold text-slate-950 leading-snug">
                            {ind.name}
                          </div>
                        </td>
                        <td className="border border-slate-400 py-2 px-2 text-center">
                          <span className="font-black text-lg text-emerald-800">
                            {grade}
                          </span>
                        </td>
                        <td className="border border-slate-400 py-2 px-3 leading-relaxed text-slate-900 font-medium">
                          {notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Halaman 1 (Tanpa NIS setelah nama siswa) */}
          <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-xs text-slate-600 font-semibold">
            <span>Rapor Karakter SD Islam Alam & Sains Al-Jannah — {student.name}</span>
            <span className="font-extrabold text-slate-900">Halaman 1 dari 2</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* HALAMAN 2: KARAKTER SAINS & TANDA TANGAN (LEMBAR LANJUTAN) */}
        {/* ========================================================= */}
        <div
          style={pageStyle}
          className={`print-page ${isF4 ? 'page-f4' : 'page-a4'} bg-white mx-auto text-slate-900 border border-slate-200/80 shadow-xl rounded-none flex flex-col justify-between print:border-none print:shadow-none print:m-0`}
        >
          {/* Main Content Area */}
          <div className="space-y-6">
            {/* 3. KARAKTER SAINS TABLE - WARNA OREN / KUNING */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 pb-1 border-b-2 border-amber-500">
                <span className="w-5 h-5 rounded bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  C
                </span>
                <h3 className="text-sm font-black uppercase text-amber-950 tracking-wider">
                  KARAKTER SAINS
                </h3>
              </div>

              <table className="w-full text-xs text-left border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-amber-100/90 text-amber-950 font-extrabold uppercase text-xs">
                    <th className="border border-slate-400 py-2 px-2 text-center w-10">No</th>
                    <th className="border border-slate-400 py-2 px-3 w-[34%]">Indikator Karakter</th>
                    <th className="border border-slate-400 py-2 px-2 text-center w-14">Nilai</th>
                    <th className="border border-slate-400 py-2 px-3">Deskripsi Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {sainsIndicators.map((ind, idx) => {
                    const item = studentAssessment?.items?.[ind.id];
                    const grade = item?.grade || '-';
                    const notes = item?.notes || ind.defaultDescriptionPrefix || '-';

                    return (
                      <tr key={ind.id} className="align-top">
                        <td className="border border-slate-400 py-2 px-2 text-center font-bold text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="border border-slate-400 py-2 px-3">
                          <div className="text-[11px] font-black text-amber-900 uppercase tracking-wide mb-0.5">
                            {getSubName(ind.subCharacterId)}
                          </div>
                          <div className="font-bold text-slate-950 leading-snug">
                            {ind.name}
                          </div>
                        </td>
                        <td className="border border-slate-400 py-2 px-2 text-center">
                          <span className="font-black text-lg text-amber-800">
                            {grade}
                          </span>
                        </td>
                        <td className="border border-slate-400 py-2 px-3 leading-relaxed text-slate-900 font-medium">
                          {notes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TANDA TANGAN 3 PIHAK RAPOR RESMI */}
            <div className="pt-8">
              {/* Baris Atas: Orang Tua (Kiri) & Wali Kelas (Kanan dengan Titi Mangsa) */}
              <div className="flex justify-between items-start text-xs sm:text-sm text-slate-900">
                {/* Kiri: Orang Tua / Wali (Sejajar dengan Wali Kelas) */}
                <div className="w-64 text-center">
                  <p className="invisible select-none font-semibold text-slate-700">{titiMangsaText}</p>
                  <p className="font-bold text-slate-950 mt-1">Orang Tua / Wali Siswa</p>
                  <div className="h-24 flex flex-col justify-end items-center">
                    <p className="font-bold border-b-2 border-slate-800 pb-1 min-w-[170px] text-xs sm:text-sm">
                      ( ........................................... )
                    </p>
                  </div>
                </div>

                {/* Kanan: Wali Kelas (Titi Mangsa, Nama Guru, Tanpa NIP) */}
                <div className="w-64 text-center">
                  <p className="font-semibold text-slate-700">{titiMangsaText}</p>
                  <p className="font-bold text-slate-950 mt-1">Wali Kelas</p>
                  <div className="h-24 flex flex-col justify-end items-center">
                    <p className="font-bold border-b-2 border-slate-800 pb-1 min-w-[170px] text-xs sm:text-sm">
                      {studentHomeroom?.name || '( ........................................... )'}
                    </p>
                  </div>
                </div>
              </div>


              {/* Tengah Bawah: Kepala Sekolah (Dengan "Mengetahui,", Nama Kepsek, Tanpa NIP) */}
              <div className="mt-10 text-center text-xs sm:text-sm text-slate-900">
                <p className="font-semibold text-slate-600">Mengetahui,</p>
                <p className="font-bold text-slate-950 mt-1">
                  {schoolProfile.name.trim().toUpperCase() === 'SD ISLAM ALAM & SAINS AL-JANNAH'
                    ? 'Kepala SD Islam Alam & Sains Al-Jannah'
                    : `Kepala ${schoolProfile.name}`}
                </p>
                <div className="h-24 flex flex-col justify-end items-center">
                  <p className="font-bold border-b-2 border-slate-800 pb-1 min-w-[200px] text-xs sm:text-sm">
                    {schoolProfile.headmasterName || '( ........................................... )'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Halaman 2 (Tanpa NIS setelah nama siswa) */}
          <div className="pt-4 border-t border-slate-300 flex justify-between items-center text-xs text-slate-600 font-semibold">
            <span>Rapor Karakter SD Islam Alam & Sains Al-Jannah — {student.name}</span>
            <span className="font-extrabold text-slate-900">Halaman 2 dari 2</span>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar (Hidden on print) */}
      <div className="no-print space-y-4">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Pencetakan Rapor Karakter Siswa
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Pilihan Ukuran Kertas */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPaperSize('A4')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  paperSize === 'A4'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                A4 (210×297)
              </button>
              <button
                type="button"
                onClick={() => setPaperSize('F4')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  paperSize === 'F4'
                    ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                F4 Legal (215×330)
              </button>
            </div>

            {/* Unified Cetak & Unduh Rapor (PDF) */}
            <div className="inline-flex rounded-xl shadow-md bg-amber-500 hover:bg-amber-600 transition-all overflow-hidden">
              <button
                type="button"
                disabled={isGeneratingPdf || !activeStudent}
                onClick={() => handlePrintOrDownload('download')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-950 text-xs font-bold transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>{isGeneratingPdf ? `Memproses ${paperSize}...` : `Cetak & Unduh Rapor (${paperSize})`}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePrintOrDownload('print')}
                className="px-2.5 py-2.5 border-l border-amber-600 text-slate-950 hover:bg-amber-600 transition-colors cursor-pointer"
                title="Buka Dialog Print Browser Langsung"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar (Hanya Semester, Kelas, dan Siswa) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
          {/* Semester */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value as '1' | '2')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Semester 1 (Ganjil)</option>
              <option value="2">Semester 2 (Genap)</option>
            </select>
          </div>

          {/* Kelas */}

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Rombel Kelas
            </label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.name}>
                  Kelas {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Siswa */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Pilih Siswa
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classStudents.length === 0 ? (
                <option value="">Tidak ada siswa di kelas ini</option>
              ) : (
                classStudents.map(s => {
                  const hasFinal = assessments.some(
                    a => a.studentNis === s.nis && a.academicYear === academicYear && a.semester === semester && a.status === 'final'
                  );
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nis}) {hasFinal ? '✓ Final' : '• Draft/Belum'}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>

        {/* Student Quick Switcher Buttons */}
        {classStudents.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Pilih Cepat:
            </span>
            {classStudents.map(s => {
              const isSelected = s.id === selectedStudentId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s.name.split(' ')[0]} ({s.nis.slice(-4)})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Rapor Preview Area */}
      {!activeStudent ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200 text-slate-400">
          Pilih kelas dan siswa untuk melihat pratinjau rapor karakter.
        </div>
      ) : isBulkMode ? (
        /* Bulk rendering for all students in class (used for whole-class printing) */
        <div className="space-y-12">
          {classStudents.map(s => renderSingleReportContent(s, true))}
        </div>
      ) : (
        /* Single Student Interactive Preview */
        <div ref={reportRef} className="print-container space-y-8">
          {renderSingleReportContent(activeStudent, false)}
        </div>
      )}
    </div>
  );
}
