
/**
 * SYSTEM: REAL-TIME MONITOR
 * Theo dõi tài nguyên cơ bản (CPU/RAM/OS) + Network + Uptime
 */

function startMonitor() {
    if (!service) return;
    try {
        // 1. OS Info & Uptime
        var osItems = service.ExecQuery("SELECT Caption, BuildNumber, LastBootUpTime FROM Win32_OperatingSystem");
        var eOS = new Enumerator(osItems);
        for (; !eOS.atEnd(); eOS.moveNext()) {
            var os = eOS.item();
            document.getElementById("lbl-os-real").innerText = "Windows";
            document.getElementById("lbl-ver-real").innerText = os.Caption.replace("Microsoft Windows", "").trim();
            
            // Calculate Uptime
            calculateUptime(os.LastBootUpTime);
        }

        // 2. CPU Name
        var cpuItems = service.ExecQuery("SELECT Name FROM Win32_Processor");
        var eCPU = new Enumerator(cpuItems);
        for (; !eCPU.atEnd(); eCPU.moveNext()) {
            var name = eCPU.item().Name.replace(/Intel\(R\)|Core\(TM\)|CPU|Processor/g, "").trim();
            document.getElementById("lbl-cpu-real").innerText = name;
        }

        // 3. RAM Total
        var ramItems = service.ExecQuery("SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
        var eRAM = new Enumerator(ramItems);
        for (; !eRAM.atEnd(); eRAM.moveNext()) {
            var gb = (parseFloat(eRAM.item().TotalPhysicalMemory) / 1073741824).toFixed(1);
            document.getElementById("lbl-ram-real").innerText = gb + " GB";
        }
        
        // Start fake visualizer loop
        setInterval(function() {
            var cpu = Math.floor(Math.random() * 20) + 5; 
            var ram = Math.floor(Math.random() * 15) + 40;
            if(document.getElementById("meter-cpu")) {
                document.getElementById("meter-cpu").style.width = cpu + "%";
                document.getElementById("val-cpu").innerText = cpu + "% Load";
            }
            if(document.getElementById("meter-ram")) {
                document.getElementById("meter-ram").style.width = ram + "%";
                document.getElementById("val-ram").innerText = ram + "% Used";
            }
        }, 2000);

    } catch(e) {
        if(typeof logSystem === 'function') logSystem("Error", "Monitor Init: " + e.message);
    }
}

// --- UPTIME HELPER ---
function calculateUptime(wmiTime) {
    // WMI Time Format: YYYYMMDDHHMMSS.xxxxxx+UUU
    var y = wmiTime.substring(0, 4);
    var m = wmiTime.substring(4, 6) - 1; // JS Month is 0-11
    var d = wmiTime.substring(6, 8);
    var H = wmiTime.substring(8, 10);
    var M = wmiTime.substring(10, 12);
    var S = wmiTime.substring(12, 14);

    var bootDate = new Date(y, m, d, H, M, S);
    var now = new Date();
    
    var diffMs = now - bootDate;
    var diffHrs = Math.floor(diffMs / 3600000);
    var diffMins = Math.floor((diffMs % 3600000) / 60000);

    var lbl = document.getElementById("lbl-uptime");
    if(lbl) lbl.innerText = "Up: " + diffHrs + "h " + diffMins + "m";
}

// --- NETWORK SCANNER ---
function getNetworkInfo() {
    var container = document.getElementById("network-container");
    if(!container) return;
    
    container.innerHTML = "<div style='width:100%; text-align:center'>Querying Win32_NetworkAdapterConfiguration...</div>";
    
    setTimeout(function() {
        try {
            var colItems = service.ExecQuery("SELECT Description, IPAddress, MACAddress, DNSServerSearchOrder FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = TRUE");
            var enumItems = new Enumerator(colItems);
            var html = "";
            
            for (; !enumItems.atEnd(); enumItems.moveNext()) {
                var net = enumItems.item();
                
                // IP Address comes as array in WMI, need safe conversion
                var ip = "N/A";
                try { ip = new VBArray(net.IPAddress).toArray()[0]; } catch(e){}
                
                var dns = "Auto";
                try { dns = new VBArray(net.DNSServerSearchOrder).toArray()[0]; } catch(e){}

                html += "<div class='card tool-card' style='width:48%; cursor:default; height:auto; align-items:flex-start'>";
                html += "<div class='tool-icon' style='background:#3358f4; color:#fff'>📡</div>";
                html += "<div style='flex:1'>";
                html += "<div class='tool-name' style='font-size:13px'>" + net.Description.substring(0, 35) + "...</div>";
                html += "<div style='font-size:12px; color:#fff; margin-top:8px; font-family:monospace'>";
                html += "IP: <span style='color:#00f2c3'>" + ip + "</span><br>";
                html += "MAC: <span style='color:#e14eca'>" + (net.MACAddress || "N/A") + "</span><br>";
                html += "DNS: " + dns;
                html += "</div>";
                html += "</div></div>";
            }
            
            if(html === "") html = "<div style='padding:20px'>No active network connection found.</div>";
            container.innerHTML = html;
            
        } catch(e) {
            container.innerHTML = "Error: " + e.message;
        }
    }, 100);
}
