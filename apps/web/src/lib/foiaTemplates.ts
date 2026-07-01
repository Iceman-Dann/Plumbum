import type { Translations } from "@/lib/translations/types";
import { interpolate } from "@/lib/translations";

export interface FoiaLetterOpts {
  date: string;
  address: string;
  name: string;
  email?: string;
  utilityName: string;
  officerTitle: string;
  utilityAddress: string;
  foiaLaw: string;
  t: Translations;
}

export function buildFoiaLetterUs(opts: FoiaLetterOpts): string {
  const { date, address, name, utilityName, officerTitle, utilityAddress, foiaLaw, t } = opts;
  const f = t.foia;
  const addr = address || f.addressPlaceholder;
  const bodyIntro = interpolate(f.bodyParagraphUs, { foiaLaw, address: addr });

  return `${date}

${officerTitle}
${utilityName}
${utilityAddress}

${f.subjectUs}

${f.salutationUs}

${bodyIntro}

  ${f.request1Us}
  ${f.request2Us}
  ${f.request3Us}

${f.deadlineUs}

${f.thankYou}

${f.sincerely}

${name || f.namePlaceholderLetter}

${date}`;
}

export interface FoiaCanadaLetterOpts {
  date: string;
  address: string;
  name: string;
  email?: string;
  t: Translations;
}

export function buildFoiaLetterCa(opts: FoiaCanadaLetterOpts): string {
  const { date, address, name, t } = opts;
  const f = t.foia;
  const addr = address || f.addressPlaceholder;
  const bodyIntro = interpolate(f.bodyParagraphCa, { address: addr });

  return `${date}

${f.coordinatorTitleCa}
${f.utilityPlaceholderCa}
${f.addressPlaceholderCa}

${f.subjectCa}

${f.salutationCa}

${bodyIntro}

  ${f.request1Ca}
  ${f.request2Ca}
  ${f.request3Ca}

${f.withholdingCa}

${f.thankYou}

${f.sincerely}

${name || f.namePlaceholderLetter}

${date}`;
}
