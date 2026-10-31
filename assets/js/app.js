/* =========================================================
   TOOLBOX SPELL CHECKER
   UI and basic spelling workflow
   ========================================================= */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const editor = $("editor");
  const language = $("language");
  const autoCheck = $("autoCheck");
  const checkBtn = $("checkBtn");
  const clearBtn = $("clearBtn");
  const undoBtn = $("undoBtn");
  const downloadTxtBtn = $("downloadTxtBtn");
  const downloadCsvBtn =
    $("downloadTextCsvBtn") || $("downloadCsvBtn");

  if (!editor) {
    console.error(
      "Spell Checker: Cannot find #editor. Check index.html."
    );
    return;
  }

  let originalText = "";
  let correctedText = "";
  let previousText = "";
  let issues = [];
  let ignoredWords = new Set();
  let personalDictionary = new Set();

  // Temporary fallback dictionary.
  // We will replace/extend this when improving the spell model.
  const spellingMap = {
    recieve: ["receive", "received"],
    receieve: ["receive", "received"],
    eletrical: ["electrical"],
    ele trical: ["electrical"],
    connetor: ["connector"],
    dimensoin: ["dimension", "dimensions"],
    stainles: ["stainless"],
    bracet: ["bracket"],
    maintenence: ["maintenance"],
    maintanence: ["maintenance"],
    presssure: ["pressure"],
    calbe: ["cable"],
    taxt: ["text", "tax"],
    teaxt: ["text"],
    teh: ["the"],
    adn: ["and"],
    recieveing: ["receiving"],
    seperate: ["separate"],
    occured: ["occurred"],
    definately: ["definitely"],
    enviroment: ["environment"],
    compatable: ["compatible"],
    lenght: ["length"],
    widht: ["width"],
    thikness: ["thickness"],
    transmiter: ["transmitter"],
    assembely: ["assembly"],
    centifugal: ["centrifugal"],
    housng: ["housing"]
  };

  // Words commonly used in technical descriptions.
  // These are protected from the temporary fallback checker.
  const technicalWords = new Set([
    "filter", "unit", "fluid", "pressure", "equipment",
    "name", "hydraulic", "control", "system", "opto",
    "coupler", "phoenix", "contact", "type", "crossbar",
    "stainless", "steel", "bracket", "width", "thickness",
    "length", "range", "bar", "connector", "electrical",
    "pump", "assembly", "centrifugal", "bearing", "housing",
    "drawing", "number", "cable", "text", "waterpump",
    "maintenance", "transmitter", "received", "receive",
    "voltage", "current", "volts", "mm", "dc", "ac",
    "p", "n", "de", "dek", "pn"
  ]);

  // Load the personal dictionary saved in this browser.
  try {
    const saved = JSON.parse(
      localStorage.getItem("toolboxSpellPersonalDictionary") || "[]"
    );

    saved.forEach(word => personalDictionary.add(String(word).toLowerCase()));
  } catch (error) {
    console.warn("Could not load personal dictionary.", error);
  }

  function getLanguageSuffix() {
    return language?.value === "en_GB" ? "UK" : "US";
  }

  function wordCount(text) {
    const matches = text.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu);
    return matches ? matches.length : 0;
  }

  function updateWordCount() {
    const count = wordCount(editor.value);
    const target = $("wordCount");

    if (target) {
      target.textContent = `${count} words`;
    }
  }

  function getSuggestions(word) {
    const lower = word.toLowerCase();

    // Respect the user's personal dictionary.
    if (personalDictionary.has(lower)) return [];

    // Respect words ignored during this session.
    if (ignoredWords.has(lower)) return [];

    // Do not flag known technical vocabulary.
    if (technicalWords.has(lower)) return [];

    let suggestions = spellingMap[lower] || [];

    // A few common US/UK spelling variants.
    if (language?.value === "en_GB") {
      if (lower === "color") suggestions = ["colour"];
      if (lower === "favorite") suggestions = ["favourite"];
      if (lower === "center") suggestions = ["centre"];
      if (lower === "organize") suggestions = ["organise"];
      if (lower === "analyze") suggestions = ["analyse"];
      if (lower === "license" && word === "licence") suggestions = ["licence"];
    } else {
      if (lower === "colour") suggestions = ["color"];
      if (lower === "favourite") suggestions = ["favorite"];
      if (lower === "centre") suggestions = ["center"];
      if (lower === "organise") suggestions = ["organize"];
      if (lower === "analyse") suggestions = ["analyze"];
    }

    return suggestions;
  }

  function preserveCase(original, replacement) {
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }

    if (
      original.length > 0 &&
      original[0] === original[0].toUpperCase()
    ) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }

    return replacement;
  }

  function findIssues(text) {
    const found = [];
    const regex = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const word = match[0];
      const suggestions = getSuggestions(word);

      if (suggestions.length) {
        found.push({
          word,
          start: match.index,
          end: match.index + word.length,
          suggestions
        });
      }
    }

    return found;
  }

  function ensureInlineSuggestions() {
    let panel = $("inlineSuggestions");

    if (!panel) {
      panel = document.createElement("div");
      panel.id = "inlineSuggestions";
      panel.className = "inline-suggestions";
      panel.setAttribute("aria-live", "polite");

      const editorArea = editor.closest(".editor-area") || editor.parentElement;
      if (editorArea) {
        editorArea.insertAdjacentElement("afterend", panel);
      } else {
        editor.insertAdjacentElement("afterend", panel);
      }
    }

    return panel;
  }

  function applyCorrection(issue, replacement) {
    previousText = editor.value;

    const corrected = preserveCase(issue.word, replacement);

    editor.value =
      editor.value.slice(0, issue.start) +
      corrected +
      editor.value.slice(issue.end);

    runCheck();
    updateUndoState();
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function ignoreWord(word) {
    ignoredWords.add(word.toLowerCase());
    runCheck();
  }

  function addToDictionary(word) {
    personalDictionary.add(word.toLowerCase());

    try {
      localStorage.setItem(
        "toolboxSpellPersonalDictionary",
        JSON.stringify([...personalDictionary])
      );
    } catch (error) {
      console.warn("Could not save personal dictionary.", error);
    }

    runCheck();
  }

  function renderIssues() {
    const panel = ensureInlineSuggestions();
    panel.replaceChildren();

    if (issues.length === 0) {
      const message = document.createElement("p");
      message.className = "spell-success";
      message.textContent = editor.value.trim()
        ? "No issues found by the current spelling rules."
        : "Paste or type text above, then check spelling.";

      panel.appendChild(message);
      return;
    }

    const heading = document.createElement("div");
    heading.className = "inline-suggestions-heading";
    heading.textContent =
      `${issues.length} possible spelling issue${issues.length === 1 ? "" : "s"}`;

    panel.appendChild(heading);

    issues.forEach(issue => {
      const row = document.createElement("div");
      row.className = "inline-suggestion-row";

      const word = document.createElement("strong");
      word.className = "misspelled-word";
      word.textContent = issue.word;
      row.appendChild(word);

      issue.suggestions.forEach(suggestion => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "suggestion-chip";
        button.textContent = preserveCase(issue.word, suggestion);

        button.addEventListener("click", () => {
          applyCorrection(issue, suggestion);
        });

        row.appendChild(button);
      });

      const ignore = document.createElement("button");
      ignore.type = "button";
      ignore.className = "suggestion-action";
      ignore.textContent = "Ignore";
      ignore.addEventListener("click", () => ignoreWord(issue.word));
      row.appendChild(ignore);

      const add = document.createElement("button");
      add.type = "button";
      add.className = "suggestion-action";
      add.textContent = "Add to dictionary";
      add.addEventListener("click", () => addToDictionary(issue.word));
      row.appendChild(add);

      panel.appendChild(row);
    });
  }

  function renderComparison() {
    const comparison = $("comparison");
    if (!comparison) return;

    const panes = comparison.querySelectorAll(".compare-pane");

    if (panes.length >= 2) {
      const originalPane = panes[0].querySelector(".compare-text");
      const correctedPane = panes[1].querySelector(".compare-text");

      if (originalPane) {
        originalPane.textContent = originalText || "Your original text will appear here.";
      }

      if (correctedPane) {
        correctedPane.textContent = correctedText || "Accepted corrections will appear here.";
      }
    }

    const summary = $("changeSummary");
    if (summary) {
      summary.textContent =
        correctedText && correctedText !== originalText
          ? "Corrections applied"
          : "No corrections applied";
    }
  }

  function updateUndoState() {
    if (undoBtn) {
      undoBtn.disabled = !previousText;
    }
  }

  function runCheck() {
    originalText = editor.value;
    correctedText = editor.value;
    issues = findIssues(editor.value);

    updateWordCount();

    const status = $("status");
    if (status) {
      status.textContent = editor.value.trim()
        ? `${issues.length} possible spelling issue${issues.length === 1 ? "" : "s"} found`
        : "Ready to check";
    }

    const errorCount = $("errorCount");
    if (errorCount) {
      errorCount.textContent = String(issues.length);
    }

    renderIssues();
    renderComparison();
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], {
      type: `${mimeType};charset=utf-8`
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadTxt() {
    downloadFile(
      "spell-check-result.txt",
      editor.value,
      "text/plain"
    );
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadCsv() {
    const suffix = getLanguageSuffix();
    const rows = [
      ["ORIGINAL_TEXT", `CORRECTED_TEXT_${suffix}`],
      [editor.value, correctedText || editor.value]
    ];

    const csv = rows
      .map(row => row.map(csvEscape).join(","))
      .join("\r\n");

    // UTF-8 BOM improves compatibility with Excel.
    downloadFile(
      `spell-check-result-${suffix}.csv`,
      "\uFEFF" + csv,
      "text/csv"
    );
  }

  function clearText() {
    previousText = editor.value;
    editor.value = "";
    originalText = "";
    correctedText = "";
    issues = [];
    ignoredWords.clear();

    updateWordCount();
    runCheck();
    updateUndoState();
    editor.focus();
  }

  function undo() {
    if (!previousText) return;

    const current = editor.value;
    editor.value = previousText;
    previousText = current;

    runCheck();
    updateUndoState();
  }

  function removeUnwantedControls() {
    // Remove the requested controls from the interface.
    [
      "copyBtn",
      "copyCorrectedBtn",
      "downloadExcelBtn",
      "downloadExcel",
      "localBadge",
      "processingBadge"
    ].forEach(id => {
      const element = $(id);
      if (element) element.remove();
    });

    // Hide buttons by their visible text if the IDs differ.
    document.querySelectorAll("button").forEach(button => {
      const text = button.textContent.trim().toLowerCase();

      if (
        text === "copy corrected" ||
        text === "download excel" ||
        text === "download corrected excel" ||
        text === "local processing"
      ) {
        button.remove();
      }
    });

    document.querySelectorAll("*").forEach(element => {
      if (element.children.length === 0) {
        const text = element.textContent.trim().toLowerCase();

        if (text === "local processing") {
          element.remove();
        }
      }
    });
  }

  // Main controls.
  checkBtn?.addEventListener("click", runCheck);
  clearBtn?.addEventListener("click", clearText);
  undoBtn?.addEventListener("click", undo);
  downloadTxtBtn?.addEventListener("click", downloadTxt);
  downloadCsvBtn?.addEventListener("click", downloadCsv);

  editor.addEventListener("input", () => {
    updateWordCount();

    if (autoCheck?.checked) {
      runCheck();
    }
  });

  language?.addEventListener("change", runCheck);

  autoCheck?.addEventListener("change", () => {
    if (autoCheck.checked) runCheck();
  });

  // TXT upload.
  $("txtFile")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    editor.value = await file.text();

    const fileName = $("fileName");
    if (fileName) fileName.textContent = file.name;

    runCheck();
  });

  // Keep the page functional if an Excel upload is selected:
  // CSV/XLSX processing needs its own implementation.
  $("excelFile")?.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = $("fileName");
    if (fileName) fileName.textContent = file.name;

    const status = $("status");
    if (status) {
      status.textContent =
        "File selected. Spreadsheet processing is handled separately.";
    }
  });

  // Results tabs.
  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-view]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      const view = button.dataset.view;
      const comparison = $("comparison");
      if (!comparison) return;

      comparison.classList.toggle("single-original", view === "original");
      comparison.classList.toggle("single-corrected", view === "corrected");
    });
  });

  removeUnwantedControls();
  updateWordCount();
  runCheck();
  updateUndoState();
})();
