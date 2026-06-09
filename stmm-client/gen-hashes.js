import bcrypt from 'bcryptjs';

const passwords = {
  SystemAdmin: 'Admin@123',
  Manager: 'Manager@123',
  Accountant: 'Accountant@123',
  Staff: 'Staff@123',
  Vendor: 'Vendor@123',
  Customer: 'Customer@123'
};

(async () => {
  for (const [role, pwd] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(pwd, 10);
    console.log(`${role}: ${hash}  (password: ${pwd})`);
  }
})();
