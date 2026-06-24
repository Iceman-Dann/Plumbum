import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetRisk, getGetRiskQueryKey } from "@workspace/api-client-react";
import type { RiskResult } from "@workspace/api-client-react/src/generated/api.schemas";
import ResultCard from "./ResultCard";
import styles from "../styles/search.module.css";

interface SearchBarProps {
  initialAddress?: string;
  onResult?: (result: RiskResult) => void;
}

const LOADING_STEPS = [
  "Matching your address to census records...",
  "Cross-referencing EPA violation database...",
  "Calculating risk score..."
];

export default function SearchBar({ initialAddress = "", onResult }: SearchBarProps) {
  const [address, setAddress] = useState(initialAddress);
  const [submittedAddress, setSubmittedAddress] = useState("");
  const [, setLocation] = useLocation();
  const [loadingStep, setLoadingStep] = useState(0);

  const { data: riskData, isLoading, error } = useGetRisk(
    { address: submittedAddress },
    { query: { enabled: !!submittedAddress, queryKey: getGetRiskQueryKey({ address: submittedAddress }) } }
  );

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  useEffect(() => {
    if (riskData && onResult) {
      onResult(riskData);
    }
  }, [riskData, onResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setSubmittedAddress(address);
    // If we're not on home page and don't have onResult, navigate to result page
    if (!onResult && window.location.pathname !== "/result") {
      setLocation(`/result?address=${encodeURIComponent(address)}`);
    }
  };

  return (
    <div className={styles.searchWrapper}>
      <form onSubmit={handleSubmit} className={`${styles.searchForm} ${isLoading ? styles.loading : ""}`}>
        <input
          type="text"
          className={styles.input}
          placeholder="Enter your address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          data-testid="search-input"
        />
        <button type="submit" className={styles.button} disabled={isLoading} data-testid="search-button">
          Check my address
        </button>
      </form>

      {isLoading && (
        <div className={styles.loadingWrapper}>
          <div className={styles.loadingText}>{LOADING_STEPS[loadingStep]}</div>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar} />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-accent text-sm text-center">
          Could not find risk data for this address. Please try again.
        </div>
      )}

      {riskData && onResult && (
        <div className={styles.resultWrapper}>
          <ResultCard result={riskData} />
        </div>
      )}
    </div>
  );
}
