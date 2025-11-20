
/**
 * MODULE: POWER TOOLS (HIGH PRIVILEGE)
 * Thao tác file hệ thống, Registry, Services.
 */

// --- HOSTS FILE EDITOR (SYSTEM32) ---
function blockDomain() {
    var domain = document.getElementById("txt-block-domain").value;
    if(!domain) return;
    
    if(!confirm("XÁC NHẬN: Chặn truy cập vĩnh viễn tới " + domain + "?\nThao tác này sẽ ghi vào C:\\Windows\\System32\\drivers\\etc\\hosts")) return;

    try {
        // Đường dẫn Hosts file
        var sysDir = fso.GetSpecialFolder(1); // 1 = System32
        var hostsPath = fso.BuildPath(sysDir, "drivers\\etc\\hosts");
        
        // Kiểm tra file
        if(!fso.FileExists(hostsPath)) {
            alert("Không tìm thấy file Hosts! Có thể do quyền hạn hoặc Windows lạ.");
            return;
        }

        // Mở file chế độ Append (8)
        var file = fso.OpenTextFile(hostsPath, 8, true);
        file.WriteLine("\n127.0.0.1       " + domain);
        file.WriteLine("127.0.0.1       www." + domain);
        file.Close();

        if(typeof logSystem === 'function') logSystem("HOSTS", "Blocked: " + domain);
        if(typeof writeLog === 'function') writeLog("SECURITY", "Blocked domain " + domain + " in hosts file");
        
        alert("Đã chặn thành công " + domain + "!\nHãy xóa cache trình duyệt để thấy hiệu quả.");
        document.getElementById("txt-block-domain").value = "";

    } catch(e) {
        alert("LỖI: Không thể ghi file Hosts. Hãy chạy HTA với quyền Admin.\n" + e.message);
    }
}

// --- STARTUP MANAGER (REGISTRY) ---
function loadStartupApps() {
    var div = document.getElementById("startup-list");
    if(!div) return;
    
    div.innerHTML = "Scanning Registry HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run...";
    
    setTimeout(function(){
        try {
            var regPath = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\";
            // WScript.Shell RegRead chỉ đọc được từng key cụ thể, không liệt kê được.
            // Với HTA/WScript, ta phải dùng WMI StdRegProv để liệt kê key.
            
            var HKEY_CURRENT_USER = 0x80000001;
            var strKeyPath = "Software\\Microsoft\\Windows\\CurrentVersion\\Run";
            var objReg = locator.ConnectServer(".", "root\\default").Get("StdRegProv");
            
            var method = objReg.Methods_.Item("EnumValues");
            var inParams = method.InParameters.SpawnInstance_();
            inParams.hDefKey = HKEY_CURRENT_USER;
            inParams.sSubKeyName = strKeyPath;
            
            var outParams = objReg.ExecMethod_("EnumValues", inParams);
            var sNames = outParams.sNames.toArray();
            
            var html = "";
            if(sNames && sNames.length > 0) {
                for (var i = 0; i < sNames.length; i++) {
                    html += "<div style='border-bottom:1px solid rgba(255,255,255,0.1); padding:4px 0;'>• " + sNames[i] + "</div>";
                }
            } else {
                html = "No startup items found in CurrentUser.";
            }
            
            div.innerHTML = html;

        } catch(e) {
            div.innerHTML = "Registry Scan Failed: " + e.message + "<br>Cần quyền truy cập WMI root\\default";
        }
    }, 200);
}

// --- SERVICE MANAGER (WMI) ---
function loadServices() {
    var tbody = document.getElementById("service-list-body");
    if(!tbody) return;
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center'>Scanning Services...</td></tr>";

    setTimeout(function() {
        try {
            // Chỉ lấy các service quan trọng hoặc đang chạy để tránh treo UI vì quá nhiều
            var colItems = service.ExecQuery("Select Name, DisplayName, State from Win32_Service WHERE State='Running' OR StartMode='Auto'");
            var enumItems = new Enumerator(colItems);
            var html = "";
            var count = 0;
            
            for (; !enumItems.atEnd(); enumItems.moveNext()) {
                var s = enumItems.item();
                if(count > 50) break; // Limit hiển thị 50 cái cho đỡ lag HTA
                count++;
                
                var isRunning = s.State == "Running";
                var badgeClass = isRunning ? "status-running" : "status-stopped";
                var btnAction = isRunning 
                    ? "<button class='btn-kill' onclick='toggleService(\""+s.Name+"\", false)'>STOP</button>" 
                    : "<button class='hyper-btn btn-success' style='padding:2px 8px; font-size:10px' onclick='toggleService(\""+s.Name+"\", true)'>START</button>";

                html += "<tr>";
                html += "<td>" + s.Name + "</td>";
                html += "<td style='color:#aaa; font-size:12px'>" + s.DisplayName.substring(0, 30) + "</td>";
                html += "<td><span class='status-badge "+badgeClass+"'>" + s.State + "</span></td>";
                html += "<td>" + btnAction + "</td>";
                html += "</tr>";
            }
            tbody.innerHTML = html;
            if(typeof logSystem === 'function') logSystem("SVC", "Loaded service list.");

        } catch(e) {
            tbody.innerHTML = "<tr><td colspan='4'>Error: " + e.message + "</td></tr>";
        }
    }, 100);
}

function toggleService(name, startIt) {
    try {
        var colItems = service.ExecQuery("Select * from Win32_Service Where Name = '" + name + "'");
        var enumItems = new Enumerator(colItems);
        
        for (; !enumItems.atEnd(); enumItems.moveNext()) {
            var s = enumItems.item();
            var retVal;
            if(startIt) {
                retVal = s.StartService();
                if(typeof logSystem === 'function') logSystem("SVC", "Starting " + name + "...");
            } else {
                retVal = s.StopService();
                if(typeof logSystem === 'function') logSystem("SVC", "Stopping " + name + "...");
            }
            
            // WMI Service methods return 0 on success
            if(retVal == 0) {
                setTimeout(loadServices, 2000); // Đợi 2s rồi refresh
            } else {
                alert("Không thể thay đổi trạng thái Service. Mã lỗi: " + retVal);
            }
        }
    } catch(e) {
        alert("Lỗi Service Control: " + e.message);
    }
}
