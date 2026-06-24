import { Link } from "wouter";
import styles from "../styles/nav.module.css";

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href="/" className={styles.logoLink} data-testid="nav-logo">
          <img src="/logo.png" alt="Plumbum Logo" className={styles.logoImg} />
        </Link>
        <div className={styles.links}>
          <Link href="/schools" className={styles.link}>Schools</Link>
          <Link href="/hotspots" className={styles.link}>Hotspots</Link>
          <Link href="/methodology" className={styles.link} data-testid="nav-methodology">Methodology</Link>
          <Link href="/research" className={styles.link} data-testid="nav-research">Research</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className={styles.link} data-testid="nav-github">GitHub ↗</a>
        </div>
      </div>
    </nav>
  );
}
