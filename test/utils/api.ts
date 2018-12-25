import Axios from 'axios';
import { config } from '../../config/';

/**
 * used from admin 
 */
const axios = Axios.create({
    proxy: false,
    baseURL: `http://${config.serverListenAddr}:${config.serverPort}${config.serverAdminPath}`,
})

export default axios