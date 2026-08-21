/**
 * End-to-End Encryption (E2EE) utilities using Web Crypto API.
 * 
 * Architecture:
 * 1. Each device generates an RSA-OAEP key pair.
 * 2. Public Key is exported and saved to the database profile.
 * 3. Private Key is exported and saved in localStorage.
 * 4. To send a message: Sender fetches Recipient's Public Key, generates an AES-GCM key,
 *    encrypts the message with AES, then encrypts the AES key with RSA.
 * 5. To receive a message: Recipient uses their Private Key to decrypt the AES key,
 *    then uses the AES key to decrypt the message.
 */

// Generate a new RSA KeyPair
export async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export CryptoKey to Base64 String
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey(
    key.type === "public" ? "spki" : "pkcs8",
    key
  );
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  return btoa(exportedAsString);
}

// Import Base64 String to CryptoKey
export async function importKey(base64Key: string, type: "public" | "private"): Promise<CryptoKey> {
  const binaryDerString = atob(base64Key);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    type === "public" ? "spki" : "pkcs8",
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    type === "public" ? ["encrypt"] : ["decrypt"]
  );
}

// Convert string to ArrayBuffer
function getMessageEncoding(text: string) {
  let enc = new TextEncoder();
  return enc.encode(text);
}

// Convert ArrayBuffer to string
function getMessageDecoding(buffer: ArrayBuffer) {
  let dec = new TextDecoder();
  return dec.decode(buffer);
}

export async function encryptMessage(text: string, recipientPublicKeyBase64: string) {
  if (!text) return null;
  
  // Import recipient's public key
  const publicKey = await importKey(recipientPublicKeyBase64, "public");

  // Generate a random AES-GCM key for this specific message
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Encrypt the message with AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = getMessageEncoding(text);
  const encryptedContent = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encodedText
  );

  // Export the AES key
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  // Encrypt the AES key with the recipient's RSA Public Key
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    exportedAesKey
  );

  // Return base64 payload
  return {
    iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
    encryptedAesKey: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedAesKey)))),
    ciphertext: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedContent))))
  };
}

export async function decryptMessage(
  payload: { iv: string; encryptedAesKey: string; ciphertext: string },
  myPrivateKeyBase64: string
) {
  try {
    const privateKey = await importKey(myPrivateKeyBase64, "private");

    // Decrypt the AES key using my RSA Private Key
    const encryptedAesKeyBuffer = new Uint8Array(atob(payload.encryptedAesKey).split("").map(c => c.charCodeAt(0)));
    const exportedAesKey = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedAesKeyBuffer
    );

    // Import the AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      exportedAesKey,
      {
        name: "AES-GCM",
      },
      true,
      ["decrypt"]
    );

    // Decrypt the message content
    const iv = new Uint8Array(atob(payload.iv).split("").map(c => c.charCodeAt(0)));
    const ciphertextBuffer = new Uint8Array(atob(payload.ciphertext).split("").map(c => c.charCodeAt(0)));
    
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      ciphertextBuffer
    );

    return getMessageDecoding(decryptedContent);
  } catch (error) {
    console.error("Decryption failed", error);
    return "[Encrypted Message - Unable to Decrypt]";
  }
}

// Multi-Recipient E2EE Protocol
export async function encryptPayload(
  payloadObj: any,
  publicKeysBase64: string[]
) {
  const payloadStr = JSON.stringify(payloadObj);
  const encodedText = getMessageEncoding(payloadStr);

  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encodedText
  );

  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

  const encryptedKeys = await Promise.all(publicKeysBase64.map(async (pubKeyStr) => {
    try {
      const pubKey = await importKey(pubKeyStr, "public");
      const encryptedKey = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, exportedAesKey);
      return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedKey))));
    } catch(e) {
      return null;
    }
  }));

  return {
    iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
    ciphertext: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedContent)))),
    encryptedAesKeys: encryptedKeys
  };
}

export async function decryptPayload(
  payload: { iv: string; ciphertext: string; encryptedAesKeys: (string | null)[] },
  myPrivateKeyBase64: string,
  keyIndex: number
) {
  try {
    const encryptedAesKeyStr = payload.encryptedAesKeys[keyIndex];
    if (!encryptedAesKeyStr) return null;

    const privateKey = await importKey(myPrivateKeyBase64, "private");
    const encryptedAesKeyBuffer = new Uint8Array(atob(encryptedAesKeyStr).split("").map(c => c.charCodeAt(0)));
    
    const exportedAesKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedAesKeyBuffer
    );

    const aesKey = await window.crypto.subtle.importKey(
      "raw", exportedAesKey, { name: "AES-GCM" }, true, ["decrypt"]
    );

    const iv = new Uint8Array(atob(payload.iv).split("").map(c => c.charCodeAt(0)));
    const ciphertextBuffer = new Uint8Array(atob(payload.ciphertext).split("").map(c => c.charCodeAt(0)));
    
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      ciphertextBuffer
    );

    const decodedStr = getMessageDecoding(decryptedContent);
    return JSON.parse(decodedStr);
  } catch (error) {
    console.error("Payload decryption failed", error);
    return null;
  }
}

// --- Master Password Key Backup ---

// Derive an AES-GCM key from a password using PBKDF2
export async function deriveKeyFromPassword(password: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const saltBuffer = new Uint8Array(atob(saltBase64).split("").map(c => c.charCodeAt(0)));

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt the Private Key string using a Master Password
export async function encryptPrivateKeyWithPassword(privateKeyBase64: string, password: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const saltBase64 = btoa(String.fromCharCode.apply(null, Array.from(salt)));

  const aesKey = await deriveKeyFromPassword(password, saltBase64);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(privateKeyBase64);
  
  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    encodedText
  );

  return {
    salt: saltBase64,
    iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
    ciphertext: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(encryptedContent))))
  };
}

// Decrypt the Private Key string using a Master Password
export async function decryptPrivateKeyWithPassword(
  payload: { salt: string; iv: string; ciphertext: string },
  password: string
) {
  try {
    const aesKey = await deriveKeyFromPassword(password, payload.salt);

    const iv = new Uint8Array(atob(payload.iv).split("").map(c => c.charCodeAt(0)));
    const ciphertextBuffer = new Uint8Array(atob(payload.ciphertext).split("").map(c => c.charCodeAt(0)));

    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decryptedContent);
  } catch (error) {
    console.error("Master password decryption failed", error);
    return null;
  }
}
