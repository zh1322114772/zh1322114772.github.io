import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {CSM} from 'three/addons/csm/CSM.js';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xb6c6c1,.0032);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.12,450);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.5;controls.maxDistance=170;controls.maxPolarAngle=Math.PI*.49;
const sky=await new THREE.TextureLoader().loadAsync('textures/village/summer_dawn_sky.jpg');sky.mapping=THREE.EquirectangularReflectionMapping;sky.colorSpace=THREE.SRGBColorSpace;scene.background=sky;scene.backgroundRotation.y=3.29;
const pmrem=new THREE.PMREMGenerator(renderer);const environment=pmrem.fromEquirectangular(sky);scene.environment=environment.texture;scene.environmentRotation.y=3.29;scene.environmentIntensity=.46;pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xb7d2e3,0x6e714b,.65));
const csm=new CSM({camera,parent:scene,cascades:3,maxFar:160,mode:'practical',shadowMapSize:3072,lightDirection:new THREE.Vector3(60,-17,-45).normalize(),lightIntensity:3.5,shadowBias:-.00025,lightNear:.1,lightFar:400,lightMargin:120});csm.fade=true;csm.updateFrustums();for(const l of csm.lights){l.color.set(0xffd39b);l.shadow.normalBias=.04;}
const keys=new Set();let lastMoveTime=performance.now();const moveKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
addEventListener('keydown',e=>{if(moveKeys.has(e.code)){keys.add(e.code);e.preventDefault();}});addEventListener('keyup',e=>keys.delete(e.code));
function moveCamera(dt){const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;if(forward.lengthSq()<1e-6)return;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,camera.up).normalize();const direction=new THREE.Vector3();if(keys.has('KeyW')||keys.has('ArrowUp'))direction.add(forward);if(keys.has('KeyS')||keys.has('ArrowDown'))direction.sub(forward);if(keys.has('KeyD')||keys.has('ArrowRight'))direction.add(right);if(keys.has('KeyA')||keys.has('ArrowLeft'))direction.sub(right);if(direction.lengthSq()){direction.normalize().multiplyScalar((keys.has('ShiftLeft')||keys.has('ShiftRight')?16:8)*dt);camera.position.add(direction);controls.target.add(direction);}}
const views={home:{p:[3,2.2,15.2],t:[0,1.4,1],f:57},lane:{p:[-18,1.65,13],t:[16,2,6],f:65},shop:{p:[16,2.1,12],t:[10,1.6,-1],f:54},fields:{p:[45,3,44],t:[2,2,5],f:55},overview:{p:[63,43,65],t:[4,1,-1],f:52}};
function view(name){let v=views[name];camera.position.fromArray(v.p);controls.target.fromArray(v.t);camera.fov=v.f;camera.updateProjectionMatrix();csm.updateFrustums();controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>view(b.dataset.view);
view(new URLSearchParams(location.search).get('view')||'home');
const mats=new Set();const groups=[];const status=document.querySelector('#status');
try{for(const [file,label] of [['village_environment_web.glb','村庄外景'],['chinese_home_v2_web.glb','记忆中的家']]){
 status.textContent='正在载入'+label+'…';const gltf=await new GLTFLoader().loadAsync(file+'?rev=summer-5');groups.push(gltf.scene);scene.add(gltf.scene);
 gltf.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!mats.has(m)){csm.setupMaterial(m);mats.add(m);}if(m.transparent)o.castShadow=false;for(const k of ['map','normalMap','roughnessMap','aoMap'])if(m[k])m[k].anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}});
}
let normalEnabled=true;document.querySelector('#normals').onclick=()=>{normalEnabled=!normalEnabled;for(const m of mats){if(!m.normalMap)continue;if(!m.userData.scale)m.userData.scale=m.normalScale.clone();m.normalScale.copy(m.userData.scale).multiplyScalar(normalEnabled?1:0);}document.querySelector('#normals').textContent='法线：'+(normalEnabled?'开':'关');};
const details={neighbours:16,normalMaterials:[...mats].filter(m=>m.normalMap).length,roughnessMaterials:[...mats].filter(m=>m.roughnessMap).length};window.villageReview={ready:true,scene,camera,controls,renderer,view,groups,details,csm};status.textContent='清晨五点半 · 夏天的村庄';setTimeout(()=>status.style.display='none',4500);
}catch(e){status.textContent='加载失败：'+e.message;window.villageReview={ready:false,error:e.message};console.error(e);}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);csm.updateFrustums();});renderer.setAnimationLoop(()=>{const now=performance.now();const dt=Math.min((now-lastMoveTime)/1000,.05);lastMoveTime=now;moveCamera(dt);controls.update();camera.updateMatrixWorld();csm.update();renderer.render(scene,camera);});
