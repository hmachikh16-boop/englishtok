param(
    [switch]$NoCopy
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = Join-Path $root 'LinGoOnlineControl.cs'
$manifest = Join-Path $root 'app.manifest'
$icon = Join-Path (Split-Path -Parent $root) 'lin-go-control\assets\app.ico'
$bin = Join-Path $root 'bin'
$work = Join-Path $env:TEMP 'lin-go-gold-online-build'
$packageVersion = '1.0.4314.35'
$package = Join-Path $env:TEMP ('microsoft.web.webview2.' + $packageVersion + '.nupkg')

New-Item -ItemType Directory -Force -Path $bin | Out-Null
New-Item -ItemType Directory -Force -Path $work | Out-Null

if (-not (Test-Path -LiteralPath $icon)) {
    throw "Icon not found: $icon"
}

if (-not (Test-Path -LiteralPath $package)) {
    Write-Host 'Downloading Microsoft.Web.WebView2 SDK...'
    Invoke-WebRequest -Uri ('https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/' + $packageVersion + '/microsoft.web.webview2.' + $packageVersion + '.nupkg') -OutFile $package
}

if (Test-Path -LiteralPath $work) {
    Remove-Item -LiteralPath $work -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $work | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($package, $work)

$coreDll = Join-Path $work 'lib\net462\Microsoft.Web.WebView2.Core.dll'
$winFormsDll = Join-Path $work 'lib\net462\Microsoft.Web.WebView2.WinForms.dll'
$loaderDll = Join-Path $work 'runtimes\win-x64\native\WebView2Loader.dll'

if (-not (Test-Path -LiteralPath $coreDll)) { throw 'WebView2 Core DLL was not found in the package.' }
if (-not (Test-Path -LiteralPath $winFormsDll)) { throw 'WebView2 WinForms DLL was not found in the package.' }
if (-not (Test-Path -LiteralPath $loaderDll)) { throw 'WebView2Loader.dll was not found in the package.' }

$cscCandidates = @(
    'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe',
    'C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe'
)
$csc = $cscCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $csc) { throw 'Could not find the .NET Framework C# compiler (csc.exe).' }

$out = Join-Path $bin 'LinGoOnlineControl.exe'
$cscArgs = @(
    '/nologo',
    '/target:winexe',
    '/platform:x64',
    '/optimize+',
    '/codepage:65001',
    "/win32icon:$icon",
    "/win32manifest:$manifest",
    "/out:$out",
    '/reference:System.dll',
    '/reference:System.Core.dll',
    '/reference:System.Drawing.dll',
    '/reference:System.Windows.Forms.dll',
    "/reference:$coreDll",
    "/reference:$winFormsDll",
    "/resource:$coreDll,Microsoft.Web.WebView2.Core.dll",
    "/resource:$winFormsDll,Microsoft.Web.WebView2.WinForms.dll",
    "/resource:$loaderDll,WebView2Loader.dll",
    $source
)

& $csc $cscArgs
if ($LASTEXITCODE -ne 0) {
    throw "C# compilation failed with exit code $LASTEXITCODE."
}

Write-Host "Built: $out"

if (-not $NoCopy) {
    $desktop = [Environment]::GetFolderPath('Desktop')
    if (-not (Test-Path -LiteralPath $desktop)) {
        throw "Desktop folder not found: $desktop"
    }

    $desktopExe = Join-Path $desktop 'Lin Go Gold Control Online.exe'
    Copy-Item -LiteralPath $out -Destination $desktopExe -Force
    Write-Host "Copied to Desktop: $desktopExe"
}
