import { useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import "./App.css";

type RuleSlot = "X" | "Y" | "A" | "B";
type PickerTab = "ipa" | "features" | "boundaries";
type FeatureValue = "+" | "-" | "α" | "-α";
type PlaceNode = "LABIAL" | "CORONAL" | "DORSAL" | "LARYNGEAL";

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
  features: Record<string, FeatureValue>;
  nodes: PlaceNode[];
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

const FEATURES: FeatureDefinition[] = [
  { name: "syllabic", group: "Major class" },
  { name: "consonantal", group: "Major class" },
  { name: "sonorant", group: "Major class" },
  { name: "approximant", group: "Major class" },
  { name: "continuant", group: "Manner" },
  { name: "delayed release", group: "Manner" },
  { name: "nasal", group: "Manner" },
  { name: "lateral", group: "Manner" },
  { name: "strident", group: "Manner", node: "CORONAL" },
  { name: "distributed", group: "Manner", node: "CORONAL" },
  { name: "voice", group: "Laryngeal", node: "LARYNGEAL" },
  { name: "spread glottis", group: "Laryngeal", node: "LARYNGEAL" },
  { name: "constricted glottis", group: "Laryngeal", node: "LARYNGEAL" },
  { name: "round", group: "Labial", node: "LABIAL" },
  { name: "anterior", group: "Coronal", node: "CORONAL" },
  { name: "high", group: "Dorsal and vowel", node: "DORSAL" },
  { name: "low", group: "Dorsal and vowel", node: "DORSAL" },
  { name: "back", group: "Dorsal and vowel", node: "DORSAL" },
  { name: "advanced tongue root", group: "Dorsal and vowel", node: "DORSAL" },
  { name: "retracted tongue root", group: "Dorsal and vowel", node: "DORSAL" },
  { name: "tense", group: "Vowel and prosodic" },
  { name: "reduced", group: "Vowel and prosodic" },
  { name: "long", group: "Vowel and prosodic" },
  { name: "stress", group: "Vowel and prosodic" },
  { name: "tone", group: "Vowel and prosodic" },
];

const BOUNDARIES = [
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
];

const STORAGE_KEY = "spe-rule-builder-state-v1";

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneRule(rule: RuleState): RuleState {
  return JSON.parse(JSON.stringify(rule)) as RuleState;
}

function loadSavedRule(): RuleState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return cloneRule(EMPTY_RULE);

    const parsed = JSON.parse(saved) as Partial<RuleState>;
    return {
      X: Array.isArray(parsed.X) ? parsed.X : [],
      Y: Array.isArray(parsed.Y) ? parsed.Y : [],
      A: Array.isArray(parsed.A) ? parsed.A : [],
      B: Array.isArray(parsed.B) ? parsed.B : [],
    };
  } catch {
    return cloneRule(EMPTY_RULE);
  }
}

function isStandaloneCombiningMark(text: string): boolean {
  return /^[\u0300-\u036f\u1ab0-\u1aff\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]+$/u.test(text);
}

function formatMatrixText(matrix: MatrixToken): string {
  const lines = [
    ...matrix.nodes,
    ...Object.entries(matrix.features).map(([name, value]) => `${value}${name}`),
  ];
  return lines.length === 0 ? "[ ]" : `[${lines.join(", ")}]`;
}

function formatTokenText(token: RuleToken): string {
  if (token.kind === "symbol") return token.symbol;
  if (token.kind === "boundary") return token.value;
  return formatMatrixText(token);
}

function formatSlotText(slot: RuleSlot, tokens: RuleToken[]): string {
  if (tokens.length === 0) return "∅";

  if (slot !== "X" && slot !== "Y") {
    return tokens.map(formatTokenText).join(" ");
  }

  const parts: string[] = [];
  let symbolGroup: string[] = [];

  const flushSymbols = () => {
    if (symbolGroup.length === 0) return;
    const opening = slot === "X" ? "/" : "[";
    const closing = slot === "X" ? "/" : "]";
    parts.push(`${opening}${symbolGroup.join(", ")}${closing}`);
    symbolGroup = [];
  };

  for (const token of tokens) {
    if (token.kind === "symbol") {
      symbolGroup.push(token.symbol);
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

function App() {
  const [rule, setRule] = useState<RuleState>(() => loadSavedRule());
  const [pastRules, setPastRules] = useState<RuleState[]>([]);
  const [activeSlot, setActiveSlot] = useState<RuleSlot>("X");
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PickerTab>("ipa");
  const [search, setSearch] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customFeature, setCustomFeature] = useState("");
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
      if (!query) return true;
      return feature.name.toLowerCase().includes(query) || feature.group.toLowerCase().includes(query);
    });

    return filtered.reduce<Record<string, FeatureDefinition[]>>((groups, feature) => {
      (groups[feature.group] ??= []).push(feature);
      return groups;
    }, {});
  }, [search]);

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

    if ((item.group === "Diacritics" || isStandaloneCombiningMark(item.symbol)) && lastToken?.kind === "symbol") {
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

  function addBoundary(value: string, name: string) {
    addToken({ id: createId(), kind: "boundary", value, name });
  }

  function addNewMatrix() {
    const matrix: MatrixToken = {
      id: createId(),
      kind: "matrix",
      features: {},
      nodes: [],
    };
    addToken(matrix);
    setSelectedMatrixId(matrix.id);
    setActiveTab("features");
  }

  function findTargetMatrixId(): string | null {
    const activeTokens = rule[activeSlot];
    if (selectedMatrixId && activeTokens.some((token) => token.id === selectedMatrixId && token.kind === "matrix")) {
      return selectedMatrixId;
    }
    const lastMatrix = [...activeTokens].reverse().find((token): token is MatrixToken => token.kind === "matrix");
    return lastMatrix?.id ?? null;
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
    const node = typeof feature === "string" ? undefined : feature.node;

    ensureMatrixAndUpdate((matrix) => ({
      ...matrix,
      features: { ...matrix.features, [name]: value },
      nodes: node && !matrix.nodes.includes(node) ? [...matrix.nodes, node] : matrix.nodes,
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

  function addCustomFeature(value: FeatureValue) {
    const name = customFeature.trim();
    if (!name) return;
    setFeature(name, value);
    setCustomFeature("");
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

  function renderMatrix(matrix: MatrixToken) {
    const lines = [
      ...matrix.nodes.map((node) => ({ key: `node-${node}`, text: node })),
      ...Object.entries(matrix.features).map(([name, value]) => ({ key: `feature-${name}`, text: `${value}${name}` })),
    ];

    return (
      <span className="matrix-visual" aria-label={formatMatrixText(matrix)}>
        {lines.length === 0 ? <span className="empty-matrix">empty matrix</span> : lines.map((line) => <span key={line.key}>{line.text}</span>)}
      </span>
    );
  }

  function renderPreviewMatrix(matrix: MatrixToken) {
    const rows = [
      ...matrix.nodes.map((node) => ({
        key: `node-${node}`,
        text: node,
      })),
      ...Object.entries(matrix.features).map(([name, value]) => ({
        key: `feature-${name}`,
        text: `${value}${name}`,
      })),
    ];

    return (
      <span
        className="preview-feature-matrix"
        key={matrix.id}
        aria-label={formatMatrixText(matrix)}
      >
        {rows.length === 0 ? (
          <span className="preview-matrix-empty">empty matrix</span>
        ) : (
          <span className="preview-matrix-rows">
            {rows.map((row) => (
              <span className="preview-matrix-row" key={row.key}>
                {row.text}
              </span>
            ))}
          </span>
        )}
      </span>
    );
  }

  function renderPreviewSlot(slot: RuleSlot) {
    const tokens = rule[slot];

    if (tokens.length === 0) {
      return <span className="preview-empty">∅</span>;
    }

    const content: ReactNode[] = [];
    let symbolGroup: SymbolToken[] = [];
    let groupNumber = 0;

    const flushSymbolGroup = () => {
      if (symbolGroup.length === 0) return;

      if (slot === "X" || slot === "Y") {
        const opening = slot === "X" ? "/" : "[";
        const closing = slot === "X" ? "/" : "]";
        const text = symbolGroup.map((token) => token.symbol).join(", ");

        content.push(
          <span className="preview-symbol-group" key={`${slot}-symbols-${groupNumber}`}>
            {opening}{text}{closing}
          </span>,
        );
      } else {
        for (const token of symbolGroup) {
          content.push(
            <span className="preview-symbol" key={token.id}>
              {token.symbol}
            </span>,
          );
        }
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

  function renderRuleToken(slot: RuleSlot, token: RuleToken, index: number) {
    const selected = token.kind === "matrix" && token.id === selectedMatrixId && slot === activeSlot;

    return (
      <span
        className={`rule-token ${token.kind} ${selected ? "selected-token" : ""}`}
        key={token.id}
        title={token.kind === "symbol" ? token.name : token.kind === "boundary" ? token.name : "Feature matrix"}
        onClick={() => {
          selectSlot(slot);
          if (token.kind === "matrix") {
            setSelectedMatrixId(token.id);
            setActiveTab("features");
          }
        }}
      >
        <span className="token-content">
          {token.kind === "matrix" ? renderMatrix(token) : token.kind === "symbol" ? token.symbol : token.value}
        </span>

        <span className="token-controls">
          <button type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); moveToken(slot, token.id, -1); }} disabled={index === 0} aria-label="Move left">‹</button>
          <button type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); moveToken(slot, token.id, 1); }} disabled={index === rule[slot].length - 1} aria-label="Move right">›</button>
          <button type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => { event.stopPropagation(); removeToken(slot, token.id); }} aria-label="Remove">×</button>
        </span>
      </span>
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
        <span className="slot-label">{SLOT_LABELS[slot]}</span>
        <span className="slot-tokens">
          {rule[slot].length === 0
            ? <span className="slot-placeholder">Click here, then choose symbols or features below</span>
            : rule[slot].map((token, index) => renderRuleToken(slot, token, index))}
        </span>
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
                  {Object.entries(filteredIpaGroups).map(([group, items]) => (
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
                  ))}

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
                  <p className="matrix-note">Choose a matrix in the rule preview, or click a feature to create a new matrix automatically. Feature values can be positive, negative, or linked with α.</p>

                  <div className="node-row">
                    {(["LARYNGEAL", "LABIAL", "CORONAL", "DORSAL"] as PlaceNode[]).map((node) => (
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
                                {feature.node && <span className="feature-node"> · {feature.node}</span>}
                              </span>
                              {(["+", "-", "α", "-α"] as FeatureValue[]).map((value) => (
                                <button
                                  type="button"
                                  className={`value-button ${selectedValue === value ? "selected" : ""} ${value.includes("α") ? "alpha-value" : ""}`}
                                  onClick={() => setFeature(feature, value)}
                                  title={`Set ${feature.name} to ${value}`}
                                  key={value}
                                >
                                  {value}
                                </button>
                              ))}
                              <button type="button" className="value-button remove-feature" onClick={() => removeFeature(feature.name)} title={`Remove ${feature.name}`}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  <div className="custom-row">
                    <input
                      value={customFeature}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setCustomFeature(event.target.value)}
                      placeholder="Custom feature name"
                      aria-label="Custom feature name"
                    />
                    <button type="button" className="small-button" onClick={() => addCustomFeature("+")}>Add +</button>
                    <button type="button" className="small-button" onClick={() => addCustomFeature("-")}>Add −</button>
                  </div>
                </>
              )}

              {activeTab === "boundaries" && (
                <div className="boundary-grid">
                  {BOUNDARIES.map((boundary) => (
                    <button type="button" className="boundary-button" onClick={() => addBoundary(boundary.value, boundary.name)} key={`${boundary.value}-${boundary.name}`}>
                      <span className="boundary-symbol">{boundary.value}</span>
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
