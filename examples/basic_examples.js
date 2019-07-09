const crypto = require('crypto');
const jwt = require('../index.js');

const key = crypto.randomBytes(64);

const payload = {
  iss: 'auth.mydomain.com',
  aud: 'A1B2C3D4E5.com.mydomain.myservice',
  sub: 'jack.sparrow@example.com',
  info: 'Hello World!',
  list: [1, 2, 3, 4]
};

console.log('\nTOKEN GENERATED/VERIFIED WITH INDIVIDUAL KEY\n');

let token = jwt.generate('HS512', payload, key);
console.log('Sample JWS token (HS512)\n');
console.log(token);

let parsed = jwt.parse(token).verify(key);
console.log('\nToken is valid:', parsed.valid);
console.log('\nHeader:\n');
console.log(parsed.header);
console.log('\nPayload:\n');
console.log(parsed.payload);

console.log('\nTOKEN GENERATED/VERIFIED WITH KEY FROM KEYSTORE\n');

let keystore = {
  'e5739df2261c8a0ed41715e7f62cc295': 'SATKcp7AMnCg0YdEBPIcgknBplYttePtQoRddpJjyVak9F5vEp/7pL0Q1236MkVQd7nIXGoaPt4w1dlrpEmY4A==',
  'f0fd89c4abe83811ee9afa92d0d687f7': '6Bzisgmhj9LGJDNjx/WBNRUsnZA8pXRpVxB7Pf8ar29XI158V4+t1GEqkCl5MYZhcOMTi5fa3yYr0Vcya6vUkA==',
  '20e009a52cd91dc7dc7a8d7da525fed5': '+PC/htwSB6pz4VRTcGL1iN74xlqoX6Q2oilsraVvSVefL+lr0tW1+/pOGQpdZpXtN20DjfbC0s4rHYZD2z924Q=='
};

token = jwt.generate('HS512', payload, keystore, 'f0fd89c4abe83811ee9afa92d0d687f7');
console.log('Sample JWS token (HS512)\n');
console.log(token);

parsed = jwt.parse(token).verify(keystore);
console.log('\nToken is valid:', parsed.valid);
console.log('\nHeader:\n');
console.log(parsed.header);

console.log('\nVERIFICATION KEY NOT FOUND IN KEYSTORE\n');

token = jwt.generate('HS512', payload, keystore, 'f0fd89c4abe83811ee9afa92d0d687f7');

delete keystore['f0fd89c4abe83811ee9afa92d0d687f7'];

parsed = jwt.parse(token).verify(keystore);
console.log(parsed.error);

console.log('\nTOKEN USING UNWANTED ALGORITHM\n');

token = jwt.generate('HS256', payload, key);

parsed = jwt.parse(token)
            .setAlgorithmList(['HS384', 'HS512'])
            .verify(key);

console.log(parsed.error);

console.log('\nPARSING AND VERIFICATION AS SEPARATE STEPS - JWS EXAMPLE\n');

token = jwt.generate('HS512', payload, key);

parsed = jwt.parse(token);
console.log('\nHeader after parsing:\n');
console.log(parsed.header);
console.log('\nPayload after parsing:\n');
console.log(parsed.payload);

parsed.setTokenLifetime(600).verify(key);
console.log('\nHeader after verification (unchanged):\n');
console.log(parsed.header);
console.log('\nPayload after verification (unchanged):\n');
console.log(parsed.payload);

console.log('\nPARSING AND VERIFICATION AS SEPARATE STEPS - JWE EXAMPLE\n');

token = jwt.generate('A256KW', 'A256GCM', payload, key);

parsed = jwt.parse(token);
console.log('\nHeader after parsing:\n');
console.log(parsed.header);
console.log('\nPayload after parsing:\n');
console.log(parsed.payload);

parsed.setTokenLifetime(600).verify(key);
console.log('\nHeader after verification (unchanged) :\n');
console.log(parsed.header);
console.log('\nPayload after verification (now visible):\n');
console.log(parsed.payload);

console.log('\nEXPIRED TOKEN\n');

token = jwt.generate('HS512', payload, key);

setTimeout(() => {
  parsed = jwt.parse(token).setTokenLifetime(3).verify(key);
  console.log('Expired:', parsed.expired);
}, 5000);
