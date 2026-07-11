import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import "./index.css";
import Lightbox from "./components/Lightbox.jsx";
import Carousel from "./components/Carousel.jsx";
import logo from "./assets/logo.jpeg";
import heroPhoto from "./assets/scuro.jpeg";
import lightHeroPhoto from "./assets/chiaro.jpeg";
import atelierPhoto from "./assets/hero_background.jpg";

// Link to the Foto Extracolor Google reviews / business panel.
const GOOGLE_REVIEWS_URL =
  "https://www.google.com/search?sca_esv=8661daf777ee415a&sxsrf=APpeQnuqdGqvpnmCq3QuvioBa8MfLRjH7A:1783171221322&q=foto+extracolor+salerno&si=APenkKnzv9m99ToiohAuzpadUwbOz34nZJ3j2Ukmo5XOUYWApuf1uLXXcDF8O4ULOaCSNh17t3bKbcvpQWNbpOSyRlTBOK-xLaxSaVEA6rn1eWVSvxkfsi0%3D&uds=AJ5uw1-SFE1ME9tIqnlIOIWp9Jjqv6n6AyWmrSP6hXkGDqBYBKIKI1-5RQwsdUk_mX9F5-2JY3kYmPV1OG4lUYodH3HP4E4qRRkkkIII1ai8R5VbwxEI55R8eufusxuIpSNZMsXYodiR&sa=X&ved=2ahUKEwiTruG5jrmVAxWCnP0HHbW4IhwQ3PALegQIHRAE&biw=1870&bih=919&dpr=1";
const GOOGLE_RATING = 4.5;
const GOOGLE_RATING_LABEL = "4,5";
const PAGE_TRANSITION_DURATION = 1200;

function renderStoryText(text, ...highlightNames) {
  if (!text) return null;

  const escapedNames = highlightNames.map((name) =>
    name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = new RegExp(`(${escapedNames.join("|")})`, "g");

  return text.split(pattern).map((part, index) => {
    const isHighlighted = highlightNames.some((name) => part === name);

    return isHighlighted ? (
      <span key={`${part}-${index}`} className="story-highlight">
        {part}
      </span>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
}

const translations = {
  it: {
    nav: {
      home: "Home",
      servizi: "Servizi",
      portfolio: "Portfolio",
      contatti: "Contatti",
      language: "Lingua",
      dark: "Scuro",
      light: "Chiaro",
    },
    reviews: {
      title: "Recensioni Google",
      description: "Scopri cosa dicono di noi i nostri clienti su Google.",
      cta: "Leggi le recensioni",
    },
    home: {
      kicker: "Studio Fotografico a Salerno",
      heroTitle: "Catturiamo l'Essenza dei Tuoi Ricordi.",
      heroText: "Da 60 anni, il punto di riferimento per la fotografia a Salerno.",
      heroCta: "Vieni a Trovarci",
      heroPrint: "Invia le foto da stampare su WhatsApp",
      scrollLabel: "Scorri per saperne di più",
      storyTitle: "Un pò di storia",
      storyText1:
        "Tutto ha inizio dalla passione pura di Riccardo Capasso, che muove i suoi primi passi tra scatti in esterni e lunghe ore artigianali in camera oscura. Ben presto, quel sogno si trasforma in una solida realtà a due grazie a Gabriela Donadio, che diventa il volto accogliente del negozio, gestendo con eleganza il bancone e gli scaffali colmi di storici rullini in un'attività dove anche i figli crescono respirando l'arte della pellicola.",
      storyText2:
        "Con il passare degli anni, il laboratorio si evolve: la camera oscura lascia il posto ai grandi macchinari industriali a sviluppo rapido, fino ad abbracciare la rivoluzione della fotografia digitale, accogliendo pixel, computer e nuove tecnologie per continuare a stampare i ricordi del tempo moderno. Oggi, con il suo camice da laboratorio, Riccardo conserva lo stesso sguardo fiero di sempre, testimone di una vita dedicata a dare forma e colore alle storie delle persone, dalle pellicole al digitale.",
      servicesKicker: "Servizi",
      servicesTitle: "Cosa Offriamo",
      servicesText:
        "Dalla stampa professionale ai gadget personalizzati, passando per matrimoni con riprese drone, eventi e conversioni da VHS a digitale.",
      servicesCta: "Scopri Tutti i Servizi",
      staffKicker: "Il Team",
      staffTitle: "Il Nostro Staff",
      contactTitle: "Vieni a Trovarci",
      addressLabel: "Indirizzo:",
      phoneLabel: "Telefono:",
      mapTitle: "Google Maps Posizione",
    },
    services: {
      pageKicker: "Servizi",
      pageTitle: "Cosa Facciamo",
      pageText:
        "Dalla stampa professionale ai ricordi su pellicola, fino ai gadget personalizzati: tutto quello che serve per dare forma ai tuoi momenti più importanti.",
    },
    portfolio: {
      pageKicker: "Portfolio",
      pageTitle: "I Nostri Scatti",
      pageText:
        "Un viaggio tra le storie che abbiamo raccontato attraverso l'obiettivo, dai grattacieli di New York ai momenti più intimi dei matrimoni.",
      newYork: "New York",
      events: "Eventi",
      countLabel: "scatti",
      altPrefix: "Scatto",
    },
    footer: {
      rights: "Tutti i diritti riservati.",
    },
  },
  en: {
    nav: {
      home: "Home",
      servizi: "Services",
      portfolio: "Portfolio",
      contatti: "Contact",
      language: "Language",
      dark: "Dark",
      light: "Light",
    },
    reviews: {
      title: "Google Reviews",
      description: "Discover what our clients say about us on Google.",
      cta: "Read the reviews",
    },
    home: {
      kicker: "Photography Studio in Salerno",
      heroTitle: "We Capture the Essence of Your Memories.",
      heroText: "A trusted reference for photography in Salerno for 60 years.",
      heroCta: "Visit Us",
      heroPrint: "Send the photos to print on WhatsApp",
      scrollLabel: "Scroll to learn more",
      storyTitle: "A bit of history",
      storyText1:
        "Everything begins with the pure passion of Riccardo Capasso, who takes his first steps among outdoor shots and long hours of craftsmanship in the darkroom. Soon, that dream becomes a solid reality with Gabriela Donadio, who becomes the welcoming face of the shop, elegantly managing the counter and shelves full of historic rolls in a business where even the children grow up breathing the art of film.",
      storyText2:
        "Over the years, the lab evolves: the darkroom gives way to large industrial machines for rapid development, until it embraces the revolution of digital photography, welcoming pixels, computers, and new technologies to continue printing the memories of modern times. Today, with his laboratory coat, Riccardo keeps the same proud gaze as ever, a witness to a life dedicated to giving shape and color to people's stories, from film to digital.",
      servicesKicker: "Services",
      servicesTitle: "What We Offer",
      servicesText:
        "From professional printing to personalized gadgets, including weddings with drone footage, events, and VHS to digital conversions.",
      servicesCta: "Discover All Services",
      staffKicker: "The Team",
      staffTitle: "Our Staff",
      contactTitle: "Come Visit Us",
      addressLabel: "Address:",
      phoneLabel: "Phone:",
      mapTitle: "Google Maps Location",
    },
    services: {
      pageKicker: "Services",
      pageTitle: "What We Do",
      pageText:
        "From professional printing to film memories, to personalized gadgets: everything you need to give shape to your most important moments.",
    },
    portfolio: {
      pageKicker: "Portfolio",
      pageTitle: "Our Shots",
      pageText:
        "A journey through the stories we have told through the lens, from the skyscrapers of New York to the most intimate moments of weddings.",
      newYork: "New York",
      events: "Events",
      countLabel: "shots",
      altPrefix: "Shot",
    },
    footer: {
      rights: "All rights reserved.",
    },
  },
};

function GoogleLogo(props) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="22"
      height="22"
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      ></path>
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.9-2.26 5.35-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      ></path>
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      ></path>
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      ></path>
    </svg>
  );
}

function GoogleReviewsWidget({ className = "", content }) {
  const fillPercent = (GOOGLE_RATING / 5) * 100;

  return (
    <aside
      className={`reviews-widget fade-in ${className}`.trim()}
      aria-label={content?.title || "Recensioni Google"}
    >
      <div className="reviews-widget-header">
        <GoogleLogo />
        <span>{content?.title || "Recensioni Google"}</span>
      </div>
      <div className="reviews-score-row">
        <span className="reviews-score">{GOOGLE_RATING_LABEL}</span>
        <div
          className="reviews-stars"
          aria-label={`Valutazione ${GOOGLE_RATING_LABEL} su 5 stelle`}
        >
          <div className="stars-base" aria-hidden="true">
            &#9733;&#9733;&#9733;&#9733;&#9733;
          </div>
          <div
            className="stars-fill"
            aria-hidden="true"
            style={{ width: `${fillPercent}%` }}
          >
            &#9733;&#9733;&#9733;&#9733;&#9733;
          </div>
        </div>
      </div>
      <p className="reviews-widget-text">
        {content?.description || "Scopri cosa dicono di noi i nostri clienti su Google."}
      </p>
      <a
        href={GOOGLE_REVIEWS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary reviews-cta"
      >
        {content?.cta || "Leggi le recensioni"}
      </a>
    </aside>
  );
}

function Navigation({ language, setLanguage, theme, toggleTheme, content }) {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, "") || "/";
  const isHome = pathname === "/" && !location.hash;
  const isServizi = pathname === "/servizi";
  const isPortfolio = pathname === "/portfolio";
  const isContact = location.hash === "#contatti";
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
    return () => document.body.classList.remove("nav-open");
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const goToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    closeMenu();
  };
  const goToContact = () => {
    closeMenu();
    if (isContact) {
      document
        .getElementById("contatti")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link
          to="/"
          style={{ color: "inherit", textDecoration: "none" }}
          onClick={goToTop}
        >
          <img src={logo} alt="Foto Extracolor" className="logo-image" />
        </Link>
      </div>
      <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
        <li>
          <Link to="/" className={isHome ? "active" : ""} onClick={goToTop}>
            {content.nav.home}
          </Link>
        </li>
        <li>
          <Link
            to="/servizi"
            className={isServizi ? "active" : ""}
            onClick={goToTop}
          >
            {content.nav.servizi}
          </Link>
        </li>
        <li>
          <Link
            to="/portfolio"
            className={isPortfolio ? "active" : ""}
            onClick={goToTop}
          >
            {content.nav.portfolio}
          </Link>
        </li>
        <li>
          <Link
            to={{ pathname: "/", hash: "#contatti" }}
            className={isContact ? "active" : ""}
            onClick={goToContact}
          >
            {content.nav.contatti}
          </Link>
        </li>
      </ul>
      <div className="nav-controls">
        <div className="lang-switch" role="group" aria-label={content.nav.language}>
          <button
            type="button"
            className={language === "it" ? "active" : ""}
            onClick={() => setLanguage("it")}
          >
            IT
          </button>
          <button
            type="button"
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>
        </div>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? content.nav.light : content.nav.dark}
        >
          <span>{theme === "dark" ? "☀︎" : "☾"}</span>
          <span>{theme === "dark" ? content.nav.light : content.nav.dark}</span>
        </button>
      </div>
      <button
        type="button"
        className={`nav-toggle ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((open) => !open)}
        aria-label={menuOpen ? "Chiudi il menu" : "Apri il menu"}
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}

function getPageTransitionMeta(pathname, hash, content) {
  pathname = pathname.replace(/\/+$/, "") || "/";

  if (hash === "#contatti") {
    return { label: content.nav.contatti, index: 3 };
  }

  if (pathname === "/servizi") {
    return { label: content.nav.servizi, index: 1 };
  }

  if (pathname === "/portfolio") {
    return { label: content.nav.portfolio, index: 2 };
  }

  return { label: content.nav.home, index: 0 };
}

function PageTransition({ content }) {
  const location = useLocation();
  const contentRef = useRef(content);
  const hasMounted = useRef(false);
  const previousMeta = useRef(
    getPageTransitionMeta(location.pathname, location.hash, content),
  );
  const previousKey = useRef(location.key);
  const timerRef = useRef(null);
  const [transition, setTransition] = useState({
    active: false,
    direction: 1,
    label: previousMeta.current.label,
    token: 0,
  });

  useLayoutEffect(() => {
    contentRef.current = content;
  }, [content]);

  useLayoutEffect(() => {
    const pageKey = location.key;
    const nextMeta = getPageTransitionMeta(
      location.pathname,
      location.hash,
      contentRef.current,
    );

    if (!hasMounted.current) {
      hasMounted.current = true;
      previousKey.current = pageKey;
      previousMeta.current = nextMeta;
      return undefined;
    }

    if (previousKey.current === pageKey) {
      previousMeta.current = nextMeta;
      setTransition((current) => ({ ...current, label: nextMeta.label }));
      return undefined;
    }

    const direction = nextMeta.index >= previousMeta.current.index ? 1 : -1;
    window.clearTimeout(timerRef.current);
    setTransition((current) => ({
      active: true,
      direction,
      label: nextMeta.label,
      token: current.token + 1,
    }));

    timerRef.current = window.setTimeout(() => {
      setTransition((current) => ({ ...current, active: false }));
    }, PAGE_TRANSITION_DURATION);

    previousKey.current = pageKey;
    previousMeta.current = nextMeta;

    return () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [location.hash, location.key, location.pathname]);

  useEffect(() => {
    const nextMeta = getPageTransitionMeta(
      location.pathname,
      location.hash,
      content,
    );
    previousMeta.current = nextMeta;
    setTransition((current) =>
      current.label === nextMeta.label
        ? current
        : { ...current, label: nextMeta.label },
    );
  }, [content, location.hash, location.pathname]);

  return (
    <div
      className={`route-transition ${transition.active ? "is-active" : ""}`}
      aria-hidden="true"
      style={{ "--transition-direction": transition.direction }}
    >
      <div className="route-transition-scene" key={transition.token}>
        <div className="transition-lens">
          <span></span>
        </div>
        <span className="transition-label">{transition.label}</span>
      </div>
    </div>
  );
}

function ScrollToHash() {
  const location = useLocation();

  useLayoutEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      document
        .getElementById(location.hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash, location.key, location.pathname]);

  return null;
}

function RoutedContent({ content, language, theme }) {
  const location = useLocation();

  return (
    <main className="page-content route-page" key={location.key}>
      <Routes>
        <Route path="/" element={<Home content={content} language={language} theme={theme} />} />
        <Route path="/servizi" element={<Servizi content={content} language={language} />} />
        <Route path="/portfolio" element={<Portfolio content={content} language={language} />} />
      </Routes>
    </main>
  );
}

function Home({ content, language, theme }) {
  // Load Storia images - use exact same pattern as Portfolio
  const storiaImages = Object.values(
    import.meta.glob("/src/assets/Photos/Storia/**/*.{jpg,jpeg,png}", {
      eager: true,
      query: "?url",
      import: "default",
    }),
  );

  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((el) => el.classList.remove("visible"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [language]);

  // Load staff avatars from either /src/assets/staff or existing
  // /src/assets/Photos/Staff — filenames should include the first name
  // (e.g. carmen.jpg, chiara.jpg, annalisa.jpg).
  const staffGlobs = import.meta.glob(
    [
      "/src/assets/staff/*.{jpg,jpeg,png}",
      "/src/assets/Photos/Staff/*.{jpg,jpeg,png}",
    ],
    { eager: true, query: "?url", import: "default" },
  );

  const staffImageMap = {};
  Object.entries(staffGlobs).forEach(([path, url]) => {
    const fname = path.split("/").pop().toLowerCase();
    staffImageMap[fname] = url;
  });

  return (
    <>
      <div
        className="page-backdrop"
        style={{ backgroundImage: `url(${atelierPhoto})` }}
        aria-hidden="true"
      ></div>

      <header
        className="hero"
        style={{
          backgroundImage:
            theme === "dark"
              ? `linear-gradient(135deg, rgba(17, 17, 17, 0.55), rgba(17, 17, 17, 0.7)), url(${heroPhoto})`
              : `linear-gradient(135deg, rgba(8, 8, 8, 0.18), rgba(8, 8, 8, 0.34)), url(${lightHeroPhoto})`,
        }}
      >
        <div className="hero-inner">
          <div className="hero-content fade-in">
            <span className="section-kicker">{content.home.kicker}</span>
            <h1 className="hero-text-effect">{content.home.heroTitle}</h1>
            <p className="hero-text-effect">{content.home.heroText}</p>
            <Link
              to={{ pathname: "/", hash: "#contatti" }}
              className="btn-primary"
            >
              {content.home.heroCta}
            </Link>
            <a
              href="https://wa.me/393246687521"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-print-box"
            >
              <span>📷</span>
              <span>{content.home.heroPrint}</span>
            </a>
          </div>
        </div>
        <a
          href="#storia"
          className="scroll-indicator"
          aria-label={content.home.scrollLabel}
        >
          <span></span>
        </a>
      </header>

      <section id="storia" className="story-section">
        <div className="section-content">
          <div className="text-content fade-in">
            <h2>{content.home.storyTitle}</h2>
            <p>{renderStoryText(content.home.storyText1, "Riccardo Capasso", "Gabriela Donadio")}</p>
            <p>{renderStoryText(content.home.storyText2, "Riccardo")}</p>
          </div>
          <div className="image-content fade-in">
            <Carousel images={storiaImages} />
          </div>
        </div>
      </section>

      <section id="servizi" className="services-preview">
        <span className="section-kicker fade-in">{content.home.servicesKicker}</span>
        <h2 className="fade-in">{content.home.servicesTitle}</h2>
        <p className="services-preview-text fade-in">
          {content.home.servicesText}
        </p>
        <div className="services-preview-grid">
          {SERVICES[language].map((service, idx) => {
            const Icon = service.icon;
            return (
              <div
                className="service-chip fade-in"
                key={service.title}
                style={{ transitionDelay: `${(idx % 6) * 0.06}s` }}
              >
                <span className="service-chip-icon">
                  <Icon />
                </span>
                <span>{service.title}</span>
              </div>
            );
          })}
        </div>
        <Link to="/servizi" className="btn-secondary">
          {content.home.servicesCta}
        </Link>
      </section>

      <section id="staff" className="staff-section">
        <span className="section-kicker fade-in">{content.home.staffKicker}</span>
        <h2 className="fade-in">{content.home.staffTitle}</h2>
        <div className="staff-grid">
            {(() => {
              const getStaffImage = (name) => {
                const first = name.split(" ")[0].toLowerCase();
                const key = Object.keys(staffImageMap).find((k) =>
                  k.includes(first),
                );
                return key ? staffImageMap[key] : null;
              };

              return STAFF[language].map((member) => {
                const img = getStaffImage(member.name);
                return (
                  <div className="staff-card fade-in" key={member.name}>
                    {img ? (
                      <div className="staff-avatar" aria-hidden="true">
                        <img
                          src={img}
                          alt={member.name}
                          className="staff-avatar-img"
                        />
                      </div>
                    ) : (
                      <div className="staff-avatar" aria-hidden="true">
                        {member.name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")}
                      </div>
                    )}
                    <h3>{member.name}</h3>
                    <p>Foto Extracolor</p>
                  </div>
                );
              });
            })()}
        </div>
      </section>

      <section id="contatti" className="contact-section fade-in">
        <h2>{content.home.contactTitle}</h2>
        <div className="contact-container">
          <div className="contact-box">
            <div className="info">
              <h3>Foto Extracolor</h3>
              <p>
                <strong>{content.home.addressLabel}</strong> Via Raffaele Ricci 62, Salerno (SA)
              </p>
              <p>
                <strong>{content.home.phoneLabel}</strong> +39 089 7523 54
              </p>
              <div className="contact-icons">
                <a
                  href="mailto:info@fotoextracolor.com"
                  className="contact-icon"
                  title="Email"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>info@fotoextracolor.com</span>
                </a>
                <a
                  href="https://wa.me/393246687521"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-icon whatsapp"
                  title="WhatsApp"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path>
                    <path d="M12.004 2.003c-5.514 0-9.997 4.483-9.997 9.997 0 1.762.462 3.484 1.34 5.001L2 22l5.117-1.341a9.96 9.96 0 0 0 4.887 1.271h.004c5.514 0 9.996-4.483 9.996-9.997 0-2.67-1.04-5.18-2.928-7.069a9.935 9.935 0 0 0-7.072-2.861zm0 18.187h-.003a8.166 8.166 0 0 1-4.166-1.14l-.299-.177-3.037.797.811-2.96-.194-.304a8.184 8.184 0 0 1-1.256-4.375c0-4.522 3.68-8.202 8.207-8.202a8.15 8.15 0 0 1 5.802 2.406 8.15 8.15 0 0 1 2.403 5.803c0 4.523-3.68 8.152-8.268 8.152z"></path>
                  </svg>
                  <span>+39 324 6687521</span>
                </a>
                <a
                  href="https://www.facebook.com/fotoextracolor/?locale=it_IT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-icon facebook"
                  title="Facebook"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                  <span>Foto Extracolor</span>
                </a>
                <a
                  href="https://www.instagram.com/fotoextracolor/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-icon instagram"
                  title="Instagram"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  <span>@fotoextracolor</span>
                </a>
                
              </div>
            </div>
          </div>

          <div className="contact-right">
            <div className="map-container fade-in">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.2394982647715!2d14.7766!3d40.6781!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x133bc25c9b19e2bb%3A0x8e8334812a23075f!2sVia%20Raffaele%20Ricci%2C%2062%2C%2084126%20Salerno%20SA%2C%20Italy!5e0!3m2!1sen!2sus!4v1717171717171!5m2!1sen!2sus"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: "8px", display: "block" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={content.home.mapTitle}
              ></iframe>
            </div>
            <GoogleReviewsWidget className="contact-reviews" content={content.reviews} />
          </div>
        </div>
      </section>
    </>
  );
}

function IconPrinter(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 9V2h12v7"></path>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  );
}

function IconCamera(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}

function IconCalendar(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function IconFilm(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
      <line x1="7" y1="2" x2="7" y2="22"></line>
      <line x1="17" y1="2" x2="17" y2="22"></line>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <line x1="2" y1="7" x2="7" y2="7"></line>
      <line x1="2" y1="17" x2="7" y2="17"></line>
      <line x1="17" y1="17" x2="22" y2="17"></line>
      <line x1="17" y1="7" x2="22" y2="7"></line>
    </svg>
  );
}

function IconConvert(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  );
}

function IconDrone(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="4" cy="4" r="2"></circle>
      <circle cx="20" cy="4" r="2"></circle>
      <circle cx="4" cy="20" r="2"></circle>
      <circle cx="20" cy="20" r="2"></circle>
      <line x1="4" y1="4" x2="9" y2="9"></line>
      <line x1="20" y1="4" x2="15" y2="9"></line>
      <line x1="4" y1="20" x2="9" y2="15"></line>
      <line x1="20" y1="20" x2="15" y2="15"></line>
      <rect x="9" y="9" width="6" height="6" rx="1"></rect>
    </svg>
  );
}

function IconGift(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <polyline points="20 12 20 22 4 22 4 12"></polyline>
      <rect x="2" y="7" width="20" height="5"></rect>
      <line x1="12" y1="22" x2="12" y2="7"></line>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
    </svg>
  );
}

const SERVICES = {
  it: [
    {
      title: "Eventi",
      description:
        "Copertura fotografica completa del vostro evento, con la possibilita di realizzare anche il film dell'evento e spettacolari riprese aeree con il drone.",
      subtitle: <u>Foto, film e riprese aeree con drone</u>,
      icon: IconCamera,
      featured: true,
    },
    {
      title: "Stampa Professionale",
      description:
        "Stampe fotografiche di alta qualità su carta professionale, per privati e attività commerciali.",
      icon: IconPrinter,
    },
    {
      title: "Cerimonie",
      description:
        "Copertura fotografica di battesimi, comunioni e lauree, con foto curate per ogni momento speciale.",
      subtitle: <u>Foto, film e riprese aeree con drone</u>,
      icon: IconCalendar,
    },
    {
      title: "Sviluppo Pellicola",
      description:
        "Sviluppo e stampa di rullini analogici, con la stessa cura artigianale di sempre.",
      icon: IconFilm,
    },
    {
      title: "Conversione VHS in Digitale",
      description:
        "Trasferiamo i tuoi ricordi da VHS, mini-DV e altre videocassette a formato digitale.",
      icon: IconConvert,
    },
    {
      title: "Gadget Personalizzati",
      description:
        "Cuscini, tazze, puzzle e tanto altro: trasforma le tue foto preferite in oggetti unici, tutto personalizzabile.",
      icon: IconGift,
    },
  ],
  en: [
    {
      title: "Events",
      description:
        "Complete photographic coverage of your event, with the possibility of creating an event film and spectacular aerial drone footage.",
      subtitle: <u>Photos, film and aerial drone footage</u>,
      icon: IconCamera,
      featured: true,
    },
    {
      title: "Professional Printing",
      description:
        "High-quality photographic prints on professional paper for private clients and businesses.",
      icon: IconPrinter,
    },
    {
      title: "Ceremonies",
      description:
        "Photography coverage for baptisms, communions, and graduations, with carefully captured moments throughout the day.",
      subtitle: <u>Photos, film and aerial drone footage</u>,
      icon: IconCalendar,
    },
    {
      title: "Film Development",
      description:
        "Development and printing of analogue rolls with the same handcrafted care as ever.",
      icon: IconFilm,
    },
    {
      title: "VHS to Digital Conversion",
      description:
        "We transfer your memories from VHS, mini-DV, and other tapes to digital format.",
      icon: IconConvert,
    },
    {
      title: "Personalized Gifts",
      description:
        "Cushions, mugs, puzzles, and much more: turn your favorite photos into unique, fully customizable objects.",
      icon: IconGift,
    },
  ],
};

const STAFF = {
  it: [{ name: "Annalisa Capasso" }, { name: "Chiara Capasso" }, { name: "Carmen Capasso" }],
  en: [{ name: "Annalisa Capasso" }, { name: "Chiara Capasso" }, { name: "Carmen Capasso" }],
};

function Servizi({ content, language }) {
  useEffect(() => {
    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((el) => el.classList.remove("visible"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [language]);

  return (
    <div className="services-page">
      <div
        className="page-backdrop"
        style={{ backgroundImage: `url(${atelierPhoto})` }}
        aria-hidden="true"
      ></div>

      <header className="services-header fade-in visible">
        <span className="section-kicker">{content.services.pageKicker}</span>
        <h1>{content.services.pageTitle}</h1>
        <p className="services-subtitle">{content.services.pageText}</p>
      </header>

      <div className="services-grid">
        {(SERVICES[language] || SERVICES.it).map((service, idx) => {
          const Icon = service.icon;
          const BadgeIcon = service.badgeIcon;
          return (
            <div
              className={`service-card fade-in ${service.featured ? "featured" : ""}`}
              key={service.title}
              style={{ transitionDelay: `${(idx % 6) * 0.06}s` }}
            >
              {service.badge && (
                <span className="service-badge">
                  {BadgeIcon && <BadgeIcon />}
                  {service.badge}
                </span>
              )}
              <div className="service-icon">
                <Icon />
              </div>
              <h3>{service.title}</h3>
              {service.subtitle && (
                <h4 className="service-subtitle">{service.subtitle}</h4>
              )}
              <p>{service.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Portfolio({ content, language }) {
  // Load portfolio images. Use the source path for categorization because
  // production asset URLs are hashed by Vite and no longer include the original
  // folder name.
  const imageModules = import.meta.glob(
    "/src/assets/Photos/Portfolio/**/*.{jpg,jpeg,png}",
    {
      eager: true,
      query: "?url",
      import: "default",
    },
  );

  const imageEntries = Object.entries(imageModules);

  const newYork = imageEntries
    .filter(([path]) => path.toLowerCase().includes("/newyork/"))
    .map(([, url]) => url);
  const eventi = imageEntries
    .filter(([path]) => path.toLowerCase().includes("/matrimoni/"))
    .map(([, url]) => url);
  const allImages = [...newYork, ...eventi];

  // Use lowercase identifiers for consistency
  const [category, setCategory] = useState("newyork");
  const imagesByCategory = {
    newyork: newYork,
    eventi,
  };
  const images = imagesByCategory[category]?.length
    ? imagesByCategory[category]
    : allImages;

  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    setSelectedIndex(null);
  }, [category]);

  useEffect(() => {
    const elements = document.querySelectorAll(".gallery-item.fade-in");
    elements.forEach((el) => el.classList.remove("visible"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [category, language]);

  const goPrev = () =>
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  const goNext = () => setSelectedIndex((prev) => (prev + 1) % images.length);

  return (
    <div className="portfolio-page">
      <div
        className="page-backdrop"
        style={{ backgroundImage: `url(${images[0]})` }}
        aria-hidden="true"
        key={category}
      ></div>

      <header className="portfolio-header fade-in visible">
        <span className="section-kicker">{content.portfolio.pageKicker}</span>
        <h1>{content.portfolio.pageTitle}</h1>
        <p className="portfolio-subtitle">{content.portfolio.pageText}</p>
        <div className="category-tabs">
          <button
            className={`tab-button ${category === "newyork" ? "active" : ""}`}
            onClick={() => setCategory("newyork")}
          >
            {content.portfolio.newYork}
          </button>
          <button
            className={`tab-button ${category === "eventi" ? "active" : ""}`}
            onClick={() => setCategory("eventi")}
          >
            {content.portfolio.events}
          </button>
        </div>
        <p className="gallery-count">
          {images.length} {content.portfolio.countLabel}
        </p>
      </header>

      <div className="gallery-grid">
        {images.map((src, idx) => (
          <div
            className="gallery-item fade-in"
            key={src}
            style={{ transitionDelay: `${(idx % 12) * 0.05}s` }}
            onClick={() => setSelectedIndex(idx)}
          >
            <img
              src={src}
              alt={`${content.portfolio.altPrefix} ${idx + 1}`}
              loading="lazy"
            />
            <span className="gallery-item-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6"></path>
                <path d="M9 21H3v-6"></path>
                <path d="M21 3l-7 7"></path>
                <path d="M3 21l7-7"></path>
              </svg>
            </span>
          </div>
        ))}
      </div>

      <Lightbox
        images={images}
        index={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "it";
    return window.localStorage.getItem("foto-extracolor-language") || "it";
  });
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("foto-extracolor-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("foto-extracolor-language", language);
    window.localStorage.setItem("foto-extracolor-theme", theme);
  }, [language, theme]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));
  const content = translations[language];

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="app-container">
        <Navigation
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          toggleTheme={toggleTheme}
          content={content}
        />
        <ScrollToHash />
        <PageTransition content={content} />
        <RoutedContent content={content} language={language} theme={theme} />
        <footer
          className="footer"
          style={{
            backgroundImage: `linear-gradient(135deg, ${theme === "dark" ? "rgba(10, 10, 10, 0.95)" : "rgba(245, 245, 245, 0.95)"}, ${theme === "dark" ? "rgba(10, 10, 10, 0.8)" : "rgba(225, 225, 225, 0.9)"}), url(${atelierPhoto})`,
          }}
        >
          <p>
            &copy; {new Date().getFullYear()} Foto Extracolor. {content.footer.rights}
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
