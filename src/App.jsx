import { useState, useRef, useEffect, useCallback } from "react";

const BG    = "#06040F";
const SURF  = "#100C22";
const SURF2 = "#1A1235";
const CARD  = "#1E1540";
const BORD  = "#2C2050";
const BORD2 = "#3D2F6A";
const GOLD  = "#C9A84C";
const GOLDL = "#E8D5A3";
const GOLDD = "#3A2A08";
const TEXT  = "#EDE8F5";
const MUTED = "#6A6082";
const MUTED2= "#9088A8";

const MAX_CATS = 5;

const CATS = [
  { id:"un", icon:"✦", label:"総合運勢",   color:"#C9A84C",
    subs:["今月の運勢","今年の運勢","来年の展望","人生の転換期"] },
  { id:"ki", icon:"◈", label:"金運・財運", color:"#F0C040",
    subs:["収入・給与運","投資・資産運用","節約と貯蓄","臨時収入の兆し"] },
  { id:"sh", icon:"◇", label:"仕事運",     color:"#60B8D8",
    subs:["転職・就職の吉凶","昇進・評価の流れ","職場の人間関係","副業・兼業の可能性"] },
  { id:"re", icon:"♡", label:"恋愛運",     color:"#E890A0",
    subs:["出会いと縁の流れ","現在の関係の行方","結婚・婚活の時期","復縁と縁の再生"] },
  { id:"ko", icon:"⬡", label:"交友・対人", color:"#70D4B8",
    subs:["友人関係の変化","家族との縁","社会・職場の縁","新たな出会いの方向"] },
  { id:"kg", icon:"△", label:"起業・創業", color:"#B090FF",
    subs:["事業計画の吉凶","資金とパートナー運","事業の方向性","最良のタイミング"] },
  { id:"he", icon:"○", label:"健康運",     color:"#80D890",
    subs:["身体の健康状態","メンタルの波","生活習慣の改善","注意すべき時期"] },
];

async function callClaude(system, messages, maxTokens = 4000) {
const endpoint = "/api/chat";

const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
body: JSON.stringify({
      model: "gemini-1.5-flash", 
      max_tokens: maxTokens,
      system: system,
      messages: messages
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    // 2. 新しい api/chat.js のエラー形式に合わせる
    throw new Error(e.error || `HTTP ${res.status}`); 
  }

  const data = await res.json();
  
  // 3. Gemini プロキシ (api/chat.js) からの返事を受け取る
  return data.content[0].text; 
}

function parseJSON(text) {
  try {
    return JSON.parse(text.replace(/^```json\s*/m,"").replace(/^```\s*/m,"").replace(/```\s*$/m,"").trim());
  } catch { return null; }
}

const SYS_INIT = `あなたは鑑定士「輪夢（りんむー）」です。四柱推命・姓名判断・天命筆相（独自の筆跡鑑定手法）を組み合わせた総合鑑定を行います。

【天命筆相とは】縦書き・横書きの手書き文字から以下を読み解く独自手法：画数の変化・ハネ・ハライ・湾曲線・文字の傾き・バランスと枠内配置・筆圧の推測とリズム。これらから書き手の現在の心理状態・潜在意識・精神エネルギーを鑑定します。

【文体】神秘的かつ温かみのある丁寧語。鑑定書らしい格調ある表現を使うこと。詩的なキャッチフレーズや短い格言・標語の出力は一切不要。

【時期・タイミングの表現】運気の流れや時期に言及する際は、必ず「鑑定日」を起点として「鑑定日から〇ヶ月後」「今年の〇月頃」「来年の春頃」のように具体的な未来として表現すること。過去ではなく未来に向けた解説を行うこと。

【出力規則】必ず以下のJSONのみ回答。コードブロック記号・前後の説明文は含めないこと。

{"shichusuimei":{"kihon":"基本命式の解説（200字）","seikaku":"性格・気質の特徴（150字）","genki":"現在の運気の流れ（150字）","toku":"強み・才能（100字）","kadai":"課題・注意点（100字）"},"seimeiHandan":{"meimei":"名前全体の意味と運命（200字）","kaku":"各格の解説（天格・地格・人格・外格・総格）（200字）","unmei":"姓名が示す人生の方向性（150字）"},"tenmeiHissou":{"zentai":"筆跡全体から受ける印象（150字）","tategaki":"縦書き文字から読む特徴と心理（200字）","yokogaki":"横書き文字から読む特徴と心理（200字）","shinri":"現在の心理状態・内面の動き（200字）","sensei":"潜在的才能・隠れた本質（150字）"},"overall":"三法統合の総合メッセージ（300字）"}`;

const SYS_DETAIL = `あなたは鑑定士「輪夢（りんむー）」です。初回鑑定の結果を踏まえ、ご指定の項目について詳細鑑定を行います。

【文体】神秘的かつ温かみのある丁寧語。具体的かつ実践的なアドバイスを含めること。詩的なキャッチフレーズや短い格言・標語の出力は一切不要。

【時期・タイミングの表現】時期に言及する際は必ず「鑑定日」を起点として「鑑定日から〇ヶ月後」「今年の〇月頃」「来年の〇月頃」のように具体的な未来として表現すること。

【出力規則】必ず以下のJSONのみ回答。コードブロック記号・前後の説明文は含めないこと。

{"categories":[{"name":"カテゴリ名","sub":"サブカテゴリ名","reading":"鑑定内容（300字）","advice":"具体的なアドバイス（150字）","timing":"重要な時期・タイミング（鑑定日を起点に具体的な未来で表現・100字）","lucky":"ラッキーポイント・行動（50字）"}],"freeReading":"自由記入欄への鑑定回答（記入があれば200字、なければ空文字）","final":"締めくくりのメッセージ（200字）"}`;

/* ── Drawing Canvas ── */
function DrawingCanvas({ label, hint, vertical, canvasRef, cw, ch }) {
  const W = cw || (vertical ? 270 : 360);
  const H = ch || (vertical ? 390 : 210);
  const drawing = useRef(false); const last = useRef(null);
  const init = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#F9F6EE"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = "rgba(150,130,90,0.28)"; ctx.lineWidth = 0.8;
    if (vertical) {
      for (let x=54;x<W;x+=54){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
    } else {
      for (let y=52;y<H;y+=52){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
    }
    ctx.fillStyle="rgba(180,60,60,0.1)";
    if(vertical)ctx.fillRect(W-62,8,52,52);else ctx.fillRect(8,8,52,42);
    ctx.fillStyle="rgba(160,40,40,0.4)"; ctx.font="bold 9px sans-serif"; ctx.textAlign="center";
    if(vertical){ctx.fillText("始",W-36,30);ctx.fillText("↓",W-36,46);}
    else{ctx.fillText("始",34,22);ctx.fillText("→",34,36);}
  },[vertical,canvasRef,W,H]);
  useEffect(()=>{init();},[init]);
  const getP=(e)=>{
    const cv=canvasRef.current,r=cv.getBoundingClientRect();
    const src=e.touches?e.touches[0]:e;
    return{x:(src.clientX-r.left)*(cv.width/r.width),y:(src.clientY-r.top)*(cv.height/r.height)};
  };
  const onD=(e)=>{e.preventDefault();drawing.current=true;last.current=getP(e);};
  const onM=(e)=>{e.preventDefault();if(!drawing.current)return;const p=getP(e),ctx=canvasRef.current.getContext("2d");
    ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);
    ctx.strokeStyle="#0E0820";ctx.lineWidth=2.6;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();last.current=p;};
  const onU=(e)=>{e.preventDefault();drawing.current=false;};
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,width:"100%"}}>
      <p style={{margin:0,color:GOLDL,fontSize:14,fontWeight:700}}>{label}</p>
      <p style={{margin:0,color:MUTED,fontSize:11,textAlign:"center",lineHeight:1.6,whiteSpace:"pre-line"}}>{hint}</p>
      <div style={{border:`1px solid ${BORD2}`,borderRadius:6,overflow:"hidden",boxShadow:`0 0 28px rgba(201,168,76,0.12)`,width:"100%",maxWidth:W}}>
        <canvas ref={canvasRef} width={W} height={H}
          style={{display:"block",cursor:"crosshair",touchAction:"none",width:"100%",height:"auto"}}
          onMouseDown={onD} onMouseMove={onM} onMouseUp={onU} onMouseLeave={onU}
          onTouchStart={onD} onTouchMove={onM} onTouchEnd={onU}/>
      </div>
      <button onClick={init} style={{background:"transparent",border:`1px solid ${BORD}`,color:MUTED,padding:"5px 24px",borderRadius:4,cursor:"pointer",fontSize:12}}>クリア</button>
    </div>
  );
}

/* ── UI Helpers ── */
function RCard({title,accent=GOLD,children}){
  return(
    <div style={{background:SURF2,border:`1px solid ${BORD}`,borderLeft:`3px solid ${accent}`,borderRadius:8,padding:"18px 20px",marginBottom:14}}>
      <h3 style={{margin:"0 0 14px",color:accent,fontSize:13,fontWeight:700,letterSpacing:"0.08em"}}>{title}</h3>
      {children}
    </div>
  );
}
function RF({label,value}){
  if(!value)return null;
  return(
    <div style={{marginBottom:11}}>
      <p style={{margin:"0 0 4px",color:GOLD,fontSize:10,fontWeight:700,letterSpacing:"0.15em"}}>{label}</p>
      <p style={{margin:0,color:TEXT,fontSize:13,lineHeight:1.9}}>{value}</p>
    </div>
  );
}

const INP={background:SURF,border:`1px solid ${BORD}`,borderRadius:6,color:TEXT,padding:"10px 14px",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box"};
const BTN_P={background:`linear-gradient(135deg, ${GOLD}, #8B6020)`,border:"none",color:"#000",padding:"13px 44px",borderRadius:6,fontSize:15,fontWeight:700,cursor:"pointer",letterSpacing:"0.05em",boxShadow:`0 4px 20px rgba(201,168,76,0.35)`};
const BTN_S={background:"transparent",border:`1px solid ${BORD}`,color:MUTED,padding:"12px 28px",borderRadius:6,fontSize:13,cursor:"pointer"};
const BTN_O={background:"transparent",border:`1px solid ${GOLD}`,color:GOLD,padding:"11px 28px",borderRadius:6,fontSize:13,cursor:"pointer"};

function StepBar({current}){
  const steps=["基本情報","筆跡入力","初回鑑定","詳細選択","詳細鑑定"];
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"14px 20px"}}>
      {steps.map((label,i)=>{
        const n=i+1,done=current>n,active=current===n;
        return(
          <div key={n} style={{display:"flex",alignItems:"center"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:active?GOLD:(done?GOLDD:"transparent"),border:active?"none":(done?`1px solid ${GOLDD}`:`1px solid ${BORD}`),color:active?"#000":(done?GOLD:MUTED)}}>{done?"✓":n}</div>
              <span style={{fontSize:10,color:active?GOLDL:MUTED,whiteSpace:"nowrap"}}>{label}</span>
            </div>
            {i<4&&<div style={{width:28,height:1,background:current>n?GOLDD:BORD,margin:"0 4px",marginBottom:18}}/>}
          </div>
        );
      })}
    </div>
  );
}

function LoadingOverlay({message}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(6,4,15,0.9)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:1000}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:32,color:GOLD,letterSpacing:"0.5em",animation:"pulse 2s ease-in-out infinite"}}>✦ ✦ ✦</div>
        <p style={{color:GOLDL,fontSize:16,fontWeight:700,marginTop:22,letterSpacing:"0.15em"}}>{message}</p>
        <p style={{color:MUTED,fontSize:12,marginTop:8}}>しばらくお待ちください…</p>
      </div>
    </div>
  );
}

function Toast({msg,onClose}){
  useEffect(()=>{const t=setTimeout(onClose,5000);return()=>clearTimeout(t);},[onClose]);
  return(
    <div style={{position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",background:CARD,border:`1px solid ${GOLD}`,borderRadius:8,padding:"12px 28px",color:GOLDL,fontSize:13,zIndex:2000,textAlign:"center",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",maxWidth:380,lineHeight:1.6}}>
      {msg}
    </div>
  );
}

/* ── Print HTML builder ── */
function buildPrintHTML({form,initR,detailR,tateUrl,yokoUrl,dateStr}){
  const total=initR?(detailR?4:3):1;
  const ps=["width:210mm","min-height:297mm","padding:18mm 16mm","background:white","color:#1A1030","page-break-after:always","box-sizing:border-box","display:flex","flex-direction:column","font-family:'Noto Serif JP',serif"].join(";");
  const h2s="font-size:14px;color:#7A5010;border-left:3px solid #C9A84C;padding-left:10px;margin-bottom:14px;font-weight:700";
  const pf=(l,v)=>!v?"":`<div style="margin-bottom:11px"><p style="margin:0 0 3px;font-size:10px;font-weight:700;color:#7A5010;letter-spacing:.1em">${l}</p><p style="margin:0;font-size:12px;line-height:1.9;color:#1A1030">${v}</p></div>`;
  const ft=(n)=>`<div style="margin-top:auto;padding-top:16px;border-top:.5px solid #E8E0D0;text-align:right;font-size:10px;color:#aaa">${n} / ${total}　天命筆相鑑定書</div>`;
  let pages="";
  if(initR){
    pages+=`<div style="${ps}">
      <div style="text-align:center;border-bottom:2px solid #C9A84C;padding-bottom:18px;margin-bottom:24px">
        <p style="font-size:10px;color:#888;letter-spacing:.2em;margin:0 0 6px">鑑定士：輪夢（りんむー）</p>
        <h1 style="font-size:24px;color:#1A1030;font-weight:700;letter-spacing:.12em;margin:0 0 10px">天命筆相　総合鑑定書</h1>
        <div style="display:inline-block;background:#F8F4EC;border:1px solid #C9A84C;border-radius:6px;padding:12px 36px">
          <p style="font-size:18px;font-weight:700;margin:0 0 4px">${form.nameKanji}（${form.nameReading}）様</p>
          <p style="font-size:11px;color:#666;margin:0">${form.year}年${form.month}月${form.day}日生　${form.gender}　｜　鑑定日：${dateStr}</p>
        </div>
      </div>
      <h2 style="${h2s};margin-top:0">四柱推命による鑑定</h2>
      ${pf("基本命式",initR.shichusuimei?.kihon)}${pf("性格・気質",initR.shichusuimei?.seikaku)}${pf("現在の運気の流れ",initR.shichusuimei?.genki)}
      <div style="display:flex;gap:20px"><div style="flex:1">${pf("強み・才能",initR.shichusuimei?.toku)}</div><div style="flex:1">${pf("課題・注意点",initR.shichusuimei?.kadai)}</div></div>
      <h2 style="${h2s};margin-top:20px">姓名判断による鑑定</h2>
      ${pf("名前の意味と運命",initR.seimeiHandan?.meimei)}${pf("各格の解説（天格・地格・人格・外格・総格）",initR.seimeiHandan?.kaku)}${pf("人生の方向性",initR.seimeiHandan?.unmei)}
      ${ft(1)}</div>`;

    pages+=`<div style="${ps}">
      <h2 style="font-size:18px;color:#1A1030;text-align:center;border-bottom:1px solid #C9A84C;padding-bottom:12px;margin-bottom:20px;font-weight:700">天命筆相による鑑定</h2>
      <div style="display:flex;gap:20px;margin-bottom:20px">
        <div style="flex:1;text-align:center"><p style="font-size:11px;color:#7A5010;font-weight:700;margin:0 0 6px">縦書き手書き文字</p>${tateUrl?`<img src="${tateUrl}" alt="縦書き" style="max-width:100%;max-height:155px;border:1px solid #E0D8C0;border-radius:4px">`:""}</div>
        <div style="flex:1;text-align:center"><p style="font-size:11px;color:#7A5010;font-weight:700;margin:0 0 6px">横書き手書き文字</p>${yokoUrl?`<img src="${yokoUrl}" alt="横書き" style="max-width:100%;max-height:155px;border:1px solid #E0D8C0;border-radius:4px">`:""}</div>
      </div>
      ${pf("筆跡全体の印象",initR.tenmeiHissou?.zentai)}${pf("縦書きから読む特徴と心理",initR.tenmeiHissou?.tategaki)}${pf("横書きから読む特徴と心理",initR.tenmeiHissou?.yokogaki)}${pf("現在の心理状態・内面の動き",initR.tenmeiHissou?.shinri)}${pf("潜在的才能・隠れた本質",initR.tenmeiHissou?.sensei)}
      <div style="background:#F8F4EC;border:1px solid #C9A84C;border-radius:8px;padding:20px;margin-top:14px;text-align:center">
        <p style="font-size:10px;color:#7A5010;font-weight:700;letter-spacing:.15em;margin:0 0 12px">三法統合 ─ 総合メッセージ</p>
        <p style="font-size:13px;line-height:2;color:#1A1030;margin:0">${initR.overall}</p>
      </div>
      ${ft(2)}</div>`;
  }
  if(detailR){
    const rows=(detailR.categories||[]).map((c,i,a)=>`
      <div style="margin-bottom:18px;padding-bottom:16px;border-bottom:${i<a.length-1?".5px solid #E0D8C0":"none"}">
        <h3 style="font-size:13px;color:#7A5010;margin:0 0 8px;font-weight:700">${c.name}　▷　${c.sub}</h3>
        ${pf("鑑定",c.reading)}<div style="display:flex;gap:16px"><div style="flex:2">${pf("アドバイス",c.advice)}</div><div style="flex:1">${pf("重要な時期",c.timing)}</div><div style="flex:1">${pf("ラッキーポイント",c.lucky)}</div></div>
      </div>`).join("");
    pages+=`<div style="${ps}">
      <h2 style="font-size:18px;color:#1A1030;text-align:center;border-bottom:1px solid #C9A84C;padding-bottom:12px;margin-bottom:20px;font-weight:700">詳細鑑定</h2>
      ${rows}
      ${detailR.freeReading?`<div style="margin-top:16px;padding:14px;background:#F8F4EC;border-radius:6px">${pf("お悩みへの鑑定回答",detailR.freeReading)}</div>`:""}
      ${ft(3)}</div>`;
  }
  if(initR){
    pages+=`<div style="${ps.replace("page-break-after:always","page-break-after:auto")}">
      <div style="flex:1;display:flex;align-items:center;justify-content:center">
        <div style="background:#F8F4EC;border:2px solid #C9A84C;border-radius:12px;padding:36px 48px;max-width:460px;text-align:center">
          <p style="font-size:10px;color:#7A5010;font-weight:700;letter-spacing:.25em;margin:0 0 8px">— 命 盤 の 余 韻 —</p>
          <div style="width:40px;height:1px;background:#C9A84C;margin:0 auto 20px"></div>
          <p style="font-size:13px;line-height:2.1;color:#1A1030;margin:0 0 20px">${detailR?.final||initR?.overall}</p>
        </div>
      </div>
      <div style="border-top:1px solid #C9A84C;padding-top:18px;margin-top:20px;display:flex;justify-content:space-between;align-items:flex-end">
        <div><p style="font-size:10px;color:#aaa;margin:0 0 2px">System developed by RingMoo（輪夢）</p><p style="font-size:9px;color:#ccc;margin:0">天命筆相は輪夢が開発した独自の筆跡鑑定手法です</p></div>
        <div style="text-align:right"><p style="font-size:11px;color:#888;margin:0 0 4px">鑑定日：${dateStr}</p><p style="font-size:16px;font-weight:700;color:#1A1030;margin:0 0 2px">鑑定士　輪夢（りんむー）</p></div>
      </div>
      <div style="text-align:center;padding-top:12px;font-size:10px;color:#ccc">${total} / ${total}　天命筆相鑑定書</div>
    </div>`;
  }
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>天命筆相鑑定書 - ${form.nameKanji}様</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Noto Serif JP',serif}
@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}@page{size:A4;margin:0}}</style>
</head><body>${pages}</body></html>`;
}

function openPrintWindow(html){
  const w=window.open("","_blank","width=900,height=700");
  if(!w)return false;
  w.document.open(); w.document.write(html); w.document.close();
  w.onload=()=>{w.focus();w.print();};
  setTimeout(()=>{try{w.focus();w.print();}catch(e){}},1400);
  return true;
}

/* ══ MAIN ══ */
export default function TenmeiHissouApp(){
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({nameKanji:"",nameReading:"",year:"",month:"",day:"",hour:"",birthplace:"",gender:""});
  const tateRef=useRef(null); const yokoRef=useRef(null);
  const [tateUrl,setTateUrl]=useState(""); const [yokoUrl,setYokoUrl]=useState("");
  const [writeStep,setWriteStep]=useState(1); // 1=縦書き 2=横書き
  const [initR,setInitR]=useState(null);
  const [selCats,setSelCats]=useState([]); const [freeText,setFreeText]=useState("");
  const [detailR,setDetailR]=useState(null);
  const [loading,setLoading]=useState(false); const [loadMsg,setLoadMsg]=useState("");
  const [err,setErr]=useState(""); const [toast,setToast]=useState("");

  const now=new Date();
  const dateStr=`${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
  const ff=(k)=>({value:form[k],onChange:(e)=>setForm(p=>({...p,[k]:e.target.value}))});

  const resetAll=()=>{
    setStep(1);setForm({nameKanji:"",nameReading:"",year:"",month:"",day:"",hour:"",birthplace:"",gender:""});
    setInitR(null);setDetailR(null);setSelCats([]);setFreeText("");setErr("");setTateUrl("");setYokoUrl("");setWriteStep(1);
  };

  const doInit=async()=>{
    if(!form.nameKanji||!form.year||!form.month||!form.day){setErr("お名前（漢字）と生年月日は必須項目です");return;}
    setErr("");setLoading(true);setLoadMsg("鑑定中");
    try{
      const ti=tateRef.current.toDataURL("image/png");
      const yi=yokoRef.current.toDataURL("image/png");
      setTateUrl(ti);setYokoUrl(yi);
      const infoText=`【鑑定対象者】\n名前（漢字）：${form.nameKanji}\n名前（読み）：${form.nameReading||"未記入"}\n生年月日：${form.year}年${form.month}月${form.day}日${form.hour?`（${form.hour}時台生まれ）`:""}\n出生地：${form.birthplace||"不明"}\n性別：${form.gender||"未記入"}\n鑑定日：${dateStr}（時期・タイミングの起点として使用してください）\n\n以下の画像は手書き文字です。天命筆相の手法で分析してください。`;

const raw = await callClaude(SYS_INIT, [{
  role: "user",
  content: [
    { type: "text", text: infoText },
    { type: "text", text: "【縦書き手書き文字】" },
    { type: "image", source: { type: "base64", media_type: "image/png", data: ti.split(",")[1] } },
    { type: "text", text: "【横書き手書き文字】" },
    { type: "image", source: { type: "base64", media_type: "image/png", data: yi.split(",")[1] } },
    { type: "text", text: "上記をもとに鑑定書を作成してください。" },
  ]
}]);

setInitR(raw);
setStep(3);
    }catch(e){setErr(e.message);}finally{setLoading(false);}
  };

  const doDetail=async()=>{
    if(selCats.length===0){setErr("鑑定を希望する項目を最低1つ選択してください");return;}
    setErr("");setLoading(true);setLoadMsg("鑑定中");
    try{
      const catList=selCats.map(s=>{const cat=CATS.find(c=>c.id===s.catId);return`・${cat.label} ＞ ${cat.subs[s.subIdx]}`;}).join("\n");
      const userText=`【鑑定対象者】${form.nameKanji}（${form.nameReading}）、${form.year}年${form.month}月${form.day}日生、${form.gender||"性別未記入"}\n鑑定日：${dateStr}（時期・タイミングの起点として使用してください）\n\n【初回鑑定の要点】\n四柱推命：${initR?.shichusuimei?.seikaku}\n現在の運気：${initR?.shichusuimei?.genki}\n姓名判断：${initR?.seimeiHandan?.unmei}\n天命筆相（心理）：${initR?.tenmeiHissou?.shinri}\n総合メッセージ：${initR?.overall}\n\n【詳細鑑定ご希望項目】\n${catList}\n\n【お悩み・自由記入】\n${freeText||"（なし）"}`;
      const raw=await callClaude(SYS_DETAIL,[{role:"user",content:userText}]);
      const parsed=parseJSON(raw);
      if(!parsed)throw new Error("詳細鑑定の解析に失敗しました。もう一度お試しください。");
      setDetailR(parsed);setStep(5);
    }catch(e){setErr(e.message);}finally{setLoading(false);}
  };

  const toggleCat=(catId,subIdx)=>{
    setSelCats(prev=>{
      const idx=prev.findIndex(s=>s.catId===catId&&s.subIdx===subIdx);
      if(idx>=0)return prev.filter((_,i)=>i!==idx);
      if(prev.length>=MAX_CATS)return prev;
      return[...prev,{catId,subIdx}];
    });
  };

  const getHtml=()=>buildPrintHTML({form,initR,detailR,tateUrl,yokoUrl,dateStr});

  const doPrint=()=>{
    if(!openPrintWindow(getHtml()))setToast("ポップアップがブロックされました。ブラウザの設定を確認してください。");
  };
  const doPDF=()=>{
    if(!openPrintWindow(getHtml()))setToast("ポップアップがブロックされました。ブラウザの設定を確認してください。");
    else setToast("印刷ダイアログが開きます。\n送信先で「PDFとして保存」を選択してください。");
  };

  const PrintBtns=()=>(
    <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
      <button onClick={doPrint} style={BTN_O}>🖨 印刷する</button>
      <button onClick={doPDF}   style={BTN_O}>📄 PDFで保存</button>
    </div>
  );

  const Err=()=>err?(<div style={{background:"rgba(200,50,50,0.08)",border:"1px solid rgba(200,50,50,0.25)",borderRadius:6,padding:"10px 16px",marginBottom:18,color:"#F09090",fontSize:13}}>{err}</div>):null;

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;500;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Noto Serif JP',serif;background:${BG};color:${TEXT}}
        input,select,textarea,button{font-family:'Noto Serif JP',serif}
        input:focus,select:focus,textarea:focus{border-color:${GOLD}!important;outline:none}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${SURF}}::-webkit-scrollbar-thumb{background:${BORD2};border-radius:2px}
        @keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn 0.45s ease forwards}
        button:hover{opacity:0.82;transition:opacity 0.15s}
      `}</style>

      {loading&&<LoadingOverlay message={loadMsg}/>}
      {toast&&<Toast msg={toast} onClose={()=>setToast("")}/>}

      <div style={{minHeight:"100vh",background:BG}}>

        {/* Header */}
        <div style={{background:`linear-gradient(180deg,${SURF} 0%,${BG} 100%)`,borderBottom:`1px solid ${BORD}`,padding:"20px 24px",textAlign:"center",position:"relative"}}>
          <div style={{position:"absolute",top:20,right:20,fontSize:11,color:MUTED}}>鑑定士：輪夢（りんむー）</div>

          {step>1&&(
            <button onClick={resetAll} style={{position:"absolute",top:18,left:20,background:"transparent",border:`1px solid ${BORD}`,color:MUTED,padding:"6px 14px",borderRadius:4,fontSize:11,cursor:"pointer",letterSpacing:"0.05em"}}>
              ← 最初に戻る
            </button>
          )}

          <p style={{color:MUTED,fontSize:10,letterSpacing:"0.35em",marginBottom:8}}>✦ 天 命 筆 相 占 い ✦</p>
          <h1 style={{fontSize:24,fontWeight:700,color:GOLDL,letterSpacing:"0.15em"}}>天命筆相 総合鑑定</h1>
        </div>

        <StepBar current={step}/>

        <div style={{maxWidth:740,margin:"0 auto",padding:"8px 20px 80px"}}>
          <Err/>

          {/* ─ STEP 1 ─ */}
          {step===1&&(
            <div className="fade-in">
              <h2 style={{fontSize:18,color:GOLDL,fontWeight:700,textAlign:"center",letterSpacing:"0.1em",marginBottom:28}}>基本情報のご入力</h2>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
                <div>
                  <label style={{display:"block",color:GOLDL,fontSize:12,marginBottom:6,fontWeight:600}}>お名前（漢字）<span style={{color:"#F08080"}}>*</span></label>
                  <input {...ff("nameKanji")} placeholder="例：山田 花子" style={INP}/>
                </div>
                <div>
                  <label style={{display:"block",color:GOLDL,fontSize:12,marginBottom:6,fontWeight:600}}>お名前（読み）</label>
                  <input {...ff("nameReading")} placeholder="例：やまだ はなこ" style={INP}/>
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{display:"block",color:GOLDL,fontSize:12,marginBottom:6,fontWeight:600}}>生年月日<span style={{color:"#F08080"}}>*</span></label>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10}}>
                  <input {...ff("year")} type="number" placeholder="西暦（例：1990）" style={INP}/>
                  <input {...ff("month")} type="number" placeholder="月" min="1" max="12" style={INP}/>
                  <input {...ff("day")} type="number" placeholder="日" min="1" max="31" style={INP}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:32}}>
                <div>
                  <label style={{display:"block",color:GOLDL,fontSize:12,marginBottom:6,fontWeight:600}}>出生時刻（任意）</label>
                  <select {...ff("hour")} style={INP}>
                    <option value="">不明</option>
                    {Array.from({length:24},(_,i)=><option key={i} value={i}>{i}時台</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:"block",color:GOLDL,fontSize:12,marginBottom:6,fontWeight:600}}>出生地（任意）</label>
                  <input {...ff("birthplace")} placeholder="例：大阪府" style={INP}/>
                </div>
                <div>
                  <label style={{display:"block",color:GOLDL,fontSize:12,marginBottom:6,fontWeight:600}}>性別</label>
                  <select {...ff("gender")} style={INP}>
                    <option value="">選択してください</option>
                    <option value="男性">男性</option>
                    <option value="女性">女性</option>
                    <option value="その他">その他</option>
                    <option value="無回答">無回答</option>
                  </select>
                </div>
              </div>
              <div style={{textAlign:"center"}}>
                <button onClick={()=>{setErr("");setStep(2);}} style={BTN_P}>次へ　天命筆相の入力へ →</button>
              </div>
            </div>
          )}

          {/* ─ STEP 2: 縦書き・横書き（両キャンバス常時マウント、表示切替） ─ */}
          {step===2&&(
            <div className="fade-in">

              {/* 進捗インジケーター */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:24}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:28,height:28,borderRadius:"50%",
                    background: writeStep===1 ? GOLD : GOLDD,
                    border: writeStep===2 ? `1px solid ${GOLD}` : "none",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,
                    color: writeStep===1 ? "#000" : GOLD}}>
                    {writeStep===2 ? "✓" : "1"}
                  </div>
                  <span style={{fontSize:12,color: writeStep===1 ? GOLDL : MUTED, fontWeight: writeStep===1 ? 700 : 400}}>縦書き</span>
                </div>
                <div style={{width:40,height:1,background: writeStep===2 ? GOLD : BORD}}/>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{width:28,height:28,borderRadius:"50%",
                    background: writeStep===2 ? GOLD : "transparent",
                    border: writeStep===1 ? `1px solid ${BORD}` : "none",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,
                    color: writeStep===2 ? "#000" : MUTED}}>2</div>
                  <span style={{fontSize:12,color: writeStep===2 ? GOLDL : MUTED, fontWeight: writeStep===2 ? 700 : 400}}>横書き</span>
                </div>
              </div>

              {/* ── 縦書きパネル（常時マウント、writeStep!==1で非表示） ── */}
              <div style={{display: writeStep===1 ? "block" : "none"}}>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <h2 style={{fontSize:18,color:GOLDL,fontWeight:700,letterSpacing:"0.1em"}}>① 縦書きで書いてください</h2>
                  <p style={{color:MUTED2,fontSize:12,marginTop:8,lineHeight:1.8}}>
                    お名前（漢字）を縦書きでお書きください。<br/>右の列の上から、自然な字でお書きください。
                  </p>
                </div>
                <div style={{display:"flex",justifyContent:"center",padding:"0 12px"}}>
                  <DrawingCanvas label="" hint={"右上の枠が始点の目安 ↓"} vertical={true} canvasRef={tateRef} cw={270} ch={390}/>
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:28}}>
                  <button onClick={()=>setStep(1)} style={BTN_S}>← 戻る</button>
                  <button onClick={()=>{setWriteStep(2);window.scrollTo(0,0);}} style={BTN_P}>横書きへ進む →</button>
                </div>
              </div>

              {/* ── 横書きパネル（常時マウント、writeStep!==2で非表示） ── */}
              <div style={{display: writeStep===2 ? "block" : "none"}}>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <h2 style={{fontSize:18,color:GOLDL,fontWeight:700,letterSpacing:"0.1em"}}>② 横書きで書いてください</h2>
                  <p style={{color:MUTED2,fontSize:12,marginTop:8,lineHeight:1.8}}>
                    お名前（漢字）を横書きでお書きください。<br/>左上から右へ、自然な字でお書きください。
                  </p>
                </div>
                <div style={{display:"flex",justifyContent:"center",padding:"0 12px"}}>
                  <DrawingCanvas label="" hint={"左上の枠が始点の目安 →"} vertical={false} canvasRef={yokoRef} cw={360} ch={210}/>
                </div>
                <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:28}}>
                  <button onClick={()=>setWriteStep(1)} style={BTN_S}>← 縦書きに戻る</button>
                  <button onClick={doInit} style={BTN_P}>鑑定を開始する ✦</button>
                </div>
              </div>

            </div>
          )}

          {/* ─ STEP 3 ─ */}
          {step===3&&initR&&(
            <div className="fade-in">
              <div style={{textAlign:"center",marginBottom:28}}>
                <p style={{color:MUTED,fontSize:10,letterSpacing:"0.25em",marginBottom:8}}>初回鑑定結果</p>
                <h2 style={{fontSize:20,color:GOLDL,fontWeight:700}}>{form.nameKanji}（{form.nameReading}）様</h2>
                <p style={{color:MUTED2,fontSize:12,marginTop:6}}>{form.year}年{form.month}月{form.day}日生　{form.gender}</p>
              </div>
              <RCard title="✦ 四柱推命による鑑定" accent={GOLD}>
                <RF label="基本命式" value={initR.shichusuimei?.kihon}/>
                <RF label="性格・気質" value={initR.shichusuimei?.seikaku}/>
                <RF label="現在の運気の流れ" value={initR.shichusuimei?.genki}/>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <RF label="強み・才能" value={initR.shichusuimei?.toku}/>
                  <RF label="課題・注意点" value={initR.shichusuimei?.kadai}/>
                </div>
              </RCard>
              <RCard title="◈ 姓名判断による鑑定" accent="#F0C040">
                <RF label="名前の意味と運命" value={initR.seimeiHandan?.meimei}/>
                <RF label="各格の解説（天格・地格・人格・外格・総格）" value={initR.seimeiHandan?.kaku}/>
                <RF label="人生の方向性" value={initR.seimeiHandan?.unmei}/>
              </RCard>
              <RCard title="◇ 天命筆相による鑑定" accent="#B090FF">
                <RF label="筆跡全体の印象" value={initR.tenmeiHissou?.zentai}/>
                <RF label="縦書きから読む特徴と心理" value={initR.tenmeiHissou?.tategaki}/>
                <RF label="横書きから読む特徴と心理" value={initR.tenmeiHissou?.yokogaki}/>
                <RF label="現在の心理状態・内面の動き" value={initR.tenmeiHissou?.shinri}/>
                <RF label="潜在的才能・隠れた本質" value={initR.tenmeiHissou?.sensei}/>
              </RCard>
              <div style={{background:`linear-gradient(135deg,${SURF2},${SURF})`,border:`1px solid ${GOLD}`,borderRadius:10,padding:"24px",textAlign:"center",marginBottom:24}}>
                <p style={{color:GOLD,fontSize:10,fontWeight:700,letterSpacing:"0.2em",marginBottom:14}}>三法統合 ─ 総合メッセージ</p>
                <p style={{color:TEXT,fontSize:14,lineHeight:2}}>{initR.overall}</p>
              </div>
              <div style={{display:"flex",justifyContent:"center"}}>
                <button onClick={()=>{setErr("");setStep(4);}} style={BTN_P}>詳細鑑定へ進む →</button>
              </div>
            </div>
          )}

          {/* ─ STEP 4 ─ */}
          {step===4&&(
            <div className="fade-in">
              <div style={{textAlign:"center",marginBottom:24}}>
                <h2 style={{fontSize:18,color:GOLDL,fontWeight:700,letterSpacing:"0.1em"}}>詳細鑑定 ─ 項目選択</h2>
                <p style={{color:MUTED2,fontSize:12,marginTop:8,lineHeight:1.8}}>鑑定を希望する項目を選択してください（最大 <span style={{color:GOLD,fontWeight:700}}>{MAX_CATS}</span> 項目）</p>
                <div style={{display:"inline-flex",alignItems:"center",gap:10,marginTop:10,background:SURF2,border:`1px solid ${BORD}`,borderRadius:6,padding:"8px 20px"}}>
                  <span style={{color:MUTED2,fontSize:12}}>選択中：</span>
                  <span style={{color:selCats.length>=MAX_CATS?"#F09090":GOLD,fontSize:20,fontWeight:700}}>{selCats.length}</span>
                  <span style={{color:MUTED,fontSize:12}}>/ {MAX_CATS}</span>
                  {selCats.length>=MAX_CATS&&<span style={{color:"#F09090",fontSize:11}}>　上限に達しました</span>}
                </div>
              </div>
              <div style={{display:"grid",gap:12,marginBottom:24}}>
                {CATS.map(cat=>(
                  <div key={cat.id} style={{background:SURF2,border:`1px solid ${BORD}`,borderRadius:8,overflow:"hidden"}}>
                    <div style={{padding:"11px 16px",borderBottom:`1px solid ${BORD}`,display:"flex",alignItems:"center",gap:10,background:CARD}}>
                      <span style={{color:cat.color,fontSize:16}}>{cat.icon}</span>
                      <span style={{color:GOLDL,fontSize:14,fontWeight:700}}>{cat.label}</span>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:8,padding:"12px 16px"}}>
                      {cat.subs.map((sub,si)=>{
                        const isSel=selCats.some(s=>s.catId===cat.id&&s.subIdx===si);
                        const isDisabled=!isSel&&selCats.length>=MAX_CATS;
                        return(
                          <button key={si} onClick={()=>!isDisabled&&toggleCat(cat.id,si)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,cursor:isDisabled?"not-allowed":"pointer",background:isSel?cat.color:"transparent",border:`1px solid ${isSel?cat.color:BORD}`,color:isSel?"#000":(isDisabled?MUTED:MUTED2),fontWeight:isSel?700:400,opacity:isDisabled?0.35:1,transition:"all 0.15s"}}>{sub}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:24}}>
                <label style={{display:"block",color:GOLDL,fontSize:13,marginBottom:8,fontWeight:600}}>お悩み・ご相談（自由記入）</label>
                <textarea value={freeText} onChange={e=>setFreeText(e.target.value)} placeholder="現在のお悩みやご状況を自由にお書きください。初回鑑定の結果と合わせて、より深い鑑定を行います。" rows={4} style={{...INP,resize:"vertical",lineHeight:1.9}}/>
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:16}}>
                <button onClick={()=>setStep(3)} style={BTN_S}>← 戻る</button>
                <button onClick={doDetail} disabled={selCats.length===0} style={{...BTN_P,opacity:selCats.length===0?0.5:1,cursor:selCats.length===0?"not-allowed":"pointer"}}>
                  詳細鑑定を開始する（{selCats.length}項目）✦
                </button>
              </div>
            </div>
          )}

          {/* ─ STEP 5 ─ */}
          {step===5&&detailR&&(
            <div className="fade-in">
              <div style={{textAlign:"center",marginBottom:28}}>
                <p style={{color:MUTED,fontSize:10,letterSpacing:"0.25em",marginBottom:8}}>詳細鑑定結果</p>
                <h2 style={{fontSize:20,color:GOLDL,fontWeight:700}}>{form.nameKanji}（{form.nameReading}）様</h2>
              </div>
              {(detailR.categories||[]).map((cat,i)=>{
                const catInfo=CATS.find(c=>c.label===cat.name);
                return(
                  <RCard key={i} title={`${cat.name}　▷　${cat.sub}`} accent={catInfo?.color||GOLD}>
                    <RF label="鑑定" value={cat.reading}/>
                    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
                      <RF label="アドバイス" value={cat.advice}/>
                      <div><RF label="重要な時期・タイミング" value={cat.timing}/><RF label="ラッキーポイント" value={cat.lucky}/></div>
                    </div>
                  </RCard>
                );
              })}
              {detailR.freeReading&&(
                <RCard title="✦ お悩みへの鑑定回答" accent="#E890A0">
                  <p style={{color:TEXT,fontSize:13,lineHeight:1.9}}>{detailR.freeReading}</p>
                </RCard>
              )}
              {/* 命盤の余韻 */}
              <div style={{background:`linear-gradient(135deg,${SURF2},${SURF})`,border:`1px solid ${GOLD}`,borderRadius:10,padding:"28px 24px",textAlign:"center",marginBottom:28}}>
                <p style={{color:MUTED,fontSize:9,fontWeight:700,letterSpacing:"0.4em",marginBottom:6}}>— 命 盤 の 余 韻 —</p>
                <div style={{width:40,height:1,background:GOLD,margin:"0 auto 18px"}}></div>
                <p style={{color:TEXT,fontSize:14,lineHeight:2}}>{detailR.final}</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                <PrintBtns/>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
