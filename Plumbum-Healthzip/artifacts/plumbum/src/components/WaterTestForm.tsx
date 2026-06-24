import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../styles/water-test.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TractResults {
  fips: string;
  count: number;
  avg_ppb: number | null;
  max_ppb: number | null;
  distribution: { action_required: number; elevated: number; safe: number };
  latest_date: string | null;
  no_db?: boolean;
}

type ResultCategory = "ACTION_REQUIRED" | "ELEVATED" | "SAFE";

interface SubmitPayload {
  fips: string;
  test_date: string;
  lead_ppb: number;
  test_kit_brand?: string;
  notes?: string;
  certified: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function categoryColor(cat: ResultCategory): string {
  if (cat === "ACTION_REQUIRED") return "#A63D2F";
  if (cat === "ELEVATED") return "#C07A2A";
  return "#4A7C59";
}

function categoryLabel(cat: ResultCategory): string {
  if (cat === "ACTION_REQUIRED") return "ACTION REQUIRED (≥15 ppb)";
  if (cat === "ELEVATED") return "ELEVATED (5–14.9 ppb)";
  return "SAFE (<5 ppb)";
}

// ---------------------------------------------------------------------------
// Community results panel
// ---------------------------------------------------------------------------

function CommunityPanel({ fips, onBeFirst }: { fips: string; onBeFirst: () => void }) {
  const { data, isLoading } = useQuery<TractResults>({
    queryKey: ["test-results", fips],
    queryFn: async () => {
      const res = await fetch(`/api/test-results?fips=${encodeURIComponent(fips)}`);
      return res.json() as Promise<TractResults>;
    },
    enabled: !!fips,
  });

  if (isLoading || !data) return null;
  if ((data as { error?: string }).error) return null;

  const total = data.count ?? 0;

  if (total === 0) {
    return (
      <div className={styles.communityPanel}>
        <div className={styles.communityMeta}>COMMUNITY TEST RESULTS</div>
        <div className={styles.communityHeadline}>No community test results yet for this tract.</div>
        <p className={styles.communityEmpty}>
          Real water test results improve Plumbum's accuracy and become part of a published research dataset.{" "}
          <button className={styles.communityEmptyLink} onClick={onBeFirst}>
            Be the first to submit →
          </button>
        </p>
      </div>
    );
  }

  const { action_required, elevated, safe } = data.distribution ?? { action_required: 0, elevated: 0, safe: 0 };
  const safePct = total > 0 ? (safe / total) * 100 : 0;
  const elevPct = total > 0 ? (elevated / total) * 100 : 0;
  const actPct = total > 0 ? (action_required / total) * 100 : 0;

  return (
    <div className={styles.communityPanel}>
      <div className={styles.communityMeta}>COMMUNITY TEST RESULTS · CENSUS TRACT {fips}</div>
      <div className={styles.communityHeadline}>Real water test data from this community</div>

      <div className={styles.communityStats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{total}</span>
          <span className={styles.statLabel}>Tests submitted</span>
        </div>
        {data.avg_ppb != null && (
          <div className={styles.stat}>
            <span className={styles.statNum}>{data.avg_ppb}</span>
            <span className={styles.statLabel}>Avg ppb lead</span>
          </div>
        )}
        {data.max_ppb != null && (
          <div className={styles.stat}>
            <span className={styles.statNum}>{data.max_ppb}</span>
            <span className={styles.statLabel}>Max ppb detected</span>
          </div>
        )}
        {data.latest_date && (
          <div className={styles.stat}>
            <span className={styles.statNum} style={{ fontSize: 16, paddingTop: 4 }}>
              {new Date(data.latest_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
            <span className={styles.statLabel}>Most recent test</span>
          </div>
        )}
      </div>

      {/* Distribution bar */}
      <div className={styles.distBar}>
        {safePct > 0 && <div className={styles.distSafe} style={{ flex: safePct }} />}
        {elevPct > 0 && <div className={styles.distElevated} style={{ flex: elevPct }} />}
        {actPct > 0 && <div className={styles.distAction} style={{ flex: actPct }} />}
      </div>
      <div className={styles.distLabels}>
        <span className={styles.distLabel}>
          <span className={styles.distDot} style={{ background: "#4A7C59" }} />
          Safe: {safe}
        </span>
        <span className={styles.distLabel}>
          <span className={styles.distDot} style={{ background: "#C07A2A" }} />
          Elevated: {elevated}
        </span>
        <span className={styles.distLabel}>
          <span className={styles.distDot} style={{ background: "#A63D2F" }} />
          Action required: {action_required}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Submission form
// ---------------------------------------------------------------------------

interface FormState {
  lead_ppb: string;
  test_kit_brand: string;
  test_date: string;
  certified: boolean;
}

function Form({ fips, onSuccess }: { fips: string; onSuccess: (cat: ResultCategory) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({
    lead_ppb: "",
    test_kit_brand: "",
    test_date: new Date().toISOString().slice(0, 10),
    certified: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const mutation = useMutation<{ result_category: ResultCategory }, Error, SubmitPayload>({
    mutationFn: async (payload) => {
      const res = await fetch("/api/test-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Submission failed");
      }
      return res.json() as Promise<{ result_category: ResultCategory }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["test-results", fips] });
      onSuccess(data.result_category);
    },
  });

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    const ppb = parseFloat(form.lead_ppb);
    if (!form.lead_ppb || isNaN(ppb) || ppb < 0) errs.lead_ppb = "Enter a valid concentration in ppb (e.g. 7.3)";
    if (ppb > 1000) errs.lead_ppb = "Value seems too high. Check your units (ppb = µg/L).";
    if (!form.test_date) errs.test_date = "Test date is required.";
    if (!form.certified) errs.certified = "Please confirm the result is from a certified test kit.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      fips,
      test_date: form.test_date,
      lead_ppb: parseFloat(form.lead_ppb),
      test_kit_brand: form.test_kit_brand.trim() || undefined,
      certified: form.certified,
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div>
        <label className={styles.label}>
          Lead concentration (ppb)<span className={styles.required}>*</span>
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="1000"
          className={`${styles.input} ${fieldErrors.lead_ppb ? styles.error : ""}`}
          placeholder="e.g. 7.3"
          value={form.lead_ppb}
          onChange={e => setForm(f => ({ ...f, lead_ppb: e.target.value }))}
        />
        {fieldErrors.lead_ppb && <div className={styles.fieldError}>{fieldErrors.lead_ppb}</div>}
      </div>

      <div>
        <label className={styles.label}>Test date<span className={styles.required}>*</span></label>
        <input
          type="date"
          className={`${styles.input} ${fieldErrors.test_date ? styles.error : ""}`}
          value={form.test_date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))}
        />
        {fieldErrors.test_date && <div className={styles.fieldError}>{fieldErrors.test_date}</div>}
      </div>

      <div className={styles.fieldFull}>
        <label className={styles.label}>Test kit brand <span style={{ fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
        <input
          type="text"
          className={styles.input}
          placeholder="e.g. First Alert, LaMotte, NSF-certified lab"
          value={form.test_kit_brand}
          onChange={e => setForm(f => ({ ...f, test_kit_brand: e.target.value }))}
        />
      </div>

      <div className={styles.fieldFull}>
        <label className={`${styles.checkRow}`}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={form.certified}
            onChange={e => setForm(f => ({ ...f, certified: e.target.checked }))}
          />
          <span className={styles.checkLabel}>
            I confirm this result is from a certified test kit or accredited laboratory.
          </span>
        </label>
        {fieldErrors.certified && <div className={styles.fieldError}>{fieldErrors.certified}</div>}
      </div>

      <div className={styles.fieldFull}>
        <button type="submit" className={styles.submitBtn} disabled={mutation.isPending}>
          {mutation.isPending ? "Submitting…" : "Submit anonymous result"}
        </button>
        {mutation.isError && (
          <div className={styles.fieldError} style={{ marginTop: 8 }}>{mutation.error.message}</div>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export default function WaterTestForm({ fips }: { fips: string }) {
  const [submitted, setSubmitted] = useState<ResultCategory | null>(null);
  const [jumpToForm, setJumpToForm] = useState(false);
  const formRef = React.useRef<HTMLDivElement>(null);

  function handleBeFirst() {
    setJumpToForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  if (!fips) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Community panel */}
        <CommunityPanel fips={fips} onBeFirst={handleBeFirst} />

        {/* Submission form */}
        <div ref={formRef}>
          <div className={styles.formMeta}>CONTRIBUTE TO RESEARCH</div>
          <h2 className={styles.formHeadline}>Did you get your water tested?</h2>
          <p className={styles.formBody}>
            Real water test results from your community improve Plumbum's accuracy and become part of
            a published research dataset. Your submission is completely anonymous — no name, no email,
            no address.
          </p>

          {submitted ? (
            <div className={styles.confirmation}>
              <div className={styles.confTitle}>Thank you.</div>
              <p className={styles.confBody}>
                Your result has been added to the community dataset for census tract {fips}. This data
                is publicly available for research at{" "}
                <a href="/data" style={{ color: "#A63D2F" }}>plumbum.io/data</a>.
              </p>
              <div
                className={styles.confCategory}
                style={{
                  background: submitted === "ACTION_REQUIRED" ? "#A63D2F" : submitted === "ELEVATED" ? "#C07A2A" : "#4A7C59",
                  color: "#FFFFFF",
                }}
              >
                {categoryLabel(submitted)}
              </div>
            </div>
          ) : (
            <Form fips={fips} onSuccess={cat => setSubmitted(cat)} />
          )}
        </div>
      </div>
    </section>
  );
}
