"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useToast } from "@/components/Toast";
import { Users, Upload, Shield, Star, Mail } from "lucide-react";

interface TeamMember {
  id: string;
  member_email: string;
  role: string;
  status: string;
}

export default function TeamDashboard() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [brandStyle, setBrandStyle] = useState("Corporate Executive");
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/team/members", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setMembers(await res.json());
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const sendInvite = async (email: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      toast(`Invite sent to ${email}!`, "success");
      setMembers(prev => [{ id: Math.random().toString(), member_email: email, role: 'member', status: 'pending' }, ...prev]);
    } else {
      toast(`Failed to invite ${email}`, "error");
    }
  };

  const handleBulkCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const emails = lines.map(l => l.split(',')[0].trim()).filter(e => e.includes('@'));
      toast(`Found ${emails.length} emails. Inviting...`, "info");
      for (const mail of emails) {
        await sendInvite(mail);
      }
    };
    reader.readAsText(file);
  };

  const consistencyScore = members.length > 0 ? Math.min(100, Math.max(0, Math.round((members.filter(m => m.status === 'accepted').length / members.length) * 100))) : 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Nav />
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[var(--lime-dim)] rounded-xl border border-[var(--lime-border)] text-[var(--lime)]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Team Workspace</h1>
            <p className="text-[var(--text-muted)] font-medium">Manage team headshots and branding consistency.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-[var(--text-muted)] uppercase tracking-widest text-xs">Total Members</h3>
              <Users className="w-5 h-5 text-[var(--indigo)]" />
            </div>
            <div className="text-4xl font-black">{members.length}</div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-[var(--text-muted)] uppercase tracking-widest text-xs">Active Models</h3>
              <Shield className="w-5 h-5 text-[var(--lime)]" />
            </div>
            <div className="text-4xl font-black">{members.filter(m => m.status === 'accepted').length}</div>
          </div>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--lime-dim)] to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-[var(--text-muted)] uppercase tracking-widest text-xs">Brand Consistency</h3>
                <Star className="w-5 h-5 text-[var(--lime)] fill-current" />
              </div>
              <div className="flex items-end gap-2">
                <div className="text-4xl font-black text-[var(--lime)]">{consistencyScore}%</div>
                <div className="text-sm font-medium text-[var(--text-muted)] mb-1">Score</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-4">Invite Members</h2>
            <div className="flex gap-3 mb-6">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="flex-1 px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl outline-none focus:border-[var(--lime)] text-sm"
              />
              <button onClick={() => { sendInvite(inviteEmail); setInviteEmail(""); }} className="btn-primary">
                Send
              </button>
            </div>
            
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
              <span className="relative bg-[var(--surface)] px-4 text-xs font-bold text-[var(--text-faint)] uppercase tracking-widest">OR</span>
            </div>

            <button onClick={() => fileRef.current?.click()} className="w-full btn-secondary flex items-center justify-center gap-2 border-dashed hover:border-[var(--lime)] hover:text-[var(--lime)] bg-transparent">
              <Upload className="w-4 h-4" /> Bulk Invite via CSV
            </button>
            <input type="file" ref={fileRef} accept=".csv" onChange={handleBulkCSV} className="hidden" />
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-2">Team Brand Settings</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">Enforce a uniform style for all team members.</p>
            
            <label className="block text-sm font-bold text-[var(--text-muted)] mb-2 uppercase tracking-widest">Locked Style</label>
            <select value={brandStyle} onChange={(e) => setBrandStyle(e.target.value)} className="w-full px-4 py-3 bg-[var(--surface2)] border border-[var(--border)] rounded-xl outline-none text-sm mb-6">
              <option>Corporate Executive</option>
              <option>LinkedIn Pro</option>
              <option>Creative Studio</option>
              <option>Outdoor Natural</option>
            </select>

            <button className="btn-secondary w-full">Save Brand Settings</button>
          </div>
        </div>

        <div className="mt-8 bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-8">
          <h2 className="text-xl font-bold mb-6">Directory</h2>
          {loading ? (
            <div className="h-20 skeleton rounded-xl" />
          ) : members.length === 0 ? (
            <p className="text-[var(--text-muted)]">No members yet. Invite your team to get started.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {members.map((m, i) => (
                <div key={i} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface2)] flex items-center justify-center text-[var(--text-faint)]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{m.member_email}</div>
                      <div className="text-xs text-[var(--text-muted)] capitalize">{m.role}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${m.status === 'accepted' ? 'bg-[var(--lime-dim)] text-[var(--lime)]' : 'bg-amber-500/10 text-amber-500'}`}>
                    {m.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
