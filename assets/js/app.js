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
    wich
