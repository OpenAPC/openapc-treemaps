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
    "doi": "Articles",
    "cost_type": "Cost Data"
}

OSDE.costTypeColors = {
    // publications
    "APC": "#a0cb59",
    "Equivalent APC": "#59b2cb",
    "colour charge": "#ffa500",
    "cover charge": "#ff0000",
    "other": "#ee00ee",
    "page charge": "#2f4f4f",
    "permission": "#006400",
    "payment fee": "#0000ff",
    "reprint": "#ffff00",
    "submission fee": "#00ffff",
    // contracts
    "publish and read": "#fac400",
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

OSDE.mergeArgs = function(args) {
    var query = $.map(args, function(v, k) {
        v = v.join(";");
        return encodeURIComponent(k) + '=' + encodeURIComponent(v);
    });
    return query.join('&');
};

OSDE.format_value = function(num, format) {
    if (format == "monetary") {
        if (num === null) {
            return "NA";
        }
        else {
            return accounting.formatMoney(num, "€", 0, ".");
        }
    }
    if (format == "percentage") {
        var percentage = (num * 100).toFixed(2) + '%';
        return percentage;
    }
    return num;
}
