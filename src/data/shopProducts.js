// -------------------------------------------------------------
// FOTO EXTRACOLOR - SHOP PRODUCTS CATALOG & DATA LAYER
// LISTINO PREZZI UFFICIALE LABORATORIO
// -------------------------------------------------------------

export const CATEGORY_MAP = {
  prints: { it: "Stampe & Poster Lab", en: "Prints & Posters Lab" },
  photobooks: { it: "Fotolibri Artigianali", en: "Handcrafted Photobooks" },
  wallart: { it: "Quadri su Tela & Cornici", en: "Canvas & Custom Frames" },
  gadget: { it: "Gadget Fotografici", en: "Photo Gifts & Gadgets" },
  vintage: { it: "Pellicole & Laboratorio", en: "Film & Analog Lab" },
  all: { it: "Tutti i Prodotti", en: "All Products" }
};

export function getCategoryLabel(categoryKey, lang = "it") {
  const item = CATEGORY_MAP[categoryKey];
  if (!item) return categoryKey ? categoryKey.toUpperCase() : "";
  return lang === "it" ? item.it : item.en;
}

/**
 * Calcolo prezzo unitario in base al listino ufficiale Foto Extracolor:
 * Include scaglioni di quantità per 10x15, 13x18, 7x10 e prezzi esatti per ingrandimenti e gadget.
 */
export function computeUnitPrice(product, format, quantity = 1) {
  const formatName = typeof format === "string" ? format : format?.name || "";
  const extra = typeof format === "object" ? format?.extra || 0 : 0;
  const qty = Math.max(1, parseInt(quantity, 10) || 1);

  // 1. Foto 10x15 (da 1 a 10: 0.50€ | da 11 a 30: 0.35€ | da 31 in poi: 0.25€)
  if (formatName.includes("10x15")) {
    if (qty <= 10) return 0.50;
    if (qty <= 30) return 0.35;
    return 0.25;
  }

  // 2. Foto 13x18 (da 1 a 10: 0.80€ | da 11 a 30: 0.50€ | da 31 in poi: 0.35€)
  if (formatName.includes("13x18")) {
    if (qty <= 10) return 0.80;
    if (qty <= 30) return 0.50;
    return 0.35;
  }

  // 3. Foto 7x10 (da 1 a 10: 0.40€ | da 11 a 30: 0.30€ | da 31 in poi: 0.20€)
  if (formatName.includes("7x10")) {
    if (qty <= 10) return 0.40;
    if (qty <= 30) return 0.30;
    return 0.20;
  }

  // 4. Ingrandimenti (Listino Fisso Laboratorio)
  if (formatName.includes("15x20")) return 1.00;
  if (formatName.includes("18x24")) return 2.00;
  if (formatName.includes("20x25")) return 2.50;
  if (formatName.includes("20x30")) return 3.00;
  if (formatName.includes("24x30")) return 3.50;
  if (formatName.includes("24x36") || formatName.includes("25x35")) return 4.00;
  if (formatName.includes("30x40") || formatName.includes("30x45")) return 5.00;
  if (formatName.includes("40x50")) return 12.00;
  if (formatName.includes("50x70")) return 18.00;
  if (formatName.includes("70x100")) return 40.00;

  // 5. Prezzo Base + Sovrapprezzo per tutti gli altri prodotti
  return (product?.basePrice || 0) + extra;
}

export const DEFAULT_PRODUCTS = [
  // -----------------------------------------------------------
  // GADGET FOTOGRAFICI PERSONALIZZATI (LISTINO UFFICIALE)
  // -----------------------------------------------------------
  {
    id: "pillow-custom",
    category: "gadget",
    titleIt: "Cuscino Fotografico Personalizzato",
    titleEn: "Custom Photo Pillow / Cushion",
    descIt: "Morbido cuscino imbottito con federa sfoderabile e lavabile. Stampa brillante a sublimazione su tessuto vellutato.",
    descEn: "Soft padded pillow with removable washable cover. Brilliant print on velvety textile.",
    basePrice: 25.00, // Listino: Cuscino 25.00 Euro
    badge: "Più Amato",
    mockupType: "cushion",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "Cuscino Quadrato (40x40 cm)", extra: 0 },
      { name: "Cuscino a Cuore (40 cm)", extra: 2.00 },
      { name: "Cuscino Grande (50x50 cm)", extra: 5.00 }
    ],
    finishes: []
  },
  {
    id: "puzzle-custom",
    category: "gadget",
    titleIt: "Puzzle Fotografico con Scatola Regalo",
    titleEn: "Custom Photo Puzzle with Box",
    descIt: "Puzzle lucido composto dai tuoi ricordi più belli, fornito in elegante scatola regalo con anteprima fotografica.",
    descEn: "Glossy jigsaw puzzle created from your best memories, delivered in an elegant gift box.",
    basePrice: 18.00, // Listino: Puzzle 20x30 18.00 | Puzzle 30x40 25.00 Euro
    badge: "Idea Regalo",
    mockupType: "puzzle",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "Puzzle 20x30 cm", extra: 0 },       // Totale: 18.00 € (Listino)
      { name: "Puzzle 30x40 cm", extra: 7.00 },    // Totale: 25.00 € (Listino)
      { name: "Puzzle Maxi 50x70 cm", extra: 14.00 }
    ],
    finishes: []
  },
  {
    id: "mug-custom",
    category: "gadget",
    titleIt: "Tazza in Ceramica Personalizzata",
    titleEn: "Custom Ceramic Photo Mug",
    descIt: "Tazza in ceramica di alta qualità resistente a microonde e lavastoviglie con la tua foto stampata ad altissima brillantezza.",
    descEn: "High-quality ceramic mug dishwasher & microwave safe with your photo printed in vivid HD.",
    basePrice: 18.00, // Listino: Tazza 18.00 Euro
    badge: "Top Seller",
    mockupType: "mug",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "Tazza 330 ml Ceramica Bianca", extra: 0 },
      { name: "Tazza Bicolore con Interno Colorato", extra: 2.00 },
      { name: "Tazza Magica Termosensibile", extra: 4.00 }
    ],
    finishes: []
  },
  {
    id: "mousepad-custom",
    category: "gadget",
    titleIt: "Tappetino Mouse Personalizzato",
    titleEn: "Custom Photo Mousepad",
    descIt: "Tappetino per mouse ergonomico con superficie liscia in microfibra per massima scorrevolezza e fondo in gomma naturale antiscivolo.",
    descEn: "Ergonomic custom mouse pad with smooth microfiber glide surface and non-slip rubber base.",
    basePrice: 15.00, // Listino: Tappetino Mouse 15.00 Euro
    badge: "Pratico & Utile",
    mockupType: "print",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "Rettangolare Standard (23 x 19 cm)", extra: 0 },
      { name: "Rotondo Ergonomico (Ø 20 cm)", extra: 0 },
      { name: "Deskpad Gaming XXL (80 x 30 cm)", extra: 12.00 }
    ],
    finishes: []
  },
  {
    id: "tshirt-custom",
    category: "gadget",
    titleIt: "Maglia / T-Shirt in Cotone Personalizzata",
    titleEn: "Custom 100% Cotton T-Shirt",
    descIt: "Maglietta in 100% cotone pettinato di qualità con stampa digitale diretta traspirante morbida al tatto resistente ai lavaggi.",
    descEn: "100% premium combed cotton t-shirt with breathable direct-to-garment long-lasting print.",
    basePrice: 25.00, // Listino: Maglia 25.00 Euro
    badge: "100% Cotone",
    mockupType: "tshirt",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "Taglia S - Unisex", extra: 0 },
      { name: "Taglia M - Unisex", extra: 0 },
      { name: "Taglia L - Unisex", extra: 0 },
      { name: "Taglia XL - Unisex", extra: 0 },
      { name: "Taglia XXL - Unisex", extra: 2.00 },
      { name: "Taglia Bambino (4-12 anni)", extra: 0 }
    ],
    finishes: []
  },
  {
    id: "keychain-custom",
    category: "gadget",
    titleIt: "Portachiavi con Foto Bifacciale",
    titleEn: "Double-sided Photo Keychain",
    descIt: "Portachiavi in metallo e cristallo acrilico infrangibile, con stampa su entrambi i lati.",
    descEn: "Sturdy metal and acrylic keychain with high-definition photo printed on both sides.",
    basePrice: 6.00,
    badge: "Economico",
    mockupType: "keychain",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "Rettangolare classico (3.5x5 cm)", extra: 0 },
      { name: "Tondo (Ø 4 cm)", extra: 0.50 },
      { name: "Forma a Cuore", extra: 1.00 }
    ],
    finishes: []
  },
  {
    id: "magnet-custom",
    category: "gadget",
    titleIt: "Magnete / Calamita Frigo HD",
    titleEn: "HD Fridge Photo Magnet",
    descIt: "Calamita con stampa fotografica lucida su supporto magnetico flessibile e resistente.",
    descEn: "Glossy photo magnet with flexible durable backing, perfect for refrigerators and boards.",
    basePrice: 4.50,
    badge: "Ricordo",
    mockupType: "print",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "Formato Polar (7.5 x 10 cm)", extra: 0 },
      { name: "Formato Quadrato (10 x 10 cm)", extra: 0.80 },
      { name: "Set 3 Calamite Miste", extra: 6.50 }
    ],
    finishes: []
  },

  // -----------------------------------------------------------
  // STAMPE FOTO LAB & FINE ART (LISTINO UFFICIALE CON SCAGLIONI)
  // -----------------------------------------------------------
  {
    id: "prints-pack",
    category: "prints",
    titleIt: "Stampe Foto Professionali Lab",
    titleEn: "Professional Photo Prints",
    descIt: "Sviluppo su autentica carta chimica fotografica Fujicolor Crystal Archive. Prezzo a scaglioni: più foto stampi, meno spendi!",
    descEn: "Genuine Fujicolor Crystal Archive photo paper with tiered volume pricing.",
    basePrice: 0.25, // Prezzo a partire da 0.25€ (scaglione oltre 30 foto)
    badge: "Laboratorio Diretto",
    mockupType: "print",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "10x15 (1-10: 0.50€ | 11-30: 0.35€ | 31+: 0.25€)", extra: 0 },
      { name: "13x18 (1-10: 0.80€ | 11-30: 0.50€ | 31+: 0.35€)", extra: 0 },
      { name: "7x10 (1-10: 0.40€ | 11-30: 0.30€ | 31+: 0.20€)", extra: 0 },
      { name: "15x20 Ingrandimento (1.00€)", extra: 0.75 },
      { name: "20x30 Ingrandimento (3.00€)", extra: 2.75 },
      { name: "30x40 Ingrandimento (5.00€)", extra: 4.75 }
    ],
    finishes: ["Lucida", "Satinata"]
  },
  {
    id: "poster-hd",
    category: "prints",
    titleIt: "Ingrandimenti & Poster Fine Art",
    titleEn: "HD Enlargements & Fine Art Posters",
    descIt: "Stampe di grandi dimensioni plotter Fine Art a 12 colori con inchiostri a pigmenti Epson UltraChrome PRO garantiti nel tempo.",
    descEn: "12-color archival pigment enlargements on fine art luster photo paper.",
    basePrice: 1.00, // Listino Ingrandimenti: a partire da 1.00 Euro (15x20)
    badge: "Qualità Galleria",
    mockupType: "print",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "15x20", extra: 0 },       // Totale: 1.00 € (Listino)
      { name: "18x24", extra: 1.00 },    // Totale: 2.00 € (Listino)
      { name: "20x25", extra: 1.50 },    // Totale: 2.50 € (Listino)
      { name: "20x30", extra: 2.00 },    // Totale: 3.00 € (Listino)
      { name: "24x30", extra: 2.50 },    // Totale: 3.50 € (Listino)
      { name: "24x36 - 25x35", extra: 3.00 }, // Totale: 4.00 € (Listino)
      { name: "30x40 - 30x45", extra: 4.00 }, // Totale: 5.00 € (Listino)
      { name: "40x50", extra: 11.00 },   // Totale: 12.00 € (Listino)
      { name: "50x70", extra: 17.00 },   // Totale: 18.00 € (Listino)
      { name: "70x100", extra: 39.00 }   // Totale: 40.00 € (Listino)
    ],
    finishes: ["Lucida", "Satinata"]
  },

  // -----------------------------------------------------------
  // QUADRI SU TELA & CORNICI ARTIGIANALI
  // -----------------------------------------------------------
  {
    id: "canvas-custom",
    category: "wallart",
    titleIt: "Quadro su Tela Canvas con Telaio",
    titleEn: "Stretched Canvas Wall Art",
    descIt: "Autentica tela pittorica montata artigianalmente su telaio in legno d'abete italiano spessore 2 o 4 cm.",
    descEn: "Real artist canvas hand-stretched over authentic Italian fir wooden frame (2 or 4 cm deep).",
    basePrice: 28.00,
    badge: "Artigianato",
    mockupType: "canvas",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "30 x 40 cm (Telaio 2cm)", extra: 0 },
      { name: "40 x 50 cm (Telaio 2cm)", extra: 8.00 },
      { name: "50 x 70 cm (Telaio 4cm Galleria)", extra: 19.00 },
      { name: "70 x 100 cm (Telaio 4cm Galleria)", extra: 36.00 }
    ],
    finishes: []
  },
  {
    id: "frame-custom",
    category: "wallart",
    titleIt: "Cornice Artigianale in Legno su Misura",
    titleEn: "Handcrafted Italian Wooden Frame",
    descIt: "Cornice lavorata a mano nel nostro laboratorio, completa di vetro protettivo, passepartout e gancio.",
    descEn: "Handmade custom picture frame crafted in Salerno, with anti-reflective glass and acid-free mat.",
    basePrice: 22.00,
    badge: "Fatto a Mano",
    mockupType: "print",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "20 x 30 cm con Passepartout", extra: 0 },
      { name: "30 x 40 cm con Passepartout", extra: 9.00 },
      { name: "50 x 70 cm Arredo", extra: 23.00 }
    ],
    finishes: []
  },

  // -----------------------------------------------------------
  // FOTOLIBRI ARTIGIANALI
  // -----------------------------------------------------------
  {
    id: "photobook-luxury",
    category: "photobooks",
    titleIt: "Fotolibro Artigianale Copertina Rigida",
    titleEn: "Handmade Hardcover Photobook",
    descIt: "24 pagine con apertura panoramica piatta a 180° (lay-flat) per non tagliare le foto al centro.",
    descEn: "24 seamless lay-flat pages opening at 180° so your panorama shots remain untouched.",
    basePrice: 39.00,
    badge: "Elegante",
    mockupType: "print",
    requiresPhoto: true,
    active: true,
    formats: [
      { name: "20 x 20 cm Quadrato (24 pag.)", extra: 0 },
      { name: "21 x 30 cm A4 Orizzontale (30 pag.)", extra: 15.00 },
      { name: "30 x 30 cm Nozze/Eventi Maxi (40 pag.)", extra: 39.00 }
    ],
    finishes: ["Lucida", "Satinata"]
  },

  // -----------------------------------------------------------
  // PELLICOLE, SVILUPPO & ANALOGICO
  // -----------------------------------------------------------
  {
    id: "film-roll-35mm",
    category: "vintage",
    titleIt: "Rullino Pellicola 35mm Colore/B&W",
    titleEn: "35mm Color / B&W Film Roll",
    descIt: "Pellicola fresca garantita per fotocamere analogiche 35mm. Disponibili emulsioni Kodak, Fuji e Ilford.",
    descEn: "Fresh guaranteed film stocks for 35mm analog cameras (Kodak Ultramax, Gold, Ilford HP5).",
    basePrice: 14.50,
    badge: "In Pronta Consegna",
    mockupType: "none",
    requiresPhoto: false,
    active: true,
    formats: [
      { name: "Kodak Gold 200 (36 pose)", extra: 0 },
      { name: "Kodak UltraMax 400 (36 pose)", extra: 1.50 },
      { name: "Ilford HP5 Plus 400 B&W (36 pose)", extra: 1.00 }
    ],
    finishes: []
  },
  {
    id: "film-dev-scan",
    category: "vintage",
    titleIt: "Sviluppo Pellicola C-41 + Scansione HD",
    titleEn: "C-41 Film Development + HD Scan",
    descIt: "Sviluppo professionale del tuo rullino con chimica certificata + scansione in alta risoluzione inviata via WeTransfer.",
    descEn: "Professional lab development with certified chemicals + high-resolution digital scans delivered online.",
    basePrice: 10.00,
    badge: "Servizio Lab",
    mockupType: "none",
    requiresPhoto: false,
    active: true,
    formats: [
      { name: "Sviluppo Colore C-41 + Scansione 2400dpi", extra: 0 },
      { name: "Sviluppo B&W Artigianale + Scansione 2400dpi", extra: 2.00 },
      { name: "Sviluppo + Scansione + Provino a Contatto", extra: 5.00 }
    ],
    finishes: []
  },
  {
    id: "vhs-digitization",
    category: "vintage",
    titleIt: "Conversione da Videocassette VHS a Digitale",
    titleEn: "VHS to Digital Video Transfer (MP4 / USB)",
    descIt: "Riversamento con stabilizzatore TBC da videocassette VHS, VHS-C, Hi8 o MiniDV in file MP4 full HD.",
    descEn: "Timebase-stabilized transfer from VHS, VHS-C, Hi8 or MiniDV to modern MP4 digital video files.",
    basePrice: 12.00,
    badge: "Salva i Tuoi Ricordi",
    mockupType: "none",
    requiresPhoto: false,
    active: true,
    formats: [
      { name: "1 Videocassetta (fino a 180 min)", extra: 0 },
      { name: "Pacchetto 3 Videocassette", extra: 20.00 },
      { name: "Pacchetto 5 Videocassette + Chiavetta USB Omaggio", extra: 40.00 }
    ],
    finishes: []
  }
];

export const STORAGE_KEY_PRODUCTS = "fotoextracolor_shop_products";
export const STORAGE_VERSION_KEY = "fotoextracolor_products_version";
export const CURRENT_CATALOG_VERSION = "v3_listino_ufficiale_2026";

/**
 * Carica prodotti dal localStorage o dai predefiniti aggiornati con il listino
 */
export function getInitialProducts() {
  try {
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (version !== CURRENT_CATALOG_VERSION) {
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_CATALOG_VERSION);
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Impossibile caricare prodotti da localStorage:", err);
  }
  return DEFAULT_PRODUCTS;
}

/**
 * Salva i prodotti in localStorage, notifica i componenti ed effettua la sync col server
 */
export async function persistShopProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_CATALOG_VERSION);
    window.dispatchEvent(new CustomEvent("shop-products-updated", { detail: products }));
  } catch (err) {
    console.error("Errore salvataggio prodotti in local storage:", err);
  }

  // Sync su backend
  try {
    let res;
    try {
      res = await fetch("/api.php?action=saveProducts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch {
      res = await fetch("https://fttest.onrender.com/api.php?action=saveProducts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products })
      });
    }
    return await res.json();
  } catch (netErr) {
    console.warn("Sync server prodotti non riuscito (modalità locale attiva):", netErr);
    return { success: true, offline: true };
  }
}
