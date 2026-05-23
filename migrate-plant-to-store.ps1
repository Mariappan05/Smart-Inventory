Write-Host "=== Database Schema Migration: Plant to Store ===" -ForegroundColor Cyan
Write-Host ""

# Check if Prisma is available
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Backing up current schema..." -ForegroundColor Yellow
Copy-Item "prisma\schema.prisma" "prisma\schema.prisma.backup" -Force
Write-Host "✓ Schema backed up to prisma\schema.prisma.backup" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Applying migration to database..." -ForegroundColor Yellow
Write-Host "This will rename Plant table to Store and update all foreign keys" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Do you want to proceed? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Migration cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Running migration..." -ForegroundColor Cyan
npx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Migration failed. Restoring backup..." -ForegroundColor Red
    Copy-Item "prisma\schema.prisma.backup" "prisma\schema.prisma" -Force
    Write-Host "Schema restored from backup" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 3: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Warning: Prisma client generation failed" -ForegroundColor Yellow
    Write-Host "You may need to restart your IDE or run 'npx prisma generate' manually" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server: npm run dev" -ForegroundColor White
Write-Host "2. Test the following features:" -ForegroundColor White
Write-Host "   - User management (stores assignment)" -ForegroundColor Gray
Write-Host "   - Store management" -ForegroundColor Gray
Write-Host "   - Schedule creation" -ForegroundColor Gray
Write-Host "   - Authentication" -ForegroundColor Gray
Write-Host ""
Write-Host "If you encounter issues, restore from backup:" -ForegroundColor Yellow
Write-Host "   Copy-Item prisma\schema.prisma.backup prisma\schema.prisma -Force" -ForegroundColor Gray
Write-Host ""
