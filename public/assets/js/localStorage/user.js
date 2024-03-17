const USER_DATA_KEY = "userData";

export const setUser = (user) => {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
}

export const getUser = () => {
    return JSON.parse(localStorage.getItem(USER_DATA_KEY));
}

export const removeUser = () => {
    localStorage.removeItem(USER_DATA_KEY);
}