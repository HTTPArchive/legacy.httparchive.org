/*
Copyright 2010 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/* 
Steps to make your tables sortable:
	- Set the class of your table to "tablesort" (no other classnames allowed)
    - Optional: set the class of TH to "sortnum" for numeric columns
	- Add tablesort.js to your page and call TS.init() when the table is present

You can add tablesort.js asynchronously this way:
	var script = document.createElement('script');
	script.src = "tablesort.js";
	script.onload = function() { TS.init(); };
	document.getElementsByTagName('head')[0].appendChild(script);

*/

var TS = {};
TS.bIE = ( -1 != navigator.userAgent.indexOf("MSIE"));


TS.init = function() {
	var aTables = document.getElementsByTagName('table');
	var len = aTables.length;
	for ( var i = 0; i < len; i++ ) {
		var table = aTables[i];
		if ( TS.isSortable(table) ) {
			TS.tableAddSort(table);
		}
	}
};


TS.tableAddSort = function(table) {
	var thead = TS.getThead(table);
	var aThs = thead.getElementsByTagName('th');
	var len = aThs.length;
	for ( var i = 0; i < len; i++ ) {
		var th = aThs[i];
		if ( ! TS.dontSort(th) ) {
			TS.thAddSort(th);
		}
	}
};


TS.getThead = function(table) {
	var thead = table.getElementsByTagName('thead')[0];
	if ( ! thead ) {
		thead = document.createElement('thead');
		thead.appendChild(table.rows[0]);
		table.insertBefore(thead, table.firstChild);
	}
	thead.onmouseout = function(e) { TS.hideSort(e); };

	return thead;
};


TS.thAddSort = function(th) {
	th.onmouseover = function() { TS.showSort(th); };
};


TS.hideSort = function(event) {
	var tsdivup = document.getElementById('tsdivup');
	var tsdivdn = document.getElementById('tsdivdn');
	if ( tsdivup ) {
		if ( ! event ) {
			event = window.event;
		}
		var target = ( (window.event) ? event.srcElement : event.target );
		if ( 'TH' != target.nodeName ) {
			return;
		}

		// Due to event bubbling, we have to make sure the mouse is actually outside of
		// the TH including the "sortlink"s. See http://www.quirksmode.org/js/events_mouse.html.
		var relTarget = (event.relatedTarget) ? event.relatedTarget : event.toElement;
		while ( target != relTarget && "sortlink" != relTarget.className && "BODY" != relTarget.nodeName ) {
			relTarget = relTarget.parentNode;
		}
		if ( relTarget == target || "sortlink" === relTarget.className ) {
			return;
		}

		// OK - actually hide it now
		tsdivup.style.display = "none";
		tsdivdn.style.display = "none";
	}
};


TS.showSort = function(th) {
	var tsdivup = document.getElementById('tsdivup');
	var tsdivdn = document.getElementById('tsdivdn');
	TS.curTH = th;  // dangerous
	if ( ! tsdivup ) {
		tsdivup = TS.makeTsdiv();
		tsdivup.id = "tsdivup";
		tsdivup.innerHTML = "<a class='sortlink' title='z-a' style='border: 0; outline: 0; text-decoration: none; color: #00F;' href='#sort z-a' onclick='TS.sortCba(); return false;'>" + 
			( TS.bIE ? '<font face="webdings">5</font>' : '&#x25B4;' ) + "</a>";
		document.body.appendChild(tsdivup);
		tsdivup.saveW = tsdivup.clientWidth;
		tsdivup.saveH = tsdivup.clientHeight;

		tsdivdn = TS.makeTsdiv();
		tsdivdn.id = "tsdivdn";
		tsdivdn.innerHTML = "<a class='sortlink' title='a-z' style='border: 0; outline: 0; text-decoration: none; color: #00F;' href='#sort a-z' onclick='TS.sortAbc(); return false;'>" + 
			( TS.bIE ? '<font face="webdings">6</font>' : '&#x25BE;' ) + "</a>";
		document.body.appendChild(tsdivdn);

		// Once we set the display to "none" the client dimensions turn to zero.
		// So we save the client dimensions for left & top calculations below.
		tsdivdn.saveW = tsdivdn.clientWidth;
		tsdivdn.saveH = tsdivdn.clientHeight;
	}

	var aPosition = TS.findPos(th);
	tsdivup.style.left = (aPosition[0]+(th.clientWidth-tsdivup.saveW)) + "px";
	tsdivup.style.top = (aPosition[1]) + "px";
	tsdivup.style.display = "block";

	tsdivdn.style.left = (aPosition[0]+(th.clientWidth-tsdivdn.saveW)) + "px";
	tsdivdn.style.top = (aPosition[1]+(th.clientHeight-tsdivdn.saveH)) + "px";
	tsdivdn.style.display = "block";
};


TS.makeTsdiv = function() {
	var tsdiv = document.createElement('div');
	tsdiv.style.position = "absolute";
	tsdiv.style.backgroundColor = "white";
	tsdiv.style.fontSize = "14pt";
	return tsdiv;
};


TS.sortAbc = function(elem) {
	TS.sort(elem, 0);
};


TS.sortCba = function(elem) {
	TS.sort(elem, 1);
};


TS.sort = function(elem, bCba) {
	// TODO - The cursor doesn't change. Is the loop too tight?
	//document.body.style.cursor = "wait";
	var th = TS.curTH;
	var table = TS.findParentByTagName(th, 'table');
	if ( !table || !th ) {
		return;
	}

	// find the column #
	var aThs = table.getElementsByTagName('th');
	var len = aThs.length;
	var iCol;
	var iTd = 0;
	for ( var i = 0; i < len; i++ ) {
		if ( th == aThs[i] ) {
			iCol = iTd;
			break;
		}
		iTd += aThs[i].colSpan;
	}
	if ( "undefined" === typeof(iCol) ) {
		return;
	}

	TS.sortTable(table, iCol, bCba, th.className);
	//document.body.style.cursor = "";
};


TS.sortTable = function(table, iCol, bCba, sortType) {
	var row_array = [];
	var tbody = table.tBodies[0];
	var rows = tbody.rows;
	var len = rows.length;
	for ( var iRow=0; iRow < len; iRow++) {
		row_array.push( [ TS.getText(rows[iRow].cells[iCol], sortType), rows[iRow] ] );
	}

	row_array.sort(bCba ? TS.sortfuncCba : TS.sortfuncAbc );
	len = row_array.length;
	for ( var iRow=0; iRow < len; iRow++ ) {
		var row = row_array[iRow][1];
		row.className = ( 0 === (iRow % 2) ? "odd" : "even" );
		tbody.appendChild(row);
	}
	delete row_array;
};


TS.getText = function(cell, sortType) {
	var text = ( "undefined" != typeof(cell.textContent) ? cell.textContent :
				 ( "undefined" != typeof(cell.innerText) ? cell.innerText :
				   ( "undefined" != typeof(cell.text) ? cell.text : cell.innerHTML ) ) );

	if ( "sortnum" === sortType ) {
		text = parseInt(text);
	}

	return text;
};


TS.sortfuncAbc = function(a, b) {
	if ( a[0] == b[0] ) {
		return 0;
	}
	if ( a[0] < b[0] ) {
		return -1;
	}

	return 1;
};


TS.sortfuncCba = function(a, b) {
	return ( TS.sortfuncAbc(a, b) * (-1) );
};


TS.findParentByTagName = function(elem, tagname) {
	tagname = tagname.toLowerCase();
	while ( elem.parentNode ) {
		if ( tagname === elem.parentNode.tagName.toLowerCase() ) {
			return elem.parentNode;
		}
		elem = elem.parentNode;
	}

	return undefined;
};

TS.isSortable = function(th) {
	return ( "tablesort" === th.className );
};


TS.dontSort = function(th) {
	return ( "notablesort" === th.className );
};


// from http://www.quirksmode.org/js/findpos.html
TS.findPos = function(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return [curleft,curtop];
};


