const VISUALS = Object.freeze({
  '金酒':['#e8dfc8',.94,0,.04], '伏特加':['#e8dfc8',.95,0,.02], '白朗姆':['#eadfca',.95,0,.05], '黑朗姆':['#6b321c',1.02,0,.75],
  '龙舌兰':['#e9dfc8',.95,0,.04], '威士忌':['#b96b2f',.95,0,.72], '甜味美思':['#8d302e',1.05,0,.70], '干味美思':['#d6ad58',.99,0,.30],
  '金巴利':['#d9343a',1.10,0,.95], '橙皮利口酒':['#e6a536',1.12,0,.62], '咖啡利口酒':['#32170f',1.14,.45,.95], '苦艾酒':['#67a95e',.90,.12,.75],
  '清酒':['#e8dfcf',.99,.08,.08], '啤酒':['#d8a72d',1.01,.08,.55], '红葡萄酒':['#702c3a',.99,0,.92], '汤力水':['#e8dfc8',1,0,.02],
  '苏打水':['#e8dfc8',1,0,.01], '可乐':['#2c1710',1.10,0,.92], '青柠汁':['#bdcf69',1.03,.55,.58], '柠檬汁':['#ead16b',1.03,.38,.48],
  '糖浆':['#e4d1aa',1.26,0,.08], '浓缩咖啡':['#24110c',1.04,.92,1], '水':['#e8dfc8',1,0,.01], '冰':['#e8dfc8',.92,0,0],
  '椰奶':['#f1eadc',1.02,1,.90], '绿薄荷利口酒':['#36c76a',1.10,0,.92], '蓝橙利口酒':['#188bd1',1.11,0,.96], '蝶豆花':['#315ac4',1,.18,.94]
});
const clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,Number(n)||0));
const hexRgb=hex=>{const n=parseInt(String(hex).slice(1),16);return[(n>>16)/255,((n>>8)&255)/255,(n&255)/255]};
const lin=x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4;
const gamma=x=>x<=.0031308?12.92*x:1.055*Math.pow(x,1/2.4)-.055;
function toLab(hex){const q=hexRgb(hex).map(lin),l=Math.cbrt(.4122214708*q[0]+.5363325363*q[1]+.0514459929*q[2]),m=Math.cbrt(.2119034982*q[0]+.6806995451*q[1]+.1073969566*q[2]),s=Math.cbrt(.0883024619*q[0]+.2817188376*q[1]+.6299787005*q[2]);return[.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s]}
function fromLab([L,a,b]){const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3,rgb=[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];return'#'+rgb.map(x=>Math.round(clamp(gamma(x))*255).toString(16).padStart(2,'0')).join('')}
function interpolate(a,b,t){const x=toLab(a),y=toLab(b);return fromLab(x.map((v,i)=>v+(y[i]-v)*clamp(t)))}
const clean=parts=>(parts||[]).filter(p=>p&&p.id!=='冰'&&Number(p.volume)>0);
export function ingredientVisual(id){const v=VISUALS[id]||['#a09488',1,0,.4];return{color:v[0],density:v[1],turbidity:v[2],tint:v[3]}}
export function butterflyColor(parts){const ps=clean(parts),pea=ps.reduce((n,p)=>n+(p.id==='蝶豆花'?+p.volume:0),0);if(!pea)return null;const acid=ps.reduce((n,p)=>n+(p.id==='青柠汁'?+p.volume:p.id==='柠檬汁'?+p.volume*.8:0),0),ratio=acid/Math.max(pea,1);return ratio<=.35?interpolate('#315ac4','#7040ad',ratio/.35):interpolate('#7040ad','#df5a92',(ratio-.35)/.65)}
export function mixColor(parts){const ps=clean(parts),reactive=butterflyColor(ps),weighted=[];let total=0;for(const p of ps){const v=ingredientVisual(p.id);if(reactive&&(p.id==='青柠汁'||p.id==='柠檬汁'))continue;const w=+p.volume*v.tint;if(w<=0)continue;weighted.push([toLab(p.id==='蝶豆花'&&reactive?reactive:v.color),w]);total+=w}if(!total)return'#e8dfc8';return fromLab([0,1,2].map(i=>weighted.reduce((n,x)=>n+x[0][i]*x[1],0)/total))}
export function turbidityStrength(parts){const ps=clean(parts),total=ps.reduce((n,p)=>n+(+p.volume),0);return total?clamp(ps.reduce((n,p)=>n+(+p.volume)*ingredientVisual(p.id).turbidity,0)/total):0}
export function layers(parts){const sorted=clean(parts).map(p=>({id:p.id,volume:+p.volume,...ingredientVisual(p.id)})).sort((a,b)=>b.density-a.density),groups=[];for(const p of sorted){const g=groups.at(-1);if(!g||g.maxDensity-p.density>=.15)groups.push({parts:[p],volume:p.volume,density:p.density,maxDensity:p.density});else{const volume=g.volume+p.volume;g.density=(g.density*g.volume+p.density*p.volume)/volume;g.volume=volume;g.parts.push(p)}}return groups.map(g=>({color:mixColor(g.parts),ml:g.volume,density:g.density,turbidity:turbidityStrength(g.parts)}))}
export function visualFor(parts,method){const ps=clean(parts),mixed=method==='shake'||method==='stir',ml=ps.reduce((n,p)=>n+(+p.volume),0);return{layers:mixed?[{color:mixColor(ps),ml,turbidity:turbidityStrength(ps)}]:layers(ps),turbidity:turbidityStrength(ps),mixed}}
export function visualAfterMix(parts,mixedSnapshot){
  const ps=clean(parts),snapshot=new Map(clean(mixedSnapshot).map(p=>[p.id,+p.volume])),base=[],added=[];
  for(const p of ps){const mixed=Math.min(+p.volume,snapshot.get(p.id)||0);if(mixed>0)base.push({id:p.id,volume:mixed});if(+p.volume-mixed>0)added.push({id:p.id,volume:+p.volume-mixed})}
  if(!base.length)return visualFor(ps,'');
  const baseMl=base.reduce((n,p)=>n+p.volume,0),baseDensity=base.reduce((n,p)=>n+p.volume*ingredientVisual(p.id).density,0)/baseMl;
  const baseLayer={color:mixColor(base),ml:baseMl,density:baseDensity,turbidity:turbidityStrength(base),mixed:true};
  const out=[baseLayer,...layers(added)].sort((a,b)=>b.density-a.density);
  return{layers:out,turbidity:turbidityStrength(ps),mixed:added.length===0};
}
export const visualTable=VISUALS;
