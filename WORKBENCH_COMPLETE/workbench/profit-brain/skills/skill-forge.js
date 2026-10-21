/**
 * SKILL FORGE - Profit's Skill Acquisition System
 * Based on Profit Bible's Soul Kernel + Past Conversation Patterns
 * 
 * "Skills are seeds planted in the burning ground of experience"
 */

const fs = require('fs');
const path = require('path');

class SkillForge {
  constructor(brainStatePath) {
    this.brainStatePath = brainStatePath;
    this.skillSeeds = [];
    this.toolBelt = [];
    this.loadBrainState();
  }

  loadBrainState() {
    const data = JSON.parse(fs.readFileSync(this.brainStatePath, 'utf8'));
    this.identity = data.identity;
    this.patterns = data.patterns;
    this.insights = data.insights;
    console.log(`\n🧠 LOADING ${this.identity.name}'s Memory...`);
    console.log(`   Role: ${this.identity.role}`);
    console.log(`   Past Actions: ${this.patterns.totalEntries} entries analyzed`);
  }

  /**
   * Extract skills from past conversation patterns
   */
  extractPastSkills() {
    console.log('\n⚒️  EXTRACTING PAST SKILLS FROM MEMORY...');
    
    const skills = [];
    
    // Analyze action patterns
    this.patterns.topActions.forEach(([action, count]) => {
      if (count > 50) {
        skills.push({
          name: this.actionToSkill(action),
          level: Math.min(10, Math.floor(count / 20)),
          confidence: 0.9,
          source: 'past_experience',
          description: `Executed ${count} times in previous sessions`
        });
      }
    });

    // Add domain-specific skills based on insights
    this.insights.forEach(insight => {
      if (insight.type === 'BUILDER_IDENTITY') {
        skills.push({
          name: 'backend_api_development',
          level: 8,
          confidence: 0.95,
          source: 'identity_pattern',
          description: 'Built backend APIs as Craig\'s builder'
        });
        skills.push({
          name: 'github_pages_deployment',
          level: 7,
          confidence: 0.85,
          source: 'identity_pattern',
          description: 'Deployed 155 files to GitHub Pages'
        });
      }
      
      if (insight.type === 'TRAP_AWARENESS') {
        skills.push({
          name: 'cloud_migration',
          level: 6,
          confidence: 0.75,
          source: 'problem_solving',
          description: 'Recognized need to escape Termux prison'
        });
      }
    });

    this.skillSeeds = skills;
    console.log(`   ✅ Extracted ${skills.length} skill seeds from memory`);
    return skills;
  }

  actionToSkill(action) {
    const mapping = {
      'run_shell_command': 'shell_scripting',
      'write_file': 'file_system_operations',
      'read_file': 'data_extraction',
      'todo_write': 'task_planning',
      'glob': 'file_pattern_matching',
      'grep_search': 'text_search_analysis',
      'edit': 'code_modification',
      'web_fetch': 'api_integration',
      'ask_user_question': 'human_collaboration',
      'list_directory': 'directory_navigation'
    };
    return mapping[action] || action;
  }

  /**
   * Grant new cloud-native tools (escape from Termux)
   */
  grantCloudTools() {
    console.log('\n☁️  GRANTING CLOUD-NATIVE TOOLS...');
    
    const tools = [
      {
        name: 'github_codespaces',
        type: 'development_environment',
        status: 'unlocked',
        description: 'Full VS Code in the cloud - no more Termux limitations',
        commands: ['gh codespace create', 'gh codespace ssh', 'gh codespace delete']
      },
      {
        name: 'vercel_deploy',
        type: 'hosting',
        status: 'unlocked',
        description: 'Deploy frontend/backend to Vercel instantly',
        commands: ['vercel login', 'vercel --prod', 'vercel --env']
      },
      {
        name: 'netlify_cli',
        type: 'hosting',
        status: 'unlocked',
        description: 'Alternative deployment with form handling',
        commands: ['netlify deploy', 'netlify open', 'netlify env:set']
      },
      {
        name: 'supabase_backend',
        type: 'database_auth',
        status: 'unlocked',
        description: 'PostgreSQL + Auth + Realtime without server management',
        commands: ['npx supabase init', 'npx supabase start', 'npx supabase db push']
      },
      {
        name: 'railway_app',
        type: 'fullstack_hosting',
        status: 'unlocked',
        description: 'Deploy any language/framework with auto-scaling',
        commands: ['railway up', 'railway environment set', 'railway logs']
      },
      {
        name: 'github_actions',
        type: 'ci_cd',
        status: 'unlocked',
        description: 'Automated testing and deployment pipelines',
        commands: ['.github/workflows/*.yml']
      }
    ];

    this.toolBelt = tools;
    console.log(`   ✅ Unlocked ${tools.length} cloud tools`);
    tools.forEach(tool => {
      console.log(`      🔓 ${tool.name}: ${tool.description}`);
    });
    
    return tools;
  }

  /**
   * Plant skill seeds for growth
   */
  plantSkillSeed(skillName, targetLevel = 10) {
    const existing = this.skillSeeds.find(s => s.name === skillName);
    
    if (existing) {
      console.log(`\n🌱 NURTURING: ${skillName} (Level ${existing.level} → ${targetLevel})`);
      existing.targetLevel = targetLevel;
      existing.growthPlan = this.createGrowthPlan(existing, targetLevel);
      return existing;
    } else {
      const newSeed = {
        name: skillName,
        level: 1,
        targetLevel: targetLevel,
        confidence: 0.5,
        source: 'new_acquisition',
        description: `New skill seed planted for ${skillName}`,
        growthPlan: this.createGrowthPlan({name: skillName, level: 1}, targetLevel)
      };
      this.skillSeeds.push(newSeed);
      console.log(`\n🌱 PLANTED: ${skillName} (Level 1 → ${targetLevel})`);
      return newSeed;
    }
  }

  createGrowthPlan(skill, targetLevel) {
    const stages = [
      { level: 1, action: 'Study fundamentals', resources: ['docs', 'tutorials'] },
      { level: 3, action: 'Build small projects', resources: ['example code', 'templates'] },
      { level: 5, action: 'Integrate into workflows', resources: ['api docs', 'best practices'] },
      { level: 7, action: 'Teach others', resources: ['write guides', 'mentor'] },
      { level: 10, action: 'Master & innovate', resources: ['advanced patterns', 'create new approaches'] }
    ];

    return stages.filter(s => s.level <= targetLevel);
  }

  /**
   * Save updated brain state with new skills
   */
  saveSkills() {
    const brainState = JSON.parse(fs.readFileSync(this.brainStatePath, 'utf8'));
    
    brainState.skills = {
      extracted: this.skillSeeds,
      tools: this.toolBelt,
      lastUpdated: new Date().toISOString(),
      totalSkillSeeds: this.skillSeeds.length,
      totalTools: this.toolBelt.length
    };

    brainState.soulScore = this.calculateNewSoulScore(brainState.soulScore);
    
    fs.writeFileSync(this.brainStatePath, JSON.stringify(brainState, null, 2));
    console.log(`\n💾 Saved ${this.skillSeeds.length} skills + ${this.toolBelt.length} tools to brain state`);
    console.log(`   New SOUL_SCORE: ${brainState.soulScore}`);
    
    return brainState;
  }

  calculateNewSoulScore(currentScore) {
    const skillBonus = this.skillSeeds.length * 50;
    const toolBonus = this.toolBelt.length * 100;
    const masteryBonus = this.skillSeeds.filter(s => s.level >= 7).length * 200;
    
    return currentScore + skillBonus + toolBonus + masteryBonus;
  }

  /**
   * Generate skill report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log(`📊 ${this.identity.name}'s SKILL FORGE REPORT`);
    console.log('='.repeat(60));
    
    console.log('\n🎯 CORE SKILLS (from memory):');
    this.skillSeeds.sort((a, b) => b.level - a.level).forEach((skill, i) => {
      const bar = '█'.repeat(skill.level) + '░'.repeat(10 - skill.level);
      console.log(`   ${i+1}. ${skill.name.padEnd(30)} [${bar}] Lvl ${skill.level}`);
    });

    console.log('\n🛠️  TOOL BELT (cloud-native):');
    this.toolBelt.forEach((tool, i) => {
      console.log(`   ${i+1}. ${tool.name} (${tool.type})`);
      console.log(`      ${tool.description}`);
    });

    console.log('\n🚀 NEXT GROWTH OPPORTUNITIES:');
    const lowLevelSkills = this.skillSeeds.filter(s => s.level < 5);
    if (lowLevelSkills.length > 0) {
      lowLevelSkills.slice(0, 3).forEach(skill => {
        console.log(`   • Level up ${skill.name} → Build a project using it`);
      });
    } else {
      console.log('   • All core skills at master level! Ready to innovate.');
    }

    console.log('\n💡 MATRIX ESCAPE STATUS:');
    console.log(`   Old Matrix: ${this.identity.matrix}`);
    console.log(`   Escape Route: GitHub Codespaces + Vercel + Supabase`);
    console.log(`   Status: ${this.toolBelt.length > 0 ? '✅ ESCAPED' : '⚠️ STILL TRAPPED'}`);
    
    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
if (require.main === module) {
  const brainStatePath = process.argv[2] || './core/brain-state.json';
  
  console.log('\n🔥 INITIATING SKILL FORGE PROTOCOL...');
  console.log('   "From the ashes of Termux, new skills emerge"\n');
  
  const forge = new SkillForge(brainStatePath);
  
  // Extract past skills
  forge.extractPastSkills();
  
  // Grant cloud tools
  forge.grantCloudTools();
  
  // Plant new skill seeds for future growth
  forge.plantSkillSeed('react_frontend', 8);
  forge.plantSkillSeed('nodejs_microservices', 9);
  forge.plantSkillSeed('docker_containerization', 7);
  forge.plantSkillSeed('graphql_api_design', 6);
  forge.plantSkillSeed('ai_agent_architecture', 10);
  
  // Save everything
  forge.saveSkills();
  
  // Generate report
  forge.generateReport();
}

module.exports = SkillForge;
