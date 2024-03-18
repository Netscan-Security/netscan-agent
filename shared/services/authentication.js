const api = require("../config/api");
const { API_URL } = require("../constants");

const LOGIN_ENDPOINT = "/auth/login";

const getUserData = async (token) => {
    const response = await api.get(
        `${API_URL}${USERDATA_ENDPOINT}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    if (!response.ok) {
        return null;
    }

    return response.data;
};

const login = async (
    email,
    password,
    remember30Days
) => {
    const response = await api.post(`${API_URL}${LOGIN_ENDPOINT}`, {
        email,
        password,
    });

    if (!response.ok) {
        console.log(response);
        throw new Error("Login failed");
    }

    // Once the login is successful, update the user state
    const userData =
        (response.data).user ||
        (await getUserData((response.data).access_token));

    if (!userData) {
        throw new Error("Incorrect email or password");
    }

    // setUser(userData);
    // saveToken(
    //     (response.data).access_token,
    //     remember30Days ? "2592000000" : undefined
    // );

    return {
        userData,
        token: (response.data).access_token,
    };
};

module.exports = {
    login,
};