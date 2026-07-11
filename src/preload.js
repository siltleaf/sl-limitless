const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');
const { exec } = require('child_process');

contextBridge.exposeInMainWorld('siltleaf', {
    onInit: (callback) => ipcRenderer.on('init-settings', (event, s) => callback(s)),
    onCornerUpdate: (callback) => ipcRenderer.on('corner-changed', (event, c) => callback(c)),
    onSizeUpdate: (callback) => ipcRenderer.on('change-size', (event, d) => callback(d)),
    getNative: () => ({ free: os.freemem(), total: os.totalmem(), cpus: os.cpus() }),
    getAdvancedStats: () => {
        return new Promise((resolve) => {
            const cmd = `powershell -command "$cpu = Get-CimInstance Win32_Processor; $gpu = Get-CimInstance Win32_VideoController; $mem = Get-CimInstance Win32_OperatingSystem; $disk = Get-CimInstance Win32_LogicalDisk -Filter \\"DeviceID='C:'\\"; $gpuUsage = (Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -ErrorAction SilentlyContinue | Measure-Object -Property UtilizationPercentage -Sum).Sum; $temp = (Get-CimInstance -Namespace root/wmi -ClassName MsAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue).CurrentTemperature; @{ cpuModel=$cpu.Name; cpuClock=$cpu.CurrentClockSpeed; gpuModel=$gpu.Name; vram=$gpu.AdapterRAM; dSize=$disk.Size; dFree=$disk.FreeSpace; gpuPct=$gpuUsage; temp=$temp } | ConvertTo-Json"`;
            exec(cmd, { timeout: 3000 }, (err, stdout) => resolve(stdout));
        });
    }
});