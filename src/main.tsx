import React from "react";
import { getSupabase } from "./supabase";
import { ScannerPage } from "./ScannerPage";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import "./styles.css";

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<Screen title="Opening Plantify…" />}>{children}</React.Suspense>;
}

class RuntimeBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("Plantify runtime error:", error); }
  render() {
    if (this.state.error) return <main className="screen"><div className="center-card"><div className="logo">🌿</div><h1>Plantify hit a browser error</h1><p>Refresh once. If it happens again, the message below identifies the exact problem.</p><pre className="runtime-error">{this.state.error.message}</pre><button className="primary" onClick={() => window.location.reload()}>Reload</button></div></main>;
    return this.props.children;
  }
}

function Screen({ title, children }: { title: string; children?: React.ReactNode }) {
  return <main className="screen"><div className="center-card"><div className="logo">🌿</div><h1>{title}</h1>{children}</div></main>;
}

function Auth({ onMessage }: { onMessage: (s: string) => void }) {
  const [mode, setMode] = React.useState<"login"|"signup"|"forgot">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  const run = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.");
      if (mode === "login") {
        const r = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (r.error) throw r.error;
      } else if (mode === "signup") {
        const r = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + "/" } });
        if (r.error) throw r.error;
        onMessage("Account created. Check your email if verification is enabled.");
      } else {
        const r = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + "/" });
        if (r.error) throw r.error;
        onMessage("Password reset instructions sent.");
      }
    } catch (x) { setError(x instanceof Error ? x.message : String(x)); }
    finally { setBusy(false); }
  };

  const google = async () => {
    if (busy) return;
    setError(""); setBusy(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/" } });
      if (error) throw error;
      if (!data?.url) throw new Error("Supabase did not return the Google OAuth URL.");
      window.setTimeout(() => setBusy(false), 3000);
    } catch (x) { console.error("Google OAuth error:", x); setError(x instanceof Error ? x.message : String(x)); setBusy(false); }
  };

  return <main className="auth"><section className="auth-left"><div className="brand">🌿 <b>Plantify</b></div><div className="hero-copy"><small>PLANT INTELLIGENCE</small><h1>Understand your plants.<br/><i>Protect them.</i></h1><p>Scan, understand, care for and monitor your plants from one calm workspace.</p></div><div className="orbit">🌱 <span>Observe</span><span>✦ Detect</span><span>✓ Care</span></div></section>
  <section className="auth-right"><div className="auth-box"><div className="mobile-brand">🌿 <b>Plantify</b></div><small>PLANTIFY</small><h2>{mode==="login"?"Welcome back":mode==="signup"?"Create your account":"Reset your password"}</h2><p>{mode==="login"?"Sign in to continue.":mode==="signup"?"Start your Plantify journey.":"We'll send you a secure reset link."}</p>
  <form onSubmit={run}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label>{mode!=="forgot"&&<label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" minLength={6} required/></label>}
  {error&&<div className="error">{error}</div>}<button className="primary" disabled={busy}>{busy?"Please wait…":mode==="forgot"?"Send reset link":mode==="signup"?"Create account":"Log in"}</button></form>
  {mode!=="forgot"&&<><div className="or">or</div><button className="google" type="button" disabled={busy} onClick={google}>{busy ? "Connecting to Google…" : "Continue with Google"}</button></>}
  <div className="switch">{mode==="forgot"?<button onClick={()=>setMode("login")}>Back to login</button>:mode==="login"?<>Don't have an account? <button onClick={()=>setMode("signup")}>Create an account</button></>:<>Already have an account? <button onClick={()=>setMode("login")}>Log in</button></>}</div>
  </div></section></main>;
}

function Onboarding({session,onDone}:{session:Session;onDone:()=>void}) {
  const m=session.user.user_metadata??{}; const [step,setStep]=React.useState(0); const [name,setName]=React.useState(String(m.full_name??m.name??"")); const [phone,setPhone]=React.useState(String(m.phone??"")); const [place,setPlace]=React.useState(String(m.place??"")); const [role,setRole]=React.useState(String(m.role??"")); const [busy,setBusy]=React.useState(false); const [error,setError]=React.useState(""); const [locating,setLocating]=React.useState(false);
  const locate=()=>{setError("");if(!navigator.geolocation){setError("Location is unavailable in this browser.");return;}setLocating(true);navigator.geolocation.getCurrentPosition(async p=>{try{const u=`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${p.coords.latitude}&longitude=${p.coords.longitude}&localityLanguage=en`;const r=await fetch(u);const d=await r.json();setPlace(String(d.city||d.locality||d.principalSubdivision||""));}catch{setPlace(`${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`)}finally{setLocating(false)}},e=>{setLocating(false);setError(e.code===1?"Location permission was denied. Enter your place manually.":"Could not detect location.");},{timeout:12000,maximumAge:300000});};
  const finish=async()=>{setError("");if(!name.trim()||!phone.trim()||!place.trim()||!role){setError("Complete your name, phone, place and role.");setStep(0);return;}setBusy(true);try{const supabase=getSupabase();if(!supabase)throw new Error("Supabase is not configured.");const r=await supabase.auth.updateUser({data:{full_name:name.trim(),name:name.trim(),phone:phone.trim(),place:place.trim(),role,ui_mode:"simple",plantify_onboarding_complete:true}});if(r.error)throw r.error;onDone();}catch(e){setError(e instanceof Error?e.message:String(e))}finally{setBusy(false)}};
  return <main className="onboard"><div className="onboard-card"><div className="brand">🌿 <b>Plantify</b></div><div className="bar"><span style={{width:`${((step+1)/3)*100}%`}}/></div>{step===0&&<section><small>LET'S GET TO KNOW YOU</small><h1>Your Plantify account</h1><p>A few details help Plantify make your experience more useful.</p><label>Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><label>Phone number<input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210"/></label><label>Place<div className="loc"><input value={place} onChange={e=>setPlace(e.target.value)} placeholder="City / village / place"/><button type="button" onClick={locate} disabled={locating}>{locating?"Detecting…":"📍 Use my location"}</button></div></label></section>}{step===1&&<section><small>YOUR CONTEXT</small><h1>What best describes you?</h1><p>This helps us tailor Plantify's information and recommendations.</p><div className="choices"><button className={role==="farmer"?"selected":""} onClick={()=>setRole("farmer")}>🌾 <b>Farmer</b><span>I grow crops or manage farmland.</span></button><button className={role==="not_farmer"?"selected":""} onClick={()=>setRole("not_farmer")}>🌿 <b>Not a farmer</b><span>I care for plants, gardens or learn about them.</span></button></div></section>}{step===2&&<section><small>CHOOSE YOUR EXPERIENCE</small><h1>How do you want Plantify to feel?</h1><p>Simple UI is the working experience for now.</p><div className="choices"><button className="selected">🌿 <b>Simple UI</b><span>Clear screens, guided actions and visual plant intelligence.</span><em>Available</em></button><button className="disabled" disabled>◉ <b>AI Talker UI</b><span>Voice-first Plantify with conversational guidance.</span><em>Coming later</em></button></div></section>}{error&&<div className="error">{error}</div>}<div className="actions">{step>0?<button onClick={()=>setStep(step-1)}>← Back</button>:<span/>}{step<2?<button className="primary small" onClick={()=>setStep(step+1)}>Continue →</button>:<button className="primary small" disabled={busy} onClick={finish}>{busy?"Saving…":"Enter Plantify →"}</button>}</div></div></main>;
}

const ProfilePage=React.memo(function ProfilePage({session}:{session:Session}){const metadata=session?.user?.user_metadata??{};const name=typeof metadata.full_name==="string"?metadata.full_name:typeof metadata.name==="string"?metadata.name:"";const phone=typeof metadata.phone==="string"?metadata.phone:"";const place=typeof metadata.place==="string"?metadata.place:"";const role=metadata.role==="farmer"?"Farmer":metadata.role==="not_farmer"?"Not a farmer":"Not specified";const email=typeof session?.user?.email==="string"?session.user.email:"";const initial=(name.trim().charAt(0)||email.trim().charAt(0)||"P").toUpperCase();return <section className="profile-page"><small>YOUR ACCOUNT</small><h1>Profile</h1><p className="subtitle">Your Plantify account details.</p><div className="profile-card"><div className="avatar">{initial}</div><div><h2>{name||"Plantify user"}</h2><p>{email}</p></div></div><div className="profile-form readonly-profile"><label>Full name<input value={name} readOnly aria-readonly="true"/></label><label>Email<input value={email} readOnly aria-readonly="true"/></label><label>Phone number<input value={phone} readOnly aria-readonly="true"/></label><label>Place<input value={place} readOnly aria-readonly="true"/></label><label>Account type<input value={role} readOnly aria-readonly="true"/></label><label>Interface<input value="Simple UI" readOnly aria-readonly="true"/></label></div></section>});
function Home({session}:{session:Session}){const [page,setPage]=React.useState("Home");const metadata=session?.user?.user_metadata??{};const storedName=typeof metadata.full_name==="string"?metadata.full_name:typeof metadata.name==="string"?metadata.name:"";const email=typeof session?.user?.email==="string"?session.user.email:"";const first=(storedName||email||"there").split(" ")[0];const signout=()=>getSupabase()?.auth.signOut();return <main className="app"><header><div className="brand">🌿 <b>Plantify</b></div><nav>{["Home","My Plants","Alerts","Profile"].map(x=><button type="button" className={page===x?"active":""} onClick={()=>setPage(x)} key={x}>{x}</button>)}</nav><button type="button" onClick={signout}>Sign out</button></header><div className="content">{page==="Home"&&<><small>YOUR PLANTIFY</small><h1>Good morning, {first} 👋</h1><p className="subtitle">Understand your plants. Protect them.</p><div className="grid"><article><small>LATEST OBSERVATION</small><h2>Plant health</h2><p>Everything looks normal from your latest observations.</p><div className="progress"><span/></div><b>82%</b> Health confidence</article><article><h2>Check something</h2><p>Take a photo and let Plantify inspect your plant.</p><button type="button" className="primary small" onClick={()=>setPage("Scanner")}>Check with AI →</button></article><article><h2>My plants</h2><p>Your saved plants and care journeys will appear here.</p><button type="button" className="plain" onClick={()=>setPage("My Plants")}>View plants →</button></article><article><h2>Talk to AI</h2><p>AI Talker is planned for a later milestone.</p></article></div></>}{page==="Profile"&&<ProfilePage session={session}/>} {page!=="Home"&&page!=="Profile"&&page!=="Scanner"&&<div className="placeholder"><div>🌿</div><h2>{page}</h2><p>This section is ready for the next Plantify milestone.</p><button type="button" className="primary small" onClick={()=>setPage("Home")}>Back to home</button></div>}{page==="Scanner"&&<ScannerPage onBack={()=>setPage("Home")}/>}</div></main>}
function Root(){const [session,setSession]=React.useState<Session|null>(null);const [loading,setLoading]=React.useState(true);const [message,setMessage]=React.useState("");React.useEffect(()=>{const supabase=getSupabase();if(!supabase){setLoading(false);return;}let alive=true;supabase.auth.getSession().then(({data})=>{if(alive){setSession(data.session);setLoading(false)}}).catch(()=>{if(alive)setLoading(false)});const {data}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s);setLoading(false)});return()=>{alive=false;data.subscription.unsubscribe()};},[]);if(loading)return <Screen title="Opening Plantify…"/>;if(!getSupabase())return <Screen title="Plantify is not configured"><p>Add the two Supabase values from <code>.env.example</code> to a local <code>.env</code> file, then restart the dev server.</p></Screen>;if(!session)return <Auth onMessage={setMessage}/>;const complete=session.user.user_metadata?.plantify_onboarding_complete===true;if(message&&!complete)return <><Auth onMessage={setMessage}/></>;return complete?<Home session={session}/>:<Onboarding session={session} onDone={()=>{setMessage("");setSession({...session,user:{...session.user,user_metadata:{...session.user.user_metadata,plantify_onboarding_complete:true}}});}}/>}
const mount=document.getElementById("root");if(mount)createRoot(mount).render(<RuntimeBoundary><Root/></RuntimeBoundary>);
