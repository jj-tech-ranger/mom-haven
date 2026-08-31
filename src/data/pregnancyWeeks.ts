/**
 * Kenyan Ministry of Health (MOH 216) Pregnancy Week-by-Week Development & Baby Size Trivia
 * Covers weeks 1 to 42 with culturally resonant, accurate fetal milestones.
 */

export interface WeekData {
  week: number;
  sizeFact: string;
  fruitComparison: string;
  developmentNote: string;
  developmentDetail: string;
  nutritionTip?: string;
  weightGrams?: number;
  lengthCm?: number;
}

export const PREGNANCY_WEEKS: Record<number, WeekData> = {
  1: {
    week: 1,
    sizeFact: "Preparing for conception ✨",
    fruitComparison: "A microscopic egg cell",
    developmentNote: "Your journey begins",
    developmentDetail: "Your body prepares for ovulation and cellular fertilization.",
    nutritionTip: "Start your daily Iron and Folic Acid (IFAS) supplement today.",
  },
  2: {
    week: 2,
    sizeFact: "Fertilization window 💫",
    fruitComparison: "Microscopic miracle",
    developmentNote: "Conception stage",
    developmentDetail: "Fertilization takes place as genetic blueprints unite.",
  },
  3: {
    week: 3,
    sizeFact: "Tiny blastocyst 🔬",
    fruitComparison: "Size of a pinhead",
    developmentNote: "Implantation into uterine wall",
    developmentDetail: "The fertilized egg implants safely in your uterus.",
  },
  4: {
    week: 4,
    sizeFact: "Baby is about the size of a poppy seed 🌱",
    fruitComparison: "A poppy seed",
    developmentNote: "Amniotic sac is forming",
    developmentDetail: "Early neural tube and placenta development begins.",
  },
  5: {
    week: 5,
    sizeFact: "Baby is about the size of an apple seed 🍎",
    fruitComparison: "An apple seed",
    developmentNote: "Tiny heartbeat begins",
    developmentDetail: "The primitive heart tube begins pulsating rhythms.",
  },
  6: {
    week: 6,
    sizeFact: "Baby is about the size of a sweet pea 🫛",
    fruitComparison: "A sweet pea",
    developmentNote: "Facial features forming",
    developmentDetail: "Nose, eyes, and ear buds begin to take subtle shape.",
  },
  7: {
    week: 7,
    sizeFact: "Baby is about the size of a blueberry 🫐",
    fruitComparison: "A blueberry",
    developmentNote: "Brain hemispheres growing",
    developmentDetail: "Tiny webbed hands and feet start budding.",
  },
  8: {
    week: 8,
    sizeFact: "Baby is about the size of a raspberry 🍓",
    fruitComparison: "A raspberry",
    developmentNote: "First spontaneous movements",
    developmentDetail: "Tiny neural synapses fire and joints begin flexing.",
  },
  9: {
    week: 9,
    sizeFact: "Baby is about the size of a green olive 🫒",
    fruitComparison: "A green olive",
    developmentNote: "Tiny heart has 4 chambers",
    developmentDetail: "Heartbeat is now detectable via Doppler ultrasound.",
  },
  10: {
    week: 10,
    sizeFact: "Baby is about the size of a strawberry 🍓",
    fruitComparison: "A strawberry",
    developmentNote: "Major organs are functional",
    developmentDetail: "Kidneys begin producing amniotic fluid.",
  },
  11: {
    week: 11,
    sizeFact: "Baby is about the size of a lime 🍈",
    fruitComparison: "A fresh lime",
    developmentNote: "Tooth buds appearing",
    developmentDetail: "Fingers and toes separate completely.",
  },
  12: {
    week: 12,
    sizeFact: "Baby is about the size of a plum 🫐",
    fruitComparison: "A ripe plum",
    developmentNote: "Reflexes are developing",
    developmentDetail: "Baby can open and close fingers and curl tiny toes.",
  },
  13: {
    week: 13,
    sizeFact: "Baby is about the size of a lemon 🍋",
    fruitComparison: "A lemon",
    developmentNote: "Trimester 2 begins!",
    developmentDetail: "Vocal cords are developing and unique fingerprints form.",
  },
  14: {
    week: 14,
    sizeFact: "Baby is about the size of a passion fruit 🍈",
    fruitComparison: "A passion fruit",
    developmentNote: "Facial expressions active",
    developmentDetail: "Baby can squint, frown, and make subtle grimaces.",
  },
  15: {
    week: 15,
    sizeFact: "Baby is about the size of an apple 🍎",
    fruitComparison: "A crisp apple",
    developmentNote: "Sensing light through eyelids",
    developmentDetail: "Baby's legs are growing longer than arms.",
  },
  16: {
    week: 16,
    sizeFact: "Baby is about the size of an avocado 🥑",
    fruitComparison: "A creamy avocado",
    developmentNote: "First flutters (Quickening)",
    developmentDetail: "You might feel gentle butterfly sensations in your belly.",
  },
  17: {
    week: 17,
    sizeFact: "Baby is about the size of a pomegranate 🍐",
    fruitComparison: "A pomegranate",
    developmentNote: "Skeleton hardening from cartilage",
    developmentDetail: "Adipose fat stores begin forming to regulate temperature.",
  },
  18: {
    week: 18,
    sizeFact: "Baby is about the size of a sweet bell pepper 🫑",
    fruitComparison: "A bell pepper",
    developmentNote: "Yawning and hiccuping",
    developmentDetail: "Ears are now in their final position and functional.",
  },
  19: {
    week: 19,
    sizeFact: "Baby is about the size of a mango 🥭",
    fruitComparison: "A sweet mango",
    developmentNote: "Vernix caseosa coating",
    developmentDetail: "A protective waxy coating shields delicate skin.",
  },
  20: {
    week: 20,
    sizeFact: "Baby is about the size of a small banana 🍌",
    fruitComparison: "A sweet banana",
    developmentNote: "Halfway milestone!",
    developmentDetail: "Baby swallows amniotic fluid and practices digestion.",
  },
  21: {
    week: 21,
    sizeFact: "Baby is about the size of a large carrot 🥕",
    fruitComparison: "A large carrot",
    developmentNote: "Taste buds are active",
    developmentDetail: "Baby can taste hints of local spices and foods you eat.",
  },
  22: {
    week: 22,
    sizeFact: "Baby is about the size of a coconut 🥥",
    fruitComparison: "A small coconut",
    developmentNote: "Eyebrows and eyelashes visible",
    developmentDetail: "Sleep and wake cycles are becoming distinct patterns.",
  },
  23: {
    week: 23,
    sizeFact: "Baby is about the size of a large grapefruit 🍊",
    fruitComparison: "A large grapefruit",
    developmentNote: "Sense of motion and balance",
    developmentDetail: "Inner ear vestibular system can sense maternal movement.",
  },
  24: {
    week: 24,
    sizeFact: "Baby is about the size of an ear of corn 🌽",
    fruitComparison: "An ear of corn",
    developmentNote: "This week: baby can hear you",
    developmentDetail: "Talk or sing — baby's hearing is developing rapidly.",
    nutritionTip: "Continue daily IFAS. Schedule ANC Contact 5 around this time.",
  },
  25: {
    week: 25,
    sizeFact: "Baby is about the size of an acorn squash 🎃",
    fruitComparison: "A squash",
    developmentNote: "Capillaries filling with blood",
    developmentDetail: "Baby's skin turns from translucent to rosy pink.",
  },
  26: {
    week: 26,
    sizeFact: "Baby is about the size of a bunch of sukuma wiki 🥬",
    fruitComparison: "A fresh bundle of greens",
    developmentNote: "Eyes open for the first time",
    developmentDetail: "Baby blinks and responds to bright ambient light.",
  },
  27: {
    week: 27,
    sizeFact: "Baby is about the size of a head of cauliflower 🥦",
    fruitComparison: "A cauliflower head",
    developmentNote: "Trimester 3 arrives!",
    developmentDetail: "Lungs can practice rhythmic breathing movements.",
  },
  28: {
    week: 28,
    sizeFact: "Baby is about the size of a large eggplant 🍆",
    fruitComparison: "An eggplant",
    developmentNote: "Dreaming during REM sleep",
    developmentDetail: "Brain wave activity shows active dream sleep cycles.",
  },
  29: {
    week: 29,
    sizeFact: "Baby is about the size of a butternut squash 🎃",
    fruitComparison: "A butternut squash",
    developmentNote: "Bones soaking up calcium",
    developmentDetail: "Ensure adequate calcium and whole dairy/fortified foods.",
  },
  30: {
    week: 30,
    sizeFact: "Baby is about the size of a large cabbage 🥬",
    fruitComparison: "A large cabbage",
    developmentNote: "Strong coordinated kicks",
    developmentDetail: "Count kicks daily — notice your baby's unique rhythms.",
  },
  31: {
    week: 31,
    sizeFact: "Baby is about the size of a pineapple 🍍",
    fruitComparison: "A juicy pineapple",
    developmentNote: "Rapid brain growth",
    developmentDetail: "Billions of neural connections form every day.",
  },
  32: {
    week: 32,
    sizeFact: "Baby is about the size of a cantaloupe 🍈",
    fruitComparison: "A cantaloupe melon",
    developmentNote: "Practicing breathing motions",
    developmentDetail: "Toenails and fingernails have grown to the tips.",
  },
  33: {
    week: 33,
    sizeFact: "Baby is about the size of a honeydew melon 🍈",
    fruitComparison: "A honeydew melon",
    developmentNote: "Immune antibodies passing over",
    developmentDetail: "Your antibodies transfer to baby for newborn protection.",
  },
  34: {
    week: 34,
    sizeFact: "Baby is about the size of a large butternut 🎃",
    fruitComparison: "A large butternut",
    developmentNote: "Lungs nearly mature",
    developmentDetail: "Central nervous system is maturing for birth readiness.",
  },
  35: {
    week: 35,
    sizeFact: "Baby is about the size of a ripe honeydew 🍈",
    fruitComparison: "A ripe melon",
    developmentNote: "Settling into head-down position",
    developmentDetail: "Most babies position head-down in the pelvis (cephalic).",
  },
  36: {
    week: 36,
    sizeFact: "Baby is about the size of a large papaya 🥭",
    fruitComparison: "A large papaya",
    developmentNote: "Shedding fine lanugo hair",
    developmentDetail: "Baby gains about 200–250g of healthy fat each week.",
  },
  37: {
    week: 37,
    sizeFact: "Baby is about the size of a bunch of swiss chard 🥬",
    fruitComparison: "A lush bundle of greens",
    developmentNote: "Early full term reached!",
    developmentDetail: "Baby is clinically ready to meet the world safely.",
  },
  38: {
    week: 38,
    sizeFact: "Baby is about the size of a winter melon 🍉",
    fruitComparison: "A winter melon",
    developmentNote: "Firm grasp reflex",
    developmentDetail: "Baby's hand grip is remarkably strong.",
  },
  39: {
    week: 39,
    sizeFact: "Baby is about the size of a small watermelon 🍉",
    fruitComparison: "A small watermelon",
    developmentNote: "Full term milestone",
    developmentDetail: "Placenta continues supplying vital antibodies and oxygen.",
  },
  40: {
    week: 40,
    sizeFact: "Baby is fully grown and ready for birth! 👶🏾",
    fruitComparison: "A sweet full-grown baby",
    developmentNote: "Arrival week!",
    developmentDetail: "Rest, hydrate, and have your hospital bag ready for delivery.",
  },
  41: {
    week: 41,
    sizeFact: "Baby is taking extra time to grow strong 💖",
    fruitComparison: "A thriving newborn",
    developmentNote: "Close clinical monitoring",
    developmentDetail: "Consult your clinician for routine post-term checks.",
  },
  42: {
    week: 42,
    sizeFact: "Ready to meet mama in person! 🌸",
    fruitComparison: "A bouncing healthy baby",
    developmentNote: "Post-term arrival",
    developmentDetail: "Your clinical team will guide your safe birth delivery plan.",
  },
};

/**
 * Returns fun fact for week
 */
export function weekFact(week: number): string {
  const safeWeek = Math.max(1, Math.min(42, Math.round(week)));
  return PREGNANCY_WEEKS[safeWeek]?.sizeFact || "Baby is growing strong every day ✨";
}

/**
 * Returns development note and detail for week
 */
export function weekDevelopment(week: number): { title: string; detail: string } {
  const safeWeek = Math.max(1, Math.min(42, Math.round(week)));
  const item不易 = PREGNANCY_WEEKS[safeWeek];
  return {
    title: item不易?.developmentNote || "Baby is developing rapidly",
    detail: item不易?.developmentDetail || "Every day brings new neural connections and strength.",
  };
}

/**
 * Formats date into "2 Dec" or "2 Dec 2026"
 */
export function formatEddDisplay(dateStr?: string): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
