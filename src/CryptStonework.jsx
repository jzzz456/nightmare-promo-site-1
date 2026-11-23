import { BoxGeometry, Color, ConeGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry, Object3D, TorusGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Bake stationary masonry and props together so each alcove takes one draw call.
const cache = new Map();
function stonework(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const pieces = [];
  const add = (geometry, at, scale, color, rotation = [0,0,0]) => {
    const pose = new Object3D();
    pose.position.set(...at); pose.rotation.set(...rotation); pose.scale.set(...scale); pose.updateMatrix();
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    g.applyMatrix4(pose.matrix);
    const rgb = new Color(color), colors = [];
    for(let i=0;i<g.attributes.position.count;i++) colors.push(rgb.r,rgb.g,rgb.b);
    g.setAttribute('color',new Float32BufferAttribute(colors,3)); pieces.push(g);
  };
  const box=(x,y,z,w,h,d,c,rz=0)=>add(new BoxGeometry(),[x,y,z],[w,h,d],c,[0,0,rz]);
  const rock=(x,y,z,w,h,d,c)=>add(new IcosahedronGeometry(1,1),[x,y,z],[w,h,d],c);
  const ring=(x,y,z,r,c)=>add(new TorusGeometry(r,.016,5,12),[x,y,z],[1,1.25,1],c);
  const bone='#ceba9d', shadow='#201924', stone='#514653', edge='#897781', iron='#41333e';
  const skull=(x,y,z,s)=>{
    rock(x,y+.18*s,z,.22*s,.23*s,.18*s,bone);
    box(x,y-.015*s,z+.06*s,.24*s,.09*s,.16*s,'#ab947f');
    for(const side of [-1,1]){
      rock(x+side*.087*s,y+.17*s,z+.15*s,.065*s,.064*s,.034*s,shadow);
      box(x+side*.055*s,y+.026*s,z+.15*s,.047*s,.068*s,.034*s,'#e1cdb0');
    }
    rock(x,y+.084*s,z+.174*s,.028*s,.043*s,.018*s,'#45343a');
  };
  if(kind==='arch'){
    for(const s of [-1,1]){
      box(s*2.98,.17,0,.58,.34,.73,edge);
      box(s*2.98,1.55,0,.39,2.5,.54,stone);
      box(s*2.98,2.83,0,.6,.18,.7,edge);
      const pts=[[2.98,2.93],[2.78,3.21],[2.28,3.45],[1.58,3.65],[.78,3.84],[0,4.09]];
      for(let i=1;i<pts.length;i++){
        const [x,y]=pts[i-1],[u,v]=pts[i];
        box(s*(x+u)/2,(y+v)/2,0,Math.hypot(u-x,v-y)+.02,.20,.49,i%2?stone:edge,Math.atan2(v-y,s*(u-x)));
      }
    }
    rock(0,3.98,.03,.21,.24,.32,'#776473');
  }else if(kind==='brazier'){
    box(0,.12,0,.7,.24,.64,stone);
    add(new CylinderGeometry(.13,.24,.75,8),[0,.58,0],[1,1,1],iron);
    add(new CylinderGeometry(.36,.14,.28,10),[0,1.04,0],[1,1,1],'#9a6753');
    for(const [x,y,z,h] of [[-.12,1.33,0,.52],[.08,1.45,-.04,.72],[.13,1.31,.08,.41],[0,1.28,.13,.34]]){
      add(new ConeGeometry(.105,h,5),[x,y,z],[1,1,1],z>.1?'#ffe2a0':'#fa874b',[0,0,x]);
    }
  }else if(kind==='reliquary'){
    box(0,.32,0,1.18,.64,.62,stone);box(0,.67,0,1.31,.12,.73,edge);
    skull(-.32,.81,.03,.86);skull(.17,.80,.09,1.04);skull(.48,.77,-.11,.60);
    box(-.12,.13,.54,.53,.07,.07,bone,.17);
  }else if(kind==='prisoner'){
    for(const s of [-1,1]){
      for(let i=0;i<7;i++) ring(s*.5,2.82-i*.115,.03,.052,iron);
      box(s*.38,1.91,.09,.077,.52,.09,bone,-s*.54);
      box(s*.19,1.68,.12,.35,.07,.10,bone,s*.35);
      box(s*.13,.96,.10,.09,.46,.10,bone,s*.13);
      box(s*.17,.52,.09,.068,.43,.08,bone,-s*.18);
      for(let j=0;j<4;j++)box(s*.095,1.61-j*.086,.14,.22-j*.024,.043,.085,bone,s*.23);
    }
    box(0,1.48,.06,.068,.52,.10,bone);rock(0,1.19,.09,.19,.10,.10,bone);skull(0,1.78,.10,1);
  }
  const result=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());cache.set(kind,result);return result;
}
export function CryptProp({kind,at,turn=0,scale=1}){
  return <group position={at} rotation={[0,turn,0]} scale={scale}><mesh geometry={stonework(kind)} dispose={null}><meshStandardMaterial vertexColors roughness={.9}/></mesh></group>;
}
