# Update all pages to include ADMIN_MANAGER role

$files = @(
    "src\app\inward\page.tsx",
    "src\app\outward\page.tsx",
    "src\app\machines\new\page.tsx",
    "src\app\maintenance\page.tsx",
    "src\app\production\page.tsx",
    "src\app\request\page.tsx",
    "src\app\schedules\page.tsx",
    "src\app\schedules\supplier\page.tsx",
    "src\app\schedules\tentative\page.tsx",
    "src\app\suppliers\new\page.tsx",
    "src\app\tools\new\page.tsx",
    "src\app\tools\page.tsx",
    "src\app\weekly-schedule\page.tsx",
    "src\app\qr\[machineId]\print\page.tsx"
)

foreach ($file in $files) {
    $fullPath = "d:\smart-machine-inventory\$file"
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Pattern 1: ["INWARD_PERSON", "ADMIN", "STORE_MANAGER"]
        $content = $content -replace '\["INWARD_PERSON", "ADMIN", "STORE_MANAGER"\]', '["INWARD_PERSON", "ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"]'
        
        # Pattern 2: ["OUTWARD_PERSON", "ADMIN", "STORE_MANAGER"]
        $content = $content -replace '\["OUTWARD_PERSON", "ADMIN", "STORE_MANAGER"\]', '["OUTWARD_PERSON", "ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"]'
        
        # Pattern 3: ["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"]
        $content = $content -replace '\["SUB_STORE_LOGIN", "ADMIN", "STORE_MANAGER"\]', '["SUB_STORE_LOGIN", "ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"]'
        
        # Pattern 4: ["ADMIN", "STORE_MANAGER"]
        $content = $content -replace '\["ADMIN", "STORE_MANAGER"\]', '["ADMIN", "ADMIN_MANAGER", "STORE_MANAGER"]'
        
        Set-Content $fullPath $content -NoNewline
        Write-Host "Updated: $file"
    } else {
        Write-Host "Not found: $file"
    }
}

Write-Host "`nAll files updated successfully!"
