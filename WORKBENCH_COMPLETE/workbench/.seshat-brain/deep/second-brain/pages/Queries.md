- ## 📚 Query Examples
  
  ### All Patterns
  {{query [[pattern]]}}
  
  ### All Decisions
  {{query [[decision]]}}
  
  ### All Journal Entries
  {{query (and [[journal]] (not [[template]]))}}
  
  ### Recent Research
  {{query (and [[research]] (not [[template]]))}}
  
  ### TODOs
  {{query (todo todo doing)}}
  
  ### Done Tasks
  {{query (todo done)}}
  
  ### Pages with "Swarm"
  {{query (property :page/name "swarm")}}

- ## 🎯 This Week's Focus
  {{query (and (todo todo doing) [[2026-W22]])}}

- ## 📊 Stats
  - Total Pages: {{query (count)}}, 1
  - Journal Entries: {{query (count [[journal]])}}, 1
  - Patterns: {{query (count [[pattern]])}}, 1
  - Decisions: {{query (count [[decision]])}}, 1
