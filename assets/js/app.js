/* Toolbox Spell Checker — single editor and inline suggestion popup */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const editor = $("editor"), highlight = $("highlight"), popup = $("suggestionPopup");
  const language = $("language");
  let issues = [], ignored = new Set(), personal = new Set(JSON.parse(localStorage.getItem("toolbox-spell-personal") || "[]"));
  let historyText = "", correctedText = "", activeIssue = null, excelData = null, excelOutput = null, currentView = "compare", timer = null;

  // Conservative fallback list for common errors. The existing dictionary.js remains loaded.
  const fallback = {
    recieve:["receive","received"], recived:["received","receive"], receivedd:["received"],
    calbe:["cable"], taxt:["text"], teaxt:["text"], eletrical:["electrical"], ele trical:["electrical"],
    connetor:["connector","connectors"], dimensoin:["dimension","dimensions"], stainles:["stainless"],
    bracet:["bracket"], maintenence:["maintenance"], presssure:["pressure"], documant:["document"],
    eletrical:["electrical"], conector:["connector"], conecttor:["connector"], braket:["bracket"],
    instalation:["installation"], equipement:["equipment"], operaton:["operation"], dammaged:["damaged"],
    cabel:["cable"], presure:["pressure"], transmiter:["transmitter"], recieve:["receive","received"],
    teh:["the"], adn:["and"], tehre:["there"], becuase:["because"], seperate:["separate"],
    colour:["color"], color:["colour"]
  };
  const protectedPattern = /^(?=.*\d)[A-Z0-9][A-Z0-9./_:+#-]*$/i;
  const technicalPattern = /^(?:P\/N|PN|TYPE|ART\.?NO\.?|DRAWING|RANGE|WIDTH|THICKNESS|LENGTH|BAR|MM|DC|AC)$/i;

  function getDictionaryWords() {
    const candidates = [window.SPELL_DICTIONARY, window.dictionary, window.DICTIONARY, window.words];
    for (const candidate of candidates) {
      if (candidate instanceof Set) return candidate;
      if (Array.isArray(candidate)) return new Set(candidate.map(x => String(x).toLowerCase()));
      if (candidate && typeof candidate === "object") {
        if (candidate.words instanceof Set) return candidate.words;
        if (Array.isArray(candidate.words)) return new Set(candidate.words.map(x => String(x).toLowerCase()));
      }
    }
    return null;
  }
  function isKnown(word) {
    const lower = word.toLowerCase();
    if (personal.has(lower) || ignored.has(lower)) return true;
    if (Object.prototype.hasOwnProperty.call(fallback, lower)) return false;
    const dict = getDictionaryWords();
    if (dict && dict.has(lower)) return true;
    // Keep technical tokens and common abbreviations out of the spell-checker.
    if (protectedPattern.test(word) || technicalPattern.test(word)) return true;
    if (/^[A-Z]{2,}$/.test(word)) return true;
    // Known US/UK variants are accepted in either locale; locale-specific suggestions remain available.
    const variants = {colour:"color",color:"colour",centre:"center",center:"centre",organisation:"organization",organization:"organisation",favourite:"favorite",favorite:"favourite",behaviour:"behavior",behavior:"behaviour",metre:"meter",meter:"metre"};
    if (variants[lower]) return true;
    // Avoid falsely flagging words when the bundled dictionary's global format is unknown.
    return true;
  }
  function getSuggestions(word) {
    const lower = word.toLowerCase();
    let list = fallback[lower] ? [...fallback[lower]] : [];
    const lang = language.value;
    const variants = {
      colour: {en_US:["color"],en_GB:["colour"]}, color:{en_US:["color"],en_GB:["colour"]},
      centre:{en_US:["center"],en_GB:["centre"]}, center:{en_US:["center"],en_GB:["centre"]},
      organisation:{en_US:["organization"],en_GB:["organisation"]}, organization:{en_US:["organization"],en_GB:["organisation"]},
      favourite:{en_US:["favorite"],en_GB:["favourite"]}, favorite:{en_US:["favorite"],en_GB:["favourite"]}
    };
    if (variants[lower]) list = variants[lower][lang].concat(list);
    return [...new Set(list)].slice(0, 6).map(s => matchCase(word, s));
  }
  function matchCase(original, replacement) {
    if (original === original.toUpperCase()) return replacement.toUpperCase();
    if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
    return replacement;
  }
  function findIssues(text) {
    const found = [];
    // Ignore part/model identifiers with digits and preserve punctuation/spacing exactly.
    const re = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
    let m;
    while ((m = re.exec(text))) {
      const word = m[0], lower = word.toLowerCase();
      if (protectedPattern.test(word) || isKnown(word)) continue;
      const suggestions = getSuggestions(word);
      if (!suggestions.length) continue;
      found.push({word, start:m.index, end:m.index+word.length, suggestions});
    }
    return found;
  }
  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  }
  function renderHighlight() {
    const text = editor.value;
    issues = findIssues(text);
    let out = "", pos = 0;
    for (const issue of issues) {
      out += escapeHTML(text.slice(pos, issue.start));
      out += `<span class="misspelled" data-start="${issue.start}" data-end="${issue.end}">${escapeHTML(text.slice(issue.start, issue.end))}</span>`;
      pos = issue.end;
    }
    out += escapeHTML(text.slice(pos));
    // A trailing newline needs a visible final line so the overlay scroll stays aligned.
    highlight.innerHTML = out + (text.endsWith("\n") ? " " : "");
    $("wordCount").textContent = `${(text.match(/[\p{L}\p{N}]+/gu) || []).length} words`;
    $("errorCount").textContent = `${issues.length} ${issues.length === 1 ? "issue" : "issues"}`;
    $("status").textContent = issues.length ? `${issues.length} possible spelling issues found` : (text.trim() ? "No likely spelling issues found" : "Ready to check");
    updateComparison();
  }
  function syncScroll() { highlight.scrollTop = editor.scrollTop; highlight.scrollLeft = editor.scrollLeft; }
  function updateComparison() {
    $("originalPreview").textContent = editor.value || "Your original text will appear here.";
    $("correctedPreview").textContent = correctedText || editor.value || "Accepted corrections will appear here.";
    $("changeSummary").textContent = correctedText && correctedText !== editor.value ? "Corrections applied to preview" : "No corrections applied";
    const grid = $("comparison");
    grid.style.gridTemplateColumns = currentView === "original" ? "1fr" : currentView === "corrected" ? "1fr" : "";
    const panes = grid.querySelectorAll(".compare-pane");
    panes[0].hidden = currentView === "corrected";
    panes[1].hidden = currentView === "original";
    $("undoBtn").disabled = !historyText;
  }
  function scheduleCheck() {
    clearTimeout(timer);
    timer = setTimeout(() => { renderHighlight(); hidePopup(); }, 140);
  }
  function hidePopup() { popup.hidden = true; activeIssue = null; }
  function openPopup(issue) {
    activeIssue = issue;
    const suggestions = issue.suggestions.length
      ? issue.suggestions.map(s => `<button class="suggestion-chip" data-action="replace" data-value="${escapeHTML(s)}">${escapeHTML(s)}</button>`).join("")
      : `<span class="subtle">No suggestions available.</span>`;
    popup.innerHTML = `<div class="popup-title"><span>Possible spelling: <span class="popup-word">${escapeHTML(issue.word)}</span></span><button class="popup-close" data-action="close" aria-label="Close">×</button></div>
      <div class="popup-suggestions">${suggestions}</div>
      <div class="popup-actions"><button class="popup-action" data-action="ignore">Ignore</button><button class="popup-action" data-action="add">Add to dictionary</button></div>`;
    popup.hidden = false;
    const rect = editor.getBoundingClientRect(), wrap = $("editorWrap").getBoundingClientRect();
    // Position the popup near the selected word using a hidden measurement range.
    const before = editor.value.slice(0, issue.start);
    const lines = before.split("\n");
    const line = lines.length - 1, col = lines[lines.length - 1].length;
    const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 24;
    const charWidth = parseFloat(getComputedStyle(editor).fontSize) * .61;
    let top = 16 + line * lineHeight - editor.scrollTop + lineHeight;
    let left = 15 + col * charWidth - editor.scrollLeft;
    top = Math.max(8, Math.min(top, wrap.height - 115));
    left = Math.max(8, Math.min(left, wrap.width - 230));
    popup.style.top = `${top}px`; popup.style.left = `${left}px`;
  }
  function replaceIssue(replacement) {
    if (!activeIssue) return;
    const issue = activeIssue, original = editor.value;
    historyText = original;
    editor.value = original.slice(0, issue.start) + replacement + original.slice(issue.end);
    correctedText = editor.value;
    const cursor = issue.start + replacement.length;
    hidePopup(); renderHighlight();
    editor.focus(); editor.setSelectionRange(cursor, cursor);
  }
  function addToPersonal(word) {
    personal.add(word.toLowerCase());
    localStorage.setItem("toolbox-spell-personal", JSON.stringify([...personal]));
    hidePopup(); renderHighlight();
  }
  function download(name, content, type="text/plain;charset=utf-8") {
    const blob = new Blob([content], {type}), url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
  function csvEscape(value) {
    const s = String(value ?? "");
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  }
  function downloadTextCSV() {
    const rows = [["Type","Text"],["Original",editor.value],["Corrected",correctedText || editor.value]];
    download("spell-check-results.csv", rows.map(r=>r.map(csvEscape).join(",")).join("\r\n"), "text/csv;charset=utf-8");
  }
  function correctTextSimple(text) {
    return text.replace(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu, word => {
      const lower = word.toLowerCase();
      const suggestions = getSuggestions(word);
      if (!suggestions.length || !fallback[lower]) return word;
      return word;
    });
  }
  editor.addEventListener("input", () => { correctedText = ""; scheduleCheck(); });
  editor.addEventListener("scroll", syncScroll);
  $("checkBtn").addEventListener("click", () => { renderHighlight(); hidePopup(); });
  $("clearBtn").addEventListener("click", () => { historyText = editor.value; editor.value = ""; correctedText = ""; hidePopup(); renderHighlight(); editor.focus(); });
  $("autoCheck").addEventListener("change", () => { if ($("autoCheck").checked) renderHighlight(); });
  language.addEventListener("change", () => { renderHighlight(); hidePopup(); });
  highlight.addEventListener("click", event => {
    const span = event.target.closest(".misspelled");
    if (!span) return;
    const start = Number(span.dataset.start), end = Number(span.dataset.end);
    const issue = issues.find(x => x.start === start && x.end === end);
    if (issue) openPopup(issue);
  });
  popup.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "close") hidePopup();
    else if (action === "replace") replaceIssue(button.dataset.value);
    else if (action === "ignore" && activeIssue) { ignored.add(activeIssue.word.toLowerCase()); hidePopup(); renderHighlight(); }
    else if (action === "add" && activeIssue) addToPersonal(activeIssue.word);
  });
  document.addEventListener("click", event => {
    if (!popup.hidden && !popup.contains(event.target) && event.target !== highlight) hidePopup();
  });
  document.querySelectorAll(".view").forEach(button => button.addEventListener("click", () => {
    currentView = button.dataset.view;
    document.querySelectorAll(".view").forEach(b => b.classList.toggle("active", b === button));
    updateComparison();
  }));
  $("undoBtn").addEventListener("click", () => {
    if (!historyText) return;
    editor.value = historyText; historyText = ""; correctedText = ""; renderHighlight(); editor.focus();
  });
  $("copyBtn").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(correctedText || editor.value); $("status").textContent = "Text copied to clipboard"; }
    catch { $("status").textContent = "Clipboard access blocked by browser"; }
  });
  $("downloadTxtBtn").addEventListener("click", () => download("spell-checked.txt", correctedText || editor.value));
  $("downloadExcelTextBtn").addEventListener("click", () => {
    const original = editor.value || "";
    const corrected = correctedText || original;
    if (typeof XLSX === "undefined") {
      $("status").textContent = "Excel export library did not load. Check your internet connection and refresh.";
      return;
    }
    const rows = [["Original text", "Corrected text"], [original, corrected]];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 70 }, { wch: 70 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Spell Check");
    XLSX.writeFile(workbook, "spell-check-results.xlsx");
  });
  $("downloadTextCsvBtn").addEventListener("click", downloadTextCSV);
  $("txtFile").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    editor.value = await file.text(); correctedText = ""; $("fileName").textContent = file.name; renderHighlight();
  });

  // CSV support remains client-side. XLS/XLSX needs a workbook parser and is not silently misread as text.
  $("excelFile").addEventListener("change", async event => {
    const file = event.target.files[0]; if (!file) return;
    $("fileName").textContent = file.name;
    $("excelPanel").hidden = false;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      $("excelStatus").textContent = "Excel .xlsx/.xls parsing is not enabled in this build. Please export the worksheet as CSV and upload it again.";
      excelData = null; $("downloadExcelBtn").hidden = true; return;
    }
    const text = await file.text();
    excelData = parseCSV(text);
    renderColumnChoices();
    $("excelStatus").textContent = `Loaded ${Math.max(0,excelData.length-1)} data rows. Select columns to check.`;
    $("excelPreview").innerHTML = ""; $("downloadExcelBtn").hidden = true;
  });
  function parseCSV(text) {
    const rows=[]; let row=[], cell="", quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}
      else if(c==='"')quoted=true;
      else if(c===","){row.push(cell);cell="";}
      else if(c==="\n"){row.push(cell.replace(/\r$/,""));rows.push(row);row=[];cell="";}
      else cell+=c;
    }
    if(cell.length||row.length){row.push(cell.replace(/\r$/,""));rows.push(row);}
    return rows;
  }
  function renderColumnChoices() {
    const headers=excelData?.[0]||[];
    $("columnChoices").innerHTML=headers.map((h,i)=>`<label><input type="checkbox" value="${i}" checked> ${escapeHTML(h||`Column ${i+1}`)}</label>`).join("");
  }
  $("processExcelBtn").addEventListener("click", () => {
    if(!excelData) return;
    const chosen=[...$("columnChoices").querySelectorAll("input:checked")].map(x=>Number(x.value));
    if(!chosen.length){$("excelStatus").textContent="Select at least one column.";return;}
    const headers=[...excelData[0]];
    for(const i of chosen) headers.push(`${excelData[0][i]||`COLUMN_${i+1}`}_CORRECTED_SPELL_${language.value==="en_GB"?"UK":"US"}`);
    excelOutput=[headers];
    for(const sourceRow of excelData.slice(1)){
      const row=[...sourceRow];
      for(const i of chosen) row.push(correctCell(sourceRow[i]||""));
      excelOutput.push(row);
    }
    $("excelPreview").innerHTML=`<table><thead><tr>${headers.map(h=>`<th>${escapeHTML(h)}</th>`).join("")}</tr></thead><tbody>${excelOutput.slice(1,6).map(row=>`<tr>${row.map(v=>`<td>${escapeHTML(v)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    $("excelStatus").textContent=`Prepared ${excelOutput.length-1} rows. Original columns are preserved.`;
    $("downloadExcelBtn").hidden=false;
  });
  function correctCell(text) {
    // Conservative: only apply known one-word fallback corrections, retaining punctuation and whitespace.
    return text.replace(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu, word => {
      const s=getSuggestions(word);
      if(!fallback[word.toLowerCase()]||!s.length) return word;
      return s[0];
    });
  }
  $("downloadExcelBtn").addEventListener("click", () => {
    if(!excelOutput) return;
    if (typeof XLSX !== "undefined") {
      const worksheet = XLSX.utils.aoa_to_sheet(excelOutput);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Spell Checked");
      XLSX.writeFile(workbook, "spell-checked-columns.xlsx");
    } else {
      download("spell-checked-columns.csv", excelOutput.map(row=>row.map(csvEscape).join(",")).join("\\r\\n"), "text/csv;charset=utf-8");
    }
  });
  renderHighlight();
})();
