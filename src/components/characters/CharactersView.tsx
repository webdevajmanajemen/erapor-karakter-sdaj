import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  BookOpen,
  Leaf,
  Atom,
  AlertCircle
} from 'lucide-react';
import {
  CharacterCategory,
  SubCharacter,
  CharacterIndicator,
  GradeOption
} from '../../types';
import { Modal } from '../ui/Modal';
import { useToast } from '../../context/ToastContext';

interface CharactersViewProps {
  subCharacters: SubCharacter[];
  indicators: CharacterIndicator[];
  gradeOptions: GradeOption[];
  onSaveSubCharacter: (sub: SubCharacter) => void;
  onDeleteSubCharacter: (subId: string) => void;
  onSaveIndicator: (ind: CharacterIndicator) => void;
  onDeleteIndicator: (indId: string) => void;
  onSaveGradeOptions?: (grades: GradeOption[]) => void;
}

export function CharactersView({
  subCharacters,
  indicators,
  gradeOptions,
  onSaveSubCharacter,
  onDeleteSubCharacter,
  onSaveIndicator,
  onDeleteIndicator,
  onSaveGradeOptions
}: CharactersViewProps) {
  const { success, error } = useToast();

  const [activeCategory, setActiveCategory] = useState<CharacterCategory>('ISLAM');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>(1);

  // Sub Character Modal
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCharacter | null>(null);
  const [subName, setSubName] = useState('');

  // Indicator Modal
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<CharacterIndicator | null>(null);
  const [indicatorSubId, setIndicatorSubId] = useState('');
  const [indicatorLevel, setIndicatorLevel] = useState<number>(1);
  const [indicatorName, setIndicatorName] = useState('');
  const [indicatorPrefixA, setIndicatorPrefixA] = useState('');
  const [indicatorPrefixB, setIndicatorPrefixB] = useState('');
  const [indicatorPrefixC, setIndicatorPrefixC] = useState('');

  // Delete Confirm

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'sub' | 'indicator'; id: string; name: string } | null>(null);

  const categories: { id: CharacterCategory; title: string; subtitle: string; icon: React.ReactNode; color: string; badgeColor: string }[] = [
    {
      id: 'ISLAM',
      title: 'Karakter Islam',
      subtitle: 'Akidah, Ibadah, dan Akhlak Mulia',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'bg-blue-600',
      badgeColor: 'border-blue-600 bg-blue-50 text-blue-800'
    },
    {
      id: 'ALAM',
      title: 'Karakter Alam',
      subtitle: 'Disiplin, Mandiri, dan Tanggung Jawab',
      icon: <Leaf className="w-5 h-5" />,
      color: 'bg-emerald-600',
      badgeColor: 'border-emerald-600 bg-emerald-50 text-emerald-800'
    },
    {
      id: 'SAINS',
      title: 'Karakter Sains',
      subtitle: 'Kritis, Analitis, dan Komunikatif',
      icon: <Atom className="w-5 h-5" />,
      color: 'bg-amber-500',
      badgeColor: 'border-amber-500 bg-amber-50 text-amber-900'
    }
  ];

  const currentSubs = subCharacters
    .filter(s => s.categoryId === activeCategory)
    .sort((a, b) => a.order - b.order);

  // Sub character handlers
  const handleOpenAddSub = () => {
    setEditingSub(null);
    setSubName('');
    setIsSubModalOpen(true);
  };

  const handleOpenEditSub = (sub: SubCharacter) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setIsSubModalOpen(true);
  };

  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) {
      error('Nama sub karakter tidak boleh kosong.');
      return;
    }
    const sub: SubCharacter = {
      id: editingSub ? editingSub.id : 'sub-' + activeCategory.toLowerCase()[0] + '-' + Date.now(),
      categoryId: activeCategory,
      name: subName.trim(),
      order: editingSub ? editingSub.order : currentSubs.length + 1
    };
    onSaveSubCharacter(sub);
    success('Sub Karakter Disimpan', `Sub karakter "${subName}" berhasil disimpan.`);
    setIsSubModalOpen(false);
  };

  // Indicator handlers
  const handleOpenAddIndicator = (subId?: string) => {
    setEditingIndicator(null);
    setIndicatorSubId(subId || currentSubs[0]?.id || '');
    setIndicatorLevel(typeof selectedLevel === 'number' ? selectedLevel : 1);
    setIndicatorName('');
    setIndicatorPrefixA('');
    setIndicatorPrefixB('');
    setIndicatorPrefixC('');
    setIsIndicatorModalOpen(true);
  };

  const handleOpenEditIndicator = (ind: CharacterIndicator) => {
    setEditingIndicator(ind);
    setIndicatorSubId(ind.subCharacterId);
    setIndicatorLevel(ind.level || 1);
    setIndicatorName(ind.name);
    setIndicatorPrefixA(ind.descriptionPrefixA ?? ind.defaultDescriptionPrefix ?? '');
    setIndicatorPrefixB(ind.descriptionPrefixB ?? ind.defaultDescriptionPrefix ?? '');
    setIndicatorPrefixC(ind.descriptionPrefixC ?? ind.defaultDescriptionPrefix ?? '');
    setIsIndicatorModalOpen(true);
  };

  const handleSaveIndicator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicatorName.trim() || !indicatorSubId) {
      error('Lengkapi nama indikator dan pilih sub karakter.');
      return;
    }

    const prefixA = indicatorPrefixA.trim();
    const prefixB = indicatorPrefixB.trim();
    const prefixC = indicatorPrefixC.trim();
    const fallbackDefault = prefixA || prefixB || prefixC || 'Ananda mampu menunjukkan...';

    const ind: CharacterIndicator = {
      id: editingIndicator ? editingIndicator.id : 'ind-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      categoryId: activeCategory,
      subCharacterId: indicatorSubId,
      level: Number(indicatorLevel) || 1,
      name: indicatorName.trim(),
      defaultDescriptionPrefix: fallbackDefault,
      descriptionPrefixA: prefixA || fallbackDefault,
      descriptionPrefixB: prefixB || fallbackDefault,
      descriptionPrefixC: prefixC || fallbackDefault,
      order: editingIndicator ? editingIndicator.order : indicators.length + 1
    };
    onSaveIndicator(ind);
    success('Indikator Disimpan', `Indikator untuk Level ${ind.level} berhasil disimpan.`);
    setIsIndicatorModalOpen(false);
  };

  const handleDeleteItem = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'sub') {
      onDeleteSubCharacter(deleteConfirm.id);
      success('Sub Karakter Dihapus', `Sub karakter "${deleteConfirm.name}" beserta indikator di bawahnya telah dihapus.`);
    } else {
      onDeleteIndicator(deleteConfirm.id);
      success('Indikator Dihapus', `Indikator "${deleteConfirm.name}" telah dihapus.`);
    }
    setDeleteConfirm(null);
  };

  return (

    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Master Karakter & Indikator
            </h2>
            <p className="text-xs text-slate-500">
              Hierarki: Nama Karakter → Sub Karakter → Indikator Perkembangan → Nilai (A/B/C) → Awal Deskripsi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleOpenAddIndicator()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Indikator
          </button>
        </div>
      </div>


      {/* 3 Main Character Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map(cat => {
          const isActive = activeCategory === cat.id;
          const subCount = subCharacters.filter(s => s.categoryId === cat.id).length;
          const indCount = indicators.filter(i => i.categoryId === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl text-white flex items-center justify-center ${cat.color} shadow-xs`}
                >
                  {cat.icon}
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {indCount} Indikator
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 text-base">{cat.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{cat.subtitle}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>{subCount} Sub Karakter</span>
                <span className="text-blue-600 font-bold flex items-center gap-1">
                  Kelola <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>

              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Level Selector Bar (Tingkat Level 1 - 6) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Pilih Tingkat Level Kelas:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(lvl => {
              const count = indicators.filter(
                i => i.categoryId === activeCategory && (i.level || 1) === lvl
              ).length;
              const isSelected = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Level {lvl} <span className="opacity-75 font-normal">({count})</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedLevel('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedLevel === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Level ({indicators.filter(i => i.categoryId === activeCategory).length})
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/60 self-start md:self-auto">
          Menampilkan indikator:{' '}
          <strong className="text-blue-900 font-bold">
            {selectedLevel === 'all'
              ? 'Seluruh Level (Tingkat 1 - 6)'
              : `Level ${selectedLevel} (Fokus Kelas ${selectedLevel})`}
          </strong>
        </div>
      </div>

      {/* Sub Characters and Indicators List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Sub Karakter & Indikator: {categories.find(c => c.id === activeCategory)?.title}
            </h3>
            <p className="text-xs text-slate-500">
              Daftar indikator perkembangan karakter yang menjadi acuan penilaian rapor
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddSub}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Sub Karakter
          </button>
        </div>

        {currentSubs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 text-slate-400">
            Belum ada sub karakter untuk kategori ini. Klik "Tambah Sub Karakter" untuk memulai.
          </div>
        ) : (
          currentSubs.map((sub, sIdx) => {
            const subInds = indicators
              .filter(
                i =>
                  i.subCharacterId === sub.id &&
                  (selectedLevel === 'all' || (i.level || 1) === selectedLevel)
              )
              .sort((a, b) => a.order - b.order);

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
              >
                {/* Sub Character Header Bar */}
                <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {sub.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {subInds.length} indikator aktif {selectedLevel !== 'all' ? `(Level ${selectedLevel})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenAddIndicator(sub.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Indikator
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditSub(sub)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-200/60"
                      title="Edit Sub Karakter"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'sub', id: sub.id, name: sub.name })}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                      title="Hapus Sub Karakter"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Indicators Table */}
                <div className="divide-y divide-slate-100">
                  {subInds.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      Belum ada indikator untuk sub karakter ini pada {selectedLevel === 'all' ? 'kategori ini' : `Level ${selectedLevel}`}. Klik "+ Indikator" untuk menambahkan.
                    </div>
                  ) : (
                    subInds.map((ind, indIdx) => (
                      <div
                        key={ind.id}
                        className="p-4 sm:px-6 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-400 mt-0.5">
                            {sIdx + 1}.{indIdx + 1}
                          </span>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black shrink-0">
                                Level {ind.level || 1}
                              </span>
                              <p className="font-semibold text-slate-900 leading-snug">
                                {ind.name}
                              </p>
                            </div>
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="font-black text-[10px] uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 shrink-0">
                                  Awal Deskripsi A:
                                </span>
                                <span className="italic text-slate-600 line-clamp-1">
                                  "{ind.descriptionPrefixA || ind.defaultDescriptionPrefix}"
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="font-black text-[10px] uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80 shrink-0">
                                  Awal Deskripsi B:
                                </span>
                                <span className="italic text-slate-600 line-clamp-1">
                                  "{ind.descriptionPrefixB || ind.defaultDescriptionPrefix}"
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="font-black text-[10px] uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 shrink-0">
                                  Awal Deskripsi C:
                                </span>
                                <span className="italic text-slate-600 line-clamp-1">
                                  "{ind.descriptionPrefixC || ind.defaultDescriptionPrefix}"
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditIndicator(ind)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Edit Indikator & Deskripsi Nilai"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ type: 'indicator', id: ind.id, name: ind.name })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Indikator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Sub Character */}
      <Modal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        title={editingSub ? 'Edit Sub Karakter' : 'Tambah Sub Karakter'}
        subtitle={`Kategori: ${categories.find(c => c.id === activeCategory)?.title}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveSub} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Sub Karakter <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={subName}
              onChange={e => setSubName(e.target.value)}
              placeholder="Contoh: Teguh Berakidah, Disiplin, dsb."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
            >
              Simpan Sub Karakter
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add / Edit Indicator & Deskripsi Nilai */}
      <Modal
        isOpen={isIndicatorModalOpen}
        onClose={() => setIsIndicatorModalOpen(false)}
        title={editingIndicator ? 'Edit Indikator Karakter' : 'Tambah Indikator Baru'}
        subtitle={`Kategori: ${categories.find(c => c.id === activeCategory)?.title}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveIndicator} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sub Karakter Induk <span className="text-rose-500">*</span>
              </label>
              <select
                value={indicatorSubId}
                onChange={e => setIndicatorSubId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentSubs.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tingkat Level Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={indicatorLevel}
                onChange={e => setIndicatorLevel(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Level 1 (Kelas 1 - Fase A)</option>
                <option value={2}>Level 2 (Kelas 2 - Fase A)</option>
                <option value={3}>Level 3 (Kelas 3 - Fase B)</option>
                <option value={4}>Level 4 (Kelas 4 - Fase B)</option>
                <option value={5}>Level 5 (Kelas 5 - Fase C)</option>
                <option value={6}>Level 6 (Kelas 6 - Fase C)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pernyataan Indikator Karakter <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={indicatorName}
              onChange={e => setIndicatorName(e.target.value)}
              placeholder="Contoh: Meyakini Allah SWT sebagai Tuhan Yang Maha Esa dan mengamalkan rukun iman."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[11px]">A</span>
                Awal Deskripsi Nilai A (Berkembang Sangat Baik)
              </label>
              <textarea
                rows={2}
                value={indicatorPrefixA}
                onChange={e => setIndicatorPrefixA(e.target.value)}
                placeholder="Contoh: Ananda senantiasa menunjukkan keyakinan mantap dan konsisten secara mandiri..."
                className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[11px]">B</span>
                Awal Deskripsi Nilai B (Berkembang Sesuai Harapan)
              </label>
              <textarea
                rows={2}
                value={indicatorPrefixB}
                onChange={e => setIndicatorPrefixB(e.target.value)}
                placeholder="Contoh: Ananda menunjukkan perkembangan sesuai harapan dan membiasakan..."
                className="w-full px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[11px]">C</span>
                Awal Deskripsi Nilai C (Perlu Bimbingan)
              </label>
              <textarea
                rows={2}
                value={indicatorPrefixC}
                onChange={e => setIndicatorPrefixC(e.target.value)}
                placeholder="Contoh: Ananda masih memerlukan bimbingan dan pendampingan dalam..."
                className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Ketiga Awal Deskripsi ini otomatis menyesuaikan ketika guru memilih nilai predikat A, B, atau C pada menu Penilaian Karakter.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsIndicatorModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
            >
              Simpan Indikator
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Confirmation Modal */}

      <Modal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title={`Hapus ${deleteConfirm?.type === 'sub' ? 'Sub Karakter' : 'Indikator'}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <p className="text-sm font-semibold text-slate-800">
              Apakah Anda yakin ingin menghapus "{deleteConfirm?.name}"?
            </p>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteItem}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
