# Seek-safe GSAP motion per scene; written to tools/motion.json and inlined by build_frames.py
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, 'tools', 'timing.json')))
NAMES = ['01-titulo', '02-explorador', '03-habitat', '04-panico', '05-meteoro', '06-evolucion', '07-whatsappiens', '08-vida', '09-cierre']
DUR = dict(zip(NAMES, T['dur']))

def reps(D, start, per):
    return max(1, int((D - start - .1) / per) - 1)

def camera(p, D, base):
    """Blinking REC dot and a running timecode, both driven by the timeline (seek-safe)."""
    h, m, s = (int(x) for x in base.split(':'))
    return (f'tl.to("#{p}-rec",{{opacity:.15,duration:.5,yoyo:true,repeat:{reps(D, 0, .5)},ease:"steps(1)"}},0);\n'
            f'const {p.replace("-", "_")}o={{t:0}};\n'
            f'tl.to({p.replace("-", "_")}o,{{t:{D:.2f},duration:{D:.2f},ease:"none",onUpdate:()=>{{'
            f'const f=Math.floor({p.replace("-", "_")}o.t*30)%30, x={h * 3600 + m * 60 + s}+Math.floor({p.replace("-", "_")}o.t);'
            f'const pad=n=>String(n).padStart(2,"0");'
            f'document.querySelector("#{p}-tc").textContent=pad(Math.floor(x/3600)%24)+":"+pad(Math.floor(x/60)%60)+":"+pad(x%60)+":"+pad(f);}}}},0);\n')

def bob(sel, D, start, amp=-20, per=.5, extra=''):
    return f'tl.to("{sel}",{{y:"+={amp}"{extra},duration:{per},yoyo:true,repeat:{reps(D, start, per)},ease:"sine.inOut"}},{start});\n'

def lowthird(p, at):
    return f'tl.from("#{p}-lt",{{x:-900,duration:.55,ease:"power3.out"}},{at});\n'

M = {}
D = DUR['01-titulo']
M['01-titulo'] = f'''
tl.to("#f01-black",{{opacity:0,duration:.8,ease:"power1.inOut"}},0);
tl.from("#f01-sun",{{attr:{{cy:820}},duration:{D:.2f},ease:"power1.out"}},0);
tl.fromTo(".f01-bird",{{x:-60}},{{x:120,duration:{D:.2f},ease:"none"}},0);
tl.to(".f01-bird",{{scaleY:.4,transformOrigin:"50% 50%",duration:.25,yoyo:true,repeat:{int(D / .25) - 1},ease:"sine.inOut",stagger:.06}},0);
tl.from("#f01-k1",{{opacity:0,letterSpacing:"1.2em",duration:1,ease:"power2.out"}},.5);
tl.from("#f01-k2",{{opacity:0,y:60,duration:.8,ease:"power3.out"}},.8);
tl.from("#f01-rule",{{scaleX:0,duration:.6,ease:"power2.out"}},1.4);
tl.from("#f01-k3",{{opacity:0,y:30,duration:.6}},1.7);
tl.from("#f01-sil",{{opacity:0,x:200,duration:1.2,ease:"power2.out"}},1.2);
'''
D = DUR['02-explorador']
M['02-explorador'] = camera('f02', D, '05:42:17') + f'''
tl.from("#f02-pascal",{{y:420,duration:.7,ease:"back.out(1.4)"}},.3);
{bob("#f02-pascal", D, 1.1, -10, .7, ',rotation:-1.5')}
tl.from("#f02-shh",{{opacity:0,scale:.4,duration:.45,ease:"back.out(2)"}},.9);
tl.to("#f02-shh",{{opacity:0,duration:.4}},2.6);
{lowthird('f02', 1.6)}
tl.fromTo("#f02-fg",{{x:-20}},{{x:20,duration:{D:.2f},ease:"sine.inOut"}},0);
'''
D = DUR['03-habitat']
M['03-habitat'] = camera('f03', D, '23:58:04') + f'''
tl.to("#f03-c1, #f03-c2",{{attr:{{r:1500}},duration:.9,ease:"power2.in"}},1.5);
tl.from("#f03-clock",{{opacity:0,x:-300,duration:.45,ease:"power3.out"}},2.2);
tl.to("#f03-clock",{{x:8,duration:.05,yoyo:true,repeat:{reps(D, 3.0, .05)},ease:"none"}},3.0);
tl.from("#f03-k1",{{opacity:0,scale:.3,duration:.35,ease:"back.out(2.5)"}},2.6);
tl.from("#f03-k2",{{opacity:0,scale:.3,duration:.35,ease:"back.out(2.5)"}},3.3);
tl.to("#f03-k1, #f03-k2",{{y:10,duration:.18,yoyo:true,repeat:{reps(D, 3.7, .18)},ease:"power1.inOut",stagger:.09}},3.7);
tl.to("#f03-dino",{{scale:1.02,transformOrigin:"50% 100%",duration:.9,yoyo:true,repeat:{reps(D, 0, .9)},ease:"sine.inOut"}},0);
{lowthird('f03', 2.6)}
'''
D = DUR['04-panico']
M['04-panico'] = camera('f04', D, '23:59:31') + f'''
tl.from("#f04-dino",{{scale:.85,transformOrigin:"50% 100%",duration:.4,ease:"back.out(2)"}},.1);
tl.to("#f04-dino",{{x:10,duration:.06,yoyo:true,repeat:{reps(D, .6, .06)},ease:"none"}},.6);
tl.from(".f04-pdf",{{x:0,left:470,top:900,scale:0,rotation:180,duration:.6,ease:"power3.out",stagger:.12}},.2);
tl.to(".f04-pdf",{{y:"-=30",rotation:"+=10",duration:.6,yoyo:true,repeat:{reps(D, 1.5, .6)},ease:"sine.inOut",stagger:.07}},1.5);
tl.from("#f04-count",{{opacity:0,scale:.5,duration:.4,ease:"back.out(2)"}},.4);
const f04o={{v:1}};
tl.to(f04o,{{v:14,duration:1.6,ease:"power1.out",onUpdate:()=>{{document.querySelector("#f04-num").textContent=Math.round(f04o.v);}}}},.5);
tl.from("#f04-note",{{opacity:0,x:80,duration:.45,ease:"power3.out"}},2.2);
tl.from("#f04-sub",{{opacity:0,y:30,duration:.4}},.8);
'''
D = DUR['05-meteoro']
M['05-meteoro'] = camera('f05', D, '00:00:07') + f'''
tl.from("#f05-q",{{opacity:0,y:-40,duration:.45,ease:"back.out(2)"}},.3);
tl.fromTo("#f05-met",{{x:520,y:-620,scale:.5}},{{x:-260,y:640,scale:1.25,duration:{D - 1.1:.2f},ease:"power2.in"}},0);
tl.to("#f05-met img",{{rotation:-360,duration:{D - 1.1:.2f},ease:"none"}},0);
tl.to("#f05-dino",{{x:8,duration:.05,yoyo:true,repeat:{reps(D, 1.2, .05)},ease:"none"}},1.2);
tl.from("#f05-sub",{{opacity:0,y:30,duration:.4}},.6);
tl.to("#f05-flash",{{opacity:1,duration:.25,ease:"power2.in"}},{D - 1.1:.2f});
tl.to("#f05-bg, #f05-fg, #f05-dino",{{x:18,duration:.04,yoyo:true,repeat:9,ease:"none"}},{D - 1.1:.2f});
'''
D = DUR['06-evolucion']
M['06-evolucion'] = f'''
tl.from("#f06-paper",{{backgroundColor:"#FFF6E0",duration:.6}},0);
tl.from("#f06-title",{{opacity:0,y:-50,duration:.55,ease:"back.out(1.8)"}},.2);
tl.from("#f06-line",{{opacity:0,duration:.6}},.6);
''' + ''.join(f'tl.from("#f06-s{i}",{{opacity:0,scale:.4,rotation:{-12 if i % 2 else 12},duration:.55,ease:"back.out(1.8)"}},{0.7 + i * (D - 2.0) / 4:.2f});\n'
              f'tl.from("#f06-l{i}",{{opacity:0,x:{-60 if i % 2 else 60},duration:.45,ease:"power3.out"}},{0.95 + i * (D - 2.0) / 4:.2f});\n' for i in range(4)) + f'''
tl.from("#f06-new",{{opacity:0,scale:.3,duration:.45,ease:"back.out(3)"}},{D - 1.1:.2f});
tl.to("#f06-s3",{{scale:1.06,transformOrigin:"50% 80%",duration:.3,yoyo:true,repeat:{reps(D, D - 1.0, .3)},ease:"sine.inOut"}},{D - 1.0:.2f});
'''
D = DUR['07-whatsappiens']
M['07-whatsappiens'] = camera('f07', D, '10:14:52') + f'''
tl.from("#f07-hamaca",{{y:300,opacity:0,duration:.6,ease:"power3.out"}},.1);
tl.to("#f07-hamaca",{{rotation:2.5,transformOrigin:"50% 0%",duration:1.1,yoyo:true,repeat:{reps(D, .7, 1.1)},ease:"sine.inOut"}},.7);
''' + ''.join(f'tl.from("#f07-m{i + 1}",{{opacity:0,scale:.6,y:30,duration:.4,ease:"back.out(2)",transformOrigin:"{"right" if i < 2 else "left"} bottom"}},{0.8 + i * (D - 2.6) / 3:.2f});\n' for i in range(4)) + lowthird('f07', 1.2)
D = DUR['08-vida']
M['08-vida'] = f'''
tl.from("#f08-duo",{{scale:.7,opacity:0,transformOrigin:"50% 100%",duration:.5,ease:"back.out(1.8)"}},.05);
tl.from("#f08-k",{{opacity:0,y:-40,duration:.5,ease:"back.out(1.8)"}},.3);
tl.fromTo(".f08-cf",{{y:-200}},{{y:900,rotation:"+=360",duration:{D:.2f},ease:"none",stagger:.08}},0);
tl.from(`[id^="f08-s"]`,{{scale:0,rotation:-180,duration:.4,ease:"back.out(3)",stagger:.12}},.6);
'''
D = DUR['09-cierre']
M['09-cierre'] = f'''
tl.from("#f09-q",{{opacity:0,y:-50,duration:.5,ease:"back.out(1.8)"}},.1);
tl.from("#f09-a",{{opacity:0,x:-200,duration:.45,ease:"power3.out"}},.5);
tl.from("#f09-b",{{opacity:0,x:200,duration:.45,ease:"power3.out"}},.7);
tl.to("#f09-b",{{scale:1.07,duration:.35,yoyo:true,repeat:{reps(D, 1.6, .35)},ease:"sine.inOut"}},1.6);
tl.from("#f09-pascal",{{x:-500,duration:.6,ease:"power3.out"}},.9);
tl.from("#f09-qr",{{opacity:0,scale:.5,rotation:-6,duration:.6,ease:"back.out(1.8)"}},1.2);
tl.from("#f09-ev",{{opacity:0,y:40,duration:.5}},1.8);
tl.from("#f09-com",{{opacity:0,y:40,duration:.5}},2.4);
'''
json.dump(M, open(os.path.join(ROOT, 'tools', 'motion.json'), 'w'), ensure_ascii=False, indent=0)
print('motion', len(M))
