#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const REPORT_DIR = path.join(ROOT, "report");
const DATA_PATH = path.join(REPORT_DIR, "data.json");
const INDEX_PATH = path.join(REPORT_DIR, "index.html");
const REVIEW_PATH = path.join(REPORT_DIR, "transcript-reclassifications.json");

const SOURCE_EXTENSIONS = [".tsv", ".srt", ".vtt", ".txt", ".json"];
const PREFERRED_EXTENSIONS = [".tsv", ".srt", ".vtt", ".json", ".txt"];
const NON_TRANSCRIPT_FILES = new Set(["entity-registry.json", "package.json", "package-lock.json"]);

const CATEGORY_DEFS = [
  ["research_groups", "Active research groups"],
  ["patents", "Patents"],
  ["white_papers", "White papers"],
  ["books", "Books"],
  ["authors", "Authors"],
  ["journalists", "Journalists"],
  ["frequencies", "Frequencies"],
  ["locations", "Locations"],
  ["people", "People and their significance"],
  ["experiencers", "Experiencers"],
  ["government_project_codenames", "Government project codenames"],
  ["military_bases", "Military bases"],
  ["professors", "Professors"],
  ["universities", "Universities"],
  ["university_departments", "Departments at Universities"],
  ["government_agencies", "Government agencies"],
  ["contractors", "Contractors"],
  ["document_names", "Document names"],
  ["whistleblowers", "Whistleblowers"],
  ["companies", "Companies"],
  ["politicians", "Politicians"],
  ["tv_shows", "TV shows"],
  ["movies", "Hollywood-produced movies"],
  ["directors", "Directors"],
  ["producers", "Producers"],
  ["blood_types", "Blood types"],
  ["medical_conditions", "Medical conditions"],
  ["dates_times", "Dates and times"],
  ["dumbs", "DUMBs (Deep Underground Military Bases)"],
  ["events", "Events"],
  ["hoaxers", "Hoaxers"],
  ["confirmed_hoaxes", "Confirmed hoaxes"],
  ["key_terms", "Key terms"],
  ["websites", "Websites"],
  ["chemical_elements", "Chemical elements"],
  ["materials", "Materials"],
  ["stars", "Stars"],
  ["planets", "Planets"],
  ["constellations", "Constellations"],
  ["star_systems", "Star systems"],
  ["galaxies", "Galaxies"],
  ["theories", "Theories"],
  ["gps_coordinates", "GPS coordinates"],
  ["ip_addresses", "IP addresses"],
  ["financiers", "Financiers"],
  ["symbols", "Symbols"],
  ["religious_texts", "Religious texts"],
  ["emerging_terminology", "Emerging terminology"],
  ["taxonomies", "Taxonomies"],
  ["quotes", "Powerful quotes from relevant people"],
  ["secret_societies", "Secret societies"],
  ["leaks", "Leaks"],
  ["watchdog_groups", "Watchdog groups"],
  ["nonprofits", "Nonprofits"],
  ["institutes", "Institutes"],
  ["dangerous_people", "Dangerous people"],
  ["friendly_people", "Friendly people"],
  ["likely_spies", "Likely spies"],
  ["alien_species", "Alien species"],
  ["radio_frequencies", "Radio frequencies"],
];

const CATEGORY_LABELS = Object.fromEntries(CATEGORY_DEFS);

const DICTIONARIES = {
  research_groups: [
    "Advanced Aerospace Threat Identification Program",
    "AATIP",
    "Advanced Aerospace Weapon System Applications Program",
    "AAWSAP",
    "Galileo Project",
    "Scientific Coalition for UAP Studies",
    "SCU",
    "To The Stars Academy",
    "TTSA",
    "Aerial Phenomena Research Organization",
    "APRO",
    "MUFON",
    "NIDS",
    "National Institute for Discovery Science",
    "UAP Task Force",
    "All-domain Anomaly Resolution Office",
    "AARO",
    "Project Galileo",
  ],
  patents: ["patent", "US Patent", "patent application", "Navy patent"],
  white_papers: ["white paper", "DIRD", "Defense Intelligence Reference Document"],
  books: [
    "The Day After Roswell",
    "Communion",
    "The Hunt for Zero Point",
    "Skinwalkers at the Pentagon",
    "Imminent",
    "The 37th Parallel",
    "UFOs and Nukes",
    "Passport to Magonia",
  ],
  journalists: [
    "George Knapp",
    "Jeremy Corbell",
    "Leslie Kean",
    "Ross Coulthart",
    "Bryce Zabel",
    "Christopher Mellon",
    "James Fox",
    "Steven Greenstreet",
    "Michael Shellenberger",
    "Ralph Blumenthal",
    "Kirkpatrick",
  ],
  locations: [
    "Area 51",
    "S4",
    "Papoose Lake",
    "Groom Lake",
    "Nevada",
    "Los Alamos",
    "Dulce",
    "Wright-Patterson",
    "Roswell",
    "New Mexico",
    "Utah",
    "Skinwalker Ranch",
    "Long Island",
    "Florida",
    "California",
    "Afghanistan",
    "Peru",
    "Russia",
    "China",
    "Antarctica",
    "Las Vegas",
    "Washington",
    "Capitol Hill",
  ],
  government_project_codenames: [
    "Project Blue Book",
    "Project Sign",
    "Project Grudge",
    "Project Mogul",
    "Project Stargate",
    "MKUltra",
    "MK Ultra",
    "Project Looking Glass",
    "Project Serpo",
    "Project Aquarius",
    "Operation Paperclip",
    "Operation Highjump",
    "Zodiac",
    "Kona Blue",
    "Immaculate Constellation",
    "Sentient",
  ],
  military_bases: [
    "Area 51",
    "Groom Lake",
    "Wright-Patterson Air Force Base",
    "Edwards Air Force Base",
    "Nellis Air Force Base",
    "Dulce Base",
    "Fort Detrick",
    "Fort Belvoir",
    "Eglin Air Force Base",
    "Holloman Air Force Base",
    "Kirtland Air Force Base",
    "Vandenberg",
  ],
  universities: [
    "MIT",
    "Massachusetts Institute of Technology",
    "Harvard",
    "Stanford",
    "Caltech",
    "University of Virginia",
    "University of Arizona",
    "University of Texas",
    "Pierce College",
    "Cal State",
    "UCLA",
    "Berkeley",
    "Cornell",
  ],
  university_departments: [
    "Department of Physics",
    "Physics Department",
    "Department of Electrical Engineering",
    "Department of Materials Science",
    "Department of Aerospace Engineering",
    "Department of Psychology",
  ],
  government_agencies: [
    "CIA",
    "NSA",
    "NASA",
    "DIA",
    "DoD",
    "Department of Defense",
    "Department of Energy",
    "DOE",
    "FBI",
    "NRO",
    "NGA",
    "DARPA",
    "Office of Naval Intelligence",
    "ONI",
    "Air Force",
    "Space Force",
    "Navy",
    "Pentagon",
    "Congress",
    "Senate",
    "House Oversight Committee",
    "AARO",
  ],
  contractors: [
    "Lockheed Martin",
    "Skunk Works",
    "Raytheon",
    "Northrop Grumman",
    "Boeing",
    "Battelle",
    "SAIC",
    "EG&G",
    "Bigelow Aerospace",
    "BAASS",
    "Aerospace Corporation",
    "Leidos",
  ],
  document_names: [
    "Wilson-Davis memo",
    "Majestic 12",
    "MJ-12",
    "Condon Report",
    "Cometa Report",
    "Tic Tac report",
    "Nimitz report",
    "UAP Disclosure Act",
    "National Defense Authorization Act",
    "NDAA",
    "Schumer amendment",
    "Mosul Orb",
  ],
  whistleblowers: [
    "Bob Lazar",
    "David Grusch",
    "Lue Elizondo",
    "Luis Elizondo",
    "Edward Snowden",
    "Chelsea Manning",
    "Daniel Ellsberg",
    "Karl Nell",
    "Eric Davis",
  ],
  companies: [
    "Lockheed Martin",
    "Raytheon",
    "Northrop Grumman",
    "Boeing",
    "Kraken",
    "Ketone IQ",
    "Target",
    "Netflix",
    "Amazon",
    "Google",
    "Apple",
    "Meta",
    "SpaceX",
    "Blue Origin",
  ],
  politicians: [
    "Chuck Schumer",
    "Marco Rubio",
    "Kirsten Gillibrand",
    "Tim Burchett",
    "Anna Paulina Luna",
    "Harry Reid",
    "Mike Gallagher",
    "Jared Moskowitz",
    "Nancy Mace",
    "Alexandria Ocasio-Cortez",
    "AOC",
  ],
  tv_shows: ["Star Trek", "X-Files", "The X-Files", "Ancient Aliens", "Fireball XL5", "Thunderbirds", "60 Minutes"],
  movies: [
    "Close Encounters of the Third Kind",
    "ET",
    "E.T.",
    "Independence Day",
    "Arrival",
    "The Bob Lazar Story",
    "S4",
    "The Phenomenon",
    "Moment of Contact",
  ],
  blood_types: ["A positive", "A negative", "B positive", "B negative", "AB positive", "AB negative", "O positive", "O negative", "Rh negative", "Rh positive"],
  medical_conditions: [
    "cancer",
    "radiation sickness",
    "burns",
    "PTSD",
    "trauma",
    "brain injury",
    "concussion",
    "sleep paralysis",
    "amnesia",
    "missing time",
    "implants",
  ],
  dumbs: ["DUMB", "DUMBs", "deep underground military base", "underground base", "underground facility", "Dulce Base"],
  events: [
    "Roswell",
    "Nimitz",
    "Tic Tac",
    "Phoenix Lights",
    "Rendlesham Forest",
    "Washington flap",
    "Belgian wave",
    "Varghinha",
    "Varginha",
    "Ariel School",
    "Battle of Los Angeles",
  ],
  hoaxers: ["hoaxer", "hoaxers", "Richard Doty"],
  confirmed_hoaxes: ["confirmed hoax", "proven hoax", "debunked hoax", "alien autopsy"],
  key_terms: [
    "UAP",
    "non-human intelligence",
    "NHI",
    "reverse engineering",
    "crash retrieval",
    "biologics",
    "exotic material",
    "anti-gravity",
    "zero point energy",
    "consciousness",
    "remote viewing",
    "abduction",
    "experiencer",
    "classification",
    "compartmentalized",
    "special access program",
    "SAP",
    "USAP",
  ],
  chemical_elements: [
    "hydrogen",
    "helium",
    "lithium",
    "beryllium",
    "boron",
    "carbon",
    "nitrogen",
    "oxygen",
    "fluorine",
    "neon",
    "sodium",
    "magnesium",
    "aluminum",
    "silicon",
    "phosphorus",
    "sulfur",
    "chlorine",
    "argon",
    "potassium",
    "calcium",
    "titanium",
    "iron",
    "nickel",
    "copper",
    "zinc",
    "silver",
    "tin",
    "gold",
    "mercury",
    "lead",
    "bismuth",
    "thorium",
    "uranium",
    "plutonium",
    "element 115",
    "moscovium",
  ],
  materials: [
    "metamaterial",
    "bismuth",
    "magnesium",
    "zinc",
    "graphene",
    "titanium",
    "aluminum",
    "isotope",
    "alloy",
    "fiber optic",
    "aerogel",
    "nitinol",
    "composite",
  ],
  stars: ["Sirius", "Vega", "Betelgeuse", "Rigel", "Aldebaran", "Arcturus", "Proxima Centauri", "Alpha Centauri"],
  planets: ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"],
  constellations: ["Orion", "Taurus", "Pleiades", "Ursa Major", "Ursa Minor", "Lyra", "Draco", "Cygnus", "Zeta Reticuli"],
  star_systems: ["Zeta Reticuli", "Alpha Centauri", "Proxima Centauri", "Sirius", "Pleiades", "Orion"],
  galaxies: ["Milky Way", "Andromeda", "Triangulum"],
  theories: [
    "interdimensional hypothesis",
    "extraterrestrial hypothesis",
    "breakaway civilization",
    "ancient astronaut",
    "simulation theory",
    "holographic universe",
    "many worlds",
    "time travel",
  ],
  financiers: ["financier", "funded by", "investor", "billionaire", "Robert Bigelow", "Bigelow", "Peter Thiel", "Elon Musk"],
  symbols: ["triangle", "pyramid", "cross", "star", "hexagon", "circle", "sigil", "glyph", "obelisk"],
  religious_texts: ["Bible", "Book of Enoch", "Quran", "Koran", "Torah", "Vedas", "Mahabharata", "Bhagavad Gita", "Dead Sea Scrolls"],
  emerging_terminology: ["NHI", "UAP", "biologics", "transmedium", "observables", "technosignature", "psionic", "ontological shock"],
  taxonomies: ["taxonomy", "classification", "typology", "five observables", "observables"],
  secret_societies: ["Freemasons", "Masons", "Illuminati", "Skull and Bones", "Bohemian Grove", "Knights Templar"],
  leaks: ["leak", "leaked", "leaker", "Snowden", "Wikileaks", "WikiLeaks", "whistleblower complaint"],
  watchdog_groups: ["watchdog", "Project On Government Oversight", "POGO", "Government Accountability Office", "GAO"],
  nonprofits: ["nonprofit", "501(c)(3)", "MUFON", "SCU", "To The Stars Academy"],
  institutes: ["Institute", "National Institute", "National Institute for Discovery Science", "NIDS", "Monroe Institute", "Esalen Institute"],
  alien_species: ["Greys", "Grey aliens", "Nordics", "Reptilians", "Mantids", "Tall Whites", "EBE", "Extraterrestrial Biological Entity"],
};

const REGISTRY = loadEntityRegistry();
for (const [category, terms] of Object.entries(REGISTRY.categories || {})) {
  if (!DICTIONARIES[category]) DICTIONARIES[category] = [];
  DICTIONARIES[category].push(...terms);
}
const OMIT_TERMS = new Set(
  [
    ...(REGISTRY.omit || []),
    "Kraken",
    "Ketone IQ",
    "Target",
    "Incogni",
    "MUD\\WTR",
    "Mudwater",
    "iRestore",
    "Helix Sleep",
    "Shopify",
    "Quo",
    "kraken.com",
    "ketone.com",
    "incogni.com",
    "mudwater.com",
    "iRestore.com",
    "helixsleep.com",
    "shopify.com",
    "quo.com",
  ].map(normalizeName)
);

const ROLE_RULES = {
  authors: /\b(author|wrote|writer|book by|written by)\b/i,
  professors: /\b(professor|faculty|academic|lecturer)\b/i,
  directors: /\b(director|directed by|filmmaker)\b/i,
  producers: /\b(producer|produced by|executive producer)\b/i,
  experiencers: /\b(experiencer|abductee|abducted|taken|contactee|encountered beings|missing time)\b/i,
  dangerous_people: /\b(dangerous|threat|threatening|violent|killed|assassin|murder|war criminal)\b/i,
  friendly_people: /\b(friendly|helped|ally|trusted|supportive|kind|mentor|protected)\b/i,
  likely_spies: /\b(spy|spies|agent|asset|informant|counterintelligence|disinformation|mole)\b/i,
  hoaxers: /\b(hoaxer|hoaxed|fraudster|con artist|fabricated)\b/i,
  financiers: /\b(financier|funded|investor|backer|donor|billionaire|grant)\b/i,
};

const NON_PERSON_TERMS = new Set(
  [
    "research_groups",
    "locations",
    "government_project_codenames",
    "military_bases",
    "universities",
    "university_departments",
    "government_agencies",
    "contractors",
    "document_names",
    "companies",
    "tv_shows",
    "movies",
    "key_terms",
    "chemical_elements",
    "materials",
    "stars",
    "planets",
    "constellations",
    "star_systems",
    "galaxies",
    "theories",
    "symbols",
    "religious_texts",
    "secret_societies",
    "watchdog_groups",
    "nonprofits",
    "institutes",
    "alien_species",
  ].flatMap((category) => DICTIONARIES[category] || [])
    .map(normalizeName)
);

const REGEX_RULES = {
  frequencies: [
    /\b\d{1,4}(?:\.\d{1,6})?\s?(?:Hz|kHz|MHz|GHz|hertz|kilohertz|megahertz|gigahertz)\b/gi,
    /\b\d{2,4}\.\d{3,6}\b/g,
  ],
  radio_frequencies: [/\b\d{2,4}\.\d{3,6}\b/g, /\b\d{1,4}(?:\.\d{1,6})?\s?(?:MHz|megahertz|kHz|kilohertz)\b/gi],
  websites: [/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/?[a-z0-9._~:/?#[\]@!$&'()*+,;=%-]*/gi],
  gps_coordinates: [/\b-?\d{1,2}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}\b/g, /\b\d{1,2}°\s?\d{1,2}'\s?\d{1,2}(?:\.\d+)?["”]?\s?[NSEW]\b/gi],
  ip_addresses: [/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g],
  dates_times: [
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b(?:19|20)\d{2}\b/g,
    /\b\d{1,2}:\d{2}(?:\s?[AP]M)?\b/gi,
  ],
  patents: [/\bUS\s?(?:Patent\s?)?\d{4,}[A-Z0-9-]*\b/gi, /\bpatent(?:\s(?:application|number))?\s(?:\w+\s){0,6}?\d{4,}\b/gi],
  document_names: [/\b[A-Z][A-Za-z0-9-]+(?:\s+[A-Z][A-Za-z0-9-]+){0,5}\s+(?:memo|report|act|amendment|briefing|document|paper)\b/g],
  white_papers: [/\b[A-Z][A-Za-z0-9-]+(?:\s+[A-Z][A-Za-z0-9-]+){0,5}\s+white paper\b/gi],
  quotes: [/"([^"]{80,260})"/g, /“([^”]{80,260})”/g],
};

function main() {
  const review = loadReviewFile();
  resetReportDir();
  const transcripts = loadTranscripts();
  const data = analyze(transcripts, review);
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  fs.writeFileSync(INDEX_PATH, renderHtml(data));
  console.log(`Generated ${path.relative(ROOT, INDEX_PATH)}`);
  console.log(`Indexed ${transcripts.length} transcript sources, ${data.summary.totalMentions} mentions, ${data.graph.links.length} graph links.`);
}

function loadReviewFile() {
  if (!fs.existsSync(REVIEW_PATH)) return { reclassifications: {}, falsePositives: {}, raw: null };
  const raw = JSON.parse(fs.readFileSync(REVIEW_PATH, "utf8"));
  return {
    reclassifications: raw.reclassifications || {},
    falsePositives: raw.falsePositives || {},
    raw,
  };
}

function loadEntityRegistry() {
  const registryPath = path.join(ROOT, "entity-registry.json");
  if (!fs.existsSync(registryPath)) return { categories: {} };
  const parsed = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  return {
    categories: Object.fromEntries(
      Object.entries(parsed.categories || {}).map(([category, terms]) => [
        category,
        Array.isArray(terms) ? terms.filter(Boolean).map(String) : [],
      ])
    ),
    omit: Array.isArray(parsed.omit) ? parsed.omit.filter(Boolean).map(String) : [],
  };
}

function resetReportDir() {
  fs.rmSync(REPORT_DIR, { recursive: true, force: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function loadTranscripts() {
  const files = fs
    .readdirSync(ROOT)
    .filter((file) => SOURCE_EXTENSIONS.includes(path.extname(file).toLowerCase()) && !NON_TRANSCRIPT_FILES.has(file))
    .sort((a, b) => a.localeCompare(b));

  const byBase = new Map();
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file, ext);
    const existing = byBase.get(base);
    if (!existing || PREFERRED_EXTENSIONS.indexOf(ext) < PREFERRED_EXTENSIONS.indexOf(existing.ext)) {
      byBase.set(base, { file, ext });
    }
  }

  return [...byBase.values()]
    .sort((a, b) => a.file.localeCompare(b.file))
    .map(({ file, ext }) => {
      const raw = fs.readFileSync(path.join(ROOT, file), "utf8");
      const rows = parseTranscript(raw, ext);
      return {
        id: slug(path.basename(file, ext)),
        title: titleFromSlug(path.basename(file, ext)),
        file,
        ext,
        rows,
      };
    });
}

function parseTranscript(raw, ext) {
  if (ext === ".tsv") return parseTsv(raw);
  if (ext === ".srt" || ext === ".vtt") return parseTimedText(raw);
  if (ext === ".json") return parseJson(raw);
  return raw
    .split(/\n+/)
    .map((line, index) => ({ startMs: index * 30000, endMs: index * 30000, text: cleanText(line) }))
    .filter((row) => row.text);
}

function parseTsv(raw) {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const hasHeader = /^start\tend\ttext$/i.test(lines[0] || "");
  return lines.slice(hasHeader ? 1 : 0).map((line, index) => {
    const parts = line.split("\t");
    return {
      startMs: Number(parts[0]) || index * 1000,
      endMs: Number(parts[1]) || Number(parts[0]) || index * 1000,
      text: cleanText(parts.slice(2).join("\t")),
    };
  }).filter((row) => row.text);
}

function parseTimedText(raw) {
  const rows = [];
  const blocks = raw.replace(/^WEBVTT.*?\n/i, "").split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) continue;
    const [start, end] = lines[timeLineIndex].split("-->").map((part) => part.trim());
    const text = cleanText(lines.slice(timeLineIndex + 1).join(" "));
    if (text) rows.push({ startMs: timeToMs(start), endMs: timeToMs(end), text });
  }
  return rows;
}

function parseJson(raw) {
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed.segments)) {
    return parsed.segments.map((segment, index) => ({
      startMs: Math.round((Number(segment.start) || index) * 1000),
      endMs: Math.round((Number(segment.end) || Number(segment.start) || index) * 1000),
      text: cleanText(segment.text || ""),
    })).filter((row) => row.text);
  }
  return [{ startMs: 0, endMs: 0, text: cleanText(parsed.text || raw) }].filter((row) => row.text);
}

function analyze(transcripts, review) {
  const categories = Object.fromEntries(CATEGORY_DEFS.map(([id, label]) => [id, { id, label, entries: [] }]));
  const entryIndex = new Map();
  const graphCounts = new Map();

  for (const transcript of transcripts) {
    const chunks = chunkRows(transcript.rows);
    for (const chunk of chunks) {
      const found = extractMentions(chunk.text);
      const namesInChunk = [];

      for (const mention of found) {
        const key = `${mention.category}|${normalizeName(mention.name)}`;
        let entry = entryIndex.get(key);
        if (!entry) {
          entry = {
            id: slug(`${mention.category}-${mention.name}`),
            name: mention.name,
            category: mention.category,
            categoryLabel: CATEGORY_LABELS[mention.category],
            significance: "",
            count: 0,
            sources: [],
          };
          entryIndex.set(key, entry);
          categories[mention.category].entries.push(entry);
        }
        entry.count += 1;
        const source = {
          transcript: transcript.title,
          file: transcript.file,
          startMs: chunk.startMs,
          endMs: chunk.endMs,
          timestamp: formatTimestamp(chunk.startMs),
          excerpt: highlightExcerpt(chunk.text, mention.name),
          link: `#src-${transcript.id}-${chunk.startMs}`,
        };
        if (!entry.sources.some((existing) => existing.file === source.file && existing.startMs === source.startMs)) {
          entry.sources.push(source);
        }
        namesInChunk.push(entry.name);
      }

      const uniqueNames = [...new Set(namesInChunk)].sort((a, b) => a.localeCompare(b));
      for (let i = 0; i < uniqueNames.length; i += 1) {
        for (let j = i + 1; j < uniqueNames.length; j += 1) {
          const key = `${uniqueNames[i]}|||${uniqueNames[j]}`;
          graphCounts.set(key, (graphCounts.get(key) || 0) + 1);
        }
      }
    }
  }

  for (const category of Object.values(categories)) {
    category.entries.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    for (const entry of category.entries) {
      entry.sources.sort((a, b) => a.file.localeCompare(b.file) || a.startMs - b.startMs);
      entry.sources = entry.sources.slice(0, 12);
      entry.significance = inferSignificance(entry);
    }
  }

  applyReview(categories, graphCounts, review);

  const allEntries = Object.values(categories).flatMap((category) => category.entries);
  const nodes = allEntries
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((entry) => ({ key: entry.id, id: entry.name, category: entry.category, categoryLabel: entry.categoryLabel, count: entry.count }));
  const nodeSet = new Set(nodes.map((node) => node.id));
  const links = [...graphCounts.entries()]
    .map(([key, value]) => {
      const [source, target] = key.split("|||");
      return { source, target, value };
    })
    .filter((link) => nodeSet.has(link.source) && nodeSet.has(link.target))
    .sort((a, b) => b.value - a.value || a.source.localeCompare(b.source))
    .slice(0, 1200);

  const totalMentions = allEntries.reduce((sum, entry) => sum + entry.count, 0);
  return {
    generatedAt: new Date().toISOString(),
    reproducibility: {
      note: "This report is regenerated from local transcript files only. No OpenAI API calls are used.",
      sourceExtensions: SOURCE_EXTENSIONS,
      preferredExtensions: PREFERRED_EXTENSIONS,
    },
    summary: {
      transcriptCount: transcripts.length,
      totalMentions,
      categoryCount: CATEGORY_DEFS.length,
    },
    categories,
    sources: transcripts.map((transcript) => ({
      id: transcript.id,
      title: transcript.title,
      file: transcript.file,
      rowCount: transcript.rows.length,
      chunks: chunkRows(transcript.rows).map((chunk) => ({
        id: `src-${transcript.id}-${chunk.startMs}`,
        startMs: chunk.startMs,
        timestamp: formatTimestamp(chunk.startMs),
        text: chunk.text,
      })),
    })),
    graph: { nodes, links },
  };
}

function applyReview(categories, graphCounts, review) {
  const falsePositiveIds = new Set(Object.keys(review.falsePositives || {}));
  for (const entryId of falsePositiveIds) {
    const removed = removeEntryFromCategories(categories, entryId);
    if (removed) removeGraphLinksForName(graphCounts, removed.name);
  }

  for (const [entryId, targetCategory] of Object.entries(review.reclassifications || {})) {
    if (!categories[targetCategory]) continue;
    const entry = removeEntryFromCategories(categories, entryId);
    if (!entry) continue;
    entry.category = targetCategory;
    entry.categoryLabel = CATEGORY_LABELS[targetCategory];
    entry.id = slug(`${targetCategory}-${entry.name}`);
    categories[targetCategory].entries.push(entry);
  }

  for (const category of Object.values(categories)) {
    category.entries.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }
}

function removeEntryFromCategories(categories, entryId) {
  for (const category of Object.values(categories)) {
    const index = category.entries.findIndex((entry) => entry.id === entryId);
    if (index !== -1) return category.entries.splice(index, 1)[0];
  }
  return null;
}

function removeGraphLinksForName(graphCounts, name) {
  for (const key of [...graphCounts.keys()]) {
    const [source, target] = key.split("|||");
    if (source === name || target === name) graphCounts.delete(key);
  }
}

function extractMentions(text) {
  const mentions = [];
  const seen = new Set();

  for (const [category, terms] of Object.entries(DICTIONARIES)) {
    for (const term of terms) {
      const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
      for (const match of text.matchAll(re)) {
        addMention(mentions, seen, category, canonicalTerm(term), match[0]);
      }
    }
  }

  for (const [category, regexes] of Object.entries(REGEX_RULES)) {
    for (const re of regexes) {
      re.lastIndex = 0;
      for (const match of text.matchAll(re)) {
        const name = category === "quotes" ? normalizeQuote(match[1] || match[0]) : normalizeRegexMatch(match[0]);
        if (category === "websites" && !isLikelyWebsite(name)) continue;
        if (name && name.length > 1) addMention(mentions, seen, category, name, match[0]);
      }
    }
  }

  for (const quote of extractHighSignalQuotes(text)) {
    addMention(mentions, seen, "quotes", quote, quote);
  }

  for (const person of extractPersonCandidates(text)) {
    addMention(mentions, seen, "people", person, person);
    for (const [category, rule] of Object.entries(ROLE_RULES)) {
      if (rule.test(contextAround(text, person, 90))) addMention(mentions, seen, category, person, person);
    }
  }

  return mentions;
}

function addMention(mentions, seen, category, name) {
  if (!CATEGORY_LABELS[category]) return;
  const cleanName = cleanEntityName(name);
  if (!cleanName || cleanName.length < 2) return;
  if (OMIT_TERMS.has(normalizeName(cleanName))) return;
  const key = `${category}|${normalizeName(cleanName)}`;
  if (seen.has(key)) return;
  seen.add(key);
  mentions.push({ category, name: cleanName });
}

function extractPersonCandidates(text) {
  const stop = new Set([
    "Area 51",
    "United States",
    "Department Defense",
    "Department Energy",
    "Air Force",
    "Space Force",
    "New York",
    "Long Island",
    "Las Vegas",
    "American Alchemy",
    "Ketone IQ",
    "Target",
    "Star Trek",
    "Fireball XL5",
  ].map(normalizeName));
  const names = [];
  const re = /\b(?:Dr\.|Mr\.|Ms\.|Mrs\.|Senator|Representative|Rep\.|Professor|Prof\.)?\s?([A-Z][a-z]+(?:\s+(?:[A-Z]\.|[A-Z][a-z]+)){1,3})\b/g;
  for (const match of text.matchAll(re)) {
    const name = match[1].replace(/\s+/g, " ").trim();
    const normalized = normalizeName(name);
    if (stop.has(normalized)) continue;
    if (NON_PERSON_TERMS.has(normalized)) continue;
    if (/^(The|This|That|What|When|Where|Without|Ladies|Gary|Mary|Holy|Two|Head|Woo)\b/.test(name)) continue;
    if (/\b(UFO|UAP|NASA|CIA|NSA|DIA|FBI|DoD|DOE|MIT)\b/.test(name)) continue;
    names.push(name);
  }
  return [...new Set(names)];
}

function extractHighSignalQuotes(text) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(cleanText)
    .filter((sentence) => sentence.length >= 80 && sentence.length <= 260);
  return sentences.filter((sentence) => {
    return /\b(truth|evidence|secret|humanity|existence|denied|breakthrough|non-human|reverse engineer|worked directly|real|classified|hidden)\b/i.test(sentence);
  }).slice(0, 3);
}

function chunkRows(rows) {
  const chunks = [];
  const size = 8;
  for (let i = 0; i < rows.length; i += size) {
    const group = rows.slice(i, i + size);
    chunks.push({
      startMs: group[0]?.startMs || 0,
      endMs: group[group.length - 1]?.endMs || group[0]?.startMs || 0,
      text: cleanText(group.map((row) => row.text).join(" ")),
    });
  }
  return chunks.filter((chunk) => chunk.text);
}

function inferSignificance(entry) {
  const contexts = entry.sources.map((source) => source.excerpt).join(" ");
  const labels = [];
  if (/\b(whistleblower|went public|leak|complaint)\b/i.test(contexts)) labels.push("whistleblower/leak context");
  if (/\b(professor|university|MIT|Harvard|Stanford|academic|scientist)\b/i.test(contexts)) labels.push("academic/scientific context");
  if (/\b(CIA|NSA|NASA|DIA|DoD|Pentagon|Congress|Senate)\b/i.test(contexts)) labels.push("government context");
  if (/\b(Area 51|S4|base|facility|Nevada|Roswell|Dulce)\b/i.test(contexts)) labels.push("location/facility context");
  if (/\b(reverse engineering|craft|propulsion|material|anti-gravity|frequency|radio)\b/i.test(contexts)) labels.push("technical/UAP context");
  if (/\b(spy|agent|disinformation|counterintelligence|threat|dangerous)\b/i.test(contexts)) labels.push("allegation or risk context");
  if (labels.length === 0) labels.push(`${entry.count} transcript mention${entry.count === 1 ? "" : "s"}`);
  return labels.join("; ");
}

function contextAround(text, phrase, radius) {
  const index = text.toLowerCase().indexOf(phrase.toLowerCase());
  if (index === -1) return "";
  return text.slice(Math.max(0, index - radius), Math.min(text.length, index + phrase.length + radius));
}

function highlightExcerpt(text, name) {
  const index = text.toLowerCase().indexOf(name.toLowerCase());
  const start = index === -1 ? 0 : Math.max(0, index - 140);
  const end = index === -1 ? Math.min(text.length, 260) : Math.min(text.length, index + name.length + 180);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function timeToMs(value) {
  const clean = value.replace(",", ".").split(/\s+/)[0];
  const parts = clean.split(":").map(Number);
  if (parts.length === 3) return Math.round(((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000);
  if (parts.length === 2) return Math.round(((parts[0] * 60) + parts[1]) * 1000);
  return 0;
}

function formatTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanEntityName(value) {
  return String(value || "")
    .replace(/^["'“”]+|["'“”.,;:!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalTerm(term) {
  const aliases = {
    "MK Ultra": "MKUltra",
    "Advanced Aerospace Threat Identification Program": "AATIP",
    "Advanced Aerospace Weapon System Applications Program": "AAWSAP",
    "All-domain Anomaly Resolution Office": "AARO",
    "Massachusetts Institute of Technology": "MIT",
    "Grey aliens": "Greys",
  };
  return aliases[term] || term;
}

function normalizeRegexMatch(value) {
  return cleanEntityName(value)
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

function isLikelyWebsite(value) {
  const site = String(value || "").toLowerCase();
  if (!site.includes(".")) return false;
  if (/^(?:u\.s|d\.c|l\.a|e\.t|a\.m|p\.m)$/i.test(site)) return false;
  const labels = site.split(/[/?#]/)[0].split(".");
  if (labels.length < 2) return false;
  if (labels.some((label) => label.length < 2)) return false;
  return /^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(site);
}

function normalizeQuote(value) {
  return cleanText(value).slice(0, 260);
}

function normalizeName(value) {
  return cleanEntityName(value).toLowerCase();
}

function titleFromSlug(value) {
  return value.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtml(data) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Transcript Intelligence Report</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --ink: #171a1f;
      --muted: #68707d;
      --line: #d9dee7;
      --accent: #0f766e;
      --accent-2: #7c2d12;
      --chip: #eef6f4;
      --shadow: 0 1px 2px rgba(15, 23, 42, .08);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background: var(--bg);
    }
    header {
      position: sticky;
      top: 0;
      z-index: 5;
      border-bottom: 1px solid var(--line);
      background: rgba(246, 247, 249, .96);
      backdrop-filter: blur(10px);
    }
    .bar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      max-width: 1440px;
      margin: 0 auto;
      padding: 14px 18px;
      align-items: center;
    }
    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0;
    }
    .meta { color: var(--muted); font-size: 12px; margin-top: 2px; }
    .toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: end;
    }
    input, select, button {
      height: 34px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      padding: 0 10px;
      font: inherit;
    }
    input { min-width: 280px; }
    button {
      cursor: pointer;
      font-weight: 600;
    }
    button.primary {
      border-color: var(--accent);
      background: var(--accent);
      color: #fff;
    }
    main {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 18px;
      max-width: 1440px;
      margin: 0 auto;
      padding: 18px;
    }
    aside {
      position: sticky;
      top: 75px;
      height: calc(100vh - 93px);
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: var(--shadow);
    }
    .category-button {
      display: grid;
      grid-template-columns: 1fr auto;
      width: 100%;
      height: auto;
      min-height: 38px;
      border: 0;
      border-bottom: 1px solid #edf0f5;
      border-radius: 0;
      padding: 9px 10px;
      text-align: left;
      background: transparent;
      font-weight: 500;
    }
    .category-button.active {
      background: var(--chip);
      color: var(--accent);
    }
    .count {
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    section {
      min-width: 0;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(120px, 1fr));
      gap: 10px;
      margin-bottom: 14px;
    }
    .stat, .panel, .entry {
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      box-shadow: var(--shadow);
    }
    .stat { padding: 12px; }
    .stat b { display: block; font-size: 18px; }
    .stat span { color: var(--muted); font-size: 12px; }
    .panel { margin-bottom: 14px; overflow: hidden; }
    .panel h2 {
      margin: 0;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      font-size: 16px;
      letter-spacing: 0;
    }
    .panel-title {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--line);
      padding: 10px 14px;
    }
    .panel-title h2 {
      border: 0;
      padding: 0;
    }
    #graph {
      display: block;
      width: 100%;
      height: 520px;
      background: #fbfcfd;
    }
    .fullscreen-graph {
      position: fixed;
      inset: 0;
      z-index: 20;
      display: none;
      grid-template-rows: auto minmax(0, 1fr);
      background: var(--bg);
    }
    .fullscreen-graph.open {
      display: grid;
    }
    .fullscreen-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--line);
      background: #fff;
    }
    .fullscreen-bar h2 {
      margin: 0;
      font-size: 18px;
    }
    .fullscreen-controls {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .fullscreen-controls button.active {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--chip);
    }
    .fullscreen-body {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 340px;
      gap: 12px;
      min-height: 0;
      padding: 12px;
    }
    .graph-scroll {
      min-width: 0;
      min-height: 0;
      overflow: auto;
    }
    #full-graph {
      display: block;
      width: 100%;
      background: #fbfcfd;
      border: 1px solid var(--line);
      border-radius: 8px;
    }
    .relationship-panel {
      min-width: 0;
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      padding: 12px;
    }
    .relationship-panel h3 {
      margin: 0 0 4px;
      font-size: 16px;
    }
    .relationship-panel p {
      margin: 6px 0;
      color: #3f4652;
    }
    .relationship-list {
      display: grid;
      gap: 8px;
      margin-top: 12px;
    }
    .relationship-item {
      border-top: 1px solid #edf0f5;
      padding-top: 8px;
    }
    .relationship-item button {
      width: 100%;
      height: auto;
      min-height: 30px;
      text-align: left;
      white-space: normal;
    }
    .graph-node {
      cursor: pointer;
    }
    .graph-category {
      cursor: pointer;
    }
    .cy-graph {
      min-width: 0;
      min-height: 0;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fbfcfd;
    }
    #cy-graph {
      width: 100%;
      height: 100%;
    }
    .cy-toolbar {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .cy-toolbar select {
      min-width: 180px;
    }
    .cy-panel {
      min-width: 0;
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      padding: 12px;
    }
    .cy-panel h3 {
      margin: 0 0 4px;
      font-size: 16px;
    }
    .cy-panel p {
      margin: 6px 0;
      color: #3f4652;
    }
    .entries {
      display: grid;
      gap: 10px;
    }
    .entry {
      padding: 13px;
    }
    .entry-head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 12px;
      align-items: start;
    }
    .entry h3 {
      margin: 0;
      font-size: 15px;
      letter-spacing: 0;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 2px 7px;
      border-radius: 999px;
      background: #f1f4f8;
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }
    .significance {
      margin: 7px 0 10px;
      color: #3f4652;
    }
    .reclassify {
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: flex-end;
      color: var(--muted);
      font-size: 12px;
    }
    .reclassify select {
      width: 220px;
      max-width: 100%;
      height: 30px;
      font-size: 12px;
    }
    details {
      border-top: 1px solid #edf0f5;
      padding-top: 9px;
    }
    summary {
      cursor: pointer;
      color: var(--accent);
      font-weight: 600;
    }
    .source {
      margin-top: 8px;
      padding-left: 10px;
      border-left: 3px solid var(--line);
      color: #3f4652;
    }
    .source a {
      color: var(--accent-2);
      text-decoration: none;
      font-weight: 600;
    }
    .source small {
      display: block;
      color: var(--muted);
      margin-bottom: 2px;
    }
    .sources-list {
      max-height: 420px;
      overflow: auto;
      padding: 12px 14px;
    }
    .source-actions {
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
      background: #fff;
    }
    .chunk {
      scroll-margin-top: 92px;
      border-bottom: 1px solid #edf0f5;
      padding: 8px 0;
    }
    .chunk:target {
      background: #fff7ed;
      outline: 1px solid #fed7aa;
    }
    .empty {
      padding: 18px;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--muted);
      background: #fff;
    }
    @media (max-width: 900px) {
      .bar, main, .stats { grid-template-columns: 1fr; }
      .fullscreen-body { grid-template-columns: 1fr; }
      .relationship-panel { max-height: 260px; }
      aside { position: static; height: auto; max-height: 320px; }
      .toolbar { justify-content: start; }
      input { min-width: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <header>
    <div class="bar">
      <div>
        <h1>Transcript Intelligence Report</h1>
        <div class="meta">Generated <span id="generated"></span>. Rebuilt from local files only. No OpenAI API.</div>
      </div>
      <div class="toolbar">
        <input id="search" type="search" placeholder="Search entities, excerpts, files">
        <select id="sort">
          <option value="count">Sort by mentions</option>
          <option value="name">Sort by name</option>
        </select>
        <button class="primary" id="download">Download JSON</button>
        <button id="download-reclassifications">Download Reclasses</button>
        <button id="import-review">Import Review</button>
        <input id="review-file" type="file" accept="application/json,.json" hidden>
        <span id="review-status" class="meta"></span>
      </div>
    </div>
  </header>
  <main>
    <aside id="categories"></aside>
    <section>
      <div class="stats">
        <div class="stat"><b id="stat-transcripts"></b><span>transcripts</span></div>
        <div class="stat"><b id="stat-categories"></b><span>categories tracked</span></div>
        <div class="stat"><b id="stat-mentions"></b><span>mentions extracted</span></div>
        <div class="stat"><b id="stat-links"></b><span>relationship links</span></div>
      </div>
      <div class="panel">
        <div class="panel-title">
          <h2>Relationship graph</h2>
          <div class="toolbar">
            <button id="open-full-graph">Full screen all entities</button>
            <button id="open-cy-graph">Cytoscape graph</button>
          </div>
        </div>
        <svg id="graph" viewBox="0 0 1000 520" role="img" aria-label="Relationship graph"></svg>
      </div>
      <div id="entries" class="entries"></div>
      <div class="panel">
        <div class="panel-title">
          <h2>Transcript evidence index</h2>
          <button id="load-sources">Load evidence index</button>
        </div>
        <div id="sources" class="sources-list"></div>
      </div>
    </section>
  </main>
  <div id="full-graph-modal" class="fullscreen-graph" aria-hidden="true">
    <div class="fullscreen-bar">
      <div>
        <h2>All entities relationship graph</h2>
        <div class="meta"><span id="full-graph-count"></span> grouped by extraction category. Scroll to inspect all nodes.</div>
      </div>
      <div class="fullscreen-controls">
        <button id="graph-fit">Fit</button>
        <button id="graph-actual">100%</button>
        <button id="close-full-graph">Close</button>
      </div>
    </div>
    <div class="fullscreen-body">
      <div class="graph-scroll">
        <svg id="full-graph" role="img" aria-label="Full relationship graph showing all entities"></svg>
      </div>
      <aside id="relationship-panel" class="relationship-panel">
        <h3>Select a node</h3>
        <p>Click any node in the graph to highlight its direct relationships and inspect connected entities.</p>
      </aside>
    </div>
  </div>
  <div id="cy-graph-modal" class="fullscreen-graph" aria-hidden="true">
    <div class="fullscreen-bar">
      <div>
        <h2>Cytoscape relationship graph</h2>
        <div class="meta"><span id="cy-graph-count"></span> grouped by extraction category.</div>
      </div>
      <div class="fullscreen-controls cy-toolbar">
        <select id="cy-category-filter"></select>
        <button id="cy-zoom-category">Zoom category</button>
        <select id="cy-layout">
          <option value="preset">Grouped</option>
          <option value="cose">Force</option>
          <option value="circle">Circle</option>
          <option value="concentric">Concentric</option>
        </select>
        <button id="cy-fit">Fit</button>
        <button id="cy-actual">100%</button>
        <button id="close-cy-graph">Close</button>
      </div>
    </div>
    <div class="fullscreen-body">
      <div class="cy-graph">
        <div id="cy-graph" role="img" aria-label="Cytoscape relationship graph showing all entities"></div>
      </div>
      <aside id="cy-panel" class="cy-panel">
        <h3>Select a node</h3>
        <p>Click any entity node to inspect direct relationships.</p>
      </aside>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/cytoscape@3/dist/cytoscape.min.js"></script>
  <script>
    const DATA = ${payload};
    const categoryOrder = ${JSON.stringify(CATEGORY_DEFS.map(([id]) => id))};
    const STORAGE_KEY = "transcript-intelligence-reclassifications-v1";
    const FALSE_POSITIVE_KEY = "transcript-intelligence-false-positives-v1";
    let activeCategory = "all";

    const generated = document.getElementById("generated");
    const categoriesEl = document.getElementById("categories");
    const entriesEl = document.getElementById("entries");
    const sourcesEl = document.getElementById("sources");
    const searchEl = document.getElementById("search");
    const sortEl = document.getElementById("sort");
    const fullGraphModal = document.getElementById("full-graph-modal");
    const fullGraphCount = document.getElementById("full-graph-count");
    const relationshipPanel = document.getElementById("relationship-panel");
    const cyGraphModal = document.getElementById("cy-graph-modal");
    const cyGraphCount = document.getElementById("cy-graph-count");
    const cyPanel = document.getElementById("cy-panel");
    const cyCategoryFilter = document.getElementById("cy-category-filter");
    const cyLayoutSelect = document.getElementById("cy-layout");
    const reviewStatus = document.getElementById("review-status");
    let fullGraphZoom = "fit";
    let fullGraphNaturalWidth = 1000;
    let fullGraphNaturalHeight = 760;
    let currentFullGraphSelection = null;
    let currentFullGraphCategory = null;
    let cyGraph = null;
    let currentCySelection = null;
    let currentCyCategory = "all";

    applyStoredFalsePositives();
    applyStoredReclassifications();

    generated.textContent = new Date(DATA.generatedAt).toLocaleString();
    document.getElementById("stat-transcripts").textContent = DATA.summary.transcriptCount.toLocaleString();
    document.getElementById("stat-categories").textContent = DATA.summary.categoryCount.toLocaleString();
    document.getElementById("stat-mentions").textContent = DATA.summary.totalMentions.toLocaleString();
    document.getElementById("stat-links").textContent = DATA.graph.links.length.toLocaleString();

    function renderCategories() {
      const buttons = [{ id: "all", label: "All categories", entries: allEntries() }]
        .concat(categoryOrder.map((id) => DATA.categories[id]));
      categoriesEl.innerHTML = buttons.map((category) => {
        const count = category.entries.length;
        return '<button class="category-button ' + (activeCategory === category.id ? 'active' : '') + '" data-category="' + category.id + '">' +
          '<span>' + escapeHtml(category.label) + '</span><span class="count">' + count + '</span></button>';
      }).join("");
      categoriesEl.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
          activeCategory = button.dataset.category;
          render();
        });
      });
    }

    function allEntries() {
      return categoryOrder.flatMap((id) => DATA.categories[id].entries);
    }

    function filteredEntries() {
      const query = searchEl.value.trim().toLowerCase();
      const entries = activeCategory === "all" ? allEntries() : DATA.categories[activeCategory].entries.slice();
      const filtered = query ? entries.filter((entry) => {
        const haystack = [entry.name, entry.categoryLabel, entry.significance]
          .concat(entry.sources.flatMap((source) => [source.transcript, source.file, source.excerpt]))
          .join(" ").toLowerCase();
        return haystack.includes(query);
      }) : entries;
      filtered.sort((a, b) => sortEl.value === "name" ? a.name.localeCompare(b.name) : b.count - a.count || a.name.localeCompare(b.name));
      return filtered;
    }

    function renderEntries() {
      const allFilteredEntries = filteredEntries();
      const entries = allFilteredEntries.slice(0, 250);
      if (entries.length === 0) {
        entriesEl.innerHTML = '<div class="empty">No entries match the current filters.</div>';
        return;
      }
      entriesEl.innerHTML = (allFilteredEntries.length > entries.length
        ? '<div class="empty">Showing first ' + entries.length + ' of ' + allFilteredEntries.length + ' entries. Use search or a category filter to narrow the list.</div>'
        : '') + entries.map((entry) => '<article class="entry">' +
        '<div class="entry-head"><div><h3>' + escapeHtml(entry.name) + '</h3><div class="significance">' + escapeHtml(entry.significance) + '</div></div>' +
        '<div><span class="tag">' + escapeHtml(entry.categoryLabel) + ' · ' + entry.count + '</span>' +
        '<label class="reclassify"><span>Class</span><select data-reclassify="' + escapeHtml(entry.id) + '">' + categoryOptions(entry.category) + '</select></label>' +
        '<button data-false-positive="' + escapeHtml(entry.id) + '">False positive</button></div></div>' +
        '<details><summary>Evidence links (' + entry.sources.length + ')</summary>' +
        entry.sources.map((source) => '<div class="source"><small>' + escapeHtml(source.transcript) + ' · ' + escapeHtml(source.timestamp) + ' · ' + escapeHtml(source.file) + '</small>' +
        '<a href="' + source.link + '">Open captured context</a><div>' + escapeHtml(source.excerpt) + '</div></div>').join("") +
        '</details></article>').join("");
      entriesEl.querySelectorAll("[data-reclassify]").forEach((select) => {
        select.addEventListener("change", () => reclassifyEntry(select.dataset.reclassify, select.value));
      });
      entriesEl.querySelectorAll("[data-false-positive]").forEach((button) => {
        button.addEventListener("click", () => markFalsePositive(button.dataset.falsePositive));
      });
    }

    function categoryOptions(currentCategory) {
      return categoryOrder.map((id) => {
        const label = DATA.categories[id].label;
        return '<option value="' + escapeHtml(id) + '"' + (id === currentCategory ? ' selected' : '') + '>' + escapeHtml(label) + '</option>';
      }).join("");
    }

    function reclassifyEntry(entryId, targetCategory) {
      moveEntry(entryId, targetCategory);
      const saved = readReclassifications();
      saved[entryId] = targetCategory;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      renderGraph();
      refreshCytoscapeGraph();
      render();
    }

    function applyStoredReclassifications() {
      const saved = readReclassifications();
      Object.entries(saved).forEach(([entryId, targetCategory]) => moveEntry(entryId, targetCategory));
    }

    function markFalsePositive(entryId) {
      const entry = findEntry(entryId);
      if (!entry) return;
      const saved = readFalsePositives();
      saved[entryId] = {
        name: entry.name,
        category: entry.category,
        categoryLabel: entry.categoryLabel,
      };
      localStorage.setItem(FALSE_POSITIVE_KEY, JSON.stringify(saved));
      removeEntry(entryId);
      renderGraph();
      refreshCytoscapeGraph();
      render();
    }

    function applyStoredFalsePositives() {
      Object.keys(readFalsePositives()).forEach((entryId) => removeEntry(entryId));
    }

    function readFalsePositives() {
      try {
        return JSON.parse(localStorage.getItem(FALSE_POSITIVE_KEY) || "{}");
      } catch {
        return {};
      }
    }

    function findEntry(entryId) {
      for (const category of Object.values(DATA.categories)) {
        const entry = category.entries.find((candidate) => candidate.id === entryId);
        if (entry) return entry;
      }
      return null;
    }

    function removeEntry(entryId) {
      let removed = null;
      for (const category of Object.values(DATA.categories)) {
        const index = category.entries.findIndex((candidate) => candidate.id === entryId);
        if (index !== -1) {
          removed = category.entries.splice(index, 1)[0];
          break;
        }
      }
      if (!removed) return;
      DATA.graph.nodes = DATA.graph.nodes.filter((node) => node.key !== entryId);
      DATA.graph.links = DATA.graph.links.filter((link) => link.source !== removed.name && link.target !== removed.name);
    }

    function readReclassifications() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      } catch {
        return {};
      }
    }

    function moveEntry(entryId, targetCategory) {
      if (!DATA.categories[targetCategory]) return;
      let entry = null;
      let sourceCategory = null;
      for (const category of Object.values(DATA.categories)) {
        const index = category.entries.findIndex((candidate) => candidate.id === entryId);
        if (index !== -1) {
          entry = category.entries.splice(index, 1)[0];
          sourceCategory = category.id;
          break;
        }
      }
      if (!entry) return;
      if (sourceCategory === targetCategory) {
        DATA.categories[targetCategory].entries.push(entry);
        DATA.categories[targetCategory].entries.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        return;
      }
      entry.category = targetCategory;
      entry.categoryLabel = DATA.categories[targetCategory].label;
      DATA.categories[targetCategory].entries.push(entry);
      DATA.categories[targetCategory].entries.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      DATA.graph.nodes.forEach((node) => {
        if (node.key === entryId) {
          node.category = targetCategory;
          node.categoryLabel = entry.categoryLabel;
        }
      });
    }

    function renderSources() {
      sourcesEl.innerHTML = DATA.sources.map((source) => '<h3>' + escapeHtml(source.title) + '</h3>' +
        source.chunks.slice(0, 80).map((chunk) => '<div class="chunk" id="' + chunk.id + '"><b>' + escapeHtml(chunk.timestamp) + '</b> ' +
        '<span class="tag">' + escapeHtml(source.file) + '</span><div>' + escapeHtml(chunk.text) + '</div></div>').join("")).join("");
    }

    function renderGraph() {
      const svg = document.getElementById("graph");
      const nodes = DATA.graph.nodes.slice(0, 72);
      const nodeIds = new Set(nodes.map((node) => node.id));
      const links = DATA.graph.links.filter((link) => nodeIds.has(link.source) && nodeIds.has(link.target)).slice(0, 120);
      const groups = Array.from(nodes.reduce((map, node) => {
        const group = map.get(node.category) || { id: node.category, label: node.categoryLabel, nodes: [], total: 0 };
        group.nodes.push(node);
        group.total += node.count;
        map.set(node.category, group);
        return map;
      }, new Map()).values()).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label)).slice(0, 12);
      const visibleCategories = new Set(groups.map((group) => group.id));
      const groupedNodes = nodes.filter((node) => visibleCategories.has(node.category));
      const columns = 4;
      const cellW = 235;
      const cellH = 150;
      const offsetX = 42;
      const offsetY = 42;
      const palette = ["#0f766e", "#7c2d12", "#1d4ed8", "#9333ea", "#be123c", "#047857", "#b45309", "#4338ca", "#0369a1", "#6d28d9", "#a16207", "#0f172a"];
      const groupMeta = new Map(groups.map((group, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        return [group.id, {
          ...group,
          color: palette[index % palette.length],
          x: offsetX + col * cellW,
          y: offsetY + row * cellH,
          w: cellW - 18,
          h: cellH - 20,
        }];
      }));
      const nodeMap = new Map();
      for (const group of groups) {
        const meta = groupMeta.get(group.id);
        const groupNodes = group.nodes.slice(0, 10).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));
        groupNodes.forEach((node, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(1, groupNodes.length);
          const ring = groupNodes.length <= 3 ? 28 : 42 + ((index % 2) * 13);
          nodeMap.set(node.id, {
            ...node,
            x: meta.x + meta.w / 2 + Math.cos(angle) * ring,
            y: meta.y + 76 + Math.sin(angle) * ring,
            color: meta.color,
          });
        });
      }
      const visibleNodeIds = new Set(nodeMap.keys());
      const visibleLinks = links.filter((link) => visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target));
      const maxCount = Math.max(1, ...nodes.map((node) => node.count));
      const groupShapes = groups.map((group) => {
        const meta = groupMeta.get(group.id);
        return '<g><rect x="' + meta.x + '" y="' + meta.y + '" width="' + meta.w + '" height="' + meta.h + '" rx="8" fill="#ffffff" stroke="#d9dee7"></rect>' +
          '<text x="' + (meta.x + 10) + '" y="' + (meta.y + 22) + '" font-size="12" font-weight="700" fill="' + meta.color + '">' + escapeHtml(group.label.slice(0, 28)) + '</text>' +
          '<text x="' + (meta.x + 10) + '" y="' + (meta.y + 39) + '" font-size="10" fill="#68707d">' + group.nodes.length + ' nodes · ' + group.total + ' mentions</text></g>';
      }).join("");
      svg.innerHTML = groupShapes + visibleLinks.map((link) => {
        const a = nodeMap.get(link.source);
        const b = nodeMap.get(link.target);
        if (!a || !b) return "";
        return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="#cbd5e1" stroke-width="' + Math.min(5, 1 + link.value / 2) + '" opacity=".55"><title>' + escapeHtml(link.source + " ↔ " + link.target + " (" + link.value + ")") + '</title></line>';
      }).join("") + groupedNodes.filter((node) => visibleNodeIds.has(node.id)).map((node) => {
        const n = nodeMap.get(node.id);
        const r = 6 + Math.round((node.count / maxCount) * 16);
        return '<g><circle cx="' + n.x + '" cy="' + n.y + '" r="' + r + '" fill="' + n.color + '" opacity=".9"><title>' + escapeHtml(node.id + " · " + node.categoryLabel + " · " + node.count) + '</title></circle>' +
          '<text x="' + (n.x + r + 4) + '" y="' + (n.y + 4) + '" font-size="11" fill="#334155">' + escapeHtml(node.id.slice(0, 28)) + '</text></g>';
      }).join("");
    }

    function renderFullGraph(selectedName, focusedCategory) {
      currentFullGraphSelection = selectedName || null;
      currentFullGraphCategory = focusedCategory || null;
      const svg = document.getElementById("full-graph");
      const baseEntries = allEntries().slice().sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      if (focusedCategory) {
        renderFocusedCategoryGraph(selectedName, focusedCategory, baseEntries);
        return;
      }
      const entries = baseEntries;
      const groups = Array.from(entries.reduce((map, entry) => {
        const group = map.get(entry.category) || { id: entry.category, label: entry.categoryLabel, entries: [], total: 0 };
        group.entries.push(entry);
        group.total += entry.count;
        map.set(entry.category, group);
        return map;
      }, new Map()).values()).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
      const expanded = fullGraphZoom === "actual";
      const width = expanded ? 2200 : 1000;
      const columns = expanded ? 4 : 4;
      const cellW = expanded ? 520 : 240;
      const cellH = expanded ? 420 : 190;
      const offsetX = expanded ? 60 : 28;
      const offsetY = expanded ? 112 : 64;
      const rows = Math.max(1, Math.ceil(groups.length / columns));
      const height = rows * cellH + (expanded ? 220 : 120);
      const palette = ["#0f766e", "#7c2d12", "#1d4ed8", "#9333ea", "#be123c", "#047857", "#b45309", "#4338ca", "#0369a1", "#6d28d9", "#a16207", "#0f172a"];
      const nodeByName = new Map();
      const entryByName = new Map();
      const nodeShapes = [];
      const groupShapes = [];

      groups.forEach((group, groupIndex) => {
        const color = palette[groupIndex % palette.length];
        const col = groupIndex % columns;
        const row = Math.floor(groupIndex / columns);
        const cx = offsetX + col * cellW + cellW / 2;
        const cy = offsetY + row * cellH + cellH / 2;
        const groupRadius = expanded
          ? Math.min(180, Math.max(72, 34 + Math.sqrt(group.entries.length) * 5.2))
          : Math.min(82, Math.max(38, 20 + Math.sqrt(group.entries.length) * 2.4));
        const representativeEntries = group.entries.slice(0, expanded ? 90 : 36);
        groupShapes.push('<g class="graph-category" data-category-id="' + escapeHtml(group.id) + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (groupRadius + 20) + '" fill="#ffffff" stroke="#d9dee7"></circle>' +
          '<text x="' + cx + '" y="' + (cy - groupRadius - (expanded ? 64 : 46)) + '" text-anchor="middle" font-size="' + (expanded ? 20 : 14) + '" font-weight="700" fill="' + color + '">' + escapeHtml(group.label) + '</text>' +
          '<text x="' + cx + '" y="' + (cy - groupRadius - (expanded ? 38 : 28)) + '" text-anchor="middle" font-size="' + (expanded ? 13 : 10) + '" fill="#68707d">' + group.entries.length + ' nodes · ' + group.total + ' mentions</text></g>');

        representativeEntries.forEach((entry, index) => {
          const angle = index * 2.399963229728653;
          const distance = representativeEntries.length === 1 ? 0 : Math.min(groupRadius, (expanded ? 10 : 5) + Math.sqrt(index) * (expanded ? 13.5 : 6.8));
          const x = cx + Math.cos(angle) * distance;
          const y = cy + Math.sin(angle) * distance;
          const r = Math.max(expanded ? 5 : 3, Math.min(expanded ? 22 : 14, (expanded ? 4 : 2.5) + Math.sqrt(entry.count)));
          const isSelected = selectedName === entry.name;
          nodeByName.set(entry.name, nodeByName.get(entry.name) || { x, y, entry, color });
          entryByName.set(entry.name, entryByName.get(entry.name) || entry);
          nodeShapes.push('<g class="graph-node" data-node-name="' + escapeHtml(entry.name) + '">' +
            '<circle cx="' + x + '" cy="' + y + '" r="' + (isSelected ? r + 4 : r) + '" fill="' + color + '" opacity=".92" stroke="' + (isSelected ? '#0f172a' : '#ffffff') + '" stroke-width="' + (isSelected ? 3 : 1.2) + '">' +
            '<title>' + escapeHtml(entry.name + " · " + entry.categoryLabel + " · " + entry.count) + '</title></circle></g>');
        });
      });

      const related = new Set();
      const selectedLinks = [];
      if (selectedName) {
        for (const link of DATA.graph.links) {
          if (link.source === selectedName || link.target === selectedName) {
            related.add(link.source === selectedName ? link.target : link.source);
            selectedLinks.push(link);
          }
        }
      }

      const visibleLinkPool = DATA.graph.links.slice(0, 1200);
      const linkShapes = visibleLinkPool.slice(0, 1200).map((link) => {
        const a = nodeByName.get(link.source);
        const b = nodeByName.get(link.target);
        if (!a || !b) return "";
        const isRelated = selectedName && (link.source === selectedName || link.target === selectedName);
        const opacity = selectedName ? (isRelated ? ".82" : ".035") : ".12";
        const stroke = isRelated ? "#0f172a" : "#94a3b8";
        const width = isRelated ? Math.min(6, 1.5 + link.value / 2) : Math.min(2.4, .4 + link.value / 8);
        return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + stroke + '" stroke-width="' + width + '" opacity="' + opacity + '"><title>' + escapeHtml(link.source + " ↔ " + link.target + " (" + link.value + ")") + '</title></line>';
      }).join("");

      const labels = selectedName
        ? [selectedName, ...Array.from(related).slice(0, expanded ? 90 : 45)]
        : entries.slice(0, expanded ? 70 : 28).map((entry) => entry.name);
      const labelShapes = labels.map((name) => {
        const node = nodeByName.get(name);
        const entry = entryByName.get(name);
        if (!node || !entry) return "";
        const selected = name === selectedName;
        const text = (entry.name + " (" + entry.count + ")").slice(0, expanded ? 44 : 26);
        const fontSize = selected ? (expanded ? 22 : 16) : (expanded ? 17 : 13);
        const labelX = node.x + (expanded ? 20 : 13);
        const labelY = node.y - fontSize;
        const boxW = Math.min(expanded ? 340 : 210, 18 + text.length * fontSize * 0.56);
        const boxH = fontSize + 10;
        return '<g><rect x="' + (labelX - 5) + '" y="' + labelY + '" width="' + boxW + '" height="' + boxH + '" rx="4" fill="#ffffff" stroke="#d9dee7" opacity=".94"></rect>' +
          '<text x="' + labelX + '" y="' + (labelY + fontSize) + '" font-size="' + fontSize + '" font-weight="' + (selected ? 800 : 650) + '" fill="#111827">' + escapeHtml(text) + '</text></g>';
      }).join("");

      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      setFullGraphSvgSize(svg, width, height);
      fullGraphCount.textContent = entries.length.toLocaleString() + " entities and " + visibleLinkPool.length.toLocaleString() + " relationship links. Click a category to zoom into its nodes.";
      svg.innerHTML = groupShapes.join("") + linkShapes + nodeShapes.join("") + labelShapes;
      svg.querySelectorAll(".graph-node").forEach((node) => {
        node.addEventListener("click", () => {
          const nextSelected = selectedName === node.dataset.nodeName ? null : node.dataset.nodeName;
          renderFullGraph(nextSelected, focusedCategory);
        });
      });
      svg.querySelectorAll(".graph-category").forEach((category) => {
        category.addEventListener("click", (event) => {
          if (event.target.closest(".graph-node")) return;
          renderFullGraph(null, category.dataset.categoryId);
        });
      });
      if (selectedName) {
        renderRelationshipPanel(selectedName, selectedLinks, entryByName, null);
      } else {
        renderRelationshipPanel(null, [], entryByName, null);
      }
    }

    function renderFocusedCategoryGraph(selectedName, categoryId, baseEntries) {
      const svg = document.getElementById("full-graph");
      const category = DATA.categories[categoryId];
      const categoryEntries = baseEntries.filter((entry) => entry.category === categoryId);
      const categoryNames = new Set(categoryEntries.map((entry) => entry.name));
      const entryByName = new Map(baseEntries.map((entry) => [entry.name, entry]));
      const selectedLinks = selectedName
        ? DATA.graph.links.filter((link) => link.source === selectedName || link.target === selectedName)
        : [];
      const internalLinks = DATA.graph.links.filter((link) => categoryNames.has(link.source) && categoryNames.has(link.target));
      const expanded = fullGraphZoom === "actual";
      const width = expanded ? 2200 : 1000;
      const columns = expanded
        ? Math.max(3, Math.min(4, Math.ceil(Math.sqrt(categoryEntries.length / 2))))
        : Math.max(3, Math.min(4, Math.ceil(Math.sqrt(categoryEntries.length / 2))));
      const cellW = expanded ? 500 : 230;
      const rowH = expanded ? 92 : 42;
      const left = expanded ? 80 : 54;
      const top = 90;
      const height = Math.max(760, top + Math.ceil(categoryEntries.length / columns) * rowH + 100);
      const color = "#0f766e";
      const nodeByName = new Map();

      const header = '<text x="' + left + '" y="42" font-size="' + (expanded ? 32 : 24) + '" font-weight="700" fill="' + color + '">' + escapeHtml(category.label) + '</text>' +
        '<text x="' + left + '" y="' + (expanded ? 76 : 66) + '" font-size="' + (expanded ? 15 : 12) + '" fill="#68707d">' + categoryEntries.length + ' category nodes · ' + internalLinks.length + ' internal relationship links</text>' +
        '<rect class="graph-category" data-category-id="' + escapeHtml(categoryId) + '" x="' + (width - 206) + '" y="24" width="170" height="34" rx="6" fill="#ffffff" stroke="#d9dee7"></rect>' +
        '<text class="graph-category" data-category-id="' + escapeHtml(categoryId) + '" x="' + (width - 121) + '" y="46" text-anchor="middle" font-size="12" font-weight="700" fill="#334155">Show all categories</text>';

      const nodeShapes = categoryEntries.map((entry, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = left + col * cellW;
        const y = top + row * rowH;
        const r = Math.max(expanded ? 6 : 4, Math.min(expanded ? 22 : 15, (expanded ? 4.5 : 3) + Math.sqrt(entry.count)));
        const isSelected = selectedName === entry.name;
        nodeByName.set(entry.name, { x, y, entry, color });
        return '<g class="graph-node" data-node-name="' + escapeHtml(entry.name) + '">' +
          '<circle cx="' + x + '" cy="' + y + '" r="' + (isSelected ? r + 4 : r) + '" fill="' + color + '" opacity=".92" stroke="' + (isSelected ? '#0f172a' : '#ffffff') + '" stroke-width="' + (isSelected ? 3 : 1.2) + '"><title>' + escapeHtml(entry.name + " · " + entry.count) + '</title></circle>' +
          '<rect x="' + (x + (expanded ? 22 : 14)) + '" y="' + (y - (expanded ? 19 : 12)) + '" width="' + (expanded ? 320 : 190) + '" height="' + (expanded ? 30 : 21) + '" rx="4" fill="#ffffff" stroke="#d9dee7" opacity=".94"></rect>' +
          '<text x="' + (x + (expanded ? 30 : 18)) + '" y="' + (y + (expanded ? 3 : 4)) + '" font-size="' + (isSelected ? (expanded ? 22 : 14) : (expanded ? 18 : 12)) + '" font-weight="' + (isSelected ? 800 : 650) + '" fill="#111827">' + escapeHtml((entry.name + " (" + entry.count + ")").slice(0, expanded ? 38 : 27)) + '</text></g>';
      }).join("");

      const selectedRelated = new Set();
      selectedLinks.forEach((link) => selectedRelated.add(link.source === selectedName ? link.target : link.source));
      const linkShapes = internalLinks.slice(0, 1200).map((link) => {
        const a = nodeByName.get(link.source);
        const b = nodeByName.get(link.target);
        if (!a || !b) return "";
        const isRelated = selectedName && (link.source === selectedName || link.target === selectedName);
        const opacity = selectedName ? (isRelated ? ".8" : ".045") : ".13";
        const stroke = isRelated ? "#0f172a" : "#94a3b8";
        const width = isRelated ? Math.min(6, 1.5 + link.value / 2) : Math.min(2.5, .4 + link.value / 8);
        return '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" stroke="' + stroke + '" stroke-width="' + width + '" opacity="' + opacity + '"><title>' + escapeHtml(link.source + " ↔ " + link.target + " (" + link.value + ")") + '</title></line>';
      }).join("");

      svg.setAttribute("viewBox", "0 0 " + width + " " + height);
      setFullGraphSvgSize(svg, width, height);
      fullGraphCount.textContent = "Focused: " + category.label + " · " + categoryEntries.length.toLocaleString() + " entities and " + internalLinks.length.toLocaleString() + " internal links";
      svg.innerHTML = header + linkShapes + nodeShapes;
      svg.querySelectorAll(".graph-node").forEach((node) => {
        node.addEventListener("click", () => {
          const nextSelected = selectedName === node.dataset.nodeName ? null : node.dataset.nodeName;
          renderFullGraph(nextSelected, categoryId);
        });
      });
      svg.querySelectorAll(".graph-category").forEach((categoryButton) => {
        categoryButton.addEventListener("click", () => renderFullGraph());
      });
      if (selectedName) {
        renderRelationshipPanel(selectedName, selectedLinks, entryByName, categoryId);
      } else {
        renderCategoryPanel(categoryId, categoryEntries, entryByName);
      }
    }

    function renderRelationshipPanel(selectedName, links, entryByName, focusedCategory) {
      if (!selectedName) {
        relationshipPanel.innerHTML = '<h3>Select a node or category</h3><p>Click a category label to zoom into it, or click any node to highlight its direct relationships.</p>';
        return;
      }
      const entry = entryByName.get(selectedName);
      const sortedLinks = links.slice().sort((a, b) => b.value - a.value || a.source.localeCompare(b.source));
      relationshipPanel.innerHTML = '<h3>' + escapeHtml(selectedName) + '</h3>' +
        '<p><span class="tag">' + escapeHtml(entry ? entry.categoryLabel : "Entity") + '</span> ' + (entry ? entry.count : 0) + ' mentions</p>' +
        '<p>' + sortedLinks.length + ' direct relationship' + (sortedLinks.length === 1 ? '' : 's') + ' found in transcript co-occurrence windows.</p>' +
        '<button id="clear-node-selection">Clear selection</button>' +
        '<div class="relationship-list">' + sortedLinks.slice(0, 80).map((link) => {
          const other = link.source === selectedName ? link.target : link.source;
          const otherEntry = entryByName.get(other);
          return '<div class="relationship-item"><button data-related-node="' + escapeHtml(other) + '">' + escapeHtml(other) + '</button>' +
            '<div class="meta">' + escapeHtml(otherEntry ? otherEntry.categoryLabel : "Entity") + ' · weight ' + link.value + '</div></div>';
        }).join("") + '</div>';
      document.getElementById("clear-node-selection").addEventListener("click", () => renderFullGraph(null, focusedCategory));
      relationshipPanel.querySelectorAll("[data-related-node]").forEach((button) => {
        button.addEventListener("click", () => renderFullGraph(button.dataset.relatedNode, focusedCategory));
      });
    }

    function setFullGraphSvgSize(svg, width, height) {
      fullGraphNaturalWidth = width;
      fullGraphNaturalHeight = height;
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      if (fullGraphZoom === "fit") {
        svg.style.width = "100%";
        svg.style.height = "auto";
      } else {
        svg.style.width = width + "px";
        svg.style.height = height + "px";
      }
      document.getElementById("graph-fit").classList.toggle("active", fullGraphZoom === "fit");
      document.getElementById("graph-actual").classList.toggle("active", fullGraphZoom === "actual");
    }

    function applyFullGraphZoom(mode) {
      if (fullGraphZoom === mode) return;
      fullGraphZoom = mode;
      renderFullGraph(currentFullGraphSelection, currentFullGraphCategory);
    }

    function renderCategoryPanel(categoryId, entries, entryByName) {
      const category = DATA.categories[categoryId];
      const categoryEntries = entries.filter((entry) => entry.category === categoryId).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      relationshipPanel.innerHTML = '<h3>' + escapeHtml(category.label) + '</h3>' +
        '<p>' + categoryEntries.length + ' entities in this category. The graph is zoomed to this category only; selecting a node still shows all direct relationships here.</p>' +
        '<button id="reset-category-zoom">Show all categories</button>' +
        '<div class="relationship-list">' + categoryEntries.slice(0, 120).map((entry) => {
          return '<div class="relationship-item"><button data-category-node="' + escapeHtml(entry.name) + '">' + escapeHtml(entry.name) + '</button>' +
            '<div class="meta">' + entry.count + ' mentions</div></div>';
        }).join("") + '</div>';
      document.getElementById("reset-category-zoom").addEventListener("click", () => renderFullGraph());
      relationshipPanel.querySelectorAll("[data-category-node]").forEach((button) => {
        button.addEventListener("click", () => renderFullGraph(button.dataset.categoryNode, categoryId));
      });
    }

    function renderCytoscapeGraph() {
      if (!window.cytoscape) {
        cyPanel.innerHTML = '<h3>Cytoscape unavailable</h3><p>The Cytoscape script could not be loaded. This static trial uses a CDN script; vendor it locally before using the report offline.</p>';
        document.getElementById("cy-graph").innerHTML = '<div class="empty">Cytoscape did not load.</div>';
        return;
      }
      const model = buildCytoscapeModel();
      renderCyCategoryOptions(model.groups);
      cyGraphCount.textContent = model.entityCount.toLocaleString() + " entities and " + model.edgeCount.toLocaleString() + " relationship links";
      if (cyGraph) {
        cyGraph.destroy();
        cyGraph = null;
      }
      cyGraph = cytoscape({
        container: document.getElementById("cy-graph"),
        elements: model.elements,
        minZoom: 0.04,
        maxZoom: 6,
        wheelSensitivity: 0.18,
        layout: { name: "preset", fit: true, padding: 40 },
        style: [
          {
            selector: "node",
            style: {
              "font-family": "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
              "font-size": "10px",
              "label": "data(label)",
              "min-zoomed-font-size": "7px",
              "text-wrap": "ellipsis",
              "text-max-width": "150px",
              "text-valign": "bottom",
              "text-halign": "center",
              "text-margin-y": "5px",
              "color": "#111827",
              "text-background-color": "#ffffff",
              "text-background-opacity": 0.86,
              "text-background-padding": "2px",
              "text-border-color": "#d9dee7",
              "text-border-width": "1px",
              "text-border-opacity": 0.65
            }
          },
          {
            selector: ".entity-node",
            style: {
              "width": "data(size)",
              "height": "data(size)",
              "background-color": "data(color)",
              "border-color": "#ffffff",
              "border-width": 1.4
            }
          },
          {
            selector: ".category-node",
            style: {
              "shape": "round-rectangle",
              "background-color": "data(color)",
              "background-opacity": 0.06,
              "border-color": "data(color)",
              "border-width": 2,
              "border-opacity": 0.35,
              "label": "data(label)",
              "font-size": "18px",
              "font-weight": 700,
              "text-valign": "top",
              "text-halign": "center",
              "color": "data(color)",
              "padding": "42px",
              "min-zoomed-font-size": "10px",
              "text-background-opacity": 0
            }
          },
          {
            selector: "edge",
            style: {
              "width": "data(width)",
              "line-color": "#94a3b8",
              "opacity": 0.28,
              "curve-style": "bezier"
            }
          },
          {
            selector: ".faded",
            style: {
              "opacity": 0.08,
              "text-opacity": 0
            }
          },
          {
            selector: ".selected-node",
            style: {
              "border-color": "#0f172a",
              "border-width": 5,
              "z-index": 999,
              "font-size": "16px",
              "font-weight": 800,
              "text-background-opacity": 0.96
            }
          },
          {
            selector: ".related-node",
            style: {
              "border-color": "#111827",
              "border-width": 3,
              "z-index": 800,
              "font-size": "13px",
              "text-background-opacity": 0.94
            }
          },
          {
            selector: ".selected-edge",
            style: {
              "line-color": "#0f172a",
              "width": "data(selectedWidth)",
              "opacity": 0.86,
              "z-index": 700
            }
          }
        ]
      });
      cyGraph.on("tap", ".entity-node", (event) => {
        const nodeId = event.target.id();
        if (currentCySelection === nodeId) {
          clearCySelection();
        } else {
          selectCyNode(nodeId);
        }
      });
      cyGraph.on("tap", ".category-node", (event) => {
        zoomCyCategory(event.target.data("categoryId"));
      });
      cyGraph.on("tap", (event) => {
        if (event.target === cyGraph) clearCySelection();
      });
      cyGraph.on("mouseover", ".entity-node", (event) => {
        event.target.addClass("related-node");
      });
      cyGraph.on("mouseout", ".entity-node", (event) => {
        if (!event.target.connectedEdges(".selected-edge").length && event.target.id() !== currentCySelection) {
          event.target.removeClass("related-node");
        }
      });
      currentCySelection = null;
      showCyOverview();
      requestAnimationFrame(() => {
        cyGraph.resize();
        cyGraph.fit(undefined, 50);
      });
    }

    function buildCytoscapeModel() {
      const palette = ["#0f766e", "#7c2d12", "#1d4ed8", "#9333ea", "#be123c", "#047857", "#b45309", "#4338ca", "#0369a1", "#6d28d9", "#a16207", "#0f172a"];
      const entries = allEntries().slice().sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
      const entryByName = new Map();
      for (const entry of entries) {
        const existing = entryByName.get(entry.name);
        if (!existing || entry.count > existing.count) entryByName.set(entry.name, entry);
      }
      const groups = Array.from(entryByName.values()).reduce((map, entry) => {
        const group = map.get(entry.category) || {
          id: entry.category,
          label: entry.categoryLabel,
          color: palette[Math.max(0, categoryOrder.indexOf(entry.category)) % palette.length],
          entries: [],
          total: 0
        };
        group.entries.push(entry);
        group.total += entry.count;
        map.set(entry.category, group);
        return map;
      }, new Map());
      const sortedGroups = Array.from(groups.values()).sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
      const categoryIds = new Map(sortedGroups.map((group) => [group.id, "category::" + group.id]));
      const elements = [];
      const columns = window.innerWidth > 1500 ? 4 : 3;
      const columnWidth = 980;
      const columnY = Array(columns).fill(0);

      sortedGroups.forEach((group) => {
        const groupColumns = Math.max(4, Math.min(11, Math.ceil(Math.sqrt(group.entries.length * 1.45))));
        const rowCount = Math.max(1, Math.ceil(group.entries.length / groupColumns));
        const groupWidth = Math.max(540, groupColumns * 86);
        const groupHeight = Math.max(420, rowCount * 64 + 150);
        const column = columnY.indexOf(Math.min.apply(null, columnY));
        const originX = column * columnWidth;
        const originY = columnY[column];
        columnY[column] += groupHeight + 180;
        elements.push({
          data: {
            id: categoryIds.get(group.id),
            label: group.label + " (" + group.entries.length + ")",
            categoryId: group.id,
            color: group.color,
            isCategory: true
          },
          classes: "category-node"
        });
        group.entries.forEach((entry, index) => {
          const col = index % groupColumns;
          const row = Math.floor(index / groupColumns);
          const x = originX + (columnWidth - groupWidth) / 2 + col * 86 + 60;
          const y = originY + row * 64 + 95;
          elements.push({
            data: {
              id: entry.name,
              label: entry.name,
              count: entry.count,
              category: entry.category,
              categoryLabel: entry.categoryLabel,
              color: group.color,
              size: Math.max(15, Math.min(54, 13 + Math.sqrt(entry.count) * 4.2)),
              parent: categoryIds.get(group.id)
            },
            position: { x, y },
            classes: "entity-node"
          });
        });
      });

      const validNames = new Set(entryByName.keys());
      DATA.graph.links.forEach((link, index) => {
        if (!validNames.has(link.source) || !validNames.has(link.target)) return;
        elements.push({
          data: {
            id: "edge::" + index,
            source: link.source,
            target: link.target,
            weight: link.value,
            width: Math.max(0.6, Math.min(4, 0.5 + link.value / 5)),
            selectedWidth: Math.max(2.2, Math.min(8, 1.8 + link.value / 2))
          }
        });
      });
      return {
        elements,
        groups: sortedGroups,
        entityCount: entryByName.size,
        edgeCount: DATA.graph.links.length
      };
    }

    function renderCyCategoryOptions(groups) {
      const options = ['<option value="all">All categories</option>'].concat(groups.map((group) => {
        const selected = currentCyCategory === group.id ? " selected" : "";
        return '<option value="' + escapeHtml(group.id) + '"' + selected + '>' + escapeHtml(group.label) + ' (' + group.entries.length + ')</option>';
      }));
      cyCategoryFilter.innerHTML = options.join("");
      if (!DATA.categories[currentCyCategory]) currentCyCategory = "all";
      cyCategoryFilter.value = currentCyCategory;
    }

    function refreshCytoscapeGraph() {
      if (!cyGraphModal.classList.contains("open")) return;
      renderCytoscapeGraph();
    }

    function selectCyNode(nodeId) {
      if (!cyGraph) return;
      currentCySelection = nodeId;
      const node = cyGraph.$id(nodeId);
      const neighborhood = node.closedNeighborhood();
      cyGraph.elements().removeClass("faded selected-node related-node selected-edge");
      cyGraph.elements().difference(neighborhood).addClass("faded");
      node.addClass("selected-node");
      node.neighborhood("node").addClass("related-node");
      node.connectedEdges().addClass("selected-edge");
      cyGraph.animate({ fit: { eles: neighborhood, padding: 80 }, duration: 220 });
      renderCyRelationshipPanel(nodeId);
    }

    function clearCySelection() {
      if (!cyGraph) return;
      currentCySelection = null;
      cyGraph.elements().removeClass("faded selected-node related-node selected-edge");
      if (currentCyCategory !== "all") {
        zoomCyCategory(currentCyCategory);
      } else {
        showCyOverview();
      }
    }

    function zoomCyCategory(categoryId) {
      if (!cyGraph) return;
      currentCyCategory = categoryId || "all";
      cyCategoryFilter.value = currentCyCategory;
      currentCySelection = null;
      cyGraph.elements().removeClass("faded selected-node related-node selected-edge");
      if (currentCyCategory === "all") {
        showCyOverview();
        return;
      }
      const categoryNode = cyGraph.$id("category::" + currentCyCategory);
      const children = categoryNode.children();
      const category = DATA.categories[currentCyCategory];
      cyGraph.elements().difference(categoryNode.union(children).union(children.connectedEdges())).addClass("faded");
      cyGraph.animate({ fit: { eles: categoryNode.union(children), padding: 55 }, duration: 260 });
      cyPanel.innerHTML = '<h3>' + escapeHtml(category ? category.label : "Category") + '</h3>' +
        '<p>' + children.length.toLocaleString() + ' visible entities.</p>' +
        '<button id="cy-clear-category">Show all categories</button>' +
        '<div class="relationship-list">' + children.sort((a, b) => (b.data("count") || 0) - (a.data("count") || 0)).slice(0, 160).map((node) => {
          return '<div class="relationship-item"><button data-cy-node="' + escapeHtml(node.id()) + '">' + escapeHtml(node.data("label")) + '</button><div class="meta">' + (node.data("count") || 0) + ' mentions</div></div>';
        }).join("") + '</div>';
      document.getElementById("cy-clear-category").addEventListener("click", () => {
        currentCyCategory = "all";
        cyCategoryFilter.value = "all";
        showCyOverview();
      });
      cyPanel.querySelectorAll("[data-cy-node]").forEach((button) => {
        button.addEventListener("click", () => selectCyNode(button.dataset.cyNode));
      });
    }

    function showCyOverview() {
      if (!cyGraph) return;
      currentCyCategory = "all";
      cyCategoryFilter.value = "all";
      cyGraph.elements().removeClass("faded selected-node related-node selected-edge");
      cyGraph.animate({ fit: { eles: cyGraph.elements(), padding: 50 }, duration: 220 });
      cyPanel.innerHTML = '<h3>Select a node or category</h3><p>Click a category group to zoom into it, or click an entity node to inspect direct relationships.</p>';
    }

    function renderCyRelationshipPanel(nodeId) {
      const node = cyGraph.$id(nodeId);
      const links = DATA.graph.links
        .filter((link) => link.source === nodeId || link.target === nodeId)
        .sort((a, b) => b.value - a.value || a.source.localeCompare(b.source));
      cyPanel.innerHTML = '<h3>' + escapeHtml(node.data("label")) + '</h3>' +
        '<p><span class="tag">' + escapeHtml(node.data("categoryLabel") || "Entity") + '</span> ' + (node.data("count") || 0) + ' mentions</p>' +
        '<p>' + links.length.toLocaleString() + ' direct relationship' + (links.length === 1 ? '' : 's') + '.</p>' +
        '<button id="cy-clear-selection">Clear selection</button>' +
        '<div class="relationship-list">' + links.slice(0, 120).map((link) => {
          const other = link.source === nodeId ? link.target : link.source;
          const otherNode = cyGraph.$id(other);
          return '<div class="relationship-item"><button data-cy-node="' + escapeHtml(other) + '">' + escapeHtml(other) + '</button>' +
            '<div class="meta">' + escapeHtml(otherNode.data("categoryLabel") || "Entity") + ' · weight ' + link.value + '</div></div>';
        }).join("") + '</div>';
      document.getElementById("cy-clear-selection").addEventListener("click", clearCySelection);
      cyPanel.querySelectorAll("[data-cy-node]").forEach((button) => {
        button.addEventListener("click", () => selectCyNode(button.dataset.cyNode));
      });
    }

    function runCyLayout(layoutName) {
      if (!cyGraph) return;
      cyGraph.elements().removeClass("faded selected-node related-node selected-edge");
      currentCySelection = null;
      const options = layoutName === "preset"
        ? { name: "preset", fit: true, padding: 50 }
        : layoutName === "cose"
          ? { name: "cose", animate: false, fit: true, padding: 50, nodeRepulsion: 650000, idealEdgeLength: 110, numIter: 900 }
          : { name: layoutName, fit: true, padding: 50, animate: false };
      cyGraph.layout(options).run();
      if (currentCyCategory !== "all") {
        requestAnimationFrame(() => zoomCyCategory(currentCyCategory));
      } else {
        requestAnimationFrame(showCyOverview);
      }
    }

    function render() {
      renderCategories();
      renderEntries();
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }

    searchEl.addEventListener("input", renderEntries);
    sortEl.addEventListener("change", renderEntries);
    document.getElementById("load-sources").addEventListener("click", () => {
      renderSources();
    });
    document.getElementById("open-full-graph").addEventListener("click", () => {
      fullGraphModal.classList.add("open");
      fullGraphModal.setAttribute("aria-hidden", "false");
      renderFullGraph();
    });
    document.getElementById("open-cy-graph").addEventListener("click", () => {
      cyGraphModal.classList.add("open");
      cyGraphModal.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        renderCytoscapeGraph();
      });
    });
    document.getElementById("graph-fit").addEventListener("click", () => applyFullGraphZoom("fit"));
    document.getElementById("graph-actual").addEventListener("click", () => applyFullGraphZoom("actual"));
    document.getElementById("close-full-graph").addEventListener("click", () => {
      fullGraphModal.classList.remove("open");
      fullGraphModal.setAttribute("aria-hidden", "true");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        fullGraphModal.classList.remove("open");
        fullGraphModal.setAttribute("aria-hidden", "true");
        cyGraphModal.classList.remove("open");
        cyGraphModal.setAttribute("aria-hidden", "true");
      }
    });
    document.getElementById("cy-fit").addEventListener("click", () => {
      if (!cyGraph) return;
      if (currentCyCategory !== "all") {
        zoomCyCategory(currentCyCategory);
      } else {
        cyGraph.fit(undefined, 50);
      }
    });
    document.getElementById("cy-actual").addEventListener("click", () => {
      if (!cyGraph) return;
      cyGraph.zoom(1);
      cyGraph.center(currentCyCategory !== "all" ? cyGraph.$id("category::" + currentCyCategory) : cyGraph.elements());
    });
    document.getElementById("cy-zoom-category").addEventListener("click", () => {
      zoomCyCategory(cyCategoryFilter.value);
    });
    cyCategoryFilter.addEventListener("change", () => {
      zoomCyCategory(cyCategoryFilter.value);
    });
    cyLayoutSelect.addEventListener("change", () => {
      runCyLayout(cyLayoutSelect.value);
    });
    document.getElementById("close-cy-graph").addEventListener("click", () => {
      cyGraphModal.classList.remove("open");
      cyGraphModal.setAttribute("aria-hidden", "true");
    });
    document.getElementById("download").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transcript-intelligence-report.json";
      a.click();
      URL.revokeObjectURL(url);
    });
    document.getElementById("download-reclassifications").addEventListener("click", () => {
      downloadReviewPayload();
    });
    document.getElementById("import-review").addEventListener("click", () => {
      document.getElementById("review-file").click();
    });
    document.getElementById("review-file").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const review = JSON.parse(await file.text());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(review.reclassifications || {}));
        localStorage.setItem(FALSE_POSITIVE_KEY, JSON.stringify(review.falsePositives || {}));
        applyStoredFalsePositives();
        applyStoredReclassifications();
        renderGraph();
        refreshCytoscapeGraph();
        render();
        reviewStatus.textContent = "Review imported";
      } catch (error) {
        reviewStatus.textContent = "Import failed";
      }
      event.target.value = "";
    });

    function buildReviewPayload() {
      return {
        generatedAt: new Date().toISOString(),
        note: "Client-side category and false-positive review changes made in report/index.html.",
        reclassifications: readReclassifications(),
        falsePositives: readFalsePositives(),
      };
    }

    function downloadReviewPayload(payload = buildReviewPayload()) {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transcript-reclassifications.json";
      a.click();
      URL.revokeObjectURL(url);
    }

    sourcesEl.innerHTML = '<div class="empty">Evidence index is not loaded yet. Use source links from entity cards, or load the full evidence index when needed.</div>';
    renderGraph();
    render();
  </script>
</body>
</html>`;
}

main();
