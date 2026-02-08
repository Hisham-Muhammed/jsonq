import React, { useState } from 'react';
import { Camera, Trash2, Zap, Loader2, Trophy, Award, TrendingUp, TrendingDown, Star } from 'lucide-react';

const apiKey = ""; 

export default function App() {
  const [loading, setLoading] = useState(false);
  const [detectedPlayers, setDetectedPlayers] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [images, setImages] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState(null);

  const calculatePoints = (p) => {
    let bat = 0, bowl = 0, field = 0, other = 0;
    let logs = [];

    // --- (i) BATTING ---
    const runs = Number(p.runs || 0);
    const balls = Number(p.balls || 0);
    const runPts = runs * 1;
    const fourPts = (p.fours || 0) * 1;
    const sixPts = (p.sixes || 0) * 3;
    bat += runPts + fourPts + sixPts;
    if (runPts) logs.push(`Runs (${runs}): +${runPts}`);
    if (fourPts) logs.push(`4s: +${fourPts}`);
    if (sixPts) logs.push(`6s: +${sixPts}`);

    const isBowler = (p.balls_bowled || 0) >= 12; 
    
    // Duck Logic
    if (runs === 0 && p.isOut && !p.lastOverDuck && !isBowler) {
        bat -= 10;
        logs.push(`Duck: -10`);
    }

    // Strike Rate
    if ((balls >= 10 || runs >= 20) && balls > 0 && !isBowler) {
      const sr = (runs / balls) * 100;
      let srPts = 0;
      if (sr <= 50) srPts = -30;
      else if (sr <= 75) srPts = -20;
      else if (sr <= 100) srPts = -10;
      else if (sr > 200) srPts = 20 + (Math.floor((sr - 200) / 25) * 5);
      else if (sr > 175) srPts = 20;
      else if (sr > 150) srPts = 15;
      else if (sr > 135) srPts = 10;
      else if (sr > 120) srPts = 5;
      bat += srPts;
      if (srPts !== 0) logs.push(`SR (${sr.toFixed(1)}): ${srPts > 0 ? '+' : ''}${srPts}`);
    }

    // Milestones
    if (runs >= 150) { bat += 40; logs.push(`150+ Bonus: +40`); }
    else if (runs >= 125) { bat += 25; logs.push(`125+ Bonus: +25`); }
    else if (runs >= 100) { bat += 20; logs.push(`100+ Bonus: +20`); }
    else if (runs >= 75) { bat += 15; logs.push(`75+ Bonus: +15`); }
    else if (runs >= 50) { bat += 10; logs.push(`50+ Bonus: +10`); }
    else if (runs >= 30) { bat += 5; logs.push(`30+ Bonus: +5`); }

    if (!p.isOut && balls >= 30) { bat += 10; logs.push(`Unbeaten (30+ balls): +10`); }

    // --- (ii) BOWLING ---
    const wcsPts = (p.wk_cs || 0) * 25;
    const wlbPts = (p.wk_lb || 0) * (25 + 8); 
    const maidenPts = (p.maidens || 0) * 25;
    const dotPts = (p.dots || 0) * 1;
    bowl += wcsPts + wlbPts + maidenPts + dotPts;
    if (wcsPts) logs.push(`Wkts (C/S): +${wcsPts}`);
    if (wlbPts) logs.push(`Wkts (LBW/B/HW): +${wlbPts}`);
    if (maidenPts) logs.push(`Maidens: +${maidenPts}`);
    if (dotPts) logs.push(`Dots: +${dotPts}`);

    // Economy
    if ((p.balls_bowled || 0) >= 12) {
      const eco = (p.runs_conc / (p.balls_bowled / 6));
      let ecoPts = 0;
      if (eco <= 1.0) ecoPts = 70;
      else if (eco <= 2.0) ecoPts = 60;
      else if (eco <= 3.0) ecoPts = 50;
      else if (eco <= 4.0) ecoPts = 40;
      else if (eco <= 5.0) ecoPts = 30;
      else if (eco <= 6.0) ecoPts = 20;
      else if (eco <= 7.0) ecoPts = 10;
      else if (eco > 14.0) ecoPts = -20;
      else if (eco > 12.0) ecoPts = -15;
      else if (eco > 11.0) ecoPts = -10;
      else if (eco > 10.0) ecoPts = -5;
      bowl += ecoPts;
      if (ecoPts !== 0) logs.push(`Eco (${eco.toFixed(1)}): ${ecoPts > 0 ? '+' : ''}${ecoPts}`);
    }

    const totW = (p.wk_cs || 0) + (p.wk_lb || 0);
    if (totW >= 7) { bowl += 50; logs.push(`7-Wkt Bonus: +50`); }
    else if (totW >= 6) { bowl += 40; logs.push(`6-Wkt Bonus: +40`); }
    else if (totW >= 5) { bowl += 30; logs.push(`5-Wkt Bonus: +30`); }
    else if (totW >= 4) { bowl += 20; logs.push(`4-Wkt Bonus: +20`); }
    else if (totW >= 3) { bowl += 10; logs.push(`3-Wkt Bonus: +10`); }

    if (p.hattrick) { bowl += 100; logs.push(`Hattrick: +100`); }
    if (p.twoInTwo) { bowl += 25; logs.push(`2-in-2: +25`); }

    // --- (iii) FIELDING ---
    const cPts = (p.catches || 0) * 10;
    const sPts = (p.stumpings || 0) * 15;
    const rdPts = (p.runOutDirect || 0) * 25;
    const riPts = (p.runOutInvolved || 0) * 10;
    field += cPts + sPts + rdPts + riPts;
    if (cPts) logs.push(`Catches: +${cPts}`);
    if (sPts) logs.push(`Stumpings: +${sPts}`);
    if (rdPts) logs.push(`RO Direct: +${rdPts}`);
    if (riPts) logs.push(`RO Involved: +${riPts}`);

    const totField = (p.catches || 0) + (p.stumpings || 0) + (p.runOutDirect || 0) + (p.runOutInvolved || 0);
    if (totField >= 3) { field += 30; logs.push(`Fielding 3+ Bonus: +30`); }

    // --- OTHER ---
    if (p.playingXI) { other += 5; logs.push(`Playing XI: +5`); }
    if (p.matchResult === 'win') { other += 10; logs.push(`Win Bonus: +10`); }
    else if (p.matchResult === 'loss') { other -= 5; logs.push(`Loss Penalty: -5`); }
    
    if (p.mom) { other += 50; logs.push(`M.O.M: +50`); }
    if (p.orangeCap) { other += 150; logs.push(`Orange Cap: +150`); }
    if (p.purpleCap) { other += 150; logs.push(`Purple Cap: +150`); }
    if (p.mostSixes) { other += 100; logs.push(`Most 6s: +100`); }
    if (p.mostFours) { other += 100; logs.push(`Most 4s: +100`); }
    if (p.emerging) { other += 75; logs.push(`Emerging: +75`); }
    if (p.pot) { other += 200; logs.push(`P.O.T: +200`); }

    return { total: Math.round(bat + bowl + field + other), logs };
  };

  const processImages = async () => {
    setLoading(true); setError(null);
    try {
      const parts = images.map(i => ({ inlineData: { mimeType: "image/png", data: i.split(',')[1] } }));
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: `Extract player stats from the provided scorecard images.
            STRICT RULES:
            1. ONLY extract players WHO ARE VISIBLY LISTED in the image (Batting or Bowling table). DO NOT include Sanju or others if they are not in the current image.
            2. If a player is in the Batting table but NOT Bowling table, wk_cs/wk_lb MUST be 0.
            3. wk_lb = Wickets by LBW, Bowled, or HW (from bowling table).
            4. wk_cs = Wickets by Catch or Stumping (from bowling table).
            5. Return JSON: [{name, runs, balls, fours, sixes, isOut, wk_cs, wk_lb, maidens, runs_conc, balls_bowled, catches, stumpings}]` },
            ...parts
          ] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      const list = JSON.parse(data.candidates[0].content.parts[0].text);
      setDetectedPlayers(list.map(p => ({ 
        ...p, dots: 0, catches: p.catches || 0, stumpings: p.stumpings || 0,
        runOutDirect: 0, runOutInvolved: 0, playingXI: true, mom: false, 
        lastOverDuck: false, hattrick: false, twoInTwo: false, matchResult: 'win',
        orangeCap: false, purpleCap: false, emerging: false, mostSixes: false, mostFours: false, pot: false
      })));
    } catch (e) { setError("Analysis failed. Please try again."); } finally { setLoading(false); }
  };

  const update = (i, f, v) => {
    const n = [...detectedPlayers];
    n[i][f] = v;
    setDetectedPlayers(n);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900 pb-24">
      <div className="max-w-xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Scorer <span className="text-blue-600">Pro</span></h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Player Detection Enabled</p>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex flex-wrap gap-3 mb-4">
            <label className="flex-1 min-w-[120px] h-24 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group">
              <input type="file" multiple hidden onChange={(e) => {
                Array.from(e.target.files).forEach(f => {
                  const r = new FileReader();
                  r.onload = () => setImages(p => [...p, r.result]);
                  r.readAsDataURL(f);
                });
              }} />
              <Camera size={24} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              <span className="text-[8px] font-black uppercase text-slate-400 mt-2">Upload Scorecard</span>
            </label>
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-3xl overflow-hidden border border-slate-200 group">
                <img src={img} className="w-full h-full object-cover" />
                <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
              </div>
            ))}
          </div>
          <button disabled={images.length === 0 || loading} onClick={processImages} className="w-full py-5 rounded-[1.5rem] bg-slate-900 text-white font-black flex items-center justify-center gap-3 hover:bg-black disabled:opacity-20 shadow-xl active:scale-95 transition-all uppercase tracking-tighter italic">
            {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} fill="white" />}
            {loading ? "Detecting Live Stats..." : "Analyze Active Players Only"}
          </button>
        </div>

        <div className="space-y-4">
          {detectedPlayers.map((p, i) => {
            const { total, logs } = calculatePoints(p);
            const isExp = expanded === i;
            return (
              <div key={i} className={`bg-white rounded-[2.5rem] border transition-all duration-500 ${isExp ? 'ring-2 ring-blue-100' : ''} ${p.matchResult === 'win' ? 'border-emerald-100' : 'border-red-50'}`}>
                <div className="p-5 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(isExp ? null : i)}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black text-2xl italic ${p.matchResult === 'win' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {p.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-[14px] uppercase italic leading-none">{p.name}</h3>
                        {p.mom && <Trophy size={14} className="text-amber-500 fill-amber-500"/>}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">Bat: {p.runs} | Bowl: {(p.wk_cs||0)+(p.wk_lb||0)}</div>
                    </div>
                  </div>
                  <div className="text-right pr-2">
                    <div className="text-4xl font-black text-blue-600 tracking-tighter leading-none">{total}</div>
                    <div className="text-[8px] font-black uppercase text-slate-300 mt-1">Match Pts</div>
                  </div>
                </div>

                {isExp && (
                  <div className="px-6 pb-8 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-2">
                        <button onClick={() => update(i, 'matchResult', p.matchResult === 'win' ? 'loss' : 'win')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${p.matchResult === 'win' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 'bg-red-500 text-white shadow-lg shadow-red-100'}`}>
                            {p.matchResult === 'win' ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {p.matchResult.toUpperCase()}
                        </button>
                        <button onClick={() => update(i, 'mom', !p.mom)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border transition-all ${p.mom ? 'bg-amber-400 text-white border-amber-400 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            M.O.M
                        </button>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-3xl space-y-4 border border-slate-100">
                      <div className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Batting Stats</div>
                      <div className="grid grid-cols-4 gap-3">
                        {['runs', 'balls', 'fours', 'sixes'].map(f => (
                          <div key={f}><label className="text-[9px] font-black text-slate-400 uppercase pl-1">{f}</label>
                          <input type="number" value={p[f]} onChange={e => update(i, f, +e.target.value)} className="w-full bg-white p-3 rounded-2xl font-black text-sm text-center border-none shadow-sm focus:ring-2 focus:ring-blue-200 outline-none" /></div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => update(i, 'isOut', !p.isOut)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${p.isOut ? 'bg-slate-800 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>Out</button>
                        <button onClick={() => update(i, 'lastOverDuck', !p.lastOverDuck)} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${p.lastOverDuck ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>20th Over</button>
                      </div>
                    </div>

                    <div className="bg-emerald-50/20 p-5 rounded-3xl space-y-4 border border-emerald-100">
                      <div className="text-[11px] font-black text-emerald-600 uppercase flex justify-between items-center tracking-widest">
                        Bowling
                        <div className="flex gap-2">
                          <button onClick={() => update(i, 'hattrick', !p.hattrick)} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${p.hattrick ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border'}`}>Hattrick</button>
                          <button onClick={() => update(i, 'twoInTwo', !p.twoInTwo)} className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${p.twoInTwo ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400 border'}`}>2-in-2</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {['wk_cs', 'wk_lb', 'maidens', 'dots'].map(f => (
                          <div key={f}><label className="text-[9px] font-black text-slate-400 uppercase pl-1">{f === 'wk_lb' ? 'LBW/B' : f === 'wk_cs' ? 'Caught' : f}</label>
                          <input type="number" value={p[f]||0} onChange={e => update(i, f, +e.target.value)} className="w-full bg-white p-3 rounded-2xl font-black text-sm text-center border-none shadow-sm outline-none" /></div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[9px] font-black text-slate-400 uppercase pl-1">Balls Bowled</label>
                        <input type="number" value={p.balls_bowled||0} onChange={e => update(i, 'balls_bowled', +e.target.value)} className="w-full bg-white p-3 rounded-2xl font-black text-sm text-center border-none shadow-sm" /></div>
                        <div><label className="text-[9px] font-black text-slate-400 uppercase pl-1">Runs Conc.</label>
                        <input type="number" value={p.runs_conc||0} onChange={e => update(i, 'runs_conc', +e.target.value)} className="w-full bg-white p-3 rounded-2xl font-black text-sm text-center border-none shadow-sm" /></div>
                      </div>
                    </div>

                    <div className="bg-amber-50/20 p-5 rounded-3xl space-y-4 border border-amber-100">
                      <div className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Fielding</div>
                      <div className="grid grid-cols-4 gap-3">
                        {['catches', 'stumpings', 'runOutDirect', 'runOutInvolved'].map(f => (
                          <div key={f}><label className="text-[9px] font-black text-slate-400 uppercase pl-1">{f.startsWith('run') ? 'RO' : f.slice(0,4)}</label>
                          <input type="number" value={p[f]||0} onChange={e => update(i, f, +e.target.value)} className="w-full bg-white p-3 rounded-2xl font-black text-sm text-center border-none shadow-sm outline-none" /></div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {['orangeCap', 'purpleCap', 'mostSixes', 'mostFours', 'emerging', 'pot'].map(f => (
                            <button key={f} onClick={() => update(i, f, !p[f])} className={`py-3 rounded-xl text-[8px] font-black uppercase border transition-all ${p[f] ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                {f === 'pot' ? 'P.O.T' : f.replace(/([A-Z])/g, ' $1')}
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4 border-b border-white/10 pb-5">
                        {logs.map((log, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-slate-500 uppercase tracking-tighter">{log.split(':')[0]}</span>
                            <span className="text-emerald-400 font-black">{log.split(':')[1]}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-left"><p className="text-[8px] text-slate-500 font-black uppercase">Grand Total</p><p className="text-xs text-white/50 font-bold tracking-widest italic">{p.name}</p></div>
                        <div className="text-5xl font-black text-white italic tracking-tighter leading-none">{total}</div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setDetectedPlayers(detectedPlayers.filter((_, idx) => idx !== i))} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-[1.5rem] font-black uppercase text-[11px] hover:bg-red-50 hover:text-red-400 transition-all">Discard</button>
                      <button onClick={() => {
                        setSavedRecords([{name: p.name, points: total, mom: p.mom}, ...savedRecords]);
                        setDetectedPlayers(detectedPlayers.filter((_, idx) => idx !== i));
                      }} className="flex-[2] py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[11px] shadow-2xl shadow-blue-200 active:scale-95 transition-all italic">Save Point</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {savedRecords.length > 0 && (
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl">
            <h2 className="font-black italic text-sm uppercase flex items-center gap-2 mb-6 tracking-tight"><Award className="text-blue-600" size={18}/> Tournament Leaderboard</h2>
            <div className="space-y-3">
              {savedRecords.sort((a,b) => b.points - a.points).map((r, i) => (
                <div key={i} className={`flex justify-between items-center p-5 rounded-[1.5rem] transition-all ${r.mom ? 'bg-amber-50 border-2 border-amber-100' : 'bg-slate-50 border border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-[12px] font-black text-slate-300">0{i+1}</span>
                    <span className="font-black uppercase italic text-[12px] text-slate-700 tracking-tight">{r.name}</span>
                    {r.mom && <Star size={12} className="text-amber-500 fill-amber-500"/>}
                  </div>
                  <div className="flex items-center gap-5">
                    <span className="text-2xl font-black text-blue-700 italic">{r.points} <span className="text-[9px] text-slate-400 uppercase font-bold not-italic">Pts</span></span>
                    <button onClick={() => setSavedRecords(savedRecords.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

