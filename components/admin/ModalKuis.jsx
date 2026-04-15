"use client";

import { useState, useEffect } from "react";
import { 
  FaXmark, FaFloppyDisk, FaImage, FaTrashCan, 
  FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaListUl, FaListOl, FaSuperscript, FaSubscript, FaTable, FaEraser,
  FaRotateLeft, FaRotateRight, FaHighlighter, FaEye, FaPlus, FaStar, FaClock
} from "react-icons/fa6";
import { CldUploadWidget } from "next-cloudinary";
import { simpanKuis } from "../../actions/quizAction";
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
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
  
  // 🚀 STATE DURASI (Default 10 Menit)
  const [durasiUjian, setDurasiUjian] = useState(10);

  const buatTemplateSoalBaru = () => ({
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
          bobotExp: s.bobotExp || 20,
          jumlahOpsi: s.jumlahOpsi || Object.keys(s.opsi || {}).length || 5
        }));
        setFormSoal(mappedSoal);
        // 🚀 Set Durasi dari Database (Atau default 10 jika kosong)
        setDurasiUjian(kuisLama.durasi || 10);
      } else {
        setFormSoal([buatTemplateSoalBaru()]);
        setDurasiUjian(10);
      }
    }
  }, [isOpen, kuisLama]);

  const handleTambahSoal = () => {
    setFormSoal([...formSoal, buatTemplateSoalBaru()]);
  };

  const handleHapusSoal = (index) => {
    if (formSoal.length <= 1) return alert("Minimal harus ada 1 soal dalam kuis ini!");
    const konfirmasi = window.confirm(`Yakin ingin menghapus Soal #${index + 1}?`);
    if (konfirmasi) {
      const baru = formSoal.filter((_, i) => i !== index);
      setFormSoal(baru);
    }
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

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!jadwal?._id) return alert("⚠️ Data jadwal tidak valid.");
    
    const adaKosong = formSoal.some(s => !s.pertanyaan || !s.kunciJawaban);
    if (adaKosong) return alert("⚠️ Semua Pertanyaan dan Kunci Jawaban wajib diisi!");

    setLoading(true);
    try {
      // 🚀 PENTING: Saya menambahkan `durasiUjian` sebagai parameter keempat!
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
            <h2 style={{ margin: 0, fontWeight: '900', textTransform: 'uppercase', color: '#111827', fontSize: '26px' }}>🧠 CBT Engine</h2>
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
          
          {/* 🚀 PENGATURAN DURASI UJIAN (NEO-BRUTALISM) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', background: '#fef08a', border: '4px solid #111827', padding: '15px 20px', borderRadius: '15px', boxShadow: '6px 6px 0 #111827' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#111827', padding: '10px', borderRadius: '50%', display: 'flex' }}>
                <FaClock size={20} color="#facc15" />
              </div>
              <span style={{ fontWeight: '900', color: '#111827', fontSize: '18px', textTransform: 'uppercase' }}>Durasi Pengerjaan:</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input 
                type="number" 
                min="1" 
                max="180"
                value={durasiUjian} 
                onChange={(e) => setDurasiUjian(Number(e.target.value))}
                style={{ width: '80px', padding: '10px', fontSize: '18px', fontWeight: '900', border: '3px solid #111827', borderRadius: '8px', textAlign: 'center', outline: 'none', background: 'white' }}
              />
              <span style={{ fontWeight: '900', color: '#111827', fontSize: '16px' }}>Menit</span>
            </div>
          </div>

          {/* DAFTAR KARTU SOAL */}
          {formSoal.map((soal, i) => {
            const opsiAbjad = soal.jumlahOpsi === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
            
            return (
              <div key={i} style={{ padding: '20px', border: '4px solid #111827', borderRadius: '20px', background: '#fff', boxShadow: '8px 8px 0 #cbd5e1' }}>
                
                {/* TOOLBAR KARTU SOAL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', gap: '15px', background: '#f1f5f9', padding: '15px', borderRadius: '12px', border: '3px solid #111827' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: '900', background: '#111827', color: '#facc15', padding: '8px 15px', borderRadius: '8px', fontSize: '16px' }}>
                      SOAL #{i+1}
                    </span>
                    
                    {/* SETTING EXP */}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#fef08a', border: '3px solid #111827', borderRadius: '8px', overflow: 'hidden' }}>
                      <span style={{ padding: '8px 10px', background: '#111827', color: '#facc15', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FaStar /> EXP
                      </span>
                      <input 
                        type="number" min="0" value={soal.bobotExp} 
                        onChange={(e) => handleUpdateSoal(i, 'bobotExp', Number(e.target.value))}
                        style={{ width: '60px', padding: '8px', border: 'none', fontWeight: '900', fontSize: '16px', outline: 'none', textAlign: 'center', background: 'transparent' }} 
                        title="Bobot Nilai/EXP Soal Ini"
                      />
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Pilihan 4 atau 5 Opsi */}
                      <select value={soal.jumlahOpsi} onChange={(e) => handleUpdateSoal(i, 'jumlahOpsi', Number(e.target.value))} style={{ padding: '8px 12px', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '14px' }}>
                          <option value={4}>4 Opsi (A-D)</option>
                          <option value={5}>5 Opsi (A-E)</option>
                      </select>

                      {/* Kunci Jawaban */}
                      <select required value={soal.kunciJawaban} onChange={(e) => handleUpdateSoal(i, 'kunciJawaban', e.target.value)} style={{ padding: '8px 15px', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', background: '#4ade80', color: '#111827', cursor: 'pointer', fontSize: '14px' }}>
                          <option value="">KUNCI JAWABAN</option>
                          {opsiAbjad.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>

                      {/* Upload Gambar */}
                      <CldUploadWidget uploadPreset="quantum_unsigned" onSuccess={(res) => handleUpdateSoal(i, 'gambar', res.info.secure_url)}>
                          {({ open }) => (
                              <button type="button" onClick={() => open()} style={{ padding: '8px 15px', border: '3px solid #111827', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', background: soal.gambar ? '#dcfce3' : '#fff', display: 'flex', alignItems: 'center', gap: '8px', color: '#111827' }}>
                                  <FaImage /> {soal.gambar ? 'GAMBAR OK' : 'GAMBAR'}
                              </button>
                          )}
                      </CldUploadWidget>

                      {/* TOMBOL HAPUS SOAL */}
                      <button type="button" onClick={() => handleHapusSoal(i)} title="Hapus Soal Ini" style={{ padding: '10px', background: '#ef4444', color: 'white', border: '3px solid #111827', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaTrashCan size={16} />
                      </button>
                  </div>
                </div>

                {/* EDITOR PERTANYAAN */}
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ fontWeight: '900', display: 'block', marginBottom: '12px', fontSize: '15px', textTransform: 'uppercase', color: '#111827' }}>Teks Pertanyaan:</label>
                  <QuantumEditor value={soal.pertanyaan} onChange={(html) => handleUpdateSoal(i, 'pertanyaan', html)} />
                </div>

                {/* OPSI JAWABAN (A-D atau A-E) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  {opsiAbjad.map(opsi => (
                    <div key={opsi} style={{ border: '4px solid #111827', borderRadius: '12px', overflow: 'hidden', boxShadow: soal.kunciJawaban === opsi ? '4px 4px 0 #4ade80' : '4px 4px 0 #e2e8f0' }}>
                      <div style={{ background: soal.kunciJawaban === opsi ? '#4ade80' : '#111827', color: soal.kunciJawaban === opsi ? '#111827' : 'white', padding: '10px 20px', fontSize: '14px', fontWeight: '900', borderBottom: '4px solid #111827', display: 'flex', justifyContent: 'space-between' }}>
                        <span>OPSI {opsi}</span>
                        {soal.kunciJawaban === opsi && <span>(KUNCI BENAR)</span>}
                      </div>
                      <textarea 
                        required
                        value={soal.opsi ? soal.opsi[opsi] : ""} 
                        onChange={(e) => handleUpdateSoal(i, 'opsi', e.target.value, opsi)}
                        style={{ width: '100%', padding: '15px', border: 'none', outline: 'none', minHeight: '80px', fontWeight: '700', background: soal.kunciJawaban === opsi ? '#f0fdf4' : '#fff', resize: 'vertical', fontSize: '15px', fontFamily: 'inherit', color: '#111827' }}
                        placeholder={`Ketik teks jawaban ${opsi}... (Gunakan $...$ untuk rumus)`}
                      />
                    </div>
                  ))}
                </div>

                {/* LIVE PREVIEW */}
                {showPreview && (
                  <div style={{ marginTop: '30px', padding: '20px', background: '#eff6ff', border: '4px dashed #3b82f6', borderRadius: '15px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#1d4ed8', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaEye size={18} /> LIVE PREVIEW (TAMPILAN SISWA)
                    </div>
                    {soal.gambar && (
                      <div style={{ position: 'relative', width: 'fit-content', marginBottom: '20px', border: '3px solid #111827', borderRadius: '10px', overflow: 'hidden' }}>
                        <img src={soal.gambar} alt="Preview" style={{ maxHeight: '200px', display: 'block' }} />
                      </div>
                    )}
                    <div dangerouslySetInnerHTML={renderLaTeX(soal.pertanyaan || "<em>Belum ada pertanyaan...</em>")} style={{ fontSize: '16px', color: '#111827', marginBottom: '20px', lineHeight: '1.6' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {opsiAbjad.map(opt => (
                        soal.opsi && soal.opsi[opt] ? (
                          <div key={opt} style={{ display: 'flex', gap: '15px', background: 'white', padding: '12px 20px', border: '3px solid #111827', borderRadius: '10px', alignItems: 'center' }}>
                            <span style={{ fontWeight: '900', background: '#111827', color: 'white', padding: '4px 10px', borderRadius: '6px' }}>{opt}</span>
                            <span dangerouslySetInnerHTML={renderLaTeX(soal.opsi[opt])} style={{ fontWeight: 'bold', fontSize: '15px', color: '#111827' }} />
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* TOMBOL TAMBAH SOAL */}
          <button 
            type="button" 
            onClick={handleTambahSoal}
            style={{ padding: '20px', background: '#dcfce3', color: '#166534', border: '4px dashed #22c55e', borderRadius: '20px', fontWeight: '900', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.2s', marginTop: '-10px' }}
          >
            <FaPlus size={22} /> TAMBAH SOAL BARU KE DALAM KUIS
          </button>

          {/* TOMBOL SUBMIT */}
          <button type="submit" disabled={loading} style={{ padding: '25px', background: '#111827', color: '#facc15', border: 'none', borderRadius: '20px', fontWeight: '900', fontSize: '22px', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 0 #2563eb', marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {loading ? "MENYIMPAN DATA..." : <><FaFloppyDisk size={26} /> PUBLIKASIKAN KUIS CBT ({formSoal.length} SOAL)</>}
          </button>
        </form>
      </div>
    </div>
  );
}