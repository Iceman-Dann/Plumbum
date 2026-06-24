import { Link } from "wouter";
import styles from "../styles/footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.left}>
          <h2 className={styles.title}>Investigating America's Infrastructure</h2>
          <p className={styles.desc}>Plumbum uses public government data to estimate lead pipe risk.</p>
          <span className={styles.copyright}>© {new Date().getFullYear()} Plumbum</span>
        </div>
        <div className={styles.right}>
          <Link href="/data" className={styles.link}>Dataset</Link>
          <Link href="/methodology" className={styles.link} data-testid="footer-methodology">Methodology</Link>
          <Link href="/research" className={styles.link} data-testid="footer-research">Research</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className={styles.link} data-testid="footer-github">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
