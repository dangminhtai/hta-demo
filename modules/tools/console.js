
/**
 * MODULE: COMMAND CENTER (CONSOLE EMULATOR)
 * Version: 3.0 - Stable Unique File Strategy
 * Fix: Permission Denied & Script Errors
 */

var currentCmdTimer = null;
var currentLogFile = "";
var lastReadPos = 0;

// --- CORE HANDLERS ---

function handleTermInput(e) {
    if (e.keyCode === 13) { // Enter key
        var input = document.getElementById("term-input");
        var cmd = input.value.trim();
        if (cmd === "") return;

        // In lệnh vừa gõ
        printToConsole("C:\\Hyper\\Admin> " + cmd, "#fff");
        input.value = "";
        
        // Cuộn xuống cuối
        var output = document.getElementById("term-output");
        output.scrollTop = output.scrollHeight;

        processCommand(cmd);
    }
}

function printToConsole(text, color) {
    var output = document.getElementById("term-output");
    if (!output) return;
    
    var div = document.createElement("div");
    // Xử lý ký tự đặc biệt HTML
    text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    div.innerHTML = text.replace(/\n/g, "<br>");
    if (color) div.style.color = color;
    
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
}

// --- EXECUTION ENGINE ---

function processCommand(cmd) {
    var lowerCmd = cmd.toLowerCase();

    // 1. Internal Commands
    if (lowerCmd === "cls" || lowerCmd === "clear") {
        document.getElementById("term-output").innerHTML = "";
        return;
    }
    if (lowerCmd === "exit") { window.close(); return; }
    if (lowerCmd === "help") {
        printToConsole("HYPER TERMINAL V3.0", "#e14eca");
        printToConsole(" - cls: Clear screen");
        printToConsole(" - ipconfig / ping / dir: System commands");
        return;
    }

    // 2. Prepare for External Command
    // Stop any previous running listener
    if (currentCmdTimer) {
        clearInterval(currentCmdTimer);
        cleanupTempFile(currentLogFile);
    }

    // Ensure FSO is ready (Lazy Check)
    if (!fso) {
        try {
            fso = new ActiveXObject("Scripting.FileSystemObject");
        } catch(e) {
            printToConsole("FATAL: ActiveX FileSystemObject not supported.", "red");
            return;
        }
    }

    // 3. Generate Unique File Path (Key Fix for Permission Denied)
    // Mỗi lệnh chạy 1 file riêng -> Không bao giờ bị lock bởi process cũ
    try {
        var tempFolder = fso.GetSpecialFolder(2); // 2 = Temp
        var uniqueID = new Date().getTime();
        currentLogFile = fso.BuildPath(tempFolder, "hterm_" + uniqueID + ".log");
    } catch(e) {
        printToConsole("Error creating temp path: " + e.message, "red");
        return;
    }

    lastReadPos = 0;
    printToConsole("Executing...", "#555");

    // 4. Build Command String
    // cmd /c "command > unique_file 2>&1 & echo [END] >> unique_file"
    // Sử dụng > để tạo mới file, không cần CreateTextFile trước
    var cmdStr = 'cmd.exe /c "' + cmd + ' > "' + currentLogFile + '" 2>&1 & echo [HYPER_END] >> "' + currentLogFile + '" "';
    
    try {
        if(!shell) shell = new ActiveXObject("WScript.Shell");
        shell.Run(cmdStr, 0, false); // 0 = Hide, False = Async
        
        // Start Polling Output
        currentCmdTimer = setInterval(function() { readLogStream(); }, 100);
        
    } catch(e) {
        printToConsole("Shell Execution Error: " + e.message, "red");
    }
}

function readLogStream() {
    if (!fso || !currentLogFile) return;
    if (!fso.FileExists(currentLogFile)) return; // Wait for file creation

    try {
        // Open for Reading (1), Allow Shared Access
        var file = fso.OpenTextFile(currentLogFile, 1, false);
        
        // Read all content
        var allText = "";
        if (!file.AtEndOfStream) allText = file.ReadAll();
        file.Close();

        // Get new content only
        if (allText.length > lastReadPos) {
            var chunk = allText.substring(lastReadPos);
            lastReadPos = allText.length;

            // Check termination signal
            if (chunk.indexOf("[HYPER_END]") !== -1) {
                chunk = chunk.replace("[HYPER_END]", ""); // Remove signal
                if (chunk.trim().length > 0) printToConsole(chunk, "#00f2c3");
                
                // Stop and Cleanup
                clearInterval(currentCmdTimer);
                currentCmdTimer = null;
                
                // Delay delete slightly to ensure handle is released
                setTimeout(function() { cleanupTempFile(currentLogFile); }, 500);
                
                printToConsole("", "transparent"); // spacer
            } else {
                printToConsole(chunk, "#00f2c3");
            }
        }
    } catch(e) {
        // File might be locked by CMD writing to it briefly, ignore and retry next tick
    }
}

function cleanupTempFile(path) {
    try {
        if (fso && fso.FileExists(path)) {
            fso.DeleteFile(path, true);
        }
    } catch(e) { /* Ignore cleanup errors */ }
}

// Helper for other modules calling console
function runConsoleCmd(cmd) {
    switchTab("terminal");
    setTimeout(function(){
        var input = document.getElementById("term-input");
        if(input) {
            input.value = cmd;
            printToConsole("C:\\Hyper\\Admin> " + cmd, "#aaa");
            processCommand(cmd);
            input.value = "";
        }
    }, 300);
}
