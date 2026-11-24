import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCheck,
  Sparkles,
  BookOpen,
  Leaf,
  Atom,
  HelpCircle,
  FileText,
  User,
  Quote,
  Layers,
  GraduationCap,
  Users
} from 'lucide-react';
import {
  Student,
  ClassItem,
  SchoolProfile,
  CharacterCategory,
  SubCharacter,
  CharacterIndicator,
  GradeOption,
  GradeCode,
  AssessmentRecord,
  AssessmentItem,
  UserAccount,
  Teacher
} from '../../types';
import { useToast } from '../../context/ToastContext';
import { getPrefixForGrade, applyGradePrefixToNotes } from '../../utils/assessmentHelpers';

interface AssessmentsViewProps {
  students: Student[];
  classes: ClassItem[];
  teachers?: Teacher[];
  schoolProfile: SchoolProfile;
  subCharacters: SubCharacter[];
  indicators: CharacterIndicator[];
  gradeOptions: GradeOption[];
  assessments: AssessmentRecord[];
  activeUser: UserAccount;
  onSaveAssessment: (record: AssessmentRecord) => void;
  initialSelectedStudentId?: string;
  initialSelectedClass?: string;
}

export function AssessmentsView({
  students,
  classes,
  teachers = [],
  schoolProfile,
  subCharacters,
  indicators,
  gradeOptions,
  assessments,
  activeUser,
  onSaveAssessment,
  initialSelectedStudentId,
  initialSelectedClass
}: AssessmentsViewProps) {
  const { success, warning, error } = useToast();

  // Academic Filters
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(schoolProfile.activeAcademicYear);
  const [selectedSemester, setSelectedSemester] = useState<'1' | '2'>(schoolProfile.activeSemester);

  // KELAS TERPILIH (Pusat Navigasi Pengisian agar guru tidak bingung)
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    if (initialSelectedClass) return initialSelectedClass;
    // If active user is teacher with assigned class, default to it
    if (activeUser.role === 'teacher' && activeUser.teacherId) {
      const t = teachers.find(teach => teach.id === activeUser.teacherId);
      if (t?.assignedClass) return t.assignedClass;
    }
    return classes[0]?.name || '1A';
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Currently Selected Student for Assessment Editor
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(initialSelectedStudentId || null);

  // Active Category Tab in Form (ISLAM = BIRU, ALAM = HIJAU, SAINS = OREN/KUNING)
  const [activeFormCategory, setActiveFormCategory] = useState<CharacterCategory>('ISLAM');

  // Active assessment working buffer
  const [assessmentItems, setAssessmentItems] = useState<Record<string, AssessmentItem>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [assessmentStatus, setAssessmentStatus] = useState<'draft' | 'final'>('draft');

  // Synchronous refs to prevent stale closure during debounced autosave and typing
  const assessmentItemsRef = useRef<Record<string, AssessmentItem>>({});
  const generalNotesRef = useRef<string>('');
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  // Autosave status
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'unsaved'>('idle');

  // Selected student object
  const currentStudent = useMemo(() => {
    return students.find(s => s.id === currentStudentId);
  }, [students, currentStudentId]);

  const currentStudentRef = useRef<Student | undefined>(currentStudent);
  currentStudentRef.current = currentStudent;

  // Active level calculation based on selected class
  const currentClassLevel = useMemo(() => {
    const cls = classes.find(c => c.name === selectedClass);
    return cls?.level || parseInt(selectedClass?.[0] || '1') || 1;
  }, [classes, selectedClass]);

  // Indicators filtered strictly for this class level
  const activeLevelIndicators = useMemo(() => {
    const forLevel = indicators.filter(i => (i.level || 1) === currentClassLevel);
    return forLevel.length > 0 ? forLevel : indicators;
  }, [indicators, currentClassLevel]);

  // Load existing assessment ONLY when student, academic year, or semester changes
  useEffect(() => {
    if (!currentStudent) {
      setAssessmentItems({});
      assessmentItemsRef.current = {};
      setGeneralNotes('');
      generalNotesRef.current = '';
      setAssessmentStatus('draft');
      setSaveState('idle');
      isDirtyRef.current = false;
      return;
    }

    // Cancel pending autosaves from prior student
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    const existing = assessments.find(
      a =>
        a.studentNis === currentStudent.nis &&
        a.academicYear === selectedAcademicYear &&
        a.semester === selectedSemester
    );

    if (existing && existing.items) {
      const merged: Record<string, AssessmentItem> = {};
      activeLevelIndicators.forEach(ind => {
        merged[ind.id] = existing.items[ind.id] || {
          indicatorId: ind.id,
          grade: '',
          notes: '',
          updatedAt: new Date().toISOString()
        };
      });
      setAssessmentItems(merged);
      assessmentItemsRef.current = merged;
      const notes = existing.generalNotes || '';
      setGeneralNotes(notes);
      generalNotesRef.current = notes;
      setAssessmentStatus(existing.status);
    } else {
      // Initialize blank items with indicator IDs for this level
      const initialMap: Record<string, AssessmentItem> = {};
      activeLevelIndicators.forEach(ind => {
        initialMap[ind.id] = {
          indicatorId: ind.id,
          grade: '',
          notes: '',
          updatedAt: new Date().toISOString()
        };
      });
      setAssessmentItems(initialMap);
      assessmentItemsRef.current = initialMap;
      setGeneralNotes('');
      generalNotesRef.current = '';
      setAssessmentStatus('draft');
    }

    setSaveState('saved');
    isDirtyRef.current = false;
  }, [currentStudent?.id, selectedAcademicYear, selectedSemester, activeLevelIndicators]);

  // Handle value change for an indicator (synchronously updating ref and state)
  const handleItemChange = (indicatorId: string, field: 'grade' | 'notes', value: any) => {
    const existing = assessmentItemsRef.current[indicatorId] || {
      indicatorId,
      grade: '',
      notes: '',
      updatedAt: new Date().toISOString()
    };

    const updatedItem = {
      ...existing,
      [field]: value,
      updatedAt: new Date().toISOString()
    };

    const nextItems = {
      ...assessmentItemsRef.current,
      [indicatorId]: updatedItem
    };

    assessmentItemsRef.current = nextItems;
    setAssessmentItems(nextItems);

    isDirtyRef.current = true;
    setSaveState('unsaved');

    // Debounced autosave (1500ms)
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      triggerSave('draft', false);
    }, 1500);
  };

  // Select grade A / B / C and apply matching Awal Deskripsi automatically
  const handleSelectGrade = (indicator: CharacterIndicator, newGrade: GradeCode) => {
    const existing = assessmentItemsRef.current[indicator.id] || {
      indicatorId: indicator.id,
      grade: '',
      notes: '',
      updatedAt: new Date().toISOString()
    };

    const nextNotes = applyGradePrefixToNotes(existing.notes || '', indicator, newGrade);
    const updatedItem: AssessmentItem = {
      ...existing,
      grade: newGrade,
      notes: nextNotes,
      updatedAt: new Date().toISOString()
    };

    const nextItems = {
      ...assessmentItemsRef.current,
      [indicator.id]: updatedItem
    };

    assessmentItemsRef.current = nextItems;
    setAssessmentItems(nextItems);

    isDirtyRef.current = true;
    setSaveState('unsaved');

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      triggerSave('draft', false);
    }, 1500);
  };

  // Quick insert description prefix (guaranteed preservation of template and continuous typing)
  const handleInsertPrefix = (indicatorId: string, prefixText: string) => {
    const currentNotes = assessmentItemsRef.current[indicatorId]?.notes || '';
    const trimmedPrefix = prefixText.trim();
    let updatedNotes = '';
    if (!currentNotes.trim()) {
      // Set prefix with trailing space so user can immediately continue typing their observation
      updatedNotes = `${trimmedPrefix} `;
    } else if (currentNotes.includes(trimmedPrefix)) {
      // Already has prefix, don't duplicate
      updatedNotes = currentNotes;
    } else {
      updatedNotes = `${trimmedPrefix} ${currentNotes.trim()}`;
    }
    handleItemChange(indicatorId, 'notes', updatedNotes);
  };

  // Save trigger reading from synchronous refs
  const triggerSave = (statusToSave: 'draft' | 'final', showToastNotification = true) => {
    const student = currentStudentRef.current;
    if (!student) return;

    setSaveState('saving');
    try {
      const currentItems = assessmentItemsRef.current;
      const currentNotes = generalNotesRef.current;

      const record: AssessmentRecord = {
        id: `as-${student.nis}-${selectedAcademicYear.replace('/', '-')}-sem${selectedSemester}`,
        studentId: student.id,
        studentNis: student.nis,
        academicYear: selectedAcademicYear,
        semester: selectedSemester,
        className: student.className,
        status: statusToSave,
        items: currentItems,
        generalNotes: currentNotes.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: activeUser.name
      };

      onSaveAssessment(record);
      setAssessmentStatus(statusToSave);
      setSaveState('saved');
      isDirtyRef.current = false;

      if (showToastNotification) {
        if (statusToSave === 'final') {
          success(
            'Penilaian Difinalisasi!',
            `Rapor karakter ${student.name} (Kelas ${student.className}) berhasil difinalisasi.`
          );
        } else {
          success('Draft Tersimpan', `Penilaian untuk ${student.name} tersimpan.`);
        }
      }
    } catch (err: any) {
      setSaveState('unsaved');
      error('Gagal Menyimpan', err.message || 'Terjadi kesalahan');
    }
  };

  // Finalize with validation
  const handleFinalize = () => {
    const unassessed = activeLevelIndicators.filter(ind => {
      const item = assessmentItems[ind.id];
      return !item || !item.grade;
    });

    if (unassessed.length > 0) {
      warning(
        'Penilaian Belum Lengkap',
        `Masih ada ${unassessed.length} indikator yang belum memiliki nilai. Anda tetap dapat menyimpan sebagai Draft terlebih dahulu.`
      );
    }
    triggerSave('final', true);
  };

  // All students belonging to selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.className === selectedClass);
  }, [students, selectedClass]);

  const currentStudentIndex = useMemo(() => {
    return classStudents.findIndex(s => s.id === currentStudentId);
  }, [classStudents, currentStudentId]);

  const handleNavigateStudent = (direction: 'prev' | 'next') => {
    if (isDirtyRef.current) {
      triggerSave('draft', false);
    }
    const nextIndex = direction === 'next' ? currentStudentIndex + 1 : currentStudentIndex - 1;
    if (nextIndex >= 0 && nextIndex < classStudents.length) {
      setCurrentStudentId(classStudents[nextIndex].id);
    }
  };

  // Filtered students for Table list (strictly within selected class)
  const filteredStudents = useMemo(() => {
    return classStudents.filter(s => {
      return (
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [classStudents, searchTerm]);

  // Current homeroom teacher of selected class
  const selectedClassHomeroom = useMemo(() => {
    const cls = classes.find(c => c.name === selectedClass);
    if (cls?.homeroomTeacherId) {
      return teachers.find(t => t.id === cls.homeroomTeacherId);
    }
    return teachers.find(t => t.role === 'Wali Kelas' && t.assignedClass === selectedClass);
  }, [classes, teachers, selectedClass]);

  // Completion calculation for current student
  const totalIndicatorsCount = activeLevelIndicators.length;
  const filledCount = useMemo(() => {
    return activeLevelIndicators.filter(ind => assessmentItems[ind.id]?.grade).length;
  }, [activeLevelIndicators, assessmentItems]);
  const progressPercent = totalIndicatorsCount > 0 ? Math.round((filledCount / totalIndicatorsCount) * 100) : 0;

  // Completion calculation for selected class
  const classAssessedFinalCount = useMemo(() => {
    return assessments.filter(
      a =>
        a.className === selectedClass &&
        a.academicYear === selectedAcademicYear &&
        a.semester === selectedSemester &&
        a.status === 'final'
    ).length;
  }, [assessments, selectedClass, selectedAcademicYear, selectedSemester]);

  // Category Tabs Configuration (Revised Colors: Islam = Biru, Alam = Hijau, Sains = Oren/Kuning)
  const categoryTabs: {
    id: CharacterCategory;
    title: string;
    icon: React.ReactNode;
    activeClass: string;
    inactiveClass: string;
    badgeColor: string;
    inactiveBadgeColor: string;
    headerClass: string;
    numberBg: string;
  }[] = [
    {
      id: 'ISLAM',
      title: 'Karakter Islam',
      icon: <BookOpen className="w-4 h-4" />,
      activeClass: 'bg-blue-600 text-white border-blue-600 shadow-md font-extrabold',
      inactiveClass: 'bg-blue-50/50 text-black border-blue-200 hover:bg-blue-100/60 font-bold',
      badgeColor: 'text-blue-100',
      inactiveBadgeColor: 'text-black',
      headerClass: 'bg-blue-50/90 border-blue-200 text-blue-950',
      numberBg: 'bg-blue-600 text-white'
    },
    {
      id: 'ALAM',
      title: 'Karakter Alam',
      icon: <Leaf className="w-4 h-4" />,
      activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md font-extrabold',
      inactiveClass: 'bg-emerald-50/50 text-black border-emerald-200 hover:bg-emerald-100/60 font-bold',
      badgeColor: 'text-emerald-100',
      inactiveBadgeColor: 'text-black',
      headerClass: 'bg-emerald-50/90 border-emerald-200 text-emerald-950',
      numberBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'SAINS',
      title: 'Karakter Sains',
      icon: <Atom className="w-4 h-4" />,
      activeClass: 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-extrabold',
      inactiveClass: 'bg-amber-50/50 text-black border-amber-200 hover:bg-amber-100/60 font-bold',
      badgeColor: 'text-amber-950',
      inactiveBadgeColor: 'text-black',
      headerClass: 'bg-amber-50/90 border-amber-200 text-amber-950',
      numberBg: 'bg-amber-500 text-slate-950 font-black'
    }
  ];

  const currentCategoryConfig = categoryTabs.find(c => c.id === activeFormCategory) || categoryTabs[0];

  // =========================================================================
  // VIEW 1: CLASS SELECTION & STUDENTS LIST TABLE
  // =========================================================================
  if (!currentStudentId || !currentStudent) {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Penilaian Perkembangan Karakter
              </h2>
              <p className="text-xs text-slate-500">
                Pilih rombel kelas terlebih dahulu untuk memulai pengisian nilai dan narasi observasi siswa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Tahun Ajaran: <strong className="text-blue-700">{selectedAcademicYear}</strong> • Sem {selectedSemester}
            </span>
          </div>
        </div>

        {/* STEP 1: PILIH KELAS PENGISIAN (PROMINENT CLASS SWITCHER) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
                <Layers className="w-4 h-4" />
                Langkah 1: Pilih Rombel Kelas Pengisian
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik salah satu kelas di bawah. Sistem akan memfokuskan daftar siswa hanya untuk kelas yang Anda pilih.
              </p>
            </div>

            {/* Quick Academic Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-semibold"
              >
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
                <option value="2027/2028">2027/2028</option>
                <option value="2028/2029">2028/2029</option>
              </select>

              <select
                value={selectedSemester}
                onChange={e => setSelectedSemester(e.target.value as '1' | '2')}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 font-semibold"
              >
                <option value="1">Sem 1 (Ganjil)</option>
                <option value="2">Sem 2 (Genap)</option>
              </select>
            </div>
          </div>

          {/* Dropdown Selector for Class */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-6 md:col-span-5">
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Pilih Rombongan Belajar (Kelas)
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-blue-600 bg-white text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-3 focus:ring-blue-500/20 shadow-xs cursor-pointer"
              >
                {classes.map(cls => {
                  const count = students.filter(s => s.className === cls.name).length;
                  const finalAssessed = assessments.filter(
                    a =>
                      a.className === cls.name &&
                      a.academicYear === selectedAcademicYear &&
                      a.semester === selectedSemester &&
                      a.status === 'final'
                  ).length;
                  return (
                    <option key={cls.id} value={cls.name}>
                      Kelas {cls.name} ({cls.phase || 'SD'}) — {count} Siswa ({finalAssessed} Selesai)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="sm:col-span-6 md:col-span-7 flex flex-wrap items-center gap-2 pt-1 sm:pt-6">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Wali Kelas:</span>
                <span className="font-bold text-slate-900">{selectedClassHomeroom?.name || 'Belum Ditentukan'}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs flex items-center gap-2">
                <span className="text-blue-700 font-semibold">Total Siswa:</span>
                <span className="font-bold text-blue-950">{classStudents.length} Siswa</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2">
                <span className="text-emerald-700 font-semibold">Penilaian Final:</span>
                <span className="font-bold text-emerald-950">{classAssessedFinalCount} dari {classStudents.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: DAFTAR SISWA KELAS TERPILIH */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4">
          {/* Active Class Header Bar */}
          <div className="p-5 bg-gradient-to-r from-blue-900 to-blue-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-sm uppercase">
                Kelas {selectedClass}
              </span>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Daftar Penilaian Siswa Kelas {selectedClass}
                </h3>
                <p className="text-xs text-blue-200">
                  Wali Kelas: {selectedClassHomeroom?.name || 'Belum Ditentukan'} • Total: {classStudents.length} Siswa ({classAssessedFinalCount} Selesai)
                </p>
              </div>
            </div>

            {/* In-class Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Cari siswa di kelas ${selectedClass}...`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Student Assessment Table */}
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 border-b border-slate-100 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Kelengkapan Karakter</th>
                  <th className="py-3 px-4 text-center">Status Rapor</th>
                  <th className="py-3 px-4 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                      {searchTerm
                        ? `Tidak ada siswa di Kelas ${selectedClass} yang cocok dengan "${searchTerm}".`
                        : `Belum ada data siswa terdaftar di Kelas ${selectedClass}. Silakan tambahkan siswa di menu "Data Siswa".`}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, index) => {
                    const existingRecord = assessments.find(
                      a =>
                        a.studentNis === s.nis &&
                        a.academicYear === selectedAcademicYear &&
                        a.semester === selectedSemester
                    );

                    const status = existingRecord ? existingRecord.status : 'belum';
                    const itemsMap = existingRecord?.items || {};
                    const assessedCount = activeLevelIndicators.filter(ind => itemsMap[ind.id]?.grade).length;
                    const pct = Math.round((assessedCount / (activeLevelIndicators.length || 1)) * 100);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3 text-center text-xs font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-600">
                          {s.nis}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {s.name}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'Inklusi'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-bold text-slate-700">
                              {assessedCount}/{activeLevelIndicators.length}
                            </span>
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  pct === 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-amber-500' : 'bg-slate-200'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {status === 'final' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Final
                            </span>
                          ) : status === 'draft' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Draft ({pct}%)
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              Belum Dinilai
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setCurrentStudentId(s.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-98 cursor-pointer"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            {status === 'belum' ? 'Input Nilai' : 'Edit Nilai'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: FORM PENILAIAN KARAKTER SISWA (FOCUS EDITING MODE)
  // =========================================================================
  const categorySubs = subCharacters
    .filter(s => s.categoryId === activeFormCategory)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6 pb-24">
      {/* Top Floating Control Bar */}
      <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Back button & Student info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => {
              if (isDirtyRef.current) {
                triggerSave('draft', false);
              }
              setCurrentStudentId(null);
            }}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
            title={`Kembali ke Daftar Kelas ${currentStudent.className}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-700 text-white text-xs font-black shrink-0">
                Kelas {currentStudent.className}
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                {currentStudent.name}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono shrink-0 hidden sm:inline">
                NIS: {currentStudent.nis}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Penilaian Karakter Semester {selectedSemester} TA {selectedAcademicYear} • Siswa ke-{currentStudentIndex + 1} dari {classStudents.length} di Kelas {currentStudent.className}
            </p>
          </div>
        </div>

        {/* Center: Autosave Status & Progress Bar */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Progress pill */}
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-bold text-slate-600">
              Kelengkapan: <strong>{filledCount} / {totalIndicatorsCount}</strong> ({progressPercent}%)
            </span>
            <div className="w-28 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden mt-1 shadow-inner">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Autosave Status Badge */}
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border bg-slate-50 border-slate-200 shrink-0">
            {saveState === 'saving' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-amber-700">Menyimpan...</span>
              </>
            ) : saveState === 'saved' ? (
              <>
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersimpan Otomatis</span>
              </>
            ) : saveState === 'unsaved' ? (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-blue-700">Ada Perubahan</span>
              </>
            ) : (
              <span className="text-slate-500">Siap</span>
            )}
          </div>

          {/* Action Buttons: Draft & Final */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => triggerSave('draft', true)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors"
            >
              Simpan Draft
            </button>

            <button
              type="button"
              onClick={handleFinalize}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-98 ${
                assessmentStatus === 'final'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
              {assessmentStatus === 'final' ? 'Perbarui Final' : 'Finalisasi Penilaian'}
            </button>
          </div>
        </div>
      </div>

      {/* Student Prev / Next Navigation Bar (Strictly locked within active class) */}
      <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-2xl border border-blue-200/80 text-xs text-blue-950 font-medium">
        <button
          type="button"
          disabled={currentStudentIndex <= 0}
          onClick={() => handleNavigateStudent('prev')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-blue-300 bg-white hover:bg-blue-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Siswa Sebelumnya ({classStudents[currentStudentIndex - 1]?.name.split(' ')[0] || ''})</span>
        </button>

        <span className="font-bold text-blue-900">
          Rombel Kelas {currentStudent.className} • Siswa {currentStudentIndex + 1} dari {classStudents.length}
        </span>

        <button
          type="button"
          disabled={currentStudentIndex >= classStudents.length - 1}
          onClick={() => handleNavigateStudent('next')}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-blue-300 bg-white hover:bg-blue-50 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span>Siswa Berikutnya ({classStudents[currentStudentIndex + 1]?.name.split(' ')[0] || ''})</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3 CATEGORY TABS (REVISED COLORS: ISLAM = BIRU, ALAM = HIJAU, SAINS = OREN/KUNING) */}
      <div className="grid grid-cols-3 gap-3">
        {categoryTabs.map(cat => {
          const isActive = activeFormCategory === cat.id;
          const catInds = activeLevelIndicators.filter(i => i.categoryId === cat.id);
          const catFilled = catInds.filter(i => assessmentItems[i.id]?.grade).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveFormCategory(cat.id)}
              className={`p-4 rounded-2xl border text-center transition-all duration-150 cursor-pointer ${
                isActive ? cat.activeClass : cat.inactiveClass
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {cat.icon}
                <span className="text-sm font-black">{cat.title}</span>
              </div>
              <p className={`text-[11px] font-semibold ${isActive ? cat.badgeColor : cat.inactiveBadgeColor}`}>
                {catFilled} dari {catInds.length} Indikator Terisi
              </p>
            </button>
          );
        })}
      </div>

      {/* Indicators List for Active Category */}
      <div className="space-y-6">
        {categorySubs.map((sub, sIdx) => {
          const subInds = activeLevelIndicators
            .filter(i => i.subCharacterId === sub.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
            >
              {/* Sub-character Header with Category-themed Color */}
              <div className={`px-6 py-3.5 border-b flex items-center justify-between ${currentCategoryConfig.headerClass}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center ${currentCategoryConfig.numberBg}`}>
                    {sIdx + 1}
                  </span>
                  <h3 className="font-extrabold text-sm">
                    Sub Karakter: {sub.name}
                  </h3>
                </div>
                <span className="text-xs font-bold opacity-80">
                  {subInds.length} Indikator
                </span>
              </div>

              {/* Indicators List */}
              <div className="divide-y divide-slate-100">
                {subInds.map((ind, iIdx) => {
                  const currentItem = assessmentItems[ind.id] || {
                    indicatorId: ind.id,
                    grade: '',
                    notes: '',
                    updatedAt: ''
                  };

                  return (
                    <div key={ind.id} className="p-5 sm:p-6 space-y-4">
                      {/* Indicator Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-xs font-bold text-slate-400 mt-0.5">
                            {sIdx + 1}.{iIdx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                              {ind.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Pilih capaian perkembangan siswa dan tuliskan deskripsi hasil pengamatan selama satu semester.
                            </p>
                          </div>
                        </div>

                        {/* Grade selector buttons A, B, C */}
                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-xl border border-slate-200">
                          {gradeOptions.map(g => {
                            const isSelected = currentItem.grade === g.code;
                            return (
                              <button
                                key={g.code}
                                type="button"
                                onClick={() => handleSelectGrade(ind, g.code)}
                                title={`${g.code} - ${g.label}: ${g.description}`}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                  isSelected
                                    ? g.code === 'A'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : g.code === 'B'
                                      ? 'bg-blue-600 text-white shadow-xs'
                                      : 'bg-amber-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                                }`}
                              >
                                {g.code}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Observations / Comments Textarea */}
                      <div className="pl-6 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Deskripsi Nilai
                          </label>

                          {/* Quick Insert Awal Deskripsi Button matching selected grade */}
                          {(() => {
                            const activePrefix = getPrefixForGrade(ind, currentItem.grade);
                            if (!activePrefix) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => handleInsertPrefix(ind.id, activePrefix)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200/60 transition-colors cursor-pointer"
                                title={`Isi awal deskripsi${currentItem.grade ? ` (Nilai ${currentItem.grade})` : ''}: "${activePrefix}"`}
                              >
                                <Quote className="w-3 h-3" />
                                Awal Deskripsi{currentItem.grade ? ` (${currentItem.grade})` : ''}
                              </button>
                            );
                          })()}
                        </div>

                        <textarea
                          rows={3}
                          value={currentItem.notes}
                          onChange={e => handleItemChange(ind.id, 'notes', e.target.value)}
                          placeholder="Tuliskan catatan detail pengamatan perkembangan karakter siswa (didukung teks panjang multi-paragraf)..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs sm:text-sm font-medium leading-relaxed resize-y"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Save Button Bar */}

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-6 py-3.5 flex items-center justify-between no-print shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isDirtyRef.current) triggerSave('draft', false);
              setCurrentStudentId(null);
            }}
            className="text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            ← Selesai & Kembali ke Daftar Kelas {currentStudent.className}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => triggerSave('draft', true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-xs transition-colors"
          >
            Simpan Draft
          </button>
          <button
            type="button"
            onClick={handleFinalize}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition-all active:scale-98"
          >
            Finalisasi Penilaian Rapor
          </button>
        </div>
      </div>
    </div>
  );
}
