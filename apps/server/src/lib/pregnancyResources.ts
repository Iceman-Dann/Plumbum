export interface PregnancyResource {
  wicUrl: string;
  wicPhone: string;
  healthDeptUrl: string;
}

export const PREGNANCY_RESOURCES: Record<string, PregnancyResource> = {
  AL: { wicUrl: "https://www.alabamapublichealth.gov/wic/", wicPhone: "1-888-942-4673", healthDeptUrl: "https://www.alabamapublichealth.gov/lead/" },
  AK: { wicUrl: "https://dhss.alaska.gov/dpa/Programs/nutri/wic/Pages/default.aspx", wicPhone: "1-907-465-3100", healthDeptUrl: "https://dhss.alaska.gov/dph/Epi/eph/Pages/lead/" },
  AZ: { wicUrl: "https://azdhs.gov/prevention/azwic/", wicPhone: "1-800-252-5942", healthDeptUrl: "https://azdhs.gov/preparedness/epidemiology-disease-control/childhood-lead/" },
  AR: { wicUrl: "https://www.healthy.arkansas.gov/programs-services/topics/wic", wicPhone: "1-800-445-6131", healthDeptUrl: "https://www.healthy.arkansas.gov/programs-services/topics/childhood-lead-poisoning-prevention" },
  CA: { wicUrl: "https://www.cdph.ca.gov/Programs/CFH/DWICSN/Pages/Program-Landing1.aspx", wicPhone: "1-888-942-9675", healthDeptUrl: "https://www.cdph.ca.gov/Programs/CCDPHP/DEODC/CLPPB/Pages/CLPPBhome.aspx" },
  CO: { wicUrl: "https://cdphe.colorado.gov/wic", wicPhone: "1-800-688-7777", healthDeptUrl: "https://cdphe.colorado.gov/lead" },
  CT: { wicUrl: "https://portal.ct.gov/DPH/WIC/WIC", wicPhone: "1-800-741-2142", healthDeptUrl: "https://portal.ct.gov/DPH/Environmental-Health/Lead-Poisoning-Prevention-and-Control/Lead-Poisoning-Prevention-and-Control-Program" },
  DC: { wicUrl: "https://dchealth.dc.gov/wic", wicPhone: "1-800-345-1942", healthDeptUrl: "https://doee.dc.gov/service/lead-and-healthy-housing" },
  DE: { wicUrl: "https://dhss.delaware.gov/dhss/dph/chca/dphwichome.html", wicPhone: "1-800-222-2189", healthDeptUrl: "https://dhss.delaware.gov/dhss/dph/hsp/lead.html" },
  FL: { wicUrl: "https://www.floridahealth.gov/programs-and-services/wic/", wicPhone: "1-800-342-3556", healthDeptUrl: "https://www.floridahealth.gov/environmental-health/lead-poisoning/" },
  GA: { wicUrl: "https://dph.georgia.gov/WIC", wicPhone: "1-800-228-9173", healthDeptUrl: "https://dph.georgia.gov/environmental-health/childhood-lead-poisoning-prevention" },
  HI: { wicUrl: "https://health.hawaii.gov/wic/", wicPhone: "1-888-820-6425", healthDeptUrl: "https://health.hawaii.gov/hems/lead/" },
  ID: { wicUrl: "https://healthandwelfare.idaho.gov/services-programs/children-families/wic", wicPhone: "1-800-922-8255", healthDeptUrl: "https://healthandwelfare.idaho.gov/health-wellness/environmental-health/lead" },
  IL: { wicUrl: "https://dph.illinois.gov/topics-services/life-stages-populations/maternal-child-family-health-services/wic.html", wicPhone: "1-800-323-4769", healthDeptUrl: "https://dph.illinois.gov/topics-services/environmental-health-protection/lead-poisoning-prevention.html" },
  IN: { wicUrl: "https://www.in.gov/health/wic/", wicPhone: "1-800-522-0874", healthDeptUrl: "https://www.in.gov/health/lead-and-healthy-homes-division/" },
  IA: { wicUrl: "https://hhs.iowa.gov/programs/programs-and-services/wic", wicPhone: "1-800-532-1579", healthDeptUrl: "https://hhs.iowa.gov/programs/programs-and-services/childhood-lead-poisoning-prevention" },
  KS: { wicUrl: "https://www.kdhe.ks.gov/1000/WIC", wicPhone: "1-888-369-4777", healthDeptUrl: "https://www.kdhe.ks.gov/1070/Childhood-Lead-Poisoning-Prevention" },
  KY: { wicUrl: "https://chfs.ky.gov/agencies/dph/dmch/nsb/Pages/wic.aspx", wicPhone: "1-800-462-6122", healthDeptUrl: "https://chfs.ky.gov/agencies/dph/dphps/emb/Pages/clppp.aspx" },
  LA: { wicUrl: "https://ldh.la.gov/index.cfm/page/242", wicPhone: "1-800-251-2229", healthDeptUrl: "https://ldh.la.gov/index.cfm/page/1041" },
  ME: { wicUrl: "https://www.maine.gov/dhhs/mecdc/population-health/wic/", wicPhone: "1-800-437-9300", healthDeptUrl: "https://www.maine.gov/dhhs/mecdc/environmental-health/eohp/lead/" },
  MD: { wicUrl: "https://health.maryland.gov/phpa/wic/Pages/Home.aspx", wicPhone: "1-800-242-4942", healthDeptUrl: "https://health.maryland.gov/phpa/OEHFP/CHS/Pages/Lead.aspx" },
  MA: { wicUrl: "https://www.mass.gov/women-infants-children-wic-nutrition-program", wicPhone: "1-800-942-1007", healthDeptUrl: "https://www.mass.gov/lead-poisoning-prevention" },
  MI: { wicUrl: "https://www.michigan.gov/wic", wicPhone: "1-800-262-4784", healthDeptUrl: "https://www.michigan.gov/lead" },
  MN: { wicUrl: "https://www.health.state.mn.us/people/wic/index.html", wicPhone: "1-800-657-3942", healthDeptUrl: "https://www.health.state.mn.us/communities/environment/lead/index.html" },
  MS: { wicUrl: "https://msdh.ms.gov/page/41,0,128.html", wicPhone: "1-800-545-6747", healthDeptUrl: "https://msdh.ms.gov/page/14,0,119.html" },
  MO: { wicUrl: "https://health.mo.gov/living/families/wic/", wicPhone: "1-800-392-8209", healthDeptUrl: "https://health.mo.gov/living/environment/lead/" },
  MT: { wicUrl: "https://dphhs.mt.gov/ecfsd/wic/", wicPhone: "1-800-433-4298", healthDeptUrl: "https://dphhs.mt.gov/publichealth/lead" },
  NE: { wicUrl: "https://dhhs.ne.gov/Pages/WIC.aspx", wicPhone: "1-800-388-1365", healthDeptUrl: "https://dhhs.ne.gov/Pages/Lead.aspx" },
  NV: { wicUrl: "https://dpbh.nv.gov/Programs/WIC/Women,_Infants___Children_(WIC)_-_Home/", wicPhone: "1-800-863-8942", healthDeptUrl: "https://dpbh.nv.gov/Programs/CLPPP/Childhood_Lead_Poisoning_Prevention_Program_(CLPPP)/" },
  NH: { wicUrl: "https://www.dhhs.nh.gov/programs-services/health-care/women-infants-children-wic", wicPhone: "1-800-852-3345", healthDeptUrl: "https://www.dhhs.nh.gov/programs-services/environmental-health-and-you/lead-poisoning-prevention" },
  NJ: { wicUrl: "https://www.nj.gov/health/fhs/wic/", wicPhone: "1-866-446-5942", healthDeptUrl: "https://www.nj.gov/health/childhoodlead/" },
  NM: { wicUrl: "https://www.nmhealth.org/about/phd/fhb/wic/", wicPhone: "1-866-867-3124", healthDeptUrl: "https://www.nmhealth.org/about/erd/eheb/lead/" },
  NY: { wicUrl: "https://www.health.ny.gov/prevention/nutrition/wic/", wicPhone: "1-800-522-5006", healthDeptUrl: "https://www.health.ny.gov/environmental/lead/" },
  NC: { wicUrl: "https://www.nutritionnc.com/wic/", wicPhone: "1-800-367-2229", healthDeptUrl: "https://epi.dph.ncdhhs.gov/lead/" },
  ND: { wicUrl: "https://www.hhs.nd.gov/health/wic", wicPhone: "1-800-472-2286", healthDeptUrl: "https://www.hhs.nd.gov/health/lead" },
  OH: { wicUrl: "https://odh.ohio.gov/wps/portal/gov/odh/know-our-programs/women-infants-children", wicPhone: "1-800-755-4769", healthDeptUrl: "https://odh.ohio.gov/wps/portal/gov/odh/know-our-programs/childhood-lead-poisoning" },
  OK: { wicUrl: "https://oklahoma.gov/health/family-health/wic.html", wicPhone: "1-888-655-2942", healthDeptUrl: "https://oklahoma.gov/health/health-education/lead-poisoning-prevention.html" },
  OR: { wicUrl: "https://www.oregon.gov/oha/ph/healthypeoplefamilies/wic/pages/index.aspx", wicPhone: "1-800-723-3638", healthDeptUrl: "https://www.oregon.gov/oha/ph/healthyenvironments/healthyneighborhoods/leadpoisoning/pages/index.aspx" },
  PA: { wicUrl: "https://www.health.pa.gov/topics/programs/WIC/Pages/WIC.aspx", wicPhone: "1-800-942-9184", healthDeptUrl: "https://www.health.pa.gov/topics/disease/Lead%20Poisoning/Pages/Lead%20Poisoning.aspx" },
  RI: { wicUrl: "https://health.ri.gov/programs/detail.php?pgm_id=31", wicPhone: "1-800-942-7434", healthDeptUrl: "https://health.ri.gov/healthrisks/poisoning/lead/" },
  SC: { wicUrl: "https://scdhec.gov/health/wic-women-infants-children", wicPhone: "1-800-922-4406", healthDeptUrl: "https://scdhec.gov/environment/your-home/lead" },
  SD: { wicUrl: "https://doh.sd.gov/family/wic/", wicPhone: "1-800-738-2301", healthDeptUrl: "https://doh.sd.gov/environment/lead/" },
  TN: { wicUrl: "https://www.tn.gov/health/health-program-areas/fhw/wic.html", wicPhone: "1-800-342-5942", healthDeptUrl: "https://www.tn.gov/health/health-program-areas/mch/lead.html" },
  TX: { wicUrl: "https://texaswic.org/", wicPhone: "1-800-942-3678", healthDeptUrl: "https://dshs.texas.gov/lead/" },
  UT: { wicUrl: "https://wic.utah.gov/", wicPhone: "1-877-942-5437", healthDeptUrl: "https://ptc.utah.gov/programs/lead/" },
  VT: { wicUrl: "https://www.healthvermont.gov/family/wic", wicPhone: "1-800-649-4357", healthDeptUrl: "https://www.healthvermont.gov/environment/lead" },
  VA: { wicUrl: "https://www.vdh.virginia.gov/wic/", wicPhone: "1-888-942-3663", healthDeptUrl: "https://www.vdh.virginia.gov/leadsafe/" },
  WA: { wicUrl: "https://doh.wa.gov/you-and-your-family/wic", wicPhone: "1-800-322-2588", healthDeptUrl: "https://doh.wa.gov/community-and-environment/contaminants/lead" },
  WV: { wicUrl: "https://dhhr.wv.gov/WIC/Pages/default.aspx", wicPhone: "1-800-642-8522", healthDeptUrl: "https://dhhr.wv.gov/mcfh/lead/Pages/default.aspx" },
  WI: { wicUrl: "https://www.dhs.wisconsin.gov/wic/index.htm", wicPhone: "1-800-441-4563", healthDeptUrl: "https://www.dhs.wisconsin.gov/lead/index.htm" },
  WY: { wicUrl: "https://health.wyo.gov/publichealth/wic/", wicPhone: "1-888-996-9421", healthDeptUrl: "https://health.wyo.gov/publichealth/infectious-disease-epidemiology-unit/lead/" },
};

export function getPregnancyResourcesForState(state: string): PregnancyResource {
  const upperState = state.toUpperCase();
  return PREGNANCY_RESOURCES[upperState] || PREGNANCY_RESOURCES["CA"]; // default to CA if not found
}
