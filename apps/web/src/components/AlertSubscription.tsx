import React, { useState } from "react";
import styles from "../styles/alertSubscription.module.css";

interface AlertSubscriptionProps {
  address: string;
  score: number;
  censusTract: string;
}

export default function AlertSubscription({ address, score, censusTract }: AlertSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          address: address.trim(),
          score,
          censusTract,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.alertSection} id="alert-subscription-section">
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
          {success ? (
            <div className={styles.successCard}>
              <span className={styles.successIcon}>✓</span>
              <h3 className={styles.successTitle}>You're subscribed!</h3>
              <p className={styles.successText}>
                We'll email you if new water violations are filed for your district.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.sectionMeta}>Community Monitoring</div>
              <h2 className={styles.heading}>Get alerts for your address</h2>
              <p className={styles.body}>
                We monitor EPA violation databases and municipal water reports. If new lead or copper violations are filed for your water district, we'll email you immediately.
              </p>

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter your email address"
                    className={styles.input}
                    disabled={loading}
                    required
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading && <span className={styles.spinner} />}
                  Subscribe to Alerts
                </button>
              </form>

              {error && <p className={styles.errorText}>{error}</p>}

              <p className={styles.footerText}>
                We will never sell your email or spam you. Unsubscribe with 1-click at any time.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
