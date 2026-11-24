# Run after every deploy:  powershell -ExecutionPolicy Bypass -File scripts\check-site.ps1
# Opens the live page, lists every /assets file it uses and checks that each one really is CSS / JavaScript
# (not the home page served by mistake). Add -Site https://www.plato-ar.com to check the other host.
param([string]$Site = 'https://plato-ar.com')

$stamp = [guid]::NewGuid().ToString('N')
$page = Invoke-WebRequest -UseBasicParsing -Uri "$Site/?c=$stamp" -Headers @{ 'Cache-Control' = 'no-cache' }
$files = [regex]::Matches($page.Content, '/assets/[^"''\s<>]+') | ForEach-Object { $_.Value } | Sort-Object -Unique
if (-not $files) { Write-Host 'No /assets files found in the page.' -ForegroundColor Red; exit 1 }

$bad = 0
foreach ($f in $files) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri ($Site + $f) -Headers @{ 'Cache-Control' = 'no-cache' }
    $type = [string]$r.Headers['Content-Type']
    $cache = [string]$r.Headers['cf-cache-status']
    $age = [string]$r.Headers['Age']
    $want = if ($f -match '\.css($|\?)') { 'text/css' } elseif ($f -match '\.js($|\?)') { 'javascript' } else { '' }
    $ok = ($type -notmatch 'text/html') -and ((-not $want) -or ($type -match $want))
  } catch { $type = $_.Exception.Message; $cache = ''; $age = ''; $ok = $false }
  if ($ok) { Write-Host ("OK   {0}  [{1}] {2} age={3}" -f $f, $type, $cache, $age) -ForegroundColor Green }
  else { $bad++; Write-Host ("BAD  {0}  [{1}] {2} age={3}" -f $f, $type, $cache, $age) -ForegroundColor Red }
}
if ($bad) { Write-Host "`n$bad file(s) are wrong. Purge exactly those URLs in Cloudflare (Caching > Configuration > Custom Purge), or roll back." -ForegroundColor Yellow; exit 1 }
Write-Host "`nAll files are fine." -ForegroundColor Green
