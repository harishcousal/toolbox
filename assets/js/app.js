(() => {
"use strict";
const $=id=>document.getElementById(id), editor=$("editor"); if(!editor)return;
let undoText=null; let comparisonOriginal=""; const ignored=new Set(); let personal=new Set();
try{personal=new Set(JSON.parse(localStorage.getItem("toolboxSpellPersonalDictionary")||"[]"))}catch{}
const misspellings={calbe:["cable","cables"],taxt:["text","tax"],teaxt:["text"],recieve:["receive","received"],receieve:["receive","received"],eletrical:["electrical"],connetor:["connector"],dimensoin:["dimension","dimensions"],stainles:["stainless"],bracet:["bracket"],maintenence:["maintenance"],maintanence:["maintenance"],presssure:["pressure"],seperate:["separate"],definately:["definitely"],enviroment:["environment"],compatable:["compatible"],lenght:["length"],widht:["width"],thikness:["thickness"],transmiter:["transmitter"],assembely:["assembly"],centifugal:["centrifugal"],housng:["housing"],waterpmp:["waterpump"]};
const validTech=new Set("filter unit fluid pressure equipment name hydraulic control system opto coupler phoenix contact type crossbar stainless steel bracket width thickness length range bar connector electrical pump assembly centrifugal bearing housing drawing number cable waterpump maintenance transmitter voltage current mm dc ac dek pn".split(/\s+/));
// Read only the user's actual editor text. Inline suggestion controls are UI,
 // not document content; excluding them prevents button labels entering the text.
const text=()=>{
  const clone=editor.cloneNode(true);
  clone.querySelectorAll(".inline-suggestions").forEach(n=>n.remove());
  // Chrome's contenteditable inserts DIV/P blocks when Enter is pressed.
  // Convert those block boundaries to real newline characters, while keeping
  // inline spell-error spans joined to the surrounding text.
  function collect(node){
    if(node.nodeType===Node.TEXT_NODE)return node.nodeValue||"";
    if(node.nodeType!==Node.ELEMENT_NODE)return "";
    if(node.tagName==="BR")return "\n";
    let out="";
    for(const child of node.childNodes){
      const isBlock=child.nodeType===Node.ELEMENT_NODE && /^(DIV|P|LI)$/.test(child.tagName);
      if(isBlock && out && !out.endsWith("\n")) out+="\n";
      out+=collect(child);
      if(isBlock && !out.endsWith("\n")) out+="\n";
    }
    return out;
  }
  return collect(clone).replace(/\u00a0/g," ").replace(/\n+$/g,"");
};
const caseLike=(w,s)=>w===w.toUpperCase()?s.toUpperCase():w[0]===w[0].toUpperCase()?s[0].toUpperCase()+s.slice(1):s;
// The main checker uses a real Hunspell-compatible dictionary through Typo.js.
// A small curated typo map remains as a fallback if the remote dictionary cannot load.
const spellingEngines = { en_US: null, en_GB: null };
let engineState = "loading";
const technicalWords = new Set(("electrical electronics connector connectors cable cables bracket brackets crossbar stainless steel pressure transmitter transducer hydraulic pneumatic bearing bearings housing housings pump pumps valve valves actuator actuators relay relays optocoupler opto coupler phoenix contact terminal terminals circuit breaker fuse fuses capacitor capacitors resistor resistors sensor sensors switch switches motor motors gearbox gearboxes shaft shafts flange flanges gasket gaskets seal seals o-ring o rings fastener fasteners bolt bolts nut nuts washer washers screw screws drawing assembly equipment maintenance dimension dimensions thickness width length diameter voltage current frequency insulation conductor conductor's plc hmi vfd scada i/o dc ac mm cm kg kw kva rpm psi bar pa mpa no nc ip54 ip65 ip67 din rail panel mount pcb pcb's model serial part number part-number partnumber unspsc dek art no art.no p/n pn sku qty qty's" ).toLowerCase().split(/\s+/));
function dictionaryLanguage(){return $("language")?.value==="en_GB"?"en_GB":"en_US"}
function isProtectedWord(x){return personal.has(x)||ignored.has(x)||validTech.has(x)||technicalWords.has(x)}
function fallbackOptions(x, language){
  const us={colour:["color"],colours:["colors"],favourite:["favorite"],favourites:["favorites"],centre:["center"],centres:["centers"],organise:["organize"],organised:["organized"],organising:["organizing"],organisation:["organization"],analyse:["analyze"],analysed:["analyzed"],analysing:["analyzing"],behaviour:["behavior"],labour:["labor"],metre:["meter"],metres:["meters"],litre:["liter"],litres:["liters"],catalogue:["catalog"],catalogues:["catalogs"],travelling:["traveling"],travelled:["traveled"],traveller:["traveler"],theatre:["theater"],theatres:["theaters"],defence:["defense"],offence:["offense"],licence:["license"],grey:["gray"],programme:["program"],tyre:["tire"],jewellery:["jewelry"],cancelled:["canceled"],modelling:["modeling"]};
  const uk={color:["colour"],colors:["colours"],favorite:["favourite"],favorites:["favourites"],center:["centre"],centers:["centres"],organize:["organise"],organized:["organised"],organizing:["organising"],organization:["organisation"],analyze:["analyse"],analyzed:["analysed"],analyzing:["analysing"],behavior:["behaviour"],labor:["labour"],meter:["metre"],meters:["metres"],liter:["litre"],liters:["litres"],catalog:["catalogue"],catalogs:["catalogues"],traveling:["travelling"],traveled:["travelled"],traveler:["traveller"],theater:["theatre"],theaters:["theatres"],defense:["defence"],offense:["offence"],license:["licence"],gray:["grey"],program:["programme"],tire:["tyre"],jewelry:["jewellery"],canceled:["cancelled"],modeling:["modelling"]};
  return ((language==="en_GB")?(uk[x]||misspellings[x]):(us[x]||misspellings[x]))||[];
}
function opts(w){
  const x=w.toLowerCase();
  if(isProtectedWord(x))return [];
  const language=dictionaryLanguage(), engine=spellingEngines[language];
  const regional = fallbackOptions(x,language);
  const regionalWrong = (language==="en_GB" && ({color:1,favorite:1,center:1,organize:1,analyze:1,behavior:1,labor:1,meter:1,liter:1,catalog:1,traveling:1}[x])) || (language==="en_US" && ({colour:1,favourite:1,centre:1,organise:1,analyse:1,behaviour:1,labour:1,metre:1,litre:1,catalogue:1,travelling:1}[x]));
  if(regionalWrong && regional.length)return regional.map(v=>caseLike(w,v));
  // Valid regional spellings absent from the US base dictionary should be accepted.
  const regionalValid = new Set(["colour","colours","favourite","favourites","centre","centres","organise","organised","organising","organisation","analyse","analysed","analysing","behaviour","labour","metre","metres","litre","litres","catalogue","catalogues","travelling","travelled","traveller","theatre","theatres","defence","offence","licence","grey","programme","tyre","jewellery","cancelled","modelling"]);
  if(language==="en_GB" && regionalValid.has(x))return [];
  if(engine){
    try { if(engine.check(w)) return []; const suggestions=engine.suggest(w).slice(0,5); return [...new Set([...regional,...suggestions.map(v=>caseLike(w,v))])].slice(0,5); }
    catch(e) { /* use the safe fallback below */ }
  }
  return regional;
}
let dictionaryLoadPromise=null;
async function loadSpellingEngine(language){
  if(spellingEngines[language])return spellingEngines[language];
  if(!dictionaryLoadPromise){
    dictionaryLoadPromise=(async()=>{
      if(typeof window.Typo!=="function")throw new Error("Typo.js did not load");
      // Use the well-maintained English Hunspell dictionary as the shared base;
      // UK/US vocabulary differences are handled explicitly in opts().
      const base="https://cdn.jsdelivr.net/npm/dictionary-en@4.0.0/index";
      const [affResponse,dicResponse]=await Promise.all([fetch(base+".aff"),fetch(base+".dic")]);
      if(!affResponse.ok||!dicResponse.ok)throw new Error("Dictionary files could not be downloaded");
      const [aff,dic]=await Promise.all([affResponse.text(),dicResponse.text()]);
      if(!aff.trim()||!dic.trim())throw new Error("Dictionary files were empty");
      const engine=new window.Typo("en_US",aff,dic);
      if(typeof engine.check!=="function"||typeof engine.suggest!=="function")throw new Error("Spell-check engine initialisation failed");
      spellingEngines.en_US=engine; spellingEngines.en_GB=engine;
      return engine;
    })().catch(error=>{dictionaryLoadPromise=null;throw error});
  }
  return dictionaryLoadPromise;
}
async function initializeDictionaries(){
  const status=$("status");
  if(status)status.textContent="Loading English spelling dictionary…";
  const results=await Promise.allSettled([loadSpellingEngine("en_US"),loadSpellingEngine("en_GB")]);
  engineState=results.some(r=>r.status==="fulfilled")?"ready":"fallback";
  render(true);
  if(status){
    status.textContent=engineState==="ready"?"Dictionary ready · spelling suggestions enabled":"Offline fallback active · full dictionary unavailable";
  }
}
function caretOffset(){
  const sel=getSelection();
  if(!sel.rangeCount||!editor.contains(sel.anchorNode))return text().length;
  const target=sel.getRangeAt(0).cloneRange();
  const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
  let node,total=0;
  while(node=walker.nextNode()){
    if(node.parentElement?.closest(".inline-suggestions"))continue;
    if(node===sel.anchorNode){return total+Math.min(sel.anchorOffset,node.length)}
    const part=document.createRange();part.selectNodeContents(editor);
    try{part.setEnd(node,node.length);total=part.toString().length}catch{}
  }
  return text().length;
}
function setCaret(n){
  const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
  let node,remaining=Math.max(0,n),last=null;
  while(node=walker.nextNode()){
    if(node.parentElement?.closest(".inline-suggestions"))continue;
    last=node;
    if(remaining<=node.length){
      const range=document.createRange();range.setStart(node,remaining);range.collapse(true);
      const sel=getSelection();sel.removeAllRanges();sel.addRange(range);return;
    }
    remaining-=node.length;
  }
  if(last){
    const range=document.createRange();range.setStart(last,last.length);range.collapse(true);
    const sel=getSelection();sel.removeAllRanges();sel.addRange(range);
  }else editor.focus();
}
function act(label,fn,cls="inline-action"){let b=document.createElement("button");b.type="button";b.className=cls;b.textContent=label;b.contentEditable="false";b.onmousedown=e=>e.preventDefault();b.onclick=e=>{e.preventDefault();fn()};return b}

function appendTextWithBreaks(parent,value){const parts=String(value).split("\n");parts.forEach((part,i)=>{if(part)parent.append(document.createTextNode(part));if(i<parts.length-1)parent.append(document.createElement("br"));});}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));}
function updateComparison(original, corrected){
  const op=$("originalPreview"), cp=$("correctedPreview");
  if(!op||!cp)return;
  const wordRe=/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
  const wordsA=[...original.matchAll(wordRe)], wordsB=[...corrected.matchAll(wordRe)];
  const changedA=new Set(), changedB=new Set();
  // Mark word positions that differ while retaining punctuation and spacing.
  const n=Math.max(wordsA.length,wordsB.length);
  for(let i=0;i<n;i++){
    const a=wordsA[i]?.[0], b=wordsB[i]?.[0];
    if(a!==undefined && b!==undefined && a.toLowerCase()!==b.toLowerCase()){changedA.add(i);changedB.add(i);}
    else if(a!==undefined && b===undefined)changedA.add(i);
    else if(a===undefined && b!==undefined)changedB.add(i);
  }
  function markup(text, matches, changed, klass){
    let out="",pos=0;
    matches.forEach((m,i)=>{
      out+=escapeHTML(text.slice(pos,m.index));
      const word=escapeHTML(m[0]);
      out+=changed.has(i)?`<mark class="${klass}">${word}</mark>`:word;
      pos=m.index+m[0].length;
    });
    return out+escapeHTML(text.slice(pos));
  }
  op.innerHTML=markup(original,wordsA,changedA,"word-original-change");
  cp.innerHTML=markup(corrected,wordsB,changedB,"word-corrected-change");
  if(!original && !corrected){op.textContent="Your original text will appear here.";cp.textContent="Accepted corrections will appear here."}
  const count=Math.max(changedA.size,changedB.size);
  $("changeSummary").textContent=count?`${count} changed word${count===1?"":"s"} highlighted`:"No corrections applied";
}
let activeSuggestion=null;
function closeSuggestionPopup(){
  const popup=$("suggestionPopup");
  if(popup){popup.hidden=true;popup.replaceChildren();}
  activeSuggestion=null;
}
function showSuggestionPopup(err, info){
  const popup=$("suggestionPopup");
  if(!popup)return;
  closeSuggestionPopup();
  activeSuggestion=info;
  info.o.slice(0,4).forEach(v=>popup.append(act(caseLike(info.w,v),()=>replace(info.s,info.e,caseLike(info.w,v)),"suggestion-choice")));
  popup.append(act("Ignore",()=>{ignored.add(info.w.toLowerCase());closeSuggestionPopup();render(true)},"popup-action popup-ignore"));
  popup.append(act("Add to dictionary",()=>{personal.add(info.w.toLowerCase());try{localStorage.setItem("toolboxSpellPersonalDictionary",JSON.stringify([...personal]))}catch{}closeSuggestionPopup();render(true)},"popup-action popup-add-dictionary"));
  const wrap=$("editorWrap"), er=err.getBoundingClientRect(), wr=wrap.getBoundingClientRect();
  popup.style.left=Math.max(6,Math.min(er.left-wr.left,wr.width-260))+"px";
  popup.style.top=Math.min(er.bottom-wr.top+3,wrap.clientHeight-38)+"px";
  popup.hidden=false;
}
function render(keepCaret=false){
  const t=text(),caret=keepCaret?caretOffset():null,found=[];
  const re=/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
  let m;
  while((m=re.exec(t))){const o=opts(m[0]);if(o.length)found.push({w:m[0],s:m.index,e:m.index+m[0].length,o});}
  closeSuggestionPopup();
  const frag=document.createDocumentFragment();let p=0;
  for(const it of found){
    appendTextWithBreaks(frag,t.slice(p,it.s));
    const err=document.createElement("span");
    err.className="spell-error";
    err.textContent=it.w;
    err.dataset.start=String(it.s);err.dataset.end=String(it.e);
    err.dataset.word=it.w;
    err.title="Click to view spelling suggestions";
    frag.append(err);p=it.e;
  }
  appendTextWithBreaks(frag,t.slice(p));
  editor.replaceChildren(frag);
  $("wordCount")&&($("wordCount").textContent=(t.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu)||[]).length+" words");
  $("errorCount")&&($("errorCount").textContent=found.length+" issue"+(found.length===1?"":"s"));
  $("status")&&($("status").textContent=t.trim()?found.length+" possible spelling issue"+(found.length===1?"":"s")+" found":"Ready to check");
  updateComparison(comparisonOriginal || t,t);
  if(caret!==null)setCaret(caret);
}
editor.addEventListener("click",e=>{
  const err=e.target.closest(".spell-error");
  if(!err){if(!e.target.closest("#suggestionPopup"))closeSuggestionPopup();return;}
  const w=err.dataset.word, s=Number(err.dataset.start), end=Number(err.dataset.end);
  showSuggestionPopup(err,{w,s,e:end,o:opts(w)});
});
document.addEventListener("click",e=>{
  if(!e.target.closest(".spell-error")&&!e.target.closest("#suggestionPopup")) closeSuggestionPopup();
});
// A click or focus change elsewhere in the editor must also dismiss the popup.
$("editor")?.addEventListener("click",e=>{
  if(!e.target.closest(".spell-error")) closeSuggestionPopup();
});
$("editor")?.addEventListener("keydown",e=>{
  if(e.key==="Escape") closeSuggestionPopup();
});
function replace(s,e,v){undoText=text();if(!comparisonOriginal||comparisonOriginal===text())comparisonOriginal=text();$("undoBtn")&&($("undoBtn").disabled=false);let t=text();editor.textContent=t.slice(0,s)+v+t.slice(e);render();setCaret(s+v.length);editor.focus()}
// Handle Enter explicitly. Re-rendering a contenteditable immediately after its
// native Enter action can collapse the browser-created DIV/BR and lose the line break.
// Keep native contenteditable Enter behavior. Do not replace editor DOM on keydown.
let checkTimer=null;
let isChecking=false;
function setChecking(active){
  isChecking=active;
  const btn=$("checkBtn");
  if(!btn)return;
  if(active){
    btn.dataset.originalLabel ||= btn.textContent;
    btn.classList.add("is-checking");
    btn.disabled=true;
    btn.textContent="Checking…";
  }else{
    btn.classList.remove("is-checking");
    btn.disabled=false;
    btn.textContent=btn.dataset.originalLabel||"Check spelling →";
  }
}
const typingPauseMs = 900; // Wait until the user pauses before running spell analysis.
function runSpellCheck(){
  clearTimeout(checkTimer);
  setChecking(true);
  // Yield to the browser so the loading indicator appears before processing.
  setTimeout(()=>{try{comparisonOriginal=text();render(true)}finally{setChecking(false)}},20);
}
function autoCheckEnabled(){
  return $("autoCheck")?.checked === true;
}
function scheduleSpellCheck(){
  clearTimeout(checkTimer);
  if(!autoCheckEnabled()) return;
  checkTimer=setTimeout(()=>{
    if(!isChecking && autoCheckEnabled()) runSpellCheck();
  }, typingPauseMs);
}
editor.addEventListener("input",()=>{
  comparisonOriginal=text();
  // Keep native editing responsive. Only analyze after the pause when auto-check is enabled.
  scheduleSpellCheck();
});
editor.addEventListener("paste",()=>{
  // Let the browser finish inserting pasted content; the input event schedules
  // one check after the pause, but only when auto-check is enabled.
  clearTimeout(checkTimer);
});
$("autoCheck")?.addEventListener("change",()=>{
  clearTimeout(checkTimer);
  if(autoCheckEnabled() && text().trim()) scheduleSpellCheck();
});
$("checkBtn")?.addEventListener("click",runSpellCheck);
$("clearBtn")?.addEventListener("click",()=>{undoText=text();$("undoBtn")&&($("undoBtn").disabled=false);editor.textContent="";render();editor.focus()});
$("undoBtn")?.addEventListener("click",()=>{if(undoText===null)return;let current=text();editor.textContent=undoText;undoText=current;render();});
$("language")?.addEventListener("change",()=>render(true));

function download(n,c,t){let u=URL.createObjectURL(new Blob([c],{type:t+";charset=utf-8"})),a=document.createElement("a");a.href=u;a.download=n;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
$("downloadTxtBtn")?.addEventListener("click",()=>download("spell-check-result.txt",text(),"text/plain"));
$("txtFile")?.addEventListener("change",async e=>{let f=e.target.files?.[0];if(!f)return;undoText=text();editor.textContent=await f.text();$("fileName")&&($("fileName").textContent=f.name);render()});
// Spreadsheet workflow: CSV, XLS and XLSX. Original cells are retained; corrected
// values are appended to new columns and the output is downloaded as XLSX.
let workbook=null, activeSheetName=null, sheetRows=null, sheetHeaders=null, selectedColumns=new Set(), sourceFileName="workbook";
function safeCell(v){return v===undefined||v===null?"":String(v)}
function csvParse(s){
  const rows=[]; let row=[], cell="", quoted=false;
  for(let i=0;i<s.length;i++){const ch=s[i];
    if(ch==='"'&&quoted&&s[i+1]==='"'){cell+='"';i++}
    else if(ch==='"'){quoted=!quoted}
    else if(ch===","&&!quoted){row.push(cell);cell=""}
    else if((ch==="\n"||ch==="\r")&&!quoted){if(ch==="\r"&&s[i+1]==="\n")i++;row.push(cell);rows.push(row);row=[];cell=""}
    else cell+=ch;
  }
  row.push(cell); if(row.some(v=>v!=="")||rows.length===0)rows.push(row); return rows;
}
function csvEscape(v){const s=safeCell(v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function showExcelPanel(){const p=$("excelPanel");if(p)p.hidden=false;$("downloadExcelBtn").hidden=false;$("downloadExcelBtn").disabled=true}
function resetExcelPanel(){workbook=null;activeSheetName=null;sheetRows=null;sheetHeaders=null;selectedColumns.clear();loadedColumnIndex=null;loadedColumnHeader=null;originalEditorText="";outputRows=null;window._spellOutputRows=null;$("sheetSelect").replaceChildren();$("columnChoices").replaceChildren();$("excelPreview").replaceChildren();setExcelDownloadReady(false);$("excelStatus").textContent=""}
function renderColumnChoices(){
  const box=$("columnChoices");box.replaceChildren();if(!sheetHeaders)return;
  sheetHeaders.forEach((h,i)=>{const label=document.createElement("label");label.className="column-choice";
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=selectedColumns.has(i);
    cb.addEventListener("change",()=>{cb.checked?selectedColumns.add(i):selectedColumns.delete(i)});
    const span=document.createElement("span");span.textContent=(i+1)+". "+safeCell(h||("Column "+(i+1)));
    label.append(cb,span);box.append(label);
  });
}
function previewTable(rows){
  const wrap=$("excelPreview");wrap.replaceChildren();if(!rows?.length)return;
  const table=document.createElement("table");table.className="excel-table";
  rows.slice(0,8).forEach((row,ri)=>{const tr=document.createElement("tr");row.forEach(v=>{const cell=document.createElement(ri===0?"th":"td");cell.textContent=safeCell(v);tr.append(cell)});table.append(tr)});
  wrap.append(table);if(rows.length>8){const note=document.createElement("p");note.className="subtle";note.textContent=`Preview shows first 7 data rows of ${rows.length-1} total data rows.`;wrap.append(note)}
}
function setSheet(name){
  activeSheetName=name;
  if(workbook){sheetRows=XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:"",raw:false});}
  if(!sheetRows||!sheetRows.length)sheetRows=[[""]];
  sheetHeaders=sheetRows[0].map((v,i)=>safeCell(v)||("Column "+(i+1)));
  selectedColumns=new Set();renderColumnChoices();previewTable(sheetRows);
  $("excelStatus").textContent=`${name}: ${Math.max(0,sheetRows.length-1)} data rows, ${sheetHeaders.length} columns. Select the columns that contain text.`;
  setExcelDownloadReady(false);
}
$("excelFile")?.addEventListener("change",async e=>{
  const f=e.target.files?.[0];if(!f)return;resetExcelPanel();sourceFileName=f.name.replace(/\.[^.]+$/,"");$("fileName").textContent=f.name;showExcelPanel();
  try{
    const ext=f.name.split(".").pop().toLowerCase();
    if(ext==="csv"){
      const rows=csvParse(await f.text());sheetRows=rows;workbook=null;activeSheetName="CSV";const opt=document.createElement("option");opt.value="CSV";opt.textContent="CSV";$("sheetSelect").append(opt);setSheet("CSV");
    }else if(ext==="xlsx"||ext==="xls"){
      if(!window.XLSX)throw new Error("The Excel reader library did not load. Connect to the internet, refresh the page, and try again.");
      const data=await f.arrayBuffer();workbook=XLSX.read(data,{type:"array",cellDates:false});
      workbook.SheetNames.forEach(n=>{const o=document.createElement("option");o.value=n;o.textContent=n;$("sheetSelect").append(o)});
      if(!workbook.SheetNames.length)throw new Error("No worksheets found in this workbook.");
      setSheet(workbook.SheetNames[0]);
    }else throw new Error("Please upload a .xlsx, .xls, or .csv file.");
  }catch(err){resetExcelPanel();$("excelStatus").textContent=err.message;alert(err.message)}
});
$("sheetSelect")?.addEventListener("change",()=>{if(workbook)setSheet($("sheetSelect").value)});
$("clearExcelBtn")?.addEventListener("click",()=>{
  resetExcelPanel();
  $("excelFile").value="";
  $("fileName").textContent="No file selected";
  $("excelPanel").hidden=true;
});
function correctCell(value){
  const language=$("language")?.value||"en_US";
  const localPersonal=personal;
  return safeCell(value).replace(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu,w=>{
    const lower=w.toLowerCase();if(localPersonal.has(lower)||ignored.has(lower)||validTech.has(lower)||technicalWords.has(lower))return w;
    const us={colour:"color",favourite:"favorite",centre:"center",organise:"organize",analyse:"analyze"};
    const uk={color:"colour",favorite:"favourite",center:"centre",organize:"organise",analyze:"analyse"};
    const candidate=(language==="en_GB"?uk[lower]:us[lower])||misspellings[lower]?.[0];
    return candidate?caseLike(w,candidate):w;
  });
}
let loadedColumnIndex=null, loadedColumnHeader=null, originalEditorText="", outputRows=null;
function setExcelDownloadReady(ready){
  let btn=$("downloadExcelBtn");
  if(!btn){
    const actions=document.querySelector(".excel-workflow-actions");
    if(!actions)return;
    btn=document.createElement("button");
    btn.id="downloadExcelBtn";
    btn.type="button";
    btn.className="btn primary";
    btn.textContent="Download corrected Excel";
    actions.insertBefore(btn, $("clearExcelBtn") || null);
    btn.addEventListener("click", downloadCorrectedSpreadsheet);
  }
  btn.hidden=false;
  btn.removeAttribute("hidden");
  btn.style.setProperty("display","inline-flex","important");
  btn.style.setProperty("visibility","visible","important");
  btn.disabled=!ready;
  btn.setAttribute("aria-label", ready ? "Download corrected Excel file" : "Save corrected text before downloading");
}

function selectedSingleColumn(){
  if(!sheetRows||!sheetHeaders){$("excelStatus").textContent="Upload a spreadsheet first.";return null}
  if(selectedColumns.size!==1){$("excelStatus").textContent="Select exactly one column to load into Your text. Save it back before selecting another column.";return null}
  return [...selectedColumns][0];
}
$("loadColumnBtn")?.addEventListener("click",()=>{
  const idx=selectedSingleColumn();if(idx===null||idx===undefined)return;
  loadedColumnIndex=idx;loadedColumnHeader=sheetHeaders[idx];
  const values=sheetRows.slice(1).map(row=>safeCell(row?.[idx]??""));
  originalEditorText=values.join("\n");
  undoText=text();editor.textContent=originalEditorText;render();
  $("saveColumnBtn").hidden=false;setExcelDownloadReady(false);
  $("excelStatus").textContent=`Loaded "${loadedColumnHeader}" (${values.length} rows) into Your text. Correct spelling in the editor above, then click "Save corrected text to Excel". Keep each line on its original row.`;
  document.querySelector(".editor-card")?.scrollIntoView({behavior:"smooth",block:"start"});
  editor.focus();
});
$("saveColumnBtn")?.addEventListener("click",()=>{
  if(loadedColumnIndex===null){$("excelStatus").textContent="Load a column into Your text first.";return}
  const correctedText=text();
  const correctedLines=correctedText.split(/\r?\n/);
  const originalLines=originalEditorText.split(/\r?\n/);
  const expected=Math.max(0,sheetRows.length-1);
  if(correctedLines.length!==expected){
    const ok=confirm(`The editor now contains ${correctedLines.length} lines, but the worksheet has ${expected} data rows. Saving by row could misalign values. Continue anyway?`);
    if(!ok)return;
  }
  const headerName=`CORRECTED_${loadedColumnHeader}`;
  let uniqueName=headerName,suffix=2;
  while(sheetHeaders.includes(uniqueName))uniqueName=`${headerName}_${suffix++}`;
  const output=sheetRows.map((row,ri)=>{
    const base=row.slice();
    if(ri===0)base.push(uniqueName);
    else base.push(correctedLines[ri-1]??"");
    return base;
  });
  outputRows=output;window._spellOutputRows=output;
  // Add the corrected header to the current in-memory sheet so the next column can be processed safely.
  sheetRows=output;sheetHeaders=sheetRows[0].map((v,i)=>safeCell(v)||("Column "+(i+1)));
  previewTable(output);
  $("excelStatus").textContent=`Saved editor text into the new column "${uniqueName}". Original "${loadedColumnHeader}" values are unchanged. You can download now, or select another original column and load it.`;
  setExcelDownloadReady(true);
  $("loadColumnBtn").textContent="Load selected column into Your text";
});
$("downloadExcelBtn")?.addEventListener("click",()=>{
  const rows=outputRows||window._spellOutputRows;if(!rows?.length)return;
  const lang=$("language")?.value==="en_GB"?"UK":"US";
  if(workbook&&window.XLSX){
    const outBook=XLSX.utils.book_new();
    workbook.SheetNames.forEach(name=>{
      const data=name===activeSheetName?rows:XLSX.utils.sheet_to_json(workbook.Sheets[name],{header:1,defval:"",raw:false});
      XLSX.utils.book_append_sheet(outBook,XLSX.utils.aoa_to_sheet(data),name.slice(0,31));
    });
    download(`${sourceFileName}_SPELL_CHECKED_${lang}.xlsx`,XLSX.write(outBook,{bookType:"xlsx",type:"array"}),"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  }else{
    const csv=rows.map(row=>row.map(csvEscape).join(",")).join("\r\n");
    download(`${sourceFileName}_SPELL_CHECKED_${lang}.csv`,"\ufeff"+csv,"text/csv");
  }
});
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x===b));let c=$("comparison");if(c){c.classList.toggle("single-original",b.dataset.view==="original");c.classList.toggle("single-corrected",b.dataset.view==="corrected")}}));
render();
initializeDictionaries().catch(()=>{engineState="fallback";render(true);if($("status"))$("status").textContent="Offline fallback active · full dictionary unavailable"});
})();

/* V2: reliable pointer-based resizing of the whole editor container. */
(() => {
  const wrap = document.getElementById('editorWrap');
  const handle = document.getElementById('editorResizeHandle');
  if (!wrap || !handle) return;

  let startY = 0;
  let startHeight = 0;
  let activePointerId = null;

  const limits = () => ({
    min: 220,
    max: Math.max(320, Math.floor(window.innerHeight * 0.8))
  });

  function setHeight(height) {
    const { min, max } = limits();
    const clamped = Math.max(min, Math.min(max, height));
    wrap.style.setProperty('height', `${clamped}px`, 'important');
  }

  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    event.stopPropagation();
    startY = event.clientY;
    startHeight = wrap.getBoundingClientRect().height;
    activePointerId = event.pointerId;
    wrap.classList.add('is-resizing');
    try { handle.setPointerCapture(event.pointerId); } catch (_) {}
  });

  handle.addEventListener('pointermove', (event) => {
    if (activePointerId === null || event.pointerId !== activePointerId) return;
    event.preventDefault();
    setHeight(startHeight + (event.clientY - startY));
  });

  function finishResize(event) {
    if (activePointerId === null) return;
    if (event && event.pointerId !== undefined && event.pointerId !== activePointerId) return;
    activePointerId = null;
    wrap.classList.remove('is-resizing');
  }

  handle.addEventListener('pointerup', finishResize);
  handle.addEventListener('pointercancel', finishResize);
  window.addEventListener('blur', () => finishResize());
  window.addEventListener('resize', () => {
    const { max } = limits();
    if (wrap.getBoundingClientRect().height > max) setHeight(max);
  });
})();

/* Keep Original and Corrected Preview aligned while avoiding two visible vertical scrollbars. */
(() => {
  const original = document.getElementById("originalPreview");
  const corrected = document.getElementById("correctedPreview");
  if (!original || !corrected) return;
  let syncing = false;
  function sync(source, target) {
    if (syncing) return;
    syncing = true;
    target.scrollTop = source.scrollTop;
    // Keep horizontal position aligned as well when long technical lines are present.
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => { syncing = false; });
  }
  original.addEventListener("scroll", () => sync(original, corrected), { passive: true });
  corrected.addEventListener("scroll", () => sync(corrected, original), { passive: true });
  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.view;
      const comparison = document.getElementById("comparison");
      if (!comparison) return;
      comparison.classList.toggle("single-original", mode === "original");
      comparison.classList.toggle("single-corrected", mode === "corrected");
    });
  });
})();
