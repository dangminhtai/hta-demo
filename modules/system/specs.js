
/**
 * SYSTEM: DEEP SPECS
 * Quét ổ cứng và GPU.
 */

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
                var total = (parseFloat(d.Size) / 1073741824).toFixed(1);
                var free = (parseFloat(d.FreeSpace) / 1073741824).toFixed(1);
                var used = (total - free).toFixed(1);
                var percent = Math.round((used / total) * 100);
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
                break; 
            }

        } catch(e) {
            if(typeof logSystem === 'function') logSystem("ERROR", "Spec scan failed: " + e.message);
        }
    }, 100);
}
    