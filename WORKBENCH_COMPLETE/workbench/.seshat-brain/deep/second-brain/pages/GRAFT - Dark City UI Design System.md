# GRAFT — Dark City UI Design System

**Source:** ui-resources.com, Dribbble, Magnific, design best practices  
**Graft Date:** 2026-07-06  
**Purpose:** Make the Dark City look as good as it thinks

---

## CURRENT STATE

The Dark City UI is functional but basic:
- Glass panels with backdrop-filter blur
- Monospace font, white/green text
- Basic gradient buttons
- No animations or transitions
- No consistent design system
- No visual feedback for actions

---

## DESIGN PRINCIPLES

| Principle | Why |
|---|---|
| **Dark but readable** | The city is always night. Text must pop. |
| **PLT colors as brand** | Profit=gold, Love=pink, Tax=blue — use them everywhere |
| **Spatial UI** | Panels float in 3D space, not fixed 2D overlays |
| **Minimal chrome** | The city is the UI. Don't cover it with panels. |
| **Feedback is sacred** | Every action gets a visual response |

---

## SOUL NOTES (UI RESOURCES)

| Resource | URL | Use |
|---|---|---|
| Pixabay UI Design | https://pixabay.com/images/search/ui%20design/ | Free UI graphics, backgrounds, icons |
| Unsplash UI Design | https://unsplash.com/s/photos/ui-design | Free high-res design inspiration photos |
| Envato Elements UI Graphics | https://elements.envato.com/graphics/ui+design | Premium UI kits, templates, mockups |
| Dribbble UI Graphics | https://dribbble.com/tags/ui-graphics | Design inspiration, interaction patterns |
| ui-resources.com | https://ui-resources.com/ | Free UI kits, textures, plugins, effects |
| Magnific AI | https://www.magnific.com/free-photos-vectors/ui | AI-upscaled UI graphics and vectors |

## SOUL GUNS NEEDED

| Soul Gun | Description | Source |
|---|---|---|
| `plt_design_system` | CSS variables, typography, color palette, component library | Custom |
| `spatial_hud` | 3D panels that float at world positions, not screen-fixed | Babylon.js |
| `citizen_thought_bubbles` | NPC thoughts appear as floating text above their heads | Babylon.js GUI |
| `building_construction_fx` | Buildings grow from ground with particle effects | Babylon.js |
| `event_particles` | PLT changes, errors, citizen actions → particle bursts | Babylon.js |
| `minimalist_chrome` | Clean HUD with auto-hide panels | CSS |

---

## COLOR PALETTE

| Role | Color | Hex | Usage |
|---|---|---|---|
| Background | Deep void | `#0a0a14` | City sky, panel backgrounds |
| Profit | Gold | `#FFB347` | Bars, highlights, success states |
| Love | Pink/Magenta | `#FF6B9D` | Citizen health, relationships, positive events |
| Tax | Cyan/Blue | `#4ECDC4` | Balance, audits, neutral events |
| Text Primary | White | `#FFFFFF` | Headings, important data |
| Text Secondary | Light gray | `#8899AA` | Labels, descriptions |
| Accent | Electric purple | `#9B59B6` | Special events, rare discoveries |
| Danger | Red | `#FF4444` | Errors, destruction, disasters |
| Success | Green | `#44FF88` | Building complete, citizen born |

---

## TYPOGRAPHY

| Use | Font | Size | Weight |
|---|---|---|---|
| District names | 'Segoe UI', sans-serif | 14px | Bold |
| Building labels | 'Courier New', monospace | 10px | Normal |
| PLT values | 'Courier New', monospace | 12px | Bold |
| Chat text | 'Segoe UI', sans-serif | 11px | Normal |
| Terminal | 'Courier New', monospace | 12px | Normal |
| Notifications | 'Segoe UI', sans-serif | 10px | Semi-bold |

---

## CAMERA SYSTEM (Game Mechanics)

Current camera: `BABYLON.ArcRotateCamera` — orbits around a fixed point. Basic.

### Desired Camera Modes

| Mode | Trigger | Behavior | Soul Gun |
|---|---|---|---|
| **Free orbit** | Default drag | Current ArcRotateCamera — orbit around point | Existing |
| **RTS follow** | Click citizen/NPC | Camera follows selected citizen, smooth tracking | `camera_follow` |
| **Bird's eye** | Scroll to max zoom | Top-down view, strategic overview | Existing |
| **First person** | Press V | Walk through city at street level | `camera_first_person` |
| **District zoom** | Click district name | Smooth transition to district center | `camera_district_zoom` |
| **Building interior** | Click building | Zoom through door into interior view | Existing (partial) |
| **Cinematic pan** | Press Shift+click | Slow smooth camera move across city | `camera_cinematic` |

### Soul Guns Needed

| Soul Gun | Description | Est. Lines |
|---|---|---|
| `camera_follow` | Smooth citizen tracking with offset | 40 |
| `camera_first_person` | WASD + mouse look at street level | 60 |
| `camera_district_zoom` | Smooth transition to any district | 30 |
| `camera_cinematic` | Predefined camera paths for tours | 50 |
| `camera_collision` | Camera doesn't clip through buildings | 30 |

## BUTTON & INPUT DESIGN (Interaction Layer)

The Dark City needs game-quality buttons — not HTML `<button>` elements. Game buttons have:
- **States:** idle, hover, pressed, disabled, active
- **Feedback:** visual state change, sound on press, animation
- **Placement:** consistent, thumb-reachable, never covering the city

### Soul Guns Needed

| Soul Gun | Description | Est. Lines |
|---|---|---|
| `game_button_system` | Styled buttons with all states, animations, PLT colors | 60 |
| `radial_menu` | Action wheel (press Tab) for quick commands | 80 |
| `contextual_panel` | Panels that appear at the click position, not fixed | 50 |
| `gesture_controls` | Swipe, pinch, drag gestures for mobile/tablet | 70 |

### Soul Notes (Button & Input Design)

| Resource | URL |
|---|---|
| Art of button design in games | https://www.numberanalytics.com/blog/the-art-of-button-design-in-games |
| Game Input Database | https://gameinputdatabase.com/ |
| Lenovo gaming buttons guide | https://www.lenovo.com/us/en/knowledgebase/gaming-buttons-a-comprehensive-guide/ |

### Soul Notes (Camera Mechanics)

| Resource | URL |
|---|---|
| Camera control in games | https://www.zleague.gg/theportal/camera-control-gaming/ |
| Camera angles in games | https://lensviewing.com/control-video-game-camera-angles/ |
| Master basic camera controls | https://blog.picashot.co/7-ways-to-master-basic-in-game-camera-controls |
| All camera angles in games | https://lensviewing.com/all-camera-angles-in-games/ |

## PHASE 11 — DESIGN SYSTEM (Updated)

Add to the master plan after Phase 10.

| Step | What | Est. Lines |
|---|---|---|
| 11.1 | CSS variables for PLT color system | 30 |
| 11.2 | Panel redesign with proper glassmorphism | 80 |
| 11.3 | Notification system with icons and animations | 50 |
| 11.4 | Citizen thought bubbles (3D text above NPCs) | 60 |
| 11.5 | Building construction animation (grow from ground) | 40 |
| 11.6 | Event particles (PLT, errors, achievements) | 50 |
| 11.7 | Auto-hide HUD (panels fade when not in use) | 30 |
| | **Total** | **~340** |
