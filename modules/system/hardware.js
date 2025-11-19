
/**
 * MODULE: HARDWARE MONITOR
 * Dashboard Version
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
        
        document.getElementById("meter-cpu").style.width = cpu + "%";
        document.getElementById("val-cpu").innerText = cpu + "% Load";
        
        document.getElementById("meter-ram").style.width = ram + "%";
        document.getElementById("val-ram").innerText = ram + "% Used";
    }, 2000);
}
