# Bulk-adds the curated host picks for the 52 Richardson Ave gathering.
# Edit $slug and $hostKey below to match your actual gathering, then run:
#   .\add-host-picks.ps1

$slug = "raccoons-together-strong-2026-edition-4nm5mnub"
$hostKey = "62HAywPnFyGzK5RH37J2fHFn2cBfFwVx"
$baseUrl = "https://events.mojomapache.com"

$places = @(
    @{ sortOrder = 0; name = "FreshCo Eglinton & Gabian"; address = "2330 Eglinton Ave W, York, ON M6M 1S6"; icon = "🛒"; tag = "Supermarket with alcohol"; rating = 4.1; reviews = 1071 }
    @{ sortOrder = 1; name = "Enchilados Taquería"; address = "1993 Keele St, York, ON M6M 3Y3"; icon = "🌮"; tag = "Mexican"; rating = 4.8; reviews = 502; website = "https://www.enchiladostaqueria.ca/" }
    @{ sortOrder = 2; name = "Metro Pizza & Chicken"; address = "1856A Keele St, York, ON M6M 1T7"; icon = "🍕"; tag = "Pizza & fried chicken"; rating = 4.3; reviews = 188; website = "https://metropizzachicken.ca/" }
    @{ sortOrder = 3; name = "JJ Fried Chicken"; address = "2539 Eglinton Ave W, York, ON M6M 1T2"; icon = "🍗"; tag = "Korean fried chicken"; rating = 4.8; reviews = 371; website = "https://www.clover.com/online-ordering/jj-fried-chicken-toronto#HZ4EN2FHJ1KJP"; orderLabel = $true }
    @{ sortOrder = 4; name = "G&J West Indian Restaurant"; address = "2502 Eglinton Ave W, York, ON M6M 1T1"; icon = "🍖"; tag = "Jamaican / jerk BBQ"; rating = 5.0; reviews = 5; note = "Jerk Jamaican BBQ, cooked fresh outside." }
    @{ sortOrder = 5; name = "Kibo Sushi House - Keele"; address = "2300 Keele St, North York, ON M6M 3Z8"; icon = "🍣"; tag = "Japanese / sushi"; rating = 4.6; reviews = 326; note = "10% off if you pay cash." }
    @{ sortOrder = 6; name = "La Caldense Bakery"; address = "2406 Eglinton Ave W, York, ON M6M 1S6"; icon = "🥐"; tag = "Bakery / pastries"; rating = 4.1; reviews = 729; website = "https://caldensebakery.ca/" }
    @{ sortOrder = 7; name = "Sam & Nancy's No Frills"; address = "25 Photography Dr, North York, ON M6M 0A1"; icon = "🛒"; tag = "Supermarket"; rating = 4.3; reviews = 3521 }
)

$url = "$baseUrl/api/gatherings/$slug/places?key=$hostKey"

foreach ($place in $places) {
    try {
        $jsonBody = $place | ConvertTo-Json
        # Windows PowerShell's Invoke-RestMethod sends string bodies using the
        # console's default encoding (often not UTF-8), which mangles emoji.
        # Converting to raw UTF-8 bytes first avoids that entirely.
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
        $response = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json; charset=utf-8" -Body $bodyBytes
        Write-Host "Added: $($place.name)" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: $($place.name) -- $($_.Exception.Message)" -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 300
}

Write-Host "`nDone. Refresh the guest page to see all 8 under Host Picks." -ForegroundColor Cyan
