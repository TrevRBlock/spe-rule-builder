import { useEffect, useMemo, useState, type ChangeEvent, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import "./App.css";

type RuleSlot = "X" | "Y" | "A" | "B";
type PickerTab = "ipa" | "features" | "boundaries";
type VariableFeatureValue = "α" | "-α" | "β" | "-β" | "γ" | "-γ";
type FeatureValue = "+" | "-" | VariableFeatureValue;
type PlaceNode = "LABIAL" | "CORONAL" | "DORSAL" | "PHARYNGEAL" | "RADICAL" | "LARYNGEAL";

interface IpaItem {
  symbol: string;
  name: string;
  group: string;
}

interface FeatureDefinition {
  name: string;
  group: string;
  node?: PlaceNode;
}

interface SymbolToken {
  id: string;
  kind: "symbol";
  symbol: string;
  name: string;
}

interface MatrixToken {
  id: string;
  kind: "matrix";
  label: string;
  features: Record<string, FeatureValue>;
  nodes: string[];
}

interface BoundaryToken {
  id: string;
  kind: "boundary";
  value: string;
  name: string;
}

type RuleToken = SymbolToken | MatrixToken | BoundaryToken;
type RuleState = Record<RuleSlot, RuleToken[]>;

const SLOT_LABELS: Record<RuleSlot, string> = {
  X: "Input (X)",
  Y: "Change (Y)",
  A: "Left context (A)",
  B: "Right context (B)",
};

const EMPTY_RULE: RuleState = {
  X: [],
  Y: [],
  A: [],
  B: [],
};

const UNARY_PLACE_FEATURES: PlaceNode[] = [
  "LABIAL",
  "CORONAL",
  "DORSAL",
  "PHARYNGEAL",
  "RADICAL",
  "LARYNGEAL",
];

const VARIABLE_FEATURE_VALUES: VariableFeatureValue[] = [
  "α",
  "-α",
  "β",
  "-β",
  "γ",
  "-γ",
];

const MATRIX_CATEGORY_LABELS = ["C", "V", "N", "S"] as const;

const BASIC_FEATURE_NAMES = new Set<string>([
  "syllabic",
  "consonantal",
  "sonorant",
  "approximant",
  "continuant",
  "delayed release",
  "nasal",
  "lateral",
  "strident",
  "voice",
  "spread glottis",
  "constricted glottis",
  "round",
  "anterior",
  "distributed",
  "high",
  "low",
  "back",
  "tense",
]);

function isVariableFeatureValue(
  value: FeatureValue | undefined,
): value is VariableFeatureValue {
  return (
    value !== undefined &&
    (VARIABLE_FEATURE_VALUES as readonly string[]).includes(value)
  );
}

const IPA_ITEMS: IpaItem[] = [
  // Pulmonic consonants
  { symbol: "p", name: "voiceless bilabial plosive", group: "Pulmonic consonants" },
  { symbol: "b", name: "voiced bilabial plosive", group: "Pulmonic consonants" },
  { symbol: "t", name: "voiceless alveolar plosive", group: "Pulmonic consonants" },
  { symbol: "d", name: "voiced alveolar plosive", group: "Pulmonic consonants" },
  { symbol: "ʈ", name: "voiceless retroflex plosive", group: "Pulmonic consonants" },
  { symbol: "ɖ", name: "voiced retroflex plosive", group: "Pulmonic consonants" },
  { symbol: "c", name: "voiceless palatal plosive", group: "Pulmonic consonants" },
  { symbol: "ɟ", name: "voiced palatal plosive", group: "Pulmonic consonants" },
  { symbol: "k", name: "voiceless velar plosive", group: "Pulmonic consonants" },
  { symbol: "ɡ", name: "voiced velar plosive", group: "Pulmonic consonants" },
  { symbol: "q", name: "voiceless uvular plosive", group: "Pulmonic consonants" },
  { symbol: "ɢ", name: "voiced uvular plosive", group: "Pulmonic consonants" },
  { symbol: "ʔ", name: "glottal plosive", group: "Pulmonic consonants" },
  { symbol: "m", name: "bilabial nasal", group: "Pulmonic consonants" },
  { symbol: "ɱ", name: "labiodental nasal", group: "Pulmonic consonants" },
  { symbol: "n", name: "alveolar nasal", group: "Pulmonic consonants" },
  { symbol: "ɳ", name: "retroflex nasal", group: "Pulmonic consonants" },
  { symbol: "ɲ", name: "palatal nasal", group: "Pulmonic consonants" },
  { symbol: "ŋ", name: "velar nasal", group: "Pulmonic consonants" },
  { symbol: "ɴ", name: "uvular nasal", group: "Pulmonic consonants" },
  { symbol: "ʙ", name: "bilabial trill", group: "Pulmonic consonants" },
  { symbol: "r", name: "alveolar trill", group: "Pulmonic consonants" },
  { symbol: "ʀ", name: "uvular trill", group: "Pulmonic consonants" },
  { symbol: "ⱱ", name: "labiodental flap", group: "Pulmonic consonants" },
  { symbol: "ɾ", name: "alveolar tap or flap", group: "Pulmonic consonants" },
  { symbol: "ɽ", name: "retroflex flap", group: "Pulmonic consonants" },
  { symbol: "ɸ", name: "voiceless bilabial fricative", group: "Pulmonic consonants" },
  { symbol: "β", name: "voiced bilabial fricative", group: "Pulmonic consonants" },
  { symbol: "f", name: "voiceless labiodental fricative", group: "Pulmonic consonants" },
  { symbol: "v", name: "voiced labiodental fricative", group: "Pulmonic consonants" },
  { symbol: "θ", name: "voiceless dental fricative", group: "Pulmonic consonants" },
  { symbol: "ð", name: "voiced dental fricative", group: "Pulmonic consonants" },
  { symbol: "s", name: "voiceless alveolar fricative", group: "Pulmonic consonants" },
  { symbol: "z", name: "voiced alveolar fricative", group: "Pulmonic consonants" },
  { symbol: "ʃ", name: "voiceless postalveolar fricative", group: "Pulmonic consonants" },
  { symbol: "ʒ", name: "voiced postalveolar fricative", group: "Pulmonic consonants" },
  { symbol: "ʂ", name: "voiceless retroflex fricative", group: "Pulmonic consonants" },
  { symbol: "ʐ", name: "voiced retroflex fricative", group: "Pulmonic consonants" },
  { symbol: "ç", name: "voiceless palatal fricative", group: "Pulmonic consonants" },
  { symbol: "ʝ", name: "voiced palatal fricative", group: "Pulmonic consonants" },
  { symbol: "x", name: "voiceless velar fricative", group: "Pulmonic consonants" },
  { symbol: "ɣ", name: "voiced velar fricative", group: "Pulmonic consonants" },
  { symbol: "χ", name: "voiceless uvular fricative", group: "Pulmonic consonants" },
  { symbol: "ʁ", name: "voiced uvular fricative", group: "Pulmonic consonants" },
  { symbol: "ħ", name: "voiceless pharyngeal fricative", group: "Pulmonic consonants" },
  { symbol: "ʕ", name: "voiced pharyngeal fricative", group: "Pulmonic consonants" },
  { symbol: "h", name: "voiceless glottal fricative", group: "Pulmonic consonants" },
  { symbol: "ɦ", name: "voiced glottal fricative", group: "Pulmonic consonants" },
  { symbol: "ɬ", name: "voiceless alveolar lateral fricative", group: "Pulmonic consonants" },
  { symbol: "ɮ", name: "voiced alveolar lateral fricative", group: "Pulmonic consonants" },
  { symbol: "ʋ", name: "labiodental approximant", group: "Pulmonic consonants" },
  { symbol: "ɹ", name: "alveolar approximant", group: "Pulmonic consonants" },
  { symbol: "ɻ", name: "retroflex approximant", group: "Pulmonic consonants" },
  { symbol: "j", name: "palatal approximant", group: "Pulmonic consonants" },
  { symbol: "ɰ", name: "velar approximant", group: "Pulmonic consonants" },
  { symbol: "l", name: "alveolar lateral approximant", group: "Pulmonic consonants" },
  { symbol: "ɭ", name: "retroflex lateral approximant", group: "Pulmonic consonants" },
  { symbol: "ʎ", name: "palatal lateral approximant", group: "Pulmonic consonants" },
  { symbol: "ʟ", name: "velar lateral approximant", group: "Pulmonic consonants" },

  // Common affricates and coarticulated symbols
  { symbol: "t͡s", name: "voiceless alveolar affricate", group: "Affricates and coarticulated" },
  { symbol: "d͡z", name: "voiced alveolar affricate", group: "Affricates and coarticulated" },
  { symbol: "t͡ʃ", name: "voiceless postalveolar affricate", group: "Affricates and coarticulated" },
  { symbol: "d͡ʒ", name: "voiced postalveolar affricate", group: "Affricates and coarticulated" },
  { symbol: "ʈ͡ʂ", name: "voiceless retroflex affricate", group: "Affricates and coarticulated" },
  { symbol: "ɖ͡ʐ", name: "voiced retroflex affricate", group: "Affricates and coarticulated" },
  { symbol: "t͡ɕ", name: "voiceless alveolo-palatal affricate", group: "Affricates and coarticulated" },
  { symbol: "d͡ʑ", name: "voiced alveolo-palatal affricate", group: "Affricates and coarticulated" },
  { symbol: "ʍ", name: "voiceless labial-velar fricative", group: "Affricates and coarticulated" },
  { symbol: "w", name: "labial-velar approximant", group: "Affricates and coarticulated" },
  { symbol: "ɥ", name: "labial-palatal approximant", group: "Affricates and coarticulated" },
  { symbol: "ɕ", name: "voiceless alveolo-palatal fricative", group: "Affricates and coarticulated" },
  { symbol: "ʑ", name: "voiced alveolo-palatal fricative", group: "Affricates and coarticulated" },
  { symbol: "ɧ", name: "simultaneous postalveolar and velar fricative", group: "Affricates and coarticulated" },

  // Non-pulmonic consonants
  { symbol: "ʘ", name: "bilabial click", group: "Non-pulmonic consonants" },
  { symbol: "ǀ", name: "dental click", group: "Non-pulmonic consonants" },
  { symbol: "ǃ", name: "postalveolar click", group: "Non-pulmonic consonants" },
  { symbol: "ǂ", name: "palatoalveolar click", group: "Non-pulmonic consonants" },
  { symbol: "ǁ", name: "alveolar lateral click", group: "Non-pulmonic consonants" },
  { symbol: "ɓ", name: "voiced bilabial implosive", group: "Non-pulmonic consonants" },
  { symbol: "ɗ", name: "voiced dental or alveolar implosive", group: "Non-pulmonic consonants" },
  { symbol: "ʄ", name: "voiced palatal implosive", group: "Non-pulmonic consonants" },
  { symbol: "ɠ", name: "voiced velar implosive", group: "Non-pulmonic consonants" },
  { symbol: "ʛ", name: "voiced uvular implosive", group: "Non-pulmonic consonants" },
  { symbol: "ʼ", name: "ejective marker", group: "Non-pulmonic consonants" },

  // Vowels
  { symbol: "i", name: "close front unrounded vowel", group: "Vowels" },
  { symbol: "y", name: "close front rounded vowel", group: "Vowels" },
  { symbol: "ɨ", name: "close central unrounded vowel", group: "Vowels" },
  { symbol: "ʉ", name: "close central rounded vowel", group: "Vowels" },
  { symbol: "ɯ", name: "close back unrounded vowel", group: "Vowels" },
  { symbol: "u", name: "close back rounded vowel", group: "Vowels" },
  { symbol: "ɪ", name: "near-close near-front unrounded vowel", group: "Vowels" },
  { symbol: "ʏ", name: "near-close near-front rounded vowel", group: "Vowels" },
  { symbol: "ʊ", name: "near-close near-back rounded vowel", group: "Vowels" },
  { symbol: "e", name: "close-mid front unrounded vowel", group: "Vowels" },
  { symbol: "ø", name: "close-mid front rounded vowel", group: "Vowels" },
  { symbol: "ɘ", name: "close-mid central unrounded vowel", group: "Vowels" },
  { symbol: "ɵ", name: "close-mid central rounded vowel", group: "Vowels" },
  { symbol: "ɤ", name: "close-mid back unrounded vowel", group: "Vowels" },
  { symbol: "o", name: "close-mid back rounded vowel", group: "Vowels" },
  { symbol: "ə", name: "mid central vowel", group: "Vowels" },
  { symbol: "ɛ", name: "open-mid front unrounded vowel", group: "Vowels" },
  { symbol: "œ", name: "open-mid front rounded vowel", group: "Vowels" },
  { symbol: "ɜ", name: "open-mid central unrounded vowel", group: "Vowels" },
  { symbol: "ɞ", name: "open-mid central rounded vowel", group: "Vowels" },
  { symbol: "ʌ", name: "open-mid back unrounded vowel", group: "Vowels" },
  { symbol: "ɔ", name: "open-mid back rounded vowel", group: "Vowels" },
  { symbol: "æ", name: "near-open front unrounded vowel", group: "Vowels" },
  { symbol: "ɐ", name: "near-open central vowel", group: "Vowels" },
  { symbol: "a", name: "open front unrounded vowel", group: "Vowels" },
  { symbol: "ɶ", name: "open front rounded vowel", group: "Vowels" },
  { symbol: "ɑ", name: "open back unrounded vowel", group: "Vowels" },
  { symbol: "ɒ", name: "open back rounded vowel", group: "Vowels" },

  // Diacritics and suprasegmentals
  { symbol: "̥", name: "voiceless", group: "Diacritics" },
  { symbol: "̬", name: "voiced", group: "Diacritics" },
  { symbol: "ʰ", name: "aspirated", group: "Diacritics" },
  { symbol: "̹", name: "more rounded", group: "Diacritics" },
  { symbol: "̜", name: "less rounded", group: "Diacritics" },
  { symbol: "̟", name: "advanced", group: "Diacritics" },
  { symbol: "̠", name: "retracted", group: "Diacritics" },
  { symbol: "̈", name: "centralized", group: "Diacritics" },
  { symbol: "̽", name: "mid-centralized", group: "Diacritics" },
  { symbol: "̩", name: "syllabic", group: "Diacritics" },
  { symbol: "̯", name: "non-syllabic", group: "Diacritics" },
  { symbol: "˞", name: "rhoticity", group: "Diacritics" },
  { symbol: "̤", name: "breathy voiced", group: "Diacritics" },
  { symbol: "̰", name: "creaky voiced", group: "Diacritics" },
  { symbol: "̼", name: "linguolabial", group: "Diacritics" },
  { symbol: "ʷ", name: "labialized", group: "Diacritics" },
  { symbol: "ʲ", name: "palatalized", group: "Diacritics" },
  { symbol: "ˠ", name: "velarized", group: "Diacritics" },
  { symbol: "ˤ", name: "pharyngealized", group: "Diacritics" },
  { symbol: "̴", name: "velarized or pharyngealized", group: "Diacritics" },
  { symbol: "̝", name: "raised", group: "Diacritics" },
  { symbol: "̞", name: "lowered", group: "Diacritics" },
  { symbol: "̘", name: "advanced tongue root", group: "Diacritics" },
  { symbol: "̙", name: "retracted tongue root", group: "Diacritics" },
  { symbol: "̪", name: "dental", group: "Diacritics" },
  { symbol: "̺", name: "apical", group: "Diacritics" },
  { symbol: "̻", name: "laminal", group: "Diacritics" },
  { symbol: "̃", name: "nasalized", group: "Diacritics" },
  { symbol: "ⁿ", name: "nasal release", group: "Diacritics" },
  { symbol: "ˡ", name: "lateral release", group: "Diacritics" },
  { symbol: "̚", name: "no audible release", group: "Diacritics" },
  { symbol: "ˈ", name: "primary stress", group: "Suprasegmentals" },
  { symbol: "ˌ", name: "secondary stress", group: "Suprasegmentals" },
  { symbol: "ː", name: "long", group: "Suprasegmentals" },
  { symbol: "ˑ", name: "half-long", group: "Suprasegmentals" },
  { symbol: "̆", name: "extra-short", group: "Suprasegmentals" },
  { symbol: "|", name: "minor group", group: "Suprasegmentals" },
  { symbol: "‖", name: "major group", group: "Suprasegmentals" },
  { symbol: ".", name: "syllable break", group: "Suprasegmentals" },
  { symbol: "‿", name: "linking", group: "Suprasegmentals" },
  { symbol: "˥", name: "extra-high tone", group: "Tone" },
  { symbol: "˦", name: "high tone", group: "Tone" },
  { symbol: "˧", name: "mid tone", group: "Tone" },
  { symbol: "˨", name: "low tone", group: "Tone" },
  { symbol: "˩", name: "extra-low tone", group: "Tone" },
  { symbol: "ꜛ", name: "upstep", group: "Tone" },
  { symbol: "ꜜ", name: "downstep", group: "Tone" },
  { symbol: "↗", name: "global rise", group: "Tone" },
  { symbol: "↘", name: "global fall", group: "Tone" },
];

const ATTACHING_IPA_SYMBOLS = new Set(
  IPA_ITEMS
    .filter((item) =>
      item.group === "Diacritics" ||
      item.group === "Suprasegmentals" ||
      item.group === "Tone",
    )
    .map((item) => item.symbol),
);

const FEATURES: FeatureDefinition[] = [
  // Feature inventories differ across theories. These entries are intentionally independent:
  // choosing a feature never adds a feature-geometric node automatically.
  { name: "syllabic", group: "Major class" },
  { name: "consonantal", group: "Major class" },
  { name: "sonorant", group: "Major class" },
  { name: "approximant", group: "Major class" },
  { name: "vocalic", group: "Major class" },
  { name: "vocoid", group: "Major class" },
  { name: "obstruent", group: "Major class" },

  { name: "continuant", group: "Manner and stricture" },
  { name: "delayed release", group: "Manner and stricture" },
  { name: "nasal", group: "Manner and stricture" },
  { name: "lateral", group: "Manner and stricture" },
  { name: "strident", group: "Manner and stricture" },
  { name: "tap", group: "Manner and stricture" },
  { name: "trill", group: "Manner and stricture" },
  { name: "affricate", group: "Manner and stricture" },
  { name: "interrupted", group: "Manner and stricture" },
  { name: "checked", group: "Manner and stricture" },

  { name: "voice", group: "Laryngeal" },
  { name: "spread glottis", group: "Laryngeal" },
  { name: "constricted glottis", group: "Laryngeal" },
  { name: "stiff vocal folds", group: "Laryngeal" },
  { name: "slack vocal folds", group: "Laryngeal" },
  { name: "aspirated", group: "Laryngeal" },
  { name: "glottalized", group: "Laryngeal" },
  { name: "breathy", group: "Laryngeal" },
  { name: "creaky", group: "Laryngeal" },

  { name: "labial", group: "Place" },
  { name: "coronal", group: "Place" },
  { name: "dorsal", group: "Place" },
  { name: "pharyngeal", group: "Place" },
  { name: "radical", group: "Place" },
  { name: "laryngeal", group: "Place" },

  { name: "round", group: "Labial" },
  { name: "labiodental", group: "Labial" },

  { name: "anterior", group: "Coronal" },
  { name: "distributed", group: "Coronal" },
  { name: "apical", group: "Coronal" },
  { name: "laminal", group: "Coronal" },
  { name: "subapical", group: "Coronal" },

  { name: "high", group: "Dorsal and vowel" },
  { name: "low", group: "Dorsal and vowel" },
  { name: "back", group: "Dorsal and vowel" },
  { name: "front", group: "Dorsal and vowel" },
  { name: "central", group: "Dorsal and vowel" },
  { name: "advanced tongue root", group: "Dorsal and vowel" },
  { name: "retracted tongue root", group: "Dorsal and vowel" },
  { name: "tense", group: "Dorsal and vowel" },
  { name: "reduced", group: "Dorsal and vowel" },

  { name: "palatalized", group: "Secondary articulation" },
  { name: "velarized", group: "Secondary articulation" },
  { name: "labialized", group: "Secondary articulation" },
  { name: "pharyngealized", group: "Secondary articulation" },
  { name: "rhotic", group: "Secondary articulation" },

  { name: "long", group: "Prosodic" },
  { name: "short", group: "Prosodic" },
  { name: "stress", group: "Prosodic" },
  { name: "secondary stress", group: "Prosodic" },
  { name: "tone", group: "Prosodic" },
  { name: "contour", group: "Prosodic" },
  { name: "register", group: "Prosodic" },
  { name: "moraic", group: "Prosodic" },
  { name: "geminate", group: "Prosodic" },
  { name: "accent", group: "Prosodic" },

  { name: "covered", group: "Legacy and acoustic" },
  { name: "glottal constriction", group: "Legacy and acoustic" },
  { name: "heightened subglottal pressure", group: "Legacy and acoustic" },
  { name: "grave", group: "Legacy and acoustic" },
  { name: "acute", group: "Legacy and acoustic" },
  { name: "compact", group: "Legacy and acoustic" },
  { name: "diffuse", group: "Legacy and acoustic" },
  { name: "flat", group: "Legacy and acoustic" },
  { name: "sharp", group: "Legacy and acoustic" },
];

const BOUNDARIES = [
  { value: "", name: "blank position" },
  { value: "#", name: "word boundary" },
  { value: "+", name: "morpheme boundary" },
  { value: ".", name: "syllable boundary" },
  { value: "$", name: "syllable boundary (SPE notation)" },
  { value: "σ", name: "syllable" },
  { value: "ω", name: "prosodic word" },
  { value: "μ", name: "mora" },
  { value: "∅", name: "null segment" },
  { value: "C", name: "consonant variable" },
  { value: "V", name: "vowel variable" },
  { value: "N", name: "N variable" },
  { value: "S", name: "S variable" },
];


const PULMONIC_PLACES = [
  "Bilabial",
  "Labiodental",
  "Dental",
  "Alveolar",
  "Postalveolar",
  "Retroflex",
  "Palatal",
  "Velar",
  "Uvular",
  "Pharyngeal",
  "Glottal",
] as const;

const PULMONIC_ROWS = [
  "Plosive",
  "Nasal",
  "Trill",
  "Tap or flap",
  "Fricative",
  "Lateral fricative",
  "Approximant",
  "Lateral approximant",
] as const;

const PULMONIC_CHART: Record<string, Record<string, string[]>> = {
  Plosive: {
    Bilabial: ["p", "b"], Alveolar: ["t", "d"], Retroflex: ["ʈ", "ɖ"],
    Palatal: ["c", "ɟ"], Velar: ["k", "ɡ"], Uvular: ["q", "ɢ"], Glottal: ["ʔ"],
  },
  Nasal: {
    Bilabial: ["m"], Labiodental: ["ɱ"], Alveolar: ["n"], Retroflex: ["ɳ"],
    Palatal: ["ɲ"], Velar: ["ŋ"], Uvular: ["ɴ"],
  },
  Trill: { Bilabial: ["ʙ"], Alveolar: ["r"], Uvular: ["ʀ"] },
  "Tap or flap": { Labiodental: ["ⱱ"], Alveolar: ["ɾ"], Retroflex: ["ɽ"] },
  Fricative: {
    Bilabial: ["ɸ", "β"], Labiodental: ["f", "v"], Dental: ["θ", "ð"],
    Alveolar: ["s", "z"], Postalveolar: ["ʃ", "ʒ"], Retroflex: ["ʂ", "ʐ"],
    Palatal: ["ç", "ʝ"], Velar: ["x", "ɣ"], Uvular: ["χ", "ʁ"],
    Pharyngeal: ["ħ", "ʕ"], Glottal: ["h", "ɦ"],
  },
  "Lateral fricative": { Alveolar: ["ɬ", "ɮ"] },
  Approximant: {
    Labiodental: ["ʋ"], Alveolar: ["ɹ"], Retroflex: ["ɻ"],
    Palatal: ["j"], Velar: ["ɰ"],
  },
  "Lateral approximant": {
    Alveolar: ["l"], Retroflex: ["ɭ"], Palatal: ["ʎ"], Velar: ["ʟ"],
  },
};

const VOWEL_POSITIONS = [
  { height: "Close", front: ["i", "y"], central: ["ɨ", "ʉ"], back: ["ɯ", "u"] },
  { height: "Near-close", front: ["ɪ", "ʏ"], central: [], back: ["ʊ"] },
  { height: "Close-mid", front: ["e", "ø"], central: ["ɘ", "ɵ"], back: ["ɤ", "o"] },
  { height: "Mid", front: [], central: ["ə"], back: [] },
  { height: "Open-mid", front: ["ɛ", "œ"], central: ["ɜ", "ɞ"], back: ["ʌ", "ɔ"] },
  { height: "Near-open", front: ["æ"], central: ["ɐ"], back: [] },
  { height: "Open", front: ["a", "ɶ"], central: [], back: ["ɑ", "ɒ"] },
] as const;

const TIPA_SYMBOLS: Record<string, string> = {
  "ʈ": "\\textrtailt{}", "ɖ": "\\textrtaild{}", "ɟ": "\\textbardotlessj{}",
  "ɡ": "g", "ɢ": "\\textscg{}", "ʔ": "\\textglotstop{}", "ɱ": "\\textltailm{}",
  "ɳ": "\\textrtailn{}", "ɲ": "\\textltailn{}", "ŋ": "\\texteng{}", "ɴ": "\\textscn{}",
  "ʙ": "\\textscb{}", "ʀ": "\\textscr{}", "ⱱ": "\\textvibyi{}", "ɾ": "\\textfishhookr{}",
  "ɽ": "\\textrtailr{}", "ɸ": "\\textphi{}", "β": "\\textbeta{}", "θ": "\\texttheta{}",
  "ð": "\\texteth{}", "ʃ": "\\textesh{}", "ʒ": "\\textyogh{}", "ʂ": "\\textrtails{}",
  "ʐ": "\\textrtailz{}", "ç": "\\c{c}", "ʝ": "\\textctj{}", "ɣ": "\\textgamma{}",
  "χ": "\\textchi{}", "ʁ": "\\textinvscr{}", "ħ": "\\textcrh{}", "ʕ": "\\textrevglotstop{}",
  "ɦ": "\\texthth{}", "ɬ": "\\textbeltl{}", "ɮ": "\\textlyoghlig{}", "ʋ": "\\textscriptv{}",
  "ɹ": "\\textturnr{}", "ɻ": "\\textturnrrtail{}", "ɰ": "\\textturnm{}", "ɭ": "\\textrtaill{}",
  "ʎ": "\\textturny{}", "ʟ": "\\textscl{}", "ʍ": "\\textturnw{}", "ɥ": "\\texththeng{}",
  "ɕ": "\\textctc{}", "ʑ": "\\textctz{}", "ɧ": "\\texththeng{}",
  "ʘ": "\\textbullseye{}", "ǀ": "\\textpipe{}", "ǃ": "\\textbang{}", "ǂ": "\\textdoublebarpipe{}",
  "ǁ": "\\textdoublevertline{}", "ɓ": "\\texthtb{}", "ɗ": "\\texthtd{}", "ʄ": "\\texthtbardotlessj{}",
  "ɠ": "\\texthtg{}", "ʛ": "\\texthtscg{}", "ʼ": "'",
  "ɨ": "\\textbari{}", "ʉ": "\\textbaru{}", "ɯ": "\\textturnm{}", "ɪ": "\\textsci{}",
  "ʏ": "\\textscy{}", "ʊ": "\\textupsilon{}", "ø": "\\o{}", "ɘ": "\\textreve{}",
  "ɵ": "\\textbaro{}", "ɤ": "\\textramshorns{}", "ə": "\\textschwa{}", "ɛ": "\\textepsilon{}",
  "œ": "\\oe{}", "ɜ": "\\textrevepsilon{}", "ɞ": "\\textcloserevepsilon{}", "ʌ": "\\textturnv{}",
  "ɔ": "\\textopeno{}", "æ": "\\ae{}", "ɐ": "\\textturna{}", "ɶ": "\\textscoelig{}",
  "ɑ": "\\textscripta{}", "ɒ": "\\textturnscripta{}", "ˈ": "\\textprimstress{}",
  "ˌ": "\\textsecstress{}", "ː": "\\textlengthmark{}", "ˑ": "\\texthalflength{}",
  "|": "\\textvertline{}", "‖": "\\textdoublevertline{}", "‿": "\\textbottomtiebar{}",
  "˥": "\\tone{55}", "˦": "\\tone{44}", "˧": "\\tone{33}", "˨": "\\tone{22}", "˩": "\\tone{11}",
  "ꜛ": "\\textupstep{}", "ꜜ": "\\textdownstep{}", "↗": "\\textglobrise{}", "↘": "\\textglobfall{}",
};

const STORAGE_KEY = "spe-rule-builder-state-v1";

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneRule(rule: RuleState): RuleState {
  return JSON.parse(JSON.stringify(rule)) as RuleState;
}

function duplicateTokens(tokens: RuleToken[]): RuleToken[] {
  return tokens.map((token) => {
    if (token.kind === "matrix") {
      return {
        ...token,
        id: createId(),
        features: { ...token.features },
        nodes: [...token.nodes],
      };
    }

    return {
      ...token,
      id: createId(),
    };
  });
}

function loadSavedRule(): RuleState {
  const normalizeTokens = (value: unknown): RuleToken[] => {
    if (!Array.isArray(value)) return [];

    return value.flatMap((token): RuleToken[] => {
      if (!token || typeof token !== "object") return [];
      const candidate = token as Record<string, unknown>;

      if (candidate.kind === "matrix" && typeof candidate.id === "string") {
        return [{
          id: candidate.id,
          kind: "matrix",
          label: typeof candidate.label === "string" ? candidate.label : "",
          nodes: Array.isArray(candidate.nodes)
            ? candidate.nodes.filter((node): node is string => typeof node === "string")
            : [],
          features: candidate.features && typeof candidate.features === "object"
            ? candidate.features as Record<string, FeatureValue>
            : {},
        }];
      }

      if (
        candidate.kind === "symbol" &&
        typeof candidate.id === "string" &&
        typeof candidate.symbol === "string"
      ) {
        return [{
          id: candidate.id,
          kind: "symbol",
          symbol: candidate.symbol,
          name: typeof candidate.name === "string" ? candidate.name : "typed symbol",
        }];
      }

      if (
        candidate.kind === "boundary" &&
        typeof candidate.id === "string" &&
        typeof candidate.value === "string"
      ) {
        return [{
          id: candidate.id,
          kind: "boundary",
          value: candidate.value,
          name: typeof candidate.name === "string" ? candidate.name : "typed notation",
        }];
      }

      return [];
    });
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return cloneRule(EMPTY_RULE);

    const parsed = JSON.parse(saved) as Partial<RuleState>;
    return {
      X: normalizeTokens(parsed.X),
      Y: normalizeTokens(parsed.Y),
      A: normalizeTokens(parsed.A),
      B: normalizeTokens(parsed.B),
    };
  } catch {
    return cloneRule(EMPTY_RULE);
  }
}

function isStandaloneCombiningMark(text: string): boolean {
  return /^[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]+$/u.test(text);
}

function isAttachingIpaSymbol(symbol: string): boolean {
  return ATTACHING_IPA_SYMBOLS.has(symbol) || isStandaloneCombiningMark(symbol);
}

function groupedSymbolStrings(tokens: SymbolToken[]): string[] {
  const groups: string[] = [];

  for (const token of tokens) {
    if (isAttachingIpaSymbol(token.symbol) && groups.length > 0) {
      groups[groups.length - 1] += token.symbol;
    } else {
      groups.push(token.symbol);
    }
  }

  return groups;
}

function matrixRows(matrix: MatrixToken): string[] {
  return [
    ...matrix.nodes,
    ...Object.entries(matrix.features).map(([name, value]) => `${value}${name}`),
  ];
}

function matrixToEditableText(matrix: MatrixToken): string {
  return matrixRows(matrix).join("\n");
}

function parseMatrixText(value: string): Pick<MatrixToken, "nodes" | "features"> {
  const nodes: string[] = [];
  const features: Record<string, FeatureValue> = {};
  const validValues = new Set<FeatureValue>(["+", "-", ...VARIABLE_FEATURE_VALUES]);

  for (const rawLine of value.split(/\r?\n|,/u)) {
    const line = rawLine.trim().replace(/^−/u, "-");
    if (!line) continue;

    const match = line.match(/^(-?[αβγ]|[+-])\s*(.+)$/u);
    if (match && validValues.has(match[1] as FeatureValue)) {
      const name = match[2].trim();
      if (name) features[name] = match[1] as FeatureValue;
      continue;
    }

    if (!nodes.includes(line)) nodes.push(line);
  }

  return { nodes, features };
}

function parseTypedMatrixInput(
  value: string,
): Pick<MatrixToken, "nodes" | "features"> | null {
  let remaining = value.trim().replace(/−/gu, "-");
  const nodeAlternation = UNARY_PLACE_FEATURES.join("|");
  const startsLikeMatrix = new RegExp(String.raw`^(?:[+-]|(?:${nodeAlternation})\b)`, "iu");

  if (!startsLikeMatrix.test(remaining)) return null;

  const nodes: string[] = [];
  const features: Record<string, FeatureValue> = {};
  const nodeAtStart = new RegExp(String.raw`^(${nodeAlternation})\b`, "iu");
  const nextItem = new RegExp(
    String.raw`(?:\s*[,;]\s*|\r?\n|\s+(?=[+-]\s*\S)|\s+(?=(?:${nodeAlternation})\b))`,
    "iu",
  );

  while (remaining.trim()) {
    remaining = remaining.trim().replace(/^[,;]+/u, "").trim();
    if (!remaining) break;

    const nodeMatch = remaining.match(nodeAtStart);
    if (nodeMatch) {
      const canonicalNode = UNARY_PLACE_FEATURES.find(
        (node) => node === nodeMatch[1].toUpperCase(),
      );

      if (!canonicalNode) return null;
      if (!nodes.includes(canonicalNode)) nodes.push(canonicalNode);
      remaining = remaining.slice(nodeMatch[0].length);
      continue;
    }

    const signMatch = remaining.match(/^([+-])\s*/u);
    if (!signMatch) return null;

    const sign = signMatch[1] as FeatureValue;
    remaining = remaining.slice(signMatch[0].length);

    const boundaryIndex = remaining.search(nextItem);
    const featureName = (
      boundaryIndex === -1 ? remaining : remaining.slice(0, boundaryIndex)
    ).trim();

    if (!featureName) return null;
    features[featureName] = sign;
    remaining = boundaryIndex === -1 ? "" : remaining.slice(boundaryIndex);
  }

  return nodes.length > 0 || Object.keys(features).length > 0
    ? { nodes, features }
    : null;
}

function formatMatrixText(matrix: MatrixToken): string {
  const lines = matrixRows(matrix);
  const body = lines.length === 0 ? "[ ]" : `[${lines.join(", ")}]`;
  return matrix.label.trim() ? `${matrix.label.trim()} ${body}` : body;
}

function formatTokenText(token: RuleToken): string {
  if (token.kind === "symbol") return token.symbol;
  if (token.kind === "boundary") return token.value;
  return formatMatrixText(token);
}

function formatSlotText(slot: RuleSlot, tokens: RuleToken[]): string {
  if (tokens.length === 0) return "";

  const parts: string[] = [];
  let symbolGroup: SymbolToken[] = [];

  const flushSymbols = () => {
    if (symbolGroup.length === 0) return;

    const groupedSymbols = groupedSymbolStrings(symbolGroup);
    if (slot === "X" || slot === "Y") {
      const opening = slot === "X" ? "/" : "[";
      const closing = slot === "X" ? "/" : "]";
      parts.push(`${opening}${groupedSymbols.join(", ")}${closing}`);
    } else {
      parts.push(groupedSymbols.join(" "));
    }

    symbolGroup = [];
  };

  for (const token of tokens) {
    if (token.kind === "symbol") {
      symbolGroup.push(token);
      continue;
    }

    flushSymbols();
    parts.push(formatTokenText(token));
  }

  flushSymbols();
  return parts.join(" ");
}

function formatRuleText(rule: RuleState): string {
  return `${formatSlotText("X", rule.X)} → ${formatSlotText("Y", rule.Y)} / ${formatSlotText("A", rule.A)} __ ${formatSlotText("B", rule.B)}`;
}


function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function latexEscapeText(value: string): string {
  return value
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#$%&_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function tipaBaseSymbol(symbol: string): string {
  if (TIPA_SYMBOLS[symbol]) return TIPA_SYMBOLS[symbol];
  if (/^[A-Za-z0-9.,!?;:'-]$/.test(symbol)) return latexEscapeText(symbol);
  return "?";
}

function tipaSymbol(symbol: string): string {
  if (symbol.includes("͡")) {
    const parts = symbol.split("͡");
    if (parts.length === 2) {
      return `\\texttoptiebar{${tipaBaseSymbol(parts[0])}${tipaBaseSymbol(parts[1])}}`;
    }
  }

  const characters = Array.from(symbol);
  const base = characters.shift();
  if (!base) return "";
  let output = tipaBaseSymbol(base);

  for (const mark of characters) {
    if (mark === "ʰ") output += "\\textsuperscript{h}";
    else if (mark === "ʷ") output += "\\textsuperscript{w}";
    else if (mark === "ʲ") output += "\\textsuperscript{j}";
    else if (mark === "ˠ") output += "\\textsuperscript{\\textgamma}";
    else if (mark === "ˤ") output += "\\textsuperscript{\\textrevglotstop}";
    else if (mark === "ⁿ") output += "\\textsuperscript{n}";
    else if (mark === "ˡ") output += "\\textsuperscript{l}";
    else if (mark === "˞") output += "\\textrhoticity{}";
    else if (mark === "̚") output += "\\textcorner{}";
    else if (mark === "̃") output = `\\textsuperimposetilde{${output}}`;
    else if (mark === "̩") output = `\\textsyllabic{${output}}`;
    else output += `% Unsupported diacritic: ${mark}`;
  }

  return output;
}

function latexMatrix(matrix: MatrixToken): string {
  const latexValue = (value: FeatureValue) => {
    const variableMap: Record<"α" | "β" | "γ", string> = {
      α: "\\alpha",
      β: "\\beta",
      γ: "\\gamma",
    };

    if (value === "+" || value === "-") return value;
    if (value.startsWith("-")) {
      const variable = value.slice(1) as "α" | "β" | "γ";
      return `-${variableMap[variable]}`;
    }
    const variable = value as "α" | "β" | "γ";
    return variableMap[variable];
  };

  const rows = [
    ...matrix.nodes.map((node) => latexEscapeText(node)),
    ...Object.entries(matrix.features).map(
      ([name, value]) => `${latexValue(value)}${latexEscapeText(name)}`,
    ),
  ];
  const featureMatrix = `\\phonfeat[l]{${rows.length ? rows.join(" \\\\") : "\\mbox{}"}}`;
  const label = matrix.label.trim();

  if (!label) return featureMatrix;
  return `\\shortstack{${latexEscapeText(label)}\\\\${featureMatrix}}`;
}

function latexBoundary(token: BoundaryToken): string {
  const map: Record<string, string> = {
    "#": "\\#", "+": "+", ".": ".", "$": "\\$", "σ": "\\sigma",
    "ω": "\\omega", "μ": "\\mu", "∅": "$\\varnothing$", C: "C", V: "V", N: "N", S: "S",
  };
  return map[token.value] ?? latexEscapeText(token.value);
}

function latexSlot(slot: RuleSlot, tokens: RuleToken[]): string {
  if (tokens.length === 0) return "";
  const parts: string[] = [];
  let symbols: SymbolToken[] = [];

  const flush = () => {
    if (!symbols.length) return;
    const body = groupedSymbolStrings(symbols).map((symbol) => tipaSymbol(symbol)).join(", ");
    if (slot === "X") parts.push(`/\\textipa{${body}}/`);
    else if (slot === "Y") parts.push(`[\\textipa{${body}}]`);
    else parts.push(`\\textipa{${body}}`);
    symbols = [];
  };

  for (const token of tokens) {
    if (token.kind === "symbol") symbols.push(token);
    else {
      flush();
      parts.push(token.kind === "matrix" ? latexMatrix(token) : latexBoundary(token));
    }
  }
  flush();
  return parts.join(" ");
}

function buildLatexDocument(rule: RuleState): string {
  const input = latexSlot("X", rule.X);
  const output = latexSlot("Y", rule.Y);
  const hasLeft = rule.A.length > 0;
  const hasRight = rule.B.length > 0;
  let command: string;

  if (hasLeft && hasRight) command = `\\phonb{${input}}{${output}}{${latexSlot("A", rule.A)}}{${latexSlot("B", rule.B)}}`;
  else if (hasLeft) command = `\\phonl{${input}}{${output}}{${latexSlot("A", rule.A)}}`;
  else if (hasRight) command = `\\phonr{${input}}{${output}}{${latexSlot("B", rule.B)}}`;
  else command = `\\phon{${input}}{${output}}`;

  return `\\documentclass{article}
\\usepackage[T1]{fontenc}
\\usepackage[tone,extra]{tipa}
\\usepackage{amssymb}
\\usepackage{phonrule}
\\pagestyle{empty}

\\begin{document}
\\begin{center}
${command}
\\end{center}
\\end{document}
`;
}

function App() {
  const [rule, setRule] = useState<RuleState>(() => loadSavedRule());
  const [pastRules, setPastRules] = useState<RuleState[]>([]);
  const [activeSlot, setActiveSlot] = useState<RuleSlot>("X");
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PickerTab>("ipa");
  const [search, setSearch] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customFeature, setCustomFeature] = useState("");
  const [customFeatureValue, setCustomFeatureValue] = useState<FeatureValue>("+");
  const [slotDrafts, setSlotDrafts] = useState<Record<RuleSlot, string>>({ X: "", Y: "", A: "", B: "" });
  const [slotClipboard, setSlotClipboard] = useState<RuleToken[] | null>(null);
  const [copiedFromSlot, setCopiedFromSlot] = useState<RuleSlot | null>(null);
  const [advancedFeatures, setAdvancedFeatures] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rule));
  }, [rule]);

  const ruleText = useMemo(() => formatRuleText(rule), [rule]);

  const filteredIpaGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = IPA_ITEMS.filter((item) => {
      if (!query) return true;
      return item.symbol.includes(search) || item.name.toLowerCase().includes(query) || item.group.toLowerCase().includes(query);
    });

    return filtered.reduce<Record<string, IpaItem[]>>((groups, item) => {
      (groups[item.group] ??= []).push(item);
      return groups;
    }, {});
  }, [search]);

  const filteredFeatureGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = FEATURES.filter((feature) => {
      if (!advancedFeatures && !BASIC_FEATURE_NAMES.has(feature.name)) {
        return false;
      }

      if (!query) return true;
      return feature.name.toLowerCase().includes(query) || feature.group.toLowerCase().includes(query);
    });

    return filtered.reduce<Record<string, FeatureDefinition[]>>((groups, feature) => {
      (groups[feature.group] ??= []).push(feature);
      return groups;
    }, {});
  }, [advancedFeatures, search]);

  function commitRule(updater: (previous: RuleState) => RuleState) {
    setRule((previous) => {
      const next = updater(previous);
      if (JSON.stringify(previous) === JSON.stringify(next)) return previous;
      setPastRules((past) => [...past.slice(-49), cloneRule(previous)]);
      return next;
    });
    setStatus("");
  }

  function addToken(token: RuleToken) {
    commitRule((previous) => ({
      ...previous,
      [activeSlot]: [...previous[activeSlot], token],
    }));
  }

  function addIpaItem(item: IpaItem) {
    const activeTokens = rule[activeSlot];
    const lastToken = activeTokens.at(-1);

    if (isAttachingIpaSymbol(item.symbol) && lastToken?.kind === "symbol") {
      commitRule((previous) => ({
        ...previous,
        [activeSlot]: previous[activeSlot].map((token) =>
          token.id === lastToken.id && token.kind === "symbol"
            ? { ...token, symbol: `${token.symbol}${item.symbol}`, name: `${token.name}; ${item.name}` }
            : token,
        ),
      }));
      return;
    }

    addToken({ id: createId(), kind: "symbol", symbol: item.symbol, name: item.name });
  }

  function addCustomSymbol() {
    const value = customSymbol.trim();
    if (!value) return;
    addToken({ id: createId(), kind: "symbol", symbol: value, name: "custom IPA or phonological symbol" });
    setCustomSymbol("");
  }

  function addTypedSlotContent(slot: RuleSlot) {
    let value = slotDrafts[slot].trim();
    if (!value) return;

    if (slot === "X" && value.startsWith("/") && value.endsWith("/")) {
      value = value.slice(1, -1).trim();
    } else if (slot === "Y" && value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).trim();
    }

    const typedMatrix = parseTypedMatrixInput(value);
    if (typedMatrix) {
      const existingMatrixId = findTargetMatrixIdForSlot(slot);
      const targetMatrixId = existingMatrixId ?? createId();

      commitRule((previous) => {
        if (existingMatrixId) {
          return {
            ...previous,
            [slot]: previous[slot].map((token) =>
              token.id === existingMatrixId && token.kind === "matrix"
                ? {
                    ...token,
                    nodes: Array.from(new Set([...token.nodes, ...typedMatrix.nodes])),
                    features: { ...token.features, ...typedMatrix.features },
                  }
                : token,
            ),
          };
        }

        const matrix: MatrixToken = {
          id: targetMatrixId,
          kind: "matrix",
          label: "",
          features: typedMatrix.features,
          nodes: typedMatrix.nodes,
        };

        return {
          ...previous,
          [slot]: [...previous[slot], matrix],
        };
      });

      setActiveSlot(slot);
      setSelectedMatrixId(targetMatrixId);
      setActiveTab("features");
      setSlotDrafts((previous) => ({ ...previous, [slot]: "" }));
      return;
    }

    const pieces = value.split(/[\s,]+/u).filter(Boolean);
    if (!pieces.length) return;

    const newTokens: RuleToken[] = pieces.map((piece) => {
      const boundary = BOUNDARIES.find(
        (candidate) => candidate.value === piece && candidate.value !== "",
      );

      if (boundary) {
        return {
          id: createId(),
          kind: "boundary",
          value: boundary.value,
          name: boundary.name,
        };
      }

      return {
        id: createId(),
        kind: "symbol",
        symbol: piece,
        name: "typed IPA or phonological symbol",
      };
    });

    commitRule((previous) => ({
      ...previous,
      [slot]: [...previous[slot], ...newTokens],
    }));
    setActiveSlot(slot);
    setSlotDrafts((previous) => ({ ...previous, [slot]: "" }));
  }

  function updateTokenValue(slot: RuleSlot, tokenId: string, nextValue: string) {
    const value = nextValue.trim();
    if (!value) {
      removeToken(slot, tokenId);
      return;
    }

    commitRule((previous) => ({
      ...previous,
      [slot]: previous[slot].map((token) => {
        if (token.id !== tokenId) return token;
        if (token.kind === "symbol") {
          return { ...token, symbol: value, name: "typed IPA or phonological symbol" };
        }
        if (token.kind === "boundary") {
          return { ...token, value, name: "typed notation" };
        }
        return token;
      }),
    }));
  }

  function addBoundary(value: string, name: string) {
    if (value === "") {
      clearSlot(activeSlot);
      setStatus("Active position set to blank.");
      return;
    }

    addToken({ id: createId(), kind: "boundary", value, name });
  }

  function addNewMatrix() {
    const matrix: MatrixToken = {
      id: createId(),
      kind: "matrix",
      label: "",
      features: {},
      nodes: [],
    };
    addToken(matrix);
    setSelectedMatrixId(matrix.id);
    setActiveTab("features");
  }

  function findTargetMatrixIdForSlot(slot: RuleSlot): string | null {
    const slotTokens = rule[slot];
    if (
      selectedMatrixId &&
      slotTokens.some(
        (token) => token.id === selectedMatrixId && token.kind === "matrix",
      )
    ) {
      return selectedMatrixId;
    }

    const lastMatrix = [...slotTokens]
      .reverse()
      .find((token): token is MatrixToken => token.kind === "matrix");
    return lastMatrix?.id ?? null;
  }

  function findTargetMatrixId(): string | null {
    return findTargetMatrixIdForSlot(activeSlot);
  }

  function ensureMatrixAndUpdate(update: (matrix: MatrixToken) => MatrixToken) {
    const targetId = findTargetMatrixId();

    if (targetId) {
      commitRule((previous) => ({
        ...previous,
        [activeSlot]: previous[activeSlot].map((token) =>
          token.id === targetId && token.kind === "matrix" ? update(token) : token,
        ),
      }));
      setSelectedMatrixId(targetId);
      return;
    }

    const matrix: MatrixToken = update({
      id: createId(),
      kind: "matrix",
      label: "",
      features: {},
      nodes: [],
    });

    commitRule((previous) => ({
      ...previous,
      [activeSlot]: [...previous[activeSlot], matrix],
    }));
    setSelectedMatrixId(matrix.id);
  }

  function setFeature(feature: FeatureDefinition | string, value: FeatureValue) {
    const name = typeof feature === "string" ? feature : feature.name;

    ensureMatrixAndUpdate((matrix) => ({
      ...matrix,
      features: { ...matrix.features, [name]: value },
    }));
  }

  function removeFeature(featureName: string) {
    const targetId = findTargetMatrixId();
    if (!targetId) return;

    commitRule((previous) => ({
      ...previous,
      [activeSlot]: previous[activeSlot].map((token) => {
        if (token.id !== targetId || token.kind !== "matrix") return token;
        const nextFeatures = { ...token.features };
        delete nextFeatures[featureName];
        return { ...token, features: nextFeatures };
      }),
    }));
    setSelectedMatrixId(targetId);
  }

  function toggleNode(node: PlaceNode) {
    ensureMatrixAndUpdate((matrix) => ({
      ...matrix,
      nodes: matrix.nodes.includes(node)
        ? matrix.nodes.filter((existing) => existing !== node)
        : [...matrix.nodes, node],
    }));
  }

  function addCustomFeature() {
    const name = customFeature.trim();
    if (!name) return;
    setFeature(name, customFeatureValue);
    setCustomFeature("");
  }

  function updateMatrixLabel(slot: RuleSlot, matrixId: string, label: string) {
    commitRule((previous) => ({
      ...previous,
      [slot]: previous[slot].map((token) =>
        token.id === matrixId && token.kind === "matrix"
          ? { ...token, label }
          : token,
      ),
    }));
    setSelectedMatrixId(matrixId);
  }

  function updateMatrixFromText(slot: RuleSlot, matrixId: string, value: string) {
    const parsed = parseMatrixText(value);
    commitRule((previous) => ({
      ...previous,
      [slot]: previous[slot].map((token) =>
        token.id === matrixId && token.kind === "matrix"
          ? { ...token, ...parsed }
          : token,
      ),
    }));
    setSelectedMatrixId(matrixId);
  }

  function setCurrentMatrixLabel(label: string) {
    const targetId = findTargetMatrixId();
    if (!targetId) {
      ensureMatrixAndUpdate((matrix) => ({ ...matrix, label }));
      return;
    }
    updateMatrixLabel(activeSlot, targetId, label);
  }

  function removeToken(slot: RuleSlot, tokenId: string) {
    commitRule((previous) => ({
      ...previous,
      [slot]: previous[slot].filter((token) => token.id !== tokenId),
    }));
    if (selectedMatrixId === tokenId) setSelectedMatrixId(null);
  }

  function moveToken(slot: RuleSlot, tokenId: string, direction: -1 | 1) {
    commitRule((previous) => {
      const tokens = [...previous[slot]];
      const index = tokens.findIndex((token) => token.id === tokenId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= tokens.length) return previous;
      [tokens[index], tokens[nextIndex]] = [tokens[nextIndex], tokens[index]];
      return { ...previous, [slot]: tokens };
    });
  }

  function clearSlot(slot: RuleSlot) {
    commitRule((previous) => ({ ...previous, [slot]: [] }));
    if (slot === activeSlot) setSelectedMatrixId(null);
  }

  function copySlot(slot: RuleSlot) {
    setSlotClipboard(cloneRule({ X: rule[slot], Y: [], A: [], B: [] }).X);
    setCopiedFromSlot(slot);
    setStatus(`${SLOT_LABELS[slot]} copied. Choose Paste in another box.`);
  }

  function pasteSlot(slot: RuleSlot) {
    if (slotClipboard === null) return;

    commitRule((previous) => ({
      ...previous,
      [slot]: duplicateTokens(slotClipboard),
    }));
    setActiveSlot(slot);
    setSelectedMatrixId(null);
    setStatus(
      copiedFromSlot
        ? `${SLOT_LABELS[copiedFromSlot]} pasted into ${SLOT_LABELS[slot]}.`
        : `Copied contents pasted into ${SLOT_LABELS[slot]}.`,
    );
  }

  function clearAll() {
    commitRule(() => cloneRule(EMPTY_RULE));
    setSelectedMatrixId(null);
  }

  function undo() {
    setPastRules((past) => {
      const previous = past.at(-1);
      if (!previous) return past;
      setRule(cloneRule(previous));
      setSelectedMatrixId(null);
      setStatus("Undid the last change.");
      return past.slice(0, -1);
    });
  }

  async function copyRule() {
    try {
      await navigator.clipboard.writeText(ruleText);
      setStatus("Rule copied to the clipboard.");
    } catch {
      setStatus("The browser could not copy automatically. Select the preview text and copy it manually.");
    }
  }


  async function exportPng() {
    type CanvasPiece =
      | { kind: "text"; text: string }
      | { kind: "matrix"; label: string; rows: string[] };

    const slotPieces = (slot: RuleSlot, tokens: RuleToken[]): CanvasPiece[] => {
      if (tokens.length === 0) return [];

      const pieces: CanvasPiece[] = [];
      let symbolGroup: SymbolToken[] = [];

      const flushSymbols = () => {
        if (symbolGroup.length === 0) return;
        const groupedSymbols = groupedSymbolStrings(symbolGroup);
        const body = (slot === "X" || slot === "Y")
          ? groupedSymbols.join(", ")
          : groupedSymbols.join(" ");

        if (slot === "X") pieces.push({ kind: "text", text: `/${body}/` });
        else if (slot === "Y") pieces.push({ kind: "text", text: `[${body}]` });
        else pieces.push({ kind: "text", text: body });

        symbolGroup = [];
      };

      for (const token of tokens) {
        if (token.kind === "symbol") {
          symbolGroup.push(token);
          continue;
        }

        flushSymbols();

        if (token.kind === "matrix") {
          const rows = matrixRows(token);
          pieces.push({
            kind: "matrix",
            label: token.label.trim(),
            rows: rows.length ? rows : ["empty"],
          });
        } else {
          pieces.push({ kind: "text", text: token.value });
        }
      }

      flushSymbols();
      return pieces;
    };

    try {
      if ("fonts" in document) await document.fonts.ready;

      const pieces: CanvasPiece[] = [
        ...slotPieces("X", rule.X),
        { kind: "text", text: "→" },
        ...slotPieces("Y", rule.Y),
        { kind: "text", text: "/" },
        ...slotPieces("A", rule.A),
        { kind: "text", text: "__" },
        ...slotPieces("B", rule.B),
      ];

      const measurementCanvas = document.createElement("canvas");
      const measure = measurementCanvas.getContext("2d");
      if (!measure) throw new Error("Canvas is unavailable.");

      const textFont = '30px "Segoe UI", "Arial Unicode MS", sans-serif';
      const matrixFont = '18px "Segoe UI", "Arial Unicode MS", sans-serif';
      const matrixLineHeight = 24;
      const matrixLabelHeight = 25;
      const matrixHorizontalPadding = 17;
      const matrixVerticalPadding = 10;
      const pieceGap = 16;
      const outerPadding = 30;

      const sizes = pieces.map((piece) => {
        if (piece.kind === "text") {
          measure.font = textFont;
          return {
            width: Math.ceil(measure.measureText(piece.text).width),
            height: 42,
          };
        }

        measure.font = matrixFont;
        const rowWidth = Math.max(
          42,
          ...piece.rows.map((row) => Math.ceil(measure.measureText(row).width)),
        );
        const labelWidth = piece.label
          ? Math.ceil(measure.measureText(piece.label).width)
          : 0;
        const contentWidth = Math.max(rowWidth, labelWidth);
        return {
          width: contentWidth + matrixHorizontalPadding * 2,
          height:
            piece.rows.length * matrixLineHeight +
            matrixVerticalPadding * 2 +
            (piece.label ? matrixLabelHeight : 0),
        };
      });

      const width = Math.ceil(
        outerPadding * 2 +
        sizes.reduce((sum, size) => sum + size.width, 0) +
        Math.max(0, pieces.length - 1) * pieceGap,
      );
      const height = Math.ceil(
        outerPadding * 2 + Math.max(52, ...sizes.map((size) => size.height)),
      );

      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");

      context.scale(scale, scale);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#20242a";
      context.strokeStyle = "#263342";
      context.lineWidth = 2;
      context.textBaseline = "middle";

      let x = outerPadding;
      const centerY = height / 2;

      pieces.forEach((piece, index) => {
        const size = sizes[index];

        if (piece.kind === "text") {
          context.font = textFont;
          context.fillText(piece.text, x, centerY);
          x += size.width + pieceGap;
          return;
        }

        const top = centerY - size.height / 2;
        const matrixTop = top + (piece.label ? matrixLabelHeight : 0);
        const bottom = top + size.height;
        const bracketArm = 9;

        context.font = matrixFont;
        if (piece.label) {
          const labelWidth = context.measureText(piece.label).width;
          context.fillText(
            piece.label,
            x + (size.width - labelWidth) / 2,
            top + matrixLabelHeight / 2,
          );
        }

        context.beginPath();
        context.moveTo(x + bracketArm, matrixTop);
        context.lineTo(x, matrixTop);
        context.lineTo(x, bottom);
        context.lineTo(x + bracketArm, bottom);
        context.stroke();

        context.beginPath();
        context.moveTo(x + size.width - bracketArm, matrixTop);
        context.lineTo(x + size.width, matrixTop);
        context.lineTo(x + size.width, bottom);
        context.lineTo(x + size.width - bracketArm, bottom);
        context.stroke();

        piece.rows.forEach((row, rowIndex) => {
          const rowY =
            matrixTop +
            matrixVerticalPadding +
            matrixLineHeight * rowIndex +
            matrixLineHeight / 2;
          context.fillText(row, x + matrixHorizontalPadding, rowY);
        });

        x += size.width + pieceGap;
      });

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("PNG creation failed.")),
          "image/png",
        );
      });

      downloadBlob(pngBlob, "spe-phonological-rule.png");
      setStatus("PNG exported.");
    } catch (error) {
      console.error(error);
      setStatus("PNG export failed in this browser.");
    }
  }

  function exportLatex() {
    const documentText = buildLatexDocument(rule);
    downloadBlob(new Blob([documentText], { type: "text/x-tex;charset=utf-8" }), "spe-phonological-rule.tex");
    setStatus("LaTeX file exported.");
  }

  function selectSlot(slot: RuleSlot) {
    setActiveSlot(slot);
    setSelectedMatrixId(null);
  }

  function selectedMatrix(): MatrixToken | null {
    const targetId = findTargetMatrixId();
    if (!targetId) return null;
    const token = rule[activeSlot].find((item) => item.id === targetId);
    return token?.kind === "matrix" ? token : null;
  }

  const currentMatrix = selectedMatrix();

  function renderMatrix(slot: RuleSlot, matrix: MatrixToken) {
    return (
      <div className="matrix-editor-stack" aria-label={formatMatrixText(matrix)}>
        <div
          className="matrix-inline-category-row"
          onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
        >
          {MATRIX_CATEGORY_LABELS.map((label) => (
            <button
              type="button"
              className={`matrix-inline-category-button ${matrix.label === label ? "selected" : ""}`}
              onClick={() => {
                setActiveSlot(slot);
                setSelectedMatrixId(matrix.id);
                updateMatrixLabel(slot, matrix.id, matrix.label === label ? "" : label);
              }}
              aria-label={`Set matrix category to ${label}`}
              key={`${matrix.id}-inline-label-${label}`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="matrix-label-input"
          defaultValue={matrix.label}
          key={`matrix-label-${matrix.id}-${matrix.label}`}
          onClick={(event: MouseEvent<HTMLInputElement>) => event.stopPropagation()}
          onFocus={() => {
            setActiveSlot(slot);
            setSelectedMatrixId(matrix.id);
          }}
          onBlur={(event: FocusEvent<HTMLInputElement>) => updateMatrixLabel(slot, matrix.id, event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          placeholder="Custom category"
          aria-label="Matrix category label"
        />
        <div className="matrix-editor-visual">
          <textarea
            className="matrix-direct-textarea"
            defaultValue={matrixToEditableText(matrix)}
            key={`matrix-rows-${matrix.id}-${matrixToEditableText(matrix)}`}
            rows={Math.max(2, matrixRows(matrix).length)}
            onClick={(event: MouseEvent<HTMLTextAreaElement>) => event.stopPropagation()}
            onFocus={() => {
              setActiveSlot(slot);
              setSelectedMatrixId(matrix.id);
            }}
            onBlur={(event: FocusEvent<HTMLTextAreaElement>) => updateMatrixFromText(slot, matrix.id, event.target.value)}
            placeholder={"+consonantal\n-sonorant"}
            aria-label="Feature matrix rows"
          />
        </div>
      </div>
    );
  }

  function renderPreviewMatrix(matrix: MatrixToken) {
    const rows = [
      ...matrix.nodes.map((node) => ({ key: `node-${node}`, text: node })),
      ...Object.entries(matrix.features).map(([name, value]) => ({ key: `feature-${name}`, text: `${value}${name}` })),
    ];
    const visibleRows = rows.length || 1;

    const bracket = (side: "left" | "right") => (
      <span className={`preview-matrix-bracket ${side}`} aria-hidden="true">
        <span>{side === "left" ? "⎡" : "⎤"}</span>
        {Array.from({ length: Math.max(0, visibleRows - 2) }, (_, index) => (
          <span key={index}>{side === "left" ? "⎢" : "⎥"}</span>
        ))}
        {visibleRows > 1 && <span>{side === "left" ? "⎣" : "⎦"}</span>}
      </span>
    );

    return (
      <span className="preview-matrix-stack" key={matrix.id} aria-label={formatMatrixText(matrix)}>
        {matrix.label.trim() && (
          <span className="preview-matrix-label">{matrix.label.trim()}</span>
        )}
        <span className="preview-feature-matrix">
          {bracket("left")}
          <span className="preview-matrix-rows">
            {rows.length === 0 ? (
              <span className="preview-matrix-empty">empty</span>
            ) : rows.map((row) => (
              <span className="preview-matrix-row" key={row.key}>{row.text}</span>
            ))}
          </span>
          {bracket("right")}
        </span>
      </span>
    );
  }

  function renderPreviewSlot(slot: RuleSlot) {
    const tokens = rule[slot];

    if (tokens.length === 0) {
      return <span className="preview-blank" aria-label="blank">&nbsp;</span>;
    }

    const content: ReactNode[] = [];
    let symbolGroup: SymbolToken[] = [];
    let groupNumber = 0;

    const flushSymbolGroup = () => {
      if (symbolGroup.length === 0) return;

      if (slot === "X" || slot === "Y") {
        const opening = slot === "X" ? "/" : "[";
        const closing = slot === "X" ? "/" : "]";
        const text = groupedSymbolStrings(symbolGroup).join(", ");

        content.push(
          <span className="preview-symbol-group" key={`${slot}-symbols-${groupNumber}`}>
            {opening}{text}{closing}
          </span>,
        );
      } else {
        groupedSymbolStrings(symbolGroup).forEach((symbol, index) => {
          content.push(
            <span className="preview-symbol" key={`${slot}-symbol-${groupNumber}-${index}`}>
              {symbol}
            </span>,
          );
        });
      }

      symbolGroup = [];
      groupNumber += 1;
    };

    for (const token of tokens) {
      if (token.kind === "symbol") {
        symbolGroup.push(token);
        continue;
      }

      flushSymbolGroup();

      if (token.kind === "matrix") {
        content.push(renderPreviewMatrix(token));
      } else {
        content.push(
          <span className="preview-boundary" key={token.id}>
            {token.value}
          </span>,
        );
      }
    }

    flushSymbolGroup();
    return <span className="preview-slot-content">{content}</span>;
  }


  function ipaButton(symbol: string, keyPrefix = "chart") {
    const item = IPA_ITEMS.find((candidate) => candidate.symbol === symbol);
    if (!item) return null;
    return (
      <button
        type="button"
        className="symbol-button chart-symbol-button"
        title={item.name}
        onClick={() => addIpaItem(item)}
        key={`${keyPrefix}-${item.symbol}-${item.name}`}
      >
        {item.symbol}
      </button>
    );
  }

  function renderPulmonicChart() {
    return (
      <section className="group ipa-chart-section">
        <h3>Pulmonic consonants</h3>
        <p className="chart-key">Where a cell has two symbols, the left symbol is voiceless and the right symbol is voiced.</p>
        <div className="ipa-chart-scroll">
          <div className="consonant-chart" role="table" aria-label="IPA pulmonic consonant chart">
            <div className="chart-corner" />
            {PULMONIC_PLACES.map((place) => <div className="chart-column-heading" key={place}>{place}</div>)}
            {PULMONIC_ROWS.map((manner) => (
              <div className="consonant-chart-row" key={manner}>
                <div className="chart-row-heading">{manner}</div>
                {PULMONIC_PLACES.map((place) => {
                  const symbols = PULMONIC_CHART[manner]?.[place] ?? [];
                  return (
                    <div className={`chart-cell ${symbols.length === 0 ? "empty-chart-cell" : ""}`} key={`${manner}-${place}`}>
                      {symbols.map((symbol) => ipaButton(symbol, `${manner}-${place}`))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  function renderVowelChart() {
    return (
      <section className="group ipa-chart-section">
        <h3>Vowels</h3>
        <p className="chart-key">Within a pair, the left vowel is unrounded and the right vowel is rounded.</p>
        <div className="vowel-chart" role="table" aria-label="IPA vowel chart">
          <div className="chart-corner" />
          <div className="vowel-column-heading">Front</div>
          <div className="vowel-column-heading">Central</div>
          <div className="vowel-column-heading">Back</div>
          {VOWEL_POSITIONS.map((row) => (
            <div className="vowel-chart-row" key={row.height}>
              <div className="chart-row-heading">{row.height}</div>
              {([row.front, row.central, row.back] as readonly (readonly string[])[]).map((symbols, index) => (
                <div className={`vowel-cell vowel-column-${index} ${symbols.length === 0 ? "empty-chart-cell" : ""}`} key={`${row.height}-${index}`}>
                  {symbols.map((symbol) => ipaButton(symbol, `${row.height}-${index}`))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderFlatIpaGroups(groups: Record<string, IpaItem[]>) {
    return Object.entries(groups).map(([group, items]) => (
      <section className="group" key={group}>
        <h3>{group}</h3>
        <div className="symbol-grid">
          {items.map((item) => (
            <button type="button" className="symbol-button" title={item.name} onClick={() => addIpaItem(item)} key={`${group}-${item.symbol}-${item.name}`}>
              {item.symbol}
            </button>
          ))}
        </div>
      </section>
    ));
  }

  function renderIpaPicker() {
    if (search.trim()) return renderFlatIpaGroups(filteredIpaGroups);

    const supplementaryGroups = IPA_ITEMS
      .filter((item) => item.group !== "Pulmonic consonants" && item.group !== "Vowels")
      .reduce<Record<string, IpaItem[]>>((groups, item) => {
        (groups[item.group] ??= []).push(item);
        return groups;
      }, {});

    return (
      <>
        {renderPulmonicChart()}
        {renderVowelChart()}
        {renderFlatIpaGroups(supplementaryGroups)}
      </>
    );
  }

  function renderRuleToken(slot: RuleSlot, token: RuleToken, index: number) {
    const selected =
      token.kind === "matrix" && token.id === selectedMatrixId && slot === activeSlot;
    const tokenValue =
      token.kind === "symbol"
        ? token.symbol
        : token.kind === "boundary"
          ? token.value
          : "";

    return (
      <div
        className={`rule-token ${token.kind} ${selected ? "selected-token" : ""}`}
        key={token.id}
        title={
          token.kind === "symbol"
            ? token.name
            : token.kind === "boundary"
              ? token.name
              : "Feature matrix"
        }
        onClick={() => {
          setActiveSlot(slot);
          if (token.kind === "matrix") {
            setSelectedMatrixId(token.id);
            setActiveTab("features");
          }
        }}
      >
        <div className="token-content">
          {token.kind === "matrix" ? (
            renderMatrix(slot, token)
          ) : (
            <input
              className="token-inline-input"
              defaultValue={tokenValue}
              key={`${token.id}-${tokenValue}`}
              size={Math.max(1, Array.from(tokenValue).length)}
              onClick={(event: MouseEvent<HTMLInputElement>) => event.stopPropagation()}
              onFocus={() => setActiveSlot(slot)}
              onBlur={(event: FocusEvent<HTMLInputElement>) => updateTokenValue(slot, token.id, event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              aria-label={token.kind === "symbol" ? "Edit symbol" : "Edit notation"}
            />
          )}
        </div>

        <span className="token-controls">
          <button
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              moveToken(slot, token.id, -1);
            }}
            disabled={index === 0}
            aria-label="Move left"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              moveToken(slot, token.id, 1);
            }}
            disabled={index === rule[slot].length - 1}
            aria-label="Move right"
          >
            ›
          </button>
          <button
            type="button"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.stopPropagation();
              removeToken(slot, token.id);
            }}
            aria-label="Remove"
          >
            ×
          </button>
        </span>
      </div>
    );
  }

  function renderSlot(slot: RuleSlot) {
    return (
      <div
        className={`rule-slot ${activeSlot === slot ? "active-slot" : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => selectSlot(slot)}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectSlot(slot);
          }
        }}
      >
        <div className="slot-header">
          <span className="slot-label">{SLOT_LABELS[slot]}</span>
          <span className="slot-clipboard-controls" onClick={(event: MouseEvent<HTMLSpanElement>) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => copySlot(slot)}
              aria-label={`Copy ${SLOT_LABELS[slot]}`}
              title={`Copy all contents of ${SLOT_LABELS[slot]}`}
            >
              Copy
            </button>
            <button
              type="button"
              onClick={() => pasteSlot(slot)}
              disabled={slotClipboard === null}
              aria-label={`Paste into ${SLOT_LABELS[slot]}`}
              title={copiedFromSlot ? `Replace this box with copied ${SLOT_LABELS[copiedFromSlot]}` : "Copy a box first"}
            >
              Paste
            </button>
          </span>
        </div>
        <div className="slot-tokens">
          {rule[slot].length === 0
            ? <span className="slot-blank" aria-label="blank position">&nbsp;</span>
            : rule[slot].map((token, index) => renderRuleToken(slot, token, index))}
        </div>
        <div className="slot-direct-entry" onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}>
          <input
            value={slotDrafts[slot]}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setSlotDrafts((previous) => ({ ...previous, [slot]: event.target.value }))
            }
            onFocus={() => setActiveSlot(slot)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === "Enter") addTypedSlotContent(slot);
            }}
            placeholder="Type IPA or notation; press Enter"
            aria-label={`Type directly into ${SLOT_LABELS[slot]}`}
          />
          <button
            type="button"
            onClick={() => addTypedSlotContent(slot)}
            aria-label={`Add typed content to ${SLOT_LABELS[slot]}`}
          >
            +
          </button>
        </div>
      </div>
    );
  }

  return (
    <>

      <main className="app-shell">
        <header className="topbar">
          <div>
            <h1>SPE Rule Builder</h1>
            <p>Build rules in the form X → Y / A __ B using IPA symbols, feature matrices, boundaries, and custom Unicode input.</p>
          </div>

          <div className="toolbar">
            <button type="button" onClick={undo} disabled={pastRules.length === 0}>Undo</button>
            <button type="button" onClick={clearAll}>Clear rule</button>
            <button type="button" onClick={exportPng}>Export PNG</button>
            <button type="button" onClick={exportLatex}>Export LaTeX</button>
            <button type="button" className="primary-button" onClick={copyRule}>Copy rule</button>
          </div>
        </header>

        <section className="preview-panel">
          <div className="preview-heading">
            <h2>Rule preview</h2>
            <span className="status" aria-live="polite">{status}</span>
          </div>

          <div className="plain-preview" aria-label={ruleText}>
            {renderPreviewSlot("X")}
            <span className="preview-operator">→</span>
            {renderPreviewSlot("Y")}
            <span className="preview-operator">/</span>
            {renderPreviewSlot("A")}
            <span className="preview-operator">__</span>
            {renderPreviewSlot("B")}
          </div>

          <div className="rule-layout">
            {renderSlot("X")}
            <div className="rule-operator">→</div>
            {renderSlot("Y")}
            <div className="rule-operator">/</div>
            {renderSlot("A")}
            <div className="rule-operator">__</div>
            {renderSlot("B")}
          </div>
        </section>

        <div className="workspace">
          <aside className="left-panel">
            <h2>Editing</h2>
            <div className="slot-list">
              {(["X", "Y", "A", "B"] as RuleSlot[]).map((slot) => (
                <button type="button" className={activeSlot === slot ? "active" : ""} onClick={() => selectSlot(slot)} key={slot}>
                  {SLOT_LABELS[slot]}
                </button>
              ))}
            </div>

            <hr />

            <button type="button" className="small-button" onClick={addNewMatrix}>Add new feature matrix</button>
            <button type="button" className="small-button" onClick={() => clearSlot(activeSlot)}>Clear active position</button>

            {currentMatrix && (
              <>
                <hr />
                <p className="matrix-note"><strong>Selected matrix:</strong><br />{formatMatrixText(currentMatrix)}</p>
              </>
            )}
          </aside>

          <section className="picker-panel">
            <nav className="picker-tabs" aria-label="Builder tools">
              <button type="button" className={activeTab === "ipa" ? "active" : ""} onClick={() => setActiveTab("ipa")}>IPA symbols</button>
              <button type="button" className={activeTab === "features" ? "active" : ""} onClick={() => setActiveTab("features")}>Features</button>
              <button type="button" className={activeTab === "boundaries" ? "active" : ""} onClick={() => setActiveTab("boundaries")}>Boundaries</button>
            </nav>

            <div className="picker-body">
              {activeTab !== "boundaries" && (
                <div className="search-row">
                  <input
                    type="search"
                    value={search}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                    placeholder={activeTab === "ipa" ? "Search IPA symbols or descriptions" : "Search features"}
                    aria-label="Search"
                  />
                  {search && <button type="button" className="small-button" onClick={() => setSearch("")}>Clear search</button>}
                </div>
              )}

              {activeTab === "ipa" && (
                <>
                  {renderIpaPicker()}

                  {Object.keys(filteredIpaGroups).length === 0 && <p>No matching IPA symbols were found.</p>}

                  <div className="custom-row">
                    <input
                      value={customSymbol}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomSymbol(event.target.value)}
                      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter") addCustomSymbol(); }}
                      placeholder="Paste any IPA or Unicode sequence"
                      aria-label="Custom IPA or Unicode sequence"
                    />
                    <button type="button" className="small-button" onClick={addCustomSymbol}>Add custom symbol</button>
                  </div>
                </>
              )}

              {activeTab === "features" && (
                <>
                  <p className="matrix-note">Choose a matrix in the rule boxes, or click a feature to create one automatically. You can also type its category and rows directly. Feature values and feature-geometric nodes remain independent.</p>

                  <label className="advanced-feature-toggle">
                    <input
                      type="checkbox"
                      checked={advancedFeatures}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setAdvancedFeatures(event.target.checked)}
                    />
                    <span>
                      <strong>Advanced features</strong>
                      <small>
                        {advancedFeatures
                          ? "Showing the complete feature inventory."
                          : "Showing the introductory feature set only."}
                      </small>
                    </span>
                  </label>

                  {currentMatrix && (
                    <div className="matrix-direct-panel">
                      <div>
                        <p className="unary-heading">Category above matrix</p>
                        <div className="matrix-category-row">
                          {["C", "V", "N", "S"].map((label) => (
                            <button
                              type="button"
                              className={`matrix-category-button ${currentMatrix.label === label ? "selected" : ""}`}
                              onClick={() =>
                                setCurrentMatrixLabel(currentMatrix.label === label ? "" : label)
                              }
                              key={label}
                            >
                              {label}
                            </button>
                          ))}
                          <input
                            className="matrix-label-field"
                            defaultValue={currentMatrix.label}
                            key={`panel-label-${currentMatrix.id}-${currentMatrix.label}`}
                            onBlur={(event: FocusEvent<HTMLInputElement>) =>
                              updateMatrixLabel(activeSlot, currentMatrix.id, event.target.value)
                            }
                            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                              if (event.key === "Enter") event.currentTarget.blur();
                            }}
                            placeholder="Custom category"
                            aria-label="Custom matrix category"
                          />
                        </div>
                      </div>
                      <label className="matrix-text-editor-label">
                        <span>Type matrix rows, one per line</span>
                        <textarea
                          className="matrix-text-editor"
                          defaultValue={matrixToEditableText(currentMatrix)}
                          key={`panel-rows-${currentMatrix.id}-${matrixToEditableText(currentMatrix)}`}
                          rows={Math.max(4, matrixRows(currentMatrix).length)}
                          onBlur={(event: FocusEvent<HTMLTextAreaElement>) =>
                            updateMatrixFromText(activeSlot, currentMatrix.id, event.target.value)
                          }
                          placeholder={"LABIAL\n+round\n-voice"}
                        />
                      </label>
                    </div>
                  )}

                  <p className="unary-heading">Unary place features</p>
                  <div className="node-row">
                    {UNARY_PLACE_FEATURES.map((node) => (
                      <button
                        type="button"
                        className={`node-button ${currentMatrix?.nodes.includes(node) ? "selected" : ""}`}
                        onClick={() => toggleNode(node)}
                        key={node}
                      >
                        {node}
                      </button>
                    ))}
                  </div>

                  {Object.entries(filteredFeatureGroups).map(([group, features]) => (
                    <section className="group" key={group}>
                      <h3>{group}</h3>
                      <div className="feature-list">
                        {features.map((feature) => {
                          const selectedValue = currentMatrix?.features[feature.name];
                          return (
                            <div className="feature-item" key={feature.name}>
                              <span className="feature-name">
                                [±{feature.name}]
                              </span>
                              <button
                                type="button"
                                className={`value-button ${selectedValue === "+" ? "selected" : ""}`}
                                onClick={() => setFeature(feature, "+")}
                                title={`Set ${feature.name} to +`}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                className={`value-button ${selectedValue === "-" ? "selected" : ""}`}
                                onClick={() => setFeature(feature, "-")}
                                title={`Set ${feature.name} to −`}
                              >
                                −
                              </button>
                              <select
                                className={`variable-select ${isVariableFeatureValue(selectedValue) ? "selected" : ""}`}
                                value={isVariableFeatureValue(selectedValue) ? selectedValue : ""}
                                onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                                  const value = event.target.value as VariableFeatureValue | "";
                                  if (value) setFeature(feature, value);
                                }}
                                aria-label={`Variable value for ${feature.name}`}
                              >
                                <option value="">α/β/γ</option>
                                {VARIABLE_FEATURE_VALUES.map((value) => (
                                  <option value={value} key={value}>{value}</option>
                                ))}
                              </select>
                              <button type="button" className="value-button remove-feature" onClick={() => removeFeature(feature.name)} title={`Remove ${feature.name}`}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  <div className="custom-row custom-feature-row">
                    <input
                      value={customFeature}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomFeature(event.target.value)}
                      placeholder="Custom feature name"
                      aria-label="Custom feature name"
                    />
                    <select
                      className="custom-value-select"
                      value={customFeatureValue}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) => setCustomFeatureValue(event.target.value as FeatureValue)}
                      aria-label="Custom feature value"
                    >
                      <option value="+">+</option>
                      <option value="-">−</option>
                      {VARIABLE_FEATURE_VALUES.map((value) => (
                        <option value={value} key={value}>{value}</option>
                      ))}
                    </select>
                    <button type="button" className="small-button" onClick={addCustomFeature}>Add feature</button>
                  </div>
                </>
              )}

              {activeTab === "boundaries" && (
                <div className="boundary-grid">
                  {BOUNDARIES.map((boundary) => (
                    <button type="button" className="boundary-button" onClick={() => addBoundary(boundary.value, boundary.name)} key={`${boundary.value}-${boundary.name}`}>
                      <span className="boundary-symbol" aria-label={boundary.value || "blank position"}>{boundary.value || " "}</span>
                      <span className="boundary-name">{boundary.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default App;
