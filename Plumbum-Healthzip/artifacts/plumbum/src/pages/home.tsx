import { useGetStats } from "@workspace/api-client-react";
import SearchBar from "@/components/SearchBar";
import { mockCities } from "@/lib/mockData";
import { Link } from "wouter";
import styles from "../styles/home.module.css";

export default function Home() {
  const { data: stats } = useGetStats();

  return (
    <div className={styles.wrapper}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.labelTop}>PUBLIC HEALTH RESEARCH TOOL — FREE AND OPEN SOURCE</div>
          <div className={styles.heroRule}></div>
          <h1 className={styles.headline}>9 million homes. One question. Is yours safe?</h1>
          <p className={styles.heroBody}>
            Lead pipes are invisible, legal, and still active beneath millions of American homes. Plumbum uses public government data to estimate your risk — instantly, anonymously, for free.
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Stats Strip */}
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statBox}>
            <div className={styles.statNum}>
              {stats?.homes_at_risk ? (stats.homes_at_risk / 1000000).toFixed(1) + 'M' : '9.2M'}
            </div>
            <div className={styles.statLabel}>HOMES ESTIMATED AT RISK</div>
          </div>
          <div className={styles.statBox}>
            <div className={styles.statNum}>
              {stats?.children_affected ? (stats.children_affected / 1000).toFixed(0) + 'K' : '400K'}
            </div>
            <div className={styles.statLabel}>CHILDREN AFFECTED ANNUALLY</div>
          </div>
          <div className={`${styles.statBox} ${styles.statBoxLast}`}>
            <div className={styles.statNum}>1986</div>
            <div className={styles.statLabel}>YEAR FEDERAL LEAD PIPE BAN PASSED</div>
          </div>
        </div>
      </section>

      {/* What We Found Section */}
      <section className={styles.findingsSection}>
        <div className={styles.findingsContent}>
          <div className={styles.findingsLabel}>FINDINGS</div>
          <div className={styles.findingsRule}></div>
          <h2 className={styles.findingsQuote}>
            "In Newark, NJ — where this research began — over 38% of residential properties predate the federal lead pipe ban."
          </h2>
          <p className={styles.findingsBody}>
            Plumbum has indexed predictive risk data for 2.4 million addresses across 12 states. Every score is derived entirely from public government records.
          </p>
        </div>
      </section>

      {/* City Risk Preview */}
      <section className={styles.citiesSection}>
        <div className={styles.citiesContainer}>
          <div className={styles.citiesLabel}>RISK BY CITY</div>
          
          <div className={styles.citiesScroll}>
            {mockCities.map(city => (
              <Link key={city.slug} href={`/city/${city.slug}`} className={styles.cityCard}>
                <div className={styles.cityName}>{city.name}</div>
                <div className={styles.cityState}>{city.state}</div>
                
                <div className={styles.cityBarBg}>
                  <div className={styles.cityBarFill} style={{ width: `${city.riskPercent}%` }}></div>
                </div>
                
                <div className={styles.cityPercent}>
                  {city.riskPercent}%
                </div>
                <div className={styles.cityPercentLabel}>of homes predate 1986</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology Teaser */}
      <section className={styles.methodologySection}>
        <div className={styles.methodologyContainer}>
          <div className={styles.methodologyLeft}>
            <h2 className={styles.methodologyTitle}>
              Built on public data. Validated against known outcomes.
            </h2>
            <p className={styles.methodologyBody}>
              Our model uses a gradient boosting classifier trained on known lead service line data, cross-referenced with local plumbing codes and census tract age.
            </p>
            <Link href="/methodology" className={styles.methodologyLink}>
              Read the full methodology ↗
            </Link>
          </div>
          
          <div className={styles.methodologyRight}>
            <div className={styles.sourcesLabel}>5 DATA SOURCES</div>
            <div className={styles.sourcesGrid}>
              <span className={styles.sourcePill}>American Community Survey</span>
              <span className={styles.sourcePill}>EPA SDWIS</span>
              <span className={styles.sourcePill}>National Parcel Data</span>
              <span className={styles.sourcePill}>State LSL Inventories</span>
              <span className={styles.sourcePill}>Historical Plumbing Codes</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
