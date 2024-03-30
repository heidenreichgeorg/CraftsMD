
// reads and checks an HTML Exchange File Format as of VDE SPEC 90025
// INPUT: user selects report sections and then the Exchange file (HTML)
// only structures with an id attribute need to be unique

// ALTERNATE FUNCTION:
const LEARN = false;
const CLEAN = false;
const SHOW_RULES_USED = false;

const NBSP = ' '; // U+00a0
function cleanSplit(x) { return x.replace(/\u00a0/g,' ').split(';'); }

const DISPLAY_ERR = 300;

var filename=null;

let report = null;

var showInstances=false;
var showHTMLWalk=false;
var showTreeWalk=false;
var showElements=false;
var showSyntaxError=false;
var showHTMLUsage=false;
var showRDFAUsage=false;

var rdfaUsage={};


const KIMEDS_CORI='riskman:ControlledRisk';
const KIMEDS_DOSH='riskman:DomainSpecificHazard';
const KIMEDS_ID='riskman:id';

function start() {
	report = { 'header':[], 'syntax':[], 'elements':{}, 'inst':[], 'html':[], 'tree':[], 'htmlusage':[], 'rdfausage':[] };

	document.getElementById('filechoice').addEventListener('change', loadAndValidate);
}


function loadAndValidate() {
	if(!report) start();

	
	let ctlHTMLWalk = document.getElementById('htmlwalk');
	if(ctlHTMLWalk) {
		if(ctlHTMLWalk.checked) {
			showHTMLWalk=true;
		}
		console.log('HTML-Walk: '+( showHTMLWalk ? 'SHOW' : 'HIDE' ));
	}

	let ctlTreeWalk = document.getElementById('treewalk');
	if(ctlTreeWalk) {
		if(ctlTreeWalk.checked) {
			showTreeWalk=true;
		}
		console.log('Tree-Walk: '+( showTreeWalk ? 'SHOW' : 'HIDE' ));
	}


	

	
    // INSTANCES OF -  get radio button selection
	let ctlInstances = document.querySelector('input[name="instances"]:checked');
	if(ctlInstances) {
		showInstances=ctlInstances.value;
		console.log('Instances: '+ showInstances);
	} else console.log('Instances: NONE');



	let ctlTable = document.getElementById('elements');
	if(ctlTable) {
		if(ctlTable.checked) {
			showElements=true;
		}
		console.log('Table: '+( showElements ? 'SHOW' : 'HIDE' ));
	}


	let ctlSyntaxErr = document.getElementById('syntaxerr');
	if(ctlSyntaxErr ) {
		if( ctlSyntaxErr.checked) {
			showSyntaxError=true;
		}
		console.log('Syntax Errors: '+( showSyntaxError ? 'SHOW' : 'HIDE' ));
	}


	let ctlHTMLUsage = document.getElementById('htmlusage');
	if(ctlHTMLUsage ) { 
		if( ctlHTMLUsage.checked) {
			showHTMLUsage=true;
		}
		console.log('HTML Rule Usage: '+( showHTMLUsage ? 'SHOW' : 'HIDE' ));
	}


	let ctlRDFAUsage = document.getElementById('rdfausage');
	if(ctlRDFAUsage ) { 
		if( ctlRDFAUsage.checked) {
			showRDFAUsage=true;
		}
		console.log('RDFA Concept Usage: '+( showRDFAUsage ? 'SHOW' : 'HIDE' ));
	}


	function exam(name,node) {
		if(!node) { 
			console.log(name+'=>__'); 
		} else {
			let arrTop = node.cMDElements;
			console.log('EXAM '+name+'=> '+JSON.stringify(arrTop.map((x)=>(x.cMDElements))))
		}
	}

	var fr = new FileReader();
	fr.onload = function (ev2,file) {

		start();
		let aLines = this.result.split('\n');
		let jQueue = processLines(aLines);


		exam('FILE ',jQueue);

		exam('FILE-0 ',jQueue.cMDElements[0]);
		exam('FILE-1 ',jQueue.cMDElements[1]);
		exam('FILE-2 ',jQueue.cMDElements[2]);
		exam('FILE-3 ',jQueue.cMDElements[3]);
		exam('FILE-4 ',jQueue.cMDElements[4]);
		exam('FILE-5 ',jQueue.cMDElements[5]);

		// derivation of full tree along grammar 
		// produces report
		// let top = get(jQueue,'OBJECT');

		console.dir(JSON.stringify(jQueue));

		let top = locAll(jQueue,'DIV')[0];
		exam('TOP ',top);
		

		exam('TOP-0 ',top.cMDElements[0]);
		exam('TOP-1 ',top.cMDElements[1]);
		exam('TOP-2 ',top.cMDElements[2]);
		exam('TOP-3 ',top.cMDElements[3]);
		exam('TOP-4 ',top.cMDElements[4]);
		

		let device = top;

		let risktable = locAll(top,'DIV')[0];
		console.log('DRF device '+JSON.stringify(device));
		console.log('DRF risk table '+JSON.stringify(Object.keys(risktable)));
		
		derive(risktable,'RISKMANAGEMENT',{'children':{}},'FILE','ROOT');


		// convert object back to HTML
		let hNode = makeHTML(jQueue,'','ROOT',null,null);
		// side-effect of this is the rule usage information


		// show html rule usage count
		if(showHTMLUsage) {
			let usage = Object.keys(htmlGrammar).map((left)=>(htmlGrammar[left].map((rule)=>(left+'=>'+rule.symbol+'#'+rule.count))));
			usage.forEach((symbolUsage)=>{report.htmlusage.push(JSON.stringify(symbolUsage))});
		}

		// show RDF/A concept usage 
		if(showRDFAUsage) {
			var lead='{';
			Object.keys(rdfaUsage).forEach(concept=>{report.rdfausage.push(lead+"'"+concept+"':"+JSON.stringify(rdfaUsage[concept]));lead=','});
			report.rdfausage.push('}');
		}


		let tableNames = Object.keys(report.elements);
		let strElements = tableNames.map((table)=>(table+':'+JSON.stringify(report.elements[table]))).join('\n');

		let aCollection=null;
		let strInstances='';
		let jInstances=null;
		if(showInstances) {
			strInstances='{ "type":"'+showInstances+'" '+report.inst.join(' ')+'}\n';
			try { 
				jInstances=JSON.parse(strInstances); 


				aCollection=[];
				Object.keys(jInstances).forEach((key)=>{
					if(key.startsWith('RIT')) {

						let jCOR = jInstances[key]; 
						let strCOR=jCOR?jCOR.title:"HazSit";

						let jAREL = jCOR?jCOR['riskman:hasAnalyzedRisk']:null;
						//let strAREL=jAREL?jAREL.title:"ARel?";

						let jARIS = jAREL?jAREL['riskman:AnalyzedRisk']:null;
						let strARIS=jAREL?jAREL.title:"ARisk?";

						let jARID = jARIS?jARIS['riskman:id']:null;
						let strARID=jARID?jARID.title:"Id?";

						let jHarm=jARID?jARID['riskman:hasHarm']:"H";
						let strHarm=jHarm?jHarm.cMDNodeValue:"Harm?";

						let jHASDOSH=jARID?jARID['riskman:hasDomainSpecificHazard']:null;
						//let strHASDOSH=jHASDOSH?jHASDOSH.title:"H";

						Object.keys(jHASDOSH).forEach((doshKey)=>{
							
							if(doshKey.startsWith(key)) {
								let jDOSH=jHASDOSH[doshKey];

								let jCOMP=jDOSH['riskman:hasDeviceComponent'];
								let strComp=jCOMP?jCOMP.cMDNodeValue:"Comp?";

								let jFUNC=jDOSH['riskman:hasDeviceFunction'];
								let strFunc=jFUNC?jFUNC.cMDNodeValue:"Func?";

								let jHAZD=jDOSH['riskman:hasHazard'];
								let strHazd=jHAZD?jHAZD.cMDNodeValue:"Func?";

								aCollection.push('{ "func":"'+strFunc+'", "comp":"'+strComp+'",  "hazard":"'+strHazd+'", "hazardousSituation":"'+strCOR+'", "harm":"'+strHarm+'", "ControlledRisk":"'+key+'", "'+strARIS+'":"'+strARID+'"}');
							}
						})
					}
				})
/*
// shall produce
F#-Function-H#-Harm    *-C#--Cause---Target---Risk
			---AETE    *--HazSit
			---GenericH*-HazKey
			---Hazards *-AETA
			---AETC    *
*/			
}
			catch(err) { console.dir(err); console.log(strInstances); }
		}

		// save the report file
		let summary=(
			report.header.join('\n')+'\n'
			+(showHTMLWalk ?    '********** HTML-Walk *****************\n'+report.html.join('\n'):'')+'\n'
			+(showTreeWalk ?    '********** RDFa-Walk *****************\n'+report.tree.join('\n'):'')+'\n'
			+(jInstances ? JSON.stringify(jInstances) : strInstances)+'\n\n'
			+(aCollection ?    '********** Instances of ('+showInstances+') *****************\n{\n'+aCollection.join('\n')+"\n}\n":'')+'\n\n'
			+(showElements ?    '********** Elements *********************\n'+strElements+'\n':'')+'\n'
			+(showSyntaxError ? '********** Syntax ********************\n'+report.syntax.join('\n'):'')+'\n'
			+(showHTMLUsage ?   '********** HTML Rules *********************\n'+report.htmlusage.join('\n'):'')+'\n'
			+(showRDFAUsage ?   '********** RDF/A Concepts *********************\n'+report.rdfausage.join('\n'):''));

		if(LEARN) save(JSON.stringify(htmlGrammar),'JSON'); 
		
		else save(summary,'txt');
			
	}

	filename=this.files[0].name;
	report.header.push('reading from file='+filename);
	console.log('reading from '+filename);
	document.getElementById('fileButton').innerHTML=filename;
	fr.readAsText(this.files[0]);

}

//***************************************************************************************** */



function save(strOut,ext) {

	var sFile='rebuiltFile.'+ext;
	console.log('saving file='+sFile);
	//console.log(strOut);
  
	var textFile=null,makeTextFile = function (text) {
	  var data = new Blob([text], {type: 'text/plain'});
	  if (textFile !== null) {
		window.URL.revokeObjectURL(textFile);
	  }
	  textFile = window.URL.createObjectURL(data);
  
	  // returns a URL you can use as a href
	  return textFile;
	};
	
	var a = document.createElement('a');
	document.body.appendChild(a);
	a.style = 'display: none';
	let url=makeTextFile(strOut);
	a.href = url;
	a.download = sFile;
	a.click();
	window.URL.revokeObjectURL(url);
	return textFile;
  }
  

function processLines(aLines) {


	if(aLines[0].indexOf('DOCTYPE')>0) aLines.shift()
    let nLines=aLines.map((line,number)=>insertLineNumber(line,number));

	let root = buildHTML(nLines.join(''));
	return translate(root);


	function insertLineNumber(line,number) {
		var pos;
		let result='';
		while(line && line.length>0 && (pos=line.indexOf('>'))>=0) {
			result=result+line.substring(0,pos)+' cmdline='+number+'>';
			line=line.substring(pos+1);
		}
		if(line && line.length>0) result=result+line;
		return result;

	}

    // integrate HTML text into DOM
	function buildHTML(html) {
		let tmp = document.createElement('DIV');
		tmp.innerHTML = html;
	 return tmp;
    }

    // convert DOM object into javascript object
	function translate(object) {

		let cMDElements = [];
		let result={ };
		if(object) {

			result.cMDNodeType=object.tagName;

			if(object.tagName=='svg'|| object.tagName=='SVG') return null;

			if(!object.children || object.children.length==0) result.cMDNodeValue=object.innerHTML;

			//console.log('tag '+object.tagName);
			if(object.attributes) {
				let attributes=object.attributes;
				for (let a = 0; a < attributes.length; a++) {
				  result[attributes[a].name]=attributes[a].value;
				}
			}
			if(object.children) {
				let cList=object.children;
				let cLen=cList.length;
				
				for(let i=0;i<cLen;i++) {
					let child=cList[i];
					
					cMDElements.push(translate(child));
				}
			}			
		}
		result.cMDElements=cMDElements;
		return result;
	}
}


//--------------- VALIDATE SYNTAX methods



function findValue(table,value) {
	let result=[];
	Object.keys(table).forEach((key)=>{
		if(table[key].value==value) result.push(key); 
		/*console.log('findValue '+table[key].value+'??'+value)*/ 
	});
	return result;
}


// ARRAY locAll by tag name
function locAll(jNode,tag) {

	if(!tag || !jNode) return null;

	if(!jNode.cMDElements || jNode.cMDElements.length==0) {
		if(CLEAN)
			report.syntax.push(''+jNode.cmdline+'#locAll('+tag+'):EMPTY? '+(JSON.stringify(jNode)).slice(0,DISPLAY_ERR));
		return null;
	}

	let result = [];
	jNode.cMDElements.forEach((page)=>{ if(page.cMDNodeType==tag) {
				result.push(page);
			}
	});

	if(result && result.length>0)  return result;

    console.log('locAll can not find '+tag+' below '+jNode.cMDNodeType+ ' in '+JSON.stringify(jNode));

	if(CLEAN)
		report.syntax.push(''+jNode.cmdline+'#cannot locAll('+tag+') in '+jNode.cMDNodeType+' : '+(JSON.stringify(jNode)).slice(0,DISPLAY_ERR));
	
	return null;
}



function reportElement(entity, tableName, jElement, constraint) {

	if(entity) entity.cMDElements.forEach((item)=> {
		let pushFlag=false;

		if(item.cMDNodeType=='MD-NAME') {
			jElement.name=item.cMDNodeValue;
			pushFlag=true;
		}

		if(item.cMDNodeType=='MD-LINE') {
			let title=item.title;
			let name=item.cMDNodeValue;
			if(title && title.length>0 && name && name.length>0) {
				jElement[title]=name;
				pushFlag=true;
			}
		}

		if(item.href) {
			jElement.href = item.href;
			pushFlag=true;
		}			
/*
		if(pushFlag) {
			// INJECTIVE-violation: same value is somewhere else in the table 'destiny'
			if(jElement.value && (constraint & INJECTIVE)) {
				let matchList=findValue(destiny,jElement.value);
				if(matchList && matchList.length>0) {
					report.syntax.push('!INJECTIVE '+id+'#'+jElement.value+'  has multiple definitions in '+tableName)
				}
			}

			// FUNCTIONAL violation: There is already an entry for this identifier
			let id=entity.cmdline;
			let target = jElement[id]; 
			if(target) {
				if(constraint & FUNCTIONAL) { report.syntax.push('!FUNCTIONAL '+id+'#  has multiple entries in '+tableName);  } 
				else Object.keys(jElement).forEach((key)=>{target[key]=jElement[key]}) 
			}
			else destiny[id]=jElement;				
		}
*/		
	})
}	


const RELATIONAL = 0;
const FUNCTIONAL = 1;
const INJECTIVE  = 2;









function get(jPage,tag) {
	let found=jPage.cMDNodeType;
	if(found==tag) {
		report.tree.push('0#get('+tag+')');
        console.log('get finds '+found);
		return jPage;
	}
	else {
        console.log('get finds '+found+'instead of '+tag);
        report.syntax.push('0#?get('+tag+')?'); 
    }
	return null; 
}





//--------------- HTML generator method

// line-breaks in scripts missing

function makeHTML(jQueue,strIndent,parentClass,corLine,inDevice) {
	let currentType = jQueue.cMDNodeType;
	if(!currentType) return '.';
	let closingTag=null;


	let t=currentType.toLowerCase();


	let attributes = [];
	Object.keys(jQueue).
		forEach(attr=>{if(attr=='cMDNodeType' || attr=='cMDElements' || attr=='cMDNodeValue'){} else 
			attributes.push(" '"+attr+"'='"+jQueue[attr]+"'")});

	let head = '<'+jQueue.cMDNodeType + attributes.join('');
	


	if(showHTMLWalk && jQueue.cMDElements.length>0) {
		let currentClass = jQueue.class;
		report.html.push(strIndent+strIndent+currentType+':'+currentClass+' -->'+
			jQueue.cMDElements.map((element)=>
				(element && element.cMDNodeType ? (((element.class)?(element.cMDNodeType+':'+element.class):' ')) : '   ')).join(','));
	}


	// 20231124
	let rdfaClass = jQueue.typeof; 
	if(jQueue.property) rdfaClass = jQueue.property; 
	if(parentClass) {


		if(rdfaClass) {

			if(!rdfaUsage[parentClass]) rdfaUsage[parentClass]=[rdfaClass]; else {
				if(!rdfaUsage[parentClass].includes(rdfaClass) && parentClass!=rdfaClass)
					rdfaUsage[parentClass].push(rdfaClass);
			}
			let conceptRule = conceptGrammar[parentClass];
			if(conceptRule) {
				if(conceptRule.includes(rdfaClass)) {


					// inDevice helps skip table headings and footer info
					if(parentClass=='ROOT' && rdfaClass==conceptRule[0]) { parentClass='DEVICE'; inDevice=rdfaClass; }


					console.log('DERIVE '+parentClass+' ---> '+rdfaClass);
					let aParent= parentClass.split(':');
					let aChild= rdfaClass.split(':');
					report.tree.push(strIndent+(aParent.length>1 ? aParent[1] : parentClass)+' ----> '+(aChild.length>1 ? aChild[1] : rdfaClass));

				} 
				else if(rdfaClass!=parentClass) report.syntax.push('DERIVE '+parentClass+' !!! '+rdfaClass+ ': NO CONCEPT RULE.')
			
				parentClass = rdfaClass;
			}
			else  report.syntax.push('DERIVE '+parentClass+'   CONCEPT UNKNOWN.')


			// controlling report.inst
			// inDevice indicates that the DEVICE content is being accessed - rather than any decorative headers or footers
			// corLine indicates that instance extraction is active
			if(inDevice && rdfaClass == showInstances) {			
				corLine=jQueue.cmdline;
			}			
		}


		// extract JSON from original					
		if(corLine) {
			// remove HTML tag and nested structures
			let arrAttributes=[];
			Object.keys(jQueue).forEach((key)=>{if(key!='cMDNodeType' && key!='cMDElements') arrAttributes.push('"'+key+'":"'+jQueue[key]+'"')});

			

			// write to report.inst
			let nodeType=jQueue.id; // only structures with an id need to be unique
			if(!nodeType || nodeType.length==0) { nodeType=jQueue.property;  }
			if(!nodeType || nodeType.length==0) { nodeType=jQueue.typeof;  }
			if(!nodeType || nodeType.length==0) { nodeType=jQueue.title;  }
			if(!nodeType || nodeType.length==0) { nodeType="has";  }
			report.inst.push(strIndent+',"'+nodeType+'":{'+arrAttributes.join(','));
			closingTag='}';
		}		
	}


	// without elements && no inner value -> short form
	let result = head + ' />'; 	

	if(jQueue.cMDElements && jQueue.cMDElements.length>0)  {

		// with inner value -> no elements
		if(jQueue.cMDNodeValue && jQueue.cMDNodeValue.length>0) return head+ ' >' + jQueue.cMDNodeValue + '</' + jQueue.cMDNodeType + '>';


		// elements and no inner value: recursion
		// smart grammar defines rules for each current node on what might follow as a sub-node
		let elements = jQueue.cMDElements;
		
		result =  head + ' >' + elements.map((e,i)=>(checkSyntax(jQueue, t ,e.cMDNodeType,parentClass) ? 
			makeHTML(e,
					strIndent+"  ",
					parentClass,
					corLine,
					inDevice) 
			: ( currentType +'->'+e.cMDNodeType+'?')
		)).join('') + '\n</' + jQueue.cMDNodeType + '>';

	}
	if(closingTag) report.inst.push(strIndent+closingTag);
	return result;
}


function checkSyntax(jNode,currentType,son,rdfaClass) {
	
	if(!son) return true; // temporary 
	let curr = currentType.toLowerCase();	
	let desc = son.toLowerCase();


	// ignore genuine HTML
	if( desc=='a' || desc=='b' || desc=='div' || desc=='html' || desc=='meta' || desc=='p' || desc=='script' || desc=='title' || desc=='h5'
	 || desc=='style'|| desc=='input' || desc=='label' || desc=='select'|| desc=='option' || desc=='button'|| desc=='span' ) return true;
	   
	// ignore md-name tag
	if(desc=='md-name') return true;


	if(!htmlGrammar[curr]) {				
		report.syntax.push(''+jNode.cmdline+'#UNKNOWN('+curr+')=>'+desc+' syntax  [htmlGrammar]');
		return false;
	}
	

	let arrRules = htmlGrammar[curr]
	let allKeys = arrRules.map((rule)=>rule.symbol);
	if(allKeys.indexOf(desc)>=0) {

		let match = findRule(curr,desc,rdfaClass);
		if(!match || match.length==0) {
			
			if(LEARN) {
				htmlGrammar[curr].push({'void':desc});
				return true;
			}
			report.syntax.push(''+jNode.cmdline+'#checkSyntax '+curr+' !! '+desc+'/'+rdfaClass+' NO MATCH IN RULE');	
			return false;
		}
		return true;
		
	} else report.syntax.push(''+jNode.cmdline+'/'+rdfaClass+'#checkSyntax '+curr+' ! '+desc+' NO RULE ['+allKeys+'] '+JSON.stringify(jNode).slice(0,DISPLAY_ERR));	
	
	return false;
}



function findRule(curr,desc,rdfaClass) {
	let entry = htmlGrammar[curr];

    if(!entry) {
		console.log('Could not find htmlGrammar for '+curr+'.'+desc+'/'+rdfaClass);
		return null;
	}

	let match = entry.filter((right)=>{ return (desc && right && right.symbol && (desc==right.symbol) 
   //    && findProperty(rdfaClass,right) 
    )});

    if(SHOW_RULES_USED) console.log('FIND RULE '+desc+'/'+rdfaClass+'==>'+JSON.stringify(match));
	if(match && match.length>0) match[0].count = match[0].count+1;
	return match;
}


function findProperty(rdfaClass,right) {
	return  (!(right.property) || (prop && (rdfaClass.toLowerCase()==right.property.toLowerCase())))
}





function derive(jRoot,strId,jElement,title) {
	if(jRoot) {
		// symbols in uppercase
		// assume multiplicity always *
		let strLeftSymbol = jRoot.cMDNodeType;
        console.log('derive from '+strLeftSymbol);

		// determine applicable derivations rule
		let arrRightHand = htmlGrammar[strLeftSymbol.toLowerCase()];			
		if(arrRightHand && arrRightHand.length>0) {


			arrRightHand.forEach((rule)=>{ 
				strRightSymbol=rule.symbol.toUpperCase();
				let occurs=rule.occurs;				
				let embedding = locAll(jRoot,strRightSymbol);
				if(embedding || occurs=='?' || occurs=='*') {

					if(embedding) {
						// assume multiplicity always *
						embedding.forEach((match)=>{

							console.log('derive('+strLeftSymbol+') embedded to '+JSON.stringify(embedding[0]).substring(0,DISPLAY_ERR));

							let localTitle=title;
							let localId=strId;
							let localElement=jElement;

							if(match.title) {
								localTitle=match.title;
							} else {
								if(match.cMDNodeValue) localTitle=match.cMDNodeValue; 
								else if(match.cMDElements[0]) {
									let eldest=match.cMDElements[0];
									localTitle=eldest.cMDNodeValue;
								}
							}

							if(match.id) {
								localId=match.id;

								// GH20231026
								if(!(report.elements[localId])) report.elements[localId]={'id': localId, 'children':{}};
								jElement.children[localId]=localTitle;
								localElement = report.elements[localId];
							}

								
							reportElement( match, localId, localElement, INJECTIVE+FUNCTIONAL);
							derive(match, localId, localElement, localTitle);

						});
					}

				} else {
					if(rule.use && (rule.use=='1' || rule.use=='+')) {
						report.syntax.push(strLeftSymbol+' does not contain '+rule.symbol.toUpperCase()+ ' in '+JSON.stringify(jRoot).substring(0,DISPLAY_ERR));
					}
				}
			}); 

		} // else console.log('derived TERMINAL '+strLeftSymbol);

	} else console.log('derive?? no jRoot');
}



// symbol = right side, index in sequence of right side, count = usage count in a given device file 
const htmlGrammar = {
	'div':[{'symbol':'object','count':0,'index':0},{'symbol':'br','count':0,'index':1},{'symbol':'div','count':0,'index':1}],
	'br':[]
}


// NOTATION-1  upperNode:[derivedNode1,...,derivedNodeN]
// NOTATION-2  rule[0][0] = DEVICE's top node !!
const conceptGrammar = 
{'ROOT':['riskman:ControlledRisk','riskman:hasAnalyzedRisk','riskman:ControlledRisk','riskman:hasDeviceComponent','riskman:hasDeviceFunction','riskman:hasHarm']
 ,'DEVICE':['riskman:ControlledRisk']
 ,'riskman:hasAnalyzedRisk':['riskman:AnalyzedRisk','riskman:hasSDA','riskman:hasResidualRiskLevel']
 ,'riskman:AnalyzedRisk':['riskman:id']
 ,'riskman:id':['riskman:hasDomainSpecificHazard','riskman:hasTarget','riskman:hasHazardousSituation','riskman:hasHarm','riskman:hasInitialRiskLevel']
 ,'riskman:hasDomainSpecificHazard':['riskman:DomainSpecificHazard']
 ,'riskman:DomainSpecificHazard':['riskman:id','riskman:hasDeviceComponent','riskman:hasDeviceFunction','riskman:hasHazard']
 ,'riskman:hasTarget':['riskman:Target']
 ,'riskman:hasInitialRiskLevel':['riskman:RiskLevel']
 ,'riskman:RiskLevel':['riskman:severity','riskman:probability']
 ,'riskman:RiskSDA':['riskman:problem','riskman:goal','riskman:cause','riskman:hasSubSDA','riskman:hasImplementationManifest']
 ,'riskman:hasSubSDA':['riskman:SDA']
 ,'riskman:hasImplementationManifest':['riskman:ImplementationManifest']
 ,'riskman:ResidualRiskLevel':['riskman:severity','riskman:probability']
 ,'riskman:ControlledRisk':['riskman:hasAnalyzedRisk','riskman:hasSDA','riskman:hasResidualRiskLevel']
 ,'riskman:SDA':['riskman:id']
 ,'riskman:ImplementationManifest':['riskman:external','riskman:proof']
 ,'riskman:ControlledRisk':['riskman:hasAnalyzedRisk','riskman:hasSDA','riskman:hasResidualRiskLevel']
 ,'riskman:ImplementationManifest':['riskman:external','riskman:proof']
 ,'riskman:Target':[]
 ,'riskman:hasSDA':['riskman:RiskSDA','riskman:problem','riskman:goal','riskman:cause','riskman:hasSubSDA','riskman:SDA','riskman:hasImplementationManifest','riskman:ImplementationManifest','riskman:id','riskman:external','riskman:proof']
 ,'riskman:hasResidualRiskLevel':['riskman:ResidualRiskLevel','riskman:severity','riskman:probability']
 ,'riskman:external':[]
 ,'riskman:problem':[]
 ,'riskman:goal':[]
 ,'riskman:cause':[]
 ,'riskman:probability':[]
 ,'riskman:severity':[]
 ,'riskman:id':['riskman:hasDomainSpecificHazard','riskman:DomainSpecificHazard','riskman:hasDeviceComponent','riskman:hasDeviceFunction','riskman:hasHazard','riskman:hasTarget','riskman:Target','riskman:hasHazardousSituation','riskman:hasHarm','riskman:hasInitialRiskLevel','riskman:RiskLevel','riskman:severity','riskman:probability']
}

