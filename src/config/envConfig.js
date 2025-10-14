const environments = {
  development: {
    API_URL: "http://filir.arielsoftwares.in",
    GOOGLE_PLACES_API_KEY: "AIzaSyCHy-JXTkhWpDkgk2JROHyats8zV86_UQc",
  },
  production: {
    API_URL: "https://filir.arielsoftwares.in",
    GOOGLE_PLACES_API_KEY: "YOUR_GOOGLE_PLACES_API_KEY_HERE",
  },
};

const ENV = "development";


const Config = environments[ENV];

export default Config;
