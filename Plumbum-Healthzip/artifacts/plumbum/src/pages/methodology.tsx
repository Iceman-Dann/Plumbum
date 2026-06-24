import { useEffect, useRef, useState } from "react";
import { mockMethodology } from "@/lib/mockData";
import styles from "../styles/methodology.module.css";

export default function Methodology() {
  const [activeId, setActiveId] = useState("");
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
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
          <div className={styles.labelTop}>METHODOLOGY</div>
          <h1 className={styles.headline}>How Plumbum calculates lead pipe risk</h1>
          <div className={styles.pubLine}>Published June 2024 · Peer review pending · arXiv preprint available</div>
        </div>
      </header>

      <div className={styles.container}>
        <main className={styles.mainContent}>
          {mockMethodology.map((section) => (
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
                        <th>Source</th>
                        <th>Publisher</th>
                        <th>Year</th>
                        <th>Fields Used</th>
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
            <div className={styles.tocLabel}>CONTENTS</div>
            <ul className={styles.tocList}>
              {mockMethodology.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`${styles.tocLink} ${activeId === section.id ? styles.active : ""}`}
                  >
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
          <button className={styles.dlBtn}>Download PDF</button>
          <a href="#" className={styles.dlBtn}>View on arXiv ↗</a>
          <a href="#" className={styles.dlBtn}>View source on GitHub ↗</a>
        </div>
      </section>
    </div>
  );
}
