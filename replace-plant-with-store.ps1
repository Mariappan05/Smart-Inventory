# Script to replace Plant with Store throughout the application
# Excludes: node_modules, .next, prisma schema (database model names)

$replacements = @(
    @{ Old = 'type Plant = '; New = 'type Store = ' }
    @{ Old = 'Plant\[\]'; New = 'Store[]' }
    @{ Old = 'plants\?:'; New = 'stores?:' }
    @{ Old = 'plants:'; New = 'stores:' }
    @{ Old = 'plants ='; New = 'stores =' }
    @{ Old = 'plants\)'; New = 'stores)' }
    @{ Old = '\{ plants \}'; New = '{ stores }' }
    @{ Old = 'Plant Name'; New = 'Store Name' }
    @{ Old = 'plant name'; New = 'store name' }
    @{ Old = 'Plant Location'; New = 'Store Location' }
    @{ Old = 'Plant:'; New = 'Store:' }
    @{ Old = 'assigned plant'; New = 'assigned store' }
    @{ Old = 'plant admin'; New = 'store admin' }
    @{ Old = 'Plant\s*\<'; New = 'Store <' }
    @{ Old = 'Select plant'; New = 'Select store' }
    @{ Old = 'No Plant'; New = 'No Store' }
    @{ Old = 'plant assignment'; New = 'store assignment' }
    @{ Old = 'Schedule Plant'; New = 'Schedule Store' }
)

$files = Get-ChildItem -Path "src" -Include *.tsx,*.ts -Recurse | Where-Object { 
    $_.FullName -notmatch 'node_modules' -and 
    $_.FullName -notmatch '\.next' -and
    $_.FullName -notmatch 'prisma'
}

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    foreach ($replacement in $replacements) {
        if ($content -match $replacement.Old) {
            $content = $content -replace $replacement.Old, $replacement.New
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nReplacement complete!"
