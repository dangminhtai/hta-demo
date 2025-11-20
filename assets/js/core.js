
/**
 * CORE: SYSTEM INITIALIZATION
 * Khởi tạo ActiveX và các biến toàn cục.
 */

// --- GLOBAL NAMESPACE ---
var shell, network, fso, locator, service;

// --- INITIALIZATION ---
function initApp() {
    try {
        // Resize for Dashboard Layout
        var w = 1200; var h = 850;
        try {
            window.resizeTo(w, h);
            window.moveTo((screen.width - w) / 2, (screen.height - h) / 2);
        } catch(e){}

        // 1. ActiveX Init
        shell = new ActiveXObject("WScript.Shell");
        network = new ActiveXObject("WScript.Network");
        fso = new ActiveXObject("Scripting.FileSystemObject");
        locator = new ActiveXObject("WbemScripting.SWbemLocator");
        service = locator.ConnectServer(".", "root\\cimv2");

        // 2. Populate UI (User Profile)
        try {
            var user = network.UserName;
            document.getElementById("lbl-user").innerText = user;
            document.getElementById("lbl-pc").innerText = network.ComputerName;
            if(user.length > 0) {
                document.getElementById("user-avatar").innerText = user.substring(0, 2).toUpperCase();
            }
        } catch(e) {}
        
        // 3. Start Modules
        // Console will lazy-load when used, no need to init here
        if (typeof logSystem === 'function') logSystem("System", "Hyper Core initialized.");
        if (typeof initDB === 'function') initDB();
        if (typeof startMonitor === 'function') startMonitor();
        if (typeof startClock === 'function') startClock();
        if (typeof initParticles === 'function') initParticles();
        if (typeof initLimiter === 'function') initLimiter();

        // 4. Voice Greeting
        setTimeout(function() {
            try {
                var voice = new ActiveXObject("SAPI.SpVoice");
                voice.Rate = 1; voice.Volume = 100;
                voice.Speak("Hyper Admin Ready.");
            } catch(e) {}
        }, 500);
        
    } catch (e) {
        // Suppress initial errors to keep UI clean
        console.log("Init Error: " + e.message);
    }
}
