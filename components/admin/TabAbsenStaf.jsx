"use client";

// ============================================================================
// 1. IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect, useMemo, memo } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

import FilterInput from "../ui/FilterInput";
import PaginationBar from "../ui/PaginationBar";

import { unduhExcel } from "../../utils/exportExcel";
import { formatTanggal, potongDataPagination, formatYYYYMMDD } from "../../utils/formatHelper";
import { LIMIT_DATA } from "../../utils/constants";

import { 
  FaFileExcel, FaFilter, FaClock, FaRightFromBracket, FaUserTie, 
  FaMagnifyingGlass, FaPlus, FaTrash, FaXmark, FaFloppyDisk 
} from "react-icons/fa6";
import styles from "../../app/admin/AdminPage.module.css";

import { prosesSimpanAbsenManual, prosesHapusAbsenStaf } from "../../actions/adminAction";

// ============================================================================
// 2. SUB-KOMPONEN: MODAL SUNTIK ABSEN (Terintegrasi)
// ============================================================================
const ModalAbsenStaf = memo(({ isOpen, onClose, dataPengajar = [], muatData }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pengajarId: "",
    tanggal: formatYYYYMMDD(new Date()),
    keterangan: "Input Manual Admin (Otomatis 12:00-20:00)"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.pengajarId) return alert("Pilih Pengajar!");
    
    setLoading(true);
    
    // 🚀 FIX: Suntikkan jamMasuk dan jamKeluar ke payload sebelum dikirim
    const payloadAbsen = {
      ...form,
      jamMasuk: "12:00",
      jamKeluar: "20:00"
    };

    const res = await prosesSimpanAbsenManual(payloadAbsen);
    if (res.sukses) {
      alert(res.pesan);
      if (muatData) muatData(); 
      onClose();
    } else {
      alert(res.pesan);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', border: '4px solid #111827', boxShadow: '12px 12px 0 #111827', width: '100%', maxWidth: '400px', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Header Modal */}
        <div style={{ padding: '16px', background: '#2563eb', borderBottom: '4px solid #111827', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <h3 style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase', fontSize: '16px' }}>➕ Suntik Absen Manual</h3>
          <FaXmark onClick={onClose} cursor="pointer" size={24} />
        </div>

        {/* Body Modal */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#6b7280', marginBottom: '4px' }}>KODE PENGAJAR</label>
            <select 
              required 
              className={styles.inputCari} 
              value={form.pengajarId}
              onChange={e => setForm({...form, pengajarId: e.target.value})}
              style={{ width: '100%', border: '3px solid #111827', padding: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
            >
              <option value="">-- Pilih Kode Pengajar --</option>
              {/* 🚀 Fallback aman untuk render daftar pengajar */}
              {(dataPengajar || []).length > 0 ? (
                dataPengajar.map(p => (
                  <option key={p._id} value={p._id}>{p.kodePengajar} - {p.nama}</option>
                ))
              ) : (
                <option value="" disabled>Data pengajar kosong...</option>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#6b7280', marginBottom: '4px' }}>TANGGAL KERJA</label>
            <input 
              type="date" required 
              className={styles.inputCari}
              value={form.tanggal}
              onChange={e => setForm({...form, tanggal: e.target.value})}
              style={{ width: '100%', border: '3px solid #111827', padding: '10px' }}
            />
          </div>

          <div style={{ backgroundColor: '#fef9c3', padding: '10px', borderRadius: '8px', border: '2px solid #111827', fontSize: '12px', fontWeight: 'bold' }}>
            💡 Jam akan otomatis diisi:<br/>
            <span style={{ color: '#2563eb' }}>12:00 WIB s/d 20:00 WIB</span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#6b7280', marginBottom: '4px' }}>KETERANGAN (Opsional)</label>
            <input 
              type="text" placeholder="Cth: Masuk saat Libur Nasional"
              className={styles.inputCari}
              value={form.keterangan}
              onChange={e => setForm({...form, keterangan: e.target.value})}
              style={{ width: '100%', border: '3px solid #111827', padding: '10px' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.tombolSimpanBiruBaru} 
            style={{ width: '100%', padding: '14px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? "MEMPROSES..." : <><FaFloppyDisk /> SIMPAN PRESENSI</>}
          </button>
        </form>
      </div>
    </div>
  );
});
ModalAbsenStaf.displayName = "ModalAbsenStaf";

// ============================================================================
// 3. MAIN COMPONENT (TAB ABSEN STAF)
// ============================================================================
export default function TabAbsenStaf({ dataAbsenStaf = [], dataPengajar = [], bulanAktif, muatData }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const page = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = LIMIT_DATA.PAGINATION_DEFAULT;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filterTglAbsen, setFilterTglAbsen] = useState("");
  const [filterNama, setFilterNama] = useState("");
  
  useEffect(() => {
    setFilterTglAbsen("");
    setFilterNama("");
  }, [bulanAktif]);

  const { minDate, maxDate } = useMemo(() => {
    if (!bulanAktif) return { minDate: "", maxDate: "" };

    const [tahunStr, bulanStr] = bulanAktif.split("-");
    const y = Number(tahunStr);
    const m = Number(bulanStr) - 1; 

    const minObj = new Date(y, m - 1, 29);
    const minYYYY = minObj.getFullYear();
    const minMM = String(minObj.getMonth() + 1).padStart(2, '0');
    const min = `${minYYYY}-${minMM}-29`;

    const max = `${tahunStr}-${bulanStr}-28`;

    return { minDate: min, maxDate: max };
  }, [bulanAktif]);

  // 🚀 FIX PAGINATION: Hapus `searchParams` dari dependency array!
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("page")) {
      params.delete("page");
      replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTglAbsen, filterNama]); 

  const absenBulanIni = useMemo(() => {
    return dataAbsenStaf.filter(a => {
      if (!a.waktuMasuk) return false;
      const tglStr = formatYYYYMMDD(a.waktuMasuk);
      return tglStr >= minDate && tglStr <= maxDate;
    });
  }, [dataAbsenStaf, minDate, maxDate]);

  const dataDifilter = useMemo(() => {
    let hasil = [...absenBulanIni];

    if (filterTglAbsen) {
      hasil = hasil.filter(a => formatYYYYMMDD(a.waktuMasuk) === filterTglAbsen);
    }

    if (filterNama) {
      const keyword = filterNama.toLowerCase();
      hasil = hasil.filter(a => 
        (a.pengajarId?.nama || "").toLowerCase().includes(keyword) ||
        (a.pengajarId?.kodePengajar || "").toLowerCase().includes(keyword)
      );
    }

    return hasil;
  }, [absenBulanIni, filterTglAbsen, filterNama]);

  const { totalPage, dataTerpotong: dataHalIni } = potongDataPagination(dataDifilter, page, ITEMS_PER_PAGE);

  const handleHapus = async (id) => {
    if (confirm("Hapus data presensi staf ini?")) {
      const res = await prosesHapusAbsenStaf(id);
      if (res.sukses) {
        if (muatData) muatData();
      } else {
        alert(res.pesan);
      }
    }
  };

  return (
    <div className={`${styles.isiTab} ${styles.SembunyiPrint} ${styles.wadahMonitoring}`}>
      
      {/* HEADER & EXCEL */}
      <div className={styles.headerTabWrapper}>
        <h2 className={styles.judulIsiTab} style={{margin: 0}}>Presensi Staff / Pengajar</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* 🚀 TOMBOL SUNTIK ABSEN */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className={styles.tombolSimpanBiruBaru}
            style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', border: '3px solid #111827' }}
          >
            <FaPlus /> Suntik Absen
          </button>

          <button 
            onClick={() => unduhExcel(dataDifilter, "absen-staf")} 
            className={styles.btnExcel}
          >
            <FaFileExcel /> Unduh Excel ({dataDifilter.length})
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FaFilter color="#111827" size={18} style={{marginRight: '8px'}} />
          <span className={styles.labelFilter}>Filter:</span>
        </div>
        
        <div className={styles.wadahCari} style={{ minWidth: '180px' }}>
          <div className={styles.iconCari}><FaMagnifyingGlass color="#6b7280" /></div>
          <input 
            type="text" 
            placeholder="Cari Nama / Kode..." 
            value={filterNama} 
            onChange={(e) => setFilterNama(e.target.value)} 
            className={styles.inputCari}
          />
        </div>

        <FilterInput 
          type="date" 
          value={filterTglAbsen} 
          onChange={(e) => setFilterTglAbsen(e.target.value)} 
          min={minDate}
          max={maxDate}
        />

        <button onClick={() => { setFilterTglAbsen(""); setFilterNama(""); }} className={styles.btnReset}>
          Reset
        </button>
      </div>

      {/* TABEL DATA */}
      <div className={styles.wadahTabel}>
        <table className={styles.tabelStyle}>
          <thead>
            <tr>
              <th>Pengajar</th>
              <th>Tanggal</th>
              <th>Clock-In</th>
              <th>Clock-Out</th>
              <th style={{textAlign: 'center'}}>Status</th>
              <th style={{textAlign: 'center'}}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dataHalIni.length === 0 ? (
              <tr><td colSpan="6" className={styles.selKosong}>Tidak ada data absen staf di periode ini.</td></tr>
            ) : (
              dataHalIni.map((absen) => (
                <tr key={absen._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ background: "#111827", color: "white", padding: "8px", borderRadius: "8px", border: "2px solid #facc15" }}>
                        <FaUserTie size={16} />
                      </div>
                      <div>
                        <p className={styles.teksNama} style={{textTransform: 'uppercase'}}>{absen.pengajarId?.nama || "Staff"}</p>
                        <p className={styles.teksKelas} style={{color: '#2563eb'}}>{absen.keterangan || `KODE: ${absen.pengajarId?.kodePengajar || "-"}`}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: "800" }}>{formatTanggal(absen.waktuMasuk)}</td>
                  <td style={{ color: "#15803d", fontWeight: "900" }}>
                    <FaClock size={12} /> {new Date(absen.waktuMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td style={{ color: absen.waktuKeluar ? "#ef4444" : "#9ca3af", fontWeight: "900" }}>
                    {absen.waktuKeluar ? (
                      <><FaRightFromBracket size={12} /> {new Date(absen.waktuKeluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</>
                    ) : "--:--"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`${styles.badgeStatus} ${absen.waktuKeluar ? styles.statusSelesai : styles.statusBerjalan}`} style={!absen.waktuKeluar ? { animation: 'brutalPulse 2s infinite' } : {}}>
                      {absen.waktuKeluar ? "SELESAI" : "AKTIF"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button 
                      onClick={() => handleHapus(absen._id)} 
                      style={{ padding: '6px', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                      title="Hapus Data Presensi"
                    >
                      <FaTrash size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '24px' }}>
        <PaginationBar totalPages={totalPage} />
      </div>

      {/* 🚀 MODAL ABSEN DITAMPILKAN DI SINI */}
      <ModalAbsenStaf 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        dataPengajar={dataPengajar} 
        muatData={muatData}
      />

    </div>
  );
}