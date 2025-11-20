
/**
 * VISUALS: PARTICLE SYSTEM
 * Hiệu ứng nền Canvas.
 */

function initParticles() {
    var canvas = document.getElementById("canvas-bg");
    if (!canvas || !canvas.getContext) return;
    
    var ctx = canvas.getContext("2d");
    var width, height;
    var particles = [];
    var mouse = { x: -9999, y: -9999 };

    function resize() {
        width = canvas.width = document.body.clientWidth;
        height = canvas.height = document.body.clientHeight;
    }
    window.onresize = resize;
    resize();

    document.onmousemove = function(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    };

    var config = { count: 70, dist: 140, mouseDist: 180, speed: 0.5 };

    function Particle() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;
        this.size = Math.random() * 2 + 1;
        this.color = Math.random() > 0.5 ? "rgba(29, 140, 248, " : "rgba(225, 78, 202, "; 
    }

    Particle.prototype.update = function() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        var dx = mouse.x - this.x;
        var dy = mouse.y - this.y;
        var distance = Math.sqrt(dx*dx + dy*dy);

        if (distance < config.mouseDist) {
            var force = (config.mouseDist - distance) / config.mouseDist;
            this.vx -= (dx / distance) * force * 0.05;
            this.vy -= (dy / distance) * force * 0.05;
        }
    };

    Particle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color + "0.8)";
        ctx.fill();
    };

    for (var i = 0; i < config.count; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, width, height);
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            p.update(); p.draw();
            for (var j = i + 1; j < particles.length; j++) {
                var p2 = particles[j];
                var dx = p.x - p2.x; var dy = p.y - p2.y;
                var d = Math.sqrt(dx*dx + dy*dy);
                if (d < config.dist) {
                    ctx.beginPath();
                    var alpha = 1 - (d / config.dist);
                    ctx.strokeStyle = "rgba(255, 255, 255, " + (alpha * 0.15) + ")";
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                }
            }
        }
        setTimeout(animate, 1000 / 60);
    }
    animate();
}
    