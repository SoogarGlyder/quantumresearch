"use client";

import { useState, useMemo, useEffect, memo, useCallback } from "react";
import { FaGripVertical, FaXmark, FaCheck, FaCloudArrowUp, FaDatabase, FaTrashCan, FaPenToSquare, FaFileSignature, FaListUl } from "react-icons/fa6"; // 🚀 Tambah FaListUl
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import { DndContext, useDraggable, useDroppable, MouseSensor, TouchSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";

import PaginationBar from "../ui/PaginationBar";
import { DAFTAR_KELAS_BIMBEL, generateDuaMingguKerja, KAMUS_JAM_SESI } from "../../utils/jadwalHelper";

import { OPSI_MAPEL_KELAS, OPSI_KELAS, LIMIT_DATA } from "../../utils/constants";
import { tambahJadwal, hapusJadwal, editJadwal } from "../../actions/adminAction";

// 🚀 IMPORT BARU: Menggunakan ekosistem Bank Soal
import { ambilKuisByJadwal, ambilSemuaBankSoal, terapkanBankSoalKeJadwal, hapusQuizDariJadwal } from "../../actions/quizAction"; 

import { formatTanggal, potongDataPagination } from "../../utils/formatHelper";
import styles from "../../app/admin/AdminPage.module.css";

// ============================================================================
// --- KOMPONEN BANTUAN DND (Telah Dioptimasi dengan React.memo) ---
// ============================================================================

const DraggableMapel = memo(({ mapel }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: mapel });
  return (
    <div 
      ref={setNodeRef} {...listeners} {...attributes} 
      className={`${styles.kartuMapelDraggable} ${isDragging ? styles.dragging : ''}`}
    >
      <FaGripVertical color="#9ca3af" /> {mapel}
    </div>
  );
});
DraggableMapel.displayName = "DraggableMapel";

const DroppableSel = memo(({ idSel, isSabtu, permanenDB, draftLokal, klikKartuJadwal }) => {
  const { isOver, setNodeRef } = useDroppable({ id: idSel });
  const kelasWarna = isOver ? styles.hover : (isSabtu ? styles.sabtu : styles.normal);
  
  return (
    <td ref={setNodeRef} className={`${styles.tdDroppable} ${kelasWarna}`}>
      <div className={styles.tumpukanJadwal}>
        {permanenDB.map(j => (
          <div key={j._id} onClick={() => klikKartuJadwal(j, "permanen")} className={styles.kartuJadwalPermanen} style={{ cursor: 'pointer', transition: 'transform 0.1s', position: 'relative' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
            <div className={styles.labelTersimpan}><FaDatabase /> TERSIMPAN</div>
            
            {/* INDIKATOR KUIS DI KARTU PAPAN CATUR */}
            {j.statusKuis === 'siap' && (
              <div style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#facc15', color: '#111827', fontSize: '10px', fontWeight: '900', padding: '2px 6px', borderRadius: '4px', border: '1px solid #111827' }}>
                📝 KUIS SIAP
              </div>
            )}

            <div className={styles.teksMapelKartu}>{j.mapel}</div>
            <div className={styles.teksInfoPengajar}><span>👨‍🏫 {j.kodePengajar || '?'}</span><span>P-{j.pertemuan || '?'}</span></div>
            <div className={styles.teksJamKartu}>{j.jamMulai} - {j.jamSelesai}</div>
          </div>
        ))}
        {draftLokal.map(j => (
          <div key={j.idUnik} onClick={() => klikKartuJadwal(j, "draft")} className={styles.kartuJadwalDraft} style={{ cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
            <div className={styles.labelDraftBaru}>✨ DRAFT BARU</div>
            <div className={styles.teksMapelKartu}>{j.mapel}</div>
            <div className={styles.teksInfoPengajar}><span>👨‍🏫 {j.kodePengajar}</span><span>P-{j.pertemuan}</span></div>
            <div className={styles.teksJamKartu}>{j.jamMulai} - {j.jamSelesai}</div>
          </div>
        ))}
        {permanenDB.length === 0 && draftLokal.length === 0 && (
          <div className={styles.kotakKosongTarikan}>Tarik ke sini</div>
        )}
      </div>
    </td>
  );
}, (prevProps, nextProps) => {
  if (prevProps.idSel !== nextProps.idSel) return false;
  if (prevProps.isSabtu !== nextProps.isSabtu) return false;
  if (prevProps.permanenDB.length !== nextProps.permanenDB.length) return false;
  if (prevProps.draftLokal.length !== nextProps.draftLokal.length) return false;

  const isPermanenSama = prevProps.permanenDB.every((j, i) => j._id === nextProps.permanenDB[i]._id && j.statusKuis === nextProps.permanenDB[i].statusKuis);
  const isDraftSama = prevProps.draftLokal.every((j, i) => j.idUnik === nextProps.draftLokal[i].idUnik);

  return isPermanenSama && isDraftSama;
});
DroppableSel.displayName = "DroppableSel";

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
export default function TabJadwal({ dataJadwal = [], muatData, bulanAktif, adminId = "admin-sistem" }) { 
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const [daftarStatusKuis, setDaftarStatusKuis] = useState({});

  const { minDate, maxDate } = useMemo(() => {
    if (!bulanAktif) return { minDate: "", maxDate: "" };
    
    const [tahunStr, bulanStr] = bulanAktif.split("-");
    const y = Number(tahunStr);
    const m = Number(bulanStr) - 1; 
    
    const endDay = new Date(y, m + 1, 0).getDate();
    
    const min = `${tahunStr}-${bulanStr}-01`;
    const max = `${tahunStr}-${bulanStr}-${String(endDay).padStart(2, '0')}`;
    
    return { minDate: min, maxDate: max };
  }, [bulanAktif]);

  const [tanggalMulai, setTanggalMulai] = useState(minDate || "");
  const [jadwalLokal, setJadwalLokal] = useState([]); 
  
  useEffect(() => {
    if (minDate && minDate !== tanggalMulai) {
      setTanggalMulai(minDate);
      if (jadwalLokal.length > 0) {
        setJadwalLokal([]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minDate]);

  const [modalTerbuka, setModalTerbuka] = useState(false);
  const [dataDraft, setDataDraft] = useState(null); 
  const [inputPengajar, setInputPengajar] = useState("");
  const [inputPertemuan, setInputPertemuan] = useState("");
  
  const [modalEditTerbuka, setModalEditTerbuka] = useState(false);
  const [jadwalEdit, setJadwalEdit] = useState(null);
  const [tipeEdit, setTipeEdit] = useState(""); 
  const [formEdit, setFormEdit] = useState({ pengajar: "", pertemuan: "", jamMulai: "", jamSelesai: "" });
  const [isProsesEdit, setIsProsesEdit] = useState(false);

  // 🚀 STATE BANK SOAL (PENGGANTI MODAL KUIS BUILDER)
  const [isModalBankOpen, setIsModalBankOpen] = useState(false);
  const [listBankSoal, setListBankSoal] = useState([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [isMemprosesKuis, setIsMemprosesKuis] = useState(false);
  const [isMemuatKuis, setIsMemuatKuis] = useState(false);

  const [mapelAktifMelayang, setMapelAktifMelayang] = useState(null);
  const [isMenyimpan, setIsMenyimpan] = useState(false);

  const [filterTglMulai, setFilterTglMulai] = useState("");
  const [filterTglAkhir, setFilterTglAkhir] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  // 🚀 FUNGSI BARU: Membersihkan parameter 'page' dari URL
  const resetHalamanKeSatu = () => {
    const params = new URLSearchParams(searchParams);
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  // ❌ PERBAIKAN: useEffect yang membuat pagination macet sudah DIHAPUS

  useEffect(() => {
    setFilterTglMulai("");
    setFilterTglAkhir("");
    setFilterKelas("");
    resetHalamanKeSatu(); // Reset halaman ke 1 saat ganti bulan
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulanAktif]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const kolomHari = useMemo(() => {
    if (!tanggalMulai) return [];
    return generateDuaMingguKerja(tanggalMulai);
  }, [tanggalMulai]);

  const handleDragStart = (event) => setMapelAktifMelayang(event.active.id);

  const handleDragEnd = (event) => {
    setMapelAktifMelayang(null); 
    const { active, over } = event;
    if (!over) return; 

    const mapelYangDilempar = active.id;
    const [kelasId, tanggalPenuh] = over.id.split('|');

    const kelasInfo = DAFTAR_KELAS_BIMBEL.find(k => k.id === kelasId);
    const hariInfo = kolomHari.find(h => h.tanggalPenuh === tanggalPenuh);

    if (kelasInfo && hariInfo) {
      setDataDraft({ mapel: mapelYangDilempar, kelas: kelasInfo, hari: hariInfo });
      setInputPengajar("");
      setInputPertemuan("");
      setModalTerbuka(true);
    }
  };

  const masukkanKePapan = () => {
    if (!inputPengajar || !inputPertemuan) {
      alert("⚠️ Nama pengajar dan pertemuan harus diisi!");
      return;
    }
    const tipeHari = dataDraft.hari.isSabtu ? "sabtu" : "normal";
    const jamKelas = KAMUS_JAM_SESI[tipeHari][dataDraft.kelas.sesi];

    const jadwalBaru = {
      idUnik: Date.now().toString(),
      mapel: dataDraft.mapel,
      kelasTarget: dataDraft.kelas.nama, 
      kelasId: dataDraft.kelas.id,
      tanggal: dataDraft.hari.tanggalPenuh, 
      pengajar: inputPengajar,
      pertemuan: inputPertemuan,
      jamMulai: jamKelas.mulai,
      jamSelesai: jamKelas.selesai
    };
    setJadwalLokal([...jadwalLokal, jadwalBaru]);
    setModalTerbuka(false);
    setDataDraft(null);
  };

  const klikKartuJadwal = useCallback(async (jadwal, tipe) => {
    setJadwalEdit(jadwal);
    setTipeEdit(tipe);
    setFormEdit({
      pengajar: jadwal.pengajar || "",
      pertemuan: jadwal.pertemuan || "",
      jamMulai: jadwal.jamMulai || "",
      jamSelesai: jadwal.jamSelesai || ""
    });

    if (tipe === "permanen") {
        setIsMemuatKuis(true);
        const kuisLama = await ambilKuisByJadwal(jadwal._id);
        if (kuisLama) {
            setDaftarStatusKuis(prev => ({...prev, [jadwal._id]: 'siap'}));
        } else {
            setDaftarStatusKuis(prev => ({...prev, [jadwal._id]: 'kosong'}));
        }
        setIsMemuatKuis(false);
    }

    setModalEditTerbuka(true);
  }, []);

  // 🚀 LOGIKA BARU: BUKA PANEL PILIH BANK SOAL
  const bukaPanelBankSoal = async () => {
    setModalEditTerbuka(false); // Tutup modal edit jadwal
    setIsModalBankOpen(true);
    setLoadingBank(true);
    // Ambil data Bank Soal (Bisa difilter per adminId atau ditarik semua tergantung rules nanti)
    const data = await ambilSemuaBankSoal(adminId);
    setListBankSoal(data || []);
    setLoadingBank(false);
  };

  // 🚀 LOGIKA BARU: TERAPKAN KUIS
  const handlePilihBankSoal = async (idBankSoal) => {
    if (!window.confirm("Yakin ingin menerapkan paket soal ini ke jadwal kelas ini?")) return;
    
    setIsMemprosesKuis(true);
    const res = await terapkanBankSoalKeJadwal(idBankSoal, jadwalEdit._id, adminId);
    
    if (res.sukses) {
      alert("✅ " + res.pesan);
      setIsModalBankOpen(false);
      setDaftarStatusKuis(prev => ({...prev, [jadwalEdit._id]: 'siap'}));
    } else {
      alert("❌ " + res.pesan);
    }
    setIsMemprosesKuis(false);
  };

  // 🚀 LOGIKA BARU: LEPAS KUIS
  const handleLepasKuis = async () => {
    if (!window.confirm("Yakin ingin membatalkan/melepas kuis dari kelas ini?")) return;
    
    setIsMemprosesKuis(true);
    const res = await hapusQuizDariJadwal(jadwalEdit._id);
    if (res.sukses) {
      alert("✅ " + res.pesan);
      setDaftarStatusKuis(prev => ({...prev, [jadwalEdit._id]: 'kosong'}));
    } else {
      alert("❌ " + res.pesan);
    }
    setIsMemprosesKuis(false);
  };

  const simpanPerubahanJadwal = async () => {
    if (!formEdit.pengajar || !formEdit.pertemuan) {
      alert("⚠️ Nama pengajar dan pertemuan tidak boleh kosong!");
      return;
    }

    if (tipeEdit === "draft") {
      const index = jadwalLokal.findIndex(j => j.idUnik === jadwalEdit.idUnik);
      const jadwalLokalBaru = [...jadwalLokal];
      jadwalLokalBaru[index] = { ...jadwalLokalBaru[index], ...formEdit };
      setJadwalLokal(jadwalLokalBaru);
      setModalEditTerbuka(false);
    } else {
      setIsProsesEdit(true);
      const hasil = await editJadwal(jadwalEdit._id, formEdit);
      setIsProsesEdit(false);
      
      if (hasil.sukses) {
        if (muatData) muatData();
        setModalEditTerbuka(false);
      } else {
        alert(hasil.pesan);
      }
    }
  };

  const hapusDariPapan = async () => {
    if (tipeEdit === "draft") {
      setJadwalLokal(jadwalLokal.filter(j => j.idUnik !== jadwalEdit.idUnik));
      setModalEditTerbuka(false);
    } else {
      const yakin = window.confirm(`Yakin ingin menghapus permanen jadwal ${jadwalEdit.mapel} ini?`);
      if (!yakin) return;
      
      setIsProsesEdit(true);
      const hasil = await hapusJadwal(jadwalEdit._id);
      setIsProsesEdit(false);
      
      if (hasil.sukses) {
        if (muatData) muatData();
        setModalEditTerbuka(false);
      } else {
        alert(hasil.pesan);
      }
    }
  };

  const simpanSemuaKeDatabase = async () => {
    if (jadwalLokal.length === 0) return;
    const konfirmasi = confirm(`Publikasikan ${jadwalLokal.length} jadwal draft ke sistem?`);
    if (!konfirmasi) return;

    setIsMenyimpan(true);
    try {
      const tembakanServer = jadwalLokal.map(jadwal => {
        return tambahJadwal({
          tanggal: jadwal.tanggal, mapel: jadwal.mapel, kelasTarget: jadwal.kelasTarget,
          jamMulai: jadwal.jamMulai, jamSelesai: jadwal.jamSelesai, pengajar: jadwal.pengajar, pertemuan: jadwal.pertemuan
        });
      });

      const hasilEksekusi = await Promise.all(tembakanServer);
      const adaYangGagal = hasilEksekusi.some(res => res.sukses === false);

      if (adaYangGagal) {
        const errorPertama = hasilEksekusi.find(res => res.sukses === false);
        alert(`❌ GAGAL SIMPAN: ${errorPertama?.pesan || "Terjadi kesalahan sistem"}`);
      } else {
        setJadwalLokal([]); 
        if(muatData) await muatData(); 
        alert("✅ Jadwal berhasil mengudara!");
      }
    } catch (error) {
      alert("❌ Terjadi kesalahan server.");
    } finally {
      setIsMenyimpan(false);
    }
  };

  const klikHapusJadwalBawah = async (id, mapel, kelas) => { 
    if (window.confirm(`Yakin ingin menghapus jadwal ${mapel} untuk kelas ${kelas}? (Jika dihapus, jadwal akan hilang dari papan catur juga)`)) { 
      try {
        const hasil = await hapusJadwal(id); 
        if(hasil.sukses) {
          if (typeof muatData === 'function') muatData(); 
        } else {
          alert("Gagal menghapus: " + hasil.pesan);
        }
      } catch (error) {
        console.error("ERROR Hapus:", error);
      }
    } 
  };

  const jadwalBulanIni = useMemo(() => {
    return dataJadwal.filter(j => j.tanggal >= minDate && j.tanggal <= maxDate);
  }, [dataJadwal, minDate, maxDate]);

  const jadwalDitampilkan = useMemo(() => {
    let jadwal = [...jadwalBulanIni];
    if (filterTglMulai) jadwal = jadwal.filter(j => j.tanggal >= filterTglMulai);
    if (filterTglAkhir) jadwal = jadwal.filter(j => j.tanggal <= filterTglAkhir);
    if (filterKelas) jadwal = jadwal.filter(j => j.kelasTarget === filterKelas);
    return jadwal.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [jadwalBulanIni, filterTglMulai, filterTglAkhir, filterKelas]);

  const { totalPage, dataTerpotong: dataJadwalHalIni } = potongDataPagination(jadwalDitampilkan, page, ITEMS_PER_PAGE);

  const cariDraftLokal = (kelasId, tanggalPenuh) => jadwalLokal.filter(j => j.kelasId === kelasId && j.tanggal === tanggalPenuh);
  
  const cariPermanenDB = (kelasNama, tanggalPenuh) => {
    if (!dataJadwal) return [];
    const jadwalHariItu = dataJadwal.filter(j => j.kelasTarget === kelasNama && j.tanggal === tanggalPenuh);
    return jadwalHariItu.map(j => ({ ...j, statusKuis: daftarStatusKuis[j._id] }));
  };

  // ============================================================================
  // RENDER UI
  // ============================================================================
  return (
    <div className={`${styles.isiTab} ${styles.wadahJadwalAllInOne}`}>
      
      {/* ==================== PANEL ATAS: PAPAN CATUR ==================== */}
      <div className={styles.panelPapanCatur}>
        <div className={styles.headerPapanCatur}>
          <div>
            <h2 className={styles.judulHeaderPapan}>📅 Builder Jadwal</h2>
            <p className={styles.subJudulHeaderPapan}>Tarik mapel ke kotak kelas & tanggal.</p>
          </div>
          
          <div className={styles.wadahKontrolKanan}>
            <div className={styles.wadahInputTanggal}>
              <label className={styles.labelTanggal}>Tanggal Mulai:</label>
              <input 
                type="date" 
                value={tanggalMulai} 
                min={minDate}
                max={maxDate}
                onChange={(e) => { 
                  setTanggalMulai(e.target.value); 
                  if (jadwalLokal.length > 0) { 
                    if(confirm("Ganti tanggal mereset draft. Lanjut?")) setJadwalLokal([]); 
                  } 
                }} 
                className={styles.inputTanggalNeo} 
              />
            </div>
            <button onClick={simpanSemuaKeDatabase} disabled={isMenyimpan || jadwalLokal.length === 0} className={`${styles.tombolSimpanServer} ${(isMenyimpan || jadwalLokal.length === 0) ? styles.nonaktif : styles.aktif}`}>
              {isMenyimpan ? <span>⏳ Menyimpan...</span> : <><FaCloudArrowUp size={18} /> Simpan {jadwalLokal.length > 0 ? `(${jadwalLokal.length})` : ''} Ke Server</>}
            </button>
          </div>
        </div>

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className={styles.panelAmunisi}>
              <h3 className={styles.judulAmunisi}>📚 Amunisi Mapel <span className={styles.hintAmunisi}>(Geser Kanan-Kiri, Tarik ke Bawah)</span></h3>
              <div className={styles.wadahScrollMapel}>
                {OPSI_MAPEL_KELAS.map(mapel => <DraggableMapel key={mapel} mapel={mapel} />)}
              </div>
            </div>

            <div className={styles.wadahPapanCatur}>
              <div className={styles.kotakScrollPapan}>
                <table className={styles.tabelPapanCatur}>
                  <thead>
                    <tr>
                      <th className={styles.thPojok}>KELAS / SESI</th>
                      {kolomHari.map(hari => (
                        <th key={hari.tanggalPenuh} className={`${styles.thTanggal} ${hari.isSabtu ? styles.sabtu : styles.normal}`}>
                          <div className={styles.teksHari}>{hari.namaHari}</div>
                          <div className={styles.teksTglCatur}>{hari.tanggalTampil}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAFTAR_KELAS_BIMBEL.map((kelas, index) => (
                      <tr key={kelas.id} className={styles.trKelas}>
                        <td className={styles.tdNamaKelas}>
                          <div className={styles.namaKelasTebal}>{kelas.nama}</div>
                          <div className={styles.badgeSesi}>Sesi {kelas.sesi}</div>
                        </td>
                        {kolomHari.map(hari => {
                          const idKordinatSel = `${kelas.id}|${hari.tanggalPenuh}`;
                          const draftLokal = cariDraftLokal(kelas.id, hari.tanggalPenuh);
                          const permanenDB = cariPermanenDB(kelas.nama, hari.tanggalPenuh);
                          
                          return (
                            <DroppableSel 
                              key={idKordinatSel} 
                              idSel={idKordinatSel} 
                              isSabtu={hari.isSabtu}
                              permanenDB={permanenDB}
                              draftLokal={draftLokal}
                              klikKartuJadwal={klikKartuJadwal}
                            />
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <DragOverlay dropAnimation={{ duration: 150 }}>
            {mapelAktifMelayang && <div className={styles.kartuMapelOverlay}><FaGripVertical color="#111827" /> {mapelAktifMelayang}</div>}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ==================== PANEL BAWAH: TABEL MANAJEMEN ==================== */}
      <div className={styles.panelTabelBawah}>
        <div className={styles.headerTabelBawah}>
          <div>
            <h3 className={styles.judulTabelBawah}>🗄️ Database Jadwal Permanen</h3>
            <p className={styles.subJudulTabelBawah}>Total: {jadwalBulanIni.length} Jadwal di Bulan Ini</p>
          </div>
          <div className={styles.wadahFilterBawah}>
            <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Filter:</span>
            {/* 🚀 PERBAIKAN: Pasang resetHalamanKeSatu() di trigger filter */}
            <input 
              type="date" 
              value={filterTglMulai} 
              min={minDate} 
              max={maxDate} 
              onChange={(e) => {
                setFilterTglMulai(e.target.value);
                resetHalamanKeSatu();
              }} 
              className={styles.inputTanggalNeo} 
            />
            <span style={{ fontWeight: '900' }}>-</span>
            <input 
              type="date" 
              value={filterTglAkhir} 
              min={minDate} 
              max={maxDate} 
              onChange={(e) => {
                setFilterTglAkhir(e.target.value);
                resetHalamanKeSatu();
              }} 
              className={styles.inputTanggalNeo} 
            />
            
            <select 
              value={filterKelas} 
              onChange={(e) => {
                setFilterKelas(e.target.value);
                resetHalamanKeSatu();
              }} 
              className={styles.inputTanggalNeo} 
              style={{ backgroundColor: 'white' }}
            >
              <option value="">Semua Kelas</option>
              {OPSI_KELAS.map(opsi => <option key={opsi} value={opsi}>{opsi}</option>)}
            </select>
            <button 
              onClick={() => { 
                setFilterTglMulai(""); 
                setFilterTglAkhir(""); 
                setFilterKelas(""); 
                resetHalamanKeSatu();
              }} 
              className={styles.btnReset}
            >
              Reset
            </button>
          </div>
        </div>

        <div className={styles.wadahTabel} style={{ marginBottom: '24px' }}>
          <table className={styles.tabelDataBawah}>
            <thead>
              <tr className={styles.trHeaderTabel}>
                <th className={styles.thTabelData}>Tanggal & Waktu</th>
                <th className={styles.thTabelData}>Kelas</th>
                <th className={styles.thTabelData}>Mapel</th>
                <th className={styles.thTabelData}>Pengajar</th>
                <th className={styles.thTabelData} style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {dataJadwalHalIni.length === 0 ? (
                <tr><td colSpan="5" className={styles.selKosong}>Tidak ada jadwal tersimpan.</td></tr>
              ) : (
                dataJadwalHalIni.map(j => (
                  <tr key={j._id} className={styles.trDataTabel}>
                    <td className={styles.tdDataTabel}>
                      <div style={{ fontWeight: '900', color: '#111827' }}>{formatTanggal(j.tanggal)}</div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280' }}>{j.jamMulai} - {j.jamSelesai}</div>
                    </td>
                    <td className={styles.tdDataTabel} style={{ fontWeight: '900', color: '#2563eb' }}>{j.kelasTarget}</td>
                    <td className={styles.tdDataTabel}><span className={styles.badgeMapelAbu}>{j.mapel}</span></td>
                    <td className={styles.tdDataTabel}>
                      <div style={{ fontWeight: '900' }}>👨‍🏫 {j.kodePengajar || 'Belum diatur'}</div>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280' }}>Pertemuan ke-{j.pertemuan || '?'}</div>
                    </td>
                    <td className={styles.tdDataTabel} style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => klikKartuJadwal(j, "permanen")} className={`${styles.tombolAksi} ${styles.btnEdit}`}>
                          Edit
                        </button>
                        <button onClick={() => klikHapusJadwalBawah(j._id, j.mapel, j.kelasTarget)} className={`${styles.tombolAksi} ${styles.btnHapus}`}>
                           Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar totalPages={totalPage} />
      </div>

      {/* ==================== MODAL TAMBAH (DROP) ==================== */}
      {modalTerbuka && dataDraft && (
        <div className={styles.overlayModal}>
          <div className={styles.kotakModal}>
            <h3 className={styles.headerModal}>⚙️ Detail Jadwal <FaXmark cursor="pointer" onClick={() => setModalTerbuka(false)} /></h3>
            <div className={styles.infoModalWadah}>
              <div>Mapel: <span style={{ color: '#2563eb' }}>{dataDraft.mapel}</span></div>
              <div>Kelas: <span>{dataDraft.kelas.nama}</span></div>
              <div style={{ color: '#ef4444' }}>Jam: {KAMUS_JAM_SESI[dataDraft.hari.isSabtu ? "sabtu" : "normal"][dataDraft.kelas.sesi].mulai} - {KAMUS_JAM_SESI[dataDraft.hari.isSabtu ? "sabtu" : "normal"][dataDraft.kelas.sesi].selesai}</div>
            </div>
            <div className={styles.wadahInputModal}>
              <label className={styles.labelModal}>Nama Pengajar</label>
              <input type="text" autoFocus placeholder="Misal: Pak Budi" value={inputPengajar} onChange={e => setInputPengajar(e.target.value)} className={styles.inputModal} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className={styles.labelModal}>Pertemuan Ke-</label>
              <input type="number" placeholder="Misal: 4" value={inputPertemuan} onChange={e => setInputPertemuan(e.target.value)} className={styles.inputModal} />
            </div>
            <button onClick={masukkanKePapan} className={styles.tombolModalSimpan}><FaCheck /> Masukkan ke Papan</button>
          </div>
        </div>
      )}

      {/* ==================== MODAL EDIT/HAPUS (KLIK KARTU) ==================== */}
      {modalEditTerbuka && jadwalEdit && (
        <div className={styles.overlayModal}>
          <div className={styles.kotakModal}>
            <h3 className={styles.headerModal}>
              ✏️ Aksi Jadwal <FaXmark cursor="pointer" onClick={() => setModalEditTerbuka(false)} />
            </h3>
            
            <div className={styles.infoModalWadah} style={{ backgroundColor: tipeEdit === 'draft' ? '#dbeafe' : '#f3f4f6' }}>
              <div style={{ color: tipeEdit === 'draft' ? '#2563eb' : '#4b5563', fontWeight: '900', marginBottom: '8px' }}>
                {tipeEdit === 'draft' ? '✨ Mode Draft' : '💾 Database Permanen'}
              </div>
              <div>Mapel: <span style={{ color: '#111827' }}>{jadwalEdit.mapel}</span></div>
              <div>Kelas: <span>{jadwalEdit.kelasTarget}</span></div>
            </div>

            {/* 🚀 PANEL KUIS BARU DI MODAL EDIT JADWAL */}
            {tipeEdit === 'permanen' && (
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', border: '2px dashed #94a3b8', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>
                  {isMemuatKuis ? "⏳ Memeriksa status kuis..." : (daftarStatusKuis[jadwalEdit._id] === 'siap' ? "✅ Kuis untuk kelas ini sudah disiapkan." : "⚠️ Kuis untuk kelas ini belum ada.")}
                </p>

                {daftarStatusKuis[jadwalEdit._id] === 'siap' ? (
                  <button 
                    onClick={handleLepasKuis}
                    disabled={isMemprosesKuis || isMemuatKuis}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: 'white', border: '3px solid #7f1d1d', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: (isMemprosesKuis || isMemuatKuis) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '3px 3px 0 #7f1d1d' }}
                  >
                    <FaTrashCan size={16} /> {isMemprosesKuis ? "MEMPROSES..." : "BATALKAN / LEPAS KUIS"}
                  </button>
                ) : (
                  <button 
                    onClick={bukaPanelBankSoal}
                    disabled={isMemprosesKuis || isMemuatKuis}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: '3px solid #1e3a8a', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: (isMemprosesKuis || isMemuatKuis) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '3px 3px 0 #1e3a8a' }}
                  >
                    <FaListUl size={16} /> {isMemprosesKuis ? "MEMPROSES..." : "PILIH DARI BANK SOAL"}
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label className={styles.labelModal}>Jam Mulai</label>
                <input type="time" value={formEdit.jamMulai} onChange={e => setFormEdit({...formEdit, jamMulai: e.target.value})} className={styles.inputModal} />
              </div>
              <div style={{ flex: 1 }}>
                <label className={styles.labelModal}>Jam Selesai</label>
                <input type="time" value={formEdit.jamSelesai} onChange={e => setFormEdit({...formEdit, jamSelesai: e.target.value})} className={styles.inputModal} />
              </div>
            </div>

            <div className={styles.wadahInputModal}>
              <label className={styles.labelModal}>Nama Pengajar</label>
              <input type="text" value={formEdit.pengajar} onChange={e => setFormEdit({...formEdit, pengajar: e.target.value})} className={styles.inputModal} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className={styles.labelModal}>Pertemuan Ke-</label>
              <input type="number" value={formEdit.pertemuan} onChange={e => setFormEdit({...formEdit, pertemuan: e.target.value})} className={styles.inputModal} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={hapusDariPapan} disabled={isProsesEdit}
                style={{ flex: 1, backgroundColor: '#ef4444', color: 'white', border: '3px solid #111827', padding: '12px', borderRadius: '8px', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', cursor: isProsesEdit ? 'not-allowed' : 'pointer', boxShadow: '4px 4px 0 #111827', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                <FaTrashCan /> Hapus
              </button>
              
              <button 
                onClick={simpanPerubahanJadwal} disabled={isProsesEdit}
                style={{ flex: 2, backgroundColor: '#facc15', color: '#111827', border: '3px solid #111827', padding: '12px', borderRadius: '8px', fontWeight: '900', fontSize: '14px', textTransform: 'uppercase', cursor: isProsesEdit ? 'not-allowed' : 'pointer', boxShadow: '4px 4px 0 #111827', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              >
                {isProsesEdit ? 'Memproses...' : <><FaPenToSquare /> Simpan Edit</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 OVERLAY MODAL PILIH BANK SOAL (UNTUK ADMIN) */}
      {isModalBankOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '4px solid #111827', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '8px 8px 0 #111827' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #111827', paddingBottom: '16px', marginBottom: '16px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontWeight: '900', color: '#111827' }}>PILIH PAKET SOAL</h2>
              <button onClick={() => setIsModalBankOpen(false)} style={{ background: 'white', border: '3px solid #111827', borderRadius: '8px', padding: '6px', cursor: 'pointer', boxShadow: '2px 2px 0 #ef4444' }}>
                <FaXmark size={20} color="#ef4444" />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingBank ? (
                <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Memuat Bank Soal...</p>
              ) : listBankSoal.length === 0 ? (
                <p style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>Belum ada Master Soal. Silakan buat di Tab Bank Soal terlebih dahulu.</p>
              ) : (
                listBankSoal.map((bank) => (
                  <div key={bank._id} style={{ background: 'white', border: '3px solid #111827', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '4px 4px 0 #cbd5e1' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontWeight: '900', color: '#111827', fontSize: '16px' }}>{bank.judul || "Tanpa Judul"}</h4>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>{bank.soal?.length || 0} Soal • {bank.durasi || 10} Menit</p>
                    </div>
                    <button 
                      onClick={() => handlePilihBankSoal(bank._id)} 
                      disabled={isMemprosesKuis}
                      style={{ padding: '10px 16px', background: '#22c55e', color: '#111827', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', cursor: isMemprosesKuis ? 'wait' : 'pointer' }}
                    >
                      {isMemprosesKuis ? "..." : "TERAPKAN"}
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}