import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/footer.module.css";

export default function Footer() {
  const { t } = useTranslation();
  const [shareToast, setShareToast] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: "Plumbum - Tap Water Lead Safety Map",
      text: "Check if your home's tap water is at risk of lead piping using EPA and Census records.",
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User dismissed share sheet — no toast needed
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.left}>
          <h2 className={styles.title}>{t.footer.title}</h2>
          <p className={styles.desc}>{t.footer.desc}</p>
          <span className={styles.copyright}>© {new Date().getFullYear()} {t.footer.copyRight}</span>
        </div>
        <div className={styles.right}>
          {/* Core pages */}
          <Link href="/data" className={styles.link}>{t.footer.dataset}</Link>
          <Link href="/schools" className={styles.link}>Schools</Link>
          <Link href="/hotspots" className={styles.link}>Hotspots</Link>
          <Link href="/accountability" className={styles.link}>Accountability</Link>
          {/* Academic / developer */}
          <Link href="/methodology" className={styles.link} data-testid="footer-methodology">{t.footer.methodology}</Link>
          <Link href="/api-docs" className={styles.link}>API Docs</Link>
          <Link href="/extension" className={styles.link}>Extension</Link>
          <a href="https://github.com/Iceman-Dann/Plumbum" target="_blank" rel="noreferrer" className={styles.link} data-testid="footer-github">{t.footer.github}</a>
        </div>
      </div>
    </footer>
  );
}
