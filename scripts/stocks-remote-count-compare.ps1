param(
  [string]$DbHost = "",
  [int]$DbPort = 0,
  [string]$DbName = "",
  [string]$DbUser = "",
  [string]$DbPassword = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-EnvVarFromFile {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$Key
  )

  if (-not (Test-Path $FilePath)) {
    return $null
  }

  $line = Get-Content $FilePath | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
  if (-not $line) {
    return $null
  }

  return ($line -split "=", 2)[1].Trim()
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$powerSyncEnv = Join-Path $repoRoot "powersync\.env"

if ([string]::IsNullOrWhiteSpace($DbHost)) {
  $DbHost = Get-EnvVarFromFile -FilePath $powerSyncEnv -Key "PS_KHUB_DB_HOST"
}
if ($DbPort -le 0) {
  $DbPortRaw = Get-EnvVarFromFile -FilePath $powerSyncEnv -Key "PS_KHUB_DB_PORT"
  if ($DbPortRaw) {
    $DbPort = [int]$DbPortRaw
  }
}
if ([string]::IsNullOrWhiteSpace($DbName)) {
  $DbName = Get-EnvVarFromFile -FilePath $powerSyncEnv -Key "PS_KHUB_DB_NAME"
}
if ([string]::IsNullOrWhiteSpace($DbUser)) {
  $DbUser = Get-EnvVarFromFile -FilePath $powerSyncEnv -Key "PS_KHUB_DB_USER"
}
if ([string]::IsNullOrWhiteSpace($DbPassword)) {
  $DbPassword = Get-EnvVarFromFile -FilePath $powerSyncEnv -Key "PS_KHUB_DB_PASSWORD"
}

if (
  [string]::IsNullOrWhiteSpace($DbHost) -or
  $DbPort -le 0 -or
  [string]::IsNullOrWhiteSpace($DbName) -or
  [string]::IsNullOrWhiteSpace($DbUser) -or
  [string]::IsNullOrWhiteSpace($DbPassword)
) {
  throw "Missing DB connection settings. Provide params or set values in powersync/.env."
}

$dsn = "host=$DbHost port=$DbPort dbname=$DbName user=$DbUser password=$DbPassword"

$sql = @'
WITH sbs AS (
  SELECT
    s.product_id,
    s.channel_id,
    SUM(CASE WHEN s.status NOT IN (7, 9, 10, 11) THEN s.qty ELSE 0 END) AS total_qty,
    SUM(CASE WHEN s.status = 6 THEN s.qty ELSE 0 END) AS available_qty,
    SUM(CASE WHEN s.status = 8 THEN s.qty ELSE 0 END) AS damage_qty
  FROM stocks s
  GROUP BY s.product_id, s.channel_id
),
base AS (
  SELECT
    sbs.*,
    p.status,
    p.deleted_at,
    p.name,
    p.sku,
    p.upc,
    p.brand_id
  FROM sbs
  JOIN products p ON p.id = sbs.product_id
)
SELECT *
FROM (
  SELECT 'tc01_default_active' AS case_id, COUNT(*)::int AS cnt
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL

  UNION ALL
  SELECT 'tc02_status_inactive', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (2) AND b.deleted_at IS NULL

  UNION ALL
  SELECT 'tc03_status_archived', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.deleted_at IS NOT NULL

  UNION ALL
  SELECT 'tc04_status_active_archived', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND (b.status IN (1, 3) OR b.deleted_at IS NOT NULL)

  UNION ALL
  SELECT 'tc05_out_of_stock', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL AND COALESCE(b.available_qty, 0) = 0

  UNION ALL
  SELECT 'tc06_has_damaged', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL AND COALESCE(b.damage_qty, 0) <> 0

  UNION ALL
  SELECT 'tc07_brand_11', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL AND b.brand_id IN (11)

  UNION ALL
  SELECT 'tc08_category_10', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM categories_products cp
      WHERE cp.product_id = b.product_id AND cp.category_id IN (10)
    )

  UNION ALL
  SELECT 'tc09_brand11_category10', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL AND b.brand_id IN (11)
    AND EXISTS (
      SELECT 1
      FROM categories_products cp
      WHERE cp.product_id = b.product_id AND cp.category_id IN (10)
    )

  UNION ALL
  SELECT 'tc10_search_mock', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL
    AND (
      LOWER(COALESCE(b.name, '')) LIKE '%mock%' OR
      LOWER(COALESCE(b.sku, '')) LIKE '%mock%' OR
      LOWER(COALESCE(b.upc, '')) LIKE '%mock%'
    )

  UNION ALL
  SELECT 'tc11_search_not_found', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL
    AND (
      LOWER(COALESCE(b.name, '')) LIKE '%__no_such_product__%' OR
      LOWER(COALESCE(b.sku, '')) LIKE '%__no_such_product__%' OR
      LOWER(COALESCE(b.upc, '')) LIKE '%__no_such_product__%'
    )

  UNION ALL
  SELECT 'tc12_brand11_out_of_stock', COUNT(*)::int
  FROM base b
  WHERE b.channel_id IN (1) AND b.status IN (1) AND b.deleted_at IS NULL AND b.brand_id IN (11) AND COALESCE(b.available_qty, 0) = 0
) q
ORDER BY case_id;
'@

$expected = @{
  tc01_default_active = 23
  tc02_status_inactive = 0
  tc03_status_archived = 0
  tc04_status_active_archived = 24
  tc05_out_of_stock = 5
  tc06_has_damaged = 0
  tc07_brand_11 = 6
  tc08_category_10 = 5
  tc09_brand11_category10 = 0
  tc10_search_mock = 18
  tc11_search_not_found = 0
  tc12_brand11_out_of_stock = 0
}

$rawRows = $sql | docker run --rm -i postgres:16 psql $dsn -t -A -F ","

if (-not $rawRows) {
  throw "No rows returned from remote DB."
}

Write-Host "Remote count parity check (against app debug expected counts):"
Write-Host "-----------------------------------------------------------"

$hasMismatch = $false
foreach ($row in $rawRows) {
  $parts = $row.Trim().Split(",")
  if ($parts.Length -lt 2) {
    continue
  }

  $caseId = $parts[0].Trim()
  $remoteCount = [int]$parts[1].Trim()
  $expectedCount = if ($expected.ContainsKey($caseId)) { [int]$expected[$caseId] } else { -999999 }
  $result = if ($remoteCount -eq $expectedCount) { "PASS" } else { "FAIL" }
  if ($result -eq "FAIL") {
    $hasMismatch = $true
  }

  Write-Host ("{0,-28} remote={1,-3} expected={2,-3} result={3}" -f $caseId, $remoteCount, $expectedCount, $result)
}

if ($hasMismatch) {
  Write-Host "-----------------------------------------------------------"
  throw "One or more case counts mismatch. Update app expected counts or verify query semantics."
}

Write-Host "-----------------------------------------------------------"
Write-Host "All remote case counts match app debug expected counts."
