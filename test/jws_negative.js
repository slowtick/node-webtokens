const fs = require('fs');
const crypto = require('crypto');
const jwt = require('../index.js');
const buf2b64url = require('../lib/common.js').buf2b64url;

const KEYS_DIR = __dirname + '/pem_keys/';

const simKey = crypto.randomBytes(64);
const priRsa = fs.readFileSync(KEYS_DIR + 'priRsa.key');
const pubRsa = fs.readFileSync(KEYS_DIR + 'pubRsa.key');
const priEc256 = fs.readFileSync(KEYS_DIR + 'priEc256.key');
const pubEc256 = fs.readFileSync(KEYS_DIR + 'pubEc256.key');
const priEc384 = fs.readFileSync(KEYS_DIR + 'priEc384.key');
const pubEc384 = fs.readFileSync(KEYS_DIR + 'pubEc384.key');
const priEc521 = fs.readFileSync(KEYS_DIR + 'priEc521.key');
const pubEc521 = fs.readFileSync(KEYS_DIR + 'pubEc521.key');

const payload = {
  iss: 'auth.mydomain.com',
  aud: 'A1B2C3D4E5.com.mydomain.myservice',
  sub: 'jack.sparrow@example.com',
  info: 'Hello World!',
  list: [1, 2, 3, 4]
};

const tests = [
  {alg: 'HS256', sKey: simKey, vKey: simKey},
  {alg: 'HS384', sKey: simKey, vKey: simKey},
  {alg: 'HS512', sKey: simKey, vKey: simKey},
  {alg: 'RS256', sKey: priRsa, vKey: pubRsa},
  {alg: 'RS384', sKey: priRsa, vKey: pubRsa},
  {alg: 'RS512', sKey: priRsa, vKey: pubRsa},
  {alg: 'ES256', sKey: priEc256, vKey: pubEc256},
  {alg: 'ES384', sKey: priEc384, vKey: pubEc384},
  {alg: 'ES512', sKey: priEc521, vKey: pubEc521}
];

let token;
let validToken;
let parsed;
let key;

for (let test of tests) {
  console.log(`\n${test.alg}`);
  validToken = jwt.generate(test.alg, payload, test.sKey);
  // no alg in header
  token = removeAlgFromHeader(validToken);
  parsed = jwt.parse(token).verify(test.vKey);
  if (parsed.error &&
      parsed.error.message.includes('Missing or invalid alg claim in header')) {
    console.log(`[OK] missing alg claim`);
  } else {
    console.log(`[NOK] missing alg claim`);
    console.log(parsed);
    process.exit();
  }

  // unrecognized alg in header
  token = messupAlgInHeader(validToken);
  parsed = jwt.parse(token).verify(test.vKey);
  if (parsed.error && parsed.error.message.includes('Unrecognized algorithm')) {
    console.log(`[OK] unrecognized alg claim`);
  } else {
    console.log(`[NOK] unrecognized alg claim`);
    console.log(parsed);
    process.exit();
  }

  // unwanted alg in header
  parsed = jwt.parse(validToken)
              .setAlgorithmList(['dummy1', 'dummy2'])
              .verify(test.vKey);
  if (parsed.error && parsed.error.message.includes('Unwanted algorithm')) {
    console.log(`[OK] unwanted alg claim`);
  } else {
    console.log(`[NOK] unwanted alg claim`);
    console.log(parsed);
    process.exit();
  }

  // tampered header
  token = tamperHeader(validToken);
  parsed = jwt.parse(token).verify(test.vKey);
  if (parsed.error && parsed.error.message.includes('Integrity check failed')) {
    console.log(`[OK] tampered header`);
  } else {
    console.log(`[NOK] tampered header`);
    console.log(parsed);
    process.exit();
  }

  // tampered payload
  token = tamperPayload(validToken);
  parsed = jwt.parse(token).verify(test.vKey);
  if (parsed.error && parsed.error.message.includes('Integrity check failed')) {
    console.log(`[OK] tampered payload`);
  } else {
    console.log(`[NOK] tampered payload`);
    console.log(parsed);
    process.exit();
  }

  // check with wrong key
  key = messupVerificationKey(test.vKey);
  parsed = jwt.parse(token).verify(test.vKey);
  if (parsed.error && parsed.error.message.includes('Integrity check failed')) {
    console.log(`[OK] wrong key`);
  } else {
    console.log(`[NOK] wrong key`);
    console.log(parsed);
    process.exit();
  }

  // check with invalid key type
  key = messupVerificationKeyType(test.vKey);
  parsed = jwt.parse(token).verify(test.vKey);
  if (parsed.error && parsed.error.message.includes('Integrity check failed')) {
    console.log(`[OK] wrong key type`);
  } else {
    console.log(`[NOK] wrong key type`);
    console.log(parsed);
    process.exit();
  }

  // check with invalid key length
  key = messupVerificationKeyLength(test.vKey);
  parsed = jwt.parse(token).verify(test.vKey);
  if (parsed.error && parsed.error.message.includes('Integrity check failed')) {
    console.log(`[OK] wrong key length`);
  } else {
    console.log(`[NOK] wrong key length`);
    console.log(parsed);
    process.exit();
  }
}


function removeAlgFromHeader(token) {
  let parts = token.split('.');
  let header = JSON.parse(Buffer.from(parts[0], 'base64'));
  delete header.alg;
  let newHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  return `${buf2b64url(newHeader)}.${parts[1]}.${parts[2]}`;
}

function messupAlgInHeader(token) {
  let parts = token.split('.');
  let header = JSON.parse(Buffer.from(parts[0], 'base64'));
  header.alg = 'dummy';
  let newHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  return `${buf2b64url(newHeader)}.${parts[1]}.${parts[2]}`;
}

function tamperHeader(token) {
  let parts = token.split('.');
  let header = JSON.parse(Buffer.from(parts[0], 'base64'));
  header.extra = 'dummy';
  let newHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  return `${buf2b64url(newHeader)}.${parts[1]}.${parts[2]}`;
}

function tamperPayload(token) {
  let parts = token.split('.');
  let payload = JSON.parse(Buffer.from(parts[1], 'base64'));
  payload.extra = 'dummy';
  let dummyPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `${buf2b64url(parts[0])}.${dummyPayload}.${parts[2]}`;
}

function messupVerificationKey(key) {
  let wrongKey = Buffer.from(key);
  wrongKey[0] ^= 1;
  return wrongKey;
}

function messupVerificationKeyType(key) {
  return key.toString('hex');
}

function messupVerificationKeyLength(key) {
  let len = key.length;
  return key.slice(0, len / 2);
}
