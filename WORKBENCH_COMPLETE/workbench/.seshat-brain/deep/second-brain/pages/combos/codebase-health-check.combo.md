---
name: "Codebase Health Check"
description: "Scans a codebase directory, extracts facts, classifies patterns, and generates a health report."

params:
  - name: targetDirectory
    type: string
    description: "The directory to analyze"

skills:
  - name: read_file
    description: "Scan the target directory structure"
    params:
      path: "{{targetDirectory}}"
    output: "file_list"

  - name: fact_extractor
    description: "Extract key facts from the codebase"
    input: "file_list"
    params:
      source_episode: "{{targetDirectory}}"
      episode_id: "health_check"
    output: "facts"

  - name: memory_classify
    description: "Classify findings into constitutional categories"
    input: "facts"
    params:
      text: "{{targetDirectory}} codebase analysis"
      source: "combo_health_check"
    output: "classification"

error_handling:
  on_failure: "stop"

parallel:
  enabled: false
---
# Codebase Health Check Combo

This combo runs a health scan on any codebase directory.
Step 1 reads the structure, Step 2 extracts facts, Step 3 classifies findings.
