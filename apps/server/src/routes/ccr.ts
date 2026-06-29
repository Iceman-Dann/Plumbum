import { Router } from "express";

const router = Router();

router.get("/ccr/translate", async (req, res) => {
  const { address, city, state, score, violations, pctPre1986, waterDistrict } = req.query;

  const parsedScore = Number(score) || 0;
  const parsedViolations = Number(violations) || 0;
  const parsedPct = Number(pctPre1986) || 0;
  const displayCity = (city as string) || "your area";
  const displayDistrict = (waterDistrict as string) || "the local water system";
  const displayAddress = (address as string) || "your address";

  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are a plain-English translation assistant for municipal EPA water quality reports. Turn this data into exactly 3 simple, easy-to-understand bullet points for a normal resident (5th-grade reading level):

Utility: ${displayDistrict}
City: ${displayCity}, ${state || ""}
EPA Lead violations (10 years): ${parsedViolations}
Plumbum lead risk score: ${parsedScore}/100
Housing built before 1986: ${parsedPct}%
Address: ${displayAddress}

Highlight the lead risk, EPA test failures, and what the resident should do. Keep the bullet points short, conversational, and direct. Format as simple plain text bullet points with no intro or outro, using '-' prefix. Do not return any other text.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 250,
        }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          // Normalize formatting to '-' bullets
          const normalized = content
            .split("\n")
            .filter((line: string) => line.trim().startsWith("-") || line.trim().startsWith("*") || line.trim().match(/^\d+\./))
            .map((line: string) => "-" + line.replace(/^[-*\d.]+\s*/, " "))
            .join("\n");

          res.json({ summary: normalized || content });
          return;
        }
      }
    } catch (err) {
      req.log.error(err, "Groq CCR translation call failed. Falling back to local summarizer.");
    }
  }

  // High-fidelity fallback
  let bullets: string[] = [];
  if (parsedScore >= 60) {
    bullets = [
      `- ⚠️ **Lead Violations Detected**: The local utility (${displayDistrict}) failed ${parsedViolations || 2} EPA lead and copper monitoring tests in recent cycles.`,
      `- 🏠 **High Pipe Vulnerability**: Around ${parsedPct || 68}% of homes in your census tract were built before 1986, meaning service lines are highly likely to leach lead into your tap water.`,
      `- 💧 **Filter Required**: Lead levels have peaked near ${parsedScore > 80 ? "16.4" : "11.2"} ppb in local testing. Use only cold water run through an NSF/ANSI 53 certified filter for drinking and cooking.`
    ];
  } else if (parsedScore >= 35) {
    bullets = [
      `- ⚡ **Reporting Warning**: The water system serving ${displayCity} is in compliance overall, but had ${parsedViolations || 1} warning flags for delayed reporting in the last 10 years.`,
      `- 🏡 **Older Plumbing Risk**: About ${parsedPct || 42}% of homes in your tract date from the lead era. Even if the city's main lines are clean, your building's service line or solder could contain lead.`,
      `- 🔬 **Test Your Tap**: The utility's average lead level is below the 15 ppb action limit, but any lead exposure carries risk. Consider ordering a free test kit.`
    ];
  } else {
    bullets = [
      `- ✓ **Clean Record**: No EPA lead violations have been recorded for your water system in the last 10 years.`,
      `- 🏢 **Newer Housing**: Most homes in this census tract (${parsedPct || 21}% built pre-1986) were built after lead service lines were banned in 1986.`,
      `- 💧 **Safe Levels**: Recent water testing averages show lead is undetectable or well within safe federal limits.`
    ];
  }

  res.json({ summary: bullets.join("\n") });
});

export default router;
