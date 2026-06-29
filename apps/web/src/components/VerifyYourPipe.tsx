import React, { useState, useRef, useCallback } from "react";
import styles from "../styles/verifyPipe.module.css";

interface Props {
  address?: string;
  censusTract?: string;
}

type UploadState = "idle" | "dragging" | "preview" | "uploading" | "success" | "error";

export default function VerifyYourPipe({ address, censusTract }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (JPG, PNG, HEIC, WebP).");
      setUploadState("error");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("File size must be under 20 MB.");
      setUploadState("error");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setUploadState("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setUploadState("idle");
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setUploadState("dragging");
  };

  const handleDragLeave = () => {
    if (uploadState === "dragging") setUploadState("idle");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!previewUrl || uploadState === "uploading") return;
    setUploadState("uploading");
    // Simulate async upload — wire up to real endpoint later
    await new Promise((r) => setTimeout(r, 1600));
    setUploadState("success");
  };

  const handleReset = () => {
    setUploadState("idle");
    setPreviewUrl(null);
    setFileName(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={styles.wrapper}>
      {/* Instructions */}
      <div className={styles.instructions}>
        <h3 className={styles.heading}>Verify Your Pipe</h3>
        <p className={styles.body}>
          Perform the <strong>coin-scratch test</strong> on your water main — scratch the pipe near
          where it enters your home or meter. If the scratch reveals bright silver metal beneath a
          dull grey surface, you likely have a lead pipe.{" "}
          <strong>Upload a photo of the scratched pipe</strong> to help verify our model's accuracy
          and contribute to our open dataset.
        </p>
        <ol className={styles.steps}>
          <li>Locate your water main (usually in the basement or utility room near the meter).</li>
          <li>Scratch a small area with a coin or key.</li>
          <li>Photograph the scratched surface in good lighting.</li>
          <li>Upload the image below.</li>
        </ol>
      </div>

      {/* Success state */}
      {uploadState === "success" ? (
        <div className={styles.successBox}>
          <div className={styles.successIcon}>✓</div>
          <div className={styles.successTitle}>Photo submitted. Thank you.</div>
          <p className={styles.successBody}>
            Your image has been anonymized and added to the Plumbum open training dataset for census
            tract <strong>{censusTract || "your area"}</strong>. It will be reviewed within 48 hours.
          </p>
          <button className={styles.resetBtn} onClick={handleReset} type="button">
            Upload another photo
          </button>
        </div>
      ) : (
        <>
          {/* Drop zone */}
          <div
            className={`${styles.dropZone} ${uploadState === "dragging" ? styles.dropZoneDragging : ""} ${uploadState === "preview" ? styles.dropZoneHasFile : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            role="button"
            tabIndex={0}
            aria-label="Drop zone for pipe photo upload"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          >
            {uploadState === "preview" && previewUrl ? (
              <div className={styles.previewWrapper} onClick={(e) => e.stopPropagation()}>
                <img src={previewUrl} alt="Pipe photo preview" className={styles.previewImg} />
                <div className={styles.previewName}>{fileName}</div>
              </div>
            ) : (
              <div className={styles.dropZoneInner}>
                {/* Pipe icon — simple SVG */}
                <svg className={styles.dropIcon} width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="4" y="16" width="32" height="8" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="8" width="12" height="8" stroke="currentColor" strokeWidth="1.5" />
                  <rect x="14" y="24" width="12" height="8" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="20" y1="20" x2="28" y2="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
                  <circle cx="29" cy="11" r="2" fill="currentColor" />
                </svg>
                <div className={styles.dropText}>
                  Drag &amp; drop your pipe photo here
                </div>
                <div className={styles.dropSub}>or click to browse — JPG, PNG, HEIC · max 20 MB</div>
              </div>
            )}
          </div>

          {/* Hidden native file input */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleInputChange}
            aria-label="Upload pipe photo"
          />

          {/* Error */}
          {uploadState === "error" && errorMsg && (
            <div className={styles.errorMsg} role="alert">{errorMsg}</div>
          )}

          {/* Action row */}
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.uploadBtn}
              onClick={() => inputRef.current?.click()}
            >
              Choose photo
            </button>

            {(uploadState === "preview" || uploadState === "uploading") && (
              <>
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleSubmit}
                  disabled={uploadState === "uploading"}
                >
                  {uploadState === "uploading" ? "Uploading…" : "Submit photo →"}
                </button>
                <button type="button" className={styles.clearBtn} onClick={handleReset} disabled={uploadState === "uploading"}>
                  Remove
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Legal disclaimer */}
      <p className={styles.disclaimer}>
        Images are anonymized and used exclusively to train the Plumbum open-source predictive model.
        No personally identifiable information is stored. By uploading, you grant Plumbum a
        non-exclusive, royalty-free licence to use this image for model training under the{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noreferrer"
          className={styles.disclaimerLink}
        >
          CC BY 4.0
        </a>{" "}
        licence.
      </p>
    </div>
  );
}
