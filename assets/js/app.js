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
    aswell: ["as well"]
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
      variants: ["opto coupler", "optocoupler"],
      preferred: "optocoupler"
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
      "opto coupler optocoupler non drive nondrive " +
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

      if (getLanguage() === "en_GB") {
        if (lower === uk) return [];
        if (lower === us) return [pair[0]];
      } else {
        if (lower === us) return [];
        if (lower === uk) return [pair[1]];
      }
    }

    return [];
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
   * Find suggestions in the local dictionary.
   */
  function dictionarySuggestions(word) {
    const dictionary = getDictionary();

    if (!dictionary) return [];

    const lower = word.toLowerCase();

    if (lower.length < 3) return [];

    const maxDistance = lower.length <= 4 ? 1 : 2;

    const candidates = [];

    for (const candidate of dictionary) {
      if (typeof candidate !== "string") continue;

      const item = candidate.toLowerCase();

      if (item === lower) continue;
      if (Math.abs(item.length - lower.length) > maxDistance) continue;

      const distance = levenshtein(lower, item);

      if (distance <= maxDistance) {
        candidates.push({
          word: item,
          distance
        });
      }
    }

    candidates.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }

      return a.word.localeCompare(b.word);
    });

    return [...new Set(
      candidates.slice(0, 6).map(item => item.word)
    )];
  }

  /*
   * Return spelling corrections for a single word.
   */
  function getSuggestions(word) {
    const lower = word.toLowerCase();

    if (
      personalDictionary.has(lower) ||
      ignoredWords.has(lower) ||
      technicalWords.has(lower)
    ) {
      return [];
    }

    // Explicit typo corrections take priority.
    if (spellingMap[lower]) {
      return spellingMap[lower];
    }

    // Apply selected US/UK spelling.
    const variantSuggestions = getVariantSuggestions(word);

    if (variantSuggestions.length) {
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
  function findPhraseAlternatives(text) {
    const results = [];

    phraseAlternatives.forEach(rule => {
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

    return filtered;
  }

  /*
   * Find actual spelling errors.
   */
  function findIssues(text) {
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

      if (currentVariant !== preferredVariant || separator !== "-") {
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

    return results.sort((a, b) => a.start - b.start);
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
      item => item.type === "spelling"
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
        item.type === "alternative"
          ? "optional-alternative"
          : "misspelled";

      const title =
        item.type === "alternative"
          ? "Click to view alternative forms"
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
      item => item.type === "spelling"
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

  if (!originalText) originalText = text;
  if (!correctedText) correctedText = text;

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
    const text = getText();

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
      button.textContent = preserveCase(issue.word, suggestion);

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

    const updated =
      text.slice(0, issue.start) +
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
          item.type === "spelling"
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
   * Editor input.
   */
  editor.addEventListener("input", () => {
    appliedCorrections.length = 0;
    correctedText = getText();

    if ($("autoCheck")?.checked) {
      runCheck();
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
   * Basic CSV upload handling.
   */
  $("excelFile")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!/\.csv$/i.test(file.name)) {
      if ($("excelStatus")) {
        $("excelStatus").textContent =
          "Please save the workbook as CSV, then upload the CSV file.";
      }

      if ($("excelPanel")) {
        $("excelPanel").hidden = false;
      }

      return;
    }

    const content = await file.text();

    if ($("fileName")) {
      $("fileName").textContent = file.name;
    }

    if ($("excelPanel")) {
      $("excelPanel").hidden = false;
    }

    if ($("excelStatus")) {
      $("excelStatus").textContent =
        "CSV selected. Spreadsheet column editing is not included in this build.";
    }

    window.toolboxUploadedCsv = content;
  });

  /*
   * Initial setup.
   */
  originalText = getText();
  correctedText = originalText;

  runCheck();
})();
