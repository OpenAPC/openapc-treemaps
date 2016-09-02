var OSDE = OSDE ? OSDE : {};

OSDE.categoryColors = [
    "#CF3D1E", "#F15623", "#F68B1F", "#FFC60B", "#DFCE21",
    "#BCD631", "#95C93D", "#48B85C", "#00833D", "#00B48D", 
    "#60C4B1", "#27C4F4", "#478DCB", "#3E67B1", "#4251A3", "#59449B", 
    "#6E3F7C", "#6A246D", "#8A4873", "#EB0080", "#EF58A0", "#C05A89"
    ];
    
OSDE.drilldownLabels = {
    "journal_full_title": "Journals",
    "institution": "Institutions",
    "publisher": "Publishers",
    "doi": "Articles"
}

/*
 * Map an entity name to a color by interpreting the last 24 bit
 * of its MD5 hash as an RGB value.
 */
OSDE.labelToColor = function(args) {
    var hash = md5(args);
    hash = hash.slice(26);
    hash = "#" + hash;
    return hash;
}

/*
 * Abbreviate long labels.
 */ 
OSDE.abbreviateLabel = function(label) {
    // do not abbreviate shorter strings or single words
    if (label.length > 25 && label.indexOf(" ") != -1) {
        var words = label.split(" ");
        var lastWord = words.slice(-1)[0];
        // if the last word is in braces, simply return it
        if (lastWord.slice(0, 1) == "(" && lastWord.slice(-1) == ")") {
            return lastWord.slice(1, -1);
        }
        //Shorten the label by abbreviating longer words, longest first
        var index_longest = 0;
        var length_longest = 0;
        while(label.length > 25 && index_longest != -1) {
            index_longest = -1;
            length_longest = 0;
            for (var i in words) {
                if (words[i].length > 3 && words[i].length > length_longest) {
                    index_longest = i;
                    length_longest = words[i].length;
                }
            }
            if (index_longest > -1) {
                words[index_longest] = words[index_longest][0] + ".";
                label = words.join(" ");
            }
        } 
    }
    return label;
}

OSDE.parseArgs = function(args) {
	var queryString = {};
	args.split("&").forEach(function (pair) {
    	if (pair === "") return;
    	var parts = pair.split("=");
    	queryString[parts[0]] = parts[1] &&
        	decodeURIComponent(parts[1].replace(/\+/g, " "));
	});
	return queryString;
};

OSDE.mergeArgs = function(args) {
	var queryString = '';
	var query = $.map(args, function(v, k) {
		return encodeURIComponent(k) + '=' + encodeURIComponent(v);
	});
	return query.join('&');
};

OSDE.format_value = function(num, aggregate_function) {
    if (["sum", "avg"].indexOf(aggregate_function) > -1) {
        return accounting.formatMoney(num, "€", 0, ".");
    }
    return num;
}
