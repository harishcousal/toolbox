/* Shared dictionary reader and secure GitHub Issue request helper. */
(() => {
  "use strict";
  const REPOSITORY = "harishcousal/toolbox";
  const DICTIONARY_URL = new URL("../data/custom-dictionary.json", document.currentScript.src).href;
  const words = new Set();

  async function load() {
    try {
      const response = await fetch(`${DICTIONARY_URL}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Dictionary request failed: ${response.status}`);
      const data = await response.json();
      words.clear();
      (Array.isArray(data.words) ? data.words : []).forEach(word => {
        const value = String(word || "").trim().toLocaleLowerCase();
        if (value) words.add(value);
      });
      return { ok: true, count: words.size, updatedAt: data.updatedAt || null };
    } catch (error) {
      console.warn("Toolbox shared dictionary could not be loaded.", error);
      return { ok: false, count: words.size };
    }
  }

  function requestChange(action, word, replacement = "") {
    const cleanWord = String(word || "").trim();
    if (!["add", "remove", "replace"].includes(action) || !cleanWord) return false;
    const body = [
      "TOOLBOX_DICTIONARY_REQUEST",
      `ACTION: ${action}`,
      `WORD: ${cleanWord}`,
      `REPLACEMENT: ${String(replacement || "").trim()}`
    ].join("\n");
    const url = new URL(`https://github.com/${REPOSITORY}/issues/new`);
    url.searchParams.set("title", `Dictionary ${action}: ${cleanWord}`.slice(0, 200));
    url.searchParams.set("body", body);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
    return true;
  }

  window.ToolboxCloudDictionary = { words, load, requestChange, repository: REPOSITORY };
  load().then(() => {
    document.dispatchEvent(new Event("toolbox-cloud-dictionary-loaded"));
  });
})();
