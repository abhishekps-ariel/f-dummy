const environments = {
  development: {
    API_URL: "http://filir.arielsoftwares.in",
  },
  production: {
    API_URL: "https://filir.arielsoftwares.in",
  },
};

const ENV = import.meta.env.MODE || "development";


const Config = environments[ENV];

export default Config;
