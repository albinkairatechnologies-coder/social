const fs = require('fs');
const { execSync } = require('child_process');

const logPath = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\8d8b93b3-f371-47f4-b99c-02093984a210\\.system_generated\\logs\\transcript.jsonl";
const targetFilePath = "f:\\kaira\\Intagarm\\socialforge\\app\\dashboard\\page.tsx";

// Revert dashboard page to base committed version first
console.log("Reverting dashboard page via git...");
execSync('git checkout f:\\kaira\\Intagarm\\socialforge\\app\\dashboard\\page.tsx');

let fileContent = fs.readFileSync(targetFilePath, 'utf8');
console.log(`Base page.tsx loaded: ${fileContent.split('\n').length} lines.`);

const lines = fs.readFileSync(logPath, 'utf8').split('\n');
const modifications = [];

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const step = JSON.parse(line);
    if (step.tool_calls) {
      for (const call of step.tool_calls) {
        if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
          let args = call.args;
          if (typeof args === 'string') {
            args = JSON.parse(args);
          }
          
          let targetFile = args.TargetFile || args.targetFile;
          if (targetFile) {
            const normalizedPath = targetFile.replace(/\\/g, '/').replace(/"/g, '').toLowerCase();
            if (normalizedPath.includes('app/dashboard/page.tsx')) {
              // Only include steps before the current turn (up to step 310) to avoid applying our current broken edits!
              if (step.step_index < 235) {
                modifications.push({
                  step_index: step.step_index,
                  name: call.name,
                  args: args
                });
              }
            }
          }
        }
      }
    }
  } catch (err) {
    // Ignore JSON errors
  }
}

// Sort modifications by step index to apply them in chronological order
modifications.sort((a, b) => a.step_index - b.step_index);

console.log(`Found ${modifications.length} modifications for page.tsx in transcript logs.`);

for (const mod of modifications) {
  console.log(`Applying step ${mod.step_index} (${mod.name})...`);
  
  if (mod.name === 'replace_file_content') {
    let target = mod.args.TargetContent;
    let replacement = mod.args.ReplacementContent;
    
    // Clean stringified JSON quotes if present
    if (typeof target === 'string' && target.startsWith('"') && target.endsWith('"') && target.includes('\\')) {
      try { target = JSON.parse(target); } catch(e) {}
    }
    if (typeof replacement === 'string' && replacement.startsWith('"') && replacement.endsWith('"') && replacement.includes('\\')) {
      try { replacement = JSON.parse(replacement); } catch(e) {}
    }
    
    const normalizedTarget = target.replace(/\r\n/g, '\n');
    const normalizedFileContent = fileContent.replace(/\r\n/g, '\n');
    
    if (!normalizedFileContent.includes(normalizedTarget)) {
      console.error(`ERROR: Target content not found for step ${mod.step_index}`);
      // Try single line normalization matching as fallback
      continue;
    }
    
    const replaced = normalizedFileContent.replace(normalizedTarget, replacement.replace(/\r\n/g, '\n'));
    fileContent = replaced.replace(/\n/g, '\r\n');
  } else if (mod.name === 'multi_replace_file_content') {
    const chunks = mod.args.ReplacementChunks;
    for (const chunk of chunks) {
      let target = chunk.TargetContent;
      let replacement = chunk.ReplacementContent;
      
      if (typeof target === 'string' && target.startsWith('"') && target.endsWith('"') && target.includes('\\')) {
        try { target = JSON.parse(target); } catch(e) {}
      }
      if (typeof replacement === 'string' && replacement.startsWith('"') && replacement.endsWith('"') && replacement.includes('\\')) {
        try { replacement = JSON.parse(replacement); } catch(e) {}
      }
      
      const normalizedTarget = target.replace(/\r\n/g, '\n');
      const normalizedFileContent = fileContent.replace(/\r\n/g, '\n');
      
      if (!normalizedFileContent.includes(normalizedTarget)) {
        console.error(`ERROR: Multi-replace target chunk not found for step ${mod.step_index}`);
        continue;
      }
      
      const replaced = normalizedFileContent.replace(normalizedTarget, replacement.replace(/\r\n/g, '\n'));
      fileContent = replaced.replace(/\n/g, '\r\n');
    }
  }
}

fs.writeFileSync(targetFilePath, fileContent, 'utf8');
console.log(`Successfully restored page.tsx! New length: ${fileContent.split('\r\n').length} lines.`);
