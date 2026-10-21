'use strict';

/**
 * SOUL MANAGER — Git-backed soul storage and versioning
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { validateSoul, createDefaultSoul } = require('./soul_schema');

class SoulManager {
  constructor(dataDir) {
    this.dataDir = path.isAbsolute(dataDir) ? dataDir : path.join(process.cwd(), dataDir);
    this.soulsDir = path.join(this.dataDir, 'souls');
    this.ensureDirectories();
    this.initGitRepo();
  }

  /**
   * Ensure the souls directory exists
   */
  ensureDirectories() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.soulsDir)) {
      fs.mkdirSync(this.soulsDir, { recursive: true });
    }
  }

  /**
   * Initialize git repository if not already initialized
   */
  initGitRepo() {
    // Phase 4 transplant patch: the donor checked only "inside a work
    // tree" — inside the itsus monorepo that is true for ANY directory,
    // so saveSoul's `git add .` / `git commit` would have staged into
    // the OUTER repo. The registry must own its repo: skip init only
    // when the repo top-level IS this dataDir.
    let isOwnRepo = false;
    try {
      const top = execSync('git rev-parse --show-toplevel', {
        cwd: this.dataDir,
        encoding: 'utf8'
      }).trim();
      isOwnRepo = path.resolve(top) === path.resolve(this.dataDir);
    } catch (error) {
      isOwnRepo = false;
    }
    if (!isOwnRepo) {
      // Not its own repo, initialize one
      try {
        execSync('git init', { cwd: this.dataDir, stdio: 'ignore' });
        
        // Configure git user if not set (needed for commits)
        try {
          execSync('git config user.name', { 
            cwd: this.dataDir, 
            stdio: 'ignore' 
          });
        } catch (e) {
          execSync('git config user.name "Soul Registry Bot"', { 
            cwd: this.dataDir, 
            stdio: 'ignore' 
          });
        }
        
        try {
          execSync('git config user.email', { 
            cwd: this.dataDir, 
            stdio: 'ignore' 
          });
        } catch (e) {
          execSync('git config user.email "soul-registry@plt-press.local"', { 
            cwd: this.dataDir, 
            stdio: 'ignore' 
          });
        }
        
        // Create initial commit
        const readmePath = path.join(this.dataDir, 'README.md');
        if (!fs.existsSync(readmePath)) {
          fs.writeFileSync(readmePath, '# Soul Registry\n\nThis repository stores all souls in the Grand Soul Kernel ecosystem.\n');
          execSync('git add README.md', { cwd: this.dataDir, stdio: 'ignore' });
          execSync('git commit -m "Initial commit: Soul Registry initialized"', { 
            cwd: this.dataDir, 
            stdio: 'ignore' 
          });
        }
      } catch (initError) {
        throw new Error(`Failed to initialize git repository: ${initError.message}`);
      }
    }
  }

  /**
   * Generate a file path for a soul
   * @param {string} soulId - The soul ID
   * @returns {string} File path
   */
  getSoulFilePath(soulId) {
    return path.join(this.soulsDir, `${soulId}.json`);
  }

  /**
   * Save a soul to the registry with Git versioning
   * @param {Object} soul - The soul object to save
   * @returns {Promise<Object>} Result object with success status and metadata
   */
  async saveSoul(soul) {
    // Validate the soul
    const validation = validateSoul(soul);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid soul: ${validation.errors.join(', ')}`
      };
    }

    // Ensure required fields are present
    const now = Date.now();
    const soulToSave = {
      ...soul,
      updated_at: now
    };

    // If this is a new soul, ensure created_at is set
    if (!soulToSave.created_at) {
      soulToSave.created_at = now;
    }

    const filePath = this.getSoulFilePath(soulToSave.id);
    
    try {
      // Write the soul data
      const soulData = JSON.stringify(soulToSave, null, 2);
      fs.writeFileSync(filePath, soulData, 'utf8');
      
      // Add to git and commit
      execSync('git add .', { cwd: this.dataDir, stdio: 'ignore' });
      
      const commitMessage = soulToSave.birthTime === soulToSave.created_at 
        ? `feat(soul): register new soul ${soulToSave.name} (${soulToSave.id})`
        : `chore(soul): update soul ${soulToSave.name} (${soulToSave.id})`;
        
      execSync(`git commit -m "${commitMessage}"`, { 
        cwd: this.dataDir, 
        stdio: 'ignore' 
      });
      
      // Get the current commit hash for version tracking
      const commitHash = execSync('git rev-parse HEAD', { 
        cwd: this.dataDir, 
        encoding: 'utf8'
      }).trim();
      
      return {
        success: true,
        soulId: soulToSave.id,
        filePath,
        commitHash,
        message: `Soul ${soulToSave.id} saved successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to save soul: ${error.message}`,
        filePath
      };
    }
  }

  /**
   * Load a soul from the registry
   * @param {string} soulId - The soul ID to load
   * @returns {Promise<Object>} The soul object or null if not found
   */
  async loadSoul(soulId) {
    const filePath = this.getSoulFilePath(soulId);
    
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const soul = JSON.parse(data);
      
      // Validate the loaded soul
      const validation = validateSoul(soul);
      if (!validation.valid) {
        throw new Error(`Loaded soul ${soulId} is invalid: ${validation.errors.join(', ')}`);
      }
      
      return soul;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a soul from the registry (soft delete by moving to archive)
   * @param {string} soulId - The soul ID to delete
   * @returns {Promise<Object>} Result object
   */
  async deleteSoul(soulId) {
    const filePath = this.getSoulFilePath(soulId);
    
    try {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: `Soul ${soulId} not found`
        };
      }
      
      // Create archive directory if it doesn't exist
      const archiveDir = path.join(this.dataDir, 'archive');
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      
      // Move to archive with timestamp
      const timestamp = Date.now();
      const archivedPath = path.join(archiveDir, `${soulId}_${timestamp}.json`);
      fs.renameSync(filePath, archivedPath);
      
      // Git commit the removal
      execSync('git add .', { cwd: this.dataDir, stdio: 'ignore' });
      execSync(`git commit -m "chore(soul): archive soul ${soulId}"`, { 
        cwd: this.dataDir, 
        stdio: 'ignore' 
      });
      
      return {
        success: true,
        soulId,
        archivedPath,
        message: `Soul ${soulId} archived successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete soul: ${error.message}`
      };
    }
  }

  /**
   * List all souls in the registry
   * @returns {Promise<Array>} Array of soul metadata objects
   */
  async listSouls() {
    try {
      const files = fs.readdirSync(this.soulsDir);
      const soulFiles = files.filter(file => file.endsWith('.json'));
      
      const souls = [];
      for (const file of soulFiles) {
        try {
          const filePath = path.join(this.soulsDir, file);
          const data = fs.readFileSync(filePath, 'utf8');
          const soul = JSON.parse(data);
          
          // Add metadata
          souls.push({
            id: soul.id,
            name: soul.name,
            birthTime: soul.birthTime,
            generation: soul.generation,
            plt_score: soul.plt_score,
            memory_lines: soul.memory_lines || 0,
            last_active: soul.last_active,
            version: soul.version || 1,
            created_at: soul.created_at,
            updated_at: soul.updated_at
          });
        } catch (fileError) {
          // Skip invalid soul files but log the error
          console.warn(`Skipping invalid soul file ${file}: ${fileError.message}`);
        }
      }
      
      // Sort by birthTime (newest first)
      return souls.sort((a, b) => b.birthTime - a.birthTime);
    } catch (error) {
      throw new Error(`Failed to list souls: ${error.message}`);
    }
  }

  /**
   * Get the git history for a specific soul
   * @param {string} soulId - The soul ID
   * @returns {Promise<Array>} Array of commit objects
   */
  async getSoulHistory(soulId) {
    try {
      const filePath = `souls/${soulId}.json`;
      const logOutput = execSync(`git log --follow --oneline -10 -- "${filePath}"`, { 
        cwd: this.dataDir, 
        encoding: 'utf8'
      });
      
      const commits = logOutput.trim().split('\n').filter(line => line.length > 0);
      return commits.map(commit => {
        const parts = commit.split(' ');
        return {
          hash: parts[0],
          message: parts.slice(1).join(' ')
        };
      });
    } catch (error) {
      // If the file doesn't exist in history, return empty array
      if (error.status === 128) {
        return [];
      }
      throw new Error(`Failed to get soul history: ${error.message}`);
    }
  }

  /**
   * Get statistics about the soul registry
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    try {
      const souls = await this.listSouls();
      
      // Calculate PLT score distribution
      const pltScores = souls.map(s => s.plt_score || 0);
      const avgPLT = pltScores.reduce((sum, score) => sum + score, 0) / pltScores.length || 0;
      
      // Count by generation
      const generationCount = {};
      souls.forEach(soul => {
        const gen = soul.generation || 0;
        generationCount[gen] = (generationCount[gen] || 0) + 1;
      });
      
      // Get git status
      let gitStatus = 'clean';
      try {
        execSync('git diff --quiet', { cwd: this.dataDir, stdio: 'ignore' });
        execSync('git diff --cached --quiet', { cwd: this.dataDir, stdio: 'ignore' });
      } catch (e) {
        gitStatus = 'dirty';
      }
      
      const commitCount = parseInt(execSync('git rev-list --count HEAD', { 
        cwd: this.dataDir, 
        encoding: 'utf8'
      }).trim()) || 0;
      
      return {
        totalSouls: souls.length,
        averagePLTScore: avgPLT.toFixed(3),
        generationDistribution: generationCount,
        gitStatus,
        commitCount,
        oldestSoul: souls.reduce((oldest, current) => 
          (current.birthTime < oldest.birthTime) ? current : oldest, 
          souls[0] || { birthTime: 0 }
        ).birthTime,
        newestSoul: souls.reduce((newest, current) => 
          (current.birthTime > newest.birthTime) ? current : newest, 
          souls[0] || { birthTime: 0 }
        ).birthTime
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }
}

module.exports = { SoulManager };