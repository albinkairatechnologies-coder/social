$logPath = "C:\Users\Admin\.gemini\antigravity-ide\brain\8d8b93b3-f371-47f4-b99c-02093984a210\.system_generated\logs\transcript.jsonl"
$steps = @(218, 220, 222)
$allLines = [System.Collections.Generic.List[string]]::new()

# Initialize a dictionary to store code by line number to ensure correct ordering and prevent duplicates
$codeByLineNumber = @{}

foreach ($step in $steps) {
    Write-Output "Processing step $step..."
    $line = Get-Content -Path $logPath | Where-Object { $_ -match "`"step_index`":$step\b" }
    if (-not $line) {
        Write-Error "Could not find step $step in logs"
        exit 1
    }
    $obj = $line | ConvertFrom-Json
    $rawLines = $obj.content -split "`r?`n"
    
    foreach ($rl in $rawLines) {
        # Check if the line matches the pattern of a line number prefix: e.g. "123:  some code"
        if ($rl -match "^\s*(\d+):\s?(.*)$") {
            $num = [int]$Matches[1]
            $code = $Matches[2]
            # Strip trailing \r if present
            $code = $code.TrimEnd("`r")
            
            # If the code block matches our pattern, save it
            $codeByLineNumber[$num] = $code
        }
    }
}

# Now sort and write out the lines
$sortedKeys = $codeByLineNumber.Keys | Sort-Object
Write-Output "Total lines recovered: $($sortedKeys.Count)"

$reconstructedCode = [System.Collections.Generic.List[string]]::new()
foreach ($k in $sortedKeys) {
    $reconstructedCode.Add($codeByLineNumber[$k])
}

$outputPath = "f:\kaira\Intagarm\socialforge\app\dashboard\page.tsx"
[System.IO.File]::WriteAllLines($outputPath, $reconstructedCode)
Write-Output "Reconstructed page.tsx written successfully to $outputPath"
