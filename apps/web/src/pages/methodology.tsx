import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/methodology.module.css";

export default function Methodology() {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState("");
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    document.querySelectorAll("section[id]").forEach((section) => {
      observer.current?.observe(section);
    });
    return () => observer.current?.disconnect();
  }, []);

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.labelTop}>{t.methodology.labelTop}</div>
          <h1 className={styles.headline}>{t.methodology.headline}</h1>
          <div className={styles.pubLine}>{t.methodology.pubLine}</div>
        </div>
      </header>

      <div className={styles.container}>
        <main className={styles.mainContent}>
          {t.methodology.sections.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <div className={styles.sectionRule}></div>
              {section.quote && <blockquote className={styles.quote}>{section.quote}</blockquote>}
              {section.callout && <div className={styles.callout}>{section.callout}</div>}
              {section.content && <p className={styles.bodyText}>{section.content}</p>}
              {section.table && (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t.methodology.tableSource}</th>
                        <th>{t.methodology.tablePublisher}</th>
                        <th>{t.methodology.tableYear}</th>
                        <th>{t.methodology.tableFields}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.map((row, i) => (
                        <tr key={i}>
                          <td>{row.source}</td>
                          <td>{row.publisher}</td>
                          <td>{row.year}</td>
                          <td>{row.fields}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </main>

        <aside className={styles.sidebar}>
          <div className={styles.tocSticky}>
            <div className={styles.tocLabel}>{t.methodology.contents}</div>
            <ul className={styles.tocList}>
              {t.methodology.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={`${styles.tocLink} ${activeId === section.id ? styles.active : ""}`}>
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <section className={styles.downloadStrip}>
        <div className={styles.downloadContainer}>
          <button className={styles.dlBtn}>{t.methodology.downloadPdf}</button>
          <a href="#" className={styles.dlBtn}>{t.methodology.viewArxiv}</a>
          <a href="#" className={styles.dlBtn}>{t.methodology.viewGithub}</a>
        </div>
      </section>
    </div>
  );
}
