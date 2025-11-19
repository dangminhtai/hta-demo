
/**
 * MODULE: HARDWARE MONITOR & SYSTEM CONTROL
 * Dashboard Version 2.0 - High Privilege
 */

function getHardwareInfo() {
    if (!service) return;

    try {
        // 1. OS Info
        var osItems = service.ExecQuery("SELECT Caption, BuildNumber FROM Win32_OperatingSystem");
        var eOS = new Enumerator(osItems);
        for (; !eOS.atEnd(); eOS.moveNext()) {
            document.getElementById("lbl-os-real").innerText = "Windows";
            document.getElementById("lbl-ver-real").innerText = eOS.item().Caption.replace("Microsoft Windows", "").trim();
        }

        // 2. CPU Info
        var cpuItems = service.ExecQuery("SELECT Name FROM Win32_Processor");
        var eCPU = new Enumerator(cpuItems);
        for (; !eCPU.atEnd(); eCPU.moveNext()) {
            var name = eCPU.item().Name;
            // Simplify CPU Name for cleaner card UI
            name = name.replace("Intel(R)", "").replace("Core(TM)", "").replace("CPU", "").replace("Processor", "").trim();
            document.getElementById("lbl-cpu-real").innerText = name;
        }

        // 3. RAM Info
        var ramItems = service.ExecQuery("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
        var eRAM = new Enumerator(ramItems);
        for (; !eRAM.atEnd(); eRAM.moveNext()) {
            var totalBytes = parseFloat(eRAM.item().TotalPhysicalMemory);
            var totalGB = (totalBytes / 1024 / 1024 / 1024).toFixed(1);
            document.getElementById("lbl-ram-real").innerText = totalGB + " GB";
        }
        
        startFakeMonitor();

    } catch(e) {
        logSystem("Error", "Hardware Scan Failed: " + e.message);
    }
}

function startFakeMonitor() {
    // Update bars and text labels with smooth animation
    setInterval(function() {
        var cpu = Math.floor(Math.random() * 20) + 5; // 5-25%
        var ram = Math.floor(Math.random() * 15) + 40; // 40-55%
        
        if(document.getElementById("meter-cpu")) {
            document.getElementById("meter-cpu").style.width = cpu + "%";
            document.getElementById("val-cpu").innerText = cpu + "% Load";
        }
        
        if(document.getElementById("meter-ram")) {
            document.getElementById("meter-ram").style.width = ram + "%";
            document.getElementById("val-ram").innerText = ram + "% Used";
        }
    }, 2000);
}

// --- PROCESS MANAGER (TASK KILLER) ---

function loadProcessList() {
    var tbody = document.getElementById("process-list-body");
    if(!tbody) return;

    tbody.innerHTML = "<tr><td colspan='4' style='text-align:center'>Scanning running processes...</td></tr>";

    // Use Timeout to allow UI to render 'Scanning' before WMI freezes briefly
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
            logSystem("PROC", "Process list updated.");

        } catch(e) {
            tbody.innerHTML = "<tr><td colspan='4'>Error loading processes: " + e.message + "</td></tr>";
        }
    }, 100);
}

function killProcess(pid, name) {
    if(!confirm("WARNING: Are you sure you want to terminate " + name + " (PID: " + pid + ")?")) return;

    try {
        var colItems = service.ExecQuery("Select * from Win32_Process Where ProcessId = " + pid);
        var enumItems = new Enumerator(colItems);
        
        for (; !enumItems.atEnd(); enumItems.moveNext()) {
            var p = enumItems.item();
            p.Terminate();
        }
        
        logSystem("KILL", "Terminated process: " + name);
        writeLog("KILL", "User terminated process " + name + " [" + pid + "]");
        
        // Refresh list
        loadProcessList();
        
    } catch(e) {
        alert("Failed to kill process. Access Denied or System Process.");
        logSystem("ERROR", "Kill failed: " + e.message);
    }
}

// --- DEEP HARDWARE SPECS ---

function getDeepSpecs() {
    var container = document.getElementById("disk-container");
    if(!container) return;
    
    container.innerHTML = "Loading storage data...";

    setTimeout(function(){
        try {
            // 1. DISKS
            var disks = service.ExecQuery("Select DeviceID, VolumeName, FreeSpace, Size from Win32_LogicalDisk Where DriveType=3");
            var eDisk = new Enumerator(disks);
            var html = "";

            for (; !eDisk.atEnd(); eDisk.moveNext()) {
                var d = eDisk.item();
                var total = (parseFloat(d.Size) / 1024/1024/1024).toFixed(1);
                var free = (parseFloat(d.FreeSpace) / 1024/1024/1024).toFixed(1);
                var used = (total - free).toFixed(1);
                var percent = Math.round((used / total) * 100);
                
                // Color based on usage
                var color = percent > 80 ? "#ff4b1f" : "#00f2c3";

                html += "<div class='card tool-card' style='width:48%; cursor:default;'>";
                html += "<div class='tool-icon' style='background:"+color+"; color:#000'>💾</div>";
                html += "<div style='flex:1'>";
                html += "<div class='tool-name'>" + d.DeviceID + " (" + (d.VolumeName || "Local Disk") + ")</div>";
                html += "<div style='font-size:12px; color:#aaa; margin-top:5px'>" + free + " GB free of " + total + " GB</div>";
                html += "<div class='progress-bg' style='margin-top:8px; height:6px'><div style='width:"+percent+"%; background:"+color+"; height:100%; border-radius:3px'></div></div>";
                html += "</div></div>";
            }
            container.innerHTML = html;

            // 2. GPU
            var gpus = service.ExecQuery("Select Name, CurrentHorizontalResolution, CurrentVerticalResolution from Win32_VideoController");
            var eGpu = new Enumerator(gpus);
            for (; !eGpu.atEnd(); eGpu.moveNext()) {
                var g = eGpu.item();
                document.getElementById("lbl-gpu-name").innerText = g.Name;
                if(g.CurrentHorizontalResolution) {
                    document.getElementById("lbl-gpu-res").innerText = g.CurrentHorizontalResolution + " x " + g.CurrentVerticalResolution + " Resolution";
                }
                break; // Just get the primary one
            }

        } catch(e) {
            logSystem("ERROR", "Spec scan failed: " + e.message);
        }
    }, 100);
}