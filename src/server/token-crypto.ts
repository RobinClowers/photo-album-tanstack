/**
 * AES-GCM sealing for the Google tokens stored in `google_authorizations`.
 * The key is the `TOKEN_ENCRYPTION_KEY` secret: 32 random bytes, base64
 * encoded (`openssl rand -base64 32`). Output is `v1.<iv>.<ciphertext>` in
 * base64url so a rotated format can be recognised later.
 */
const VERSION = 'v1'
const IV_BYTES = 12

function base64urlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Binary string → bytes backed by a plain ArrayBuffer (what WebCrypto wants). */
function bytesOf(binary: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function base64urlDecode(text: string): Uint8Array<ArrayBuffer> {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/')
  return bytesOf(atob(padded + '='.repeat((4 - (padded.length % 4)) % 4)))
}

export async function importTokenKey(secret: string): Promise<CryptoKey> {
  const raw = bytesOf(atob(secret.trim()))
  if (raw.byteLength !== 32) {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must be 32 random bytes, base64 encoded (openssl rand -base64 32)',
    )
  }
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

export async function seal(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  return `${VERSION}.${base64urlEncode(iv)}.${base64urlEncode(new Uint8Array(ciphertext))}`
}

export async function open(key: CryptoKey, sealed: string): Promise<string> {
  const [version, iv, ciphertext] = sealed.split('.')
  if (version !== VERSION || !iv || !ciphertext) {
    throw new Error('Unrecognised sealed token format')
  }
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64urlDecode(iv) },
    key,
    base64urlDecode(ciphertext),
  )
  return new TextDecoder().decode(plaintext)
}
