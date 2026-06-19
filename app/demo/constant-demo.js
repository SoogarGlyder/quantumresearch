import { CABANG_QUANTUM, PERAN, STATUS_SESI, TIPE_SESI, GAMIFIKASI } from "@/utils/constants";
import { timeHelper } from "@/utils/timeHelper";

const MS_PER_HARI = 24 * 60 * 60 * 1000;

/** Tambah/kurang sejumlah hari dari sebuah Date — menghindari ekspresi *24*60*60*1000 berulang */
const tambahHari = (tgl, jumlahHari) => new Date(tgl.getTime() + jumlahHari * MS_PER_HARI);

export function dapatkanDataDemoSiswa() {
  const now = new Date();
  // ✅ FIX: pakai timeHelper.getTglJakarta — bukan re-implementasi manual
  // toLocaleDateString().split('/').reverse().join('-') yang rapuh dan duplikatif.
  const tglHariIni      = timeHelper.getTglJakarta(now);
  const tglBesok        = timeHelper.getTglJakarta(tambahHari(now, 1));
  const tglKemarin      = timeHelper.getTglJakarta(tambahHari(now, -1));
  const tglLusaKemarin  = timeHelper.getTglJakarta(tambahHari(now, -2));

  const mockSiswa = {
    _id: "demo-siswa-001", nama: "Bintang Prestasi", username: "bintang.demo", nomorPeserta: "QR-DEMO-2026",
    kelas: "12 IPA SMA", kodeCabang: CABANG_QUANTUM.CPT.id, peran: PERAN.SISWA.id, totalExp: 14250,

    koleksiLencana: [
      { idLencana: "first_blood",    tanggalDidapat: tambahHari(now, -15).toISOString() },
      { idLencana: "burung_hantu",   tanggalDidapat: tambahHari(now, -10).toISOString() },
      { idLencana: "master_mtk",     tanggalDidapat: tambahHari(now, -7).toISOString() },
      { idLencana: "konsisten_30",   tanggalDidapat: tambahHari(now, -3).toISOString() },
      { idLencana: "einstein_muda",  tanggalDidapat: now.toISOString() },
    ],

    status: "aktif",
  };

  const mockStatistik = { totalMenit: 0, totalSesi: 0 };

  // Data misi demo, diambil dari pool misi resmi di constants.js
  const mockMisiHarian = [
    {
      _id: "misi-demo-1",
      kodeMisi: GAMIFIKASI.POOL_MISI[0].kodeMisi, // HADIR_KELAS
      judul:    GAMIFIKASI.POOL_MISI[0].judul,
      expBonus: GAMIFIKASI.POOL_MISI[0].expBonus,
      progress: 1,
      target:   GAMIFIKASI.POOL_MISI[0].target,
      selesai:  true,
      diklaim:  false,
    },
    {
      _id: "misi-demo-2",
      kodeMisi: GAMIFIKASI.POOL_MISI[1].kodeMisi, // KONSUL_30
      judul:    GAMIFIKASI.POOL_MISI[1].judul,
      expBonus: GAMIFIKASI.POOL_MISI[1].expBonus,
      progress: 15,
      target:   GAMIFIKASI.POOL_MISI[1].target,
      selesai:  false,
      diklaim:  false,
    },
  ];

  // Daftar mata pelajaran untuk di-loop saat generate jadwal masa depan/lalu
  const daftarMateri = [
    { mapel: "Matematika",        bab: "Trigonometri",          sub: "Sudut Istimewa",              tutor: "Baskoro Cahhyo Heri Nugroho", kode: "BC" },
    { mapel: "Fisika",            bab: "Mekanika",               sub: "Hukum Newton",                 tutor: "Galileo Newton Putra",        kode: "GN" },
    { mapel: "Biologi",           bab: "Sel & Genetika",         sub: "Sintesis Protein",             tutor: "Darwin Pratama",              kode: "DP" },
    { mapel: "Kimia",             bab: "Hidrokarbon",            sub: "Ikatan Karbon",                tutor: "Marie Curie Ningsih",         kode: "MC" },
    { mapel: "Penalaran Umum",    bab: "Logika Dasar",           sub: "Silogisme",                    tutor: "Raditya Sastra",              kode: "RS" },
    { mapel: "Bahasa Inggris",    bab: "Reading Comprehension",  sub: "Main Idea",                    tutor: "Sarah English",               kode: "SE" },
  ];

  // Jadwal hari ini — sesuai skema asli (tanggal disimpan sebagai string YYYY-MM-DD)
  const mockJadwal = [
    {
      _id: "jdw-demo-1",
      kelasTarget: "12 IPA SMA",
      tanggal: tglHariIni,
      mapel: "Pengetahuan Kuantitatif (PK)",
      pengajarId: "pgj-1",
      namaPengajar: "Baskoro Cahhyo Heri Nugroho",
      kodePengajar: "BC",
      pertemuan: 17,
      jamMulai: "16:00",
      jamSelesai: "17:30",
      bab: "Dimensi Tiga",
      subBab: "Rusuk, Sisi, Diagonal Sisi, Diagonal Ruang, Bidang Diagonal",
      galeriPapan: [
        "https://placehold.co/800x600/1e293b/ffffff?text=Papan+Tulis+Matematika",
        "https://placehold.co/800x600/334155/ffffff?text=Catatan+Dimensi+Tiga",
      ],
      fotoBersama: "https://placehold.co/800x600/0f172a/ffffff?text=Foto+Bersama+Kelas",
      status: "berjalan",
    },
    {
      _id: "jdw-demo-2",
      kelasTarget: "12 IPA SMA",
      tanggal: tglHariIni,
      mapel: "Literasi Bahasa Inggris",
      pengajarId: "pgj-2",
      namaPengajar: "Sarah English",
      kodePengajar: "SE",
      pertemuan: 18,
      jamMulai: "18:30",
      jamSelesai: "20:00",
      bab: "TOEFL Prep",
      subBab: "Listening Comprehension Part A",
      galeriPapan: [],
      fotoBersama: "",
      status: "terjadwal",
    },
  ];

  const mockRiwayat = [
    {
      _id: "riw-kelas-hari-ini", waktuMulai: `${tglHariIni}T15:45:00+07:00`, waktuSelesai: null,
      status: STATUS_SESI.BERJALAN.id, jenisSesi: TIPE_SESI.KELAS, jadwalId: "jdw-demo-1",
      namaMapel: "Pengetahuan Kuantitatif (PK)", pengajarPendamping: null,
    },
  ];

  // Generator jadwal masa depan — hanya Senin/Rabu/Jumat, maksimal 6 entri
  let countFuture = 1;
  for (let i = 1; i <= 30; i++) {
    const t = tambahHari(now, i);
    const day = t.getDay();
    if (day !== 1 && day !== 3 && day !== 5) continue; // Senin(1), Rabu(3), Jumat(5)

    const tStr   = timeHelper.getTglJakarta(t);
    const materi = daftarMateri[countFuture % daftarMateri.length];

    mockJadwal.push({
      _id: `jdw-future-${countFuture}`,
      kelasTarget: "12 IPA SMA",
      tanggal: tStr,
      mapel: materi.mapel,
      pengajarId: `pgj-future-${countFuture}`,
      namaPengajar: materi.tutor,
      kodePengajar: materi.kode,
      pertemuan: 18 + countFuture,
      jamMulai: "16:00",
      jamSelesai: "17:30",
      bab: materi.bab,
      subBab: materi.sub,
      galeriPapan: [],
      fotoBersama: "",
      status: "terjadwal",
    });

    countFuture++;
    if (countFuture > 6) break;
  }

  // Generator riwayat masa lalu — hanya Senin/Rabu/Jumat, maksimal 15 entri
  let countPast = 1;
  for (let i = 1; i <= 60; i++) {
    const t = tambahHari(now, -i);
    const day = t.getDay();
    if (day !== 1 && day !== 3 && day !== 5) continue;

    const tStr        = timeHelper.getTglJakarta(t);
    const isTerlambat  = countPast % 4 === 0;
    const jamMasukAsli = isTerlambat ? "16:20:00" : "15:45:00";
    const materi       = daftarMateri[countPast % daftarMateri.length];
    const jadwalIdLalu = `jdw-past-${countPast}`;

    mockJadwal.push({
      _id: jadwalIdLalu,
      kelasTarget: "12 IPA SMA",
      tanggal: tStr,
      mapel: materi.mapel,
      pengajarId: `pgj-past-${countPast}`,
      namaPengajar: materi.tutor,
      kodePengajar: materi.kode,
      pertemuan: 17 - countPast,
      jamMulai: "16:00",
      jamSelesai: "17:30",
      bab: materi.bab,
      subBab: materi.sub,
      jurnal: isTerlambat
        ? "Siswa datang terlambat 20 menit karena macet, namun berhasil mengejar ketertinggalan materi dengan baik."
        : "Siswa sangat aktif berdiskusi, rajin mencatat, dan maju mengerjakan soal di papan tulis. Luar biasa!",
      galeriPapan: [
        `https://placehold.co/800x600/1e293b/ffffff?text=Papan+Tulis+${materi.mapel.replace(/\s/g, "+")}`,
        `https://placehold.co/800x600/334155/ffffff?text=Catatan+${materi.bab.replace(/\s/g, "+")}`,
      ],
      fotoBersama: `https://placehold.co/800x600/0f172a/ffffff?text=Foto+Bersama+${materi.mapel.replace(/\s/g, "+")}`,
    });

    mockRiwayat.push({
      _id: `riw-kelas-${countPast}`,
      jadwalId: jadwalIdLalu,
      jenisSesi: TIPE_SESI.KELAS,
      status: STATUS_SESI.SELESAI.id,
      waktuMulai: `${tStr}T${jamMasukAsli}+07:00`,
      waktuSelesai: `${tStr}T17:30:00+07:00`,
      konsulExtraMenit: isTerlambat ? 0 : 15,
      namaMapel: materi.mapel,
    });

    mockRiwayat.push({
      _id: `riw-konsul-${countPast}`,
      jenisSesi: TIPE_SESI.KONSUL,
      status: STATUS_SESI.SELESAI.id,
      waktuMulai: `${tStr}T18:00:00+07:00`,
      waktuSelesai: `${tStr}T19:30:00+07:00`,
      namaMapel: "Konsul Privat",
      pengajarPendamping: { nama: materi.tutor },
    });

    countPast++;
    if (countPast > 15) break;
  }

  const mockKlasemen = [
    { idSiswa: "rival-1",   nama: "Sang Penakluk SNBT", peringkat: 1, jam: 35, menit: 10, kelas: "12 IPA" },
    { idSiswa: "demo-001",  nama: "Bintang Prestasi",   peringkat: 2, jam: 28, menit: 45, kelas: "12 IPA" },
    { idSiswa: "rival-2",   nama: "Pejuang Subuh",      peringkat: 3, jam: 26, menit: 15, kelas: "12 IPS" },
  ];

  const mockLatihan = [
    {
      _id: "latihan-demo-peluang-1", judul: "Latihan Soal Peluang 1", mapel: "Penalaran Matematika",
      waktuMulai: `${tglHariIni}T08:00:00+07:00`, durasiMenit: 45, status: "selesai",
      link: "https://drive.google.com/file/d/1fajvg9MJ7xbNAfjcwQLEsSlZ5vmkbHyz/preview",
      url:  "https://drive.google.com/file/d/1fajvg9MJ7xbNAfjcwQLEsSlZ5vmkbHyz/preview",
    },
    {
      _id: "latihan-demo-peluang-2", judul: "Latihan Soal Peluang 2", mapel: "Penalaran Matematika",
      waktuMulai: `${tglHariIni}T09:00:00+07:00`, durasiMenit: 45, status: "selesai",
      link: "https://drive.google.com/file/d/1UadHs2AON-_G5qBgpiaJN972-DRAEOee/preview",
      url:  "https://drive.google.com/file/d/1UadHs2AON-_G5qBgpiaJN972-DRAEOee/preview",
    },
    {
      _id: "latihan-demo-peluang-3", judul: "Latihan Soal Peluang 3", mapel: "Penalaran Matematika",
      waktuMulai: `${tglHariIni}T10:00:00+07:00`, durasiMenit: 45, status: "selesai",
      link: "https://drive.google.com/file/d/1y0oPJm3EHTS8ofebZQzCJkfxulU6QXZZ/preview",
      url:  "https://drive.google.com/file/d/1y0oPJm3EHTS8ofebZQzCJkfxulU6QXZZ/preview",
    },
  ];

  const mockKuis = {
    _id: "kuis-demo-1", mapel: "Pre-Test Skolastik", bab: "Simulasi Ujian Masuk PTN",
    jumlahSoal: 3, isSudahDikerjakan: false, waktuMulai: `${tglHariIni}T08:00:00+07:00`, durasiMenit: 90,
    soal: [
      {
        _id: "s-1", tipeSoal: "PG",
        pertanyaan: "Dua roda gigi terhubung. Roda A (12 gigi) dan roda B (24 gigi). Jika roda A diputar 4 kali, roda B berputar...",
        opsi: [{ label: "A", teks: "1 kali" }, { label: "B", teks: "2 kali" }, { label: "C", teks: "4 kali" }, { label: "D", teks: "8 kali" }],
        kunciJawaban: "B", bobotExp: 20,
      },
      {
        _id: "s-2", tipeSoal: "PG_KOMPLEKS",
        pertanyaan: "Di antara nama-nama berikut, siapakah yang dikenal sebagai perintis *Ilmu Komputer*? (Pilih lebih dari 1)",
        opsi: [{ label: "A", teks: "Ada Lovelace" }, { label: "B", teks: "Albert Einstein" }, { label: "C", teks: "Alan Turing" }, { label: "D", teks: "Isaac Newton" }],
        kunciJawaban: ["A", "C"], bobotExp: 30,
      },
      {
        _id: "s-3", tipeSoal: "ISIAN",
        pertanyaan: "Berapakah hasil perhitungan dari limit berikut: $\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2}$ ?",
        kunciJawaban: "4", bobotExp: 50,
      },
    ],
  };

  const baseSoal = [
    { _id: "soal-bhs-1", tipeSoal: "PG", pertanyaan: "<p>Struktur teks pidato pada kalimat bernomor (1), (2), dan (3)...</p>", opsi: [{ label: "A", teks: "Salam pembuka, sapaan penghormatan, dan ucapan syukur" }, { label: "B", teks: "Ucapan syukur, salam pembuka, dan sapaan penghormatan" }, { label: "C", teks: "Sapaan penghormatan, salam pembuka, dan ucapan syukur" }, { label: "D", teks: "Salam pembuka, ucapan syukur, dan sapaan penghormatan" }], kunciJawaban: ["A"], bobotExp: 20 },
    { _id: "soal-bhs-2", tipeSoal: "PG", pertanyaan: "<p>Bagian isi pidato pada teks di atas ditunjukkan oleh kalimat bernomor...</p>", opsi: [{ label: "A", teks: "(1) dan (2)" }, { label: "B", teks: "(3) dan (4)" }, { label: "C", teks: "(4) dan (5)" }, { label: "D", teks: "(6) dan (7)" }], kunciJawaban: ["C"], bobotExp: 20 },
    { _id: "soal-bhs-3", tipeSoal: "PG", pertanyaan: "<p>Pesan utama yang ingin disampaikan oleh orator dalam isi pidatonya adalah...</p>", opsi: [{ label: "A", teks: "Mengajak siswa untuk rajin belajar" }, { label: "B", teks: "Mengingatkan pentingnya menghormati guru" }, { label: "C", teks: "Mengajak seluruh siswa menjaga kebersihan lingkungan sekolah" }, { label: "D", teks: "Memberikan informasi bahaya sampah" }], kunciJawaban: ["C"], bobotExp: 20 },
    { _id: "soal-bhs-4", tipeSoal: "PG", pertanyaan: "<p>Kalimat bernomor (7) dalam struktur teks pidato disebut sebagai...</p>", opsi: [{ label: "A", teks: "Simpulan pidato" }, { label: "B", teks: "Harapan orator" }, { label: "C", teks: "Permohonan maaf" }, { label: "D", teks: "Salam penutup" }], kunciJawaban: ["C"], bobotExp: 20 },
    { _id: "soal-bhs-5", tipeSoal: "PG", pertanyaan: "<p>Kalimat yang berisi ajakan (persuasif) pada cuplikan pidato tersebut ditunjukkan pada nomor...</p>", opsi: [{ label: "A", teks: "(2)" }, { label: "B", teks: "(3)" }, { label: "C", teks: "(4)" }, { label: "D", teks: "(5)" }], kunciJawaban: ["D"], bobotExp: 20 },
  ];

  const mockRiwayatKuis = [
    {
      _id: "rk-demo-1", jadwalId: "kuis-demo-hist-1", tanggal: tglKemarin, mapel: "B.Indonesia", bab: "Kisi-Kisi 52 - Tes 1", skor: 100,
      soal: baseSoal.map((s) => ({ ...s, benar: true, kunci: s.kunciJawaban[0], jawabanSiswaSimulasi: s.kunciJawaban[0] })),
    },
    {
      _id: "rk-demo-2", jadwalId: "kuis-demo-hist-2", tanggal: tglLusaKemarin, mapel: "B.Indonesia", bab: "Kisi-Kisi 52 - Tes 2", skor: 80,
      soal: baseSoal.map((s, index) => ({ ...s, benar: index !== 1, kunci: s.kunciJawaban[0], jawabanSiswaSimulasi: index === 1 ? "A" : s.kunciJawaban[0] })),
    },
    {
      _id: "rk-demo-3", jadwalId: "kuis-demo-hist-3", tanggal: "2026-06-10", mapel: "B.Indonesia", bab: "Kisi-Kisi 52 - Latihan Awal", skor: 60,
      soal: baseSoal.map((s, index) => ({ ...s, benar: index !== 2 && index !== 4, kunci: s.kunciJawaban[0], jawabanSiswaSimulasi: index === 2 ? "A" : index === 4 ? "C" : s.kunciJawaban[0] })),
    },
  ];

  return {
    mockSiswa, mockStatistik, mockJadwal, mockRiwayat, mockLatihan,
    mockKlasemen, mockKuis, mockRiwayatKuis, mockMisiHarian,
  };
}