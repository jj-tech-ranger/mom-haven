// src/data/emergencyDangerSigns.ts
// Kenya MOH Maternal, Newborn & Child Health Emergency Danger Signs Master Data

export interface DangerSignItem {
  id: string;
  category: 'MOTHER' | 'NEWBORN' | 'CHILD';
  title: string;
  description: string;
  immediateAction: string;
  urgency: 'CRITICAL' | 'HIGH';
  iconType?: string;
}

export const EMERGENCY_DANGER_SIGNS: DangerSignItem[] = [
  // Mother Obstetric & Postpartum Danger Signs
  {
    id: 'mat_bleed',
    category: 'MOTHER',
    title: 'Severe Vaginal Bleeding',
    description: 'Soaking 2 or more sanitary pads in 1 hour, passing large blood clots, or sudden gush of blood.',
    immediateAction: 'Lie on your left side. Keep warm. Do not insert anything into the vagina. Proceed immediately to a hospital with emergency surgical facilities.',
    urgency: 'CRITICAL',
    iconType: 'droplet'
  },
  {
    id: 'mat_headache',
    category: 'MOTHER',
    title: 'Severe Headache with Blurred Vision',
    description: 'Persistent blinding head pain, seeing flashing lights/spots, severe swelling of face/hands, or epigastric pain.',
    immediateAction: 'Danger sign of pre-eclampsia / imminent eclampsia. Proceed immediately to the nearest hospital for blood pressure assessment and magnesium sulfate.',
    urgency: 'CRITICAL',
    iconType: 'eye'
  },
  {
    id: 'mat_convulsions',
    category: 'MOTHER',
    title: 'Convulsions, Fits or Loss of Consciousness',
    description: 'Involuntary muscle spasms, seizures, rolling eyes, or sudden fainting / blackout.',
    immediateAction: 'Turn mother onto her left side. Clear airway. Do not place fingers or objects in mouth. Transport immediately to emergency hospital.',
    urgency: 'CRITICAL',
    iconType: 'activity'
  },
  {
    id: 'mat_movement',
    category: 'MOTHER',
    title: 'Baby Stopped Moving / Reduced Fetal Kicks',
    description: 'Fewer than 10 movements in 2 hours during active observation, or total cessation of movement after 24 weeks.',
    immediateAction: 'Drink cold water or sweet juice and lie on left side. If no kicks within 30 minutes, go to maternity triage immediately for CTG / fetal heart check.',
    urgency: 'CRITICAL',
    iconType: 'baby'
  },
  {
    id: 'mat_water_break',
    category: 'MOTHER',
    title: 'Waters Broken Early (Before 37 Weeks / Before Labor)',
    description: 'Gush or continuous trickle of clear or greenish/brown amniotic fluid.',
    immediateAction: 'Put on a clean sanitary pad. Do not bathe or have intercourse. Proceed directly to hospital to prevent maternal & fetal infection or cord prolapse.',
    urgency: 'HIGH',
    iconType: 'droplets'
  },
  {
    id: 'mat_fever',
    category: 'MOTHER',
    title: 'High Fever with Chills / Foul Discharge',
    description: 'Body temperature over 38°C with severe shivering, rigid lower belly, or foul-smelling lochia/discharge.',
    immediateAction: 'Sign of severe maternal sepsis or intrauterine infection. Needs immediate clinical assessment, blood cultures, and IV antibiotics at hospital.',
    urgency: 'HIGH',
    iconType: 'thermometer'
  },

  // Newborn Danger Signs (First 28 Days of Life)
  {
    id: 'newb_suckle',
    category: 'NEWBORN',
    title: 'Unable to Suckle or Feed',
    description: 'Baby is too weak to latch at breast, does not suckle at all, or vomits everything ingested.',
    immediateAction: 'Keep baby warm against mother’s chest (skin-to-skin Kangaroo Mother Care). Transport immediately to newborn care unit (NBU).',
    urgency: 'CRITICAL',
    iconType: 'heart-crack'
  },
  {
    id: 'newb_breathing',
    category: 'NEWBORN',
    title: 'Fast Breathing or Severe Chest In-drawing',
    description: 'More than 60 breaths per minute, grunting sounds with each breath, or lower chest sucking in deeply.',
    immediateAction: 'Sign of severe respiratory distress syndrome or neonatal pneumonia. Immediate oxygen and pediatric hospital care needed.',
    urgency: 'CRITICAL',
    iconType: 'wind'
  },
  {
    id: 'newb_fits',
    category: 'NEWBORN',
    title: 'Newborn Convulsions or Twitching',
    description: 'Repetitive rhythmic twitching of limbs, abnormal cycling eye movements, or generalized stiffening.',
    immediateAction: 'Keep airway clear. Keep baby warm. Do not give any oral liquids. Transport immediately to Level 4+ hospital.',
    urgency: 'CRITICAL',
    iconType: 'activity'
  },
  {
    id: 'newb_temp_low',
    category: 'NEWBORN',
    title: 'Hypothermia / Very Cold Body (< 35.5°C)',
    description: 'Baby feels unusually cold to the touch, lethargic, or skin has mottled pale appearance.',
    immediateAction: 'Immediate skin-to-skin contact with mother with warm blanket and cap. Proceed to nearest health center if temperature does not rise.',
    urgency: 'CRITICAL',
    iconType: 'thermometer-snowflake'
  },
  {
    id: 'newb_temp_high',
    category: 'NEWBORN',
    title: 'High Fever (> 37.5°C)',
    description: 'Baby feels hot to touch, irritable, flushed skin, or rectal temperature over 37.5°C.',
    immediateAction: 'Remove excess clothing. Do not sponge with cold water. Urgent evaluation for neonatal sepsis at health facility.',
    urgency: 'CRITICAL',
    iconType: 'thermometer'
  },
  {
    id: 'newb_jaundice',
    category: 'NEWBORN',
    title: 'Yellow Palms and Soles in First 24 Hours',
    description: 'Deep jaundice appearing on day 1 of life, or extending to the hands and feet.',
    immediateAction: 'Urgent phototherapy / pediatric review required at Level 4+ hospital to prevent kernicterus (bilirubin brain damage).',
    urgency: 'HIGH',
    iconType: 'sun'
  },
  {
    id: 'newb_umbilicus',
    category: 'NEWBORN',
    title: 'Red, Swollen Umbilicus with Foul Pus',
    description: 'Redness spreading onto abdominal skin around umbilical stump, draining smelly yellow pus.',
    immediateAction: 'Sign of omphalitis which can rapidly enter the bloodstream. Apply nothing harmful; seek immediate hospital antibiotic treatment.',
    urgency: 'HIGH',
    iconType: 'alert-triangle'
  },

  // Child Danger Signs (1 Month to 5 Years)
  {
    id: 'child_breathing',
    category: 'CHILD',
    title: 'Fast Breathing & Stridor in Calm Child',
    description: 'Chest in-drawing, harsh rasping breathing sounds (stridor), or blueish tinge around mouth.',
    immediateAction: 'Keep child in an upright comfortable position. Rush to nearest emergency department for nebulization / oxygen.',
    urgency: 'CRITICAL',
    iconType: 'wind'
  },
  {
    id: 'child_diarrhea',
    category: 'CHILD',
    title: 'Severe Dehydration from Diarrhea / Vomiting',
    description: 'Sunken eyes, skin pinch goes back very slowly (> 2 seconds), unable to drink, or unconscious.',
    immediateAction: 'Begin oral rehydration solution (ORS) if conscious; proceed immediately to clinic for IV Ringer’s Lactate fluids.',
    urgency: 'CRITICAL',
    iconType: 'droplets'
  },
  {
    id: 'child_lethargy',
    category: 'CHILD',
    title: 'Extreme Lethargy or Unconsciousness',
    description: 'Child cannot be awakened or does not respond to voice or touch.',
    immediateAction: 'Check airway. Lie child on side in recovery position. Emergency hospital transfer immediately.',
    urgency: 'CRITICAL',
    iconType: 'moon'
  }
];
