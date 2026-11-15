import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import './AdminPage.css';
import {
  DEFAULT_PRODUCTS,
  getCategoryLabel,
  getInitialProducts,
  persistShopProducts
} from '../data/shopProducts';
import {
  getShopOrders,
  updateOrderStatus,
  deleteShopOrder,
  ORDER_STATUS_MAP,
  getOrderAllPhotos
} from '../data/shopOrders';
import ProductEditorModal from './ProductEditorModal';
import {
  ArticleMockupIcon,
  SvgStar,
  SvgCamera,
  SvgBox,
  SvgGallery,
  SvgEdit,
  SvgTrash,
  SvgCopy,
  SvgPlus,
  SvgPhone,
  SvgMessageCircle
} from './ProductIcons';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('fotoextracolor_admin_active_tab') || 'ecommerce';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pageMode, setPageMode] = useState(() => {
    return localStorage.getItem('fotoextracolor_page_mode') || 'chisiamo';
  });
  const [ecommerceEnabled, setEcommerceEnabled] = useState(() => {
    const saved = localStorage.getItem('fotoextracolor_ecommerce_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [modeFeedback, setModeFeedback] = useState('');
  const [categories, setCategories] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const [servicesData, setServicesData] = useState({it: [], en: []});
  const [editingLang, setEditingLang] = useState('it');
  
  // E-Commerce WooCommerce-Style Management State
  const [shopProducts, setShopProducts] = useState(getInitialProducts);
  const [productViewMode, setProductViewMode] = useState('carousel'); // Default to visual carousel sequence for maximum speed
  const [draggedProductIndex, setDraggedProductIndex] = useState(null);
  const [dragOverProductIndex, setDragOverProductIndex] = useState(null);
  const [isSavingProducts, setIsSavingProducts] = useState(false);
  const [productFeedback, setProductFeedback] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('all');
  const [productTypeFilter, setProductTypeFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Backoffice Orders Management State
  const [ordersList, setOrdersList] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);
  const [savingNoteOrderId, setSavingNoteOrderId] = useState(null);
  const [downloadingZipOrderId, setDownloadingZipOrderId] = useState(null);
  const [orderFeedback, setOrderFeedback] = useState('');
  
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  // Analytics & Visitor Monitoring State
  const [analyticsSubTab, setAnalyticsSubTab] = useState('live'); // 'live' | 'history'
  const [analyticsData, setAnalyticsData] = useState({
    activeVisitors: [],
    history: [],
    stats: {
      activeCount: 0,
      totalVisits: 0,
      todayVisits: 0,
      avgDurationSeconds: 0,
      deviceBreakdown: { Desktop: 0, Mobile: 0, Tablet: 0 },
      topPages: {}
    }
  });
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsAutoRefresh, setAnalyticsAutoRefresh] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(5); // in seconds
  const [lastAnalyticsUpdate, setLastAnalyticsUpdate] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState('all'); // 'all' | 'today' | '7days' | '30days'
  const [historyDeviceFilter, setHistoryDeviceFilter] = useState('all'); // 'all' | 'Desktop' | 'Mobile' | 'Tablet'
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Chat State
  const [chatsData, setChatsData] = useState([]);
  const [isChatsLoading, setIsChatsLoading] = useState(false);

  // Groq AI Config State
  const [groqApiKey, setGroqApiKey] = useState('');
  const [apiKeyFeedback, setApiKeyFeedback] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  // Lock body scroll and listen for Escape key when session detail modal is open
  useEffect(() => {
    if (!selectedSessionDetail) return;
    
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedSessionDetail(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedSessionDetail]);

  // Fetch Config, Portfolio, and Services
  useEffect(() => {
    fetch('/api.php?action=getConfig')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.pageMode) {
            setPageMode(data.pageMode);
            localStorage.setItem('fotoextracolor_page_mode', data.pageMode);
          }
          if (typeof data.ecommerceEnabled !== 'undefined') {
            setEcommerceEnabled(Boolean(data.ecommerceEnabled));
            localStorage.setItem('fotoextracolor_ecommerce_enabled', String(data.ecommerceEnabled));
          }
          if (data.groqApiKey) {
            setGroqApiKey(data.groqApiKey);
          }
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('fotoextracolor_page_mode');
        if (saved) setPageMode(saved);
        const savedEcomm = localStorage.getItem('fotoextracolor_ecommerce_enabled');
        if (savedEcomm !== null) setEcommerceEnabled(savedEcomm === 'true');
      });

    fetch('/api.php?action=getPortfolio')
      .then(res => res.json())
      .then(data => {
        if (data && data.categories) {
          setCategories(data.categories);
          setImagesByCategory(data.imagesByCategory || {});
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Errore fetch admin:", err);
        const saved = localStorage.getItem('portfolio_categories');
        if (saved) setCategories(JSON.parse(saved));
        setIsLoading(false);
      });

    fetch('/api.php?action=getServices')
      .then(res => res.json())
      .then(data => {
        if (data && data.it && data.en) {
          setServicesData(data);
        }
      })
      .catch(err => {
        console.error("Errore fetch servizi:", err);
        const localS = localStorage.getItem('custom_services');
        if (localS) setServicesData(JSON.parse(localS));
      });

    // Fetch E-Commerce Products
    fetch('/api.php?action=getProducts')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.products) && data.products.length > 0) {
          setShopProducts(data.products);
          localStorage.setItem('fotoextracolor_shop_products', JSON.stringify(data.products));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Analytics Function with fallback
  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsAnalyticsLoading(true);
    try {
      const res = await fetch('/api.php?action=getAnalytics');
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      if (data && data.stats) {
        setAnalyticsData(data);
        setLastAnalyticsUpdate(new Date());
      }
    } catch (err) {
      // Local fallback for offline/preview mode
      try {
        const localActiveRaw = localStorage.getItem('local_analytics_active');
        const localActive = localActiveRaw ? JSON.parse(localActiveRaw) : {};
        const localHistRaw = localStorage.getItem('local_analytics_history');
        const localHist = localHistRaw ? JSON.parse(localHistRaw) : [];
        
        const now = Math.floor(Date.now() / 1000);
        const cleanActive = {};
        for (const [sid, sess] of Object.entries(localActive)) {
          if (now - (sess.lastPing || 0) <= 45) {
            cleanActive[sid] = sess;
          }
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayTs = Math.floor(todayStart.getTime() / 1000);

        let todayVisits = 0;
        let totalDuration = 0;
        const deviceBreakdown = { Desktop: 0, Mobile: 0, Tablet: 0 };
        const pageCounts = {};

        localHist.forEach(h => {
          if ((h.startTime || 0) >= todayTs) todayVisits++;
          totalDuration += (h.durationSeconds || 0);
          const dev = h.deviceType || 'Desktop';
          deviceBreakdown[dev] = (deviceBreakdown[dev] || 0) + 1;
          const landing = h.landingPage || '/';
          pageCounts[landing] = (pageCounts[landing] || 0) + 1;
        });

        const avgDuration = localHist.length > 0 ? Math.round(totalDuration / localHist.length) : 0;

        setAnalyticsData({
          activeVisitors: Object.values(cleanActive),
          history: localHist,
          stats: {
            activeCount: Object.keys(cleanActive).length,
            totalVisits: localHist.length,
            todayVisits,
            avgDurationSeconds: avgDuration,
            deviceBreakdown,
            topPages: pageCounts
          }
        });
        setLastAnalyticsUpdate(new Date());
      } catch (e) {
        console.warn("Analytics fallback error:", e);
      }
    } finally {
      if (!isSilent) setIsAnalyticsLoading(false);
    }
  }, []);

  // Polling for analytics when activeTab is 'analytics' or background heartbeat
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchAnalytics(false);

    if (activeTab === 'analytics' && analyticsAutoRefresh) {
      const intervalMs = autoRefreshInterval * 1000;
      const interval = setInterval(() => {
        fetchAnalytics(true);
      }, intervalMs);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab, analyticsAutoRefresh, autoRefreshInterval, fetchAnalytics]);

  // Handle Clearing Analytics History
  const handleClearHistory = async () => {
    if (!window.confirm("Sei sicuro di voler cancellare TUTTA la cronologia degli accessi? Questa operazione è irreversibile.")) {
      return;
    }
    setClearingHistory(true);
    try {
      await fetch('/api.php?action=clearAnalyticsHistory', { method: 'POST' });
    } catch(e) {
      console.warn("Errore reset server, resetto locale:", e);
    }
    try {
      localStorage.setItem('local_analytics_history', JSON.stringify([]));
    } catch(e) {}
    
    await fetchAnalytics(false);
    setClearingHistory(false);
    alert("Cronologia accessi azzerata con successo.");
  };

  // Export History to CSV
  const handleExportCSV = () => {
    const list = filteredHistory;
    if (list.length === 0) {
      alert("Nessun dato da esportare con i filtri attuali.");
      return;
    }

    const headers = [
      "ID Sessione",
      "Data e Ora Ingresso",
      "Indirizzo IP",
      "Dispositivo",
      "Sistema Operativo",
      "Browser",
      "Risoluzione",
      "Pagina Iniziale",
      "Ultima Pagina",
      "Pagine Totali",
      "Percorso Pagine",
      "Durata (Secondi)",
      "Durata Formattata",
      "Sorgente (Referrer)",
      "Lingua",
      "Tema",
      "Stato"
    ];

    const rows = list.map(item => {
      const dateStr = item.startTime ? new Date(item.startTime * 1000).toLocaleString('it-IT') : 'N/D';
      const durationFormatted = formatDuration(item.durationSeconds || 0);
      const pagesPath = (item.pages || [item.landingPage || '/']).join(' -> ');
      return [
        `"${item.sessionId || ''}"`,
        `"${dateStr}"`,
        `"${item.ip || '127.0.0.1'}"`,
        `"${item.deviceType || 'Desktop'}"`,
        `"${item.os || 'N/D'}"`,
        `"${item.browser || 'N/D'}"`,
        `"${item.screen || 'N/D'}"`,
        `"${item.landingPage || '/'}"`,
        `"${item.lastPage || item.landingPage || '/'}"`,
        item.pageViews || 1,
        `"${pagesPath}"`,
        item.durationSeconds || 0,
        `"${durationFormatted}"`,
        `"${item.referrer || 'Diretto'}"`,
        `"${(item.language || 'it').toUpperCase()}"`,
        `"${item.theme || 'dark'}"`,
        `"${item.status === 'online' ? 'Online' : 'Concluso'}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `FotoExtracolor_Visite_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageModeChange = async (newMode) => {
    setPageMode(newMode);
    localStorage.setItem('fotoextracolor_page_mode', newMode);
    window.dispatchEvent(new Event('storage'));
    setModeFeedback(
      newMode === 'chisiamo'
        ? '✓ Pagina "Chi Siamo" impostata come attiva sul sito!'
        : '✓ Pagina "Portfolio" impostata come attiva sul sito!'
    );
    setTimeout(() => setModeFeedback(''), 4500);

    try {
      await fetch('/api.php?action=saveConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { pageMode: newMode } })
      });
    } catch (err) {
      console.warn("Salvato in locale:", err);
    }
  };

  const handleEcommerceToggle = async (nextState) => {
    const isNowEnabled = typeof nextState === 'boolean' ? nextState : !ecommerceEnabled;
    setEcommerceEnabled(isNowEnabled);
    localStorage.setItem('fotoextracolor_ecommerce_enabled', String(isNowEnabled));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('fotoextracolor_ecommerce_toggle', { detail: { enabled: isNowEnabled } }));
    setModeFeedback(
      isNowEnabled
        ? '✓ Negozio E-Commerce ATTIVATO: visibile sul sito pubblico (voce Shop e Carrello attivi)!'
        : '⚠️ Negozio E-Commerce NASCOSTO: rimosso dal menu e dalla navigazione pubblica.'
    );
    setTimeout(() => setModeFeedback(''), 5500);

    try {
      await fetch('/api.php?action=saveConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { ecommerceEnabled: isNowEnabled } })
      });
    } catch (err) {
      console.warn("Stato e-commerce salvato in locale:", err);
    }
  };

  const fetchChats = useCallback(async () => {
    setIsChatsLoading(true);
    try {
      const res = await fetch('/api.php?action=getChats');
      const data = await res.json();
      if (data && data.success) {
        setChatsData(data.chats || []);
      }
    } catch (err) {
      console.error("Errore fetch chat", err);
    }
    setIsChatsLoading(false);
  }, []);

  const handleSaveApiKey = async (e) => {
    e.preventDefault();
    setIsSavingApiKey(true);
    try {
      const res = await fetch('/api.php?action=saveConfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { groqApiKey: groqApiKey.trim() } })
      });
      const data = await res.json();
      if (data && data.success) {
        setApiKeyFeedback('✓ Chiave Groq API salvata con successo!');
      } else {
        setApiKeyFeedback('Errore durante il salvataggio della chiave.');
      }
    } catch (err) {
      setApiKeyFeedback('Errore di connessione al server.');
    } finally {
      setIsSavingApiKey(false);
      setTimeout(() => setApiKeyFeedback(''), 4500);
    }
  };

  useEffect(() => {
    if (activeTab === 'chats') {
      fetchChats();
    }
  }, [activeTab, fetchChats]);

  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const catName = newCategory.trim();
      
      try {
        const res = await fetch('/api.php?action=createCategory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName })
        });
        const data = await res.json();
        
        if (data.success) {
          const updatedCategories = [...categories, catName];
          setCategories(updatedCategories);
          localStorage.setItem('portfolio_categories', JSON.stringify(updatedCategories));
          setNewCategory('');
        } else {
          alert("Errore dal server: " + data.error);
        }
      } catch (err) {
        alert("Errore di connessione al server PHP.");
      }
    }
  };

  const handleDeleteCategory = async (category) => {
    if (window.confirm(`Sei sicuro di voler eliminare la scheda "${category}" e TUTTE le sue foto?`)) {
      try {
        const res = await fetch(`/api.php?action=deleteCategory&name=${encodeURIComponent(category)}`);
        const data = await res.json();
        
        if (data.success) {
          const updatedCategories = categories.filter((c) => c !== category);
          setCategories(updatedCategories);
          localStorage.setItem('portfolio_categories', JSON.stringify(updatedCategories));
        } else {
          alert("Errore dal server: " + data.error);
        }
      } catch (err) {
        alert("Errore di connessione al server PHP.");
      }
    }
  };

  const handleUploadPhoto = async (e, cat) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('category', cat);

    try {
      const res = await fetch('/api.php?action=uploadImage', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        const catId = cat.toLowerCase().replace(/\s+/g, '');
        const currentImages = imagesByCategory[catId] || [];
        setImagesByCategory({
          ...imagesByCategory,
          [catId]: [...currentImages, data.url]
        });
      } else {
        alert("Errore upload: " + data.error);
      }
    } catch (err) {
      alert("Sei in locale: impossibile salvare sul server. L'upload funzionerà appena carichi su Register.it!");
    }
  };

  const handleDeletePhoto = async (url, cat) => {
    if (!window.confirm("Sicuro di voler eliminare questa foto definitivamente?")) return;
    
    try {
      const res = await fetch('/api.php?action=deleteImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success) {
        const catId = cat.toLowerCase().replace(/\s+/g, '');
        const currentImages = imagesByCategory[catId] || [];
        setImagesByCategory({
          ...imagesByCategory,
          [catId]: currentImages.filter(img => img !== url)
        });
      } else {
        alert("Errore eliminazione: " + data.error);
      }
    } catch (err) {
      alert("Sei in locale senza PHP. Simulo l'eliminazione visiva.");
      const catId = cat.toLowerCase().replace(/\s+/g, '');
      const currentImages = imagesByCategory[catId] || [];
      setImagesByCategory({
        ...imagesByCategory,
        [catId]: currentImages.filter(img => img !== url)
      });
    }
  };

  const handleServiceChange = (index, field, value) => {
    const updatedLangArray = [...servicesData[editingLang]];
    updatedLangArray[index] = { ...updatedLangArray[index], [field]: value };
    setServicesData({
      ...servicesData,
      [editingLang]: updatedLangArray
    });
  };

  const handleAddService = () => {
    const newId = Date.now().toString();
    const newServiceIt = {
      id: newId,
      title: "Nuovo Servizio",
      description: "Descrizione del servizio",
      subtitle: "",
      iconName: "IconCamera",
      featured: false
    };
    const newServiceEn = {
      id: newId,
      title: "New Service",
      description: "Service description",
      subtitle: "",
      iconName: "IconCamera",
      featured: false
    };

    setServicesData({
      ...servicesData,
      it: [...(servicesData.it || []), newServiceIt],
      en: [...(servicesData.en || []), newServiceEn]
    });
  };

  const handleRemoveService = (index) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo servizio?")) return;
    const itServices = [...servicesData.it];
    const enServices = [...servicesData.en];
    itServices.splice(index, 1);
    enServices.splice(index, 1);
    setServicesData({
      ...servicesData,
      it: itServices,
      en: enServices
    });
  };

  const moveService = (index, direction) => {
    const itServices = [...servicesData.it];
    const enServices = [...servicesData.en];
    
    if (direction === 'up' && index > 0) {
      [itServices[index - 1], itServices[index]] = [itServices[index], itServices[index - 1]];
      [enServices[index - 1], enServices[index]] = [enServices[index], enServices[index - 1]];
    } else if (direction === 'down' && index < itServices.length - 1) {
      [itServices[index + 1], itServices[index]] = [itServices[index], itServices[index + 1]];
      [enServices[index + 1], enServices[index]] = [enServices[index], enServices[index + 1]];
    } else {
      return;
    }
    
    setServicesData({
      ...servicesData,
      it: itServices,
      en: enServices
    });
  };

  const saveServices = async () => {
    try {
      const res = await fetch('/api.php?action=saveServices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ services: servicesData })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('custom_services', JSON.stringify(servicesData));
        alert("Servizi salvati con successo!");
      } else {
        alert("Errore salvataggio: " + data.error);
      }
    } catch (err) {
      alert("Salvato in locale (Modalità offline senza PHP)");
      localStorage.setItem('custom_services', JSON.stringify(servicesData));
    }
  };

  // -------------------------------------------------------------
  // E-COMMERCE / WOOCOMMERCE-STYLE MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleSaveAllProducts = async (productsToSave = shopProducts) => {
    setIsSavingProducts(true);
    setProductFeedback('Salvataggio catalogo in corso...');
    try {
      await persistShopProducts(productsToSave);
      setShopProducts(productsToSave);
      setProductFeedback('✅ Catalogo E-Commerce salvato con successo!');
      setTimeout(() => setProductFeedback(''), 4000);
    } catch {
      setProductFeedback('⚠️ Catalogo salvato in locale (Modalità offline/anteprima)');
      setTimeout(() => setProductFeedback(''), 4000);
    } finally {
      setIsSavingProducts(false);
    }
  };

  const handleToggleProductActive = (productId) => {
    const updated = shopProducts.map((p) => {
      if (p.id === productId) {
        return { ...p, active: p.active === false ? true : false };
      }
      return p;
    });
    setShopProducts(updated);
    handleSaveAllProducts(updated);
  };

  const handleDeleteProduct = (productId) => {
    const prod = shopProducts.find((p) => p.id === productId);
    if (!window.confirm(`Sei sicuro di voler eliminare il prodotto "${prod?.titleIt || productId}"?`)) return;
    const updated = shopProducts.filter((p) => p.id !== productId);
    setShopProducts(updated);
    handleSaveAllProducts(updated);
  };

  const handleDuplicateProduct = (product) => {
    const newId = `${product.id}-copy-${Date.now().toString(36).substring(2, 6)}`;
    const copy = {
      ...product,
      id: newId,
      titleIt: `${product.titleIt} (Copia)`,
      titleEn: `${product.titleEn} (Copy)`,
      active: true
    };
    const updated = [copy, ...shopProducts];
    setShopProducts(updated);
    handleSaveAllProducts(updated);
  };

  const handleRestoreDefaultProducts = () => {
    if (!window.confirm("Attenzione: Vuoi ripristinare il catalogo originale con tutti i 14 prodotti predefiniti di Foto Extracolor? Eventuali prodotti personalizzati verranno sovrascritti.")) return;
    setShopProducts(DEFAULT_PRODUCTS);
    handleSaveAllProducts(DEFAULT_PRODUCTS);
  };

  const handleOpenEditProduct = (product) => {
    setIsNewProduct(false);
    setEditingProduct(JSON.parse(JSON.stringify(product)));
  };

  const handleOpenNewProduct = () => {
    setIsNewProduct(true);
    const newId = `prod-${Date.now().toString(36)}`;
    setEditingProduct({
      id: newId,
      category: "gadget",
      titleIt: "Nuovo Articolo Personalizzato",
      titleEn: "New Custom Item",
      descIt: "Descrizione dettagliata dell'articolo personalizzato di alta qualità realizzato nel laboratorio interno.",
      descEn: "Detailed description of artisanal high-quality custom photo product.",
      basePrice: 10.00,
      badge: "Novità",
      mockupType: "mug",
      requiresPhoto: true,
      active: true,
      formats: [
        { name: "Standard", extra: 0 }
      ],
      finishes: []
    });
  };

  const handleSaveModalProduct = (savedProduct) => {
    if (!savedProduct) return;
    let updated;
    if (isNewProduct) {
      updated = [savedProduct, ...shopProducts];
    } else {
      updated = shopProducts.map((p) => (p.id === savedProduct.id ? savedProduct : p));
    }
    setShopProducts(updated);
    handleSaveAllProducts(updated);
    setEditingProduct(null);
  };

  const handleMoveProduct = (productId, direction) => {
    const globalIdx = shopProducts.findIndex((p) => p.id === productId);
    if (globalIdx === -1) return;

    const targetIdx = direction === 'up' ? globalIdx - 1 : globalIdx + 1;
    if (targetIdx < 0 || targetIdx >= shopProducts.length) return;

    const updated = [...shopProducts];
    const temp = updated[globalIdx];
    updated[globalIdx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setShopProducts(updated);
    handleSaveAllProducts(updated);
  };

  const handleMoveProductToEdge = (productId, edge) => {
    const globalIdx = shopProducts.findIndex((p) => p.id === productId);
    if (globalIdx === -1) return;

    const updated = [...shopProducts];
    const [moved] = updated.splice(globalIdx, 1);
    if (edge === 'first') {
      updated.unshift(moved);
    } else {
      updated.push(moved);
    }

    setShopProducts(updated);
    handleSaveAllProducts(updated);
  };

  const handleSetProductPosition = (productId, newPosStr) => {
    const targetPos = parseInt(newPosStr, 10);
    if (isNaN(targetPos)) return;
    const globalIdx = shopProducts.findIndex((p) => p.id === productId);
    if (globalIdx === -1) return;

    const targetIdx = Math.max(0, Math.min(shopProducts.length - 1, targetPos - 1));
    if (targetIdx === globalIdx) return;

    const updated = [...shopProducts];
    const [moved] = updated.splice(globalIdx, 1);
    updated.splice(targetIdx, 0, moved);

    setShopProducts(updated);
    handleSaveAllProducts(updated);
  };

  const handleProductDragStart = (e, globalIndex) => {
    setDraggedProductIndex(globalIndex);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(globalIndex));
    } catch {}
  };

  const handleProductDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverProductIndex !== index) {
      setDragOverProductIndex(index);
    }
  };

  const handleProductDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = draggedProductIndex;
    setDraggedProductIndex(null);
    setDragOverProductIndex(null);

    if (sourceIndex === null || sourceIndex === undefined || sourceIndex === targetIndex) return;

    const updated = [...shopProducts];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setShopProducts(updated);
    handleSaveAllProducts(updated);
  };

  const handleProductDragEnd = () => {
    setDraggedProductIndex(null);
    setDragOverProductIndex(null);
  };

  const filteredShopProducts = shopProducts.filter((p) => {
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      const matchTitleIt = p.titleIt?.toLowerCase().includes(q);
      const matchTitleEn = p.titleEn?.toLowerCase().includes(q);
      const matchId = p.id?.toLowerCase().includes(q);
      const matchCat = p.category?.toLowerCase().includes(q);
      if (!matchTitleIt && !matchTitleEn && !matchId && !matchCat) return false;
    }
    if (productCatFilter !== 'all' && p.category !== productCatFilter) return false;
    if (productTypeFilter === 'custom' && !p.requiresPhoto) return false;
    if (productTypeFilter === 'direct' && p.requiresPhoto) return false;
    if (productStatusFilter === 'active' && p.active === false) return false;
    if (productStatusFilter === 'hidden' && p.active !== false) return false;
    return true;
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return;

    try {
      let res;
      try {
        res = await fetch('/api.php?action=verifyPassword', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/html') || (!res.ok && res.status !== 401)) {
          throw new Error('Not API');
        }
      } catch {
        // Fallback diretto al server Render
        res = await fetch('https://fttest.onrender.com/api.php?action=verifyPassword', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
      }

      const data = await res.json();
      
      if (data && data.success) {
        setIsAuthenticated(true);
      } else {
        alert("Password errata!");
      }
    } catch {
      // Se il server Render è in fase di avvio (cold start), verifica password locale
      if (password === 'fotoextracolor@100') {
        setIsAuthenticated(true);
      } else {
        alert("Password errata!");
      }
    }
  };

  const autoTranslate = async () => {
    if (!window.confirm("Vuoi tradurre automaticamente tutti i testi dall'Italiano all'Inglese? (Sovrascriverà i testi inglesi attuali)")) return;
    
    setIsLoading(true);
    try {
      const itServices = servicesData.it;
      const newEnServices = [...servicesData.en];
      
      const translateText = async (text) => {
        if (!text || text.trim() === '') return "";
        try {
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=it&tl=en&dt=t&q=${encodeURIComponent(text)}`);
          const data = await res.json();
          return data[0].map(item => item[0]).join('');
        } catch (e) {
          console.error(e);
          return text;
        }
      };
      
      for (let i = 0; i < itServices.length; i++) {
        const srv = itServices[i];
        const enSrv = { ...newEnServices[i] };
        
        enSrv.title = await translateText(srv.title);
        enSrv.subtitle = await translateText(srv.subtitle);
        enSrv.description = await translateText(srv.description);
        
        newEnServices[i] = enSrv;
      }
      
      setServicesData({
        ...servicesData,
        en: newEnServices
      });
      setEditingLang('en');
      alert("Traduzione automatica completata!");
    } catch (err) {
      alert("Errore di connessione al servizio di traduzione.");
    }
    setIsLoading(false);
  };

  const moveCategory = (index, direction) => {
    const newCategories = [...categories];
    if (direction === 'up' && index > 0) {
      [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
    } else if (direction === 'down' && index < newCategories.length - 1) {
      [newCategories[index + 1], newCategories[index]] = [newCategories[index], newCategories[index + 1]];
    } else {
      return;
    }
    setCategories(newCategories);
    localStorage.setItem('portfolio_categories', JSON.stringify(newCategories));
    
    fetch('/api.php?action=reorderCategories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: newCategories })
    }).catch(() => console.log("Ordine salvato in locale"));
  };

  // Helper formatting methods for Analytics
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    if (mins < 60) {
      return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
    }
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m`;
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Sconosciuto';
    const now = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, now - timestamp);
    if (diff < 5) return 'adesso';
    if (diff < 60) return `${diff}s fa`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m fa`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h fa`;
    const days = Math.floor(hours / 24);
    return `${days}gg fa`;
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/D';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getPageLabel = (path) => {
    if (!path || path === '/') return '🏠 Home';
    if (path.startsWith('/chisiamo')) return '👥 Chi Siamo';
    if (path.startsWith('/servizi')) return '🛠️ Servizi';
    if (path.startsWith('/portfolio')) return '📷 Portfolio';
    if (path.startsWith('/admin')) return '⚙️ Admin';
    return path;
  };

  const getDeviceIcon = (device) => {
    if (device === 'Mobile') return '📱';
    if (device === 'Tablet') return '📲';
    return '💻';
  };

  // Filter History Log
  const filteredHistory = (analyticsData.history || []).filter(item => {
    // Search query
    if (historySearch.trim()) {
      const q = historySearch.toLowerCase();
      const matchIp = (item.ip || '').toLowerCase().includes(q);
      const matchPage = (item.landingPage || '').toLowerCase().includes(q) || (item.lastPage || '').toLowerCase().includes(q);
      const matchDevice = (item.deviceType || '').toLowerCase().includes(q) || (item.browser || '').toLowerCase().includes(q) || (item.os || '').toLowerCase().includes(q);
      const matchRef = (item.referrer || '').toLowerCase().includes(q);
      const matchSess = (item.sessionId || '').toLowerCase().includes(q);
      if (!matchIp && !matchPage && !matchDevice && !matchRef && !matchSess) {
        return false;
      }
    }

    // Device filter
    if (historyDeviceFilter !== 'all') {
      if (item.deviceType !== historyDeviceFilter) return false;
    }

    // Date filter
    if (historyDateFilter !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      const itemTs = item.startTime || 0;
      if (historyDateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (itemTs < Math.floor(today.getTime() / 1000)) return false;
      } else if (historyDateFilter === '7days') {
        if (itemTs < now - 7 * 86400) return false;
      } else if (historyDateFilter === '30days') {
        if (itemTs < now - 30 * 86400) return false;
      }
    }

    return true;
  });

  // Backoffice Orders Fetching & Heartbeat Sync
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const orders = await getShopOrders();
      // Enrich each order with full photos from IndexedDB if available
      const enriched = await Promise.all(
        (orders || []).map(async (order) => {
          try {
            const dbPhotos = await getOrderAllPhotos(order);
            if (dbPhotos && dbPhotos.length > 0) {
              return {
                ...order,
                allLoadedPhotos: dbPhotos
              };
            }
          } catch {}
          return order;
        })
      );
      setOrdersList(enriched);
    } catch (err) {
      console.warn("Errore recupero ordini gestionale:", err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const handleOrdersUpdated = () => {
      fetchOrders();
    };

    window.addEventListener('shop-orders-updated', handleOrdersUpdated);
    const interval = setInterval(fetchOrders, 20000);

    return () => {
      window.removeEventListener('shop-orders-updated', handleOrdersUpdated);
      clearInterval(interval);
    };
  }, [fetchOrders]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrdersList((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      setOrderFeedback(`Stato ordine aggiornato a: ${ORDER_STATUS_MAP[newStatus]?.labelIt || newStatus}`);
      setTimeout(() => setOrderFeedback(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveOrderAdminNotes = async (orderId, notes) => {
    setSavingNoteOrderId(orderId);
    try {
      await updateOrderStatus(orderId, null, notes);
      setOrdersList((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, adminNotes: notes } : o))
      );
      setOrderFeedback('Note interne di laboratorio salvate!');
      setTimeout(() => setOrderFeedback(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNoteOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Sei sicuro di voler eliminare definitivamente l'ordine ${orderNumber}? L'operazione non può essere annullata.`)) {
      return;
    }
    try {
      await deleteShopOrder(orderId);
      setOrdersList((prev) => prev.filter((o) => o.id !== orderId));
      setOrderFeedback(`Ordine ${orderNumber} eliminato con successo.`);
      setTimeout(() => setOrderFeedback(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  const handleContactCustomerWhatsApp = (order) => {
    const rawPhone = order.customerPhone || '';
    const phone = rawPhone.replace(/\D/g, '');
    if (!phone) {
      alert("Nessun recapito telefonico registrato per questo ordine.");
      return;
    }
    const cleanPhone = phone.startsWith('39') ? phone : `39${phone}`;
    const statusLabel = ORDER_STATUS_MAP[order.status]?.labelIt || order.status;
    let message = `Ciao ${order.customerName || 'Gentile Cliente'}, ti contattiamo dal laboratorio Foto Extracolor riguardo al tuo ordine *${order.orderNumber}*!\n\n`;
    message += `📌 *Stato Attuale:* ${statusLabel}\n`;
    if (order.status === 'ready') {
      message += `🎉 I tuoi articoli sono pronti! Puoi ritirarli in negozio a Salerno oppure è in partenza la spedizione.\n`;
    } else if (order.status === 'processing') {
      message += `🖨️ Stiamo elaborando e stampando i tuoi articoli in laboratorio.\n`;
    }
    message += `\nRestiamo a tua disposizione per qualsiasi domanda o personalizzazione!`;

    const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Download All Order Photos in a single ZIP archive (GUARANTEED unique filenames)
  const handleDownloadAllOrderPhotos = async (order) => {
    setDownloadingZipOrderId(order.id);
    try {
      const allPhotos = await getOrderAllPhotos(order);

      if (!allPhotos || allPhotos.length === 0) {
        alert(
          `Nessun file immagine caricato direttamente sul sito per l'ordine ${order.orderNumber}.\n` +
          `Se il cliente ha effettuato l'ordine tramite WhatsApp, le foto originali ad alta risoluzione si trovano nella chat WhatsApp del laboratorio.`
        );
        return;
      }

      const zip = new JSZip();
      const folderName = `Foto_${order.orderNumber.replace(/#/g, '')}_${(order.customerName || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}`;
      const folder = zip.folder(folderName);

      allPhotos.forEach((ph, idx) => {
        let base64 = ph.dataUrl || ph.src;
        if (!base64) return;
        const cleanExt = (ph.name || '').toLowerCase().endsWith('.png') ? '.png' : (ph.name || '').toLowerCase().endsWith('.webp') ? '.webp' : '.jpg';
        const baseName = (ph.name || `foto_${idx + 1}`).replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
        // Naming univoco garantito: es. 01_foto_vacanze.jpg, 02_foto_festa.jpg ...
        const uniqueZipName = `${String(idx + 1).padStart(2, '0')}_${baseName}${cleanExt}`;

        if (base64.includes('base64,')) {
          const rawBase64 = base64.split('base64,')[1];
          folder.file(uniqueZipName, rawBase64, { base64: true });
        } else if (base64.startsWith('data:')) {
          const comma = base64.indexOf(',');
          folder.file(uniqueZipName, base64.substring(comma + 1), { base64: true });
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      setOrderFeedback(`Archivio ZIP con tutte le ${allPhotos.length} foto scaricato con successo!`);
      setTimeout(() => setOrderFeedback(''), 3500);
    } catch (err) {
      console.error("Errore generazione ZIP foto:", err);
      alert("Si è verificato un errore durante la creazione del pacchetto ZIP delle foto.");
    } finally {
      setDownloadingZipOrderId(null);
    }
  };

  // KPI & Filter calculations
  const pendingOrdersCount = ordersList.filter((o) => o.status === 'pending').length;

  const ordersStats = {
    total: ordersList.length,
    pending: ordersList.filter((o) => o.status === 'pending').length,
    processing: ordersList.filter((o) => o.status === 'processing').length,
    ready: ordersList.filter((o) => o.status === 'ready').length,
    completed: ordersList.filter((o) => o.status === 'completed').length,
    totalRevenue: ordersList
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  };

  const filteredOrders = ordersList.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchNum = (o.orderNumber || '').toLowerCase().includes(q);
      const matchName = (o.customerName || '').toLowerCase().includes(q);
      const matchPhone = (o.customerPhone || '').toLowerCase().includes(q);
      const matchEmail = (o.customerEmail || '').toLowerCase().includes(q);
      const matchNotes = (o.orderNotes || '').toLowerCase().includes(q);
      const matchAdminNotes = (o.adminNotes || '').toLowerCase().includes(q);
      const matchItems = (o.items || []).some((it) => (it.title || '').toLowerCase().includes(q));
      if (!matchNum && !matchName && !matchPhone && !matchEmail && !matchNotes && !matchAdminNotes && !matchItems) {
        return false;
      }
    }
    return true;
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
    try {
      localStorage.setItem('fotoextracolor_admin_active_tab', tab);
    } catch {}
  };

  const getTabMeta = (tab) => {
    switch (tab) {
      case 'orders':
        return {
          title: 'Gestione Ordini Ricevuti',
          section: 'ECOMMERCE',
          icon: '📦',
          desc: 'Visualizza e gestisci gli ordini dei clienti, prepara le stampe, contatta su WhatsApp e aggiorna gli stati'
        };
      case 'ecommerce':
        return {
          title: 'Prodotti & Listini E-Commerce',
          section: 'ECOMMERCE',
          icon: '🛍️',
          desc: 'Catalogo prodotti WooCommerce, listini prezzi lab, sconti quantità e stock'
        };
      case 'portfolio':
        return {
          title: 'Galleria & Portfolio Fotografico',
          section: 'CONTENUTI',
          icon: '🖼️',
          desc: 'Organizza gli album fotografici, carica nuovi scatti e gestisci le categorie'
        };
      case 'services':
        return {
          title: 'Servizi & Tariffe Studio',
          section: 'CONTENUTI',
          icon: '🛠️',
          desc: 'Modifica testi bilingue (Italiano / Inglese) e listini per ciascun servizio'
        };
      case 'settings':
        return {
          title: 'Modalità Pagina Principale',
          section: 'IMPOSTAZIONI',
          icon: '⚙️',
          desc: 'Seleziona se mostrare la sezione "Chi Siamo" o "Portfolio" nella navigazione'
        };
      case 'analytics':
        return {
          title: 'Monitoraggio & Analytics Visitatori',
          section: 'MONITORAGGIO',
          icon: '📊',
          desc: 'Monitora in tempo reale gli utenti connessi, dispositivi, pagine e storico'
        };
      case 'chats':
        return {
          title: 'Chat dal Vivo & AI Groq',
          section: 'ASSISTENZA',
          icon: '💬',
          desc: 'Configurazione chiave API Groq Cloud (Llama 3) e messaggi utenti'
        };
      default:
        return {
          title: 'Pannello Gestionale',
          section: 'GESTIONALE',
          icon: '📸',
          desc: 'Pannello di controllo completo'
        };
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-fullscreen">
        <div className="admin-login-glow-bg"></div>
        <form onSubmit={handleLogin} className="admin-login-card-pro">
          <div className="admin-login-brand">
            <span className="admin-login-icon"><SvgCamera size={28} /></span>
            <h2>FOTO EXTRACOLOR</h2>
            <span className="admin-login-badge">GESTIONALE PRO</span>
          </div>
          <p className="admin-login-subtitle">
            Inserisci la chiave d'accesso per sbloccare il pannello di gestione e il catalogo e-commerce
          </p>
          <div className="admin-login-input-group">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input admin-login-input-field"
              placeholder="Password di amministrazione..."
              autoFocus
            />
          </div>
          <button type="submit" className="admin-btn-primary admin-login-submit-btn">
            Sblocca Gestionale &rarr;
          </button>
        </form>
      </div>
    );
  }

  const activeVisitorsCount = analyticsData.stats?.activeCount || (analyticsData.activeVisitors || []).length;
  const currentTabMeta = getTabMeta(activeTab);

  return (
    <div className="admin-dashboard-layout">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="admin-sidebar-backdrop" 
          onClick={() => setMobileSidebarOpen(false)} 
          aria-hidden="true" 
        />
      )}

      {/* Modern Fixed/Sticky Sidebar */}
      <aside className={`admin-dashboard-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <span className="admin-sidebar-brand-icon"><SvgCamera size={20} /></span>
            <div className="admin-sidebar-brand-text">
              <h3>FOTO EXTRACOLOR</h3>
              <span className="admin-sidebar-badge">GESTIONALE PRO</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Chiudi menu"
          >
            ✕
          </button>
        </div>

        <div className="admin-sidebar-status">
          <div className="admin-sidebar-status-inner">
            <span className="live-pulse-dot"></span>
            <div className="admin-sidebar-status-info">
              <span className="status-label">
                {activeVisitorsCount} {activeVisitorsCount === 1 ? 'visitatore online' : 'visitatori online'}
              </span>
              <span className="status-sub">Monitoraggio in tempo reale</span>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section-title">ECOMMERCE & VENDITE</div>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            <span className="admin-nav-icon">📦</span>
            <span className="admin-nav-text">Ordini Ricevuti</span>
            {pendingOrdersCount > 0 ? (
              <span className="admin-nav-count count-warning animate-pulse" title={`${pendingOrdersCount} nuovi ordini in attesa di lavorazione`}>
                {pendingOrdersCount} nuovi
              </span>
            ) : (
              <span className="admin-nav-count">{ordersList.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'ecommerce' ? 'active' : ''}`}
            onClick={() => handleTabChange('ecommerce')}
          >
            <span className="admin-nav-icon">🛍️</span>
            <span className="admin-nav-text">Prodotti & Prezzi</span>
            {ecommerceEnabled ? (
              <span className="admin-nav-count primary">{shopProducts.length}</span>
            ) : (
              <span className="admin-nav-count count-danger" title="Negozio attualmente nascosto sul sito">Nascosto</span>
            )}
          </button>

          <div className="admin-nav-section-title">CONTENUTI DEL SITO</div>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => handleTabChange('portfolio')}
          >
            <span className="admin-nav-icon"><SvgGallery size={18} /></span>
            <span className="admin-nav-text">Galleria & Portfolio</span>
            {categories.length > 0 && <span className="admin-nav-count">{categories.length}</span>}
          </button>

          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => handleTabChange('services')}
          >
            <span className="admin-nav-icon">🛠️</span>
            <span className="admin-nav-text">Servizi & Tariffe</span>
            <span className="admin-nav-count">IT/EN</span>
          </button>

          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleTabChange('settings')}
          >
            <span className="admin-nav-icon">⚙️</span>
            <span className="admin-nav-text">Modalità Pagina</span>
            <span className="admin-nav-count accent">{pageMode === 'chisiamo' ? 'Chi Siamo' : 'Portfolio'}</span>
          </button>

          <div className="admin-nav-section-title">MONITORAGGIO & CHAT</div>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => handleTabChange('analytics')}
          >
            <span className="admin-nav-icon">📊</span>
            <span className="admin-nav-text">Analytics Visitatori</span>
            {activeVisitorsCount > 0 && (
              <span className="admin-nav-count live">{activeVisitorsCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => handleTabChange('chats')}
          >
            <span className="admin-nav-icon">💬</span>
            <span className="admin-nav-text">Chat dal Vivo & AI</span>
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <a
            href="#/shop"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-sidebar-ext-link"
          >
            <span>🌐</span>
            <span>Apri Negozio Online</span>
            <span className="ext-icon">↗</span>
          </a>
          <button
            type="button"
            className="admin-sidebar-logout"
            onClick={() => { setIsAuthenticated(false); setPassword(''); }}
          >
            <span>🚪</span>
            <span>Esci dal Gestionale</span>
          </button>
        </div>
      </aside>

      {/* Main Full-Page Canvas Area */}
      <div className="admin-dashboard-main">
        {/* Top Header Bar inside Dashboard */}
        <header className="admin-dashboard-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-mobile-menu-btn"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              aria-label="Apri menu laterale"
            >
              ☰
            </button>
            <div className="topbar-breadcrumbs">
              <span className="topbar-breadcrumb-parent">Gestionale</span>
              <span className="topbar-breadcrumb-sep">/</span>
              <span className="topbar-breadcrumb-active">{currentTabMeta.title}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Quick Master E-Commerce Visibility Toggle */}
            <button
              type="button"
              className={`topbar-ecomm-toggle ${ecommerceEnabled ? 'is-enabled' : 'is-disabled'}`}
              onClick={() => handleEcommerceToggle()}
              title={ecommerceEnabled ? "Clicca per nascondere l'E-Commerce dal sito pubblico" : "Clicca per mostrare l'E-Commerce sul sito pubblico"}
            >
              <span className={`toggle-indicator-dot ${ecommerceEnabled ? 'dot-green' : 'dot-red'}`}></span>
              <span className="toggle-label">{ecommerceEnabled ? 'Shop: Visibile' : 'Shop: Nascosto'}</span>
            </button>

            <div className="topbar-status-pill">
              <span className="live-pulse-dot"></span>
              <span>{activeVisitorsCount} {activeVisitorsCount === 1 ? 'Online' : 'Online'}</span>
            </div>

            {activeTab === 'orders' && (
              <button
                type="button"
                className="admin-btn-secondary topbar-action-btn"
                onClick={fetchOrders}
                disabled={ordersLoading}
                title="Ricarica ordini dal server"
              >
                🔄 {ordersLoading ? 'Caricamento...' : 'Aggiorna Ordini'}
              </button>
            )}

            {activeTab === 'ecommerce' && (
              <button
                type="button"
                className="admin-btn-primary topbar-action-btn"
                onClick={handleOpenNewProduct}
              >
                + Aggiungi Prodotto
              </button>
            )}

            {activeTab === 'analytics' && (
              <button
                type="button"
                className="admin-btn-secondary topbar-action-btn"
                onClick={() => fetchAnalytics(true)}
                disabled={isAnalyticsLoading}
              >
                🔄 {isAnalyticsLoading ? 'Caricamento...' : 'Aggiorna Dati'}
              </button>
            )}
          </div>
        </header>

        {/* Global Feedback Banner */}
        {modeFeedback && (
          <div className="admin-alert-banner">
            <span>{modeFeedback}</span>
          </div>
        )}

        {/* Dynamic Canvas Container (100% full width) */}
        <div className="admin-dashboard-content-canvas">
        {/* ========================================================================= */}
        {/* TAB: CHAT DAL VIVO */}
        {/* ========================================================================= */}
        {activeTab === 'chats' && (
          <div className="admin-section animate-fade-in">
            {/* Box Configurazione Intelligenza Artificiale */}
            <div className="admin-ai-card">
              <div className="admin-ai-card-header">
                <div className="admin-ai-badge-row">
                  <span className="admin-ai-icon">🤖</span>
                  <div>
                    <h3 className="admin-ai-title">Assistente Virtuale AI (Groq Cloud)</h3>
                    <p className="admin-ai-subtitle">
                      {groqApiKey && groqApiKey.trim().length > 10 ? (
                        <span className="ai-status-active">🟢 AI Attiva (Modello: Llama 3.3 70B Versatile)</span>
                      ) : (
                        <span className="ai-status-fallback">🟡 Assistente Locale Attivo (Risposte intelligenti di cortesia su orari, servizi, preventivi WhatsApp e sede)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveApiKey} className="admin-ai-form">
                <label className="admin-ai-label">Chiave API Groq (GROQ_API_KEY):</label>
                <div className="admin-ai-input-row">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={groqApiKey}
                    onChange={(e) => setGroqApiKey(e.target.value)}
                    placeholder="gsk_..."
                    className="admin-input admin-ai-input"
                  />
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => setShowApiKey(!showApiKey)}
                    title={showApiKey ? "Nascondi" : "Mostra"}
                  >
                    {showApiKey ? "👁️ Nascondi" : "👁️ Mostra"}
                  </button>
                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={isSavingApiKey}
                  >
                    {isSavingApiKey ? "Salvataggio..." : "💾 Salva Chiave"}
                  </button>
                </div>
                {apiKeyFeedback && (
                  <div className="admin-ai-feedback">{apiKeyFeedback}</div>
                )}
                <p className="admin-ai-help">
                  💡 Puoi ottenere una chiave API gratuita su{" "}
                  <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>
                    console.groq.com/keys
                  </a>. Anche senza chiave, il sito risponde già automaticamente con le informazioni ufficiali di Foto Extracolor!
                </p>
              </form>
            </div>

            <div className="admin-chat-recap-section">
              <div className="admin-section-header">
                <h2>Storico Chatbot & Assistente Virtuale</h2>
                <p>Consulta tutte le conversazioni e i messaggi scambiati dagli utenti con il chatbot in tempo reale.</p>
              </div>

              <div className="admin-card chat-recap-card">
                <div className="admin-card-header">
                  <div className="chat-card-title-group">
                    <h3>Conversazioni Registrate</h3>
                    <span className="chat-total-badge">{chatsData.length} {chatsData.length === 1 ? 'chat' : 'chat'}</span>
                  </div>
                  <button className="admin-btn-secondary" onClick={fetchChats} disabled={isChatsLoading}>
                    {isChatsLoading ? 'Aggiornamento...' : '🔄 Aggiorna'}
                  </button>
                </div>
                <div className="admin-card-body">
                  {chatsData.length === 0 ? (
                    <div className="empty-state">
                      <p>Nessuna conversazione registrata finora.</p>
                    </div>
                  ) : (
                    <div className="chats-list">
                      {chatsData.map(chat => (
                        <div key={chat.sessionId} className="chat-session-card">
                          <div className="chat-session-header">
                            <div className="chat-user-badge">
                              <span className="chat-user-icon">👤</span>
                              <strong>{chat.userName || 'Ospite'}</strong>
                            </div>
                            <span className="chat-start-time">
                              Iniziata: {new Date(chat.startTime).toLocaleString('it-IT')}
                            </span>
                          </div>
                          <div className="chat-messages-container">
                            {chat.messages && chat.messages.map((msg, i) => {
                              const isUser = msg.sender === 'user';
                              return (
                                <div 
                                  key={i} 
                                  className={`chat-msg-bubble ${isUser ? 'chat-msg-user' : 'chat-msg-bot'}`}
                                >
                                  <div className="chat-msg-sender-label">
                                    {isUser ? `👤 ${chat.userName || 'Utente'}` : '🤖 Assistente Foto Extracolor'}
                                  </div>
                                  <div className="chat-msg-text">{msg.text}</div>
                                  <div className="chat-msg-timestamp">
                                    {new Date(msg.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: MONITORAGGIO & VISITATORI (CHI È COLLEGATO + CRONOLOGIA ACCESSI) */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="admin-analytics-container">
            {/* KPI STATS CARDS */}
            <div className="analytics-kpi-grid">
              <div className="analytics-kpi-card live-kpi-card">
                <div className="kpi-top">
                  <span className="kpi-icon">🟢</span>
                  <span className="kpi-label">Utenti Online Ora</span>
                </div>
                <div className="kpi-value-row">
                  <span className="kpi-value">{activeVisitorsCount}</span>
                  <span className="live-beacon-pill">LIVE</span>
                </div>
                <p className="kpi-subtext">Sessioni attive negli ultimi 45s</p>
              </div>

              <div className="analytics-kpi-card">
                <div className="kpi-top">
                  <span className="kpi-icon">📅</span>
                  <span className="kpi-label">Visite Oggi</span>
                </div>
                <div className="kpi-value-row">
                  <span className="kpi-value">{analyticsData.stats?.todayVisits || 0}</span>
                </div>
                <p className="kpi-subtext">Registrate dalla mezzanotte</p>
              </div>

              <div className="analytics-kpi-card">
                <div className="kpi-top">
                  <span className="kpi-icon">👥</span>
                  <span className="kpi-label">Visite Totali</span>
                </div>
                <div className="kpi-value-row">
                  <span className="kpi-value">{analyticsData.stats?.totalVisits || 0}</span>
                </div>
                <p className="kpi-subtext">Storico accessi registrati</p>
              </div>

              <div className="analytics-kpi-card">
                <div className="kpi-top">
                  <span className="kpi-icon">⏱️</span>
                  <span className="kpi-label">Permanenza Media</span>
                </div>
                <div className="kpi-value-row">
                  <span className="kpi-value">{formatDuration(analyticsData.stats?.avgDurationSeconds || 0)}</span>
                </div>
                <p className="kpi-subtext">Tempo medio sul sito</p>
              </div>

              <div className="analytics-kpi-card devices-kpi-card">
                <div className="kpi-top">
                  <span className="kpi-icon">📱</span>
                  <span className="kpi-label">Dispositivi</span>
                </div>
                <div className="kpi-devices-chips">
                  <span title="Desktop">💻 {analyticsData.stats?.deviceBreakdown?.Desktop || 0}</span>
                  <span title="Mobile">📱 {analyticsData.stats?.deviceBreakdown?.Mobile || 0}</span>
                  <span title="Tablet">📲 {analyticsData.stats?.deviceBreakdown?.Tablet || 0}</span>
                </div>
                <p className="kpi-subtext">Distribuzione hardware</p>
              </div>
            </div>

            {/* SUB-TABS NAVIGATION & CONTROLS */}
            <div className="analytics-controls-bar">
              <div className="analytics-subtabs">
                <button
                  className={`analytics-subtab ${analyticsSubTab === 'live' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('live')}
                >
                  🟢 Chi è Collegato Ora ({activeVisitorsCount})
                </button>
                <button
                  className={`analytics-subtab ${analyticsSubTab === 'history' ? 'active' : ''}`}
                  onClick={() => setAnalyticsSubTab('history')}
                >
                  📜 Cronologia Accessi ({analyticsData.history?.length || 0})
                </button>
              </div>

              <div className="analytics-live-controls">
                <label className="analytics-toggle-label" title="Aggiornamento automatico in tempo reale">
                  <input
                    type="checkbox"
                    checked={analyticsAutoRefresh}
                    onChange={(e) => setAnalyticsAutoRefresh(e.target.checked)}
                  />
                  <span>Auto-Refresh ({autoRefreshInterval}s)</span>
                </label>

                <select 
                  className="analytics-interval-select"
                  value={autoRefreshInterval}
                  onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                  disabled={!analyticsAutoRefresh}
                >
                  <option value={3}>Ogni 3s</option>
                  <option value={5}>Ogni 5s</option>
                  <option value={10}>Ogni 10s</option>
                  <option value={20}>Ogni 20s</option>
                </select>

                <button 
                  className="admin-btn-secondary analytics-refresh-btn"
                  onClick={() => fetchAnalytics(false)}
                  disabled={isAnalyticsLoading}
                  title="Aggiorna dati adesso"
                >
                  {isAnalyticsLoading ? '⏳ Caricamento...' : '🔄 Aggiorna'}
                </button>
              </div>
            </div>

            {lastAnalyticsUpdate && (
              <div className="analytics-last-update">
                Ultimo controllo: {lastAnalyticsUpdate.toLocaleTimeString('it-IT')}
              </div>
            )}

            {/* SUB-VIEW 1: CHI È COLLEGATO ADESSO (LIVE) */}
            {analyticsSubTab === 'live' && (
              <div className="analytics-live-section">
                <div className="admin-section-header">
                  <h2>Utenti Attualmente Connessi</h2>
                  <p>Visualizza in tempo reale chi sta visitando il sito, quale pagina sta leggendo e da quale dispositivo.</p>
                </div>

                {(analyticsData.activeVisitors || []).length === 0 ? (
                  <div className="analytics-empty-state">
                    <div className="empty-radar-animation">
                      <div className="radar-circle circle-1"></div>
                      <div className="radar-circle circle-2"></div>
                      <div className="radar-icon">📡</div>
                    </div>
                    <h3>Nessun visitatore attualmente collegato</h3>
                    <p>In attesa di nuovi ingressi... Appena qualcuno aprirà il sito apparirà qui all'istante.</p>
                  </div>
                ) : (
                  <div className="active-visitors-grid">
                    {(analyticsData.activeVisitors || []).map((visitor, idx) => {
                      const connectedTime = formatDuration(Math.max(1, Math.floor(Date.now() / 1000) - (visitor.firstSeen || Math.floor(Date.now() / 1000))));
                      const lastPingTime = formatTimeAgo(visitor.lastPing);

                      return (
                        <div key={visitor.sessionId || idx} className="visitor-card live-card">
                          <div className="visitor-card-header">
                            <div className="visitor-header-left">
                              <span className="live-status-indicator" title="Online adesso"></span>
                              <span className="visitor-session-id">#{visitor.sessionId ? visitor.sessionId.slice(-7) : 'Ospite'}</span>
                            </div>
                            <span className="visitor-device-badge">
                              {getDeviceIcon(visitor.deviceType)} {visitor.deviceType}
                            </span>
                          </div>

                          <div className="visitor-card-body">
                            <div className="visitor-info-row">
                              <span className="visitor-info-label">📍 Indirizzo IP:</span>
                              <span className="visitor-info-val ip-val">{visitor.ip || '127.0.0.1'}</span>
                            </div>

                            <div className="visitor-info-row">
                              <span className="visitor-info-label">🌐 Pagina Attiva:</span>
                              <span className="visitor-info-val page-badge">
                                {getPageLabel(visitor.currentPage)}
                              </span>
                            </div>

                            <div className="visitor-info-row">
                              <span className="visitor-info-label">💻 Sistema & Browser:</span>
                              <span className="visitor-info-val">
                                {visitor.browser} su {visitor.os}
                              </span>
                            </div>

                            <div className="visitor-info-row">
                              <span className="visitor-info-label">🔗 Provenienza:</span>
                              <span className="visitor-info-val referrer-val">
                                {visitor.referrer || 'Accesso Diretto'}
                              </span>
                            </div>

                            <div className="visitor-info-row">
                              <span className="visitor-info-label">⏱️ Connesso da:</span>
                              <span className="visitor-info-val highlight-time">{connectedTime}</span>
                            </div>

                            <div className="visitor-info-row">
                              <span className="visitor-info-label">📡 Ultimo Segnale:</span>
                              <span className="visitor-info-val">{lastPingTime}</span>
                            </div>

                            {visitor.pages && visitor.pages.length > 1 && (
                              <div className="visitor-path-box">
                                <span className="visitor-path-title">Percorso di navigazione ({visitor.pages.length} pagine):</span>
                                <div className="visitor-path-flow">
                                  {visitor.pages.map((p, pIdx) => (
                                    <span key={pIdx} className="path-tag">
                                      {getPageLabel(p)} {pIdx < visitor.pages.length - 1 ? '→' : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="visitor-tech-footer">
                              <span className="tech-tag">📐 {visitor.screen || 'N/D'}</span>
                              <span className="tech-tag">🌐 {(visitor.language || 'it').toUpperCase()}</span>
                              <span className="tech-tag">{visitor.theme === 'light' ? '☀️ Chiaro' : '🌙 Scuro'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW 2: CRONOLOGIA DEGLI ACCESSI (STORICO VISITE) */}
            {analyticsSubTab === 'history' && (
              <div className="analytics-history-section">
                <div className="admin-section-header">
                  <h2>Cronologia degli Accessi</h2>
                  <p>Registro storico di tutte le visite effettuate sul sito con durata, pagine visitate e dettagli dispositivo.</p>
                </div>

                {/* Filters & Actions Header */}
                <div className="history-filter-bar">
                  <div className="history-search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      placeholder="Cerca per IP, pagina, browser, dispositivo o sorgente..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="admin-input history-search-input"
                    />
                    {historySearch && (
                      <button className="clear-search-btn" onClick={() => setHistorySearch('')}>✕</button>
                    )}
                  </div>

                  <div className="history-dropdowns">
                    <select
                      className="admin-input history-filter-select"
                      value={historyDateFilter}
                      onChange={(e) => setHistoryDateFilter(e.target.value)}
                    >
                      <option value="all">📅 Tutte le date</option>
                      <option value="today">📅 Solo Oggi</option>
                      <option value="7days">📅 Ultimi 7 giorni</option>
                      <option value="30days">📅 Ultimi 30 giorni</option>
                    </select>

                    <select
                      className="admin-input history-filter-select"
                      value={historyDeviceFilter}
                      onChange={(e) => setHistoryDeviceFilter(e.target.value)}
                    >
                      <option value="all">💻 Tutti i dispositivi</option>
                      <option value="Desktop">💻 Solo Desktop</option>
                      <option value="Mobile">📱 Solo Smartphone</option>
                      <option value="Tablet">📲 Solo Tablet</option>
                    </select>
                  </div>

                  <div className="history-actions-group">
                    <button 
                      className="admin-btn-secondary history-export-btn"
                      onClick={handleExportCSV}
                      title="Scarica foglio CSV di tutti i dati filtrati"
                    >
                      📥 Esporta CSV
                    </button>
                    <button 
                      className="admin-btn-danger history-clear-btn"
                      onClick={handleClearHistory}
                      disabled={clearingHistory || (analyticsData.history || []).length === 0}
                      title="Cancella tutto lo storico delle visite"
                    >
                      🗑️ Svuota
                    </button>
                  </div>
                </div>

                <div className="history-results-counter">
                  Mostrando <strong>{filteredHistory.length}</strong> di <strong>{(analyticsData.history || []).length}</strong> accessi registrati
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="analytics-empty-state">
                    <p className="admin-empty">Nessuna visita trovata corrispondente ai filtri selezionati.</p>
                  </div>
                ) : (
                  <div className="history-table-wrapper">
                    <table className="admin-history-table">
                      <thead>
                        <tr>
                          <th>Data e Ora</th>
                          <th>IP & Posizione</th>
                          <th>Dispositivo & OS</th>
                          <th>Pagina Iniziale</th>
                          <th>Pagine Viste</th>
                          <th>Sorgente</th>
                          <th>Permanenza</th>
                          <th>Stato</th>
                          <th>Dettagli</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map((item, idx) => {
                          const isOnline = item.status === 'online';
                          const isRecent = isOnline || (Math.floor(Date.now() / 1000) - (item.endTime || 0) < 60);

                          return (
                            <tr key={item.sessionId || idx} className={isRecent ? 'row-recent' : ''}>
                              <td className="table-date-cell">
                                <span className="date-main">{formatDateTime(item.startTime)}</span>
                                <span className="date-ago">{formatTimeAgo(item.startTime)}</span>
                              </td>
                              <td className="table-ip-cell">
                                <span className="ip-badge">{item.ip || '127.0.0.1'}</span>
                              </td>
                              <td className="table-device-cell">
                                <span className="device-tag">
                                  {getDeviceIcon(item.deviceType)} {item.deviceType}
                                </span>
                                <span className="browser-sub">{item.browser} • {item.os}</span>
                              </td>
                              <td className="table-page-cell">
                                <span className="page-tag-pill">{getPageLabel(item.landingPage)}</span>
                              </td>
                              <td className="table-views-cell">
                                <span className="views-count-badge" title={(item.pages || []).join(' → ')}>
                                  {item.pageViews || 1} {item.pageViews === 1 ? 'pag.' : 'pag.'}
                                </span>
                              </td>
                              <td className="table-referrer-cell">
                                <span className="referrer-tag">{item.referrer || 'Diretto'}</span>
                              </td>
                              <td className="table-duration-cell">
                                <span className="duration-pill">{formatDuration(item.durationSeconds || 0)}</span>
                              </td>
                              <td className="table-status-cell">
                                {isOnline ? (
                                  <span className="status-badge-online">● Online</span>
                                ) : (
                                  <span className="status-badge-ended">Concluso</span>
                                )}
                              </td>
                              <td className="table-action-cell">
                                <button
                                  className="admin-btn-secondary btn-inspect"
                                  onClick={() => setSelectedSessionDetail(item)}
                                  title="Visualizza dettagli completi della sessione"
                                >
                                  🔎
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* DETAIL MODAL FOR INSPECTING A SINGLE VISIT SESSION */}
            {selectedSessionDetail && typeof document !== 'undefined' && createPortal(
              <div 
                className="admin-modal-backdrop" 
                onClick={() => setSelectedSessionDetail(null)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-modal-title"
              >
                <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-modal-header">
                    <h3 id="admin-modal-title">Dettaglio Accesso Visitatore</h3>
                    <button className="admin-modal-close" onClick={() => setSelectedSessionDetail(null)} aria-label="Chiudi">✕</button>
                  </div>
                  
                  <div className="admin-modal-body">
                    <div className="detail-hero-box">
                      <div className="detail-status-row">
                        <span className={`detail-status-pill ${selectedSessionDetail.status === 'online' ? 'online' : 'ended'}`}>
                          {selectedSessionDetail.status === 'online' ? '● ATTUALMENTE ONLINE' : 'SESSIONE CONCLUSA'}
                        </span>
                        <span className="detail-sess-id">ID: {selectedSessionDetail.sessionId}</span>
                      </div>
                    </div>

                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>🗓️ Data & Ora Inizio:</label>
                        <span>{formatDateTime(selectedSessionDetail.startTime)}</span>
                      </div>
                      <div className="detail-item">
                        <label>⏱️ Durata Permanenza:</label>
                        <span className="highlight-text">{formatDuration(selectedSessionDetail.durationSeconds || 0)}</span>
                      </div>
                      <div className="detail-item">
                        <label>📍 Indirizzo IP:</label>
                        <span>{selectedSessionDetail.ip || '127.0.0.1'}</span>
                      </div>
                      <div className="detail-item">
                        <label>🔗 Fonte / Referrer:</label>
                        <span>{selectedSessionDetail.referrer || 'Accesso Diretto'}</span>
                      </div>
                      <div className="detail-item">
                        <label>📱 Tipo Dispositivo:</label>
                        <span>{getDeviceIcon(selectedSessionDetail.deviceType)} {selectedSessionDetail.deviceType}</span>
                      </div>
                      <div className="detail-item">
                        <label>💻 Sistema Operativo:</label>
                        <span>{selectedSessionDetail.os}</span>
                      </div>
                      <div className="detail-item">
                        <label>🌐 Browser:</label>
                        <span>{selectedSessionDetail.browser}</span>
                      </div>
                      <div className="detail-item">
                        <label>📐 Risoluzione Schermo:</label>
                        <span>{selectedSessionDetail.screen || 'N/D'}</span>
                      </div>
                      <div className="detail-item">
                        <label>🇮🇹 Lingua Selezionata:</label>
                        <span>{(selectedSessionDetail.language || 'it').toUpperCase()}</span>
                      </div>
                      <div className="detail-item">
                        <label>🎨 Tema:</label>
                        <span>{selectedSessionDetail.theme === 'light' ? '☀️ Chiaro' : '🌙 Scuro'}</span>
                      </div>
                    </div>

                    <div className="detail-timeline-box">
                      <h4>Percorso Pagine Visitate ({selectedSessionDetail.pageViews || 1})</h4>
                      <div className="detail-timeline">
                        {(selectedSessionDetail.pages || [selectedSessionDetail.landingPage || '/']).map((page, pIdx) => (
                          <div key={pIdx} className="timeline-step">
                            <div className="timeline-dot">{pIdx + 1}</div>
                            <div className="timeline-content">
                              <span className="timeline-page-name">{getPageLabel(page)}</span>
                              <span className="timeline-page-raw">{page}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="admin-modal-footer">
                    <button className="admin-btn-secondary" onClick={() => setSelectedSessionDetail(null)}>
                      Chiudi
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: SCELTA PAGINA PRINCIPALE (CHI SIAMO / PORTFOLIO) */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="admin-section admin-settings-section">
            <div className="admin-section-header">
              <h2>Configurazione Pagina Principale</h2>
              <p>
                Scegli se mostrare nel menu e nella navigazione la pagina <strong>Chi Siamo</strong> oppure la pagina <strong>Portfolio</strong>.
              </p>
            </div>

            <div className="admin-mode-grid">
              {/* Option: Chi Siamo */}
              <div 
                className={`admin-mode-card ${pageMode === 'chisiamo' ? 'selected' : ''}`}
                onClick={() => handlePageModeChange('chisiamo')}
              >
                <div className="admin-mode-top">
                  <span className="admin-mode-icon">👥</span>
                  <span className={`admin-mode-status-badge ${pageMode === 'chisiamo' ? 'active' : ''}`}>
                    {pageMode === 'chisiamo' ? '● ATTIVA ORA' : 'Disattivata'}
                  </span>
                </div>
                <h3>Pagina "Chi Siamo"</h3>
                <p className="admin-mode-desc">
                  Ideale per un sito web vetrina. Racconta oltre 60 anni di storia di Foto Extracolor, la fondazione di Riccardo Capasso & Gabriela Donadio, i valori aziendali e l'archivio storico.
                </p>
                <ul className="admin-mode-perks">
                  <li>✓ Storia & Origini del laboratorio</li>
                  <li>✓ Valori aziendali & Statistiche chiave</li>
                  <li>✓ Archivio storico con Lightbox</li>
                  <li>✓ Box contatto rapido (WhatsApp / Email)</li>
                </ul>
                <button 
                  type="button" 
                  className={`admin-mode-select-btn ${pageMode === 'chisiamo' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePageModeChange('chisiamo');
                  }}
                >
                  {pageMode === 'chisiamo' ? 'Pagina Attualmente Attiva' : 'Attiva Pagina Chi Siamo'}
                </button>
              </div>

              {/* Option: Portfolio */}
              <div 
                className={`admin-mode-card ${pageMode === 'portfolio' ? 'selected' : ''}`}
                onClick={() => handlePageModeChange('portfolio')}
              >
                <div className="admin-mode-top">
                  <span className="admin-mode-icon">📷</span>
                  <span className={`admin-mode-status-badge ${pageMode === 'portfolio' ? 'active' : ''}`}>
                    {pageMode === 'portfolio' ? '● ATTIVA ORA' : 'Disattivata'}
                  </span>
                </div>
                <h3>Pagina "Portfolio"</h3>
                <p className="admin-mode-desc">
                  Ideale per mostrare gallerie fotografiche organizzate per categorie (es. Matrimoni, Eventi, Ritratti, ecc.) con caricamento e gestione foto dal pannello admin.
                </p>
                <ul className="admin-mode-perks">
                  <li>✓ Schede & Categorie personalizzabili</li>
                  <li>✓ Caricamento diretto di nuovi scatti</li>
                  <li>✓ Visualizzazione a griglia con Lightbox</li>
                  <li>✓ Riordino ed eliminazione rapida foto</li>
                  <li>✓ Gestione album fotografici</li>
                </ul>
                <button 
                  type="button" 
                  className={`admin-mode-select-btn ${pageMode === 'portfolio' ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePageModeChange('portfolio');
                  }}
                >
                  {pageMode === 'portfolio' ? 'Pagina Attualmente Attiva' : 'Attiva Pagina Portfolio'}
                </button>
              </div>
            </div>

            {/* E-Commerce Visibility Setting in Settings Tab */}
            <div className="admin-setting-block" style={{ marginTop: '36px' }}>
              <div className="admin-section-header">
                <h2>Visibilità Negozio E-Commerce</h2>
                <p>
                  Scegli se mantenere attivo e visibile l'E-Commerce per i clienti oppure nasconderlo temporaneamente dal sito pubblico.
                </p>
              </div>

              <div className={`admin-ecomm-visibility-card ${ecommerceEnabled ? 'status-live' : 'status-hidden'}`}>
                <div className="ecomm-vis-card-left">
                  <div className="ecomm-vis-pill">
                    <span className={`ecomm-vis-dot ${ecommerceEnabled ? 'dot-live' : 'dot-off'}`}></span>
                    <strong>{ecommerceEnabled ? "E-COMMERCE ONLINE SUL SITO" : "E-COMMERCE ATTUALMENTE NASCOSTO"}</strong>
                  </div>
                  <h3>{ecommerceEnabled ? "Negozio Online Visibile" : "Negozio Online Nascosto"}</h3>
                  <p>
                    {ecommerceEnabled
                      ? "La voce 'Shop' e l'icona del carrello compaiono nella navigazione del sito. I clienti possono effettuare ordini e caricare foto."
                      : "La voce 'Shop' e il carrello sono rimossi dal menu. Chi accede a /shop viene reindirizzato alla Home. I prodotti restano memorizzati e pronti nel gestionale."}
                  </p>
                </div>
                <div className="ecomm-vis-card-right">
                  <button
                    type="button"
                    className={`ecomm-toggle-master-btn ${ecommerceEnabled ? 'btn-turn-off' : 'btn-turn-on'}`}
                    onClick={() => handleEcommerceToggle()}
                  >
                    {ecommerceEnabled ? "👁️ Nascondi E-Commerce dal Sito" : "✨ Mostra E-Commerce sul Sito"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: GESTIONE GALLERIA / PORTFOLIO */}
        {/* ========================================================================= */}
        {activeTab === 'portfolio' && activeCategory && (
          <div className="admin-section">
            <button className="admin-btn-secondary" onClick={() => setActiveCategory(null)}>
              &larr; Torna alle schede
            </button>
            <h2 className="admin-section-subtitle">Gestione Foto: {activeCategory}</h2>
            
            <div className="admin-upload-wrapper">
              <input 
                type="file" 
                id="photo-upload" 
                accept="image/*" 
                onChange={(e) => handleUploadPhoto(e, activeCategory)} 
                style={{display: 'none'}} 
              />
              <label htmlFor="photo-upload" className="admin-btn-primary admin-upload-label">
                + Carica Nuova Foto
              </label>
            </div>
            
            <div className="admin-photo-grid">
               {(imagesByCategory[activeCategory.toLowerCase().replace(/\s+/g, '')] || []).map((url) => (
                  <div key={url} className="admin-photo-item">
                     <img src={url} alt="portfolio" className="admin-photo-img" />
                     <button 
                       className="admin-btn-danger admin-photo-delete"
                       onClick={() => handleDeletePhoto(url, activeCategory)}
                     >X</button>
                  </div>
               ))}
               {(imagesByCategory[activeCategory.toLowerCase().replace(/\s+/g, '')] || []).length === 0 && (
                 <p className="admin-empty">Nessuna foto in questa scheda.</p>
               )}
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && !activeCategory && (
          <div className="admin-section">
            <h2>Schede Galleria</h2>
            
            <form onSubmit={handleAddCategory} className="admin-add-form">
              <input 
                type="text" 
                placeholder="Nuova scheda (es. Ritratti)" 
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="admin-input"
              />
              <button type="submit" className="admin-btn-primary">Aggiungi Scheda</button>
            </form>

            <div className="admin-list">
              {categories.map((category, index) => (
                <div key={category} className="admin-list-item">
                  <div className="admin-category-info">
                    <div className="admin-reorder-btns">
                      <button 
                        onClick={() => moveCategory(index, 'up')} 
                        disabled={index === 0}
                        className="admin-arrow-btn"
                        aria-label="Sposta su"
                      >&#9650;</button>
                      <button 
                        onClick={() => moveCategory(index, 'down')} 
                        disabled={index === categories.length - 1}
                        className="admin-arrow-btn"
                        aria-label="Sposta giù"
                      >&#9660;</button>
                    </div>
                    <span className="admin-item-title">{category}</span>
                  </div>
                  <div className="admin-item-actions">
                    <button className="admin-btn-secondary" onClick={() => setActiveCategory(category)}>
                      Gestisci Foto
                    </button>
                    <button 
                      className="admin-btn-danger"
                      onClick={() => handleDeleteCategory(category)}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="admin-empty">Nessuna scheda presente.</p>}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: GESTIONE SERVIZI */}
        {/* ========================================================================= */}
        {activeTab === 'services' && (
          <div className="admin-section">
            <div className="admin-services-header">
              <h2>Gestione Servizi</h2>
              <div className="admin-services-lang-group">
                 <div className="admin-lang-tabs">
                   <button className={`admin-tab ${editingLang === 'it' ? 'active' : ''}`} onClick={() => setEditingLang('it')}>Italiano</button>
                   <button className={`admin-tab ${editingLang === 'en' ? 'active' : ''}`} onClick={() => setEditingLang('en')}>Inglese</button>
                 </div>
                 <button className="admin-btn-translate" onClick={autoTranslate}>
                   🤖 Traduzione Auto (IT &rarr; EN)
                 </button>
              </div>
            </div>
            
            {servicesData[editingLang] && servicesData[editingLang].length > 0 ? (
              <div className="admin-services-list">
                {servicesData[editingLang].map((srv, index) => (
                  <div key={srv.id || index} className="admin-service-card">
                    <div className="admin-service-card-top">
                      <div className="admin-reorder-horizontal">
                        <button 
                          className="admin-btn-secondary admin-move-btn" 
                          onClick={() => moveService(index, 'up')}
                          disabled={index === 0}
                          title="Sposta su"
                        >&#9650;</button>
                        <button 
                          className="admin-btn-secondary admin-move-btn" 
                          onClick={() => moveService(index, 'down')}
                          disabled={index === servicesData[editingLang].length - 1}
                          title="Sposta giù"
                        >&#9660;</button>
                      </div>
                      <button className="admin-btn-danger" onClick={() => handleRemoveService(index)}>Elimina</button>
                    </div>

                    <div className="admin-service-row">
                      <div className="admin-form-group">
                        <label>Titolo Servizio</label>
                        <input 
                          className="admin-input" 
                          value={srv.title || ''} 
                          onChange={(e) => handleServiceChange(index, 'title', e.target.value)} 
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Icona</label>
                        <select 
                          className="admin-input admin-select" 
                          value={srv.iconName || 'IconCamera'} 
                          onChange={(e) => handleServiceChange(index, 'iconName', e.target.value)}
                        >
                          <option value="IconCamera">Fotocamera (Eventi)</option>
                          <option value="IconPrinter">Stampante (Stampe)</option>
                          <option value="IconCalendar">Calendario (Cerimonie)</option>
                          <option value="IconFilm">Pellicola (Sviluppo)</option>
                          <option value="IconConvert">Conversione (VHS)</option>
                          <option value="IconDrone">Drone (Riprese Aeree)</option>
                          <option value="IconGift">Regalo (Gadget)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="admin-form-group">
                      <label>Sottotitolo Evidenziato (Opzionale)</label>
                      <input 
                        className="admin-input" 
                        value={srv.subtitle || ''} 
                        placeholder="Es: Foto, film e riprese aeree..."
                        onChange={(e) => handleServiceChange(index, 'subtitle', e.target.value)} 
                      />
                    </div>
                    
                    <div className="admin-form-group">
                      <label>Descrizione Completa</label>
                      <textarea 
                        className="admin-input admin-textarea" 
                        value={srv.description || ''} 
                        onChange={(e) => handleServiceChange(index, 'description', e.target.value)} 
                      />
                    </div>

                    <label className="admin-featured-checkbox">
                      <input 
                        type="checkbox" 
                        checked={srv.featured || false} 
                        onChange={(e) => handleServiceChange(index, 'featured', e.target.checked)} 
                      />
                      Metti in evidenza (Layout speciale)
                    </label>
                  </div>
                ))}
                
                <div className="admin-service-actions">
                  <button className="admin-btn-secondary" onClick={handleAddService}>+ Aggiungi Servizio</button>
                  <button className="admin-btn-primary" onClick={saveServices}>Salva Tutte le Modifiche</button>
                </div>
              </div>
            ) : (
              <p className="admin-empty">Nessun servizio caricato. Verifica la connessione al server o il salvataggio locale.</p>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: GESTIONE ORDINI RICEVUTI (BACKOFFICE & LABORATORIO) */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="admin-section animate-fade-in admin-orders-section">
            {/* Feedback alert */}
            {orderFeedback && (
              <div className="admin-orders-alert-toast animate-slide-down">
                <span>✓</span>
                <span>{orderFeedback}</span>
              </div>
            )}

            {/* KPI STATS CARDS */}
            <div className="admin-orders-kpi-grid">
              <div className="order-kpi-card">
                <div className="kpi-icon-wrap kpi-icon-total">📦</div>
                <div className="kpi-info">
                  <span className="kpi-number">{ordersStats.total}</span>
                  <span className="kpi-label">Totale Ordini Ricevuti</span>
                </div>
              </div>

              <div className="order-kpi-card kpi-card-pending">
                <div className="kpi-icon-wrap kpi-icon-pending">🟡</div>
                <div className="kpi-info">
                  <span className="kpi-number">{ordersStats.pending}</span>
                  <span className="kpi-label">Nuovi in Attesa</span>
                </div>
              </div>

              <div className="order-kpi-card kpi-card-processing">
                <div className="kpi-icon-wrap kpi-icon-processing">🔵</div>
                <div className="kpi-info">
                  <span className="kpi-number">{ordersStats.processing}</span>
                  <span className="kpi-label">In Lavorazione Lab</span>
                </div>
              </div>

              <div className="order-kpi-card kpi-card-ready">
                <div className="kpi-icon-wrap kpi-icon-ready">🟢</div>
                <div className="kpi-info">
                  <span className="kpi-number">{ordersStats.ready}</span>
                  <span className="kpi-label">Pronti al Ritiro / Spedizione</span>
                </div>
              </div>

              <div className="order-kpi-card kpi-card-completed">
                <div className="kpi-icon-wrap kpi-icon-completed">⚪</div>
                <div className="kpi-info">
                  <span className="kpi-number">{ordersStats.completed}</span>
                  <span className="kpi-label">Completati</span>
                </div>
              </div>

              <div className="order-kpi-card kpi-card-revenue">
                <div className="kpi-icon-wrap kpi-icon-revenue">💶</div>
                <div className="kpi-info">
                  <span className="kpi-number">€{ordersStats.totalRevenue.toFixed(2)}</span>
                  <span className="kpi-label">Incasso Ordini Validi</span>
                </div>
              </div>
            </div>

            {/* FILTER & SEARCH TOOLBAR */}
            <div className="admin-orders-toolbar">
              <div className="orders-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Cerca per #ordine, nome cliente, telefono, articolo, note..."
                  className="orders-search-input"
                />
                {orderSearch && (
                  <button
                    type="button"
                    className="orders-search-clear-btn"
                    onClick={() => setOrderSearch('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="orders-status-filters">
                {[
                  { id: 'all', label: `Tutti (${ordersStats.total})` },
                  { id: 'pending', label: `In Attesa (${ordersStats.pending})` },
                  { id: 'processing', label: `In Lavorazione (${ordersStats.processing})` },
                  { id: 'ready', label: `Pronti (${ordersStats.ready})` },
                  { id: 'completed', label: `Completati (${ordersStats.completed})` },
                  { id: 'cancelled', label: `Annullati` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`order-filter-pill ${orderStatusFilter === tab.id ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="admin-btn-secondary orders-refresh-btn"
                onClick={fetchOrders}
                disabled={ordersLoading}
              >
                🔄 {ordersLoading ? 'Aggiornamento...' : 'Ricarica'}
              </button>
            </div>

            {/* ORDERS FEED / LIST */}
            {filteredOrders.length === 0 ? (
              <div className="admin-orders-empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>Nessun ordine trovato</h3>
                <p>
                  {orderSearch || orderStatusFilter !== 'all'
                    ? "Nessun ordine corrisponde ai filtri impostati. Prova a reimpostare i filtri."
                    : "Non ci sono ancora ordini ricevuti dall'e-commerce. Quando un cliente completerà un ordine sul sito, apparirà qui in tempo reale."}
                </p>
                {(orderSearch || orderStatusFilter !== 'all') && (
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => {
                      setOrderSearch('');
                      setOrderStatusFilter('all');
                    }}
                  >
                    Reimposta Filtri
                  </button>
                )}
              </div>
            ) : (
              <div className="admin-orders-cards-stack">
                {filteredOrders.map((order) => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
                  const dateFormatted = new Date(order.createdAt).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={order.id}
                      className={`admin-order-card order-status-border-${order.status || 'pending'}`}
                    >
                      {/* CARD TOPBAR */}
                      <div className="admin-order-card-header">
                        <div className="order-header-left">
                          <span className="order-badge-number">{order.orderNumber}</span>
                          <span className={`order-channel-badge ${order.submissionChannel === 'whatsapp' ? 'badge-wa' : 'badge-direct'}`}>
                            {order.submissionChannel === 'whatsapp' ? 'Inviato via WhatsApp' : 'Registrato dal Sito'}
                          </span>
                          <span className="order-header-date">📅 {dateFormatted}</span>
                        </div>

                        <div className="order-header-right">
                          <div className="order-status-controller">
                            <span className="status-controller-label">Stato Ordine:</span>
                            <select
                              value={order.status || 'pending'}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className={`order-status-dropdown ${statusInfo.badgeClass}`}
                            >
                              <option value="pending">🟡 Nuovo / In Attesa</option>
                              <option value="processing">🔵 In Lavorazione Lab</option>
                              <option value="ready">🟢 Pronto per Ritiro / Spedizione</option>
                              <option value="completed">⚪ Completato / Consegnato</option>
                              <option value="cancelled">🔴 Annullato</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* CARD CONTENT GRID */}
                      <div className="admin-order-card-body">
                        {/* LEFT: CUSTOMER & LOGISTICS INFO */}
                        <div className="order-client-panel">
                          <div className="order-panel-title">👤 Informazioni Cliente & Spedizione</div>
                          
                          <div className="client-info-row">
                            <span className="client-field-label">Cliente:</span>
                            <strong className="client-field-val">{order.customerName || 'Cliente Online'}</strong>
                          </div>

                          {order.customerPhone && (
                            <div className="client-info-row">
                              <span className="client-field-label">Telefono:</span>
                              <div className="client-phone-actions">
                                <a href={`tel:${order.customerPhone}`} className="client-phone-link">
                                  <SvgPhone size={14} />
                                  <span>{order.customerPhone}</span>
                                </a>
                                <button
                                  type="button"
                                  className="btn-quick-wa"
                                  onClick={() => handleContactCustomerWhatsApp(order)}
                                  title="Apri chat WhatsApp con messaggio preimpostato"
                                >
                                  <SvgMessageCircle size={14} />
                                  <span>WhatsApp</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {order.customerEmail && (
                            <div className="client-info-row">
                              <span className="client-field-label">Email:</span>
                              <a href={`mailto:${order.customerEmail}`} className="client-email-link">
                                {order.customerEmail}
                              </a>
                            </div>
                          )}

                          <div className="client-info-row">
                            <span className="client-field-label">Consegna:</span>
                            <div className="delivery-val-wrap">
                              {order.deliveryMethod === 'pickup' ? (
                                <span className="delivery-tag pickup">
                                  🏪 Ritiro in Negozio (Salerno, Gratuito)
                                </span>
                              ) : (
                                <span className="delivery-tag shipping">
                                  🚚 Spedizione a Domicilio
                                </span>
                              )}
                              {order.deliveryMethod === 'delivery' && order.customerAddress && (
                                <div className="customer-shipping-addr">
                                  🏠 <strong>Indirizzo:</strong> {order.customerAddress}
                                </div>
                              )}
                            </div>
                          </div>

                          {order.orderNotes && (
                            <div className="customer-order-notes-box">
                              <span className="notes-tag">📝 Note del Cliente:</span>
                              <p>{order.orderNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* RIGHT: ORDERED PRODUCTS */}
                        <div className="order-items-panel">
                          <div className="order-panel-title">
                            🛒 Articoli Ordinati ({order.items?.length || 0})
                          </div>

                          <div className="order-items-list-table">
                            {(order.items || []).map((item, idx) => (
                              <div key={item.cartId || idx} className="order-item-row">
                                <div className="order-item-visual">
                                  {item.previewThumbnail ? (
                                    <div
                                      className="order-item-thumbnail-clickable"
                                      onClick={() =>
                                        setSelectedPhotoPreview({
                                          src: item.previewThumbnail,
                                          title: item.title,
                                          orderNumber: order.orderNumber
                                        })
                                      }
                                      title="Clicca per ingrandire la foto caricata dal cliente"
                                    >
                                      <img src={item.previewThumbnail} alt={item.title} />
                                      <span className="thumb-zoom-badge">🔍</span>
                                    </div>
                                  ) : (
                                    <div className="order-item-mockup-placeholder">
                                      <ArticleMockupIcon
                                        category={item.category}
                                        mockupType={item.mockupType}
                                        size={28}
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="order-item-details">
                                  <div className="item-title-line">
                                    <strong className="item-name">{item.title}</strong>
                                    <span className="item-qty-badge">x{item.quantity}</span>
                                  </div>
                                  <div className="item-specs-line">
                                    <span className="item-spec"><strong>Formato:</strong> {item.format || 'Standard'}</span>
                                    {item.finish && (
                                      <span className="item-spec"><strong>Carta:</strong> {item.finish}</span>
                                    )}
                                  </div>
                                  {item.notes && (
                                    <div className="item-custom-notes">
                                      💬 <em>"{item.notes}"</em>
                                    </div>
                                  )}
                                  {item.photosCount > 0 && (
                                    <div className="item-photos-count-tag">
                                      📸 {item.photosCount} {item.photosCount === 1 ? 'foto allegata' : 'foto allegate'}
                                    </div>
                                  )}

                                  {(() => {
                                    const photosToShow = (order.allLoadedPhotos && order.allLoadedPhotos.length > 0)
                                      ? order.allLoadedPhotos.filter((p) => !p.itemTitle || p.itemTitle === item.title)
                                      : (item.uploadedPhotos || []);
                                    if (photosToShow.length === 0) return null;
                                    return (
                                      <div className="order-item-photos-strip">
                                        {photosToShow.map((ph, pIdx) => {
                                          const src = ph.dataUrl || ph.src || (typeof ph === 'string' ? ph : null);
                                          if (!src) return null;
                                          return (
                                            <div
                                              key={pIdx}
                                              className="order-item-strip-thumb"
                                              onClick={() =>
                                                setSelectedPhotoPreview({
                                                  src,
                                                  title: `${item.title} (Foto ${pIdx + 1})`,
                                                  orderNumber: order.orderNumber
                                                })
                                              }
                                              title={`Foto ${pIdx + 1}: ${ph.name || ''} - Clicca per ingrandire o scaricare`}
                                            >
                                              <img src={src} alt={ph.name || `Foto ${pIdx + 1}`} />
                                              <span className="strip-thumb-num">{pIdx + 1}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="order-item-pricing">
                                  <span className="item-total-price">
                                    €{((Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                                  </span>
                                  <span className="item-unit-detail">
                                    (€{(Number(item.unitPrice) || 0).toFixed(2)} cad.)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* FINANCIAL RECAP */}
                          <div className="order-financial-recap">
                            <div className="recap-row">
                              <span>Subtotale Prodotti:</span>
                              <span>€{(Number(order.subtotal) || 0).toFixed(2)}</span>
                            </div>
                            {order.deliveryMethod === 'delivery' && (
                              <div className="recap-row">
                                <span>Spedizione:</span>
                                <span>
                                  {order.shippingCost === 0 ? 'GRATIS' : `€${(Number(order.shippingCost) || 0).toFixed(2)}`}
                                </span>
                              </div>
                            )}
                            <div className="recap-row grand-total-row">
                              <span>TOTALE ORDINE:</span>
                              <strong className="recap-grand-total">€{(Number(order.total) || 0).toFixed(2)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CARD FOOTER: INTERNAL LAB NOTES & ACTIONS */}
                      <div className="admin-order-card-footer">
                        <div className="order-admin-notes-area">
                          <label className="admin-notes-label">
                            🗒️ Note Interne Laboratorio (solo uso staff):
                          </label>
                          <div className="admin-notes-input-group">
                            <input
                              type="text"
                              defaultValue={order.adminNotes || ''}
                              placeholder="Es: Carta Satinata 260g pronta, cliente avvisato per il ritiro..."
                              className="admin-notes-input"
                              id={`admin-notes-${order.id}`}
                            />
                            <button
                              type="button"
                              className="btn-save-admin-notes"
                              disabled={savingNoteOrderId === order.id}
                              onClick={() => {
                                const el = document.getElementById(`admin-notes-${order.id}`);
                                if (el) handleSaveOrderAdminNotes(order.id, el.value);
                              }}
                            >
                              {savingNoteOrderId === order.id ? 'Salvataggio...' : 'Salva Nota'}
                            </button>
                          </div>
                        </div>

                        <div className="order-actions-buttons-group">
                          <button
                            type="button"
                            className="btn-order-action btn-order-zip"
                            onClick={() => handleDownloadAllOrderPhotos(order)}
                            disabled={downloadingZipOrderId === order.id}
                            title="Scarica tutte le foto caricate dal cliente in un unico archivio .ZIP pronto per la stampa"
                          >
                            <span>📥</span>
                            <span>
                              {downloadingZipOrderId === order.id
                                ? 'Creazione ZIP in corso...'
                                : (order.allLoadedPhotos?.length > 0
                                    ? `Scarica Tutte le Foto (${order.allLoadedPhotos.length}) in .ZIP`
                                    : 'Scarica Tutte le Foto (.ZIP)')}
                            </span>
                          </button>

                          <button
                            type="button"
                            className="btn-order-action btn-order-wa"
                            onClick={() => handleContactCustomerWhatsApp(order)}
                          >
                            <SvgMessageCircle size={15} />
                            <span>Contatta su WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            className="btn-order-action btn-order-delete"
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            title="Elimina definitivamente l'ordine"
                          >
                            <SvgTrash size={15} />
                            <span>Elimina</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* HIGH-RES PHOTO ZOOM MODAL */}
            {selectedPhotoPreview && createPortal(
              <div
                className="admin-photo-zoom-overlay"
                onClick={() => setSelectedPhotoPreview(null)}
              >
                <div
                  className="admin-photo-zoom-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="photo-zoom-header">
                    <div>
                      <h3>{selectedPhotoPreview.title || 'Foto Articolo'}</h3>
                      <span className="photo-zoom-sub">Ordine: {selectedPhotoPreview.orderNumber}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-photo-zoom-close"
                      onClick={() => setSelectedPhotoPreview(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="photo-zoom-image-wrap">
                    <img
                      src={selectedPhotoPreview.src}
                      alt="Anteprima Foto Alta Risoluzione"
                    />
                  </div>
                  <div className="photo-zoom-actions">
                    <a
                      href={selectedPhotoPreview.src}
                      download={`foto_${selectedPhotoPreview.orderNumber || 'ordine'}.jpg`}
                      className="admin-btn-primary"
                    >
                      📥 Scarica Foto per Stampa Lab
                    </a>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => {
                        const w = window.open('', '_blank');
                        if (!w) return;
                        w.document.write(`<html><head><title>Stampa Foto ${selectedPhotoPreview.orderNumber || ''}</title><style>@page{margin:0;}body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;}img{max-width:100%;max-height:100%;object-fit:contain;}</style></head><body><img src="${selectedPhotoPreview.src}" onload="window.print();" /></body></html>`);
                        w.document.close();
                      }}
                    >
                      🖨️ Stampa Questa Foto
                    </button>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      onClick={() => setSelectedPhotoPreview(null)}
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: GESTIONE E-COMMERCE (WOOCOMMERCE STYLE) */}
        {/* ========================================================================= */}
        {activeTab === 'ecommerce' && (
          <div className="admin-section animate-fade-in">
            {/* Master E-Commerce Visibility Card */}
            <div className={`admin-ecomm-visibility-card ${ecommerceEnabled ? 'status-live' : 'status-hidden'}`}>
              <div className="ecomm-vis-card-left">
                <div className="ecomm-vis-pill">
                  <span className={`ecomm-vis-dot ${ecommerceEnabled ? 'dot-live' : 'dot-off'}`}></span>
                  <strong>{ecommerceEnabled ? "E-COMMERCE ATTIVO & VISIBILE" : "E-COMMERCE ATTUALMENTE NASCOSTO"}</strong>
                </div>
                <h3>{ecommerceEnabled ? "Il negozio online è aperto e visibile sul sito pubblico" : "Il negozio online è nascosto al pubblico"}</h3>
                <p>
                  {ecommerceEnabled
                    ? "La voce 'Shop' e l'icona del carrello sono presenti nella navigazione del sito. I clienti possono esplorare i prodotti e ordinare online."
                    : "L'e-commerce è temporaneamente disattivato per i visitatori: il link 'Shop' e il carrello sono rimossi dal sito. Puoi riattivarlo in qualsiasi momento con un semplice click."}
                </p>
              </div>
              <div className="ecomm-vis-card-right">
                <button
                  type="button"
                  className={`ecomm-toggle-master-btn ${ecommerceEnabled ? 'btn-turn-off' : 'btn-turn-on'}`}
                  onClick={() => handleEcommerceToggle()}
                >
                  {ecommerceEnabled ? "👁️ Nascondi E-Commerce dal Sito" : "✨ Mostra E-Commerce sul Sito"}
                </button>
              </div>
            </div>

            {/* Header Card */}
            <div className="admin-woo-header-card">
              <div className="admin-woo-title-area">
                <div className="admin-woo-icon-badge">🛍️</div>
                <div>
                  <h2 className="admin-woo-title">Gestione Negozio E-Commerce (Stile WooCommerce)</h2>
                  <p className="admin-woo-subtitle">
                    Gestisci i prodotti, imposta prezzi, crea formati personalizzati con sovrapprezzi, configura il tipo di carta e attiva il caricamento foto.
                  </p>
                </div>
              </div>

              <div className="admin-woo-actions-bar">
                <button
                  type="button"
                  className="admin-woo-btn-primary"
                  onClick={handleOpenNewProduct}
                >
                  <span>+ Aggiungi Prodotto</span>
                </button>
                <button
                  type="button"
                  className="admin-woo-btn-secondary"
                  onClick={() => handleSaveAllProducts()}
                  disabled={isSavingProducts}
                >
                  {isSavingProducts ? 'Salvataggio...' : '💾 Salva Catalogo'}
                </button>
                <button
                  type="button"
                  className="admin-woo-btn-outline"
                  onClick={handleRestoreDefaultProducts}
                  title="Ripristina i 14 prodotti ufficiali Foto Extracolor"
                >
                  ↺ Ripristina Predefiniti
                </button>
              </div>
            </div>

            {productFeedback && (
              <div className="admin-woo-feedback-banner animate-slide-up">
                {productFeedback}
              </div>
            )}

            {/* WooCommerce KPI Cards */}
            <div className="admin-woo-kpi-grid">
              <div className="woo-kpi-card">
                <div className="woo-kpi-val">{shopProducts.length}</div>
                <div className="woo-kpi-lbl">Prodotti a Catalogo</div>
              </div>
              <div className="woo-kpi-card">
                <div className="woo-kpi-val">{shopProducts.filter((p) => p.active !== false).length}</div>
                <div className="woo-kpi-lbl">Prodotti Attivi / Visibili</div>
              </div>
              <div className="woo-kpi-card">
                <div className="woo-kpi-val">{shopProducts.filter((p) => p.requiresPhoto).length}</div>
                <div className="woo-kpi-lbl">
                  Con Caricamento Foto <SvgCamera size={13} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                </div>
              </div>
              <div className="woo-kpi-card">
                <div className="woo-kpi-val">{Array.from(new Set(shopProducts.map((p) => p.category))).length}</div>
                <div className="woo-kpi-lbl">Categorie Attive</div>
              </div>
            </div>

            {/* WooCommerce Search & Filter Bar */}
            <div className="admin-woo-toolbar">
              <div className="admin-woo-search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Cerca prodotto per nome, ID o categoria..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="admin-woo-search-input"
                />
                {productSearch && (
                  <button type="button" className="clear-search-btn" onClick={() => setProductSearch('')}>✕</button>
                )}
              </div>

              <div className="admin-woo-filters-group">
                <select
                  value={productCatFilter}
                  onChange={(e) => setProductCatFilter(e.target.value)}
                  className="admin-woo-select"
                >
                  <option value="all">Tutte le Categorie ({shopProducts.length})</option>
                  <option value="prints">Stampe & Poster Lab</option>
                  <option value="photobooks">Fotolibri Artigianali</option>
                  <option value="wallart">Quadri su Tela & Cornici</option>
                  <option value="gadget">Gadget Fotografici</option>
                  <option value="vintage">Pellicole & Laboratorio</option>
                </select>

                <select
                  value={productTypeFilter}
                  onChange={(e) => setProductTypeFilter(e.target.value)}
                  className="admin-woo-select"
                >
                  <option value="all">Tutti i tipi</option>
                  <option value="custom">Richiede Foto (Personalizzabile)</option>
                  <option value="direct">Senza Foto (Pronta Consegna / Servizio)</option>
                </select>

                <select
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                  className="admin-woo-select"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="active">Solo Visibili</option>
                  <option value="hidden">Solo Nascosti</option>
                </select>
              </div>

              {/* View Switcher: Table vs 3D Carousel Sequencer */}
              <div className="admin-woo-view-switch">
                <button
                  type="button"
                  className={`woo-view-tab-btn ${productViewMode === 'carousel' ? 'active' : ''}`}
                  onClick={() => setProductViewMode('carousel')}
                  title="Decidi e riordina visivamente la sequenza del Carosello 3D"
                >
                  🎠 Ordine Carosello 3D
                </button>
                <button
                  type="button"
                  className={`woo-view-tab-btn ${productViewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setProductViewMode('table')}
                  title="Visualizza come tabella con tutti i dettagli"
                >
                  📋 Tabella
                </button>
              </div>

              {/* Prominent Add Product Button right in the toolbar */}
              <button
                type="button"
                className="woo-btn-add-primary"
                onClick={handleOpenNewProduct}
                title="Crea un nuovo articolo nel catalogo"
              >
                <SvgPlus size={16} />
                <span>+ Nuovo Prodotto</span>
              </button>
            </div>

            {/* VISUAL 3D CAROUSEL SEQUENCER VIEW */}
            {productViewMode === 'carousel' ? (
              <div className="woo-carousel-sequencer-wrapper">
                <div className="woo-sequencer-banner">
                  <div className="sequencer-banner-content">
                    <span className="sequencer-banner-icon">🎠</span>
                    <div>
                      <strong>Ordinamento Rapido Carosello 3D</strong>
                      <p>
                        <strong>Tre metodi rapidi:</strong> 1) <strong>Trascina e rilascia</strong> le card col mouse (Drag &amp; Drop). 2) Scegli la <strong>posizione esatta</strong> dal menu a tendina. 3) Clicca <strong>⭐ Metti #1</strong> per portare qualsiasi prodotto subito in primo piano!
                      </p>
                    </div>
                  </div>
                  <div className="sequencer-banner-badge">
                    <span>{shopProducts.length} Prodotti a Catalogo</span>
                  </div>
                </div>

                <div className="woo-sequencer-grid">
                  {filteredShopProducts.map((p) => {
                    const globalIdx = shopProducts.findIndex((item) => item.id === p.id);
                    const isActive = p.active !== false;
                    const isDraggingThis = draggedProductIndex === globalIdx;
                    const isOverThis = dragOverProductIndex === globalIdx && !isDraggingThis;

                    return (
                      <div
                        key={p.id}
                        className={`woo-sequencer-card ${globalIdx === 0 ? 'is-first' : ''} ${!isActive ? 'is-inactive' : ''} ${isDraggingThis ? 'is-dragging' : ''} ${isOverThis ? 'drag-over' : ''}`}
                        draggable={true}
                        onDragStart={(e) => handleProductDragStart(e, globalIdx)}
                        onDragOver={(e) => handleProductDragOver(e, globalIdx)}
                        onDrop={(e) => handleProductDrop(e, globalIdx)}
                        onDragEnd={handleProductDragEnd}
                      >
                        <div className="sequencer-card-top">
                          <div className="sequencer-drag-handle" title="Trascina per spostare">
                            <span>⠿</span>
                            <span className="drag-label">Trascina</span>
                          </div>
                          <span className={`sequencer-status-pill ${isActive ? 'active' : 'hidden'}`}>
                            {isActive ? 'Attivo' : 'Nascosto'}
                          </span>
                        </div>

                        {/* Direct Fast Position Dropdown + Top #1 Button */}
                        <div className="sequencer-fast-pos-row">
                          <div className="fast-pos-badge">
                            <span className="fast-pos-label">Pos:</span>
                            <select
                              className="fast-pos-select"
                              value={globalIdx + 1}
                              onChange={(e) => handleSetProductPosition(p.id, e.target.value)}
                              title="Seleziona la posizione esatta dal menu"
                            >
                              {shopProducts.map((_, idx) => (
                                <option key={idx + 1} value={idx + 1}>
                                  #{idx + 1} {idx === 0 ? '★ In Primo Piano' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                          {globalIdx !== 0 && (
                            <button
                              type="button"
                              className="fast-top-btn"
                              onClick={() => handleMoveProductToEdge(p.id, 'first')}
                              title="Porta subito in 1ª posizione"
                            >
                              <SvgStar size={12} /> Vetrina #1
                            </button>
                          )}
                        </div>

                        <div
                          className="sequencer-mockup-area"
                          onClick={() => handleOpenEditProduct(p)}
                          style={{ cursor: 'pointer' }}
                          title="Clicca per modificare questo articolo"
                        >
                          <ArticleMockupIcon
                            product={p}
                            size={44}
                            className="sequencer-mockup-visual"
                          />
                        </div>

                        <div
                          className="sequencer-info"
                          onClick={() => handleOpenEditProduct(p)}
                          style={{ cursor: 'pointer' }}
                          title="Clicca per modificare questo articolo"
                        >
                          <h4 className="sequencer-title">{p.titleIt}</h4>
                          <span className="sequencer-cat">{getCategoryLabel(p.category, 'it')}</span>
                          <span className="sequencer-price">€{p.basePrice?.toFixed(2) || '0.00'}</span>
                        </div>

                        {/* Dedicated Prominent Edit Article Button */}
                        <button
                          type="button"
                          className="sequencer-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditProduct(p);
                          }}
                          title="Modifica prezzi, foto, varianti e dettagli articolo"
                        >
                          <SvgEdit size={14} />
                          <span>Modifica Articolo</span>
                        </button>

                        {/* Extra Actions: Duplicate & Delete */}
                        <div className="sequencer-card-extra-actions">
                          <button
                            type="button"
                            className="seq-extra-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateProduct(p);
                            }}
                            title="Duplica questo prodotto"
                          >
                            <SvgCopy size={13} />
                            <span>Duplica</span>
                          </button>
                          <button
                            type="button"
                            className="seq-extra-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(p.id);
                            }}
                            title="Elimina questo prodotto"
                          >
                            <SvgTrash size={13} />
                            <span>Elimina</span>
                          </button>
                        </div>

                        <div className="sequencer-controls">
                          <button
                            type="button"
                            className="seq-btn"
                            onClick={() => handleMoveProduct(p.id, 'up')}
                            disabled={globalIdx === 0}
                            title="Sposta una posizione a sinistra"
                          >
                            ◀ Prima
                          </button>
                          <button
                            type="button"
                            className="seq-btn"
                            onClick={() => handleMoveProduct(p.id, 'down')}
                            disabled={globalIdx === shopProducts.length - 1}
                            title="Sposta una posizione a destra"
                          >
                            Dopo ▶
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* WooCommerce Products Table */
              <div className="admin-woo-table-container">
                <table className="admin-woo-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60, textAlign: 'center' }}>Stato</th>
                      <th style={{ width: 140, textAlign: 'center' }}>Posizione Carosello</th>
                      <th>Prodotto</th>
                      <th>Categoria</th>
                      <th>Prezzo Base</th>
                      <th>Formati / Varianti</th>
                      <th>Tipo Carta</th>
                      <th>Caricamento Foto</th>
                      <th style={{ textAlign: 'right', width: 140 }}>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShopProducts.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="woo-empty-td">
                          Nessun prodotto trovato corrispondente ai filtri.
                        </td>
                      </tr>
                    ) : (
                      filteredShopProducts.map((p) => {
                        const globalIdx = shopProducts.findIndex((item) => item.id === p.id);
                        const isActive = p.active !== false;
                        const catLabel = getCategoryLabel(p.category, 'it');
                        const formatsCount = p.formats?.length || 0;
                        const hasFinishes = p.finishes && p.finishes.length > 0;
                        const isDraggingThis = draggedProductIndex === globalIdx;
                        const isOverThis = dragOverProductIndex === globalIdx && !isDraggingThis;

                        return (
                          <tr
                            key={p.id}
                            className={`${!isActive ? 'row-inactive' : ''} ${isDraggingThis ? 'row-dragging' : ''} ${isOverThis ? 'row-drag-over' : ''}`}
                            draggable={true}
                            onDragStart={(e) => handleProductDragStart(e, globalIdx)}
                            onDragOver={(e) => handleProductDragOver(e, globalIdx)}
                            onDrop={(e) => handleProductDrop(e, globalIdx)}
                            onDragEnd={handleProductDragEnd}
                          >
                            {/* Visibility Toggle */}
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className={`woo-status-toggle ${isActive ? 'is-active' : 'is-hidden'}`}
                                onClick={() => handleToggleProductActive(p.id)}
                                title={isActive ? "Prodotto Attivo (clicca per nascondere)" : "Prodotto Nascosto (clicca per attivare)"}
                              >
                                {isActive ? '●' : '○'}
                              </button>
                            </td>

                            {/* Order in Carousel */}
                            <td style={{ textAlign: 'center' }}>
                              <div className="woo-order-controls">
                                <span className="woo-drag-handle-grip" title="Trascina per ordinare">⠿</span>
                                <select
                                  className="woo-order-select"
                                  value={globalIdx + 1}
                                  onChange={(e) => handleSetProductPosition(p.id, e.target.value)}
                                  title="Seleziona la posizione esatta nel carosello"
                                >
                                  {shopProducts.map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                      #{i + 1} {i === 0 ? '★' : ''}
                                    </option>
                                  ))}
                                </select>
                                <div className="woo-order-arrows">
                                  <button
                                    type="button"
                                    className="woo-order-arrow-btn"
                                    onClick={() => handleMoveProduct(p.id, 'up')}
                                    disabled={globalIdx === 0}
                                    title="Sposta prima nel carosello (▲)"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    className="woo-order-arrow-btn"
                                    onClick={() => handleMoveProduct(p.id, 'down')}
                                    disabled={globalIdx === shopProducts.length - 1}
                                    title="Sposta dopo nel carosello (▼)"
                                  >
                                    ▼
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* Product Info */}
                            <td>
                              <div className="woo-prod-cell">
                                <div className="woo-prod-mockup-icon">
                                  <ArticleMockupIcon
                                    product={p}
                                    size={24}
                                    className="woo-table-mockup-visual"
                                  />
                                </div>
                                <div>
                                  <strong className="woo-prod-title">{p.titleIt}</strong>
                                  <span className="woo-prod-en-sub">{p.titleEn}</span>
                                  <div className="woo-prod-meta-badges">
                                    <span className="woo-sku-tag">ID: {p.id}</span>
                                    {p.badge && <span className="woo-badge-tag">{p.badge}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td>
                              <span className="woo-category-pill">{catLabel}</span>
                            </td>

                            {/* Base Price */}
                            <td>
                              <div className="woo-price-cell">
                                <span className="woo-price-val">€{p.basePrice?.toFixed(2) || '0.00'}</span>
                              </div>
                            </td>

                            {/* Formats / Variants */}
                            <td>
                              <span className="woo-formats-badge">
                                {formatsCount} variant{formatsCount === 1 ? 'e' : 'i'}
                              </span>
                            </td>

                            {/* Paper Finishes */}
                            <td>
                              {hasFinishes ? (
                                <span className="woo-paper-badge">
                                  {p.finishes.join(', ')}
                                </span>
                              ) : (
                                <span className="woo-paper-none">—</span>
                              )}
                            </td>

                            {/* Photo upload flag */}
                            <td>
                              {p.requiresPhoto ? (
                                <span className="woo-photo-pill yes">
                                  <SvgCamera size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                  Richiesta
                                </span>
                              ) : (
                                <span className="woo-photo-pill no">
                                  <SvgBox size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                                  Nessuna
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td style={{ textAlign: 'right' }}>
                              <div className="woo-row-actions">
                                <button
                                  type="button"
                                  className="woo-action-btn edit"
                                  onClick={() => handleOpenEditProduct(p)}
                                  title="Modifica prezzi, foto e formati prodotto"
                                >
                                  <SvgEdit size={14} />
                                  <span>Modifica</span>
                                </button>
                                <button
                                  type="button"
                                  className="woo-action-btn copy"
                                  onClick={() => handleDuplicateProduct(p)}
                                  title="Duplica Prodotto"
                                >
                                  <SvgCopy size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="woo-action-btn delete"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  title="Elimina Prodotto"
                                >
                                  <SvgTrash size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* WOOCOMMERCE PRODUCT EDITOR MODAL */}
            {editingProduct && (
              <ProductEditorModal
                product={editingProduct}
                isNew={isNewProduct}
                onClose={() => setEditingProduct(null)}
                onSave={handleSaveModalProduct}
              />
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
