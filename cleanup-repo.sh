#!/bin/bash

# Smart Machine Inventory - Repository Cleanup Script
# This script removes unnecessary files from the repository

echo "Starting repository cleanup..."

# Remove all .md files except README.md
echo "Removing unnecessary markdown files..."
find . -maxdepth 1 -type f -name "*.md" ! -name "README.md" -delete 2>/dev/null

# Remove log files
echo "Removing log files..."
rm -f *.log 2>/dev/null
rm -f *.txt 2>/dev/null
rm -f build_*.log 2>/dev/null
rm -f build_*.txt 2>/dev/null

# Remove PowerShell scripts
echo "Removing PowerShell scripts..."
rm -f *.ps1 2>/dev/null

# Remove SQL files
echo "Removing SQL files..."
rm -f *.sql 2>/dev/null

# Remove backup files
echo "Removing backup files..."
rm -f *.bak 2>/dev/null
rm -f *.old 2>/dev/null
rm -f *.backup 2>/dev/null

# Remove temporary files
echo "Removing temporary files..."
rm -f temp.* 2>/dev/null
rm -f *.tmp 2>/dev/null

# Remove utility scripts
echo "Removing utility scripts..."
rm -f assign-*.js 2>/dev/null
rm -f check-*.ts 2>/dev/null
rm -f verify-*.js 2>/dev/null
rm -f verify-*.ts 2>/dev/null
rm -f fix-*.js 2>/dev/null
rm -f list-*.js 2>/dev/null
rm -f find-*.js 2>/dev/null
rm -f set-*.js 2>/dev/null
rm -f update-*.js 2>/dev/null
rm -f cleanup-*.js 2>/dev/null
rm -f quick-*.js 2>/dev/null
rm -f server.ts 2>/dev/null
rm -f tunnel.js 2>/dev/null

# Remove backup API folder
echo "Removing backup folders..."
rm -rf api/ 2>/dev/null

# Remove legacy migrations folder
echo "Removing legacy migrations..."
rm -rf prisma/migrations_legacy/ 2>/dev/null

# Remove scripts that are one-time use
echo "Removing one-time scripts..."
rm -rf scripts/ 2>/dev/null

# Remove .next build folder (will be regenerated)
echo "Removing build cache..."
rm -rf .next/ 2>/dev/null

# Remove TypeScript build info
rm -f tsconfig.tsbuildinfo 2>/dev/null

echo ""
echo "✓ Cleanup complete!"
echo ""
echo "Files removed:"
echo "  - All .md files (except README.md)"
echo "  - All .log and .txt files"
echo "  - All .ps1 scripts"
echo "  - All .sql files"
echo "  - All backup files (.bak, .old, .backup)"
echo "  - All temporary files"
echo "  - All utility scripts (assign, check, verify, fix, etc.)"
echo "  - api/ folder"
echo "  - prisma/migrations_legacy/ folder"
echo "  - scripts/ folder"
echo "  - .next/ folder"
echo ""
echo "Next steps:"
echo "1. Review remaining files with: git status"
echo "2. Stage changes: git add ."
echo "3. Commit: git commit -m 'chore: clean up repository'"
echo "4. Push: git push origin main"
echo ""
