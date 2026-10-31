(() => {
  "use strict";

  const $ = id => document.getElementById(id);

  const editor = $("editor");
  const language = $("language");
  const suggestions = $("suggestions");
  const highlight = $("highlight");
  const workspace = document.querySelector(".workspace");

  const customWords = new Set(
    JSON.parse(localStorage.getItem("spell-local-words") || "[]")
  );

  let issues = [];
  let ignored = new Set();
  let undoStack = [];
  let view = "compare";
  let timer = null;

  let csvRows = null;
  let csvFileName = "corrected.csv";
  let csvOutput = null;

  const common = window.LOCAL_SPELL_WORDS || new Set();

  const explicit = {
    calbe: ["cable"],
    cble: ["cable"],
    taxt: ["text"],
    teaxt: ["text"],
    taxxt: ["text"],
    recieved: ["received"],
    recieve: ["receive", "received"],
    recived: ["received"],
    documant: ["document"],
    documnt: ["document"],
    eletrical: ["electrical"],
    eletrical: ["electrical"],
    eletricl: ["electrical"],
    connetor: ["connector"],
    conecter: ["connector"],
    conector: ["connector"],
    demension: ["dimension"],
    dimensoin: ["dimension"],
    dimensons: ["dimensions"],
    stainles: ["stainless"],
    stainlessteel: ["stainless steel"],
    braket: ["bracket"],
    maintenence: ["maintenance"],
    maintanance: ["maintenance"],
    presssure: ["pressure"],
    presure: ["pressure"],
    equipement: ["equipment"],
    equpment: ["equipment"],
    instalation: ["installation"],
    instalation: ["installation"],
    operaton: ["operation"],
    dammaged: ["damaged"],
    seperated: ["separated"],
    seperate: ["separate"],
    neccessary: ["necessary"],
    tommorow: ["tomorrow"],
    purchse: ["purchase"],
    teh: ["the"],
    occured: ["occurred"],
    adress: ["address"],
    enviroment: ["environment"],
    definate: ["definite"],
    acheive: ["achieve"],
    begining: ["beginning"],
    wierd: ["weird"],
    untill: ["until"],
    goverment: ["government"]
  };

  const usOnly = {
    colour: "color",
    colours: "colors",
    organise: "organize",
    organised: "organized",
    organising: "organizing",
    organisation: "organization",
    centre: "center",
    theatre: "theater",
    licence: "license",
    defence: "defense",
    travelling: "traveling",
    cancelled: "canceled",
    grey: "gray"
  };

  const ukOnly = Object.fromEntries(
    Object.entries(usOnly).map(([uk, us]) => [us, uk])
  );

  const frequent = new Set(
    (
      "the be to of and a in that have i it for not on with he as you do at " +
      "this but his by from they we say her she or an will my one all would " +
      "there their what so up out if about who get which go me when make can " +
      "like time no just him know take people into year your good some could " +
      "them see other than then now look only come its over think also back " +
      "after use two how our work first well way even new want because any " +
      "these give day most us is are was were been being has had did said " +
      "each much where why right still find here thing many those help put " +
      "different away again place case point group problem fact cable text " +
      "receive received document electrical necessary tomorrow purchase " +
      "bracket brackets dimension dimensions stainless steel connector " +
      "connectors description equipment unit valve filter fluid pressure " +
      "part number model drawing position length width thickness installation " +
      "operation maintenance damaged replaced color colour center centre " +
      "theater theatre license licence defense defence traveling travelling " +
      "canceled cancelled organization organisation organize organise " +
      "gray grey pump bearing housing drawing assembly pressure transmitter"
    ).split(/\s+/)
  );

  // ---------------------------------------------------------
  // Tokenization and spelling helpers
  // ---------------------------------------------------------

  function wordTokens(text) {
    return [...text.matchAll(
      /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu
    )].map(match => ({
      word: match[0],
      start: match.index,
      end: match.index + match[0].length
    }));
  }

  function protectedToken(word) {
    // Preserve part numbers, model numbers and engineering identifiers.
    if (/\d/.test(word)) return true;
    if (/[_/\\.-]/.test(word)) return true;

    // Do not flag short uppercase acronyms.
    if (/^[A-Z]{2,6}$/.test(word)) return true;

    return false;
  }

  function caseLike(source, target) {
    if (source.toUpperCase() === source) {
      return target.toUpperCase();
    }

    if (
      source[0] &&
      source[0] === source[0].toUpperCase()
    ) {
      return target[0].toUpperCase() + target.slice(1);
    }

    return target;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function countWords(text) {
    return wordTokens(text).length;
  }

  function spelling(word) {
    const lower = word.toLowerCase();

    if (customWords.has(lower)) {
      return { correct: true, suggestions: [] };
    }

    if (frequent.has(lower)) {
      return { correct: true, suggestions: [] };
    }

    if (common.has(lower)) {
      return { correct: true, suggestions: [] };
    }

    const localeMap =
      language.value === "en_US" ? usOnly : ukOnly;

    if (localeMap[lower]) {
      return {
        correct: false,
        suggestions: [caseLike(word, localeMap[lower])]
      };
    }

    if (explicit[lower]) {
      return {
        correct: false,
        suggestions: explicit[lower].map(
          suggestion => caseLike(word, suggestion)
        )
      };
    }

    const candidates = new Set();

    // Use the bundled dictionary for nearby spelling suggestions.
    for (const candidate of common) {
      if (!candidate || candidate.length > 32) continue;

      if (Math.abs(candidate.length - lower.length) > 2) {
        continue;
      }

      if (editDistance(lower, candidate, 2) <= 2) {
        candidates.add(candidate);
      }
    }

    const ranked = [...candidates]
      .map(candidate => ({
        word: candidate,
        distance: editDistance(lower, candidate, 2),
        frequent: frequent.has(candidate) ? 0 : 1
      }))
      .sort((a, b) =>
        a.distance - b.distance ||
        a.frequent - b.frequent ||
        a.word.localeCompare(b.word)
      )
      .slice(0, 5)
      .map(item => caseLike(word, item.word));

    // Unknown words are not automatically treated as misspellings
    // unless the local dictionary can provide likely alternatives.
    if (!ranked.length) {
      return { correct: true, suggestions: [] };
    }

    return { correct: false, suggestions: ranked };
  }

  function editDistance(a, b, limit = 2) {
    if (Math.abs(a.length - b.length) > limit) {
      return limit + 1;
    }

    const previous = Array.from(
      { length: b.length + 1 },
      (_, index) => index
    );

    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      let rowMin = i;

      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + cost
        );

        rowMin = Math.min(rowMin, current[j]);
      }

      if (rowMin > limit) return limit + 1;

      for (let j = 0; j <= b.length; j++) {
        previous[j] = current[j] ?? limit + 1;
      }
    }

    return previous[b.length];
  }

  // ---------------------------------------------------------
  // Original text and suggestions layout
  // ---------------------------------------------------------

  function fitEditorColumn() {
  const workspace = document.querySelector(".workspace");
  if (!workspace) return;

  // Equal-width columns are controlled by CSS.
  // Do not dynamically resize either column based on text length.
  workspace.style.removeProperty("grid-template-columns");
}

  function syncPanelHeight() {
    const editorCard = document.querySelector(".editor-card");
    const suggestionsCard = document.querySelector(".suggestions-card");

    if (!editorCard || !suggestionsCard) return;

    // Keep the two cards equal in height.
    suggestionsCard.style.height = `${editorCard.offsetHeight}px`;

    // The suggestions content scrolls inside the card.
    suggestions.style.height = "auto";
  }

  function syncVerticalScroll(source) {
    if (source === editor) {
      suggestions.scrollTop = editor.scrollTop;
    } else {
      editor.scrollTop = suggestions.scrollTop;
    }

    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  }

  function renderHighlights() {
    const text = editor.value;
    let output = "";
    let position = 0;

    for (const issue of issues) {
      output += escapeHTML(text.slice(position, issue.start));

      output +=
        `<span class="misspelled">` +
        `${escapeHTML(text.slice(issue.start, issue.end))}` +
        `</span>`;

      position = issue.end;
    }

    output += escapeHTML(text.slice(position));

    if (text.endsWith("\n")) output += " ";

    highlight.innerHTML = output;

    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  }

  // ---------------------------------------------------------
  // Spelling check
  // ---------------------------------------------------------

  function check() {
    const text = editor.value;

    issues = [];

    for (const token of wordTokens(text)) {
      if (protectedToken(token.word)) continue;

      if (ignored.has(token.word.toLowerCase())) continue;

      const result = spelling(token.word);

      if (!result.correct) {
        issues.push({
          ...token,
          suggestions: result.suggestions
        });
      }
    }

    $("wordCount").textContent = `${countWords(text)} words`;
    $("errorCount").textContent = issues.length;

    renderHighlights();
    renderSuggestions();
    renderCompare();
    fitEditorColumn();

    requestAnimationFrame(() => {
      syncPanelHeight();
      syncVerticalScroll(editor);
    });

    $("status").textContent =
      `${issues.length} possible spelling ` +
      `${issues.length === 1 ? "issue" : "issues"} found`;
  }

  function renderSuggestions() {
    const text = editor.value;
    const lines = text.split("\n");

    if (!issues.length) {
      suggestions.innerHTML = `
        <div class="empty">
          <div class="empty-aa">✓</div>
          <b>No spelling issues found</b>
          <p>
            No likely misspellings were found using the bundled
            offline dictionary.
          </p>
        </div>
      `;
      return;
    }

    const lineStarts = [];
    let cursor = 0;

    for (const line of lines) {
      lineStarts.push(cursor);
      cursor += line.length + 1;
    }

    const lineHTML = lines.map((line, index) => {
      const start = lineStarts[index];
      const end = start + line.length;

      const lineIssues = issues.filter(issue =>
        issue.start >= start && issue.start < end
      );

      if (!lineIssues.length) {
        return `
          <div class="suggestion-line empty-line"
               aria-hidden="true"></div>
        `;
      }

      const issueHTML = lineIssues.map(issue => {
        const options = issue.suggestions.length
          ? issue.suggestions.map(word => `
              <button
                class="suggestion-option"
                data-action="replace"
                data-start="${issue.start}"
                data-end="${issue.end}"
                data-word="${escapeHTML(word)}"
                title="Replace ${escapeHTML(issue.word)} with ${escapeHTML(word)}"
              >${escapeHTML(word)}</button>
            `).join("")
          : `<span class="subtle">No suggestions</span>`;

        return `
          <span class="inline-issue">
            <b class="bad-word">${escapeHTML(issue.word)}</b>

            <span class="suggestion-list">
              ${options}
            </span>

            <span class="inline-actions">
              <button
                class="mini-link"
                data-action="ignore"
                data-word="${escapeHTML(issue.word)}"
              >Ignore</button>

              <button
                class="mini-link"
                data-action="add"
                data-word="${escapeHTML(issue.word)}"
              >Add to dictionary</button>
            </span>
          </span>
        `;
      }).join("");

      return `<div class="suggestion-line">${issueHTML}</div>`;
    }).join("");

    suggestions.innerHTML = `
      <div class="aligned-suggestions">${lineHTML}</div>
    `;
  }

  // ---------------------------------------------------------
  // Before and after preview
  // ---------------------------------------------------------

  function getCorrectedText() {
    // Accepted replacements are applied directly to the editor.
    return editor.value;
  }

  function renderCompare() {
    const original = editor.value;
    const corrected = getCorrectedText();

    const pane = (label, text) => `
      <div class="compare-pane">
        <small>${label}</small>
        <p class="compare-text">${escapeHTML(
          text || "Nothing to show yet."
        )}</p>
      </div>
    `;

    const comparison = $("comparison");

    if (view === "original") {
      comparison.innerHTML = pane("ORIGINAL", original);
      comparison.classList.add("single-pane");
    } else if (view === "corrected") {
      comparison.innerHTML = pane("CORRECTED PREVIEW", corrected);
      comparison.classList.add("single-pane");
    } else {
      comparison.innerHTML =
        pane("ORIGINAL", original) +
        pane("CORRECTED PREVIEW", corrected);

      comparison.classList.remove("single-pane");
    }

    $("changeSummary").textContent =
      undoStack.length
        ? `${undoStack.length} correction action(s) available to undo`
        : "No corrections applied";

    $("undoBtn").disabled = undoStack.length === 0;
  }

  function replaceWord(start, end, replacement) {
    undoStack.push(editor.value);

    editor.value =
      editor.value.slice(0, start) +
      replacement +
      editor.value.slice(end);

    ignored.clear();

    check();
  }

  // ---------------------------------------------------------
  // Suggestions actions
  // ---------------------------------------------------------

  suggestions.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const word = button.dataset.word || "";

    if (action === "replace") {
      replaceWord(
        Number(button.dataset.start),
        Number(button.dataset.end),
        word
      );
    }

    if (action === "ignore") {
      ignored.add(word.toLowerCase());
      check();
    }

    if (action === "add") {
      customWords.add(word.toLowerCase());

      localStorage.setItem(
        "spell-local-words",
        JSON.stringify([...customWords])
      );

      check();
    }
  });

  // ---------------------------------------------------------
  // Text input and scrolling
  // ---------------------------------------------------------

  editor.addEventListener("input", () => {
    $("wordCount").textContent = `${countWords(editor.value)} words`;

    if ($("autoCheck").checked) {
      clearTimeout(timer);
      timer = setTimeout(check, 250);
    } else {
      renderCompare();
      fitEditorColumn();
      syncPanelHeight();
    }
  });

  editor.addEventListener("scroll", () => {
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;

    suggestions.scrollTop = editor.scrollTop;
  });

  suggestions.addEventListener("scroll", () => {
    if (Math.abs(suggestions.scrollTop - editor.scrollTop) > 1) {
      editor.scrollTop = suggestions.scrollTop;
      highlight.scrollTop = editor.scrollTop;
      highlight.scrollLeft = editor.scrollLeft;
    }
  });

  window.addEventListener("resize", () => {
    fitEditorColumn();
    function syncVerticalScroll(source) {
  const suggestions = $("suggestions");
  const highlight = $("highlight");

  if (source === editor) {
    suggestions.scrollTop = editor.scrollTop;
  } else {
    editor.scrollTop = suggestions.scrollTop;
  }

  highlight.scrollTop = editor.scrollTop;
  highlight.scrollLeft = editor.scrollLeft;
}
  });

  // Keep the two panels aligned when the editor is resized.
  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(() => {
      syncPanelHeight();
    });

    resizeObserver.observe(document.querySelector(".editor-card"));
  }

  // ---------------------------------------------------------
  // Main buttons
  // ---------------------------------------------------------

  $("checkBtn").addEventListener("click", check);

  $("clearBtn").addEventListener("click", () => {
    if (
      editor.value &&
      !confirm("Clear the current text?")
    ) {
      return;
    }

    undoStack.push(editor.value);
    editor.value = "";
    ignored.clear();

    check();
  });

  $("autoCheck").addEventListener("change", () => {
    if ($("autoCheck").checked) check();
  });

  language.addEventListener("change", check);

  document.querySelectorAll(".view").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".view").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      view = button.dataset.view;
      renderCompare();
    });
  });

  $("undoBtn").addEventListener("click", () => {
    if (!undoStack.length) return;

    editor.value = undoStack.pop();
    ignored.clear();

    check();
  });

  $("copyBtn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(getCorrectedText());
      $("changeSummary").textContent = "Corrected text copied";
    } catch {
      alert(
        "Clipboard permission is unavailable. " +
        "Select and copy the corrected text manually."
      );
    }
  });

  // ---------------------------------------------------------
  // File downloads
  // ---------------------------------------------------------

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  $("downloadTxtBtn").addEventListener("click", () => {
    saveBlob(
      new Blob([getCorrectedText()], {
        type: "text/plain;charset=utf-8"
      }),
      "spellchecked.txt"
    );
  });

  function csvCell(value) {
    const text = String(value ?? "");

    if (/[",\r\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  }

  $("downloadTextCsvBtn").addEventListener("click", () => {
    const original = editor.value;
    const corrected = getCorrectedText();

    const originalLines = original.split(/\r?\n/);
    const correctedLines = corrected.split(/\r?\n/);

    const rows = [["ORIGINAL TEXT", "CORRECTED TEXT"]];

    const total = Math.max(
      originalLines.length,
      correctedLines.length
    );

    for (let i = 0; i < total; i++) {
      rows.push([
        originalLines[i] ?? "",
        correctedLines[i] ?? ""
      ]);
    }

    const csv = rows
      .map(row => row.map(csvCell).join(","))
      .join("\r\n");

    saveBlob(
      new Blob(["\ufeff", csv], {
        type: "text/csv;charset=utf-8"
      }),
      "spell-checker-original-corrected.csv"
    );
  });

  // ---------------------------------------------------------
  // TXT upload
  // ---------------------------------------------------------

  $("txtFile").addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    editor.value = await file.text();
    $("fileName").textContent = file.name;

    ignored.clear();
    undoStack = [];

    check();
  });

  // ---------------------------------------------------------
  // CSV parsing and export
  // ---------------------------------------------------------

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (quoted) {
        if (char === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"' && field.length === 0) {
        quoted = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }

    if (field.length || row.length) {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
    }

    return rows;
  }

  function csvEscape(value) {
    const text = String(value ?? "");

    return /[",\r\n]/.test(text)
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  }

  function setupCSV() {
    const headers = csvRows[0] || [];

    $("sheetSelect").innerHTML =
      '<option value="0">CSV data</option>';

    $("columnChoices").innerHTML = headers
      .map((header, index) => `
        <label class="column-choice">
          <input type="checkbox" value="${index}">
          <span>${escapeHTML(header || `Column ${index + 1}`)}</span>
        </label>
      `)
      .join("");

    $("excelPreview").innerHTML = "";
    $("downloadExcelBtn").hidden = true;
  }

  $("excelFile").addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    $("fileName").textContent = file.name;
    $("excelPanel").hidden = false;

    csvFileName =
      file.name.replace(/\.(csv|xlsx|xls)$/i, "") +
      "_spellchecked.csv";

    const extension = file.name.split(".").pop().toLowerCase();

    if (extension !== "csv") {
      csvRows = null;

      $("excelStatus").textContent =
        "This build currently supports CSV files. " +
        "Excel .xlsx and .xls require an Excel-reading library.";

      $("columnChoices").innerHTML = "";
      $("excelPreview").innerHTML = "";
      $("downloadExcelBtn").hidden = true;

      return;
    }

    try {
      csvRows = parseCSV(await file.text());

      if (!csvRows.length) {
        throw new Error("The file is empty.");
      }

      setupCSV();

      $("excelStatus").textContent =
        "CSV loaded. Select the columns you want to check.";
    } catch (error) {
      $("excelStatus").textContent =
        `Could not read the CSV file: ${error.message}`;
    }
  });

  $("processExcelBtn").addEventListener("click", () => {
    if (!csvRows || !csvRows.length) {
      $("excelStatus").textContent =
        "Please upload a valid CSV file first.";
      return;
    }

    const selected = [
      ...$("columnChoices").querySelectorAll("input:checked")
    ].map(input => Number(input.value));

    if (!selected.length) {
      $("excelStatus").textContent =
        "Select at least one column to check.";
      return;
    }

    const rows = csvRows.map(row => row.slice());

    const headers = rows[0].slice();
    rows[0] = headers;

    const suffix = language.value === "en_US"
      ? "_CORRECTED_SPELL_US"
      : "_CORRECTED_SPELL_UK";

    for (const index of selected) {
      const originalHeader = headers[index] || `COLUMN_${index + 1}`;

      const baseName = originalHeader + suffix;

      let newHeader = baseName;
      let counter = 2;

      while (headers.includes(newHeader)) {
        newHeader = `${baseName}_${counter++}`;
      }

      const outputIndex = headers.length;

      headers.push(newHeader);
      rows[0][outputIndex] = newHeader;

      for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
        const originalValue = rows[rowIndex][index] ?? "";

        const correctedValue = originalValue.replace(
          /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu,
          token => {
            if (protectedToken(token)) return token;

            if (customWords.has(token.toLowerCase())) {
              return token;
            }

            const result = spelling(token);

            if (
              !result.correct &&
              result.suggestions.length
            ) {
              return result.suggestions[0];
            }

            return token;
          }
        );

        rows[rowIndex][outputIndex] = correctedValue;
      }
    }

    csvOutput = rows;

    $("excelStatus").textContent =
      `Prepared corrected values for ${selected.length} column(s). ` +
      "Original columns have been preserved.";

    $("downloadExcelBtn").hidden = false;

    const previewRows = rows.slice(1, 6);

    $("excelPreview").innerHTML = `
      <table>
        <thead>
          <tr>
            ${headers.map(header =>
              `<th>${escapeHTML(header)}</th>`
            ).join("")}
          </tr>
        </thead>
        <tbody>
          ${previewRows.map(row => `
            <tr>
              ${headers.map((_, index) =>
                `<td>${escapeHTML(row[index] ?? "")}</td>`
              ).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  });

  $("downloadExcelBtn").addEventListener("click", () => {
    if (!csvOutput) return;

    const csv = csvOutput
      .map(row => row.map(csvEscape).join(","))
      .join("\r\n");

    saveBlob(
      new Blob(["\ufeff", csv], {
        type: "text/csv;charset=utf-8"
      }),
      csvFileName
    );
  });

  // ---------------------------------------------------------
  // Initial setup
  // ---------------------------------------------------------

  $("wordCount").textContent = "0 words";

  renderCompare();
  fitEditorColumn();
  syncPanelHeight();
})();
