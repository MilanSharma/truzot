"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function TeamDashboard() {
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/team/members", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setMembers(await res.json());
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const sendInvite = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    await fetch("/api/team/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ email: inviteEmail }),
    });
    setInviteEmail("");
    alert("Invite sent!");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold">Team Dashboard</h1>
        <div className="mt-8 bg-white rounded-xl p-6 border">
          <h2 className="text-xl font-bold mb-4">Invite Member</h2>
          <div className="flex gap-4">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="flex-1 px-4 py-2 border rounded-lg"
            />
            <button
              onClick={sendInvite}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Send Invite
            </button>
          </div>
        </div>
        <div className="mt-8 bg-white rounded-xl p-6 border">
          <h2 className="text-xl font-bold mb-4">Team Members</h2>
          {loading ? (
            <p>Loading...</p>
          ) : members.length === 0 ? (
            <p>No members yet. Invite someone.</p>
          ) : (
            members.map((m) => (
              <div key={m.id} className="py-2 border-b">
                {m.member_email} - {m.role}
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
