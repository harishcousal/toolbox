(() => {
  const $ = id => document.getElementById(id);
  const editor = $("editor"), language = $("language");
  const customWords = new Set(JSON.parse(localStorage.getItem("spell-local-words") || "[]"));
  let issues = [], accepted = new Map(), ignored = new Set(), undoStack = [], view = "compare";
  let csvRows = null, csvHeaders = null, csvFileName = "corrected.csv", csvOutput = null;
  let timer = null;

  // Offline dictionary bundled in dictionary.js; no network calls required.
  const common = window.LOCAL_SPELL_WORDS || new Set();
  const errors = {calbe:["cable"],taxt:["text"],teaxt:["text"],taxxt:["text"],recieved:["received","receive"],recieve:["receive","received"],documant:["document"],eletrical:["electrical"],neccessary:["necessary"],tommorow:["tomorrow"],purchse:["purchase"],braket:["bracket"],dimensons:["dimensions"],teh:["the"],seperate:["separate"],occured:["occurred"],adress:["address"],enviroment:["environment"],definate:["definite"],acheive:["achieve"],begining:["beginning"],wierd:["weird"],untill:["until"],goverment:["government"],teaxt:["text"]};
  function wordTokens(text) {
    return [...text.matchAll(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu)].map(m => ({word:m[0],start:m.index,end:m.index+m[0].length}));
  }
  function protectedToken(w) { return /\d/.test(w) || /[_/\\]/.test(w) || (/[A-Z]{2,}/.test(w) && /[a-z]/.test(w)); }
  function caseLike(source, target) {
    if (source.toUpperCase() === source) return target.toUpperCase();
    if (source[0] && source[0] === source[0].toUpperCase()) return target[0].toUpperCase()+target.slice(1);
    return target;
  }
  // Candidate lookup is indexed by first letter and word length for fast offline checks.
  const dictionaryBuckets = new Map();
  for (const w of common) {
    if (!w || w.length > 32) continue;
    const key = w[0] + ':' + w.length;
    if (!dictionaryBuckets.has(key)) dictionaryBuckets.set(key, []);
    dictionaryBuckets.get(key).push(w);
  }
  // Common words receive a ranking boost so obscure dictionary entries do not dominate.
  const frequent = new Set(("the be to of and a in that have i it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are was were been being has had did said each much where why right still find here thing many those help put different away again place case point group problem fact cable text receive received document electrical necessary tomorrow purchase bracket brackets dimension dimensions stainless steel connector connectors description equipment unit valve filter fluid pressure part number model drawing position length width thickness").split(" "));
  const explicit = {calbe:["cable"],taxt:["text"],teaxt:["text"],taxxt:["text"],recieved:["received"],recieve:["receive"],documant:["document"],eletrical:["electrical"],neccessary:["necessary"],tommorow:["tomorrow"],purchse:["purchase"],braket:["bracket"],dimensons:["dimensions"],teh:["the"],seperate:["separate"],occured:["occurred"],adress:["address"],enviroment:["environment"],definate:["definite"],acheive:["achieve"],begining:["beginning"],wierd:["weird"],untill:["until"],goverment:["government"]};
  function damerauDistance(a,b,limit=2) {
    if (Math.abs(a.length-b.length)>limit) return limit+1;
    const d=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=0;i<=a.length;i++)d[i][0]=i;
    for(let j=0;j<=b.length;j++)d[0][j]=j;
    for(let i=1;i<=a.length;i++){
      let rowMin=limit+1;
      for(let j=1;j<=b.length;j++){
        const cost=a[i-1]===b[j-1]?0:1;
        d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
        if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]) d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
        rowMin=Math.min(rowMin,d[i][j]);
      }
      if(rowMin>limit)return limit+1;
    }
    return d[a.length][b.length];
  }
  function spelling(word) {
    const lower=word.toLowerCase();
    if(customWords.has(lower))return {correct:true,suggestions:[]};
    const usOnly={colour:"color",colours:"colors",organise:"organize",organised:"organized",organising:"organizing",organisation:"organization",centre:"center",theatre:"theater",licence:"license",defence:"defense",travelling:"traveling",cancelled:"canceled",grey:"gray"};
    const ukOnly={color:"colour",colors:"colours",organize:"organise",organized:"organised",organizing:"organising",organization:"organisation",center:"centre",theater:"theatre",license:"licence",defense:"defence",traveling:"travelling",canceled:"cancelled",gray:"grey"};
    const localeMap=language.value==="en_US"?usOnly:ukOnly;
    if(localeMap[lower])return {correct:false,suggestions:[caseLike(word,localeMap[lower])]};
    if(common.has(lower))return {correct:true,suggestions:[]};
    if(explicit[lower])return {correct:false,suggestions:explicit[lower].map(x=>caseLike(word,x))};
    const candidates=[];
    // Search near-length words, including adjacent transpositions (e.g. CALBE -> CABLE).
    for(let len=Math.max(1,lower.length-2);len<=Math.min(32,lower.length+2);len++){
      for(const candidate of (dictionaryBuckets.get(lower[0]+':'+len)||[])){
        const d=damerauDistance(lower,candidate,2);
        if(d<=2){
          const frequencyBoost=frequent.has(candidate)?-0.7:0;
          const prefixBoost=candidate.startsWith(lower.slice(0,Math.min(2,lower.length)))?-0.25:0;
          candidates.push({word:candidate,score:d+frequencyBoost+prefixBoost,d});
        }
      }
    }
    candidates.sort((a,b)=>a.score-b.score||a.d-b.d||a.word.localeCompare(b.word));
    const unique=[...new Set(candidates.map(x=>x.word))].slice(0,5).map(x=>caseLike(word,x));
    return {correct:false,suggestions:unique};
  }
  function escape(s) { return String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function countWords(s) { return wordTokens(s).length; }
  function applyAccepted(text) {
    const tokens=wordTokens(text); let out="", pos=0;
    tokens.forEach(t=>{out+=text.slice(pos,t.start);out+=accepted.has(`${t.start}:${t.end}`)?accepted.get(`${t.start}:${t.end}`):text.slice(t.start,t.end);pos=t.end;});
    return out+text.slice(pos);
  }
  function fitEditorColumn() {
    const workspace = document.querySelector(".workspace");
    if (!workspace) return;
    const style = getComputedStyle(workspace);
    if (window.matchMedia("(max-width: 760px)").matches) {
      workspace.style.gridTemplateColumns = "minmax(0, 1fr)";
      return;
    }
    const canvas = fitEditorColumn.canvas || (fitEditorColumn.canvas = document.createElement("canvas"));
    const ctx = canvas.getContext("2d");
    ctx.font = getComputedStyle(editor).font;
    const lines = editor.value.split("\n");
    const longest = Math.max(0, ...lines.map(line => ctx.measureText(line).width));
    const available = workspace.clientWidth;
    const desired = Math.max(290, Math.min(available * 0.46, longest + 48));
    workspace.style.gridTemplateColumns = `${desired}px minmax(0, 1fr)`;
  }
  function syncVerticalScroll(source) {
    const suggestions = $("suggestions");
    if (source === editor) suggestions.scrollTop = editor.scrollTop;
    else editor.scrollTop = suggestions.scrollTop;
    $("highlight").scrollTop = editor.scrollTop;
    $("highlight").scrollLeft = editor.scrollLeft;
  }
  function check() {
    const text=editor.value; issues=[];
    wordTokens(text).forEach(t=>{
      if(protectedToken(t.word)||ignored.has(t.word.toLowerCase())) return;
      const result=spelling(t.word);
      if(!result.correct) issues.push({...t,suggestions:result.suggestions});
    });
    $("wordCount").textContent=countWords(text)+" words";
    $("errorCount").textContent=issues.length;
    renderHighlights();
    renderSuggestions();
    fitEditorColumn();
    syncVerticalScroll(editor);
    renderCompare();
    $("status").textContent=`${issues.length} possible spelling ${issues.length===1?"issue":"issues"} found · offline English dictionary`;
  }
  function renderHighlights() {
    const text=editor.value;let out="",pos=0;
    issues.forEach(t=>{out+=escape(text.slice(pos,t.start))+`<span class="misspelled">${escape(text.slice(t.start,t.end))}</span>`;pos=t.end;});
    $("highlight").innerHTML=out+escape(text.slice(pos))+(text.endsWith("\n")?" ":"");
    $("highlight").scrollTop=editor.scrollTop;$("highlight").scrollLeft=editor.scrollLeft;
  }
  function renderSuggestions() {
    const text=editor.value;
    const lines=text.split("\n");
    if(!issues.length) {
      $("suggestions").innerHTML=`<div class="empty"><div class="empty-aa">✓</div><b>No spelling issues found</b><p>The offline dictionary is used; technical terms can be added to your personal dictionary.</p></div>`;
      return;
    }
    // Keep a row for every source line (including correct/blank lines) so suggestions
    // visually track the text in the editor instead of forming a separate stacked list.
    const lineStarts=[]; let cursor=0;
    lines.forEach(line=>{lineStarts.push(cursor);cursor+=line.length+1;});
    const lineIssues=lines.map((line,idx)=>({line,idx,items:issues.filter(t=>t.start>=lineStarts[idx] && t.start<lineStarts[idx]+line.length)}));
    $("suggestions").innerHTML=`<div class="aligned-suggestions">${lineIssues.map(({idx,items})=>{
      if(!items.length) return `<div class="suggestion-line empty-line" aria-hidden="true"></div>`;
      return `<div class="suggestion-line">${items.map((t)=>`<span class="inline-issue"><b class="bad-word">${escape(t.word)}</b><span class="suggestion-list">${t.suggestions.slice(0,5).map(s=>`<button class="suggestion-option" data-action="replace" data-start="${t.start}" data-end="${t.end}" data-word="${escape(s)}">${escape(s)}</button>`).join("")||'<span class="subtle">No suggestions</span>'}</span><span class="inline-actions"><button class="mini-link" data-action="ignore" data-word="${escape(t.word)}">Ignore</button><button class="mini-link" data-action="add" data-word="${escape(t.word)}">Add to dictionary</button></span></span>`).join("")}</div>`;
    }).join("")}</div>`;
  }
  function renderCompare() {
    const original=editor.value, corrected=applyAccepted(original);
    const pane=(label,txt)=>`<div class="compare-pane"><small>${label}</small><p class="compare-text">${escape(txt||"Nothing to show yet.")}</p></div>`;
    $("comparison").innerHTML=view==="original"?pane("ORIGINAL",original):view==="corrected"?pane("CORRECTED PREVIEW",corrected):pane("ORIGINAL",original)+pane("CORRECTED PREVIEW",corrected);
    $("changeSummary").textContent=accepted.size?`${accepted.size} correction(s) accepted`:"No corrections applied";
    $("undoBtn").disabled=!undoStack.length;
  }
  function replace(start,end,word) {
    undoStack.push({text:editor.value,accepted:new Map(accepted)});
    editor.value=editor.value.slice(0,start)+word+editor.value.slice(end);
    accepted.clear();ignored.clear();check();
  }
  $("suggestions").addEventListener("click",e=>{
    const b=e.target.closest("[data-action]");if(!b)return;
    if(b.dataset.action==="replace") replace(+b.dataset.start,+b.dataset.end,b.dataset.word);
    if(b.dataset.action==="ignore"){ignored.add(b.dataset.word.toLowerCase());check();}
    if(b.dataset.action==="add"){customWords.add(b.dataset.word.toLowerCase());localStorage.setItem("spell-local-words",JSON.stringify([...customWords]));check();}
  });
  editor.addEventListener("input",()=>{ $("wordCount").textContent=countWords(editor.value)+" words"; if($("autoCheck").checked){clearTimeout(timer);timer=setTimeout(check,250);}else renderCompare();});
  editor.addEventListener("scroll",()=>syncVerticalScroll(editor));
  $("suggestions").addEventListener("wheel",e=>{editor.scrollTop+=e.deltaY;syncVerticalScroll(editor);e.preventDefault();},{passive:false});
  window.addEventListener("resize",fitEditorColumn);
  $("checkBtn").addEventListener("click",check);
  $("clearBtn").addEventListener("click",()=>{if(editor.value&&!confirm("Clear current text?"))return;editor.value="";accepted.clear();ignored.clear();check();});
  language.addEventListener("change",check);
  document.querySelectorAll(".view").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x===b));view=b.dataset.view;renderCompare();}));
  $("undoBtn").addEventListener("click",()=>{const u=undoStack.pop();if(!u)return;editor.value=u.text;accepted=u.accepted;check();});
  $("copyBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(applyAccepted(editor.value));$("changeSummary").textContent="Corrected preview copied";}catch{alert("Clipboard permission unavailable. Select and copy the corrected text manually.");}});
  function saveBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $("downloadTxtBtn").addEventListener("click",()=>saveBlob(new Blob([applyAccepted(editor.value)],{type:"text/plain;charset=utf-8"}),"spellchecked.txt"));
  // Export the text as two Excel-friendly CSV columns. Each source line becomes one row.
  function csvCell(value) { const s=String(value??""); return /[",\r\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
  $("downloadTextCsvBtn").addEventListener("click",()=>{
    const original = undoStack.length ? undoStack[0].text : editor.value;
    const corrected = editor.value;
    const originalLines = original.split(/\r?\n/);
    const correctedLines = corrected.split(/\r?\n/);
    const rows = [["ORIGINAL TEXT","CORRECTED TEXT"]];
    const total = Math.max(originalLines.length, correctedLines.length);
    for(let i=0;i<total;i++) rows.push([originalLines[i]??"", correctedLines[i]??""]);
    const csv = rows.map(row=>row.map(csvCell).join(",")).join("\r\n");
    saveBlob(new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}),"spell-checker-original-corrected.csv");
  });
  $("txtFile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;editor.value=await f.text();$("fileName").textContent=f.name;accepted.clear();ignored.clear();check();});
  $("excelFile").addEventListener("change",async e=>{
    const f=e.target.files[0];if(!f)return;$("fileName").textContent=f.name;$("excelPanel").hidden=false;
    csvFileName=f.name.replace(/\.(csv|xlsx|xls)$/i,"")+"_spellchecked.csv";
    const ext=f.name.split(".").pop().toLowerCase();
    if(ext==="csv"){
      try{const txt=await f.text();csvRows=parseCSV(txt);setupCSV();$("excelStatus").textContent="CSV loaded. Select text columns to check; corrected values will be added in separate columns.";}
      catch(err){$("excelStatus").textContent="Could not read CSV file: "+err.message;}
    } else {
      $("excelStatus").textContent="This local test build supports CSV directly. To test .xlsx/.xls, add the local SheetJS browser library; instructions are in README.md.";
    }
  });
  function parseCSV(text) {
    const rows=[];let row=[],field="",quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i];
      if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++;}else if(c==='"')quoted=false;else field+=c;}
      else if(c==='"')quoted=true;
      else if(c===","){row.push(field);field="";}
      else if(c==="\n"){row.push(field.replace(/\r$/,""));rows.push(row);row=[];field="";}
      else field+=c;
    }
    if(field.length||row.length){row.push(field.replace(/\r$/,""));rows.push(row);}
    return rows;
  }
  function csvEscape(v){const s=String(v??"");return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
  function setupCSV(){
    const headers=csvRows[0]||[];
    $("sheetSelect").innerHTML='<option value="0">CSV data</option>';
    $("columnChoices").innerHTML=headers.map((h,i)=>`<label class="column-choice"><input type="checkbox" value="${i}"><span>${escape(h||`Column ${i+1}`)}</span></label>`).join("");
    $("excelPreview").innerHTML="";$("downloadExcelBtn").hidden=true;
  }
  $("processExcelBtn").addEventListener("click",()=>{
    if(!csvRows||!csvRows.length){$("excelStatus").textContent="Load a CSV file first. XLSX/XLS support requires adding the local SheetJS library.";return;}
    const selected=[...$("columnChoices").querySelectorAll("input:checked")].map(x=>+x.value);
    if(!selected.length){$("excelStatus").textContent="Select at least one column.";return;}
    const rows=csvRows.map(r=>r.slice()),headers=rows[0];
    const suffix=language.value==="en_US"?"_CORRECTED_SPELL_US":"_CORRECTED_SPELL_UK";
    selected.forEach(index=>{
      const base=(headers[index]||`COLUMN_${index+1}`)+suffix;
      let name=base,n=2;while(headers.includes(name))name=base+"_"+n++;
      const outIndex=headers.length;headers[outIndex]=name;
      for(let r=1;r<rows.length;r++){
        const value=rows[r][index]??"";
        rows[r][outIndex]=value.replace(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu,token=>{
          if(protectedToken(token)||customWords.has(token.toLowerCase()))return token;
          const result=spelling(token);return !result.correct&&result.suggestions.length?result.suggestions[0]:token;
        });
      }
    });
    csvOutput=rows;
    $("excelStatus").textContent=`Prepared corrected values for ${selected.length} selected column(s). Original columns were not overwritten. Uses the bundled offline dictionary.`;
    $("downloadExcelBtn").hidden=false;
    $("excelPreview").innerHTML="<table><thead><tr>"+headers.map(h=>`<th>${escape(h)}</th>`).join("")+"</tr></thead><tbody>"+rows.slice(1,6).map(r=>"<tr>"+headers.map((_,i)=>`<td>${escape(r[i]??"")}</td>`).join("")+"</tr>").join("")+"</tbody></table>";
  });
  $("downloadExcelBtn").addEventListener("click",()=>{if(!csvOutput)return;const text=csvOutput.map(r=>r.map(csvEscape).join(",")).join("\r\n");saveBlob(new Blob(["\ufeff"+text],{type:"text/csv;charset=utf-8"}),csvFileName);});
  $("wordCount").textContent="0 words";renderCompare();
})();
