
/**
 * SYSTEM: PROCESS MANAGER
 * Quản lý và tiêu diệt tiến trình.
 */

function loadProcessList() {
    var tbody = document.getElementById("process-list-body");
    if(!tbody) return;
    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center'>Scanning running processes...</td></tr>";

    setTimeout(function() {
        try {
            var colItems = service.ExecQuery("Select Name, ProcessId, ExecutablePath from Win32_Process");
            var enumItems = new Enumerator(colItems);
            var html = "";
            
            for (; !enumItems.atEnd(); enumItems.moveNext()) {
                var p = enumItems.item();
                var name = p.Name;
                var pid = p.ProcessId;
                var path = p.ExecutablePath || "-";
                
                html += "<tr>";
                html += "<td>" + pid + "</td>";
                html += "<td style='color:#fff; font-weight:500'>" + name + "</td>";
                html += "<td style='color:#888; font-size:11px'>" + path + "</td>";
                html += "<td><button class='btn-kill' onclick='killProcess(" + pid + ", \"" + name + "\")'>TERMINATE</button></td>";
                html += "</tr>";
            }
            tbody.innerHTML = html;
            if(typeof logSystem === 'function') logSystem("PROC", "Process list updated.");
        } catch(e) {
            tbody.innerHTML = "<tr><td colspan='4'>Error: " + e.message + "</td></tr>";
        }
    }, 100);
}

function killProcess(pid, name) {
    if(!confirm("WARNING: Kill " + name + " (PID: " + pid + ")?")) return;
    try {
        var colItems = service.ExecQuery("Select * from Win32_Process Where ProcessId = " + pid);
        var enumItems = new Enumerator(colItems);
        for (; !enumItems.atEnd(); enumItems.moveNext()) {
            enumItems.item().Terminate();
        }
        if(typeof writeLog === 'function') writeLog("KILL", "Terminated " + name + " [" + pid + "]");
        loadProcessList();
    } catch(e) {
        alert("Failed: " + e.message);
    }
}
    