import Cloudflare from 'cloudflare';
import {getCLOUDFLARE_API_KEY} from '../constants.js';

export const getClient = () => new Cloudflare({apiToken: getCLOUDFLARE_API_KEY()});
