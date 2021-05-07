// Convert dates

// dow returns the name of the day: "mon".."sun"
Date.prototype.dow = function() {
    let dd = ["sun","mon","tue","wed","thu","fri","sat"];
    return dd[this.getDay()] || "???";
}

// dom returns a day of the month: "1st".."31st"
Date.prototype.dom = function() {
    let d = this.getDate();
    switch (d) {
    case 1: return "1st";
    case 2: return "2nd";
    case 21: return "21st";
    case 22: return "22nd";
    case 31: return "31st";
    default: return ""+d+"th";
    }
}

