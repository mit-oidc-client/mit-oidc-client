/**
 * Crytographically secure random bytes generator
 * 
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
 */
function generateRandomBytes(num_bytes:number){
    const random_num = new Uint8Array(num_bytes);
    window.crypto.getRandomValues(random_num);
    return random_num;
}

/**
 * Convert a byte to its hex representation
 * 
 * Code taken from: https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
 */
function byteToHex(byte: number) {
    // convert the possibly signed byte (-128 to 127) to an unsigned byte (0 to 255).
    // if you know, that you only deal with unsigned bytes (Uint8Array), you can omit this line
    const unsignedByte = byte & 0xff;
    // If the number can be represented with only 4 bits (0-15), 
    // the hexadecimal representation of this number is only one char (0-9, a-f). 
    if (unsignedByte < 16) {
      return '0' + unsignedByte.toString(16);
    } else {
      return unsignedByte.toString(16);
    }
  }

/**
 * Convert a byte array to its hex representation as a single string
 * 
 * Code taken from: https://stackoverflow.com/questions/34309988/byte-array-to-hex-string-conversion-in-javascript
 */
  function toHexString(bytes:Uint8Array) {
    // Since the .map() method is not available for typed arrays, 
    // we will convert the typed array to an array using Array.from().
    return Array.from(bytes)
      .map(byte => byteToHex(byte))
      .join('');
}

export { generateRandomBytes, toHexString }