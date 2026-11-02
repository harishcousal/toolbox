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
  const appliedCorrections = [];

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
    wich: ["which"],
    teh: ["the"],
    thier: ["their"],
    freind: ["friend"],
    adress: ["address"],
    goverment: ["government"],
    managment: ["management"],
    equipement: ["equipment"],
    equipmant: ["equipment"],
    componant: ["component"],
    compnent: ["component"],
    instalation: ["installation"],
    specifcation: ["specification"],
    specifiaction: ["specification"],
    mesurement: ["measurement"],
    measurment: ["measurement"],
    lenghts: ["lengths"],
    widhts: ["widths"],
    heigth: ["height"],
    heigtht: ["height"],
    conected: ["connected"],
    conection: ["connection"],
    connecion: ["connection"],
    suport: ["support"],
    suplly: ["supply"],
    volatge: ["voltage"],
    curent: ["current"],
    frequence: ["frequency"],
    frequecy: ["frequency"],
    tranformer: ["transformer"],
    transformor: ["transformer"],
    swich: ["switch"],
    swith: ["switch"],
    releay: ["relay"],
    relaye: ["relay"],
    circut: ["circuit"],
    ciruit: ["circuit"],
    moter: ["motor"],
    engin: ["engine"],
    bearng: ["bearing"],
    lubrification: ["lubrication"],
    lubracation: ["lubrication"],
    hydralic: ["hydraulic"],
    hydraullic: ["hydraulic"],
    pneumatc: ["pneumatic"],
    pneumetic: ["pneumatic"],
    presure: ["pressure"],
    temprature: ["temperature"],
    temparature: ["temperature"],
    vibartion: ["vibration"],
    vibraion: ["vibration"],
    corrotion: ["corrosion"],
    corrosian: ["corrosion"],
    dimenssion: ["dimension"],
    specifiy: ["specify"],
    refered: ["referred"],
    referance: ["reference"],
    descrption: ["description"],
    descripton: ["description"],
    identifed: ["identified"],
    identifiy: ["identify"],
    avilable: ["available"],
    availble: ["available"],
    recomend: ["recommend"],
    recomendation: ["recommendation"],
    neccessary: ["necessary"],
    necesary: ["necessary"],
    sucessful: ["successful"],
    sucessfully: ["successfully"],
    usefull: ["useful"],
    comming: ["coming"],
    diferent: ["different"],
    diffrent: ["different"],
    similiar: ["similar"],
    simmilar: ["similar"],
    prefered: ["preferred"],
    occassion: ["occasion"],
    accomodation: ["accommodation"],
    responsibilty: ["responsibility"],
    knowlege: ["knowledge"],
    relevent: ["relevant"],
    consistant: ["consistent"],
    consistancy: ["consistency"],
    effecient: ["efficient"],
    efficent: ["efficient"],
    beginers: ["beginners"],
    calender: ["calendar"],
    febuary: ["February"],
    januray: ["January"],
    tommorow: ["tomorrow"],
    yestarday: ["yesterday"],
    reciept: ["receipt"],
    wierd: ["weird"],
    truely: ["truly"],
    basicly: ["basically"],
    actualy: ["actually"],
    finaly: ["finally"],
    usualy: ["usually"],
    realy: ["really"],
    probaly: ["probably"],
    obviusly: ["obviously"],
    definitly: ["definitely"],
    throught: ["through"],
    thoughout: ["throughout"],
    alchohol: ["alcohol"],
    acheive: ["achieve"],
    acheived: ["achieved"],
    acheiving: ["achieving"],
    beleive: ["believe"],
    beleived: ["believed"],
    concious: ["conscious"],
    existance: ["existence"],
    independant: ["independent"],
    independantly: ["independently"],
    immediatly: ["immediately"],
    imediately: ["immediately"],
    normaly: ["normally"],
    corectly: ["correctly"],
    occuring: ["occurring"],
    privelege: ["privilege"],
    publically: ["publicly"],
    seperateley: ["separately"],
    succesful: ["successful"],
    succesfully: ["successfully"],
    writting: ["writing"],
    writen: ["written"],
    whereever: ["wherever"],
    wheather: ["whether", "weather"],
    "thier's": ["theirs"],
    alot: ["a lot"],
    infront: ["in front"],
    aswell: ["as well"],
    stl: ["steel"],
    incorrecty: ["incorrectly"],
    incorectly: ["incorrectly"],
    carefuly: ["carefully"],
    accuratly: ["accurately"],
    accurateley: ["accurately"],
    successfullly: ["successfully"],
    succesfuly: ["successfully"],
    immediatley: ["immediately"],
    normalley: ["normally"],
    usualy: ["usually"],
    finaly: ["finally"],
    actualy: ["actually"],
    realy: ["really"],
    probaly: ["probably"],
    obviusly: ["obviously"]
  };

  /*
   * US / UK spelling pairs.
   * First value = UK, second value = US.
   */
  const spellingVariants = [
    ["colour", "color"],
    ["colours", "colors"],
    ["colourful", "colorful"],
    ["colouring", "coloring"],
    ["favourite", "favorite"],
    ["favourites", "favorites"],
    ["honour", "honor"],
    ["honours", "honors"],
    ["honoured", "honored"],
    ["honouring", "honoring"],
    ["labour", "labor"],
    ["labours", "labors"],
    ["neighbour", "neighbor"],
    ["neighbours", "neighbors"],
    ["neighbourhood", "neighborhood"],
    ["neighbouring", "neighboring"],
    ["centre", "center"],
    ["centres", "centers"],
    ["centred", "centered"],
    ["centring", "centering"],
    ["theatre", "theater"],
    ["theatres", "theaters"],
    ["metre", "meter"],
    ["metres", "meters"],
    ["litre", "liter"],
    ["litres", "liters"],
    ["kilometre", "kilometer"],
    ["kilometres", "kilometers"],
    ["organise", "organize"],
    ["organises", "organizes"],
    ["organised", "organized"],
    ["organising", "organizing"],
    ["organisation", "organization"],
    ["organisations", "organizations"],
    ["realise", "realize"],
    ["realises", "realizes"],
    ["realised", "realized"],
    ["realising", "realizing"],
    ["recognise", "recognize"],
    ["recognised", "recognized"],
    ["recognises", "recognizes"],
    ["recognising", "recognizing"],
    ["analyse", "analyze"],
    ["analysed", "analyzed"],
    ["analyses", "analyzes"],
    ["analysing", "analyzing"],
    ["paralyse", "paralyze"],
    ["paralysed", "paralyzed"],
    ["catalogue", "catalog"],
    ["catalogues", "catalogs"],
    ["dialogue", "dialog"],
    ["dialogues", "dialogs"],
    ["travelling", "traveling"],
    ["travelled", "traveled"],
    ["traveller", "traveler"],
    ["travellers", "travelers"],
    ["cancelled", "canceled"],
    ["cancelling", "canceling"],
    ["counselling", "counseling"],
    ["counsellor", "counselor"],
    ["jewellery", "jewelry"],
    ["grey", "gray"],
    ["galvanised", "galvanized"],
    ["aluminium", "aluminum"],
    ["mould", "mold"],
    ["moulds", "molds"],
    ["moulding", "molding"],
    ["programme", "program"],
    ["programmes", "programs"],
    ["licence", "license"],
    ["licences", "licenses"],
    ["defence", "defense"],
    ["offence", "offense"],
    ["pretence", "pretense"],
    ["practise", "practice"],
    ["practised", "practiced"],
    ["practising", "practicing"],
    ["tyre", "tire"],
    ["tyres", "tires"],
    ["accessorise", "accessorize"],
    ["accessorised", "accessorized"],
    ["accessorises", "accessorizes"],
    ["accessorising", "accessorizing"],
    ["acclimatisation", "acclimatization"],
    ["acclimatise", "acclimatize"],
    ["acclimatised", "acclimatized"],
    ["acclimatises", "acclimatizes"],
    ["acclimatising", "acclimatizing"],
    ["accoutrements", "accouterments"],
    ["aeon", "eon"],
    ["aeons", "eons"],
    ["aerogramme", "aerogram"],
    ["aerogrammes", "aerograms"],
    ["aeroplane", "airplane"],
    ["aeroplanes", "airplanes"],
    ["aesthete", "esthete"],
    ["aesthetes", "esthetes"],
    ["aesthetic", "esthetic"],
    ["aesthetically", "esthetically"],
    ["aesthetics", "esthetics"],
    ["aetiology", "etiology"],
    ["ageing", "aging"],
    ["aggrandisement", "aggrandizement"],
    ["agonise", "agonize"],
    ["agonised", "agonized"],
    ["agonises", "agonizes"],
    ["agonising", "agonizing"],
    ["agonisingly", "agonizingly"],
    ["almanack", "almanac"],
    ["almanacks", "almanacs"],
    ["amortisable", "amortizable"],
    ["amortisation", "amortization"],
    ["amortisations", "amortizations"],
    ["amortise", "amortize"],
    ["amortised", "amortized"],
    ["amortises", "amortizes"],
    ["amortising", "amortizing"],
    ["amphitheatre", "amphitheater"],
    ["amphitheatres", "amphitheaters"],
    ["anaemia", "anemia"],
    ["anaemic", "anemic"],
    ["anaesthesia", "anesthesia"],
    ["anaesthetic", "anesthetic"],
    ["anaesthetics", "anesthetics"],
    ["anaesthetise", "anesthetize"],
    ["anaesthetised", "anesthetized"],
    ["anaesthetises", "anesthetizes"],
    ["anaesthetising", "anesthetizing"],
    ["anaesthetist", "anesthetist"],
    ["anaesthetists", "anesthetists"],
    ["anaesthetize", "anesthetize"],
    ["anaesthetized", "anesthetized"],
    ["anaesthetizes", "anesthetizes"],
    ["anaesthetizing", "anesthetizing"],
    ["analogue", "analog"],
    ["analogues", "analogs"],
    ["anglicise", "anglicize"],
    ["anglicised", "anglicized"],
    ["anglicises", "anglicizes"],
    ["anglicising", "anglicizing"],
    ["annualised", "annualized"],
    ["antagonise", "antagonize"],
    ["antagonised", "antagonized"],
    ["antagonises", "antagonizes"],
    ["antagonising", "antagonizing"],
    ["apologise", "apologize"],
    ["apologised", "apologized"],
    ["apologises", "apologizes"],
    ["apologising", "apologizing"],
    ["appal", "appall"],
    ["appals", "appalls"],
    ["appetiser", "appetizer"],
    ["appetisers", "appetizers"],
    ["appetising", "appetizing"],
    ["appetisingly", "appetizingly"],
    ["arbour", "arbor"],
    ["arbours", "arbors"],
    ["archaeological", "archeological"],
    ["archaeologically", "archeologically"],
    ["archaeologist", "archeologist"],
    ["archaeologists", "archeologists"],
    ["archaeology", "archeology"],
    ["ardour", "ardor"],
    ["armour", "armor"],
    ["armoured", "armored"],
    ["armourer", "armorer"],
    ["armourers", "armorers"],
    ["armouries", "armories"],
    ["armoury", "armory"],
    ["artefact", "artifact"],
    ["artefacts", "artifacts"],
    ["authorise", "authorize"],
    ["authorised", "authorized"],
    ["authorises", "authorizes"],
    ["authorising", "authorizing"],
    ["axe", "ax"],
    ["backpedalled", "backpedaled"],
    ["backpedalling", "backpedaling"],
    ["bannister", "banister"],
    ["bannisters", "banisters"],
    ["baptise", "baptize"],
    ["baptised", "baptized"],
    ["baptises", "baptizes"],
    ["baptising", "baptizing"],
    ["bastardise", "bastardize"],
    ["bastardised", "bastardized"],
    ["bastardises", "bastardizes"],
    ["bastardising", "bastardizing"],
    ["battleaxe", "battleax"],
    ["baulk", "balk"],
    ["baulked", "balked"],
    ["baulking", "balking"],
    ["baulks", "balks"],
    ["bedevilled", "bedeviled"],
    ["bedevilling", "bedeviling"],
    ["behaviour", "behavior"],
    ["behavioural", "behavioral"],
    ["behaviourism", "behaviorism"],
    ["behaviourist", "behaviorist"],
    ["behaviourists", "behaviorists"],
    ["behaviours", "behaviors"],
    ["behove", "behoove"],
    ["behoved", "behooved"],
    ["behoves", "behooves"],
    ["bejewelled", "bejeweled"],
    ["belabour", "belabor"],
    ["belaboured", "belabored"],
    ["belabouring", "belaboring"],
    ["belabours", "belabors"],
    ["bevelled", "beveled"],
    ["bevvies", "bevies"],
    ["bevvy", "bevy"],
    ["biassed", "biased"],
    ["biassing", "biasing"],
    ["bingeing", "binging"],
    ["bougainvillaea", "bougainvillea"],
    ["bougainvillaeas", "bougainvilleas"],
    ["bowdlerise", "bowdlerize"],
    ["bowdlerised", "bowdlerized"],
    ["bowdlerises", "bowdlerizes"],
    ["bowdlerising", "bowdlerizing"],
    ["breathalyse", "breathalyze"],
    ["breathalysed", "breathalyzed"],
    ["breathalyser", "breathalyzer"],
    ["breathalysers", "breathalyzers"],
    ["breathalyses", "breathalyzes"],
    ["breathalysing", "breathalyzing"],
    ["brutalise", "brutalize"],
    ["brutalised", "brutalized"],
    ["brutalises", "brutalizes"],
    ["brutalising", "brutalizing"],
    ["buses", "busses"],
    ["busing", "bussing"],
    ["caesarean", "cesarean"],
    ["caesareans", "cesareans"],
    ["calibre", "caliber"],
    ["calibres", "calibers"],
    ["calliper", "caliper"],
    ["callipers", "calipers"],
    ["callisthenics", "calisthenics"],
    ["canalise", "canalize"],
    ["canalised", "canalized"],
    ["canalises", "canalizes"],
    ["canalising", "canalizing"],
    ["cancellation", "cancelation"],
    ["cancellations", "cancelations"],
    ["candour", "candor"],
    ["cannibalise", "cannibalize"],
    ["cannibalised", "cannibalized"],
    ["cannibalises", "cannibalizes"],
    ["cannibalising", "cannibalizing"],
    ["canonise", "canonize"],
    ["canonised", "canonized"],
    ["canonises", "canonizes"],
    ["canonising", "canonizing"],
    ["capitalise", "capitalize"],
    ["capitalised", "capitalized"],
    ["capitalises", "capitalizes"],
    ["capitalising", "capitalizing"],
    ["caramelise", "caramelize"],
    ["caramelised", "caramelized"],
    ["caramelises", "caramelizes"],
    ["caramelising", "caramelizing"],
    ["carbonise", "carbonize"],
    ["carbonised", "carbonized"],
    ["carbonises", "carbonizes"],
    ["carbonising", "carbonizing"],
    ["carolled", "caroled"],
    ["carolling", "caroling"],
    ["catalogued", "cataloged"],
    ["cataloguing", "cataloging"],
    ["catalyse", "catalyze"],
    ["catalysed", "catalyzed"],
    ["catalyses", "catalyzes"],
    ["catalysing", "catalyzing"],
    ["categorise", "categorize"],
    ["categorised", "categorized"],
    ["categorises", "categorizes"],
    ["categorising", "categorizing"],
    ["cauterise", "cauterize"],
    ["cauterised", "cauterized"],
    ["cauterises", "cauterizes"],
    ["cauterising", "cauterizing"],
    ["cavilled", "caviled"],
    ["cavilling", "caviling"],
    ["centigramme", "centigram"],
    ["centigrammes", "centigrams"],
    ["centilitre", "centiliter"],
    ["centilitres", "centiliters"],
    ["centimetre", "centimeter"],
    ["centimetres", "centimeters"],
    ["centralise", "centralize"],
    ["centralised", "centralized"],
    ["centralises", "centralizes"],
    ["centralising", "centralizing"],
    ["centrefold", "centerfold"],
    ["centrefolds", "centerfolds"],
    ["centrepiece", "centerpiece"],
    ["centrepieces", "centerpieces"],
    ["channelled", "channeled"],
    ["channelling", "channeling"],
    ["characterise", "characterize"],
    ["characterised", "characterized"],
    ["characterises", "characterizes"],
    ["characterising", "characterizing"],
    ["cheque", "check"],
    ["chequebook", "checkbook"],
    ["chequebooks", "checkbooks"],
    ["chequered", "checkered"],
    ["cheques", "checks"],
    ["chilli", "chili"],
    ["chimaera", "chimera"],
    ["chimaeras", "chimeras"],
    ["chiselled", "chiseled"],
    ["chiselling", "chiseling"],
    ["circularise", "circularize"],
    ["circularised", "circularized"],
    ["circularises", "circularizes"],
    ["circularising", "circularizing"],
    ["civilise", "civilize"],
    ["civilised", "civilized"],
    ["civilises", "civilizes"],
    ["civilising", "civilizing"],
    ["clamour", "clamor"],
    ["clamoured", "clamored"],
    ["clamouring", "clamoring"],
    ["clamours", "clamors"],
    ["clangour", "clangor"],
    ["clarinettist", "clarinetist"],
    ["clarinettists", "clarinetists"],
    ["collectivise", "collectivize"],
    ["collectivised", "collectivized"],
    ["collectivises", "collectivizes"],
    ["collectivising", "collectivizing"],
    ["colonisation", "colonization"],
    ["colonise", "colonize"],
    ["colonised", "colonized"],
    ["coloniser", "colonizer"],
    ["colonisers", "colonizers"],
    ["colonises", "colonizes"],
    ["colonising", "colonizing"],
    ["colourant", "colorant"],
    ["colourants", "colorants"],
    ["coloured", "colored"],
    ["coloureds", "coloreds"],
    ["colourfully", "colorfully"],
    ["colourize", "colorize"],
    ["colourized", "colorized"],
    ["colourizes", "colorizes"],
    ["colourizing", "colorizing"],
    ["colourless", "colorless"],
    ["commercialise", "commercialize"],
    ["commercialised", "commercialized"],
    ["commercialises", "commercializes"],
    ["commercialising", "commercializing"],
    ["compartmentalise", "compartmentalize"],
    ["compartmentalised", "compartmentalized"],
    ["compartmentalises", "compartmentalizes"],
    ["compartmentalising", "compartmentalizing"],
    ["computerise", "computerize"],
    ["computerised", "computerized"],
    ["computerises", "computerizes"],
    ["computerising", "computerizing"],
    ["conceptualise", "conceptualize"],
    ["conceptualised", "conceptualized"],
    ["conceptualises", "conceptualizes"],
    ["conceptualising", "conceptualizing"],
    ["connexion", "connection"],
    ["connexions", "connections"],
    ["contextualise", "contextualize"],
    ["contextualised", "contextualized"],
    ["contextualises", "contextualizes"],
    ["contextualising", "contextualizing"],
    ["cosier", "cozier"],
    ["cosies", "cozies"],
    ["cosiest", "coziest"],
    ["cosily", "cozily"],
    ["cosiness", "coziness"],
    ["cosy", "cozy"],
    ["councillor", "councilor"],
    ["councillors", "councilors"],
    ["counselled", "counseled"],
    ["counsellors", "counselors"],
    ["crenellated", "crenelated"],
    ["criminalise", "criminalize"],
    ["criminalised", "criminalized"],
    ["criminalises", "criminalizes"],
    ["criminalising", "criminalizing"],
    ["criticise", "criticize"],
    ["criticised", "criticized"],
    ["criticises", "criticizes"],
    ["criticising", "criticizing"],
    ["crueller", "crueler"],
    ["cruellest", "cruelest"],
    ["crystallisation", "crystallization"],
    ["crystallise", "crystallize"],
    ["crystallised", "crystallized"],
    ["crystallises", "crystallizes"],
    ["crystallising", "crystallizing"],
    ["cudgelled", "cudgeled"],
    ["cudgelling", "cudgeling"],
    ["customise", "customize"],
    ["customised", "customized"],
    ["customises", "customizes"],
    ["customising", "customizing"],
    ["cypher", "cipher"],
    ["cyphers", "ciphers"],
    ["decentralisation", "decentralization"],
    ["decentralise", "decentralize"],
    ["decentralised", "decentralized"],
    ["decentralises", "decentralizes"],
    ["decentralising", "decentralizing"],
    ["decriminalisation", "decriminalization"],
    ["decriminalise", "decriminalize"],
    ["decriminalised", "decriminalized"],
    ["decriminalises", "decriminalizes"],
    ["decriminalising", "decriminalizing"],
    ["defenceless", "defenseless"],
    ["defences", "defenses"],
    ["dehumanisation", "dehumanization"],
    ["dehumanise", "dehumanize"],
    ["dehumanised", "dehumanized"],
    ["dehumanises", "dehumanizes"],
    ["dehumanising", "dehumanizing"],
    ["demeanour", "demeanor"],
    ["demilitarisation", "demilitarization"],
    ["demilitarise", "demilitarize"],
    ["demilitarised", "demilitarized"],
    ["demilitarises", "demilitarizes"],
    ["demilitarising", "demilitarizing"],
    ["demobilisation", "demobilization"],
    ["demobilise", "demobilize"],
    ["demobilised", "demobilized"],
    ["demobilises", "demobilizes"],
    ["demobilising", "demobilizing"],
    ["democratisation", "democratization"],
    ["democratise", "democratize"],
    ["democratised", "democratized"],
    ["democratises", "democratizes"],
    ["democratising", "democratizing"],
    ["demonise", "demonize"],
    ["demonised", "demonized"],
    ["demonises", "demonizes"],
    ["demonising", "demonizing"],
    ["demoralisation", "demoralization"],
    ["demoralise", "demoralize"],
    ["demoralised", "demoralized"],
    ["demoralises", "demoralizes"],
    ["demoralising", "demoralizing"],
    ["denationalisation", "denationalization"],
    ["denationalise", "denationalize"],
    ["denationalised", "denationalized"],
    ["denationalises", "denationalizes"],
    ["denationalising", "denationalizing"],
    ["deodorise", "deodorize"],
    ["deodorised", "deodorized"],
    ["deodorises", "deodorizes"],
    ["deodorising", "deodorizing"],
    ["depersonalise", "depersonalize"],
    ["depersonalised", "depersonalized"],
    ["depersonalises", "depersonalizes"],
    ["depersonalising", "depersonalizing"],
    ["deputise", "deputize"],
    ["deputised", "deputized"],
    ["deputises", "deputizes"],
    ["deputising", "deputizing"],
    ["desensitisation", "desensitization"],
    ["desensitise", "desensitize"],
    ["desensitised", "desensitized"],
    ["desensitises", "desensitizes"],
    ["desensitising", "desensitizing"],
    ["destabilisation", "destabilization"],
    ["destabilise", "destabilize"],
    ["destabilised", "destabilized"],
    ["destabilises", "destabilizes"],
    ["destabilising", "destabilizing"],
    ["dialled", "dialed"],
    ["dialling", "dialing"],
    ["diarrhoea", "diarrhea"],
    ["digitise", "digitize"],
    ["digitised", "digitized"],
    ["digitises", "digitizes"],
    ["digitising", "digitizing"],
    ["disc", "disk"],
    ["discolour", "discolor"],
    ["discoloured", "discolored"],
    ["discolouring", "discoloring"],
    ["discolours", "discolors"],
    ["discs", "disks"],
    ["disembowelled", "disemboweled"],
    ["disembowelling", "disemboweling"],
    ["disfavour", "disfavor"],
    ["dishevelled", "disheveled"],
    ["dishonour", "dishonor"],
    ["dishonourable", "dishonorable"],
    ["dishonourably", "dishonorably"],
    ["dishonoured", "dishonored"],
    ["dishonouring", "dishonoring"],
    ["dishonours", "dishonors"],
    ["disorganisation", "disorganization"],
    ["disorganised", "disorganized"],
    ["distil", "distill"],
    ["distils", "distills"],
    ["dramatisation", "dramatization"],
    ["dramatisations", "dramatizations"],
    ["dramatise", "dramatize"],
    ["dramatised", "dramatized"],
    ["dramatises", "dramatizes"],
    ["dramatising", "dramatizing"],
    ["draught", "draft"],
    ["draughtboard", "draftboard"],
    ["draughtboards", "draftboards"],
    ["draughtier", "draftier"],
    ["draughtiest", "draftiest"],
    ["draughts", "drafts"],
    ["draughtsman", "draftsman"],
    ["draughtsmanship", "draftsmanship"],
    ["draughtsmen", "draftsmen"],
    ["draughtswoman", "draftswoman"],
    ["draughtswomen", "draftswomen"],
    ["draughty", "drafty"],
    ["drivelled", "driveled"],
    ["drivelling", "driveling"],
    ["duelled", "dueled"],
    ["duelling", "dueling"],
    ["economise", "economize"],
    ["economised", "economized"],
    ["economises", "economizes"],
    ["economising", "economizing"],
    ["edoema", "edema"],
    ["editorialise", "editorialize"],
    ["editorialised", "editorialized"],
    ["editorialises", "editorializes"],
    ["editorialising", "editorializing"],
    ["empathise", "empathize"],
    ["empathised", "empathized"],
    ["empathises", "empathizes"],
    ["empathising", "empathizing"],
    ["emphasise", "emphasize"],
    ["emphasised", "emphasized"],
    ["emphasises", "emphasizes"],
    ["emphasising", "emphasizing"],
    ["enamelled", "enameled"],
    ["enamelling", "enameling"],
    ["enamoured", "enamored"],
    ["encyclopaedia", "encyclopedia"],
    ["encyclopaedias", "encyclopedias"],
    ["encyclopaedic", "encyclopedic"],
    ["endeavour", "endeavor"],
    ["endeavoured", "endeavored"],
    ["endeavouring", "endeavoring"],
    ["endeavours", "endeavors"],
    ["energise", "energize"],
    ["energised", "energized"],
    ["energises", "energizes"],
    ["energising", "energizing"],
    ["enrol", "enroll"],
    ["enrols", "enrolls"],
    ["enthral", "enthrall"],
    ["enthrals", "enthralls"],
    ["epaulette", "epaulet"],
    ["epaulettes", "epaulets"],
    ["epicentre", "epicenter"],
    ["epicentres", "epicenters"],
    ["epilogue", "epilog"],
    ["epilogues", "epilogs"],
    ["epitomise", "epitomize"],
    ["epitomised", "epitomized"],
    ["epitomises", "epitomizes"],
    ["epitomising", "epitomizing"],
    ["equalisation", "equalization"],
    ["equalise", "equalize"],
    ["equalised", "equalized"],
    ["equaliser", "equalizer"],
    ["equalisers", "equalizers"],
    ["equalises", "equalizes"],
    ["equalising", "equalizing"],
    ["eulogise", "eulogize"],
    ["eulogised", "eulogized"],
    ["eulogises", "eulogizes"],
    ["eulogising", "eulogizing"],
    ["evangelise", "evangelize"],
    ["evangelised", "evangelized"],
    ["evangelises", "evangelizes"],
    ["evangelising", "evangelizing"],
    ["exorcise", "exorcize"],
    ["exorcised", "exorcized"],
    ["exorcises", "exorcizes"],
    ["exorcising", "exorcizing"],
    ["extemporisation", "extemporization"],
    ["extemporise", "extemporize"],
    ["extemporised", "extemporized"],
    ["extemporises", "extemporizes"],
    ["extemporising", "extemporizing"],
    ["externalisation", "externalization"],
    ["externalisations", "externalizations"],
    ["externalise", "externalize"],
    ["externalised", "externalized"],
    ["externalises", "externalizes"],
    ["externalising", "externalizing"],
    ["factorise", "factorize"],
    ["factorised", "factorized"],
    ["factorises", "factorizes"],
    ["factorising", "factorizing"],
    ["faecal", "fecal"],
    ["faeces", "feces"],
    ["familiarisation", "familiarization"],
    ["familiarise", "familiarize"],
    ["familiarised", "familiarized"],
    ["familiarises", "familiarizes"],
    ["familiarising", "familiarizing"],
    ["fantasise", "fantasize"],
    ["fantasised", "fantasized"],
    ["fantasises", "fantasizes"],
    ["fantasising", "fantasizing"],
    ["favour", "favor"],
    ["favourable", "favorable"],
    ["favourably", "favorably"],
    ["favoured", "favored"],
    ["favouring", "favoring"],
    ["favouritism", "favoritism"],
    ["favours", "favors"],
    ["feminise", "feminize"],
    ["feminised", "feminized"],
    ["feminises", "feminizes"],
    ["feminising", "feminizing"],
    ["fertilisation", "fertilization"],
    ["fertilise", "fertilize"],
    ["fertilised", "fertilized"],
    ["fertiliser", "fertilizer"],
    ["fertilisers", "fertilizers"],
    ["fertilises", "fertilizes"],
    ["fertilising", "fertilizing"],
    ["fervour", "fervor"],
    ["fibre", "fiber"],
    ["fibreglass", "fiberglass"],
    ["fibres", "fibers"],
    ["fictionalisation", "fictionalization"],
    ["fictionalisations", "fictionalizations"],
    ["fictionalise", "fictionalize"],
    ["fictionalised", "fictionalized"],
    ["fictionalises", "fictionalizes"],
    ["fictionalising", "fictionalizing"],
    ["fillet", "filet"],
    ["filleted", "fileted"],
    ["filleting", "fileting"],
    ["fillets", "filets"],
    ["finalisation", "finalization"],
    ["finalise", "finalize"],
    ["finalised", "finalized"],
    ["finalises", "finalizes"],
    ["finalising", "finalizing"],
    ["flautist", "flutist"],
    ["flautists", "flutists"],
    ["flavour", "flavor"],
    ["flavoured", "flavored"],
    ["flavouring", "flavoring"],
    ["flavourings", "flavorings"],
    ["flavourless", "flavorless"],
    ["flavours", "flavors"],
    ["flavoursome", "flavorsome"],
    ["foetal", "fetal"],
    ["foetid", "fetid"],
    ["foetus", "fetus"],
    ["foetuses", "fetuses"],
    ["formalisation", "formalization"],
    ["formalise", "formalize"],
    ["formalised", "formalized"],
    ["formalises", "formalizes"],
    ["formalising", "formalizing"],
    ["fossilisation", "fossilization"],
    ["fossilise", "fossilize"],
    ["fossilised", "fossilized"],
    ["fossilises", "fossilizes"],
    ["fossilising", "fossilizing"],
    ["fraternisation", "fraternization"],
    ["fraternise", "fraternize"],
    ["fraternised", "fraternized"],
    ["fraternises", "fraternizes"],
    ["fraternising", "fraternizing"],
    ["fulfil", "fulfill"],
    ["fulfilment", "fulfillment"],
    ["fulfils", "fulfills"],
    ["funnelled", "funneled"],
    ["funnelling", "funneling"],
    ["galvanise", "galvanize"],
    ["galvanises", "galvanizes"],
    ["galvanising", "galvanizing"],
    ["gambolled", "gamboled"],
    ["gambolling", "gamboling"],
    ["gaol", "jail"],
    ["gaolbird", "jailbird"],
    ["gaolbirds", "jailbirds"],
    ["gaolbreak", "jailbreak"],
    ["gaolbreaks", "jailbreaks"],
    ["gaoled", "jailed"],
    ["gaoler", "jailer"],
    ["gaolers", "jailers"],
    ["gaoling", "jailing"],
    ["gaols", "jails"],
    ["gases", "gasses"],
    ["gauge", "gage"],
    ["gauged", "gaged"],
    ["gauges", "gages"],
    ["gauging", "gaging"],
    ["generalisation", "generalization"],
    ["generalisations", "generalizations"],
    ["generalise", "generalize"],
    ["generalised", "generalized"],
    ["generalises", "generalizes"],
    ["generalising", "generalizing"],
    ["ghettoise", "ghettoize"],
    ["ghettoised", "ghettoized"],
    ["ghettoises", "ghettoizes"],
    ["ghettoising", "ghettoizing"],
    ["gipsies", "gypsies"],
    ["glamorise", "glamorize"],
    ["glamorised", "glamorized"],
    ["glamorises", "glamorizes"],
    ["glamorising", "glamorizing"],
    ["glamour", "glamor"],
    ["globalisation", "globalization"],
    ["globalise", "globalize"],
    ["globalised", "globalized"],
    ["globalises", "globalizes"],
    ["globalising", "globalizing"],
    ["glueing", "gluing"],
    ["goitre", "goiter"],
    ["goitres", "goiters"],
    ["gonorrhoea", "gonorrhea"],
    ["gramme", "gram"],
    ["grammes", "grams"],
    ["gravelled", "graveled"],
    ["greyed", "grayed"],
    ["greying", "graying"],
    ["greyish", "grayish"],
    ["greyness", "grayness"],
    ["greys", "grays"],
    ["grovelled", "groveled"],
    ["grovelling", "groveling"],
    ["groyne", "groin"],
    ["groynes", "groins"],
    ["gruelling", "grueling"],
    ["gruellingly", "gruelingly"],
    ["gryphon", "griffin"],
    ["gryphons", "griffins"],
    ["gynaecological", "gynecological"],
    ["gynaecologist", "gynecologist"],
    ["gynaecologists", "gynecologists"],
    ["gynaecology", "gynecology"],
    ["haematological", "hematological"],
    ["haematologist", "hematologist"],
    ["haematologists", "hematologists"],
    ["haematology", "hematology"],
    ["haemoglobin", "hemoglobin"],
    ["haemophilia", "hemophilia"],
    ["haemophiliac", "hemophiliac"],
    ["haemophiliacs", "hemophiliacs"],
    ["haemorrhage", "hemorrhage"],
    ["haemorrhaged", "hemorrhaged"],
    ["haemorrhages", "hemorrhages"],
    ["haemorrhaging", "hemorrhaging"],
    ["haemorrhoids", "hemorrhoids"],
    ["harbour", "harbor"],
    ["harboured", "harbored"],
    ["harbouring", "harboring"],
    ["harbours", "harbors"],
    ["harmonisation", "harmonization"],
    ["harmonise", "harmonize"],
    ["harmonised", "harmonized"],
    ["harmonises", "harmonizes"],
    ["harmonising", "harmonizing"],
    ["homoeopath", "homeopath"],
    ["homoeopathic", "homeopathic"],
    ["homoeopaths", "homeopaths"],
    ["homoeopathy", "homeopathy"],
    ["homogenise", "homogenize"],
    ["homogenised", "homogenized"],
    ["homogenises", "homogenizes"],
    ["homogenising", "homogenizing"],
    ["honourable", "honorable"],
    ["honourably", "honorably"],
    ["hospitalisation", "hospitalization"],
    ["hospitalise", "hospitalize"],
    ["hospitalised", "hospitalized"],
    ["hospitalises", "hospitalizes"],
    ["hospitalising", "hospitalizing"],
    ["humanise", "humanize"],
    ["humanised", "humanized"],
    ["humanises", "humanizes"],
    ["humanising", "humanizing"],
    ["humour", "humor"],
    ["humoured", "humored"],
    ["humouring", "humoring"],
    ["humourless", "humorless"],
    ["humours", "humors"],
    ["hybridise", "hybridize"],
    ["hybridised", "hybridized"],
    ["hybridises", "hybridizes"],
    ["hybridising", "hybridizing"],
    ["hypnotise", "hypnotize"],
    ["hypnotised", "hypnotized"],
    ["hypnotises", "hypnotizes"],
    ["hypnotising", "hypnotizing"],
    ["hypothesise", "hypothesize"],
    ["hypothesised", "hypothesized"],
    ["hypothesises", "hypothesizes"],
    ["hypothesising", "hypothesizing"],
    ["idealisation", "idealization"],
    ["idealise", "idealize"],
    ["idealised", "idealized"],
    ["idealises", "idealizes"],
    ["idealising", "idealizing"],
    ["idolise", "idolize"],
    ["idolised", "idolized"],
    ["idolises", "idolizes"],
    ["idolising", "idolizing"],
    ["immobilisation", "immobilization"],
    ["immobilise", "immobilize"],
    ["immobilised", "immobilized"],
    ["immobiliser", "immobilizer"],
    ["immobilisers", "immobilizers"],
    ["immobilises", "immobilizes"],
    ["immobilising", "immobilizing"],
    ["immortalise", "immortalize"],
    ["immortalised", "immortalized"],
    ["immortalises", "immortalizes"],
    ["immortalising", "immortalizing"],
    ["immunisation", "immunization"],
    ["immunise", "immunize"],
    ["immunised", "immunized"],
    ["immunises", "immunizes"],
    ["immunising", "immunizing"],
    ["impanelled", "impaneled"],
    ["impanelling", "impaneling"],
    ["imperilled", "imperiled"],
    ["imperilling", "imperiling"],
    ["individualise", "individualize"],
    ["individualised", "individualized"],
    ["individualises", "individualizes"],
    ["individualising", "individualizing"],
    ["industrialise", "industrialize"],
    ["industrialised", "industrialized"],
    ["industrialises", "industrializes"],
    ["industrialising", "industrializing"],
    ["inflexion", "inflection"],
    ["inflexions", "inflections"],
    ["initialise", "initialize"],
    ["initialised", "initialized"],
    ["initialises", "initializes"],
    ["initialising", "initializing"],
    ["initialled", "initialed"],
    ["initialling", "initialing"],
    ["instal", "install"],
    ["instalment", "installment"],
    ["instalments", "installments"],
    ["instals", "installs"],
    ["instil", "instill"],
    ["instils", "instills"],
    ["institutionalisation", "institutionalization"],
    ["institutionalise", "institutionalize"],
    ["institutionalised", "institutionalized"],
    ["institutionalises", "institutionalizes"],
    ["institutionalising", "institutionalizing"],
    ["intellectualise", "intellectualize"],
    ["intellectualised", "intellectualized"],
    ["intellectualises", "intellectualizes"],
    ["intellectualising", "intellectualizing"],
    ["internalisation", "internalization"],
    ["internalise", "internalize"],
    ["internalised", "internalized"],
    ["internalises", "internalizes"],
    ["internalising", "internalizing"],
    ["internationalisation", "internationalization"],
    ["internationalise", "internationalize"],
    ["internationalised", "internationalized"],
    ["internationalises", "internationalizes"],
    ["internationalising", "internationalizing"],
    ["ionisation", "ionization"],
    ["ionise", "ionize"],
    ["ionised", "ionized"],
    ["ioniser", "ionizer"],
    ["ionisers", "ionizers"],
    ["ionises", "ionizes"],
    ["ionising", "ionizing"],
    ["italicise", "italicize"],
    ["italicised", "italicized"],
    ["italicises", "italicizes"],
    ["italicising", "italicizing"],
    ["itemise", "itemize"],
    ["itemised", "itemized"],
    ["itemises", "itemizes"],
    ["itemising", "itemizing"],
    ["jeopardise", "jeopardize"],
    ["jeopardised", "jeopardized"],
    ["jeopardises", "jeopardizes"],
    ["jeopardising", "jeopardizing"],
    ["jewelled", "jeweled"],
    ["jeweller", "jeweler"],
    ["jewellers", "jewelers"],
    ["judgement", "judgment"],
    ["kilogramme", "kilogram"],
    ["kilogrammes", "kilograms"],
    ["labelled", "labeled"],
    ["labelling", "labeling"],
    ["laboured", "labored"],
    ["labourer", "laborer"],
    ["labourers", "laborers"],
    ["labouring", "laboring"],
    ["lacklustre", "lackluster"],
    ["legalisation", "legalization"],
    ["legalise", "legalize"],
    ["legalised", "legalized"],
    ["legalises", "legalizes"],
    ["legalising", "legalizing"],
    ["legitimise", "legitimize"],
    ["legitimised", "legitimized"],
    ["legitimises", "legitimizes"],
    ["legitimising", "legitimizing"],
    ["leukaemia", "leukemia"],
    ["levelled", "leveled"],
    ["leveller", "leveler"],
    ["levellers", "levelers"],
    ["levelling", "leveling"],
    ["libelled", "libeled"],
    ["libelling", "libeling"],
    ["libellous", "libelous"],
    ["liberalisation", "liberalization"],
    ["liberalise", "liberalize"],
    ["liberalised", "liberalized"],
    ["liberalises", "liberalizes"],
    ["liberalising", "liberalizing"],
    ["licenced", "licensed"],
    ["licencing", "licensing"],
    ["likeable", "likable"],
    ["lionisation", "lionization"],
    ["lionise", "lionize"],
    ["lionised", "lionized"],
    ["lionises", "lionizes"],
    ["lionising", "lionizing"],
    ["liquidise", "liquidize"],
    ["liquidised", "liquidized"],
    ["liquidiser", "liquidizer"],
    ["liquidisers", "liquidizers"],
    ["liquidises", "liquidizes"],
    ["liquidising", "liquidizing"],
    ["localise", "localize"],
    ["localised", "localized"],
    ["localises", "localizes"],
    ["localising", "localizing"],
    ["louvre", "louver"],
    ["louvred", "louvered"],
    ["louvres", "louvers"],
    ["lustre", "luster"],
    ["magnetise", "magnetize"],
    ["magnetised", "magnetized"],
    ["magnetises", "magnetizes"],
    ["magnetising", "magnetizing"],
    ["manoeuvrability", "maneuverability"],
    ["manoeuvrable", "maneuverable"],
    ["manoeuvre", "maneuver"],
    ["manoeuvred", "maneuvered"],
    ["manoeuvres", "maneuvers"],
    ["manoeuvring", "maneuvering"],
    ["manoeuvrings", "maneuverings"],
    ["marginalisation", "marginalization"],
    ["marginalise", "marginalize"],
    ["marginalised", "marginalized"],
    ["marginalises", "marginalizes"],
    ["marginalising", "marginalizing"],
    ["marshalled", "marshaled"],
    ["marshalling", "marshaling"],
    ["marvelled", "marveled"],
    ["marvelling", "marveling"],
    ["marvellous", "marvelous"],
    ["marvellously", "marvelously"],
    ["materialisation", "materialization"],
    ["materialise", "materialize"],
    ["materialised", "materialized"],
    ["materialises", "materializes"],
    ["materialising", "materializing"],
    ["maximisation", "maximization"],
    ["maximise", "maximize"],
    ["maximised", "maximized"],
    ["maximises", "maximizes"],
    ["maximising", "maximizing"],
    ["meagre", "meager"],
    ["mechanisation", "mechanization"],
    ["mechanise", "mechanize"],
    ["mechanised", "mechanized"],
    ["mechanises", "mechanizes"],
    ["mechanising", "mechanizing"],
    ["mediaeval", "medieval"],
    ["memorialise", "memorialize"],
    ["memorialised", "memorialized"],
    ["memorialises", "memorializes"],
    ["memorialising", "memorializing"],
    ["memorise", "memorize"],
    ["memorised", "memorized"],
    ["memorises", "memorizes"],
    ["memorising", "memorizing"],
    ["mesmerise", "mesmerize"],
    ["mesmerised", "mesmerized"],
    ["mesmerises", "mesmerizes"],
    ["mesmerising", "mesmerizing"],
    ["metabolise", "metabolize"],
    ["metabolised", "metabolized"],
    ["metabolises", "metabolizes"],
    ["metabolising", "metabolizing"],
    ["micrometre", "micrometer"],
    ["micrometres", "micrometers"],
    ["militarise", "militarize"],
    ["militarised", "militarized"],
    ["militarises", "militarizes"],
    ["militarising", "militarizing"],
    ["milligramme", "milligram"],
    ["milligrammes", "milligrams"],
    ["millilitre", "milliliter"],
    ["millilitres", "milliliters"],
    ["millimetre", "millimeter"],
    ["millimetres", "millimeters"],
    ["miniaturisation", "miniaturization"],
    ["miniaturise", "miniaturize"],
    ["miniaturised", "miniaturized"],
    ["miniaturises", "miniaturizes"],
    ["miniaturising", "miniaturizing"],
    ["minibuses", "minibusses"],
    ["minimise", "minimize"],
    ["minimised", "minimized"],
    ["minimises", "minimizes"],
    ["minimising", "minimizing"],
    ["misbehaviour", "misbehavior"],
    ["misdemeanour", "misdemeanor"],
    ["misdemeanours", "misdemeanors"],
    ["misspelt", "misspelled"],
    ["mitre", "miter"],
    ["mitres", "miters"],
    ["mobilisation", "mobilization"],
    ["mobilise", "mobilize"],
    ["mobilised", "mobilized"],
    ["mobilises", "mobilizes"],
    ["mobilising", "mobilizing"],
    ["modelled", "modeled"],
    ["modeller", "modeler"],
    ["modellers", "modelers"],
    ["modelling", "modeling"],
    ["modernise", "modernize"],
    ["modernised", "modernized"],
    ["modernises", "modernizes"],
    ["modernising", "modernizing"],
    ["moisturise", "moisturize"],
    ["moisturised", "moisturized"],
    ["moisturiser", "moisturizer"],
    ["moisturisers", "moisturizers"],
    ["moisturises", "moisturizes"],
    ["moisturising", "moisturizing"],
    ["monologue", "monolog"],
    ["monologues", "monologs"],
    ["monopolisation", "monopolization"],
    ["monopolise", "monopolize"],
    ["monopolised", "monopolized"],
    ["monopolises", "monopolizes"],
    ["monopolising", "monopolizing"],
    ["moralise", "moralize"],
    ["moralised", "moralized"],
    ["moralises", "moralizes"],
    ["moralising", "moralizing"],
    ["motorised", "motorized"],
    ["moulded", "molded"],
    ["moulder", "molder"],
    ["mouldered", "moldered"],
    ["mouldering", "moldering"],
    ["moulders", "molders"],
    ["mouldier", "moldier"],
    ["mouldiest", "moldiest"],
    ["mouldings", "moldings"],
    ["mouldy", "moldy"],
    ["moult", "molt"],
    ["moulted", "molted"],
    ["moulting", "molting"],
    ["moults", "molts"],
    ["moustache", "mustache"],
    ["moustached", "mustached"],
    ["moustaches", "mustaches"],
    ["moustachioed", "mustachioed"],
    ["multicoloured", "multicolored"],
    ["nationalisation", "nationalization"],
    ["nationalisations", "nationalizations"],
    ["nationalise", "nationalize"],
    ["nationalised", "nationalized"],
    ["nationalises", "nationalizes"],
    ["nationalising", "nationalizing"],
    ["naturalisation", "naturalization"],
    ["naturalise", "naturalize"],
    ["naturalised", "naturalized"],
    ["naturalises", "naturalizes"],
    ["naturalising", "naturalizing"],
    ["neighbourhoods", "neighborhoods"],
    ["neighbourliness", "neighborliness"],
    ["neighbourly", "neighborly"],
    ["neutralisation", "neutralization"],
    ["neutralise", "neutralize"],
    ["neutralised", "neutralized"],
    ["neutralises", "neutralizes"],
    ["neutralising", "neutralizing"],
    ["normalisation", "normalization"],
    ["normalise", "normalize"],
    ["normalised", "normalized"],
    ["normalises", "normalizes"],
    ["normalising", "normalizing"],
    ["odour", "odor"],
    ["odourless", "odorless"],
    ["odours", "odors"],
    ["oesophagus", "esophagus"],
    ["oesophaguses", "esophaguses"],
    ["oestrogen", "estrogen"],
    ["offences", "offenses"],
    ["omelette", "omelet"],
    ["omelettes", "omelets"],
    ["optimise", "optimize"],
    ["optimised", "optimized"],
    ["optimises", "optimizes"],
    ["optimising", "optimizing"],
    ["organisational", "organizational"],
    ["organiser", "organizer"],
    ["organisers", "organizers"],
    ["orthopaedic", "orthopedic"],
    ["orthopaedics", "orthopedics"],
    ["ostracise", "ostracize"],
    ["ostracised", "ostracized"],
    ["ostracises", "ostracizes"],
    ["ostracising", "ostracizing"],
    ["outmanoeuvre", "outmaneuver"],
    ["outmanoeuvred", "outmaneuvered"],
    ["outmanoeuvres", "outmaneuvers"],
    ["outmanoeuvring", "outmaneuvering"],
    ["overemphasise", "overemphasize"],
    ["overemphasised", "overemphasized"],
    ["overemphasises", "overemphasizes"],
    ["overemphasising", "overemphasizing"],
    ["oxidisation", "oxidization"],
    ["oxidise", "oxidize"],
    ["oxidised", "oxidized"],
    ["oxidises", "oxidizes"],
    ["oxidising", "oxidizing"],
    ["paederast", "pederast"],
    ["paederasts", "pederasts"],
    ["paediatric", "pediatric"],
    ["paediatrician", "pediatrician"],
    ["paediatricians", "pediatricians"],
    ["paediatrics", "pediatrics"],
    ["paedophile", "pedophile"],
    ["paedophiles", "pedophiles"],
    ["paedophilia", "pedophilia"],
    ["palaeolithic", "paleolithic"],
    ["palaeontologist", "paleontologist"],
    ["palaeontologists", "paleontologists"],
    ["palaeontology", "paleontology"],
    ["panelled", "paneled"],
    ["panelling", "paneling"],
    ["panellist", "panelist"],
    ["panellists", "panelists"],
    ["paralyses", "paralyzes"],
    ["paralysing", "paralyzing"],
    ["parcelled", "parceled"],
    ["parcelling", "parceling"],
    ["parlour", "parlor"],
    ["parlours", "parlors"],
    ["particularise", "particularize"],
    ["particularised", "particularized"],
    ["particularises", "particularizes"],
    ["particularising", "particularizing"],
    ["passivisation", "passivization"],
    ["passivise", "passivize"],
    ["passivised", "passivized"],
    ["passivises", "passivizes"],
    ["passivising", "passivizing"],
    ["pasteurisation", "pasteurization"],
    ["pasteurise", "pasteurize"],
    ["pasteurised", "pasteurized"],
    ["pasteurises", "pasteurizes"],
    ["pasteurising", "pasteurizing"],
    ["patronise", "patronize"],
    ["patronised", "patronized"],
    ["patronises", "patronizes"],
    ["patronising", "patronizing"],
    ["patronisingly", "patronizingly"],
    ["pedalled", "pedaled"],
    ["pedalling", "pedaling"],
    ["pedestrianisation", "pedestrianization"],
    ["pedestrianise", "pedestrianize"],
    ["pedestrianised", "pedestrianized"],
    ["pedestrianises", "pedestrianizes"],
    ["pedestrianising", "pedestrianizing"],
    ["penalise", "penalize"],
    ["penalised", "penalized"],
    ["penalises", "penalizes"],
    ["penalising", "penalizing"],
    ["pencilled", "penciled"],
    ["pencilling", "penciling"],
    ["personalise", "personalize"],
    ["personalised", "personalized"],
    ["personalises", "personalizes"],
    ["personalising", "personalizing"],
    ["pharmacopoeia", "pharmacopeia"],
    ["pharmacopoeias", "pharmacopeias"],
    ["philosophise", "philosophize"],
    ["philosophised", "philosophized"],
    ["philosophises", "philosophizes"],
    ["philosophising", "philosophizing"],
    ["philtre", "filter"],
    ["philtres", "filters"],
    ["phoney", "phony"],
    ["plagiarise", "plagiarize"],
    ["plagiarised", "plagiarized"],
    ["plagiarises", "plagiarizes"],
    ["plagiarising", "plagiarizing"],
    ["plough", "plow"],
    ["ploughed", "plowed"],
    ["ploughing", "plowing"],
    ["ploughman", "plowman"],
    ["ploughmen", "plowmen"],
    ["ploughs", "plows"],
    ["ploughshare", "plowshare"],
    ["ploughshares", "plowshares"],
    ["polarisation", "polarization"],
    ["polarise", "polarize"],
    ["polarised", "polarized"],
    ["polarises", "polarizes"],
    ["polarising", "polarizing"],
    ["politicisation", "politicization"],
    ["politicise", "politicize"],
    ["politicised", "politicized"],
    ["politicises", "politicizes"],
    ["politicising", "politicizing"],
    ["popularisation", "popularization"],
    ["popularise", "popularize"],
    ["popularised", "popularized"],
    ["popularises", "popularizes"],
    ["popularising", "popularizing"],
    ["pouffe", "pouf"],
    ["pouffes", "poufs"],
    ["practises", "practices"],
    ["praesidium", "presidium"],
    ["praesidiums", "presidiums"],
    ["pressurisation", "pressurization"],
    ["pressurise", "pressurize"],
    ["pressurised", "pressurized"],
    ["pressurises", "pressurizes"],
    ["pressurising", "pressurizing"],
    ["pretences", "pretenses"],
    ["primaeval", "primeval"],
    ["prioritisation", "prioritization"],
    ["prioritise", "prioritize"],
    ["prioritised", "prioritized"],
    ["prioritises", "prioritizes"],
    ["prioritising", "prioritizing"],
    ["privatisation", "privatization"],
    ["privatisations", "privatizations"],
    ["privatise", "privatize"],
    ["privatised", "privatized"],
    ["privatises", "privatizes"],
    ["privatising", "privatizing"],
    ["professionalisation", "professionalization"],
    ["professionalise", "professionalize"],
    ["professionalised", "professionalized"],
    ["professionalises", "professionalizes"],
    ["professionalising", "professionalizing"],
    ["prologue", "prolog"],
    ["prologues", "prologs"],
    ["propagandise", "propagandize"],
    ["propagandised", "propagandized"],
    ["propagandises", "propagandizes"],
    ["propagandising", "propagandizing"],
    ["proselytise", "proselytize"],
    ["proselytised", "proselytized"],
    ["proselytiser", "proselytizer"],
    ["proselytisers", "proselytizers"],
    ["proselytises", "proselytizes"],
    ["proselytising", "proselytizing"],
    ["psychoanalyse", "psychoanalyze"],
    ["psychoanalysed", "psychoanalyzed"],
    ["psychoanalyses", "psychoanalyzes"],
    ["psychoanalysing", "psychoanalyzing"],
    ["publicise", "publicize"],
    ["publicised", "publicized"],
    ["publicises", "publicizes"],
    ["publicising", "publicizing"],
    ["pulverisation", "pulverization"],
    ["pulverise", "pulverize"],
    ["pulverised", "pulverized"],
    ["pulverises", "pulverizes"],
    ["pulverising", "pulverizing"],
    ["pummelled", "pummel"],
    ["pummelling", "pummeled"],
    ["pyjama", "pajama"],
    ["pyjamas", "pajamas"],
    ["pzazz", "pizzazz"],
    ["quarrelled", "quarreled"],
    ["quarrelling", "quarreling"],
    ["radicalise", "radicalize"],
    ["radicalised", "radicalized"],
    ["radicalises", "radicalizes"],
    ["radicalising", "radicalizing"],
    ["rancour", "rancor"],
    ["randomise", "randomize"],
    ["randomised", "randomized"],
    ["randomises", "randomizes"],
    ["randomising", "randomizing"],
    ["rationalisation", "rationalization"],
    ["rationalisations", "rationalizations"],
    ["rationalise", "rationalize"],
    ["rationalised", "rationalized"],
    ["rationalises", "rationalizes"],
    ["rationalising", "rationalizing"],
    ["ravelled", "raveled"],
    ["ravelling", "raveling"],
    ["realisable", "realizable"],
    ["realisation", "realization"],
    ["realisations", "realizations"],
    ["recognisable", "recognizable"],
    ["recognisably", "recognizably"],
    ["recognisance", "recognizance"],
    ["reconnoitre", "reconnoiter"],
    ["reconnoitred", "reconnoitered"],
    ["reconnoitres", "reconnoiters"],
    ["reconnoitring", "reconnoitering"],
    ["refuelled", "refueled"],
    ["refuelling", "refueling"],
    ["regularisation", "regularization"],
    ["regularise", "regularize"],
    ["regularised", "regularized"],
    ["regularises", "regularizes"],
    ["regularising", "regularizing"],
    ["remodelled", "remodeled"],
    ["remodelling", "remodeling"],
    ["remould", "remold"],
    ["remoulded", "remolded"],
    ["remoulding", "remolding"],
    ["remoulds", "remolds"],
    ["reorganisation", "reorganization"],
    ["reorganisations", "reorganizations"],
    ["reorganise", "reorganize"],
    ["reorganised", "reorganized"],
    ["reorganises", "reorganizes"],
    ["reorganising", "reorganizing"],
    ["revelled", "reveled"],
    ["reveller", "reveler"],
    ["revellers", "revelers"],
    ["revelling", "reveling"],
    ["revitalise", "revitalize"],
    ["revitalised", "revitalized"],
    ["revitalises", "revitalizes"],
    ["revitalising", "revitalizing"],
    ["revolutionise", "revolutionize"],
    ["revolutionised", "revolutionized"],
    ["revolutionises", "revolutionizes"],
    ["revolutionising", "revolutionizing"],
    ["rhapsodise", "rhapsodize"],
    ["rhapsodised", "rhapsodized"],
    ["rhapsodises", "rhapsodizes"],
    ["rhapsodising", "rhapsodizing"],
    ["rigour", "rigor"],
    ["rigours", "rigors"],
    ["ritualised", "ritualized"],
    ["rivalled", "rivaled"],
    ["rivalling", "rivaling"],
    ["romanticise", "romanticize"],
    ["romanticised", "romanticized"],
    ["romanticises", "romanticizes"],
    ["romanticising", "romanticizing"],
    ["rumour", "rumor"],
    ["rumoured", "rumored"],
    ["rumours", "rumors"],
    ["sabre", "saber"],
    ["sabres", "sabers"],
    ["saltpetre", "saltpeter"],
    ["sanitise", "sanitize"],
    ["sanitised", "sanitized"],
    ["sanitises", "sanitizes"],
    ["sanitising", "sanitizing"],
    ["satirise", "satirize"],
    ["satirised", "satirized"],
    ["satirises", "satirizes"],
    ["satirising", "satirizing"],
    ["saviour", "savior"],
    ["saviours", "saviors"],
    ["savour", "savor"],
    ["savoured", "savored"],
    ["savouries", "savories"],
    ["savouring", "savoring"],
    ["savours", "savors"],
    ["savoury", "savory"],
    ["scandalise", "scandalize"],
    ["scandalised", "scandalized"],
    ["scandalises", "scandalizes"],
    ["scandalising", "scandalizing"],
    ["sceptic", "skeptic"],
    ["sceptical", "skeptical"],
    ["sceptically", "skeptically"],
    ["scepticism", "skepticism"],
    ["sceptics", "skeptics"],
    ["sceptre", "scepter"],
    ["sceptres", "scepters"],
    ["scrutinise", "scrutinize"],
    ["scrutinised", "scrutinized"],
    ["scrutinises", "scrutinizes"],
    ["scrutinising", "scrutinizing"],
    ["secularisation", "secularization"],
    ["secularise", "secularize"],
    ["secularised", "secularized"],
    ["secularises", "secularizes"],
    ["secularising", "secularizing"],
    ["sensationalise", "sensationalize"],
    ["sensationalised", "sensationalized"],
    ["sensationalises", "sensationalizes"],
    ["sensationalising", "sensationalizing"],
    ["sensitise", "sensitize"],
    ["sensitised", "sensitized"],
    ["sensitises", "sensitizes"],
    ["sensitising", "sensitizing"],
    ["sentimentalise", "sentimentalize"],
    ["sentimentalised", "sentimentalized"],
    ["sentimentalises", "sentimentalizes"],
    ["sentimentalising", "sentimentalizing"],
    ["sepulchre", "sepulcher"],
    ["sepulchres", "sepulchers"],
    ["serialisation", "serialization"],
    ["serialisations", "serializations"],
    ["serialise", "serialize"],
    ["serialised", "serialized"],
    ["serialises", "serializes"],
    ["serialising", "serializing"],
    ["sermonise", "sermonize"],
    ["sermonised", "sermonized"],
    ["sermonises", "sermonizes"],
    ["sermonising", "sermonizing"],
    ["sheikh", "sheik"],
    ["shovelled", "shoveled"],
    ["shovelling", "shoveling"],
    ["shrivelled", "shriveled"],
    ["shrivelling", "shriveling"],
    ["signalise", "signalize"],
    ["signalised", "signalized"],
    ["signalises", "signalizes"],
    ["signalising", "signalizing"],
    ["signalled", "signaled"],
    ["signalling", "signaling"],
    ["smoulder", "smolder"],
    ["smouldered", "smoldered"],
    ["smouldering", "smoldering"],
    ["smoulders", "smolders"],
    ["snivelled", "sniveled"],
    ["snivelling", "sniveling"],
    ["snorkelled", "snorkeled"],
    ["snorkelling", "snorkeling"],
    ["snowplough", "snowplow"],
    ["snowploughs", "snowplow"],
    ["socialisation", "socialization"],
    ["socialise", "socialize"],
    ["socialised", "socialized"],
    ["socialises", "socializes"],
    ["socialising", "socializing"],
    ["sodomise", "sodomize"],
    ["sodomised", "sodomized"],
    ["sodomises", "sodomizes"],
    ["sodomising", "sodomizing"],
    ["solemnise", "solemnize"],
    ["solemnised", "solemnized"],
    ["solemnises", "solemnizes"],
    ["solemnising", "solemnizing"],
    ["sombre", "somber"],
    ["specialisation", "specialization"],
    ["specialisations", "specializations"],
    ["specialise", "specialize"],
    ["specialised", "specialized"],
    ["specialises", "specializes"],
    ["specialising", "specializing"],
    ["spectre", "specter"],
    ["spectres", "specters"],
    ["spiralled", "spiraled"],
    ["spiralling", "spiraling"],
    ["splendour", "splendor"],
    ["splendours", "splendors"],
    ["squirrelled", "squirreled"],
    ["squirrelling", "squirreling"],
    ["stabilisation", "stabilization"],
    ["stabilise", "stabilize"],
    ["stabilised", "stabilized"],
    ["stabiliser", "stabilizer"],
    ["stabilisers", "stabilizers"],
    ["stabilises", "stabilizes"],
    ["stabilising", "stabilizing"],
    ["standardisation", "standardization"],
    ["standardise", "standardize"],
    ["standardised", "standardized"],
    ["standardises", "standardizes"],
    ["standardising", "standardizing"],
    ["stencilled", "stenciled"],
    ["stencilling", "stenciling"],
    ["sterilisation", "sterilization"],
    ["sterilisations", "sterilizations"],
    ["sterilise", "sterilize"],
    ["sterilised", "sterilized"],
    ["steriliser", "sterilizer"],
    ["sterilisers", "sterilizers"],
    ["sterilises", "sterilizes"],
    ["sterilising", "sterilizing"],
    ["stigmatisation", "stigmatization"],
    ["stigmatise", "stigmatize"],
    ["stigmatised", "stigmatized"],
    ["stigmatises", "stigmatizes"],
    ["stigmatising", "stigmatizing"],
    ["storey", "story"],
    ["storeys", "stories"],
    ["subsidisation", "subsidization"],
    ["subsidise", "subsidize"],
    ["subsidised", "subsidized"],
    ["subsidiser", "subsidizer"],
    ["subsidisers", "subsidizers"],
    ["subsidises", "subsidizes"],
    ["subsidising", "subsidizing"],
    ["succour", "succor"],
    ["succoured", "succored"],
    ["succouring", "succoring"],
    ["succours", "succors"],
    ["sulphate", "sulfate"],
    ["sulphates", "sulfates"],
    ["sulphide", "sulfide"],
    ["sulphides", "sulfides"],
    ["sulphur", "sulfur"],
    ["sulphurous", "sulfurous"],
    ["summarise", "summarize"],
    ["summarised", "summarized"],
    ["summarises", "summarizes"],
    ["summarising", "summarizing"],
    ["swivelled", "swiveled"],
    ["swivelling", "swiveling"],
    ["symbolise", "symbolize"],
    ["symbolised", "symbolized"],
    ["symbolises", "symbolizes"],
    ["symbolising", "symbolizing"],
    ["sympathise", "sympathize"],
    ["sympathised", "sympathized"],
    ["sympathiser", "sympathizer"],
    ["sympathisers", "sympathizers"],
    ["sympathises", "sympathizes"],
    ["sympathising", "sympathizing"],
    ["synchronisation", "synchronization"],
    ["synchronise", "synchronize"],
    ["synchronised", "synchronized"],
    ["synchronises", "synchronizes"],
    ["synchronising", "synchronizing"],
    ["synthesise", "synthesize"],
    ["synthesised", "synthesized"],
    ["synthesiser", "synthesizer"],
    ["synthesisers", "synthesizers"],
    ["synthesises", "synthesizes"],
    ["synthesising", "synthesizing"],
    ["syphon", "siphon"],
    ["syphoned", "siphoned"],
    ["syphoning", "siphoning"],
    ["syphons", "siphons"],
    ["systematisation", "systematization"],
    ["systematise", "systematize"],
    ["systematised", "systematized"],
    ["systematises", "systematizes"],
    ["systematising", "systematizing"],
    ["tantalise", "tantalize"],
    ["tantalised", "tantalized"],
    ["tantalises", "tantalizes"],
    ["tantalising", "tantalizing"],
    ["tantalisingly", "tantalizingly"],
    ["tasselled", "tasseled"],
    ["technicolour", "technicolor"],
    ["temporise", "temporize"],
    ["temporised", "temporized"],
    ["temporises", "temporizes"],
    ["temporising", "temporizing"],
    ["tenderise", "tenderize"],
    ["tenderised", "tenderized"],
    ["tenderises", "tenderizes"],
    ["tenderising", "tenderizing"],
    ["terrorise", "terrorize"],
    ["terrorised", "terrorized"],
    ["terrorises", "terrorizes"],
    ["terrorising", "terrorizing"],
    ["theatregoer", "theatergoer"],
    ["theatregoers", "theatergoers"],
    ["theorise", "theorize"],
    ["theorised", "theorized"],
    ["theorises", "theorizes"],
    ["theorising", "theorizing"],
    ["tonne", "ton"],
    ["tonnes", "tons"],
    ["towelled", "toweled"],
    ["towelling", "toweling"],
    ["toxaemia", "toxemia"],
    ["tranquillise", "tranquilize"],
    ["tranquillised", "tranquilized"],
    ["tranquilliser", "tranquilizer"],
    ["tranquillisers", "tranquilizers"],
    ["tranquillises", "tranquilizes"],
    ["tranquillising", "tranquilizing"],
    ["tranquillity", "tranquility"],
    ["tranquillize", "tranquilize"],
    ["tranquillized", "tranquilized"],
    ["tranquillizer", "tranquilizer"],
    ["tranquillizers", "tranquilizers"],
    ["tranquillizes", "tranquilizes"],
    ["tranquillizing", "tranquilizing"],
    ["tranquilly", "tranquility"],
    ["transistorised", "transistorized"],
    ["traumatise", "traumatize"],
    ["traumatised", "traumatized"],
    ["traumatises", "traumatizes"],
    ["traumatising", "traumatizing"],
    ["travelogue", "travelog"],
    ["travelogues", "travelogs"],
    ["trialled", "trialed"],
    ["trialling", "trialing"],
    ["tricolour", "tricolor"],
    ["tricolours", "tricolors"],
    ["trivialise", "trivialize"],
    ["trivialised", "trivialized"],
    ["trivialises", "trivializes"],
    ["trivialising", "trivializing"],
    ["tumour", "tumor"],
    ["tumours", "tumors"],
    ["tunnelled", "tunneled"],
    ["tunnelling", "tunneling"],
    ["tyrannise", "tyrannize"],
    ["tyrannised", "tyrannized"],
    ["tyrannises", "tyrannizes"],
    ["tyrannising", "tyrannizing"],
    ["unauthorised", "unauthorized"],
    ["uncivilised", "uncivilized"],
    ["underutilised", "underutilized"],
    ["unequalled", "unequaled"],
    ["unfavourable", "unfavorable"],
    ["unfavourably", "unfavorably"],
    ["unionisation", "unionization"],
    ["unionise", "unionize"],
    ["unionised", "unionized"],
    ["unionises", "unionizes"],
    ["unionising", "unionizing"],
    ["unorganised", "unorganized"],
    ["unravelled", "unraveled"],
    ["unravelling", "unraveling"],
    ["unrecognisable", "unrecognizable"],
    ["unrecognised", "unrecognized"],
    ["unrivalled", "unrivaled"],
    ["unsavoury", "unsavory"],
    ["untrammelled", "untrammeled"],
    ["urbanisation", "urbanization"],
    ["urbanise", "urbanize"],
    ["urbanised", "urbanized"],
    ["urbanises", "urbanizes"],
    ["urbanising", "urbanizing"],
    ["utilisable", "utilizable"],
    ["utilisation", "utilization"],
    ["utilise", "utilize"],
    ["utilised", "utilized"],
    ["utilises", "utilizes"],
    ["utilising", "utilizing"],
    ["valour", "valor"],
    ["vandalise", "vandalize"],
    ["vandalised", "vandalized"],
    ["vandalises", "vandalizes"],
    ["vandalising", "vandalizing"],
    ["vaporisation", "vaporization"],
    ["vaporise", "vaporize"],
    ["vaporised", "vaporized"],
    ["vaporises", "vaporizes"],
    ["vaporising", "vaporizing"],
    ["vapour", "vapor"],
    ["vapours", "vapors"],
    ["verbalise", "verbalize"],
    ["verbalised", "verbalized"],
    ["verbalises", "verbalizes"],
    ["verbalising", "verbalizing"],
    ["victimisation", "victimization"],
    ["victimise", "victimize"],
    ["victimised", "victimized"],
    ["victimises", "victimizes"],
    ["victimising", "victimizing"],
    ["videodisc", "videodisk"],
    ["videodiscs", "videodisks"],
    ["vigour", "vigor"],
    ["visualisation", "visualization"],
    ["visualisations", "visualizations"],
    ["visualise", "visualize"],
    ["visualised", "visualized"],
    ["visualises", "visualizes"],
    ["visualising", "visualizing"],
    ["vocalisation", "vocalization"],
    ["vocalisations", "vocalizations"],
    ["vocalise", "vocalize"],
    ["vocalised", "vocalized"],
    ["vocalises", "vocalizes"],
    ["vocalising", "vocalizing"],
    ["vulcanised", "vulcanized"],
    ["vulgarisation", "vulgarization"],
    ["vulgarise", "vulgarize"],
    ["vulgarised", "vulgarized"],
    ["vulgarises", "vulgarizes"],
    ["vulgarising", "vulgarizing"],
    ["waggon", "wagon"],
    ["waggons", "wagons"],
    ["watercolour", "watercolor"],
    ["watercolours", "watercolors"],
    ["weaselled", "weaseled"],
    ["weaselling", "weaseling"],
    ["westernisation", "westernization"],
    ["westernise", "westernize"],
    ["westernised", "westernized"],
    ["westernises", "westernizes"],
    ["westernising", "westernizing"],
    ["womanise", "womanize"],
    ["womanised", "womanized"],
    ["womaniser", "womanizer"],
    ["womanisers", "womanizers"],
    ["womanises", "womanizes"],
    ["womanising", "womanizing"],
    ["woollen", "woolen"],
    ["woollens", "woolens"],
    ["woollies", "woolies"],
    ["woolly", "wooly"],
    ["worshipped", "worshiped"],
    ["worshipping", "worshiping"],
    ["worshipper", "worshiper"],
    ["yodelled", "yodeled"],
    ["yodelling", "yodeling"],
    ["yoghourt", "yogurt"],
    ["yoghourts", "yogurts"],
    ["yoghurt", "yogurt"],
    ["yoghurts", "yogurts"],
  ];

  /*
   * Technical phrases.
   */
  const phraseAlternatives = [
    {
      variants: ["opto coupler", "opto-coupler", "optocoupler"],
      preferred: "optocoupler"
    },
    {
      variants: ["optoelectronic", "opto electronic", "opto-electronic"],
      preferred: "optoelectronic"
    },
    {
      variants: ["thermo couple", "thermo-couple", "thermocouple"],
      preferred: "thermocouple"
    },
    {
      variants: ["micro controller", "micro-controller", "microcontroller"],
      preferred: "microcontroller"
    },
    {
      variants: ["electro magnetic", "electro-magnetic", "electromagnetic"],
      preferred: "electromagnetic"
    },
    {
      variants: ["photo electric", "photo-electric", "photoelectric"],
      preferred: "photoelectric"
    },
    {
      variants: ["customwordxyz", "custom word xyz"],
      preferred: "custom word xyz"
    },
    {
      variants: ["ToneVault", "Tone-Vault"],
      preferred: "ToneVault"
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
    },
    {
      variants: ["check valve", "check-valve"],
      preferred: "check valve"
    },
    {
      variants: ["o ring", "o-ring", "oring"],
      preferred: "O-ring"
    },
    {
      variants: ["gear box", "gearbox"],
      preferred: "gearbox"
    },
    {
      variants: ["air conditioner", "air-conditioner"],
      preferred: "air conditioner"
    },
    {
      variants: ["circuit breaker", "circuit-breaker"],
      preferred: "circuit breaker"
    },
    {
      variants: ["push button", "push-button"],
      preferred: "push button"
    },
    {
      variants: ["limit switch", "limit-switch"],
      preferred: "limit switch"
    },
    {
      variants: ["solenoid valve", "solenoid-valve"],
      preferred: "solenoid valve"
    },
    {
      variants: ["stainless steel", "stainless-steel"],
      preferred: "stainless steel"
    },
    {
      variants: ["power supply", "power-supply"],
      preferred: "power supply"
    }
  ];

  /*
   * Technical vocabulary protected from false positives.
   */
  const technicalWords = new Set(
    (
      "opto coupler optocoupler optoelectronic customwordxyz tonevault " +
      "thermo couple thermocouple micro controller microcontroller " +
      "electro magnetic electromagnetic photo electric photoelectric " +
      "non drive nondrive " +
      "co operate cooperate waterpump water pump " +
      "filter unit fluid pressure equipment hydraulic " +
      "phoenix contact crossbar stainless steel bracket " +
      "width thickness length connector electrical pump " +
      "assembly centrifugal bearing housing drawing cable " +
      "maintenance transmitter voltage current volts " +
      "hydraulic pneumatic solenoid actuator relay switch " +
      "motor engine gearbox gear bearing seal gasket " +
      "fastener washer bolt screw nut flange coupling " +
      "valve sensor controller terminal terminalblock " +
      "transformer capacitor resistor diode transistor " +
      "photocoupler optoisolator millimetre millimeter " +
      "mm cm kg kw kva dc ac dek pn part model serial item"
    ).split(/\s+/)
  );

  /*
   * Load personal dictionary.
   */
  try {
    const saved = JSON.parse(
      localStorage.getItem("toolboxSpellPersonalDictionary") || "[]"
    );

    saved.forEach(word => {
      personalDictionary.add(String(word).toLowerCase());
    });
  } catch (error) {
    // Continue without saved personal words.
  }

  // Read editor text while preserving a final BR. Chromium's innerText
  // can omit a trailing line break in contenteditable when the caret is
  // sitting in the empty text node after that BR. If live checking then
  // rebuilds the editor, the final newline disappears and Enter appears
  // to require a second press.
  const getText = () => {
    // Use real newline characters, never the two-character sequence \ and n.
    const text = editor.innerText.replace(/\r/g, "");

    function endsWithBreak(node) {
      for (let i = node.childNodes.length - 1; i >= 0; i--) {
        const child = node.childNodes[i];

        if (child.nodeType === Node.TEXT_NODE) {
          if (child.textContent.length) return false;
          continue;
        }

        if (child.nodeType !== Node.ELEMENT_NODE) continue;

        if (child.tagName === "BR") return true;

        const nested = endsWithBreak(child);
        if (nested !== null) return nested;
      }

      return null;
    }

    return endsWithBreak(editor) === true && !text.endsWith("\n")
      ? text + "\n"
      : text;
  };

  function preserveCase(source, replacement) {
    if (source === source.toUpperCase()) {
      return replacement.toUpperCase();
    }

    if (source[0] && source[0] === source[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1);
    }

    return replacement;
  }

  function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function getDictionary() {
    return window.LOCAL_SPELL_WORDS instanceof Set
      ? window.LOCAL_SPELL_WORDS
      : null;
  }

  function getLanguage() {
    return language?.value === "en_GB" ? "en_GB" : "en_US";
  }

  /*
   * US/UK spelling suggestions.
   */
  function getVariantSuggestions(word) {
    const lower = word.toLowerCase();

    for (const pair of spellingVariants) {
      const uk = pair[0].toLowerCase();
      const us = pair[1].toLowerCase();

      if (lower !== uk && lower !== us) continue;

      // Return [] for the selected regional spelling so the base
      // dictionary cannot incorrectly flag an accepted UK/US variant.
      if (getLanguage() === "en_GB") {
        return lower === uk ? [] : [pair[0]];
      }

      return lower === us ? [] : [pair[1]];
    }

    // null means this is not a regional spelling pair.
    return null;
  }

  /*
   * Approximate word similarity.
   */
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let previous = Array.from(
      { length: b.length + 1 },
      (_, index) => index
    );

    for (let i = 1; i <= a.length; i++) {
      const current = [i];

      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + cost
        );
      }

      previous = current;
    }

    return previous[b.length];
  }

  /*
   * Indexed and cached dictionary suggestions.
   * Build length buckets once instead of scanning the entire dictionary
   * for every unknown word on every editor update.
   */
  let dictionaryIndexSource = null;
  let dictionaryIndex = new Map();
  const suggestionCache = new Map();

  function getDictionaryIndex(dictionary) {
    if (dictionaryIndexSource === dictionary) return dictionaryIndex;

    dictionaryIndexSource = dictionary;
    dictionaryIndex = new Map();

    for (const candidate of dictionary) {
      if (typeof candidate !== "string") continue;
      const item = candidate.toLowerCase();
      const length = item.length;

      if (!dictionaryIndex.has(length)) dictionaryIndex.set(length, []);
      dictionaryIndex.get(length).push(item);
    }

    suggestionCache.clear();
    return dictionaryIndex;
  }

  function dictionarySuggestions(word) {
    const dictionary = getDictionary();
    if (!dictionary) return [];

    const lower = word.toLowerCase();
    if (lower.length < 3) return [];

    const cacheKey = `${getLanguage()}:${lower}`;
    if (suggestionCache.has(cacheKey)) {
      return suggestionCache.get(cacheKey);
    }

    const index = getDictionaryIndex(dictionary);
    const maxDistance = lower.length <= 4 ? 1 : 2;
    const candidates = [];

    for (
      let length = Math.max(1, lower.length - maxDistance);
      length <= lower.length + maxDistance;
      length++
    ) {
      const bucket = index.get(length);
      if (!bucket) continue;

      for (const item of bucket) {
        if (item === lower) continue;

        const distance = levenshtein(lower, item);
        if (distance <= maxDistance) {
          candidates.push({ word: item, distance });
        }
      }
    }

    candidates.sort((a, b) =>
      a.distance - b.distance || a.word.localeCompare(b.word)
    );

    const result = [...new Set(
      candidates.slice(0, 6).map(item => item.word)
    )];

    if (suggestionCache.size > 3000) suggestionCache.clear();
    suggestionCache.set(cacheKey, result);
    return result;
  }

  /*
   * Common valid words that may be absent from the compact local
   * dictionary. Do not generate misleading edit-distance suggestions
   * for these correctly spelled words.
   */
  const acceptedWords = new Set([
    "after",
    "acceptable",
    "immediately",
    "normally",
    "prepared",
    "properly",
    "replaced",
    "review",
    "successfully",
    "incorrectly",
    "accurately",
    "carefully",
    "continuously",
    "suddenly",
    "directly",
    "electrically",
    "mechanically",
    "hydraulically",
    "visually",
    "particularly",
    "approximately",
    "satisfactory"
  ]);

  /*
   * Return spelling corrections for a single word.
   */
  function getSuggestions(word) {
    const lower = word.toLowerCase();

    if (
      personalDictionary.has(lower) ||
      ignoredWords.has(lower) ||
      technicalWords.has(lower) ||
      acceptedWords.has(lower)
    ) {
      return [];
    }

    // Explicit typo corrections take priority.
    if (spellingMap[lower]) {
      return spellingMap[lower];
    }

    // Apply selected US/UK spelling.
    const variantSuggestions = getVariantSuggestions(word);

    if (variantSuggestions !== null) {
      return variantSuggestions;
    }

    // Accept words in the local dictionary.
    const dictionary = getDictionary();

    if (dictionary && dictionary.has(lower)) {
      return [];
    }

    // Generate suggestions for unknown words.
    if (dictionary) {
      return dictionarySuggestions(word);
    }

    return [];
  }

  /*
   * Find optional technical phrase alternatives.
   * Regional spelling alternatives are deliberately excluded.
   */
  const phraseResultCache = new Map();
  const issueResultCache = new Map();

  function findPhraseAlternatives(text) {
    const cacheKey = `${getLanguage()}:` + text;
    if (phraseResultCache.has(cacheKey)) return phraseResultCache.get(cacheKey);

    const results = [];

    // Regional compounds are checked for spelling first by findIssues().
    // Once their spelling matches the selected dictionary, show them here
    // as optional blue-dot phrase/format alternatives.
    const regionalVariant = getLanguage() === "en_GB" ? "grey" : "gray";
    const rules = [
      ...phraseAlternatives,
      {
        variants: [
          `non ${regionalVariant}`,
          `non-${regionalVariant}`,
          `non${regionalVariant}`
        ],
        preferred: `non-${regionalVariant}`
      }
    ];

    rules.forEach(rule => {
      rule.variants.forEach(variant => {
        const escaped = variant.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

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

    if (phraseResultCache.size > 20) phraseResultCache.clear();
    phraseResultCache.set(cacheKey, filtered);
    return filtered;
  }

  /*
   * Find actual spelling errors.
   */
  function findIssues(text) {
    const cacheKey = `${getLanguage()}:` + text;
    if (issueResultCache.has(cacheKey)) return issueResultCache.get(cacheKey);

    const results = [];
    const compoundRanges = [];

    /*
     * Check regional spelling of the complete "non-grey/non-gray"
     * expression before checking individual words.
     */
    const compoundRegex = /\bnon([ -])(grey|gray)\b/giu;
    let compoundMatch;

    while ((compoundMatch = compoundRegex.exec(text)) !== null) {
      const word = compoundMatch[0];
      const separator = compoundMatch[1];
      const currentVariant = compoundMatch[2].toLowerCase();
      const preferredVariant = getLanguage() === "en_GB" ? "grey" : "gray";

      compoundRanges.push({
        start: compoundMatch.index,
        end: compoundMatch.index + word.length
      });

      if (currentVariant !== preferredVariant) {
        results.push({
          word,
          start: compoundMatch.index,
          end: compoundMatch.index + word.length,
          suggestions: [`non-${preferredVariant}`],
          type: "spelling"
        });
      }
    }

    /*
     * Protect recognised multi-word technical expressions from being
     * split into unrelated individual spelling errors.
     */
    findPhraseAlternatives(text).forEach(alternative => {
      if (/[\\s-]/.test(alternative.word)) {
        compoundRanges.push({
          start: alternative.start,
          end: alternative.end
        });
      }
    });

    /*
     * Check individual words, excluding words already covered by a
     * complete compound expression.
     */
    const regex =
      /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;

    let match;

    while ((match = regex.exec(text)) !== null) {
      const word = match[0];
      const start = match.index;
      const end = start + word.length;

      if (compoundRanges.some(range => start >= range.start && end <= range.end)) {
        continue;
      }

      const suggestions = getSuggestions(word);

      if (suggestions.length) {
        results.push({
          word,
          start,
          end,
          suggestions,
          type: "spelling"
        });
      }
    }

    // Detect consecutive repeated words and mark the complete pair as
    // a blue optional-style issue, rather than a red spelling error.
    // Selecting "Keep one copy" replaces both occurrences with one.
    const repeatedRegex = /\b([\p{L}\p{M}]+)[ \t]+\1\b/giu;
    let repeatedMatch;

    while ((repeatedMatch = repeatedRegex.exec(text)) !== null) {
      const repeatedWord = repeatedMatch[1];
      const phraseStart = repeatedMatch.index;
      const phraseEnd = phraseStart + repeatedMatch[0].length;

      // Suppress individual spelling flags within this repeated pair.
      for (let i = results.length - 1; i >= 0; i--) {
        if (
          results[i].type === "spelling" &&
          results[i].start < phraseEnd &&
          results[i].end > phraseStart
        ) {
          results.splice(i, 1);
        }
      }

      results.push({
        word: repeatedWord,
        start: phraseStart,
        end: phraseEnd,
        suggestions: [repeatedWord],
        suggestionLabels: ["Keep one copy"],
        type: "repeated"
      });
    }

    results.sort((a, b) => a.start - b.start);
    if (issueResultCache.size > 20) issueResultCache.clear();
    issueResultCache.set(cacheKey, results);
    return results;
  }
  /*
   * Read caret position before re-rendering.
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

    const targetNode = selection.anchorNode;
    const targetOffset = selection.anchorOffset;
    let position = 0;
    let found = false;

    function visit(node) {
      if (found) return;

      if (node === targetNode) {
        if (node.nodeType === Node.TEXT_NODE) {
          position += Math.min(targetOffset, node.textContent.length);
        } else {
          const children = node.childNodes;
          for (let i = 0; i < Math.min(targetOffset, children.length); i++) {
            measure(children[i]);
          }
        }
        found = true;
        return;
      }

      measure(node);
    }

    function measure(node) {
      if (found) return;

      if (node.nodeType === Node.TEXT_NODE) {
        position += node.textContent.length;
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      if (node.tagName === "BR") {
        position += 1;
        return;
      }

      for (const child of node.childNodes) {
        visit(child);
        if (found) return;
      }
    }

    visit(editor);
    return found ? position : null;
  }

  /*
   * Restore caret after rendering, counting BR elements as newline
   * characters. Range.toString() and text-only TreeWalkers omit BRs,
   * which previously moved the caret backwards after pressing Enter.
   */
  function restoreCaret(position) {
    if (position === null) return;

    const selection = window.getSelection();
    if (!selection) return;

    let consumed = 0;
    let restored = false;
    const range = document.createRange();

    function place(node, offset) {
      range.setStart(node, offset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      restored = true;
    }

    function walk(node) {
      if (restored) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const length = node.textContent.length;

        if (position <= consumed + length) {
          place(node, Math.max(0, position - consumed));
          return;
        }

        consumed += length;
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      if (node.tagName === "BR") {
        if (position <= consumed + 1) {
          range.setStartAfter(node);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          restored = true;
          return;
        }

        consumed += 1;
        return;
      }

      for (const child of node.childNodes) {
        walk(child);
        if (restored) return;
      }
    }

    for (const child of editor.childNodes) {
      walk(child);
      if (restored) return;
    }

    range.selectNodeContents(editor);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /*
   * Render spelling and phrase markers.
   */
  function renderEditor() {
    const text = getText();
    const caret = getCaretPosition();

    const spellingIssues = issues.filter(
      item => item.type === "spelling" || item.type === "repeated"
    );

    const alternatives = findPhraseAlternatives(text);

    const allMarkers = [
      ...spellingIssues,
      ...alternatives
    ].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    let html = "";
    let position = 0;

    for (const item of allMarkers) {
      if (item.start < position) continue;

      html += escapeHTML(text.slice(position, item.start));

      const className =
        item.type === "alternative" || item.type === "repeated"
          ? "optional-alternative"
          : "misspelled";

      const title =
        item.type === "alternative"
          ? "Click to view alternative forms"
          : item.type === "repeated"
            ? "Click to keep one copy of the repeated word"
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
   * Update word and spelling-error counts.
   */
  function updateCounts() {
    const text = getText();

    const words =
      text.match(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu) || [];

    const issueCount = issues.filter(
      item => item.type === "spelling" || item.type === "repeated"
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
 * Render spelling markers in preview text.
 */
function renderPreviewMarkup(text) {
  if (!text) return "";

  const previewIssues = [
    ...findIssues(text),
    ...findPhraseAlternatives(text)
  ].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (b.end - b.start) - (a.end - a.start);
  });

  let html = "";
  let position = 0;

  previewIssues.forEach(issue => {
    if (issue.start < position) return;

    html += escapeHTML(text.slice(position, issue.start));

    const className =
      issue.type === "alternative"
        ? "preview-alternative"
        : "preview-misspelled";

    html += `<span class="${className}">${escapeHTML(
      text.slice(issue.start, issue.end)
    )}</span>`;

    position = issue.end;
  });

  html += escapeHTML(text.slice(position));

  return html;
}

/*
 * Render before/after previews.
 */
function renderCorrectedPreviewMarkup(text) {
  if (!text) return "";

  const markers = [
    ...findIssues(text).map(issue => ({
      start: issue.start, end: issue.end, type: "misspelled"
    })),
    ...findPhraseAlternatives(text).map(issue => ({
      start: issue.start, end: issue.end, type: "alternative"
    })),
    ...appliedCorrections
      .filter(item => item.start >= 0 && item.end <= text.length)
      .map(item => ({
        start: item.start, end: item.end, type: "corrected"
      }))
  ].sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

  let html = "";
  let position = 0;

  markers.forEach(marker => {
    if (marker.start < position) return;
    html += escapeHTML(text.slice(position, marker.start));

    const className = marker.type === "corrected"
      ? "preview-corrected"
      : marker.type === "alternative"
        ? "preview-alternative"
        : "preview-misspelled";

    html += `<span class="${className}">${escapeHTML(
      text.slice(marker.start, marker.end)
    )}</span>`;
    position = marker.end;
  });

  html += escapeHTML(text.slice(position));
  return html;
}

/*
 * Render before/after previews.
 */
function renderPreviews() {
  const text = getText();

  // A completely empty editor must produce empty previews.
  if (!text) {
    originalText = "";
    correctedText = "";
  }

  if ($("originalPreview")) {
    $("originalPreview").innerHTML = originalText
      ? renderPreviewMarkup(originalText)
      : "Your original text will appear here.";
  }

  if ($("correctedPreview")) {
    $("correctedPreview").innerHTML = correctedText
      ? renderCorrectedPreviewMarkup(correctedText)
      : "Accepted corrections will appear here.";
  }

  if ($("changeSummary")) {
    $("changeSummary").textContent =
      correctedText !== originalText
        ? "Corrections applied"
        : "No corrections applied";
  }
}

  /*
   * Close suggestion popup.
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
   */
  function runCheck() {
    if (inputCheckTimer) {
      clearTimeout(inputCheckTimer);
      inputCheckTimer = null;
    }

    const text = getText();

    // Clearing a large document should not run dictionary, phrase,
    // preview, or cache work. Reset the UI immediately.
    if (!text.trim()) {
      issues = [];
      issueResultCache.clear();
      phraseResultCache.clear();
      suggestionCache.clear();
      originalText = "";
      correctedText = "";
      appliedCorrections.length = 0;

      if (editor.innerHTML !== "") editor.innerHTML = "";
      closePopup();
      renderPreviews();
      updateCounts();
      return;
    }

    issues = findIssues(text);

    // Preserve the browser-created paragraph for the first check after Enter.
    // The next ordinary edit can safely rebuild highlights using caret offsets.
    if (preserveNativeEnterDOM) {
      preserveNativeEnterDOM = false;
    } else {
      renderEditor();
    }

    renderPreviews();
    updateCounts();
    closePopup();
  }

  /*
   * Show spelling suggestions and actions.
   */
  function showPopup(issue, anchor) {
    if (!popup) return;

    activeIssue = issue;
    popup.replaceChildren();
    popup.hidden = false;

    const heading = document.createElement("div");
    heading.className = "suggestion-popup-heading";

    const title = document.createElement("span");
    title.className = "suggestion-popup-title";
    title.textContent =
      issue.type === "alternative"
        ? `${issue.word} — alternatives`
        : issue.type === "repeated"
          ? `${issue.word} — repeated word`
          : `${issue.word} — spelling suggestions`;

    const close = document.createElement("button");
    close.type = "button";
    close.className = "suggestion-popup-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close suggestions");
    close.title = "Close";

    close.addEventListener("click", event => {
      event.stopPropagation();
      closePopup();
    });

    heading.append(title, close);
    popup.append(heading);

    const suggestions = document.createElement("div");
    suggestions.className = "suggestion-popup-suggestions";

    issue.suggestions.forEach(suggestion => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion-chip";
      button.textContent = issue.suggestionLabels?.[issue.suggestions.indexOf(suggestion)] ||
        (suggestion ? preserveCase(issue.word, suggestion) : "Remove duplicate");

      button.addEventListener("click", event => {
        event.stopPropagation();
        replaceIssue(issue, suggestion);
      });

      suggestions.append(button);
    });

    popup.append(suggestions);

    if (issue.type === "spelling") {
      const actions = document.createElement("div");
      actions.className = "suggestion-popup-actions";

      const ignore = document.createElement("button");
      ignore.type = "button";
      ignore.className = "suggestion-action";
      ignore.textContent = "Ignore";
      ignore.addEventListener("click", event => {
        event.stopPropagation();
        ignoredWords.add(issue.word.toLowerCase());
        runCheck();
      });

      const add = document.createElement("button");
      add.type = "button";
      add.className = "suggestion-action";
      add.textContent = "Add to dictionary";
      add.addEventListener("click", event => {
        event.stopPropagation();
        personalDictionary.add(issue.word.toLowerCase());

        try {
          localStorage.setItem(
            "toolboxSpellPersonalDictionary",
            JSON.stringify([...personalDictionary])
          );
        } catch (error) {
          // Keep the word in the current session.
        }

        runCheck();
      });

      actions.append(ignore, add);
      popup.append(actions);
    }

    // Keep the popup inside the editor while allowing its width to follow
    // the suggestion chips instead of forcing a narrow, scrollable panel.
    if (anchor && $("editorWrap")) {
      const rect = anchor.getBoundingClientRect();
      const wrap = $("editorWrap").getBoundingClientRect();

      popup.style.position = "absolute";
      popup.style.left = Math.max(
        8,
        Math.min(rect.left - wrap.left, wrap.width - popup.offsetWidth - 8)
      ) + "px";
      popup.style.top = Math.max(8, rect.bottom - wrap.top + 6) + "px";
    }
  }

  /*
   * Replace a selected word or phrase.
   */
  function replaceIssue(issue, replacement) {
    previousText = getText();

    const text = getText();

    const replacementText = preserveCase(
      issue.word,
      replacement
    );

    let prefix = text.slice(0, issue.start);
    if (issue.type === "repeated" && replacementText === "") {
      prefix = prefix.replace(/[ \t]+$/, "");
    }

    const updated =
      prefix +
      replacementText +
      text.slice(issue.end);

    const delta = replacementText.length - (issue.end - issue.start);
    appliedCorrections.forEach(item => {
      if (item.start >= issue.end) {
        item.start += delta;
        item.end += delta;
      } else if (item.end > issue.start) {
        item.end = item.start;
      }
    });
    appliedCorrections.push({
      start: issue.start,
      end: issue.start + replacementText.length
    });

    editor.innerText = updated;
    correctedText = updated;

    closePopup();
    runCheck();

    editor.focus();
  }

  /*
   * Open popup when a marked word is clicked.
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
        item =>
          item.start === start &&
          (item.type === "spelling" || item.type === "repeated")
      );
    }

    if (issue) {
      showPopup(issue, marker);
    }
  });

  /*
   * Close popup when clicking outside.
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
   * Fast reset for full-document deletion.
   * The editor may contain hundreds of marker spans. Letting the browser
   * delete a large selected rich-text DOM tree node-by-node can freeze the
   * main thread. Intercept a full-content deletion and clear the editor in
   * one operation instead.
   */
  let inputCheckTimer = null;

  function resetEmptyEditor() {
    if (inputCheckTimer) {
      clearTimeout(inputCheckTimer);
      inputCheckTimer = null;
    }

    issues = [];
    issueResultCache.clear();
    phraseResultCache.clear();
    suggestionCache.clear();
    originalText = "";
    correctedText = "";
    appliedCorrections.length = 0;
    editor.replaceChildren();
    closePopup();

    if ($("originalPreview")) {
      $("originalPreview").textContent = "Your original text will appear here.";
    }
    if ($("correctedPreview")) {
      $("correctedPreview").textContent = "Accepted corrections will appear here.";
    }
    if ($("changeSummary")) {
      $("changeSummary").textContent = "No corrections applied";
    }

    updateCounts();
  }

  editor.addEventListener("beforeinput", event => {
    if (!/^delete/.test(event.inputType || "")) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) return;

    // textContent is substantially cheaper than innerText for this check.
    // Selection text includes line breaks, so >= also covers rendered <br>s.
    const selectedLength = selection.toString().length;
    const documentLength = editor.textContent.length;

    if (documentLength > 0 && selectedLength >= documentLength) {
      event.preventDefault();
      resetEmptyEditor();
    }
  });

  // Keep Enter behaviour predictable in the contenteditable editor.
  // Native Enter may create DIV/P blocks; the highlighter later rebuilds the
  // editor using BR elements, which can make the saved caret offset point to
  // the previous line. Insert a BR ourselves so the DOM shape is consistent.
  // Let the browser create native contenteditable paragraphs for Enter.
  // Rebuilding the editor immediately after Enter can collapse the new empty
  // paragraph and move the caret back to the previous line.
  let pendingNativeEnter = false;
  let preserveNativeEnterDOM = false;

  editor.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.isComposing) {
      pendingNativeEnter = true;
      // Do not preventDefault: Chrome must create the native paragraph/line break.
    }
  });

  editor.addEventListener("input", event => {
    if (
      pendingNativeEnter ||
      event.inputType === "insertParagraph" ||
      event.inputType === "insertLineBreak"
    ) {
      if ($("autoCheck")?.checked) {
        preserveNativeEnterDOM = true;
      }
    }
    pendingNativeEnter = false;

    appliedCorrections.length = 0;
    originalText = getText();
    correctedText = originalText;

    // Fast path for deleting all content, including large pasted documents.
    if (!originalText.trim()) {
      resetEmptyEditor();
      return;
    }

    // Keep live checking responsive while still grouping rapid keystrokes.
    // The shorter debounce also reduces the pause after inserting a line break.
    if (inputCheckTimer) clearTimeout(inputCheckTimer);

    if ($("autoCheck")?.checked) {
      inputCheckTimer = setTimeout(() => {
        inputCheckTimer = null;
        runCheck();
      }, 90);
    } else {
      updateCounts();
    }
  });

  /*
   * Check spelling button.
   */
  $("checkBtn")?.addEventListener("click", () => {
    originalText = getText();
    correctedText = originalText;
    appliedCorrections.length = 0;
    runCheck();
  });

  /*
   * Clear text button.
   */
  $("clearBtn")?.addEventListener("click", () => {
    previousText = getText();

    editor.innerText = "";
    originalText = "";
    correctedText = "";
    appliedCorrections.length = 0;

    ignoredWords.clear();

    closePopup();
    runCheck();

    editor.focus();
  });

  /*
   * Undo previous correction or clear operation.
   */
  $("undoBtn")?.addEventListener("click", () => {
    if (!previousText) return;

    const currentText = getText();

    editor.innerText = previousText;
    previousText = currentText;

    correctedText = getText();

    closePopup();
    runCheck();
  });

  /*
   * Refresh spelling when US/UK dictionary changes.
   */
  language?.addEventListener("change", () => {
    closePopup();
    runCheck();
  });

  /*
   * Auto-check toggle.
   */
  $("autoCheck")?.addEventListener("change", () => {
    if ($("autoCheck").checked) {
      runCheck();
    }
  });

  /*
   * Upload TXT file.
   */
  $("txtFile")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    editor.innerText = await file.text();

    originalText = getText();
    correctedText = originalText;

    if ($("fileName")) {
      $("fileName").textContent = file.name;
    }

    runCheck();
  });

  /*
   * Download helper.
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

  /*
   * Download text as TXT.
   */
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
    const suffix = getLanguage() === "en_GB" ? "UK" : "US";

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
   * Compare / Original / Corrected preview controls.
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
   * Excel / CSV workbook workflow using the SheetJS library.
   */
  let uploadedWorkbook = null;
  let uploadedSheetName = "";
  let uploadedRows = [];
  let selectedColumnIndex = -1;

  function setExcelStatus(message) {
    if ($("excelStatus")) $("excelStatus").textContent = message;
  }

  function resetExcelInterface(hidePanel = true) {
    uploadedWorkbook = null;
    uploadedSheetName = "";
    uploadedRows = [];
    selectedColumnIndex = -1;

    if ($("excelFile")) $("excelFile").value = "";
    if ($("sheetSelect")) $("sheetSelect").replaceChildren();
    if ($("columnChoices")) $("columnChoices").replaceChildren();
    if ($("excelPreview")) $("excelPreview").replaceChildren();
    if ($("saveColumnBtn")) $("saveColumnBtn").hidden = true;
    if ($("downloadExcelBtn")) $("downloadExcelBtn").disabled = true;
    if ($("fileName")) $("fileName").textContent = "No file selected";
    setExcelStatus("");

    if ($("excelPanel") && hidePanel) $("excelPanel").hidden = true;
  }

  function getSheetRows(sheetName) {
    const sheet = uploadedWorkbook?.Sheets?.[sheetName];
    if (!sheet || !window.XLSX) return [];
    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: ""
    });
  }

  function renderExcelColumns() {
    const container = $("columnChoices");
    if (!container || !uploadedRows.length) return;

    container.replaceChildren();
    const headers = uploadedRows[0] || [];
    const width = Math.max(headers.length, ...uploadedRows.map(row => row.length), 0);

    for (let col = 0; col < width; col++) {
      const label = document.createElement("label");
      label.className = "excel-column-option";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "excelTextColumn";
      radio.value = String(col);
      radio.checked = col === 0;
      radio.addEventListener("change", () => {
        selectedColumnIndex = col;
      });

      const caption = document.createElement("span");
      caption.textContent = String(headers[col] ?? "").trim() || `Column ${col + 1}`;
      label.append(radio, caption);
      container.append(label);
    }

    selectedColumnIndex = 0;
  }

  function renderExcelPreview() {
    const target = $("excelPreview");
    if (!target) return;

    target.replaceChildren();
    const table = document.createElement("table");
    table.className = "excel-preview-table";
    const body = document.createElement("tbody");

    uploadedRows.slice(0, 6).forEach(row => {
      const tr = document.createElement("tr");
      row.slice(0, 8).forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = String(value ?? "");
        tr.append(cell);
      });
      body.append(tr);
    });

    table.append(body);
    target.append(table);
  }

  $("excelFile")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!window.XLSX) {
        throw new Error("Excel library did not load. Check your internet connection and refresh the page.");
      }

      const buffer = await file.arrayBuffer();
      uploadedWorkbook = XLSX.read(buffer, { type: "array", cellDates: false });

      if (!uploadedWorkbook.SheetNames.length) {
        throw new Error("The uploaded file contains no worksheets.");
      }

      if ($("fileName")) $("fileName").textContent = file.name;
      if ($("excelPanel")) $("excelPanel").hidden = false;

      const sheetSelect = $("sheetSelect");
      sheetSelect.replaceChildren();

      uploadedWorkbook.SheetNames.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        sheetSelect.append(option);
      });

      uploadedSheetName = uploadedWorkbook.SheetNames[0];
      uploadedRows = getSheetRows(uploadedSheetName);
      renderExcelColumns();
      renderExcelPreview();

      if ($("downloadExcelBtn")) $("downloadExcelBtn").disabled = false;
      setExcelStatus(`${file.name} loaded successfully. ${uploadedWorkbook.SheetNames.length} worksheet(s) found. Select a text column.`);
    } catch (error) {
      resetExcelInterface(false);
      if ($("excelPanel")) $("excelPanel").hidden = false;
      setExcelStatus(`Upload failed: ${error.message || "Unable to read this file."}`);
    }
  });

  $("sheetSelect")?.addEventListener("change", () => {
    if (!uploadedWorkbook) return;
    uploadedSheetName = $("sheetSelect").value;
    uploadedRows = getSheetRows(uploadedSheetName);
    renderExcelColumns();
    renderExcelPreview();
    setExcelStatus(`Worksheet "${uploadedSheetName}" selected. Choose a text column.`);
  });

  $("loadColumnBtn")?.addEventListener("click", () => {
    if (!uploadedWorkbook || selectedColumnIndex < 0 || !uploadedRows.length) {
      setExcelStatus("Upload a workbook and select a text column first.");
      return;
    }

    const values = uploadedRows.slice(1).map(row =>
      String(row[selectedColumnIndex] ?? "")
    );
    const text = values.join("\n");

    previousText = getText();
    editor.innerText = text;
    originalText = text;
    correctedText = text;
    appliedCorrections.length = 0;

    if ($("saveColumnBtn")) $("saveColumnBtn").hidden = false;
    runCheck();
    setExcelStatus(`Loaded ${values.length} data row(s) from "${uploadedSheetName}". Correct the text, then save it back to the workbook.`);
    editor.focus();
  });

  $("saveColumnBtn")?.addEventListener("click", () => {
    if (!uploadedWorkbook || selectedColumnIndex < 0 || !uploadedRows.length) return;

    const correctedValues = getText().split(/\r?\n/);
    const headerRow = uploadedRows[0] || [];
    const sourceHeader = String(headerRow[selectedColumnIndex] ?? `Column ${selectedColumnIndex + 1}`);
    const correctedHeader = `${sourceHeader} (Corrected)`;

    let outputColumn = headerRow.findIndex(value =>
      String(value).trim().toLowerCase() === correctedHeader.toLowerCase()
    );

    if (outputColumn < 0) {
      outputColumn = Math.max(headerRow.length, ...uploadedRows.map(row => row.length), 0);
      headerRow[outputColumn] = correctedHeader;
      uploadedRows[0] = headerRow;
    }

    for (let rowIndex = 1; rowIndex < uploadedRows.length; rowIndex++) {
      uploadedRows[rowIndex][outputColumn] = correctedValues[rowIndex - 1] ?? "";
    }

    const worksheet = uploadedWorkbook.Sheets[uploadedSheetName];
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");
    range.e.c = Math.max(range.e.c, outputColumn);
    range.e.r = Math.max(range.e.r, uploadedRows.length - 1);

    for (let rowIndex = 0; rowIndex < uploadedRows.length; rowIndex++) {
      const value = uploadedRows[rowIndex][outputColumn] ?? "";
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: outputColumn });
      worksheet[address] = { t: "s", v: String(value) };
    }

    worksheet["!ref"] = XLSX.utils.encode_range(range);
    renderExcelPreview();
    setExcelStatus(`Corrected values saved to the new "${correctedHeader}" column. Download the workbook to keep the changes.`);
  });

  $("downloadExcelBtn")?.addEventListener("click", () => {
    if (!uploadedWorkbook) return;
    try {
      XLSX.writeFile(uploadedWorkbook, "spell-check-corrected-workbook.xlsx");
      setExcelStatus("Corrected workbook downloaded.");
    } catch (error) {
      setExcelStatus(`Download failed: ${error.message || "Unable to create workbook."}`);
    }
  });

  $("clearExcelBtn")?.addEventListener("click", () => {
    resetExcelInterface(true);
  });

  /*
   * Initial setup.
   */
  originalText = getText();
  correctedText = originalText;

  runCheck();
})();
