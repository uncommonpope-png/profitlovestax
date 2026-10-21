# GSK Diagnosis Report

**Entry point:** `fusion-loader.js`

## Headline Numbers

| Metric | Value |
|---|---|
| Total .js files found | 490 |
| Reachable from boot (fusion-loader.js) | 147 |
| **Orphaned (exist, never required)** | **344** |
| Reachable % | 30.0% |
| Broken require paths | 1 |

## What this means

344 files exist in your gsk-core tree but are **never required, directly or transitively, from fusion-loader.js**. These files can be perfectly "REAL" (real logic, no stubs) and still be 100% inert — dead code the running kernel never touches.

There are also 1 require/import statements that point at files that don't resolve — these are likely renamed/moved files, or requires with a typo, silently breaking a chain of connections.

## Top 15 "Hub" Files (most depended-upon)

These are your true integration points — the mega_*.js orchestrators should dominate this list. If they don't, that itself is a signal.

| File | Imported by N reachable files |
|---|---|
| `gsk-core\identity\mega_identity.js` | 7 |
| `gsk-core\security\secure_sandbox.js` | 3 |
| `gsk-core\bible\bible_loader.js` | 3 |
| `gsk-core\chambers\attention.js` | 2 |
| `gsk-core\contract.js` | 2 |
| `gsk-core\brain\knowledge_graph.js` | 2 |
| `gsk-core\brain\planning_engine.js` | 2 |
| `gsk-core\knowledge.js` | 2 |
| `gsk-core\brain\web_search_provider.js` | 2 |
| `gsk-core\utils.js` | 2 |
| `gsk-core\brain\insight_engine.js` | 1 |
| `gsk-core\identity\identity_lock.js` | 1 |
| `gsk-core\brain\thalamic_gate.js` | 1 |
| `gsk-core\memory\mega_memory.js` | 1 |
| `..\plt-engine.js` | 1 |

## Orphaned Files by Directory

### `./` (8 orphaned)
- boot-gsk.js
- contract_audit.js
- ecosystem.config.cjs
- functional_probe.js
- fusion-loader.backup.20260807113422.js
- gsk_daemon.js
- health_probe.js
- test_brain_manager.js

### `data\gsk/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T06-30-10-128Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T06-45-10-228Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T07-00-10-388Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T07-15-10-401Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T07-31-09-242Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T07-46-09-347Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T08-01-09-842Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T08-16-09-855Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T08-31-09-860Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T08-46-09-866Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T09-01-09-886Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T09-16-09-886Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T09-31-09-894Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T09-46-09-901Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T10-01-09-912Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T10-16-09-916Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T10-31-09-953Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T10-46-10-114Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T11-01-10-121Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T11-16-10-135Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T11-31-10-143Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T11-46-10-145Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T12-01-10-153Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T12-16-10-167Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T12-31-10-171Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T12-46-10-180Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T13-01-10-181Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T13-16-10-184Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T13-31-10-188Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T13-46-10-206Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T14-01-45-355Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T14-16-45-453Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T14-31-45-740Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T14-46-45-750Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T15-01-45-756Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T15-16-45-765Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T15-31-45-769Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T15-46-45-779Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T16-01-45-790Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T16-16-45-815Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T16-31-45-826Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T16-46-45-837Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T19-41-40-373Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T19-46-58-524Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T19-49-11-750Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T19-52-05-855Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T19-54-59-550Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T19-57-19-258Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T20-02-02-723Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T20-09-45-681Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T20-24-45-722Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T20-39-48-193Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T20-54-48-305Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T21-10-27-687Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T21-15-11-097Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T21-21-24-817Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T21-36-24-856Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T21-51-35-598Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T22-06-35-701Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T22-21-35-772Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T22-36-35-783Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T22-53-56-136Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T23-08-56-195Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T23-23-56-550Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T23-38-56-565Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-05T23-53-56-899Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T00-42-35-271Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T00-57-35-308Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T01-00-17-891Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T01-05-49-114Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T01-18-07-451Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T01-33-07-479Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T01-48-28-578Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T02-03-28-757Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T02-24-10-504Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T02-39-10-567Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T02-55-08-412Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-01-42-631Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-04-25-906Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-10-16-032Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-13-19-100Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-14-34-900Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-29-34-931Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-31-40-209Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-35-31-325Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T19-50-31-368Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T20-06-18-107Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T20-18-44-025Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T20-33-44-055Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T20-38-43-219Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T20-44-39-221Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T20-49-27-315Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T20-53-29-706Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T21-08-29-786Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T21-23-30-139Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\backup-2026-08-06T21-38-30-137Z/` (1 orphaned)
- identity_kernel.js

### `data\gsk\backups\mission-100-2026-07-20T03-38-46-551Z/` (1 orphaned)
- identity_kernel.js

### `gsk-core/` (3 orphaned)
- api-registry.js
- createSkillTemplate.js
- learner.js

### `gsk-core\brain/` (18 orphaned)
- api_vault.js
- autonomous_agent_spawner.js
- brain_bible_integration.js
- desktop_commander.js
- kernel_oracle.js
- lazy_boot.js
- lazy_factories.js
- lesson_bible.js
- mcp_servers.js
- python_skills_bridge.js
- sanctum_client.js
- self_training_pipeline.js
- soul_entity.js
- soul_genesis.js
- soul_gifter.js
- soul_identity.js
- soul_picker.js
- websocket_bridge.js

### `gsk-core\chambers/` (2 orphaned)
- affect_update.js
- skill_registry.js

### `gsk-core\marketplace/` (2 orphaned)
- marketplace_api.js
- test_marketplace.js

### `gsk-core\mcp/` (2 orphaned)
- mcp_protocol.js
- mcp_skill_wrapper.js

### `gsk-core\sandbox/` (1 orphaned)
- gsk_playground.js

### `gsk-core\skills/` (184 orphaned)
- 1password.js
- achievements.js
- agent_teams.js
- api_design.js
- api_server.js
- apple_notes.js
- apple_reminders.js
- architecture_design.js
- auto_1783849100749.js
- auto_1783900326303.js
- auto_1783900784556.js
- auto_1783902132883.js
- auto_1783905250918.js
- auto_1783909181960.js
- auto_1783910391453.js
- auto_1783913876008.js
- auto_1783916022102.js
- auto_1783960214177.js
- auto_1783960635573.js
- auto_1783961268707.js
- auto_1783962191357.js
- auto_1783963694523.js
- auto_1783964458678.js
- auto_1783965583071.js
- auto_1783967937743.js
- auto_1783968786776.js
- auto_1783969105991.js
- auto_1783971977766.js
- auto_1783975462290.js
- auto_1783979125064.js
- auto_1783982660398.js
- auto_1783985182680.js
- auto_1783986481829.js
- auto_1783986754855.js
- auto_1783988407007.js
- auto_1783988612336.js
- auto_1783988871660.js
- auto_1783989064587.js
- auto_1783989369213.js
- auto_1783992904927.js
- auto_1783996476546.js
- auto_1783998728305.js
- auto_1784009697586.js
- auto_1784013169042.js
- auto_1784016786973.js
- auto_1784020388965.js
- auto_1784023982487.js
- auto_1784027588314.js
- auto_1784031186341.js
- auto_1784034778928.js
- auto_1785821913341.js
- auto_1785822146215.js
- auto_1785822505920.js
- auto_1785823118423.js
- auto_1785865499448.js
- auto_1785881432564.js
- auto_1785906525628.js
- auto_1785907449010.js
- auto_1785964311209.js
- auto_1785964753574.js
- auto_1785983259591.js
- auto_1786043869350.js
- auto_1786045116564.js
- auto_1786049228587.js
- bear_notes.js
- blogwatcher.js
- blucli.js
- bluebubbles.js
- brand_guidelines.js
- build.js
- camsnap.js
- canvas.js
- ci_cd_pipeline.js
- clawhub.js
- cline_bridge.js
- cli_builder.js
- code_exec.js
- code_review.js
- coding-agent.js
- content_generate.js
- dark_city_controller.js
- database_query.js
- data_analysis.js
- debug_error.js
- discord.js
- docker_setup.js
- docx.js
- doc_coauthoring.js
- drawio.js
- dynamic_api_weaver.js
- dynamic_economy.js
- eightctl.js
- email_compose.js
- encryption.js
- file_system.js
- frontend_design.js
- gemini.js
- generate_tests.js
- gh-issues.js
- gifgrep.js
- github.js
- git_learn.js
- git_ops.js
- god_node_controller.js
- gog.js
- google_workspace.js
- goplaces.js
- gsk-body-server.js
- gsk-bridge-client.js
- healthcheck.js
- himalaya.js
- http_client.js
- imsg.js
- internal_comms.js
- last30days.js
- math_calc.js
- mcporter.js
- mcp_builder.js
- mcp_client.js
- model-usage.js
- monitoring_alerting.js
- nano-pdf.js
- news_monitor.js
- node-connect.js
- notion.js
- npm_publish.js
- obsidian.js
- ocr.js
- ollama_mgmt.js
- openai-image-gen.js
- openai-whisper-api.js
- openhue.js
- pdf.js
- performance_optimize.js
- planning_with_files.js
- playwright_automate.js
- plt_dashboard.js
- plt_economy.js
- pm_skills.js
- pptx.js
- profit_bible.js
- python_package_recommender.js
- react_component.js
- refactor_code.js
- reflection.js
- remote_desktop_controller.js
- reverse_proxy_configurator.js
- robotics.js
- sacred_mechanics.js
- sandbox_eval.js
- scheduling.js
- scientific_research.js
- security_audit.js
- self_improve.js
- self_replicate.js
- shell_exec.js
- shopify_publish.js
- skill_market_analysis.js
- skill_status_report.js
- skill_tester.js
- social_post.js
- songsee.js
- sonoscli.js
- soul_evolution.js
- spec_driven_develop.js
- sports_data.js
- spotify-player.js
- summarize.js
- task_planning.js
- text_summarization.js
- theme_factory.js
- things-mac.js
- tmux.js
- trello.js
- unified_project_builder.js
- video-frames.js
- voice_call.js
- wacli.js
- weather.js
- webapp_testing.js
- web_artifacts_builder.js
- web_search.js
- xlsx.js
- xurl.js

### `gsk-core\sub_agents/` (4 orphaned)
- agent_teams.js
- mega_sub_agents.js
- ultra_review.js
- webfetch.js

### `gsk-core\tests/` (14 orphaned)
- test_approved_tool_executor.js
- test_autonomous_metabolism.js
- test_closed_autonomy_loop.js
- test_consciousness_layers.js
- test_dual_process.js
- test_evolution_gate.js
- test_federation_observability.js
- test_hosted_cpl_bridge.js
- test_research_graft_pipeline.js
- test_sage_skills.js
- test_scribe_bridge.js
- test_spatial_embodiment.js
- test_tool_catalog.js
- test_voice_persona.js

### `gsk-core\world/` (2 orphaned)
- AutonomousAgent.js
- WorldState.js

### `scripts/` (6 orphaned)
- int-test.js
- sync-gsk-to-scribe.js
- sync-remaining.js
- test-combos.js
- test-fullstack.js
- test-world-model.js

## Broken Requires (paths that don't resolve)

| In file | Trying to require | 
|---|---|
| `gsk-core\mcp\index.js` | `./src/mcp` |

## Recommended Next Steps

1. **If orphan count is high:** Start with the highest-value orphans — cross-reference this list against your inventory's "mega_*.js" and core architecture files (mega_brain, mega_chambers, mega_skills, mega_memory, mega_identity, mega_sub_agents, gods_council). If any of *those* are orphaned, that's your #1 fix — wire that one require statement into fusion-loader.js's boot sequence and you likely reconnect dozens of downstream files at once.
2. **Fix broken requires next** — each one is a silently severed connection between subsystems that were clearly meant to talk to each other.
3. **Then run the runtime boot-instrumentation script** (companion file) to see which of the *reachable* files actually initialize successfully vs. get caught by `_safeInit()` and silently degrade.
4. Re-run this script after each fix to watch the reachable percentage climb.
