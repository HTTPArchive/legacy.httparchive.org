var perf = ( "undefined" !== typeof( window.performance) ? window.performance : null );
var numMM = 0;
if ( perf && "function" === typeof( perf.mark ) && "function" === typeof( perf.measure ) && "function" === typeof( perf.getEntriesByType) ) {
	numMM = perf.getEntriesByType("mark").length + perf.getEntriesByType("measure").length;
}

return numMM;
