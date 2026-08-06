import React from 'react';

const styles = `
  /* Character bob — whole group translateY only */
  @keyframes bob {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-7px); }
  }

  /*
    BAG PASS:
      0–10%   : bag held at cashier hand, slight tilt
      10–55%  : arc across the counter toward student hand
      55–75%  : pause at student hand
      75–82%  : fade out (student "takes" it)
      82–90%  : invisible, snap back to cashier position
      90–100% : fade back in at cashier hand
  */
  @keyframes bag-pass {
    0%   { transform: translateX(0px)  translateY(0px)  rotate(-5deg); opacity: 1; }
    10%  { transform: translateX(4px)  translateY(-8px) rotate(-5deg); opacity: 1; }
    55%  { transform: translateX(84px) translateY(-12px) rotate(6deg); opacity: 1; }
    70%  { transform: translateX(84px) translateY(0px)  rotate(0deg); opacity: 1; }
    78%  { transform: translateX(84px) translateY(0px)  rotate(0deg); opacity: 0; }
    82%  { transform: translateX(0px)  translateY(0px)  rotate(-5deg); opacity: 0; }
    100% { transform: translateX(0px)  translateY(0px)  rotate(-5deg); opacity: 1; }
  }

  /* Speech bubble float */
  @keyframes bubble-float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-4px); }
  }

  /* Particle float */
  @keyframes particle-rise {
    0%   { transform: translateY(0px);  opacity: 0.6; }
    50%  { transform: translateY(-12px); opacity: 1; }
    100% { transform: translateY(0px);  opacity: 0.6; }
  }

  /* Screen glow */
  @keyframes screen-glow {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1; }
  }

  /*
    Eye blink — scaleY on each ellipse individually.
    transform-box: fill-box ensures it scales around the eye's own centre.
  */
  @keyframes blink {
    0%, 90%, 100% { transform: scaleY(1); }
    95%           { transform: scaleY(0.08); }
  }

  /* Sparkle pop */
  @keyframes sparkle {
    0%   { transform: scale(0) rotate(0deg);   opacity: 0; }
    30%  { transform: scale(1.2) rotate(20deg); opacity: 1; }
    70%  { transform: scale(1)   rotate(-10deg);opacity: 1; }
    100% { transform: scale(0)   rotate(30deg); opacity: 0; }
  }

  .char-cashier { animation: bob 2.4s ease-in-out infinite; }
  .char-student { animation: bob 2.4s ease-in-out infinite; animation-delay: 0.5s; }

  /* Bag animation — 4 second loop */
  .anim-bag {
    animation: bag-pass 4s ease-in-out infinite;
    transform-origin: 0 0; /* translate-only, no rotation pivot issue */
  }

  .anim-bubble  { animation: bubble-float 2.8s ease-in-out infinite; }
  .anim-bubble2 { animation: bubble-float 2.8s ease-in-out infinite; animation-delay: 0.5s; }
  .anim-screen  { animation: screen-glow 1.6s ease-in-out infinite; }

  /* Eye blink — applied per ellipse with fill-box */
  .eye-l {
    animation: blink 4s ease-in-out infinite;
    transform-box: fill-box;
    transform-origin: center;
  }
  .eye-r {
    animation: blink 4s ease-in-out infinite;
    animation-delay: 0.8s;
    transform-box: fill-box;
    transform-origin: center;
  }

  .anim-p1 { animation: particle-rise 3s   ease-in-out infinite; }
  .anim-p2 { animation: particle-rise 3.4s ease-in-out infinite; animation-delay: 0.7s; }
  .anim-p3 { animation: particle-rise 2.6s ease-in-out infinite; animation-delay: 1.2s; }

  .spark1 { animation: sparkle 2.4s ease-in-out infinite;             transform-box: fill-box; transform-origin: center; }
  .spark2 { animation: sparkle 2.4s ease-in-out infinite; animation-delay: 0.8s;  transform-box: fill-box; transform-origin: center; }
  .spark3 { animation: sparkle 2.4s ease-in-out infinite; animation-delay: 1.6s;  transform-box: fill-box; transform-origin: center; }
`;

/* ── Star helper ── */
const Star: React.FC<{ cx: number; cy: number; r: number; fill: string; cls: string }> = ({ cx, cy, r, fill, cls }) => {
  const pts = Array.from({ length: 5 }, (_, i) => {
    const o = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const inn = o + Math.PI / 5;
    return [cx + r * Math.cos(o), cy + r * Math.sin(o), cx + r * 0.42 * Math.cos(inn), cy + r * 0.42 * Math.sin(inn)];
  }).flat();
  const d = pts.reduce((acc, v, i) => acc + (i === 0 ? `M${v}` : i % 2 === 0 ? ` L${v}` : `,${v}`), '') + ' Z';
  return <path d={d} fill={fill} className={cls} />;
};

export const CashierAnimation: React.FC = () => (
  <>
    <style>{styles}</style>
    <svg viewBox="0 0 520 320" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>

      {/* ── BACKGROUND ── */}
      <rect width="520" height="320" fill="#f5f0ff" rx="16" />
      <defs>
        <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1.2" fill="rgba(124,58,237,0.15)" />
        </pattern>
      </defs>
      <rect width="520" height="320" fill="url(#dots)" rx="16" />

      {/* Shelf back wall */}
      <rect x="0" y="52" width="520" height="10" fill="#ddd6fe" rx="3" />
      <rect x="28"  y="24" width="26" height="28" rx="5" fill="#7c3aed" opacity="0.75" />
      <rect x="58"  y="30" width="20" height="22" rx="5" fill="#a855f7" opacity="0.6"  />
      <rect x="82"  y="22" width="28" height="30" rx="5" fill="#6d28d9" opacity="0.55" />
      <rect x="384" y="26" width="24" height="26" rx="5" fill="#16a34a" opacity="0.75" />
      <rect x="412" y="32" width="18" height="20" rx="5" fill="#22c55e" opacity="0.65" />
      <rect x="434" y="24" width="28" height="28" rx="5" fill="#15803d" opacity="0.55" />
      <rect x="466" y="29" width="22" height="23" rx="5" fill="#4ade80" opacity="0.5"  />

      {/* Floor */}
      <rect x="0" y="268" width="520" height="52" fill="#ede9fe" />
      <rect x="0" y="264" width="520" height="6"  fill="#ddd6fe" />
      {[0,1,2,3,4,5].map(i => (
        <rect key={i} x={i * 88} y="268" width="86" height="52" fill="none" stroke="#e9d5ff" strokeWidth="1" />
      ))}

      {/* ── COUNTER ── */}
      <rect x="176" y="182" width="168" height="82" rx="12" fill="#7c3aed" />
      <rect x="168" y="173" width="184" height="14" rx="7" fill="#6d28d9" />
      <rect x="184" y="193" width="152" height="62" rx="8" fill="#8b5cf6" opacity="0.4" />
      <rect x="168" y="173" width="55"  height="14" rx="7" fill="white"   opacity="0.12" />

      {/* POS terminal */}
      <rect x="236" y="140" width="52" height="38" rx="6" fill="#1e1b4b" />
      <rect x="239" y="143" width="46" height="26" rx="4" fill="#4f46e5" className="anim-screen" />
      <rect x="243" y="148" width="28" height="3"  rx="1" fill="white"   opacity="0.6" />
      <rect x="243" y="154" width="20" height="3"  rx="1" fill="white"   opacity="0.4" />
      <rect x="243" y="160" width="24" height="3"  rx="1" fill="#4ade80"  opacity="0.9" />
      <rect x="258" y="178" width="8"  height="8"  rx="1" fill="#312e81" />
      <rect x="250" y="183" width="24" height="4"  rx="2" fill="#312e81" />

      {/* Card reader */}
      <rect x="296" y="164" width="28" height="18" rx="4" fill="#4c1d95" />
      <rect x="299" y="167" width="22" height="9"  rx="2" fill="#7c3aed" className="anim-screen" />

      {/* Desk plant */}
      <circle cx="204" cy="180" r="7"  fill="#16a34a" />
      <circle cx="200" cy="176" r="5"  fill="#22c55e" />
      <circle cx="208" cy="177" r="4"  fill="#15803d" />
      <rect   x="201"  y="180"  width="6"  height="6"  rx="2" fill="#92400e" />
      <rect   x="197"  y="184"  width="12" height="4"  rx="2" fill="#78350f" />

      {/* ── SIGN ── */}
      <rect x="196" y="18" width="128" height="30" rx="8" fill="#7c3aed" />
      <rect x="200" y="22" width="120" height="22" rx="6" fill="#6d28d9" />
      <text x="260" y="34" fontSize="9"   fill="white"   fontWeight="bold"  textAnchor="middle" letterSpacing="1">UC METC</text>
      <text x="260" y="43" fontSize="7.5" fill="#c4b5fd" textAnchor="middle" letterSpacing="0.5">COOPERATIVE</text>
      <line x1="216" y1="18" x2="216" y2="10" stroke="#7c3aed" strokeWidth="2" />
      <line x1="304" y1="18" x2="304" y2="10" stroke="#7c3aed" strokeWidth="2" />

      {/* ══════════════════════════════════════
          CASHIER — single <g>, bob together
         ══════════════════════════════════════ */}
      <g className="char-cashier">
        {/* Body */}
        <rect x="92"  y="166" width="56" height="76" rx="16" fill="#7c3aed" />
        <rect x="106" y="184" width="28" height="46" rx="8"  fill="#5b21b6" opacity="0.5" />
        {/* Name tag */}
        <rect x="108" y="194" width="24" height="14" rx="3"  fill="white"   opacity="0.9" />
        <rect x="111" y="197" width="14" height="2.5" rx="1" fill="#7c3aed" opacity="0.7" />
        <rect x="111" y="202" width="10" height="2"   rx="1" fill="#a855f7" opacity="0.5" />

        {/*
          LEFT ARM — extended over the counter toward the bag start position.
          Bag starts at x≈145 y≈165. Hand at cx≈172 cy≈187 reaches it.
        */}
        <rect x="146" y="182" width="32" height="12" rx="6" fill="#7c3aed" />
        {/* Forearm skin */}
        <rect x="156" y="182" width="22" height="12" rx="6" fill="#fbbf24" />
        {/* Hand */}
        <circle cx="174" cy="188" r="9" fill="#fbbf24" />

        {/* RIGHT ARM — down at side */}
        <rect x="62"  y="188" width="30" height="12" rx="6" fill="#7c3aed" />
        <circle cx="62" cy="194" r="8" fill="#fbbf24" />

        {/* Head */}
        <circle cx="120" cy="146" r="26" fill="#fbbf24" />
        {/* Hair */}
        <ellipse cx="120" cy="122" rx="26" ry="12" fill="#7c3aed" />
        <ellipse cx="120" cy="118" rx="20" ry="9"  fill="#6d28d9" />
        <circle  cx="120" cy="112" r="9"  fill="#7c3aed" />
        <circle  cx="120" cy="110" r="6"  fill="#8b5cf6" />

        {/* Eyes — transform-box per ellipse */}
        <ellipse cx="113" cy="145" rx="3.5" ry="4"   fill="#1e1b4b" className="eye-l" />
        <ellipse cx="127" cy="145" rx="3.5" ry="4"   fill="#1e1b4b" className="eye-l" />
        <circle  cx="114" cy="144" r="1.2" fill="white" />
        <circle  cx="128" cy="144" r="1.2" fill="white" />

        {/* Cheeks */}
        <ellipse cx="107" cy="152" rx="5" ry="3" fill="#f9a8d4" opacity="0.55" />
        <ellipse cx="133" cy="152" rx="5" ry="3" fill="#f9a8d4" opacity="0.55" />
        {/* Smile — static */}
        <path d="M112 157 Q120 165 128 157" stroke="#92400e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* ══════════════════════════════════════
          BAG — starts exactly at cashier hand (cx≈174 cy≈188)
          Bag right edge at 174 → bag x = 174-34 = 140, y = 155
          Animation pushes it +84px right to reach student hand (cx≈258)
         ══════════════════════════════════════ */}
      <g className="anim-bag">
        {/* Bag body — starts at x=140 so its right edge (~174) meets cashier hand */}
        <rect x="140" y="155" width="34" height="40" rx="7"  fill="#d97706" />
        <rect x="144" y="161" width="26" height="26" rx="5"  fill="#f59e0b" />
        {/* Logo */}
        <circle cx="157" cy="175" r="7"  fill="#7c3aed" opacity="0.85" />
        <path d="M153 175 L157 171 L161 175" stroke="white" strokeWidth="1.5" fill="none" />
        {/* Handles */}
        <path d="M147 155 Q147 145 157 145 Q167 145 167 155" stroke="#92400e" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Items peeking out */}
        <ellipse cx="150" cy="156" rx="4.5" ry="3.5" fill="#22c55e" />
        <ellipse cx="160" cy="155" rx="4"   ry="3"   fill="#f87171" />
        <ellipse cx="168" cy="157" rx="3.5" ry="2.5" fill="#a3e635" />
        {/* Glow border */}
        <rect x="140" y="155" width="34" height="40" rx="7" fill="none" stroke="#fde68a" strokeWidth="1.5" opacity="0.6" />
      </g>

      {/* ══════════════════════════════════════
          STUDENT — single <g>, bob together
         ══════════════════════════════════════ */}
      <g className="char-student">
        {/* Backpack */}
        <rect x="346" y="174" width="28" height="46" rx="8"  fill="#4f46e5" />
        <rect x="350" y="180" width="20" height="16" rx="4"  fill="#6366f1" />
        <rect x="350" y="200" width="20" height="14" rx="4"  fill="#6366f1" />
        <path d="M350 174 Q342 192 346 220" stroke="#4338ca" strokeWidth="3.5" fill="none" strokeLinecap="round" />

        {/* Body */}
        <rect x="308" y="174" width="50" height="78" rx="16" fill="#16a34a" />
        <rect x="316" y="216" width="34" height="26" rx="8"  fill="#15803d" opacity="0.55" />
        <line x1="330" y1="192" x2="327" y2="210" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
        <line x1="338" y1="192" x2="341" y2="210" stroke="#166534" strokeWidth="2" strokeLinecap="round" />

        {/*
          LEFT ARM — reaching toward the bag end position.
          Bag ends at x=140+84=224, right edge = 258.
          Student hand at cx≈258 cy≈188 matches that perfectly.
        */}
        <rect x="258" y="182" width="52" height="12" rx="6" fill="#16a34a" />
        {/* Forearm skin */}
        <rect x="258" y="182" width="30" height="12" rx="6" fill="#fbbf24" />
        {/* Hand */}
        <circle cx="260" cy="188" r="9" fill="#fbbf24" />

        {/* RIGHT ARM — holding phone */}
        <rect x="358" y="188" width="26" height="12" rx="6" fill="#16a34a" />
        <circle cx="383" cy="194" r="8" fill="#fbbf24" />
        <rect x="379" y="195" width="13" height="22" rx="3"  fill="#1e1b4b" />
        <rect x="381" y="198" width="9"  height="14" rx="2"  fill="#4f46e5" className="anim-screen" />

        {/* Head */}
        <circle cx="333" cy="150" r="26" fill="#fbbf24" />
        {/* Hair */}
        <ellipse cx="333" cy="126" rx="24" ry="12" fill="#451a03" />
        <circle  cx="321" cy="128" r="9"  fill="#451a03" />
        <circle  cx="345" cy="128" r="9"  fill="#451a03" />
        <circle  cx="333" cy="124" r="13" fill="#78350f" />
        <circle  cx="333" cy="121" r="9"  fill="#92400e" />

        {/* Eyes — transform-box per ellipse */}
        <ellipse cx="326" cy="149" rx="3.5" ry="4"   fill="#1e1b4b" className="eye-r" />
        <ellipse cx="340" cy="149" rx="3.5" ry="4"   fill="#1e1b4b" className="eye-r" />
        <circle  cx="327" cy="148" r="1.2" fill="white" />
        <circle  cx="341" cy="148" r="1.2" fill="white" />

        {/* Cheeks */}
        <ellipse cx="319" cy="156" rx="5" ry="3" fill="#f9a8d4" opacity="0.55" />
        <ellipse cx="347" cy="156" rx="5" ry="3" fill="#f9a8d4" opacity="0.55" />
        {/* Smile — static */}
        <path d="M325 161 Q333 169 341 161" stroke="#92400e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>

      {/* ── SPEECH BUBBLES ── */}
      <g className="anim-bubble">
        <rect x="52"  y="66" width="86" height="36" rx="10" fill="white" filter="drop-shadow(0 2px 6px rgba(124,58,237,0.15))" />
        <polygon points="86,102 96,102 91,112" fill="white" />
        <text x="62"  y="82" fontSize="8.5" fill="#7c3aed" fontWeight="bold">Here you go!</text>
        <text x="68"  y="95" fontSize="8"   fill="#6d28d9" opacity="0.8">Enjoy! 😊</text>
      </g>
      <g className="anim-bubble2">
        <rect x="344" y="66" width="90" height="36" rx="10" fill="white" filter="drop-shadow(0 2px 6px rgba(22,163,74,0.15))" />
        <polygon points="350,102 360,102 355,112" fill="white" />
        <text x="352" y="82" fontSize="8.5" fill="#16a34a" fontWeight="bold">Thank you!</text>
        <text x="352" y="95" fontSize="8"   fill="#15803d" opacity="0.8">So fast! 🎉</text>
      </g>

      {/* ── FLOATING PARTICLES ── */}
      <circle cx="172" cy="124" r="5" fill="#7c3aed" opacity="0.4" className="anim-p1" />
      <circle cx="396" cy="118" r="6" fill="#a855f7" opacity="0.35" className="anim-p3" />
      <circle cx="240" cy="94"  r="3" fill="#4ade80" opacity="0.4"  className="anim-p1" />
      <circle cx="310" cy="86"  r="4" fill="#c4b5fd" opacity="0.5"  className="anim-p2" />

      {/* ── SPARKLES ── */}
      <Star cx={192} cy={135} r={9} fill="#16a34a" cls="spark1" />
      <Star cx={268} cy={118} r={8} fill="#7c3aed" cls="spark2" />
      <Star cx={350} cy={133} r={9} fill="#16a34a" cls="spark3" />

      {/* ── PESO COINS ── */}
      <g className="anim-p3">
        <circle cx="152" cy="236" r="9" fill="#fde68a" opacity="0.6" />
        <circle cx="152" cy="236" r="6" fill="#f59e0b" opacity="0.5" />
        <text x="149" y="240" fontSize="7.5" fill="#92400e" fontWeight="bold">₱</text>
      </g>
      <g className="anim-p1">
        <circle cx="376" cy="244" r="9" fill="#fde68a" opacity="0.6" />
        <circle cx="376" cy="244" r="6" fill="#f59e0b" opacity="0.5" />
        <text x="373" y="248" fontSize="7.5" fill="#92400e" fontWeight="bold">₱</text>
      </g>
    </svg>
  </>
);
