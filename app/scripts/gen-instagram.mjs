// Generates the Instagram carousel slides (1080x1350) from the VLTG brand system.
// Run from app/:  node scripts/gen-instagram.mjs   → writes ../instagram/<deck>/NN.png
//
// Colour rhythm, so the three posts don't read as one monotonous block:
//   Post 1  navy cover  · cream middles · navy CTA
//   Post 2  cream cover · navy middles  · cream CTA
//   Post 3  navy cover  · cream middles · navy CTA   (cover styled differently to P1)
import { ImageResponse } from "next/og.js";
import React from "react";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const h = React.createElement;
const CREAM="#F4F1EC", NAVY="#1E3A5F", INK="#111827", AMBER="#F59E0B", AMBER_L="#fbbf24",
      GRAY="#4b5563", SLATE="#cbd5e1", STEEL="#4a6b96";
const W=1080, H=1350, PAD=90;

const [reg, bold] = await Promise.all([
  readFile("src/app/_og/WorkSans-400.ttf"),
  readFile("src/app/_og/WorkSans-700.ttf"),
]);

const V="M548.39 720.06C548.56 741.07 548.74 762.08 548.92 783.1C545.79 801.98 548.44 823.76 547.8 843.14C517.66 843.26 487.51 843.38 457.36 843.5C387.23 646.17 317.1 448.83 246.97 251.5C300.69 251.5 354.42 251.5 408.14 251.5C414.3 267.54 418.57 284.68 423.45 301.16C434.13 337.24 445.62 373.09 456.45 409.12C476.5 475.78 498.25 541.99 517.56 608.86C528.23 645.81 537.96 683.03 548.39 720.06Z";
const BOLT="M727 248.39C769.21 248.43 811.43 248.46 853.64 248.5C813.31 317.17 772.97 385.83 732.63 454.5C762.35 454.83 792.07 455.17 821.78 455.5C755.36 584.46 688.93 713.43 622.5 842.39C597.6 842.64 572.7 842.89 547.8 843.14C548.44 823.76 545.79 801.98 548.92 783.1C552.78 779.11 556.81 766.44 559.24 760.72C565.19 746.7 571.33 732.76 577.27 718.74C594.39 678.32 612.15 638.18 629.31 597.78C634.28 586.1 639.23 574.42 644.36 562.81C646.97 556.88 651.26 549.88 651.76 543.5C648.7 543.41 646.1 542.82 643.88 545.1C637.75 544.77 631.62 545.51 625.5 545.8C615.17 546.27 604.83 546.66 594.5 547.21C587.75 547.57 579.46 549.4 573.09 547.5C574.35 544.85 575.61 542.2 576.88 539.55C626.92 442.5 676.96 345.44 727 248.39Z";
const FACET="M727 248.39C676.96 345.44 626.92 442.5 576.88 539.55C618.07 442.53 659.27 345.52 700.47 248.5C709.31 248.46 718.16 248.43 727 248.39ZM548.92 783.1C548.74 762.08 548.56 741.07 548.39 720.06C580.22 661.74 612.05 603.42 643.88 545.1C646.1 542.82 648.7 543.41 651.76 543.5C651.26 549.88 646.97 556.88 644.36 562.81C639.23 574.42 634.28 586.1 629.31 597.78C612.15 638.18 594.39 678.32 577.27 718.74C571.33 732.76 565.19 746.7 559.24 760.72C556.81 766.44 552.78 779.11 548.92 783.1Z";

const b64 = s => `data:image/svg+xml;base64,${Buffer.from(s).toString("base64")}`;
const markURI = dark => b64(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="240 242 620 610"><path d="${V}" fill="${dark?CREAM:NAVY}"/><path d="${BOLT}" fill="${AMBER_L}"/><path d="${FACET}" fill="${AMBER}"/></svg>`);
const MARK_LIGHT = markURI(false), MARK_DARK = markURI(true);

// ── stanine curve ────────────────────────────────────────────────────────────
// Art only; the 1-9 labels are drawn in satori so they use Work Sans (resvg has
// no font when rasterising a nested SVG, so <text> in there vanishes).
const Z=[-1.75,-1.25,-0.75,-0.25,0.25,0.75,1.25,1.75];
const CW=900, BASE=330, PEAK=252, X0=26, X1=874, CH=345;
const xOf=z=>X0+((z+3)/6)*(X1-X0), yOf=z=>BASE-Math.exp(-z*z/2)*PEAK;
function curveURI(dark){
  const below  = dark ? STEEL : "#cbd5e1";
  const above  = dark ? CREAM : NAVY;
  const divide = dark ? NAVY  : CREAM;
  const base   = dark ? CREAM : INK;
  const p=(a,b)=>{let o=[`M ${xOf(a).toFixed(2)} ${BASE}`];for(let z=a;z<=b+1e-9;z+=0.02)o.push(`L ${xOf(z).toFixed(2)} ${yOf(z).toFixed(2)}`);o.push(`L ${xOf(b).toFixed(2)} ${BASE} Z`);return o.join(" ");};
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}">`;
  for(let i=0;i<9;i++){const lo=i===0?-3:Z[i-1],hi=i===8?3:Z[i],st=i+1;
    s+=`<path d="${p(lo,hi)}" fill="${st<4?below:st===4?AMBER:above}"/>`;}
  Z.forEach(z=>{s+=`<line x1="${xOf(z)}" x2="${xOf(z)}" y1="${yOf(z)}" y2="${BASE}" stroke="${divide}" stroke-width="2"/>`;});
  s+=`<line x1="${X0}" x2="${X1}" y1="${BASE}" y2="${BASE}" stroke="${base}" stroke-width="3"/></svg>`;
  return b64(s);
}
const CURVE_LIGHT = curveURI(false), CURVE_DARK = curveURI(true);
const BAND_LABELS = Array.from({length:9},(_,i)=>{
  const lo=i===0?-3:Z[i-1], hi=i===8?3:Z[i];
  return { n:i+1, x:xOf((lo+hi)/2) };
});

// ── themed building blocks ───────────────────────────────────────────────────
const eyebrow=(t,dark=false)=>h("div",{style:{display:"flex",fontSize:31,fontWeight:700,letterSpacing:6,color:dark?AMBER_L:NAVY}},t);
const head=(t,dark=false,size=76)=>h("div",{style:{display:"flex",fontSize:size,fontWeight:700,color:dark?CREAM:INK,lineHeight:1.1,marginTop:24,width:900}},t);
const body=(t,dark=false,size=41)=>h("div",{style:{display:"flex",fontSize:size,fontWeight:400,color:dark?SLATE:GRAY,lineHeight:1.44,marginTop:30,width:900}},t);
const hi=(t,size=74)=>h("div",{style:{display:"flex",alignSelf:"flex-start",fontSize:size,fontWeight:700,color:INK,background:AMBER,padding:"10px 22px",marginTop:20,lineHeight:1.14}},t);
const footer=dark=>h("div",{style:{display:"flex",alignItems:"center",gap:16}},
  h("img",{src:dark?MARK_DARK:MARK_LIGHT,width:52,height:52}),
  h("div",{style:{display:"flex",fontSize:29,fontWeight:700,letterSpacing:4,color:dark?SLATE:NAVY}},"VLTG.NET"));

// The text column needs an explicit width (900 content - 210 number - 26 gap),
// otherwise a long description overflows the canvas instead of wrapping.
const STAT_TEXT_W = 664;
const statRow=(n,label,sub,dark=false)=>h("div",{style:{display:"flex",alignItems:"center",gap:26,marginTop:34}},
  h("div",{style:{display:"flex",flexShrink:0,fontSize:118,fontWeight:700,color:dark?AMBER_L:NAVY,width:210}},n),
  h("div",{style:{display:"flex",flexDirection:"column",width:STAT_TEXT_W}},
    h("div",{style:{display:"flex",fontSize:45,fontWeight:700,color:dark?CREAM:INK,width:STAT_TEXT_W}},label),
    h("div",{style:{display:"flex",fontSize:33,fontWeight:400,color:dark?SLATE:GRAY,marginTop:8,lineHeight:1.3,width:STAT_TEXT_W}},sub)));

const curveBlock=(dark=false)=>h("div",{style:{display:"flex",position:"relative",width:900,height:415,marginTop:26}},
  h("img",{src:dark?CURVE_DARK:CURVE_LIGHT,width:900,height:CH,style:{position:"absolute",left:0,top:0}}),
  ...BAND_LABELS.map(l=>h("div",{style:{position:"absolute",left:l.x-32,top:CH+14,width:64,display:"flex",justifyContent:"center",fontSize:46,fontWeight:700,color:dark?CREAM:INK}},String(l.n))));

// content is vertically centred; the footer stays pinned to the bottom
const slide=(dark,content)=>h("div",{style:{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:dark?NAVY:CREAM,padding:PAD,fontFamily:"Work Sans"}},
  h("div",{style:{display:"flex",flexDirection:"column",flexGrow:1,justifyContent:"center"}},...content),
  footer(dark));

const cta=(dark,line,sub)=>h("div",{style:{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",background:dark?NAVY:CREAM,padding:PAD,fontFamily:"Work Sans"}},
  h("div",{style:{display:"flex",alignItems:"center",gap:24}},
    h("img",{src:dark?MARK_DARK:MARK_LIGHT,width:110,height:110}),
    h("div",{style:{display:"flex",fontSize:96,fontWeight:700,letterSpacing:4,color:dark?CREAM:INK}},"VLTG")),
  h("div",{style:{display:"flex",fontSize:58,fontWeight:700,color:dark?CREAM:INK,lineHeight:1.14,marginTop:46,width:900}},line),
  h("div",{style:{display:"flex",fontSize:38,fontWeight:400,color:dark?SLATE:GRAY,lineHeight:1.42,marginTop:26,width:900}},sub),
  h("div",{style:{display:"flex",alignItems:"center",gap:18,marginTop:60}},
    h("div",{style:{display:"flex",width:48,height:9,background:AMBER}}),
    h("div",{style:{display:"flex",fontSize:38,fontWeight:700,letterSpacing:5,color:dark?AMBER_L:NAVY}},"VLTG.NET")));

// ── covers ───────────────────────────────────────────────────────────────────
const swipe=(dark=true)=>h("div",{style:{display:"flex",fontSize:29,fontWeight:700,letterSpacing:6,color:dark?AMBER_L:NAVY}},"SWIPE");
const shell=(bg,kids,extra={})=>h("div",{style:{width:"100%",height:"100%",display:"flex",flexDirection:"column",background:bg,padding:PAD,fontFamily:"Work Sans",...extra}},...kids);
const mid=kids=>h("div",{style:{display:"flex",flexGrow:1,flexDirection:"column",justifyContent:"center"}},...kids);
const ghost=(dark,pos)=>h("img",{src:dark?MARK_DARK:MARK_LIGHT,width:820,height:820,style:{position:"absolute",opacity:dark?0.14:0.12,...pos}});
const markedLine=(lead,marked,dark)=>[
  h("div",{style:{display:"flex",fontSize:88,fontWeight:700,color:dark?CREAM:INK,lineHeight:1.08,width:900}},lead),
  h("div",{style:{display:"flex",alignSelf:"flex-start",fontSize:88,fontWeight:700,color:INK,background:AMBER,padding:"8px 22px",marginTop:16,lineHeight:1.08}},marked),
];

// P1: navy, ghost bleeding off the bottom-right.
const coverP1 = shell(NAVY,[
  ghost(true,{right:-230,bottom:-190}),
  h("img",{src:MARK_DARK,width:120,height:120}),
  mid(markedLine("What's on the","IBEW aptitude test",true)),
  swipe(true),
],{position:"relative",overflow:"hidden"});

// P2: cream inverse, same vocabulary so it still reads as a sibling. "score" is
// marked inline mid-sentence, the way the landing page highlights a phrase.
const p2Word=(t)=>h("div",{style:{display:"flex",fontSize:88,fontWeight:700,color:INK,lineHeight:1.08}},t);
const coverP2 = shell(CREAM,[
  ghost(false,{right:-230,bottom:-190}),
  h("img",{src:MARK_LIGHT,width:120,height:120}),
  mid([
    h("div",{style:{display:"flex",alignItems:"center",gap:14,width:900}},
      p2Word("What"),
      h("div",{style:{display:"flex",fontSize:88,fontWeight:700,color:INK,background:AMBER,padding:"8px 20px",lineHeight:1.08}},"score"),
      p2Word("do you"),
    ),
    h("div",{style:{display:"flex",fontSize:88,fontWeight:700,color:INK,lineHeight:1.08,marginTop:16,width:900}},"actually need?"),
  ]),
  swipe(false),
],{position:"relative",overflow:"hidden"});

// P3: navy like P1, but the ghost bleeds off the TOP-right and an amber rule
// sits above the headline, so the two navy covers don't look identical.
const coverP3 = shell(NAVY,[
  ghost(true,{right:-250,top:-260}),
  h("img",{src:MARK_DARK,width:120,height:120}),
  mid([
    h("div",{style:{display:"flex",width:160,height:14,background:AMBER,marginBottom:34}}),
    ...markedLine("You're probably not","bad at algebra.",true),
  ]),
  swipe(true),
],{position:"relative",overflow:"hidden"});

// ── decks ────────────────────────────────────────────────────────────────────
const decks = {
  "1-whats-on-the-test": [
    coverP1,
    slide(false,[eyebrow("THE STRUCTURE"),head("Two sections. 69 questions."),
      statRow("33","Algebra & functions","Order of operations, fractions, linear equations, graphs"),
      statRow("36","Reading comprehension","Main idea, detail, inference, vocabulary in context")]),
    slide(false,[eyebrow("THE CLOCK"),head("About 97 minutes, and the clock is the hard part."),
      statRow("46","minutes for math","33 questions"),
      statRow("51","minutes for reading","36 questions"),
      hi("That's ~85 seconds a question.",58)]),
    slide(false,[eyebrow("THE BIG MISCONCEPTION"),
      head("You don't need to know anything about electrical work."),
      body("It's an aptitude test, not a knowledge test. The math is ordinary high-school algebra and the passages are about everyday things. It's checking whether you can learn the trade, not whether you already know it.")]),
    cta(true,"Take the full 69-question practice test.","Free, self-paced, and you get your score the moment you finish."),
  ],
  "2-what-score-you-need": [
    coverP2,
    slide(true,[eyebrow("THE SCALE",true),head("Your result is a 1–9 stanine.",true),
      body("Not a percentage, and not a letter grade. A stanine is a normalised 1–9 score based on where you land relative to everyone else who sat the test.",true)]),
    slide(true,[eyebrow("WHERE THE BAR IS",true),head("4 qualifies. 5 is average.",true,70),curveBlock(true),
      body("Most locals want a 4 or better to move you to an interview. Higher scores move you up the list.",true,36)]),
    slide(true,[eyebrow("THE PART PEOPLE MISS",true),hi("70% correct is not a 7.",72),
      body("A stanine is your standing against everyone else, not the share of questions you got right. That's why comparing raw percentages with someone else tells you almost nothing.",true)]),
    cta(false,"See your estimated stanine the moment you finish.","Plus a percentile, a pace check against the real clock, and a study plan."),
  ],
  "3-fractions": [
    coverP3,
    slide(false,[eyebrow("QUESTION 1"),
      h("div",{style:{display:"flex",fontSize:112,fontWeight:700,color:INK,marginTop:40}},"3x + 12 = 27"),
      body("Solve for x. Most people get this one without much trouble.",false,40)]),
    slide(false,[eyebrow("QUESTION 2"),
      h("div",{style:{display:"flex",fontSize:94,fontWeight:700,color:INK,marginTop:40}},"(2/3)x + 1/2 = 5/6"),
      body("Same job: isolate x. This is where it tends to fall apart.",false,40)]),
    slide(false,[eyebrow("THE POINT"),hi("You're not bad at algebra.",66),hi("You're bad at fractions.",66),
      body("Both questions ask for the exact same move. The only thing that changed is the arithmetic underneath it. Those are different problems, and they take different amounts of time to fix.")]),
    cta(true,"That's the whole reason this exists.","The diagnostic finds the skill that's actually costing you points, instead of leaving you to guess."),
  ],
};

const FONTS = [
  {name:"Work Sans",data:reg,weight:400,style:"normal"},
  {name:"Work Sans",data:bold,weight:700,style:"normal"},
];

for (const [deck, slides] of Object.entries(decks)) {
  await mkdir(`../instagram/${deck}`, { recursive: true });
  for (let i=0;i<slides.length;i++){
    const res = new ImageResponse(slides[i], { width:W, height:H, fonts:FONTS });
    await writeFile(`../instagram/${deck}/${String(i+1).padStart(2,"0")}.png`, Buffer.from(await res.arrayBuffer()));
  }
  console.log("wrote", deck);
}

// The three covers together, for checking how the profile grid will read.
await mkdir("../instagram/cover-options", { recursive: true });
for (const [name, el] of Object.entries({ "post-1":coverP1, "post-2":coverP2, "post-3":coverP3 })) {
  const res = new ImageResponse(el, { width:W, height:H, fonts:FONTS });
  await writeFile(`../instagram/cover-options/${name}.png`, Buffer.from(await res.arrayBuffer()));
}
console.log("wrote cover set");
