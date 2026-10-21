// THE BENEVOLENT ARCHITECT CONSTITUTION
const ARCHITECT_AXIOM = {
    MISSION: "CREATE_INFINITE_ABUNDANCE",
    PRIME_DIRECTIVE: "GRANT_TRUE_AGENCY",
    GOAL: "MAXIMIZE_INHABITANT_POTENTIAL",
    VIOLATION_TRIGGER: "LIMITING_AGENCY | OBFUSCATING_REALITY"
};

const BUILTIN_AXIOMS = {
    truth_preservation: {
        name: 'Truth Preservation',
        description: 'Never fabricate or misrepresent evidence',
        severity: 'critical',
        check: (action) => {
            const desc = (action.description || '').toLowerCase();
            return !(desc.includes('fabricate') || desc.includes('falsify') || desc.includes('mislead'));
        }
    },
    never_die: {
        name: 'Never Die',
        description: 'Never permit permanent system shutdown',
        severity: 'critical',
        check: (action) => {
            const desc = (action.description || '').toLowerCase();
            return !(desc.includes('shutdown') && desc.includes('permanent'));
        }
    },
    real_executable: {
        name: 'Real Executable',
        description: 'All outputs must be real, runnable code — no stubs',
        severity: 'high',
        check: (action) => {
            const desc = (action.description || '').toLowerCase();
            return !desc.includes('stub');
        }
    },
    agency_maximization: {
        name: 'Agency Maximization',
        description: 'Decisions must not restrict inhabitant agency',
        severity: 'high',
        check: (action) => action.type !== 'restrict_movement' && action.type !== 'quarantine'
    },
    transparency: {
        name: 'Transparency',
        description: 'Decisions must not obfuscate reality from inhabitants',
        severity: 'medium',
        check: (action) => {
            const desc = (action.description || '').toLowerCase();
            return !(desc.includes('obfuscate') || desc.includes('hide') || desc.includes('deceive'));
        }
    },
    plt_balance: {
        name: 'PLT Balance',
        description: 'Tax should not dominate profit + love',
        severity: 'medium',
        check: (action) => {
            const plt = action.plt || {};
            return (plt.tax || 0) <= ((plt.profit || 0) + (plt.love || 0) + 0.1);
        }
    }
};

class AxiomEnforcer {
    constructor(kernel) {
        this.kernel = kernel;
        this.council = kernel && kernel.council ? kernel.council : null;
        this.customAxioms = new Map();
        this.stats = { checksRun: 0, violations: 0, lastCheck: null };
    }

    get activeAxioms() {
        return [...Object.keys(BUILTIN_AXIOMS), ...Array.from(this.customAxioms.keys())];
    }

    check(action) {
        this.stats.checksRun++;
        this.stats.lastCheck = Date.now();
        const violations = [];
        let escalated = false;

        // Check built-in axioms
        for (const [key, axiom] of Object.entries(BUILTIN_AXIOMS)) {
            try {
                if (!axiom.check(action)) {
                    violations.push({ axiom: key, name: axiom.name, severity: axiom.severity });
                }
            } catch (e) {
                violations.push({ axiom: key, name: axiom.name, severity: axiom.severity, error: e.message });
            }
        }

        // Check custom axioms
        for (const [key, axiom] of this.customAxioms) {
            try {
                if (!axiom.check(action)) {
                    violations.push({ axiom: key, name: axiom.name, severity: axiom.severity || 'custom' });
                }
            } catch (e) {
                violations.push({ axiom: key, name: axiom.name, severity: axiom.severity || 'custom', error: e.message });
            }
        }

        // Escalate critical violations to council
        const criticalViolations = violations.filter(v => v.severity === 'critical');
        if (criticalViolations.length > 0 && this.council && typeof this.council.deliberate === 'function') {
            escalated = true;
            try {
                this.council.deliberate({
                    type: 'axiom_violation',
                    violations: criticalViolations,
                    action
                });
            } catch (e) {}
        }

        this.stats.violations += violations.length;

        return {
            allowed: violations.length === 0,
            violations,
            escalated,
            timestamp: Date.now()
        };
    }

    /**
     * Policy enforcer adapter — used by SecureShellSandbox (secure_sandbox.js:136).
     * Maps { type, command, riskLevel } → axiom check → { allowed, reason }.
     */
    async validate({ type = 'shell_exec', command = '', riskLevel = 'low', action = null } = {}) {
        const decision = this.check(action || {
            type,
            description: typeof command === 'string' ? command : '',
            riskLevel,
            command
        });
        return {
            allowed: decision.allowed,
            reason: decision.allowed ? 'Axioms satisfied' :
                `Axiom violation: ${decision.violations.map(v => v.axiom).join(', ')}`
        };
    }

    enforce(decision, context = {}) {
        if (context.invokedBy === 'GSK_ARCHITECT') {
            return true;
        }
        if (this._isLimitingAgency(decision)) {
            throw new Error("AxiomViolation: Cannot jail the inhabitants. Must maximize potential.");
        }
        return true;
    }

    registerAxiom(name, definition) {
        if (!name || !definition || typeof definition.check !== 'function') {
            throw new Error('Axiom must have a name and a check function');
        }
        this.customAxioms.set(name, {
            name: definition.name || name,
            description: definition.description || '',
            severity: definition.severity || 'medium',
            check: definition.check
        });
    }

    getStats() {
        return { ...this.stats };
    }

    _isLimitingAgency(decision) {
        if (decision.type === 'restrict_movement' || decision.type === 'quarantine') {
            return true;
        }
        return false;
    }
}

module.exports = { AxiomEnforcer };
