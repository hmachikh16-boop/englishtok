param(
    [switch]$NoCopy,
    [switch]$NoIcon
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root 'LinGoControl.cs'
$bin = Join-Path $root 'bin'
$assets = Join-Path $root 'assets'
New-Item -ItemType Directory -Force -Path $bin | Out-Null
New-Item -ItemType Directory -Force -Path $assets | Out-Null

$icon = Join-Path $assets 'app.ico'
if (-not $NoIcon -and -not (Test-Path $icon)) {
    Add-Type -AssemblyName System.Drawing
    $size = 256
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $rect = New-Object System.Drawing.Rectangle(8, 8, 240, 240)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = 56
    $arc = New-Object System.Drawing.Rectangle(8, 8, $diameter, $diameter)
    $path.AddArc($arc, 180, 90)
    $arc.X = 248 - $diameter
    $path.AddArc($arc, 270, 90)
    $arc.Y = 248 - $diameter
    $path.AddArc($arc, 0, 90)
    $arc.X = 8
    $path.AddArc($arc, 90, 90)
    $path.CloseFigure()

    $fill = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(22, 38, 61),
        [System.Drawing.Color]::FromArgb(8, 15, 26),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
    $graphics.FillPath($fill, $path)

    $gold = [System.Drawing.Color]::FromArgb(247, 199, 82)
    $border = New-Object System.Drawing.Pen($gold, 7)
    $graphics.DrawPath($border, $path)

    $crown = [System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF(65, 128)),
        (New-Object System.Drawing.PointF(92, 100)),
        (New-Object System.Drawing.PointF(128, 134)),
        (New-Object System.Drawing.PointF(164, 100)),
        (New-Object System.Drawing.PointF(191, 128)),
        (New-Object System.Drawing.PointF(181, 174)),
        (New-Object System.Drawing.PointF(75, 174))
    )
    $crownBrush = New-Object System.Drawing.SolidBrush($gold)
    $graphics.FillPolygon($crownBrush, $crown)
    $crownPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(190, 141, 34), 4)
    $graphics.DrawPolygon($crownPen, $crown)

    $font = New-Object System.Drawing.Font('Segoe UI', 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(13, 24, 39))
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $graphics.DrawString('G', $font, $textBrush, (New-Object System.Drawing.RectangleF(75, 132, 106, 58)), $format)

    $png = New-Object System.IO.MemoryStream
    $bitmap.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBytes = $png.ToArray()

    $ico = New-Object System.IO.MemoryStream
    $writer = New-Object System.IO.BinaryWriter($ico)
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]1)
    $writer.Write([Byte]0)
    $writer.Write([Byte]0)
    $writer.Write([Byte]0)
    $writer.Write([Byte]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]32)
    $writer.Write([UInt32]$pngBytes.Length)
    $writer.Write([UInt32]22)
    $writer.Write($pngBytes)
    $writer.Flush()
    [System.IO.File]::WriteAllBytes($icon, $ico.ToArray())

    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "Created icon: $icon"
}

$cscCandidates = @(
    'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe',
    'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe'
)
$csc = $cscCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $csc) { throw 'Could not find the .NET Framework C# compiler (csc.exe).' }

$out = Join-Path $bin 'LinGoGoldControl.exe'
$manifest = Join-Path $root 'app.manifest'
$cscArgs = @(
    '/nologo',
    '/target:winexe',
    '/optimize+',
    '/codepage:65001',
    "/win32icon:$icon",
    "/win32manifest:$manifest",
    "/out:$out",
    '/reference:System.Windows.Forms.dll',
    '/reference:System.Drawing.dll',
    '/reference:System.Web.Extensions.dll',
    $source
)
& $csc $cscArgs
if ($LASTEXITCODE -ne 0) { throw "C# compilation failed with exit code $LASTEXITCODE." }

Write-Host "Built: $out"

if (-not $NoCopy) {
    $desktop = [Environment]::GetFolderPath('Desktop')
    if (-not (Test-Path $desktop)) { throw "Desktop folder not found: $desktop" }
    $desktopExe = Join-Path $desktop 'LinGo Gold Control.exe'
    Copy-Item -LiteralPath $out -Destination $desktopExe -Force
    Write-Host "Copied to Desktop: $desktopExe"
}
