import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import "./EcommerceShop.css";
import { getInitialProducts, getCategoryLabel, computeUnitPrice } from "../data/shopProducts";
import { submitCustomerOrder } from "../data/shopOrders";
import { ArticleMockupIcon } from "./ProductIcons";

// SVG Icons
function IconCart(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function IconUpload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconTrash(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconWhatsApp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2.003c-5.514 0-9.997 4.483-9.997 9.997 0 1.762.462 3.484 1.34 5.001L2 22l5.117-1.341a9.96 9.96 0 0 0 4.887 1.271h.004c5.514 0 9.996-4.483 9.996-9.997 0-2.67-1.04-5.18-2.928-7.069a9.935 9.935 0 0 0-7.072-2.861zm0 18.187h-.003a8.166 8.166 0 0 1-4.166-1.14l-.299-.177-3.037.797.811-2.96-.194-.304a8.184 8.184 0 0 1-1.256-4.375c0-4.522 3.68-8.202 8.207-8.202a8.15 8.15 0 0 1 5.802 2.406 8.15 8.15 0 0 1 2.403 5.803c0 4.523-3.68 8.152-8.268 8.152z" />
    </svg>
  );
}

function IconEmail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

export default function EcommerceShop({ language }) {
  const [productsList, setProductsList] = useState(getInitialProducts);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("stack"); // 'stack' (default 3D Card Stack Experience) | 'grid'
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("fotoextracolor_shop_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  // Customer Checkout Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("pickup"); // 'pickup' | 'delivery'
  const [orderNotes, setOrderNotes] = useState("");
  const [orderConfirmedData, setOrderConfirmedData] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Sync products from admin / server
  useEffect(() => {
    const handleProductsUpdated = (e) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setProductsList(e.detail);
      }
    };
    window.addEventListener("shop-products-updated", handleProductsUpdated);

    // Initial server fetch
    fetch("/api.php?action=getProducts")
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          setProductsList(data.products);
          localStorage.setItem("fotoextracolor_shop_products", JSON.stringify(data.products));
        }
      })
      .catch(() => {});

    return () => window.removeEventListener("shop-products-updated", handleProductsUpdated);
  }, []);

  // Save cart to localStorage and notify header
  useEffect(() => {
    try {
      localStorage.setItem("fotoextracolor_shop_cart", JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent("cart-updated", { detail: cart }));
    } catch (e) {
      console.warn("Storage full, saving lightweight cart version:", e);
      try {
        const lightweightCart = cart.map(item => ({
          ...item,
          previewThumbnail: item.previewThumbnail ? (item.previewThumbnail.startsWith("blob:") ? null : item.previewThumbnail.slice(0, 2000)) : null,
          uploadedPhotos: (item.uploadedPhotos || []).map(p => ({
            name: p.name,
            size: p.size
          }))
        }));
        localStorage.setItem("fotoextracolor_shop_cart", JSON.stringify(lightweightCart));
        window.dispatchEvent(new CustomEvent("cart-updated", { detail: cart }));
      } catch (err2) {
        console.warn("Could not save cart to localStorage:", err2);
      }
    }
  }, [cart]);

  // Listen for open-cart event from top header & handle ?openCart=true URL parameter
  useEffect(() => {
    const handleOpenCartEvent = () => setCartOpen(true);
    window.addEventListener("open-cart", handleOpenCartEvent);

    const params = new URLSearchParams(window.location.search);
    if (params.get("openCart") === "true") {
      setCartOpen(true);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }

    return () => window.removeEventListener("open-cart", handleOpenCartEvent);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleAddToCart = (product, configuration = {}) => {
    const formatObj = configuration.format || product.formats?.[0] || { name: "Standard", extra: 0 };
    const formatName = typeof formatObj === "string" ? formatObj : formatObj?.name || "Standard";
    const quantity = configuration.quantity || 1;
    const itemPrice = computeUnitPrice(product, formatObj, quantity);

    const cartItem = {
      cartId: Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      productId: product.id,
      title: language === "it" ? product.titleIt : product.titleEn,
      category: product.category,
      unitPrice: itemPrice,
      quantity,
      format: formatName,
      finish: configuration.finish || "",
      notes: configuration.notes || "",
      uploadedPhotos: configuration.uploadedPhotos || [],
      previewThumbnail: configuration.uploadedPhotos?.[0]?.dataUrl || null,
      mockupType: product.mockupType
    };

    setCart((prev) => [...prev, cartItem]);
    showToast(language === "it" ? `Aggiunto al carrello: ${cartItem.title}!` : `Added to cart: ${cartItem.title}!`);
    if (customizingProduct) {
      setCustomizingProduct(null);
    }
  };

  const updateQuantity = (cartId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (cartId) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const clearCart = () => {
    if (window.confirm(language === "it" ? "Svuotare tutto il carrello?" : "Empty shopping cart?")) {
      setCart([]);
    }
  };

  // Pricing calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shippingCost = deliveryMethod === "delivery" ? (subtotal >= 50 ? 0 : 6.90) : 0;
  const total = subtotal + shippingCost;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Send Order via WhatsApp (and save to Backoffice Orders)
  const handleOrderWhatsApp = async () => {
    if (cart.length === 0) {
      setToastMessage(language === "it" ? "Il carrello è vuoto!" : "Your cart is empty!");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    setIsSubmittingOrder(true);
    const orderTimestamp = Date.now();
    const orderCode = `#FE-${Math.floor(orderTimestamp / 1000).toString().slice(-4)}`;

    const finalName = customerName.trim() || (language === "it" ? "Cliente Online" : "Online Customer");
    const finalPhone = customerPhone.trim() || "";

    const orderPayload = {
      orderNumber: orderCode,
      createdAt: new Date().toISOString(),
      customerName: finalName,
      customerPhone: finalPhone,
      customerEmail: customerEmail.trim(),
      deliveryMethod,
      customerAddress: deliveryMethod === "delivery" ? customerAddress.trim() : "",
      orderNotes: orderNotes.trim(),
      items: cart.map((item) => ({
        cartId: item.cartId,
        productId: item.productId,
        title: item.title,
        category: item.category,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        format: item.format,
        finish: item.finish || "",
        notes: item.notes || "",
        photosCount: item.uploadedPhotos?.length || 0,
        previewThumbnail: item.previewThumbnail || (item.uploadedPhotos?.[0]?.dataUrl || null),
        uploadedPhotos: (item.uploadedPhotos || []).map((ph, pIdx) => ({
          name: ph.name || `foto_${pIdx + 1}.jpg`,
          dataUrl: ph.dataUrl || ph.src || (typeof ph === 'string' ? ph : null)
        }))
      })),
      subtotal,
      shippingCost,
      total,
      status: "pending",
      submissionChannel: "whatsapp"
    };

    // 1. Save to Backoffice system & localStorage
    let savedOrder = orderPayload;
    try {
      const res = await submitCustomerOrder(orderPayload);
      if (res && res.order) {
        savedOrder = res.order;
      }
    } catch (saveErr) {
      console.warn("Registrazione ordine gestionale:", saveErr);
    }

    // 2. Prepare WhatsApp message with Official Order Code
    let msg = `*NUOVO ORDINE SITO WEB [${savedOrder.orderNumber}] - FOTO EXTRACOLOR*\n\n`;
    msg += `🔢 *Codice Ordine:* ${savedOrder.orderNumber}\n`;
    msg += `👤 *Cliente:* ${finalName}\n`;
    if (finalPhone) msg += `📞 *Telefono / WA:* ${finalPhone}\n`;
    if (customerEmail.trim()) msg += `✉️ *Email:* ${customerEmail.trim()}\n`;
    msg += `📍 *Consegna:* ${deliveryMethod === "pickup" ? "Ritiro gratuito in negozio (Salerno)" : `Spedizione a domicilio (+€${shippingCost.toFixed(2)})`}\n`;
    if (deliveryMethod === "delivery" && customerAddress.trim()) {
      msg += `🏠 *Indirizzo:* ${customerAddress.trim()}\n`;
    }
    if (orderNotes.trim()) msg += `📝 *Note cliente:* ${orderNotes.trim()}\n`;

    msg += `\n🛒 *ARTICOLI ORDINATI:*\n`;
    let hasPhotosToAttach = false;

    cart.forEach((item, idx) => {
      msg += `\n${idx + 1}. *${item.title}* x${item.quantity} — €${(item.unitPrice * item.quantity).toFixed(2)}\n`;
      msg += `   • Formato/Variante: ${item.format}\n`;
      if (item.finish) msg += `   • Tipo di Carta: ${item.finish}\n`;
      if (item.notes) msg += `   • Personalizzazione/Dedica: "${item.notes}"\n`;
      if (item.uploadedPhotos && item.uploadedPhotos.length > 0) {
        msg += `   • 📸 ${item.uploadedPhotos.length} foto caricata/e (pronte per invio in questa chat)\n`;
        hasPhotosToAttach = true;
      }
    });

    msg += `\n─────────────────────\n`;
    msg += `*Subtotale:* €${subtotal.toFixed(2)}\n`;
    if (deliveryMethod === "delivery") {
      msg += `*Spedizione:* ${shippingCost === 0 ? "GRATIS" : `€${shippingCost.toFixed(2)}`}\n`;
    }
    msg += `*TOTALE COMPLESSIVO:* €${total.toFixed(2)}\n`;
    msg += `─────────────────────\n`;

    if (hasPhotosToAttach) {
      msg += `\n📌 *Nota:* Ho caricato le foto sul sito e te le allego subito qui in chat ad alta risoluzione per la stampa!\n`;
    }

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?phone=393246687521&text=${encoded}`;

    // Mostra feedback visivo
    setToastMessage(language === "it" ? "Ordine registrato! Apertura WhatsApp..." : "Order registered! Opening WhatsApp...");
    setTimeout(() => setToastMessage(""), 3500);

    // Gestione cross-platform per apertura WhatsApp
    try {
      const opened = window.open(waUrl, "_blank", "noopener,noreferrer");
      if (!opened || opened.closed || typeof opened.closed === "undefined") {
        window.location.assign(waUrl);
      }
    } catch {
      window.location.assign(waUrl);
    }

    // Memorizza ordine confermato per il modale di riepilogo
    setOrderConfirmedData({
      ...savedOrder,
      waUrl
    });
    setCart([]);
    setCartOpen(false);
    setIsSubmittingOrder(false);
  };

  // Direct Order Submission (Registered directly to Backoffice without opening WhatsApp)
  const handleDirectSubmitOrder = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim() && !customerPhone.trim()) {
      alert(language === "it" 
        ? "Per favore inserisci il tuo Nome e Numero di Telefono per poter registrare l'ordine." 
        : "Please enter your Name and Phone Number to submit the order.");
      return;
    }

    setIsSubmittingOrder(true);
    const orderTimestamp = Date.now();
    const orderCode = `#FE-${Math.floor(orderTimestamp / 1000).toString().slice(-4)}`;

    const finalName = customerName.trim() || (language === "it" ? "Cliente Online" : "Online Customer");
    const finalPhone = customerPhone.trim() || "";

    const orderPayload = {
      orderNumber: orderCode,
      createdAt: new Date().toISOString(),
      customerName: finalName,
      customerPhone: finalPhone,
      customerEmail: customerEmail.trim(),
      deliveryMethod,
      customerAddress: deliveryMethod === "delivery" ? customerAddress.trim() : "",
      orderNotes: orderNotes.trim(),
      items: cart.map((item) => ({
        cartId: item.cartId,
        productId: item.productId,
        title: item.title,
        category: item.category,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        format: item.format,
        finish: item.finish || "",
        notes: item.notes || "",
        photosCount: item.uploadedPhotos?.length || 0,
        previewThumbnail: item.previewThumbnail || (item.uploadedPhotos?.[0]?.dataUrl || null),
        uploadedPhotos: (item.uploadedPhotos || []).map((ph, pIdx) => ({
          name: ph.name || `foto_${pIdx + 1}.jpg`,
          dataUrl: ph.dataUrl || ph.src || (typeof ph === 'string' ? ph : null)
        }))
      })),
      subtotal,
      shippingCost,
      total,
      status: "pending",
      submissionChannel: "direct"
    };

    let savedOrder = orderPayload;
    try {
      const res = await submitCustomerOrder(orderPayload);
      if (res && res.order) savedOrder = res.order;
    } catch (err) {
      console.warn("Invio ordine diretto:", err);
    }

    const waMsg = encodeURIComponent(`Ciao Foto Extracolor! Ho appena inviato l'ordine ${savedOrder.orderNumber} dal sito web a nome di ${finalName}.`);
    const waUrl = `https://api.whatsapp.com/send?phone=393246687521&text=${waMsg}`;

    setOrderConfirmedData({
      ...savedOrder,
      waUrl
    });
    setCart([]);
    setCartOpen(false);
    setIsSubmittingOrder(false);
  };

  // Send Order via Email
  const handleOrderEmail = () => {
    if (cart.length === 0) {
      setToastMessage(language === "it" ? "Il carrello è vuoto!" : "Your cart is empty!");
      setTimeout(() => setToastMessage(""), 3000);
      return;
    }

    const finalName = customerName.trim() || (language === "it" ? "Cliente Online" : "Online Customer");
    const subject = encodeURIComponent(`Nuovo Ordine Shop Foto Extracolor - ${finalName}`);
    let body = `NUOVO ORDINE DA SHOP ONLINE - FOTO EXTRACOLOR\n\n`;
    body += `Cliente: ${finalName}\n`;
    body += `Telefono: ${customerPhone.trim() || "Da richiedere"}\n`;
    body += `Email: ${customerEmail.trim() || "Da richiedere"}\n`;
    body += `Modalita di Consegna: ${deliveryMethod === "pickup" ? "Ritiro in negozio a Salerno" : "Spedizione a domicilio"}\n`;
    if (deliveryMethod === "delivery" && customerAddress.trim()) {
      body += `Indirizzo: ${customerAddress}\n`;
    }
    if (orderNotes.trim()) body += `Note: ${orderNotes}\n`;

    body += `\nARTICOLI ORDINATI:\n`;
    cart.forEach((item, idx) => {
      body += `\n${idx + 1}. ${item.title} x${item.quantity} - EUR ${(item.unitPrice * item.quantity).toFixed(2)}\n`;
      body += `   - Formato: ${item.format}\n`;
      if (item.finish) body += `   - Carta: ${item.finish}\n`;
      if (item.notes) body += `   - Note: ${item.notes}\n`;
      if (item.uploadedPhotos?.length > 0) {
        body += `   - ${item.uploadedPhotos.length} foto pronte per l'invio\n`;
      }
    });

    body += `\nTOTALE ORDINE: EUR ${total.toFixed(2)}\n`;

    const mailtoUrl = `mailto:info@fotoextracolor.com?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.assign(mailtoUrl);
  };

  const categories = [
    { id: "all", labelIt: "Tutti i Prodotti", labelEn: "All Products" },
    { id: "prints", labelIt: "Stampe & Poster Lab", labelEn: "Prints & Posters" },
    { id: "photobooks", labelIt: "Fotolibri Artigianali", labelEn: "Photobooks" },
    { id: "wallart", labelIt: "Quadri su Tela & Cornici", labelEn: "Canvas & Frames" },
    { id: "gadget", labelIt: "Gadget Fotografici", labelEn: "Photo Gifts" },
    { id: "vintage", labelIt: "Pellicole & Laboratorio", labelEn: "Film & Analog Lab" },
  ];

  const activeProducts = productsList.filter((p) => p.active !== false);
  const filteredProducts = selectedCategory === "all"
    ? activeProducts
    : activeProducts.filter((p) => p.category === selectedCategory);

  return (
    <div className="shop-page-wrapper">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="shop-toast animate-slide-up">
          <IconCheck className="toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner & Boutique Studio Header */}
      <header className="shop-hero-header">
        <div className="shop-hero-badge">
          <span className="pulse-dot"></span>
          <span>{language === "it" ? "Bottega Fotografica & Laboratorio Artigianale" : "Artisanal Photo Lab & Atelier"}</span>
        </div>
        <h1 className="shop-hero-title">
          {language === "it" ? "Stampe d'Autore & Creazioni Personalizzate" : "Fine Art Prints & Handcrafted Gifts"}
        </h1>
        <p className="shop-hero-subtitle">
          {language === "it"
            ? "Autentico sviluppo su carta chimica Fujicolor Crystal Archive, quadri su tela d'autore, fotolibri e regali personalizzati a mano con cura nel nostro laboratorio di Salerno."
            : "Authentic darkroom chemical prints on Fujicolor Crystal Archive, fine art canvas, artisanal photobooks and photo gifts crafted with care in our Salerno studio."}
        </p>

        {/* Quality & Trust Bar */}
        <div className="shop-trust-bar">
          <div className="trust-item">
            <span className="trust-icon">✦</span>
            <div className="trust-text">
              <strong>{language === "it" ? "Carta Chimica & Fine Art" : "Archival Quality"}</strong>
              <span>{language === "it" ? "Fujicolor Crystal Archive garantita nel tempo" : "Museum grade longevity"}</span>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✦</span>
            <div className="trust-text">
              <strong>{language === "it" ? "Ritiro Sede o Spedizione" : "Pickup or Fast Shipping"}</strong>
              <span>{language === "it" ? "Gratuito a Salerno o espresso in tutta Italia" : "Free in store or express delivery"}</span>
            </div>
          </div>
          <div className="trust-item">
            <span className="trust-icon">✦</span>
            <div className="trust-text">
              <strong>{language === "it" ? "Assistenza WhatsApp" : "Direct WhatsApp Support"}</strong>
              <span>{language === "it" ? "Verifica manuale del file prima della stampa" : "Manual pre-flight file check"}</span>
            </div>
          </div>
        </div>

        {/* Category Navigation, View Switcher & Shop Cart Toolbar */}
        <div className="shop-toolbar-row">
          <div className="shop-category-pills">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="category-pill-label">{language === "it" ? cat.labelIt : cat.labelEn}</span>
              </button>
            ))}
          </div>

          <div className="shop-toolbar-actions">
            {/* View Switcher Toggle: 3D Stack (default) vs Grid */}
            <div className="shop-view-switcher">
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "stack" ? "active" : ""}`}
                onClick={() => setViewMode("stack")}
                title={language === "it" ? "Esperienza 3D Carousel" : "3D Carousel Experience"}
              >
                <span>3D Stack</span>
              </button>
              <button
                type="button"
                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title={language === "it" ? "Catalogo a Griglia" : "Grid Catalog"}
              >
                <span>Griglia</span>
              </button>
            </div>

            {/* Shop Quick Cart Pill */}
            <button
              type="button"
              className={`shop-toolbar-cart-btn ${totalItemsCount > 0 ? "has-items" : ""}`}
              onClick={() => setCartOpen(true)}
              aria-label="Apri Carrello"
            >
              <IconCart className="shop-cart-pill-icon" />
              <span className="shop-cart-pill-title">{language === "it" ? "Carrello" : "Cart"}</span>
              <span className="shop-cart-pill-badge">{totalItemsCount}</span>
              {totalItemsCount > 0 && (
                <span className="shop-cart-pill-price">€{subtotal.toFixed(2)}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Experience: Ruixen 3D Card Stack Carousel (default) or Grid */}
      <main className="shop-catalog-container">
        {viewMode === "stack" ? (
          <CardStackExperience
            products={filteredProducts}
            language={language}
            onCustomize={setCustomizingProduct}
            onAddToCart={handleAddToCart}
          />
        ) : (
          <div className="shop-products-grid animate-fade-in">
            {filteredProducts.map((product) => {
              const title = language === "it" ? product.titleIt : product.titleEn;
              const desc = language === "it" ? product.descIt : product.descEn;

              return (
                <div key={product.id} className="shop-product-card">
                  {product.badge && (
                    <span className="product-badge-tag">{product.badge}</span>
                  )}

                  {/* Product Visual Mockup / Visual Card */}
                  <div
                    className="product-card-visual"
                    onClick={() => product.requiresPhoto ? setCustomizingProduct(product) : handleAddToCart(product)}
                  >
                    <ProductVisualMockup
                      type={product.mockupType}
                      category={product.category}
                      title={title}
                      productId={product.id}
                      product={product}
                    />
                    {product.requiresPhoto && (
                      <div className="product-photo-overlay-badge">
                        <IconUpload className="upload-mini-icon" />
                        <span>{language === "it" ? "Personalizza Foto" : "Customize Photo"}</span>
                      </div>
                    )}
                  </div>

                  <div className="product-card-content">
                    <div className="product-card-header-meta">
                      <span className="product-category-sub">{getCategoryLabel(product.category, language)}</span>
                    </div>
                    <h3 className="product-card-title">{title}</h3>
                    <p className="product-card-desc">{desc}</p>

                    <div className="product-card-footer">
                      <div className="product-price-box">
                        <span className="price-label">{language === "it" ? "A partire da" : "From"}</span>
                        <span className="price-value">€{product.basePrice.toFixed(2)}</span>
                      </div>

                      {product.requiresPhoto ? (
                        <button
                          type="button"
                          className="btn-product-action custom-photo-btn"
                          onClick={() => setCustomizingProduct(product)}
                        >
                          <IconUpload />
                          <span>{language === "it" ? "Configura" : "Configure"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-product-action direct-add-btn"
                          onClick={() => handleAddToCart(product)}
                        >
                          <IconCart />
                          <span>{language === "it" ? "Aggiungi" : "Add to Cart"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CUSTOMIZER & PHOTO UPLOAD MODAL */}
      {customizingProduct && (
        <ProductCustomizerModal
          product={customizingProduct}
          language={language}
          onClose={() => setCustomizingProduct(null)}
          onConfirm={(config) => handleAddToCart(customizingProduct, config)}
        />
      )}

      {/* CART DRAWER */}
      {cartOpen && createPortal(
        <div className="cart-drawer-overlay" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-drawer-header">
              <div className="cart-header-title-box">
                <IconCart />
                <h2>{language === "it" ? "Il Tuo Carrello" : "Your Shopping Cart"}</h2>
                <span className="cart-items-counter">({totalItemsCount})</span>
              </div>
              <button
                type="button"
                className="cart-close-btn"
                onClick={() => setCartOpen(false)}
                aria-label="Chiudi Carrello"
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty-view">
                <span className="empty-cart-emoji">🛒</span>
                <h3>{language === "it" ? "Il tuo carrello è vuoto" : "Your cart is currently empty"}</h3>
                <p>
                  {language === "it"
                    ? "Scegli un prodotto dal catalogo o personalizza un gadget con le tue foto preferite!"
                    : "Select a product from our catalog or customize gifts with your favorite pictures!"}
                </p>
                <button
                  type="button"
                  className="btn-shop-continue"
                  onClick={() => setCartOpen(false)}
                >
                  {language === "it" ? "Inizia a Creare" : "Start Shopping"}
                </button>
              </div>
            ) : (
              <div className="cart-filled-view">
                {/* Free Shipping Progress Indicator */}
                <div className="cart-shipping-progress-box">
                  <div className="shipping-progress-header">
                    <span className="shipping-progress-msg">
                      {subtotal >= 50
                        ? (language === "it" ? "🎉 Complimenti! Spedizione Gratuita sbloccata!" : "🎉 Free Shipping unlocked!")
                        : (language === "it"
                            ? `Aggiungi €${(50 - subtotal).toFixed(2)} per la Spedizione Gratuita!`
                            : `Add €${(50 - subtotal).toFixed(2)} more for Free Shipping!`)}
                    </span>
                    <span className="shipping-progress-percent">
                      {Math.min(100, Math.round((subtotal / 50) * 100))}%
                    </span>
                  </div>
                  <div className="shipping-progress-bar-track">
                    <div
                      className="shipping-progress-bar-fill"
                      style={{ width: `${Math.min(100, (subtotal / 50) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="cart-items-scroll">
                  {cart.map((item) => (
                    <div key={item.cartId} className="cart-item-row">
                      {/* Photo Thumbnail or Placeholder */}
                      <div className="cart-item-thumb">
                        {item.previewThumbnail ? (
                          <img src={item.previewThumbnail} alt="Foto caricata" className="cart-thumb-img" />
                        ) : (
                          <div className="cart-thumb-placeholder">📷</div>
                        )}
                        {item.uploadedPhotos?.length > 1 && (
                          <span className="multi-photo-pill">+{item.uploadedPhotos.length - 1}</span>
                        )}
                      </div>

                      <div className="cart-item-details">
                        <h4 className="cart-item-title">{item.title}</h4>
                        <span className="cart-item-format">{item.format}</span>
                        {item.finish && <span className="cart-item-finish">{item.finish}</span>}
                        {item.notes && (
                          <p className="cart-item-notes">"{item.notes}"</p>
                        )}

                        <div className="cart-item-actions">
                          <div className="qty-control-box">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => updateQuantity(item.cartId, -1)}
                            >
                              -
                            </button>
                            <span className="qty-value">{item.quantity}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => updateQuantity(item.cartId, 1)}
                            >
                              +
                            </button>
                          </div>

                          <div className="cart-item-price">
                            €{(item.unitPrice * item.quantity).toFixed(2)}
                          </div>

                          <button
                            type="button"
                            className="cart-remove-item-btn"
                            onClick={() => removeFromCart(item.cartId)}
                            title={language === "it" ? "Rimuovi articolo" : "Remove item"}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="cart-clear-row">
                    <button type="button" className="cart-clear-link" onClick={clearCart}>
                      {language === "it" ? "Svuota carrello" : "Clear all items"}
                    </button>
                  </div>
                </div>

                {/* Checkout & Delivery Section */}
                <div className="cart-checkout-section">
                  <div className="delivery-selection-box">
                    <label className="delivery-label-header">
                      {language === "it" ? "Metodo di Ricezione:" : "Delivery Method:"}
                    </label>
                    <div className="delivery-toggle-group">
                      <button
                        type="button"
                        className={`delivery-option-btn ${deliveryMethod === "pickup" ? "active" : ""}`}
                        onClick={() => setDeliveryMethod("pickup")}
                      >
                        <span className="delivery-btn-icon">🏬</span>
                        <div>
                          <strong>{language === "it" ? "Ritiro in Negozio" : "Store Pickup"}</strong>
                          <span className="delivery-btn-sub">{language === "it" ? "Salerno - Gratuito" : "Free pickup"}</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={`delivery-option-btn ${deliveryMethod === "delivery" ? "active" : ""}`}
                        onClick={() => setDeliveryMethod("delivery")}
                      >
                        <span className="delivery-btn-icon">🚚</span>
                        <div>
                          <strong>{language === "it" ? "Spedizione Corriere" : "Courier Shipping"}</strong>
                          <span className="delivery-btn-sub">
                            {subtotal >= 50 ? (language === "it" ? "Gratuita (>€50)" : "Free over €50") : "€6.90"}
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Customer Info Form */}
                  <div className="checkout-inputs-box">
                    <div className="checkout-input-group">
                      <label>{language === "it" ? "Nome e Cognome *" : "Full Name *"}</label>
                      <input
                        type="text"
                        placeholder="es. Mario Rossi"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="checkout-input-row">
                      <div className="checkout-input-group">
                        <label>{language === "it" ? "Telefono / WhatsApp *" : "Phone / WhatsApp *"}</label>
                        <input
                          type="tel"
                          placeholder="es. 333 1234567"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="checkout-input-group">
                        <label>{language === "it" ? "Email (opzionale)" : "Email (optional)"}</label>
                        <input
                          type="email"
                          placeholder="es. nome@email.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {deliveryMethod === "delivery" && (
                      <div className="checkout-input-group animate-fade-in">
                        <label>{language === "it" ? "Indirizzo di Spedizione Completo *" : "Shipping Address *"}</label>
                        <input
                          type="text"
                          placeholder="Via, Civico, Città, CAP, Provincia"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="checkout-input-group">
                      <label>{language === "it" ? "Note per il Laboratorio" : "Notes for the studio"}</label>
                      <input
                        type="text"
                        placeholder={language === "it" ? "es. Preferisco ritirare di sabato mattina" : "e.g. Any special instructions"}
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="cart-totals-summary">
                    <div className="total-line">
                      <span>{language === "it" ? "Subtotale Prodotti" : "Subtotal"}</span>
                      <span>€{subtotal.toFixed(2)}</span>
                    </div>
                    {deliveryMethod === "delivery" && (
                      <div className="total-line">
                        <span>{language === "it" ? "Spedizione" : "Shipping"}</span>
                        <span>{shippingCost === 0 ? (language === "it" ? "GRATIS" : "FREE") : `€${shippingCost.toFixed(2)}`}</span>
                      </div>
                    )}
                    <div className="total-line grand-total">
                      <span>{language === "it" ? "Totale" : "Total"}</span>
                      <span className="total-amount">€{total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Submit Order Buttons */}
                  <div className="checkout-cta-buttons">
                    <button
                      type="button"
                      className="btn-order-whatsapp"
                      onClick={handleOrderWhatsApp}
                      disabled={isSubmittingOrder}
                    >
                      <IconWhatsApp />
                      <span>{isSubmittingOrder ? (language === "it" ? "Registrazione in corso..." : "Submitting...") : (language === "it" ? "Invia su WhatsApp & Registra Ordine" : "Send via WhatsApp & Place Order")}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-order-direct"
                      onClick={handleDirectSubmitOrder}
                      disabled={isSubmittingOrder}
                    >
                      <span>⚡</span>
                      <span>{isSubmittingOrder ? (language === "it" ? "Invio in corso..." : "Sending...") : (language === "it" ? "Conferma Ordine al Laboratorio" : "Submit Order to Studio")}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-order-email"
                      onClick={handleOrderEmail}
                    >
                      <IconEmail />
                      <span>{language === "it" ? "Invia per Email" : "Send via Email"}</span>
                    </button>
                  </div>
                  <p className="order-disclaimer-note">
                    {language === "it"
                      ? "🔒 Nessun pagamento anticipato online richiesto adesso. L'ordine viene registrato direttamente nel gestionale di laboratorio di Riccardo & Gabriela."
                      : "🔒 No upfront payment required now. Order is registered directly into our studio lab system."}
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>,
        document.body
      )}

      {/* MODALE CONFERMA ORDINE RICEVUTO */}
      {orderConfirmedData && createPortal(
        <div className="order-confirmed-modal-overlay" onClick={() => setOrderConfirmedData(null)}>
          <div className="order-confirmed-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-confirmed-badge-check">✓</div>
            <div className="order-confirmed-code">{orderConfirmedData.orderNumber}</div>
            <h2 className="order-confirmed-title">
              {language === "it" ? "Ordine Ricevuto con Successo!" : "Order Successfully Placed!"}
            </h2>
            <p className="order-confirmed-subtitle">
              {language === "it"
                ? "Il tuo ordine è stato registrato nel nostro gestionale di laboratorio. Riccardo e Gabriela prepareranno i tuoi lavori con la massima cura artigianale."
                : "Your order has been registered in our studio lab system. Riccardo and Gabriela will take care of your photo items with artisan precision."}
            </p>

            <div className="order-confirmed-summary-box">
              <div className="confirmed-summary-row">
                <span className="summary-label">{language === "it" ? "Cliente:" : "Customer:"}</span>
                <span className="summary-val">{orderConfirmedData.customerName}</span>
              </div>
              {orderConfirmedData.customerPhone && (
                <div className="confirmed-summary-row">
                  <span className="summary-label">{language === "it" ? "Telefono:" : "Phone:"}</span>
                  <span className="summary-val">{orderConfirmedData.customerPhone}</span>
                </div>
              )}
              <div className="confirmed-summary-row">
                <span className="summary-label">{language === "it" ? "Consegna:" : "Delivery:"}</span>
                <span className="summary-val">
                  {orderConfirmedData.deliveryMethod === "pickup"
                    ? (language === "it" ? "Ritiro in negozio a Salerno" : "Pickup at Salerno Store")
                    : (language === "it" ? `Spedizione a domicilio (${orderConfirmedData.customerAddress || "Indirizzo fornito"})` : "Home Delivery")}
                </span>
              </div>
              <div className="confirmed-summary-row total-highlight">
                <span className="summary-label">{language === "it" ? "Totale Ordine:" : "Total Amount:"}</span>
                <span className="summary-val">€{orderConfirmedData.total?.toFixed(2)}</span>
              </div>
              <div className="confirmed-summary-items-count">
                <span>📦 {orderConfirmedData.items?.length || 0} {language === "it" ? "articoli ordinati" : "items in order"}</span>
              </div>
            </div>

            <div className="order-confirmed-actions">
              {orderConfirmedData.waUrl && (
                <a
                  href={orderConfirmedData.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-order-wa-confirmed"
                >
                  <IconWhatsApp />
                  <span>{language === "it" ? "Apri Chat WhatsApp con il Laboratorio" : "Open WhatsApp Chat with Studio"}</span>
                </a>
              )}
              <button
                type="button"
                className="btn-order-close-confirmed"
                onClick={() => setOrderConfirmedData(null)}
              >
                {language === "it" ? "Chiudi & Torna allo Shop" : "Close & Back to Shop"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 3D CARD STACK CAROUSEL EXPERIENCE (Ruixen UI style)
// -------------------------------------------------------------
function CardStackExperience({ products, language, onCustomize, onAddToCart }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 768);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const isDragging = useRef(false);
  const mouseStartX = useRef(null);

  // Sync active index if filtered products count changes
  useEffect(() => {
    setActiveIndex(0);
  }, [products]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const total = products.length;

  const nextCard = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevCard = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextCard();
      if (e.key === "ArrowLeft") prevCard();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextCard, prevCard]);

  // Auto-advance every 5 seconds if not hovered or dragging
  useEffect(() => {
    if (isHovered || total <= 1) return;
    const interval = setInterval(nextCard, 5000);
    return () => clearInterval(interval);
  }, [isHovered, total, nextCard]);

  // Touch Swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) nextCard();
    else if (diff < -40) prevCard();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Mouse Drag
  const handleMouseDown = (e) => {
    isDragging.current = true;
    mouseStartX.current = e.clientX;
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current || mouseStartX.current === null) return;
    const diff = mouseStartX.current - e.clientX;
    if (diff > 50) {
      nextCard();
      isDragging.current = false;
      mouseStartX.current = null;
    } else if (diff < -50) {
      prevCard();
      isDragging.current = false;
      mouseStartX.current = null;
    }
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    mouseStartX.current = null;
  };

  if (total === 0) {
    return (
      <div className="card-stack-empty">
        <p>{language === "it" ? "Nessun prodotto trovato in questa categoria." : "No products found in this category."}</p>
      </div>
    );
  }

  const activeProduct = products[activeIndex] || products[0];
  const activeTitle = language === "it" ? activeProduct.titleIt : activeProduct.titleEn;
  const activeCategoryLabel = getCategoryLabel(activeProduct.category, language);

  const getCardStyle = (index) => {
    let offset = index - activeIndex;
    const half = Math.floor(total / 2);
    if (offset > half) offset -= total;
    if (offset < -half) offset += total;

    const absOffset = Math.abs(offset);
    const isHidden = absOffset > 2;

    const cardWidth = isMobile ? 290 : 380;
    const overlap = 0.46;
    const spreadDeg = isMobile ? 26 : 40;

    const stepX = cardWidth * (1 - overlap);
    const x = offset * stepX;
    const y = absOffset * (isMobile ? 8 : 14);
    const z = -absOffset * (isMobile ? 55 : 85);
    const angle = offset * (spreadDeg / 2.6);
    const rotY = offset * -8;
    const scale = Math.max(0.72, 1 - absOffset * 0.08);
    const zIndex = 60 - absOffset * 10;
    const opacity = isHidden ? 0 : Math.max(0, 1 - absOffset * 0.22);
    const pointerEvents = offset === 0 ? "auto" : isHidden ? "none" : "auto";

    return {
      transform: `translateX(${x}px) translateY(${y}px) translateZ(${z}px) rotateZ(${angle}deg) rotateY(${rotY}deg) scale(${scale})`,
      zIndex,
      opacity,
      pointerEvents,
      visibility: isHidden ? "hidden" : "visible",
    };
  };

  return (
    <div
      className="card-stack-experience-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseUp();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Category Header Ribbon */}
      <div className="card-stack-category-header">
        <div className="card-stack-cat-indicator-pill">
          <span className="cat-sparkle">✦</span>
          <span className="cat-prefix">{language === "it" ? "CATEGORIA:" : "CATEGORY:"}</span>
          <strong className="cat-name">{activeCategoryLabel}</strong>
        </div>
      </div>

      <div className="card-stack-stage">
        {/* Floating Navigation Arrows */}
        <button
          type="button"
          className="stack-arrow-btn prev-arrow"
          onClick={(e) => {
            e.stopPropagation();
            prevCard();
          }}
          aria-label={language === "it" ? "Prodotto precedente" : "Previous product"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          className="stack-arrow-btn next-arrow"
          onClick={(e) => {
            e.stopPropagation();
            nextCard();
          }}
          aria-label={language === "it" ? "Prodotto successivo" : "Next product"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* 3D Stack Viewport */}
        <div className="card-stack-viewport">
          {products.map((p, idx) => {
            const isActive = idx === activeIndex;
            const style = getCardStyle(idx);
            const title = language === "it" ? p.titleIt : p.titleEn;
            const desc = language === "it" ? p.descIt : p.descEn;
            const cardCatLabel = getCategoryLabel(p.category, language);

            return (
              <div
                key={p.id}
                className={`card-stack-item ${isActive ? "is-active" : ""}`}
                style={style}
                onClick={() => {
                  if (!isActive) {
                    setActiveIndex(idx);
                  }
                }}
              >
                {/* Badges Bar: Category Tag & Special Badge */}
                <div className="card-stack-badge-container">
                  <span className="card-stack-cat-tag">
                    {cardCatLabel}
                  </span>
                  {p.badge && (
                    <span className="card-stack-badge">{p.badge}</span>
                  )}
                </div>

                {/* Mockup Showcase */}
                <div
                  className="card-stack-visual"
                  onClick={(e) => {
                    if (isActive) {
                      e.stopPropagation();
                      if (p.requiresPhoto) onCustomize(p);
                      else onAddToCart(p);
                    }
                  }}
                >
                  <ProductVisualMockup
                    type={p.mockupType}
                    category={p.category}
                    title={title}
                    productId={p.id}
                    product={p}
                  />
                  {isActive && p.requiresPhoto && (
                    <div className="card-stack-photo-hint">
                      <IconUpload className="upload-mini-icon" />
                      <span>{language === "it" ? "Carica Foto" : "Upload Photo"}</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="card-stack-content">
                  <div className="card-stack-kicker">
                    <span className="kicker-tag-label">{language === "it" ? "CATEGORIA:" : "CATEGORY:"}</span>
                    <strong className="kicker-category-title">{cardCatLabel}</strong>
                  </div>
                  <h3 className="card-stack-title">{title}</h3>
                  <p className="card-stack-desc">{desc}</p>

                  <div className="card-stack-footer">
                    <div className="card-stack-price">
                      <span className="card-stack-price-sub">{language === "it" ? "A partire da" : "From"}</span>
                      <span className="card-stack-price-val">€{p.basePrice.toFixed(2)}</span>
                    </div>

                    {isActive ? (
                      p.requiresPhoto ? (
                        <button
                          type="button"
                          className="btn-card-stack-action customize-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCustomize(p);
                          }}
                        >
                          <IconUpload />
                          <span>{language === "it" ? "Personalizza Ora" : "Customize"}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-card-stack-action direct-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(p);
                          }}
                        >
                          <IconCart />
                          <span>{language === "it" ? "Aggiungi al Carrello" : "Add to Cart"}</span>
                        </button>
                      )
                    ) : (
                      <span className="card-stack-click-hint">
                        {language === "it" ? "Clicca per visualizzare" : "Click to view"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination & Indicators */}
      <div className="card-stack-controls-bar">
        <div className="card-stack-indicator-text">
          <span className="active-idx-num">{activeIndex + 1}</span>
          <span className="total-idx-num">/ {total}</span>
          <span className="indicator-sep">•</span>
          <span className="indicator-cat-pill">{activeCategoryLabel}</span>
          <span className="indicator-sep">•</span>
          <span className="indicator-title-label">{activeTitle}</span>
        </div>

        <div className="card-stack-dots">
          {products.map((p, dotIdx) => (
            <button
              key={p.id}
              type="button"
              className={`card-stack-dot ${dotIdx === activeIndex ? "active" : ""}`}
              onClick={() => setActiveIndex(dotIdx)}
              aria-label={`Vai al prodotto ${dotIdx + 1}`}
              title={`${getCategoryLabel(p.category, language)}: ${language === "it" ? p.titleIt : p.titleEn}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// IMAGE HELPER FUNCTIONS FOR MOBILE & DESKTOP RELIABILITY
// -------------------------------------------------------------
function isImageFile(file) {
  if (!file) return false;
  if (file.type && file.type.startsWith("image/")) return true;
  const name = file.name || "";
  const ext = name.split(".").pop().toLowerCase();
  const validExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif", "gif", "bmp", "avif", "tiff", "dng"];
  if (validExtensions.includes(ext)) return true;
  // Fallback for mobile camera roll where MIME type might be empty
  if (!file.type && file.size > 0) return true;
  return false;
}

function createOptimizedThumbnail(file, maxDimension = 700) {
  return new Promise((resolve) => {
    if (typeof URL === "undefined" || !file) {
      return resolve(null);
    }

    const objectUrl = URL.createObjectURL(file);
    const isHeic = /\.(heic|heif)$/i.test(file.name || "") || (file.type && file.type.includes("heic"));

    // Quick safety timeout so mobile never hangs
    const timer = setTimeout(() => {
      if (isHeic) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" rx="12" fill="#252530" stroke="#d4af37" stroke-width="2"/><text x="50%" y="45%" text-anchor="middle" font-size="32">📱</text><text x="50%" y="68%" text-anchor="middle" fill="#d4af37" font-family="sans-serif" font-weight="bold" font-size="14">Foto iPhone (HEIC)</text><text x="50%" y="84%" text-anchor="middle" fill="#aaa" font-family="sans-serif" font-size="11">Risoluzione originale pronta</text></svg>`;
        resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
      } else {
        resolve(objectUrl);
      }
    }, 2000);

    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (!width || !height) return resolve(objectUrl);

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const thumb = canvas.toDataURL("image/jpeg", 0.75);
        resolve(thumb);
      } catch {
        resolve(objectUrl);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      if (isHeic) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" rx="12" fill="#252530" stroke="#d4af37" stroke-width="2"/><text x="50%" y="45%" text-anchor="middle" font-size="32">📱</text><text x="50%" y="68%" text-anchor="middle" fill="#d4af37" font-family="sans-serif" font-weight="bold" font-size="14">Foto iPhone (HEIC)</text><text x="50%" y="84%" text-anchor="middle" fill="#aaa" font-family="sans-serif" font-size="11">Risoluzione originale pronta</text></svg>`;
        resolve(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
      } else {
        resolve(objectUrl);
      }
    };

    img.src = objectUrl;
  });
}

// -------------------------------------------------------------
// PRODUCT CUSTOMIZER & PHOTO UPLOAD MODAL COMPONENT
// Dual Experience: Dedicated Mobile Sheet for phones & 2-column modal for PC
// -------------------------------------------------------------
function ProductCustomizerModal({ product, language, onClose, onConfirm }) {
  const isPaperProduct = product.category === "prints" || product.category === "photobooks";
  const [selectedFormat, setSelectedFormat] = useState(product.formats[0] || { name: "Standard", extra: 0 });
  const [customFormatText, setCustomFormatText] = useState("");
  const [isCustomFormat, setIsCustomFormat] = useState(false);
  const [selectedFinish, setSelectedFinish] = useState(isPaperProduct ? "Lucida" : "");
  const [customText, setCustomText] = useState("");
  const [manualQuantity, setManualQuantity] = useState(1);
  const [copiesPerPhoto, setCopiesPerPhoto] = useState(1);
  const [photos, setPhotos] = useState([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth <= 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const title = language === "it" ? product.titleIt : product.titleEn;
  const effectiveQuantity = photos.length > 0 ? (photos.length * copiesPerPhoto) : manualQuantity;
  const unitPrice = computeUnitPrice(product, selectedFormat, effectiveQuantity);
  const currentPrice = unitPrice * effectiveQuantity;

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const fileArray = Array.from(fileList);
    const valid = fileArray.filter(isImageFile);

    if (valid.length === 0) {
      alert(
        language === "it"
          ? "Nessun file immagine valido rilevato. Per favore seleziona foto in formato JPG, PNG, WEBP o HEIC."
          : "No valid image files found. Please select JPG, PNG, WEBP or HEIC photos."
      );
      return;
    }

    setIsProcessingPhotos(true);
    setProcessingCount(valid.length);

    try {
      const processed = await Promise.all(
        valid.map(async (file, idx) => {
          const fileName = file.name || `foto_${Date.now()}_${idx + 1}.jpg`;
          const objectUrl = URL.createObjectURL(file);
          let thumbnail = null;
          try {
            thumbnail = await createOptimizedThumbnail(file, 700);
          } catch {
            thumbnail = objectUrl;
          }

          return {
            name: fileName,
            size: file.size,
            dataUrl: thumbnail || objectUrl,
            previewUrl: objectUrl,
            file
          };
        })
      );

      setPhotos((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error("Errore elaborazione foto:", err);
      alert(
        language === "it"
          ? "Si è verificato un errore durante l'elaborazione delle foto. Riprova."
          : "An error occurred while processing photos. Please try again."
      );
    } finally {
      setIsProcessingPhotos(false);
      setProcessingCount(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removePhoto = (idx, e) => {
    if (e) e.stopPropagation();
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setSelectedPhotoIndex((prev) => {
      if (idx === prev) return 0;
      if (idx < prev) return Math.max(0, prev - 1);
      return prev;
    });
  };

  const clearAllPhotos = () => {
    setPhotos([]);
    setSelectedPhotoIndex(0);
  };

  const safePhotoIndex = photos.length > 0 ? Math.min(selectedPhotoIndex, photos.length - 1) : 0;
  const activePhoto = photos[safePhotoIndex]?.dataUrl || photos[safePhotoIndex]?.previewUrl || null;

  // ==============================================================
  // DEDICATED MOBILE-ONLY MODAL (FOR PHONES & TABLETS <= 768px)
  // ==============================================================
  if (isMobile) {
    return createPortal(
      <div className="mobile-customizer-overlay" onClick={onClose}>
        <div className="mobile-customizer-sheet" onClick={(e) => e.stopPropagation()}>
          {/* Top Drag Handle */}
          <div className="mobile-customizer-handle-bar">
            <div className="mobile-drag-pill" />
          </div>

          {/* Header */}
          <div className="mobile-customizer-header">
            <div className="mobile-header-info">
              <span className="mobile-customizer-kicker">
                {getCategoryLabel(product.category, language)}
              </span>
              <h2 className="mobile-customizer-title">{title}</h2>
            </div>
            <button
              type="button"
              className="mobile-modal-close-btn"
              onClick={onClose}
              aria-label="Chiudi finestra"
            >
              ✕
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="mobile-customizer-scroll-body">
            {/* STEP 1: CARICA LE TUE FOTO (PRIMARY HERO ACTION) */}
            <div className="mobile-section-card photo-upload-card">
              <div className="mobile-section-title-row">
                <span className="mobile-section-title">
                  📸 {language === "it" ? "Le Tue Foto" : "Your Photos"}
                </span>
                {photos.length > 0 && (
                  <button
                    type="button"
                    className="mobile-clear-btn"
                    onClick={clearAllPhotos}
                  >
                    {language === "it" ? "✕ Svuota tutte" : "✕ Clear all"}
                  </button>
                )}
              </div>

              {/* Big Touch-Friendly Button with Native File Input Overlay */}
              <div className="mobile-upload-btn-wrapper">
                <div className="mobile-upload-btn-visual">
                  <div className="mob-icon-circle">
                    <IconUpload style={{ width: 28, height: 28 }} />
                  </div>
                  <div className="mob-text-col">
                    <strong className="mob-btn-main-text">
                      {photos.length > 0
                        ? (language === "it" ? "➕ Aggiungi altre foto dal telefono" : "➕ Add more photos from phone")
                        : (language === "it" ? "Tocca qui per scegliere le foto" : "Tap here to choose photos")}
                    </strong>
                    <span className="mob-btn-sub-text">
                      {language === "it"
                        ? "Galleria, Rullino o Scatta Foto con la Fotocamera"
                        : "Gallery, Camera Roll or Take Photo"}
                    </span>
                  </div>
                </div>
                {/* Physical native file input over the entire card */}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mobile-upload-real-input"
                  onChange={(e) => {
                    const sel = e.target.files ? Array.from(e.target.files) : [];
                    e.target.value = "";
                    if (sel.length > 0) handleFiles(sel);
                  }}
                />
              </div>

              {isProcessingPhotos && (
                <div className="mobile-processing-pill">
                  <span className="spinner-rotate">⏳</span>
                  <span>
                    {language === "it"
                      ? `Caricamento di ${processingCount} foto in corso...`
                      : `Loading ${processingCount} photos...`}
                  </span>
                </div>
              )}

              {/* Gallery of Uploaded Photos */}
              {photos.length > 0 && (
                <div className="mobile-photos-gallery-section">
                  <div className="mobile-photos-count-badge">
                    <span>
                      {language === "it"
                        ? `✅ ${photos.length} foto caricate per questo articolo`
                        : `✅ ${photos.length} photos ready for print`}
                    </span>
                  </div>

                  <div className="mobile-thumbnails-scroll">
                    {photos.map((p, idx) => (
                      <div
                        key={idx}
                        className={`mobile-thumb-card ${idx === safePhotoIndex ? "selected" : ""}`}
                        onClick={() => setSelectedPhotoIndex(idx)}
                      >
                        <img src={p.dataUrl} alt={p.name} />
                        <span className="mobile-thumb-number">#{idx + 1}</span>
                        <button
                          type="button"
                          className="mobile-thumb-del"
                          onClick={(e) => removePhoto(idx, e)}
                          title="Rimuovi foto"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {/* Quick Add Extra Button */}
                    <div className="mobile-thumb-add-card">
                      <div className="add-card-content">
                        <span style={{ fontSize: "1.4rem" }}>➕</span>
                        <small>{language === "it" ? "Aggiungi" : "Add"}</small>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="mobile-upload-real-input"
                        onChange={(e) => {
                          const sel = e.target.files ? Array.from(e.target.files) : [];
                          e.target.value = "";
                          if (sel.length > 0) handleFiles(sel);
                        }}
                      />
                    </div>
                  </div>

                  {/* Compact Live Mockup */}
                  <div className="mobile-mockup-compact-container">
                    <MockupPreviewStage
                      mockupType={product.mockupType}
                      photoUrl={activePhoto}
                      customText={customText}
                    />
                    <div className="mobile-mockup-label">
                      <span>{language === "it" ? `Anteprima Foto #${safePhotoIndex + 1}` : `Preview Photo #${safePhotoIndex + 1}`}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: SCEGLI FORMATO */}
            {product.formats.length > 0 && (
              <div className="mobile-section-card">
                <div className="mobile-section-title-row">
                  <span className="mobile-section-title">
                    📐 {language === "it" ? "Seleziona Formato" : "Select Format"}
                  </span>
                  {isCustomFormat && (
                    <span className="mobile-custom-tag">{language === "it" ? "Personalizzato" : "Custom"}</span>
                  )}
                </div>

                <div className="mobile-formats-grid">
                  {product.formats.map((fmt, i) => {
                    const isSelected = !isCustomFormat && selectedFormat.name === fmt.name;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`mobile-fmt-chip ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          setIsCustomFormat(false);
                          setCustomFormatText("");
                          setSelectedFormat(fmt);
                        }}
                      >
                        <strong className="chip-name">{fmt.name}</strong>
                        <span className="chip-price">
                          {fmt.extra === 0 ? "Base" : `+€${fmt.extra.toFixed(2)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Scaglioni di prezzo se 10x15 o 13x18 */}
                {selectedFormat?.name?.includes("10x15") && (
                  <div className="mobile-discount-tier-box">
                    <span className="discount-tier-title">🏷️ Listino Prezzi Foto 10x15:</span>
                    <div className="discount-pills">
                      <span className={effectiveQuantity <= 10 ? "active" : ""}>1-10: <strong>0.50€</strong></span>
                      <span className={effectiveQuantity >= 11 && effectiveQuantity <= 30 ? "active" : ""}>11-30: <strong>0.35€</strong></span>
                      <span className={effectiveQuantity >= 31 ? "active" : ""}>31+: <strong>0.25€</strong></span>
                    </div>
                  </div>
                )}
                {selectedFormat?.name?.includes("13x18") && (
                  <div className="mobile-discount-tier-box">
                    <span className="discount-tier-title">🏷️ Listino Prezzi Foto 13x18:</span>
                    <div className="discount-pills">
                      <span className={effectiveQuantity <= 10 ? "active" : ""}>1-10: <strong>0.80€</strong></span>
                      <span className={effectiveQuantity >= 11 && effectiveQuantity <= 30 ? "active" : ""}>11-30: <strong>0.50€</strong></span>
                      <span className={effectiveQuantity >= 31 ? "active" : ""}>31+: <strong>0.35€</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: TIPO DI CARTA (se stampe/fotolibri) */}
            {isPaperProduct && (
              <div className="mobile-section-card">
                <span className="mobile-section-title">
                  ✨ {language === "it" ? "Tipo di Carta" : "Paper Finish"}
                </span>
                <div className="mobile-finish-grid">
                  {["Lucida", "Satinata"].map((fn, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`mobile-finish-chip ${selectedFinish === fn ? "active" : ""}`}
                      onClick={() => setSelectedFinish(fn)}
                    >
                      {fn === "Lucida" ? "✨ Lucida (Brillante)" : "🎨 Satinata (Opaca Soft)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: QUANTITÀ */}
            <div className="mobile-section-card">
              <span className="mobile-section-title">
                🔢 {language === "it" ? "Quantità Stampe" : "Quantity"}
              </span>

              {photos.length > 0 ? (
                <div className="mobile-qty-stepper-box">
                  <div className="mobile-qty-desc">
                    <strong>{photos.length * copiesPerPhoto} stampe in totale</strong>
                    <small>
                      {copiesPerPhoto === 1
                        ? (language === "it" ? `(1 copia per ciascuna foto)` : `(1 copy each)`)
                        : (language === "it" ? `(${copiesPerPhoto} copie per ciascuna foto)` : `(${copiesPerPhoto} copies each)`)}
                    </small>
                  </div>
                  <div className="mobile-stepper-buttons">
                    <button
                      type="button"
                      className="mob-step-btn"
                      onClick={() => setCopiesPerPhoto((c) => Math.max(1, c - 1))}
                      disabled={copiesPerPhoto <= 1}
                    >
                      -
                    </button>
                    <span className="mob-step-val">{copiesPerPhoto}x</span>
                    <button
                      type="button"
                      className="mob-step-btn"
                      onClick={() => setCopiesPerPhoto((c) => c + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mobile-qty-stepper-box">
                  <span className="mobile-qty-desc">
                    <strong>{manualQuantity} pezzi</strong>
                  </span>
                  <div className="mobile-stepper-buttons">
                    <button
                      type="button"
                      className="mob-step-btn"
                      onClick={() => setManualQuantity((q) => Math.max(1, q - 1))}
                      disabled={manualQuantity <= 1}
                    >
                      -
                    </button>
                    <span className="mob-step-val">{manualQuantity}</span>
                    <button
                      type="button"
                      className="mob-step-btn"
                      onClick={() => setManualQuantity((q) => q + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 5: DEDICA / NOTE (Opzionale) */}
            <div className="mobile-section-card">
              <span className="mobile-section-title">
                📝 {language === "it" ? "Dedica o Istruzioni (Opzionale)" : "Dedication or Notes"}
              </span>
              <input
                type="text"
                className="mobile-notes-input"
                placeholder={language === "it" ? "es. Dedica sul retro, centratura..." : "e.g. Dedication, layout..."}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>

            {/* Bottom spacing for fixed footer */}
            <div style={{ height: 85 }} />
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="mobile-customizer-sticky-footer">
            <div className="mob-footer-price-info">
              <span className="mob-footer-price-sub">
                {effectiveQuantity} {effectiveQuantity === 1 ? "foto/art." : "foto/stampe"} × €{unitPrice.toFixed(2)}
              </span>
              <strong className="mob-footer-price-total">€{currentPrice.toFixed(2)}</strong>
            </div>

            <button
              type="button"
              className="mob-footer-confirm-btn"
              onClick={() => {
                onConfirm({
                  format: selectedFormat,
                  finish: isPaperProduct ? selectedFinish : "",
                  notes: customText,
                  quantity: effectiveQuantity,
                  uploadedPhotos: photos
                });
              }}
            >
              <IconCheck style={{ width: 20, height: 20 }} />
              <span>
                {photos.length === 0
                  ? (language === "it" ? "Aggiungi al Carrello" : "Add to Cart")
                  : (language === "it" ? `Conferma (${effectiveQuantity})` : `Confirm (${effectiveQuantity})`)}
              </span>
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ==============================================================
  // DESKTOP MODAL (FOR PC & LAPTOPS > 768px)
  // ==============================================================
  return createPortal(
    <div className="customizer-modal-overlay" onClick={onClose}>
      <div className="customizer-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="customizer-header">
          <div>
            <span className="customizer-kicker">
              {language === "it" ? "CATEGORIA: " : "CATEGORY: "}
              {getCategoryLabel(product.category, language)}
            </span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="modal-close-icon" onClick={onClose} aria-label="Chiudi finestra">✕</button>
        </div>

        <div className="customizer-body-grid">
          {/* Left Column: Live Mockup / Photo Preview */}
          <div className="customizer-preview-col">
            <div className="mockup-stage-box">
              <MockupPreviewStage
                mockupType={product.mockupType}
                photoUrl={activePhoto}
                customText={customText}
              />
              {photos.length > 1 && (
                <div className="mockup-photo-indicator">
                  <span>Foto {safePhotoIndex + 1} di {photos.length}</span>
                </div>
              )}
            </div>

            {/* Photos Strip if multiple */}
            {photos.length > 0 && (
              <div className="uploaded-photos-strip">
                <div className="strip-header-row">
                  <span className="strip-label">
                    {language === "it" ? `Foto Caricate (${photos.length}):` : `Uploaded Photos (${photos.length}):`}
                  </span>
                  <button
                    type="button"
                    className="clear-all-photos-btn"
                    onClick={clearAllPhotos}
                    title="Rimuovi tutte le foto"
                  >
                    {language === "it" ? "✕ Rimuovi tutte" : "✕ Clear all"}
                  </button>
                </div>
                <div className="strip-thumbnails">
                  {photos.map((p, idx) => (
                    <div
                      key={idx}
                      className={`strip-thumb-item ${idx === safePhotoIndex ? "active" : ""}`}
                      onClick={() => setSelectedPhotoIndex(idx)}
                      title={`Clicca per visualizzare l'anteprima (${p.name || idx + 1})`}
                    >
                      <img src={p.dataUrl} alt={p.name} />
                      <span className="strip-thumb-badge">{idx + 1}</span>
                      <button
                        type="button"
                        className="thumb-delete-btn"
                        onClick={(e) => removePhoto(idx, e)}
                        title="Rimuovi singola foto"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Dropzone with Native File Input Overlay */}
            <div
              className={`photo-dropzone ${isDragging ? "dragging" : ""} ${photos.length > 0 ? "has-photo" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="mobile-upload-btn-wrapper">
                <div className="dropzone-text" style={{ pointerEvents: "none" }}>
                  <IconUpload className="dropzone-icon" />
                  <strong>
                    {photos.length > 0
                      ? (language === "it" ? "Aggiungi altre foto o trascinale qui" : "Add more photos or drag here")
                      : (language === "it" ? "Trascina qui la tua foto o clicca per caricarla" : "Drag and drop your photo or click to browse")}
                  </strong>
                  <span>
                    {language === "it"
                      ? "Formati supportati: JPG, PNG, WEBP, HEIC"
                      : "Supported formats: JPG, PNG, WEBP, HEIC"}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mobile-upload-real-input"
                  onChange={(e) => {
                    const sel = e.target.files ? Array.from(e.target.files) : [];
                    e.target.value = "";
                    if (sel.length > 0) handleFiles(sel);
                  }}
                />
              </div>

              {isProcessingPhotos && (
                <div className="customizer-processing-badge">
                  <span className="processing-spinner">⏳</span>
                  <span>
                    {language === "it"
                      ? `Caricamento di ${processingCount} foto in corso...`
                      : `Loading ${processingCount} photos...`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customization Controls */}
          <div className="customizer-controls-col">
            {/* Format selection */}
            {product.formats.length > 0 && (
              <div className="control-section">
                <div className="control-label-header-row">
                  <label className="control-label">
                    {language === "it" ? "Seleziona Formato:" : "Select Size:"}
                  </label>
                  {isCustomFormat && (
                    <span className="format-custom-tag">
                      {language === "it" ? "Personalizzato" : "Custom"}
                    </span>
                  )}
                </div>

                <div className="format-options-grid six-cols">
                  {product.formats.map((fmt, i) => {
                    const isSelected = !isCustomFormat && selectedFormat.name === fmt.name;
                    return (
                      <button
                        key={i}
                        type="button"
                        className={`format-option-card ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setIsCustomFormat(false);
                          setCustomFormatText("");
                          setSelectedFormat(fmt);
                        }}
                      >
                        <span className="fmt-name">{fmt.name}</span>
                        <span className="fmt-price">
                          {fmt.extra === 0 ? "Base" : `+€${fmt.extra.toFixed(2)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Format Textbox */}
                <div className={`custom-format-box ${isCustomFormat ? "active" : ""}`}>
                  <label className="custom-format-sublabel">
                    {language === "it" ? "Oppure specifica formato personalizzato:" : "Or enter custom format:"}
                  </label>
                  <div className="custom-format-input-wrapper">
                    <input
                      type="text"
                      className="custom-format-input"
                      placeholder={language === "it" ? "es. 40x50, 50x70, 20x50..." : "e.g. 40x50, 50x70..."}
                      value={customFormatText}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomFormatText(val);
                        if (val.trim()) {
                          setIsCustomFormat(true);
                          setSelectedFormat({ name: val.trim(), extra: 0, isCustom: true });
                        } else {
                          setIsCustomFormat(false);
                          setSelectedFormat(product.formats[0] || { name: "Standard", extra: 0 });
                        }
                      }}
                      onFocus={() => {
                        if (customFormatText.trim()) {
                          setIsCustomFormat(true);
                          setSelectedFormat({ name: customFormatText.trim(), extra: 0, isCustom: true });
                        }
                      }}
                    />
                    {customFormatText && (
                      <button
                        type="button"
                        className="clear-custom-fmt-btn"
                        onClick={() => {
                          setCustomFormatText("");
                          setIsCustomFormat(false);
                          setSelectedFormat(product.formats[0] || { name: "Standard", extra: 0 });
                        }}
                        title="Cancella"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Listino Prezzi Quantità a Scaglioni (da 1 a 10, da 11 a 30, da 31 in poi) */}
            {selectedFormat?.name?.includes("10x15") && (
              <div className="volume-pricing-card animate-fade-in">
                <div className="volume-pricing-badge">
                  <span>🏷️ Listino Prezzi Foto 10x15:</span>
                  <span className="current-tier-pill">Prezzo attuale applicato: <strong>€{unitPrice.toFixed(2)}</strong> / foto</span>
                </div>
                <div className="volume-pricing-tiers">
                  <div className={`vol-tier-item ${effectiveQuantity <= 10 ? "active" : ""}`}>
                    <span className="vol-tier-range">da 1 a 10 foto</span>
                    <strong className="vol-tier-price">0.50 €</strong>
                  </div>
                  <div className={`vol-tier-item ${effectiveQuantity >= 11 && effectiveQuantity <= 30 ? "active" : ""}`}>
                    <span className="vol-tier-range">da 11 a 30 foto</span>
                    <strong className="vol-tier-price">0.35 €</strong>
                  </div>
                  <div className={`vol-tier-item ${effectiveQuantity >= 31 ? "active" : ""}`}>
                    <span className="vol-tier-range">da 31 in poi</span>
                    <strong className="vol-tier-price">0.25 €</strong>
                  </div>
                </div>
              </div>
            )}

            {selectedFormat?.name?.includes("13x18") && (
              <div className="volume-pricing-card animate-fade-in">
                <div className="volume-pricing-badge">
                  <span>🏷️ Listino Prezzi Foto 13x18:</span>
                  <span className="current-tier-pill">Prezzo attuale applicato: <strong>€{unitPrice.toFixed(2)}</strong> / foto</span>
                </div>
                <div className="volume-pricing-tiers">
                  <div className={`vol-tier-item ${effectiveQuantity <= 10 ? "active" : ""}`}>
                    <span className="vol-tier-range">da 1 a 10 foto</span>
                    <strong className="vol-tier-price">0.80 €</strong>
                  </div>
                  <div className={`vol-tier-item ${effectiveQuantity >= 11 && effectiveQuantity <= 30 ? "active" : ""}`}>
                    <span className="vol-tier-range">da 11 a 30 foto</span>
                    <strong className="vol-tier-price">0.50 €</strong>
                  </div>
                  <div className={`vol-tier-item ${effectiveQuantity >= 31 ? "active" : ""}`}>
                    <span className="vol-tier-range">da 31 in poi</span>
                    <strong className="vol-tier-price">0.35 €</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Tipo di Carta - Solo su stampe e fotolibri */}
            {isPaperProduct && (
              <div className="control-section">
                <label className="control-label">
                  {language === "it" ? "Tipo di Carta:" : "Paper Type:"}
                </label>
                <div className="finish-pills-row">
                  {["Lucida", "Satinata"].map((fn, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`finish-pill ${selectedFinish === fn ? "selected" : ""}`}
                      onClick={() => setSelectedFinish(fn)}
                    >
                      {fn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Dedication / Notes */}
            <div className="control-section">
              <label className="control-label">
                {language === "it" ? "Dedica, Nome o Istruzioni Particolari:" : "Dedication, Text or Special Instructions:"}
              </label>
              <textarea
                className="custom-text-input"
                rows={2}
                placeholder={
                  language === "it"
                    ? "es. Scritta sul retro: 'A mamma con affetto - 2024' oppure centrare la foto..."
                    : "e.g. Text to engrave or layout notes..."
                }
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>

            {/* Quantity Selector */}
            <div className="control-section qty-section">
              <div className="qty-control-header">
                <label className="control-label">
                  {language === "it" ? "Quantità Stampe:" : "Prints Quantity:"}
                </label>
                {photos.length > 0 && (
                  <span className="qty-auto-badge">
                    {language === "it"
                      ? `Basata su ${photos.length} foto ${photos.length === 1 ? "caricata" : "caricate"}`
                      : `Based on ${photos.length} uploaded ${photos.length === 1 ? "photo" : "photos"}`}
                  </span>
                )}
              </div>

              {photos.length > 0 ? (
                <div className="qty-control-box-large">
                  <button
                    type="button"
                    className="qty-btn-lg"
                    onClick={() => setCopiesPerPhoto((c) => Math.max(1, c - 1))}
                    disabled={copiesPerPhoto <= 1}
                    title={language === "it" ? "Riduci copie per ciascuna foto" : "Decrease copies per photo"}
                  >
                    -
                  </button>
                  <div className="qty-val-stacked">
                    <span className="qty-val-lg">{photos.length * copiesPerPhoto}</span>
                    <span className="qty-subtext">
                      {copiesPerPhoto === 1
                        ? (language === "it" ? `(1 copia per foto)` : `(1 copy each)`)
                        : (language === "it"
                            ? `(${copiesPerPhoto} copie x ${photos.length} foto)`
                            : `(${copiesPerPhoto} copies x ${photos.length} photos)`)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="qty-btn-lg"
                    onClick={() => setCopiesPerPhoto((c) => c + 1)}
                    title={language === "it" ? "Aumenta copie per ciascuna foto" : "Add copy for each photo"}
                  >
                    +
                  </button>
                </div>
              ) : (
                <div className="qty-control-box-large">
                  <button
                    type="button"
                    className="qty-btn-lg"
                    onClick={() => setManualQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span className="qty-val-lg">{manualQuantity}</span>
                  <button
                    type="button"
                    className="qty-btn-lg"
                    onClick={() => setManualQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Total and Add to Cart Button */}
            <div className="customizer-footer-action">
              <div className="customizer-price-display">
                <span className="price-tag-sub">
                  {effectiveQuantity > 1 ? `${effectiveQuantity} foto × €${unitPrice.toFixed(2)}` : (language === "it" ? "Totale Articolo" : "Item Total")}
                </span>
                <span className="price-tag-val">€{currentPrice.toFixed(2)}</span>
              </div>

              <button
                type="button"
                className="btn-confirm-add"
                onClick={() => {
                  onConfirm({
                    format: selectedFormat,
                    finish: isPaperProduct ? selectedFinish : "",
                    notes: customText,
                    quantity: effectiveQuantity,
                    uploadedPhotos: photos
                  });
                }}
              >
                <IconCheck />
                <span>
                  {photos.length === 0
                    ? (language === "it" ? "Aggiungi al Carrello" : "Add to Cart")
                    : (language === "it" ? "Conferma & Aggiungi al Carrello" : "Confirm & Add to Cart")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// -------------------------------------------------------------
// LIVE MOCKUP PREVIEW STAGE
// -------------------------------------------------------------
function MockupPreviewStage({ mockupType, photoUrl, customText }) {
  if (mockupType === "mug") {
    return (
      <div className="mockup-mug-container">
        <div className="mug-body">
          <div className="mug-handle"></div>
          <div className="mug-surface">
            {photoUrl ? (
              <div className="mug-photo-wrap" style={{ backgroundImage: `url(${photoUrl})` }}>
                {customText && <div className="mug-custom-text">{customText}</div>}
              </div>
            ) : (
              <div className="mug-photo-placeholder">
                <IconUpload />
                <span>La tua foto qui</span>
              </div>
            )}
            <div className="mug-glare"></div>
          </div>
        </div>
      </div>
    );
  }

  if (mockupType === "cushion") {
    return (
      <div className="mockup-cushion-container">
        <div className="cushion-pillow">
          {photoUrl ? (
            <div className="cushion-photo-wrap" style={{ backgroundImage: `url(${photoUrl})` }}>
              {customText && <div className="cushion-custom-text">{customText}</div>}
            </div>
          ) : (
            <div className="cushion-photo-placeholder">
              <IconUpload />
              <span>La tua foto sul cuscino</span>
            </div>
          )}
          <div className="cushion-shadow-effect"></div>
        </div>
      </div>
    );
  }

  if (mockupType === "canvas") {
    return (
      <div className="mockup-canvas-container">
        <div className="canvas-frame-3d">
          {photoUrl ? (
            <div className="canvas-photo-wrap" style={{ backgroundImage: `url(${photoUrl})` }}>
              {customText && <div className="canvas-custom-text">{customText}</div>}
            </div>
          ) : (
            <div className="canvas-photo-placeholder">
              <IconUpload />
              <span>La tua foto su tela d'autore</span>
            </div>
          )}
          <div className="canvas-depth-edge"></div>
        </div>
      </div>
    );
  }

  if (mockupType === "puzzle") {
    return (
      <div className="mockup-puzzle-container">
        <div className="puzzle-board">
          {photoUrl ? (
            <div className="puzzle-photo-wrap" style={{ backgroundImage: `url(${photoUrl})` }}>
              <div className="puzzle-overlay-grid"></div>
              {customText && <div className="puzzle-custom-text">{customText}</div>}
            </div>
          ) : (
            <div className="puzzle-photo-placeholder">
              <IconUpload />
              <span>La tua foto in tessere puzzle</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mockupType === "tshirt") {
    return (
      <div className="mockup-tshirt-container">
        <div className="tshirt-silhouette">
          <div className="tshirt-print-zone">
            {photoUrl ? (
              <div className="tshirt-photo-wrap" style={{ backgroundImage: `url(${photoUrl})` }}>
                {customText && <div className="tshirt-custom-text">{customText}</div>}
              </div>
            ) : (
              <div className="tshirt-photo-placeholder">
                <IconUpload />
                <span>La tua stampa</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mockupType === "keychain") {
    return (
      <div className="mockup-keychain-container">
        <div className="keychain-ring"></div>
        <div className="keychain-body">
          {photoUrl ? (
            <div className="keychain-photo-wrap" style={{ backgroundImage: `url(${photoUrl})` }}>
              {customText && <div className="keychain-custom-text">{customText}</div>}
            </div>
          ) : (
            <div className="keychain-photo-placeholder">
              <IconUpload />
              <span>Foto</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default: Photo Print Frame
  return (
    <div className="mockup-print-container">
      <div className="print-passepartout">
        {photoUrl ? (
          <div className="print-photo-wrap" style={{ backgroundImage: `url(${photoUrl})` }}>
            {customText && <div className="print-custom-text">{customText}</div>}
          </div>
        ) : (
          <div className="print-photo-placeholder">
            <IconUpload />
            <span>Anteprima Stampa Fotografica</span>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// PRODUCT CARD VISUAL DISPLAY - ARTISANAL REALISTIC MOCKUPS
// -------------------------------------------------------------
function ProductVisualMockup({ type, category, productId, product }) {
  // If product has a custom photo uploaded or URL:
  if (product?.imageUrl || product?.image) {
    return (
      <div className="studio-visual studio-visual-custom-photo">
        <img
          src={product.imageUrl || product.image}
          alt={product?.titleIt || "Articolo"}
          className="sv-custom-uploaded-img"
        />
      </div>
    );
  }

  if (productId === "prints-pack") {
    return (
      <div className="studio-visual studio-visual-print">
        <div className="sv-print-stack">
          <div className="sv-print-underlay"></div>
          <div className="sv-print-main">
            <div className="sv-photo-corners">
              <span className="sv-corner tl"></span>
              <span className="sv-corner tr"></span>
              <span className="sv-corner bl"></span>
              <span className="sv-corner br"></span>
            </div>
            <div className="sv-print-photo photo-salerno-print">
              <div className="sv-photo-glare"></div>
            </div>
            <div className="sv-print-caption">
              <span className="sv-stamp-text">FUJICOLOR CRYSTAL ARCHIVE</span>
              <span className="sv-stamp-lab">LABORATORIO SALERNO</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productId === "poster-hd") {
    return (
      <div className="studio-visual studio-visual-poster">
        <div className="sv-poster-frame">
          <div className="sv-wood-rail top">
            <div className="sv-hanger-cord"></div>
          </div>
          <div className="sv-poster-sheet">
            <div className="sv-poster-image">
              <div className="sv-fineart-badge">FINE ART 12-COLOR</div>
            </div>
          </div>
          <div className="sv-wood-rail bottom"></div>
        </div>
      </div>
    );
  }

  if (productId === "canvas-custom") {
    return (
      <div className="studio-visual studio-visual-canvas">
        <div className="sv-canvas-3d-wrap">
          <div className="sv-canvas-front">
            <div className="sv-canvas-texture-overlay"></div>
            <div className="sv-canvas-spotlight"></div>
            <span className="sv-canvas-pill">TELA 4CM GALLERIA</span>
          </div>
          <div className="sv-canvas-depth-side"></div>
          <div className="sv-canvas-depth-bottom"></div>
        </div>
      </div>
    );
  }

  if (productId === "frame-custom") {
    return (
      <div className="studio-visual studio-visual-frame">
        <div className="sv-wood-frame-moulding">
          <div className="sv-frame-passepartout">
            <div className="sv-frame-artwork">
              <div className="sv-glass-reflection"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productId === "photobook-luxury" || category === "photobooks") {
    return (
      <div className="studio-visual studio-visual-book">
        <div className="sv-book-open">
          <div className="sv-book-cover-depth"></div>
          <div className="sv-book-page left">
            <div className="sv-book-page-photo left-photo"></div>
          </div>
          <div className="sv-book-spine-crease"></div>
          <div className="sv-book-page right">
            <div className="sv-book-page-photo right-photo"></div>
            <div className="sv-gold-ribbon"></div>
          </div>
        </div>
      </div>
    );
  }

  if (productId === "mug-custom" || type === "mug") {
    return (
      <div className="studio-visual studio-visual-mug">
        <div className="sv-ceramic-mug">
          <div className="sv-mug-handle"></div>
          <div className="sv-mug-body">
            <div className="sv-mug-rim"></div>
            <div className="sv-mug-print-area">
              <div className="sv-mug-artwork"></div>
            </div>
            <div className="sv-mug-glaze-shine"></div>
            <div className="sv-mug-base-shadow"></div>
          </div>
        </div>
      </div>
    );
  }

  if (productId === "pillow-custom" || type === "cushion") {
    return (
      <div className="studio-visual studio-visual-cushion">
        <div className="sv-pillow-cushion">
          <div className="sv-pillow-piping"></div>
          <div className="sv-pillow-inner">
            <div className="sv-pillow-artwork"></div>
            <div className="sv-pillow-crease"></div>
          </div>
        </div>
      </div>
    );
  }

  if (productId === "puzzle-custom" || type === "puzzle") {
    return (
      <div className="studio-visual studio-visual-puzzle">
        <div className="sv-puzzle-container">
          <div className="sv-puzzle-box-backdrop">
            <span>GIFT BOX</span>
          </div>
          <div className="sv-puzzle-board">
            <div className="sv-puzzle-grid-overlay"></div>
            <div className="sv-puzzle-artwork"></div>
            <div className="sv-puzzle-loose-piece"></div>
          </div>
        </div>
      </div>
    );
  }

  if (productId === "tshirt-custom" || type === "tshirt") {
    return (
      <div className="studio-visual studio-visual-tshirt">
        <div className="sv-tshirt-fold">
          <div className="sv-tshirt-collar"></div>
          <div className="sv-tshirt-print-stage">
            <div className="sv-tshirt-artwork"></div>
          </div>
          <div className="sv-cotton-label">100% COTONE</div>
        </div>
      </div>
    );
  }

  if (productId === "keychain-custom" || type === "keychain") {
    return (
      <div className="studio-visual studio-visual-keychain">
        <div className="sv-keychain-ring">
          <div className="sv-ring-circle"></div>
          <div className="sv-ring-chain"></div>
        </div>
        <div className="sv-keychain-fob">
          <div className="sv-fob-acrylic">
            <div className="sv-fob-photo"></div>
            <div className="sv-fob-refraction"></div>
          </div>
        </div>
      </div>
    );
  }

  if (productId === "magnet-custom") {
    return (
      <div className="studio-visual studio-visual-magnet">
        <div className="sv-polaroid-magnet">
          <div className="sv-polaroid-photo"></div>
          <div className="sv-polaroid-caption">Ricordi Speciali ♡</div>
        </div>
      </div>
    );
  }

  if (productId === "film-roll-35mm") {
    return (
      <div className="studio-visual studio-visual-film">
        <div className="sv-film-canister">
          <div className="sv-film-spool-top"></div>
          <div className="sv-film-metal-body">
            <div className="sv-film-brand-label">
              <span className="sv-brand-gold">35mm</span>
              <span className="sv-brand-iso">ISO 400</span>
            </div>
            <div className="sv-film-metallic-shine"></div>
          </div>
          <div className="sv-film-leader-strip">
            <div className="sv-sprocket-holes"></div>
          </div>
        </div>
      </div>
    );
  }

  if (productId === "film-dev-scan") {
    return (
      <div className="studio-visual studio-visual-filmdev">
        <div className="sv-lightbox-strip">
          <div className="sv-film-lab-clip"></div>
          <div className="sv-negative-strip">
            <div className="sv-neg-frame"><span>01</span></div>
            <div className="sv-neg-frame"><span>02</span></div>
            <div className="sv-neg-frame"><span>03</span></div>
          </div>
          <span className="sv-lightbox-tag">C-41 LAB SCAN</span>
        </div>
      </div>
    );
  }

  if (productId === "vhs-digitization") {
    return (
      <div className="studio-visual studio-visual-vhs">
        <div className="sv-vhs-tape">
          <div className="sv-vhs-reels">
            <div className="sv-vhs-spool-left"></div>
            <div className="sv-vhs-window"></div>
            <div className="sv-vhs-spool-right"></div>
          </div>
          <div className="sv-vhs-label">
            <span>MEMORIE DI FAMIGLIA</span>
          </div>
          <div className="sv-vhs-digital-badge">
            <span>➜ MP4 FULL HD</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="studio-visual studio-visual-fallback-svg">
      <div className="sv-svg-center-card">
        <ArticleMockupIcon
          product={product}
          mockupType={type}
          category={category}
          size={56}
          className="sv-svg-community-icon"
        />
        <span className="sv-svg-fallback-badge">FOTO EXTRACOLOR</span>
      </div>
    </div>
  );
}
