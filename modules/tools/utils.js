
/**
 * TOOLS: BASIC UTILITIES
 * Ping mạng, Dọn dẹp file rác.
 */

function runCmd(cmd, alias) {
    try {
        if (!shell) return;
        shell.Run(cmd);
        if(typeof writeLog === 'function') writeLog("EXECUTE", "Launched: " + alias);
        if(typeof logSystem === 'function') logSystem("EXEC", "Run: " + alias);
    } catch (e) {}
}

function cleanJunk() {
    if(!confirm("Delete temp files in %TEMP%?")) return;
    if(typeof logSystem === 'function') logSystem("CLEANER", "Cleaning...");
    
    setTimeout(function(){
        try {
            var tempPath = shell.ExpandEnvironmentStrings("%TEMP%");
            var folder = fso.GetFolder(tempPath);
            var files = new Enumerator(folder.Files);
            var count = 0;

            for (; !files.atEnd(); files.moveNext()) {
                try { files.item().Delete(true); count++; } catch(ignore) {}
            }
            
            var msg = "Deleted " + count + " files.";
            if(typeof logSystem === 'function') logSystem("SUCCESS", msg);
            if(typeof writeLog === 'function') writeLog("CLEANER", msg);
            alert(msg);
        } catch(e) {
            alert("Error: " + e.message);
        }
    }, 200);
}

function pingTest() {
    if(typeof logSystem === 'function') logSystem("NET", "Pinging 8.8.8.8...");
    setTimeout(function() {
        try {
            var returnCode = shell.Run("cmd /c ping -n 1 8.8.8.8", 0, true);
            if (returnCode === 0) {
                if(typeof logSystem === 'function') logSystem("SUCCESS", "Internet Connected.");
                alert("Connection OK!");
            } else {
                if(typeof logSystem === 'function') logSystem("ERROR", "No Internet.");
                alert("No Connection!");
            }
        } catch(e) {}
    }, 100);
}

function openDbFolder() {
    try {
        // DB_PATH global var from database.js
        if (typeof DB_PATH !== 'undefined' && DB_PATH) {
            shell.Run('explorer.exe "' + DB_PATH + '"');
        } else {
            alert("Database path not found.");
        }
    } catch(e) {}
}
    