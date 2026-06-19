param(
  [string]$LogFile = "$env:TEMP\truzot-check.log"
)

$PASS = 0
$FAIL = 0

function Check {
  param(
    [string]$Name,
    [scriptblock]$ScriptBlock
  )
  Write-Host -NoNewline "  [$Name] ... "
  $output = & $ScriptBlock 2>&1 | Out-String
  if ($LASTEXITCODE -eq 0 -or -not $LASTEXITCODE) {
    Write-Host "PASS"
    $script:PASS++
  } else {
    Write-Host "FAIL"
    $script:FAIL++
    $output -split "`n" | Select-Object -Last 5 | ForEach-Object { Write-Host $_ }
    $output | Out-File -Append -FilePath $LogFile
  }
}

Write-Host "=== Truzot Pre-Deploy Verification ==="
Write-Host ""
Write-Host "Running checks..."

Check -Name "Unit Tests" -ScriptBlock { npx vitest run }
Check -Name "TypeScript Build" -ScriptBlock { npx next build }

Write-Host ""
Write-Host "Results: $PASS passed, $FAIL failed"
if ($FAIL -gt 0) {
  Write-Host "FAILURE: Some checks did not pass."
  exit 1
}
Write-Host "SUCCESS: All checks passed!"
