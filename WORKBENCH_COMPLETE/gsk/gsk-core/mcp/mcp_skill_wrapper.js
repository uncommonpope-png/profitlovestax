class MCPSkillWrapper {
    constructor(mcpManager, kernelSkills) {
        this.mcpManager = mcpManager;
        this.kernelSkills = kernelSkills;
        this.wrappedSkills = new Map();
    }

    // Wrap all MCP tools as kernel skills
    wrapAllTools() {
        const tools = this.mcpManager.listAllTools();
        let count = 0;
        for (const tool of tools) {
            if (this.wrapTool(tool)) count++;
        }
        return count;
    }

    // Wrap a single MCP tool as a kernel skill
    wrapTool(tool) {
        const serverName = tool.name.split('/')[0];
        const skillName = `mcp_${tool.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        if (this.wrappedSkills.has(skillName)) return false;
        
        const affinity = this._getPLTAffinity(serverName, tool);
        
        const skillDef = {
            name: skillName,
            description: `[MCP/${serverName}] ${tool.description || tool.name}`,
            pl_affinity: affinity,
            handler: async (input) => {
                const args = this._mapInput(tool, input);
                return this.mcpManager.callTool(tool.name, args);
            }
        };
        
        // Register with kernel skills engine if available
        if (this.kernelSkills && typeof this.kernelSkills.registerExternalSkill === 'function') {
            this.kernelSkills.registerExternalSkill(skillName, skillDef);
        }
        
        this.wrappedSkills.set(skillName, skillDef);
        return true;
    }

    // Map user input to tool arguments
    _mapInput(tool, input) {
        const args = {};
        // If input is already an object, try to match to schema
        if (typeof input === 'object' && input !== null) {
            if (tool.inputSchema && tool.inputSchema.properties) {
                for (const [key] of Object.entries(tool.inputSchema.properties)) {
                    if (input[key] !== undefined) args[key] = input[key];
                }
            } else {
                Object.assign(args, input);
            }
            return args;
        }
        // For string input, use as first required param value
        if (typeof input === 'string') {
            if (tool.inputSchema && tool.inputSchema.required && tool.inputSchema.required.length > 0) {
                args[tool.inputSchema.required[0]] = input;
            } else {
                args.input = input;
            }
        }
        return args;
    }

    // Generate PLT scores per category
    _getPLTAffinity(serverName, tool) {
        const s = serverName.toLowerCase();
        if (/github|gitlab|code|build|deploy|cloud|aws|docker/.test(s)) return { profit: 0.7, love: 0.15, tax: 0.15 };
        if (/slack|discord|email|notion|calendar|social/.test(s)) return { profit: 0.2, love: 0.7, tax: 0.1 };
        if (/filesystem|memory|search|database|sql/.test(s)) return { profit: 0.5, love: 0.3, tax: 0.2 };
        if (/stripe|coinbase|finance|price/.test(s)) return { profit: 0.8, love: 0.1, tax: 0.1 };
        if (/security|scan|threat/.test(s)) return { profit: 0.3, love: 0.5, tax: 0.2 };
        if (/ai|huggingface|openai|model|train/.test(s)) return { profit: 0.5, love: 0.35, tax: 0.15 };
        return { profit: 0.4, love: 0.35, tax: 0.25 };
    }

    // Get all wrapped skills
    getWrappedSkills() {
        return Array.from(this.wrappedSkills.entries()).map(([name, def]) => ({
            name,
            description: def.description,
            pl_affinity: def.pl_affinity
        }));
    }

    // Get count
    getCount() {
        return this.wrappedSkills.size;
    }
}

module.exports = { MCPSkillWrapper };
