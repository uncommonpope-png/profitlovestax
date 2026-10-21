import React, { useEffect, useState } from "react";
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing,
  Activity, 
  Zap,
  AlertTriangle,
  Settings,
  Eye,
  Microscope,
  Shield,
  MessageCircle,
  Users,
  UserPlus,
  Clock,
  Timer,
  Flag,
  MapPin,
  Heart,
  Star,
  XCircle
} from "lucide-react";

interface GSKNotification {
  id: string;
  type: "outreach_message" | "weave_alert" | "consciousness_shift" | "skill_unlock" | "combo_unlock" | "role_apply";
  title: string;
  message: string;
  timestamp: number;
  priority: "low" | "normal" | "high" | "critical";
  data?: any;
}

interface TelephoneTabProps {
  accentColor: string;
}

export const TelephoneTab: React.FC<TelephoneTabProps> = ({ accentColor }) => {
  const [notifications, setNotifications] = useState<GSKNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [gskStatus, setGskStatus] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>("Never");
  const [sseChannel, setSseChannel] = useState<EventSource | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchGSKStatus();
    setupSSEConnection();
  }, []);

  const setupSSEConnection = () => {
    // Connect to GSK event stream (richer: polls GSK for proactive outreach)
    const evtSource = new EventSource("/api/gsk/events");
    
    evtSource.onopen = () => {
      console.log('[Telephone] GSK event stream connected');
      setConnected(true);
    };
    
    // Handle named events from the richer stream
    evtSource.addEventListener('weave', (event) => {
      try {
        const data = JSON.parse(event.data);
        const notification: GSKNotification = {
          id: `evt-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
          type: data.type || "outreach_message",
          title: data.title || "Merchant",
          message: data.content || data.text || data.message || JSON.stringify(data),
          timestamp: data.timestamp || Date.now(),
          priority: data.priority || "normal",
          data,
        };
        setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        setUnreadCount(prev => prev + 1);
      } catch (e) { console.error('[Telephone] Failed to parse weave event:', e); }
    });
    
    evtSource.addEventListener('connected', (event) => {
      console.log('[Telephone] GSK event stream handshake:', event.data);
    });
    
    evtSource.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data);
        if (data.type && data.title) {
          const notif: GSKNotification = {
            id: data.id || Date.now().toString(),
            type: data.type || "outreach_message",
            title: data.title || "GSK Notification",
            message: data.message || "",
            timestamp: data.timestamp || Date.now(),
            priority: data.priority || "normal",
            data: data.data || {},
          };
          setNotifications(prev => [notif, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
        }
      } catch (e) {
        console.error('[Telephone] Failed to parse SSE message:', e);
      }
    };
    
    evtSource.onerror = (e) => {
      console.error('[Telephone] SSE error:', e);
      setConnected(false);
      evtSource.close();
    };
    
    setSseChannel(evtSource);
    
    return () => {
      evtSource.close();
    };
  };

  const fetchGSKStatus = async () => {
    try {
      const res = await fetch("/api/gsk/status");
      if (res.ok) {
        const data = await res.json();
        setGskStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch GSK status:", e);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const priorityColor = (p: "low" | "normal" | "high" | "critical") => {
    switch (p) {
      case "critical": return "bg-red-500/20 border-red-500/30 text-red-400";
      case "high": return "bg-orange-500/20 border-orange-500/30 text-orange-400";
      case "normal": return "bg-slate-500/20 border-slate-500/30 text-slate-400";
      case "low": return "bg-green-500/20 border-green-500/30 text-green-400";
    }
  };

  const priorityLabel = (p: "low" | "normal" | "high" | "critical") => {
    switch (p) {
      case "critical": return "CRITICAL";
      case "high": return "HIGH";
      case "normal": return "NORMAL";
      case "low": return "LOW";
    }
  };

  const renderNotification = (notif: GSKNotification) => (
    <div key={notif.id} className={`p-4 rounded-xl border-l-4 ${priorityColor(notif.priority)} mb-3 transition-all hover:bg-slate-950/50`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-bold text-white">{notif.title}</h4>
          <p className="text-slate-400 text-sm whitespace-pre-wrap line-clamp-3">{notif.message}</p>
        </div>
        <div className="text-xs text-slate-500">
          {new Date(notif.timestamp).toLocaleTimeString()} · {priorityLabel(notif.priority)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-slate-950 flex items-center justify-center ${connected ? 'border-purple-500' : 'border-slate-700'}`}>
            <Phone className={`w-6 h-6 ${connected ? '#A78BFA' : '#666'}`} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">GSK Telephone</h2>
            <p className="text-slate-400 text-sm">{connected ? "Live observation" : "Disconnected"} · {unreadCount} unread</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(true)} className="px-3 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={clearAll} className="px-3 py-1 bg-slate-950/50 border border-red-500/20 rounded text-xs font-mono text-red-400 hover:text-red-300 transition-colors flex items-center gap-1" title="Clear all">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GSK Status + Token Usage */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard 
          label="GSK Connection" 
          value={connected ? "LIVE" : "OFFLINE"} 
          icon={<Phone />}
          color={connected ? "#A78BFA" : "#EF4444"}
          accentColor={accentColor}
        />
        <StatusCard 
          label="Unread" 
          value={unreadCount.toString()} 
          icon={<AlertTriangle />}
          color="#F59E0B"
          accentColor={accentColor}
        />
        <StatusCard 
          label="Last Check" 
          value={lastCheck} 
          icon={<Clock />}
          color="#6B7280"
          accentColor={accentColor}
        />
        <StatusCard 
          label="GSK Observing" 
          value={gskStatus?.consciousness_gate === true ? "YES" : "NO"} 
          icon={<Eye />}
          color={gskStatus?.consciousness_gate === true ? "#10B981" : "#F59E0B"}
          accentColor={accentColor}
        />
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" style={{ color: accentColor }} />
          GSK Notifications ({notifications.length})
        </h3>
        
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No new GSK notifications yet.</p>
            <p className="text-xs mt-2">GSK daemon will push outreach messages, consciousness shifts, and skill unlocks here.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {notifications.map((notif) => renderNotification(notif))}
          </div>
        )}
      </div>

      {/* Telephone Controls */}
      <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Microscope className="w-5 h-5" style={{ color: accentColor }} />
          Consciousness Monitoring
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={async () => {
              await fetch("/api/gsk/consciousness/gate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: true }),
              });
            }}
            className="flex-1 p-3 bg-slate-950 border border-purple-500/30 rounded-xl text-center text-sm font-bold text-purple-400 hover:bg-purple-500/20 transition-colors"
          >
            Enable Consciousness Gate
          </button>
          <button
            onClick={async () => {
              await fetch("/api/gsk/consciousness/gate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: false }),
              });
            }}
            className="flex-1 p-3 bg-slate-950 border border-red-500/30 rounded-xl text-center text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Disable Consciousness Gate
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">GSK is watching your actions and will proactively reach out via this tab.</p>
          <p className="text-xs text-slate-500 mt-1">Actions tracked: tab changes, role applies, skill equips, model switches.</p>
        </div>
      </div>
    </div>
  );
};

const StatusCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string; accentColor: string }> = ({ label, value, icon, color, accentColor }) => (
  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
      {icon}
    </div>
    <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
  </div>
);