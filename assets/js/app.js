/* Toolbox Spell Checker — single editable surface */
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

  const ignoredWords = new Set();
  const personalDictionary = new Set();

  // Common spelling mistakes and their suggested corrections.
  const spellingMap = {
    recieve: ["receive"],
    receieve: ["receive"],
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
    housng: ["housing"],
    waterpump: ["water pump"]
  };

  /*
   * Optional spelling alternatives.
   *
   * These are NOT spelling errors.
   * They are displayed with a blue dotted underline.
   * Clicking them opens a popup with alternative forms.
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
    }
  ];

  // Words commonly found in technical descriptions.
  const technicalWords = new Set(
    (
      "filter unit fluid pressure equipment name hydraulic control system " +
      "phoenix contact type crossbar stainless steel bracket width thickness " +
      "length range bar connector electrical pump assembly centrifugal bearing " +
      "housing drawing number cable maintenance transmitter voltage current " +
      "volts mm dc ac dek pn received receive 24 0 10"
    ).split(/\s+/)
  );

  // Load the user's personal dictionary from this browser.
  try {
    const saved = JSON.parse(
      localStorage.getItem("toolboxSpellPersonalDictionary") || "[]"
    );

    saved.forEach(word => {
      personalDictionary.add(String(word).toLowerCase());
    });
  } catch (error) {
    // Continue if local storage is unavailable or invalid.
  }

  const getText = () => editor.innerText.replace(/\r/g, "");

  function preserveCase(source, replacement) {
    if (source === source.toUpperCase()) {
      return replacement.toUpperCase();
    }

    if (source[0] === source[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }

    return replacement;
  }

  function escapeHTML(text) {
    return text.replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
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

    let suggestions = spellingMap[lower] || [];

    const usSpellings = {
      colour: ["color"],
      favourite: ["favorite"],
      centre: ["center"],
      organise: ["organize"],
      analyse: ["analyze"]
    };

    const ukSpellings = {
      color: ["colour"],
      favorite: ["favourite"],
      center: ["centre"],
      organize: ["organise"],
      analyze: ["analyse"]
    };

    if (language?.value === "en_GB") {
      suggestions = ukSpellings[lower] || suggestions;
    } else {
      suggestions = usSpellings[lower] || suggestions;
    }

    return suggestions;
  }

  /*
   * Identify optional phrase alternatives.
   *
   * These alternatives are not included in the red spelling-error count.
   */
  function findPhraseAlternatives(text) {
    const results = [];

    phraseAlternatives.forEach(rule => {
      rule.variants.forEach(variant => {
        const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

    // If alternatives overlap, keep only the longest match at each position.
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

    const regex =
      /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;

    let match;

    while ((match = regex.exec(text)) !== null) {
      const suggestions = getSuggestions(match[0]);

      if (suggestions.length) {
        results.push({
          word: match[0],
          start: match.index,
          end: match.index + match[0].length,
          suggestions,
          type: "spelling"
        });
      }
    }

    return results;
  }

  /*
   * Preserve the current caret while rendering the editor.
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
   * Render the text with different styles:
   *
   * Red underline   = spelling error
   * Blue dotted line = optional spelling alternative
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

      // Prefer longer phrases when two markers begin at the same position.
      return (b.end - b.start) - (a.end - a.start);
    });

    let html = "";
    let position = 0;

    for (const item of allMarkers) {
      // Ignore overlapping markers.
      if (item.start < position) continue;

      html += escapeHTML(text.slice(position, item.start));

      const className =
        item.type === "alternative"
          ? "optional-alternative"
          : "misspelled";

      const title =
        item.type === "alternative"
          ? "Click to view alternative spellings"
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
   * Update the word count, error count, and status text.
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
   * Update the original and corrected preview panes.
   */
  function renderPreviews() {
    const text = getText();

    originalText = text;

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

  /*
   * Close and clear the suggestion popup.
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
   *
   * Optional phrase alternatives are visual markers only.
   * They do not increase the spelling-error count.
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
   * Show spelling suggestions or optional phrase alternatives.
   */
  function showPopup(issue, anchor) {
    if (!popup) return;

    activeIssue = issue;
    popup.replaceChildren();
    popup.hidden = false;

    const title = document.createElement("div");
    title.className = "suggestion-popup-heading";

    title.textContent =
      issue.type === "alternative"
        ? `${issue.word} — alternative spellings`
        : `${issue.word} — choose a correction`;

    popup.append(title);

    issue.suggestions.forEach(suggestion => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "suggestion-chip";
      button.textContent = preserveCase(issue.word, suggestion);

      button.addEventListener("click", () => {
        replaceIssue(issue, suggestion);
      });

      popup.append(button);
    });

    /*
     * Ignore and Add to dictionary are text-style actions,
     * not spelling suggestion buttons.
     */
    if (issue.type === "spelling") {
      const actions = document.createElement("div");
      actions.className = "suggestion-popup-actions";

      const ignore = document.createElement("button");

      ignore.type = "button";
      ignore.className = "suggestion-action";
      ignore.textContent = "Ignore";

      ignore.addEventListener("click", () => {
        ignoredWords.add(issue.word.toLowerCase());
        runCheck();
      });

      const add = document.createElement("button");

      add.type = "button";
      add.className = "suggestion-action";
      add.textContent = "Add to dictionary";

      add.addEventListener("click", () => {
        personalDictionary.add(issue.word.toLowerCase());

        try {
          localStorage.setItem(
            "toolboxSpellPersonalDictionary",
            JSON.stringify([...personalDictionary])
          );
        } catch (error) {
          // The correction still works for the current session.
        }

        runCheck();
      });

      actions.append(ignore, add);
      popup.append(actions);
    }

    const close = document.createElement("button");

    close.type = "button";
    close.className = "suggestion-action";
    close.textContent = "Close";
    close.addEventListener("click", closePopup);

    popup.append(close);

    if (anchor && $("editorWrap")) {
      const rect = anchor.getBoundingClientRect();
      const wrap = $("editorWrap").getBoundingClientRect();

      popup.style.position = "absolute";
      popup.style.left =
        Math.max(8, Math.min(rect.left - wrap.left, wrap.width - 250)) +
        "px";

      popup.style.top =
        Math.min(rect.bottom - wrap.top + 6, wrap.height - 120) +
        "px";
    }
  }

  /*
   * Replace the selected spelling or phrase.
   */
  function replaceIssue(issue, replacement) {
    previousText = getText();

    const text = getText();
    const replacementText = preserveCase(issue.word, replacement);

    correctedText =
      text.slice(0, issue.start) +
      replacementText +
      text.slice(issue.end);

    editor.innerText = correctedText;

    runCheck();
    editor.focus();
  }

  /*
   * Clicking a marked word opens its popup.
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
        item => item.start === start && item.type === "spelling"
      );
    }

    if (issue) {
      showPopup(issue, marker);
    }
  });

  /*
   * Close the popup when clicking outside the popup and editor.
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
   * Typing and auto-check toggle.
   */
  editor.addEventListener("input", () => {
    correctedText = getText();

    if ($("autoCheck")?.checked) {
      runCheck();
    } else {
      updateCounts();
    }
  });

  $("checkBtn")?.addEventListener("click", runCheck);

  $("clearBtn")?.addEventListener("click", () => {
    previousText = getText();
    editor.innerText = "";
    correctedText = "";
    ignoredWords.clear();

    runCheck();
    editor.focus();
  });

  $("undoBtn")?.addEventListener("click", () => {
    if (!previousText) return;

    const currentText = getText();

    editor.innerText = previousText;
    previousText = currentText;
    correctedText = getText();

    runCheck();
  });

  language?.addEventListener("change", runCheck);

  $("autoCheck")?.addEventListener("change", () => {
    if ($("autoCheck").checked) {
      runCheck();
    }
  });

  /*
   * Upload a TXT file.
   */
  $("txtFile")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    editor.innerText = await file.text();
    correctedText = getText();

    if ($("fileName")) {
      $("fileName").textContent = file.name;
    }

    runCheck();
  });

  /*
   * Download corrected text as TXT.
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
    const suffix = language?.value === "en_GB" ? "UK" : "US";

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
   * Original / Corrected / Compare view controls.
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
   * This does not implement workbook column editing.
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

    await file.text();

    if ($("fileName")) {
      $("fileName").textContent = file.name;
    }

    if ($("excelPanel")) {
      $("excelPanel").hidden = false;
    }

    if ($("excelStatus")) {
      $("excelStatus").textContent =
        "CSV selected. Use the text editor for text-only checking; " +
        "spreadsheet column processing is not included in this build.";
    }
  });

  correctedText = getText();
  runCheck();
})();
