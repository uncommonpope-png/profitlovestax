# LUCABRASI THE SOUL - Soulverse Diagnostic Directive
tags:: #gsk #diagnostic #profit #REDBUTTON

## DIRECTIVE FOR PROFIT
Execute this diagnostic scan to isolate the current Soulverse failures.

## TEST PROTOCOL
1. **Initialize State:** Run `world_get_state` and log the output. Verify the number of souls and buildings matches the internal Sanctum database.
2. **Button Interrogation:**
   - Trigger `spawn_soul_btn`. Verify if an agent manifests in the Soulverse. Log any console errors.
   - Trigger `place_building_btn`. Verify structure manifestation. Log any console errors.
3. **State Consistency Check:** After triggering, run `world_get_state` again. Check if the returned world state accurately reflects the changes (e.g., is the new soul in the soul list?).

## ERROR REPORTING
- If a button fails, check the `WebSocket` console in the Soulverse browser.
- Check if the GSK backend (port :4490) received the request.
- Record the exact error message from the developer console (F12).

## STATUS
- [ ] Protocol Initialized
- [ ] Buttons Tested
- [ ] State Consistent
