# Seek-safe GSAP motion per scene; written to tools/motion.json and inlined by build_frames.py
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, 'tools', 'timing.json')))
NAMES = ['01-gancho', '02-etapas', '03-whatsappiens', '04-linea', '05-cierre']
DUR = dict(zip(NAMES, T['dur']))
STEP = T.get("step", 2.0)  # seconds per stage in scene 02

def reps(D, start, per):
    return max(1, int((D - start - .1) / per) - 1)

M = {}
D = DUR['01-gancho']
M['01-gancho'] = f'''
tl.from("#f01-hero",{{y:500,duration:.45,ease:"back.out(1.6)"}},0);
tl.to("#f01-hero",{{x:10,duration:.05,yoyo:true,repeat:{reps(D, 2.2, .05)},ease:"none"}},2.2);
tl.from("#f01-c1",{{opacity:0,y:-40,scale:.9,duration:.35,ease:"back.out(2)"}},.05);
tl.from("#f01-c2",{{opacity:0,scale:1.6,duration:.3,ease:"back.out(2.5)"}},2.1);
'''
D = DUR['02-etapas']
js = ''
for i in range(5):
    t0 = i * STEP
    if i: js += f'tl.from("#f02-bg{i}",{{opacity:0,duration:.25,ease:"none"}},{t0:.2f});\n'
    js += (f'tl.fromTo("#f02-h{i}",{{x:-900,opacity:1}},{{x:0,opacity:1,duration:.35,ease:"power3.out",immediateRender:false}},{t0:.2f});\n'
           f'tl.to("#f02-h{i}",{{y:-18,duration:.25,yoyo:true,repeat:5,ease:"sine.inOut"}},{t0 + .35:.2f});\n'
           f'tl.to("#f02-h{i}",{{x:1000,duration:.3,ease:"power2.in"}},{t0 + STEP - .3:.2f});\n'
           f'tl.fromTo("#f02-t{i}, #f02-c{i}, #f02-y{i}",{{opacity:1,scale:.6}},{{opacity:1,scale:1,duration:.3,ease:"back.out(2.4)",immediateRender:false,stagger:.05}},{t0 + .08:.2f});\n'
           f'tl.to("#f02-t{i}, #f02-c{i}, #f02-y{i}",{{opacity:0,duration:.15}},{t0 + STEP - .2:.2f});\n'
           f'tl.to("#f02-b{i + 1}",{{backgroundColor:"rgba(255,255,255,.92)",borderColor:"#111111",duration:.2}},{t0 + .1:.2f});\n'
           f'tl.to("#f02-b{i + 1} b",{{color:"#111111",textShadow:"0 0 0 rgba(0,0,0,0)",duration:.2}},{t0 + .1:.2f});\n'
           f'tl.fromTo("#f02-b{i + 1}",{{scale:1.18}},{{scale:1,duration:.35,ease:"back.out(3)",immediateRender:false}},{t0 + .1:.2f});\n')
js += f'''tl.fromTo("#f02-dino, #f02-dlab",{{x:420,opacity:1}},{{x:0,opacity:1,duration:.35,ease:"back.out(1.6)",immediateRender:false}},{3 * STEP + .4:.2f});
tl.to("#f02-dino, #f02-dlab",{{x:420,duration:.25,ease:"power2.in"}},{4 * STEP - .35:.2f});
tl.fromTo("#f02-then",{{opacity:1,scale:.5}},{{opacity:1,scale:1,duration:.3,ease:"back.out(2.4)",immediateRender:false}},{5 * STEP + .05:.2f});
tl.fromTo("#f02-met",{{x:260,y:-120,scale:.5}},{{x:-560,y:1500,scale:1.4,duration:1.4,ease:"power2.in"}},{5 * STEP + .25:.2f});
tl.to("#f02-met img",{{rotation:-300,duration:1.6,ease:"none"}},{5 * STEP + .2:.2f});
tl.to("#f02-flash",{{opacity:1,duration:.2,ease:"power2.in"}},{D - .3:.2f});
'''
M['02-etapas'] = js
D = DUR['03-whatsappiens']
M['03-whatsappiens'] = f'''
tl.to("#f03-white",{{opacity:0,duration:.35,ease:"power1.out"}},0);
tl.from("#f03-hero",{{y:400,scale:.8,duration:.55,ease:"back.out(1.6)"}},.05);
tl.from("#f03-t, #f03-c, #f03-sub",{{opacity:0,scale:.6,duration:.3,ease:"back.out(2.4)",stagger:.08}},.2);
''' + ''.join(f'tl.from("#f03-m{i}",{{opacity:0,scale:.6,y:30,duration:.35,ease:"back.out(2)",transformOrigin:"{"right" if i == 1 else "left"} bottom"}},{0.8 + (i - 1) * 0.65:.2f});\n' for i in (1, 2, 3)) + f'''
tl.to("#f03-b6",{{scale:1.12,duration:.3,yoyo:true,repeat:{reps(D, .6, .3)},ease:"sine.inOut"}},.6);
tl.to("#f03-hero",{{y:-14,duration:.4,yoyo:true,repeat:{reps(D, .7, .4)},ease:"sine.inOut"}},.7);
'''
D = DUR['04-linea']
M['04-linea'] = f'''
tl.from("#f04-title",{{opacity:0,y:-60,duration:.4,ease:"back.out(2)"}},0);
tl.from("#f04-line",{{opacity:0,scale:1.2,duration:.5,ease:"power3.out"}},.1);
tl.from("#f04-nums b",{{opacity:0,y:40,duration:.25,ease:"back.out(2.5)",stagger:.07}},.4);
tl.from("#f04-ring",{{opacity:0,scale:1.4,duration:.35,ease:"back.out(2)"}},1.0);
tl.to("#f04-ring",{{scale:1.05,duration:.3,yoyo:true,repeat:{reps(D, 1.4, .3)},ease:"sine.inOut"}},1.4);
tl.from("#f04-sub",{{opacity:0,y:30,duration:.35}},1.2);
'''
D = DUR['05-cierre']
M['05-cierre'] = f'''
tl.from("#f05-q",{{opacity:0,scale:.7,duration:.35,ease:"back.out(2.4)"}},0);
tl.from("#f05-row > div",{{opacity:0,y:60,duration:.3,ease:"back.out(2)",stagger:.07}},.25);
tl.to("#f05-r6",{{scale:1.08,duration:.3,yoyo:true,repeat:{reps(D, 1.0, .3)},ease:"sine.inOut"}},1.0);
tl.from("#f05-com",{{opacity:0,y:30,duration:.3}},.7);
tl.from("#f05-qr",{{opacity:0,scale:.6,duration:.4,ease:"back.out(2)"}},.9);
tl.from("#f05-brand, #f05-by",{{opacity:0,y:30,duration:.35,stagger:.1}},1.3);
'''
json.dump(M, open(os.path.join(ROOT, 'tools', 'motion.json'), 'w'), ensure_ascii=False, indent=0)
print('motion', len(M))
