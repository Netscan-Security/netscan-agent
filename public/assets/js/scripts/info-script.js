const sysInfo = document.getElementById('sys-info');
const loading = document.querySelectorAll('.loading');
// System info
const os = document.querySelector('.os');
const memory = document.querySelector('.memory');
const processor = document.querySelector('.processor');
const videoGraphics = document.querySelector('.video-graphics');

// Fetch system info
function getSystemInfo() {
    // get system info from local storage or fetch from server
    const systemInfo = localStorage.getItem('systemInfo');
    if (systemInfo) {
        const info = JSON.parse(systemInfo);

        // display system info
        os.textContent = info?.computerInfo?.OsName;
        memory.textContent = info?.physicalMemoryGB;
        processor.textContent = info?.processorInfo?.Name;
        videoGraphics.textContent = info?.videoControllerInfo?.Name;

        // hide loading
        loading.forEach(load => load.style.display = 'none');
    } else {
        // fetch system info from server
        fetch("http://localhost:8443/getSystemInfo")
            .then(res => res.json())
            .then(data => {
                // display system info
                os.textContent = data?.computerInfo?.OsName;
                memory.textContent = data?.physicalMemoryGB;
                processor.textContent = data?.processorInfo?.Name;
                videoGraphics.textContent = data?.videoControllerInfo?.Name;

                // hide loading
                loading.forEach(load => load.style.display = 'none');

                // save system info to local storage
                localStorage.setItem('systemInfo', JSON.stringify(data));
            })
            .catch(err => {
                console.error('Error:', error);
                sysInfo.style.display = 'none';
            });
    }
}

getSystemInfo();