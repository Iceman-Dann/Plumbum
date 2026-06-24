import React, { useState, useEffect } from "react";
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
}

function partyColor(party: string): string {
  const p = party.toLowerCase();
  if (p.includes("democrat")) return "#1A5CB0";
  if (p.includes("republican")) return "#B01A1A";
  if (p.includes("independent") || p.includes("libertarian") || p.includes("green")) return "#2A7A3B";
  return "#7A6F65";
}

function buildEmail(opts: {
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
}): string {
  const { repName, address, score, riskLevel, censusTract, waterDistrict, pctPre1986, epaViolations, senderName, senderAddress } = opts;
  return `Dear ${repName || "[Representative Name]"},

I am a constituent writing to bring your attention to a significant public health concern in our district. Using Plumbum, an open-source lead pipe risk assessment tool built on EPA and Census data, I received a risk score of ${score} out of 100 — classified as ${riskLevel.toUpperCase()} RISK — for my address at ${address}.

According to Plumbum's analysis, census tract ${censusTract} has ${pctPre1986} of homes built before the 1986 federal lead pipe ban, and ${waterDistrict} has recorded ${epaViolations} EPA violation${epaViolations === "1" ? "" : "s"} in the past decade.

I am requesting that you: (1) support increased federal funding for lead service line replacement under the Infrastructure Investment and Jobs Act, (2) push ${waterDistrict} to publish a complete public lead service line inventory, (3) ensure that low-income households in high-risk tracts receive prioritized replacement assistance.

Plumbum's full methodology and data sources are available at plumbum.io/methodology.

Thank you for your attention to this matter.

${senderName || "[Your Name]"}

${senderAddress || address}`;
}

function buildSubject(censusTract: string): string {
  return `Lead Pipe Risk in Census Tract ${censusTract} — Constituent Concern`;
}

export default function RepresentativeSection({
  address,
  score,
  riskLevel,
  censusTract,
  waterDistrict,
  pctPre1986,
  epaViolations,
}: Props) {
  const [reps, setReps] = useState<Representative[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState(address);
  const [subject, setSubject] = useState(buildSubject(censusTract));
  const [emailBody, setEmailBody] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

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
          setError(body.error ?? "Could not load representatives.");
          setLoading(false);
          return;
        }
        const data = await r.json() as { representatives: Representative[] };
        setReps(data.representatives);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load representatives.");
        setLoading(false);
      });
  }, [address]);

  // Rebuild email when reps load or selection changes
  useEffect(() => {
    if (!reps || reps.length === 0) return;
    const rep = reps[selectedIdx];
    setEmailBody(buildEmail({
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
  }, [reps, selectedIdx]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = e.target.value;
    setSenderName(n);
    setEmailBody(prev =>
      prev.replace(/^([\s\S]*\n\n)(.+?)(\n\n[\s\S]*)$/, (_m, before, _name, after) =>
        `${before}${n || "[Your Name]"}${after}`
      )
    );
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = e.target.value;
    setSenderAddress(a);
    const nameVal = senderName || "[Your Name]";
    setEmailBody(prev =>
      prev.replace(
        new RegExp(`(${nameVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n\\n).+`),
        `$1${a || address}`
      )
    );
  };

  const handleRepSelect = (idx: number) => {
    setSelectedIdx(idx);
    const rep = reps?.[idx];
    if (!rep) return;
    setEmailBody(buildEmail({
      repName: rep.name,
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
  };

  const handleCopy = () => {
    const fullText = `Subject: ${subject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    });
  };

  const selectedRep = reps?.[selectedIdx] ?? null;
  const mailtoHref = selectedRep?.email
    ? `mailto:${selectedRep.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
    : "#";

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.sectionMeta}>CIVIC ACTION</div>
        <h2 className={styles.heading}>Contact your representatives.</h2>
        <p className={styles.subText}>
          Your address is represented by the following elected officials. We've written them a letter about your risk score.
        </p>

        {loading && (
          <div className={styles.loadingRow}>
            {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} />)}
          </div>
        )}

        {apiKeyMissing && (
          <div className={styles.noKeyBox}>
            <div className={styles.noKeyHeading}>Google Civic API key required</div>
            <p className={styles.noKeyText}>
              To look up your elected officials, add your Google Civic Information API key
              as an environment secret. The key is free and does not require billing.
            </p>
            <code className={styles.codeSnippet}>GOOGLE_CIVIC_API_KEY=your_key_here</code>
            <p className={styles.noKeyText} style={{ marginTop: 12, marginBottom: 0 }}>
              Get a free key at{" "}
              <a href="https://console.cloud.google.com/apis/library/civicinfo.googleapis.com" target="_blank" rel="noreferrer">
                console.cloud.google.com
              </a>
              , then add it to your Replit environment secrets.
            </p>
          </div>
        )}

        {error && !apiKeyMissing && (
          <p style={{ color: "#A63D2F", fontSize: 14 }}>{error}</p>
        )}

        {!loading && !apiKeyMissing && reps && reps.length === 0 && (
          <p style={{ color: "#7A6F65", fontSize: 14 }}>No representatives found for this address.</p>
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
                    ? <a href={rep.url} target="_blank" rel="noreferrer" className={styles.repLink} onClick={e => e.stopPropagation()}>Official website ↗</a>
                    : null
                  }
                  {rep.email
                    ? <div className={styles.repLink} style={{ marginTop: 4 }}>{rep.email}</div>
                    : <div className={styles.noEmail}>No public email</div>
                  }
                </button>
              ))}
            </div>

            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="rep-name">Your name</label>
                <input
                  id="rep-name"
                  type="text"
                  className={styles.input}
                  placeholder="Jane Smith"
                  value={senderName}
                  onChange={handleNameChange}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="rep-address">Your address</label>
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
              <span className={styles.subjectLabel}>Subject</span>
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
                {copyState === "copied" ? "✓ Copied" : "Copy email"}
              </button>
              <a
                href={mailtoHref}
                className={`${styles.mailBtn}${!selectedRep?.email ? ` ${styles.noEmailDisabled}` : ""}`}
                title={!selectedRep?.email ? "No public email address for this representative" : undefined}
              >
                Open in mail client ↗
              </a>
            </div>

            {!selectedRep?.email && (
              <p className={styles.noRepSelected}>
                This representative has no public email listed. Copy the letter and send it via their contact form on their official website.
              </p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
