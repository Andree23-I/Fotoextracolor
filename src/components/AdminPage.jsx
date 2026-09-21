import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './AdminPage.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const [pageMode, setPageMode] = useState(() => {
    return localStorage.getItem('fotoextracolor_page_mode') || 'chisiamo';
  });
  const [modeFeedback, setModeFeedback] = useState('');
  const [categories, setCategories] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const [servicesData, setServicesData] = useState({it: [], en: []});
  const [editingLang, setEditingLang] = useState('it');
  
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
        if (data && data.pageMode) {
          setPageMode(data.pageMode);
          localStorage.setItem('fotoextracolor_page_mode', data.pageMode);
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('fotoextracolor_page_mode');
        if (saved) setPageMode(saved);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api.php?action=verifyPassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        alert("Password errata!");
      }
    } catch (err) {
      alert("Errore di connessione al server per la verifica della password.");
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

  if (!isAuthenticated) {
    return (
      <div className="admin-page-container admin-login-wrapper">
        <form onSubmit={handleLogin} className="admin-section admin-login-card">
          <h2>Accesso Riservato</h2>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="admin-input admin-login-input"
            placeholder="Inserisci la password"
          />
          <button type="submit" className="admin-btn-primary admin-login-btn">Entra</button>
        </form>
      </div>
    );
  }

  const activeVisitorsCount = analyticsData.stats?.activeCount || (analyticsData.activeVisitors || []).length;

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div className="admin-header-main">
          <h1>Pannello di Amministrazione</h1>
          <p>Gestisci le pagine, le immagini, i servizi e monitora i visitatori del sito in tempo reale</p>
        </div>
        <div className="admin-header-live-badge">
          <span className="live-pulse-dot"></span>
          <span>{activeVisitorsCount} {activeVisitorsCount === 1 ? 'Utente Online' : 'Utenti Online'}</span>
        </div>
      </div>

      {modeFeedback && (
        <div className="admin-alert-banner">
          <span>{modeFeedback}</span>
        </div>
      )}

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Monitoraggio & Visitatori
          {activeVisitorsCount > 0 && (
            <span className="admin-tab-counter-badge">{activeVisitorsCount}</span>
          )}
        </button>
        <button 
          className={`admin-tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          💬 Chat dal Vivo
        </button>
        <button 
          className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Scelta Pagina ({pageMode === 'chisiamo' ? 'Chi Siamo' : 'Portfolio'})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          🖼️ Gestione Galleria / Portfolio
        </button>
        <button 
          className={`admin-tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => setActiveTab('services')}
        >
          🛠️ Gestione Servizi
        </button>
      </div>

      <div className="admin-content">
        {/* ========================================================================= */}
        {/* TAB: CHAT DAL VIVO */}
        {/* ========================================================================= */}
        {activeTab === 'chats' && (
          <div className="admin-section animate-fade-in">
            <h2>Storico Chatbot</h2>
            <div className="admin-card">
              <div className="admin-card-header">
                <h3>Conversazioni Registrate</h3>
                <button className="admin-btn-secondary" onClick={fetchChats} disabled={isChatsLoading}>
                  {isChatsLoading ? 'Aggiornamento...' : '🔄 Aggiorna'}
                </button>
              </div>
              <div className="admin-card-body">
                {chatsData.length === 0 ? (
                  <div className="empty-state">
                    <p>Nessuna chat registrata finora.</p>
                  </div>
                ) : (
                  <div className="chats-list">
                    {chatsData.map(chat => (
                      <div key={chat.sessionId} className="chat-session-card" style={{ border: '1px solid #eaeaea', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                        <div className="chat-session-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eaeaea', paddingBottom: '10px' }}>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>👤 Utente: {chat.userName}</strong>
                          <span style={{ fontSize: '0.85rem', color: '#666' }}>Iniziata: {new Date(chat.startTime).toLocaleString('it-IT')}</span>
                        </div>
                        <div className="chat-messages-container" style={{ background: '#f9f9f9', padding: '10px', borderRadius: '6px', maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {chat.messages && chat.messages.map((msg, i) => (
                            <div key={i} style={{ 
                              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                              background: msg.sender === 'user' ? 'var(--primary)' : '#e0e0e0',
                              color: msg.sender === 'user' ? '#fff' : '#333',
                              padding: '8px 12px',
                              borderRadius: '12px',
                              maxWidth: '80%',
                              fontSize: '0.9rem'
                            }}>
                              {msg.text}
                              <div style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.7, textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                                {new Date(msg.timestamp).toLocaleTimeString('it-IT')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  Ideale per un sito web vetrina. Racconta oltre 60 anni di storia di Foto Extracolor, la fondazione di Riccardo Capasso & Gabriela Donadio, la presentazione dello staff, i valori aziendali e l'archivio storico.
                </p>
                <ul className="admin-mode-perks">
                  <li>✓ Storia & Origini del laboratorio</li>
                  <li>✓ Presentazione approfondita dello Staff</li>
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
      </div>
    </div>
  );
}
