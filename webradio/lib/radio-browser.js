import { resolveSrv as _resolveSrv } from 'dns';
import { promisify } from 'util';
const resolveSrv = promisify(_resolveSrv);

async function get_radiobrowser_base_urls() {
   const hosts = await resolveSrv('_api._tcp.radio-browser.info');
   hosts.sort();
   return hosts.map((host) => 'https://' + host.name);
}

async function get_radiobrowser_base_url_random() {
   const hosts = await get_radiobrowser_base_urls();
   var item = hosts[Math.floor(Math.random() * hosts.length)];
   return item;
}

export { get_radiobrowser_base_url_random };
