const HOST_DATA_KEY = "hostData";

export const setHost = (hostdata) => {
    localStorage.setItem(HOST_DATA_KEY, JSON.stringify(hostdata));
}

export const getHost = () => {
    return JSON.parse(localStorage.getItem(HOST_DATA_KEY));
}

export const removeHost = () => {
    localStorage.removeItem(HOST_DATA_KEY);
}