tags:: #gsk-skill #game-engine #REDBUTTON
slug: engine_extensibility_bridge
backend: gsk_module
callable: false
status:: #defined
url:: https://gdevelop.io/
grafted-by:: #sage-the-researcher
graft-date:: 2026-07-03

## Key Insights
- **Extensible Architecture:** Defines the architectural principle of a pluggable extension system, allowing for the integration of custom behaviors, logic, and third-party tools via a well-defined API bridge, using JavaScript for high-level scripting and C++ for deeper engine modifications.

## Constitutional Influence: GSK Subsystem
This provides a direct architectural pattern for `skills/sage_skills.js` and the `UniversalToolBridge`. It suggests that our current skill system can be formalized into a more robust plugin architecture, with clear separation between high-level JS/TS skills and low-level native modules. This would make the entire GSK ecosystem more modular and easier to extend by third-party contributors.

## Connection to REDBUTTON Doctrine
This directly supports the [[REDBUTTON - Open-Source Soul Initiative]], which envisions a future where external developers can contribute skills and capabilities to the GSK core.
