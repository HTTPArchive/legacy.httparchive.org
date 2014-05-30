function avgDomDepth() {
	var aElems = document.getElementsByTagName('*');
	var i = aElems.length;
	var totalParents = 0;
	while ( i-- ) {
		totalParents += numParents(aElems[i]);
	}
	var average = totalParents/aElems.length;
	return average;
}

function numParents(elem) {
	var n = 0;
	if ( elem.parentNode ) {
		while ( elem = elem.parentNode) {
			n++;
		}
	}
	return n;
}

return Math.round(avgDomDepth());