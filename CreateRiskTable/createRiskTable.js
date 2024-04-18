

// processes CSV derived from pasting Borland Caliber RM, H BOOK tables into Excel 

// for full console access, run in Chrome

// 20230802 code to handle shorter lines with less columns than 14 (0-13)

// underlying CSV can only list one controlled risk per line 
// each controlled risk is uniquely identified by (F * H  * C)
// one controlled risk allows multiple risk control measures


let jMaster={'risks':{},'measures':{}, title:""};
let jRisks=jMaster.risks;
let jMeasures=jMaster.measures;


const NBSP = ' ';


// JSON attributes name:value
var dataBuffer  = [ ]; // boxB in UI
var aoaLines = [ dataBuffer ];

var filename=null;

let TITLELEN = 5; // minimum title length

let MRLEN=12; // minimum nr of comlumns in a risk control table line

// select a WORD TABLE, paste (with format) into Excel table, save table from Excel as CSV
// HTML+JS allow to open,view and split a CSV files with HBook structure


// <BODY onload="start()" >
//--- FUNCTIONS
function start() {
	console.log("start()");

  document.getElementById('filechoice').addEventListener('change', function (evt) {
  try {
	console.log("eventListener");
	
	var fr = new FileReader();
	fr.onload = function (ev2,file) {
		console.log("onLoad"); 
		try {
			init();
			console.log("init OK"); 
			let aLines   = splitLines(this.result+" \n");
			console.log("splitLines OK"); 
			aoaLines = aoaSections(aLines); 
			console.log("aOaSections OK"); 
			let sLines   = joinLines(aoaLines);
			console.log("joinLines OK"); 
			showLines(sLines); 
			console.log("showLines OK"); 
			
	//		console.log("FILE evt.target.id "+evt.target.id); 'filechoice'
			console.log("FILE evt.target.name "+evt.target.name);  'Load'
	//		console.log("FILE ev2.target.result "+ev2.target.result); all file contents
			save(makeClaim(jMaster,filename));
		} catch(e) { console.log("onLoad Exception "); }
	};
	
	filename=this.files[0].name;
	console.log("reading from file="+filename);
	document.getElementById('filechoice').innerHTML=filename;
	fr.readAsText(this.files[0]);
  } catch(e) { console.log(" listener Exception "); }
  });
  
	console.log("file listener set");
}



function init() {
   document.getElementById('ResultTable').innerHTML='&nbsp;';
}


function splitLines(str) { 
  // FUNCTION
  // split according to LF,CR
  let flat = str.replace(/(\n|\r)/g,'$');
  while(flat.includes('$$')) { flat = flat.replace('$$','$'); }
  return flat.replace('$$','$').split('$');
}


function aoaSections(aText) {
  // FUNCTION
  let nLine=0;
  let section=[];
  let result=[];

	try {

		for(let i=0;i<aText.length;i++) {
			let line = aText[i];
			let word = line.split(';')[0];
			if(word && word.length>0) {       
			
				processLine(nLine,section,result);
				nLine++;

				section=['<H2>'+nLine+'</H2>'];
			} 
			section.push(line);

		}

	} catch(e) { console.log("aoaSections block1 "+e.toString()); }
  
	try {

  		processLine(nLine,section,result);

	} catch(e) { console.log("aoaSections block2 "+e.toString()); }

  return result;
}


function joinLines(aoaText) {
  // FUNCTION
  let result=[];
  for(let i=0;i<aoaText.length;i++) {
    let aSection = aoaText[i];
    result.push('<DIV class="raw spacer">'+aSection.join('</DIV><DIV class="raw spacer">')+'</DIV>'); 
  }
  return result;
}


function showLines(aText) {
  // modifies GUI element with id=ResultTable
  // aText is an array of strings without markup
  let result = '<DIV class="neonText spacer">'+aText.join('</DIV><DIV class="neonText spacer">')+'</DIV>'
  document.getElementById('ResultTable').innerHTML = result;
}


function cleanSplit(x) { return x.replace(/\u00a0/g,' ').split(';'); }



function jmakeLine(aLine) {

	let jResult={};
	try {
		let wLine=cleanSplit(aLine+";;;;;;;;;;;;;;"); 

		if(wLine[0].length>0)  jResult.functionId=wLine[0];
		if(wLine[1].length>0)  jResult.Function=  wLine[1];
		if(wLine[2].length>0)  jResult.harmId  =  wLine[2];
		if(wLine[3].length>0)  jResult.Hazard  =  wLine[3];
		if(wLine[4].length>0)  jResult.causeId =  wLine[4];
		if(wLine[5].length>0)  jResult.Cause   =  wLine[5];
		if(wLine[6].length>0)  jResult.Effect  =  wLine[6];
		if(wLine[7].length>0)  jResult.ARisk   =  wLine[7];
		if(wLine[8].length>0)  jResult.measureId= wLine[8];  else jResult.measureId = prevMI; 
		if(wLine[9].length>0)  jResult.Measure =  wLine[9];  else jResult.Measure = '';
		if(wLine[10].length>0) jResult.PRisk   =  wLine[10];
		if(wLine[11].length>0) jResult.Remark  =  wLine[11];
		if(wLine[12].length>0) jResult.References=wLine[12];
		if(wLine[13].length>0) jResult.FollowUp = wLine[13];
	
		if(wLine[8].length>0) prevMI=wLine[8];

		// jResult structure 'knows' measure identifiers
	} catch( e) { console.log("jmakeLine "+aLine+" ==> "+e); }
  return jResult;
}

var prevMI;

function jconcatLine(jResult,aLine) {

	try {
		let wLine=cleanSplit(aLine+";;;;;;;;;;;;;;"); 

		if(wLine[0].length>0)  jResult.functionId=jResult.functionId+';'+wLine[0];
		if(wLine[1].length>0)  jResult.Function  =jResult.Function+';'  +wLine[1];
		if(wLine[2].length>0)  jResult.harmId    =jResult.harmId+';'  +  wLine[2];
		if(wLine[3].length>0)  jResult.Hazard    =jResult.Hazard+';'  +  wLine[3];
		if(wLine[4].length>0)  jResult.causeId   =jResult.causeId+';'   +wLine[4];
		if(wLine[5].length>0)  jResult.Cause     =jResult.Cause+';'   +  wLine[5];
		if(wLine[6].length>0)  jResult.Effect    =jResult.Effect+';'  +  wLine[6];
		if(wLine[7].length>0)  jResult.ARisk     =jResult.ARisk+';'   +  wLine[7];
		if(wLine[8].length>0)  jResult.measureId =jResult.measureId+';' +wLine[8];  else jResult.measureId =jResult.measureId+';'+prevMI;
									jResult.Measure  =jResult.Measure+';'+wLine[9]; // in any case: add a measureID and a measure text
		if(wLine[10].length>0) jResult.PRisk     =jResult.PRisk+';'   +  wLine[10];
		if(wLine[11].length>0) jResult.Remark    =jResult.Remark+';'  +  wLine[11];
		if(wLine[12].length>0) jResult.References=jResult.References+';'+wLine[12];
		if(wLine[13].length>0) jResult.FollowUp  =jResult.FollowUp+';' + wLine[13];

		if(wLine[8].length>0) prevMI=wLine[8];
	} catch( e) { console.log("jconcatLine "+aLine+" ==> "+e); }
	
}

function jEvalRisk(strRisk) {
	// splits "SEV-PROB REGION"
	let spcRisk=strRisk.split(' ');
	let arrRisk=spcRisk[0].split('-');
	return { 	'severity':  arrRisk[0],
			'probability':arrRisk[1],
			'riskRegion': spcRisk[1]
			};
}


function arrPurge(strText) {
	return strText.split(';');
}

function makeMAR(num,jResult) {

	let jMAR={};

	jMAR.source=jResult.num;	
	jMAR.id=jResult.causeId; // the MAR is the cause is the HazardousSituation
	jMAR.name=jResult.Cause;
	jMAR.subjectGroups=jResult.Effect ? jResult.Effect.split(';') : ["not specified"];
	jMAR.preRiskEvaluation=jEvalRisk(jResult.ARisk);
	jMAR.postRiskEvaluation=jEvalRisk(jResult.PRisk);
	jMAR.Remark=jResult.Remark;
	jMAR.references=jResult.References;
	jMAR.FollowUp=jResult.FollowUp;

  	let refFunc='F'+jResult.functionId;
	
	let refHazard = refFunc+'H'+jResult.harmId;


// 20230707  	
	let refHarm = jResult.harmId;
	jMAR.harmId = refHarm;


	var aMeasure=[]; // alle Measures  
	let currentJM={}; // aktuelles Measure
	let currentMI=0;
	let currentMS='';
	var aMI=jResult.measureId.split(';');
	var aMS=arrPurge(jResult.Measure); // remove empty trailing columns

	var index=0;
	for(let i=0;i<aMI.length;i++) {
	  var iMI=parseInt(aMI[i]);
	  if(iMI==currentMI) {
		  if(aMS[i].length>0) currentMS=currentMS+';'+aMS[i];
		  // ignore trailing empty lines
	  }
	  else {

			// first and all but last run
			currentJM.sdaAssurance = buildSDA(currentMS);

			currentJM = {  }; // anchor
			currentMS=aMS[i];
			currentMI=iMI;
			let strKey = refHazard +'M'+iMI;
			currentJM.id = strKey;
			currentJM.source=i;
			currentJM.index=index;
			currentJM.measureId=iMI;
			aMeasure[ index ]=currentJM;
			
			index++;
		}
	}

	// AFTER last line
	// transfer hanging text
	currentJM.sdaAssurance = buildSDA(currentMS);

	jMAR.mitigations=aMeasure;

	return jMAR;
}

function buildSDA(currentMS) {
	console.log("buildSDA "+currentMS);
	
	let mitigation = currentMS.split(';')
	/* special case: third line missing */
	if(mitigation.length<3) mitigation.push("see text.")
	let name = mitigation.shift()
	let requirementCode=mitigation.pop();
	let sdaAssurance = { 'name':name, 'requirementCode':requirementCode };
	sdaAssurance.text=mitigation.join(';');
	
	return sdaAssurance;
}




function processLine(num,aLine,result) {
	if(aLine && aLine[0]) {
		let control=aLine[0];
		aLine.shift();                       // remove first / button
		let sLine = aLine.join('$');

		let arrLine=sLine.split(';');
		var lead;
		try {

				if(	parseInt(arrLine[0])>0 &&  // F# exists
					parseInt(arrLine[2])>0 &&  // H# exists
					parseInt(arrLine[4])>0 &&  // C# exists
					arrLine &&
					arrLine.length>MRLEN) {

				console.log("processLine "+sLine); 

				prevMI='0';

				let jResult=jmakeLine(aLine[0]); // erste Zeile bildet das Ergebnis
				
				jResult.component = jMaster.title; // 20230708 20231211

				// weitere Zeilen werden angehängt
				for(let iLine=1;iLine<aLine.length;iLine++) {
					
					if(aLine[iLine] && aLine[iLine].length>MRLEN) { // Separatoren ; mitzaehlen
						jconcatLine(jResult,
							aLine[iLine].replace(/\"/g,"'")); 	//20230703 sanitize input from \" to '
					}
				}

				try {
					// console.log("JOIN "+JSON.stringify(jResult)); 
					console.log("\nBlock "+num+"\n");

					let jMAR = makeMAR(num,jResult); 

					// GH20220810
					// rather than anoynymous MR in a list under justification: identify MRs
					let arrHazard= jResult.Hazard ? jResult.Hazard.split(';') : ["uHazard"];

					// 20230707 one harm per MAR
					let jHarm = 	{ 'id':jResult.harmId,	 'name': arrHazard[0]+';'+arrHazard[1] };
					// 20230803 appended next row for code , like e.g. imdrf_aete
					
					// 20240123 jMAR.harm = harm; revised 2024 model of VDE SPEC 90025

					let allGenericHazards = [];
					let allEncodedHazards = []; 
					// && hazard.split("#")[0]=="GH"
					arrHazard.slice(3).forEach((strHazard)=>{ 
						let hazard=strHazard.trim();
						let arrHaz = hazard.split('#');
						if(arrHaz.length>1 && arrHaz[0].trim()=="C1") allEncodedHazards.push(hazard); else allGenericHazards.push(hazard);						
						});

					// for SHS DI XP: slice beginning with a Harm name, then "Generic Hazards:" and then each hazard has this GHx# as a prefix 
					// 20230803 was arrHazard.slice(2).map(( 0=hazard 1=IMDRF_Annex_E  2='Generic Hazards'
					let relGenericHazards = allGenericHazards.map((ghNumberText)=>(ghNumberText.split("#").slice(1).join('#').slice(2).trim()));
					



					let refHazard='F'+jResult.functionId+'H'+jResult.harmId;
					if(!jRisks[refHazard])
						jRisks[refHazard]={ 
							'id':num,
							'name':"DomainSpecificHazard", // GH20230701 no MAR but DSH, no number
							'component':jResult.component, // 20230708 20231211
							'function':{ 'id':jResult.functionId, 'name':jResult.Function },

					// 240123 one Harm per DSH
							'harm': jHarm,

					// 20230707 one hazard per DSH
							'hazard': { 'id':refHazard,
											'name': (jResult.component.replace(/ /g,'_')+
													' '+(jResult.Function.split(';')[0]).replace(/ /g,'_')+
													' '+(arrHazard[0]).replace(/ /g,'_'))},
					// 20230714 space to under, connect with spaces

							'genericHazards': relGenericHazards,
							'encodedHazards': allEncodedHazards
							}; 
							
							
						let jMARisk =  jRisks[refHazard];
						if(!jMARisk.managedRisks) jMARisk.managedRisks=[]; 
						let jmanagedRisks=jMARisk.managedRisks;
							
						jmanagedRisks.push(jMAR);

						aLine.unshift(control);
						result.push(aLine);

					} catch(e) { console.log("processLine1 Exception "+e); }
				}

				// 20230708
				else if((lead = arrLine[0]) && lead && lead.length>TITLELEN) {
					try {
						arrLine.shift();
						let arrTitle=lead.split(' ');
						let strNumber=parseFloat(arrTitle[0]);
						
						arrTitle.shift();
						let strComponent=arrTitle.join(' ').trim();

						// no other text , no semicolon
						if(strNumber>0 && arrTitle && arrTitle.length>1 && (strComponent.length>TITLELEN) && (arrLine.join('').length<2)) {
							// needs subsequent empty line
							// TITLE LINE makes Component
							console.log("TITLE ["+strNumber+"]["+strComponent+"]"); 
							jMaster.title = strComponent;
							result.push(["TITLE","<H2>"+strNumber+"&nbsp;"+strComponent+"</H2>",strNumber,strComponent]);
						}
					} catch(e) { console.log("processLine2 Exception "+e); }
			}
		} catch(e) { console.log( "Error in processLine(num="+num+","+JSON.stringify(aLine)+"): "+e); }
	}
}

function makeClaim(jMaster,sFile) {
	let jDevice = { 'id':1, 'name':'DeviceAssurance' };
	let jSafety = { 'id':2, 'name':'Safety', 'file':sFile, manufacturer:"Illuminati", project:"HOROSKOP", version:"VF10" };
	
	
	let ctlProject=document.getElementById('EPROJECT');	
	if(ctlProject) {	
		jSafety.project=ctlProject.value;
		console.log( "read EPROJECT = "+ctlProject.value);
	}
	
	let ctlManufac=document.getElementById('EMANUFAC');
	if(ctlManufac) {	
		jSafety.manufacturer=ctlManufac.value;
		console.log( "read EMANUFAC = "+ctlManufac.value);
	}
	
	let ctlVersion=document.getElementById('EVERSION');
	if(ctlVersion) {	
		jSafety.version=ctlVersion.value;
		console.log( "read EVERSION = "+ctlVersion.value);
	}
	
	let jRisks=jMaster.risks;
	
	
	let justification=[]; 
	for( sFunc in jRisks) {
		justification.push(jRisks[sFunc]);
	}
	jSafety.justification=justification;
	jDevice.justification=jSafety;
	return jDevice;
}


//--------------- SAVE method


function save(jOut) {

  let strOut=JSON.stringify(jOut);
  
  var sFile="risktable.json";
  console.log("saving to file="+sFile);
  console.log(strOut);

  var textFile=null,makeTextFile = function (text) {
    var data = new Blob([text], {type: 'text/plain'});
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }
    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };
  
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  let url=makeTextFile(strOut);
  a.href = url;
  a.download = sFile;
  a.click();
  window.URL.revokeObjectURL(url);
  return textFile;
}


