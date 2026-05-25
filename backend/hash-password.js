import bcryptjs from 'bcryptjs';

// Get password from command line arguments
const password = process.argv[2];

if (!password) {
  console.error('Please provide a password as an argument');
  console.error('Usage: node hash-password.js "your-password-here"');
  process.exit(1);
}

async function hashPassword() {
  const hashed = await bcryptjs.hash(password, 10);
  console.log('\n=== Hashed Password ===');
  console.log(hashed);
  console.log('\n=== SQL to Create Account ===');
  console.log(`
INSERT INTO users (id, email, password, first_name, last_name, role, status, membership_status)
VALUES (
  gen_random_uuid(),
  'your-email@example.com',  -- Replace with your email
  '${hashed}',
  'First',                   -- Replace with first name
  'Last',                    -- Replace with last name
  'admin',                   -- Or 'staff' for staff account
  'active',
  'approved'
);
`);
}

hashPassword().catch(console.error);
