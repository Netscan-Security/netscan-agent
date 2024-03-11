// 1000 * 30 // 30 seconds
const EXPIRATION_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export function getSystemInfo() {
    // get system info from local storage or fetch from server
    const systemInfo = localStorage.getItem('systemInfo');
    const storedAt = localStorage.getItem('systemInfoStoredAt');

    if (systemInfo && storedAt) {
        const duration = Date.now() - storedAt;
        if (duration < EXPIRATION_DURATION) {
            console.log('System Info:', JSON.parse(systemInfo));
            return JSON.parse(systemInfo);
        } else {
            localStorage.removeItem('systemInfo');
            localStorage.removeItem('systemInfoStoredAt');
        }
    }

    // use axios
    return axios.get("http://localhost:8443/getSystemInfo")
        .then(res => {
            const data = res.data;

            console.log('System Info:', data)
            // save system info to local storage
            localStorage.setItem('systemInfo', JSON.stringify(data));
            localStorage.setItem('systemInfoStoredAt', Date.now());
            return data;
        })
        .catch(err => {
            console.error('Error:', err);
            return null;
        });
}

export function getFromLocalStorage(key) {
    // get data from local storage, if the duration is not expired. If expired, return null and remove the data from local storage
    const data = localStorage.getItem(key);
    const storedAt = localStorage.getItem(`${key}StoredAt`);

    if (data && storedAt) {
        const duration = Date.now() - storedAt;
        if (duration < EXPIRATION_DURATION) {
            return JSON.parse(data);
        } else {
            localStorage.removeItem(key);
            localStorage.removeItem(`${key}StoredAt`);
            return null;
        }
    }

    return null;
}

export function storeToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    localStorage.setItem(`${key}StoredAt`, Date.now());
}