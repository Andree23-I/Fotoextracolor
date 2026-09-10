import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

import JSZip from "jszip";

// Comprehensive world country dial codes list
const COUNTRY_CODES = [
  { code: "+39", flag: "🇮🇹", name: "Italia" },
  { code: "+1", flag: "🇺🇸", name: "USA / Canada" },
  { code: "+44", flag: "🇬🇧", name: "Regno Unito" },
  { code: "+33", flag: "🇫🇷", name: "Francia" },
  { code: "+49", flag: "🇩🇪", name: "Germania" },
  { code: "+34", flag: "🇪🇸", name: "Spagna" },
  { code: "+41", flag: "🇨🇭", name: "Svizzera" },
  { code: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "+32", flag: "🇧🇪", name: "Belgio" },
  { code: "+31", flag: "🇳🇱", name: "Paesi Bassi" },
  { code: "+351", flag: "🇵🇹", name: "Portogallo" },
  { code: "+30", flag: "🇬🇷", name: "Grecia" },
  { code: "+48", flag: "🇵🇱", name: "Polonia" },
  { code: "+40", flag: "🇷🇴", name: "Romania" },
  { code: "+36", flag: "🇭🇺", name: "Ungheria" },
  { code: "+420", flag: "🇨🇿", name: "Rep. Ceca" },
  { code: "+46", flag: "🇸🇪", name: "Svezia" },
  { code: "+47", flag: "🇳🇴", name: "Norvegia" },
  { code: "+45", flag: "🇩嚮", name: "Danimarca" },
  { code: "+358", flag: "🇫🇮", name: "Finlandia" },
  { code: "+353", flag: "🇮🇪", name: "Irlanda" },
  { code: "+380", flag: "🇺🇦", name: "Ucraina" },
  { code: "+7", flag: "🇷🇺", name: "Russia / Kazakistan" },
  { code: "+90", flag: "🇹🇷", name: "Turchia" },
  { code: "+86", flag: "🇨🇳", name: "Cina" },
  { code: "+81", flag: "🇯🇵", name: "Giappone" },
  { code: "+82", flag: "🇰🇷", name: "Corea del Sud" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+64", flag: "🇳🇿", name: "Nuova Zelanda" },
  { code: "+55", flag: "🇧🇷", name: "Brasile" },
  { code: "+54", flag: "🇦🇷", name: "Argentina" },
  { code: "+52", flag: "🇲🇽", name: "Messico" },
  { code: "+20", flag: "🇪🇬", name: "Egitto" },
  { code: "+27", flag: "🇿🇦", name: "Sudafrica" },
  { code: "+971", flag: "🇦🇪", name: "Emirati Arabi" },
  { code: "+966", flag: "🇸🇦", name: "Arabia Saudita" },
  { code: "+972", flag: "🇮🇱", name: "Israele" },
];

export default function PhotoUploadModal({ isOpen, onClose, language = "it" }) {
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("+39");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Lock body scroll and handle Escape key when overlay modal is active
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const labels = {
    it: {
      title: "Invia Foto & Richiesta",
      subtitle: "Compila il modulo per inviare le foto a info@fotoextracolor.com",
      name: "Nome Completo",
      namePlaceholder: "Es. Mario Rossi",
      phone: "Telefono",
      phonePlaceholder: "324 000 0000",
      email: "Email",
      emailPlaceholder: "tua@email.com",
      notes: "Note / Istruzioni",
      notesPlaceholder: "Es. Formato 13x18, 2 copie...",
      dragText: "Trascina qui le foto o clicca",
      dragSub: "JPG, PNG, WEBP",
      sendBtn: "Invia Foto via Email",
      sending: "Invio in corso...",
      success: "Foto inviate con successo a info@fotoextracolor.com!",
      error: "Errore invio. Riprova o contattaci.",
      noFilesErr: "Seleziona o trascina almeno una foto.",
      previewTitle: "Galleria Foto Caricate",
      emptyGallery: "Nessuna foto ancora caricata. Trascinale nel riquadro a destra."
    },
    en: {
      title: "Send Photos & Request",
      subtitle: "Fill form to send photos to info@fotoextracolor.com",
      name: "Full Name",
      namePlaceholder: "e.g. John Doe",
      phone: "Phone Number",
      phonePlaceholder: "324 000 0000",
      email: "Email",
      emailPlaceholder: "your@email.com",
      notes: "Notes / Instructions",
      notesPlaceholder: "e.g. 13x18 format, 2 copies...",
      dragText: "Drag & drop photos or click",
      dragSub: "JPG, PNG, WEBP",
      sendBtn: "Send Photos via Email",
      sending: "Sending...",
      success: "Photos sent successfully to info@fotoextracolor.com!",
      error: "Error sending. Try again or contact us.",
      noFilesErr: "Select or drag at least one photo.",
      previewTitle: "Uploaded Photos Gallery",
      emptyGallery: "No photos uploaded yet. Drag them into the box on the right."
    }
  };

  const t = labels[language] || labels.it;

  const handleFileSelect = (selectedFiles) => {
    const validFiles = Array.from(selectedFiles).filter((file) =>
      file.type.startsWith("image/")
    );
    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadZipToLitterbox = async () => {
    // 1. Crea il file ZIP
    const zip = new JSZip();
    files.forEach((file) => {
      zip.file(file.name, file);
    });
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFile = new File([zipBlob], "foto_extracolor.zip", { type: "application/zip" });

    // 2. Carica il file su Litterbox (genera un link .zip diretto e puro)
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", "72h"); // File disponibile per 3 giorni
    formData.append("fileToUpload", zipFile);

    const uploadRes = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: formData,
    });
    
    if (uploadRes.ok) {
      const link = await uploadRes.text();
      return link.trim(); // Ritorna: https://litter.catbox.moe/xxxxxx.zip
    }
    
    throw new Error("Errore durante il caricamento");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setStatus({ type: "error", text: t.noFilesErr });
      return;
    }

    setUploading(true);
    setStatus({ type: "info", text: "Invio foto in corso ..." });

    try {
      const zipLink = await uploadZipToLitterbox();
      const photoLinksText = `Scarica l'archivio ZIP con tutte le foto cliccando sul link qui sotto:\n${zipLink}`;

      const mailtoSubject = encodeURIComponent(`Nuova Richiesta Foto da ${fullName}`);
      const mailtoBody = encodeURIComponent(
        `Nome: ${fullName}\nTelefono: ${countryCode} ${phoneNumber}\nEmail: ${email}\nNote: ${message || "Nessuna nota specificata"}\n\nLink Foto Caricate:\n${photoLinksText}`
      );
      window.location.href = `mailto:info@fotoextracolor.com?subject=${mailtoSubject}&body=${mailtoBody}`;

      setStatus({ type: "success", text: t.success });
      setTimeout(() => {
        setFiles([]);
        setFullName("");
        setPhoneNumber("");
        setEmail("");
        setMessage("");
        setStatus({ type: "", text: "" });
        onClose();
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", text: t.error });
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <div 
      className="photo-modal-backdrop" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="photo-modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="photo-modal-header">
          <div>
            <h2 className="photo-modal-title">{t.title}</h2>
            <p className="photo-modal-subtitle">{t.subtitle}</p>
          </div>
          <button type="button" className="photo-modal-close" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>

        <div className="photo-modal-split-layout">
          {/* Riquadro Sinistro: Galleria Foto Caricate */}
          <div className="modal-left-gallery-panel">
            <div className="gallery-panel-header">
              <span className="gallery-panel-title">📸 {t.previewTitle}</span>
              <span className="gallery-panel-badge">{files.length} foto</span>
            </div>

            {files.length === 0 ? (
              <div className="gallery-empty-state">
                <span className="empty-icon">🖼️</span>
                <p className="empty-text">{t.emptyGallery}</p>
              </div>
            ) : (
              <div className="modal-gallery-scroll">
                {files.map((file, idx) => (
                  <div key={idx} className="left-preview-card">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Anteprima ${idx + 1}`}
                      className="left-preview-img"
                    />
                    <div className="left-preview-info">
                      <span className="left-preview-filename">{file.name}</span>
                      <span className="left-preview-size">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      className="left-preview-remove"
                      onClick={() => removeFile(idx)}
                      title="Rimuovi foto"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Riquadro Destro: Form Dati Utente & Dropzone */}
          <div className="modal-right-form-panel">
            <form onSubmit={handleSubmit} className="photo-upload-form">
              <div className="form-row-2col">
                {/* Nome Completo */}
                <div className="form-group">
                  <label className="form-label">{t.name} *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="form-input"
                    autoComplete="name"
                  />
                </div>

                {/* Telefono con prefisso internazionale */}
                <div className="form-group">
                  <label className="form-label">{t.phone} *</label>
                  <div className="phone-input-group">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="form-select phone-prefix-select"
                      aria-label="Prefisso Internazionale"
                    >
                      {COUNTRY_CODES.map((c, i) => (
                        <option key={`${c.code}-${i}`} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className="form-input phone-number-input"
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row-2col">
                {/* Email */}
                <div className="form-group">
                  <label className="form-label">{t.email} *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="form-input"
                    autoComplete="email"
                  />
                </div>

                {/* Note / Istruzioni */}
                <div className="form-group">
                  <label className="form-label">{t.notes}</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t.notesPlaceholder}
                    className="form-input"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <div className="form-group">
                <label className="form-label">Caricamento Foto *</label>
                <div
                  className={`dropzone ${isDragOver ? "drag-over" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    style={{ display: "none" }}
                  />
                  <div className="dropzone-compact">
                    <span className="dropzone-icon">📷</span>
                    <div>
                      <p className="dropzone-text">{t.dragText}</p>
                      <span className="dropzone-sub">{t.dragSub}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Alert Message */}
              {status.text && (
                <div className={`status-alert ${status.type}`}>
                  {status.text}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="submit-photo-btn"
              >
                {uploading ? t.sending : t.sendBtn}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
