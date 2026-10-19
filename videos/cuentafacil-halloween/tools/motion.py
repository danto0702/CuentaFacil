# Seek-safe GSAP motion per scene; written to tools/motion.json and inlined by build_frames.py
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, 'tools', 'timing.json')))
NAMES = ['01-noche','02-bruja','03-vampiro','04-ladron','05-momias','06-fantasma','07-pascal','08-cuenta','09-estres','10-familia','11-cierre']
DUR = dict(zip(NAMES, T['dur']))

def ambient(p, D, spiders=0, bats=0, fog=True, webs=2, moon=False):
    # finite loops only: every repeat count is derived from the scene length
    k = lambda per: max(1, int((D - 0.4) / per) - 1)
    js = f'tl.to(".{p}-st",{{opacity:.12,duration:.7,yoyo:true,repeat:{k(.7)},ease:"sine.inOut",stagger:{{each:.18}}}},0);\n'
    js += f'tl.from(`[id^="{p}-web"]`,{{opacity:0,duration:.6,ease:"power2.out",stagger:.08}},0);\n'
    for i in range(spiders):
        js += (f'tl.from("#{p}-sp{i}",{{y:-700,duration:1.1,ease:"bounce.out"}},{0.15 + i*0.35:.2f});\n'
               f'tl.to("#{p}-sp{i}",{{y:-60,duration:.9,yoyo:true,repeat:{k(.9) - 1},ease:"sine.inOut"}},{1.3 + i*0.35:.2f});\n')
    for i in range(bats):
        d = -1 if i % 2 else 1
        js += (f'tl.fromTo("#{p}-bat{i}",{{x:{-500*d}}},{{x:{500*d},y:{-120 + 60*i},duration:{D:.2f},ease:"none"}},0);\n'
               f'tl.to("#{p}-bat{i}",{{scaleY:.35,duration:.14,yoyo:true,repeat:{int(D/.14) - 1},ease:"sine.inOut"}},0);\n')
    if fog:
        js += f'tl.fromTo("#{p}-fog",{{x:-80}},{{x:80,duration:{D:.2f},ease:"none"}},0);\n'
    if moon:
        js += f'tl.from("#{p}-moon",{{scale:.5,opacity:0,duration:1,ease:"power2.out"}},0.1);\n'
    return js

def head(p, at=0.1):
    return (f'tl.from("#{p}-chip",{{opacity:0,y:-40,duration:.4,ease:"back.out(2)"}},{at});\n'
            f'tl.from("#{p}-title",{{opacity:0,scale:1.5,rotation:-4,duration:.5,ease:"back.out(1.6)"}},{at + .15});\n')

def bob(sel, D, start, amp=-24, per=.45, rot=0):
    n = max(1, int((D - start - .2) / per) - 1)
    extra = f',rotation:{rot}' if rot else ''
    return f'tl.to("{sel}",{{y:"+={amp}"{extra},duration:{per},yoyo:true,repeat:{n},ease:"sine.inOut"}},{start});\n'

M = {}
D = DUR['01-noche']
M['01-noche'] = ambient('f01', D, spiders=2, bats=3, moon=True) + f'''
tl.fromTo("#f01-flash",{{opacity:.9}},{{opacity:0,duration:.18,ease:"none"}},0);
tl.fromTo("#f01-flash",{{opacity:.7}},{{opacity:0,duration:.3,ease:"none",immediateRender:false}},0.32);
tl.from("#f01-k1",{{opacity:0,y:-60,duration:.4,ease:"power3.out"}},0.5);
tl.from("#f01-num",{{opacity:0,scale:3,duration:.5,ease:"back.out(1.6)"}},0.8);
tl.from("#f01-k2",{{opacity:0,y:80,duration:.5,ease:"power3.out"}},1.2);
tl.to("#f01-num",{{rotation:6,duration:.08,yoyo:true,repeat:9,ease:"none"}},2.0);
tl.from("#f01-peek img",{{y:420,duration:.55,ease:"back.out(1.7)",stagger:.12}},1.5);
tl.to("#f01-peek img",{{y:-26,duration:.4,yoyo:true,repeat:{int((D-2.3)/.4)},ease:"sine.inOut",stagger:.1}},2.3);
tl.fromTo("#f01-glow",{{scale:.8,opacity:.5}},{{scale:1.15,opacity:1,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
'''
D = DUR['02-bruja']
M['02-bruja'] = ambient('f02', D, spiders=1, bats=2, moon=True) + head('f02') + f'''
tl.from("#f02-witch",{{x:760,y:-420,rotation:25,duration:.8,ease:"power3.out"}},0.3);
{bob("#f02-witch", D, 1.1, -34, .55, -4)}
tl.from("#f02-cal",{{scale:0,rotation:-20,duration:.55,ease:"back.out(2)"}},0.9);
tl.from(".f02-fl",{{scale:0,transformOrigin:"50% 100%",duration:.35,ease:"back.out(3)",stagger:.1}},1.3);
tl.to(".f02-fl",{{scaleY:1.18,scaleX:.9,transformOrigin:"50% 100%",duration:.16,yoyo:true,repeat:{int((D-1.7)/.16)-1},ease:"sine.inOut",stagger:.05}},1.7);
tl.from("#f02-clock",{{opacity:0,x:-300,duration:.45,ease:"power3.out"}},1.8);
tl.to("#f02-clock",{{x:10,duration:.05,yoyo:true,repeat:{int((D-2.6)/.05)-1},ease:"none"}},2.6);
tl.fromTo("#f02-glow",{{scale:.85}},{{scale:1.2,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
'''
D = DUR['03-vampiro']
M['03-vampiro'] = ambient('f03', D, spiders=1, bats=2) + head('f03') + f'''
tl.from("#f03-vamp",{{x:700,rotation:12,duration:.7,ease:"power3.out"}},0.3);
tl.from("#f03-hg",{{scale:.2,opacity:0,rotation:-30,duration:.55,ease:"back.out(2)"}},0.7);
tl.from("#f03-straw",{{scaleX:0,transformOrigin:"100% 50%",duration:.45,ease:"power2.out"}},1.2);
tl.to("#f03-sandtop",{{scaleY:.12,transformOrigin:"50% 100%",duration:{D-1.8:.2f},ease:"none"}},1.6);
tl.from("#f03-sandbot",{{scaleY:.2,transformOrigin:"50% 100%",duration:{D-1.8:.2f},ease:"none"}},1.6);
tl.to("#f03-vamp",{{scale:1.04,transformOrigin:"30% 40%",duration:.25,yoyo:true,repeat:{int((D-1.6)/.25)-1},ease:"sine.inOut"}},1.6);
tl.from("#f03-count",{{opacity:0,y:120,duration:.45,ease:"back.out(1.8)"}},1.8);
const f03o={{v:0}};
tl.to(f03o,{{v:8,duration:2,ease:"power1.out",onUpdate:()=>{{document.querySelector("#f03-num").textContent="−"+Math.round(f03o.v)+" h";}}}},2.0);
tl.fromTo("#f03-glow",{{scale:.85}},{{scale:1.2,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
'''
D = DUR['04-ladron']
M['04-ladron'] = ambient('f04', D, spiders=1, bats=1) + head('f04') + f'''
tl.from("#f04-tbl",{{y:300,opacity:0,duration:.6,ease:"power3.out"}},0.3);
tl.from("#f04-pirate",{{x:-900,rotation:-15,duration:.7,ease:"power3.out"}},0.7);
tl.from("#f04-photo",{{x:250,y:620,rotation:0,scale:.6,duration:.6,ease:"power2.inOut"}},1.4);
{bob("#f04-pirate, #f04-photo", D, 2.0, -30, .3)}
tl.from("#f04-empty",{{opacity:0,y:40,duration:.5}},3.0);
tl.to("#f04-pirate, #f04-photo",{{x:"+=1100",rotation:12,duration:.8,ease:"power2.in"}},{D-1.1:.2f});
tl.fromTo("#f04-glow",{{opacity:1}},{{opacity:.35,duration:{D:.2f},ease:"none"}},0);
'''
D = DUR['05-momias']
M['05-momias'] = ambient('f05', D, spiders=2, bats=1) + head('f05') + f'''
const f05in=[[-700,-300,-200],[700,-200,160],[700,300,-140],[-700,200,180],[0,-800,90]];
f05in.forEach((a,i)=>{{tl.from("#f05-d"+i,{{x:a[0],y:a[1],rotation:a[2],opacity:0,duration:.6,ease:"power3.out"}},0.3+i*.15);}});
tl.from("#f05-m2",{{x:800,rotation:360,duration:.9,ease:"power2.out"}},0.5);
tl.from("#f05-m1",{{x:-800,rotation:-25,duration:.8,ease:"power3.out"}},0.8);
tl.to(".f05-doc",{{y:"-=24",rotation:"+=6",duration:.5,yoyo:true,repeat:{int((D-1.4)/.5)-1},ease:"sine.inOut",stagger:.08}},1.4);
tl.to("#f05-m1",{{rotation:6,duration:.35,yoyo:true,repeat:{int((D-1.7)/.35)-1},ease:"sine.inOut"}},1.7);
tl.to("#f05-m2",{{rotation:-8,y:-20,duration:.4,yoyo:true,repeat:{int((D-1.5)/.4)-1},ease:"sine.inOut"}},1.5);
'''
D = DUR['06-fantasma']
M['06-fantasma'] = ambient('f06', D, spiders=1, bats=1, moon=True) + head('f06') + f'''
tl.from("#f06-list",{{x:-700,duration:.6,ease:"power3.out"}},0.3);
tl.from("#f06-ghost",{{opacity:0,y:140,scale:.6,duration:.7,ease:"back.out(1.6)"}},0.6);
{bob("#f06-ghost", D, 1.3, -40, .6)}
tl.to("#f06-a1, #f06-a2, #f06-a4",{{opacity:.12,x:30,filter:"blur(3px)",duration:.4,stagger:.35,ease:"power1.in"}},1.4);
tl.from("#f06-vs > div",{{opacity:0,scale:.4,duration:.45,ease:"back.out(2)",stagger:.3}},2.6);
tl.to("#f06-vs > div:last-child",{{x:8,duration:.05,yoyo:true,repeat:{int((D-3.6)/.05)-1},ease:"none"}},3.6);
tl.fromTo("#f06-glow",{{scale:.85}},{{scale:1.2,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
'''
D = DUR['07-pascal']
M['07-pascal'] = ambient('f07', D, fog=False) + f'''
tl.fromTo("#f07-flash",{{opacity:1}},{{opacity:0,duration:.25,ease:"none"}},0);
tl.fromTo("#f07-flash",{{opacity:.8}},{{opacity:0,duration:.35,ease:"none",immediateRender:false}},0.4);
tl.from("#f07-rays",{{scale:.3,opacity:0,duration:.8,ease:"power2.out"}},0.2);
tl.to("#f07-rays",{{rotation:40,duration:{D:.2f},ease:"none"}},0);
tl.from(".f07-smk",{{scale:.2,opacity:0,duration:.35,ease:"power2.out",stagger:.05}},0.2);
tl.to(".f07-smk",{{scale:1.8,opacity:0,duration:1.4,ease:"power1.out",stagger:.05}},0.6);
tl.from("#f07-pascal-img",{{scale:.15,opacity:0,y:300,transformOrigin:"50% 100%",duration:.7,ease:"back.out(1.6)"}},0.35);
tl.from(`[id^="f07-k"]`,{{scale:0,rotation:-180,duration:.5,ease:"back.out(3)",stagger:.1}},0.7);
tl.to(`[id^="f07-k"]`,{{scale:.55,rotation:"+=45",duration:.35,yoyo:true,repeat:{int((D-1.4)/.35)-1},ease:"sine.inOut",stagger:.07}},1.4);
tl.from("#f07-abra",{{opacity:0,scale:2.6,duration:.45,ease:"back.out(1.6)"}},0.5);
tl.from("#f07-name",{{opacity:0,y:60,duration:.5,ease:"power3.out"}},1.3);
{bob("#f07-pascal-img", D, 1.2, -16, .5)}
tl.fromTo("#f07-glow",{{scale:.8,opacity:.6}},{{scale:1.2,opacity:1,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
'''
D = DUR['08-cuenta']
M['08-cuenta'] = ambient('f08', D, fog=False, webs=1) + head('f08') + f'''
tl.from("#f08-wiz",{{x:-600,duration:.6,ease:"power3.out"}},0.3);
tl.from("#f08-phone",{{y:900,rotation:8,duration:.7,ease:"power3.out"}},0.7);
tl.from(`[id^="f08-k"]`,{{scale:0,opacity:0,duration:.3,ease:"back.out(3)",stagger:.12}},1.1);
tl.to(`[id^="f08-k"]`,{{x:"+=40",y:"-=60",scale:.5,duration:.4,yoyo:true,repeat:{int((D-1.6)/.4)-1},ease:"sine.inOut",stagger:.1}},1.6);
["#f08-m1","#f08-m2","#f08-m3","#f08-m4"].forEach((s,i)=>{{tl.from(s,{{opacity:0,scale:.6,y:30,duration:.4,ease:"back.out(2)",transformOrigin:i%2?"left bottom":"right bottom"}},1.4+i*.6);}});
tl.from("#f08-folder",{{scale:0,rotation:-10,duration:.55,ease:"back.out(2.2)"}},4.0);
tl.to("#f08-folder",{{scale:1.06,duration:.3,yoyo:true,repeat:{int((D-4.6)/.3)-1},ease:"sine.inOut"}},4.6);
{bob("#f08-wiz", D, 1.0, -14, .5)}
'''
D = DUR['09-estres']
M['09-estres'] = ambient('f09', D) + head('f09') + f'''
tl.from("#f09-gauge",{{scale:.6,opacity:0,duration:.5,ease:"back.out(1.8)"}},0.3);
tl.fromTo("#f09-needle",{{rotation:62,svgOrigin:"400 420"}},{{rotation:-62,svgOrigin:"400 420",duration:1.5,ease:"back.inOut(1.4)"}},1.1);
tl.to("#f09-needle",{{rotation:58,svgOrigin:"400 420",duration:.07,yoyo:true,repeat:7,ease:"none"}},0.4);
tl.from("#f09-lab",{{opacity:0,scale:.5,duration:.4,ease:"back.out(2)"}},2.2);
tl.from("#f09-cal",{{x:-500,duration:.5,ease:"power3.out"}},1.4);
tl.from("#f09-vamp",{{x:600,duration:.6,ease:"power3.out"}},1.8);
tl.from("#f09-back",{{scale:0,duration:.45,ease:"back.out(2.5)"}},2.6);
{bob("#f09-vamp", D, 2.4, -26, .4)}
'''
D = DUR['10-familia']
M['10-familia'] = ambient('f10', D, fog=False) + head('f10') + f'''
tl.from("#f10-tbl",{{y:300,opacity:0,duration:.5,ease:"power3.out"}},0.3);
tl.from(".f10-tbl-p",{{y:120,opacity:0,duration:.4,ease:"back.out(2)",stagger:.12}},0.7);
tl.from("#f10-pirate",{{x:-600,duration:.6,ease:"power3.out"}},1.1);
tl.from("#f10-photo",{{x:-420,y:80,rotation:-30,scale:.5,duration:.7,ease:"power2.out"}},1.6);
tl.from("#f10-witch, #f10-ghost, #f10-mummy, #f10-vamp",{{y:520,duration:.5,ease:"back.out(1.6)",stagger:.12}},2.0);
tl.to("#f10-witch, #f10-ghost, #f10-mummy, #f10-vamp",{{y:-46,rotation:8,duration:.32,yoyo:true,repeat:{int((D-2.7)/.32)-1},ease:"sine.inOut",stagger:.08}},2.7);
tl.to(".f10-tbl-p",{{y:-10,duration:.4,yoyo:true,repeat:{int((D-1.4)/.4)-1},ease:"sine.inOut",stagger:.1}},1.4);
{bob("#f10-pirate", D, 1.8, -20, .4)}
'''
D = DUR['11-cierre']
M['11-cierre'] = ambient('f11', D, spiders=3, bats=1) + f'''
tl.from("#f11-k",{{opacity:0,y:-60,duration:.5,ease:"power3.out"}},0.1);
tl.from("#f11-wiz",{{x:-700,duration:.6,ease:"power3.out"}},0.3);
tl.from("#f11-qr",{{scale:.4,opacity:0,rotation:-8,duration:.6,ease:"back.out(1.8)"}},0.7);
tl.from("#f11-brand",{{opacity:0,y:50,duration:.5,ease:"power3.out"}},1.3);
tl.from("#f11-happy",{{opacity:0,scale:1.8,duration:.5,ease:"back.out(1.6)"}},2.0);
tl.to("#f11-wiz",{{rotation:5,transformOrigin:"50% 100%",duration:.5,yoyo:true,repeat:1,ease:"sine.inOut"}},2.6);
tl.to("#f11-happy",{{rotation:2,duration:.25,yoyo:true,repeat:{int((D-3)/.25)-1},ease:"sine.inOut"}},3.0);
tl.fromTo("#f11-glow",{{scale:.85}},{{scale:1.15,duration:{D/2:.2f},yoyo:true,repeat:1,ease:"sine.inOut"}},0);
'''
json.dump(M, open(os.path.join(ROOT, 'tools', 'motion.json'), 'w'), ensure_ascii=False, indent=0)
print('motion', len(M))
