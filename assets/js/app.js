/* =========================================================
   TOOLBOX SPELL CHECKER — APP.JS
   Matched to the current index.html
   ========================================================= */

(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const editor = $("editor");
  const highlight = $("highlight");
  const popup = $("suggestionPopup");
  const language = $("language");

  if (!editor) {
    console.error("Spell Checker: #editor was not found.");
    return;
  }

  let issues = [];
  let previousText = "";
  let originalText = "";
  let correctedText = "";
  let activeIssue = null;

  const ignoredWords = new Set();
  const personalDictionary = new Set();

  const spellingMap = {
    recieve: ["receive", "received"],
    receieve: ["receive", "received"],
    eletrical: ["electrical"],
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
    housng: ["housing"]
  };

  const technicalWords = new Set([
    "filter", "unit", "fluid", "pressure", "equipment",
    "name", "hydraulic", "control", "system", "opto",
    "coupler", "phoenix", "contact", "type", "crossbar",
    "stainless", "steel", "bracket", "width", "thickness",
    "length", "range", "bar", "connector", "electrical",
    "pump", "assembly", "centrifugal", "bearing", "housing",
    "drawing", "number", "cable", "waterpump", "maintenance",
    "transmitter", "voltage", "current", "volts", "mm",
    "dc", "ac", "dek", "pn", "received", "receive"
  ]);

  try {
    const saved = JSON.parse(
      localStorage.getItem("toolboxSpellPersonalDictionary") || "[]"
    );
    saved.forEach(word => personalDictionary.add(String(word).toLowerCase()));
  } catch (error) {
    console.warn("Could not load personal dictionary.", error);
  }

  function preserveCase(source, replacement) {
    if (source === source.toUpperCase()) {
      return replacement.toUpperCase();
    }

    if (source[0] && source[0] === source[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }

    return replacement;
  }

  function getSuggestions(word) {
    const lower = word.toLowerCase();

    if (personalDictionary.has(lower) || ignoredWords.has(lower)) {
      return [];
    }

    if (technicalWords.has(lower)) {
      return [];
    }

    let suggestions = spellingMap[lower] || [];

    if (language?.value === "en_GB") {
      const ukMap = {
        color: ["colour"],
        favorite: ["favourite"],
        center: ["centre"],
        organize: ["organise"],
        analyze: ["analyse"]
      };
      suggestions = ukMap[lower] || suggestions;
    } else {
      const usMap = {
        colour: ["color"],
        favourite: ["favorite"],
        centre: ["center"],
        organise: ["organize"],
        analyse: ["analyze"]
      };
      suggestions = usMap[lower] || suggestions;
    }

    return suggestions;
  }

  function findIssues(text) {
    const found = [];
    const regex = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const suggestions = getSuggestions(match[0]);

      if (suggestions.length) {
        found.push({
          word: match[0],
          start: match.index,
          end: match.index + match[0].length,
          suggestions
        });
      }
    }

    return found;
  }

  function updateCounts() {
    const words = editor.value.match(
      /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu
    ) || [];

    if ($("wordCount")) {
      $("wordCount").textContent = `${words.length} words`;
    }

    if ($("errorCount")) {
      $("errorCount").textContent =
        `${issues.length} issue${issues.length === 1 ? "" : "s"}`;
    }

    if ($("status")) {
      $("status").textContent = editor.value.trim()
        ? `${issues.length} possible spelling issue${issues.length === 1 ? "" : "s"} found`
        : "Ready to check";
    }

    if ($("undoBtn")) {
      $("undoBtn").disabled = previousText === "";
    }
  }

  // Draw the spelling underlines using the overlay.
  // The textarea text itself remains editable.
  function renderHighlights() {
    if (!highlight) return;

    const text = editor.value;
    const fragments = [];
    let position = 0;

    issues.forEach(issue => {
      fragments.push(escapeHTML(text.slice(position, issue.start)));
      fragments.push(
        `<span class="misspelled" data-start="${issue.start}">` +
        escapeHTML(text.slice(issue.start, issue.end)) +
        "</span>"
      );
      position = issue.end;
    });

    fragments.push(escapeHTML(text.slice(position)));

    // Preserve whitespace/newlines so the overlay aligns with the textarea.
    highlight.innerHTML = fragments.join("").replace(/\n/g, "<br>");
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  }

  function escapeHTML(value) {
    return value.replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function renderPreviews() {
    originalText = editor.value;

    if (!correctedText || correctedText === originalText) {
      correctedText = originalText;
    }

    if ($("originalPreview")) {
      $("originalPreview").textContent =
        originalText || "Your original text will appear here.";
    }

    if ($("correctedPreview")) {
      $("correctedPreview").textContent =
        correctedText || "Accepted corrections will appear here.";
    }

    if ($("changeSummary")) {
      $("changeSummary").textContent =
        correctedText !== originalText
          ? "Corrections applied"
          : "No corrections applied";
    }
  }

  function runCheck() {
    issues = findIssues(editor.value);
    renderHighlights();
    renderPreviews();
    updateCounts();
    closePopup();
  }

  function closePopup() {
    if (!popup) return;
    popup.hidden = true;
    popup.replaceChildren();
    activeIssue = null;
  }

  function showPopup(issue) {
    if (!popup) return;

    activeIssue = issue;
    popup.replaceChildren();
    popup.hidden = false;

    const heading = document.createElement("div");
    heading.className = "suggestion-popup-heading";
    heading.textContent = `Suggestions for "${issue.word}"`;
    popup.appendChild(heading);

    issue.suggestions.forEach(suggestion => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion-chip";
      button.textContent = preserveCase(issue.word, suggestion);

      button.addEventListener("click", () => {
        replaceIssue(issue, suggestion);
      });

      popup.appendChild(button);
    });

    const actions = document.createElement("div");
    actions.className = "suggestion-popup-actions";

    const ignoreButton = document.createElement("button");
    ignoreButton.type = "button";
    ignoreButton.className = "suggestion-action";
    ignoreButton.textContent = "Ignore";
    ignoreButton.addEventListener("click", () => {
      ignoredWords.add(issue.word.toLowerCase());
      runCheck();
    });

    const dictionaryButton = document.createElement("button");
    dictionaryButton.type = "button";
    dictionaryButton.className = "suggestion-action";
    dictionaryButton.textContent = "Add to dictionary";
    dictionaryButton.addEventListener("click", () => {
      personalDictionary.add(issue.word.toLowerCase());

      try {
        localStorage.setItem(
          "toolboxSpellPersonalDictionary",
          JSON.stringify([...personalDictionary])
        );
      } catch (error) {
        console.warn("Could not save personal dictionary.", error);
      }

      runCheck();
    });

    actions.append(ignoreButton, dictionaryButton);
    popup.appendChild(actions);
  }

  function replaceIssue(issue, replacement) {
    previousText = editor.value;

    const correctedWord = preserveCase(issue.word, replacement);

    editor.value =
      editor.value.slice(0, issue.start) +
      correctedWord +
      editor.value.slice(issue.end);

    correctedText = editor.value;
    runCheck();
    editor.focus();
  }

  // Click a misspelled word in the overlay to open its suggestions.
  highlight?.addEventListener("click", event => {
    const wordElement = event.target.closest(".misspelled");
    if (!wordElement) return;

    const start = Number(wordElement.dataset.start);
    const issue = issues.find(item => item.start === start);

    if (issue) showPopup(issue);
  });

  // Keep overlay scrolling aligned with the textarea.
  editor.addEventListener("scroll", () => {
    if (!highlight) return;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  });

  editor.addEventListener("input", () => {
    correctedText = editor.value;

    if ($("autoCheck")?.checked) {
      runCheck();
    } else {
      updateCounts();
    }
  });

  $("checkBtn")?.addEventListener("click", runCheck);

  $("clearBtn")?.addEventListener("click", () => {
    previousText = editor.value;
    editor.value = "";
    correctedText = "";
    ignoredWords.clear();
    runCheck();
    editor.focus();
  });

  $("undoBtn")?.addEventListener("click", () => {
    if (!previousText) return;

    const currentText = editor.value;
    editor.value = previousText;
    previousText = currentText;
    correctedText = editor.value;

    runCheck();
  });

  language?.addEventListener("change", runCheck);

  $("autoCheck")?.addEventListener("change", () => {
    if ($("autoCheck").checked) runCheck();
  });

  // TXT upload.
  $("txtFile")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    editor.value = await file.text();
    correctedText = editor.value;

    if ($("fileName")) {
      $("fileName").textContent = file.name;
    }

    runCheck();
  });

  // Download current editor content as TXT.
  $("downloadTxtBtn")?.addEventListener("click", () => {
    downloadFile("spell-check-result.txt", editor.value, "text/plain");
  });

  // CSV download with original and corrected text.
  $("downloadTextCsvBtn")?.addEventListener("click", () => {
    const suffix = language?.value === "en_GB" ? "UK" : "US";

    const rows = [
      ["ORIGINAL_TEXT", `CORRECTED_TEXT_${suffix}`],
      [originalText, correctedText || originalText]
    ];

    const csv = "\uFEFF" + rows
      .map(row => row.map(csvEscape).join(","))
      .join("\r\n");

    downloadFile(`spell-check-result-${suffix}.csv`, csv, "text/csv");
  });

  function csvEscape(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
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

  // Remove controls requested for this simplified interface.
  $("copyBtn")?.remove();
  $("downloadExcelTextBtn")?.remove();
  document.querySelector(".local-badge")?.remove();

  // The Excel/CSV upload panel remains separate.
  // Spreadsheet export is not connected to the text-only CSV button.

  // Switch between preview views.
  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-view]").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      const comparison = $("comparison");
      if (!comparison) return;

      comparison.classList.toggle(
        "single-original",
        button.dataset.view === "original"
      );

      comparison.classList.toggle(
        "single-corrected",
        button.dataset.view === "corrected"
      );
    });
  });

  // Initialize.
  correctedText = editor.value;
  runCheck();
})();
