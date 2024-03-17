const TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const TOKEN_KEY = "userToken";

export const getToken = () => {
  const tokenWithDuration = localStorage.getItem(TOKEN_KEY);

  if (!tokenWithDuration) {
    return null;
  }

  const { token, storedAt, tokenDuration } = JSON.parse(tokenWithDuration);
  const duration = new Date().getTime() - storedAt;
  if (duration > (tokenDuration || TOKEN_DURATION)) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
};

export const saveToken = (token, tokenDuration) => {
  const storedAt = new Date().getTime();
  localStorage.setItem(
    TOKEN_KEY,
    JSON.stringify({ token, storedAt, tokenDuration })
  );
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};