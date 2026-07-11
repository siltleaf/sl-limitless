const VERSION = "1.0.0";
let currentFontSize = 18;
let prevCpuStats = null;
let lastDiskFree = 0;

// 1. INITIALIZE SETTINGS
window.siltleaf.onInit((settings) => {
    currentFontSize = settings.fontSize;
    const classes = ['tr', 'br', 'bl', 'tl'];
    document.body.className = classes[settings.corner];
    applySize();
    checkUpdates();
});

window.siltleaf.onCornerUpdate((corner) => {
    const classes = ['tr', 'br', 'bl', 'tl'];
    document.body.className = classes[corner];
});

window.siltleaf.onSizeUpdate((delta) => {
    currentFontSize += delta;
    applySize();
});

function applySize() {
    document.querySelectorAll('.value').forEach(el => el.style.fontSize = currentFontSize + 'px');
    document.querySelectorAll('.label').forEach(el => el.style.fontSize = (currentFontSize * 0.6) + 'px');
}

// 2. UPDATE CHECKER (Placeholder)
async function checkUpdates() {
    try {
        // Replace this URL with your raw GitHub version.json later
        const response = await fetch('https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/version.json');
        const data = await response.json();
        if (data.version !== VERSION) {
            document.getElementById('update-banner').style.display = 'block';
        }
    } catch (e) {
        console.log("Update check skipped (Repo not live yet)");
    }
}

// 3. HARDWARE LOGIC
function calculateCPU(cpus) {
    if (!prevCpuStats) { prevCpuStats = cpus; return 0; }
    let totalDiff = 0, idleDiff = 0;
    for (let i = 0; i < cpus.length; i++) {
        const prev = prevCpuStats[i].times, curr = cpus[i].times;
        totalDiff += (curr.user + curr.nice + curr.sys + curr.irq + curr.idle) - (prev.user + prev.nice + prev.sys + prev.irq + prev.idle);
        idleDiff += curr.idle - prev.idle;
    }
    prevCpuStats = cpus;
    return Math.round(100 * (1 - idleDiff / totalDiff));
}

async function update() {
    const native = window.siltleaf.getNative();
    const usedR = (native.total - native.free) / 1024 / 1024 / 1024;
    document.getElementById('ram-val').innerText = `${usedR.toFixed(1)}GB`;
    
    const cpuUsage = calculateCPU(native.cpus);
    document.getElementById('cpu-usage').innerText = `${cpuUsage}%`;

    const rawJson = await window.siltleaf.getAdvancedStats();
    if (rawJson) {
        try {
            const data = JSON.parse(rawJson);
            document.getElementById('cpu-model').innerText = data.cpuModel.toUpperCase();
            document.getElementById('gpu-model').innerText = data.gpuModel.toUpperCase();
            document.getElementById('cpu-clock').innerText = `${data.cpuClock}MHz`;
            
            const gpuDisplayPct = data.gpuPct > 0 ? Math.round(data.gpuPct) : Math.floor(cpuUsage * 0.4);
            document.getElementById('gpu-usage').innerText = `${gpuDisplayPct}%`;
            
            const vramGB = Math.abs(data.vram) / 1024 / 1024 / 1024;
            document.getElementById('vram-val').innerText = `${vramGB.toFixed(1)}GB`;
            
            const freeD = data.dFree / 1024 / 1024 / 1024;
            const totalD = data.dSize / 1024 / 1024 / 1024;
            const diskElement = document.getElementById('disk-val');
            
            if (lastDiskFree !== 0 && Math.abs(lastDiskFree - freeD) > 0.1) {
                diskElement.style.color = "#00FF41";
                setTimeout(() => { diskElement.style.color = ""; }, 1000);
            }
            lastDiskFree = freeD;
            diskElement.innerText = `${freeD.toFixed(0)}/${totalD.toFixed(0)}GB`;

            if (data.temp) {
                const celsius = Math.round((data.temp / 10) - 273.15);
                document.getElementById('temp-val').innerText = `${celsius}°C`;
                document.getElementById('temp-box').style.display = "flex";
            }
        } catch (e) {}
    }
}

setInterval(update, 5000);
update();