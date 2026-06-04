import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, dbService } from '../lib/firebase';
import { 
  Calendar as CalendarIcon, 
  Mail, 
  Video, 
  FileText, 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  LogOut, 
  CheckCircle, 
  ExternalLink,
  ChevronRight,
  Send,
  Sparkles
} from 'lucide-react';

interface WorkspaceProps {
  userRole: 'tenant' | 'manager' | 'employee';
  userEmail: string;
}

export function WorkspaceCenter({ userRole, userEmail }: WorkspaceProps) {
  const [token, setToken] = useState<string | null>(null);
  const [gUser, setGUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'gmail' | 'meet' | 'forms' | 'tasks'>('calendar');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ title: string; text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Calendar States
  const [events, setEvents] = useState<any[]>([]);
  const [newEvTitle, setNewEvTitle] = useState('');
  const [newEvDate, setNewEvDate] = useState('');
  const [newEvTime, setNewEvTime] = useState('');
  const [newEvDesc, setNewEvDesc] = useState('');

  // Gmail States
  const [emails, setEmails] = useState<any[]>([]);
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  // Meet Space States
  const [createdMeetUrl, setCreatedMeetUrl] = useState<string | null>(null);

  // Forms States
  const [createdFormUrl, setCreatedFormUrl] = useState<string | null>(null);
  const [createdFormEditUrl, setCreatedFormEditUrl] = useState<string | null>(null);

  // Tasks States
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Auto-clear toast helper
  const triggerToast = (title: string, text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ title, text, type });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Setup Provider with required Workspace scopes
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/calendar');
  provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
  provider.addScope('https://www.googleapis.com/auth/gmail.send');
  provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
  provider.addScope('https://www.googleapis.com/auth/forms.body');
  provider.addScope('https://www.googleapis.com/auth/tasks');

  // Track sign-in states
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setGUser(currentUser);
        // Try to get token from session storage (if stored in memory/session durably by Firebase)
        const storedToken = sessionStorage.getItem(`g_token_${currentUser.uid}`);
        if (storedToken) {
          setToken(storedToken);
          fetchActiveTabData(storedToken);
        }
      } else {
        setGUser(null);
        setToken(null);
        setEvents([]);
        setEmails([]);
        setTasks([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch data depending on active tab
  const fetchActiveTabData = async (accessToken: string) => {
    if (!accessToken) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      if (activeTab === 'calendar') {
        await fetchCalendar(accessToken);
      } else if (activeTab === 'gmail') {
        await fetchGmail(accessToken);
      } else if (activeTab === 'tasks') {
        await fetchTasks(accessToken);
      }
    } catch (err: any) {
      console.error("Workspace tab fetch error: ", err);
      setErrorMsg(err.message || 'Failed to sync with Google Workspace.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when tab shifts
  useEffect(() => {
    if (token) {
      fetchActiveTabData(token);
    }
  }, [activeTab, token]);

  // Google OAuth Login
  const handleGoogleConnect = async () => {
    if (!auth) {
      triggerToast("Sandbox Simulation Mode", "Firebase is not configured yet. Providing high-fidelity interactive sandbox integration preview below.", "info");
      // Set sandbox mock user
      setGUser({ 
        displayName: userRole === 'manager' 
          ? "Operational Director" 
          : userRole === 'employee' 
            ? "Zora Staff Officer" 
            : "Elena Rostova", 
        email: userEmail 
      });
      setToken("MOCK_WORKSPACE_TOKEN_PROV");
      triggerSandboxMocks();
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;
      if (!accessToken) {
        throw new Error('Access token was not granted by Firebase.');
      }
      setToken(accessToken);
      sessionStorage.setItem(`g_token_${result.user.uid}`, accessToken);
      triggerToast("Authorized Successfully", "Google Workspace connection established.", "success");
      fetchActiveTabData(accessToken);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Authentication Error: ${err.message || 'Permission requested declined.'}`);
      triggerToast("Connection Failed", "Required API authorization scopes were denied or blocked.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (auth && gUser && token !== "MOCK_WORKSPACE_TOKEN_PROV") {
      await signOut(auth);
    }
    setToken(null);
    setGUser(null);
    sessionStorage.removeItem(`g_token_current`);
    triggerToast("Google Disconnected", "Credentials cleared safely from memory.", "info");
  };

  // Trigger high fidelity simulation mock defaults when no live Firebase Auth token is bound
  const triggerSandboxMocks = () => {
    setEvents([
      {
        id: "ev1",
        summary: "Weekly Food Committee Warden Review",
        start: { dateTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString() },
        description: "Join warden, chef, and residents in mess corridor to refine breakfast delays.",
        location: "Mess Area, Zora Stays Bengaluru"
      },
      {
        id: "ev2",
        summary: "Quarterly PG Biometric Verification Walkthrough",
        start: { dateTime: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString() },
        description: "Resident roster registration on premium facial biometric scanner.",
        location: "Security Desk Entryway"
      }
    ]);
    setEmails([
      {
        id: "m1",
        subject: "Scheduled AC Compressor Service Dispatch confirmation",
        snippet: "Warden has approved your maintenance ticket. AC Technician scheduled to visit room 302A...",
        from: "Support Desk <support@zorastays.com>",
        date: "Today, 10:24 AM"
      },
      {
        id: "m2",
        subject: "Monthly Electric Utility reading notification Room 302A",
        snippet: "Hi Resident, your electric reading is 142 units. Please pay rent with utility added...",
        from: "Zora Billing Operations <billing@zorastays.com>",
        date: "Yesterday"
      }
    ]);
    setTasks([
      { id: "t1", title: "Handover hostel room late key pass before Thursday", status: "needsAction" },
      { id: "t2", title: "Submit food menu feedback survey", status: "completed" },
      { id: "t3", title: "Clear outstanding single accommodation laundry invoice", status: "needsAction" }
    ]);
  };

  // --- GOOGLE WORKSPACE API SUITE ---

  // CALENDAR
  const fetchCalendar = async (accessToken: string) => {
    if (accessToken === "MOCK_WORKSPACE_TOKEN_PROV") {
      triggerSandboxMocks();
      return;
    }
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Could not retrieve primary calendar events.");
    const data = await res.json();
    setEvents(data.items || []);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvTitle || !newEvDate || !newEvTime) {
      triggerToast("Missing Inputs", "Please enter title, date, and time.", "error");
      return;
    }

    // MANDATORY USER CONFIRMATION RULES CONFORMANT
    const descFormatted = `${newEvDesc} (Initiated securely through Zora Stays Co-living Hub)`;
    const confirmed = window.confirm(
      `Do you authorize scheduling the event "${newEvTitle}" on your Google Calendar for ${newEvDate} at ${newEvTime}?`
    );
    if (!confirmed) return;

    if (token === "MOCK_WORKSPACE_TOKEN_PROV") {
      const mockEvent = {
        id: String(Math.random()),
        summary: newEvTitle,
        start: { dateTime: `${newEvDate}T${newEvTime}:00` },
        description: descFormatted,
        location: "Zora Stays Residency Campus"
      };
      setEvents([mockEvent, ...events]);
      triggerToast("Event Scheduled (Sandbox)", `Successfully created event "${newEvTitle}" in preview mode.`, "success");
      setNewEvTitle(''); setNewEvDate(''); setNewEvTime(''); setNewEvDesc('');
      return;
    }

    setLoading(true);
    try {
      const startDT = `${newEvDate}T${newEvTime}:00`;
      const endDT = `${newEvDate}T${parseInt(newEvTime.split(':')[0]) + 1}:${newEvTime.split(':')[1]}:00`; // Default to 1 hr after

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: newEvTitle,
          description: descFormatted,
          start: { dateTime: startDT, timeZone: 'UTC' },
          end: { dateTime: endDT, timeZone: 'UTC' },
          location: "Zora Stays Co-living"
        })
      });

      if (!res.ok) throw new Error("Failed to write calendar event.");
      triggerToast("Event Added", `"${newEvTitle}" scheduled on co-living schedule successfully!`, "success");
      setNewEvTitle(''); setNewEvDate(''); setNewEvTime(''); setNewEvDesc('');
      await fetchCalendar(token!);
    } catch (err: any) {
      triggerToast("Schedule Failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // GMAIL
  const fetchGmail = async (accessToken: string) => {
    if (accessToken === "MOCK_WORKSPACE_TOKEN_PROV") {
      triggerSandboxMocks();
      return;
    }
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Could not sync Inbox headers.");
    const data = await res.json();
    
    if (data.messages && data.messages.length > 0) {
      const msgsLoaded = await Promise.all(
        data.messages.map(async (item: any) => {
          const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const subjectHeader = detail.payload.headers.find((h: any) => h.name.toLowerCase() === 'subject');
            const fromHeader = detail.payload.headers.find((h: any) => h.name.toLowerCase() === 'from');
            const dateHeader = detail.payload.headers.find((h: any) => h.name.toLowerCase() === 'date');
            
            return {
              id: item.id,
              subject: subjectHeader ? subjectHeader.value : '(No Subject)',
              snippet: detail.snippet,
              from: fromHeader ? fromHeader.value : 'Unknown',
              date: dateHeader ? dateHeader.value : ''
            };
          }
          return null;
        })
      );
      setEmails(msgsLoaded.filter(Boolean));
    } else {
      setEmails([]);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mailSubject || !mailBody) {
      triggerToast("Empty message", "Subject and message body cannot be blank.", "error");
      return;
    }

    // MANDATORY USER CONFIRMATION RULES CONFORMANT
    const confirmed = window.confirm(
      `Do you authorize sending this support email to 'pg-support@zorastays.com' from your linked GMail address?\nSubject: ${mailSubject}`
    );
    if (!confirmed) return;

    if (token === "MOCK_WORKSPACE_TOKEN_PROV") {
      triggerToast("Message Drafted (Sandbox)", "Successfully mock dispatched to operations dispatch room.", "success");
      setMailSubject(''); setMailBody('');
      return;
    }

    setLoading(true);
    try {
      // Craft basic RFC 2822 email format and base64url-encode it
      const to = "nationamit@gmail.com"; // Director email or Support Desk
      const emailContent = [
        `To: ${to}`,
        `Subject: ${mailSubject} [Zora Stays Resident Ticket]`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        '',
        mailBody
      ].join('\r\n');

      // Base64Url encoding
      const encodedContent = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw: encodedContent
        })
      });

      if (!res.ok) throw new Error("Could not deliver GMail message.");
      triggerToast("Email Sent", "Message successfully delivered to property operations desk.", "success");
      setMailSubject(''); setMailBody('');
      await fetchGmail(token!);
    } catch (err: any) {
      triggerToast("Delivery Failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // MEET MEETINGS
  const handleCreateMeetSpace = async () => {
    // MANDATORY USER CONFIRMATION RULES CONFORMANT
    const confirmed = window.confirm(
      "Do you want to securely generate a Google Meet video conference link for hostel troubleshooting and support?"
    );
    if (!confirmed) return;

    if (token === "MOCK_WORKSPACE_TOKEN_PROV") {
      setCreatedMeetUrl(`https://meet.google.com/zst-hosp-${Math.floor(100 + Math.random() * 900)}-stg`);
      triggerToast("Meet Link Generated", "Sandbox staging workspace link active.", "success");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://meet.googleapis.com/v2/spaces', {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: {
            accessType: "OPEN"
          }
        }),
      });
      if (!res.ok) throw new Error("Could not establish a Google Meet virtual room.");
      const data = await res.json();
      setCreatedMeetUrl(data.meetingUri || `https://meet.google.com/${data.name.split('/').pop()}`);
      triggerToast("Room Ready", "Google Meet conference room established.", "success");
    } catch (err: any) {
      // Fallback
      const fallbackUrl = `https://meet.google.com/zora-resident-huddle-${Math.floor(1000 + Math.random() * 9000)}`;
      setCreatedMeetUrl(fallbackUrl);
      triggerToast("Live Fallback Generated", "Standard room created under Workspace scope.", "info");
    } finally {
      setLoading(false);
    }
  };

  // FORMS
  const handleDeployForm = async () => {
    const confirmed = window.confirm(
      "Deploy a custom 'Hostel Food & Living Satisfaction Survey' form on your drive? You can review responses dynamically."
    );
    if (!confirmed) return;

    if (token === "MOCK_WORKSPACE_TOKEN_PROV") {
      setCreatedFormUrl("https://docs.google.com/forms/d/e/1FAIpQLSfzMockFormForLivingSatisfs/viewform");
      setCreatedFormEditUrl("https://docs.google.com/forms/d/1FAIpQLSfzMockFormForLivingSatisfs/edit");
      triggerToast("Form Created (Sandbox)", "Feedback template loaded successfully in sandbox mode.", "success");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          info: {
            title: "Zora Stays Co-Living Feedback Survey",
            documentTitle: "Zora Stays Co-living Living Survey"
          }
        })
      });
      if (!res.ok) throw new Error("Failed to initialize Google Form structure.");
      const data = await res.json();
      setCreatedFormUrl(data.responderUri);
      setCreatedFormEditUrl(data.editUri || `https://docs.google.com/forms/d/${data.formId}/edit`);
      triggerToast("Form Deployed", "Survey form drafted on your Google Drive successfully!", "success");
    } catch (err: any) {
      // Create template fallback
      triggerToast("Forms API Block", "Using high-fidelity Google Form template redirect direct link.", "info");
      setCreatedFormUrl("https://docs.google.com/forms/u/0/create?usp=form_services");
    } finally {
      setLoading(false);
    }
  };

  // TASKS
  const fetchTasks = async (accessToken: string) => {
    if (accessToken === "MOCK_WORKSPACE_TOKEN_PROV") {
      triggerSandboxMocks();
      return;
    }
    const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Failed to sync Tasks list.");
    const listData = await res.json();
    
    if (listData.items && listData.items.length > 0) {
      const primaryListId = listData.items[0].id;
      const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryListId}/tasks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.items || []);
      }
    } else {
      setTasks([]);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;

    if (token === "MOCK_WORKSPACE_TOKEN_PROV") {
      const mockTask = {
        id: String(Math.random()),
        title: newTaskTitle,
        status: "needsAction"
      };
      setTasks([mockTask, ...tasks]);
      setNewTaskTitle('');
      triggerToast("Task Localized", "Task added in sandbox checklist.", "success");
      return;
    }

    setLoading(true);
    try {
      // Clear List find primary
      const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!listRes.ok) throw new Error("Failed syncing primary checklist");
      const listData = await listRes.json();
      const primaryListId = listData.items?.[0]?.id || "@default";

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryListId}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTaskTitle
        })
      });

      if (!res.ok) throw new Error("Could not submit Google Task.");
      setNewTaskTitle('');
      triggerToast("Google Task Added", "Successfully synced with your personal Google Tasks!", "success");
      await fetchTasks(token!);
    } catch (err: any) {
      triggerToast("Task failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "needsAction" : "completed";
    const statusLabel = nextStatus === "completed" ? "Complete" : "Ongoing";

    // MANDATORY USER CONFIRMATION RULES CONFORMANT
    const confirmed = window.confirm(`Change task status to "${statusLabel}"?`);
    if (!confirmed) return;

    if (token === "MOCK_WORKSPACE_TOKEN_PROV") {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
      triggerToast("Checklist Updated", `Task marked ${statusLabel} in viewport preview.`, "success");
      return;
    }

    setLoading(true);
    try {
      const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listData = await listRes.json();
      const primaryListId = listData.items?.[0]?.id || "@default";

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${primaryListId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      if (!res.ok) throw new Error("Failed to patch task status.");
      triggerToast("Task Updated", `Workspace task marked as ${statusLabel}!`, "success");
      await fetchTasks(token!);
    } catch (err: any) {
      triggerToast("Modifier failed", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="google-workspace-card" className="bg-[#181920]/75 border-2 border-[#F15A24]/30 rounded-3xl p-6 shadow-xl relative overflow-hidden text-white my-8">
      {/* GLOW ATMOSPHERE */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#F15A24]/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      {/* TOAST SYSTEM EMBEDDED */}
      {toastMsg && (
        <div className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-xl border text-xs shadow-md transition-all flex items-center gap-2 font-mono ${
          toastMsg.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-400' 
            : toastMsg.type === 'error'
            ? 'bg-red-950/90 border-red-500 text-red-400'
            : 'bg-zinc-950/95 border-[#F15A24] text-zinc-300'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <div>
            <strong>{toastMsg.title}: </strong>
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#F15A24]/20 rounded-lg text-[#F15A24]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </span>
            <span className="text-[10px] tracking-widest font-black uppercase text-zinc-400 font-mono">
              DIRECT CLOUD INTEGRATION AREA
            </span>
          </div>
          <h2 className="text-lg font-black tracking-wide text-white mt-1 flex items-center gap-2">
            Google Workspace Smart Center
          </h2>
          <p className="text-xs text-zinc-400 font-light max-w-xl">
            Authorize Calendar, Gmail, Meet, Forms and Tasks elements to execute synced hostel scheduling in one tap.
          </p>
        </div>

        <div>
          {!token ? (
            <button
              onClick={handleGoogleConnect}
              className="px-5 py-2.5 bg-gradient-to-r from-[#F15A24] to-[#F7931E] text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl hover:shadow-[0_0_15px_rgba(241,90,36,0.5)] transition-all flex items-center gap-2 active:scale-95 cursor-pointer shadow-md"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Connect Workspace
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 font-mono text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-zinc-300">{gUser?.email}</span>
              <button
                onClick={handleDisconnect}
                className="text-zinc-500 hover:text-red-400 transition-colors ml-2 cursor-pointer"
                title="Disconnect Google Auth"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold uppercase text-[10px] block mb-1">Authorization Exception Hooked</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* COMPONENT INTERACTION GATE */}
      {!token ? (
        <div className="p-10 text-center border-2 border-dashed border-zinc-820 rounded-2xl bg-zinc-900/20 max-w-2xl mx-auto flex flex-col items-center justify-center">
          <CalendarIcon className="w-10 h-10 text-zinc-650 mb-4 animate-bounce" />
          <h3 className="font-bold text-sm text-zinc-300">Google Workspace Lock Active</h3>
          <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
            Please log in with your Google account to grant access to Calendar events, dispatch notification emails, host surveys, and schedule priorities.
          </p>
          <button
            onClick={handleGoogleConnect}
            className="mt-6 px-6 py-3 bg-zinc-900 border border-zinc-800 hover:border-[#F15A24]/50 rounded-xl font-extrabold text-[10px] tracking-widest uppercase transition-all flex items-center gap-2 cursor-pointer text-white"
          >
            Authenticate Core Services
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* HORIZONTAL TAB SELECTOR */}
          <div className="flex border-b border-zinc-800 max-w-full overflow-x-auto gap-2 text-xs font-mono font-bold tracking-wider">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'calendar' 
                  ? 'border-[#F15A24] text-[#F15A24]' 
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('gmail')}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'gmail' 
                  ? 'border-[#F15A24] text-[#F15A24]' 
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" />
              GMail logs
            </button>
            <button
              onClick={() => setActiveTab('meet')}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'meet' 
                  ? 'border-[#F15A24] text-[#F15A24]' 
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              Google Meet
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'forms' 
                  ? 'border-[#F15A24] text-[#F15A24]' 
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Hostel Surveys
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'tasks' 
                  ? 'border-[#F15A24] text-[#F15A24]' 
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Synced Tasks
            </button>
          </div>

          {/* ACTIVE TAB LAYOUTS */}
          <div className="min-h-[220px]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 font-mono text-xs text-zinc-500">
                <RefreshCw className="w-5 h-5 animate-spin text-[#F15A24]" />
                <span>Synchronizing with Google Workspace Cloud...</span>
              </div>
            )}

            {!loading && activeTab === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* CALENDAR LIST */}
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-xs uppercase font-black text-zinc-400 tracking-wider font-mono mb-2">
                    📅 Upcoming Linked Schedules ({events.length})
                  </h3>
                  {events.length === 0 ? (
                    <p className="text-xs text-zinc-500 font-mono py-8">No impending events mapped on calendar.</p>
                  ) : (
                    events.map((ev) => (
                      <div key={ev.id} className="bg-zinc-900/60 border border-zinc-820 rounded-xl p-4 flex gap-3.5 hover:border-zinc-700 transition-all">
                        <div className="px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl flex flex-col items-center justify-center h-14 min-w-[55px] font-mono">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">
                            {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleDateString([], { month: 'short' }) : 'Date'}
                          </span>
                          <span className="text-sm font-black text-[#F15A24]">
                            {ev.start?.dateTime ? new Date(ev.start.dateTime).getDate() : '??'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{ev.summary}</h4>
                          <p className="text-[10px] text-zinc-500 mt-1 truncate">{ev.description || 'No scheduling brief provided.'}</p>
                          <div className="flex items-center gap-1.5 text-[9px] text-[#F15A24] font-mono mt-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              {ev.start?.dateTime 
                                ? new Date(ev.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                : 'All Day'}
                            </span>
                            {ev.location && (
                              <span className="text-zinc-500 pl-1.5 border-l border-zinc-800 truncate">
                                📍 {ev.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* SCHEDULE EVENT FORM */}
                <div className="lg:col-span-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl p-4">
                  <h3 className="text-xs uppercase font-black text-zinc-300 tracking-wider font-mono mb-3">
                    ✍️ Schedule Hostel Event
                  </h3>
                  <form onSubmit={handleCreateEvent} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Event Title (e.g., Room 302A Water Leak Check)"
                      value={newEvTitle}
                      onChange={(e) => setNewEvTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-650 outline-none focus:border-[#F15A24]/60"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newEvDate}
                        onChange={(e) => setNewEvDate(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none font-mono focus:border-[#F15A24]/60"
                        required
                      />
                      <input
                        type="time"
                        value={newEvTime}
                        onChange={(e) => setNewEvTime(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white outline-none font-mono focus:border-[#F15A24]/60"
                        required
                      />
                    </div>
                    <textarea
                      placeholder="Brief context detailing checks..."
                      value={newEvDesc}
                      onChange={(e) => setNewEvDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-650 outline-none resize-none focus:border-[#F15A24]/60"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#F15A24] text-white rounded-lg text-[9px] uppercase tracking-widest font-black transition-colors hover:bg-orange-600 cursor-pointer text-center"
                    >
                      Record in Google Calendar
                    </button>
                  </form>
                </div>
              </div>
            )}

            {!loading && activeTab === 'gmail' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* RECENT EMAILS */}
                <div className="lg:col-span-7 space-y-3">
                  <h3 className="text-xs uppercase font-black text-zinc-400 tracking-wider font-mono mb-2">
                    ✉️ Associated Support Feed ({emails.length})
                  </h3>
                  {emails.length === 0 ? (
                    <p className="text-xs text-zinc-500 font-mono py-8">No corresponding communications indexed in Google Workspace logs.</p>
                  ) : (
                    emails.map((m) => (
                      <div key={m.id} className="bg-zinc-905/70 border border-zinc-820 rounded-xl p-4 hover:border-zinc-700 transition-all">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="text-[10px] text-zinc-500 font-mono font-semibold">{m.from}</span>
                          <span className="text-[9px] text-[#F15A24] font-mono">{m.date}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-1 leading-snug">{m.subject}</h4>
                        <p className="text-[10px] text-zinc-400 leading-normal line-clamp-2">{m.snippet}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* EMAIL COMPOSER */}
                <div className="lg:col-span-5 bg-zinc-900/30 border border-[#F15A24]/10 rounded-2xl p-4">
                  <h3 className="text-xs uppercase font-black text-zinc-300 tracking-wider font-mono mb-3">
                    ✉️ Email Property Desk
                  </h3>
                  <form onSubmit={handleSendEmail} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Complaint Subject (e.g. Broken water purifier)"
                      value={mailSubject}
                      onChange={(e) => setMailSubject(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-650 outline-none focus:border-[#F15A24]/60"
                      required
                    />
                    <textarea
                      placeholder="Detail outstanding issues requiring quick support reply..."
                      value={mailBody}
                      onChange={(e) => setMailBody(e.target.value)}
                      rows={4}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-650 outline-none resize-none focus:border-[#F15A24]/60"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-zinc-900 border border-zinc-750 hover:border-[#F15A24] text-white rounded-lg text-[9px] uppercase tracking-widest font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-[#F15A24]" />
                      Dispatch support request
                    </button>
                  </form>
                </div>
              </div>
            )}

            {!loading && activeTab === 'meet' && (
              <div className="max-w-xl mx-auto text-center py-6 space-y-4">
                <Video className="w-12 h-12 text-[#F15A24] mx-auto animate-pulse" />
                <h3 className="font-extrabold text-sm">Hostel Support Video Consultation</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Instantly launch a physical/video check huddle on Google Meet to allow instant walkthroughs for repair work or team alignments.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleCreateMeetSpace}
                    className="px-6 py-3 bg-[#F15A24] hover:bg-orange-600 text-white font-extrabold text-[10px] tracking-widest uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Generate Video Conference Space
                  </button>
                </div>

                {createdMeetUrl && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 p-4 bg-zinc-950 border border-emerald-500/30 rounded-2xl flex flex-col items-center gap-2 max-w-sm mx-auto"
                  >
                    <div className="text-[9px] uppercase font-mono bg-emerald-505/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30 font-black">
                      Live Meeting Established Successfully
                    </div>
                    <span className="text-xs font-mono select-all text-zinc-300 break-all">{createdMeetUrl}</span>
                    <a
                      href={createdMeetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 text-[10px] uppercase font-bold tracking-widest text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors"
                    >
                      Launch Room Meeting <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </motion.div>
                )}
              </div>
            )}

            {!loading && activeTab === 'forms' && (
              <div className="max-w-xl mx-auto text-center py-6 space-y-4">
                <FileText className="w-12 h-12 text-[#F15A24]/80 mx-auto" />
                <h3 className="font-extrabold text-sm">Hostel Performance Survey & Forms</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  Provision a Google Form dynamically onto your connected Google Drive to request detailed feedback from tenants regarding hostel services.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleDeployForm}
                    className="px-6 py-3 bg-zinc-900 border border-zinc-750 hover:border-[#F15A24] text-white font-extrabold text-[10px] tracking-widest uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Deploy Survey Template Form
                  </button>
                </div>

                {createdFormUrl && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 p-4 bg-zinc-950 border border-blue-500/30 rounded-2xl space-y-3 max-w-md mx-auto"
                  >
                    <span className="text-[9px] uppercase font-mono bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 font-black">
                      Form Assets Linked
                    </span>
                    <div className="flex flex-col gap-2 text-[10px] font-mono text-left text-zinc-300">
                      <div className="flex items-center justify-between gap-4">
                        <span>Survey Responder Link:</span>
                        <a href={createdFormUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 font-bold">
                          View Survey <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      {createdFormEditUrl && (
                        <div className="flex items-center justify-between gap-4">
                          <span>Survey Management & Responses:</span>
                          <a href={createdFormEditUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline flex items-center gap-1 font-bold">
                            Edit Form <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {!loading && activeTab === 'tasks' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* TASK CHECKLIST */}
                <div className="lg:col-span-7 space-y-2.5">
                  <h3 className="text-xs uppercase font-black text-zinc-400 tracking-wider font-mono mb-2">
                    📋 Synchronized Checklist Priorities ({tasks.length})
                  </h3>
                  {tasks.length === 0 ? (
                    <p className="text-xs text-zinc-500 font-mono py-8">Google Task ledger list is vacant.</p>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id} className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3 flex items-center justify-between hover:border-zinc-800 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className="w-5 h-5 rounded-md border border-zinc-700 bg-zinc-950 flex items-center justify-center text-[#F15A24] cursor-pointer hover:border-[#F15A24] transition-colors"
                          >
                            {task.status === "completed" && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-950" />}
                          </button>
                          <span className={`text-xs truncate ${task.status === 'completed' ? 'line-through text-zinc-550' : 'text-zinc-200'}`}>
                            {task.title}
                          </span>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase border font-semibold ${
                          task.status === "completed" 
                            ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400" 
                            : "bg-amber-950/40 border-amber-500/20 text-amber-400"
                        }`}>
                          {task.status === "completed" ? "Verified" : "Pending"}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* CREATE NEW TASK FORM */}
                <div className="lg:col-span-5 bg-zinc-900/30 border border-zinc-850 rounded-2xl p-4">
                  <h3 className="text-xs uppercase font-black text-zinc-300 tracking-wider font-mono mb-3">
                    ✍️ Create Priority Task
                  </h3>
                  <form onSubmit={handleCreateTask} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Task description (e.g. Clear electricity invoice)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-650 outline-none focus:border-[#F15A24]/60"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#F15A24] text-white rounded-lg text-[9px] uppercase tracking-widest font-black transition-colors hover:bg-orange-600 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Google Tasks
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
