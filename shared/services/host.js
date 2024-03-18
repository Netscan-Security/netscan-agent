const api = require("../config/api");
const { API_URL } = require("../constants");

const HOST_ENDPOINT = '/host/register';

const registerHost = async (hostData) => {
    const response = await api.post(`${API_URL}${HOST_ENDPOINT}`, hostData);

    if (!response.ok) {
        console.log(response);
        throw new Error("Host registration failed");
    }

    // setHost(response.data);
    return {
        hostData: response.data,
        success: true
    }
}

module.exports = {
    registerHost
};