
/**
 * TOOLS: ADMIN PRIVILEGES
 * God Mode, Registry Tweaks, Voice Core.
 */

function openGodMode() {
    try {
        // GUID for God Mode
        shell.Run("explorer.exe shell:::{ED7BA470-8E54-465E-825C-99712043E01C}");
        if(typeof logSystem === 'function') logSystem("ADMIN", "Opened God Mode");
        if(typeof writeLog === 'function') writeLog("ADMIN", "User accessed God Mode");
    } catch(e) {
        alert("Failed: " + e.message);
    }
}

function toggleHiddenFiles() {
    try {
        var regPath = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\Hidden";
        var currentVal = shell.RegRead(regPath);
        var newVal = (currentVal == 1) ? 2 : 1; // 1=Show, 2=Hide
        shell.RegWrite(regPath, newVal, "REG_DWORD");
        
        var status = (newVal == 1) ? "VISIBLE" : "HIDDEN";
        shell.Run("RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters");
        
        if(typeof logSystem === 'function') logSystem("REGISTRY", "Hidden Files: " + status);
        if(typeof writeLog === 'function') writeLog("TWEAK", "Set Hidden Files to " + status);
        
        try {
            var voice = new ActiveXObject("SAPI.SpVoice");
            voice.Speak("Hidden files " + status);
        } catch(e) {}
        
        alert("Success! Press F5 on Desktop to see changes.");
    } catch(e) {
        alert("Registry Error: " + e.message);
    }
}

function systemSpeak() {
    try {
        var voice = new ActiveXObject("SAPI.SpVoice");
        var cpu = document.getElementById("val-cpu").innerText;
        var ram = document.getElementById("val-ram").innerText;
        var text = "System Report. CPU Load is " + cpu + ". Memory usage is " + ram + ".";
        if(typeof logSystem === 'function') logSystem("VOICE", "Speaking...");
        voice.Speak(text);
    } catch(e) {
        alert("Text-to-Speech not supported.");
    }
}
    