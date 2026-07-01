import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import styles from "../styles/nav.module.css";
import { useTranslation } from "@/hooks/useTranslation";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

export default function Nav() {
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const { lang: activeLang, t, setLang } = useTranslation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const translateRef = useRef<HTMLDivElement>(null);

  const resourceLinks = [
    { href: "/data", label: "Data", testId: "nav-data" },
    { href: "/methodology", label: t.nav.methodology || "Methodology", testId: "nav-methodology" },
    { href: "/api-docs", label: t.nav.api || "API Docs", testId: "nav-api-docs" },
    { href: "/extension", label: t.nav.extension || "Extension", testId: "nav-extension" },
    { href: "https://github.com/Iceman-Dann/Plumbum", label: t.nav.github || "GitHub ↗", testId: "nav-github", external: true },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
      if (translateRef.current && !translateRef.current.contains(e.target as Node)) {
        setTranslateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLanguage = (code: string) => {
    setTranslateOpen(false);
    setLang(code);
  };

  const currentLang = LANGUAGES.find((l) => l.code === activeLang) ?? LANGUAGES[0];

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink} data-testid="nav-logo">
          <img src="/logo.png" alt={t.nav.logoAlt || "Plumbum Logo"} className={styles.logoImg} />
          <span className={styles.logoText}>Plumbum</span>
        </Link>

        {/* Nav links */}
        <div className={styles.links}>
          <Link href="/schools" className={styles.link}>{t.nav.schools || "Schools"}</Link>
          <Link href="/hotspots" className={styles.link}>{t.nav.hotspots || "Hotspots"}</Link>
          <Link href="/accountability" className={styles.link}>{t.nav.takeAction || "Take Action"}</Link>

          {/* Resources dropdown */}
          <div className={styles.resourcesWrapper} ref={dropdownRef}>
            <button
              type="button"
              className={`${styles.link} ${styles.resourcesBtn}`}
              onClick={() => setResourcesOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={resourcesOpen}
            >
              {t.nav.resources || "Resources"} {resourcesOpen ? "↑" : "↓"}
            </button>

            {resourcesOpen && (
              <div className={styles.dropdown}>
                {resourceLinks.map((item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.dropdownItem}
                      data-testid={item.testId}
                      onClick={() => setResourcesOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={styles.dropdownItem}
                      data-testid={item.testId}
                      onClick={() => setResourcesOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            )}
          </div>

          {/* Language / Translate dropdown */}
          <div className={styles.resourcesWrapper} ref={translateRef}>
            <button
              type="button"
              className={`${styles.link} ${styles.resourcesBtn}`}
              onClick={() => setTranslateOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={translateOpen}
              aria-label="Select language"
            >
              {currentLang.flag} {currentLang.label} {translateOpen ? "↑" : "↓"}
            </button>

            {translateOpen && (
              <div className={styles.dropdown} style={{ minWidth: 200, right: 0, left: "auto" }}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => handleSelectLanguage(lang.code)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      background: lang.code === activeLang ? "var(--color-surface)" : "transparent",
                      fontWeight: lang.code === activeLang ? 600 : 400,
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{lang.flag}</span>
                    <span>{lang.label}</span>
                    {lang.code === activeLang && (
                      <span style={{ marginLeft: "auto", color: "var(--color-accent)", fontSize: 12 }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Get My Free Report CTA */}
          <Link href="/">
            <button
              type="button"
              className={styles.reportBtn}
              onClick={() => {
                setTimeout(() => {
                  const inputEl = document.querySelector('input[placeholder*="address"], input[type="text"]') as HTMLInputElement;
                  if (inputEl) {
                    inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
                    inputEl.focus();
                  }
                }, 100);
              }}
            >
              {t.nav.getReport || "Get My Free Report"}
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
