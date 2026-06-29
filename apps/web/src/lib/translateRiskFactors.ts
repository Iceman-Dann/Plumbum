import type { Language, Translations } from "@/lib/translations/types";

const FACTOR_NAME_KEYS: Record<string, keyof Translations["riskFactors"]> = {
  "Pre-1986 Construction": "pre1986",
  "EPA Violation History": "epaViolations",
  "Economic Investment Risk": "economicRisk",
  "Regional Risk Profile": "regionalRisk",
};

export function translateRiskLevel(level: string, t: Translations): string {
  const normalized = level.toLowerCase().replace(/\s+/g, "");
  if (normalized === "veryhigh") return t.riskLevels.veryHigh;
  if (normalized === "high") return t.riskLevels.high;
  if (normalized === "moderate") return t.riskLevels.moderate;
  if (normalized === "low") return t.riskLevels.low;
  return level;
}

export function translateSeverity(severity: string, t: Translations): string {
  const key = severity.toUpperCase().replace(/\s+/g, "_") as keyof Translations["riskLevels"];
  return t.riskLevels[key] ?? severity;
}

export function translateFactorName(name: string, t: Translations, lang: Language): string {
  if (lang === "en") return name;
  const key = FACTOR_NAME_KEYS[name];
  return key ? t.riskFactors[key] : name;
}

/** Translate API-generated factor detail strings from English to Spanish via pattern matching. */
export function translateFactorDetail(detail: string, lang: Language): string {
  if (lang === "en" || !detail) return detail;

  const patterns: Array<[RegExp, (...args: string[]) => string]> = [
    [
      /^(\d+(?:\.\d+)?)% of housing units in this census tract were built before 1986/,
      (pct) =>
        `${pct}% de las unidades de vivienda en este tracto censal fueron construidas antes de 1986, cuando entró en vigor la prohibición de plomo de la Ley de Agua Potable Segura.`,
    ],
    [
      /^State-level data used \(tract data unavailable\): approximately (\d+(?:\.\d+)?)% of housing units were built before 1986\. (.+)$/,
      (pct, rest) =>
        `Se utilizaron datos a nivel estatal (datos del tracto no disponibles): aproximadamente ${pct}% de las unidades de vivienda fueron construidas antes de 1986. ${translateFactorDetail(rest, lang)}`,
    ],
    [
      /^Census housing age data was unavailable for this address\. A moderate precautionary score is applied — the national average is approximately 45% pre-1986 housing\.$/,
      () =>
        "Los datos de antigüedad de vivienda del censo no estaban disponibles para esta dirección. Se aplica una puntuación precautoria moderada — el promedio nacional es aproximadamente 45% de viviendas anteriores a 1986.",
    ],
    [
      /^EPA violation history data was unavailable for this state\. A minimum precautionary score is applied\. Absence of data does not indicate absence of risk\.$/,
      () =>
        "Los datos de historial de violaciones de la EPA no estaban disponibles para este estado. Se aplica una puntuación precautoria mínima — la ausencia de datos no indica ausencia de riesgo.",
    ],
    [
      /^No lead or copper action level exceedances recorded in the EPA SDWIS database for this state's water systems in the past 10 years\.$/,
      () =>
        "No se registraron excedencias del nivel de acción de plomo o cobre en la base de datos EPA SDWIS para los sistemas de agua de este estado en los últimos 10 años.",
    ],
    [
      /^1 lead or copper action level exceedance recorded in the EPA SDWIS database for water systems in this state in the past 10 years\.$/,
      () =>
        "1 excedencia del nivel de acción de plomo o cobre registrada en la base de datos EPA SDWIS para sistemas de agua en este estado en los últimos 10 años.",
    ],
    [
      /^(\d+) lead or copper action level exceedances recorded in the EPA SDWIS database for water systems in this state in the past 10 years — a significantly elevated violation history\.$/,
      (count) =>
        `${count} excedencias del nivel de acción de plomo o cobre registradas en la base de datos EPA SDWIS para sistemas de agua en este estado en los últimos 10 años — un historial de violaciones significativamente elevado.`,
    ],
    [
      /^(\d+) lead or copper action level exceedances recorded in the EPA SDWIS database for water systems in this state in the past 10 years\.$/,
      (count) =>
        `${count} excedencias del nivel de acción de plomo o cobre registradas en la base de datos EPA SDWIS para sistemas de agua en este estado en los últimos 10 años.`,
    ],
    [
      /^Median household income data was unavailable for this census tract\. A moderate score is applied as a precaution\.$/,
      () =>
        "Los datos de ingreso mediano del hogar no estaban disponibles para este tracto censal. Se aplica una puntuación moderada como precaución.",
    ],
    [
      /^Median household income in this tract is (\$[\d,]+) — below \$35,000\. Lower-income communities face greater lead exposure risk due to older housing stock and reduced infrastructure investment\.$/,
      (income) =>
        `El ingreso mediano del hogar en este tracto es ${income} — por debajo de $35,000. Las comunidades de bajos ingresos enfrentan mayor riesgo de exposición al plomo debido a viviendas más antiguas y menor inversión en infraestructura.`,
    ],
    [
      /^Median household income in this tract is (\$[\d,]+)\. Tracts in the \$35,000–\$55,000 range face elevated risk of deferred infrastructure maintenance\.$/,
      (income) =>
        `El ingreso mediano del hogar en este tracto es ${income}. Los tractos en el rango de $35,000–$55,000 enfrentan un riesgo elevado de mantenimiento de infraestructura diferido.`,
    ],
    [
      /^Median household income in this tract is (\$[\d,]+)\. Moderate income range with average likelihood of infrastructure investment\.$/,
      (income) =>
        `El ingreso mediano del hogar en este tracto es ${income}. Rango de ingresos moderado con probabilidad promedio de inversión en infraestructura.`,
    ],
    [
      /^Median household income in this tract is (\$[\d,]+)\. Higher-income areas typically see faster infrastructure replacement and lower lead exposure rates\.$/,
      (income) =>
        `El ingreso mediano del hogar en este tracto es ${income}. Las áreas de mayores ingresos suelen ver reemplazo de infraestructura más rápido y menores tasas de exposición al plomo.`,
    ],
    [
      /^(.+) has extensively documented lead service line infrastructure and a history of action level exceedances, placing it among the highest-risk states nationally\.$/,
      (state) =>
        `${state} tiene infraestructura de tuberías de servicio de plomo ampliamente documentada y un historial de excedencias del nivel de acción, ubicándolo entre los estados de mayor riesgo a nivel nacional.`,
    ],
    [
      /^(.+) has documented lead service line issues in pre-war and mid-century housing stock, with ongoing replacement programs underway\.$/,
      (state) =>
        `${state} tiene problemas documentados de tuberías de servicio de plomo en viviendas de antes de la guerra y de mediados de siglo, con programas de reemplazo en curso.`,
    ],
    [
      /^(.+) has some documented lead pipe risk in older urban areas, particularly in cities with pre-1960 housing density\.$/,
      (state) =>
        `${state} tiene algún riesgo documentado de tuberías de plomo en áreas urbanas antiguas, particularmente en ciudades con densidad de viviendas anteriores a 1960.`,
    ],
    [
      /^(.+) has below-average documented lead service line risk at the state level based on EPA SDWIS compliance data and inventory estimates\.$/,
      (state) =>
        `${state} tiene un riesgo documentado de tuberías de servicio de plomo por debajo del promedio a nivel estatal según datos de cumplimiento EPA SDWIS y estimaciones de inventario.`,
    ],
  ];

  for (const [regex, replacer] of patterns) {
    const match = detail.match(regex);
    if (match) {
      return replacer(...match.slice(1));
    }
  }

  return detail;
}

export function translateFactor(
  factor: { name?: string; detail?: string; severity?: string },
  t: Translations,
  lang: Language,
) {
  const name = factor.name ?? "";
  return {
    title: translateFactorName(name, t, lang),
    explanation: translateFactorDetail(factor.detail ?? "", lang),
    severity: factor.severity ?? "MODERATE",
  };
}
