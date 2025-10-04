
/*
 Copyright (C) 2023 Øyvind Hanssen, LA7ECA, ohanssen@acm.org

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published
 by the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

/** @namespace */
var pol = pol || {};
pol.security = pol.security || {};


/* Base-64 encoding */
pol.security.bin2base64 = function(arr) {
    const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; // base64 alphabet
    const bin = n => n.toString(2).padStart(8,0); // convert num to 8-bit binary string
    const l = arr.length
    let result = '';

    for(let i=0; i<=(l-1)/3; i++) {
        let c1 = i*3+1>=l; // case when "=" is on end
        let c2 = i*3+2>=l; // case when "=" is on end
        let chunk = bin(arr[3*i]) + bin(c1? 0:arr[3*i+1]) + bin(c2? 0:arr[3*i+2]);
        let r = chunk.match(/.{1,6}/g).map((x,j)=> j==3&&c2 ? '=' :(j==2&&c1 ? '=':abc[+('0b'+x)]));
        result += r.join('');
    }
    return result;
}


pol.security.hmac_getKey = async function(secret) {
    const enc = new TextEncoder("utf-8");
    const algorithm = { name: "HMAC", hash: "SHA-256" };
    const _key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secret),
        algorithm,
        false, ["sign", "verify"]
    );
    return _key;
}


/* Generate a hmac-sha256 hash from key and message */
pol.security.hmac_Sha256_B64 = async function(key, message) {
    const enc = new TextEncoder("utf-8");
    const algorithm = { name: "HMAC", hash: "SHA-256" };
    const hashBuffer = await crypto.subtle.sign(
        algorithm.name,
        key,
        enc.encode(message)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = pol.security.bin2base64(hashArray);
    return hashHex;
}



/* Generate a MD5 hash from key and message */
pol.security.Sha256_B64 = async function(message) {
    const enc = new TextEncoder("utf-8");
    const hashBuffer = await crypto.subtle.digest("SHA-256", enc.encode(message));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = await pol.security.bin2base64(hashArray);
    return hashHex;
}



pol.security.getRandom = function(n) {
    /* 8 bytes is 64 bits */
    const rnd = new Uint8Array(n);
    crypto.getRandomValues(rnd);
    return pol.security.bin2base64(rnd);
}

