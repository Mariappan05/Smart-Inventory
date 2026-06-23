@echo off
echo Installing security dependencies...
npm install

echo.
echo Security setup complete!
echo.
echo Next steps:
echo 1. Update .env file with secure values
echo 2. Change JWT_SECRET to a strong random string (32+ characters)
echo 3. Run: npm run dev
echo.
pause
