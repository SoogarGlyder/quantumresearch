"use client";

import { useState, useEffect } from "react";
import { 
  FaXmark, FaFloppyDisk, FaImage, FaTrashCan, 
  FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaListUl, FaListOl, FaSuperscript, FaSubscript, FaTable, FaEraser,
  FaRotateLeft, FaRotateRight, FaHighlighter, FaEye, FaPlus, FaStar, FaClock,
  FaArrowUp, FaArrowDown, FaSquareCheck, FaRegSquare, FaEyeSlash,
  FaDownload // 🚀 TAMBAHAN: Ikon Import
} from "react-icons/fa6";
import { CldUploadWidget } from "next-cloudinary";
import { simpanKuis, getRiwayatKuisPengajar, ambilKuisByJadwal } from "../../actions/quizAction"; // 🚀 TAMBAHAN IMPORT ACTION
import styles from "../../app/admin/AdminPage.module.css";

// 🚀 IMPORT TIPTAP CORE & EXTENSIONS
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Superscript } from '@tiptap/extension-superscript';
import { Subscript } from '@tiptap/extension-subscript';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Highlight } from '@tiptap/extension-highlight';

import katex from 'katex';
import 'katex/dist/katex.min.css';

const renderLaTeX = (htmlString) => {
  if (!htmlString) return { __html: "" };
  const rendered = htmlString.replace(/\$([^\$]+)\$/g, (match, rumus) => {
    try { return katex.renderToString(rumus, { throwOnError: false }); } 
    catch (e) { return match; }
  });
  return { __html: rendered };
};

// --- 1. KOMPONEN EDITOR TIPTAP ---
const QuantumEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit, Underline, Superscript, Subscript, Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
    ],
    content: value,
    immediatelyRender: false, 
    onUpdate: ({ editor }) => { onChange(editor.getHTML()); },
    editorProps: {
      attributes: { style: 'min-height: 180px; padding: 20px; outline: none; background: white; font-size: 16px; line-height: 1.6;' },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value);
  }, [value, editor]);

  if (!editor) return null;

  const btnStyle = (active) => ({
    padding: '8px', background: active ? '#111827' : 'white', color: active ? '#facc15' : '#111827',
    border: '2px solid #111827', borderRadius: '6px', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s'
  });

  return (
    <div style={{ border: '4px solid #111827', borderRadius: '15px', overflow: 'hidden', boxShadow: '5px 5px 0 #cbd5e1' }}>
      <div style={{ padding: '10px', borderBottom: '4px solid #111827', background: '#f3f4f6', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive('bold'))}><FaBold /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive('italic'))}><FaItalic /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={btnStyle(editor.isActive('underline'))}><FaUnderline /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} style={btnStyle(editor.isActive('strike'))}><FaStrikethrough /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} style={btnStyle(editor.isActive('highlight'))}><FaHighlighter /></button>
        </div>
        <div style={{ width: '2px', height: '24px', background: '#cbd5e1' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="button" onClick={() => { editor.chain().focus().insertContent('$ $').run(); editor.commands.setTextSelection(editor.state.selection.from - 1); }} style={btnStyle(false)}>
            <span style={{fontWeight:'900', fontSize:'13px'}}>$\pi$</span>
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} style={btnStyle(editor.isActive('superscript'))}><FaSuperscript /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} style={btnStyle(editor.isActive('subscript'))}><FaSubscript /></button>
        </div>
        <div style={{ width: '2px', height: '24px', background: '#cbd5e1' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} style={btnStyle(editor.isActive({ textAlign: 'left' }))}><FaAlignLeft /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} style={btnStyle(editor.isActive({ textAlign: 'center' }))}><FaAlignCenter /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} style={btnStyle(editor.isActive({ textAlign: 'right' }))}><FaAlignRight /></button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} style={btnStyle(editor.isActive({ textAlign: 'justify' }))}><FaAlignJustify /></button>
        </div>
        <div style={{ width: '2px', height: '24px', background: '#cbd5e1' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnStyle(editor.isActive('bulletList'))}><FaListUl /></button>
          <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnStyle(editor.isActive('orderedList'))}><FaListOl /></button>
          <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} style={btnStyle(false)}><FaTable /></button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
          <button type="button" onClick={() => editor.chain().focus().undo().run()} style={btnStyle(false)}><FaRotateLeft /></button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} style={btnStyle(false)}><FaRotateRight /></button>
          <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().run()} style={btnStyle(false)}><FaEraser /></button>
        </div>
      </div>
      <EditorContent editor={editor} className="tiptap-editor-container" />
      <style>{`
        .tiptap-editor-container table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 15px 0; overflow: hidden; }
        .tiptap-editor-container table td, .tiptap-editor-container table th { min-width: 1em; border: 2px solid #111827; padding: 6px 10px; vertical-align: top; box-sizing: border-box; }
        .tiptap-editor-container table th { font-weight: bold; text-align: left; background-color: #f3f4f6; }
        .tiptap-editor-container p { margin-top: 0; margin-bottom: 10px; }
        .tiptap-editor-container ul, .tiptap-editor-container ol { padding-left: 20px; }
        .tiptap-editor-container mark { background-color: #fef08a; padding: 0 2px; border-radius: 2px; }
      `}</style>
    </div>
  );
};

// --- 2. MODAL KUIS UTAMA ---
export default function ModalKuis({ isOpen, onClose, jadwal, kuisLama, adminId, muatData }) {
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [durasiUjian, setDurasiUjian] = useState(10);

  // 🚀 STATE KHUSUS IMPORT KUIS
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [listRiwayatKuis, setListRiwayatKuis] = useState([]);
  const [isMengambil, setIsMengambil] = useState(false);

  const buatTemplateSoalBaru = () => ({
    tipeSoal: "PG", 
    pertanyaan: "", 
    gambar: "", 
    opsi: { A: "", B: "", C: "", D: "", E: "" }, 
    kunciJawaban: "", 
    bobotExp: 20, 
    jumlahOpsi: 5 
  });

  const [formSoal, setFormSoal] = useState([buatTemplateSoalBaru()]);

  useEffect(() => {
    if (isOpen) {
      if (kuisLama?.soal?.length > 0) {
        const mappedSoal = kuisLama.soal.map(s => ({
          ...s,
          tipeSoal: s.tipeSoal || "PG",
          bobotExp: s.bobotExp || 20,
          jumlahOpsi: s.jumlahOpsi || Object.keys(s.opsi || {}).length || 5
        }));
        setFormSoal(mappedSoal);
        setDurasiUjian(kuisLama.durasi || 10);
      } else {
        setFormSoal([buatTemplateSoalBaru()]);
        setDurasiUjian(10);
      }
    }
  }, [isOpen, kuisLama]);

  const handleTambahSoal = () => setFormSoal([...formSoal, buatTemplateSoalBaru()]);

  const handleHapusSoal = (index) => {
    if (formSoal.length <= 1) return alert("Minimal harus ada 1 soal!");
    if (window.confirm(`Yakin ingin menghapus Soal #${index + 1}?`)) {
      setFormSoal(formSoal.filter((_, i) => i !== index));
    }
  };

  const handleGeserSoal = (index, arah) => {
    if (arah === 'up' && index === 0) return; 
    if (arah === 'down' && index === formSoal.length - 1) return;
    const soalBaru = [...formSoal];
    const targetIndex = arah === 'up' ? index - 1 : index + 1;
    [soalBaru[index], soalBaru[targetIndex]] = [soalBaru[targetIndex], soalBaru[index]];
    setFormSoal(soalBaru);
  };

  const handleUbahTipeSoal = (index, tipeBaru) => {
    const soalBaru = [...formSoal];
    const s = soalBaru[index];
    s.tipeSoal = tipeBaru;

    if (tipeBaru === "PG") {
      s.kunciJawaban = "";
      s.opsi = { A: "", B: "", C: "", D: "", E: "" };
    } else if (tipeBaru === "PG_KOMPLEKS") {
      s.kunciJawaban = []; 
      s.opsi = { A: "", B: "", C: "", D: "", E: "" };
    } else if (tipeBaru === "BENAR_SALAH") {
      s.kunciJawaban = "";
      s.opsi = { A: "Benar", B: "Salah" }; 
      s.jumlahOpsi = 2;
    } else if (tipeBaru === "ISIAN") {
      s.kunciJawaban = "";
      s.opsi = {}; 
    }
    setFormSoal(soalBaru);
  };

  const toggleKunciKompleks = (index, abjad) => {
    const soalBaru = [...formSoal];
    let currentKeys = Array.isArray(soalBaru[index].kunciJawaban) ? [...soalBaru[index].kunciJawaban] : [];
    
    if (currentKeys.includes(abjad)) {
      currentKeys = currentKeys.filter(k => k !== abjad);
    } else {
      currentKeys.push(abjad);
    }
    
    soalBaru[index].kunciJawaban = currentKeys.sort();
    setFormSoal(soalBaru);
  };

  const handleUpdateSoal = (index, field, value, opsiKey = null) => {
    const soalBaru = [...formSoal];
    if (opsiKey) {
      if (!soalBaru[index].opsi) soalBaru[index].opsi = {};
      soalBaru[index].opsi[opsiKey] = value;
    } else {
      soalBaru[index][field] = value;
      if (field === 'jumlahOpsi' && value === 4 && soalBaru[index].kunciJawaban === 'E') {
        soalBaru[index].kunciJawaban = '';
      }
    }
    setFormSoal(soalBaru);
  };

  // 🚀 FUNGSI BARU: TOGGLE & EKSEKUSI IMPORT KUIS
  const togglePanelImport = async () => {
    setShowImportPanel(!showImportPanel);
    if (!showImportPanel && listRiwayatKuis.length === 0) {
      const res = await getRiwayatKuisPengajar(adminId);
      if (res.sukses) setListRiwayatKuis(res.data);
    }
  };

  const handleEksekusiImport = async (jadwalIdLama) => {
    if(!window.confirm("Yakin ingin ME-REPLACE soal saat ini dengan soal dari kelas tersebut?")) return;
    
    setIsMengambil(true);
    const kuisLamaCoy = await ambilKuisByJadwal(jadwalIdLama);
    if (kuisLamaCoy && kuisLamaCoy.soal) {
       const mappedSoal = kuisLamaCoy.soal.map(s => ({
         ...s,
         tipeSoal: s.tipeSoal || "PG",
         bobotExp: s.bobotExp || 20,
         jumlahOpsi: s.jumlahOpsi || Object.keys(s.opsi || {}).length || 5
       }));
       setFormSoal(mappedSoal);
       setDurasiUjian(kuisLamaCoy.durasi || 10);
       setShowImportPanel(false);
       alert("✅ Berhasil meng-copy soal! Silakan edit atau langsung klik Publikasikan.");
    } else {
       alert("❌ Gagal menarik soal. Kuis mungkin sudah dihapus.");
    }
    setIsMengambil(false);
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!jadwal?._id) return alert("⚠️ Data jadwal tidak valid.");
    
    const adaKosong = formSoal.some(s => {
      if (!s.pertanyaan) return true;
      if (s.tipeSoal === "PG_KOMPLEKS" && (!Array.isArray(s.kunciJawaban) || s.kunciJawaban.length === 0)) return true;
      if (s.tipeSoal !== "PG_KOMPLEKS" && !s.kunciJawaban) return true;
      return false;
    });

    if (adaKosong) return alert("⚠️ Semua Pertanyaan dan Kunci Jawaban wajib diisi dengan benar!");

    setLoading(true);
    try {
      const res = await simpanKuis(jadwal._id, adminId, formSoal, durasiUjian);
      if (res.sukses) {
        alert("✅ Kuis CBT Berhasil Dipublikasikan!");
        if (muatData) muatData();
        onClose();
      } else { alert("❌ " + res.pesan); }
    } catch (err) { alert("Terjadi kesalahan jaringan."); } 
    finally { setLoading(false); }
  };

  if (!isOpen || !jadwal) return null;

  return (
    <div className={styles.overlayModal} style={{ zIndex: 9999 }}>
      <div className={styles.kotakModal} style={{ maxWidth: '1050px', width: '96%', maxHeight: '96vh', overflowY: 'auto', padding: '20px', background: '#f8fafc' }}>
        
        {/* HEADER MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '4px solid #111827', paddingBottom: '15px' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase', color: '#111827', fontSize: '26px' }}>🧠 CBT Engine Pro</h2>
            <p style={{ margin: '5px 0 0 0', fontSize: '15px', color: '#2563eb', fontWeight: '900' }}>
              {jadwal.mapel} | {jadwal.kelasTarget}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'white', border: '3px solid #111827', borderRadius: '10px', cursor: 'pointer', padding: '8px', boxShadow: '4px 4px 0 #ef4444' }}>
            <FaXmark size={24} color="#ef4444" />
          </button>
        </div>

        {/* FORM UTAMA */}
        <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* 🚀 PANEL IMPORT SOAL DARI KELAS LAIN */}
          <div style={{ marginBottom: '5px' }}>
            <button 
              type="button" 
              onClick={togglePanelImport}
              style={{ width: '100%', padding: '15px', background: showImportPanel ? '#111827' : '#e0e7ff', color: showImportPanel ? 'white' : '#111827', border: '4px solid #111827', borderRadius: '12px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '4px 4px 0 #111827', transition: '0.2s' }}
            >
              <FaDownload size={20} /> {showImportPanel ? "TUTUP PANEL BANK SOAL" : "IMPORT SOAL DARI KELAS LAIN (BANK SOAL)"}
            </button>

            {showImportPanel && (
              <div style={{ marginTop: '15px', padding: '20px', background: '#f8fafc', border: '4px dashed #3b82f6', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#1d4ed8', fontWeight: '900', textTransform: 'uppercase' }}>Pilih Kuis Sebelumnya:</h4>
                
                {listRiwayatKuis.length === 0 ? (
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#64748b' }}>Belum ada riwayat kuis yang pernah Anda buat.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
                    {listRiwayatKuis.map((riwayat) => (
                      <div key={riwayat.jadwalId} style={{ background: 'white', border: '3px solid #111827', borderRadius: '10px', padding: '15px', boxShadow: '4px 4px 0 #cbd5e1' }}>
                        <p style={{ margin: '0 0 5px 0', fontWeight: '900', color: '#111827' }}>{riwayat.mapel}</p>
                        <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b', fontWeight: 'bold' }}>Kelas {riwayat.kelas} • {new Date(riwayat.tanggal).toLocaleDateString('id-ID')}</p>
                        <button 
                          type="button" 
                          disabled={isMengambil}
                          onClick={() => handleEksekusiImport(riwayat.jadwalId)}
                          style={{ width: '100%', padding: '10px', background: '#22c55e', color: 'white', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', cursor: isMengambil ? 'wait' : 'pointer' }}
                        >
                          {isMengambil ? "MENG-COPY..." : `COPY ${riwayat.jumlahSoal} SOAL`}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PENGATURAN GLOBAL (DURASI & PREVIEW TOGGLE) */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            
            {/* BOX DURASI */}
            <div style={{ flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef08a', border: '4px solid #111827', padding: '15px 20px', borderRadius: '15px', boxShadow: '6px 6px 0 #111827' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#111827', padding: '10px', borderRadius: '50%', display: 'flex' }}>
                  <FaClock size={20} color="#facc15" />
                </div>
                <span style={{ fontWeight: '900', color: '#111827', fontSize: '16px', textTransform: 'uppercase' }}>Durasi:</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="number" min="1" max="180" value={durasiUjian} onChange={(e) => setDurasiUjian(Number(e.target.value))}
                  style={{ width: '70px', padding: '8px', fontSize: '16px', fontWeight: '900', border: '3px solid #111827', borderRadius: '8px', textAlign: 'center', outline: 'none' }}
                />
                <span style={{ fontWeight: '900', color: '#111827', fontSize: '14px' }}>Menit</span>
              </div>
            </div>

            {/* BOX TOGGLE PREVIEW ON/OFF */}
            <div 
              onClick={() => setShowPreview(!showPreview)}
              style={{ flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: showPreview ? '#dcfce3' : '#f1f5f9', border: '4px solid #111827', padding: '15px 20px', borderRadius: '15px', boxShadow: '6px 6px 0 #111827', cursor: 'pointer', transition: '0.2s' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#111827', padding: '10px', borderRadius: '50%', display: 'flex' }}>
                  {showPreview ? <FaEye size={20} color="#4ade80" /> : <FaEyeSlash size={20} color="#94a3b8" />}
                </div>
                <span style={{ fontWeight: '900', color: '#111827', fontSize: '16px', textTransform: 'uppercase' }}>Live Preview:</span>
              </div>
              <div style={{ background: showPreview ? '#166534' : '#475569', padding: '6px 15px', borderRadius: '8px', border: '2px solid #111827' }}>
                <span style={{ fontWeight: '900', color: 'white', fontSize: '14px' }}>{showPreview ? 'ON' : 'OFF'}</span>
              </div>
            </div>

          </div>

          {/* DAFTAR KARTU SOAL */}
          {formSoal.map((soal, i) => {
            const tipe = soal.tipeSoal || "PG";
            const opsiAbjad = soal.jumlahOpsi === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
            
            return (
              <div key={i} style={{ padding: '20px', border: '4px solid #111827', borderRadius: '20px', background: '#fff', boxShadow: '8px 8px 0 #cbd5e1' }}>
                
                {/* TOOLBAR KARTU SOAL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '15px', background: '#f1f5f9', padding: '15px', borderRadius: '12px', border: '3px solid #111827' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '900', background: '#111827', color: '#facc15', padding: '8px 15px', borderRadius: '8px', fontSize: '16px' }}>SOAL #{i+1}</span>
                    
                    <select 
                      value={tipe} 
                      onChange={(e) => handleUbahTipeSoal(i, e.target.value)} 
                      style={{ padding: '8px 12px', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', background: '#e0e7ff', color: '#111827', cursor: 'pointer', fontSize: '14px' }}
                    >
                      <option value="PG">🔘 PILIHAN GANDA</option>
                      <option value="PG_KOMPLEKS">☑️ PG KOMPLEKS</option>
                      <option value="BENAR_SALAH">⚖️ BENAR / SALAH</option>
                      <option value="ISIAN">✍️ ISIAN SINGKAT</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', background: '#fef08a', border: '3px solid #111827', borderRadius: '8px', overflow: 'hidden' }}>
                      <span style={{ padding: '8px 10px', background: '#111827', color: '#facc15', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}><FaStar /> EXP</span>
                      <input type="number" min="0" value={soal.bobotExp} onChange={(e) => handleUpdateSoal(i, 'bobotExp', Number(e.target.value))} style={{ width: '60px', padding: '8px', border: 'none', fontWeight: '900', fontSize: '16px', outline: 'none', textAlign: 'center', background: 'transparent' }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <CldUploadWidget uploadPreset="quantum_unsigned" onSuccess={(res) => handleUpdateSoal(i, 'gambar', res.info.secure_url)}>
                          {({ open }) => (
                              <button type="button" onClick={() => open()} style={{ padding: '8px 15px', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', background: soal.gambar ? '#dcfce3' : '#fff', display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
                                  <FaImage /> {soal.gambar ? 'GAMBAR OK' : 'GAMBAR'}
                              </button>
                          )}
                      </CldUploadWidget>

                      <div style={{ display: 'flex', gap: '4px', border: '3px solid #111827', borderRadius: '8px', overflow: 'hidden', background: '#111827' }}>
                        <button type="button" onClick={() => handleGeserSoal(i, 'up')} disabled={i === 0} style={{ padding: '8px 12px', background: i === 0 ? '#475569' : '#3b82f6', color: 'white', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer' }}><FaArrowUp size={14} /></button>
                        <button type="button" onClick={() => handleGeserSoal(i, 'down')} disabled={i === formSoal.length - 1} style={{ padding: '8px 12px', background: i === formSoal.length - 1 ? '#475569' : '#3b82f6', color: 'white', border: 'none', cursor: i === formSoal.length - 1 ? 'not-allowed' : 'pointer' }}><FaArrowDown size={14} /></button>
                      </div>
                      <button type="button" onClick={() => handleHapusSoal(i)} style={{ padding: '10px', background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTrashCan size={16} /></button>
                  </div>
                </div>

                {/* EDITOR PERTANYAAN */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontWeight: '900', display: 'block', marginBottom: '12px', fontSize: '15px', color: '#111827' }}>TEKS PERTANYAAN:</label>
                  <QuantumEditor value={soal.pertanyaan} onChange={(html) => handleUpdateSoal(i, 'pertanyaan', html)} />
                </div>

                {/* KONDISIONAL RENDER BERDASARKAN TIPE SOAL */}
                
                {tipe === "PG" && (
                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '3px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <span style={{ fontWeight: '900', color: '#111827' }}>PILIHAN JAWABAN:</span>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <select value={soal.jumlahOpsi} onChange={(e) => handleUpdateSoal(i, 'jumlahOpsi', Number(e.target.value))} style={{ padding: '6px 12px', border: '2px solid #111827', borderRadius: '6px', fontWeight: 'bold' }}>
                          <option value={4}>4 Opsi (A-D)</option><option value={5}>5 Opsi (A-E)</option>
                        </select>
                        <select required value={soal.kunciJawaban} onChange={(e) => handleUpdateSoal(i, 'kunciJawaban', e.target.value)} style={{ padding: '6px 12px', border: '2px solid #111827', borderRadius: '6px', fontWeight: 'bold', background: '#4ade80' }}>
                          <option value="">SET KUNCI</option>{opsiAbjad.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                      {opsiAbjad.map(opsi => (
                        <div key={opsi} style={{ border: '3px solid #111827', borderRadius: '8px', overflow: 'hidden' }}>
                          <div style={{ background: soal.kunciJawaban === opsi ? '#4ade80' : '#111827', color: soal.kunciJawaban === opsi ? '#111827' : 'white', padding: '8px 15px', fontWeight: '900', display: 'flex', justifyContent: 'space-between' }}>
                            <span>OPSI {opsi}</span> {soal.kunciJawaban === opsi && <span>(KUNCI)</span>}
                          </div>
                          <textarea required value={soal.opsi ? soal.opsi[opsi] : ""} onChange={(e) => handleUpdateSoal(i, 'opsi', e.target.value, opsi)} style={{ width: '100%', padding: '12px', border: 'none', minHeight: '60px', fontWeight: '700', outline: 'none', resize: 'vertical' }} placeholder={`Jawaban ${opsi}...`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tipe === "PG_KOMPLEKS" && (
                  <div style={{ background: '#f0fdfa', padding: '20px', borderRadius: '12px', border: '3px solid #0d9488' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <span style={{ fontWeight: '900', color: '#134e4a' }}>OPSI & KUNCI (BISA LEBIH DARI SATU):</span>
                      <select value={soal.jumlahOpsi} onChange={(e) => handleUpdateSoal(i, 'jumlahOpsi', Number(e.target.value))} style={{ padding: '6px 12px', border: '2px solid #134e4a', borderRadius: '6px', fontWeight: 'bold' }}>
                          <option value={4}>4 Opsi (A-D)</option><option value={5}>5 Opsi (A-E)</option>
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                      {opsiAbjad.map(opsi => {
                        const isKunci = Array.isArray(soal.kunciJawaban) && soal.kunciJawaban.includes(opsi);
                        return (
                          <div key={opsi} style={{ border: '3px solid #111827', borderRadius: '8px', overflow: 'hidden' }}>
                            <div 
                              onClick={() => toggleKunciKompleks(i, opsi)}
                              style={{ background: isKunci ? '#4ade80' : '#111827', color: isKunci ? '#111827' : 'white', padding: '8px 15px', fontWeight: '900', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center' }}
                            >
                              <span>OPSI {opsi}</span> 
                              {isKunci ? <FaSquareCheck size={18} /> : <FaRegSquare size={18} />}
                            </div>
                            <textarea required value={soal.opsi ? soal.opsi[opsi] : ""} onChange={(e) => handleUpdateSoal(i, 'opsi', e.target.value, opsi)} style={{ width: '100%', padding: '12px', border: 'none', minHeight: '60px', fontWeight: '700', outline: 'none', resize: 'vertical' }} placeholder={`Jawaban ${opsi}...`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tipe === "BENAR_SALAH" && (
                  <div style={{ background: '#fdf4ff', padding: '20px', borderRadius: '12px', border: '3px solid #a21caf', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#701a75', fontWeight: '900' }}>TENTUKAN PERNYATAAN DI ATAS BENAR ATAU SALAH:</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                      <button type="button" onClick={() => handleUpdateSoal(i, 'kunciJawaban', 'A')} style={{ padding: '15px 40px', fontSize: '18px', fontWeight: '900', borderRadius: '10px', cursor: 'pointer', border: '4px solid #111827', background: soal.kunciJawaban === 'A' ? '#4ade80' : '#fff', color: '#111827', boxShadow: soal.kunciJawaban === 'A' ? 'none' : '4px 4px 0 #111827', transform: soal.kunciJawaban === 'A' ? 'translate(4px, 4px)' : 'none' }}>
                        ✅ BENAR
                      </button>
                      <button type="button" onClick={() => handleUpdateSoal(i, 'kunciJawaban', 'B')} style={{ padding: '15px 40px', fontSize: '18px', fontWeight: '900', borderRadius: '10px', cursor: 'pointer', border: '4px solid #111827', background: soal.kunciJawaban === 'B' ? '#f87171' : '#fff', color: '#111827', boxShadow: soal.kunciJawaban === 'B' ? 'none' : '4px 4px 0 #111827', transform: soal.kunciJawaban === 'B' ? 'translate(4px, 4px)' : 'none' }}>
                        ❌ SALAH
                      </button>
                    </div>
                  </div>
                )}

                {tipe === "ISIAN" && (
                  <div style={{ background: '#fffbeb', padding: '20px', borderRadius: '12px', border: '3px solid #b45309' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#78350f', fontWeight: '900' }}>KUNCI JAWABAN ISIAN SINGKAT:</h4>
                    <input 
                      type="text" required
                      value={soal.kunciJawaban} 
                      onChange={(e) => handleUpdateSoal(i, 'kunciJawaban', e.target.value)}
                      placeholder="Ketik kunci jawaban persis di sini (Sistem otomatis mengabaikan huruf besar/kecil)..."
                      style={{ width: '100%', padding: '15px', border: '3px solid #111827', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', outline: 'none', background: '#fff' }}
                    />
                  </div>
                )}

                {/* LIVE PREVIEW (DIKONTROL OLEH TOGGLE ON/OFF) */}
                {showPreview && (
                  <div style={{ marginTop: '30px', padding: '20px', background: '#eff6ff', border: '4px dashed #3b82f6', borderRadius: '15px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#1d4ed8', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaEye size={18} /> PREVIEW RENDER (LATEX & TAMPILAN)
                    </div>
                    {soal.gambar && (
                      <div style={{ position: 'relative', width: 'fit-content', marginBottom: '20px', border: '3px solid #111827', borderRadius: '10px', overflow: 'hidden', boxShadow: '4px 4px 0 #111827' }}>
                        <img src={soal.gambar} alt="Preview" style={{ maxHeight: '200px', display: 'block' }} />
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={renderLaTeX(soal.pertanyaan || "<em>Belum ada pertanyaan...</em>")} style={{ fontSize: '18px', color: '#111827', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.6' }} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(tipe === "PG" || tipe === "PG_KOMPLEKS") && opsiAbjad.map(opt => (
                        soal.opsi && soal.opsi[opt] ? (
                          <div key={opt} style={{ display: 'flex', gap: '15px', background: 'white', padding: '12px 20px', border: '3px solid #111827', borderRadius: '10px', alignItems: 'center', boxShadow: '2px 2px 0 #111827' }}>
                            <span style={{ fontWeight: '900', background: '#111827', color: 'white', padding: '4px 10px', borderRadius: '6px' }}>{opt}</span>
                            <span dangerouslySetInnerHTML={renderLaTeX(soal.opsi[opt])} style={{ fontWeight: 'bold', fontSize: '15px', color: '#111827' }} />
                          </div>
                        ) : null
                      ))}

                      {tipe === "BENAR_SALAH" && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ padding: '10px 20px', background: 'white', border: '3px solid #111827', borderRadius: '8px', fontWeight: 'bold' }}>✅ BENAR</div>
                          <div style={{ padding: '10px 20px', background: 'white', border: '3px solid #111827', borderRadius: '8px', fontWeight: 'bold' }}>❌ SALAH</div>
                        </div>
                      )}

                      {tipe === "ISIAN" && (
                        <div style={{ padding: '15px', background: 'white', border: '3px dashed #111827', borderRadius: '8px', color: '#64748b', fontStyle: 'italic' }}>
                          [Kolom ketik jawaban siswa akan muncul di sini...]
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })}

          <button type="button" onClick={handleTambahSoal} style={{ padding: '20px', background: '#dcfce3', color: '#166534', border: '4px dashed #22c55e', borderRadius: '20px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '-10px' }}>
            <FaPlus size={22} /> TAMBAH SOAL BARU KE DALAM KUIS
          </button>

          <button type="submit" disabled={loading} style={{ padding: '25px', background: '#111827', color: '#facc15', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '22px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 0 #2563eb', marginBottom: '30px' }}>
            {loading ? "MENYIMPAN DATA..." : <><FaFloppyDisk size={26} /> PUBLIKASIKAN KUIS ({formSoal.length} SOAL)</>}
          </button>
        </form>
      </div>
    </div>
  );
}