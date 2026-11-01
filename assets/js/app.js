/* Toolbox Spell Checker
 * Features:
 * - Spelling error detection and suggestions
 * - US / UK spelling variants
 * - Technical phrase alternatives
 * - Ignore and personal dictionary
 * - Undo, TXT download and CSV export
 * - Original / Corrected / Compare previews
 */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const editor = $("editor");
  const popup = $("suggestionPopup");
  const language = $("language");

  if (!editor) return;

  let issues = [];
  let previousText = "";
  let originalText = "";
  let correctedText = "";
  let activeIssue = null;
  const appliedCorrections = [];

  const ignoredWords = new Set();
  const personalDictionary = new Set();

  /*
   * Common spelling errors.
   */
  const spellingMap = {
    recieve: ["receive"],
    receieve: ["receive"],
    recieved: ["received"],
    recieving: ["receiving"],
    eletrical: ["electrical"],
    elecrical: ["electrical"],
    connetor: ["connector"],
    conecter: ["connector"],
    dimensoin: ["dimension", "dimensions"],
    dimention: ["dimension"],
    stainles: ["stainless"],
    bracet: ["bracket"],
    maintenence: ["maintenance"],
    maintanence: ["maintenance"],
    maintenace: ["maintenance"],
    presssure: ["pressure"],
    calbe: ["cable"],
    cabel: ["cable"],
    taxt: ["text", "tax"],
    teaxt: ["text"],
    seperate: ["separate"],
    definately: ["definitely"],
    enviroment: ["environment"],
    compatable: ["compatible"],
    lenght: ["length"],
    widht: ["width"],
    thikness: ["thickness"],
    transmiter: ["transmitter"],
    assembely: ["assembly"],
    centifugal: ["centrifugal"],
    housng: ["housing"],
    waterpump: ["water pump"],
    recived: ["received"],
    recieveing: ["receiving"],
    recieveable: ["receivable"],
    occurance: ["occurrence"],
    occurence: ["occurrence"],
    begining: ["beginning"],
    untill: ["until"],
    wich: ["which"],
    teh: ["the"],
    thier: ["their"],
    freind: ["friend"],
    adress: ["address"],
    goverment: ["government"],
    managment: ["management"],
    equipement: ["equipment"],
    equipmant: ["equipment"],
    componant: ["component"],
    compnent: ["component"],
    instalation: ["installation"],
    specifcation: ["specification"],
    specifiaction: ["specification"],
    mesurement: ["measurement"],
    measurment: ["measurement"],
    lenghts: ["lengths"],
    widhts: ["widths"],
    heigth: ["height"],
    heigtht: ["height"],
    conected: ["connected"],
    conection: ["connection"],
    connecion: ["connection"],
    suport: ["support"],
    suplly: ["supply"],
    volatge: ["voltage"],
    curent: ["current"],
    frequence: ["frequency"],
    frequecy: ["frequency"],
    tranformer: ["transformer"],
    transformor: ["transformer"],
    swich: ["switch"],
    swith: ["switch"],
    releay: ["relay"],
    relaye: ["relay"],
    circut: ["circuit"],
    ciruit: ["circuit"],
    moter: ["motor"],
    engin: ["engine"],
    bearng: ["bearing"],
    lubrification: ["lubrication"],
    lubracation: ["lubrication"],
    hydralic: ["hydraulic"],
    hydraullic: ["hydraulic"],
    pneumatc: ["pneumatic"],
    pneumetic: ["pneumatic"],
    presure: ["pressure"],
    temprature: ["temperature"],
    temparature: ["temperature"],
    vibartion: ["vibration"],
    vibraion: ["vibration"],
    corrotion: ["corrosion"],
    corrosian: ["corrosion"],
    dimenssion: ["dimension"],
    specifiy: ["specify"],
    refered: ["referred"],
    referance: ["reference"],
    descrption: ["description"],
    descripton: ["description"],
    identifed: ["identified"],
    identifiy: ["identify"],
    avilable: ["available"],
    availble: ["available"],
    recomend: ["recommend"],
    recomendation: ["recommendation"],
    neccessary: ["necessary"],
    necesary: ["necessary"],
    sucessful: ["successful"],
    sucessfully: ["successfully"],
    usefull: ["useful"],
    comming: ["coming"],
    diferent: ["different"],
    diffrent: ["different"],
    similiar: ["similar"],
    simmilar: ["similar"],
    prefered: ["preferred"],
    occassion: ["occasion"],
    accomodation: ["accommodation"],
    responsibilty: ["responsibility"],
    knowlege: ["knowledge"],
    relevent: ["relevant"],
    consistant: ["consistent"],
    consistancy: ["consistency"],
    effecient: ["efficient"],
    efficent: ["efficient"],
    beginers: ["beginners"],
    calender: ["calendar"],
    febuary: ["February"],
    januray: ["January"],
    tommorow: ["tomorrow"],
    yestarday: ["yesterday"],
    reciept: ["receipt"],
    wierd: ["weird"],
    truely: ["truly"],
    basicly: ["basically"],
    actualy: ["actually"],
    finaly: ["finally"],
    usualy: ["usually"],
    realy: ["really"],
    probaly: ["probably"],
    obviusly: ["obviously"],
    definitly: ["definitely"],
    throught: ["through"],
    thoughout: ["throughout"],
    alchohol: ["alcohol"],
    acheive: ["achieve"],
    acheived: ["achieved"],
    acheiving: ["achieving"],
    beleive: ["believe"],
    beleived: ["believed"],
    concious: ["conscious"],
    existance: ["existence"],
    independant: ["independent"],
    independantly: ["independently"],
    immediatly: ["immediately"],
    imediately: ["immediately"],
    normaly: ["normally"],
    corectly: ["correctly"],
    occuring: ["occurring"],
    privelege: ["privilege"],
    publically: ["publicly"],
    seperateley: ["separately"],
    succesful: ["successful"],
    succesfully: ["successfully"],
    writting: ["writing"],
    writen: ["written"],
    whereever: ["wherever"],
    wheather: ["whether", "weather"],
    "thier's": ["theirs"],
    alot: ["a lot"],
    infront: ["in front"],
    aswell: ["as well"],
    stl: ["steel"],
    incorrecty: ["incorrectly"],
    incorectly: ["incorrectly"],
    carefuly: ["carefully"],
    accuratly: ["accurately"],
    accurateley: ["accurately"],
    successfullly: ["successfully"],
    succesfuly: ["successfully"],
    immediatley: ["immediately"],
    normalley: ["normally"],
    usualy: ["usually"],
    finaly: ["finally"],
    actualy: ["actually"],
    realy: ["really"],
    probaly: ["probably"],
    obviusly: ["obviously"]
  };

  /*
   * US / UK spelling pairs.
   * First value = UK, second value = US.
   */
  const spellingVariants = [
    ["colour", "color"],
    ["colours", "colors"],
    ["colourful", "colorful"],
    ["colouring", "coloring"],
    ["favourite", "favorite"],
    ["favourites", "favorites"],
    ["honour", "honor"],
    ["honours", "honors"],
    ["honoured", "honored"],
    ["honouring", "honoring"],
    ["labour", "labor"],
    ["labours", "labors"],
    ["neighbour", "neighbor"],
    ["neighbours", "neighbors"],
    ["neighbourhood", "neighborhood"],
    ["neighbouring", "neighboring"],
    ["centre", "center"],
    ["centres", "centers"],
    ["centred", "centered"],
    ["centring", "centering"],
    ["theatre", "theater"],
    ["theatres", "theaters"],
    ["metre", "meter"],
    ["metres", "meters"],
    ["litre", "liter"],
    ["litres", "liters"],
    ["kilometre", "kilometer"],
    ["kilometres", "kilometers"],
    ["organise", "organize"],
    ["organises", "organizes"],
    ["organised", "organized"],
    ["organising", "organizing"],
    ["organisation", "organization"],
    ["organisations", "organizations"],
    ["realise", "realize"],
    ["realises", "realizes"],
    ["realised", "realized"],
    ["realising", "realizing"],
    ["recognise", "recognize"],
    ["recognised", "recognized"],
    ["recognises", "recognizes"],
    ["recognising", "recognizing"],
    ["analyse", "analyze"],
    ["analysed", "analyzed"],
    ["analyses", "analyzes"],
    ["analysing", "analyzing"],
    ["paralyse", "paralyze"],
    ["paralysed", "paralyzed"],
    ["catalogue", "catalog"],
    ["catalogues", "catalogs"],
    ["dialogue", "dialog"],
    ["dialogues", "dialogs"],
    ["travelling", "traveling"],
    ["travelled", "traveled"],
    ["traveller", "traveler"],
    ["travellers", "travelers"],
    ["cancelled", "canceled"],
    ["cancelling", "canceling"],
    ["counselling", "counseling"],
    ["counsellor", "counselor"],
    ["jewellery", "jewelry"],
    ["grey", "gray"],
    ["aluminium", "aluminum"],
    ["mould", "mold"],
    ["moulds", "molds"],
    ["moulding", "molding"],
    ["programme", "program"],
    ["programmes", "programs"],
    ["licence", "license"],
    ["licences", "licenses"],
    ["defence", "defense"],
    ["offence", "offense"],
    ["pretence", "pretense"],
    ["practise", "practice"],
    ["practised", "practiced"],
    ["practising", "practicing"],
    ["tyre", "tire"],
    ["tyres", "tires"]
  ];

  /*
   * Technical phrases.
   */
  const phraseAlternatives = [
    {
      variants: ["opto coupler", "opto-coupler", "optocoupler"],
      preferred: "optocoupler"
    },
    {
      variants: ["optoelectronic", "opto electronic", "opto-electronic"],
      preferred: "optoelectronic"
    },
    {
      variants: ["thermo couple", "thermo-couple", "thermocouple"],
      preferred: "thermocouple"
    },
    {
      variants: ["micro controller", "micro-controller", "microcontroller"],
      preferred: "microcontroller"
    },
    {
      variants: ["electro magnetic", "electro-magnetic", "electromagnetic"],
      preferred: "electromagnetic"
    },
    {
      variants: ["photo electric", "photo-electric", "photoelectric"],
      preferred: "photoelectric"
    },
    {
      variants: ["customwordxyz", "custom word xyz"],
      preferred: "custom word xyz"
    },
    {
      variants: ["ToneVault", "Tone-Vault"],
      preferred: "ToneVault"
    },
    {
      variants: ["non drive", "non-drive", "nondrive"],
      preferred: "non-drive"
    },
    {
      variants: ["co operate", "co-operate", "cooperate"],
      preferred: "cooperate"
    },
    {
      variants: ["water pump", "waterpump"],
      preferred: "water pump"
    },
    {
      variants: ["check valve", "check-valve"],
      preferred: "check valve"
    },
    {
      variants: ["o ring", "o-ring", "oring"],
      preferred: "O-ring"
    },
    {
      variants: ["gear box", "gearbox"],
      preferred: "gearbox"
    },
    {
      variants: ["air conditioner", "air-conditioner"],
      preferred: "air conditioner"
    },
    {
      variants: ["circuit breaker", "circuit-breaker"],
      preferred: "circuit breaker"
    },
    {
      variants: ["push button", "push-button"],
      preferred: "push button"
    },
    {
      variants: ["limit switch", "limit-switch"],
      preferred: "limit switch"
    },
    {
      variants: ["solenoid valve", "solenoid-valve"],
      preferred: "solenoid valve"
    },
    {
      variants: ["stainless steel", "stainless-steel"],
      preferred: "stainless steel"
    },
    {
      variants: ["power supply", "power-supply"],
      preferred: "power supply"
    }
  ];

  /*
   * Technical vocabulary protected from false positives.
   */
  const technicalWords = new Set(
    (
      "opto coupler optocoupler optoelectronic customwordxyz tonevault " +
      "thermo couple thermocouple micro controller microcontroller " +
      "electro magnetic electromagnetic photo electric photoelectric " +
      "non drive nondrive " +
      "co operate cooperate waterpump water pump " +
      "filter unit fluid pressure equipment hydraulic " +
      "phoenix contact crossbar stainless steel bracket " +
      "width thickness length connector electrical pump " +
      "assembly centrifugal bearing housing drawing cable " +
      "maintenance transmitter voltage current volts " +
      "hydraulic pneumatic solenoid actuator relay switch " +
      "motor engine gearbox gear bearing seal gasket " +
      "fastener washer bolt screw nut flange coupling " +
      "valve sensor controller terminal terminalblock " +
      "transformer capacitor resistor diode transistor " +
      "photocoupler optoisolator millimetre millimeter " +
      "mm cm kg kw kva dc ac dek pn part model serial item"
    ).split(/\s+/)
  );

  /*
   * Load personal dictionary.
   */
  try {
    const saved = JSON.parse(
      localStorage.getItem("toolboxSpellPersonalDictionary") || "[]"
    );

    saved.forEach(word => {
      personalDictionary.add(String(word).toLowerCase());
    });
  } catch (error) {
    // Continue without saved personal words.
  }

  const getText = () => editor.innerText.replace(/\r/g, "");

  function preserveCase(source, replacement) {
    if (source === source.toUpperCase()) {
      return replacement.toUpperCase();
    }

    if (source[0] && source[0] === source[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }

    return replacement;
  }

  function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function getDictionary() {
    return window.LOCAL_SPELL_WORDS instanceof Set
      ? window.LOCAL_SPELL_WORDS
      : null;
  }

  function getLanguage() {
    return language?.value === "en_GB" ? "en_GB" : "en_US";
  }

  /*
   * US/UK spelling suggestions.
   */
  function getVariantSuggestions(word) {
    const lower = word.toLowerCase();

    for (const pair of spellingVariants) {
      const uk = pair[0].toLowerCase();
      const us = pair[1].toLowerCase();

      if (lower !== uk && lower !== us) continue;

      // Return [] for the selected regional spelling so the base
      // dictionary cannot incorrectly flag an accepted UK/US variant.
      if (getLanguage() === "en_GB") {
        return lower === uk ? [] : [pair[0]];
      }

      return lower === us ? [] : [pair[1]];
    }

    // null means this is not a regional spelling pair.
    return null;
  }

  /*
   * Approximate word similarity.
   */
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let previous = Array.from(
      { length: b.length + 1 },
      (_, index) => index
    );

    for (let i = 1; i <= a.length; i++) {
      const current = [i];

      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + cost
        );
      }

      previous = current;
    }

    return previous[b.length];
  }

  /*
   * Indexed and cached dictionary suggestions.
   * Build length buckets once instead of scanning the entire dictionary
   * for every unknown word on every editor update.
   */
  let dictionaryIndexSource = null;
  let dictionaryIndex = new Map();
  const suggestionCache = new Map();

  function getDictionaryIndex(dictionary) {
    if (dictionaryIndexSource === dictionary) return dictionaryIndex;

    dictionaryIndexSource = dictionary;
    dictionaryIndex = new Map();

    for (const candidate of dictionary) {
      if (typeof candidate !== "string") continue;
      const item = candidate.toLowerCase();
      const length = item.length;

      if (!dictionaryIndex.has(length)) dictionaryIndex.set(length, []);
      dictionaryIndex.get(length).push(item);
    }

    suggestionCache.clear();
    return dictionaryIndex;
  }

  function dictionarySuggestions(word) {
    const dictionary = getDictionary();
    if (!dictionary) return [];

    const lower = word.toLowerCase();
    if (lower.length < 3) return [];

    const cacheKey = `${getLanguage()}:${lower}`;
    if (suggestionCache.has(cacheKey)) {
      return suggestionCache.get(cacheKey);
    }

    const index = getDictionaryIndex(dictionary);
    const maxDistance = lower.length <= 4 ? 1 : 2;
    const candidates = [];

    for (
      let length = Math.max(1, lower.length - maxDistance);
      length <= lower.length + maxDistance;
      length++
    ) {
      const bucket = index.get(length);
      if (!bucket) continue;

      for (const item of bucket) {
        if (item === lower) continue;

        const distance = levenshtein(lower, item);
        if (distance <= maxDistance) {
          candidates.push({ word: item, distance });
        }
      }
    }

    candidates.sort((a, b) =>
      a.distance - b.distance || a.word.localeCompare(b.word)
    );

    const result = [...new Set(
      candidates.slice(0, 6).map(item => item.word)
    )];

    if (suggestionCache.size > 3000) suggestionCache.clear();
    suggestionCache.set(cacheKey, result);
    return result;
  }

  /*
   * Common valid words that may be absent from the compact local
   * dictionary. Do not generate misleading edit-distance suggestions
   * for these correctly spelled words.
   */
  const acceptedWords = new Set([
    "after",
    "acceptable",
    "immediately",
    "normally",
    "prepared",
    "properly",
    "replaced",
    "review",
    "successfully",
    "incorrectly",
    "accurately",
    "carefully",
    "continuously",
    "suddenly",
    "directly",
    "electrically",
    "mechanically",
    "hydraulically",
    "visually",
    "particularly",
    "approximately",
    "satisfactory"
  ]);

  /*
   * Return spelling corrections for a single word.
   */
  function getSuggestions(word) {
    const lower = word.toLowerCase();

    if (
      personalDictionary.has(lower) ||
      ignoredWords.has(lower) ||
      technicalWords.has(lower) ||
      acceptedWords.has(lower)
    ) {
      return [];
    }

    // Explicit typo corrections take priority.
    if (spellingMap[lower]) {
      return spellingMap[lower];
    }

    // Apply selected US/UK spelling.
    const variantSuggestions = getVariantSuggestions(word);

    if (variantSuggestions !== null) {
      return variantSuggestions;
    }

    // Accept words in the local dictionary.
    const dictionary = getDictionary();

    if (dictionary && dictionary.has(lower)) {
      return [];
    }

    // Generate suggestions for unknown words.
    if (dictionary) {
      return dictionarySuggestions(word);
    }

    return [];
  }

  /*
   * Find optional technical phrase alternatives.
   * Regional spelling alternatives are deliberately excluded.
   */
  const phraseResultCache = new Map();
  const issueResultCache = new Map();

  function findPhraseAlternatives(text) {
    const cacheKey = `${getLanguage()}:` + text;
    if (phraseResultCache.has(cacheKey)) return phraseResultCache.get(cacheKey);

    const results = [];

    // Regional compounds are checked for spelling first by findIssues().
    // Once their spelling matches the selected dictionary, show them here
    // as optional blue-dot phrase/format alternatives.
    const regionalVariant = getLanguage() === "en_GB" ? "grey" : "gray";
    const rules = [
      ...phraseAlternatives,
      {
        variants: [
          `non ${regionalVariant}`,
          `non-${regionalVariant}`,
          `non${regionalVariant}`
        ],
        preferred: `non-${regionalVariant}`
      }
    ];

    rules.forEach(rule => {
      rule.variants.forEach(variant => {
        const escaped = variant.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        const regex = new RegExp(
          `(?<![\\p{L}\\p{N}_-])${escaped}(?![\\p{L}\\p{N}_-])`,
          "giu"
        );

        let match;

        while ((match = regex.exec(text)) !== null) {
          const start = match.index;
          const end = start + match[0].length;

          results.push({
            word: match[0],
            start,
            end,
            suggestions: rule.variants.filter(
              option => option.toLowerCase() !== match[0].toLowerCase()
            ),
            preferred: rule.preferred,
            type: "alternative"
          });
        }
      });
    });

    results.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    const filtered = [];
    let lastEnd = -1;

    results.forEach(item => {
      if (item.start >= lastEnd) {
        filtered.push(item);
        lastEnd = item.end;
      }
    });

    if (phraseResultCache.size > 20) phraseResultCache.clear();
    phraseResultCache.set(cacheKey, filtered);
    return filtered;
  }

  /*
   * Find actual spelling errors.
   */
  function findIssues(text) {
    const cacheKey = `${getLanguage()}:` + text;
    if (issueResultCache.has(cacheKey)) return issueResultCache.get(cacheKey);

    const results = [];
    const compoundRanges = [];

    /*
     * Check regional spelling of the complete "non-grey/non-gray"
     * expression before checking individual words.
     */
    const compoundRegex = /\bnon([ -])(grey|gray)\b/giu;
    let compoundMatch;

    while ((compoundMatch = compoundRegex.exec(text)) !== null) {
      const word = compoundMatch[0];
      const separator = compoundMatch[1];
      const currentVariant = compoundMatch[2].toLowerCase();
      const preferredVariant = getLanguage() === "en_GB" ? "grey" : "gray";

      compoundRanges.push({
        start: compoundMatch.index,
        end: compoundMatch.index + word.length
      });

      if (currentVariant !== preferredVariant) {
        results.push({
          word,
          start: compoundMatch.index,
          end: compoundMatch.index + word.length,
          suggestions: [`non-${preferredVariant}`],
          type: "spelling"
        });
      }
    }

    /*
     * Protect recognised multi-word technical expressions from being
     * split into unrelated individual spelling errors.
     */
    findPhraseAlternatives(text).forEach(alternative => {
      if (/[\\s-]/.test(alternative.word)) {
        compoundRanges.push({
          start: alternative.start,
          end: alternative.end
        });
      }
    });

    /*
     * Check individual words, excluding words already covered by a
     * complete compound expression.
     */
    const regex =
      /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;

    let match;

    while ((match = regex.exec(text)) !== null) {
      const word = match[0];
      const start = match.index;
      const end = start + word.length;

      if (compoundRanges.some(range => start >= range.start && end <= range.end)) {
        continue;
      }

      const suggestions = getSuggestions(word);

      if (suggestions.length) {
        results.push({
          word,
          start,
          end,
          suggestions,
          type: "spelling"
        });
      }
    }

    // Detect consecutive repeated words and mark the complete pair as
    // a blue optional-style issue, rather than a red spelling error.
    // Selecting "Keep one copy" replaces both occurrences with one.
    const repeatedRegex = /\b([\p{L}\p{M}]+)[ \t]+\1\b/giu;
    let repeatedMatch;

    while ((repeatedMatch = repeatedRegex.exec(text)) !== null) {
      const repeatedWord = repeatedMatch[1];
      const phraseStart = repeatedMatch.index;
      const phraseEnd = phraseStart + repeatedMatch[0].length;

      // Suppress individual spelling flags within this repeated pair.
      for (let i = results.length - 1; i >= 0; i--) {
        if (
          results[i].type === "spelling" &&
          results[i].start < phraseEnd &&
          results[i].end > phraseStart
        ) {
          results.splice(i, 1);
        }
      }

      results.push({
        word: repeatedWord,
        start: phraseStart,
        end: phraseEnd,
        suggestions: [repeatedWord],
        suggestionLabels: ["Keep one copy"],
        type: "repeated"
      });
    }

    results.sort((a, b) => a.start - b.start);
    if (issueResultCache.size > 20) issueResultCache.clear();
    issueResultCache.set(cacheKey, results);
    return results;
  }
  /*
   * Read caret position before re-rendering.
   */
  function getCaretPosition() {
    const selection = window.getSelection();

    if (
      !selection ||
      !selection.rangeCount ||
      !editor.contains(selection.anchorNode)
    ) {
      return null;
    }

    const range = selection.getRangeAt(0).cloneRange();

    range.selectNodeContents(editor);
    range.setEnd(selection.anchorNode, selection.anchorOffset);

    return range.toString().length;
  }

  /*
   * Restore caret after rendering.
   */
  function restoreCaret(position) {
    if (position === null) return;

    const selection = window.getSelection();

    if (!selection) return;

    const walker = document.createTreeWalker(
      editor,
      NodeFilter.SHOW_TEXT
    );

    let node;
    let remaining = position;
    const range = document.createRange();

    while ((node = walker.nextNode())) {
      if (remaining <= node.length) {
        range.setStart(node, remaining);
        range.collapse(true);

        selection.removeAllRanges();
        selection.addRange(range);

        return;
      }

      remaining -= node.length;
    }

    range.selectNodeContents(editor);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  /*
   * Render spelling and phrase markers.
   */
  function renderEditor() {
    const text = getText();
    const caret = getCaretPosition();

    const spellingIssues = issues.filter(
      item => item.type === "spelling" || item.type === "repeated"
    );

    const alternatives = findPhraseAlternatives(text);

    const allMarkers = [
      ...spellingIssues,
      ...alternatives
    ].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    let html = "";
    let position = 0;

    for (const item of allMarkers) {
      if (item.start < position) continue;

      html += escapeHTML(text.slice(position, item.start));

      const className =
        item.type === "alternative" || item.type === "repeated"
          ? "optional-alternative"
          : "misspelled";

      const title =
        item.type === "alternative"
          ? "Click to view alternative forms"
          : item.type === "repeated"
            ? "Click to keep one copy of the repeated word"
            : "Click to view spelling suggestions";

      html +=
        `<span class="${className}" ` +
        `data-start="${item.start}" ` +
        `data-type="${item.type}" ` +
        `title="${title}">` +
        escapeHTML(text.slice(item.start, item.end)) +
        "</span>";

      position = item.end;
    }

    html += escapeHTML(text.slice(position));

    editor.innerHTML = html.replace(/\n/g, "<br>");

    restoreCaret(caret);
  }

  /*
   * Update word and spelling-error counts.
   */
  function updateCounts() {
    const text = getText();

    const words =
      text.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu) || [];

    const issueCount = issues.filter(
      item => item.type === "spelling" || item.type === "repeated"
    ).length;

    if ($("wordCount")) {
      $("wordCount").textContent = `${words.length} words`;
    }

    if ($("errorCount")) {
      $("errorCount").textContent =
        `${issueCount} issue${issueCount === 1 ? "" : "s"}`;
    }

    if ($("status")) {
      $("status").textContent = text.trim()
        ? `${issueCount} possible spelling issue${issueCount === 1 ? "" : "s"} found`
        : "Ready to check";
    }

    if ($("undoBtn")) {
      $("undoBtn").disabled = !previousText;
    }
  }

  /*
 * Render spelling markers in preview text.
 */
function renderPreviewMarkup(text) {
  if (!text) return "";

  const previewIssues = [
    ...findIssues(text),
    ...findPhraseAlternatives(text)
  ].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  let html = "";
  let position = 0;

  previewIssues.forEach(issue => {
    if (issue.start < position) return;

    html += escapeHTML(text.slice(position, issue.start));

    const className =
      issue.type === "alternative"
        ? "preview-alternative"
        : "preview-misspelled";

    html += `<span class="${className}">${escapeHTML(
      text.slice(issue.start, issue.end)
    )}</span>`;

    position = issue.end;
  });

  html += escapeHTML(text.slice(position));

  return html;
}

/*
 * Render before/after previews.
 */
function renderCorrectedPreviewMarkup(text) {
  if (!text) return "";

  const markers = [
    ...findIssues(text).map(issue => ({
      start: issue.start, end: issue.end, type: "misspelled"
    })),
    ...findPhraseAlternatives(text).map(issue => ({
      start: issue.start, end: issue.end, type: "alternative"
    })),
    ...appliedCorrections
      .filter(item => item.start >= 0 && item.end <= text.length)
      .map(item => ({
        start: item.start, end: item.end, type: "corrected"
      }))
  ].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  let html = "";
  let position = 0;

  markers.forEach(marker => {
    if (marker.start < position) return;
    html += escapeHTML(text.slice(position, marker.start));

    const className = marker.type === "corrected"
      ? "preview-corrected"
      : marker.type === "alternative"
        ? "preview-alternative"
        : "preview-misspelled";

    html += `<span class="${className}">${escapeHTML(
      text.slice(marker.start, marker.end)
    )}</span>`;
    position = marker.end;
  });

  html += escapeHTML(text.slice(position));
  return html;
}

/*
 * Render before/after previews.
 */
function renderPreviews() {
  const text = getText();

  // A completely empty editor must produce empty previews.
  if (!text) {
    originalText = "";
    correctedText = "";
  }

  if ($("originalPreview")) {
    $("originalPreview").innerHTML = originalText
      ? renderPreviewMarkup(originalText)
      : "Your original text will appear here.";
  }

  if ($("correctedPreview")) {
    $("correctedPreview").innerHTML = correctedText
      ? renderCorrectedPreviewMarkup(correctedText)
      : "Accepted corrections will appear here.";
  }

  if ($("changeSummary")) {
    $("changeSummary").textContent =
      correctedText !== originalText
        ? "Corrections applied"
        : "No corrections applied";
  }
}

  /*
   * Close suggestion popup.
   */
  function closePopup() {
    if (popup) {
      popup.hidden = true;
      popup.replaceChildren();
    }

    activeIssue = null;
  }

  /*
   * Run spelling checks.
   */
  function runCheck() {
    if (inputCheckTimer) {
      clearTimeout(inputCheckTimer);
      inputCheckTimer = null;
    }

    const text = getText();

    // Clearing a large document should not run dictionary, phrase,
    // preview, or cache work. Reset the UI immediately.
    if (!text.trim()) {
      issues = [];
      issueResultCache.clear();
      phraseResultCache.clear();
      suggestionCache.clear();
      originalText = "";
      correctedText = "";
      appliedCorrections.length = 0;

      if (editor.innerHTML !== "") editor.innerHTML = "";
      closePopup();
      renderPreviews();
      updateCounts();
      return;
    }

    issues = findIssues(text);

    renderEditor();
    renderPreviews();
    updateCounts();
    closePopup();
  }

  /*
   * Show spelling suggestions and actions.
   */
  function showPopup(issue, anchor) {
    if (!popup) return;

    activeIssue = issue;
    popup.replaceChildren();
    popup.hidden = false;

    const heading = document.createElement("div");
    heading.className = "suggestion-popup-heading";

    const title = document.createElement("span");
    title.className = "suggestion-popup-title";
    title.textContent =
      issue.type === "alternative"
        ? `${issue.word} — alternatives`
        : issue.type === "repeated"
          ? `${issue.word} — repeated word`
          : `${issue.word} — spelling suggestions`;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "suggestion-popup-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close suggestions");
    close.title = "Close";

    close.addEventListener("click", event => {
      event.stopPropagation();
      closePopup();
    });

    heading.append(title, close);
    popup.append(heading);

    const suggestions = document.createElement("div");
    suggestions.className = "suggestion-popup-suggestions";

    issue.suggestions.forEach(suggestion => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion-chip";
      button.textContent = issue.suggestionLabels?.[issue.suggestions.indexOf(suggestion)] ||
        (suggestion ? preserveCase(issue.word, suggestion) : "Remove duplicate");

      button.addEventListener("click", event => {
        event.stopPropagation();
        replaceIssue(issue, suggestion);
      });

      suggestions.append(button);
    });

    popup.append(suggestions);

    if (issue.type === "spelling") {
      const actions = document.createElement("div");
      actions.className = "suggestion-popup-actions";

      const ignore = document.createElement("button");
      ignore.type = "button";
      ignore.className = "suggestion-action";
      ignore.textContent = "Ignore";
      ignore.addEventListener("click", event => {
        event.stopPropagation();
        ignoredWords.add(issue.word.toLowerCase());
        runCheck();
      });

      const add = document.createElement("button");
      add.type = "button";
      add.className = "suggestion-action";
      add.textContent = "Add to dictionary";
      add.addEventListener("click", event => {
        event.stopPropagation();
        personalDictionary.add(issue.word.toLowerCase());

        try {
          localStorage.setItem(
            "toolboxSpellPersonalDictionary",
            JSON.stringify([...personalDictionary])
          );
        } catch (error) {
          // Keep the word in the current session.
        }

        runCheck();
      });

      actions.append(ignore, add);
      popup.append(actions);
    }

    // Keep the popup inside the editor while allowing its width to follow
    // the suggestion chips instead of forcing a narrow, scrollable panel.
    if (anchor && $("editorWrap")) {
      const rect = anchor.getBoundingClientRect();
      const wrap = $("editorWrap").getBoundingClientRect();

      popup.style.position = "absolute";
      popup.style.left = Math.max(
        8,
        Math.min(rect.left - wrap.left, wrap.width - popup.offsetWidth - 8)
      ) + "px";
      popup.style.top = Math.max(8, rect.bottom - wrap.top + 6) + "px";
    }
  }

  /*
   * Replace a selected word or phrase.
   */
  function replaceIssue(issue, replacement) {
    previousText = getText();

    const text = getText();

    const replacementText = preserveCase(
      issue.word,
      replacement
    );

    let prefix = text.slice(0, issue.start);
    if (issue.type === "repeated" && replacementText === "") {
      prefix = prefix.replace(/[ \t]+$/, "");
    }

    const updated =
      prefix +
      replacementText +
      text.slice(issue.end);

    const delta = replacementText.length - (issue.end - issue.start);
    appliedCorrections.forEach(item => {
      if (item.start >= issue.end) {
        item.start += delta;
        item.end += delta;
      } else if (item.end > issue.start) {
        item.end = item.start;
      }
    });
    appliedCorrections.push({
      start: issue.start,
      end: issue.start + replacementText.length
    });

    editor.innerText = updated;
    correctedText = updated;

    closePopup();
    runCheck();

    editor.focus();
  }

  /*
   * Open popup when a marked word is clicked.
   */
  editor.addEventListener("click", event => {
    const marker = event.target.closest(
      ".misspelled, .optional-alternative"
    );

    if (!marker) {
      closePopup();
      return;
    }

    const start = Number(marker.dataset.start);
    const type = marker.dataset.type;

    let issue;

    if (type === "alternative") {
      issue = findPhraseAlternatives(getText()).find(
        item => item.start === start
      );
    } else {
      issue = issues.find(
        item =>
          item.start === start &&
          (item.type === "spelling" || item.type === "repeated")
      );
    }

    if (issue) {
      showPopup(issue, marker);
    }
  });

  /*
   * Close popup when clicking outside.
   */
  document.addEventListener("click", event => {
    if (!popup || popup.hidden) return;

    if (
      popup.contains(event.target) ||
      editor.contains(event.target)
    ) {
      return;
    }

    closePopup();
  });

  /*
   * Fast reset for full-document deletion.
   * The editor may contain hundreds of marker spans. Letting the browser
   * delete a large selected rich-text DOM tree node-by-node can freeze the
   * main thread. Intercept a full-content deletion and clear the editor in
   * one operation instead.
   */
  let inputCheckTimer = null;

  function resetEmptyEditor() {
    if (inputCheckTimer) {
      clearTimeout(inputCheckTimer);
      inputCheckTimer = null;
    }

    issues = [];
    issueResultCache.clear();
    phraseResultCache.clear();
    suggestionCache.clear();
    originalText = "";
    correctedText = "";
    appliedCorrections.length = 0;
    editor.replaceChildren();
    closePopup();

    if ($("originalPreview")) {
      $("originalPreview").textContent = "Your original text will appear here.";
    }
    if ($("correctedPreview")) {
      $("correctedPreview").textContent = "Accepted corrections will appear here.";
    }
    if ($("changeSummary")) {
      $("changeSummary").textContent = "No corrections applied";
    }

    updateCounts();
  }

  editor.addEventListener("beforeinput", event => {
    if (!/^delete/.test(event.inputType || "")) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    // textContent is substantially cheaper than innerText for this check.
    // Selection text includes line breaks, so >= also covers rendered <br>s.
    const selectedLength = selection.toString().length;
    const documentLength = editor.textContent.length;

    if (documentLength > 0 && selectedLength >= documentLength) {
      event.preventDefault();
      resetEmptyEditor();
    }
  });

  editor.addEventListener("input", () => {
    appliedCorrections.length = 0;
    originalText = getText();
    correctedText = originalText;

    // Fast path for deleting all content, including large pasted documents.
    if (!originalText.trim()) {
      resetEmptyEditor();
      return;
    }

    // Avoid running the full spell-check pipeline for every keystroke.
    // A short debounce lets paste and fast typing settle before checking.
    if (inputCheckTimer) clearTimeout(inputCheckTimer);

    if ($("autoCheck")?.checked) {
      inputCheckTimer = setTimeout(() => {
        inputCheckTimer = null;
        runCheck();
      }, 220);
    } else {
      updateCounts();
    }
  });

  /*
   * Check spelling button.
   */
  $("checkBtn")?.addEventListener("click", () => {
    originalText = getText();
    correctedText = originalText;
    appliedCorrections.length = 0;
    runCheck();
  });

  /*
   * Clear text button.
   */
  $("clearBtn")?.addEventListener("click", () => {
    previousText = getText();

    editor.innerText = "";
    originalText = "";
    correctedText = "";
    appliedCorrections.length = 0;

    ignoredWords.clear();

    closePopup();
    runCheck();

    editor.focus();
  });

  /*
   * Undo previous correction or clear operation.
   */
  $("undoBtn")?.addEventListener("click", () => {
    if (!previousText) return;

    const currentText = getText();

    editor.innerText = previousText;
    previousText = currentText;

    correctedText = getText();

    closePopup();
    runCheck();
  });

  /*
   * Refresh spelling when US/UK dictionary changes.
   */
  language?.addEventListener("change", () => {
    closePopup();
    runCheck();
  });

  /*
   * Auto-check toggle.
   */
  $("autoCheck")?.addEventListener("change", () => {
    if ($("autoCheck").checked) {
      runCheck();
    }
  });

  /*
   * Upload TXT file.
   */
  $("txtFile")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    editor.innerText = await file.text();

    originalText = getText();
    correctedText = originalText;

    if ($("fileName")) {
      $("fileName").textContent = file.name;
    }

    runCheck();
  });

  /*
   * Download helper.
   */
  function downloadFile(name, content, type) {
    const blob = new Blob(
      [content],
      { type: type + ";charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = name;

    document.body.append(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  /*
   * Download text as TXT.
   */
  $("downloadTxtBtn")?.addEventListener("click", () => {
    downloadFile(
      "spell-check-result.txt",
      getText(),
      "text/plain"
    );
  });

  /*
   * Download original and corrected text as CSV.
   */
  function csvEscape(value) {
    return '"' + String(value ?? "").replace(/"/g, '""') + '"';
  }

  $("downloadTextCsvBtn")?.addEventListener("click", () => {
    const suffix = getLanguage() === "en_GB" ? "UK" : "US";

    const rows = [
      ["ORIGINAL_TEXT", `CORRECTED_TEXT_${suffix}`],
      [originalText, correctedText || originalText]
    ];

    const csv =
      "\uFEFF" +
      rows.map(row => row.map(csvEscape).join(",")).join("\r\n");

    downloadFile(
      `spell-check-result-${suffix}.csv`,
      csv,
      "text/csv"
    );
  });

  /*
   * Compare / Original / Corrected preview controls.
   */
  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-view]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      const comparison = $("comparison");

      if (comparison) {
        comparison.classList.toggle(
          "single-original",
          button.dataset.view === "original"
        );

        comparison.classList.toggle(
          "single-corrected",
          button.dataset.view === "corrected"
        );
      }
    });
  });

  /*
   * Excel / CSV workbook workflow using the SheetJS library.
   */
  let uploadedWorkbook = null;
  let uploadedSheetName = "";
  let uploadedRows = [];
  let selectedColumnIndex = -1;

  function setExcelStatus(message) {
    if ($("excelStatus")) $("excelStatus").textContent = message;
  }

  function resetExcelInterface(hidePanel = true) {
    uploadedWorkbook = null;
    uploadedSheetName = "";
    uploadedRows = [];
    selectedColumnIndex = -1;

    if ($("excelFile")) $("excelFile").value = "";
    if ($("sheetSelect")) $("sheetSelect").replaceChildren();
    if ($("columnChoices")) $("columnChoices").replaceChildren();
    if ($("excelPreview")) $("excelPreview").replaceChildren();
    if ($("saveColumnBtn")) $("saveColumnBtn").hidden = true;
    if ($("downloadExcelBtn")) $("downloadExcelBtn").disabled = true;
    if ($("fileName")) $("fileName").textContent = "No file selected";
    setExcelStatus("");

    if ($("excelPanel") && hidePanel) $("excelPanel").hidden = true;
  }

  function getSheetRows(sheetName) {
    const sheet = uploadedWorkbook?.Sheets?.[sheetName];
    if (!sheet || !window.XLSX) return [];
    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: ""
    });
  }

  function renderExcelColumns() {
    const container = $("columnChoices");
    if (!container || !uploadedRows.length) return;

    container.replaceChildren();
    const headers = uploadedRows[0] || [];
    const width = Math.max(headers.length, ...uploadedRows.map(row => row.length), 0);

    for (let col = 0; col < width; col++) {
      const label = document.createElement("label");
      label.className = "excel-column-option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "excelTextColumn";
      radio.value = String(col);
      radio.checked = col === 0;
      radio.addEventListener("change", () => {
        selectedColumnIndex = col;
      });

      const caption = document.createElement("span");
      caption.textContent = String(headers[col] ?? "").trim() || `Column ${col + 1}`;
      label.append(radio, caption);
      container.append(label);
    }

    selectedColumnIndex = 0;
  }

  function renderExcelPreview() {
    const target = $("excelPreview");
    if (!target) return;

    target.replaceChildren();
    const table = document.createElement("table");
    table.className = "excel-preview-table";
    const body = document.createElement("tbody");

    uploadedRows.slice(0, 6).forEach(row => {
      const tr = document.createElement("tr");
      row.slice(0, 8).forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = String(value ?? "");
        tr.append(cell);
      });
      body.append(tr);
    });

    table.append(body);
    target.append(table);
  }

  $("excelFile")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!window.XLSX) {
        throw new Error("Excel library did not load. Check your internet connection and refresh the page.");
      }

      const buffer = await file.arrayBuffer();
      uploadedWorkbook = XLSX.read(buffer, { type: "array", cellDates: false });

      if (!uploadedWorkbook.SheetNames.length) {
        throw new Error("The uploaded file contains no worksheets.");
      }

      if ($("fileName")) $("fileName").textContent = file.name;
      if ($("excelPanel")) $("excelPanel").hidden = false;

      const sheetSelect = $("sheetSelect");
      sheetSelect.replaceChildren();

      uploadedWorkbook.SheetNames.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        sheetSelect.append(option);
      });

      uploadedSheetName = uploadedWorkbook.SheetNames[0];
      uploadedRows = getSheetRows(uploadedSheetName);
      renderExcelColumns();
      renderExcelPreview();

      if ($("downloadExcelBtn")) $("downloadExcelBtn").disabled = false;
      setExcelStatus(`${file.name} loaded successfully. ${uploadedWorkbook.SheetNames.length} worksheet(s) found. Select a text column.`);
    } catch (error) {
      resetExcelInterface(false);
      if ($("excelPanel")) $("excelPanel").hidden = false;
      setExcelStatus(`Upload failed: ${error.message || "Unable to read this file."}`);
    }
  });

  $("sheetSelect")?.addEventListener("change", () => {
    if (!uploadedWorkbook) return;
    uploadedSheetName = $("sheetSelect").value;
    uploadedRows = getSheetRows(uploadedSheetName);
    renderExcelColumns();
    renderExcelPreview();
    setExcelStatus(`Worksheet "${uploadedSheetName}" selected. Choose a text column.`);
  });

  $("loadColumnBtn")?.addEventListener("click", () => {
    if (!uploadedWorkbook || selectedColumnIndex < 0 || !uploadedRows.length) {
      setExcelStatus("Upload a workbook and select a text column first.");
      return;
    }

    const values = uploadedRows.slice(1).map(row =>
      String(row[selectedColumnIndex] ?? "")
    );
    const text = values.join("\n");

    previousText = getText();
    editor.innerText = text;
    originalText = text;
    correctedText = text;
    appliedCorrections.length = 0;

    if ($("saveColumnBtn")) $("saveColumnBtn").hidden = false;
    runCheck();
    setExcelStatus(`Loaded ${values.length} data row(s) from "${uploadedSheetName}". Correct the text, then save it back to the workbook.`);
    editor.focus();
  });

  $("saveColumnBtn")?.addEventListener("click", () => {
    if (!uploadedWorkbook || selectedColumnIndex < 0 || !uploadedRows.length) return;

    const correctedValues = getText().split(/\r?\n/);
    const headerRow = uploadedRows[0] || [];
    const sourceHeader = String(headerRow[selectedColumnIndex] ?? `Column ${selectedColumnIndex + 1}`);
    const correctedHeader = `${sourceHeader} (Corrected)`;

    let outputColumn = headerRow.findIndex(value =>
      String(value).trim().toLowerCase() === correctedHeader.toLowerCase()
    );

    if (outputColumn < 0) {
      outputColumn = Math.max(headerRow.length, ...uploadedRows.map(row => row.length), 0);
      headerRow[outputColumn] = correctedHeader;
      uploadedRows[0] = headerRow;
    }

    for (let rowIndex = 1; rowIndex < uploadedRows.length; rowIndex++) {
      uploadedRows[rowIndex][outputColumn] = correctedValues[rowIndex - 1] ?? "";
    }

    const worksheet = uploadedWorkbook.Sheets[uploadedSheetName];
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
    range.e.c = Math.max(range.e.c, outputColumn);
    range.e.r = Math.max(range.e.r, uploadedRows.length - 1);

    for (let rowIndex = 0; rowIndex < uploadedRows.length; rowIndex++) {
      const value = uploadedRows[rowIndex][outputColumn] ?? "";
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: outputColumn });
      worksheet[address] = { t: "s", v: String(value) };
    }

    worksheet["!ref"] = XLSX.utils.encode_range(range);
    renderExcelPreview();
    setExcelStatus(`Corrected values saved to the new "${correctedHeader}" column. Download the workbook to keep the changes.`);
  });

  $("downloadExcelBtn")?.addEventListener("click", () => {
    if (!uploadedWorkbook) return;
    try {
      XLSX.writeFile(uploadedWorkbook, "spell-check-corrected-workbook.xlsx");
      setExcelStatus("Corrected workbook downloaded.");
    } catch (error) {
      setExcelStatus(`Download failed: ${error.message || "Unable to create workbook."}`);
    }
  });

  $("clearExcelBtn")?.addEventListener("click", () => {
    resetExcelInterface(true);
  });

  /*
   * Initial setup.
   */
  originalText = getText();
  correctedText = originalText;

  runCheck();
})();
