# Add store filtering to API routes

$apiFiles = @(
    "src\app\api\monthly-schedule\route.ts",
    "src\app\api\tools\route.ts",
    "src\app\api\suppliers\route.ts"
)

foreach ($file in $apiFiles) {
    $fullPath = "d:\smart-machine-inventory\$file"
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Check if already has the import
        if ($content -notmatch "getStoreWhereClause") {
            # Add import after other imports
            $content = $content -replace '(import.*from.*permissions.*;)', "`$1`nimport { getStoreWhereClause } from `"@/lib/storeFilter`";"
            
            Set-Content $fullPath $content -NoNewline
            Write-Host "Updated: $file"
        } else {
            Write-Host "Already updated: $file"
        }
    } else {
        Write-Host "Not found: $file"
    }
}

Write-Host "`nImports added. Manual updates needed for each API endpoint."
