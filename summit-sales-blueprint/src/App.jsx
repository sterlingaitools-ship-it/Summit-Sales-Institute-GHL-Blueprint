import { useState, useEffect, useRef } from "react";

const C = {
  navy: "#0a0f1e",
  navyMid: "#111827",
  navyLight: "#1a2744",
  blue: "#1e6fcf",
  blueBright: "#2d8af0",
  gold: "#c9a227",
  goldLight: "#e8c547",
  white: "#f0f4ff",
  grey: "#8a96b0",
  greyLight: "#c5cde0",
  green: "#22a862",
  orange: "#e07b00",
  red: "#c0392b",
  purple: "#9b59b6",
};

const EVENTS = [
  { city: "Cape Town", date: "9 May" },
  { city: "Stellenbosch", date: "10 May" },
  { city: "Johannesburg", date: "16 May" },
  { city: "Pretoria", date: "17 May" },
  { city: "Durban", date: "23 May" },
];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "form", label: "Form" },
  { id: "tags", label: "Tags" },
  { id: "workflows", label: "Workflows" },
  { id: "nurture", label: "Nurture" },
  { id: "voice", label: "Voice Pipeline" },
  { id: "logic", label: "Logic Rules" },
];

const TAG_GROUPS = [
  { title: "Location", color: C.blue, cc: "blue", tags: ["city::cape-town","city::stellenbosch","city::johannesburg","city::pretoria","city::durban"] },
  { title: "Event Registration", color: C.gold, cc: "gold", tags: ["event::cpt-09may","event::stb-10may","event::jhb-16may","event::pta-17may","event::dbn-23may"] },
  { title: "Ticket Tier", color: C.green, cc: "green", tags: ["ticket::general","ticket::vip"] },
  { title: "Intent / Goal", color: C.orange, cc: "orange", tags: ["intent::sales-skills","intent::networking","intent::job-placement","intent::other"] },
  { title: "Attendee Status", color: C.red, cc: "red", tags: ["status::registered","status::confirmed","status::attended","status::no-show","status::repeat-attendee","status::new-attendee"] },
  { title: "Background", color: C.purple, cc: "purple", tags: ["bg::employed","bg::unemployed","bg::in-active-sequence","bg::nurture-active","bg::post-event","bg::converted"] },
  { title: "Pipeline Stage", color: C.greyLight, cc: "grey", tags: ["stage::cold-lead","stage::warm-lead","stage::hot-lead","stage::community-member","stage::paid-client","stage::referral-source"] },
  { title: "Email Engagement", color: C.green, cc: "green", tags: ["email::opened","email::clicked","email::unsubscribed","feedback::submitted","testimonial::given"] },
];

const WORKFLOWS = [
  {
    num: "01", accent: C.blue,
    title: "Registration Confirmation",
    desc: "Fires the moment a lead submits the form. Tags applied instantly. Confirmation email sent.",
    trigger: "Form Submitted",
    emails: [
      {
        timing: "Instant", tc: "green",
        title: "Apply Tags from Form",
        subject: "GHL Action — No email sent yet",
        body: "GHL reads every form field and applies tags automatically. city, event, ticket tier, intent goal, status::registered. If attended before = Yes then also applies status::repeat-attendee",
        chips: [{ l: "Tag: city selected", t: "tag" },{ l: "Tag: event selected", t: "tag" },{ l: "Tag: ticket tier", t: "tag" },{ l: "Tag: status::registered", t: "tag" },{ l: "Condition: attended before?", t: "condition" }],
      },
      {
        timing: "Instant", tc: "green",
        title: "Email 1 — You Are In",
        subject: "Subject: Your seat is confirmed. Here is everything you need.",
        body: "Hey [First Name], your seat at the Summit Sales Institute workshop is confirmed. [Event City] - [Event Date] - 12PM to 3PM. [PLACEHOLDER: Sam key pre-event instructions]. See you there. Samkelo",
        chips: [{ l: "Send Email", t: "send" },{ l: "Tag: bg::in-active-sequence", t: "tag" },{ l: "Remove: bg::nurture-active", t: "remove" }],
      },
    ],
  },
  {
    num: "02", accent: C.blue,
    title: "Pre-Event Warmup",
    desc: "City-specific. Only fires for contacts tagged with the relevant event tag. 5 days of warmup before event day.",
    trigger: "Tag: status::registered",
    emails: [
      {
        timing: "5 Days Out", tc: "blue",
        title: "Email 2 — What You Are About to Learn",
        subject: "Subject: This is what we are covering on [Date]",
        body: "Hey [First Name], the [City] event is 5 days away. Here is a preview of what we are covering. [PLACEHOLDER: 3-4 bullet points of the workshop agenda]. 200+ people have already gone through this system and landed real sales roles. More soon. Samkelo",
        chips: [{ l: "Send Email", t: "send" },{ l: "Wait 2 Days", t: "wait" }],
      },
      {
        timing: "3 Days Out", tc: "blue",
        title: "Email 3 — A Story That Changes Things",
        subject: "Subject: He thought sales was not for him. Then this happened.",
        body: "[First Name], before you walk into the room on [Date], I want to share something. [PLACEHOLDER: Sam story or student success story. 3-4 sentences.] That is what this event is built to do. Not to motivate you — to give you a system. Three days. See you there. Samkelo",
        chips: [{ l: "Send Email", t: "send" },{ l: "Wait 2 Days", t: "wait" }],
      },
      {
        timing: "1 Day Out", tc: "blue",
        title: "Email 4 — Tomorrow. Do Not Be Late.",
        subject: "Subject: Tomorrow — final details for [City]",
        body: "[First Name], it is tomorrow. Location: [PLACEHOLDER venue address]. Time: 12PM, doors open 11:30AM. Bring this email or your name at the door. [PLACEHOLDER: one sentence from Sam]. See you in the room. Samkelo",
        chips: [{ l: "Send Email", t: "send" },{ l: "SMS Reminder", t: "sms" },{ l: "Tag: status::confirmed", t: "tag" }],
      },
    ],
  },
  {
    num: "03", accent: C.gold,
    title: "Event Day",
    desc: "Morning email auto-fires. After the event window GHL branches: attended contacts go to Workflow 4. No-shows get a recovery path.",
    trigger: "Event Date Reached",
    emails: [
      {
        timing: "8:00 AM", tc: "gold",
        title: "Email 5 — Today Is the Day",
        subject: "Subject: Today is the day [First Name]. We will see you at 12.",
        body: "[First Name], it is here. Today at 12PM you walk into a room that has launched the careers of 200+ sales professionals across South Africa. [PLACEHOLDER: One line from Sam in his own voice]. Venue - Doors open 11:30AM. See you there. Samkelo",
        chips: [{ l: "Send Email", t: "send" },{ l: "Wait until 6PM", t: "wait" },{ l: "If attended go to Workflow 4", t: "condition" },{ l: "If no-show go to Recovery", t: "condition" }],
      },
      {
        timing: "No-Show Branch", tc: "orange",
        title: "Email 5B — We Missed You Today",
        subject: "Subject: We missed you today [First Name]",
        body: "[First Name], we noticed you did not make it today — life happens, we get it. [PLACEHOLDER: Quick note from Sam, no guilt, mention next upcoming city]. If you want to attend a future event, just reply to this email. Samkelo",
        chips: [{ l: "Tag: status::no-show", t: "tag" },{ l: "Remove: bg::in-active-sequence", t: "remove" },{ l: "Tag: bg::nurture-active", t: "tag" }],
      },
    ],
  },
  {
    num: "04", accent: C.green,
    title: "Post-Event Conversion",
    desc: "Fires for contacts tagged status::attended. Feedback first, then 2-3 conversion emails, then back into evergreen nurture.",
    trigger: "Tag: status::attended",
    emails: [
      {
        timing: "+1 Day", tc: "orange",
        title: "Email 6 — How Was It?",
        subject: "Subject: Quick question [First Name] — how was yesterday?",
        body: "[First Name], hope you are sitting with something useful from yesterday. We would love to know what landed for you — and what we can do better. Takes 60 seconds. [PLACEHOLDER: Link to feedback form]. Samkelo",
        chips: [{ l: "Send Email", t: "send" },{ l: "Tag: bg::post-event", t: "tag" },{ l: "Wait 2 Days", t: "wait" }],
      },
      {
        timing: "+3 Days", tc: "purple",
        title: "Email 7 — What Comes Next",
        subject: "Subject: The event was just the beginning.",
        body: "[First Name], you showed up. That already puts you ahead of most people. But showing up once is not a career. Here is what the people who actually land roles do next. [PLACEHOLDER: community or coaching offer]. [CTA Link]. Samkelo",
        chips: [{ l: "Send Email", t: "send" },{ l: "Wait 3 Days", t: "wait" }],
      },
      {
        timing: "+6 Days", tc: "purple",
        title: "Email 8 — Last Push",
        subject: "Subject: Still thinking about it? Let me make this simple.",
        body: "[First Name], one more thing before I leave you alone about this. [PLACEHOLDER: Final case for joining the community]. If it is not for you, no pressure. But if it is — the door is open. [CTA]. Samkelo",
        chips: [{ l: "Send Email", t: "send" },{ l: "Remove: bg::in-active-sequence", t: "remove" },{ l: "Tag: bg::nurture-active", t: "tag" },{ l: "Tag: stage::warm-lead", t: "tag" }],
      },
    ],
  },
];

const NURTURE = [
  { week: "W1", title: "Sam Thought of the Week", desc: "Voice note captured Monday, transcribed, turned into newsletter. One insight, one story, one CTA. Sam voice in their inbox without writing a word." },
  { week: "W2", title: "Student Spotlight", desc: "Short feature on a student who went through the system. What they came in with, what they left with, where they are now. Social proof that compounds." },
  { week: "W3", title: "Sales Tip Drop", desc: "One actionable sales insight — a script, a mindset reframe, a tool Sam uses. Short. Valuable. No fluff." },
  { week: "W4", title: "Upcoming Events and Community Offer", desc: "Soft sell on the next event or community membership. By week 4 the contact has received consistent value — this is the natural conversion moment." },
];

const PIPELINE = [
  { icon: "Mic", title: "iPhone Shortcut", desc: "Sam taps one button. Records 2-5 min voice note with his thought of the week. Monday morning." },
  { icon: "Mail", title: "Auto-Email", desc: "Shortcut sends audio file to a dedicated intake email address automatically." },
  { icon: "Doc", title: "Transcription", desc: "Audio transcribed to text via Whisper API. Clean and verbatim." },
  { icon: "AI", title: "AI Formatting", desc: "Claude structures transcript into newsletter format — subject line, body, CTA." },
  { icon: "Send", title: "Draft to Team", desc: "Formatted draft emailed to Aiden for review. Light edit if needed. Send Thursday." },
];

const LOGIC = [
  { cond: "Contact enters an active event sequence", result: "Remove tag bg::nurture-active — weekly nurture pauses immediately. No double sends." },
  { cond: "Post-event sequence ends after Email 8", result: "Apply tag bg::nurture-active — contact re-enters weekly nurture automatically." },
  { cond: "Contact tagged status::no-show", result: "Skip post-event sequence. Apply bg::nurture-active and stage::cold-lead." },
  { cond: "Contact registers for a second event", result: "New event tag applied. Previous tags remain for history. New sequence fires. No conflict." },
  { cond: "Contact holds multiple city tags", result: "Receives city-specific emails for all opted-in cities. Tags filter correctly per event." },
  { cond: "Contact tagged bg::converted", result: "Remove from all nurture sequences. Place in client pipeline. Different track entirely." },
];

const chipStyle = {
  send: { bg: "rgba(30,111,207,0.2)", color: "#7ab8f5" },
  tag: { bg: "rgba(34,168,98,0.2)", color: "#5edb95" },
  remove: { bg: "rgba(192,57,43,0.2)", color: "#e87c6e" },
  wait: { bg: "rgba(255,255,255,0.07)", color: "#c5cde0" },
  condition: { bg: "rgba(201,162,39,0.2)", color: "#e8c547" },
  sms: { bg: "rgba(155,89,182,0.2)", color: "#c39bd3" },
};

const tagColor = {
  blue: { bg: "rgba(30,111,207,0.2)", border: "rgba(30,111,207,0.4)", color: "#7ab8f5" },
  gold: { bg: "rgba(201,162,39,0.2)", border: "rgba(201,162,39,0.4)", color: "#e8c547" },
  green: { bg: "rgba(34,168,98,0.2)", border: "rgba(34,168,98,0.4)", color: "#5edb95" },
  orange: { bg: "rgba(224,123,0,0.2)", border: "rgba(224,123,0,0.4)", color: "#f5a742" },
  red: { bg: "rgba(192,57,43,0.2)", border: "rgba(192,57,43,0.4)", color: "#e87c6e" },
  purple: { bg: "rgba(155,89,182,0.2)", border: "rgba(155,89,182,0.4)", color: "#c39bd3" },
  grey: { bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)", color: "#c5cde0" },
};

const timingColor = {
  green: { bg: "rgba(34,168,98,0.2)", color: "#5edb95" },
  blue: { bg: "rgba(30,111,207,0.2)", color: "#7ab8f5" },
  gold: { bg: "rgba(201,162,39,0.2)", color: "#e8c547" },
  orange: { bg: "rgba(224,123,0,0.2)", color: "#f5a742" },
  purple: { bg: "rgba(155,89,182,0.2)", color: "#c39bd3" },
};

const dotColor = {
  green: "#22a862", blue: "#1e6fcf", gold: "#c9a227", orange: "#e07b00", purple: "#9b59b6",
};

function Chip({ l, t }) {
  const s = chipStyle[t] || chipStyle.tag;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 9px", borderRadius: 2, background: s.bg, color: s.color, marginRight: 4, marginBottom: 4, display: "inline-block" }}>
      {l}
    </span>
  );
}

function TagPill({ label, cc }) {
  const s = tagColor[cc] || tagColor.grey;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 2, background: s.bg, color: s.color, border: "1px solid " + s.border, fontFamily: "monospace", marginRight: 6, marginBottom: 6, display: "inline-block" }}>
      {label}
    </span>
  );
}

function EmailStep({ email }) {
  const [open, setOpen] = useState(false);
  const tc = timingColor[email.tc] || timingColor.blue;
  const dc = dotColor[email.tc] || "#1e6fcf";
  return (
    <div style={{ position: "relative", paddingLeft: 28, marginBottom: 16 }}>
      <div style={{ position: "absolute", left: 0, top: 18, width: 11, height: 11, borderRadius: "50%", background: dc, border: "2px solid #111827", zIndex: 2 }} />
      <div onClick={() => setOpen(!open)} style={{ background: open ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)", border: "1px solid " + (open ? "rgba(30,111,207,0.3)" : "rgba(255,255,255,0.06)"), borderRadius: 4, cursor: "pointer", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "3px 10px", borderRadius: 2, background: tc.bg, color: tc.color, whiteSpace: "nowrap" }}>{email.timing}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#f0f4ff" }}>{email.title}</div>
            <div style={{ fontSize: 11, color: "#c9a227", fontStyle: "italic", marginTop: 2 }}>{email.subject}</div>
          </div>
          <span style={{ color: "#8a96b0", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
        </div>
        {open && (
          <div style={{ padding: "0 18px 16px" }}>
            <div style={{ fontSize: 13, color: "#8a96b0", lineHeight: 1.75, padding: 14, background: "rgba(0,0,0,0.25)", borderLeft: "2px solid rgba(255,255,255,0.08)", marginBottom: 12, borderRadius: 2 }}>{email.body}</div>
            <div style={{ display: "flex", flexWrap: "wrap" }}>{email.chips.map((c, i) => <Chip key={i} l={c.l} t={c.t} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function FadeIn({ children }) {
  const ref = useRef();
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.05 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}>
      {children}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("overview");
  const [wf, setWf] = useState(0);
  const [heroVis, setHeroVis] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => { const h = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  useEffect(() => { setTimeout(() => setHeroVis(true), 120); }, []);
  const W = { maxWidth: 920, margin: "0 auto", padding: "60px 20px" };
  const navy = "#0a0f1e";
  const navyMid = "#111827";
  const blue = "#1e6fcf";
  const gold = "#c9a227";
  const white = "#f0f4ff";
  const grey = "#8a96b0";
  const greyLight = "#c5cde0";
  const blueBright = "#2d8af0";

  return (
    <div style={{ background: navy, color: white, fontFamily: "system-ui, sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:#0a0f1e;}::-webkit-scrollbar-thumb{background:#1e6fcf;border-radius:2px;}@keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(8px)}}`}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "60px 20px", background: "radial-gradient(ellipse at 50% 0%, #1a3060 0%, #0a0f1e 65%)", borderBottom: "1px solid rgba(30,111,207,0.25)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(30,111,207,0.04) 60px,rgba(30,111,207,0.04) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(30,111,207,0.04) 60px,rgba(30,111,207,0.04) 61px)", pointerEvents: "none" }} />
        {[
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: blueBright, border: "1px solid rgba(45,138,240,0.4)", padding: "6px 18px", borderRadius: 2, display: "inline-block" }}>Go High Level Automation Blueprint</div>,
          <div><div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(52px,12vw,120px)", fontWeight: 700, lineHeight: 0.9, color: white }}>Summit Sales</div><div style={{ fontFamily: "Georgia, serif", fontSize: "clamp(52px,12vw,120px)", fontWeight: 700, lineHeight: 0.9, color: gold }}>Institute</div></div>,
          <div style={{ fontSize: "clamp(13px,2vw,18px)", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: greyLight }}>Remote Sales Accelerator — 7th Edition</div>,
          <div style={{ display: "flex", gap: 36, flexWrap: "wrap", justifyContent: "center" }}>{[["4","Workflows"],["5","Cities"],["12+","Emails"],["30+","Tags"]].map(([n,l],i) => (<div key={i} style={{ textAlign: "center" }}><div style={{ fontFamily: "Georgia, serif", fontSize: 44, fontWeight: 700, color: gold, lineHeight: 1 }}>{n}</div><div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: grey }}>{l}</div></div>))}</div>,
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>{EVENTS.map((e,i) => (<div key={i} style={{ background: "#1a2744", border: "1px solid rgba(30,111,207,0.3)", padding: "8px 16px", borderRadius: 2, fontSize: 13, fontWeight: 600 }}><span style={{ color: white }}>{e.city}</span><span style={{ color: gold, marginLeft: 8 }}>{e.date}</span></div>))}</div>,
        ].map((el,i) => (
          <div key={i} style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? "translateY(0)" : "translateY(28px)", transition: "all 0.8s ease " + (0.1 + i * 0.15) + "s", marginBottom: 24 }}>{el}</div>
        ))}
        <div style={{ position: "absolute", bottom: 28, left: "50%", animation: "bounce 2s infinite", opacity: 0.35, fontSize: 20 }}>↓</div>
      </div>

      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(10,15,30,0.97)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(30,111,207,0.2)", display: "flex", overflowX: "auto", padding: "0 12px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap", padding: "16px 16px", color: tab === t.id ? white : grey, borderBottom: "2px solid " + (tab === t.id ? blue : "transparent"), transition: "all 0.2s" }}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={W}><FadeIn>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: blueBright, marginBottom: 8 }}>System Overview</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px,6vw,60px)", lineHeight: 1, color: white, marginBottom: 32, fontWeight: 700 }}>How the <span style={{ color: gold }}>Machine Works</span></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 3 }}>
            {[
              { n:"1", title:"Registration", desc:"Lead fills the form. GHL ingests contact and applies tags automatically based on city, ticket type, and intent.", color: blue },
              { n:"2", title:"Pre-Event Warmup", desc:"5-day automated email sequence. Builds anticipation, handles doubt, confirms attendance.", color: blue },
              { n:"3", title:"Event Day", desc:"Morning email auto-fires. After the event, GHL branches attended vs no-show automatically.", color: gold },
              { n:"4", title:"Post-Event Sell", desc:"Feedback capture, testimonials, then 2-3 conversion emails into community or next product.", color: "#22a862" },
              { n:"5", title:"Evergreen Nurture", desc:"Weekly newsletter for all engaged contacts not currently in an active event sequence.", color: "#e07b00" },
            ].map((c,i) => (
              <div key={i} style={{ background: navyMid, padding: "24px 20px", borderTop: "3px solid " + c.color, position: "relative" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 48, color: "rgba(255,255,255,0.04)", position: "absolute", top: 10, right: 14, lineHeight: 1, fontWeight: 700 }}>{c.n}</div>
                <div style={{ fontWeight: 700, fontSize: 15, textTransform: "uppercase", letterSpacing: 1, color: white, marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: grey, lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </FadeIn></div>
      )}

      {tab === "form" && (
        <div style={W}><FadeIn>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: blueBright, marginBottom: 8 }}>GHL Registration Form</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px,6vw,60px)", lineHeight: 1, color: white, marginBottom: 32, fontWeight: 700 }}>Upgraded <span style={{ color: gold }}>Intake Form</span></h2>
          <div style={{ background: navyMid, border: "1px solid rgba(30,111,207,0.2)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg,#1e6fcf,#0d4a9e)", padding: "28px 32px", textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: white }}>Break Into The World of Sales</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>Summit Sales Institute — Remote Sales Accelerator, 7th Edition</div>
            </div>
            <div style={{ padding: 28 }}>
              {[
                { title: "Section 1 — Personal Details", fields: [
                  { icon:"[Name]", name:"First Name", type:"Text", badge:"required" },
                  { icon:"[Email]", name:"Email Address", type:"Email", badge:"required" },
                  { icon:"[Phone]", name:"Phone Number", type:"Phone", badge:"required" },
                  { icon:"[Age]", name:"Age", type:"Number optional" },
                ]},
                { title: "Section 2 — Background Qualifier", fields: [
                  { icon:"[Job]", name:"Currently Employed?", type:"Yes or No", badge:"triggers" },
                  { icon:"[Repeat]", name:"Attended Before?", type:"Yes or No", badge:"triggers" },
                  { icon:"[Goal]", name:"Goal at the Event", type:"Sales Skills / Network / Job Placement / Other", badge:"triggers" },
                  { icon:"[City]", name:"Which Cities to Receive Updates For?", type:"Checkbox multi-select", badge:"triggers" },
                ]},
                { title: "Section 3 — Event Specifics", fields: [
                  { icon:"[Date]", name:"Which Event Are You Registering For?", type:"Dropdown — City and Date", badge:"triggers" },
                  { icon:"[Ticket]", name:"Ticket Type", type:"General Entry or VIP", badge:"triggers" },
                  { icon:"[Person]", name:"Attending in Person?", type:"Yes or No", badge:"triggers" },
                  { icon:"[Q]", name:"Questions About the Event", type:"Long text optional" },
                ]},
              ].map((sec,si) => (
                <div key={si} style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: blueBright, marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(30,111,207,0.2)" }}>{sec.title}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 8 }}>
                    {sec.fields.map((f,fi) => (
                      <div key={fi} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, borderRadius: 2 }}>
                        <span style={{ fontSize: 11, color: grey, minWidth: 40 }}>{f.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: white }}>{f.name}</div>
                          <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: grey, marginTop: 2 }}>{f.type}</div>
                        </div>
                        {f.badge && (<span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", padding: "2px 7px", borderRadius: 2, background: f.badge === "required" ? "rgba(192,57,43,0.3)" : "rgba(34,168,98,0.3)", color: f.badge === "required" ? "#e87c6e" : "#5edb95" }}>{f.badge === "required" ? "Required" : "Tags"}</span>)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn></div>
      )}

      {tab === "tags" && (
        <div style={W}><FadeIn>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: blueBright, marginBottom: 8 }}>GHL Tag Architecture</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px,6vw,60px)", lineHeight: 1, color: white, marginBottom: 32, fontWeight: 700 }}>The <span style={{ color: gold }}>Tag System</span></h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 18 }}>
            {TAG_GROUPS.map((g,i) => (
              <div key={i} style={{ background: navyMid, borderLeft: "3px solid " + g.color, padding: 22, borderRadius: 2 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: grey, marginBottom: 14 }}>{g.title}</div>
                <div style={{ display: "flex", flexWrap: "wrap" }}>{g.tags.map((tag,ti) => <TagPill key={ti} label={tag} cc={g.cc} />)}</div>
              </div>
            ))}
          </div>
        </FadeIn></div>
      )}

      {tab === "workflows" && (
        <div style={W}><FadeIn>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: blueBright, marginBottom: 8 }}>GHL Automation Workflows</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px,6vw,60px)", lineHeight: 1, color: white, marginBottom: 32, fontWeight: 700 }}>The Four <span style={{ color: gold }}>Workflows</span></h2>
          <div style={{ display: isMobile ? "flex" : "grid", flexDirection: "column", gridTemplateColumns: isMobile ? "1fr" : "minmax(180px,240px) 1fr", gap: 20, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, position: isMobile ? "static" : "sticky", top: 68 }}>
              {WORKFLOWS.map((w,i) => (
                <div key={i}>
                  <button onClick={() => setWf(wf===i && isMobile ? null : i)} style={{ width: "100%", background: wf===i ? "#1a2744" : navyMid, border: "none", cursor: "pointer", borderLeft: "4px solid " + (wf===i ? w.accent : "transparent"), padding: "18px 20px", textAlign: "left", transition: "all 0.2s", borderRadius: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 700, color: wf===i ? w.accent : grey, lineHeight: 1, marginBottom: 4 }}>{w.num}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: white }}>{w.title}</div>
                        <div style={{ fontSize: 11, color: grey, marginTop: 3 }}>Trigger: {w.trigger}</div>
                      </div>
                      {isMobile && <span style={{ color: grey, fontSize: 14, marginLeft: 12 }}>{wf===i ? "▲" : "▼"}</span>}
                    </div>
                  </button>
                  {isMobile && wf===i && (
                    <div style={{ background: navyMid, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
                      <div style={{ padding: "14px 20px", borderLeft: "4px solid " + w.accent, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: 13, color: grey, lineHeight: 1.6 }}>{w.desc}</div>
                      </div>
                      <div style={{ padding: "22px 26px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: grey, marginBottom: 16 }}>Email Sequence — Tap to expand</div>
                        <div style={{ position: "relative" }}>
                          <div style={{ position: "absolute", left: 4, top: 8, bottom: 8, width: 1, background: "linear-gradient(to bottom, " + w.accent + ", transparent)" }} />
                          {w.emails.map((e,i) => <EmailStep key={i} email={e} />)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div key={wf}>{(() => {
              const w = WORKFLOWS[wf];
              return (
                <div style={{ background: navyMid, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ padding: "22px 26px", borderLeft: "4px solid " + w.accent, background: "rgba(30,111,207,0.07)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 44, fontWeight: 700, color: w.accent, opacity: 0.35, lineHeight: 1 }}>{w.num}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: white, marginTop: 4 }}>{w.title}</div>
                    <div style={{ fontSize: 13, color: grey, marginTop: 6, lineHeight: 1.6 }}>{w.desc}</div>
                    <div style={{ marginTop: 10 }}><span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: grey }}>Trigger: </span><span style={{ fontSize: 14, fontWeight: 700, color: gold }}>{w.trigger}</span></div>
                  </div>
                  <div style={{ padding: "22px 26px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: grey, marginBottom: 16 }}>Email Sequence — Tap to expand</div>
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: 4, top: 8, bottom: 8, width: 1, background: "linear-gradient(to bottom, " + w.accent + ", transparent)" }} />
                      {w.emails.map((e,i) => <EmailStep key={i} email={e} />)}
                    </div>
                  </div>
                </div>
              );
            })()}</div>
          </div>
        </FadeIn></div>
      )}

      {tab === "nurture" && (
        <div style={W}><FadeIn>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: blueBright, marginBottom: 8 }}>Evergreen System</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px,6vw,60px)", lineHeight: 1, color: white, marginBottom: 32, fontWeight: 700 }}>Weekly <span style={{ color: gold }}>Nurture Sequence</span></h2>
          <p style={{ color: grey, fontSize: 14, maxWidth: 580, marginBottom: 36, lineHeight: 1.7 }}>Fires for all contacts tagged <strong style={{ color: white }}>bg::nurture-active</strong>. Pauses when a contact enters an active event sequence. Resumes automatically when the sequence ends. Sends every Thursday.</p>
          {NURTURE.map((n,i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr", marginBottom: 10, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ background: "rgba(30,111,207,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 14, textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: blueBright, lineHeight: 1 }}>{n.week}</div>
                <div style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: grey, marginTop: 2 }}>Thursday</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: white, marginBottom: 5 }}>{n.title}</div>
                <div style={{ fontSize: 13, color: grey, lineHeight: 1.6 }}>{n.desc}</div>
              </div>
            </div>
          ))}
        </FadeIn></div>
      )}

      {tab === "voice" && (
        <div style={W}><FadeIn>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: blueBright, marginBottom: 8 }}>Content Production Pipeline</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px,6vw,60px)", lineHeight: 1, color: white, marginBottom: 32, fontWeight: 700 }}>Voice Note to <span style={{ color: gold }}>Newsletter</span></h2>
          <p style={{ color: grey, fontSize: 14, maxWidth: 560, marginBottom: 40, lineHeight: 1.7 }}>Sam records a voice note on Monday morning. By Thursday, a polished newsletter is in every inbox. He touches it once.</p>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", flexWrap: "nowrap" }}>
            {PIPELINE.map((p,i) => (
              <div key={i} style={{ flex: "1 1 100%", background: navyMid, padding: "26px 18px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
                {i < PIPELINE.length - 1 && (<div style={{ textAlign: "center", fontSize: 16, color: blue, padding: "10px 0", width: "100%" }}>{isMobile ? "↓" : "→"}</div>)}
                <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: white, marginBottom: 7 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: grey, lineHeight: 1.5 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </FadeIn></div>
      )}

      {tab === "logic" && (
        <div style={W}><FadeIn>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: blueBright, marginBottom: 8 }}>Backend Rules</div>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px,6vw,60px)", lineHeight: 1, color: white, marginBottom: 32, fontWeight: 700 }}>Collision <span style={{ color: gold }}>Prevention Logic</span></h2>
          <div style={{ background: navyMid, border: "1px solid rgba(201,162,39,0.3)", padding: 28, borderRadius: 4 }}>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: gold, marginBottom: 20 }}>When Sequences Overlap — GHL Rules</div>
            {LOGIC.map((r,i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 16, paddingBottom: 16, borderBottom: i < LOGIC.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: blueBright, minWidth: 20, marginTop: 2 }}>IF</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: white, marginBottom: 4 }}>{r.cond}</div>
                  <div style={{ fontSize: 13, color: grey, lineHeight: 1.6 }}>Then: {r.result}</div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn></div>
      )}

      <div style={{ background: navyMid, borderTop: "1px solid rgba(30,111,207,0.2)", padding: "48px 20px", textAlign: "center" }}>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 700, color: white, marginBottom: 8 }}>Built for Summit Sales Institute</div>
        <div style={{ fontSize: 14, color: grey, maxWidth: 460, margin: "0 auto 28px", lineHeight: 1.7 }}>Working prototype. Placeholder copy replaced with Sam voice once confirmed. All 4 workflows ready to build in Go High Level.</div>
        <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          {[["4","Workflows"],["8","Emails Mapped"],["30+","Tags Defined"],["0","Collision Points"]].map(([n,l],i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: gold }}>{n}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: grey }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, letterSpacing: 1, color: grey, textTransform: "uppercase", opacity: 0.4 }}>Evolentra x Summit Sales Institute — Built by Aiden Maila</div>
      </div>

    </div>
  );
}
