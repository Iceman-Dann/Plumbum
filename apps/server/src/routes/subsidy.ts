import { Router } from "express";

const router = Router();

router.get("/subsidy/find", async (req, res) => {
  const { city, state } = req.query;
  const displayCity = (city as string) || "";
  const displayState = (state as string) || "";

  const cleanCity = displayCity.trim().toLowerCase();
  const cleanState = displayState.trim().toLowerCase();

  const apiKey = process.env.GROQ_API_KEY;

  if (apiKey && cleanCity && cleanState) {
    try {
      const prompt = `You are a municipal lead pipe advisor assisting a homeowner who wants to replace their lead service line (LSL).
Identify the lead service line replacement (LSLR) grant, loan, or subsidy programs for:
City: ${displayCity}
State: ${displayState}

Search your knowledge for specific programs (e.g., Newark's Lead Service Line Replacement Program, NYC DEP's Lead Free program, Chicago's LSLR programs, or state-level SRF/Bipartisan Infrastructure Law subsidies).
Provide a concise, direct summary in exactly 3 bullet points:
- Program Details & Subsidy Amount: Specify if replacement is free, partially subsidized (e.g. $2,500 grant), or if there are 0% interest loans.
- Estimated private-side cost: Give a typical cost range or estimate (usually $3,000 to $8,000, or $0 if free).
- Actions/Application Link: Give the name of the agency or specific website to contact or search for to apply.

Keep it plain-text, direct, and conversational. Format as bullet points using '-' prefix. Do not return any introductory or concluding text.`;

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
          max_tokens: 300,
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
      req.log.error(err, "Groq LSLR subsidy finder call failed. Falling back to local data.");
    }
  }

  // High-fidelity fallback matches
  let bullets: string[] = [];

  if (cleanCity === "newark" || cleanCity.includes("newark")) {
    bullets = [
      `- **Program & Subsidy**: Newark's Lead Service Line Replacement Program replaces all lead lines 100% free of charge. The city council banned property owner charges for this program.`,
      `- **Private-Side Cost**: $0 (Fully funded by the city of Newark through municipal bonds and state grants).`,
      `- **Next Step**: Register and sign the owner authorization form on the official **Newark Lead Service Line Replacement** portal.`
    ];
  } else if (cleanCity === "chicago" || cleanCity.includes("chicago")) {
    bullets = [
      `- **Program & Subsidy**: Chicago offers the Equity LSLR Program (free replacement for households earning under 80% AMI) and the Daycare LSLR Program. There is also a homeowner-initiated program where the city waives permit fees (up to $5,000 value).`,
      `- **Private-Side Cost**: $0 if income-eligible; otherwise $4,000 to $8,000 under homeowner-initiated path.`,
      `- **Next Step**: Apply online through the **Chicago Water Lead Service Line Replacement (LSLR) Portal**.`
    ];
  } else if (cleanCity === "new york" || cleanCity === "new york city" || cleanCity === "nyc" || cleanCity.includes("york")) {
    bullets = [
      `- **Program & Subsidy**: The NYC Department of Environmental Protection (DEP) offers assistance programs for low-income owners. The Bipartisan Infrastructure Law has also expanded local funding.`,
      `- **Private-Side Cost**: Typically $5,000 to $10,000, but interest-free payment programs and partial grants are available for qualified residential buildings.`,
      `- **Next Step**: Visit the **Lead Free NYC** portal or contact the NYC DEP Bureau of Water and Sewer Operations.`
    ];
  } else if (cleanCity === "baltimore" || cleanCity.includes("baltimore")) {
    bullets = [
      `- **Program & Subsidy**: Baltimore City DPW provides partial funding offsets. The state of Maryland receives annual federal allocations for LSLR loans/grants.`,
      `- **Private-Side Cost**: $3,000 to $6,000, though low-interest financing and cost-sharing options are offered.`,
      `- **Next Step**: Contact **Baltimore City DPW Water Resources** or search for MD DHCD Lead service line replacement funding.`
    ];
  } else if (cleanCity === "philadelphia" || cleanCity.includes("philadelphia") || cleanCity === "philly") {
    bullets = [
      `- **Program & Subsidy**: Philadelphia Water Department (PWD) offers the Lead Service Line Replacement Loan Program, providing interest-free (0%) loans amortized over 60 months.`,
      `- **Private-Side Cost**: $0 down payment; average loan repayments of $50–$100 per month.`,
      `- **Next Step**: Complete the **PWD Lead Service Line Loan Application** on the official Philadelphia city portal.`
    ];
  } else {
    bullets = [
      `- **Program & Subsidy**: Federal funding from the Bipartisan Infrastructure Law is distributed through state-level State Revolving Funds (SRF). Most municipalities offer partial grants ($1,000–$2,500) or 0% interest loans.`,
      `- **Private-Side Cost**: Typically ranges from $4,000 to $8,000, minus any local utility rebates or incentives.`,
      `- **Next Step**: Contact your local **Public Water System (PWS)** or municipal clerk to check for active LSL replacement rebates.`
    ];
  }

  res.json({ summary: bullets.join("\n") });
});

export default router;
