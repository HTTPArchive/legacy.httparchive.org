<?php
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
DESCRIPTION: 
Return a JavaScript file that contains code for creating
rotating divs of interesting stats.
*/

require_once("interesting-images.js");
?>


// The DOM element that is created from each snippet.
var gaSnippetElems = new Array();
var curSnippet;

function showSnippet(parentId, bPrev) {
	var parent = document.getElementById(parentId);
	if ( ! parent ) {
		return;
	}

	var iSnippet = Math.floor(gaSnippets.length * Math.random());
	if ( curSnippet ) {
		iSnippet = parseInt(curSnippet.id)
		//fade(curSnippet, true);
		curSnippet.style.display = 'none';
	}

	iSnippet = ( bPrev ? iSnippet-1 : iSnippet+1 );
	if ( iSnippet >= gaSnippets.length ) {
		iSnippet = 0;
	}
	else if ( iSnippet < 0 ) {
		iSnippet = gaSnippets.length - 1;
	}

	var newSnippet = gaSnippetElems[iSnippet];
	if ( "undefined" === typeof(newSnippet) ) {
		newSnippet = document.createElement('div');
		newSnippet.id = iSnippet;
		gaSnippetElems[iSnippet] = newSnippet;
		newSnippet.innerHTML = "<a class=image-link href='interesting.php'>" + gaSnippets[iSnippet] + "</a>";
		var aPosition = findPos(parent);
		newSnippet.style.left = aPosition[0] + "px";
		newSnippet.style.top = aPosition[1] + "px";
		parent.appendChild(newSnippet);
	}
	else {
		newSnippet.style.display = "block";
	}

	curSnippet = newSnippet;
	fade(newSnippet);
}


function insertNav(parentId) {
	var arrow = document.getElementById('leftarrow');
	if ( arrow ) {
		arrow.innerHTML = "<a class='image-link' href='javascript:showSnippet(\"" + parentId + "\", 1)'><img src='images/tri-lft-t-14x28.gif' width=14 height=28 border=0></a>";
	}

	arrow = document.getElementById('rightarrow');
	if ( arrow ) {
		arrow.innerHTML = "<a class='image-link' href='javascript:showSnippet(\"" + parentId + "\")'><img src='images/tri-rt-t-14x28.gif' width=14 height=28 border=0></a>";
	}
}


// opacity is a number 0-100 inclusive
function fade(idOrElem, bOut) {
	var elem = idOrElem;
	if ( "string" === typeof(idOrElem) || "number" === typeof(idOrElem) ) {
		elem = document.getElementById(idOrElem);
	}
	if ( ! elem ) {
		return;
	}

	opacity = ( elem.style.opacity ? parseInt(elem.style.opacity * 100) : ( bOut ? 100 : 0 ) );
	opacity = ( bOut ? opacity - 10 : opacity + 10 );
	opacity = ( 100 < opacity ? 100 : ( 0 > opacity ? 0 : opacity ) );

	elem.style.opacity = opacity/100;
	elem.style.filter = "alpha(opacity = " + opacity + ")";

	if ( (bOut && 0 < opacity ) || ( !bOut && 100 > opacity) ) {
		setTimeout(function() { fade(elem, bOut); }, 50);
	}
	else if ( bOut ) {
		elem.style.display = "none";
	}
}


// from http://www.quirksmode.org/js/findpos.html
function findPos(obj) {
	var curleft = curtop = 0;
	if (obj.offsetParent) {
		do {
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;
		} while (obj = obj.offsetParent);
	}
	return [curleft,curtop];
}


function dprint(msg) {
	if ( "undefined" != typeof(console) ) {
		console.log(msg);
	}
}
