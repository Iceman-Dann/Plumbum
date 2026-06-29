import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useGetRisk, getGetRiskQueryKey, type RiskResult } from "@workspace/api-client-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePregnancyMode } from "@/hooks/usePregnancyMode";
import ResultCard from "./ResultCard";
import styles from "../styles/search.module.css";

interface SearchBarProps {
  initialAddress?: string;
  onResult?: (result: RiskResult) => void;
  size?: "small" | "large";
  hideUrlForm?: boolean;
  flat?: boolean;
}

export default function SearchBar({
  initialAddress = "",
  onResult,
  size = "large",
  hideUrlForm = false,
  flat = false,
}: SearchBarProps) {
  const { t } = useTranslation();
  const { isPregnant, setIsPregnant } = usePregnancyMode();
  const [address, setAddress] = useState(initialAddress);
  const [submittedAddress, setSubmittedAddress] = useState("");
  const [, setLocation] = useLocation();
  const [loadingStep, setLoadingStep] = useState(0);

  // Smart Search states
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [locating, setLocating] = useState(false);

  // Real estate URL input
  const [listingUrl, setListingUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState("");

  const loadingSteps = useMemo(
    () => [t.search.loadingStep1, t.search.loadingStep2, t.search.loadingStep3],
    [t],
  );

  // Load Google Places JS API using config endpoint key
  useEffect(() => {
    if ((window as any).google?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    fetch("/api/config/places-key")
      .then((res) => res.json())
      .then((data) => {
        if (!data.key) return;
        const scriptId = "google-places-script";
        if (!document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places`;
          script.async = true;
          script.onload = () => setGoogleLoaded(true);
          document.head.appendChild(script);
        } else {
          const interval = setInterval(() => {
            if ((window as any).google?.maps?.places) {
              setGoogleLoaded(true);
              clearInterval(interval);
            }
          }, 100);
        }
      })
      .catch((err) => console.error("Error loading Places API key:", err));
  }, []);

  // Fetch Autocomplete predictions
  useEffect(() => {
    if (!googleLoaded || !address.trim()) {
      setSuggestions([]);
      return;
    }
    const maps = (window as any).google.maps;
    const autocompleteService = new maps.places.AutocompleteService();

    const timer = setTimeout(() => {
      autocompleteService.getPlacePredictions(
        {
          input: address,
          types: ["address"],
          componentRestrictions: { country: ["us", "ca"] },
        },
        (predictions: any, status: any) => {
          if (status === maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.slice(0, 5).map((p: any) => p.description));
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 150);

    return () => clearTimeout(timer);
  }, [address, googleLoaded]);

  // Load search history on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("plumbum_history");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 5));
        }
      }
    } catch (err) {
      console.error("Failed to load history from localStorage:", err);
    }
  }, []);

  const addToHistory = (addr: string) => {
    const trimmed = addr.trim();
    if (!trimmed) return;
    try {
      const raw = localStorage.getItem("plumbum_history");
      let hist: string[] = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(hist)) hist = [];
      hist = hist.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      hist.unshift(trimmed);
      hist = hist.slice(0, 5);
      localStorage.setItem("plumbum_history", JSON.stringify(hist));
      setHistory(hist);
    } catch (err) {
      console.error("Failed to save search history:", err);
    }
  };

  const triggerSubmit = (addr: string) => {
    const trimmed = addr.trim();
    if (!trimmed) return;
    setSubmittedAddress(trimmed);
    addToHistory(trimmed);
    if (!onResult && window.location.pathname !== "/result") {
      setLocation(`/result?address=${encodeURIComponent(trimmed)}`);
    }
  };

  const { data: riskData, isLoading, error } = useGetRisk(
    { address: submittedAddress },
    { query: { enabled: !!submittedAddress, queryKey: getGetRiskQueryKey({ address: submittedAddress }) } }
  );

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 500);
    return () => clearInterval(interval);
  }, [isLoading, loadingSteps.length]);

  useEffect(() => {
    if (riskData && onResult) {
      onResult(riskData);
    }
  }, [riskData, onResult]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSubmit(address);
  };

  const handleSuggestionClick = (addr: string) => {
    setAddress(addr);
    triggerSubmit(addr);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      localStorage.removeItem("plumbum_history");
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `/api/reverse-geocode?lat=${latitude}&lng=${longitude}`
          );
          if (!res.ok) throw new Error();
          const data = await res.json();
          if (data && data.address) {
            setAddress(data.address);
            triggerSubmit(data.address);
          } else {
            alert("Could not determine your address.");
          }
        } catch (err) {
          alert("Failed to reverse geocode location.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        alert("Error retrieving location. Please verify location permissions.");
        setLocating(false);
      }
    );
  };

  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = listingUrl.trim();
    if (!trimmed) return;
    setUrlError("");
    setUrlLoading(true);
    try {
      // Navigate immediately — the listing result page will handle the fetch
      setLocation(`/listing-result?url=${encodeURIComponent(trimmed)}`);
    } catch {
      setUrlError("Something went wrong. Please try again.");
      setUrlLoading(false);
    }
  };

  return (
    <>
      <div className={`${styles.searchCard} ${flat ? styles.flatCard : ""}`}>
        <div className={styles.searchWrapper}>
          <form onSubmit={handleSubmit} className={`${styles.searchForm} ${size === "small" ? styles.small : ""} ${isLoading ? styles.loading : ""}`}>
            <input
              type="text"
              className={styles.input}
              placeholder={t.search.placeholder}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              data-testid="search-input"
            />
            <button
              type="button"
              onClick={handleUseLocation}
              className={styles.locationButton}
              title="Use my location"
              disabled={locating}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </button>
            <button type="submit" className={styles.button} disabled={isLoading || locating} data-testid="search-button">
              {t.search.button}
            </button>
          </form>

          {/* Pregnancy Mode Toggle */}
          <div className={styles.pregnancyToggleContainer}>
            <label className={styles.pregnancyToggleLabel}>
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
                className={styles.pregnancyCheckbox}
              />
              <span className={styles.pregnancyToggleText}>
                🛡️ Enable Pregnancy & Pediatric Guardrails (Strict Advisory Thresholds)
              </span>
            </label>
          </div>

          {flat && (
            <div className={styles.flatImpartialityText}>
              {t.home.notACompany}
            </div>
          )}

          {/* Conditionally render suggestions or history dropdown */}
          {isFocused && (address.trim() ? suggestions.length > 0 : history.length > 0) && (
            <div className={styles.dropdown} style={{ top: size === "small" ? "50px" : "58px" }}>
              {address.trim() ? (
                suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className={styles.dropdownItem}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))
              ) : (
                <div className={styles.historyDropdown}>
                  <div className={styles.historyLabel}>Recent searches</div>
                  {history.map((item, idx) => (
                    <div
                      key={idx}
                      className={styles.dropdownItem}
                      onClick={() => handleSuggestionClick(item)}
                    >
                      {item}
                    </div>
                  ))}
                  <div className={styles.clearHistoryRow}>
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={handleClearHistory}
                    >
                      Clear history
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {locating && (
            <div className={styles.locatingText}>Locating you...</div>
          )}

          {!hideUrlForm && (
            <>
              {isLoading && (
                <div className={styles.terminalLoader}>
                  [ {loadingSteps[loadingStep].toUpperCase()} ]
                </div>
              )}

              {error && (
                <div className="mt-4 text-accent text-sm text-center">
                  {t.search.error}
                </div>
              )}

              {riskData && onResult && (
                <div className={styles.resultWrapper}>
                  <ResultCard result={riskData} />
                </div>
              )}

              {/* ── Real estate URL input & Extension Promo ── */}
              <div className={styles.orDivider}>
                <span className={styles.orText}>or</span>
              </div>

              <div className={styles.extensionPromo}>
                <span className={styles.extensionPromoText}>Looking at homes on Zillow or Redfin?</span>
                <Link href="/extension" className={styles.extensionPromoLink}>
                  <svg className={styles.chromeIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" />
                    <line x1="21.17" y1="8" x2="12" y2="8" />
                    <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                    <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                  </svg>
                  Get Extension
                </Link>
              </div>

              <form onSubmit={handleListingSubmit} className={styles.urlForm}>
                <input
                  id="listing-url-input"
                  type="url"
                  className={styles.urlInput}
                  placeholder="Paste listing URL to scan"
                  value={listingUrl}
                  onChange={(e) => { setListingUrl(e.target.value); setUrlError(""); }}
                  data-testid="listing-url-input"
                />
                <button
                  id="check-listing-button"
                  type="submit"
                  className={styles.urlButton}
                  disabled={urlLoading || !listingUrl.trim()}
                  data-testid="check-listing-button"
                >
                  {urlLoading ? "Checking…" : "Scan URL"}
                </button>
              </form>

              {urlError && (
                <div className={styles.urlError}>{urlError}</div>
              )}
            </>
          )}
        </div>
      </div>
      {!hideUrlForm && (
        <div className={styles.impartialityBadge}>
          {t.home.notACompany}
        </div>
      )}
    </>
  );
}
