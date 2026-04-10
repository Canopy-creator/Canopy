import React, { useState, useRef, useEffect } from "react";
import { useAuth, SignInButton, SignUpButton, UserButton } from '@clerk/clerk-react';



/* ─── FONTS ──────────────────────────────────────────── */
const FontLink = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>
);

/* ─── TOKENS ─────────────────────────────────────────── */
const C = {
  navy:"#012A4A", navyMid:"#013A63", ocean:"#0077B6", sky:"#00B4D8",
  coral:"#FF6B6B", cream:"#F0F7FC", white:"#FFFFFF",
  ink:"#0D1B2A", muted:"#4A6FA5", border:"#C9DEF0", soft:"#E8F4FD",
};

/* ─── STATE DATA ─────────────────────────────────────── */
const STATES = [
  {code:"NSW",name:"New South Wales",curr:"NSW Syllabus 2022 + AC V9"},
  {code:"VIC",name:"Victoria",curr:"Victorian Curriculum 2.0"},
  {code:"QLD",name:"Queensland",curr:"Australian Curriculum V9"},
  {code:"SA",name:"South Australia",curr:"Australian Curriculum V9"},
  {code:"WA",name:"Western Australia",curr:"Australian Curriculum V9"},
  {code:"TAS",name:"Tasmania",curr:"Australian Curriculum V9"},
  {code:"ACT",name:"ACT",curr:"Australian Curriculum V9"},
  {code:"NT",name:"Northern Territory",curr:"Australian Curriculum V9"},
];

const YEAR_LEVELS = ["Foundation / Kindergarten","Year 1","Year 2","Year 3","Year 4","Year 5","Year 6"];
const SUBJECTS = ["English","Mathematics","Science","HSIE / Humanities","PDHPE","Creative Arts","Technology","Music","Visual Arts"];
const GRADES = ["A – Outstanding","B – High","C – Sound","D – Basic","E – Limited"];
const SEMESTERS = ["Semester 1","Semester 2"];
const PRONOUNS = ["she/her","he/him","they/them"];

/* ─── API CALL ───────────────────────────────────────── */
async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2500,messages:[{role:"user",content:prompt}]}),
  });
  const raw = await res.text();
  if(!res.ok) throw new Error(`HTTP ${res.status}: ${raw.slice(0,200)}`);
  let data; try{data=JSON.parse(raw);}catch{throw new Error(`Parse error: ${raw.slice(0,200)}`);}
  if(data.error) throw new Error(data.error.message||"API error");
  return (data.content?.[0]?.text||"").trim();
}

/* ─── SHARED UI ──────────────────────────────────────── */
const lbl={display:"block",fontSize:"10px",fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"5px",fontFamily:"'DM Sans',sans-serif"};
const inp=(focus)=>({width:"100%",border:`1.5px solid ${focus?C.ocean:C.border}`,borderRadius:"8px",padding:"9px 11px",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,color:C.ink,background:C.cream,outline:"none",transition:"border-color 0.2s"});
const sel={width:"100%",border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"9px 11px",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,color:C.ink,background:C.cream,outline:"none",cursor:"pointer"};
const Lbl=({children,opt})=><label style={lbl}>{children}{opt&&<span style={{color:C.muted,fontWeight:400,textTransform:"none",letterSpacing:0}}> ({opt})</span>}</label>;

function Btn({onClick,disabled,color=C.navy,fg=C.sky,children,full=true}){
  return <button onClick={onClick} disabled={disabled} style={{width:full?"100%":"auto",background:disabled?"#ddd":color,color:disabled?"#999":fg,border:"none",borderRadius:"10px",padding:"12px 18px",fontSize:"14px",fontFamily:"'Fraunces',serif",fontWeight:700,cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",transition:"all 0.2s",boxShadow:disabled?"none":`0 4px 14px rgba(0,0,0,0.12)`}}>{children}</button>;
}
function ErrBox({msg}){return <div style={{marginTop:"10px",background:"#FFF0F0",border:"2px solid #F48FB1",borderRadius:"8px",padding:"9px 12px",fontSize:"11px",fontWeight:600,color:"#C62828",wordBreak:"break-all",lineHeight:1.5,fontFamily:"'DM Sans',sans-serif"}}>⚠️ {msg}</div>;}
function Loading({text,sub}){return <div style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"16px",minHeight:"380px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"14px"}}><div style={{width:"50px",height:"50px",border:`4px solid ${C.cream}`,borderTop:`4px solid ${C.ocean}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"17px",color:C.navy}}>{text}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:C.muted,fontWeight:500,textAlign:"center"}}>{sub}</div></div>;}
function Empty({icon,title,sub}){return <div style={{background:C.white,border:`2px dashed ${C.border}`,borderRadius:"16px",minHeight:"360px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"10px",padding:"40px 20px",textAlign:"center"}}><div style={{fontSize:"44px"}}>{icon}</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"17px",color:"#CCC"}}>{title}</div>{sub&&<div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#CCC",fontWeight:500,lineHeight:1.6,maxWidth:"280px"}}>{sub}</div>}</div>;}

function ResultCard({children,accent=C.ocean}){
  return <div style={{background:C.white,border:`2px solid ${accent}`,borderRadius:"16px",padding:"24px 28px",boxShadow:`0 8px 32px ${accent}1a`}}>{children}</div>;
}
function CopyBtn({text}){
  const [c,setC]=useState(false);
  return <button onClick={()=>{navigator.clipboard.writeText(text);setC(true);setTimeout(()=>setC(false),2000);}} style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"7px 12px",fontSize:"12px",fontWeight:600,cursor:"pointer",color:C.navy,fontFamily:"'DM Sans',sans-serif"}}>{c?"✅ Copied":"📋 Copy"}</button>;
}
function InputField({label,opt,value,onChange,placeholder,rows}){
  const [f,setF]=useState(false);
  return <div style={{marginBottom:"14px"}}><Lbl opt={opt}>{label}</Lbl>{rows?<textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...inp(f),resize:"none"}} onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>:<input value={value} onChange={onChange} placeholder={placeholder} style={inp(f)} onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>}</div>;
}
function SelectField({label,value,onChange,options,opt}){
  return <div style={{marginBottom:"14px"}}><Lbl opt={opt}>{label}</Lbl><select value={value} onChange={onChange} style={sel}>{options.map(o=><option key={o.value||o}>{o.label||o}</option>)}</select></div>;
}
function FormPanel({children}){return <div style={{flex:"0 0 300px",background:C.white,borderRadius:"16px",padding:"24px",border:`1.5px solid ${C.border}`,boxShadow:"0 2px 12px rgba(0,0,0,0.04)"}}>{children}</div>;}
function PreviewPanel({children}){return <div style={{flex:1,minWidth:"280px"}}>{children}</div>;}
function ToolRow({children}){return <div style={{display:"flex",gap:"24px",alignItems:"flex-start",flexWrap:"wrap"}}>{children}</div>;}

/* ═══════════════════════════════════════════════════════
   TOOL 1 — WORKSHEET BUILDER
═══════════════════════════════════════════════════════ */
function WorksheetTool({state}){
  const {getToken}=useAuth();
  const [inp2,setInp]=useState("");const [year,setYear]=useState("Foundation / Kindergarten");const [type,setType]=useState("practice");const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [err,setErr]=useState(null);
  const types=[{id:"practice",icon:"✏️",label:"Practice"},{id:"assessment",icon:"📋",label:"Assessment"},{id:"activity",icon:"🎨",label:"Activity"},{id:"warmup",icon:"⚡",label:"Warm-Up"}];
  const codes=["AC9MFA01","AC9MFN04","AC9MFM01","AC9MFA02","AC9MFN05"];
  const stateInfo=STATES.find(s=>s.code===state)||STATES[0];
  async function go(){
    if(!inp2.trim())return;setLoading(true);setErr(null);setResult(null);
    const typeDesc={practice:"skill practice worksheet",assessment:"short assessment",activity:"creative hands-on activity worksheet",warmup:"quick 5-minute warm-up"}[type];
    const p=`You are an expert Australian primary teacher creating ${stateInfo.curr}-aligned worksheets.
Create a ${typeDesc} for ${year} students on: "${inp2}"
State/Territory: ${stateInfo.name} — use ${stateInfo.curr} language and codes.
OUTPUT RULES: ONLY raw HTML, no markdown fences.
- Outer div: width:210mm; font-family:Nunito Sans,sans-serif
- ${year.includes("Foundation")||year.includes("1")?"VERY large text 18px+, emoji visuals, drawing boxes, thick write boxes, simple language":"Age-appropriate language, structured tasks, clear scaffolding"}
- Coloured header bar with title and curriculum code badge
- Name/date fields, ⭐ instructions, 4-5 tasks with thick bordered response areas
- Word bank and sentence frames where appropriate  
- Footer: © Canopy Education · ${inp2} · 💡 Plastic sleeve — dry erase & reuse!
- One accent colour used consistently
- Start with <div end with </div>`;
    try{let h=await callClaude(p,getToken);h=h.replace(/^```(?:html)?\s*/i,"").replace(/\s*```\s*$/i,"").trim();if(h.length<40)throw new Error("Empty");setResult(h);}catch(e){setErr(String(e.message));}finally{setLoading(false);}
  }
  function print(){const w=window.open("","_blank");w.document.write(`<!DOCTYPE html><html><head><style>@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}@page{size:A4;margin:0}</style></head><body>${result}</body></html>`);w.document.close();w.print();}
  return(
    <ToolRow>
      <FormPanel>
        <div style={{background:C.soft,borderRadius:"8px",padding:"8px 12px",marginBottom:"16px",border:`1px solid ${C.border}`}}>
          <div style={{fontSize:"10px",fontWeight:700,color:C.ocean,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",letterSpacing:"0.5px"}}>📍 {stateInfo.name} · {stateInfo.curr}</div>
        </div>
        <div style={{marginBottom:"14px"}}><Lbl>Curriculum Code or Topic</Lbl>
          <input value={inp2} onChange={e=>setInp(e.target.value)} placeholder="AC9MFA01  or  'counting to 20'" style={inp(false)} onFocus={e=>e.target.style.borderColor=C.ocean} onBlur={e=>e.target.style.borderColor=C.border}/>
          <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"6px"}}>{codes.map(c=><button key={c} onClick={()=>setInp(c)} style={{background:inp2===c?C.navy:C.soft,color:inp2===c?C.sky:C.muted,border:`1px solid ${inp2===c?C.navy:C.border}`,borderRadius:"20px",padding:"2px 8px",fontSize:"10px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{c}</button>)}</div>
        </div>
        <SelectField label="Year Level" value={year} onChange={e=>setYear(e.target.value)} options={YEAR_LEVELS}/>
        <div style={{marginBottom:"18px"}}><Lbl>Worksheet Type</Lbl>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
            {types.map(t=><button key={t.id} onClick={()=>setType(t.id)} style={{background:type===t.id?C.navy:C.soft,border:`1.5px solid ${type===t.id?C.navy:C.border}`,borderRadius:"8px",padding:"9px 7px",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
              <div style={{fontSize:"15px"}}>{t.icon}</div><div style={{fontSize:"12px",fontWeight:700,color:type===t.id?"#fff":C.ink}}>{t.label}</div>
            </button>)}
          </div>
        </div>
        <Btn onClick={go} disabled={loading||!inp2.trim()}>{loading?"⚙️  Generating…":"✨  Generate Worksheet"}</Btn>
        {err&&<ErrBox msg={err}/>}
      </FormPanel>
      <PreviewPanel>
        {!result&&!loading&&<Empty icon="📄" title="Worksheet preview" sub="Enter a code or topic, choose year level and type, then click Generate"/>}
        {loading&&<Loading text="Building worksheet…" sub={`${year} · ${type} · ${stateInfo.name}`}/>}
        {result&&<div>
          <div style={{display:"flex",gap:"8px",marginBottom:"12px",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,color:C.navy}}>✅ Ready — {year}</span>
            <div style={{display:"flex",gap:"8px"}}>
              <CopyBtn text={result}/><button onClick={print} style={{background:C.navy,border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",fontWeight:700,cursor:"pointer",color:C.sky,fontFamily:"'DM Sans',sans-serif"}}>🖨️ Print</button>
              <button onClick={()=>setResult(null)} style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>🔄</button>
            </div>
          </div>
          <div style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"16px",overflow:"hidden",boxShadow:"0 6px 24px rgba(0,0,0,0.06)"}}><div dangerouslySetInnerHTML={{__html:result}}/></div>
        </div>}
      </PreviewPanel>
    </ToolRow>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOL 2 — REPORT WRITER
═══════════════════════════════════════════════════════ */
function ReportTool({state}){
  const {getToken}=useAuth();
  const [name,setName]=useState("");const [pron,setPron]=useState("she/her");const [year,setYear]=useState("Year 2");const [sem,setSem]=useState("Semester 1");const [subj,setSubj]=useState("English");const [grade,setGrade]=useState("C – Sound");const [str,setStr]=useState("");const [grw,setGrw]=useState("");const [notes,setNotes]=useState("");const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [err,setErr]=useState(null);const [copied,setCopied]=useState(false);
  const stateInfo=STATES.find(s=>s.code===state)||STATES[0];
  const pr=(p)=>({"he/him":{s:"He",o:"him",p:"his",r:"himself"},"she/her":{s:"She",o:"her",p:"her",r:"herself"},"they/them":{s:"They",o:"them",p:"their",r:"themselves"}}[p]||{s:"They",o:"them",p:"their",r:"themselves"});
  async function go(){
    if(!name.trim())return;setLoading(true);setErr(null);setResult(null);
    const p=pr(pron);const si=stateInfo;
    const prompt=`You are an expert Australian primary teacher with 15 years writing formal school reports aligned to ${si.curr} for ${si.name}.

Write a ${sem} report comment for:
- Name: ${name} | Pronouns: ${pron} (${p.s}/${p.o}/${p.p}) | Year: ${year} | Subject: ${subj} | Grade: ${grade}
- Strengths: ${str||"infer from grade and subject"}
- Growth areas: ${grw||"infer from grade"}
- Notes: ${notes||"none"}

REQUIREMENTS:
1. Exactly 3 paragraphs, 120–160 words total
2. Para 1: Student name + specific demonstrated knowledge/skills using ${si.curr} ${subj} Achievement Standards language for ${year}
3. Para 2: 2–3 specific observable strengths with concrete examples ("demonstrates..." not "does well")
4. Para 3: Next steps/growth + warm closing using student's name
5. Correct pronouns (${p.s}/${p.o}/${p.p}/${p.r}) throughout
6. NEVER use: "pleasure to have", "always tries", "participates well", "valued member", "works hard"
7. Grade ${grade}: calibrate specificity and language accordingly
8. Plain text only — 3 paragraphs, no labels, no markdown`;
    try{const t=await callClaude(prompt,getToken);if(t.length<50)throw new Error("Empty");setResult(t);}catch(e){setErr(String(e.message));}finally{setLoading(false);}
  }
  return(
    <ToolRow>
      <FormPanel>
        <div style={{background:C.soft,borderRadius:"8px",padding:"8px 12px",marginBottom:"16px",border:`1px solid ${C.border}`,fontSize:"11px",fontWeight:600,color:C.muted,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
          💡 More detail in Strengths and Notes = more personalised output
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
          <div><Lbl>Student Name</Lbl><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Amelia" style={inp(false)} onFocus={e=>e.target.style.borderColor=C.ocean} onBlur={e=>e.target.style.borderColor=C.border}/></div>
          <div><SelectField label="Pronouns" value={pron} onChange={e=>setPron(e.target.value)} options={PRONOUNS}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"0"}}>
          <SelectField label="Year Level" value={year} onChange={e=>setYear(e.target.value)} options={YEAR_LEVELS}/>
          <SelectField label="Semester" value={sem} onChange={e=>setSem(e.target.value)} options={SEMESTERS}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"0"}}>
          <SelectField label="Subject" value={subj} onChange={e=>setSubj(e.target.value)} options={SUBJECTS}/>
          <SelectField label="Grade" value={grade} onChange={e=>setGrade(e.target.value)} options={GRADES}/>
        </div>
        <InputField label="Specific Strengths" opt="recommended" value={str} onChange={e=>setStr(e.target.value)} placeholder="e.g. Fluent decoder, uses punctuation accurately, explains strategies clearly" rows={2}/>
        <InputField label="Areas for Growth" opt="recommended" value={grw} onChange={e=>setGrw(e.target.value)} placeholder="e.g. Paragraphing, multiplication fluency" rows={2}/>
        <InputField label="Additional Notes" opt="optional" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. IEP student, EAL/D learner, gifted" rows={2}/>
        <Btn onClick={go} disabled={loading||!name.trim()} color={C.coral} fg="#fff">{loading?"⚙️  Writing comment…":"📝  Generate Report Comment"}</Btn>
        {err&&<ErrBox msg={err}/>}
      </FormPanel>
      <PreviewPanel>
        {!result&&!loading&&<Empty icon="📝" title="Report comment preview" sub="Fill in student details and click Generate Report Comment"/>}
        {loading&&<Loading text="Writing report comment…" sub={`${stateInfo.name} · ${subj} · ${sem}`}/>}
        {result&&<div>
          <div style={{display:"flex",gap:"8px",marginBottom:"12px",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,color:C.navy}}>✅ {name} · {subj} · {grade.split("–")[0].trim()}</span>
            <div style={{display:"flex",gap:"8px"}}>
              <CopyBtn text={result}/>
              <button onClick={go} style={{background:C.coral,border:"none",borderRadius:"8px",padding:"7px 12px",fontSize:"12px",fontWeight:700,cursor:"pointer",color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>🔄 Regen</button>
            </div>
          </div>
          <ResultCard accent={C.coral}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"18px",paddingBottom:"14px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:"38px",height:"38px",borderRadius:"50%",background:C.soft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"17px"}}>👤</div>
              <div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"15px",color:C.navy}}>{name}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:C.muted}}>{year} · {subj} · {sem} · {stateInfo.name}</div></div>
              <span style={{marginLeft:"auto",background:C.soft,borderRadius:"6px",padding:"3px 10px",fontSize:"11px",fontWeight:700,color:C.ocean,fontFamily:"'DM Sans',sans-serif"}}>{grade.split("–")[0].trim()}</span>
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",lineHeight:1.85,color:C.ink,whiteSpace:"pre-wrap"}}>{result}</div>
            <div style={{marginTop:"16px",paddingTop:"12px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:C.muted}}>© Canopy Education</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:C.muted}}>{result.split(" ").length} words</span>
            </div>
          </ResultCard>
          <div style={{marginTop:"10px",background:C.soft,borderRadius:"8px",padding:"9px 12px",border:`1px solid ${C.border}`,fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:C.muted,lineHeight:1.5}}>
            💡 <strong style={{color:C.navy}}>Review before sending</strong> — verify names, pronouns, and accuracy. AI provides a strong draft; you apply professional judgement.
          </div>
        </div>}
      </PreviewPanel>
    </ToolRow>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOL 3 — BEHAVIOUR COACH
═══════════════════════════════════════════════════════ */
const BEH_SYS=`You are an expert school behaviour consultant with 20 years supporting Australian K–6 teachers. Your evidence base includes: Positive Behaviour for Learning (PBL — NSW DoE framework), Trauma-Informed Practice & ACE research, Collaborative & Proactive Solutions (Ross Greene), Functions of Behaviour (attention/escape/sensory/tangible), ABC functional analysis, Zones of Regulation (Kuypers), Restitutive & Restorative Practices, Sensory Processing strategies, ADHD-informed and ASD-informed classroom approaches, Universal Design for Learning, Tier 1/2/3 support frameworks, and Window of Tolerance theory.

RESPONSE FORMAT:
1. Brief empathetic acknowledgement (1–2 sentences)
2. Key insight: what's likely driving this behaviour and from which framework
3. 3–5 specific, practical strategies with clear steps
4. Optional: a ready-to-use teacher script for the situation
5. If safeguarding concerns exist, name them clearly
Keep under 380 words. Be warm, practical, non-judgmental.`;

function BehaviourTool(){
  const {getToken}=useAuth();
  const [msgs,setMsgs]=useState([]);const [inp2,setInp]=useState("");const [loading,setLoading]=useState(false);const ref=useRef(null);
  useEffect(()=>{if(ref.current)ref.current.scrollTop=ref.current.scrollHeight;},[msgs]);
  const starters=["A Year 2 student has meltdowns during transitions. Strategies?","Student constantly calls out for attention. How to address without reinforcing?","A child becomes aggressive when asked to do writing tasks. Best approach?","Year 1 student can't sit still, disrupting the class. Sensory strategies?","How do I support a student with suspected trauma who shuts down?"];
  async function send(t){
    const msg=t||inp2.trim();if(!msg)return;setInp("");
    const nm=[...msgs,{r:"user",c:msg}];setMsgs(nm);setLoading(true);
    try{
      const hist=nm.map(m=>`${m.r==="user"?"Teacher":"Coach"}: ${m.c}`).join("\n\n");
      const reply=await callClaude(`${BEH_SYS}\n\n${hist}`,getToken);
      setMsgs([...nm,{r:"assistant",c:reply}]);
    }catch(e){setMsgs([...nm,{r:"assistant",c:`Error: ${e.message}`}]);}
    finally{setLoading(false);}
  }
  return(
    <div style={{display:"flex",gap:"24px",flexWrap:"wrap",alignItems:"flex-start"}}>
      <div style={{flex:"0 0 230px"}}>
        <div style={{background:C.white,borderRadius:"14px",padding:"18px",border:`1.5px solid ${C.border}`,marginBottom:"14px"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:"1px",fontFamily:"'DM Sans',sans-serif",marginBottom:"10px"}}>Evidence Base</div>
          {["Positive Behaviour for Learning","Trauma-Informed Practice","Collaborative Problem Solving","Zones of Regulation","ABC Functional Analysis","ADHD & ASD Strategies","Restorative Practices","Tier 1/2/3 Supports"].map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"5px"}}><div style={{width:"4px",height:"4px",borderRadius:"50%",background:C.ocean,flexShrink:0}}/><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:C.muted,fontWeight:500}}>{f}</span></div>)}
        </div>
        <div style={{background:C.white,borderRadius:"14px",padding:"18px",border:`1.5px solid ${C.border}`}}>
          <div style={{fontSize:"10px",fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:"1px",fontFamily:"'DM Sans',sans-serif",marginBottom:"10px"}}>Try asking…</div>
          {starters.slice(0,3).map((s,i)=><button key={i} onClick={()=>send(s)} style={{display:"block",width:"100%",textAlign:"left",background:C.soft,border:`1px solid ${C.border}`,borderRadius:"7px",padding:"8px 9px",marginBottom:"5px",fontSize:"10px",fontWeight:500,color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",lineHeight:1.4,transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.ocean;e.currentTarget.style.color=C.navy;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>{s}</button>)}
        </div>
      </div>
      <div style={{flex:1,minWidth:"280px",display:"flex",flexDirection:"column"}}>
        <div style={{background:C.navy,borderRadius:"14px 14px 0 0",padding:"14px 18px",display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"34px",height:"34px",borderRadius:"50%",background:"rgba(0,180,216,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px"}}>🧠</div>
          <div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"14px",color:C.white}}>Behaviour Coach</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.5)"}}>Evidence-based · PBL · Trauma-informed</div></div>
          {msgs.length>0&&<button onClick={()=>setMsgs([])} style={{marginLeft:"auto",background:"rgba(255,255,255,0.1)",border:"none",borderRadius:"6px",padding:"4px 9px",fontSize:"10px",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Clear</button>}
        </div>
        <div ref={ref} style={{background:C.cream,border:`1.5px solid ${C.border}`,borderTop:"none",minHeight:"320px",maxHeight:"420px",overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>
          {msgs.length===0&&<div style={{textAlign:"center",padding:"30px 16px"}}><div style={{fontSize:"36px",marginBottom:"10px"}}>👋</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"16px",color:C.navy,marginBottom:"6px"}}>How can I help today?</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:C.muted,lineHeight:1.6}}>Describe a behaviour situation for evidence-based strategies.</div></div>}
          {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-end":"flex-start",gap:"8px"}}>
            {m.r==="assistant"&&<div style={{width:"24px",height:"24px",borderRadius:"50%",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",flexShrink:0,alignSelf:"flex-start",marginTop:"2px"}}>🧠</div>}
            <div style={{maxWidth:"80%",background:m.r==="user"?C.ocean:C.white,borderRadius:m.r==="user"?"12px 12px 3px 12px":"12px 12px 12px 3px",padding:"10px 14px",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",lineHeight:1.75,color:m.r==="user"?"#fff":C.ink,whiteSpace:"pre-wrap"}}>{m.c}</div></div>
          </div>)}
          {loading&&<div style={{display:"flex",gap:"8px",alignItems:"center"}}><div style={{width:"24px",height:"24px",borderRadius:"50%",background:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px"}}>🧠</div><div style={{background:C.white,borderRadius:"12px",padding:"10px 14px"}}><div style={{display:"flex",gap:"3px"}}>{[0,1,2].map(i=><div key={i} style={{width:"5px",height:"5px",borderRadius:"50%",background:C.ocean,animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}</div></div></div>}
        </div>
        <div style={{background:C.white,borderRadius:"0 0 14px 14px",border:`1.5px solid ${C.border}`,borderTop:"none",padding:"12px",display:"flex",gap:"8px"}}>
          <textarea value={inp2} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Describe the situation… (Enter to send)" rows={2} style={{flex:1,border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"8px 10px",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",color:C.ink,background:C.cream,resize:"none",outline:"none"}} onFocus={e=>e.target.style.borderColor=C.ocean} onBlur={e=>e.target.style.borderColor=C.border}/>
          <button onClick={()=>send()} disabled={loading||!inp2.trim()} style={{background:loading||!inp2.trim()?"#ddd":C.navy,border:"none",borderRadius:"8px",padding:"10px 14px",cursor:loading||!inp2.trim()?"not-allowed":"pointer",color:loading||!inp2.trim()?"#999":C.sky,fontSize:"16px",flexShrink:0}}>{loading?"⚙️":"→"}</button>
        </div>
        <div style={{marginTop:"6px",fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:C.muted,textAlign:"center"}}>⚠️ Use professional judgement. Follow your school's behaviour policy and mandatory reporting obligations.</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOL 4 — DECODABLE STORY GENERATOR
═══════════════════════════════════════════════════════ */
const PHONICS_PATTERNS = [
  {group:"CVC & Blends",items:["CVC words (sat, hop, big)","Initial blends (bl, cl, fl, gl, pl, sl)","Final blends (nd, nt, st, sk, mp)","CCVC / CVCC words"]},
  {group:"Digraphs & Trigraphs",items:["sh (ship, fish)","ch (chip, much)","th (this, that, with)","wh (when, whip)","ph (phone)","ng (ring, song)","nk (sink, think)","tch (catch, match)"]},
  {group:"Vowel Teams",items:["ee / ea (feet, seat)","ai / ay (rain, play)","oa / ow (boat, low)","oo (book, moon)","ou / ow (out, cow)","oi / oy (coin, boy)","au / aw (author, saw)","ew (new, few)"]},
  {group:"Long Vowel Patterns",items:["Magic E / CVCe (make, bike, home, cube)","Long a: a_e, ai, ay","Long i: i_e, igh, ie, y","Long o: o_e, oa, ow","Long u: u_e, ew, ue"]},
  {group:"R-Controlled",items:["ar (car, star)","er / ir / ur (her, bird, burn)","or (for, horn)","ware / care (bare, care)"]},
  {group:"Other Patterns",items:["Silent e","Split digraphs","Soft c / soft g","Multisyllabic words","Contractions"]},
];

function DecodableTool(){
  const {getToken}=useAuth();
  const [selected,setSelected]=useState(new Set());const [theme,setTheme]=useState("");const [charName,setChar]=useState("");const [year,setYear]=useState("Year 1");const [length,setLength]=useState("medium");const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [err,setErr]=useState(null);
  const toggle=(item)=>{const s=new Set(selected);s.has(item)?s.delete(item):s.add(item);setSelected(s);};
  async function go(){
    if(selected.size===0)return;setLoading(true);setErr(null);setResult(null);
    const patterns=[...selected].join(", ");
    const wordCount={short:"60–80",medium:"100–130",long:"160–200"}[length];
    const p=`You are an expert in the Science of Reading and synthetic phonics. Create a decodable story for ${year} students.

PHONICS PATTERNS TAUGHT (ONLY use words decodable with these patterns):
${patterns}

Also permitted: common high-frequency words (the, a, I, is, was, to, of, and, in, it, he, she, we, they, said, you, are, have, do, with, for, on, at, his, her, this, that, my, by, be, so, go, no, me, he, we, up, but, not, can, get, had, him, his, has, hot, let, man, old, put, ran, run, saw, say, she, sit, six, ten, too, two, way, who, yes, yet, use)

${charName?`Main character name: ${charName} (name must use taught patterns or be a common sight word)`:"Create a simple character name using the taught patterns."}
${theme?`Story theme/setting: ${theme}`:"Choose an engaging, age-appropriate theme."}
Target length: ${wordCount} words
Year level: ${year}

OUTPUT FORMAT (plain text, no markdown):
TITLE: [story title]

[story text — paragraphs separated by blank lines]

PHONICS CHECK:
- Patterns used: [list the patterns actually used]
- Sight words used: [list any sight words used]
- Estimated word count: [number]`;
    try{const t=await callClaude(p,getToken);if(t.length<50)throw new Error("Empty");setResult(t);}catch(e){setErr(String(e.message));}finally{setLoading(false);}
  }
  function print(){
    const w=window.open("","_blank");
    const title=result?.match(/^TITLE:\s*(.+)/m)?.[1]||"Decodable Story";
    const storyBody=result?.replace(/^TITLE:.*\n?/m,"").replace(/PHONICS CHECK:[\s\S]*/,"").trim()||"";
    const check=result?.match(/PHONICS CHECK:([\s\S]*)/)?.[1]?.trim()||"";
    w.document.write(`<!DOCTYPE html><html><head><style>body{font-family:Georgia,serif;max-width:600px;margin:40px auto;padding:20px;line-height:1.8;font-size:16px}h1{font-size:22px;margin-bottom:20px}p{margin-bottom:12px}.check{margin-top:30px;padding:14px;background:#f0f7fc;border:1px solid #c9def0;border-radius:8px;font-size:12px;font-family:sans-serif}@page{margin:20mm}</style></head><body><h1>${title}</h1>${storyBody.split("\n\n").map(p=>`<p>${p}</p>`).join("")}<div class="check"><strong>Phonics Check</strong><br/>${check.replace(/\n/g,"<br/>")}</div></body></html>`);
    w.document.close();w.print();
  }
  return(
    <ToolRow>
      <div style={{flex:"0 0 320px",display:"flex",flexDirection:"column",gap:"14px"}}>
        <FormPanel>
          <div style={{background:"#FFF8E1",borderRadius:"8px",padding:"9px 12px",marginBottom:"14px",border:"1px solid #FFE082"}}>
            <div style={{fontSize:"10px",fontWeight:700,color:"#F57F17",textTransform:"uppercase",letterSpacing:"0.5px",fontFamily:"'DM Sans',sans-serif",marginBottom:"2px"}}>📖 Science of Reading</div>
            <div style={{fontSize:"11px",fontWeight:500,color:"#795548",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>Stories contain ONLY words decodable with the patterns you select. Tick what your class has been explicitly taught.</div>
          </div>
          <SelectField label="Year Level" value={year} onChange={e=>setYear(e.target.value)} options={["Foundation / Kindergarten","Year 1","Year 2"]}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",marginBottom:"14px"}}>
            {["short","medium","long"].map(l=><button key={l} onClick={()=>setLength(l)} style={{background:length===l?C.navy:C.soft,border:`1.5px solid ${length===l?C.navy:C.border}`,borderRadius:"7px",padding:"7px 4px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:700,color:length===l?"#fff":C.muted,textTransform:"capitalize"}}>{l}<div style={{fontSize:"9px",fontWeight:400,color:length===l?"rgba(255,255,255,0.6)":C.muted,marginTop:"1px"}}>{{"short":"60–80","medium":"100–130","long":"160–200"}[l]} words</div></button>)}
          </div>
          <InputField label="Story Theme" opt="optional" value={theme} onChange={e=>setTheme(e.target.value)} placeholder="e.g. A dog at the beach"/>
          <InputField label="Character Name" opt="optional" value={charName} onChange={e=>setChar(e.target.value)} placeholder="e.g. Sam, Pip, Zac"/>
          <Btn onClick={go} disabled={loading||selected.size===0} color="#F57F17" fg="#fff">{loading?"⚙️  Generating…":`📖  Generate Story (${selected.size} pattern${selected.size!==1?"s":""})`}</Btn>
          {selected.size===0&&<div style={{marginTop:"8px",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:C.muted,textAlign:"center"}}>Select at least one phonics pattern →</div>}
          {err&&<ErrBox msg={err}/>}
        </FormPanel>
      </div>
      <div style={{flex:1,minWidth:"280px",display:"flex",flexDirection:"column",gap:"14px"}}>
        {/* Pattern selector */}
        <div style={{background:C.white,borderRadius:"14px",padding:"20px",border:`1.5px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
            <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"15px",color:C.navy}}>Select Phonics Patterns Taught</div>
            <div style={{display:"flex",gap:"6px"}}>
              <button onClick={()=>{const all=new Set();PHONICS_PATTERNS.forEach(g=>g.items.forEach(i=>all.add(i)));setSelected(all);}} style={{background:C.soft,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"4px 10px",fontSize:"10px",fontWeight:600,cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>All</button>
              <button onClick={()=>setSelected(new Set())} style={{background:C.soft,border:`1px solid ${C.border}`,borderRadius:"6px",padding:"4px 10px",fontSize:"10px",fontWeight:600,cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>Clear</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
            {PHONICS_PATTERNS.map((group,gi)=>(
              <div key={gi}>
                <div style={{fontSize:"10px",fontWeight:800,color:C.ocean,textTransform:"uppercase",letterSpacing:"0.8px",fontFamily:"'DM Sans',sans-serif",marginBottom:"6px"}}>{group.group}</div>
                {group.items.map((item,ii)=>(
                  <label key={ii} style={{display:"flex",alignItems:"flex-start",gap:"6px",marginBottom:"4px",cursor:"pointer"}}>
                    <input type="checkbox" checked={selected.has(item)} onChange={()=>toggle(item)} style={{marginTop:"2px",flexShrink:0,accentColor:C.ocean}}/>
                    <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:selected.has(item)?C.navy:C.muted,fontWeight:selected.has(item)?600:400,lineHeight:1.4}}>{item}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Result */}
        {loading&&<Loading text="Writing decodable story…" sub="Checking all words against selected phonics patterns"/>}
        {result&&!loading&&(
          <div>
            <div style={{display:"flex",gap:"8px",marginBottom:"10px",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,color:C.navy}}>✅ Story ready · {year}</span>
              <div style={{display:"flex",gap:"8px"}}><CopyBtn text={result}/><button onClick={print} style={{background:C.navy,border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",fontWeight:700,cursor:"pointer",color:C.sky,fontFamily:"'DM Sans',sans-serif"}}>🖨️ Print</button><button onClick={()=>setResult(null)} style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>🔄</button></div>
            </div>
            <ResultCard accent="#F57F17">
              <div style={{fontFamily:"Georgia,serif",fontSize:"15px",lineHeight:1.85,color:C.ink,whiteSpace:"pre-wrap"}}>{result.replace(/^TITLE:\s*/m,"").replace(/\nPHONICS CHECK:/,"").trim()}</div>
              {result.includes("PHONICS CHECK")&&<div style={{marginTop:"16px",paddingTop:"12px",borderTop:`1px solid ${C.border}`,background:C.soft,borderRadius:"6px",padding:"10px 12px"}}>
                <div style={{fontSize:"10px",fontWeight:700,color:C.ocean,textTransform:"uppercase",letterSpacing:"0.5px",fontFamily:"'DM Sans',sans-serif",marginBottom:"4px"}}>Phonics Check</div>
                <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:C.muted,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{result.match(/PHONICS CHECK:([\s\S]*)/)?.[1]?.trim()}</div>
              </div>}
            </ResultCard>
          </div>
        )}
      </div>
    </ToolRow>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOL 5 — DIFFERENTIATION MACHINE
═══════════════════════════════════════════════════════ */
function DiffTool(){
  const {getToken}=useAuth();
  const [content,setContent]=useState("");const [year,setYear]=useState("Year 3");const [subj,setSubj]=useState("Mathematics");const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [err,setErr]=useState(null);
  const [f,setF]=useState(false);
  async function go(){
    if(!content.trim())return;setLoading(true);setErr(null);setResult(null);
    const p=`You are an expert in differentiation and inclusive education for Australian primary schools.

Take the following content and create THREE differentiated versions for ${year} ${subj} students:

ORIGINAL CONTENT:
${content}

Create:
1. BELOW LEVEL — for students working below year level: simplified language, broken into smaller steps, more scaffolding, visual prompts, sentence starters, reduced quantity, concrete/hands-on focus
2. AT LEVEL — close to original, minor refinements for clarity and AC V9 alignment  
3. ABOVE LEVEL — for students working above year level: extended vocabulary, higher-order thinking (Bloom's: analyse/evaluate/create), additional complexity, open-ended extensions, less scaffolding, abstract reasoning

FORMAT your response exactly like this:
⬇️ BELOW LEVEL
[content]

➡️ AT LEVEL
[content]

⬆️ ABOVE LEVEL
[content]

Keep each version appropriately sized — not dramatically longer than the original. Plain text only.`;
    try{const t=await callClaude(p,getToken);if(t.length<50)throw new Error("Empty");setResult(t);}catch(e){setErr(String(e.message));}finally{setLoading(false);}
  }
  const levels=[
    {key:"BELOW LEVEL",icon:"⬇️",label:"Below Level",color:"#FF8F00",bg:"#FFF8E1",border:"#FFE082",desc:"Scaffolded · Simplified · Concrete"},
    {key:"AT LEVEL",icon:"➡️",label:"At Level",color:C.ocean,bg:C.soft,border:C.border,desc:"AC V9 aligned · Year appropriate"},
    {key:"ABOVE LEVEL",icon:"⬆️",label:"Above Level",color:"#2E7D32",bg:"#F1F8E9",border:"#A5D6A7",desc:"Extended · Higher-order thinking"},
  ];
  const extract=(t,key)=>{
    const idx=t.indexOf(`${levels.find(l=>l.key===key)?.icon} ${key}`);
    if(idx===-1)return t;
    const start=idx+key.length+3;
    const ends=levels.map(l=>t.indexOf(`${l.icon} ${l.key}`,idx+1)).filter(i=>i>idx);
    const end=ends.length>0?Math.min(...ends):t.length;
    return t.slice(start,end).trim();
  };
  return(
    <ToolRow>
      <FormPanel>
        <div style={{background:C.soft,borderRadius:"8px",padding:"8px 12px",marginBottom:"14px",border:`1px solid ${C.border}`,fontSize:"11px",fontWeight:500,color:C.muted,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
          ⚡ Paste any lesson content, activity, or worksheet text. Canopy generates three versions instantly.
        </div>
        <div style={{marginBottom:"14px"}}><Lbl>Paste Your Content</Lbl>
          <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Paste lesson content, activity instructions, questions, or any text…" rows={8} style={{...inp(f),resize:"vertical"}} onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>
        </div>
        <SelectField label="Year Level Context" value={year} onChange={e=>setYear(e.target.value)} options={YEAR_LEVELS}/>
        <SelectField label="Subject" value={subj} onChange={e=>setSubj(e.target.value)} options={SUBJECTS}/>
        <Btn onClick={go} disabled={loading||!content.trim()} color="#7B1FA2" fg="#fff">{loading?"⚙️  Differentiating…":"⚡  Generate 3 Levels"}</Btn>
        {err&&<ErrBox msg={err}/>}
      </FormPanel>
      <PreviewPanel>
        {!result&&!loading&&<Empty icon="⚡" title="Three versions will appear here" sub="Paste your content, choose year level and subject, then click Generate 3 Levels"/>}
        {loading&&<Loading text="Creating three versions…" sub="Below level · At level · Above level"/>}
        {result&&!loading&&<div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
          <div style={{display:"flex",gap:"8px",marginBottom:"2px",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,color:C.navy}}>✅ Three versions ready · {year} · {subj}</span>
            <div style={{display:"flex",gap:"8px"}}><CopyBtn text={result}/><button onClick={()=>setResult(null)} style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>🔄</button></div>
          </div>
          {levels.map(lv=>(
            <div key={lv.key} style={{background:lv.bg,borderRadius:"12px",padding:"16px 18px",border:`1.5px solid ${lv.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                <span style={{fontSize:"18px"}}>{lv.icon}</span>
                <div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"14px",color:lv.color}}>{lv.label}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:C.muted,fontWeight:500}}>{lv.desc}</div></div>
                <CopyBtn text={extract(result,lv.key)}/>
              </div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",lineHeight:1.75,color:C.ink,whiteSpace:"pre-wrap"}}>{extract(result,lv.key)}</div>
            </div>
          ))}
        </div>}
      </PreviewPanel>
    </ToolRow>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOL 6 — NCCD ADJUSTMENT PLANNER
═══════════════════════════════════════════════════════ */
const DISABILITY_CATS=[
  {label:"Cognitive/Learning",subs:["Dyslexia / Reading Difficulty","Dyscalculia","Language Processing Disorder","Intellectual Disability (mild)","Intellectual Disability (moderate-severe)","General Learning Difficulty"]},
  {label:"Social/Emotional/Behavioural",subs:["ADHD — Inattentive type","ADHD — Hyperactive/Combined type","Anxiety Disorder","ASD — Level 1","ASD — Level 2","ASD — Level 3","ODD / Conduct Disorder","Trauma / PTSD"]},
  {label:"Physical/Medical",subs:["Cerebral Palsy","Epilepsy","Chronic Fatigue / Chronic Illness","Diabetes","Vision Impairment","Hearing Impairment","Fine Motor Difficulties"]},
  {label:"Communication",subs:["Speech Sound Disorder","Language Disorder","Selective Mutism","Stuttering / Fluency Disorder","AAC User"]},
];
const NCCD_LEVELS=["Supplementary — Low-cost, within-class adjustments","Substantial — Moderate specialist support","Extensive — High-level, ongoing specialist support"];

function NCCDTool(){
  const {getToken}=useAuth();
  const [studName,setStudName]=useState("");const [year,setYear]=useState("Year 3");const [cat,setCat]=useState("Cognitive/Learning");const [cond,setCond]=useState("Dyslexia / Reading Difficulty");const [level,setLevel]=useState(NCCD_LEVELS[0]);const [subj,setSubj]=useState("English");const [challenges,setChallenges]=useState("");const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [err,setErr]=useState(null);
  const subs=DISABILITY_CATS.find(c=>c.label===cat)?.subs||[];
  useEffect(()=>{setCond(subs[0]||"");},[cat]);
  async function go(){
    setLoading(true);setErr(null);setResult(null);
    const lvlShort=level.split("—")[0].trim();
    const p=`You are an expert NCCD (Nationally Consistent Collection of Data on School Students with Disability) coordinator and inclusive education specialist in Australia.

Create a professional NCCD Adjustment Plan for:
- Student: ${studName||"Student"} | Year: ${year} | Disability Category: ${cat} | Condition: ${cond}
- NCCD Level: ${lvlShort} | Subject/Learning Area: ${subj}
- Observed challenges: ${challenges||"not specified — infer from condition"}

Write the following sections in plain text (use the exact headings):

STUDENT SUPPORT SUMMARY
[2–3 sentences describing the student's needs and how the disability affects learning in ${subj}]

REASONABLE ADJUSTMENTS
[List 5–7 specific, practical adjustments appropriate to ${lvlShort} level, numbered]

TEACHING STRATEGIES
[List 4–5 evidence-based instructional strategies, numbered]

ASSESSMENT ADJUSTMENTS
[List 3–4 appropriate assessment adjustments, numbered]

MONITORING & REVIEW
[2–3 sentences on how progress will be monitored and when to review]

EVIDENCE INDICATORS
[List 3–4 types of evidence that demonstrate this student is receiving ${lvlShort} adjustments — for NCCD documentation purposes]

Use professional, NCCD-compliant language. Be specific and practical.`;
    try{const t=await callClaude(p,getToken);if(t.length<50)throw new Error("Empty");setResult(t);}catch(e){setErr(String(e.message));}finally{setLoading(false);}
  }
  function print(){
    const w=window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><style>body{font-family:Arial,sans-serif;max-width:700px;margin:30px auto;padding:20px;font-size:13px;line-height:1.6;color:#0d1b2a}.header{background:#012A4A;color:white;padding:16px 20px;border-radius:8px;margin-bottom:20px}.header h1{font-size:18px;margin:0 0 4px}.header p{font-size:11px;opacity:0.7;margin:0}h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#0077B6;border-bottom:1.5px solid #C9DEF0;padding-bottom:6px;margin:20px 0 10px}p{margin-bottom:8px}ol{padding-left:18px;margin-bottom:8px}li{margin-bottom:4px}.footer{margin-top:24px;padding-top:12px;border-top:1px solid #C9DEF0;font-size:10px;color:#999}@page{margin:20mm}</style></head><body>
    <div class="header"><h1>NCCD Adjustment Plan</h1><p>${studName||"Student"} · ${year} · ${cond} · ${level.split("—")[0].trim()} · ${subj}</p></div>
    ${result.split("\n").map(l=>{
      if(/^[A-Z][A-Z &]+$/.test(l.trim())&&l.trim().length>3)return`<h2>${l.trim()}</h2>`;
      if(/^\d+\./.test(l.trim()))return`<li>${l.replace(/^\d+\.\s*/,"")}</li>`;
      return`<p>${l}</p>`;
    }).join("")}
    <div class="footer">Generated by Canopy Education · NCCD documentation support · © ${new Date().getFullYear()}</div>
    </body></html>`);
    w.document.close();w.print();
  }
  return(
    <ToolRow>
      <FormPanel>
        <div style={{background:"#E8F5E9",borderRadius:"8px",padding:"9px 12px",marginBottom:"14px",border:"1px solid #A5D6A7"}}>
          <div style={{fontSize:"10px",fontWeight:700,color:"#2E7D32",textTransform:"uppercase",letterSpacing:"0.5px",fontFamily:"'DM Sans',sans-serif",marginBottom:"2px"}}>🗂️ NCCD Compliant</div>
          <div style={{fontSize:"11px",fontWeight:500,color:"#388E3C",fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>Generates adjustment plans aligned to Australian NCCD disability categories and evidence requirements.</div>
        </div>
        <InputField label="Student Name" opt="optional" value={studName} onChange={e=>setStudName(e.target.value)} placeholder="e.g. Jordan (or leave blank)"/>
        <SelectField label="Year Level" value={year} onChange={e=>setYear(e.target.value)} options={YEAR_LEVELS}/>
        <SelectField label="Disability Category" value={cat} onChange={e=>setCat(e.target.value)} options={DISABILITY_CATS.map(c=>c.label)}/>
        <SelectField label="Condition / Diagnosis" value={cond} onChange={e=>setCond(e.target.value)} options={subs}/>
        <SelectField label="NCCD Level" value={level} onChange={e=>setLevel(e.target.value)} options={NCCD_LEVELS}/>
        <SelectField label="Subject / Learning Area" value={subj} onChange={e=>setSubj(e.target.value)} options={SUBJECTS}/>
        <InputField label="Observed Challenges" opt="optional" value={challenges} onChange={e=>setChallenges(e.target.value)} placeholder="e.g. Difficulty decoding multisyllabic words, avoids reading aloud, loses place when reading" rows={2}/>
        <Btn onClick={go} disabled={loading} color="#2E7D32" fg="#fff">{loading?"⚙️  Generating plan…":"🗂️  Generate Adjustment Plan"}</Btn>
        {err&&<ErrBox msg={err}/>}
      </FormPanel>
      <PreviewPanel>
        {!result&&!loading&&<Empty icon="🗂️" title="Adjustment plan preview" sub="Fill in student details and condition, then click Generate. Use your professional judgement to review before use."/>}
        {loading&&<Loading text="Writing adjustment plan…" sub="NCCD-aligned · Evidence-based strategies"/>}
        {result&&!loading&&<div>
          <div style={{display:"flex",gap:"8px",marginBottom:"10px",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,color:C.navy}}>✅ {studName||"Student"} · {cond} · {level.split("—")[0].trim()}</span>
            <div style={{display:"flex",gap:"8px"}}><CopyBtn text={result}/><button onClick={print} style={{background:"#2E7D32",border:"none",borderRadius:"8px",padding:"7px 14px",fontSize:"12px",fontWeight:700,cursor:"pointer",color:"#fff",fontFamily:"'DM Sans',sans-serif"}}>🖨️ Print PDF</button><button onClick={()=>setResult(null)} style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>🔄</button></div>
          </div>
          <ResultCard accent="#2E7D32">
            <div style={{background:"#2E7D32",margin:"-24px -28px 20px",padding:"14px 20px",borderRadius:"14px 14px 0 0"}}>
              <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"16px",color:"#fff"}}>NCCD Adjustment Plan</div>
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.7)",marginTop:"2px"}}>{studName||"Student"} · {year} · {cond} · {level.split("—")[0].trim()} · {subj}</div>
            </div>
            <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",lineHeight:1.8,color:C.ink}}>
              {result.split("\n").map((line,i)=>{
                if(/^[A-Z][A-Z &]+$/.test(line.trim())&&line.trim().length>3)return<div key={i} style={{fontSize:"10px",fontWeight:800,color:"#2E7D32",textTransform:"uppercase",letterSpacing:"1px",marginTop:"16px",marginBottom:"6px",paddingBottom:"6px",borderBottom:"1.5px solid #E8F5E9"}}>{line}</div>;
                if(/^\d+\./.test(line.trim()))return<div key={i} style={{paddingLeft:"14px",marginBottom:"4px",position:"relative"}}><span style={{position:"absolute",left:0,color:"#2E7D32",fontWeight:700}}>{line.match(/^\d+/)[0]}.</span>{line.replace(/^\d+\.\s*/,"")}</div>;
                if(!line.trim())return<div key={i} style={{height:"6px"}}/>;
                return<div key={i} style={{marginBottom:"4px"}}>{line}</div>;
              })}
            </div>
          </ResultCard>
          <div style={{marginTop:"10px",background:"#FFF8E1",borderRadius:"8px",padding:"9px 12px",border:"1px solid #FFE082",fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"#795548",lineHeight:1.5}}>
            ⚠️ <strong style={{color:"#F57F17"}}>Professional review required</strong> — This is a documentation aid. Review with your SLSO, learning support teacher, or principal before finalising. All NCCD decisions require professional educational judgement.
          </div>
        </div>}
      </PreviewPanel>
    </ToolRow>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOL 7 — CROSS-CURRICULUM PRIORITY INTEGRATOR
═══════════════════════════════════════════════════════ */
const CCP_INFO = {
  atsi:{label:"Aboriginal & Torres Strait Islander Histories & Cultures",short:"ATSI",color:"#D84315",bg:"#FBE9E7",border:"#FFAB91",icon:"🪶",note:"Engage with this priority respectfully. Consult local community where possible. Use this as a starting point, not a final plan."},
  asia:{label:"Asia and Australia's Engagement with Asia",short:"Asia & Pacific",color:"#1565C0",bg:"#E3F2FD",border:"#90CAF9",icon:"🌏",note:""},
  sust:{label:"Sustainability",short:"Sustainability",color:"#2E7D32",bg:"#E8F5E9",border:"#A5D6A7",icon:"🌿",note:""},
};

function CCPTool({state}){
  const {getToken}=useAuth();
  const [topic,setTopic]=useState("");const [year,setYear]=useState("Year 3");const [subj,setSubj]=useState("Science");const [selected,setSelected]=useState(new Set(["atsi","asia","sust"]));const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [err,setErr]=useState(null);
  const toggle=(k)=>{const s=new Set(selected);s.has(k)?s.delete(k):s.add(k);setSelected(s);};
  const stateInfo=STATES.find(s=>s.code===state)||STATES[0];
  async function go(){
    if(!topic.trim()||selected.size===0)return;setLoading(true);setErr(null);setResult(null);
    const priList=[...selected].map(k=>CCP_INFO[k].label).join(", ");
    const p=`You are an expert Australian curriculum consultant specialising in cross-curriculum priorities for ${stateInfo.name} ${stateInfo.curr}.

Topic/Lesson: "${topic}"
Year Level: ${year} | Subject: ${subj}
Cross-Curriculum Priorities to integrate: ${priList}

For EACH selected priority, provide:
- 3–4 specific, practical, classroom-ready integration ideas
- Ideas must genuinely connect to the topic (not superficial or tokenistic)
- Age-appropriate for ${year}
- Include one specific resource or activity type for each idea

${selected.has("atsi")?`CRITICAL for Aboriginal & Torres Strait Islander Histories & Cultures:
- Use strengths-based, contemporary framing (not deficit or historical-only)
- Acknowledge Country appropriately
- Suggest consulting local Elders or community where relevant
- Reference specific cultural practices, knowledge systems, or perspectives where appropriate
- Avoid stereotyping or over-generalising
- Suggest the AIATSIS resources or Reconciliation Australia materials as relevant`:""}

FORMAT — use these exact headings for each selected priority:
🪶 ABORIGINAL & TORRES STRAIT ISLANDER HISTORIES & CULTURES (if selected)
[content]

🌏 ASIA AND AUSTRALIA'S ENGAGEMENT WITH ASIA (if selected)
[content]

🌿 SUSTAINABILITY (if selected)
[content]

Plain text only. Number each integration idea.`;
    try{const t=await callClaude(p,getToken);if(t.length<50)throw new Error("Empty");setResult(t);}catch(e){setErr(String(e.message));}finally{setLoading(false);}
  }
  const extractSection=(t,emoji,heading)=>{
    const marker=`${emoji} ${heading}`;const idx=t.indexOf(marker);if(idx===-1)return null;
    const start=idx+marker.length;
    const nextEmojis=["🪶","🌏","🌿"].map(e=>t.indexOf(e,idx+1)).filter(i=>i>idx);
    const end=nextEmojis.length>0?Math.min(...nextEmojis):t.length;
    return t.slice(start,end).trim();
  };
  return(
    <ToolRow>
      <FormPanel>
        <div style={{background:C.soft,borderRadius:"8px",padding:"8px 12px",marginBottom:"14px",border:`1px solid ${C.border}`,fontSize:"11px",fontWeight:500,color:C.muted,fontFamily:"'DM Sans',sans-serif",lineHeight:1.5}}>
          🌏 The Australian Curriculum requires all teachers to embed three cross-curriculum priorities across all learning areas. Canopy makes this practical.
        </div>
        <InputField label="Your Topic or Lesson" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Weather patterns, Place value, Narrative writing, The water cycle"/>
        <SelectField label="Year Level" value={year} onChange={e=>setYear(e.target.value)} options={YEAR_LEVELS}/>
        <SelectField label="Subject" value={subj} onChange={e=>setSubj(e.target.value)} options={SUBJECTS}/>
        <div style={{marginBottom:"18px"}}><Lbl>Priorities to Integrate</Lbl>
          {Object.entries(CCP_INFO).map(([k,v])=>(
            <label key={k} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px",cursor:"pointer",background:selected.has(k)?`${v.bg}`:C.soft,border:`1.5px solid ${selected.has(k)?v.border:C.border}`,borderRadius:"8px",padding:"8px 10px",transition:"all 0.15s"}}>
              <input type="checkbox" checked={selected.has(k)} onChange={()=>toggle(k)} style={{flexShrink:0,accentColor:v.color}}/>
              <span style={{fontSize:"15px"}}>{v.icon}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:selected.has(k)?700:500,color:selected.has(k)?v.color:C.muted,lineHeight:1.3}}>{v.label}</span>
            </label>
          ))}
        </div>
        <Btn onClick={go} disabled={loading||!topic.trim()||selected.size===0} color={C.ocean} fg="#fff">{loading?"⚙️  Integrating…":"🌏  Generate Integration Ideas"}</Btn>
        {err&&<ErrBox msg={err}/>}
      </FormPanel>
      <PreviewPanel>
        {!result&&!loading&&<Empty icon="🌏" title="Integration ideas will appear here" sub="Enter your topic, select the priorities you want to integrate, and click Generate"/>}
        {loading&&<Loading text="Generating integration ideas…" sub="Culturally responsive · Practical · AC aligned"/>}
        {result&&!loading&&<div>
          <div style={{display:"flex",gap:"8px",marginBottom:"12px",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:700,color:C.navy}}>✅ {topic} · {year} · {subj}</span>
            <div style={{display:"flex",gap:"8px"}}><CopyBtn text={result}/><button onClick={()=>setResult(null)} style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"8px",padding:"7px 10px",fontSize:"12px",cursor:"pointer",color:C.muted,fontFamily:"'DM Sans',sans-serif"}}>🔄</button></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            {Object.entries(CCP_INFO).map(([k,v])=>{
              if(!selected.has(k))return null;
              const sectionMap={"atsi":["🪶","ABORIGINAL & TORRES STRAIT ISLANDER HISTORIES & CULTURES"],"asia":["🌏","ASIA AND AUSTRALIA'S ENGAGEMENT WITH ASIA"],"sust":["🌿","SUSTAINABILITY"]};
              const [emoji,heading]=sectionMap[k];
              const section=extractSection(result,emoji,heading);
              if(!section)return null;
              return(
                <div key={k} style={{background:v.bg,borderRadius:"12px",padding:"16px 18px",border:`1.5px solid ${v.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                    <span style={{fontSize:"20px"}}>{v.icon}</span>
                    <div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"13px",color:v.color}}>{v.short}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:C.muted,fontWeight:500}}>{v.label}</div></div>
                    <CopyBtn text={section}/>
                  </div>
                  {v.note&&<div style={{background:"rgba(255,255,255,0.7)",borderRadius:"6px",padding:"7px 10px",marginBottom:"10px",fontSize:"10px",fontWeight:600,color:v.color,fontFamily:"'DM Sans',sans-serif",lineHeight:1.4,border:`1px solid ${v.border}`}}>⚠️ {v.note}</div>}
                  <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",lineHeight:1.8,color:C.ink,whiteSpace:"pre-wrap"}}>{section}</div>
                </div>
              );
            })}
          </div>
        </div>}
      </PreviewPanel>
    </ToolRow>
  );
}

/* ═══════════════════════════════════════════════════════
   TOOLS HUB — DASHBOARD + TAB ROUTING
═══════════════════════════════════════════════════════ */
const TOOL_DEFS=[
  {id:"worksheet",icon:"📄",label:"Worksheet Builder",desc:"AC code → print-ready A4 worksheet",color:C.ocean,tag:"Most popular"},
  {id:"report",icon:"📝",label:"Report Writer",desc:"Grade + notes → polished NSW report comment",color:C.coral,tag:""},
  {id:"behaviour",icon:"🧠",label:"Behaviour Coach",desc:"Describe a situation → evidence-based strategies",color:C.sky,tag:""},
  {id:"decodable",icon:"📖",label:"Decodable Stories",desc:"Phonics patterns → decodable story",color:"#F57F17",tag:"New"},
  {id:"diff",icon:"⚡",label:"Differentiation Machine",desc:"Any content → below / at / above level",color:"#7B1FA2",tag:"New"},
  {id:"nccd",icon:"🗂️",label:"NCCD Planner",desc:"Diagnosis → adjustment plan",color:"#2E7D32",tag:"New"},
  {id:"ccp",icon:"🌏",label:"CCP Integrator",desc:"Topic → cross-curriculum priority ideas",color:"#1565C0",tag:"New"},
];

function ToolsHub({toolsRef,state}){
  const [active,setActive]=useState(null);
  const {isSignedIn}=useAuth();
  const [showAuth,setShowAuth]=useState(false);
  const open=(id)=>{
    if(!isSignedIn){setShowAuth(true);return;}
    setActive(id);
    setTimeout(()=>toolsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),50);
  };
  return(
    <section ref={toolsRef} style={{background:C.cream,padding:"80px 32px",borderTop:`1px solid ${C.border}`}}>
      <div style={{maxWidth:"1060px",margin:"0 auto"}}>
        {/* Auth gate overlay */}
        {showAuth&&!isSignedIn&&(
          <div style={{position:"fixed",inset:0,background:"rgba(1,42,74,0.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={()=>setShowAuth(false)}>
            <div style={{background:C.white,borderRadius:"24px",padding:"48px 40px",maxWidth:"420px",width:"90%",textAlign:"center",boxShadow:"0 32px 80px rgba(0,0,0,0.4)"}} onClick={e=>e.stopPropagation()}>
              <div style={{background:C.sky,borderRadius:"14px",width:"56px",height:"56px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",fontWeight:900,color:C.navy,fontFamily:"'Fraunces',serif",margin:"0 auto 20px"}}>C</div>
              <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"26px",color:C.navy,letterSpacing:"-0.8px",marginBottom:"10px"}}>Create your account</h2>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:C.muted,lineHeight:1.6,marginBottom:"8px"}}>Get full access to all 7 Canopy tools.</p>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"13px",color:C.muted,marginBottom:"28px"}}><strong style={{color:C.coral}}>$9/month AUD</strong> — cancel anytime.</p>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <SignUpButton mode="modal" afterSignUpUrl="/">
                  <button style={{width:"100%",background:C.navy,color:C.sky,border:"none",borderRadius:"12px",padding:"14px",fontSize:"15px",fontFamily:"'Fraunces',serif",fontWeight:700,cursor:"pointer",letterSpacing:"-0.3px",boxShadow:"0 4px 16px rgba(1,42,74,0.2)"}}>Create account →</button>
                </SignUpButton>
                <SignInButton mode="modal" afterSignInUrl="/">
                  <button style={{width:"100%",background:"transparent",color:C.muted,border:`1.5px solid ${C.border}`,borderRadius:"12px",padding:"12px",fontSize:"14px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer"}}>Already have an account? Sign in</button>
                </SignInButton>
              </div>
              <button onClick={()=>setShowAuth(false)} style={{marginTop:"16px",background:"none",border:"none",fontSize:"12px",color:C.muted,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>✕ Close</button>
            </div>
          </div>
        )}

        {active&&(
          <div style={{marginBottom:"28px"}}>
            <button onClick={()=>setActive(null)} style={{display:"flex",alignItems:"center",gap:"6px",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:600,color:C.muted,padding:0,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color=C.navy} onMouseLeave={e=>e.currentTarget.style.color=C.muted}>
              ← All tools
            </button>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginTop:"12px"}}>
              <span style={{fontSize:"28px"}}>{TOOL_DEFS.find(t=>t.id===active)?.icon}</span>
              <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"28px",color:C.navy,letterSpacing:"-0.8px"}}>{TOOL_DEFS.find(t=>t.id===active)?.label}</h2>
            </div>
          </div>
        )}
        {!active&&(
          <div style={{textAlign:"center",marginBottom:"48px"}}>
            <div style={{display:"inline-block",background:C.navy,color:C.sky,borderRadius:"20px",padding:"5px 14px",fontSize:"11px",fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px"}}>7 AI Tools</div>
            <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"clamp(28px,4vw,46px)",color:C.navy,letterSpacing:"-1.5px",lineHeight:1.1,marginBottom:"10px"}}>
              Every tool you need.<br/><span style={{fontStyle:"italic",color:C.coral}}>One platform.</span>
            </h2>
            <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",color:C.muted,maxWidth:"380px",margin:"0 auto"}}>All free to try. No sign-up. Click a tool to get started.</p>
          </div>
        )}
        {!active&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"16px"}}>
            {TOOL_DEFS.map(t=>(
              <button key={t.id} onClick={()=>open(t.id)} style={{background:C.white,border:`1.5px solid ${C.border}`,borderRadius:"16px",padding:"22px",textAlign:"left",cursor:"pointer",transition:"all 0.2s",position:"relative",fontFamily:"'DM Sans',sans-serif"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color;e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${t.color}20`;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                {t.tag&&<div style={{position:"absolute",top:"12px",right:"12px",background:t.color,color:"#fff",borderRadius:"20px",padding:"2px 8px",fontSize:"9px",fontWeight:700,letterSpacing:"0.5px"}}>{t.tag}</div>}
                <div style={{fontSize:"28px",marginBottom:"10px"}}>{t.icon}</div>
                <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"17px",color:C.navy,marginBottom:"6px",letterSpacing:"-0.3px"}}>{t.label}</div>
                <div style={{fontSize:"13px",color:C.muted,fontWeight:400,lineHeight:1.5,marginBottom:"14px"}}>{t.desc}</div>
                <div style={{fontSize:"12px",fontWeight:700,color:t.color}}>Open tool →</div>
              </button>
            ))}
          </div>
        )}
        {active==="worksheet"&&<WorksheetTool state={state}/>}
        {active==="report"&&<ReportTool state={state}/>}
        {active==="behaviour"&&<BehaviourTool/>}
        {active==="decodable"&&<DecodableTool/>}
        {active==="diff"&&<DiffTool/>}
        {active==="nccd"&&<NCCDTool/>}
        {active==="ccp"&&<CCPTool state={state}/>}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════ */
function Nav({onToolsClick,onPricingClick,onFaqClick,state,setState}){
  const [scrolled,setScrolled]=useState(false);const [stateOpen,setStateOpen]=useState(false);
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>40);window.addEventListener("scroll",fn);return()=>window.removeEventListener("scroll",fn);},[]);
  return(
    <nav style={{position:"fixed",top:0,left:0,right:0,zIndex:100,background:scrolled?"rgba(1,42,74,0.96)":"transparent",backdropFilter:scrolled?"blur(12px)":"none",borderBottom:scrolled?`1px solid rgba(0,180,216,0.2)`:"none",padding:"0 32px",height:"64px",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"all 0.3s"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <div style={{background:C.sky,borderRadius:"8px",width:"30px",height:"30px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:900,color:C.navy,fontFamily:"'Fraunces',serif"}}>C</div>
        <span style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"19px",color:C.white,letterSpacing:"-0.5px"}}>Canopy</span>
        <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.4)",fontWeight:500,marginLeft:"2px"}}>for Australian Teachers</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
        {/* State selector */}
        <div style={{position:"relative"}}>
          <button onClick={()=>setStateOpen(!stateOpen)} style={{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:"8px",padding:"6px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:"6px",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,0.85)",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.15)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}>
            <span>📍</span><span>{state}</span><span style={{opacity:0.5}}>▾</span>
          </button>
          {stateOpen&&<div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:C.white,borderRadius:"12px",border:`1.5px solid ${C.border}`,boxShadow:"0 12px 40px rgba(0,0,0,0.15)",padding:"6px",minWidth:"220px",zIndex:200}}>
            {STATES.map(s=><button key={s.code} onClick={()=>{setState(s.code);setStateOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",background:state===s.code?C.soft:"transparent",border:"none",borderRadius:"8px",padding:"9px 12px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=C.soft} onMouseLeave={e=>e.currentTarget.style.background=state===s.code?C.soft:"transparent"}>
              <div style={{fontSize:"12px",fontWeight:700,color:C.navy}}>{s.name}</div>
              <div style={{fontSize:"10px",color:C.muted,fontWeight:400}}>{s.curr}</div>
            </button>)}
          </div>}
        </div>
        {[["Tools",onToolsClick],["FAQ",onFaqClick],["Pricing",onPricingClick]].map(([l,fn])=><span key={l} onClick={fn} style={{color:"rgba(255,255,255,0.65)",fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.65)"}>{l}</span>)}
        <AuthNavButtons onToolsClick={onToolsClick}/>
      </div>
    </nav>
  );
}

function AuthNavButtons({onToolsClick}){
  const {isSignedIn}=useAuth();
  if(isSignedIn) return(
    <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
      <button onClick={onToolsClick} style={{background:C.sky,color:C.navy,border:"none",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Open tools</button>
      <UserButton afterSignOutUrl="/"/>
    </div>
  );
  return(
    <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
      <SignInButton mode="modal">
        <button style={{background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.85)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"8px",padding:"8px 16px",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Sign in</button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button style={{background:C.sky,color:C.navy,border:"none",borderRadius:"8px",padding:"8px 18px",fontSize:"13px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Try free →</button>
      </SignUpButton>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
function Hero({onToolsClick}){
  return(
    <section style={{background:`radial-gradient(ellipse at 20% 50%, #0a4a7a 0%, ${C.navy} 65%)`,minHeight:"100vh",display:"flex",alignItems:"center",padding:"100px 32px 80px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:"linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
      <div style={{position:"absolute",top:"15%",right:"5%",width:"400px",height:"400px",background:"rgba(0,180,216,0.06)",borderRadius:"50%",filter:"blur(60px)"}}/>
      <div style={{position:"absolute",bottom:"10%",left:"10%",width:"250px",height:"250px",background:"rgba(255,107,107,0.05)",borderRadius:"50%",filter:"blur(50px)"}}/>
      <div style={{maxWidth:"1060px",margin:"0 auto",width:"100%",position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(0,180,216,0.12)",border:"1px solid rgba(0,180,216,0.3)",borderRadius:"20px",padding:"6px 14px",marginBottom:"28px"}}>
          <span style={{width:"6px",height:"6px",borderRadius:"50%",background:C.sky,display:"inline-block"}}/>
          <span style={{fontSize:"12px",fontWeight:600,color:C.sky,fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.5px"}}>7 AI tools · All states & territories · AC V9 + state syllabuses</span>
        </div>
        <h1 style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"clamp(42px,6vw,76px)",color:C.white,lineHeight:0.95,letterSpacing:"-3px",marginBottom:"28px",maxWidth:"800px"}}>
          The AI platform<br/><span style={{fontStyle:"italic",color:C.sky}}>built</span> for<br/>Australian teachers.
        </h1>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"18px",fontWeight:400,color:"rgba(255,255,255,0.65)",lineHeight:1.7,marginBottom:"20px",maxWidth:"480px"}}>
          Worksheets. Reports. Behaviour strategies. Decodable stories. Differentiation. NCCD plans. Cross-curriculum priorities. Everything under one canopy.
        </p>
        <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"36px"}}>
          {["📄 Worksheet Builder","📝 Report Writer","🧠 Behaviour Coach","📖 Decodable Stories","⚡ Differentiation","🗂️ NCCD Planner","🌏 CCP Integrator"].map((t,i)=>(
            <span key={t} style={{background:"rgba(255,255,255,0.09)",border:"1px solid rgba(255,255,255,0.18)",borderRadius:"20px",padding:"4px 11px",fontSize:"11px",fontWeight:600,color:"rgba(255,255,255,0.75)",fontFamily:"'DM Sans',sans-serif"}}>{t}</span>
          ))}
        </div>
        <div style={{display:"flex",gap:"12px",flexWrap:"wrap",marginBottom:"48px"}}>
          <SignUpButton mode="modal">
            <button style={{background:C.sky,color:C.navy,border:"none",borderRadius:"12px",padding:"16px 32px",fontSize:"16px",fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 8px 32px rgba(0,180,216,0.3)",transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(0,180,216,0.4)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,180,216,0.3)";}}>
              Create account — $9/month ✨
            </button>
          </SignUpButton>
        </div>
        <div style={{display:"flex",gap:"32px",flexWrap:"wrap"}}>
          {[["7","AI tools in one"],["8","states & territories"],["Free","to get started"],["AC V9","+ state syllabuses"]].map(([n,l])=>(
            <div key={n}><div style={{fontFamily:"'Fraunces',serif",fontSize:"26px",fontWeight:900,color:C.sky,letterSpacing:"-0.5px"}}>{n}</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.45)",fontWeight:500}}>{l}</div></div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TRUST BAR
═══════════════════════════════════════════════════════ */
function TrustBar(){
  const items=["All 8 states & territories","AC V9 + Victorian Curriculum 2.0","Foundation – Year 6","A4 Print-Ready","Plastic Sleeve Compatible","Science of Reading aligned","NCCD compliant","Evidence-based behaviour"];
  return(
    <div style={{background:C.navyMid,padding:"14px 32px",borderBottom:"1px solid rgba(0,180,216,0.1)",overflowX:"auto"}}>
      <div style={{display:"flex",gap:"24px",justifyContent:"center",flexWrap:"wrap",minWidth:"max-content"}}>
        {items.map(i=><div key={i} style={{display:"flex",alignItems:"center",gap:"5px"}}><span style={{color:C.sky,fontSize:"10px"}}>✓</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",fontWeight:600,color:"rgba(255,255,255,0.5)",letterSpacing:"0.2px",whiteSpace:"nowrap"}}>{i}</span></div>)}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRICING
═══════════════════════════════════════════════════════ */
function Pricing({onTryClick,pricingRef}){
  const tiers=[
    {name:"Free",price:"$0",per:"forever",cta:"Start free (limited)",highlight:false,
     features:["3 worksheets per month","3 report comments per month","Behaviour Coach (10 messages/day)","1 decodable story per month","1 differentiation set per month","1 NCCD plan per month","1 CCP set per month","All states & territories","Print to PDF"]},
    {name:"Pro",price:"$9",per:"/ month AUD",cta:"Start Pro — 7 days free",highlight:true,
     features:["Unlimited all 7 tools","Bundle builder (8-pack + board game)","Bulk report comment exporter","Decodable story library","NCCD document templates","Priority generation speed","Custom school branding","Cancel anytime"]},
  ];
  return(
    <section ref={pricingRef} style={{background:C.white,padding:"96px 32px",borderTop:`1px solid ${C.border}`}}>
      <div style={{maxWidth:"760px",margin:"0 auto",textAlign:"center"}}>
        <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"clamp(30px,4vw,48px)",color:C.navy,letterSpacing:"-1.5px",marginBottom:"10px"}}>Simple pricing.<br/><span style={{fontStyle:"italic",color:C.coral}}>Cancel anytime.</span></h2>
        <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",color:C.muted,marginBottom:"48px"}}>Start free. Upgrade when you're ready.</p>
        <div style={{background:"#FFF8E1",border:"1.5px solid #FFE082",borderRadius:"14px",padding:"16px 20px",marginBottom:"32px",display:"flex",alignItems:"center",gap:"14px",maxWidth:"620px",margin:"0 auto 28px"}}>
          <span style={{fontSize:"28px"}}>⚡</span>
          <div><div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"15px",color:"#E65100",marginBottom:"3px"}}>Most Canopy users hit the free limit in their first week.</div><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"#795548",lineHeight:1.5}}>Report writing season alone uses 3× the free allocation. Pro pays for itself after one staff meeting saved.</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"20px",maxWidth:"620px",margin:"0 auto"}}>
          {tiers.map((t,i)=>(
            <div key={i} style={{background:t.highlight?C.navy:C.cream,borderRadius:"20px",padding:"28px 24px",border:t.highlight?`2px solid ${C.sky}`:`1.5px solid ${C.border}`,position:"relative"}}>
              {t.highlight&&<div style={{position:"absolute",top:"-11px",left:"50%",transform:"translateX(-50%)",background:C.sky,color:C.navy,borderRadius:"20px",padding:"3px 12px",fontSize:"10px",fontWeight:700,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>Most popular</div>}
              <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:700,color:t.highlight?C.sky:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"6px"}}>{t.name}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:"3px",marginBottom:"3px"}}>
                <span style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"44px",color:t.highlight?C.white:C.navy,letterSpacing:"-2px"}}>{t.price}</span>
                <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:t.highlight?"rgba(255,255,255,0.45)":C.muted,fontWeight:500}}>{t.per}</span>
              </div>
              <div style={{height:"1px",background:t.highlight?"rgba(255,255,255,0.1)":C.border,margin:"16px 0"}}/>
              {t.features.map((f,j)=><div key={j} style={{display:"flex",alignItems:"flex-start",gap:"7px",marginBottom:"8px"}}><span style={{color:t.highlight?C.sky:C.ocean,fontSize:"12px",flexShrink:0,marginTop:"1px"}}>✓</span><span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:500,color:t.highlight?"rgba(255,255,255,0.8)":C.ink,lineHeight:1.4}}>{f}</span></div>)}
              <button onClick={onTryClick} style={{width:"100%",marginTop:"16px",background:t.highlight?C.sky:C.navy,color:t.highlight?C.navy:"#fff",border:"none",borderRadius:"10px",padding:"12px",fontSize:"13px",fontFamily:"'Fraunces',serif",fontWeight:700,cursor:"pointer",letterSpacing:"-0.3px",transition:"opacity 0.15s"}} onMouseEnter={e=>e.target.style.opacity="0.9"} onMouseLeave={e=>e.target.style.opacity="1"}>{t.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
function Footer(){
  return(
    <footer style={{background:C.navy,padding:"44px 32px",borderTop:"1px solid rgba(0,180,216,0.1)"}}>
      <div style={{maxWidth:"1060px",margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"16px"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
            <div style={{background:C.sky,borderRadius:"6px",width:"24px",height:"24px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",fontWeight:900,color:C.navy,fontFamily:"'Fraunces',serif"}}>C</div>
            <span style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"17px",color:C.white}}>Canopy</span>
          </div>
          <div style={{fontFamily:"'DM Sans',sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.35)",fontWeight:500}}>© 2025 Luke Hall Education · Ballina, NSW · All states & territories · AC V9 + Victorian Curriculum 2.0</div>
        </div>
        <div style={{display:"flex",gap:"20px"}}>
          {["Privacy","Terms","Contact","About"].map(l=><span key={l} style={{fontFamily:"'DM Sans',sans-serif",fontSize:"12px",color:"rgba(255,255,255,0.35)",fontWeight:500,cursor:"pointer",transition:"color 0.2s"}} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.8)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.35)"}>{l}</span>)}
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════════════ */
function FAQ({faqRef}){
  const [open,setOpen]=useState(null);
  const faqs=[
    {q:"Is it really free to start?",a:"Yes — no credit card, no sign-up. The free plan gives you access to all 7 tools with monthly limits so you can try everything before committing. Upgrade to Pro when you're ready."},
    {q:"Does it work for all Australian states and territories?",a:"Yes. Canopy supports all 8 states and territories. NSW uses the NSW Syllabus 2022 alongside AC V9. Victoria uses the Victorian Curriculum 2.0. All other states use AC V9 directly. Switch your state in the navigation bar and all tools adjust accordingly."},
    {q:"How is the Behaviour Coach different from just asking ChatGPT?",a:"The Behaviour Coach is specifically calibrated to Australian primary school contexts with a deep evidence base: Positive Behaviour for Learning (the NSW DoE framework), Collaborative & Proactive Solutions (Ross Greene), Trauma-Informed Practice, Zones of Regulation, ABC functional analysis, and Tier 1/2/3 support frameworks. It gives structured, practical advice — not generic responses."},
    {q:"Is the NCCD Planner actually compliant?",a:"The NCCD Planner generates plans using correct NCCD disability categories, evidence descriptors, and adjustment language. It's a professional starting point that must be reviewed by your learning support teacher, SLSO, or principal before finalising. All NCCD decisions require professional educational judgement — Canopy supports the documentation process, it doesn't replace it."},
    {q:"What are decodable stories and why do they matter?",a:"Decodable stories contain only words that students can decode using phonics patterns they've already been explicitly taught — a key requirement of Science of Reading and systematic synthetic phonics programs. Canopy's Decodable Story Generator lets you tick exactly which patterns your class has learned and generates a story using only those patterns, plus permitted high-frequency sight words."},
    {q:"Can I use this for Year 7–12?",a:"Currently Canopy covers Foundation to Year 6 (K–6 primary). Secondary school tools are on the roadmap. If you teach secondary, you can still use the Behaviour Coach and Differentiation Machine — but curriculum alignment tools are optimised for primary."},
    {q:"How do I cancel my Pro subscription?",a:"You can cancel anytime from your account settings — no forms, no phone calls, no lock-in. Your Pro access continues until the end of your billing period. After that you move back to the free plan automatically. Questions? Email hello@canopy.edu.au and we'll sort it within 24 hours."},
    {q:"Is my data private?",a:"Canopy doesn't store student names or personal data. When you use our tools, information is sent to our AI provider (Anthropic) to generate the response and is not retained or used to train models. We recommend using initials or pseudonyms for student names in reports and NCCD plans."},
  ];
  return(
    <section ref={faqRef} style={{background:C.navy,padding:"96px 32px"}}>
      <div style={{maxWidth:"760px",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"56px"}}>
          <div style={{display:"inline-block",background:"rgba(0,180,216,0.15)",color:C.sky,borderRadius:"20px",padding:"5px 14px",fontSize:"11px",fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"14px"}}>FAQ</div>
          <h2 style={{fontFamily:"'Fraunces',serif",fontWeight:900,fontSize:"clamp(28px,4vw,44px)",color:C.white,letterSpacing:"-1.5px",lineHeight:1.1}}>
            Questions answered.<br/><span style={{fontStyle:"italic",color:C.sky}}>Honestly.</span>
          </h2>
        </div>
        {faqs.map((f,i)=>(
          <div key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.08)",marginBottom:"0"}}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",background:"none",border:"none",padding:"20px 0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",cursor:"pointer",textAlign:"left"}}>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:"15px",fontWeight:700,color:open===i?C.sky:C.white,lineHeight:1.4,transition:"color 0.2s"}}>{f.q}</span>
              <span style={{color:open===i?C.sky:"rgba(255,255,255,0.4)",fontSize:"18px",flexShrink:0,transition:"transform 0.2s",transform:open===i?"rotate(45deg)":"rotate(0deg)"}}>+</span>
            </button>
            {open===i&&<div style={{paddingBottom:"20px"}}>
              <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"rgba(255,255,255,0.65)",lineHeight:1.8}}>{f.a}</p>
            </div>}
          </div>
        ))}
        <div style={{marginTop:"48px",background:"rgba(0,180,216,0.08)",border:"1px solid rgba(0,180,216,0.2)",borderRadius:"16px",padding:"28px",textAlign:"center"}}>
          <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:"20px",color:C.white,marginBottom:"8px"}}>Still have questions?</div>
          <p style={{fontFamily:"'DM Sans',sans-serif",fontSize:"14px",color:"rgba(255,255,255,0.6)",marginBottom:"16px"}}>Email us at <span style={{color:C.sky,fontWeight:600}}>hello@canopy.edu.au</span> — we reply within 24 hours.</p>
          <div style={{display:"flex",gap:"10px",justifyContent:"center",flexWrap:"wrap"}}>
            <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"8px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,0.6)"}}>✓ No lock-in contracts</div>
            <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"8px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,0.6)"}}>✓ Cancel anytime</div>
            <div style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"8px 16px",fontFamily:"'DM Sans',sans-serif",fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,0.6)"}}>✓ 24hr email support</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App(){
  const toolsRef=useRef(null);
  const pricingRef=useRef(null);
  const faqRef=useRef(null);
  const [state,setState]=useState("NSW");
  const scrollToTools=()=>toolsRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  const scrollToPricing=()=>pricingRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  const scrollToFaq=()=>faqRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  return(
    <div style={{fontFamily:"'DM Sans',sans-serif"}}>
      <FontLink/>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        *{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#f0f7fc}
        ::-webkit-scrollbar-thumb{background:#c9def0;border-radius:3px}
      `}</style>
      <Nav onToolsClick={scrollToTools} onPricingClick={scrollToPricing} onFaqClick={scrollToFaq} state={state} setState={setState}/>
      <Hero onToolsClick={scrollToTools}/>
      <TrustBar/>
      <ToolsHub toolsRef={toolsRef} state={state}/>
      <FAQ faqRef={faqRef}/>
      <Pricing pricingRef={pricingRef} onTryClick={scrollToTools}/>
      <Footer/>
    </div>
  );
}
