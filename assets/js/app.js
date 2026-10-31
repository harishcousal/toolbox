(() => {
"use strict";
const $=id=>document.getElementById(id), editor=$("editor"); if(!editor)return;
let undoText=null; let comparisonOriginal=""; const ignored=new Set(); let personal=new Set();
try{personal=new Set(JSON.parse(localStorage.getItem("toolboxSpellPersonalDictionary")||"[]"))}catch{}
const misspellings={calbe:["cable","cables"],taxt:["text","tax"],teaxt:["text"],recieve:["receive","received"],receieve:["receive","received"],eletrical:["electrical"],connetor:["connector"],dimensoin:["dimension","dimensions"],stainles:["stainless"],bracet:["bracket"],maintenence:["maintenance"],maintanence:["maintenance"],presssure:["pressure"],seperate:["separate"],definately:["definitely"],enviroment:["environment"],compatable:["compatible"],lenght:["length"],widht:["width"],thikness:["thickness"],transmiter:["transmitter"],assembely:["assembly"],centifugal:["centrifugal"],housng:["housing"],waterpmp:["waterpump"]};
const validTech=new Set("filter unit fluid pressure equipment name hydraulic control system opto coupler phoenix contact type crossbar stainless steel bracket width thickness length range bar connector electrical pump assembly centrifugal bearing housing drawing number cable waterpump maintenance transmitter voltage current mm dc ac dek pn".split(/\s+/));
// Read only the user's actual editor text. Inline suggestion controls are UI,
 // not document content; excluding them prevents button labels entering the text.
const text=()=>{const clone=editor.cloneNode(true);clone.querySelectorAll(".inline-suggestions").forEach(n=>n.remove());return (clone.innerText||clone.textContent||"").replace(/\\u00a0/g," ")};
const caseLike=(w,s)=>w===w.toUpperCase()?s.toUpperCase():w[0]===w[0].toUpperCase()?s[0].toUpperCase()+s.slice(1):s;
function opts(w){let x=w.toLowerCase();if(personal.has(x)||ignored.has(x)||validTech.has(x))return[];const us={colour:["color"],favourite:["favorite"],centre:["center"],organise:["organize"],analyse:["analyze"]},uk={color:["colour"],favorite:["favourite"],center:["centre"],organize:["organise"],analyze:["analyse"]};return (($("language")?.value==="en_GB")?(uk[x]||misspellings[x]):(us[x]||misspellings[x]))||[]}
function caretOffset(){let s=getSelection();if(!s.rangeCount||!editor.contains(s.anchorNode))return text().length;let r=s.getRangeAt(0).cloneRange();r.selectNodeContents(editor);r.setEnd(s.anchorNode,s.anchorOffset);return r.toString().length}
function setCaret(n){let w=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT),node,rem=n;while(node=w.nextNode()){if(rem<=node.length){let r=document.createRange();r.setStart(node,rem);r.collapse(true);let s=getSelection();s.removeAllRanges();s.addRange(r);return}rem-=node.length}editor.focus()}
function act(label,fn,cls="inline-action"){let b=document.createElement("button");b.type="button";b.className=cls;b.textContent=label;b.contentEditable="false";b.onmousedown=e=>e.preventDefault();b.onclick=e=>{e.preventDefault();fn()};return b}

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
function render(keepCaret=false){let t=text(),caret=keepCaret?caretOffset():null,found=[],re=/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu,m;while(m=re.exec(t)){let o=opts(m[0]);if(o.length)found.push({w:m[0],s:m.index,e:m.index+m[0].length,o})}
let frag=document.createDocumentFragment(),p=0;
for(let it of found){frag.append(document.createTextNode(t.slice(p,it.s)));let err=document.createElement("span");err.className="spell-error";err.textContent=it.w;frag.append(err);let row=document.createElement("span");row.className="inline-suggestions";row.contentEditable="false";
it.o.slice(0,4).forEach(v=>row.append(act(caseLike(it.w,v),()=>replace(it.s,it.e,caseLike(it.w,v)),"")));
row.append(act("Ignore",()=>{ignored.add(it.w.toLowerCase());render(true)}));row.append(act("Add to dictionary",()=>{personal.add(it.w.toLowerCase());try{localStorage.setItem("toolboxSpellPersonalDictionary",JSON.stringify([...personal]))}catch{}render(true)}));frag.append(row);p=it.e}
frag.append(document.createTextNode(t.slice(p)));editor.replaceChildren(frag);
$("wordCount")&&($("wordCount").textContent=(t.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu)||[]).length+" words");
$("errorCount")&&($("errorCount").textContent=found.length+" issue"+(found.length===1?"":"s"));
$("status")&&($("status").textContent=t.trim()?found.length+" possible spelling issue"+(found.length===1?"":"s")+" found":"Ready to check");
updateComparison(comparisonOriginal || t, t);

if(caret!==null)setCaret(caret)}
function replace(s,e,v){undoText=text();if(!comparisonOriginal||comparisonOriginal===text())comparisonOriginal=text();$("undoBtn")&&($("undoBtn").disabled=false);let t=text();editor.textContent=t.slice(0,s)+v+t.slice(e);render();setCaret(s+v.length);editor.focus()}
editor.addEventListener("input",()=>{comparisonOriginal=text();render()});
$("checkBtn")?.addEventListener("click",()=>render(true));
$("clearBtn")?.addEventListener("click",()=>{undoText=text();$("undoBtn")&&($("undoBtn").disabled=false);editor.textContent="";render();editor.focus()});
$("undoBtn")?.addEventListener("click",()=>{if(undoText===null)return;let current=text();editor.textContent=undoText;undoText=current;render();});
$("language")?.addEventListener("change",()=>render(true));
$("autoCheck")?.addEventListener("change",()=>{if($("autoCheck").checked)render(true)});
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
    const lower=w.toLowerCase();if(localPersonal.has(lower)||ignored.has(lower)||validTech.has(lower))return w;
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
