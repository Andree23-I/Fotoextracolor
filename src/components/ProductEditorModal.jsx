import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  SvgCamera,
  SvgLayers,
  SvgEye,
  ArticleMockupIcon
} from './ProductIcons';

export default function ProductEditorModal({ product, isNew, onClose, onSave }) {
  const [formData, setFormData] = useState(() => JSON.parse(JSON.stringify(product)));
  const [activeSubTab, setActiveSubTab] = useState('general'); // 'general' | 'desc' | 'formats' | 'paper'
  const [newFormatName, setNewFormatName] = useState('');
  const [newFormatExtra, setNewFormatExtra] = useState(0);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleChange('imageUrl', event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddFormat = (e) => {
    e.preventDefault();
    if (!newFormatName.trim()) return;
    const extraNum = parseFloat(newFormatExtra) || 0;
    const updatedFormats = [
      ...(formData.formats || []),
      { name: newFormatName.trim(), extra: extraNum }
    ];
    setFormData((prev) => ({ ...prev, formats: updatedFormats }));
    setNewFormatName('');
    setNewFormatExtra(0);
  };

  const handleRemoveFormat = (idx) => {
    const updated = (formData.formats || []).filter((_, i) => i !== idx);
    setFormData((prev) => ({ ...prev, formats: updated }));
  };

  const handleFormatChange = (idx, field, value) => {
    const updated = [...(formData.formats || [])];
    updated[idx] = {
      ...updated[idx],
      [field]: field === 'extra' ? parseFloat(value) || 0 : value
    };
    setFormData((prev) => ({ ...prev, formats: updated }));
  };

  const togglePaperFinish = (finishName) => {
    const currentFinishes = formData.finishes || [];
    if (currentFinishes.includes(finishName)) {
      setFormData((prev) => ({
        ...prev,
        finishes: currentFinishes.filter((f) => f !== finishName)
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        finishes: [...currentFinishes, finishName]
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titleIt?.trim()) {
      alert("Il titolo del prodotto in italiano è obbligatorio.");
      return;
    }
    if (!formData.id?.trim()) {
      formData.id = `prod-${Date.now().toString(36)}`;
    }
    formData.basePrice = parseFloat(formData.basePrice) || 0;
    onSave(formData);
  };

  return createPortal(
    <div className="woo-modal-overlay" onClick={onClose}>
      <div className="woo-modal-panel animate-slide-up" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="woo-modal-header">
          <div className="woo-modal-title-box">
            <span className="woo-modal-badge">{isNew ? "Nuovo Prodotto" : "Modifica Prodotto"}</span>
            <h2 className="woo-modal-title">{formData.titleIt || "Nuovo Articolo"}</h2>
          </div>
          <button type="button" className="woo-modal-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="woo-modal-tabs">
          <button
            type="button"
            className={`woo-tab-btn ${activeSubTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('general')}
          >
            Generale & Prezzo
          </button>
          <button
            type="button"
            className={`woo-tab-btn ${activeSubTab === 'desc' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('desc')}
          >
            Descrizioni
          </button>
          <button
            type="button"
            className={`woo-tab-btn ${activeSubTab === 'formats' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('formats')}
          >
            <SvgLayers size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 5 }} />
            Formati & Varianti ({formData.formats?.length || 0})
          </button>
          <button
            type="button"
            className={`woo-tab-btn ${activeSubTab === 'paper' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('paper')}
          >
            Tipo di Carta & Finiture
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="woo-modal-form">
          <div className="woo-modal-scroll-area">
            {/* TAB 1: GENERALE */}
            {activeSubTab === 'general' && (
              <div className="woo-tab-pane animate-fade-in">
                <div className="woo-form-grid">
                  <div className="woo-form-group">
                    <label className="woo-label">Titolo Prodotto (Italiano) *</label>
                    <input
                      type="text"
                      className="woo-input"
                      value={formData.titleIt || ''}
                      onChange={(e) => handleChange('titleIt', e.target.value)}
                      placeholder="es. Tazza in Ceramica Personalizzata"
                      required
                    />
                  </div>

                  <div className="woo-form-group">
                    <label className="woo-label">Title (English)</label>
                    <input
                      type="text"
                      className="woo-input"
                      value={formData.titleEn || ''}
                      onChange={(e) => handleChange('titleEn', e.target.value)}
                      placeholder="es. Custom Ceramic Photo Mug"
                    />
                  </div>

                  <div className="woo-form-group">
                    <label className="woo-label">ID Univoco / Slug (SKU)</label>
                    <input
                      type="text"
                      className="woo-input"
                      value={formData.id || ''}
                      onChange={(e) => handleChange('id', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="es. mug-custom"
                      disabled={!isNew}
                    />
                    <small className="woo-help-text">Identificativo univoco del prodotto (usato nei collegamenti interni).</small>
                  </div>

                  <div className="woo-form-group">
                    <label className="woo-label">Categoria Prodotto *</label>
                    <select
                      className="woo-select"
                      value={formData.category || 'gadget'}
                      onChange={(e) => handleChange('category', e.target.value)}
                    >
                      <option value="prints">Stampe & Poster Lab</option>
                      <option value="photobooks">Fotolibri Artigianali</option>
                      <option value="wallart">Quadri su Tela & Cornici</option>
                      <option value="gadget">Gadget Fotografici</option>
                      <option value="vintage">Pellicole & Laboratorio</option>
                    </select>
                  </div>

                  <div className="woo-form-group">
                    <label className="woo-label">Prezzo Base (€) *</label>
                    <div className="woo-price-input-wrapper">
                      <span className="woo-curr-symbol">€</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        className="woo-input woo-price-input"
                        value={formData.basePrice ?? ''}
                        onChange={(e) => handleChange('basePrice', e.target.value)}
                        required
                      />
                    </div>
                    <small className="woo-help-text">Prezzo iniziale di partenza visibile nel catalogo e nel carosello.</small>
                  </div>

                  <div className="woo-form-group">
                    <label className="woo-label">Badge Promozionale (Opzionale)</label>
                    <input
                      type="text"
                      className="woo-input"
                      value={formData.badge || ''}
                      onChange={(e) => handleChange('badge', e.target.value)}
                      placeholder="es. Top Seller, Artigianale, Novità..."
                    />
                  </div>

                  <div className="woo-form-group">
                    <label className="woo-label">Mockup Visivo 3D</label>
                    <select
                      className="woo-select"
                      value={formData.mockupType || 'none'}
                      onChange={(e) => handleChange('mockupType', e.target.value)}
                    >
                      <option value="mug">Tazza Ceramica (mug)</option>
                      <option value="cushion">Cuscino Morbido (cushion)</option>
                      <option value="puzzle">Puzzle con Tessere (puzzle)</option>
                      <option value="tshirt">T-Shirt Maglietta (tshirt)</option>
                      <option value="keychain">Portachiavi Cristallo (keychain)</option>
                      <option value="canvas">Quadro su Tela Canvas (canvas)</option>
                      <option value="print">Stampa Fotografica / Cornice (print)</option>
                      <option value="none">Nessun Mockup (Servizio / Articolo Generico)</option>
                    </select>
                  </div>

                  {/* Foto / Immagine Articolo o Icona SVG */}
                  <div className="woo-form-group woo-photo-field-group">
                    <label className="woo-label">Foto / Immagine Prodotto</label>
                    <div className="woo-article-photo-manager">
                      <div className="woo-article-photo-preview">
                        {formData.imageUrl ? (
                          <div className="woo-photo-preview-wrap">
                            <img src={formData.imageUrl} alt="Anteprima Articolo" className="woo-article-preview-img" />
                            <button
                              type="button"
                              className="woo-btn-remove-photo"
                              onClick={() => handleChange('imageUrl', '')}
                              title="Rimuovi foto"
                            >
                              ✕ Rimuovi
                            </button>
                          </div>
                        ) : (
                          <div className="woo-photo-empty-state">
                            <ArticleMockupIcon
                              mockupType={formData.mockupType}
                              category={formData.category}
                              size={44}
                              className="woo-empty-svg-icon"
                            />
                            <span className="woo-empty-note">
                              Nessuna foto: viene mostrata l'icona SVG vettoriale di 21st.dev
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="woo-article-photo-inputs">
                        <label className="woo-file-upload-btn">
                          <SvgCamera size={16} />
                          <span>Carica Foto Articolo...</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <div className="woo-photo-url-row">
                          <span className="woo-or-divider">oppure incolla URL foto:</span>
                          <input
                            type="url"
                            className="woo-input"
                            value={formData.imageUrl || ''}
                            onChange={(e) => handleChange('imageUrl', e.target.value)}
                            placeholder="https://... (URL foto jpg/png/webp)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="woo-toggles-box">
                  <label className="woo-toggle-label">
                    <input
                      type="checkbox"
                      checked={formData.requiresPhoto !== false}
                      onChange={(e) => handleChange('requiresPhoto', e.target.checked)}
                      className="woo-checkbox"
                    />
                    <div>
                      <div className="woo-toggle-title-with-icon">
                        <SvgCamera size={16} />
                        <strong>Richiede caricamento foto dal cliente</strong>
                      </div>
                      <span>Se attivo, cliccando sul prodotto si apre il configuratore con caricamento immagini. Se disattivato, l'articolo viene aggiunto direttamente al carrello.</span>
                    </div>
                  </label>

                  <label className="woo-toggle-label">
                    <input
                      type="checkbox"
                      checked={formData.active !== false}
                      onChange={(e) => handleChange('active', e.target.checked)}
                      className="woo-checkbox"
                    />
                    <div>
                      <div className="woo-toggle-title-with-icon">
                        <SvgEye size={16} />
                        <strong>Prodotto Attivo & Visibile nello Shop</strong>
                      </div>
                      <span>Se disattivato, il prodotto verrà nascosto dallo shop e dal carosello per i clienti.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: DESCRIZIONI */}
            {activeSubTab === 'desc' && (
              <div className="woo-tab-pane animate-fade-in">
                <div className="woo-form-group">
                  <label className="woo-label">Descrizione Prodotto (Italiano)</label>
                  <textarea
                    rows="4"
                    className="woo-textarea"
                    value={formData.descIt || ''}
                    onChange={(e) => handleChange('descIt', e.target.value)}
                    placeholder="Descrivi i materiali, la qualità di stampa, le dimensioni e le caratteristiche uniche dell'articolo..."
                  />
                </div>

                <div className="woo-form-group" style={{ marginTop: 20 }}>
                  <label className="woo-label">Description (English)</label>
                  <textarea
                    rows="4"
                    className="woo-textarea"
                    value={formData.descEn || ''}
                    onChange={(e) => handleChange('descEn', e.target.value)}
                    placeholder="Describe product materials, print quality, dimensions and craftsmanship..."
                  />
                </div>
              </div>
            )}

            {/* TAB 3: FORMATI & VARIAZIONI */}
            {activeSubTab === 'formats' && (
              <div className="woo-tab-pane animate-fade-in">
                <p className="woo-section-desc">
                  I formati permettono al cliente di scegliere misure o varianti (es. 10x15, 20x30, Tazza Magica, ecc.). Ciascun formato può avere un sovrapprezzo extra rispetto al prezzo base.
                </p>

                {/* Formati Table */}
                <div className="woo-formats-table-wrapper">
                  <table className="woo-subtable">
                    <thead>
                      <tr>
                        <th>Nome Formato / Variante</th>
                        <th style={{ width: 160 }}>Sovrapprezzo Extra (€)</th>
                        <th style={{ width: 60, textAlign: 'center' }}>Rimuovi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!formData.formats || formData.formats.length === 0) ? (
                        <tr>
                          <td colSpan="3" className="woo-empty-td">
                            Nessun formato configurato. Il prodotto userà il prezzo base senza opzioni.
                          </td>
                        </tr>
                      ) : (
                        formData.formats.map((fmt, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                className="woo-sub-input"
                                value={fmt.name || ''}
                                onChange={(e) => handleFormatChange(idx, 'name', e.target.value)}
                                placeholder="es. 10x15 Stampa Lucida"
                              />
                            </td>
                            <td>
                              <div className="woo-price-input-wrapper">
                                <span className="woo-curr-symbol">+€</span>
                                <input
                                  type="number"
                                  step="0.05"
                                  className="woo-sub-input"
                                  value={fmt.extra ?? 0}
                                  onChange={(e) => handleFormatChange(idx, 'extra', e.target.value)}
                                />
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="woo-sub-delete-btn"
                                onClick={() => handleRemoveFormat(idx)}
                                title="Rimuovi formato"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Format Row */}
                <div className="woo-add-format-box">
                  <h4 className="woo-add-format-title">+ Aggiungi Nuovo Formato / Misura</h4>
                  <div className="woo-add-format-row">
                    <input
                      type="text"
                      className="woo-input"
                      placeholder="Nome Formato (es. 40x50 Telaio Legno)"
                      value={newFormatName}
                      onChange={(e) => setNewFormatName(e.target.value)}
                    />
                    <div className="woo-price-input-wrapper" style={{ width: 170 }}>
                      <span className="woo-curr-symbol">+€</span>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        className="woo-input"
                        placeholder="Sovrapprezzo"
                        value={newFormatExtra}
                        onChange={(e) => setNewFormatExtra(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="woo-btn-add-format"
                      onClick={handleAddFormat}
                    >
                      Aggiungi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: TIPO DI CARTA & FINITURE */}
            {activeSubTab === 'paper' && (
              <div className="woo-tab-pane animate-fade-in">
                <div className="woo-paper-notice">
                  <span className="notice-icon">💡</span>
                  <div>
                    <strong>Regola per il Tipo di Carta:</strong>
                    <p>Come richiesto, la scelta del "Tipo di Carta" (es. Lucida o Satinata) deve essere presente esclusivamente per le <strong>Stampe Fotografiche</strong> e i <strong>Fotolibri</strong>. Per i gadget (tazze, cuscini, magliette) lascialo disattivato.</p>
                  </div>
                </div>

                <div className="woo-finishes-options">
                  <label className="woo-checkbox-row">
                    <input
                      type="checkbox"
                      checked={(formData.finishes || []).includes('Lucida')}
                      onChange={() => togglePaperFinish('Lucida')}
                    />
                    <div>
                      <strong>Carta Lucida (Glossy)</strong>
                      <span>Finitura brillante ad alto contrasto e massima saturazione dei colori.</span>
                    </div>
                  </label>

                  <label className="woo-checkbox-row">
                    <input
                      type="checkbox"
                      checked={(formData.finishes || []).includes('Satinata')}
                      onChange={() => togglePaperFinish('Satinata')}
                    />
                    <div>
                      <strong>Carta Satinata (Lustre / Matte)</strong>
                      <span>Finitura opaca antiriflesso a grana fine resistente alle impronte.</span>
                    </div>
                  </label>

                  <label className="woo-checkbox-row">
                    <input
                      type="checkbox"
                      checked={(formData.finishes || []).includes('Fine Art Hahnemühle')}
                      onChange={() => togglePaperFinish('Fine Art Hahnemühle')}
                    />
                    <div>
                      <strong>Fine Art Hahnemühle 100% Cotone</strong>
                      <span>Carta museale per mostre fotografiche e collezionismo.</span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="woo-modal-footer">
            <button
              type="button"
              className="woo-btn-cancel"
              onClick={onClose}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="woo-btn-save"
            >
              💾 Salva Prodotto
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
