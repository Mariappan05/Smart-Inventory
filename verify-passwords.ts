import bcrypt from "bcrypt";

async function main() {
  const password = "admin123";
  const hashedPassword = "$2b$10$LT6pRzvW15f2HNGwuHVE3OPn6/YncrMOPaQf4pebEKW7mOxnyM63C";

  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log(`Password "admin123" matches hash: ${isValid}`);

  // Also test the employee password
  const employeePassword = "employee123";
  const employeeHashedPassword = "$2b$10$eag1pJSk1FENBJw9xpBtK.1mRwYx6vGEf3I7XIcPIV13L4rosp5Ce";
  const isEmployeeValid = await bcrypt.compare(employeePassword, employeeHashedPassword);
  console.log(`Password "employee123" matches hash: ${isEmployeeValid}`);

  process.exit(0);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
