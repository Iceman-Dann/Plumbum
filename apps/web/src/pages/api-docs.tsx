import { useState } from "react";
import styles from "../styles/api-docs.module.css";

export default function ApiDocs() {
  const [address, setAddress] = useState("123 Main St, Newark, NJ 07102");
  const [liveResponse, setLiveResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLiveDemo = async () => {
    setLoading(true);
    setLiveResponse(null);
    try {
      const res = await fetch(`/api/v1/risk?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      setLiveResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setLiveResponse(JSON.stringify({ error: "Failed to fetch" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarGroup}>
          <h3 className={styles.sidebarTitle}>Getting Started</h3>
          <a href="#intro" className={styles.sidebarLink}>Introduction</a>
          <a href="#authentication" className={styles.sidebarLink}>Authentication</a>
        </div>
        <div className={styles.sidebarGroup}>
          <h3 className={styles.sidebarTitle}>Endpoints</h3>
          <a href="#risk" className={styles.sidebarLink}>GET /risk</a>
          <a href="#risk-batch" className={styles.sidebarLink}>POST /risk/batch</a>
          <a href="#tract" className={styles.sidebarLink}>GET /tract/:fips</a>
          <a href="#hotspots" className={styles.sidebarLink}>GET /hotspots</a>
          <a href="#schools" className={styles.sidebarLink}>GET /schools</a>
          <a href="#violations" className={styles.sidebarLink}>GET /data/violations</a>
        </div>
      </div>
      
      <div className={styles.content}>
        <section id="intro" className={styles.section}>
          <div className={styles.sectionText}>
            <h1>Plumbum API</h1>
            <p>The Plumbum API allows journalists, researchers, and developers to programmatically access lead water risk data, EPA violations, and hotspots.</p>
          </div>
          <div className={styles.sectionCode}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>Base URL</div>
              <pre><code>https://plumbum.io/api/v1</code></pre>
            </div>
          </div>
        </section>
        
        <section id="authentication" className={styles.section}>
          <div className={styles.sectionText}>
            <h2>Authentication</h2>
            <p>Basic endpoints like single-address risk scores do not require an API key. For batch operations and bulk data access, you'll need a free API key.</p>
            <p>To request a key, send a POST request to <code>/api/v1/keys/request</code> with your name, email, and intended use.</p>
            <p>Pass your key in the Authorization header: <code>Authorization: Bearer pb_...</code></p>
          </div>
          <div className={styles.sectionCode}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>cURL - Request Key</div>
              <pre><code>{`curl -X POST https://plumbum.io/api/v1/keys/request \\
-H "Content-Type: application/json" \\
-d '{"name": "Jane", "email": "jane@example.com", "intended_use": "journalist"}'`}</code></pre>
            </div>
          </div>
        </section>

        <section id="risk" className={styles.section}>
          <div className={styles.sectionText}>
            <h2>Get Risk Score</h2>
            <p>Retrieve the lead pipe risk score and associated factors for a specific US address.</p>
            
            <div className={styles.liveExplorer}>
              <h3>Live API Explorer</h3>
              <div className={styles.explorerInputGroup}>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  className={styles.explorerInput}
                />
                <button onClick={fetchLiveDemo} disabled={loading} className={styles.explorerBtn}>
                  {loading ? "Fetching..." : "Test Live"}
                </button>
              </div>
              {liveResponse && (
                <pre className={styles.explorerResponse}><code>{liveResponse}</code></pre>
              )}
            </div>
          </div>
          
          <div className={styles.sectionCode}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>Python</div>
              <pre><code>{`import requests

response = requests.get(
    "https://plumbum.io/api/v1/risk",
    params={"address": "123 Main St, Newark, NJ 07102"}
)
data = response.json()
print(f"Risk score: {data['score']}/100 — {data['risk_level']}")`}</code></pre>
            </div>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>JavaScript</div>
              <pre><code>{`const response = await fetch("https://plumbum.io/api/v1/risk?address=123+Main+St");
const data = await response.json();
console.log(data);`}</code></pre>
            </div>
          </div>
        </section>
        
        <section id="risk-batch" className={styles.section}>
          <div className={styles.sectionText}>
            <h2>Batch Risk Scores</h2>
            <p>Score up to 50 addresses in a single request. <strong>Requires an API key.</strong></p>
          </div>
          <div className={styles.sectionCode}>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>cURL</div>
              <pre><code>{`curl -X POST https://plumbum.io/api/v1/risk/batch \\
-H "Authorization: Bearer pb_yourkeyhere" \\
-H "Content-Type: application/json" \\
-d '{"addresses": ["123 Main St", "456 Oak Ave"]}'`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
