@echo off
REM Smart Machine Inventory - Repository Cleanup Script (Windows)
REM This script removes unnecessary files from the repository

echo Starting repository cleanup...
echo.

REM Remove all .md files except README.md
echo Removing unnecessary markdown files...
for %%f in (*.md) do (
    if not "%%f"=="README.md" (
        del /F /Q "%%f" 2>nul
    )
)

REM Remove log files
echo Removing log files...
del /F /Q *.log 2>nul
del /F /Q build_*.log 2>nul
del /F /Q build_*.txt 2>nul
del /F /Q *.txt 2>nul

REM Remove PowerShell scripts
echo Removing PowerShell scripts...
del /F /Q *.ps1 2>nul

REM Remove SQL files
echo Removing SQL files...
del /F /Q *.sql 2>nul

REM Remove backup files
echo Removing backup files...
del /F /Q *.bak 2>nul
del /F /Q *.old 2>nul
del /F /Q *.backup 2>nul

REM Remove temporary files
echo Removing temporary files...
del /F /Q temp.* 2>nul
del /F /Q *.tmp 2>nul

REM Remove utility scripts
echo Removing utility scripts...
del /F /Q assign-*.js 2>nul
del /F /Q check-*.ts 2>nul
del /F /Q verify-*.js 2>nul
del /F /Q verify-*.ts 2>nul
del /F /Q fix-*.js 2>nul
del /F /Q list-*.js 2>nul
del /F /Q find-*.js 2>nul
del /F /Q set-*.js 2>nul
del /F /Q update-*.js 2>nul
del /F /Q cleanup-*.js 2>nul
del /F /Q quick-*.js 2>nul
del /F /Q server.ts 2>nul
del /F /Q tunnel.js 2>nul

REM Remove backup API folder
echo Removing backup folders...
if exist api\ (
    rmdir /S /Q api 2>nul
)

REM Remove legacy migrations folder
echo Removing legacy migrations...
if exist prisma\migrations_legacy\ (
    rmdir /S /Q prisma\migrations_legacy 2>nul
)

REM Remove scripts folder
echo Removing one-time scripts...
if exist scripts\ (
    rmdir /S /Q scripts 2>nul
)

REM Remove .next build folder (will be regenerated)
echo Removing build cache...
if exist .next\ (
    rmdir /S /Q .next 2>nul
)

REM Remove TypeScript build info
if exist tsconfig.tsbuildinfo (
    del /F /Q tsconfig.tsbuildinfo 2>nul
)

echo.
echo ✓ Cleanup complete!
echo.
echo Files removed:
echo   - All .md files (except README.md)
echo   - All .log and .txt files
echo   - All .ps1 scripts
echo   - All .sql files
echo   - All backup files (.bak, .old, .backup)
echo   - All temporary files
echo   - All utility scripts (assign, check, verify, fix, etc.)
echo   - api\ folder
echo   - prisma\migrations_legacy\ folder
echo   - scripts\ folder
echo   - .next\ folder
echo.
echo Next steps:
echo 1. Review remaining files with: git status
echo 2. Stage changes: git add .
echo 3. Commit: git commit -m "chore: clean up repository"
echo 4. Push: git push origin main
echo.
pause
