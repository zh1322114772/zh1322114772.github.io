import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Reflector} from 'three/addons/objects/Reflector.js';

const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.10;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#687873');scene.fog=new THREE.Fog(0x687873,18,48);
const pmrem=new THREE.PMREMGenerator(renderer);const envScene=new RoomEnvironment();
const env=pmrem.fromScene(envScene,.05);scene.environment=env.texture;scene.environmentIntensity=.42;
envScene.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.035,150);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.15;controls.maxDistance=40;
const hemi=new THREE.HemisphereLight(0xdce9e5,0x3b4539,.78);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffd09c,3.5);sun.position.set(-4,7,9);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.1,far:35});sun.shadow.normalBias=.018;sun.shadow.bias=-.0002;scene.add(sun);
for(const [x,y,z,p] of [[-1.6,2.55,1.7,16],[2.75,2.55,1.4,12],[-.1,2.55,-2,13],[2.85,2.55,-2.2,16],[-3.18,2.2,-3.1,10]]){
  const light=new THREE.PointLight(0xffdfa8,p,8,2);light.position.set(x,y,z);
  light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.near=.05;light.shadow.camera.far=8;light.shadow.bias=-.0015;light.shadow.normalBias=.015;
  scene.add(light);
}
const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:0x697063,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.265;floor.receiveShadow=true;scene.add(floor);
const keys=new Set();let lastMoveTime=performance.now();
const moveKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
addEventListener('keydown',e=>{if(moveKeys.has(e.code)){keys.add(e.code);e.preventDefault();}});addEventListener('keyup',e=>keys.delete(e.code));
function moveCamera(dt){const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<1e-6)return;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,camera.up).normalize();const direction=new THREE.Vector3();if(keys.has('KeyW')||keys.has('ArrowUp'))direction.add(forward);if(keys.has('KeyS')||keys.has('ArrowDown'))direction.sub(forward);if(keys.has('KeyD')||keys.has('ArrowRight'))direction.add(right);if(keys.has('KeyA')||keys.has('ArrowLeft'))direction.sub(right);if(direction.lengthSq()) {direction.normalize().multiplyScalar((keys.has('ShiftLeft')||keys.has('ShiftRight')?6.5:3.2)*dt);camera.position.add(direction);controls.target.add(direction);}}
const presets={
 exterior:{pos:[14,10,18],target:[0,1.2,0],fov:46},
 living:{pos:[-3.62,1.52,3.42],target:[.64,1.22,1.85],fov:64},
 reverse:{pos:[.70,1.58,.18],target:[-3.9,.85,1.85],fov:62},
 bedroom:{pos:[4.20,1.72,3.45],target:[3.0,.80,2.10],fov:68},
 bathroom:{pos:[2.60,1.66,-1.08],target:[2.90,1.05,-3.30],fov:76},
 kitchen:{pos:[-1.6,1.57,-.64],target:[-3.18,1,-3.4],fov:68},
 plan:{pos:[10,18,12],target:[0,.6,0],fov:47},
 calendar:{pos:[-.10,1.75,.25],target:[1.02,1.70,-.51],fov:39},
 fan:{pos:[-2.35,1.05,1.30],target:[-3.80,.77,.19],fov:53},
 fanhead:{pos:[-3.0,1.42,.70],target:[-3.81,1.23,.17],fov:40},
 washboard:{pos:[2.20,1.12,-1.00],target:[2.50,.20,-1.46],fov:43},
 jars:{pos:[-2.45,1.87,-2.73],target:[-1.97,1.57,-3.57],fov:42},
 kitchentap:{pos:[-3.30,1.49,-2.93],target:[-3.82,1.12,-3.51],fov:36},
 bathtap:{pos:[2.14,1.35,-2.85],target:[1.68,1.08,-3.50],fov:39},
 vases:{pos:[-.10,1.53,1.23],target:[.65,1.47,1.08],fov:42},
 wooddetail:{pos:[-2.9,1.28,2.18],target:[-4.03,.92,1.71],fov:39},
};
const detailViews=await fetch('./detail_views.json').then(r=>r.json());
const detailGroup=document.createElement('optgroup');detailGroup.label='本轮逐件审核';
for(const v of detailViews){
 const key='audit_'+v.id;const convert=([x,y,z])=>[x,z,-y];
 presets[key]={pos:convert(v.pos),target:convert(v.target),fov:v.fov};
 const option=document.createElement('option');option.value=key;option.textContent=v.label;detailGroup.appendChild(option);
}
document.querySelector('#details').appendChild(detailGroup);
let model,roofHidden=false;
function setRoof(hidden){if(roofHidden!==hidden)renderer.shadowMap.needsUpdate=true;roofHidden=hidden;model?.traverse(o=>{if(o.userData.removable)o.visible=!hidden;});document.querySelector('#roof').textContent=hidden?'显示屋顶':'隐藏屋顶';}
function view(name){const p=presets[name];camera.position.fromArray(p.pos);controls.target.fromArray(p.target);camera.fov=p.fov;camera.updateProjectionMatrix();setRoof(name==='plan');controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
document.querySelector('#roof').addEventListener('click',()=>setRoof(!roofHidden));
document.querySelector('#details').addEventListener('change',e=>{if(e.target.value)view(e.target.value);});
let normalEnabled=true,normalMaterials=[];
function setNormals(enabled){
 normalEnabled=enabled;
 for(const m of normalMaterials){
   if(!m.userData.originalNormalScale)m.userData.originalNormalScale=m.normalScale.clone();
   m.normalScale.copy(m.userData.originalNormalScale).multiplyScalar(enabled?1:0);
   if(m.clearcoatNormalMap){
     if(!m.userData.originalCoatNormalScale)m.userData.originalCoatNormalScale=m.clearcoatNormalScale.clone();
     m.clearcoatNormalScale.copy(m.userData.originalCoatNormalScale).multiplyScalar(enabled?1:0);
   }
 }
 document.querySelector('#normals').textContent=enabled?'法线：开启':'法线：关闭（对比）';
}
document.querySelector('#normals').addEventListener('click',()=>setNormals(!normalEnabled));
view('exterior');
const status=document.querySelector('#status');
try{
  const query=new URLSearchParams(location.search);const asset=query.get('quality')==='full'?'chinese_home_v2.glb':'chinese_home_v2_web.glb';
  const gltf=await new GLTFLoader().loadAsync(asset+'?rev=surface-finish-4',e=>{if(e.total)status.textContent=`正在读取模型与贴图… ${Math.round(e.loaded/e.total*100)}%`;});
  model=gltf.scene;scene.add(model);
  let meshes=0;const mats=new Set();
  model.traverse(o=>{if(!o.isMesh)return;meshes++;o.castShadow=true;o.receiveShadow=true;const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>{mats.add(m);if(m.transparent)o.castShadow=false;for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap'])if(m[key])m[key].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});});
  const details={meshes,materials:mats.size,normalMapped:[...mats].filter(m=>m.normalMap).length,normalImages:new Set([...mats].filter(m=>m.normalMap).map(m=>m.normalMap.image)).size,roughnessMapped:[...mats].filter(m=>m.roughnessMap).length,aoMapped:[...mats].filter(m=>m.aoMap).length};
  normalMaterials=[...mats].filter(m=>m.normalMap);
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  // glTF's metal mirror material needs scene reflections supplied by its renderer.
  // Restrict to one reflection bounce so mirrors cannot recursively render each other.
  const mirrors=[];
  for(const [name,w,h,pos,angle] of [
    ['Wardrobe',.518,1.738,[3.935,1.18,-.21],-Math.PI/2],
    ['Dressing',.545,.635,[2,1.23,3.563],Math.PI],
    ['Bathroom',.564,.714,[1.69,1.63,-3.715],0]
  ]){
    const mirror=new Reflector(new THREE.PlaneGeometry(w,h),{color:0xaaa99d,textureWidth:768,textureHeight:768,multisample:0,clipBias:.001});
    mirror.name=name+' viewer planar reflection';mirror.position.fromArray(pos);mirror.rotation.y=angle;
    const draw=mirror.onBeforeRender;
    mirror.onBeforeRender=function(...args){const others=mirrors.filter(m=>m!==this);const visibility=others.map(m=>m.visible);others.forEach(m=>m.visible=false);try{draw.apply(this,args);}finally{others.forEach((m,i)=>m.visible=visibility[i]);}};
    mirrors.push(mirror);scene.add(mirror);
  }
  window.review={ready:true,details,scene,model,camera,renderer,controls,view,setRoof,setNormals,normalMaterials};
  if(query.has('detail')&&presets[query.get('detail')])view(query.get('detail'));
  status.textContent=`已载入 · ${meshes} 个网格 · ${details.normalImages} 张法线贴图 · 可近看并开关法线对比`;
}catch(error){status.textContent='模型加载失败：'+error.message;window.review={ready:false,error:String(error)};console.error(error);}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.setAnimationLoop(()=>{const now=performance.now();const dt=Math.min((now-lastMoveTime)/1000,.05);lastMoveTime=now;moveCamera(dt);controls.update();renderer.render(scene,camera);});
