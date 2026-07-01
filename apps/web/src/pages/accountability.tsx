import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import styles from "../styles/accountability.module.css";

interface Stats {
  total: number;
  noResponsePct: number;
  agreedToTestPct: number;
  refusedPct: number;
}

interface Notice {
  id: number;
  property_address: string;
  property_address_hash: string;
  risk_score: number;
  landlord_name: string | null;
  management_company: string | null;
  notice_date: string;
  landlord_response: string;
  response_date: string | null;
  notes: string | null;
  created_at: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#7A1F0F";
  if (score >= 60) return "#A63D2F";
  if (score >= 40) return "#C07A2A";
  return "#4A7C59";
}

export default function Accountability() {
  const { t, lang } = useTranslation();

  // URL Query Parameters pre-fill
  const searchParams = new URLSearchParams(window.location.search);
  const prefilledAddress = searchParams.get("address") || "";
  const prefilledScore = searchParams.get("score") ? Number(searchParams.get("score")) : 0;

  // Form States
  const [address, setAddress] = useState(prefilledAddress);
  const [landlordName, setLandlordName] = useState("");
  const [mgmtCompany, setMgmtCompany] = useState("");
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split("T")[0]);
  const [response, setResponse] = useState("PENDING");
  const [notes, setNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formSuccessData, setFormSuccessData] = useState<{ address: string; score: number } | null>(null);

  // DB View States
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, noResponsePct: 0, agreedToTestPct: 0, refusedPct: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "urgent">("recent");
  const [activeTab, setActiveTab] = useState<"all" | "unresolved">("all");
  const [listLoading, setListLoading] = useState(false);

  // Fetch Database Notices
  const fetchList = async () => {
    setListLoading(true);
    try {
      const url = new URL("/api/accountability", window.location.origin);
      if (searchTerm.trim()) {
        url.searchParams.set("query", searchTerm.trim());
      }
      url.searchParams.set("sort", sortBy);
      url.searchParams.set("tab", activeTab);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setNotices(data.list || []);
      }
    } catch (err) {
      console.error("Failed to load accountability database:", err);
    } finally {
      setListLoading(false);
    }
  };

  // Fetch Database Stats
  const fetchStats = async () => {
    try {
      const res = await fetch("/api/accountability/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load statistics:", err);
    }
  };

  useEffect(() => {
    fetchList();
  }, [searchTerm, sortBy, activeTab]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setFormError(t.accountability.addressRequired);
      return;
    }
    if (!noticeDate) {
      setFormError(t.accountability.dateRequired);
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/accountability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          landlord_name: landlordName.trim(),
          management_company: mgmtCompany.trim(),
          notice_date: noticeDate,
          landlord_response: response,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report.");
      }

      setFormSuccess(true);
      setFormSuccessData({ address: data.address, score: data.score });
      
      // Reset form fields
      setAddress("");
      setLandlordName("");
      setMgmtCompany("");
      setNotes("");
      setResponse("PENDING");

      // Refresh database listings and stats
      fetchList();
      fetchStats();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  const getResponsePill = (status: string) => {
    switch (status) {
      case "AGREED_TO_TEST":
        return <span className={`${styles.pill} ${styles.pillAgreed}`}>{t.accountability.optionAgreed}</span>;
      case "TESTED_NEGATIVE":
        return <span className={`${styles.pill} ${styles.pillNeg}`}>{t.accountability.optionTestedNeg}</span>;
      case "TESTED_POSITIVE":
        return <span className={`${styles.pill} ${styles.pillPos}`}>{t.accountability.optionTestedPos}</span>;
      case "REFUSED":
        return <span className={`${styles.pill} ${styles.pillRefused}`}>{t.accountability.optionRefused}</span>;
      case "NO_RESPONSE":
        return <span className={`${styles.pill} ${styles.pillNoResp}`}>{t.accountability.optionNoResponse}</span>;
      default:
        return <span className={`${styles.pill} ${styles.pillPending}`}>{t.accountability.optionPending}</span>;
    }
  };

  const formatNoticeDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Hero Header */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <div className={styles.labelTop}>{t.accountability.heroLabel}</div>
            <div className={styles.heroRule}></div>
            <h1 className={styles.headline}>{t.accountability.heroHeadline}</h1>
            <p className={styles.heroBody}>
              {t.accountability.heroBody}
            </p>
          </div>
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.portalGrid}>
          
          {/* Stats strip above search results */}
          <section className={styles.statsStrip}>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.total}</div>
              <p className={styles.statLabel}>{t.accountability.statNoticesFiled}</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.noResponsePct}%</div>
              <p className={styles.statLabel}>{t.accountability.statNoResponse}</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.agreedToTestPct}%</div>
              <p className={styles.statLabel}>{t.accountability.statAgreedToTest}</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.refusedPct}%</div>
              <p className={styles.statLabel}>{t.accountability.statRefusedToAct}</p>
            </div>
          </section>

          {/* Form Panel (Left) */}
          <section className={styles.formPanel}>
            {formSuccess ? (
              <div className={styles.successOverlay}>
                <span className={styles.successIcon}>✓</span>
                <h3 className={styles.panelTitle}>{t.accountability.formSuccessTitle}</h3>
                <p style={{ fontSize: "14px", color: "var(--color-gray)", lineHeight: "1.5" }}>
                  {t.accountability.formSuccessDesc
                    .replace("{address}", formSuccessData?.address || "")
                    .replace("{score}", String(formSuccessData?.score || 0))}
                </p>
                <button
                  onClick={() => setFormSuccess(false)}
                  className={styles.successResetBtn}
                >
                  {t.accountability.formSuccessBtn}
                </button>
              </div>
            ) : (
              <>
                <h3 className={styles.panelTitle}>{t.accountability.formTitle}</h3>
                <form onSubmit={handleFormSubmit} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>{t.accountability.labelPropertyAddress}</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder={t.accountability.placeholderAddress}
                      className={styles.input}
                      disabled={formLoading}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>{t.accountability.labelLandlordName}</label>
                    <input
                      type="text"
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder={t.accountability.placeholderLandlord}
                      className={styles.input}
                      disabled={formLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>{t.accountability.labelMgmtCompany}</label>
                    <input
                      type="text"
                      value={mgmtCompany}
                      onChange={(e) => setMgmtCompany(e.target.value)}
                      placeholder={t.accountability.placeholderMgmt}
                      className={styles.input}
                      disabled={formLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>{t.accountability.labelDateNotified}</label>
                    <input
                      type="date"
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                      className={styles.input}
                      disabled={formLoading}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>{t.accountability.labelResponseSoFar}</label>
                    <select
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className={styles.select}
                      disabled={formLoading}
                    >
                      <option value="PENDING">{t.accountability.optionPending}</option>
                      <option value="AGREED_TO_TEST">{t.accountability.optionAgreed}</option>
                      <option value="TESTED_NEGATIVE">{t.accountability.optionTestedNeg}</option>
                      <option value="TESTED_POSITIVE">{t.accountability.optionTestedPos}</option>
                      <option value="REFUSED">{t.accountability.optionRefused}</option>
                      <option value="NO_RESPONSE">{t.accountability.optionNoResponse}</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>{t.accountability.labelAdditionalNotes}</label>
                    <textarea
                      maxLength={280}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t.accountability.placeholderNotes}
                      className={styles.textarea}
                      disabled={formLoading}
                    />
                    <div className={styles.charCounter}>{notes.length}/280</div>
                  </div>

                  {formError && <p className={styles.errorText}>{formError}</p>}

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={formLoading}
                  >
                    {formLoading && <span className={styles.spinner} />}
                    {t.accountability.btnSubmitNotice}
                  </button>

                  <p className={styles.formDisclaimer}>
                    {t.accountability.formDisclaimer}
                  </p>
                </form>
              </>
            )}
          </section>

          {/* Database Panel (Right) */}
          <section className={styles.dbPanel}>
            <div className={styles.searchBox}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.accountability.searchPlaceholder}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.dbHeader}>
              <div className={styles.tabs}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === "all" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("all")}
                >
                  {t.accountability.tabAllNotices}
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === "unresolved" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("unresolved")}
                  title="Urgent unresolved high risk database"
                >
                  {t.accountability.tabUnresolvedHighRisk}
                </button>
              </div>

              {activeTab !== "unresolved" && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "urgent")}
                  className={styles.sortSelect}
                >
                  <option value="recent">{t.accountability.sortRecent}</option>
                  <option value="urgent">{t.accountability.sortUrgent}</option>
                </select>
              )}
            </div>

            {/* List */}
            <div className={styles.noticeList}>
              {listLoading ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <span className={styles.spinner} style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
                </div>
              ) : notices.length === 0 ? (
                <div className={styles.emptyState}>
                  {activeTab === "unresolved" ? (
                    <>
                      <h4 style={{ margin: "0 0 8px 0", color: "var(--color-text)", fontWeight: 600 }}>
                        {lang === "es" ? "No se encontraron violaciones de alto riesgo sin resolver" : "No unresolved high-risk violations found"}
                      </h4>
                      <p style={{ margin: 0, fontSize: "13px" }}>
                        {lang === "es"
                          ? "Las propiedades con puntaje >80 y sin respuesta o rechazo después de 30 días se mostrarán aquí."
                          : "Properties with score >80 and no response or refusal past 30 days will show here."}
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: 0 }}>
                      {lang === "es"
                        ? "No hay avisos públicos registrados todavía. Cuando alguien envíe un aviso, aparecerá aquí."
                        : "There are no public notices recorded yet. When someone submits one, it will appear here."}
                    </p>
                  )}
                </div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} className={styles.noticeCard}>
                    <div className={styles.cardTop}>
                      <h4 className={styles.cardAddress}>{n.property_address}</h4>
                      <span
                        className={styles.scoreBadge}
                        style={{ backgroundColor: getScoreColor(n.risk_score) }}
                      >
                        {t.result.riskScore}: {n.risk_score}/100
                      </span>
                    </div>

                    <div className={styles.cardDetails}>
                      {n.landlord_name && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>{t.home.hubColLandlord}</span>
                          <span className={styles.detailValue}>{n.landlord_name}</span>
                        </div>
                      )}
                      {n.management_company && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>{t.home.hubColLandlord} (Co)</span>
                          <span className={styles.detailValue}>{n.management_company}</span>
                        </div>
                      )}
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>{t.accountability.noticeDateLabel}</span>
                        <span className={styles.detailValue}>{formatNoticeDate(n.notice_date)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>{t.home.hubColStatus}</span>
                        <div style={{ marginTop: "2px" }}>
                          {getResponsePill(n.landlord_response)}
                        </div>
                      </div>
                    </div>

                    {n.notes && (
                      <div className={styles.notesBox}>
                        "{n.notes}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
