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
  const { t } = useTranslation();

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
      setFormError("Address is required.");
      return;
    }
    if (!noticeDate) {
      setFormError("Notice date is required.");
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
        return <span className={`${styles.pill} ${styles.pillAgreed}`}>Agreed to Test</span>;
      case "TESTED_NEGATIVE":
        return <span className={`${styles.pill} ${styles.pillNeg}`}>Tested - Negative</span>;
      case "TESTED_POSITIVE":
        return <span className={`${styles.pill} ${styles.pillPos}`}>Tested - Lead Exceedance</span>;
      case "REFUSED":
        return <span className={`${styles.pill} ${styles.pillRefused}`}>Refused to Act</span>;
      case "NO_RESPONSE":
        return <span className={`${styles.pill} ${styles.pillNoResp}`}>No Response</span>;
      default:
        return <span className={`${styles.pill} ${styles.pillPending}`}>Pending response</span>;
    }
  };

  const formatNoticeDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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
            <div className={styles.labelTop}>Public Registry</div>
            <div className={styles.heroRule}></div>
            <h1 className={styles.headline}>Landlord Accountability</h1>
            <p className={styles.heroBody}>
              Renters have a right to safe water. This public database tracks which landlords have been formally notified of lead pipe risk — and how they responded.
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
              <p className={styles.statLabel}>Notices Filed</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.noResponsePct}%</div>
              <p className={styles.statLabel}>No Response</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.agreedToTestPct}%</div>
              <p className={styles.statLabel}>Agreed to Test</p>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{stats.refusedPct}%</div>
              <p className={styles.statLabel}>Refused to Act</p>
            </div>
          </section>

          {/* Form Panel (Left) */}
          <section className={styles.formPanel}>
            {formSuccess ? (
              <div className={styles.successOverlay}>
                <span className={styles.successIcon}>✓</span>
                <h3 className={styles.panelTitle}>Notice Logged Successfully</h3>
                <p style={{ fontSize: "14px", color: "var(--color-gray)", lineHeight: "1.5" }}>
                  Thank you. Property <strong>{formSuccessData?.address}</strong> has been logged with a geocoded risk score of <strong>{formSuccessData?.score}/100</strong>.
                </p>
                <button
                  onClick={() => setFormSuccess(false)}
                  className={styles.successResetBtn}
                >
                  File another report
                </button>
              </div>
            ) : (
              <>
                <h3 className={styles.panelTitle}>Report a landlord notification</h3>
                <form onSubmit={handleFormSubmit} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Property Address *</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="e.g. 124 Vassar Ave, Newark, NJ"
                      className={styles.input}
                      disabled={formLoading}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Landlord or Management Company Name</label>
                    <input
                      type="text"
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder="e.g. John Doe Properties, LLC"
                      className={styles.input}
                      disabled={formLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Management Company (Optional)</label>
                    <input
                      type="text"
                      value={mgmtCompany}
                      onChange={(e) => setMgmtCompany(e.target.value)}
                      placeholder="e.g. Apex Property Management"
                      className={styles.input}
                      disabled={formLoading}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Date You Notified Them *</label>
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
                    <label className={styles.label}>Their Response So Far *</label>
                    <select
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      className={styles.select}
                      disabled={formLoading}
                    >
                      <option value="PENDING">Pending response</option>
                      <option value="AGREED_TO_TEST">Agreed to test</option>
                      <option value="TESTED_NEGATIVE">Tested — came back negative</option>
                      <option value="TESTED_POSITIVE">Tested — came back positive</option>
                      <option value="REFUSED">Refused to act</option>
                      <option value="NO_RESPONSE">No response after 30 days</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Additional Notes</label>
                    <textarea
                      maxLength={280}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Brief details about interactions or responses (max 280 characters)..."
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
                    Submit Notice Log
                  </button>

                  <p className={styles.formDisclaimer}>
                    Submissions are anonymous. Property addresses are hashed before validation. We do not store your identity.
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
                placeholder="Search by address, city, or landlord name..."
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
                  All Notices
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === "unresolved" ? styles.tabBtnActive : ""}`}
                  onClick={() => setActiveTab("unresolved")}
                  title="Urgent unresolved high risk database"
                >
                  Unresolved High-Risk
                </button>
              </div>

              {activeTab !== "unresolved" && (
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "urgent")}
                  className={styles.sortSelect}
                >
                  <option value="recent">Most Recent</option>
                  <option value="urgent">Most Urgent</option>
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
                      <h4 style={{ margin: "0 0 8px 0", color: "var(--color-text)", fontWeight: 600 }}>No unresolved high-risk violations found</h4>
                      <p style={{ margin: 0, fontSize: "13px" }}>Properties with score &gt;80 and no response or refusal past 30 days will show here.</p>
                    </>
                  ) : (
                    <p style={{ margin: 0 }}>No landlord reports matched your criteria.</p>
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
                        Score: {n.risk_score}/100
                      </span>
                    </div>

                    <div className={styles.cardDetails}>
                      {n.landlord_name && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Landlord</span>
                          <span className={styles.detailValue}>{n.landlord_name}</span>
                        </div>
                      )}
                      {n.management_company && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Management Co</span>
                          <span className={styles.detailValue}>{n.management_company}</span>
                        </div>
                      )}
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Date Filed</span>
                        <span className={styles.detailValue}>{formatNoticeDate(n.notice_date)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Status</span>
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
