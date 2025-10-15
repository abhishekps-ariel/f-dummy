const environments = {
  development: {
    API_URL: import.meta.env.VITE_API_URL,
    GOOGLE_PLACES_API_KEY: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
  },
  production: {
    API_URL: import.meta.env.VITE_API_URL,
    GOOGLE_PLACES_API_KEY: import.meta.env.VITE_GOOGLE_PLACES_API_KEY,
  },
};

const ENV = import.meta.env.MODE || "development";

const Config = environments[ENV];

export default Config;
