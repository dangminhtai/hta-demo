
/**
 * MAIN CORE SYSTEM - HYPER ADMIN
 * UI: Modern Dashboard with Interactive Particles
 */

// --- GLOBAL NAMESPACE ---
var shell, network, fso, locator, service;

// --- INITIALIZATION ---
function initApp() {
    try {
        // Resize for Dashboard Layout
        var w = 1200; var h = 850;
        window.resizeTo(w, h);
        window.moveTo((screen.width - w) / 2, (screen.height - h) / 2);
    } catch(e) {}

    try {
        // 1. ActiveX Init
        shell = new ActiveXObject("WScript.Shell");
        network = new ActiveXObject("WScript.Network");
        fso = new ActiveXObject("Scripting.FileSystemObject");
        locator = new ActiveXObject("WbemScripting.SWbemLocator");
        service = locator.ConnectServer(".", "root\\cimv2");

        // 2. Populate UI
        var user = network.UserName;
        document.getElementById("lbl-user").innerText = user;
        document.getElementById("lbl-pc").innerText = network.ComputerName;
        
        // Set Avatar Initials
        if(user.length > 0) {
            document.getElementById("user-avatar").innerText = user.substring(0, 2).toUpperCase();
        }
        
        // 3. Start Modules
        logSystem("System", "Dashboard initialized successfully.");
        
        if (typeof initDB === 'function') initDB();
        if (typeof getHardwareInfo === 'function') getHardwareInfo();

        // 4. Start Clock & Visuals
        startClock();
        initParticles();

        // 5. Voice Greeting (Cool factor)
        setTimeout(function() {
            try {
                var voice = new ActiveXObject("SAPI.SpVoice");
                voice.Rate = 1; // Speed
                voice.Volume = 100;
                voice.Speak("Welcome back, Administrator.");
            } catch(e) { /* Ignore if no voice installed */ }
        }, 1000);
        
    } catch (e) {
        alert("Lỗi khởi tạo: " + e.message);
    }
}

// --- UI UTILITIES ---
function startClock() {
    setInterval(function() {
        var now = new Date();
        var h = now.getHours();
        var m = now.getMinutes();
        var s = now.getSeconds();
        
        // Add leading zero
        h = h < 10 ? "0" + h : h;
        m = m < 10 ? "0" + m : m;
        s = s < 10 ? "0" + s : s;
        
        document.getElementById("clock-display").innerText = h + ":" + m + ":" + s;
    }, 1000);
}

function logSystem(type, msg) {
    var consoleDiv = document.getElementById("console-wrapper");
    if (!consoleDiv) return;

    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-GB');
    
    var html = "<div class='log-line'>" +
               "<span class='log-time'>" + timeStr + "</span>" +
               "<span class='log-action'>[" + type + "]</span> " +
               "<span class='log-msg'>" + msg + "</span>" +
               "</div>";
    
    consoleDiv.innerHTML = html + consoleDiv.innerHTML;
}

// --- ADVANCED PARTICLE SYSTEM ---
function initParticles() {
    var canvas = document.getElementById("canvas-bg");
    if (!canvas || !canvas.getContext) return;
    
    var ctx = canvas.getContext("2d");
    var width, height;
    var particles = [];
    
    // Mouse tracking
    var mouse = { x: -9999, y: -9999 };

    // Resize handling
    function resize() {
        width = canvas.width = document.body.clientWidth;
        height = canvas.height = document.body.clientHeight;
    }
    window.onresize = resize;
    resize();

    // Track mouse
    document.onmousemove = function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };

    // Configuration
    var config = {
        count: 70,         // Number of nodes
        dist: 140,         // Connection distance
        mouseDist: 180,    // Mouse interaction radius
        speed: 0.5         // Movement speed
    };

    // Particle Class
    function Particle() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;
        this.size = Math.random() * 2 + 1;
        // Alternating colors: Cyan or Purple
        this.color = Math.random() > 0.5 ? "rgba(29, 140, 248, " : "rgba(225, 78, 202, "; 
    }

    Particle.prototype.update = function() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction (Repulsion/Attraction mix)
        var dx = mouse.x - this.x;
        var dy = mouse.y - this.y;
        var distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < config.mouseDist) {
            var forceDirectionX = dx / distance;
            var forceDirectionY = dy / distance;
            var force = (config.mouseDist - distance) / config.mouseDist;
            
            // Gentle push away
            this.vx -= forceDirectionX * force * 0.05;
            this.vy -= forceDirectionY * force * 0.05;
        }
    };

    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + "0.8)";
        ctx.fill();
    };

    // Init Particles
    for (var i = 0; i < config.count; i++) {
        particles.push(new Particle());
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        
        // Background is handled by CSS (Dark Blue), so we just draw nodes
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.update();
            p.draw();

            // Draw connections
            for (var j = i + 1; j < particles.length; j++) {
                var p2 = particles[j];
                var dx = p.x - p2.x;
                var dy = p.y - p2.y;
                var d = Math.sqrt(dx*dx + dy*dy);

                if (d < config.dist) {
                    ctx.beginPath();
                    // Opacity based on distance
                    var alpha = 1 - (d / config.dist);
                    
                    // Gradient line look (using the particle's base color)
                    ctx.strokeStyle = "rgba(255, 255, 255, " + (alpha * 0.15) + ")";
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
        
        // Use setTimeout for safe frame rate in HTA/IE
        setTimeout(animate, 1000 / 60);
    }

    animate();
}