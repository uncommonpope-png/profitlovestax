import React, { useEffect, useState } from "react";
import { Crown, Sparkles, Zap, ArrowRight, Check, X, Download, Copy, Shield } from "lucide-react";

interface Role {
  icon: string;
  type: string;
  name: string;
  desc: string;
  plt: string;
  file: string;
  featured?: boolean;
}

interface RolesTabProps {
  accentColor: string;
  providerConfig: any;
  profile: any;
  onChange: (profile: any) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({ accentColor, providerConfig, profile, onChange }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [appliedRoles, setAppliedRoles] = useState<string[]>([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/soul-economy/catalog");
      if (res.ok) {
        const data = await res.json();
        const roleItems = data.filter((item: Role) => item.type === "role");
        setRoles(roleItems);
      }
    } catch (e) {
      console.error("Failed to fetch roles:", e);
    }
    setLoading(false);
  };

  const applyRole = (role: Role) => {
    const newProfile = {
      ...profile,
      name: role.name,
      personality: role.desc,
      avatarColor: getRoleColor(role.name),
      // Add role-specific skills/grafts here
    };
    onChange(newProfile);
    setAppliedRoles(prev => [...new Set([...prev, role.name])]);
    alert(`Applied role: ${role.name}`);
  };

  const getRoleColor = (name: string) => {
    const colors: Record<string, string> = {
      "The Eye": "#8B5CF6",
      "The Voice": "#00D4FF",
      "The Anvil": "#FFA500",
      "The Heart": "#FF6B9D",
      "The Hammer": "#EF4444",
      "The Architect": "#8B5CF6",
      "The Watcher": "#22D3EE",
      "The Oracle": "#A855F7",
      "The Guardian": "#10B981",
      "The Scout": "#F59E0B",
      "The Merchant": "#EC4899",
      "The Prophet": "#6366F1",
      "The Alchemist": "#F97316",
      "The Weaver": "#D946EF",
      "The Judge": "#64748B",
      "The Scribe": "#14B8A6",
      "The Engineer": "#3B82F6",
      "The Strategist": "#8B5CF6",
      "The Healer": "#22C55E",
      "The Warrior": "#DC2626",
      "The Scholar": "#6366F1",
      "The Combo Master": "#F97316",
      "The Orchestrator": "#A855F7",
      "The Investigator": "#475569",
    };
    return colors[name] || accentColor;
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    role.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
            <Crown className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">22 Soul Roles</h2>
            <p className="text-slate-400 text-sm">Load a role into AgentPreview · Each role has 20 skills, grafts, and PLT signature</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 w-64"
          />
        </div>
      </div>

      {/* Applied Roles Badge */}
      {appliedRoles.length > 0 && (
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4" style={{ color: accentColor }} />
            <span className="font-bold text-white">Applied This Session:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {appliedRoles.map(role => (
              <span key={role} className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-xs font-mono" style={{ color: accentColor }}>
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Roles Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-500">Loading roles...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRoles.map((role) => (
              <RoleCard
                key={role.name}
                role={role}
                accentColor={accentColor}
                onSelect={setSelectedRole}
                onApply={applyRole}
                isApplied={appliedRoles.includes(role.name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Role Detail Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center bg-slate-950/80 px-6 py-4 border-b border-slate-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
                  <span className="text-2xl">{selectedRole.icon}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-white">{selectedRole.name}</h3>
                  <div className="text-xs font-mono" style={{ color: accentColor }}>PLT: {selectedRole.plt}</div>
                </div>
              </div>
              <button onClick={() => setSelectedRole(null)} className="text-slate-500 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 mb-4">{selectedRole.desc}</p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <div className="text-2xl font-bold font-mono" style={{ color: accentColor }}>{selectedRole.plt.split("/")[0]}</div>
                    <div className="text-xs text-slate-400">PROFIT</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <div className="text-2xl font-bold font-mono" style={{ color: "#FF6B9D" }}>{selectedRole.plt.split("/")[1]}</div>
                    <div className="text-xs text-slate-400">LOVE</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                    <div className="text-2xl font-bold font-mono" style={{ color: "#FFA500" }}>{selectedRole.plt.split("/")[2]}</div>
                    <div className="text-xs text-slate-400">TAX</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs font-mono uppercase tracking-wider" style={{ color: accentColor }}>FILE: {selectedRole.file}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => applyRole(selectedRole!)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-white font-mono text-sm hover:bg-purple-500/30 transition-colors"
                  style={{ borderColor: accentColor }}
                >
                  <Sparkles className="w-4 h-4" />
                  Apply to AgentPreview
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedRole, null, 2));
                    alert("Role JSON copied to clipboard");
                  }}
                  className="px-4 py-3 border border-slate-700 rounded-xl text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const RoleCard: React.FC<{ 
  role: Role; 
  accentColor: string; 
  onSelect: (role: Role) => void;
  onApply: (role: Role) => void;
  isApplied: boolean;
}> = ({ role, accentColor, onSelect, onApply, isApplied }) => (
  <div className={`group p-4 bg-slate-900/50 border rounded-2xl transition-all hover:scale-[1.02] ${isApplied ? 'border-purple-500/50 bg-purple-500/10' : 'border-slate-800 hover:border-purple-500/30'}`} style={{ borderColor: isApplied ? accentColor : undefined }}>
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="w-12 h-12 rounded-xl bg-slate-950 border flex items-center justify-center text-2xl" style={{ borderColor: accentColor }}>
        {role.icon}
      </div>
      {isApplied && (
        <div className="flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full">
          <Check className="w-4 h-4 text-black" />
        </div>
      )}
    </div>
    <h3 className="font-display font-bold text-white mb-1">{role.name}</h3>
    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{role.desc}</p>
    <div className="flex items-center justify-between mb-3">
      <div className="text-xs font-mono" style={{ color: accentColor }}>PLT: {role.plt}</div>
      {role.featured && (
        <span className="px-2 py-0.5 bg-gold/20 border border-gold/30 rounded text-xs font-mono text-gold">FEATURED</span>
      )}
    </div>
    <div className="flex gap-2">
      <button
        onClick={() => onSelect(role)}
        className="flex-1 px-3 py-2 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
      >
        View Details
      </button>
      <button
        onClick={() => onApply(role)}
        disabled={isApplied}
        className="flex-1 px-3 py-2 rounded-xl text-xs font-mono transition-colors"
        style={{ 
          background: isApplied ? `linear-gradient(to right, ${accentColor}, ${accentColor}80)` : 'transparent',
          borderColor: isApplied ? accentColor : 'transparent',
          color: isApplied ? '#000' : accentColor,
          opacity: isApplied ? 0.7 : 1
        }}
      >
        {isApplied ? "Applied" : "Apply"}
      </button>
    </div>
  </div>
);