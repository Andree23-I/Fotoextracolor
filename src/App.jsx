import React, { useEffect, useLayoutEffect, useRef, useState, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./index.css";
import Lightbox from "./components/Lightbox.jsx";
import Carousel from "./components/Carousel.jsx";
import logo from "./assets/logo.jpeg";
import heroPhoto from "./assets/scuro.jpeg";
import lightHeroPhoto from "./assets/chiaro.jpeg";
import atelierPhoto from "./assets/hero_background.jpg";
import { useVisitorTracker } from "./utils/visitorTracker.js";

// Lazy-load admin route to prevent loading admin bundle in memory for regular visitors
const AdminPage = lazy(() => import("./components/AdminPage.jsx"));

// Hoisted static image asset collections (initialized once at module startup, reducing garbage collection & RAM)
const STORIA_IMAGES = Object.values(
  import.meta.glob("/src/assets/Photos/Storia/**/*.{jpg,jpeg,png}", {
    eager: true,
    query: "?url",
    import: "default",
  }),
);

const STAFF_GLOBS = import.meta.glob(
  [
    "/src/assets/staff/*.{jpg,jpeg,png}",
    "/src/assets/Photos/Staff/*.{jpg,jpeg,png}",
  ],
  { eager: true, query: "?url", import: "default" },
);

const STAFF_IMAGE_MAP = {};
Object.entries(STAFF_GLOBS).forEach(([path, url]) => {
  const fname = path.split("/").pop().toLowerCase();
  STAFF_IMAGE_MAP[fname] = url;
});

const getStaffAvatar = (name) => {
  if (!name) return null;
  const first = name.split(" ")[0].toLowerCase();
  const key = Object.keys(STAFF_IMAGE_MAP).find((k) => k.includes(first));
  return key ? STAFF_IMAGE_MAP[key] : null;
};

// Interactive Camera HUD Settings & LUT Profiles
const HUD_RESOLUTIONS = ["8K PRO", "4K RAW", "1080p CINEMA", "720p RETRO"];

const HUD_COLOR_PROFILES = [
  { id: "EXTRACOLOR", label: "🎨 Extracolor", desc: "Vibrante Lab" },
  { id: "KODACHROME", label: "🎞️ Kodachrome", desc: "Vintage 1964" },
  { id: "NOIR", label: "🖤 Noir B&W", desc: "Silver Halide" },
  { id: "GOLDEN", label: "🌅 Golden Hour", desc: "Caldo Tramonto" },
  { id: "CYBER", label: "🧪 Cyber Teal", desc: "Sci-Fi Grade" },
];

const computeHeroFilter = (profileId, exposureVal, resolution) => {
  const brightness = 1 + exposureVal * 0.18;
  let filterStr = `brightness(${brightness.toFixed(2)})`;

  if (profileId === "KODACHROME") {
    filterStr += " sepia(0.28) saturate(1.35) contrast(1.14)";
  } else if (profileId === "NOIR") {
    filterStr += " grayscale(1) contrast(1.32)";
  } else if (profileId === "GOLDEN") {
    filterStr += " sepia(0.38) saturate(1.5) hue-rotate(-12deg) contrast(1.1)";
  } else if (profileId === "CYBER") {
    filterStr += " hue-rotate(150deg) saturate(1.3) contrast(1.22)";
  } else {
    filterStr += " saturate(1.12) contrast(1.06)";
  }

  if (resolution === "8K PRO") {
    filterStr += " contrast(1.08)";
  } else if (resolution === "720p RETRO") {
    filterStr += " contrast(1.18) sepia(0.12)";
  }

  return filterStr;
};

// SVG Icon Components
function IconHome(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  );
}

function IconServices(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}

function IconPortfolio(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  );
}

function IconChiSiamo(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  );
}

function usePageMode() {
  const [mode, setMode] = useState(() => {
    if (typeof window === "undefined") return "chisiamo";
    return window.localStorage.getItem("fotoextracolor_page_mode") || "chisiamo";
  });

  useEffect(() => {
    const handleSync = () => {
      const current = window.localStorage.getItem("fotoextracolor_page_mode") || "chisiamo";
      setMode(current);
    };

    window.addEventListener("storage", handleSync);

    fetch("/api.php?action=getConfig")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.pageMode) {
          setMode(data.pageMode);
          window.localStorage.setItem("fotoextracolor_page_mode", data.pageMode);
        }
      })
      .catch(() => {});

    return () => window.removeEventListener("storage", handleSync);
  }, []);

  return mode;
}

function IconContact(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
  );
}

function IconExperience(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="6"></circle>
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
    </svg>
  );
}

function IconLab(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  );
}

function IconInnovation(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}

function IconHeartHandshake(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  );
}

// Link to the Foto Extracolor Google reviews / business panel.
const GOOGLE_REVIEWS_URL =
  "https://www.google.com/search?sca_esv=8661daf777ee415a&sxsrf=APpeQnuqdGqvpnmCq3QuvioBa8MfLRjH7A:1783171221322&q=foto+extracolor+salerno&si=APenkKnzv9m99ToiohAuzpadUwbOz34nZJ3j2Ukmo5XOUYWApuf1uLXXcDF8O4ULOaCSNh17t3bKbcvpQWNbpOSyRlTBOK-xLaxSaVEA6rn1eWVSvxkfsi0%3D&uds=AJ5uw1-SFE1ME9tIqnlIOIWp9Jjqv6n6AyWmrSP6hXkGDqBYBKIKI1-5RQwsdUk_mX9F5-2JY3kYmPV1OG4lUYodH3HP4E4qRRkkkIII1ai8R5VbwxEI55R8eufusxuIpSNZMsXYodiR&sa=X&ved=2ahUKEwiTruG5jrmVAxWCnP0HHbW4IhwQ3PALegQIHRAE&biw=1870&bih=919&dpr=1";
const GOOGLE_RATING = 4.5;
const GOOGLE_RATING_LABEL = "4,5";
const PAGE_TRANSITION_DURATION = 300;

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
      chisiamo: "Chi Siamo",
      portfolio: "Portfolio",
      contatti: "Contatti",
      language: "Lingua",
      dark: "Scuro",
      light: "Chiaro",
      menuTitle: "Menu Navigazione",
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
        "Un viaggio tra le storie che abbiamo raccontato attraverso l'obiettivo, dai matrimoni ai ritratti, fino agli eventi più speciali.",
      countLabel: "scatti",
      altPrefix: "Scatto",
    },
    chisiamo: {
      pageKicker: "Chi Siamo",
      pageTitle: "Passione, Tradizione e Innovazione",
      pageSubtitle:
        "Da oltre 60 anni, Foto Extracolor è il punto di riferimento a Salerno per chi desidera trasformare ogni emozione in un ricordo eterno.",
      stats: [
        { value: "60+", label: "Anni di Attività" },
        { value: "3", label: "Generazioni di Clienti" },
        { value: "100%", label: "Laboratorio Artigianale" },
        { value: "4.5★", label: "Recensioni Certificate" },
      ],
      storyKicker: "La Nostra Eredità",
      storyTitle: "Una bottega artigianale divenuta eccellenza a Salerno",
      storyP1:
        "Tutto ha inizio dalla passione pura di Riccardo Capasso, che muove i suoi primi passi tra scatti in esterni e lunghe ore artigianali in camera oscura. Ben presto, quel sogno si trasforma in una solida realtà a due grazie a Gabriela Donadio, che diventa il volto accogliente del negozio, gestendo con eleganza il bancone e gli scaffali colmi di storici rullini in un'attività dove anche i figli crescono respirando l'arte della pellicola.",
      storyP2:
        "Con il passare degli anni, il laboratorio si evolve: la camera oscura lascia il posto ai grandi macchinari industriali a sviluppo rapido, fino ad abbracciare la rivoluzione della fotografia digitale, accogliendo pixel, computer e nuove tecnologie per continuare a stampare i ricordi del tempo moderno. Oggi Foto Extracolor unisce la sensibilità analogica alla precisione digitale moderna.",
      valuesKicker: "Perché Sceglierci",
      valuesTitle: "I Nostri Valori Fondamentali",
      values: [
        {
          title: "Esperienza Storica",
          desc: "Oltre 60 anni trascorsi a raccontare matrimoni, ritratti, eventi e volti di Salerno.",
        },
        {
          title: "Laboratorio Diretto",
          desc: "Stampe immediate, calibrazione fine art e controllo maniacale di ogni sfumatura di colore.",
        },
        {
          title: "Tecnologia & Droni 4K",
          desc: "Riprese aeree d'autore, scanner per pellicole antiche e conversioni video da VHS a digitale.",
        },
        {
          title: "Attenzione Umana",
          desc: "Un'accoglienza calorosa e una consulenza su misura per ogni singola esigenza del cliente.",
        },
      ],
      teamKicker: "Il Nostro Staff",
      teamTitle: "I Volti di Foto Extracolor",
      teamSubtitle:
        "Una squadra affiatata e appassionata pronta a dare vita e luce ai tuoi progetti fotografici.",
      staffList: [
        {
          name: "Annalisa Capasso",
          role: "Stampa Digitale & Conversione VHS",
        },
        {
          name: "Chiara Capasso",
          role: "Stampa Digitale & Assistenza Clienti",
        },
        {
          name: "Carmen Capasso",
          role: "Eventi & Fotoritocco",
        },
      ],
      galleryKicker: "Archivio Fotografico",
      galleryTitle: "Scorci dal Nostro Archivio Storico",
      gallerySubtitle:
        "Un viaggio per immagini tra i macchinari d'epoca, la camera oscura e l'evoluzione del nostro studio.",
      ctaKicker: "Vieni a Trovarci",
      ctaTitle: "Hai una foto da stampare o un momento speciale da festeggiare?",
      ctaText:
        "Passa a trovarci in Via Raffaele Ricci 62 a Salerno, oppure scrivici su WhatsApp o per email.",
      ctaWhatsapp: "Scrivici su WhatsApp",
      ctaEmail: "Invia una Email",
    },
    footer: {
      rights: "Tutti i diritti riservati.",
    },
  },
  en: {
    nav: {
      home: "Home",
      servizi: "Services",
      chisiamo: "About Us",
      portfolio: "Portfolio",
      contatti: "Contact",
      language: "Language",
      dark: "Dark",
      light: "Light",
      menuTitle: "Navigation Menu",
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
        "A journey through the stories told through our lens, from weddings to portraits and celebrations.",
      countLabel: "shots",
      altPrefix: "Shot",
    },
    chisiamo: {
      pageKicker: "About Us",
      pageTitle: "Passion, Tradition & Innovation",
      pageSubtitle:
        "For over 60 years, Foto Extracolor has been the landmark studio in Salerno for preserving your most precious memories.",
      stats: [
        { value: "60+", label: "Years in Business" },
        { value: "3", label: "Generations of Clients" },
        { value: "100%", label: "In-House Lab" },
        { value: "4.5★", label: "Certified Reviews" },
      ],
      storyKicker: "Our Heritage",
      storyTitle: "An artisanal workshop that grew into a local landmark",
      storyP1:
        "It all began with the genuine passion of Riccardo Capasso, balancing outdoor shooting and meticulous darkroom craftsmanship. Soon, that dream grew into a solid family reality with Gabriela Donadio, welcoming clients at the counter filled with historic film rolls in a business where children grew up breathing the art of film.",
      storyP2:
        "Over the decades, the lab evolved: moving from chemical darkrooms to industrial minilabs and eventually leading the digital revolution with top-tier scanners, printers, and drone tech. Today, we bring together time-tested artisanal care and modern digital precision.",
      valuesKicker: "Why Choose Us",
      valuesTitle: "Our Core Values",
      values: [
        {
          title: "Six Decades of Heritage",
          desc: "Over 60 years capturing weddings, portraits, family milestones, and local life in Salerno.",
        },
        {
          title: "Direct In-House Lab",
          desc: "Immediate printing, fine-art colour calibration, and hands-on control over every single print.",
        },
        {
          title: "4K Drones & Modern Tech",
          desc: "Aerial footage, vintage negative scanning, and full video digitisation from VHS to USB.",
        },
        {
          title: "Family Care & Attention",
          desc: "Friendly, tailored advice to help you select the ideal formats, frames, and print finishes.",
        },
      ],
      teamKicker: "Our Team",
      teamTitle: "The Faces Behind Foto Extracolor",
      teamSubtitle:
        "A dedicated and passionate team ready to bring brightness and life to your photographic ideas.",
      staffList: [
        {
          name: "Annalisa Capasso",
          role: "Digital Print & VHS Conversion",
        },
        {
          name: "Chiara Capasso",
          role: "Digital Print & Customer Service",
        },
        {
          name: "Carmen Capasso",
          role: "Event & Photo Retouching",
        },
      ],
      galleryKicker: "Photo Archive",
      galleryTitle: "Glances from Our Historic Archive",
      gallerySubtitle:
        "A visual stroll through vintage processing machines, darkroom memories, and studio milestones.",
      ctaKicker: "Visit Us",
      ctaTitle: "Have a photo to print or a special celebration coming up?",
      ctaText:
        "Drop by our studio at Via Raffaele Ricci 62 in Salerno or reach out to us directly online.",
      ctaWhatsapp: "Message on WhatsApp",
      ctaEmail: "Send an Email",
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

import PhotoUploadModal from "./components/PhotoUploadModal.jsx";

function HeaderTray({ language, setLanguage, theme, toggleTheme, content }) {
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    // Only tick when tab is active in foreground, saving CPU & RAM
    const update = () => {
      if (document.visibilityState === "visible") {
        setClock(new Date());
      }
    };
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="header-right-tray">
      <div className="tray-controls">
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
        </button>
      </div>
      <div className="tray-clock">
        <div className="clock-time">
          {clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="clock-date">
          {clock.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

function TopHeaderBar({ language, setLanguage, theme, toggleTheme, content, onOpenPhotoModal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pageMode = usePageMode();

  const dynamicMenuItem = pageMode === "portfolio"
    ? { id: "/portfolio", label: content.nav.portfolio, icon: IconPortfolio }
    : { id: "/chisiamo", label: content.nav.chisiamo, icon: IconChiSiamo };

  const menuItems = [
    { id: "/", label: content.nav.home, icon: IconHome },
    { id: "/servizi", label: content.nav.servizi, icon: IconServices },
    dynamicMenuItem,
    { id: "/#contatti", label: content.nav.contatti, icon: IconContact },
  ];

  const handleMobileNavigate = (path) => {
    setMobileMenuOpen(false);
    if (path === "/#contatti") {
      navigate({ pathname: "/", hash: "contatti" });
    } else {
      navigate(path);
    }
  };

  return (
    <header className="site-header-top">
      <div className="header-brand" onClick={() => navigate("/")} role="button" tabIndex={0}>
        <div className="brand-logo-wrapper">
          <img src={logo} alt="Foto Extracolor Logo" className="header-logo-img" decoding="async" />

        </div>
        <div className="brand-titles">
          <span className="brand-name">FOTO EXTRACOLOR</span>
        </div>
      </div>

      {/* Desktop Taskbar (Hidden on mobile via CSS) */}
      <div className="header-center-taskbar">
        <WindowsTaskbar content={content} />
      </div>

      <div className="header-right-wrapper">
        <HeaderTray
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          toggleTheme={toggleTheme}
          content={content}
        />

        {/* Mobile Hamburger Menu Toggle Button */}
        <button
          type="button"
          className={`mobile-menu-toggle ${mobileMenuOpen ? "open" : ""}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Slide-down Navigation Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-nav-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <span className="mobile-nav-title">{content.nav.menuTitle}</span>
              <button
                type="button"
                className="mobile-nav-close"
                onClick={() => setMobileMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="mobile-nav-links">

              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === "/#contatti"
                  ? location.hash === "#contatti"
                  : item.id === "/"
                    ? location.pathname === "/" && location.hash !== "#contatti"
                    : location.pathname === item.id;

                return (
                  <button
                    key={item.id}
                    className={`mobile-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => handleMobileNavigate(item.id)}
                  >
                    <span className="mobile-nav-icon"><Icon /></span>
                    <span className="mobile-nav-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      )}

    </header>
  );
}

function WindowsTaskbar({ content }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pageMode = usePageMode();

  const dynamicMenuItem = pageMode === "portfolio"
    ? { id: "/portfolio", label: content.nav.portfolio }
    : { id: "/chisiamo", label: content.nav.chisiamo };

  const menuItems = [
    { id: "/", label: content.nav.home },
    { id: "/servizi", label: content.nav.servizi },
    dynamicMenuItem,
    { id: "/#contatti", label: content.nav.contatti },
  ];

  const handleNavigate = (path) => {
    if (path === "/#contatti") {
      navigate({ pathname: "/", hash: "contatti" });
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="header-nav-links">
      {menuItems.map((item) => {
        const isActive = item.id === "/#contatti" 
          ? location.hash === "#contatti" 
          : item.id === "/" 
            ? location.pathname === "/" && location.hash !== "#contatti" 
            : location.pathname === item.id;

        return (
          <button
            key={item.id}
            className={`header-nav-item ${isActive ? "active" : ""}`}
            onClick={() => handleNavigate(item.id)}
          >
            {item.label}
          </button>
        );
      })}
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

  if (pathname === "/chisiamo") {
    return { label: content.nav.chisiamo, index: 2 };
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

function RoutedContent({ content, language, theme, onOpenPhotoModal }) {
  const location = useLocation();

  return (
    <main className="page-content route-page" key={location.key}>
      <Routes>
        <Route path="/" element={<Home content={content} language={language} theme={theme} onOpenPhotoModal={onOpenPhotoModal} />} />
        <Route path="/servizi" element={<Servizi content={content} language={language} />} />
        <Route path="/chisiamo" element={<ChiSiamo content={content} language={language} />} />
        <Route path="/portfolio" element={<Portfolio content={content} language={language} />} />
        <Route 
          path="/admin" 
          element={
            <Suspense fallback={<div className="page-loading-spinner" style={{ minHeight: "60vh" }}></div>}>
              <AdminPage />
            </Suspense>
          } 
        />
      </Routes>
    </main>
  );
}

function Home({ content, language, theme, onOpenPhotoModal }) {
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const dynamicServices = useDynamicServices();

  // Interactive Camera HUD Live Controls State
  const [hudRes, setHudRes] = useState("4K RAW");
  const [hudProfile, setHudProfile] = useState("EXTRACOLOR");
  const [hudExposure, setHudExposure] = useState(0); // in EV steps: -1.0 to +1.0
  const [isHudDrawerOpen, setIsHudDrawerOpen] = useState(false);

  const cycleResolution = (e) => {
    e?.stopPropagation();
    setHudRes((curr) => {
      const idx = HUD_RESOLUTIONS.indexOf(curr);
      return HUD_RESOLUTIONS[(idx + 1) % HUD_RESOLUTIONS.length];
    });
  };

  const cycleProfile = (e) => {
    e?.stopPropagation();
    setHudProfile((curr) => {
      const idx = HUD_COLOR_PROFILES.findIndex((p) => p.id === curr);
      return HUD_COLOR_PROFILES[(idx + 1) % HUD_COLOR_PROFILES.length].id;
    });
  };

  const changeExposure = (delta, e) => {
    e?.stopPropagation();
    setHudExposure((curr) => {
      const next = Math.round((curr + delta) * 10) / 10;
      return Math.max(-1.0, Math.min(1.0, next));
    });
  };

  const resetCameraSettings = (e) => {
    e?.stopPropagation();
    setHudRes("4K RAW");
    setHudProfile("EXTRACOLOR");
    setHudExposure(0);
  };

  const currentHeroFilter = computeHeroFilter(hudProfile, hudExposure, hudRes);

  useEffect(() => {
    const animationClasses = [
      ".fade-in",
      ".fade-in-left",
      ".fade-in-right",
      ".fade-in-scale",
      ".fade-in-blur",
      ".elegant-fade-up",
      ".elegant-glow",
      ".elegant-slide-left",
      ".elegant-slide-right",
      ".elegant-scale-glow",
    ];
    const elements = document.querySelectorAll(animationClasses.join(", "));
    elements.forEach((el) => el.classList.remove("visible"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          } else {
            entry.target.classList.remove("visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [language, dynamicServices]);

  const handleHeroScroll = (event) => {
    event.preventDefault();

    const hero = heroRef.current;
    const navbarHeight =
      document.querySelector(".navbar")?.getBoundingClientRect().height ?? 0;
    const targetTop = hero
      ? hero.getBoundingClientRect().top + window.scrollY + hero.offsetHeight
      : (document.getElementById("storia")?.offsetTop ?? 0);

    window.history.replaceState(null, "", "#storia");
    window.scrollTo({
      top: Math.max(0, Math.round(targetTop - navbarHeight)),
      left: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div
        className="page-backdrop"
        style={{ backgroundImage: `url(${atelierPhoto})` }}
        aria-hidden="true"
      ></div>

      <header
        ref={heroRef}
        className="hero"
        style={{ position: 'relative' }}
      >
        {/* Dynamic Background Photo Layer with real-time grading filter */}
        <div 
          className={`hero-bg-media res-${hudRes.toLowerCase().replace(/[^a-z0-9]/g, '')} lut-${hudProfile.toLowerCase()}`}
          style={{
            backgroundImage:
              theme === "dark"
                ? `linear-gradient(135deg, rgba(17, 17, 17, 0.55), rgba(17, 17, 17, 0.7)), url(${heroPhoto})`
                : `linear-gradient(135deg, rgba(8, 8, 8, 0.18), rgba(8, 8, 8, 0.34)), url(${lightHeroPhoto})`,
            filter: currentHeroFilter,
          }}
          aria-hidden="true"
        ></div>

        <button 
          className="secret-admin-btn"
          onClick={() => navigate("/admin")}
          aria-hidden="true"
          title="Pannello Admin"
        ></button>

        {/* Futuristic Interactive Camera HUD Viewfinder Overlay */}
        <div className="camera-hud-overlay">
          <div className="hud-corner hud-tl" aria-hidden="true"></div>
          <div className="hud-corner hud-tr" aria-hidden="true"></div>
          <div className="hud-corner hud-bl" aria-hidden="true"></div>
          <div className="hud-corner hud-br" aria-hidden="true"></div>
          
          {/* Top Telemetry & Live Interactive Controls Bar */}
          <div className="hud-top-bar">
            <span className="hud-rec-badge"><span className="hud-rec-dot"></span> LIVE // 60Y LAB</span>
            
            <div className="hud-interactive-specs">
              {/* Clickable Resolution Selector Pill */}
              <button 
                type="button"
                className="hud-pill-btn res-btn" 
                onClick={cycleResolution}
                title="Clicca per cambiare risoluzione (8K, 4K, 1080p, 720p)"
              >
                <span className="hud-pill-highlight">{hudRes}</span>
                <span className="hud-btn-sub">• 60 FPS • 1/500s • f/1.4</span>
              </button>

              {/* Clickable Color LUT Profile Selector Pill */}
              <button 
                type="button"
                className="hud-pill-btn lut-btn" 
                onClick={cycleProfile}
                title="Clicca per cambiare profilo colore / grading"
              >
                <span>{HUD_COLOR_PROFILES.find(p => p.id === hudProfile)?.label || hudProfile}</span>
              </button>
            </div>

            <button 
              type="button"
              className={`hud-lab-toggle-btn ${isHudDrawerOpen ? 'is-open' : ''}`}
              onClick={() => setIsHudDrawerOpen(prev => !prev)}
              title="Apri pannello regolazioni ottica e colori"
            >
              <span>⚙️ CAMERA LAB</span>
            </button>
          </div>

          <div className="hud-focus-center" aria-hidden="true">
            <span className="hud-crosshair"></span>
          </div>

          {/* Bottom Telemetry Bar with interactive EV exposure */}
          <div className="hud-bottom-bar">
            <span className="hud-tag">EXTRACOLOR // 1964-2026</span>
            
            {/* Interactive EV Exposure & Brightness Stepper */}
            <div className="hud-exposure-stepper">
              <span className="hud-exposure-lbl">EXP:</span>
              <button 
                type="button"
                className="hud-stepper-btn"
                onClick={(e) => changeExposure(-0.5, e)}
                title="Diminuisci luminosità (-0.5 EV)"
                disabled={hudExposure <= -1.0}
              >
                −
              </button>
              <span className="hud-exposure-display" title="Esposizione attuale">
                {hudExposure > 0 ? `+${hudExposure.toFixed(1)}` : hudExposure.toFixed(1)} EV
              </span>
              <button 
                type="button"
                className="hud-stepper-btn"
                onClick={(e) => changeExposure(+0.5, e)}
                title="Aumenta luminosità (+0.5 EV)"
                disabled={hudExposure >= 1.0}
              >
                +
              </button>
            </div>

            <span className="hud-coordinates">40°40' N 14°47' E [SALERNO]</span>
          </div>

          {/* Floating Camera Lab Quick Settings Drawer */}
          {isHudDrawerOpen && (
            <div className="hud-drawer-panel" onClick={(e) => e.stopPropagation()}>
              <div className="hud-drawer-header">
                <span className="hud-drawer-title">🎛️ REGOLAZIONI SENSORE, OTTICA & COLORI</span>
                <button 
                  type="button"
                  className="hud-drawer-close"
                  onClick={() => setIsHudDrawerOpen(false)}
                  title="Chiudi"
                >
                  ✕
                </button>
              </div>

              <div className="hud-drawer-row">
                <span className="hud-row-label">Risoluzione & Sensore:</span>
                <div className="hud-options-chips">
                  {HUD_RESOLUTIONS.map((res) => (
                    <button
                      key={res}
                      type="button"
                      className={`hud-chip ${hudRes === res ? 'active' : ''}`}
                      onClick={() => setHudRes(res)}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hud-drawer-row">
                <span className="hud-row-label">Profilo Colore (Color Grading LUT):</span>
                <div className="hud-options-chips">
                  {HUD_COLOR_PROFILES.map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      className={`hud-chip ${hudProfile === prof.id ? 'active' : ''}`}
                      onClick={() => setHudProfile(prof.id)}
                    >
                      {prof.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hud-drawer-row">
                <div className="hud-row-header-wrap">
                  <span className="hud-row-label">Luminosità ed Esposizione:</span>
                  <span className="hud-val-pill">{hudExposure > 0 ? `+${hudExposure.toFixed(1)}` : hudExposure.toFixed(1)} EV</span>
                </div>
                <div className="hud-slider-wrap">
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={hudExposure}
                    onChange={(e) => setHudExposure(parseFloat(e.target.value))}
                    className="hud-range-slider"
                  />
                  <div className="hud-slider-ticks">
                    <span>-1.0 (Scuro / Darkroom)</span>
                    <span>0.0 (Neutro)</span>
                    <span>+1.0 (Luminoso / Daylight)</span>
                  </div>
                </div>
              </div>

              <div className="hud-drawer-footer">
                <button
                  type="button"
                  className="hud-reset-btn"
                  onClick={resetCameraSettings}
                >
                  ↺ Ripristina Impostazioni Predefinite
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hero-inner">
          <div className="hero-content fade-in">
            <span className="section-kicker">{content.home.kicker}</span>
            <h1>{content.home.heroTitle}</h1>
            <p>{content.home.heroText}</p>
            <Link
              to={{ pathname: "/", hash: "#contatti" }}
              className="btn-primary"
            >
              {content.home.heroCta}
            </Link>

            {/* Split Pill Dual Button (WhatsApp | Email) with SVG icons */}
            <div className="hero-split-send-pill">
              <a
                href="https://wa.me/393246687521"
                target="_blank"
                rel="noopener noreferrer"
                className="split-pill-btn split-left"
              >
                <svg
                  className="split-svg-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path>
                  <path d="M12.004 2.003c-5.514 0-9.997 4.483-9.997 9.997 0 1.762.462 3.484 1.34 5.001L2 22l5.117-1.341a9.96 9.96 0 0 0 4.887 1.271h.004c5.514 0 9.996-4.483 9.996-9.997 0-2.67-1.04-5.18-2.928-7.069a9.935 9.935 0 0 0-7.072-2.861zm0 18.187h-.003a8.166 8.166 0 0 1-4.166-1.14l-.299-.177-3.037.797.811-2.96-.194-.304a8.184 8.184 0 0 1-1.256-4.375c0-4.522 3.68-8.202 8.207-8.202a8.15 8.15 0 0 1 5.802 2.406 8.15 8.15 0 0 1 2.403 5.803c0 4.523-3.68 8.152-8.268 8.152z"></path>
                </svg>
                <span className="split-text">
                  {language === "it" ? "INVIA FOTO SU WHATSAPP" : "SEND PHOTOS VIA WHATSAPP"}
                </span>
              </a>
              <div className="split-divider"></div>
              <button
                type="button"
                className="split-pill-btn split-right"
                onClick={() => {
                  window.location.href = "mailto:info@fotoextracolor.com?subject=" + encodeURIComponent("Invio Foto per Stampa") + "&body=" + encodeURIComponent("Allega qui le tue foto e inserisci eventuali note o formati desiderati:\n\n");
                }}
              >
                <svg
                  className="split-svg-icon"
                  width="20"
                  height="20"
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
                <span className="split-text">
                  {language === "it" ? "INVIA FOTO VIA EMAIL" : "SEND PHOTOS VIA EMAIL"}
                </span>
              </button>
            </div>
          </div>
        </div>
        {theme !== "dark" && (
          <a
            href="#storia"
            className="scroll-indicator"
            aria-label={content.home.scrollLabel}
            onClick={handleHeroScroll}
          >
            <span></span>
          </a>
        )}
      </header>

      <section id="storia" className="story-section">
        <div className="section-content">
          <div className="text-content fade-in-left">
            <h2 className="elegant-fade-up">{content.home.storyTitle}</h2>
            <p>{renderStoryText(content.home.storyText1, "Riccardo Capasso", "Gabriela Donadio")}</p>
            <p>{renderStoryText(content.home.storyText2, "Riccardo")}</p>
          </div>
          <div className="image-content fade-in-right">
            <Carousel images={STORIA_IMAGES} language={language} />
          </div>
        </div>
      </section>

      <section id="servizi" className="services-preview">
        <span className="section-kicker elegant-slide-left">{content.home.servicesKicker}</span>
        <h2 className="elegant-glow">{content.home.servicesTitle}</h2>
        <p className="services-preview-text fade-in-blur stagger-2">
          {content.home.servicesText}
        </p>
        <div className="services-preview-grid">
          {(() => {
            const currentServicesRaw = dynamicServices ? (dynamicServices[language] || dynamicServices.it) : (SERVICES[language] || SERVICES.it);
            const currentServices = currentServicesRaw.map(srv => ({
              ...srv,
              icon: typeof srv.iconName === 'string' ? (iconMap[srv.iconName] || IconCamera) : (srv.icon || IconCamera)
            }));
            
            return currentServices.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  className={`service-chip fade-in-scale stagger-${(idx % 5) + 1}`}
                  key={service.id || idx}
                >
                  <span className="service-chip-icon">
                    <Icon />
                  </span>
                  <span>{service.title}</span>
                </div>
              );
            });
          })()}
        </div>
        <Link to="/servizi" className="btn-secondary fade-in">
          {content.home.servicesCta}
        </Link>
      </section>

      <section id="staff" className="staff-section">
        <span className="section-kicker elegant-scale-glow">{content.home.staffKicker}</span>
        <h2 className="elegant-fade-up">{content.home.staffTitle}</h2>
        <div className="staff-grid">
            {STAFF[language].map((member, idx) => {
              const img = getStaffAvatar(member.name);
              return (
                <div className={`staff-card fade-in-scale stagger-${(idx % 5) + 1}`} key={member.name}>
                  {img ? (
                    <div className="staff-avatar" aria-hidden="true">
                      <img
                        src={img}
                        alt={member.name}
                        className="staff-avatar-img"
                        loading="lazy"
                        decoding="async"
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
            })}
        </div>
      </section>

      <section id="contatti" className="contact-section">
        <h2 className="elegant-slide-right">{content.home.contactTitle}</h2>
        <div className="contact-container">
          <div className="contact-box fade-in-left">
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
            <div className="map-container fade-in-right stagger-1">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12105.87064206921!2d14.780441522598274!3d40.66366362039965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x133bc2f54d7792af%3A0x53c81e6da62d1a7!2sFoto%20Extracolor!5e0!3m2!1sit!2sit!4v1785339158269!5m2!1sit!2sit"
                width="100%"
                height="350"
                style={{ border: 0, borderRadius: "8px", display: "block" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={content.home.mapTitle}
              ></iframe>
            </div>
            <GoogleReviewsWidget className="contact-reviews fade-in-scale stagger-2" content={content.reviews} />
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

const iconMap = {
  IconCamera, IconPrinter, IconCalendar, IconFilm, IconConvert, IconDrone, IconGift
};

function useDynamicServices() {
  const [dynamicServices, setDynamicServices] = useState(null);

  useEffect(() => {
    fetch('/api.php?action=getServices')
      .then(res => res.json())
      .then(data => {
        if (data && data.it && data.en && data.it.length > 0) {
          setDynamicServices(data);
        }
      })
      .catch(err => {
        const localS = localStorage.getItem('custom_services');
        if (localS) setDynamicServices(JSON.parse(localS));
      });
  }, []);

  return dynamicServices;
}

function Servizi({ content, language }) {
  const dynamicServices = useDynamicServices();

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
  }, [language, dynamicServices]);

  const currentServicesRaw = dynamicServices ? (dynamicServices[language] || dynamicServices.it) : (SERVICES[language] || SERVICES.it);
  
  const currentServices = currentServicesRaw.map(srv => ({
    ...srv,
    icon: typeof srv.iconName === 'string' ? (iconMap[srv.iconName] || IconCamera) : (srv.icon || IconCamera),
    subtitleNode: typeof srv.subtitle === 'string' && srv.subtitle.length > 0 ? <u>{srv.subtitle}</u> : srv.subtitle
  }));

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
        {currentServices.map((service, idx) => {
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
              <h3 className="service-title">{service.title}</h3>
              {service.subtitleNode && (
                <h4 className="service-subtitle">{service.subtitleNode}</h4>
              )}
              <p className="service-desc">{service.description || service.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Portfolio({ content, language }) {
  const [savedCategories, setSavedCategories] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    fetch('/api.php?action=getPortfolio')
      .then(res => res.json())
      .then(data => {
        if (data && data.categories) {
          setSavedCategories(data.categories);
          setImagesByCategory(data.imagesByCategory || {});
          if (data.categories.length > 0) {
            setCategory(data.categories[0].toLowerCase().replace(/\s+/g, ''));
          }
        }
        setIsLoading(false);
      })
      .catch(err => {
        const fallbackCats = JSON.parse(localStorage.getItem('portfolio_categories')) || ['New York', 'Eventi'];
        setSavedCategories(fallbackCats);
        if (fallbackCats.length > 0) setCategory(fallbackCats[0].toLowerCase().replace(/\s+/g, ''));
        setIsLoading(false);
      });
  }, []);

  const images = imagesByCategory[category] || [];

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
      {images.length > 0 && (
        <div
          className="page-backdrop"
          style={{ backgroundImage: `url(${images[0]})` }}
          aria-hidden="true"
          key={category}
        ></div>
      )}

      <header className="portfolio-header fade-in visible">
        <span className="section-kicker">{content.portfolio?.pageKicker || "Portfolio"}</span>
        <h1>{content.portfolio?.pageTitle || "I Nostri Scatti"}</h1>
        <p className="portfolio-subtitle">{content.portfolio?.pageText || ""}</p>
        <div className="category-tabs">
          {savedCategories.map((cat) => {
            const catId = cat.toLowerCase().replace(/\s+/g, '');
            return (
              <button
                key={catId}
                className={`tab-button ${category === catId ? "active" : ""}`}
                onClick={() => setCategory(catId)}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <p className="gallery-count">
          {images.length} {content.portfolio?.countLabel || "scatti"}
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
              alt={`${content.portfolio?.altPrefix || "Scatto"} ${idx + 1}`}
              loading="lazy"
              decoding="async"
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

function ChiSiamo({ content, language }) {
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const elements = document.querySelectorAll(
      ".fade-in, .fade-in-left, .fade-in-right, .fade-in-scale",
    );
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

  const valueIcons = [
    IconExperience,
    IconLab,
    IconInnovation,
    IconHeartHandshake,
  ];

  const goPrev = () =>
    setSelectedIndex(
      (prev) => (prev - 1 + STORIA_IMAGES.length) % STORIA_IMAGES.length,
    );
  const goNext = () =>
    setSelectedIndex((prev) => (prev + 1) % STORIA_IMAGES.length);

  return (
    <div className="chisiamo-page">
      <div
        className="page-backdrop"
        style={{ backgroundImage: `url(${atelierPhoto})` }}
        aria-hidden="true"
      ></div>

      {/* Hero Header Section */}
      <header className="chisiamo-header fade-in visible">
        <span className="section-kicker">{content.chisiamo.pageKicker}</span>
        <h1>{content.chisiamo.pageTitle}</h1>
        <p className="chisiamo-subtitle">{content.chisiamo.pageSubtitle}</p>

        {/* Stats Row */}
        {content.chisiamo.stats && (
          <div className="chisiamo-stats-grid fade-in">
            {content.chisiamo.stats.map((stat, idx) => (
              <div className="chisiamo-stat-card" key={idx}>
                <span className="stat-number">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Story & Heritage Section */}
      <section className="chisiamo-story-section">
        <div className="chisiamo-story-content">
          <div className="chisiamo-story-text fade-in-left">
            <span className="section-kicker">{content.chisiamo.storyKicker}</span>
            <h2>{content.chisiamo.storyTitle}</h2>
            <p>
              {renderStoryText(
                content.chisiamo.storyP1,
                "Riccardo Capasso",
                "Gabriela Donadio",
              )}
            </p>
            <p>
              {renderStoryText(
                content.chisiamo.storyP2,
                "Riccardo",
                "Foto Extracolor",
              )}
            </p>
          </div>
          <div className="chisiamo-story-visual fade-in-right">
            <Carousel images={STORIA_IMAGES} language={language} />
          </div>
        </div>
      </section>

      {/* Values / Strengths Section */}
      <section className="chisiamo-values-section">
        <div className="section-header-centered fade-in">
          <span className="section-kicker">{content.chisiamo.valuesKicker}</span>
          <h2>{content.chisiamo.valuesTitle}</h2>
        </div>
        <div className="chisiamo-values-grid">
          {content.chisiamo.values &&
            content.chisiamo.values.map((item, idx) => {
              const Icon = valueIcons[idx % valueIcons.length];
              return (
                <div
                  className={`chisiamo-value-card fade-in-scale stagger-${(idx % 4) + 1}`}
                  key={item.title}
                >
                  <div className="chisiamo-value-icon">
                    <Icon />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
        </div>
      </section>

      {/* Team & Staff Section */}
      <section className="chisiamo-team-section">
        <div className="section-header-centered fade-in">
          <span className="section-kicker">{content.chisiamo.teamKicker}</span>
          <h2>{content.chisiamo.teamTitle}</h2>
          <p className="section-header-desc">{content.chisiamo.teamSubtitle}</p>
        </div>

        <div className="chisiamo-team-grid">
          {content.chisiamo.staffList &&
            content.chisiamo.staffList.map((member, idx) => {
              const img = getStaffAvatar(member.name);
              return (
                <div
                  className={`chisiamo-team-card fade-in-scale stagger-${(idx % 3) + 1}`}
                  key={member.name}
                >
                  <div className="chisiamo-team-avatar-wrap">
                    {img ? (
                      <img
                        src={img}
                        alt={member.name}
                        className="chisiamo-team-avatar-img"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="chisiamo-team-avatar-fallback">
                        {member.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                  <div className="chisiamo-team-info">
                    <h3>{member.name}</h3>
                    <span className="chisiamo-team-role">{member.role}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Historic Photo Archive & Studio Gallery */}
      <section className="chisiamo-archive-section">
        <div className="section-header-centered fade-in">
          <span className="section-kicker">{content.chisiamo.galleryKicker}</span>
          <h2>{content.chisiamo.galleryTitle}</h2>
          <p className="section-header-desc">
            {content.chisiamo.gallerySubtitle}
          </p>
        </div>

        <div className="chisiamo-archive-grid">
          {STORIA_IMAGES.slice(0, 12).map((src, idx) => (
            <div
              className="diapositive-mount-card fade-in"
              key={src}
              style={{ transitionDelay: `${(idx % 12) * 0.04}s` }}
              onClick={() => setSelectedIndex(idx)}
              role="button"
              tabIndex={0}
              title="Ingrandisci diapositiva"
            >
              <div className="diapositive-inner-frame">
                <img
                  src={src}
                  alt={`Diapositiva Archivio ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="diapositive-label">
                <span>EXTRACOLOR // 1964</span>
                <span>SLIDE #{String(idx + 1).padStart(2, "0")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Card */}
      <section className="chisiamo-cta-section fade-in">
        <div className="chisiamo-cta-card">
          <span className="section-kicker">{content.chisiamo.ctaKicker}</span>
          <h2>{content.chisiamo.ctaTitle}</h2>
          <p>{content.chisiamo.ctaText}</p>
          <div className="chisiamo-cta-actions">
            <a
              href="https://wa.me/393246687521"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary chisiamo-cta-btn"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.868-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path>
                <path d="M12.004 2.003c-5.514 0-9.997 4.483-9.997 9.997 0 1.762.462 3.484 1.34 5.001L2 22l5.117-1.341a9.96 9.96 0 0 0 4.887 1.271h.004c5.514 0 9.996-4.483 9.996-9.997 0-2.67-1.04-5.18-2.928-7.069a9.935 9.935 0 0 0-7.072-2.861zm0 18.187h-.003a8.166 8.166 0 0 1-4.166-1.14l-.299-.177-3.037.797.811-2.96-.194-.304a8.184 8.184 0 0 1-1.256-4.375c0-4.522 3.68-8.202 8.207-8.202a8.15 8.15 0 0 1 5.802 2.406 8.15 8.15 0 0 1 2.403 5.803c0 4.523-3.68 8.152-8.268 8.152z"></path>
              </svg>
              <span>{content.chisiamo.ctaWhatsapp}</span>
            </a>
            <a
              href="mailto:info@fotoextracolor.com"
              className="btn-secondary chisiamo-cta-btn"
            >
              <svg
                width="20"
                height="20"
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
              <span>{content.chisiamo.ctaEmail}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Lightbox for archive photos */}
      <Lightbox
        images={storiaImages}
        index={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

function AnalyticsTracker({ language, theme }) {
  useVisitorTracker(language, theme);
  return null;
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
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("foto-extracolor-language", language);
    window.localStorage.setItem("foto-extracolor-theme", theme);
  }, [language, theme]);

  const toggleTheme = (e) => {
    if (!document.startViewTransition) {
      setTheme((current) => (current === "dark" ? "light" : "dark"));
      return;
    }

    const x = e?.clientX ?? window.innerWidth / 2;
    const y = e?.clientY ?? window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setTheme((current) => (current === "dark" ? "light" : "dark"));
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      
      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 600,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  const content = translations[language];

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AnalyticsTracker language={language} theme={theme} />
      <div className="app-container taskbar-style">
        <TopHeaderBar
          language={language}
          setLanguage={setLanguage}
          theme={theme}
          toggleTheme={toggleTheme}
          content={content}
          onOpenPhotoModal={() => setPhotoModalOpen(true)}
        />
        <ScrollToHash />
        <PageTransition content={content} />
        <RoutedContent 
          content={content} 
          language={language} 
          theme={theme}
          onOpenPhotoModal={() => setPhotoModalOpen(true)}
        />
        <PhotoUploadModal
          isOpen={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          language={language}
        />
      </div>
    </Router>
  );
}

export default App;

