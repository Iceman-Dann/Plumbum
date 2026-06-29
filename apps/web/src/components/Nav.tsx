import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/nav.module.css";

const RESOURCES_LINKS = [
  { href: "/methodology", label: "Methodology", testId: "nav-methodology" },
  { href: "/api-docs", label: "API Docs", testId: "nav-api-docs" },
  { href: "/extension", label: "Extension", testId: "nav-extension" },
  { href: "https://github.com", label: "GitHub", testId: "nav-github", external: true },
];

export default function Nav() {
  const { t, lang, setLang } = useTranslation();
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        {/* Logo — far left */}
        <Link href="/" className={styles.logoLink} data-testid="nav-logo">
          <img src="/logo.png" alt={t.nav.logoAlt} className={styles.logoImg} />
          <span className={styles.logoText}>Plumbum</span>
        </Link>

        {/* Core consumer links + Resources dropdown */}
        <div className={styles.links}>
          <Link href="/schools" className={styles.link}>{t.nav.schools}</Link>
          <Link href="/hotspots" className={styles.link}>{t.nav.hotspots}</Link>
          <Link href="/accountability" className={styles.link}>Civic Tools</Link>

          {/* Resources dropdown */}
          <div className={styles.resourcesWrapper} ref={dropdownRef}>
            <button
              type="button"
              className={`${styles.link} ${styles.resourcesBtn}`}
              onClick={() => setResourcesOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={resourcesOpen}
            >
              Safety Kits {resourcesOpen ? "↑" : "↓"}
            </button>

            {resourcesOpen && (
              <div className={styles.dropdown}>
                {RESOURCES_LINKS.map((item) =>
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

          {/* Language toggle — far right */}
          <span className={styles.langToggle}>
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "en" ? styles.langBtnActive : ""}`}
              onClick={() => setLang("en")}
              aria-label="English"
            >
              {t.nav.langEn}
            </button>
            <span className={styles.langDivider} aria-hidden="true" />
            <button
              type="button"
              className={`${styles.langBtn} ${lang === "es" ? styles.langBtnActive : ""}`}
              onClick={() => setLang("es")}
              aria-label="Español"
            >
              {t.nav.langEs}
            </button>
          </span>
        </div>
      </div>
    </nav>
  );
}
