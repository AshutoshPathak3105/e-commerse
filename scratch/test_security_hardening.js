const sanitizeInput = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(sanitizeInput);
  const clean = {};
  for (const key of Object.keys(payload)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = sanitizeInput(payload[key]);
  }
  return clean;
};

// Test 1: NoSQL Injection attempt
const attack = {
  email: { '$gt': '' },
  password: { '$ne': null },
  validField: 'customer@example.com',
  nested: {
    '$where': 'sleep(5000)',
    validKey: 42
  }
};

const sanitized = sanitizeInput(attack);
console.log('Sanitized Output:', JSON.stringify(sanitized, null, 2));

const testPassed = !sanitized.email['$gt'] &&
  !sanitized.password['$ne'] &&
  sanitized.validField === 'customer@example.com' &&
  !sanitized.nested['$where'] &&
  sanitized.nested.validKey === 42;

console.log('NoSQL Security Test Passed:', testPassed);
if (!testPassed) process.exit(1);

// Test 2: CORS Origin Checking
const trustedOrigins = [
  'http://localhost:8000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'https://e-commerse-4xlp.onrender.com',
  'https://beautiful-druid-f9f6aa.netlify.app',
  'https://phenomenal-zuccutto-36b29b.netlify.app',
];

const checkCors = (origin, env) => {
  if (!origin) return true;
  if (env !== 'production' || trustedOrigins.includes(origin)) return true;
  return false;
};

console.log('Allowed Netlify:', checkCors('https://beautiful-druid-f9f6aa.netlify.app', 'production'));
console.log('Blocked Hacker Site:', !checkCors('https://evil-hacker.com', 'production'));
console.log('Allowed Localhost in dev:', checkCors('http://localhost:8000', 'development'));

if (!checkCors('https://beautiful-druid-f9f6aa.netlify.app', 'production') ||
    checkCors('https://evil-hacker.com', 'production')) {
  console.error('CORS test failed!');
  process.exit(1);
}

console.log('All Security Verifications Passed Successfully!');
