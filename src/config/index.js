import devConfig from './config.dev';
import prodConfig from './config.prod';

const ENV = import.meta.env.MODE || 'development';

const Config = ENV === 'production' ? prodConfig : devConfig;

export default Config;
