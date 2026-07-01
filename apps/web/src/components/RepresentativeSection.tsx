import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { interpolate } from "@/lib/translations";
import styles from "../styles/representativeSection.module.css";

interface Representative {
  name: string;
  title: string;
  party: string;
  email: string | null;
  url: string | null;
  photoUrl: string | null;
}

interface Props {
  address: string;
  score: number;
  riskLevel: string;
  censusTract: string;
  waterDistrict: string;
  pctPre1986: string;
  epaViolations: string;
  country?: "us" | "ca";
}

function partyColor(party: string): string {
  const p = party.toLowerCase();
  if (p.includes("democrat")) return "#1A5CB0";
  if (p.includes("republican")) return "#B01A1A";
  if (p.includes("independent") || p.includes("libertarian") || p.includes("green")) return "#2A7A3B";
  return "#7A6F65";
}

function buildEmail(
  t: ReturnType<typeof useTranslation>["t"],
  opts: {
    repName: string;
    address: string;
    score: number;
    riskLevel: string;
    censusTract: string;
    waterDistrict: string;
    pctPre1986: string;
    epaViolations: string;
    senderName: string;
    senderAddress: string;
  },
): string {
  const { repName, address, score, riskLevel, censusTract, waterDistrict, pctPre1986, epaViolations, senderName, senderAddress } = opts;
  return interpolate(t.representative.emailBody, {
    repName: repName || t.representative.repNamePlaceholder,
    address,
    score,
    riskLevel: riskLevel.toUpperCase(),
    censusTract,
    waterDistrict,
    pctPre1986,
    epaViolations,
    senderName: senderName || t.representative.yourNamePlaceholder,
    senderAddress: senderAddress || address,
  });
}

function buildSubject(t: ReturnType<typeof useTranslation>["t"], censusTract: string): string {
  return interpolate(t.representative.subjectTemplate, { censusTract });
}

export default function RepresentativeSection({
  address,
  score,
  riskLevel,
  censusTract,
  waterDistrict,
  pctPre1986,
  epaViolations,
  country,
}: Props) {
  const { t } = useTranslation();
  const [reps, setReps] = useState<Representative[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCanada, setIsCanada] = useState(country === "ca");

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState(address);
  const [subject, setSubject] = useState(buildSubject(t, censusTract));
  const [emailBody, setEmailBody] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    setSubject(buildSubject(t, censusTract));
  }, [t, censusTract]);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetch(`/api/representatives?address=${encodeURIComponent(address)}`)
      .then(async r => {
        if (r.status === 503) {
          setApiKeyMissing(true);
          setLoading(false);
          return;
        }
        if (!r.ok) {
          const body = await r.json() as { error?: string };
          setError(body.error ?? t.representative.loadError);
          setLoading(false);
          return;
        }
        const data = await r.json() as { representatives: Representative[]; country?: string };
        if (data.country === "ca") {
          setIsCanada(true);
        }
        setReps(data.representatives);
        setLoading(false);
      })
      .catch(() => {
        setError(t.representative.loadError);
        setLoading(false);
      });
  }, [address, country, t]);

  useEffect(() => {
    if (!reps || reps.length === 0) return;
    const rep = reps[selectedIdx];
    setEmailBody(buildEmail(t, {
      repName: rep?.name ?? "",
      address,
      score,
      riskLevel,
      censusTract,
      waterDistrict,
      pctPre1986,
      epaViolations,
      senderName,
      senderAddress,
    }));
  }, [reps, selectedIdx, t, address, score, riskLevel, censusTract, waterDistrict, pctPre1986, epaViolations, senderName, senderAddress]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSenderName(e.target.value);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSenderAddress(e.target.value);
  };

  const handleRepSelect = (idx: number) => {
    setSelectedIdx(idx);
  };

  const handleCopy = () => {
    const fullText = `${t.representative.subject}: ${subject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    });
  };

  const selectedRep = reps?.[selectedIdx] ?? null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionMeta}>{t.representative.sectionMeta}</div>
        <h2 className={styles.heading}>{t.representative.heading}</h2>
        <p className={styles.subText}>
          {isCanada ? t.representative.subTextCa : t.representative.subTextUs}
        </p>

        {loading && (
          <div className={styles.loadingRow}>
            {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} />)}
          </div>
        )}

        {!loading && isCanada && reps !== null && reps.length === 0 && (
          <div className={styles.noKeyBox}>
            <div className={styles.noKeyHeading}>{t.representative.noResultsCa}</div>
            <p className={styles.noKeyText}>{t.representative.noResultsCaBody}</p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              <a
                href="https://www.ourcommons.ca/Members/en/search"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#A63D2F", fontWeight: 600, fontSize: 14 }}
              >
                {t.representative.findMp}
              </a>
              <a
                href="https://represent.opennorth.ca"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#A63D2F", fontWeight: 600, fontSize: 14 }}
              >
                {t.representative.searchRepresent}
              </a>
            </div>
          </div>
        )}

        {!loading && !isCanada && !apiKeyMissing && reps && reps.length === 0 && (
          <div className={styles.noKeyBox}>
            <div className={styles.noKeyHeading}>{t.representative.apiKeyRequired}</div>
            <p className={styles.noKeyText}>{t.representative.apiKeyBody}</p>
            <code className={styles.codeSnippet}>{t.representative.apiKeySnippet}</code>
            <p className={styles.noKeyText} style={{ marginTop: 12, marginBottom: 0 }}>
              {t.representative.apiKeyInstructions}
            </p>
          </div>
        )}

        {error && !apiKeyMissing && (
          <p style={{ color: "#A63D2F", fontSize: 14 }}>{error}</p>
        )}

        {!loading && !apiKeyMissing && reps && reps.length === 0 && !isCanada && (
          <p style={{ color: "#7A6F65", fontSize: 14 }}>{t.representative.noneFound}</p>
        )}

        {!loading && !apiKeyMissing && reps && reps.length > 0 && (
          <>
            <div className={styles.cardGrid}>
              {reps.map((rep, i) => (
                <button
                  key={i}
                  className={`${styles.repCard} ${i === selectedIdx ? styles.selected : ""}`}
                  onClick={() => handleRepSelect(i)}
                >
                  <div className={styles.repCardTop}>
                    <span
                      className={styles.partyDot}
                      style={{ background: partyColor(rep.party) }}
                      title={rep.party}
                    />
                    <span className={styles.repName}>{rep.name}</span>
                  </div>
                  <div className={styles.repTitle}>{rep.title}</div>
                  {rep.url
                    ? <a href={rep.url} target="_blank" rel="noreferrer" className={styles.repLink} onClick={e => e.stopPropagation()}>{t.representative.officialWebsite}</a>
                    : null
                  }
                </button>
              ))}
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="rep-name">{t.representative.yourName}</label>
                <input
                  id="rep-name"
                  type="text"
                  className={styles.input}
                  placeholder={t.representative.namePlaceholder}
                  value={senderName}
                  onChange={handleNameChange}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="rep-address">{t.representative.yourAddress}</label>
                <input
                  id="rep-address"
                  type="text"
                  className={styles.input}
                  value={senderAddress}
                  onChange={handleAddressChange}
                />
              </div>
            </div>

            <div className={styles.subjectRow}>
              <span className={styles.subjectLabel}>{t.representative.subject}</span>
              <input
                type="text"
                className={styles.subjectInput}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>

            <textarea
              className={styles.emailBox}
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              rows={20}
              spellCheck={false}
            />

            <div className={styles.buttonRow}>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copyState === "copied" ? t.representative.copied : t.representative.copyEmail}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
