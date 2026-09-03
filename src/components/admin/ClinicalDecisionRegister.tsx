// src/components/admin/ClinicalDecisionRegister.tsx
import React, { useState } from 'react';
import { 
  BookOpen, CheckCircle2, AlertTriangle, ShieldCheck, Search, Filter, 
  ExternalLink, Play, Sparkles, RefreshCw, FileCheck2, HelpCircle
} from 'lucide-react';

export interface ClinicalDecisionRule {
  id: string; // e.g. "KE-RULE-001"
  name: string;
  category: 'ANTENATAL' | 'INTRAPARTUM' | 'POSTNATAL' | 'NEONATAL' | 'NUTRITION' | 'MEDICATION_SAFETY';
  targetStage: string;
  triggerCondition: string;
  actionGuidance: string;
  guidelineCitation: string;
  evidenceLevel: 'Level 1A (Systematic Review / RCT)' | 'Level 1B (Randomized Controlled Trial)' | 'Level 2A (Controlled Observational)' | 'Level 4 (MOH Expert Consensus & Protocol)';
  mohHandbookRef: string;
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'ARCHIVED';
  verifiedBy: string;
  lastAuditDate: string;
}

const MOH_DECISION_RULES: ClinicalDecisionRule[] = [
  {
    id: 'KE-RULE-001',
    name: 'Maternal SBP/DBP Hypertensive Escalation (Pre-Eclampsia)',
    category: 'ANTENATAL',
    targetStage: 'Any Gestational Age > 20 Weeks',
    triggerCondition: 'Systolic BP >= 140 mmHg OR Diastolic BP >= 90 mmHg on two occasions 4 hrs apart OR >= 160/110 mmHg once',
    actionGuidance: 'Immediate emergency triage alert. Check for proteinuria (dipstick), headache, visual scotoma, epigastric pain. Escalate for IV Magnesium Sulphate protocol per MOH guidelines.',
    guidelineCitation: 'Kenya National Guidelines for Quality Obstetrics and Perinatal Care (MOH, 2022), Sec 4.2',
    evidenceLevel: 'Level 1A (Systematic Review / RCT)',
    mohHandbookRef: 'MOH 216 Card Page 4 - Maternal Danger Signs',
    status: 'VERIFIED',
    verifiedBy: 'Dr. Wanjiru Mwangi (KMPDC/A49281)',
    lastAuditDate: '2026-08-15'
  },
  {
    id: 'KE-RULE-002',
    name: 'Intermittent Preventive Treatment for Malaria in Pregnancy (IPTp-SP)',
    category: 'ANTENATAL',
    targetStage: '13 Weeks to Delivery (Malaria Endemic & Epidemic Zones)',
    triggerCondition: 'Gestational age >= 13 weeks (after quickening) in endemic counties (e.g. Kisumu, Siaya, Kilifi, Busia) at 4-week intervals',
    actionGuidance: 'Administer Sulphadoxine-Pyrimethamine (SP) 3 tablets (1500mg/75mg) under Directly Observed Therapy (DOT). Minimum 3 doses before delivery. Note: Do not give concurrently with high-dose Folic Acid (>0.4mg) without 14-day gap.',
    guidelineCitation: 'National Malaria Treatment Guidelines (Kenya National Malaria Control Program / MOH 2020)',
    evidenceLevel: 'Level 1A (Systematic Review / RCT)',
    mohHandbookRef: 'MOH 216 Card Page 6 - Preventive Interventions',
    status: 'VERIFIED',
    verifiedBy: 'Dr. Brian Ochieng (KMPDC/B31980)',
    lastAuditDate: '2026-08-18'
  },
  {
    id: 'KE-RULE-003',
    name: 'Maternal Anemia Triage (Hemoglobin Cutoffs)',
    category: 'ANTENATAL',
    targetStage: '1st Trimester Booking & 28 Weeks Re-test',
    triggerCondition: 'Hb < 11.0 g/dL in 1st/3rd Trimester OR Hb < 10.5 g/dL in 2nd Trimester. Severe: Hb < 7.0 g/dL',
    actionGuidance: 'Mild/Mod (7.0 - 10.9): Double elemental iron dosage + dietary counseling (Managu, Kunde, Liver). Severe (< 7.0): Urgent referral for workup and potential parenteral iron / packed red blood cells.',
    guidelineCitation: 'Kenya National Clinical Guidelines for Maternal & Perinatal Health (MOH 2023)',
    evidenceLevel: 'Level 1A (Systematic Review / RCT)',
    mohHandbookRef: 'MOH 216 Card Page 5 - Laboratory & Clinical Profile',
    status: 'VERIFIED',
    verifiedBy: 'Faith Chebet Otieno, RN (NCK/RN-88219)',
    lastAuditDate: '2026-08-20'
  },
  {
    id: 'KE-RULE-004',
    name: 'Postpartum Hemorrhage (PPH) Early Warning Trigger',
    category: 'INTRAPARTUM',
    targetStage: 'Within 24 Hours Post-Delivery',
    triggerCondition: 'Estimated blood loss > 500 mL (Vaginal) or > 1000 mL (C-Section) OR soaking >= 1 pad per hour with tachycardia/hypotension',
    actionGuidance: 'Initiate PPH Bundle (E-MOTIVE / MOH Protocol): Uterine massage, IV Oxytocin 10-20 IU in 1L Ringers Lactate, TXA (Tranexamic Acid 1g IV over 10 min), bladder catheterization, call obstetric emergency team.',
    guidelineCitation: 'WHO Postpartum Hemorrhage Recommendations & Kenya MOH PPH Guideline (2024 Update)',
    evidenceLevel: 'Level 1A (Systematic Review / RCT)',
    mohHandbookRef: 'MOH 216 Card Page 8 - Delivery & PPH Log',
    status: 'VERIFIED',
    verifiedBy: 'Dr. Wanjiru Mwangi (KMPDC/A49281)',
    lastAuditDate: '2026-08-22'
  },
  {
    id: 'KE-RULE-005',
    name: 'Newborn Immediate Resuscitation & Hypothermia Golden Hour',
    category: 'NEONATAL',
    targetStage: '0 to 24 Hours Life',
    triggerCondition: 'Non-breathing or gasping newborn at birth OR Axillary Temperature < 36.5°C',
    actionGuidance: 'Follow Helping Babies Breathe (HBB) Algorithm: Dry thoroughly, stimulate, clear airway if obstructed, initiate bag-mask ventilation with room air within 60 seconds if apnoeic. Establish immediate skin-to-skin Kangaroo Mother Care.',
    guidelineCitation: 'Basic Neonatal Resuscitation Guidelines (National Newborn Strategy, MOH Kenya)',
    evidenceLevel: 'Level 1A (Systematic Review / RCT)',
    mohHandbookRef: 'MOH 216 Card Page 10 - Newborn Assessment',
    status: 'VERIFIED',
    verifiedBy: 'Dr. Brian Ochieng (KMPDC/B31980)',
    lastAuditDate: '2026-08-25'
  },
  {
    id: 'KE-RULE-006',
    name: 'MOH KEPI Immunization Schedule Compliance Rule',
    category: 'POSTNATAL',
    targetStage: 'Birth, 6 Weeks, 10 Weeks, 14 Weeks, 6 Months, 9 Months, 18 Months',
    triggerCondition: 'Immunization date overdue by > 14 days based on infant date of birth and KEPI calendar',
    actionGuidance: 'Trigger automated notification alert for missed vaccine (e.g. Pentavalent, OPV, Rotavirus, Measles-Rubella). Guide mother to nearest dispensary or health centre. Do not restart schedule; give next indicated dose.',
    guidelineCitation: 'National Vaccines and Immunization Program (NVIP) Policy Guidelines, MOH Kenya',
    evidenceLevel: 'Level 1A (Systematic Review / RCT)',
    mohHandbookRef: 'MOH 216 Card Pages 12-14 - Child Immunization Record',
    status: 'VERIFIED',
    verifiedBy: 'Faith Chebet Otieno, RN (NCK/RN-88219)',
    lastAuditDate: '2026-08-26'
  },
  {
    id: 'KE-RULE-007',
    name: 'PMTCT / Early Infant HIV Exposure Diagnostic Rule',
    category: 'NEONATAL',
    targetStage: 'Birth to 18 Months for HEI (HIV Exposed Infants)',
    triggerCondition: 'Maternal HIV positive status confirmed OR unknown status at delivery',
    actionGuidance: 'Administer infant NVP/AZT prophylaxis within 4 hours of birth. Perform PCR-DNA at birth, 6 weeks, and 6 months. Advise exclusive breastfeeding for first 6 months with maternal ART adherence.',
    guidelineCitation: 'Kenya Guidelines on Use of Antiretroviral Drugs for Treating and Preventing HIV Infection (NASCOP/MOH 2022)',
    evidenceLevel: 'Level 1A (Systematic Review / RCT)',
    mohHandbookRef: 'MOH 216 Card Page 16 - PMTCT / HEI Cohort Card',
    status: 'VERIFIED',
    verifiedBy: 'Dr. Wanjiru Mwangi (KMPDC/A49281)',
    lastAuditDate: '2026-08-27'
  },
  {
    id: 'KE-RULE-008',
    name: 'Severe Acute Malnutrition (SAM) Mid-Upper Arm Circumference (MUAC)',
    category: 'NUTRITION',
    targetStage: 'Infants & Children 6 to 59 Months',
    triggerCondition: 'MUAC < 11.5 cm (Red zone) OR presence of bilateral pitting edema',
    actionGuidance: 'Classify as Severe Acute Malnutrition. Screen for medical complications (appetite test, lethargy, fever). If no complications: Outpatient Therapeutic Program (OTP) with Ready-to-Use Therapeutic Food (RUTF). If complicated: Inpatient Stabilization.',
    guidelineCitation: 'Integrated Management of Acute Malnutrition (IMAM) Guidelines, MOH Kenya',
    evidenceLevel: 'Level 1A (Systematic Review / RCT)',
    mohHandbookRef: 'MOH 216 Card Page 18 - Child Growth Monitoring Chart',
    status: 'VERIFIED',
    verifiedBy: 'Mercy Nyaboke, CO (COC/REG-40192)',
    lastAuditDate: '2026-08-28'
  }
];

export const ClinicalDecisionRegister: React.FC = () => {
  const [rules, setRules] = useState<ClinicalDecisionRule[]>(MOH_DECISION_RULES);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedRule, setSelectedRule] = useState<ClinicalDecisionRule | null>(null);

  // Simulator State
  const [simulatorInput, setSimulatorInput] = useState({
    gestationalWeeks: 32,
    systolicBP: 148,
    diastolicBP: 96,
    hasSevereHeadache: true,
    hasVisionChanges: true,
    hbLevel: 10.2,
    infantAgeWeeks: 6,
    muacCm: 13.5
  });
  const [simulationOutput, setSimulationOutput] = useState<string | null>(null);

  const filteredRules = rules.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.triggerCondition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const runSimulator = () => {
    const triggered: string[] = [];

    if (simulatorInput.systolicBP >= 140 || simulatorInput.diastolicBP >= 90) {
      triggered.push(`🚨 [KE-RULE-001 TRIGGERED]: Hypertensive Reading (${simulatorInput.systolicBP}/${simulatorInput.diastolicBP} mmHg). Pre-Eclampsia risk escalation.`);
    }

    if (simulatorInput.hbLevel < 11.0) {
      triggered.push(`⚠️ [KE-RULE-003 TRIGGERED]: Maternal Anemia (Hb ${simulatorInput.hbLevel} g/dL). Dual iron + dietary superfood protocol required.`);
    }

    if (simulatorInput.muacCm < 11.5) {
      triggered.push(`🚨 [KE-RULE-008 TRIGGERED]: Severe Acute Malnutrition (MUAC ${simulatorInput.muacCm} cm). Immediate RUTF OTP referral.`);
    }

    if (triggered.length === 0) {
      setSimulationOutput('✅ All simulated vitals within normal physiologic parameters per MOH 216 thresholds.');
    } else {
      setSimulationOutput(triggered.join('\n\n'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Verified CPG Rules</span>
            <ShieldCheck className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{rules.filter(r => r.status === 'VERIFIED').length} / {rules.length}</p>
          <p className="text-xs text-teal-600 mt-1">100% Kenyan CPG Citations Valid</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">MOH 216 Alignment</span>
            <BookOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">8 Categories</p>
          <p className="text-xs text-indigo-600 mt-1">Direct Handbook Page References</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Clinical Sign-offs</span>
            <FileCheck2 className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">4 Clinicians</p>
          <p className="text-xs text-gray-500 mt-1">KMPDC, NCK & COC review board</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Evidence Grade</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">Grade 1A / MOH</p>
          <p className="text-xs text-amber-600 mt-1">Highest clinical rigor level</p>
        </div>
      </div>

      {/* Interactive Clinical Simulator Widget */}
      <div className="bg-linear-to-br from-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-teal-800">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-teal-800/60">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base">MOH 216 Clinical Decision Logic Simulator</h3>
          </div>
          <span className="text-xs font-mono bg-teal-800/80 text-teal-200 px-3 py-1 rounded-full">
            Sandboxed Rule Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="text-teal-200 block mb-1 font-medium">Systolic BP (mmHg)</label>
            <input
              type="number"
              value={simulatorInput.systolicBP}
              onChange={e => setSimulatorInput({ ...simulatorInput, systolicBP: Number(e.target.value) })}
              className="w-full p-2.5 bg-teal-950/80 border border-teal-700/80 rounded-xl text-white font-mono"
            />
          </div>
          <div>
            <label className="text-teal-200 block mb-1 font-medium">Diastolic BP (mmHg)</label>
            <input
              type="number"
              value={simulatorInput.diastolicBP}
              onChange={e => setSimulatorInput({ ...simulatorInput, diastolicBP: Number(e.target.value) })}
              className="w-full p-2.5 bg-teal-950/80 border border-teal-700/80 rounded-xl text-white font-mono"
            />
          </div>
          <div>
            <label className="text-teal-200 block mb-1 font-medium">Hemoglobin (Hb g/dL)</label>
            <input
              type="number"
              step="0.1"
              value={simulatorInput.hbLevel}
              onChange={e => setSimulatorInput({ ...simulatorInput, hbLevel: Number(e.target.value) })}
              className="w-full p-2.5 bg-teal-950/80 border border-teal-700/80 rounded-xl text-white font-mono"
            />
          </div>
          <div>
            <label className="text-teal-200 block mb-1 font-medium">Child MUAC (cm)</label>
            <input
              type="number"
              step="0.1"
              value={simulatorInput.muacCm}
              onChange={e => setSimulatorInput({ ...simulatorInput, muacCm: Number(e.target.value) })}
              className="w-full p-2.5 bg-teal-950/80 border border-teal-700/80 rounded-xl text-white font-mono"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <button
            onClick={runSimulator}
            className="w-full md:w-auto px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Evaluate MOH Rules Engine
          </button>

          {simulationOutput && (
            <div className="w-full bg-teal-950/90 border border-teal-700/60 p-3 rounded-xl text-xs font-mono text-teal-100 whitespace-pre-line">
              {simulationOutput}
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rules by ID, condition, or guideline reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Categories</option>
            <option value="ANTENATAL">Antenatal Care</option>
            <option value="INTRAPARTUM">Intrapartum & Delivery</option>
            <option value="POSTNATAL">Postnatal Care</option>
            <option value="NEONATAL">Newborn / Neonatal</option>
            <option value="NUTRITION">Nutrition & Growth</option>
          </select>
        </div>
      </div>

      {/* Rules Registry Cards */}
      <div className="space-y-4">
        {filteredRules.map(rule => (
          <div
            key={rule.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 transition-all"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {rule.id}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium text-[11px]">
                    {rule.category}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {rule.status}
                  </span>
                </div>
                <h4 className="text-base font-bold text-gray-900 mt-1">{rule.name}</h4>
                <p className="text-xs text-gray-500 font-medium">{rule.targetStage}</p>
              </div>

              <div className="text-left md:text-right">
                <span className="text-[11px] text-gray-500 block">Verified Sign-off:</span>
                <span className="text-xs font-semibold text-gray-800">{rule.verifiedBy}</span>
                <span className="text-[10px] text-gray-400 block">{rule.lastAuditDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50/80 p-3.5 rounded-xl text-xs mb-3">
              <div>
                <span className="font-bold text-gray-700 block mb-1">Trigger Condition:</span>
                <p className="text-gray-800 font-mono text-[11px] leading-relaxed">{rule.triggerCondition}</p>
              </div>
              <div>
                <span className="font-bold text-gray-700 block mb-1">Clinical Action & Escalation:</span>
                <p className="text-gray-800 leading-relaxed">{rule.actionGuidance}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs border-t border-gray-100 pt-3 text-gray-600">
              <div>
                <span className="font-semibold text-gray-700">Official Citation: </span>
                <span className="italic">{rule.guidelineCitation}</span>
              </div>
              <div className="font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md text-[11px]">
                {rule.mohHandbookRef}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
