import {
  SchoolProfile,
  ClassItem,
  Teacher,
  Student,
  SubCharacter,
  CharacterIndicator,
  GradeOption,
  UserAccount,
  AssessmentRecord,
  ActivityLog
} from '../types';

export const INITIAL_SCHOOL_PROFILE: SchoolProfile = {
  name: 'SD ISLAM ALAM & SAINS AL-JANNAH',
  npsn: '20228891',
  phase: 'Fase A, B, dan C',
  level: 'Sekolah Dasar (SD)',
  address: 'Jl. Jambore Raya No. 4, Pondok Ranggon, Harjamukti',
  village: 'Harjamukti',
  district: 'Cimanggis',
  city: 'Kota Depok',
  province: 'Jawa Barat',
  phone: '(021) 8731111 / 8730999',
  email: 'info@sekolah-aljannah.sch.id',
  website: 'www.sekolah-aljannah.sch.id',
  logoUrl: '/assets/aistudio/logo-AJ-rapor_c08ed6e7.png',
  headmasterName: 'Hj. Siti Aminah, S.Pd., M.M.',
  headmasterNip: '19780512 200501 2 004',
  activeAcademicYear: '2026/2027',
  activeSemester: '1',
  titiMangsaSemester1: {
    day: '19',
    month: 'Desember',
    year: '2026'
  },
  titiMangsaSemester2: {
    day: '19',
    month: 'Juni',
    year: '2027'
  }
};

export const INITIAL_CLASSES: ClassItem[] = [
  { id: 'c-1a', name: '1A', level: 1, phase: 'Fase A', homeroomTeacherId: 't-1' },
  { id: 'c-1b', name: '1B', level: 1, phase: 'Fase A', homeroomTeacherId: 't-2' },
  { id: 'c-2a', name: '2A', level: 2, phase: 'Fase A', homeroomTeacherId: 't-3' },
  { id: 'c-2b', name: '2B', level: 2, phase: 'Fase A', homeroomTeacherId: 't-4' },
  { id: 'c-3a', name: '3A', level: 3, phase: 'Fase B', homeroomTeacherId: 't-5' },
  { id: 'c-4a', name: '4A', level: 4, phase: 'Fase B' },
  { id: 'c-5a', name: '5A', level: 5, phase: 'Fase C' },
  { id: 'c-6a', name: '6A', level: 6, phase: 'Fase C' },
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 't-1',
    code: 'KG001',
    name: 'Ahmad Fauzi, S.Pd.I.',
    gender: 'L',
    role: 'Wali Kelas',
    assignedClass: '1A',
    teachingClass: '1A',
    phone: '081234567891',
    email: 'ahmad.fauzi@sekolah-aljannah.sch.id'
  },
  {
    id: 't-2',
    code: 'KG002',
    name: 'Nur Azizah, S.Pd.',
    gender: 'P',
    role: 'Wali Kelas',
    assignedClass: '1B',
    teachingClass: '1B',
    phone: '081234567892',
    email: 'nur.azizah@sekolah-aljannah.sch.id'
  },
  {
    id: 't-3',
    code: 'KG003',
    name: 'Rahmat Hidayat, S.Si.',
    gender: 'L',
    role: 'Wali Kelas',
    assignedClass: '2A',
    teachingClass: '2A',
    phone: '081234567893',
    email: 'rahmat.hidayat@sekolah-aljannah.sch.id'
  },
  {
    id: 't-4',
    code: 'KG004',
    name: 'Fatimah Zahra, S.Pd.',
    gender: 'P',
    role: 'Wali Kelas',
    assignedClass: '2B',
    teachingClass: '2B',
    phone: '081234567894',
    email: 'fatimah.zahra@sekolah-aljannah.sch.id'
  },
  {
    id: 't-5',
    code: 'KG005',
    name: 'Budi Santoso, M.Pd.',
    gender: 'L',
    role: 'Wali Kelas',
    assignedClass: '3A',
    teachingClass: '3A',
    phone: '081234567895',
    email: 'budi.santoso@sekolah-aljannah.sch.id'
  },
  {
    id: 't-6',
    code: 'KG006',
    name: 'Dewi Sartika, S.Si.',
    gender: 'P',
    role: 'Guru Bidang',
    assignedClass: '',
    teachingClass: 'Semua Kelas',
    phone: '081234567896',
    email: 'dewi.sartika@sekolah-aljannah.sch.id'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-1',
    nis: '26270101',
    nisn: '0019283741',
    name: 'Muhammad Rayyan Al-Ghifari',
    gender: 'L',
    status: 'Reguler',
    className: '1A',
    parentName: 'Hendri Gunawan, S.T.',
    notes: 'Aktif, daya ingat tinggi, sangat menyukai sains'
  },
  {
    id: 's-2',
    nis: '26270102',
    nisn: '0019283742',
    name: 'Aisyah Humaira Putri',
    gender: 'P',
    status: 'Reguler',
    className: '1A',
    parentName: 'Dr. Ir. Bambang Irawan',
    notes: 'Santun, mandiri, dan gemar membaca'
  },
  {
    id: 's-3',
    nis: '26270103',
    nisn: '0019283743',
    name: 'Bilal Habibi Ramadhan',
    gender: 'L',
    status: 'Inklusi',
    className: '1A',
    parentName: 'Sugiono Purnomo',
    notes: 'Memerlukan bimbingan fokus motorik halus'
  },
  {
    id: 's-4',
    nis: '26270104',
    nisn: '0019283744',
    name: 'Khodijah Azzahra',
    gender: 'P',
    status: 'Reguler',
    className: '1A',
    parentName: 'M. Syafiq Robbani',
    notes: 'Kreatif dan memiliki rasa kepedulian tinggi'
  },
  {
    id: 's-5',
    nis: '26270105',
    nisn: '0019283745',
    name: 'Zaid bin Tsabit',
    gender: 'L',
    status: 'Reguler',
    className: '1A',
    parentName: 'Fachry Nurul Huda',
    notes: 'Sangat teliti dalam observasi alam'
  },
  {
    id: 's-6',
    nis: '26270106',
    nisn: '0019283746',
    name: 'Fathiya Kayla Az-Zahra',
    gender: 'P',
    status: 'Reguler',
    className: '1B',
    parentName: 'Rudi Hartono, M.Si.',
    notes: 'Tertib dan cepat memahami instruksi'
  },
  {
    id: 's-7',
    nis: '26270107',
    nisn: '0019283747',
    name: 'Kenzo Alvaro Pratama',
    gender: 'L',
    status: 'Reguler',
    className: '1B',
    parentName: 'Deni Kurniawan',
    notes: 'Aktif bertanya dan kritis'
  },
  {
    id: 's-8',
    nis: '26270108',
    nisn: '0019283748',
    name: 'Zahra Syabila Medina',
    gender: 'P',
    status: 'Inklusi',
    className: '1B',
    parentName: 'H. Lukman Hakim',
    notes: 'Pendampingan interaksi sosial kelompok'
  },
  {
    id: 's-9',
    nis: '25260201',
    nisn: '0029384751',
    name: 'Al-Farabi Malik Ibrahim',
    gender: 'L',
    status: 'Reguler',
    className: '2A',
    parentName: 'Hasan Basri, S.Kom.',
    notes: 'Tertarik eksperimen fisika sederhana'
  },
  {
    id: 's-10',
    nis: '25260202',
    nisn: '0029384752',
    name: 'Maryam Salimah',
    gender: 'P',
    status: 'Reguler',
    className: '2A',
    parentName: 'Dra. Endang Sulastri',
    notes: 'Rajin beribadah dan disiplin'
  }
];

export const INITIAL_SUB_CHARACTERS: SubCharacter[] = [
  // ISLAM
  { id: 'sub-i-1', categoryId: 'ISLAM', name: 'Teguh Berakidah', order: 1 },
  { id: 'sub-i-2', categoryId: 'ISLAM', name: 'Taat Beribadah', order: 2 },
  { id: 'sub-i-3', categoryId: 'ISLAM', name: 'Berakhlak Mulia', order: 3 },

  // ALAM
  { id: 'sub-a-1', categoryId: 'ALAM', name: 'Disiplin', order: 1 },
  { id: 'sub-a-2', categoryId: 'ALAM', name: 'Mandiri', order: 2 },
  { id: 'sub-a-3', categoryId: 'ALAM', name: 'Bertanggung Jawab', order: 3 },

  // SAINS
  { id: 'sub-s-1', categoryId: 'SAINS', name: 'Kritis', order: 1 },
  { id: 'sub-s-2', categoryId: 'SAINS', name: 'Analitis', order: 2 },
  { id: 'sub-s-3', categoryId: 'SAINS', name: 'Komunikatif', order: 3 }
];

export const INITIAL_INDICATORS: CharacterIndicator[] = [
  // ==================== LEVEL 1 ====================
  // KARAKTER ISLAM (Warna Biru) - Level 1
  {
    id: 'ind-i-1-1',
    subCharacterId: 'sub-i-1',
    categoryId: 'ISLAM',
    level: 1,
    name: 'Meyakini Allah SWT sebagai Tuhan Yang Maha Esa dan mengamalkan rukun iman.',
    defaultDescriptionPrefix: 'Ananda senantiasa menunjukkan keyakinan mantap kepada Allah SWT dan mengamalkan nilai-nilai keimanan.',
    descriptionPrefixA: 'Ananda senantiasa menunjukkan keyakinan mantap kepada Allah SWT dan mengamalkan nilai-nilai keimanan.',
    descriptionPrefixB: 'Ananda menunjukkan keyakinan kepada Allah SWT dan mulai membiasakan nilai-nilai keimanan sesuai harapan.',
    descriptionPrefixC: 'Ananda masih memerlukan bimbingan dalam menumbuhkan keyakinan dan mengamalkan nilai-nilai keimanan.',
    order: 1
  },
  {
    id: 'ind-i-2-1',
    subCharacterId: 'sub-i-2',
    categoryId: 'ISLAM',
    level: 1,
    name: 'Melaksanakan ibadah wajib serta membiasakan doa harian secara tertib dan khusyuk.',
    defaultDescriptionPrefix: 'Ananda konsisten menjalankan salat berjamaah tepat waktu serta khusyuk melafalkan doa-doa harian.',
    descriptionPrefixA: 'Ananda konsisten menjalankan salat berjamaah tepat waktu serta khusyuk melafalkan doa-doa harian.',
    descriptionPrefixB: 'Ananda melaksanakan ibadah wajib dan doa harian dengan tertib sesuai arahan guru.',
    descriptionPrefixC: 'Ananda perlu pendampingan berkala agar lebih tertib dan khusyuk dalam beribadah serta berdoa.',
    order: 2
  },
  {
    id: 'ind-i-3-1',
    subCharacterId: 'sub-i-3',
    categoryId: 'ISLAM',
    level: 1,
    name: 'Menghormati guru, orang tua, dan bersikap santun serta peduli terhadap sesama.',
    defaultDescriptionPrefix: 'Ananda bersikap santun, takzim kepada guru dan orang tua, serta suka menolong rekan sebaya.',
    descriptionPrefixA: 'Ananda bersikap santun, takzim kepada guru dan orang tua, serta suka menolong rekan sebaya.',
    descriptionPrefixB: 'Ananda bersikap sopan kepada guru serta ramah dan peduli terhadap teman sekelas.',
    descriptionPrefixC: 'Ananda memerlukan bimbingan dalam membiasakan tutur kata santun dan kepedulian kepada sesama.',
    order: 3
  },

  // KARAKTER ALAM (Warna Hijau) - Level 1
  {
    id: 'ind-a-1-1',
    subCharacterId: 'sub-a-1',
    categoryId: 'ALAM',
    level: 1,
    name: 'Mematuhi tata tertib sekolah, hadir tepat waktu, dan tertib beraktivitas.',
    defaultDescriptionPrefix: 'Ananda mematuhi seluruh kesepakatan kelas dengan kesadaran tinggi dan selalu hadir tepat waktu.',
    descriptionPrefixA: 'Ananda mematuhi seluruh kesepakatan kelas dengan kesadaran tinggi dan selalu hadir tepat waktu.',
    descriptionPrefixB: 'Ananda mematuhi tata tertib kelas dan hadir tepat waktu sesuai ketentuan sekolah.',
    descriptionPrefixC: 'Ananda masih memerlukan pengingat untuk disiplin mematuhi tata tertib dan datang tepat waktu.',
    order: 1
  },
  {
    id: 'ind-a-2-1',
    subCharacterId: 'sub-a-2',
    categoryId: 'ALAM',
    level: 1,
    name: 'Melaksanakan tugas dan menyiapkan perlengkapan belajar secara mandiri.',
    defaultDescriptionPrefix: 'Ananda mampu mengelola perlengkapan belajarnya secara tertib dan menuntaskan tugas tanpa bergantung pada orang lain.',
    descriptionPrefixA: 'Ananda mampu mengelola perlengkapan belajarnya secara tertib dan menuntaskan tugas tanpa bergantung pada orang lain.',
    descriptionPrefixB: 'Ananda dapat menyiapkan perlengkapan belajar serta menyelesaikan tugasnya dengan baik.',
    descriptionPrefixC: 'Ananda masih perlu pendampingan untuk menyiapkan perlengkapan dan menuntaskan tugas secara mandiri.',
    order: 2
  },
  {
    id: 'ind-a-3-1',
    subCharacterId: 'sub-a-3',
    categoryId: 'ALAM',
    level: 1,
    name: 'Menjaga kebersihan lingkungan alam serta merawat fasilitas sekolah.',
    defaultDescriptionPrefix: 'Ananda sangat peduli terhadap kebersihan lingkungan sekitar dan bertanggung jawab merawat perlengkapan bersama.',
    descriptionPrefixA: 'Ananda sangat peduli terhadap kebersihan lingkungan sekitar dan bertanggung jawab merawat perlengkapan bersama.',
    descriptionPrefixB: 'Ananda turut menjaga kebersihan lingkungan kelas dan merawat fasilitas sekolah dengan baik.',
    descriptionPrefixC: 'Ananda perlu dibiasakan kembali untuk menjaga kebersihan sekitar dan merawat barang bersama.',
    order: 3
  },

  // KARAKTER SAINS (Warna Oren/Kuning) - Level 1
  {
    id: 'ind-s-1-1',
    subCharacterId: 'sub-s-1',
    categoryId: 'SAINS',
    level: 1,
    name: 'Mengajukan pertanyaan kritis dan menunjukkan rasa ingin tahu terhadap fenomena sekitar.',
    defaultDescriptionPrefix: 'Ananda aktif mengajukan pertanyaan mendalam berdasarkan hasil observasi dan fenomena sains di sekitarnya.',
    descriptionPrefixA: 'Ananda aktif mengajukan pertanyaan mendalam berdasarkan hasil observasi dan fenomena sains di sekitarnya.',
    descriptionPrefixB: 'Ananda menunjukkan rasa ingin tahu yang baik dan bertanya saat mengamati fenomena alam.',
    descriptionPrefixC: 'Ananda memerlukan stimulus dan dorongan agar lebih berani bertanya saat kegiatan observasi sains.',
    order: 1
  },
  {
    id: 'ind-s-2-1',
    subCharacterId: 'sub-s-2',
    categoryId: 'SAINS',
    level: 1,
    name: 'Mengidentifikasi informasi dan mengelompokkan data pengamatan secara analitis.',
    defaultDescriptionPrefix: 'Ananda cermat menganalisis hubungan antar-informasi serta mampu menarik kesimpulan logis dari data eksperimen.',
    descriptionPrefixA: 'Ananda cermat menganalisis hubungan antar-informasi serta mampu menarik kesimpulan logis dari data eksperimen.',
    descriptionPrefixB: 'Ananda mampu mengidentifikasi informasi dasar dan mengelompokkan hasil pengamatan dengan tepat.',
    descriptionPrefixC: 'Ananda masih memerlukan bimbingan dalam mengelompokkan data dan menyimpulkan hasil pengamatan.',
    order: 2
  },
  {
    id: 'ind-s-3-1',
    subCharacterId: 'sub-s-3',
    categoryId: 'SAINS',
    level: 1,
    name: 'Menyampaikan ide, gagasan ilmiah, dan karya secara jelas serta komunikatif.',
    defaultDescriptionPrefix: 'Ananda percaya diri mempresentasikan ide dan hasil temuan eksperimen dengan bahasa yang santun dan runtut.',
    descriptionPrefixA: 'Ananda percaya diri mempresentasikan ide dan hasil temuan eksperimen dengan bahasa yang santun dan runtut.',
    descriptionPrefixB: 'Ananda mampu menyampaikan ide dan hasil karyanya dengan cukup jelas di hadapan teman.',
    descriptionPrefixC: 'Ananda perlu motivasi dan latihan agar lebih percaya diri saat mengomunikasikan gagasannya.',
    order: 3
  },

  // ==================== LEVEL 2 ====================
  {
    id: 'ind-i-1-2',
    subCharacterId: 'sub-i-1',
    categoryId: 'ISLAM',
    level: 2,
    name: 'Mengenal Asmaul Husna dan menerapkan akhlak bersyukur dalam kehidupan sehari-hari.',
    defaultDescriptionPrefix: 'Ananda mampu melafalkan Asmaul Husna dengan baik serta terbiasa mengucapkan syukur dalam setiap kesempatan.',
    descriptionPrefixA: 'Ananda mampu melafalkan Asmaul Husna dengan baik serta terbiasa mengucapkan syukur dalam setiap kesempatan.',
    descriptionPrefixB: 'Ananda mengenal Asmaul Husna dan membiasakan sikap bersyukur sesuai harapan.',
    descriptionPrefixC: 'Ananda masih memerlukan bimbingan dalam melafalkan Asmaul Husna dan membiasakan rasa syukur.',
    order: 1
  },
  {
    id: 'ind-i-2-2',
    subCharacterId: 'sub-i-2',
    categoryId: 'ISLAM',
    level: 2,
    name: 'Membiasakan wudhu dengan tertib dan menghafal surat-surat pendek Juz Amma.',
    defaultDescriptionPrefix: 'Ananda tertib berwudhu sesuai rukunnya dan lancar dalam setoran hafalan surat-surat pendek.',
    descriptionPrefixA: 'Ananda tertib berwudhu sesuai rukunnya dan lancar dalam setoran hafalan surat-surat pendek.',
    descriptionPrefixB: 'Ananda berwudhu dengan cukup tertib dan mengikuti hafalan surat-surat pendek dengan baik.',
    descriptionPrefixC: 'Ananda perlu pendampingan untuk menyempurnakan tata cara wudhu serta murojaah hafalan surat pendek.',
    order: 2
  },
  {
    id: 'ind-i-3-2',
    subCharacterId: 'sub-i-3',
    categoryId: 'ISLAM',
    level: 2,
    name: 'Menunjukkan sikap ramah, empati, dan tolong-menolong terhadap teman di kelas.',
    defaultDescriptionPrefix: 'Ananda menunjukkan rasa empati yang tinggi dan sigap membantu teman yang memerlukan bantuan.',
    descriptionPrefixA: 'Ananda menunjukkan rasa empati yang tinggi dan sigap membantu teman yang memerlukan bantuan.',
    descriptionPrefixB: 'Ananda bersikap ramah dan mau menolong teman sekelas dengan baik.',
    descriptionPrefixC: 'Ananda perlu arahan dalam menumbuhkan kepekaan dan sikap tolong-menolong terhadap teman.',
    order: 3
  },
  {
    id: 'ind-a-1-2',
    subCharacterId: 'sub-a-1',
    categoryId: 'ALAM',
    level: 2,
    name: 'Menunjukkan ketertiban diri dalam belajar di dalam kelas maupun kegiatan luar ruangan.',
    defaultDescriptionPrefix: 'Ananda selalu tertib dan memperhatikan arahan guru saat kegiatan pembelajaran alam terbuka.',
    descriptionPrefixA: 'Ananda selalu tertib dan memperhatikan arahan guru saat kegiatan pembelajaran alam terbuka.',
    descriptionPrefixB: 'Ananda mengikuti pembelajaran di kelas dan luar ruangan dengan tertib sesuai arahan.',
    descriptionPrefixC: 'Ananda masih membutuhkan pendampingan agar tetap fokus dan tertib selama kegiatan luar ruangan.',
    order: 1
  },
  {
    id: 'ind-a-2-2',
    subCharacterId: 'sub-a-2',
    categoryId: 'ALAM',
    level: 2,
    name: 'Merawat tanaman dan menunjukkan kebiasaan membuang sampah pada tempatnya.',
    defaultDescriptionPrefix: 'Ananda memiliki kepedulian nyata dengan rajin menyiram tanaman kelas dan memilah sampah.',
    descriptionPrefixA: 'Ananda memiliki kepedulian nyata dengan rajin menyiram tanaman kelas dan memilah sampah.',
    descriptionPrefixB: 'Ananda terbiasa membuang sampah pada tempatnya dan turut merawat tanaman kelas.',
    descriptionPrefixC: 'Ananda perlu pengingat rutin untuk membuang sampah pada tempatnya dan merawat tanaman.',
    order: 2
  },
  {
    id: 'ind-a-3-2',
    subCharacterId: 'sub-a-3',
    categoryId: 'ALAM',
    level: 2,
    name: 'Menjaga dan merapikan kembali buku perpustakaan serta alat peraga sains setelah digunakan.',
    defaultDescriptionPrefix: 'Ananda bertanggung jawab mengembalikan perlengkapan belajar ke tempat semula secara rapi.',
    descriptionPrefixA: 'Ananda bertanggung jawab mengembalikan perlengkapan belajar ke tempat semula secara rapi.',
    descriptionPrefixB: 'Ananda merapikan buku dan alat peraga setelah digunakan dengan cukup baik.',
    descriptionPrefixC: 'Ananda masih perlu diingatkan untuk merapikan kembali buku serta alat peraga setelah belajar.',
    order: 3
  },
  {
    id: 'ind-s-1-2',
    subCharacterId: 'sub-s-1',
    categoryId: 'SAINS',
    level: 2,
    name: 'Mengeksplorasi lingkungan dan mengamati perbedaan karakteristik benda hidup dan tak hidup.',
    defaultDescriptionPrefix: 'Ananda antusias melakukan observasi lingkungan dan menemukan ciri-ciri makhluk hidup di sekitarnya.',
    descriptionPrefixA: 'Ananda antusias melakukan observasi lingkungan dan menemukan ciri-ciri makhluk hidup di sekitarnya.',
    descriptionPrefixB: 'Ananda dapat mengamati dan membedakan karakteristik benda hidup dan tak hidup dengan baik.',
    descriptionPrefixC: 'Ananda memerlukan bimbingan dalam mengidentifikasi ciri-ciri benda hidup dan tak hidup.',
    order: 1
  },
  {
    id: 'ind-s-2-2',
    subCharacterId: 'sub-s-2',
    categoryId: 'SAINS',
    level: 2,
    name: 'Mencatat hasil percobaan sederhana dan membuat kesimpulan ringkas dengan bimbingan.',
    defaultDescriptionPrefix: 'Ananda mampu menuliskan catatan pengamatan eksperimen dengan runut dan rapi.',
    descriptionPrefixA: 'Ananda mampu menuliskan catatan pengamatan eksperimen dengan runut dan rapi.',
    descriptionPrefixB: 'Ananda mencatat hasil percobaan sederhana dan menyimpulkan temuan dengan bimbingan.',
    descriptionPrefixC: 'Ananda masih perlu pendampingan dalam menuliskan catatan percobaan dan menarik kesimpulan.',
    order: 2
  },
  {
    id: 'ind-s-3-2',
    subCharacterId: 'sub-s-3',
    categoryId: 'SAINS',
    level: 2,
    name: 'Menceritakan kembali alur kerja eksperimen dan penemuannya dengan percaya diri.',
    defaultDescriptionPrefix: 'Ananda cakap mengutarakan pengalaman bereksperimen dengan bahasa lisan yang santun dan lugas.',
    descriptionPrefixA: 'Ananda cakap mengutarakan pengalaman bereksperimen dengan bahasa lisan yang santun dan lugas.',
    descriptionPrefixB: 'Ananda dapat menceritakan kembali langkah percobaan sederhana dengan cukup jelas.',
    descriptionPrefixC: 'Ananda perlu dorongan lebih agar berani menceritakan hasil eksperimennya di depan kelas.',
    order: 3
  }
];

export const INITIAL_GRADE_OPTIONS: GradeOption[] = [
  {
    code: 'A',
    label: 'Berkembang Sangat Baik',
    description: 'Siswa secara konsisten dan mandiri menunjukkan indikator karakter tersebut melampaui harapan usia.'
  },
  {
    code: 'B',
    label: 'Berkembang Sesuai Harapan',
    description: 'Siswa mampu menunjukkan indikator karakter tersebut secara konsisten sesuai capaian tahap perkembangannya.'
  },
  {
    code: 'C',
    label: 'Perlu Bimbingan',
    description: 'Siswa masih memerlukan pendampingan dan stimulus dari guru/orang tua dalam menumbuhkan indikator karakter tersebut.'
  }
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'u-admin',
    username: 'webdevaj',
    password: '@w3bd3vAJ',
    name: 'Administrator',
    role: 'admin'
  },
  {
    id: 'u-wali-1a',
    username: 'ahmad.fauzi',
    name: 'Ahmad Fauzi, S.Pd.I. (Wali Kelas 1A)',
    role: 'teacher',
    teacherId: 't-1'
  },
  {
    id: 'u-wali-1b',
    username: 'nur.azizah',
    name: 'Nur Azizah, S.Pd. (Wali Kelas 1B)',
    role: 'teacher',
    teacherId: 't-2'
  }
];

export const INITIAL_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: 'as-1',
    studentId: 's-1',
    studentNis: '26270101',
    academicYear: '2026/2027',
    semester: '1',
    className: '1A',
    status: 'final',
    items: {
      'ind-i-1-1': {
        indicatorId: 'ind-i-1-1',
        grade: 'A',
        notes: 'Ananda Rayyan menunjukkan keyakinan yang sangat mantap kepada Allah SWT. Selalu membaca Basmalah sebelum memulai pembelajaran dan rajin mengucap Hamdalah ketika menyelesaikan tugas.',
        updatedAt: '2026-11-05T10:00:00Z'
      },
      'ind-i-2-1': {
        indicatorId: 'ind-i-2-1',
        grade: 'A',
        notes: 'Ananda konsisten mengikuti salat zuhur dan dhuha berjamaah di musala dengan tertib tanpa perlu diarahkan berkali-kali.',
        updatedAt: '2026-11-05T10:15:00Z'
      },
      'ind-i-3-1': {
        indicatorId: 'ind-i-3-1',
        grade: 'A',
        notes: 'Ananda bersikap santun, selalu mengucapkan salam dan mencium tangan asatidz saat berpapasan di lorong sekolah.',
        updatedAt: '2026-11-05T10:30:00Z'
      },
      // ALAM
      'ind-a-1-1': {
        indicatorId: 'ind-a-1-1',
        grade: 'A',
        notes: 'Ananda mematuhi kesepakatan tata tertib sekolah dengan kesadaran yang sangat baik, termasuk aturan pemakaian seragam dan sepatu.',
        updatedAt: '2026-11-05T10:50:00Z'
      },
      'ind-a-2-1': {
        indicatorId: 'ind-a-2-1',
        grade: 'A',
        notes: 'Ananda dapat merapikan tas ransel, buku panduan alam, dan botol minum sendiri di loker masing-masing secara teratur.',
        updatedAt: '2026-11-05T11:05:00Z'
      },
      'ind-a-3-1': {
        indicatorId: 'ind-a-3-1',
        grade: 'A',
        notes: 'Ananda sangat peka terhadap kebersihan lingkungan; langsung mengambil daun kering yang berserakan di gazebo sekolah dan membuangnya ke komposter.',
        updatedAt: '2026-11-05T11:20:00Z'
      },
      // SAINS
      'ind-s-1-1': {
        indicatorId: 'ind-s-1-1',
        grade: 'A',
        notes: 'Ananda mengajukan pertanyaan kritis mengenai mengapa daun memiliki tulang yang berbeda bentuk dan bagaimana tanaman fotosintesis saat cuaca mendung.',
        updatedAt: '2026-11-05T11:35:00Z'
      },
      'ind-s-2-1': {
        indicatorId: 'ind-s-2-1',
        grade: 'A',
        notes: 'Ananda teliti mengidentifikasi bagian-bagian bunga sepatu dan mencatat perbedaannya pada jurnal sains siswa.',
        updatedAt: '2026-11-05T11:50:00Z'
      },
      'ind-s-3-1': {
        indicatorId: 'ind-s-3-1',
        grade: 'A',
        notes: 'Ananda mempresentasikan hasil mini proyek sains dengan intonasi jelas dan runtut di hadapan teman sekelas.',
        updatedAt: '2026-11-05T12:05:00Z'
      }
    },
    generalNotes: 'Alhamdulillah, ananda Rayyan menunjukkan kematangan karakter Islam, kecintaan pada alam, serta daya nalar sains yang luar biasa. Pertahankan prestasimu ananda sholih!',
    updatedAt: '2026-11-05T12:20:00Z',
    updatedBy: 'Ahmad Fauzi, S.Pd.I.'
  },
  {
    id: 'as-2',
    studentId: 's-2',
    studentNis: '26270102',
    academicYear: '2026/2027',
    semester: '1',
    className: '1A',
    status: 'draft',
    items: {
      'ind-i-1-1': {
        indicatorId: 'ind-i-1-1',
        grade: 'A',
        notes: 'Ananda Aisyah memiliki keyakinan teguh terhadap kekuasaan Allah SWT dan senantiasa santun dalam berucap.',
        updatedAt: '2026-11-06T09:00:00Z'
      },
      'ind-i-2-1': {
        indicatorId: 'ind-i-2-1',
        grade: 'A',
        notes: 'Tertib dalam salat berjamaah serta selalu menjaga wudhu dengan baik.',
        updatedAt: '2026-11-06T09:15:00Z'
      },
      'ind-a-1-1': {
        indicatorId: 'ind-a-1-1',
        grade: 'A',
        notes: 'Selalu disiplin mematuhi aturan kelas dan tertib mengikuti instruksi guru.',
        updatedAt: '2026-11-06T09:30:00Z'
      }
    },
    updatedAt: '2026-11-06T09:40:00Z',
    updatedBy: 'Ahmad Fauzi, S.Pd.I.'
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'act-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    type: 'assessment',
    title: 'Penilaian Difinalisasi',
    description: 'Penilaian Rapor Semester 1 siswa Muhammad Rayyan Al-Ghifari (1A) telah difinalisasi.',
    userName: 'Ahmad Fauzi, S.Pd.I.'
  },
  {
    id: 'act-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    type: 'assessment',
    title: 'Draft Penilaian Disimpan',
    description: 'Draft penilaian karakter siswa Aisyah Humaira Putri (1A) diperbarui.',
    userName: 'Ahmad Fauzi, S.Pd.I.'
  },
  {
    id: 'act-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    type: 'student',
    title: 'Data Siswa Terverifikasi',
    description: '10 siswa terdaftar aktif pada Tahun Ajaran 2026/2027.',
    userName: 'Administrator'
  },
  {
    id: 'act-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    type: 'system',
    title: 'Sistem Rapor Diinisialisasi',
    description: 'Konfigurasi master karakter Islam, Alam, dan Sains SD Islam Alam & Sains Al-Jannah siap digunakan.',
    userName: 'Sistem'
  }
];
