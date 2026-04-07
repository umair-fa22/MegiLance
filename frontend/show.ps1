
$errs = @(
  "app\components\templates\Layout\PublicFooter\PublicFooter.tsx",
  "app\components\templates\Layout\PublicHeader\PublicHeader.tsx",
  "components\ui\DataTable.tsx",
  "components\ui\StatusBadge.tsx"
)
foreach ($f in $errs) {
  Write-Host "FILE: $f"
  Get-Content "E:\MegiLance\frontend\$f" -Head 15
}

