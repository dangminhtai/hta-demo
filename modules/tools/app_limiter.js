
/**
 * MODULE: APP LIMITER (ANTI-ADDICTION)
 * Kiểm soát thời gian sử dụng và số lần mở ứng dụng.
 * Cơ chế: Quét WMI định kỳ, đếm thời gian, Kill nếu vượt quá hạn mức.
 */

var LIMITS_FILE = "";
var limitsData = {};
var limiterInterval = null;
var activeAppsCache = {}; // Cache để phát hiện lần mở mới

function initLimiter() {
    try {
        if (typeof DB_PATH === 'undefined' || !DB_PATH) return;
        LIMITS_FILE = fso.BuildPath(DB_PATH, "app_limits.json");
        
        loadLimitsData();
        
        // Chạy service quét 5s/lần
        limiterInterval = setInterval(monitorAppUsage, 5000);
        logSystem("LIMITER", "Anti-Addiction Service Started.");
    } catch(e) {
        logSystem("ERR", "Limiter Init Failed: " + e.message);
    }
}

function loadLimitsData() {
    try {
        if (fso.FileExists(LIMITS_FILE)) {
            var content = readContentFromFile(LIMITS_FILE);
            if(content) limitsData = JSON.parse(content);
        }
        
        // Check reset theo ngày
        var today = new Date().toLocaleDateString();
        if (limitsData.lastResetDate !== today) {
            limitsData.lastResetDate = today;
            // Reset counters & warnings
            for (var app in limitsData.rules) {
                limitsData.rules[app].usedSeconds = 0;
                limitsData.rules[app].launchCount = 0;
                limitsData.rules[app].hasWarned = false; // Reset warning flag
            }
            saveLimitsData();
            logSystem("LIMITER", "Daily limits reset for " + today);
        }
        
        if (!limitsData.rules) limitsData.rules = {};
        
    } catch(e) {
        limitsData = { lastResetDate: new Date().toLocaleDateString(), rules: {} };
    }
}

function saveLimitsData() {
    try {
        saveContentToFile(LIMITS_FILE, JSON.stringify(limitsData, null, 4));
    } catch(e) {}
}

/**
 * CORE LOGIC: Quét tiến trình
 */
function monitorAppUsage() {
    if (!limitsData || !limitsData.rules) return;
    
    try {
        // Lấy danh sách process đang chạy
        var colItems = service.ExecQuery("Select Name, ProcessId from Win32_Process");
        var enumItems = new Enumerator(colItems);
        
        var currentRunning = {}; // Map: { "chrome.exe": true }
        
        for (; !enumItems.atEnd(); enumItems.moveNext()) {
            var p = enumItems.item();
            var name = p.Name.toLowerCase();
            
            currentRunning[name] = true;
            
            // Nếu app này có trong rule
            if (limitsData.rules[name]) {
                var rule = limitsData.rules[name];
                
                // 1. Logic đếm số lần mở (Launch Count)
                if (!activeAppsCache[name]) {
                    rule.launchCount = (rule.launchCount || 0) + 1;
                    activeAppsCache[name] = true; // Đánh dấu đang chạy
                    saveLimitsData();
                    checkViolation(name, p);
                }
                
                // 2. Logic đếm thời gian (Time Usage)
                // Cộng thêm 5 giây (interval)
                rule.usedSeconds = (rule.usedSeconds || 0) + 5;
                
                // --- TÍNH NĂNG MỚI: CẢNH BÁO 1 PHÚT CUỐI ---
                var usedMin = Math.floor(rule.usedSeconds / 60);
                var remaining = rule.maxTime - usedMin;

                // Nếu có giới hạn thời gian, còn <= 1 phút và chưa cảnh báo
                if (rule.maxTime > 0 && remaining <= 1 && remaining > 0 && !rule.hasWarned) {
                    rule.hasWarned = true;
                    try {
                        // Cảnh báo giọng nói
                        var voice = new ActiveXObject("SAPI.SpVoice");
                        voice.Speak("Warning! One minute remaining for " + name);
                    } catch(e){}
                    
                    logSystem("WARNING", name + ": Chỉ còn 1 phút nữa là bị khóa!");
                    saveLimitsData();
                }
                // ---------------------------------------------

                // 3. Kiểm tra vi phạm liên tục
                checkViolation(name, p);
            }
        }
        
        // Cập nhật cache: App nào tắt rồi thì bỏ khỏi cache
        for (var cachedApp in activeAppsCache) {
            if (!currentRunning[cachedApp]) {
                delete activeAppsCache[cachedApp];
            }
        }
        
        // Lưu định kỳ
        saveLimitsData();
        
        // Update UI nếu đang mở tab Limiter (Đã đổi tên ID view)
        var viewEl = document.getElementById("view-limiter");
        if (viewEl && viewEl.className.indexOf("active") > -1) {
            refreshLimiterTable();
        }

    } catch(e) {
        // Silent error to avoid spamming logs
    }
}

function checkViolation(appName, processObj) {
    var rule = limitsData.rules[appName];
    var violation = false;
    var reason = "";

    // Check Launch Limit
    if (rule.maxLaunches > 0 && rule.launchCount > rule.maxLaunches) {
        violation = true;
        reason = "Quá số lần mở (" + rule.launchCount + "/" + rule.maxLaunches + ")";
    }

    // Check Time Limit
    var usedMin = Math.floor(rule.usedSeconds / 60);
    if (rule.maxTime > 0 && usedMin >= rule.maxTime) {
        violation = true;
        reason = "Hết giờ chơi (" + usedMin + "/" + rule.maxTime + " phút)";
    }

    if (violation) {
        try {
            processObj.Terminate();
            logSystem("LIMITER", "KILLED " + appName + ": " + reason);
            
            // Phạt âm thanh
            try {
                var voice = new ActiveXObject("SAPI.SpVoice");
                voice.Speak("Time is up for " + appName);
            } catch(e){}
            
        } catch(err) {
            logSystem("LIMITER", "Failed to kill " + appName);
        }
    }
}

// --- UI HANDLERS ---

function handleFileSelect() {
    var picker = document.getElementById('file-picker');
    var input = document.getElementById('limit-app-name');
    
    if(picker.value) {
        var fullPath = picker.value;
        var fileName = fullPath.split('\\').pop();
        input.value = fileName;
        picker.value = ""; 
    }
}

function addLimitRule() {
    var appName = document.getElementById("limit-app-name").value.toLowerCase().trim();
    var maxTime = parseInt(document.getElementById("limit-time").value) || 0;
    var maxCount = parseInt(document.getElementById("limit-count").value) || 0;

    if (!appName || appName.indexOf(".exe") === -1) {
        alert("Vui lòng chọn file hoặc nhập tên Process (ví dụ: chrome.exe)");
        return;
    }

    // --- VALIDATION MỚI: TỐI THIỂU 2 PHÚT ---
    // Để đảm bảo tính năng cảnh báo 1 phút hoạt động chính xác
    if (maxTime > 0 && maxTime < 2) {
        alert("Đã bảo là cho nó tối thiểu 2 phút cơ mà! Ít quá sao kịp cảnh báo?");
        return;
    }
    // ----------------------------------------

    if (!limitsData.rules) limitsData.rules = {};

    // Giữ lại data cũ nếu có
    var currentUsed = 0;
    var currentCount = 0;
    if(limitsData.rules[appName]) {
        currentUsed = limitsData.rules[appName].usedSeconds || 0;
        currentCount = limitsData.rules[appName].launchCount || 0;
    }

    limitsData.rules[appName] = {
        maxTime: maxTime,
        maxLaunches: maxCount,
        usedSeconds: currentUsed,
        launchCount: currentCount,
        hasWarned: false // Init cờ cảnh báo
    };

    saveLimitsData();
    refreshLimiterTable();
    alert("Đã thêm luật giới hạn cho: " + appName);
    
    // Clear inputs
    document.getElementById("limit-app-name").value = "";
    document.getElementById("limit-time").value = "";
    document.getElementById("limit-count").value = "";
}

function removeLimitRule(appName) {
    if (!confirm("Xóa giới hạn cho " + appName + "?")) return;
    if (limitsData.rules && limitsData.rules[appName]) {
        delete limitsData.rules[appName];
        saveLimitsData();
        refreshLimiterTable();
    }
}

function refreshLimiterTable() {
    var tbody = document.getElementById("limiter-table-body");
    if (!tbody) return;

    if (!limitsData.rules || Object.keys(limitsData.rules).length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#666'>No active rules. Select an .exe to begin.</td></tr>";
        return;
    }

    var html = "";
    for (var app in limitsData.rules) {
        var r = limitsData.rules[app];
        var usedMin = Math.floor(r.usedSeconds / 60);
        
        // Status Calculations
        var timePercent = 0;
        if(r.maxTime > 0) timePercent = Math.min(100, Math.round((usedMin / r.maxTime) * 100));
        
        var timeStatus = (r.maxTime > 0 && usedMin >= r.maxTime) ? "EXPIRED" : "OK";
        var countStatus = (r.maxLaunches > 0 && r.launchCount >= r.maxLaunches) ? "LOCKED" : "OK";
        
        var finalStatus = (timeStatus !== "OK" || countStatus !== "OK") 
            ? "<span style='color:#ff4b1f; font-weight:bold'>BLOCKED</span>" 
            : "<span style='color:#00f2c3'>ACTIVE</span>";
        
        // Logic màu thanh tiến trình: Xanh -> Vàng -> Đỏ
        var progColor = "#00f2c3";
        if(timePercent > 70) progColor = "#ff8d72";
        if(timePercent >= 90) progColor = "#ff4b1f";

        html += "<tr>";
        html += "<td style='color:#fff; font-weight:500'>" + app + "</td>";
        
        // Time Column with Progress Bar
        html += "<td>";
        html += "<div style='display:flex; justify-content:space-between; font-size:11px; margin-bottom:3px;'>";
        html += "<span>" + usedMin + "m used</span>";
        html += "<span>" + (r.maxTime > 0 ? r.maxTime + "m max" : "Unlimited") + "</span>";
        html += "</div>";
        html += "<div class='progress-bg' style='height:6px; margin-top:0; background:#444'>";
        html += "<div style='width:"+timePercent+"%; background:"+progColor+"; height:100%; border-radius:3px; transition:width 0.5s'></div>";
        html += "</div>";
        html += "</td>";
        
        // Launch Column
        var countDisplay = r.launchCount;
        if (r.maxLaunches > 0) countDisplay += " / <span style='color:#aaa'>" + r.maxLaunches + "</span>";
        else countDisplay += " (Unlimited)";
        html += "<td>" + countDisplay + "</td>";
        
        html += "<td>" + finalStatus + "</td>";
        html += "<td><button class='btn-kill' onclick='removeLimitRule(\"" + app + "\")'>DELETE</button></td>";
        html += "</tr>";
    }
    tbody.innerHTML = html;
}
