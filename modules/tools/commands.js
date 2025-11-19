
/**
 * MODULE: TOOLS & COMMANDS
 * Chứa các lệnh thực thi CMD và tiện ích hệ thống cấp cao.
 */

function runCmd(cmd, alias) {
    try {
        if (!shell) {
            logSystem("ERROR", "Shell not active.");
            return;
        }
        shell.Run(cmd);
        writeLog("EXECUTE", "Launched tool: " + alias);
        logSystem("EXEC", "Run: " + alias);
    } catch (e) {
        logSystem("ERROR", "Run failed: " + e.message);
    }
}

// --- HIGH PRIVILEGE FUNCTIONS ---

/**
 * Tính năng: God Mode (Master Control Panel)
 * Lợi dụng GUID đặc biệt của Windows để mở folder chứa toàn bộ setting.
 */
function openGodMode() {
    try {
        // Tạo thư mục GodMode tạm thời nếu chưa có (hoặc chỉ cần mở thông qua GUID)
        // Cách an toàn nhất trên HTA là mở trực tiếp shell
        shell.Run("explorer.exe shell:::{ED7BA470-8E54-465E-825C-99712043E01C}");
        logSystem("ADMIN", "Opened God Mode (Master Control)");
        writeLog("ADMIN", "User accessed God Mode");
    } catch(e) {
        logSystem("ERROR", "God Mode Failed: " + e.message);
    }
}

/**
 * Tính năng: Registry Tweak
 * Bật/Tắt chế độ hiện file ẩn của Windows Explorer
 */
function toggleHiddenFiles() {
    try {
        var regPath = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\Hidden";
        var currentVal = shell.RegRead(regPath);
        
        // 1 = Show, 2 = Hide
        var newVal = (currentVal == 1) ? 2 : 1;
        shell.RegWrite(regPath, newVal, "REG_DWORD");
        
        var status = (newVal == 1) ? "VISIBLE" : "HIDDEN";
        
        // Update UI
        shell.Run("RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters");
        logSystem("REGISTRY", "Hidden Files set to: " + status);
        writeLog("TWEAK", "Changed Hidden Files to " + status);
        
        // Thông báo giọng nói
        try {
            var voice = new ActiveXObject("SAPI.SpVoice");
            voice.Speak("System files are now " + status);
        } catch(e) {}

        alert("Đã thay đổi thành công! Bạn cần nhấn F5 ngoài Desktop để thấy sự thay đổi.");

    } catch(e) {
        logSystem("ERROR", "RegWrite Failed: " + e.message);
    }
}

/**
 * Tính năng: Text-to-Speech Report
 * Đọc thông số hệ thống bằng giọng nói
 */
function systemSpeak() {
    try {
        var voice = new ActiveXObject("SAPI.SpVoice");
        var cpu = document.getElementById("val-cpu").innerText;
        var ram = document.getElementById("val-ram").innerText;
        
        var text = "System Report. CPU Load is " + cpu + ". Memory usage is " + ram + ". All systems functional.";
        
        logSystem("VOICE", "Speaking system report...");
        voice.Speak(text);
    } catch(e) {
        logSystem("ERROR", "SAPI Voice not installed.");
        alert("Máy bạn không hỗ trợ Text-to-Speech (SAPI).");
    }
}

// --- STANDARD UTILITIES ---

function cleanJunk() {
    if(!confirm("CẢNH BÁO: Bạn có chắc muốn xóa file tạm trong %TEMP% không?")) return;
    
    logSystem("CLEANER", "Starting cleanup process...");
    
    setTimeout(function(){
        try {
            var tempPath = shell.ExpandEnvironmentStrings("%TEMP%");
            var folder = fso.GetFolder(tempPath);
            var files = new Enumerator(folder.Files);
            var count = 0;
            var errors = 0;

            for (; !files.atEnd(); files.moveNext()) {
                try {
                    files.item().Delete(true); // Force delete
                    count++;
                } catch(ignore) {
                    errors++;
                }
            }
            
            var msg = "Deleted: " + count + " files. Skipped: " + errors + " (Locked).";
            logSystem("SUCCESS", msg);
            writeLog("CLEANER", msg);
            alert("Dọn dẹp hoàn tất!\n" + msg);
            
        } catch(e) {
            logSystem("ERROR", "Cleaner failed: " + e.message);
        }
    }, 200);
}

function pingTest() {
    logSystem("NET", "Pinging Google DNS (8.8.8.8)... Please wait.");
    
    setTimeout(function() {
        try {
            var returnCode = shell.Run("cmd /c ping -n 1 8.8.8.8", 0, true);
            
            if (returnCode === 0) {
                logSystem("SUCCESS", "Internet: CONNECTED (Ping OK)");
                writeLog("NETWORK", "Ping 8.8.8.8: PASS");
                alert("Kết nối mạng ổn định!");
            } else {
                logSystem("ERROR", "Internet: DISCONNECTED (Request Timed Out)");
                writeLog("NETWORK", "Ping 8.8.8.8: FAIL");
                alert("Mất kết nối Internet!");
            }
        } catch(e) {
            logSystem("ERROR", "Ping exec error: " + e.message);
        }
    }, 100);
}

function openDbFolder() {
    try {
        if (DB_PATH) {
            shell.Run('explorer.exe "' + DB_PATH + '"');
            writeLog("SYSTEM", "Opened Database Folder");
        } else {
            alert("DB Path not initialized yet.");
        }
    } catch(e) {
        alert("Error: " + e.message);
    }
}