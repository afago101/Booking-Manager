// JWT signing for Google Service Account authentication using WebCrypto

export async function signJWT(
  payload: Record<string, any>,
  privateKeyPem: string
): Promise<string> {
  // Extract the key content
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKeyPem
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');

  // Convert base64 to binary
  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  // Import the private key
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Create JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // Sign
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signatureInputBuffer = new TextEncoder().encode(signatureInput);
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signatureInputBuffer
  );

  // Encode signature
  const encodedSignature = base64UrlEncode(signatureBuffer);

  // Return complete JWT
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  
  if (typeof data === 'string') {
    const bytes = new TextEncoder().encode(data);
    base64 = btoa(String.fromCharCode(...bytes));
  } else {
    const bytes = new Uint8Array(data);
    base64 = btoa(String.fromCharCode(...bytes));
  }

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function getGoogleAccessToken(
  clientEmail: string,
  privateKey: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const jwtPayload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: expiry,
    iat: now,
  };

  const jwt = await signJWT(jwtPayload, privateKey);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json<{ access_token: string }>();
  return data.access_token;
}

