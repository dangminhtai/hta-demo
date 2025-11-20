
/**
 * UI: INTERFACE LOGIC
 * Quản lý Tabs, Clock, Logging.
 */

function switchTab(tabId) {
    // 1. Update Nav State
    var navs = ["dashboard", "terminal", "network", "processes", "specs", "power"];
    var nID_map = {
        "dashboard": "dash",
        "terminal": "term",
        "network": "net",
        "processes": "proc",
        "specs": "specs",
        "power": "power"
    };

    for(var i=0; i<navs.length; i++) {
        var nID = nID_map[navs[i]];
        var navEl = document.getElementById("nav-" + nID);
        if(navEl) navEl.className = "nav-item"; // reset
        
        var viewEl = document.getElementById("view-" + navs[i]);
        if(viewEl) viewEl.className = "view-section"; // hide
    }

    // 2. Activate selected
    var activeNID = nID_map[tabId];
    var activeNav = document.getElementById("nav-" + activeNID);
    if(activeNav) activeNav.className = "nav-item active";

    var activeView = document.getElementById("view-" + tabId);
    if(activeView) activeView.className = "view-section active";

    // 3. Update Title
    var titles = {
        "dashboard": "System Overview",
        "terminal": "Command Center",
        "network": "Network Toolkit",
        "processes": "Task Manager Pro",
        "specs": "Hardware Analysis",
        "power": "Power Tools (Admin)"
    };
    document.getElementById("page-title").innerText = titles[tabId] || "Hyper Admin";

    // 4. Trigger Lazy Load & Focus
    if(tabId === "processes" && typeof loadProcessList === 'function') setTimeout(loadProcessList, 100);
    if(tabId === "specs" && typeof getDeepSpecs === 'function') setTimeout(getDeepSpecs, 100);
    if(tabId === "network" && typeof getNetworkInfo === 'function') setTimeout(getNetworkInfo, 100);
    if(tabId === "power") {
        if(typeof loadStartupApps === 'function') setTimeout(loadStartupApps, 100);
        if(typeof loadServices === 'function') setTimeout(loadServices, 100);
        if(typeof refreshLimiterTable === 'function') setTimeout(refreshLimiterTable, 100);
    }
    if(tabId === "terminal") {
        setTimeout(function() {
            var input = document.getElementById("term-input");
            if(input) input.focus();
        }, 200);
    }
}

function startClock() {
    setInterval(function() {
        var now = new Date();
        var h = now.getHours(); var m = now.getMinutes(); var s = now.getSeconds();
        h = h < 10 ? "0" + h : h;
        m = m < 10 ? "0" + m : m;
        s = s < 10 ? "0" + s : s;
        var el = document.getElementById("clock-display");
        if(el) el.innerText = h + ":" + m + ":" + s;
    }, 1000);
}

function logSystem(type, msg) {
    var consoleDiv = document.getElementById("console-wrapper");
    if (!consoleDiv) return;
    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-GB');
    var html = "<div class='log-line'>" +
               "<span class='log-time'>" + timeStr + "</span>" +
               "<span class='log-action'>[" + type + "]</span> " +
               "<span class='log-msg'>" + msg + "</span></div>";
    consoleDiv.innerHTML = html + consoleDiv.innerHTML;
}
