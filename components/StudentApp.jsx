"use client";

import { useState, useMemo, useEffect } from "react";

import { prosesHasilScan, ambilDaftarGuruDropdown } from "@/actions/scanAction";
import { prosesLogout } from "@/actions/authAction";
import {
  MODE_SCAN, PREFIX_BARCODE, TIPE_SESI,
  STATUS_SESI, KONFIGURASI_SISTEM,
} from "@/utils/constants";
import { formatHelper } from "@/utils/formatHelper";
import styles from "@/components/App.module.css";

import {
  TabBerandaSiswa,
  TabKelasSiswa,
  TabScanSiswa,
  TabKonsulSiswa,
  TabProfilSiswa,
} from "./student";
import StudentBottomNav from "./student/StudentBottomNav";

// Durasi auto-reset scanner setelah scan berhasil atau gagal
const TIMER_RESET_SCANNER_MS = 3000;

export default function StudentApp({
  siswa, riwayat, jadwal, statistik, latihanHariIni,
  klasemenDemo = [], kuisDemo = null, riwayatKuisDemo = [],
  isDemoMode = false, misiDemo = [],
}) {
  const adaKonsulAktif = useMemo(
    () => riwayat?.some(
      (r) => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id
    ),
    [riwayat]
  );

  const adaKelasAktif = useMemo(
    () => riwayat?.some(
      (r) => r.jenisSesi === TIPE_SESI.KELAS && r.status === STATUS_SESI.BERJALAN.id
    ),
    [riwayat]
  );

  const [tab,      setTab]      = useState("home");
  const [modeScan, setModeScan] = useState(() =>
    adaKonsulAktif ? MODE_SCAN.KONSUL : MODE_SCAN.KELAS
  );

  const [hasilScan,    setHasilScan]    = useState("");
  const [pesanSistem,  setPesanSistem]  = useState("");
  const [sedangLoading, setSedangLoading] = useState(false);
  const [daftarGuru,   setDaftarGuru]   = useState([]);

  // Inisialisasi mapel & guru dari sesi konsul yang sedang berjalan (jika ada)
  const [mapelPilihan, setMapelPilihan] = useState(() => {
    if (!adaKonsulAktif) return "";
    const sesi = riwayat.find(
      (r) => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id
    );
    return sesi?.namaMapel || "";
  });

  const [guruPilihan, setGuruPilihan] = useState(() => {
    if (!adaKonsulAktif) return "";
    const sesi = riwayat.find(
      (r) => r.jenisSesi === TIPE_SESI.KONSUL && r.status === STATUS_SESI.BERJALAN.id
    );
    return sesi?.pengajarPendamping || "";
  });

  const apakahError = formatHelper.cekPesanErrorScanner(pesanSistem);

  useEffect(() => {
    // 🎭 Mode Demo: tidak perlu daftar guru sungguhan — Konsul tetap berfungsi
    // (disimulasikan) walau dropdown-nya kosong.
    if (isDemoMode) return;

    const muatDaftarGuru = async () => {
      try {
        const res = await ambilDaftarGuruDropdown();
        if (res?.ok) setDaftarGuru(res.data || []);
      } catch (err) {
        console.error("[StudentApp] Gagal memuat daftar guru:", err);
      }
    };
    muatDaftarGuru();
  }, [isDemoMode]);

  // Sinkronisasi mode scan dengan status sesi aktif saat tab scan dibuka
  useEffect(() => {
    if (tab !== "scan") return;
    if (adaKonsulAktif) setModeScan(MODE_SCAN.KONSUL);
    if (adaKelasAktif)  setModeScan(MODE_SCAN.KELAS);
  }, [tab, adaKonsulAktif, adaKelasAktif]);

  const resetScanner = () => {
    setHasilScan("");
    setPesanSistem("");
  };

  // ✅ Demo mode: jangan panggil prosesLogout sungguhan — halaman /demo bisa diakses
  // tanpa sesi (lihat middleware.js), dan kita tidak ingin berisiko menghapus cookie
  // sesi asli jika pengunjung kebetulan login di tab lain pada browser yang sama.
  const klikLogout = async () => {
    if (isDemoMode) {
      window.location.href = "/";
      return;
    }
    await prosesLogout();
    window.location.href = KONFIGURASI_SISTEM.PATH_LOGIN;
  };

  const saatBarcodeTerbaca = async (teksDariKamera) => {
    if (sedangLoading) return;

    const isScanKonsul = teksDariKamera === PREFIX_BARCODE.KONSUL;
    const isScanKelas  = teksDariKamera.startsWith(PREFIX_BARCODE.KELAS);

    // Auto-switch mode jika ada sesi aktif yang cocok
    if (adaKonsulAktif && isScanKonsul) { setModeScan(MODE_SCAN.KONSUL); }
    else if (adaKelasAktif && isScanKelas) { setModeScan(MODE_SCAN.KELAS); }

    // Validasi lokal: jenis barcode harus sesuai mode
    let pesanErrorLokal = "";
    if (modeScan === MODE_SCAN.KELAS && !isScanKelas) {
      pesanErrorLokal = "Ups! Ini bukan barcode Kelas.";
    } else if (modeScan === MODE_SCAN.KONSUL && !isScanKonsul) {
      pesanErrorLokal = "Ups! Arahkan ke barcode Konsul.";
    } else if (modeScan === MODE_SCAN.KONSUL && !adaKonsulAktif && !mapelPilihan?.trim()) {
      pesanErrorLokal = "Oops! Silakan pilih mapel terlebih dahulu.";
    } else if (modeScan === MODE_SCAN.KONSUL && !adaKonsulAktif && !guruPilihan?.trim()) {
      pesanErrorLokal = "Oops! Silakan pilih guru pendamping terlebih dahulu.";
    }

    // Error validasi lokal — reset otomatis setelah 3 detik
    if (pesanErrorLokal) {
      setHasilScan(teksDariKamera);
      setPesanSistem(pesanErrorLokal);
      setTimeout(resetScanner, TIMER_RESET_SCANNER_MS);
      return;
    }

    setSedangLoading(true);
    setHasilScan(teksDariKamera);
    setPesanSistem("Mengirim data ke pusat...");

    // 🎭 Mode Demo: JANGAN PERNAH panggil prosesHasilScan sungguhan. Halaman /demo
    // bersifat publik (lihat middleware.js) — kalau pengunjung kebetulan login dengan
    // sesi asli di tab lain pada browser yang sama, panggilan server di sini akan
    // memakai sesi ASLI mereka dan bisa membuat absensi sungguhan. Simulasikan saja.
    if (isDemoMode) {
      setTimeout(() => {
        const labelSesi = modeScan === MODE_SCAN.KELAS ? "Kelas" : "Konsul";
        setPesanSistem(`✅ Simulasi Scan ${labelSesi} berhasil! (Mode Demo — data tidak dikirim ke server)`);
        setSedangLoading(false);
        setTimeout(resetScanner, TIMER_RESET_SCANNER_MS);
      }, 800);
      return;
    }

    try {
      const laporan = await prosesHasilScan(teksDariKamera, mapelPilihan, guruPilihan);
      setPesanSistem(laporan.pesan);

      // ✅ FIX: laporan.sukses → laporan.ok (responseHelper contract)
      if (laporan.ok) {
        // Full reload agar riwayat sesi dari server diperbarui
        window.location.reload();

        // Setelah Check-Out: bersihkan pilihan mapel & guru untuk sesi berikutnya
        const isCheckOut =
          laporan.pesan.includes("Selesai") ||
          laporan.pesan.includes("Check-out") ||
          laporan.pesan.includes("dibatalkan");

        setTimeout(() => {
          resetScanner();
          if (isCheckOut) {
            setMapelPilihan("");
            setGuruPilihan("");
          }
        }, TIMER_RESET_SCANNER_MS);
      } else {
        setTimeout(resetScanner, TIMER_RESET_SCANNER_MS);
      }
    } catch {
      setPesanSistem("Gagal menghubungi server. Periksa koneksi.");
      setTimeout(resetScanner, TIMER_RESET_SCANNER_MS);
    } finally {
      setSedangLoading(false);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <main>
        {tab === "home" && (
          <TabBerandaSiswa
            siswa={siswa}
            jadwal={jadwal}
            riwayat={riwayat}
            setTab={setTab}
            setModeScan={setModeScan}
            resetScanner={resetScanner}
            latihanHariIni={latihanHariIni}
            klasemenDemo={klasemenDemo}
            kuisDemo={kuisDemo}
            isDemoMode={isDemoMode}
            misiDemo={misiDemo}
          />
        )}

        {tab === "kelas" && (
          <TabKelasSiswa
            jadwal={jadwal}
            riwayat={riwayat}
            siswa={siswa}
            isDemoMode={isDemoMode}
            riwayatKuisDemo={riwayatKuisDemo}
          />
        )}

        {tab === "scan" && (
          <TabScanSiswa
            modeScan={modeScan}
            setModeScan={setModeScan}
            hasilScan={hasilScan}
            pesanSistem={pesanSistem}
            sedangLoading={sedangLoading}
            mapelPilihan={mapelPilihan}
            setMapelPilihan={setMapelPilihan}
            guruPilihan={guruPilihan}
            setGuruPilihan={setGuruPilihan}
            daftarGuru={daftarGuru}
            saatBarcodeTerbaca={saatBarcodeTerbaca}
            resetScanner={resetScanner}
            apakahError={apakahError}
            adaKonsulAktif={adaKonsulAktif}
            adaKelasAktif={adaKelasAktif}
          />
        )}

        {tab === "riwayat" && <TabKonsulSiswa riwayat={riwayat} />}

        {tab === "profil" && (
          <TabProfilSiswa siswa={siswa} klikLogout={klikLogout} isDemoMode={isDemoMode} />
        )}
      </main>

      <StudentBottomNav tab={tab} setTab={setTab} />
    </div>
  );
}