// kiosque-configurator.js

// ============================================
// Configuration & Constants
// ============================================

const CONFIG = {
  models: {
    KIOSQUE_URL: '/KiosqueMaster-DRACO.glb',
    ABRI_URL: '/AbriMinimaliste-DRACO.glb',
  },
  
  camera: {
    FOV: 40,
    NEAR: 0.1,
    FAR: 100,
    DEFAULT_POSITION: [5, 3, -12],
    MIN_RADIUS: 5,
    MAX_RADIUS: 25,
    ZOOM_SPEED: 0.5,
  },
  
  rotation: {
    SENSITIVITY: 0.005,
    LERP_SPEED: 0.18,
    SPIN_SPEED: 0.003,
    DEFAULT_KIOSQUE: 0.6971429442868962,
    DEFAULT_ABRI: 0.5,
  },
  
  materials: {
    DEFAULT_METALNESS: 0.2,
    DEFAULT_ROUGHNESS: 0.7,
    TRANSPARENT_OPACITY: 0.15,
  },
  
  colors: {
    'Body Color - Blanc': 0xFFFFFF,
    'Body Color - Gris clair': 0xDDDDDD,
    'Body Color - Noir': 0x111111,
    'Body Color - Rouge': 0xB71C1C,
    'Body Color - Bleu': 0x1565C0,
  },
  
  casiers: {
    dimensions: {
      24: { width: 0.8, height: 1.5, depth: 0.4 },
      21: { width: 0.9, height: 1.3, depth: 0.45 },
      15: { width: 1.0, height: 1.0, depth: 0.5 },
    },
    colors: {
      24: 0xffffff,
      21: 0xffffff,
      15: 0xffffff,
    },
    // U-shape layout positions for different module counts
    layout: {
      1: [{ side: 'left', index: 0 }],
      2: [
        { side: 'left', index: 0 },
        { side: 'right', index: 0 }
      ],
      3: [
        { side: 'left', index: 0 },
        { side: 'back', index: 0 },
        { side: 'right', index: 0 }
      ],
      4: [
        { side: 'left', index: 0 },
        { side: 'back', index: 0 },
        { side: 'back', index: 1 },
        { side: 'right', index: 0 }
      ],
      5: [
        { side: 'left', index: 0 },
        { side: 'left', index: 1 },
        { side: 'back', index: 0 },
        { side: 'right', index: 1 },
        { side: 'right', index: 0 }
      ]
    },
    // Wall positions for U-shape (adjust these values based on your kiosque dimensions)
    walls: {
      left: { x: -1.5, z: 0, rotation: 0 },      // Left wall
      right: { x: 1.5, z: 0, rotation: 0 },       // Right wall
      back: { x: 0, z: 1.5, rotation: Math.PI / 2 } // Back wall
    }
  },
  
  // Abri Minimaliste specific configuration
  abriModules: {
    dimensions: {
      small: { width: 1.0, height: 1.2, depth: 0.6, color: 0x3498db },
      large: { width: 1.2, height: 1.5, depth: 0.7, color: 0x2ecc71 }
    },
    // Layout for Abri (horizontal line with up to 5 modules)
    layout: {
      1: [{ side: 'front', index: 0 }],
      2: [
        { side: 'left', index: 0 },
        { side: 'right', index: 0 }
      ],
      3: [
        { side: 'left', index: 0 },
        { side: 'center', index: 0 },
        { side: 'right', index: 0 }
      ],
      4: [
        { side: 'left', index: 0 },
        { side: 'left', index: 1 },
        { side: 'right', index: 0 },
        { side: 'right', index: 1 }
      ],
      5: [
        { side: 'left', index: 0 },
        { side: 'left', index: 1 },
        { side: 'center', index: 0 },
        { side: 'right', index: 1 },
        { side: 'right', index: 0 }
      ]
    },
    walls: {
      left: { x: -1.5, z: 0, rotation: 0 },
      center: { x: 0, z: 0, rotation: 0 },
      right: { x: 1.5, z: 0, rotation: 0 },
      front: { x: 0, z: -1.2, rotation: 0 }
    }
  }
};

// Helper function to get GLTFLoader constructor safely
async function getGLTFLoaderCtor() {
  if (window.THREELoaders?.GLTFLoader) {
    return window.THREELoaders.GLTFLoader;
  }
  const mod = await import('https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js');
  return mod.GLTFLoader;
}

// Node mapping for model parts visibility

const NODE_MAPPINGS = {
  'Chapeau Dibond': ['Mesh:PanneauDibond', 'Group:PanneauDibond', 'Mesh:StructureDibond', 'Group:StructureDibond'],
  'Porte / Baie vitrée': [
    'Mesh:KiosqueBaieVitreeBase',
    'Object3D:BaieVitree',
    'Mesh:BaieVitree_1',
    'Mesh:BaieVitree-OctStdSurface1',
    'Mesh:BaieVitree-OctStdSurface1_1'
  ],
  'Rideau motorisé': ['Mesh:Volet'],
  'Grutage-Goussets': ['Mesh:Grutage'],
  'Bardage bois': ['Mesh:Bardage', 'Group:Bardage'],
  'Bardage bois baie vitrée': ['Mesh:BardageBaieVitree', 'Group:BardageBaieVitree'],
  'Vinyle extérieur': ['Mesh:Vinyl'],
  'Vinyle extérieur baie vitrée': ['Mesh:VinylBaieVitree', 'Group:VinylBaieVitree'],
  'Acier imitation bois': ['Mesh:AcierBois', 'Group:AcierBois'],
  'Acier imitation bois baie vitrée': ['Mesh:AcierBoisBaieVitree', 'Group:AcierBoisBaieVitree'],
  'Chambre froide': ['Mesh:ChambreFroide', 'Group:ChambreFroide', 'Object3D:ChambreFroide'],
  'Scanner de QR code': [],
  'Étiquettes électroniques': [],
  'Plinthes': [],
  // Abri Minimaliste Plinthe (baseboard) options
  'Plinthe-24': ['Group:Plinthe-24', 'Mesh:Plinthe-24'],
  'Plinthe-21-15': ['Group:Plinthe-21-15', 'Mesh:Plinthe-21-15'],
  // Abri Minimaliste options - Updated to match actual model structure
  // Based on hierarchy: AbriMinimaliste > [AbriMinimaliste, Casier-24, Casier-21, Casier-15, Fenetre, Borne]
  'Casier-24': ['Group:Casier-24', 'Mesh:Casier-24'],
  'Casier-21': ['Group:Casier-21', 'Mesh:Casier-21'],
  'Casier-15': ['Group:Casier-15', 'Mesh:Casier-15'],
  'Fenetre': ['Mesh:Fenetre', 'Group:Fenetre'],
  'Borne': ['Mesh:Borne', 'Group:Borne'],
  // Abri Minimaliste form option mappings for "Choix du casier"
  '24': ['Group:Casier-24', 'Mesh:Casier-24'],
  '21': ['Group:Casier-21', 'Mesh:Casier-21'],
  '15': ['Group:Casier-15', 'Mesh:Casier-15'],
};

// Global texture cache to avoid multiple network requests for the same image
const GLOBAL_TEXTURE_LOADER = new THREE.TextureLoader();
const TEXTURE_CACHE = new Map();

function getCachedTexture(path, opts = {}) {
  if (TEXTURE_CACHE.has(path)) return TEXTURE_CACHE.get(path);

  const tex = GLOBAL_TEXTURE_LOADER.load(path);

  // Set sensible defaults and any provided options
  try { if (opts.sRGB) tex.colorSpace = THREE.SRGBColorSpace; } catch (e) {}
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.flipY = opts.flipY === undefined ? false : opts.flipY;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  tex.needsUpdate = true;

  TEXTURE_CACHE.set(path, tex);
  return tex;
}

// Simple preloader helpers (functionality only — minimal styling)
function createPreloader() {
  let p = document.getElementById('kiosque-preloader');
  if (p) return p;

  const canvas = document.getElementById('three-canvas');
  const container = (canvas && canvas.parentElement) ? canvas.parentElement : document.body;

  // If container is not body, ensure it can host absolutely positioned children
  if (container !== document.body && getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  p = document.createElement('div');
  p.id = 'kiosque-preloader';

  const useFixed = container === document.body;
  Object.assign(p.style, {
    position: useFixed ? 'fixed' : 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.0)',
    zIndex: '99999',
    pointerEvents: 'none'
  });

  const indicator = document.createElement('div');
  indicator.id = 'kiosque-preloader-indicator';
  Object.assign(indicator.style, {
    padding: '16px 20px',
    background: 'rgba(0,0,0,0.6)',
    color: '#fff',
    borderRadius: '6px',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  });

  // Create spinner element
  const spinner = document.createElement('div');
  spinner.id = 'kiosque-preloader-spinner';
  Object.assign(spinner.style, {
    width: '32px',
    height: '32px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid #fff',
    borderRadius: '50%',
    animation: 'kiosque-spin 1s linear infinite'
  });

  // Add text
  const text = document.createElement('div');
  text.textContent = 'Chargement...';

  indicator.appendChild(spinner);
  indicator.appendChild(text);

  // Add CSS animation if not already present
  if (!document.getElementById('kiosque-preloader-styles')) {
    const style = document.createElement('style');
    style.id = 'kiosque-preloader-styles';
    style.textContent = `
      @keyframes kiosque-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  p.appendChild(indicator);
  container.appendChild(p);
  return p;
}

function showPreloader() {
  const p = createPreloader();
  p.style.display = 'flex';
}

function hidePreloader() {
  const p = document.getElementById('kiosque-preloader');
  if (p) p.style.display = 'none';
}

// ============================================
// Three.js Scene Manager
// ============================================

class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.modelGroup = null;
    this.casierGroup = null;
    this.lights = {};
    this.currentLightingSetup = 'kiosque'; // Track current lighting setup
    this.lightTransitionProgress = 0; // For smooth light transitions
    
    this.init();
  }
  
  init() {
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas, 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    
    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.FOV,
      1,
      CONFIG.camera.NEAR,
      CONFIG.camera.FAR
    );
    this.camera.position.set(...CONFIG.camera.DEFAULT_POSITION);
    this.camera.lookAt(0, 0, 0);
    
    // Model group
    this.modelGroup = new THREE.Group();
    this.modelGroup.rotation.y = CONFIG.rotation.DEFAULT_KIOSQUE;
    this.scene.add(this.modelGroup);
    
    // Casier group
    this.casierGroup = new THREE.Group();
    this.casierGroup.visible = false;
    this.modelGroup.add(this.casierGroup);
    
    // Lights
    this.setupLights();
    
    // Ground
    this.setupGround();
    
    // Handle resize
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }
  
  setupLights() {
    // Simple HDRI environment lighting
    const loader = new THREE.TextureLoader();
    loader.load('/hdri.jpg', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      this.scene.environment = envMap;
      this.scene.background = null; // Hide HDRI image, keep lighting
      texture.dispose();
      pmremGenerator.dispose();
    });

    // ===== KIOSQUE LIGHTING SETUP =====
    // Add ambient light for global illumination
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.lights.ambient);
  
    // Add a shadow-casting directional light for visible shadows
    this.lights.key = new THREE.DirectionalLight(0xffffff, 1.5);
    this.lights.key.position.set(5, 10, 7);
    this.lights.key.castShadow = true;
    this.lights.key.shadow.mapSize.set(2048, 2048);
    this.lights.key.shadow.bias = -0.0005;
    this.modelGroup.add(this.lights.key);

    // Overhead quad light (RectAreaLight facing down)
    this.lights.overhead = new THREE.RectAreaLight(0xffffff, 0.8);
    this.lights.overhead.position.set(0, 1.3, 0);
    this.lights.overhead.rotation.x = -Math.PI / 2; // Face down
    this.lights.overhead.visible = true;
    this.modelGroup.add(this.lights.overhead);

    // ===== ABRI 3-POINT LIGHTING SETUP =====
    // Key light (main light) - strong white
    this.lights.abriKeyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.lights.abriKeyLight.position.set(4, 5, 3);
    this.lights.abriKeyLight.castShadow = true;
    this.lights.abriKeyLight.shadow.mapSize.set(2048, 2048);
    this.lights.abriKeyLight.shadow.bias = -0.0005;
    this.lights.abriKeyLight.visible = false;
    this.modelGroup.add(this.lights.abriKeyLight);

    // Fill light (secondary light) - soft white
    this.lights.abriFillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.lights.abriFillLight.position.set(-3, 4, -2);
    this.lights.abriFillLight.visible = false;
    this.modelGroup.add(this.lights.abriFillLight);

    // Back light (rim light) - white highlight
    this.lights.abriBackLight = new THREE.PointLight(0xffffff, 0.6, 15);
    this.lights.abriBackLight.position.set(0, 2, -4);
    this.lights.abriBackLight.visible = false;
    this.modelGroup.add(this.lights.abriBackLight);

    // Abri ambient light - lower than Kiosque
    this.lights.abriAmbient = new THREE.AmbientLight(0xffffff, 0.8);
    this.lights.abriAmbient.visible = false;
    this.scene.add(this.lights.abriAmbient);

    console.log('[SceneManager] Lighting setup complete with both Kiosque and Abri configurations');
  }
  
  setupGround() {
    const geometry = new THREE.PlaneGeometry(40, 40);
    const material = new THREE.ShadowMaterial({ opacity: 0.25 });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.01;
    ground.receiveShadow = true;
    ground.name = 'ground'; // Name for easy reference
    this.modelGroup.add(ground);
    this.ground = ground; // Store reference for dynamic adjustment
  }

  adjustGroundPosition(moduleType) {
    // Adjust ground position based on module type to ensure proper shadow casting
    if (!this.ground) return;
    
    if (moduleType === 'Abri Minimaliste') {
      // Abri is higher, lower the ground to catch shadows properly
      this.ground.position.y = -1.21;
      console.log('[SceneManager] Adjusted ground for Abri Minimaliste: y = -0.5');
    } else {
      // Kiosque - original position
      this.ground.position.y = -1.01;
      console.log('[SceneManager] Adjusted ground for Kiosque: y = -1.01');
    }
  }
  
  resize() {
    const width = this.canvas.parentElement.clientWidth;
    const height = this.canvas.parentElement.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  
  render() {
    this.camera.lookAt(0, 0, 0);
    this.renderer.render(this.scene, this.camera);
  }

  setLightingSetup(setupType) {
    // Robustly switch between lighting setups (kiosque or abri)
    if (this.currentLightingSetup === setupType) return;

    console.log(`[SceneManager] Switching lighting from ${this.currentLightingSetup} to ${setupType}`);
    
    if (setupType === 'kiosque') {
      // Switch to Kiosque lighting
      this.lights.ambient.visible = true;
      this.lights.key.visible = true;
      this.lights.overhead.visible = true;

      // Hide Abri lights
      if (this.lights.abriAmbient) this.lights.abriAmbient.visible = false;
      if (this.lights.abriKeyLight) this.lights.abriKeyLight.visible = false;
      if (this.lights.abriFillLight) this.lights.abriFillLight.visible = false;
      if (this.lights.abriBackLight) this.lights.abriBackLight.visible = false;
    } 
    else if (setupType === 'abri') {
      // Switch to Abri 3-point lighting
      this.lights.ambient.visible = false;
      this.lights.key.visible = false;
      this.lights.overhead.visible = false;

      // Show Abri lights
      if (this.lights.abriAmbient) this.lights.abriAmbient.visible = true;
      if (this.lights.abriKeyLight) this.lights.abriKeyLight.visible = true;
      if (this.lights.abriFillLight) this.lights.abriFillLight.visible = true;
      if (this.lights.abriBackLight) this.lights.abriBackLight.visible = true;
    }

    this.currentLightingSetup = setupType;
  }
}

// ============================================
// Model Loader
// ============================================

class ModelLoader {
  constructor() {
    this.cache = new Map();
    this.loader = null;
  }
  
  async getLoader() {
    if (this.loader) return this.loader;

    // Load GLTFLoader and DRACOLoader if not present
    let GLTFLoaderCtor, DRACOLoaderCtor;
    
    // First check if loaders are available in window.THREELoaders
    if (window.THREELoaders?.GLTFLoader && window.THREELoaders?.DRACOLoader) {
      GLTFLoaderCtor = window.THREELoaders.GLTFLoader;
      DRACOLoaderCtor = window.THREELoaders.DRACOLoader;
    } 
    // Fallback to dynamic import
    else {
      const [gltfMod, dracoMod] = await Promise.all([
        import('https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js'),
        import('https://unpkg.com/three@0.153.0/examples/jsm/loaders/DRACOLoader.js')
      ]);
      GLTFLoaderCtor = gltfMod.GLTFLoader;
      DRACOLoaderCtor = dracoMod.DRACOLoader;
    }

    // Setup DRACOLoader
    const dracoLoader = new DRACOLoaderCtor();
    // Set decoder path to CDN (or host locally if you prefer)
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

    // Setup GLTFLoader with DRACOLoader
    this.loader = new GLTFLoaderCtor();
    this.loader.setDRACOLoader(dracoLoader);
    return this.loader;
  }
  
  async load(url) {
    // Check cache
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      return cached.scene.clone(true);
    }
    
    // Load model
    const loader = await this.getLoader();
    
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          this.cache.set(url, gltf);
          resolve(gltf.scene.clone(true));
        },
        undefined,
        reject
      );
    });
  }
  
  dispose(object) {
    if (!object) return;
    
    object.traverse(node => {
      if (node.isMesh) {
        if (node.geometry) node.geometry.dispose();
        
        const materials = Array.isArray(node.material) 
          ? node.material 
          : [node.material];
          
        materials.forEach(mat => {
          if (mat) {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          }
        });
      }
    });
  }
}

// ============================================
// Model Manager
// ============================================

class ModelManager {
  constructor(sceneManager, modelLoader, formController) {
    this.scene = sceneManager;
    this.loader = modelLoader;
    this.form = formController;
    this.currentModel = null;
    this.currentModuleType = null; // Track loaded module type robustly
    this.nodeMap = new Map();
    this.isTransparent = false;
    this.abriUpdateInProgress = false; // Flag to prevent simultaneous updates
    this.abriUpdateTimeout = null; // Debounce timer
  }

  getNodes(keys) {
    if (!Array.isArray(keys)) keys = [keys];
    const results = [];
    keys.forEach(key => {
      const nodes = this.nodeMap.get(key);
      if (nodes) results.push(...nodes);
    });
    return results;
  }

  traverseMaterials(node, callback) {
    if (!node) return;
    node.traverse(child => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(mat => {
        if (mat) callback(mat, child);
      });
    });
  }

  forEachMaterial(targets, callback) {
    const nodes = Array.isArray(targets) ? this.getNodes(targets) : this.getNodes([targets]);
    nodes.forEach(node => this.traverseMaterials(node, callback));
  }

  setNodeVisibility(key, visible) {
    this.getNodes(key).forEach(node => {
      node.visible = visible;
    });
  }

  getCurrentModuleType() {
    // Robustly detect which module type is currently loaded by traversing the model
    if (!this.currentModel) return null;
    
    let detectedType = null;
    
    // Check for Abri-specific markers
    this.currentModel.traverse(node => {
      if (node.name && node.name.includes('AbriMinimaliste')) {
        detectedType = 'Abri Minimaliste';
      }
      // Also check for Kiosque-specific markers
      if (node.name && (node.name.includes('Kiosque') || node.name.includes('BaieVitree'))) {
        detectedType = 'Kiosque';
      }
    });
    
    // Fall back to stored type if detection fails
    if (!detectedType && this.currentModuleType) {
      detectedType = this.currentModuleType;
    }
    
    console.log(`[ModelManager] Detected module type: ${detectedType}`);
    return detectedType;
  }
  
  async loadModel(type, options = []) {
    console.log(`[ModelManager] Loading model: ${type}`);
    
    // Remove current model
    if (this.currentModel) {
      this.scene.modelGroup.remove(this.currentModel);
      this.loader.dispose(this.currentModel);
      this.currentModel = null;
    }
    
    // Get model URL based on type
    let url;
    if (type === 'Kiosque') {
      url = CONFIG.models.KIOSQUE_URL;
    } else if (type === 'Abri Minimaliste') {
      url = CONFIG.models.ABRI_URL;
    } else {
      console.error(`Unknown module type: ${type}`);
      return this.createFallbackModel(type);
    }
    
    try {
      // Load model
      const model = await this.loader.load(url);
      console.log(`[ModelManager] Model loaded successfully: ${type}`);
      
      // Setup model
      model.scale.set(1.08, 1.08, 1.08);
      this.setupMeshes(model);
      
      // Model-specific setup
      if (type === 'Kiosque') {
        this.setupKiosqueModel(model);
      } else if (type === 'Abri Minimaliste') {
        this.setupAbriModel(model);
      }
      
      // Add to scene
      this.scene.modelGroup.add(model);
      this.currentModel = model;
      this.currentModuleType = type; // Store module type for robust detection
      
      // Build node map
      this.buildNodeMap(model);
      console.log(`[ModelManager] Node map built with ${this.nodeMap.size} entries`);
      
      
      // Apply options
      this.applyOptions(options);
      
      return model;
    } catch (error) {
      console.error('Failed to load model:', error);
      return this.createFallbackModel(type);
    }
  }
  
  setupMeshes(model) {
    model.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        
        // Clone materials for independent control
        if (node.material) {
          node.material = Array.isArray(node.material)
            ? node.material.map(m => m.clone())
            : node.material.clone();
        }
        
        // Make Vitres transparent
        if (node.name === 'Vitres' || node.parent?.name === 'Vitres') {
          const materials = Array.isArray(node.material) 
            ? node.material 
            : [node.material];
            
          materials.forEach(mat => {
            mat.transparent = true;
            mat.opacity = 0.3;
            mat.roughness = 0.1;
            mat.metalness = 0.1;
            mat.needsUpdate = true;
          });
        }

        // Apply metal painted look to base meshes and KiosqueStructure (use hex color, no color map)
        if (
          node.name === 'Kiosque_Base' ||
          node.name === 'KiosqueBase' ||
          node.name === 'Kiosque_Baie_Vitree' ||
          node.name === 'KiosqueBaieVitreeBase' ||
          node.name === 'BaieVitree' ||
          node.name === 'KiosqueStructure'
        ) {
          // Load only roughness and metalness maps
          const roughnessMap = getCachedTexture('/metalpaint-roughness.jpg');
          const metalnessMap = getCachedTexture('/metalpaint-metalness.jpg');
          // Optional: normal map
          let normalMap;
          try {
            normalMap = getCachedTexture('/metalpaint-normal.jpg');
          } catch (e) {}

          // Scale down tiling (increase repeat)
          [roughnessMap, metalnessMap, normalMap].forEach(tex => {
            if (tex) {
              tex.wrapS = THREE.RepeatWrapping;
              tex.wrapT = THREE.RepeatWrapping;
              tex.repeat.set(4, 4); // Increase tiling (scale down texture)
              tex.needsUpdate = true;
            }
          });

          const materials = Array.isArray(node.material)
            ? node.material
            : [node.material];

          materials.forEach(mat => {
            mat.map = null;
            mat.roughnessMap = roughnessMap;
            mat.metalnessMap = metalnessMap;
            if (normalMap) mat.normalMap = normalMap;
            mat.metalness = 0.8;
            mat.roughness = 0.7;
            mat.color.setHex(0x7e7e82); // Dark grey
            mat.needsUpdate = true;
          });
        }
      }
    });
  }
  
  setupKiosqueModel(model) {
    // Reset model position
    model.position.y = 0;
    
    // Set rotation
    this.scene.modelGroup.rotation.y = CONFIG.rotation.DEFAULT_KIOSQUE;
    
    // Set Kiosque lighting
    this.scene.setLightingSetup('kiosque');
    
    // Adjust ground for Kiosque
    this.scene.adjustGroundPosition('Kiosque');
  }
  
  setupAbriModel(model) {
    // Reset model position
    model.position.y = 0;
    
    // Set Abri-specific rotation
    this.scene.modelGroup.rotation.y = CONFIG.rotation.DEFAULT_ABRI;
    
    // Set Abri 3-point lighting
    this.scene.setLightingSetup('abri');
    
    // Adjust ground for Abri
    this.scene.adjustGroundPosition('Abri Minimaliste');
    
    // Move camera closer for Abri Minimaliste view
    // Calculate closer camera position from default direction
    const direction = new THREE.Vector3(5, 3, -12).normalize();
    const closerRadius = 8; // Closer than default
    this.scene.camera.position.copy(direction.multiplyScalar(closerRadius));
  }
  

  
  buildNodeMap(root) {
    this.nodeMap.clear();

    root.traverse(node => {
      const name = node.name || `<unnamed-${node.id}>`;
      const key = `${node.type}:${name}`;
      
      if (!this.nodeMap.has(key)) {
        this.nodeMap.set(key, []);
      }
      this.nodeMap.get(key).push(node);
    });
  }
  
  applyOptions(options) {
    // Apply visibility rules
    this.applyVisibility(options);
    
    // Apply materials
    this.applyMaterials(options);
  }
  
  applyVisibility(options) {
    // Route to appropriate visibility handler based on current model
    if (this.currentModel) {
      // Try to detect model type from its structure
      let isAbri = false;
      this.currentModel.traverse(node => {
        if (node.name && (node.name.includes('Abri') || node.name.includes('Toiture'))) {
          isAbri = true;
        }
      });
      
      if (isAbri) {
        this.applyVisibility_Abri(options);
      } else {
        this.applyVisibility_Kiosque(options);
      }
    }
  }
  
  applyVisibility_Kiosque(options) {
    const baieVitree = options.includes('Porte / Baie vitrée');
    const variantVisibility = [
      {
        option: 'Vinyle extérieur',
        baseKeys: ['Mesh:Vinyl'],
        baieKeys: ['Mesh:VinylBaieVitree', 'Group:VinylBaieVitree']
      },
      {
        option: 'Bardage bois',
        baseKeys: ['Mesh:Bardage', 'Group:Bardage'],
        baieKeys: ['Mesh:BardageBaieVitree', 'Group:BardageBaieVitree']
      },
      {
        option: 'Acier imitation bois',
        baseKeys: ['Mesh:AcierBois', 'Group:AcierBois'],
        baieKeys: ['Mesh:AcierBoisBaieVitree', 'Group:AcierBoisBaieVitree']
      }
    ];

    const handledOptions = new Set([
      'Porte / Baie vitrée',
      'Bardage bois',
      'Bardage bois baie vitrée',
      'Acier imitation bois',
      'Acier imitation bois baie vitrée',
      'Vinyle extérieur',
      'Vinyle extérieur baie vitrée'
    ]);

    // Base structure swap between standard and baie vitrée meshes
    this.setNodeVisibility([
      'Mesh:Kiosque_Base',
      'Mesh:KiosqueBase',
      'Group:KiosqueStructure',
      'Mesh:KiosqueStructure'
    ], !baieVitree);

    this.setNodeVisibility([
      'Mesh:Kiosque_Baie_Vitree',
      'Mesh:KiosqueBaieVitreeBase'
    ], baieVitree);

    // Baie vitrée supplemental nodes
    this.setNodeVisibility([
      'Object3D:BaieVitree',
      'Mesh:BaieVitree_1',
      'Mesh:BaieVitree-OctStdSurface1',
      'Mesh:BaieVitree-OctStdSurface1_1'
    ], baieVitree);

    // Handle options with baie vitrée variants
    variantVisibility.forEach(({ option, baseKeys, baieKeys }) => {
      const enabled = options.includes(option);
      const showBaieVariant = enabled && baieVitree;

      this.setNodeVisibility(baseKeys, enabled && !showBaieVariant);
      this.setNodeVisibility(baieKeys, enabled && showBaieVariant);

      if (!enabled) {
        // Ensure both variants are hidden when option is off
        this.setNodeVisibility([...baseKeys, ...baieKeys], false);
      }
    });

    // Apply other simple options
    Object.entries(NODE_MAPPINGS).forEach(([option, keys]) => {
      if (handledOptions.has(option)) return;
      const enabled = options.includes(option);
      this.setNodeVisibility(keys, enabled);
    });

    this.logVisibleMeshGroups();
}

  applyVisibility_Abri(options) {
    // Handle Abri-specific options visibility based on actual mesh hierarchy
    // Always show: AbriMinimaliste-{size}, Casier-{size}, and Borne
    
    // Debounce rapid updates to prevent jittering
    if (this.abriUpdateInProgress) {
      console.log('[Abri Visibility] Update already in progress, queuing next update...');
      clearTimeout(this.abriUpdateTimeout);
      this.abriUpdateTimeout = setTimeout(() => {
        this.applyVisibility_Abri(options);
      }, 100);
      return;
    }
    
    this.abriUpdateInProgress = true;
    
    console.log('[Abri Visibility] Applying visibility rules');
    console.log('[Abri Visibility] Selected options:', options);
    
    // Get the selected casier size from "Choix du casier" form control (tailleCasiersAbri)
    // Default to 24 if not found (for initial load or fallback)
    const selectedCasierSize = this.getSelectedCasierSizeAbri() || 24;
    console.log('[Abri Visibility] Selected casier size:', selectedCasierSize);
    
    if (!this.currentModel) {
      console.warn('[Abri Visibility] No model loaded');
      this.abriUpdateInProgress = false;
      return;
    }

    // First, remove ALL existing duplicates before applying new visibility rules
    this.removeAllAbriDuplicates();

    // Helper function to find and set visibility for nodes matching a name pattern using exact matching
    // This prevents overlapping matches (e.g., 'Casier-24' should not match 'Casier-21' nodes)
    const setVisibilityByName = (namePattern, visible) => {
      let found = false;
      this.currentModel.traverse(node => {
        if (node.name === namePattern) {
          node.visible = visible;
          found = true;
          console.log(`[Abri Visibility] Set ${node.name} visibility to ${visible}`);
        }
      });
      if (!found) {
        console.warn(`[Abri Visibility] No nodes found matching pattern: ${namePattern}`);
      }
    };
    
    // Show AbriMinimaliste variant matching the selected casier size
    // AR24 = "AbriMinimaliste-24"
    // AR21 = "AbriMinimaliste-15-21"
    // AR15 = "AbriMinimaliste-15-21"
    // Only show ONE variant at a time
    const showAbri24 = selectedCasierSize === 24;
    const showAbri1521 = selectedCasierSize === 21 || selectedCasierSize === 15;
    
    setVisibilityByName('AbriMinimaliste-24', showAbri24);
    setVisibilityByName('AbriMinimaliste-15-21', showAbri1521);
    console.log(`[Abri Visibility] AbriMinimaliste visibility: 24=${showAbri24}, 15-21=${showAbri1521}`);
    
    // Show Casier matching the selected size - hide others
    setVisibilityByName('Casier-24', selectedCasierSize === 24);
    setVisibilityByName('Casier-21', selectedCasierSize === 21);
    setVisibilityByName('Casier-15', selectedCasierSize === 15);
    console.log(`[Abri Visibility] Casier visibility: 24=${selectedCasierSize === 24}, 21=${selectedCasierSize === 21}, 15=${selectedCasierSize === 15}`);
    
    // Borne (base/pedestal) - always visible
    setVisibilityByName('Borne', true);
    console.log('[Abri Visibility] Borne always visible');
    
    // Fenetre (window/door) - toggle based on options
    // For Abri, show/hide the window based on configuration
    const hasWindow = options.includes('Fenetre') || true; // Default to showing window
    setVisibilityByName('Fenetre', hasWindow);
    console.log('[Abri Visibility] Window visible:', hasWindow);
    
    // Plinthe (baseboard) - toggle based on options and selected casier size
    const hasPlinthe = options.includes('Plinthes');
    if (hasPlinthe) {
      // Show Plinthe-24 only if casier 24 is selected
      setVisibilityByName('Plinthe-24', selectedCasierSize === 24);
      // Show Plinthe-21-15 if casier 21 or 15 is selected
      setVisibilityByName('Plinthe-21-15', selectedCasierSize === 21 || selectedCasierSize === 15);
      console.log(`[Abri Visibility] Plinthe visibility: 24=${selectedCasierSize === 24}, 21-15=${selectedCasierSize === 21 || selectedCasierSize === 15}`);
    } else {
      // Hide all plinthes when option is not selected
      setVisibilityByName('Plinthe-24', false);
      setVisibilityByName('Plinthe-21-15', false);
      console.log('[Abri Visibility] All Plinthes hidden (option not selected)');
    }
    
    // Duplicate casiers based on nbModules
    const nbModules = this.form?.getSelectedNbModulesAbri?.() || 1;
    this.duplicateAbriCasiers(selectedCasierSize, nbModules);
    
    // Clear the flag after a frame to allow new updates
    requestAnimationFrame(() => {
      this.abriUpdateInProgress = false;
    });
  }

  removeAllAbriDuplicates() {
    if (!this.currentModel) return;
    
    const duplicatesToRemove = [];
    
    // Find all duplicates (any name containing "_Duplicate_")
    this.currentModel.traverse(node => {
      if (node.name && node.name.includes('_Duplicate_')) {
        duplicatesToRemove.push(node);
      }
    });
    
    if (duplicatesToRemove.length > 0) {
      console.log(`[Abri Duplication] Removing ${duplicatesToRemove.length} old duplicates of all sizes`);
      
      duplicatesToRemove.forEach(duplicate => {
        const parent = duplicate.parent;
        if (parent) {
          parent.remove(duplicate);
        }
        
        // Dispose materials and geometry
        duplicate.traverse(node => {
          if (node.isMesh) {
            if (node.geometry) node.geometry.dispose();
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach(mat => {
              if (mat) mat.dispose();
            });
          }
        });
      });
    }
  }

  duplicateAbriCasiers(casierSize, nbModules) {
    if (!this.currentModel || nbModules < 1) return;
    
    const casierName = `Casier-${casierSize}`;
    let originalCasier = null;
    let originalBorne = null;
    let parent = null;
    let borneParent = null;
    
    // Find the original casier mesh and borne
    this.currentModel.traverse(node => {
      if (node.name === casierName && node.isMesh) {
        originalCasier = node;
        parent = node.parent;
      }
      if (node.name === 'Borne' && node.isMesh) {
        originalBorne = node;
        borneParent = node.parent;
      }
    });
    
    if (!originalCasier || !parent) {
      console.warn(`[Abri Duplication] Could not find casier: ${casierName}`);
      return;
    }
    
    if (!originalBorne) {
      console.warn(`[Abri Duplication] Could not find Borne mesh`);
    }
    
    // Store original position if not already stored
    if (!originalCasier._originalPosition) {
      originalCasier._originalPosition = new THREE.Vector3().copy(originalCasier.position);
      console.log(`[Abri Duplication] Stored original casier position: Z=${originalCasier._originalPosition.z.toFixed(3)}`);
    }
    
    if (originalBorne && !originalBorne._originalPosition) {
      originalBorne._originalPosition = new THREE.Vector3().copy(originalBorne.position);
      console.log(`[Abri Duplication] Stored original borne position: Z=${originalBorne._originalPosition.z.toFixed(3)}`);
    }
    
    // Get accurate bounding box for casier
    const bboxCasier = new THREE.Box3();
    bboxCasier.setFromObject(originalCasier);
    
    const sizeCasier = new THREE.Vector3();
    bboxCasier.getSize(sizeCasier);
    const casierDepth = sizeCasier.z;
    const casierWidth = sizeCasier.x;
    
    // Get accurate bounding box for borne
    let borneDepth = 0;
    let borneWidth = 0;
    if (originalBorne) {
      const bboxBorne = new THREE.Box3();
      bboxBorne.setFromObject(originalBorne);
      
      const sizeBorne = new THREE.Vector3();
      bboxBorne.getSize(sizeBorne);
      borneDepth = sizeBorne.z;
      borneWidth = sizeBorne.x;
    }
    
    const spacing = 0.02; // Small spacing between casiers
    
    console.log(`[Abri Duplication] Original Casier: ${casierName}`);
    console.log(`[Abri Duplication] Casier depth: ${casierDepth.toFixed(3)}, Casier width: ${casierWidth.toFixed(3)}`);
    console.log(`[Abri Duplication] Borne depth: ${borneDepth.toFixed(3)}, Borne width: ${borneWidth.toFixed(3)}`);
    console.log(`[Abri Duplication] Creating ${nbModules - 1} new duplicates of ${casierName}`);
    
    // Only reposition if we're creating duplicates (nbModules > 1)
    if (nbModules > 1) {
      // Calculate total width needed for all modules INCLUDING borne
      // Layout: [Borne] [spacing] [Casier1] [spacing] [Casier2] ... [spacing] [CasierN]
      const totalWidth = borneDepth + spacing + nbModules * casierDepth + (nbModules - 1) * spacing;
      const startZ = -totalWidth / 2;
      
      // Position borne at the start
      if (originalBorne) {
        originalBorne.position.z = startZ + borneDepth / 2;
        console.log(`[Abri Duplication] Positioned Borne at Z=${originalBorne.position.z.toFixed(3)}`);
      }
      
      // Position casiers after the borne
      const casierStartZ = startZ + borneDepth + spacing;
      
      // Reposition the original casier to the first casier position
      originalCasier.position.z = casierStartZ + casierDepth / 2;
      
      // Create and position new duplicates (casiers only, no borne duplicates)
      for (let i = 1; i < nbModules; i++) {
        const duplicate = originalCasier.clone();
        duplicate.name = `${casierName}_Duplicate_${i}`;
        
        // Position duplicates after the first casier
        duplicate.position.z = casierStartZ + (i * (casierDepth + spacing)) + casierDepth / 2;
        duplicate.position.x = originalCasier.position.x;
        duplicate.position.y = originalCasier.position.y;
        duplicate.rotation.copy(originalCasier.rotation);
        duplicate.scale.copy(originalCasier.scale);
        
        parent.add(duplicate);
        console.log(`[Abri Duplication] Created duplicate ${i}: ${duplicate.name} at Z=${duplicate.position.z.toFixed(3)}`);
      }
    } else {
      // Restore original positions if only 1 module
      originalCasier.position.copy(originalCasier._originalPosition);
      console.log(`[Abri Duplication] Only 1 module, restored original casier to Z=${originalCasier.position.z.toFixed(3)}`);
      
      if (originalBorne) {
        originalBorne.position.copy(originalBorne._originalPosition);
        console.log(`[Abri Duplication] Only 1 module, restored original borne position`);
      }
    }
    
    // Apply skew to the Abri base mesh group based on number of casiers
    this.applyAbriSkew(nbModules);
  }
  
  applyAbriSkew(nbModules) {
    // Find the Abri base mesh (the non-casier part)
    if (!this.currentModel) return;
    
    let abriBaseMesh = null;
    this.currentModel.traverse(node => {
      // Look for the main Abri structure (not a casier)
      if (node.isMesh && node.name && node.name.includes('AbriMinimaliste') && !node.name.includes('Casier')) {
        abriBaseMesh = node;
      }
    });
    
    if (!abriBaseMesh) {
      console.warn('[Abri Skew] Could not find Abri base mesh');
      return;
    }
    
    // Store original scale if not already stored
    if (!abriBaseMesh._originalScale) {
      abriBaseMesh._originalScale = new THREE.Vector3().copy(abriBaseMesh.scale);
      console.log(`[Abri Skew] Stored original scale: (${abriBaseMesh._originalScale.x.toFixed(3)}, ${abriBaseMesh._originalScale.y.toFixed(3)}, ${abriBaseMesh._originalScale.z.toFixed(3)})`);
    }
    
    // Find the casier to get its depth
    let casierDepth = 0.6; // fallback default
    this.currentModel.traverse(node => {
      if (node.name && node.name.match(/Casier-\d+$/)) {
        const bbox = new THREE.Box3().setFromObject(node);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        casierDepth = size.z;
      }
    });
    
    const spacing = 0.02; // spacing between casiers
    
    // Calculate total depth needed for all casiers
    const totalCasierDepth = nbModules * casierDepth + (nbModules - 1) * spacing;
    
    // Calculate skew factor: Abri should grow proportionally to hold all casiers
    // Original Abri can hold ~1 casier, so scale by the ratio of total casier depth to original casier depth
    const skewFactor = totalCasierDepth / casierDepth;
    
    // Apply growth along the Z axis (axis of casier growth)
    abriBaseMesh.scale.z = abriBaseMesh._originalScale.z * skewFactor;
    
    console.log(`[Abri Skew] Applied skew with nbModules=${nbModules}, casierDepth=${casierDepth.toFixed(3)}, totalDepth=${totalCasierDepth.toFixed(3)}, skewFactor=${skewFactor.toFixed(3)}, scaleZ=${abriBaseMesh.scale.z.toFixed(3)}`);
  }

  centerAbriModel() {
    if (!this.currentModel) return;
    
    // Store the last center/camera adjustment to avoid redundant updates
    if (!this.currentModel._lastAbriCenter) {
      this.currentModel._lastAbriCenter = new THREE.Vector3();
      this.currentModel._lastCameraDistance = 0;
    }
    
    // Calculate bounding box of the entire model including all duplicates
    const bbox = new THREE.Box3().setFromObject(this.currentModel);
    
    if (bbox.isEmpty()) {
      console.warn('[Abri Centering] Bounding box is empty');
      return;
    }
    
    // Get the center of the bounding box
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    
    // Get the size for camera adjustment
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    // Check if centering has changed significantly (avoid jitter from micro-changes)
    const centerDistance = center.distanceTo(this.currentModel._lastAbriCenter);
    const maxDimension = Math.max(size.x, size.y, size.z);
    const newCameraDistance = maxDimension * 2; // Reduced multiplier to keep camera closer
    const cameraDeltaPercent = Math.abs(newCameraDistance - this.currentModel._lastCameraDistance) / this.currentModel._lastCameraDistance;
    
    // Only update if change is significant (more than 0.1 units or 5% camera change)
    if (centerDistance < 0.1 && cameraDeltaPercent < 0.05) {
      console.log('[Abri Centering] Skipping update - changes are negligible');
      return;
    }
    
    console.log(`[Abri Centering] Bounding box center: (${center.x.toFixed(3)}, ${center.y.toFixed(3)}, ${center.z.toFixed(3)})`);
    console.log(`[Abri Centering] Bounding box size: ${size.x.toFixed(3)}x${size.y.toFixed(3)}x${size.z.toFixed(3)}`);
    
    // Move the entire model so its bounding box center is at origin (0, 0, 0)
    // This will center the model with all duplicates in the view
    this.currentModel.position.sub(center);
    
    // Store the new center for next time
    this.currentModel._lastAbriCenter.copy(new THREE.Vector3(0, 0, 0));
    
    console.log(`[Abri Centering] Model repositioned. New position: (${this.currentModel.position.x.toFixed(3)}, ${this.currentModel.position.y.toFixed(3)}, ${this.currentModel.position.z.toFixed(3)})`);
    
    // Adjust camera distance based on model size (use 8 as a closer base for Abri)
    const closerAbriRadius = 8;
    const cameraDistance = Math.max(closerAbriRadius, newCameraDistance);
    
    // Update camera position based on new distance
    const direction = new THREE.Vector3(5, 3, -12).normalize();
    this.scene.camera.position.copy(direction.multiplyScalar(cameraDistance));
    
    // Store the camera distance for next time
    this.currentModel._lastCameraDistance = newCameraDistance;
    
    console.log(`[Abri Centering] Camera updated. Max dimension: ${maxDimension.toFixed(3)}, Camera distance: ${cameraDistance.toFixed(3)}`);
  }

  getSelectedCasierSizeAbri() {
    const input = document.querySelector('input[name="tailleCasiersAbri"]:checked');
    return parseInt(input?.value || 24);
  }

  logVisibleMeshGroups() {
    if (!this.currentModel) {
      return;
    }
    // Debug function to log mesh hierarchy and visibility
    console.log('=== VISIBLE MESH GROUPS ===');
    const visibleNodes = [];
    const hiddenNodes = [];
    this.currentModel.traverse(node => {
      if (node.isMesh || node.type === 'Group' || node.type === 'Object3D') {
        const name = node.name || `<unnamed-${node.id}>`;
        const key = `${node.type}:${name}`;
        if (node.visible) {
          visibleNodes.push(key);
        } else {
          hiddenNodes.push(key);
        }
      }
    });
    console.log('VISIBLE:', visibleNodes.length > 0 ? visibleNodes : 'None');
    console.log('HIDDEN:', hiddenNodes.length > 0 ? hiddenNodes : 'None');
    console.log('============================');
  }
  
  applyMaterials(options) {
    // Apply white material to Abri Minimaliste base first
    if (this.currentModuleType === 'Abri Minimaliste') {
      this.applyAbriMaterial();
    }

    // Get the selected vinyl version to pass to other materials that should follow it
    let vinylVersion = null;
    if (options.includes('Vinyle extérieur')) {
      vinylVersion = document.querySelector('input[name="vinylVersion"]')?.value || 'Légumes';
      this.applyVinylTexture(vinylVersion);
    }
    
    // Apply wood color
    if (options.includes('Acier imitation bois')) {
      this.applyWoodColor();
    }

    // Apply bardage wood material
    if (options.includes('Bardage bois')) {
      this.applyBardageTexture();
    }
    
    // Apply chapeau dibond texture - pass vinyl version so it follows the vinyl style
    if (options.includes('Chapeau Dibond')) {
      this.applyChapeauTexture(vinylVersion);
    }

    // Apply rideau material
    if (options.includes('Rideau motorisé')) {
      this.applyRideauMaterial();
    }
  }

  applyRideauMaterial() {
    const nodeKeys = ['Mesh:Volet', 'Group:Volet'];
    this.forEachMaterial(nodeKeys, mat => {
      mat.map = null;
      mat.color.setHex(0xeeeeee);
      mat.metalness = 0.05;
      mat.roughness = 0.45;
      mat.clearcoat = 0.1;
      mat.clearcoatRoughness = 0.2;
      mat.needsUpdate = true;
    });
  }

  applyAbriMaterial() {
    // Apply simple white material to Abri Minimaliste base (Borne)
    const nodeKeys = ['Mesh:Borne', 'Group:Borne'];
    this.forEachMaterial(nodeKeys, mat => {
      mat.map = null;
      mat.color.setHex(0xffffff); // Pure white
      mat.metalness = 0.1;
      mat.roughness = 0.6;
      mat.needsUpdate = true;
    });

    // Apply white material specifically to "Object3D:Abri_Minimaliste"
    const nodeKeys2 = ['Object3D:Abri_Minimaliste'];
    this.forEachMaterial(nodeKeys2, mat => {
      mat.map = null;
      mat.color.setHex(0xffffff); // Pure white
      mat.metalness = 0.1;
      mat.roughness = 0.6;
      mat.needsUpdate = true;
    });

    // Apply darker white material to casier mesh groups and Borne
    const casierNodeKeys = ['Mesh:Casier-15', 'Group:Casier-15', 'Mesh:Casier-21', 'Group:Casier-21', 'Mesh:Casier-24', 'Group:Casier-24', 'Mesh:Borne', 'Group:Borne'];
    this.forEachMaterial(casierNodeKeys, mat => {
      mat.map = null;
      mat.color.setHex(0xffffff); // Darker white (light gray)
      mat.metalness = 0.1;
      mat.roughness = 0.6;
      mat.needsUpdate = true;
    });

    console.log(`[applyAbriMaterial] Applied white material to Object3D:Abri_Minimaliste and darker white to casiers and borne`);
  }

  applyBardageTexture() {
    // Targets both regular and baie vitrée versions
    const nodeKeys = [
      'Mesh:Bardage',
      'Group:Bardage',
      'Mesh:BardageBaieVitree',
      'Group:BardageBaieVitree'
    ];
    const bardageTexture = getCachedTexture('/Bardage-basecolor.jpg', { sRGB: true });
    bardageTexture.wrapS = THREE.RepeatWrapping;
    bardageTexture.wrapT = THREE.RepeatWrapping;
    bardageTexture.flipY = false;
    bardageTexture.needsUpdate = true;

    this.forEachMaterial(nodeKeys, mat => {
      mat.map = bardageTexture;
      mat.color.setHex(0xffffff);
      mat.metalness = 0.2;
      mat.roughness = 0.75;
      mat.needsUpdate = true;
    });
  }

  applyChapeauTexture(vinylVersion = null) {
    // Apply texture to the chapeau (PanneauDibond + StructureDibond) meshes/groups
    // If vinylVersion is provided, use the matching Dibond style; otherwise use basic
    const nodeKeys = [
      'Mesh:PanneauDibond',
      'Group:PanneauDibond',
      'Mesh:StructureDibond',
      'Group:StructureDibond'
    ];
    const roughnessMap = getCachedTexture('/metalpaint-roughness.jpg');
    const metalnessMap = getCachedTexture('/metalpaint-metalness.jpg');
    let normalMap;
    try { normalMap = getCachedTexture('/metalpaint-normal.jpg'); } catch (e) {}

    [roughnessMap, metalnessMap, normalMap].forEach(tex => {
      if (!tex) return;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      tex.needsUpdate = true;
    });

    // Determine which Dibond texture to use based on vinyl version
    let chapeauTexturePath = '/ChapeauDibond-basecolor.jpg';
    if (vinylVersion) {
      const dibondTextureMap = {
        'Boucherie': '/ChapeauDibond-Viande.jpg',
        'Poissons': '/ChapeauDibond-Poissons.jpg',
        'Légumes': '/ChapeauDibond-Legumes.jpg',
        'Traiteur': '/ChapeauDibond-Traiteur.jpg'
      };
      chapeauTexturePath = dibondTextureMap[vinylVersion] || dibondTextureMap['Boucherie'];
    }

    const chapeauTexture = getCachedTexture(chapeauTexturePath, { sRGB: true });
    chapeauTexture.wrapS = THREE.RepeatWrapping;
    chapeauTexture.wrapT = THREE.RepeatWrapping;
    chapeauTexture.flipY = false;
    chapeauTexture.needsUpdate = true;

    this.forEachMaterial(nodeKeys, (mat, mesh) => {
      const isStructure = mesh.name?.includes('StructureDibond');
      if (isStructure) {
        mat.map = null;
        mat.roughnessMap = roughnessMap;
        mat.metalnessMap = metalnessMap;
        if (normalMap) mat.normalMap = normalMap;
        mat.metalness = 0.8;
        mat.roughness = 0.7;
        mat.color.setHex(0x7e7e82);
      } else {
        mat.map = chapeauTexture;
        mat.color.setHex(0xffffff);
        mat.metalness = 0.05;
        mat.roughness = 0.3;
        mat.emissive.setHex(0x222222);
        mat.emissiveIntensity = 0.15;
      }
      mat.needsUpdate = true;
    });
  }
  
  applyVinylTexture(vinylVersion = 'Légumes') {
    // Map vinyl version to texture file path
    const vinylTextureMap = {
      'Boucherie': '/VinylExterieur-Viande.jpg',
      'Poissons': '/VinylExterieur-Poissons.jpg',
      'Légumes': '/VinylExterieur-Legumes.jpg',
      'Traiteur': '/VinylExterieur-Traiteur.jpg'
    };
    
    const vinylTexturePath = vinylTextureMap[vinylVersion] || vinylTextureMap['Boucherie'];
    
    console.log(`[applyVinylTexture] Applying vinyl texture version: ${vinylVersion} (${vinylTexturePath})`);
    
    // Apply to both regular and baie vitrée versions (Kiosque)
    const nodeKeys = [
      'Mesh:Vinyl',
      'Mesh:VinylBaieVitree',
      'Group:VinylBaieVitree'
    ];

    const vinylTexture = getCachedTexture(vinylTexturePath, { sRGB: true });
    vinylTexture.wrapS = THREE.RepeatWrapping;
    vinylTexture.wrapT = THREE.RepeatWrapping;
    vinylTexture.flipY = false;
    vinylTexture.needsUpdate = true;

    this.forEachMaterial(nodeKeys, mat => {
      mat.map = vinylTexture;
      mat.color.setHex(0xffffff);
      mat.metalness = 0;
      mat.roughness = 0.15;
      mat.emissive.setHex(0x333333);
      mat.emissiveIntensity = 0.2;
      mat.needsUpdate = true;
    });

    // Apply Abri-specific vinyl texture to AbriMinimaliste meshes
    // Note: Abri Minimaliste only has a generic vinyl texture (no variants available)
    const abriVinylTexturePath = '/VinylAbriMinimaliste.jpg';
    const abriVinylTexture = getCachedTexture(abriVinylTexturePath, { sRGB: true });
    abriVinylTexture.wrapS = THREE.RepeatWrapping;
    abriVinylTexture.wrapT = THREE.RepeatWrapping;
    abriVinylTexture.flipY = false;
    abriVinylTexture.needsUpdate = true;

    // Apply to selected AbriMinimaliste variant (24, 15-21)
    if (this.currentModel) {
      this.currentModel.traverse(node => {
        if (node.name && node.name.includes('AbriMinimaliste') && node.isMesh) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach(mat => {
            if (mat) {
              mat.map = abriVinylTexture;
              mat.color.setHex(0xffffff);
              mat.metalness = 0;
              mat.roughness = 0.15;
              mat.emissive.setHex(0x333333);
              mat.emissiveIntensity = 0.15;
              mat.needsUpdate = true;
            }
          });
          console.log(`[applyVinylTexture] Applied Abri vinyl texture (${vinylVersion}) to: ${node.name}`);
        }
      });
    }
  }
  
  applyWoodColor() {
    // Apply to both regular and baie vitrée versions
    const nodeKeys = [
      'Mesh:AcierBois',
      'Group:AcierBois',
      'Mesh:AcierBoisBaieVitree',
      'Group:AcierBoisBaieVitree'
    ];

    const baseTexture = getCachedTexture('/AcierBois-basecolor.jpg', { sRGB: true });
    baseTexture.wrapS = THREE.RepeatWrapping;
    baseTexture.wrapT = THREE.RepeatWrapping;
    baseTexture.flipY = false;
    baseTexture.needsUpdate = true;

    const bumpTexture = baseTexture.clone();
    try { bumpTexture.colorSpace = THREE.LinearColorSpace; } catch (e) {}
    bumpTexture.wrapS = THREE.RepeatWrapping;
    bumpTexture.wrapT = THREE.RepeatWrapping;
    bumpTexture.flipY = false;
    bumpTexture.needsUpdate = true;

    this.forEachMaterial(nodeKeys, mat => {
      mat.map = baseTexture;
      mat.bumpMap = bumpTexture;
      if (mat.bumpScale === undefined) mat.bumpScale = 0.005;
      mat.color.setHex(0xffffff);
      mat.metalness = 0.3;
      mat.roughness = 0.8;
      mat.needsUpdate = true;
    });
  }
  

  
  setTransparency(transparent) {
    if (!this.currentModel || this.isTransparent === transparent) return;
    
    this.isTransparent = transparent;
    
    this.currentModel.traverse(node => {
      if (!node.isMesh) return;
      
      const materials = Array.isArray(node.material) 
        ? node.material 
        : [node.material];
      
      materials.forEach(mat => {
        if (transparent) {
          if (mat.userData.originalOpacity === undefined) {
            mat.userData.originalOpacity = mat.opacity || 1.0;
            mat.userData.originalTransparent = mat.transparent || false;
            mat.userData.originalDepthWrite = mat.depthWrite !== undefined ? mat.depthWrite : true;
          }
          mat.transparent = true;
          mat.opacity = CONFIG.materials.TRANSPARENT_OPACITY;
          mat.depthWrite = false;
        } else {
          if (mat.userData.originalOpacity !== undefined) {
            mat.opacity = mat.userData.originalOpacity;
            mat.transparent = mat.userData.originalTransparent;
            mat.depthWrite = mat.userData.originalDepthWrite;
          }
        }
        mat.needsUpdate = true;
      });
    });
  }
  
  setModelVisible(visible) {
    if (this.currentModel) {
      this.currentModel.visible = visible;
      console.log(`[ModelManager] Model visibility set to: ${visible}`);
    }
  }
  
  createFallbackModel(type) {
    const geometry = type === 'Kiosque'
      ? new THREE.BoxGeometry(2, 2, 2)
      : new THREE.ConeGeometry(1.2, 2.5, 32);
      
    const material = new THREE.MeshStandardMaterial({
      color: CONFIG.colors['Body Color - Blanc'],
      metalness: CONFIG.materials.DEFAULT_METALNESS,
      roughness: CONFIG.materials.DEFAULT_ROUGHNESS,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    
    this.scene.modelGroup.add(mesh);
    this.currentModel = mesh;
    
    return mesh;
  }
}

// ============================================
// Casier Manager
// ============================================

class CasierManager {
  constructor(sceneManager) {
    this.scene = sceneManager;
    this._casierLoader = null;
    this._casierMasterModel = null;
    this._casierGroups = new Map();
    this._casierDimensions = new Map();
    this._borneGroups = new Map();
    this._borneDimensions = new Map();
  }

  async getCasierLoader() {
    if (this._casierLoader) {
      return this._casierLoader;
    }

    let GLTFLoaderCtor, DRACOLoaderCtor;
    
    // First check if loaders are available in window.THREELoaders
    if (window.THREELoaders?.GLTFLoader && window.THREELoaders?.DRACOLoader) {
      GLTFLoaderCtor = window.THREELoaders.GLTFLoader;
      DRACOLoaderCtor = window.THREELoaders.DRACOLoader;
    } 
    // Fallback to dynamic import
    else {
      const [gltfMod, dracoMod] = await Promise.all([
        import('https://unpkg.com/three@0.153.0/examples/jsm/loaders/GLTFLoader.js'),
        import('https://unpkg.com/three@0.153.0/examples/jsm/loaders/DRACOLoader.js')
      ]);
      GLTFLoaderCtor = gltfMod.GLTFLoader;
      DRACOLoaderCtor = dracoMod.DRACOLoader;
    }

    // Setup DRACOLoader
    const dracoLoader = new DRACOLoaderCtor();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

    // Setup GLTFLoader with DRACOLoader
    const gltfLoader = new GLTFLoaderCtor();
    gltfLoader.setDRACOLoader(dracoLoader);
    
    this._casierLoader = gltfLoader;
    return this._casierLoader;
  }

  async ensureCasierMasterModel() {
    if (this._casierMasterModel) return this._casierMasterModel;

    const loader = await this.getCasierLoader();
    await new Promise((resolve, reject) => {
      loader.load('/CasierMaster-DRACO.glb', (gltf) => {
        this._casierMasterModel = gltf.scene;
        resolve();
      }, undefined, reject);
    });

    return this._casierMasterModel;
  }

  async getCasierTemplate(size) {
    const groupName = size === 24 ? 'Casier-24'
      : size === 21 ? 'Casier-21'
      : size === 15 ? 'Casier-15'
      : null;

    if (!groupName) return null;

    if (!this._casierGroups.has(groupName)) {
      const master = await this.ensureCasierMasterModel();
      let found = null;
      master.traverse(node => {
        if (!found && node.name === groupName) {
          found = node;
        }
      });
      if (found) {
        this._casierGroups.set(groupName, found);
      }
    }

    return this._casierGroups.get(groupName) || null;
  }

  async getCasierDimensions(size) {
    if (this._casierDimensions.has(size)) {
      return this._casierDimensions.get(size);
    }

    const template = await this.getCasierTemplate(size);
    if (!template) return null;

    const box = new THREE.Box3().setFromObject(template);
    const dimensions = {
      width: box.max.x - box.min.x,
      height: box.max.y - box.min.y,
      depth: box.max.z - box.min.z
    };

    this._casierDimensions.set(size, dimensions);
    return dimensions;
  }

  async cacheBorneGroups() {
    if (this._borneGroups.size > 0) return;

    const master = await this.ensureCasierMasterModel();
    master.traverse(node => {
      if (!node.parent) return;
      const parentName = node.parent.name || '';
      const isBorneParent = parentName === 'Borne' || parentName.endsWith('/Borne');
      if (!isBorneParent) return;

      if (node.name === 'Pilier' || node.name === 'Classique' || node.name === 'Murale') {
        this._borneGroups.set(node.name, node);
      }
    });
  }

  normalizeBorneKey(typeBorne) {
    if (typeof typeBorne !== 'string') return 'Pilier';
    const normalized = typeBorne.toLowerCase();
    if (normalized.includes('classique')) return 'Classique';
    if (normalized.includes('murale')) return 'Murale';
    return 'Pilier';
  }

  async getBorneTemplate(typeBorne) {
    await this.cacheBorneGroups();
    const key = this.normalizeBorneKey(typeBorne);
    return this._borneGroups.get(key) || null;
  }

  async getBorneDimensions(typeBorne) {
    const key = this.normalizeBorneKey(typeBorne);
    if (this._borneDimensions.has(key)) {
      return this._borneDimensions.get(key);
    }

    const group = await this.getBorneTemplate(key);
    if (!group) return null;

    const box = new THREE.Box3().setFromObject(group);
    const dimensions = {
      width: box.max.x - box.min.x,
      height: box.max.y - box.min.y,
      depth: box.max.z - box.min.z
    };

    this._borneDimensions.set(key, dimensions);
    return dimensions;
  }

  async updateVisualization(config) {
    // DEPRECATED: Use updateVisualization_Kiosque or updateVisualization_Abri directly
    // This method is kept for backwards compatibility only
    this.clear();
    
    if (!config.isValid) return;
    
    if (config.moduleType === 'Kiosque') {
      await this.updateVisualization_Kiosque(config);
    } else if (config.moduleType === 'Abri Minimaliste') {
      await this.updateVisualization_Abri(config);
    }
  }
  
  async updateVisualization_Kiosque(config) {
    // Clear any previous casiers first (important for clean module switching)
    this.clear();
    
    console.log('[CasierManager] Updating Kiosque visualization with config:', config);
    
    const nbModules = config.nbModules;
    const size = config.tailleCasiers;
    const fallbackDims = CONFIG.casiers.dimensions[size];

    const casierTemplate = await this.getCasierTemplate(size);
    const cachedDimensions = await this.getCasierDimensions(size);
    const casierDims = cachedDimensions || fallbackDims;
    const spacingZ = cachedDimensions ? 0.02 : 0.05;
    if (!casierDims) {
      console.warn(`[CasierManager] Unknown casier size: ${size}`);
      return;
    }
    const scale = 1;

    const borneTemplate = await this.getBorneTemplate(config.typeBorne);
    const borneDims = await this.getBorneDimensions(config.typeBorne);
    const scaledBorneDepth = (borneDims?.depth || 0) * scale;
    const scaledBorneHeight = (borneDims?.height || 0) * scale;
    const borneSpacing = borneTemplate ? 0.01 : 0;

    const scaledCasierDepth = casierDims.depth * scale;
    const scaledCasierHeight = casierDims.height * scale;
    const scaledCasierWidth = casierDims.width * scale;

    let totalDepth = nbModules * scaledCasierDepth + Math.max(0, nbModules - 1) * spacingZ;
    if (borneTemplate) totalDepth += scaledBorneDepth + borneSpacing;

    const startZ = -totalDepth / 2 + scaledCasierDepth / 2;
    const borneInsertAt = nbModules === 1 ? 0 : (nbModules === 4 || nbModules === 5) ? 2 : 1;

    for (let i = 0; i < nbModules; i++) {
      if (borneTemplate && i === borneInsertAt) {
        let bornePositionStartZ = startZ;
        for (let j = 0; j < i; j++) {
          bornePositionStartZ += scaledCasierDepth + spacingZ;
        }
        const borneZ = bornePositionStartZ + scaledCasierDepth / 2 + borneSpacing + scaledBorneDepth / 2;
        const borneY = scaledBorneHeight / 2;
        this.addBorneFromGroup(borneTemplate, borneZ, borneY, scaledBorneDepth);
      }

      const x = 0;
      const y = scaledCasierHeight / 2;
      let z = startZ + i * (scaledCasierDepth + spacingZ);
      if (borneTemplate && i > borneInsertAt) {
        z += scaledBorneDepth + borneSpacing;
      }

      // Check if Chambre froide is activated
      const chambreFroideChecked = document.querySelector('input[value="Chambre froide"]')?.checked;
      
      const isFirstRotated = (i === 0 && nbModules > 3) || (i === 0 && chambreFroideChecked && nbModules === 3);
      const isLastRotated = i === nbModules - 1 && nbModules === 5;
      const isAdjacentToFirstRotated = i === 1 && nbModules > 3;
      const isAdjacentToLastRotated = i === nbModules - 2 && nbModules === 5;
      
      // Only reduce spacing for rotated casiers themselves (first and last when 5)
      // Don't reduce for adjacent casiers since rotated casiers have moved off the Z-axis line
      if (isFirstRotated || isLastRotated) {
        z -= spacingZ;
      }

      // Determine rotation for first casier when Chambre froide is active with 3 modules
      const shouldRotateFirst = i === 0 && chambreFroideChecked && nbModules === 3;
      const rotation = shouldRotateFirst ? -Math.PI / 2 : 0;
      
      if (casierTemplate) {
        this.addCasierFromGroup(
          casierTemplate,
          { x, y, z, rotation },
          { width: scaledCasierWidth, height: scaledCasierHeight, depth: scaledCasierDepth },
          i === 0,
          nbModules,
          i === nbModules - 1
        );
      } else {
        this.addCasierWorldPosition(size, { x, y, z, rotation });
      }
    }

    this.scene.casierGroup.position.set(0, -0.9, 0);
    
    // Check if Chambre froide is activated
    const chambreFroideChecked = document.querySelector('input[value="Chambre froide"]')?.checked;
    const chambreFroideOffsetZ = chambreFroideChecked ? -1.3 : 0;
    
    // Apply Z offset based on module count and chambre froide state
    if (nbModules === 4) {
      this.scene.casierGroup.position.z = -0.6 + chambreFroideOffsetZ;
      this.scene.casierGroup.position.x = -0.6;
    } else if (nbModules === 5) {
      this.scene.casierGroup.position.z = -0 + chambreFroideOffsetZ;
      this.scene.casierGroup.position.x = -0.6;
    } else {
      this.scene.casierGroup.position.z = chambreFroideOffsetZ;
      this.scene.casierGroup.position.x = -0.6;
    }
    
    console.log('[CasierManager] Kiosque visualization complete');
  }
  
  async updateVisualization_Abri(config) {
    // Clear any previous casiers first (important for clean module switching)
    this.clear();
    
    console.log('[CasierManager] Updating Abri visualization');
    
    const nbModules = config.nbModules || 1;
    const moduleSize = config.moduleSize || 'small';
    const dims = CONFIG.abriModules.dimensions[moduleSize];
    
    // Ensure nbModules is within valid range (1-5 for Abri)
    const validNbModules = Math.max(1, Math.min(5, nbModules));
    
    // Load Abri modules from CasierMaster or use simple geometry
    const layout = CONFIG.abriModules.layout[validNbModules] || [];
    
    // Duplicate each module beside its original position
    layout.forEach((position, index) => {
      const wall = CONFIG.abriModules.walls[position.side];
      if (!wall) return;
      
      const x = wall.x;
      const y = dims.height / 2;
      const z = wall.z;
      const rotation = wall.rotation || 0;
      
      // Add original module
      this.addModuleWorldPosition(moduleSize, { x, y, z, rotation });
      
      // Add duplicate module beside it (offset on Z axis)
      // Position duplicate so its edge touches the original's edge (minimal spacing)
      const duplicateZ = z + dims.depth + 0.01; // Minimal spacing between duplicates
      this.addModuleWorldPosition(moduleSize, { x, y, z: duplicateZ, rotation });
    });
    
    // Position casier group for Abri
    this.scene.casierGroup.position.y = -0.7;
    this.scene.casierGroup.position.x = 0;
    
    console.log('[CasierManager] Abri visualization complete with', validNbModules * 2, 'modules (duplicated)');
  }

  addCasierFromGroup(group, worldPos, dims, isFirstCasier = false, nbModules = 1, isLastCasier = false) {
    // Clone the group to avoid sharing the same object
    const casier = group.clone(true);
    // Ensure all nodes are visible
    casier.visible = true;
    const casierColor = 0xffffff; // White
    const glassColor = 0xcccccc; // Slight grey for glass
    
    casier.traverse(node => {
      node.visible = true;
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // Clone and apply white material to casier meshes, or slight grey for -Glass meshes
        if (node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          // Check if this mesh is a Glass mesh (name ends with "-Glass")
          const isGlass = node.name && node.name.endsWith('-Glass');
          
          node.material = materials.map(mat => {
            const newMat = mat.clone();
            
            if (isGlass) {
              // Apply slight grey material to Glass meshes
              newMat.map = null;
              newMat.color.setHex(glassColor);
              newMat.metalness = 0.0;
              newMat.roughness = 0.5;
              newMat.side = THREE.FrontSide; // Ensure front face rendering
            } else {
              // Keep white material for other casier meshes
              newMat.color.setHex(casierColor);
              newMat.metalness = 0.1;
              newMat.roughness = 0.6;
            }
            
            newMat.needsUpdate = true;
            return newMat;
          });
          // If there's only one material, unwrap from array
          if (node.material.length === 1) {
            node.material = node.material[0];
          }
          
          if (isGlass) {
            console.log(`[CasierManager] Applied slight grey material to Glass mesh "${node.name}"`);
          }
        }
      }
    });
    // Reset transformation
    let posX = worldPos.x;
    let posY = worldPos.y;
    let posZ = worldPos.z;
    
    // Add X-axis offset for first casier when > 3 casiers (use casier width as offset)
    let rotationY = worldPos.rotation || 0;
    if (isFirstCasier && nbModules > 3) {
      posX += dims.width + 0.28; // Add casier width as offset on X-axis
      posZ += (dims.depth - dims.width) / 2; // Adjust Z to center rotation - after rotation, depth becomes width
      rotationY = -Math.PI / 2; // Add -90 degree rotation on Y-axis for moved casier
    }
    
    // Add positioning for first casier when Chambre froide is active with 3 modules
    if (isFirstCasier && rotationY === -Math.PI / 2 && nbModules === 3) {
      posX += dims.width + 0.28; // Add casier width as offset on X-axis
      posZ += (dims.depth - dims.width) / 2; // Adjust Z to center rotation - after rotation, depth becomes width
    }
    
    // Add Z-axis offset for last casier when 5 casiers (use casier width as offset)
    if (isLastCasier && nbModules === 5) {
      posX += dims.width + 0.28; // Add casier width as offset on X-axis (same direction as first)
      posZ -= (dims.depth - dims.width) / 2; // Adjust Z to center rotation - after rotation, depth becomes width
      rotationY = Math.PI / 2; // Add +90 degree rotation on Y-axis for moved casier
    }
    
    casier.position.set(posX, posY, posZ);
    casier.rotation.set(0, rotationY, 0);
    
    // No scaling
    const scaleUp = 1;
    casier.scale.set(
      scaleUp,
      scaleUp,
      scaleUp
    );
    this.scene.casierGroup.add(casier);
  }
  
  addCasierAtPosition(size, position) {
    const dims = CONFIG.casiers.dimensions[size];
    const color = CONFIG.casiers.colors[size];
    const wall = CONFIG.casiers.walls[position.side];
    
    if (!wall) {
      console.warn(`Unknown wall side: ${position.side}`);
      return;
    }
    
    // Calculate offset based on index for multiple modules on same wall
    const spacing = 0.1;
    let offset = 0;
    
    if (position.side === 'back') {
      // For back wall, spread modules horizontally
      offset = position.index * (dims.width + spacing) - ((dims.width + spacing) / 2);
    } else {
      // For left/right walls, spread modules along the wall
      offset = position.index * (dims.depth + spacing);
    }
    
    const geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position based on wall
    if (position.side === 'left') {
      mesh.position.set(wall.x, dims.height / 2, wall.z + offset);
    } else if (position.side === 'right') {
      mesh.position.set(wall.x, dims.height / 2, wall.z - offset);
    } else if (position.side === 'back') {
      mesh.position.set(wall.x + offset, dims.height / 2, wall.z);
    }
    
    mesh.rotation.y = wall.rotation;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.casierGroup.add(mesh);
  }

  // New helper: place a casier at explicit world coordinates (x,y,z)
  addCasierWorldPosition(size, worldPos) {
    const dims = CONFIG.casiers.dimensions[size];
    const color = CONFIG.casiers.colors[size];

    const geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
    const material = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.6,
      transparent: true,
      opacity: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
    mesh.rotation.y = worldPos.rotation || 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.casierGroup.add(mesh);
  }
  
  addModuleWorldPosition(moduleSize, worldPos) {
    const dims = CONFIG.abriModules.dimensions[moduleSize];
    
    const geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
    const material = new THREE.MeshStandardMaterial({
      color: dims.color,
      metalness: 0.3,
      roughness: 0.6,
      transparent: true,
      opacity: 0.7,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(worldPos.x, worldPos.y, worldPos.z);
    mesh.rotation.y = worldPos.rotation || 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    this.scene.casierGroup.add(mesh);
  }
  
  addBorneFromGroup(group, borneZ, borneY, scaledBorneDepth) {
    // Clone the group to avoid sharing the same object
    const borne = group.clone(true);
    borne.visible = true;
    const borneColor = 0xffffff; // White
    const ecranTexture = getCachedTexture('/BornePaiement.jpg', { sRGB: true });
    
    // Ensure proper texture settings to prevent stretching
    ecranTexture.wrapS = THREE.ClampToEdgeWrapping;
    ecranTexture.wrapT = THREE.ClampToEdgeWrapping;
    ecranTexture.flipY = false;
    ecranTexture.needsUpdate = true;
    
    borne.traverse(node => {
      node.visible = true;
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        // Clone and apply white material to borne meshes, or BornePaiement texture for Ecran
        if (node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          // Check if this mesh is an Ecran mesh (name ends with "-Ecran")
          const isEcran = node.name && node.name.endsWith('-Ecran');
          
          node.material = materials.map(mat => {
            const newMat = mat.clone();
            
            if (isEcran) {
              // Apply texture to Ecran meshes
              newMat.map = ecranTexture;
              newMat.color.setHex(0xffffff); // White base for texture
              newMat.metalness = 0.05;
              newMat.roughness = 0.3;
              newMat.side = THREE.FrontSide; // Ensure front face rendering
            } else {
              // Keep white material for other borne meshes
              newMat.color.setHex(borneColor);
              newMat.metalness = 0.1;
              newMat.roughness = 0.6;
            }
            
            newMat.needsUpdate = true;
            return newMat;
          });
          // If there's only one material, unwrap from array
          if (node.material.length === 1) {
            node.material = node.material[0];
          }
          
          if (isEcran) {
            console.log(`[CasierManager] Applied BornePaiement texture to Ecran mesh "${node.name}" with ClampToEdge wrapping`);
          }
        }
      }
    });

  // Use provided scaled dimensions directly (already calculated accurately)
    let finalBorneY = borneY;
    let finalBorneZ = borneZ;
    let finalBorneX = 0;
    
    // If parameters weren't provided, compute them from bounding box (fallback)
    if (!borneY || !scaledBorneDepth) {
      const box = new THREE.Box3().setFromObject(borne);
      const computedBorneDepth = box.max.z - box.min.z;
      const computedBorneHeight = box.max.y - box.min.y;
      
      finalBorneY = computedBorneHeight / 2;
      // If borneZ was passed as casierEndZ (old API), use it as end position
      if (typeof borneZ === 'number' && !scaledBorneDepth) {
        // Old API: casierEndZ was passed, compute new position
        const spacing = 0;
        finalBorneZ = borneZ + spacing + computedBorneDepth / 2;
      }
    }

    // Apply offsets for Murale borne type
    if (borne.name === 'Murale') {
      finalBorneY += 0.5;  // Offset Y axis
    }

    // Position the borne using provided Z position (already calculated precisely)
    borne.position.set(finalBorneX, finalBorneY, finalBorneZ);

    this.scene.casierGroup.add(borne);
  }
  
  clear() {
    while (this.scene.casierGroup.children.length > 0) {
      const child = this.scene.casierGroup.children[0];
      this.scene.casierGroup.remove(child);
      child.traverse(node => {
        if (!node.isMesh) return;
        if (node.geometry) node.geometry.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach(mat => {
          if (mat) mat.dispose();
        });
      });
    }
  }
  
  setVisible(visible) {
    this.scene.casierGroup.visible = visible;
  }
}

// ============================================
// Interaction Controller
// ============================================

class InteractionController {
  constructor(canvas, sceneManager) {
    this.canvas = canvas;
    this.scene = sceneManager;
    
    this.pointers = new Map();
    this.isPointerDown = false;
    this.activePointerId = null;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    
    this.targetRotation = CONFIG.rotation.DEFAULT_KIOSQUE;
    this.isSpinning = false;
    this.zoomEnabled = true;
    
    this.init();
  }
  
  init() {
    this.canvas.style.touchAction = 'none';
    this.canvas.style.cursor = 'grab';
    
    this.canvas.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', e => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', e => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', e => this.onPointerUp(e));
    this.canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });
  }
  
  onPointerDown(e) {
    if (e.button !== 0) return;
    
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (this.pointers.size === 1) {
      this.isPointerDown = true;
      this.activePointerId = e.pointerId;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    }
    
    this.canvas.setPointerCapture(e.pointerId);
  }
  
  onPointerMove(e) {
    if (!this.pointers.has(e.pointerId)) return;
    
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (!this.isPointerDown || e.pointerId !== this.activePointerId) return;
    
    const dx = e.clientX - this.lastPointerX;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    
    this.targetRotation += dx * CONFIG.rotation.SENSITIVITY;
  }
  
  onPointerUp(e) {
    if (e?.pointerId) {
      this.pointers.delete(e.pointerId);
      this.canvas.releasePointerCapture(e.pointerId);
    }
    
    if (this.pointers.size === 0) {
      this.isPointerDown = false;
      this.activePointerId = null;
      this.canvas.style.cursor = 'grab';
    }
  }
  
  onWheel(e) {
    e.preventDefault();
    if (!this.zoomEnabled) return;
    
    const camera = this.scene.camera;
    const radius = camera.position.length();
    const delta = Math.sign(e.deltaY) * CONFIG.camera.ZOOM_SPEED;
    
    let newRadius = Math.max(
      CONFIG.camera.MIN_RADIUS,
      Math.min(CONFIG.camera.MAX_RADIUS, radius + delta)
    );
    
    const direction = camera.position.clone().normalize();
    camera.position.copy(direction.multiplyScalar(newRadius));
    
    console.log(`[InteractionController] Zoom: radius=${newRadius.toFixed(2)} (min=${CONFIG.camera.MIN_RADIUS}, max=${CONFIG.camera.MAX_RADIUS})`);
  }
  
  update() {
    // Update spinning
    if (this.isSpinning) {
      this.targetRotation += CONFIG.rotation.SPIN_SPEED;
    }
    
    // Lerp rotation
    const current = this.scene.modelGroup.rotation.y;
    this.scene.modelGroup.rotation.y += 
      (this.targetRotation - current) * CONFIG.rotation.LERP_SPEED;
  }
  
  startSpinning() {
    this.isSpinning = true;
  }
  
  stopSpinning() {
    this.isSpinning = false;
    this.targetRotation = CONFIG.rotation.DEFAULT_KIOSQUE;
  }
}

// ============================================
// Form Controller
// ============================================

class FormController {
  constructor() {
    this.form = document.getElementById('configForm');
    this.initEventListeners();
    this.enforceCompatibilityRules();
  }
  
  initEventListeners() {
    // Module type
    document.querySelectorAll('input[name="moduleType"]').forEach(input => {
      input.addEventListener('change', () => this.onConfigChange());
    });
    
    // Options
    document.querySelectorAll('input[name="options"]').forEach(input => {
      input.addEventListener('change', () => {
        this.onConfigChange();
        this.enforceCompatibilityRules();
        this.enforceCasierLimits();
      });
    });
    
    // Abri Options
    document.querySelectorAll('input[name="optionsAbri"]').forEach(input => {
      input.addEventListener('change', () => {
        this.onConfigChange();
      });
    });
    
    // Finition
    document.querySelectorAll('input[name="finition"]').forEach(input => {
      input.addEventListener('change', () => {
        this.onConfigChange();
        this.enforceCompatibilityRules();
      });
    });
    
    // KIOSQUE-SPECIFIC Interior options - ONLY for Kiosque casier configuration
    this.setupKiosqueCasierListeners();
    
    // ABRI-SPECIFIC Interior options - ONLY for Abri casier configuration
    this.setupAbriCasierListeners();
    
    // VINYL VERSION SELECTION - Setup toggles for different vinyl types
    this.setupVinylVersionHandlers();
    
    // Card clicks
    this.initCardClickHandlers();
    
    // Add stepper button logic here
    // Expose stepper elements on the controller for other methods to update
    this.decreaseBtn = document.getElementById('decrease-btn');
    this.increaseBtn = document.getElementById('increase-btn');
    this.nbModulesDisplay = document.getElementById('nbModulesDisplay');
    this.nbModulesInput = document.getElementById('nbModules');

    // Helper to refresh display/buttons according to current value and chambre froide state
    this.updateStepControls = () => {
      if (!this.nbModulesInput || !this.nbModulesDisplay) return;
      const current = parseInt(this.nbModulesInput.value || '1');
      const chambreFroideChecked = document.querySelector('input[value="Chambre froide"]')?.checked;
      const max = chambreFroideChecked ? 3 : 5;
      // Ensure max attribute matches rule
      this.nbModulesInput.max = max;
      // Clamp value if needed
      let clamped = current;
      if (current > max) {
        clamped = max;
        this.nbModulesInput.value = String(clamped);
        // Trigger change so other listeners react (distribution UI, casiers)
        this.nbModulesInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      this.nbModulesDisplay.textContent = String(clamped);
      if (this.decreaseBtn) this.decreaseBtn.disabled = clamped <= 1;
      if (this.increaseBtn) this.increaseBtn.disabled = clamped >= max;
    };

    // Wire buttons to update the hidden input (always read/write the input value)
    if (this.decreaseBtn) {
      this.decreaseBtn.addEventListener('click', () => {
        if (!this.nbModulesInput) return;
        const current = parseInt(this.nbModulesInput.value || '1');
        if (current > 1) {
          this.nbModulesInput.value = String(current - 1);
          this.nbModulesInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        this.updateStepControls();
      });
    }

    if (this.increaseBtn) {
      this.increaseBtn.addEventListener('click', () => {
        if (!this.nbModulesInput) return;
        const chambreFroideChecked = document.querySelector('input[value="Chambre froide"]')?.checked;
        const max = chambreFroideChecked ? 3 : 5;
        const current = parseInt(this.nbModulesInput.value || '1');
        if (current < max) {
          this.nbModulesInput.value = String(current + 1);
          this.nbModulesInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        this.updateStepControls();
      });
    }

    // Initialize the controls to reflect current DOM values
    this.updateStepControls();
  }
  
  initCardClickHandlers() {
    // Handle both .option-card and .card elements with inputs
    document.querySelectorAll('.option-card, .card').forEach(card => {
      card.addEventListener('click', e => {
        // Skip if click is on vinyl toggle buttons or containers
        if (e.target.closest('.vinyl-toggle-btn') || e.target.closest('.vinyl-version-toggles')) {
          return;
        }
        
        const input = card.querySelector('input');
        if (!input) {
          console.log('[CardClickHandler] No input found in card', card);
          return;
        }
        
        console.log(`[CardClickHandler] Card clicked: ${input.name}=${input.value}, disabled=${input.disabled}, type=${input.type}`);
        
        if (input.disabled) {
          if (input?.disabled) this.showIncompatibilityToast(input);
          console.log(`[CardClickHandler] Input is disabled, showing toast`);
          return;
        }
        
        if (input.type === 'checkbox') {
          input.checked = !input.checked;
          console.log(`[CardClickHandler] Toggled checkbox: ${input.name}=${input.value}, checked=${input.checked}`);
        } else if (input.type === 'radio') {
          // For radio buttons, uncheck siblings first
          const name = input.name;
          document.querySelectorAll(`input[name="${name}"]`).forEach(sibling => {
            const siblingCard = sibling.closest('.option-card, .card');
            if (siblingCard && sibling !== input) {
              siblingCard.classList.remove('selected');
            }
          });
          input.checked = true;
          console.log(`[CardClickHandler] Selected radio: ${input.name}=${input.value}`);
        }
        
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }
  
  // ============================================
  // KIOSQUE-SPECIFIC casier listeners
  // ============================================
  setupKiosqueCasierListeners() {
    // Only listen to Kiosque-specific interior options
    document.querySelectorAll('input[name="nbModules"]').forEach(input => {
      input.addEventListener('change', () => {
        this.enforceCasierLimits();
        this.onInteriorChange();
      });
    });
    
    document.querySelectorAll('input[name="tailleCasiers"]').forEach(input => {
      input.addEventListener('change', () => this.onInteriorChange());
    });
    
    document.querySelectorAll('input[name="typeBorne"]').forEach(input => {
      input.addEventListener('change', () => this.onInteriorChange());
    });
  }
  
  // ============================================
  // ABRI-SPECIFIC casier listeners
  // ============================================
  setupAbriCasierListeners() {
    // Only listen to Abri-specific interior options
    document.querySelectorAll('input[name="tailleCasiersAbri"]').forEach(input => {
      input.addEventListener('change', () => this.onInteriorChange());
    });
    
    // Listen to Abri number of modules
    document.querySelectorAll('input[name="nbModulesAbri"]').forEach(input => {
      input.addEventListener('change', () => this.onInteriorChange());
    });
  }
  
  // ============================================
  // VINYL VERSION SELECTION HANDLERS
  // ============================================
  setupVinylVersionHandlers() {
    // Handle Kiosque vinyl version toggles
    const vinylCard = document.querySelector('input[value="Vinyle extérieur"][name="finition"]')?.closest('.option-card');
    if (vinylCard) {
      const vinylVersionContainer = vinylCard.querySelector('#vinyl-version-container');
      const vinylInput = vinylCard.querySelector('input[name="finition"][value="Vinyle extérieur"]');
      const vinylToggleBtns = vinylVersionContainer?.querySelectorAll('.vinyl-toggle-btn');
      
      if (vinylVersionContainer && vinylInput) {
        // Show/hide vinyl version toggles based on selection
        vinylInput.addEventListener('change', () => {
          vinylVersionContainer.style.display = vinylInput.checked ? 'block' : 'none';
        });
        
        // Set initial visibility
        vinylVersionContainer.style.display = vinylInput.checked ? 'block' : 'none';
      }
      
      // Handle vinyl version button clicks
      vinylToggleBtns?.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Update active button state
          vinylToggleBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Update hidden input
          const hiddenInput = vinylVersionContainer?.querySelector('input[name="vinylVersion"]');
          if (hiddenInput) {
            hiddenInput.value = btn.dataset.vinylType;
          }
          
          // Trigger config change to update preview
          this.onConfigChange();
        });
      });
    }
  }
  
  enforceCompatibilityRules() {
    const porte = document.querySelector('input[value="Porte / Baie vitrée"]');
    const rideau = document.querySelector('input[value="Rideau motorisé"]');
    
    // Rideau/porte mutually exclusive
    if (rideau && porte) {
      if (porte.checked) {
        this.setInputState(rideau, { disabled: true, checked: false });
      } else if (rideau.checked) {
        this.setInputState(porte, { disabled: true, checked: false });
      } else {
        this.setInputState(rideau, { disabled: false });
        this.setInputState(porte, { disabled: false });
      }
    }
    
    this.updateCardStyles();
  }
  
  setInputState(input, state) {
    if (!input) return;
    
    const card = input.closest('.option-card, .card');
    
    if (typeof state.checked === 'boolean') {
      input.checked = state.checked;
    }
    
    if (typeof state.disabled === 'boolean') {
      input.disabled = state.disabled;
      if (card) card.classList.toggle('disabled', state.disabled);
    }
    
    if (card) card.classList.toggle('selected', input.checked);
  }
  
  updateCardStyles() {
    document.querySelectorAll('.option-card, .card').forEach(card => {
      const input = card.querySelector('input');
      if (input) {
        card.classList.toggle('selected', input.checked);
        card.classList.toggle('disabled', input.disabled);
      }
    });
  }
  
  enforceCasierLimits() {
    const chambreFroideChecked = document.querySelector('input[value="Chambre froide"]')?.checked;
    const nbModulesInput = this.nbModulesInput || document.querySelector('input[name="nbModules"]');
    const max = chambreFroideChecked ? 3 : 5;

    if (nbModulesInput) {
      nbModulesInput.max = max;
      const current = parseInt(nbModulesInput.value || '1');
      if (current > max) {
        console.log(`[enforceCasierLimits] Reducing nbModules from ${current} to ${max} due to Chambre froide`);
        nbModulesInput.value = String(max);
        // Notify listeners (distribution update etc.) with a slight delay to ensure proper UI update
        setTimeout(() => {
          nbModulesInput.dispatchEvent(new Event('change', { bubbles: true }));
        }, 0);
      }
    }

    // Keep stepper/display state in sync if present
    if (typeof this.updateStepControls === 'function') {
      this.updateStepControls();
    }
  }
  
  showIncompatibilityToast(input) {
    const message = this.getIncompatibilityMessage(input);
    this.showToast(message);
  }
  
  getIncompatibilityMessage(input) {
    // Determine incompatibility reason
    const value = input.value;
    
    if (value === 'Rideau motorisé') {
      const porte = document.querySelector('input[value="Porte / Baie vitrée"]');
      if (porte?.checked) {
        return 'Le rideau motorisé ne peut pas être combiné avec la porte/baie vitrée';
      }
    }
    
    if (value === 'Porte / Baie vitrée') {
      const rideau = document.querySelector('input[value="Rideau motorisé"]');
      if (rideau?.checked) {
        return 'La porte/baie vitrée ne peut pas être combinée avec le rideau motorisé';
      }
    }
    
    // Add check for casier limit with chambre froide
    if (input.name === 'nbModules') {
      const chambreFroide = document.querySelector('input[value="Chambre froide"]');
      if (chambreFroide?.checked && parseInt(value) > 3) {
        return 'Maximum 3 modules de casiers avec la chambre froide';
      }
    }
    
    return 'Cette option n\'est pas disponible avec votre sélection actuelle.';
  }
  
  showToast(message, duration = 2200) {
    let toast = document.getElementById('config-toast');
    
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'config-toast';
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(40,40,40,0.95)',
        color: '#fff',
        padding: '12px 32px',
        borderRadius: '8px',
        fontSize: '1.1em',
        zIndex: '9999',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        opacity: '0',
        transition: 'opacity 0.3s'
      });
      document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, duration);
  }
  
  getConfiguration() {
    const moduleType = this.getSelectedModuleType();
    
    return {
      moduleType,
      structureOptions: this.getSelectedStructureOptions(),
      finitionOptions: this.getSelectedFinitionOptions(),
      casierOptions: this.getSelectedCasierOptions(),
      options: this.getSelectedOptions(),
      casiers: this.getCasierConfiguration(moduleType),
    };
  }
  
  getSelectedStructureOptions() {
    // Options Structure items
    const structureOptionsNames = [
      'Grutage-Goussets', 'Rideau motorisé', 'Chambre froide', 'Porte / Baie vitrée', 'Chapeau Dibond',
      'Abri - Toiture', 'Abri - Panneaux latéraux', 'Abri - Porte', 'Abri - Vitrage', 'Abri - Goutières'
    ];
    const allOptions = Array.from(
      document.querySelectorAll('input[name="options"]:checked')
    ).map(cb => cb.value);
    
    return allOptions.filter(opt => structureOptionsNames.includes(opt));
  }
  
  getSelectedFinitionOptions() {
    // Finition items (including both Kiosque and Abri finitions)
    const finitionOptionsNames = [
      'Aucune', 'Bardage bois', 'Acier imitation bois', 'Vinyle extérieur'
    ];
    const finition = document.querySelector('input[name="finition"]:checked');
    const finitionValue = (finition && finition.value !== 'Aucune') ? finition.value : null;
    
    const finitionAbri = document.querySelector('input[name="finitionAbri"]:checked');
    const finitionAbriValue = (finitionAbri && finitionAbri.value !== 'Aucune') ? finitionAbri.value : null;
    
    const result = [];
    if (finitionValue) result.push(finitionValue);
    if (finitionAbriValue) result.push(finitionAbriValue);
    return result;
  }
  
  getSelectedCasierOptions() {
    // These are the "Options du Casier" specific items
    const casierOptionsNames = ['Scanner de QR code', 'Étiquettes électroniques', 'Plinthes'];
    const moduleType = this.getSelectedModuleType();
    
    let selectedOptions = [];
    
    // Only get Kiosque casier options if Kiosque is selected
    if (moduleType === 'Kiosque') {
      const allOptions = Array.from(
        document.querySelectorAll('input[name="options"]:checked')
      ).map(cb => cb.value);
      selectedOptions = allOptions.filter(opt => casierOptionsNames.includes(opt));
    }
    // Only get Abri casier options if Abri Minimaliste is selected
    else if (moduleType === 'Abri Minimaliste') {
      const abriOptions = Array.from(
        document.querySelectorAll('input[name="optionsAbri"]:checked')
      ).map(cb => cb.value);
      selectedOptions = abriOptions.filter(opt => casierOptionsNames.includes(opt));
    }
    
    return selectedOptions;
  }
  
  getSelectedModuleType() {
    const input = document.querySelector('input[name="moduleType"]:checked');
    return input?.value || 'Kiosque';
  }
  
  getSelectedOptions() {
    const casierOptionsNames = ['Scanner de QR code', 'Étiquettes électroniques', 'Plinthes'];
    const options = Array.from(
      document.querySelectorAll('input[name="options"]:checked')
    ).map(cb => cb.value)
      .filter(opt => !casierOptionsNames.includes(opt)); // Exclude casier options
    
    // This method is now mostly for backwards compatibility
    // The actual organization happens in updateSummary() using structureOptions and finitionOptions
    return options;
  }

  getSelectedAbriOptions() {
    // Get all Abri-specific options from the form
    const abriOptions = Array.from(
      document.querySelectorAll('input[name="optionsAbri"]:checked')
    ).map(cb => cb.value);
    
    return abriOptions;
  }
  
  getCasierConfiguration(moduleType = 'Kiosque') {
    if (moduleType === 'Kiosque') {
      return this.getKiosqueCasierConfiguration();
    } else if (moduleType === 'Abri Minimaliste') {
      return this.getAbriCasierConfiguration();
    }
    return { isValid: false };
  }
  
  // KIOSQUE-SPECIFIC casier configuration
  getKiosqueCasierConfiguration() {
    const nbModules = this.getSelectedNbModules();
    const tailleCasiers = this.getSelectedTailleCasiers();
    const typeBorne = this.getSelectedTypeBorne();
    return {
      moduleType: 'Kiosque',
      nbModules,
      tailleCasiers,
      typeBorne,
      isValid: true,
    };
  }
  
  // ABRI-SPECIFIC casier configuration
  getAbriCasierConfiguration() {
    const nbModules = this.getSelectedNbModulesAbri();
    const tailleCasiers = this.getSelectedTailleCasiersAbri?.() || 24;
    return {
      moduleType: 'Abri Minimaliste',
      nbModules,
      tailleCasiers,
      isValid: true,
    };
  }
  
  getSelectedTailleCasiersAbri() {
    const input = document.querySelector('input[name="tailleCasiersAbri"]:checked');
    return parseInt(input?.value || 24);
  }
  
  getSelectedNbModulesAbri() {
    const input = document.querySelector('input[name="nbModulesAbri"]');
    return parseInt(input?.value || 1);
  }
  
  getSelectedNbModules() {
    const input = document.querySelector('input[name="nbModules"]');
    return parseInt(input?.value || 1);
  }
  
  getSelectedTailleCasiers() {
    const input = document.querySelector('input[name="tailleCasiers"]:checked');
    return parseInt(input?.value || 24);
  }
  
  getSelectedTypeBorne() {
    const input = document.querySelector('input[name="typeBorne"]:checked');
    return input?.value || 'murale';
  }
  
  getSelectedVinylVersion() {
    // Get the selected vinyl version for Kiosque
    const input = document.querySelector('input[name="vinylVersion"]');
    return input?.value || 'Légumes';
  }
  
  getCasierDistribution() {
    return {
      24: parseInt(document.querySelector('input[name="dist24"]')?.value || 0),
      21: parseInt(document.querySelector('input[name="dist21"]')?.value || 0),
      15: parseInt(document.querySelector('input[name="dist15"]')?.value || 0),
    };
  }
  
  validateDistribution() {
    const nbModules = this.getSelectedNbModules();
    if (nbModules === 1) return true;
    
    const dist = this.getCasierDistribution();
    const total = dist[24] + dist[21] + dist[15];
    return total === nbModules;
  }
  
  updateDistributionDisplay() {
    const nbModules = this.getSelectedNbModules();
    const distributionDiv = document.getElementById('casier-distribution');
    const maxSpan = document.getElementById('distribution-max');
    
    if (distributionDiv) {
      distributionDiv.style.display = nbModules >= 2 ? 'block' : 'none';
      if (maxSpan) maxSpan.textContent = nbModules;
    }
    
    this.updateDistributionTotal();
  }
  
  updateDistributionTotal() {
    const dist = this.getCasierDistribution();
    const total = dist[24] + dist[21] + dist[15];
    const nbModules = this.getSelectedNbModules();
    
    const totalSpan = document.getElementById('distribution-total');
    if (totalSpan) {
      totalSpan.textContent = total;
      totalSpan.style.color = total === nbModules ? '#22c55e' : 
                             total > nbModules ? '#ef4444' : '#666';
    }
  }
  
  onConfigChange() {
    this.updateCardStyles();
    window.dispatchEvent(new CustomEvent('configChanged'));
  }
  
  onInteriorChange() {
    this.updateDistributionDisplay();
    this.updateCardStyles();
    window.dispatchEvent(new CustomEvent('interiorChanged'));
  }
}

// ============================================
// Section Observer
// ============================================

class SectionObserver {
  constructor() {
    const sectionIds = [
      'options-structure',
      'finition-section',
      'personnalisation-interieur',
      'personnalisation-abri',
      'recap-section',
    ];
    this.sections = sectionIds.map(id => {
      const el = document.getElementById(id);
      return { id, element: el };
    }).filter(s => s.element);

    this.currentActive = null;
    this.initObservers();
    this.initScrollListener();
  }
  
  initObservers() {
    const options = {
      threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
      rootMargin: '-10% 0px -10% 0px',
    };
    
    this.sections.forEach(section => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
            this.setActive(section.id);
          }
        });
      }, options);
      
      observer.observe(section.element);
    });
  }
  
  initScrollListener() {
    // Fallback: activate sections based on scroll position if intersection observer fails
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
      rightPanel.addEventListener('scroll', () => {
        let activeSection = null;
        let maxVisibleArea = 0;

        this.sections.forEach(section => {
          const rect = section.element.getBoundingClientRect();
          const panelRect = rightPanel.getBoundingClientRect();
          
          // Calculate visible area
          const visibleTop = Math.max(rect.top, panelRect.top);
          const visibleBottom = Math.min(rect.bottom, panelRect.bottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          
          if (visibleHeight > maxVisibleArea) {
            maxVisibleArea = visibleHeight;
            activeSection = section.id;
          }
        });

        if (activeSection) {
          this.setActive(activeSection);
        }
      }, { passive: true });
    }
  }
  
  setActive(sectionId) {
    if (this.currentActive === sectionId) return;
    
    this.currentActive = sectionId;
    console.log(`[SectionObserver] Setting active section: ${sectionId}`);
    
    this.sections.forEach(section => {
      const isActive = section.id === sectionId;
      
      Object.assign(section.element.style, {
        opacity: isActive ? '1' : '0.4',
        pointerEvents: isActive ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      });
      console.log(`[SectionObserver] Section ${section.id}: active=${isActive}, pointerEvents=${isActive ? 'auto' : 'none'}`);
    });
    
    window.dispatchEvent(new CustomEvent('sectionChanged', {
      detail: { sectionId }
    }));
  }
}

// ============================================
// Application
// ============================================

class KiosqueConfigurator {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    if (!this.canvas) return;

    // Initialize managers
    this.scene = new SceneManager(this.canvas);
    this.modelLoader = new ModelLoader();
    this.form = new FormController();
    this.modelManager = new ModelManager(this.scene, this.modelLoader, this.form);
    this.casierManager = new CasierManager(this.scene);
    this.interaction = new InteractionController(this.canvas, this.scene);
    this.sections = new SectionObserver();

  // Track which module type is currently loaded to avoid unnecessary reloads
  this.currentModuleType = null;
  this.hasVisitedInterior = false;

    // Setup event listeners for toggle buttons
    this.setupToggleButtonListeners();

    // Setup event listeners
    this.initEventListeners();

    // NOTE: initial model load is deferred to the async init() method so a
    // preloader can be shown while heavy assets load. See bottom of file for
    // startup flow.
  }

  async preloadTextures() {
    const texturePaths = [
      '/metalpaint-roughness.jpg',
      '/metalpaint-metalness.jpg',
      '/metalpaint-normal.jpg',
      '/Bardage-basecolor.jpg',
      '/ChapeauDibond-basecolor.jpg',
      '/VinylExterieur.jpg',
      '/AcierBois-basecolor.jpg',
      '/hdri.jpg'
    ];

    const loadPromises = texturePaths.map(path => {
      return new Promise((resolve, reject) => {
        const tex = getCachedTexture(path);
        // Since getCachedTexture uses TextureLoader.load, which is async,
        // we need to wait for it to load. But TextureLoader.load doesn't return a promise,
        // so we attach callbacks.
        // Actually, getCachedTexture returns the texture immediately, but loading is async.
        // To properly wait, we can modify getCachedTexture or use a different approach.
        // For simplicity, since it's cached, we can just call it and assume it's loading.
        // But to truly preload, let's use a promise-based load.
        const loader = new THREE.TextureLoader();
        loader.load(path, resolve, undefined, reject);
      });
    });

    await Promise.all(loadPromises);
  }

  // Perform initial async setup (load model, casiers, etc.) and start loop
  async init() {
    try {
      await this.preloadTextures(); // Preload textures first
      await this.updateConfiguration();
    } finally {
      // Start animation loop regardless of load success so UI remains active
      this.animate();
    }
  }
  setupToggleButtonListeners() {
    // Get existing HTML buttons
    const extBtn = document.querySelector('.exterior-btn');
    const intBtn = document.querySelector('.interior-btn');
    const toggleContainer = document.querySelector('.interior-exterior-toggle');

    if (!extBtn || !intBtn) {
      console.warn('Toggle buttons not found in HTML');
      return;
    }

    // State
    this.interiorViewActive = false;

    // Click handlers
    extBtn.addEventListener('click', () => {
      if (this.interiorViewActive) {
        this.interiorViewActive = false;
        extBtn.classList.add('active');
        intBtn.classList.remove('active');
        this.modelManager.setTransparency(false);
      }
    });

    intBtn.addEventListener('click', () => {
      if (!this.interiorViewActive) {
        this.interiorViewActive = true;
        intBtn.classList.add('active');
        extBtn.classList.remove('active');
        this.modelManager.setTransparency(true);
      }
    });

    // Set initial state (exterior button active by default)
    extBtn.classList.add('active');

    // Helper function to update toggle button visibility based on module type
    const updateToggleVisibility = (moduleType) => {
      if (!toggleContainer) return;
      
      if (moduleType === 'Kiosque') {
        // Show toggle buttons for Kiosque
        toggleContainer.style.display = 'flex';
        console.log('[ToggleButtons] Showing toggle buttons for Kiosque');
      } else if (moduleType === 'Abri Minimaliste') {
        // Hide toggle buttons for Abri Minimaliste
        toggleContainer.style.display = 'none';
        // Reset to exterior view when switching to Abri
        this.interiorViewActive = false;
        extBtn.classList.add('active');
        intBtn.classList.remove('active');
        this.modelManager.setTransparency(false);
        console.log('[ToggleButtons] Hiding toggle buttons for Abri Minimaliste');
      }
    };

    // Listen to module type changes
    document.querySelectorAll('input[name="moduleType"]').forEach(input => {
      input.addEventListener('change', (e) => {
        updateToggleVisibility(e.target.value);
      });
    });

    // Set initial visibility based on current module type
    const currentModuleType = document.querySelector('input[name="moduleType"]:checked')?.value || 'Kiosque';
    updateToggleVisibility(currentModuleType);
  }
  
  initEventListeners() {
    // Configuration changes
    window.addEventListener('configChanged', () => {
      this.updateConfiguration();
    });
    
    // Interior changes
    window.addEventListener('interiorChanged', () => {
      this.updateConfiguration();
      this.updateCasiers();
    });
    
    // Section changes
    window.addEventListener('sectionChanged', (e) => {
      this.onSectionChange(e.detail.sectionId);
    });
    
    // Module type changes - also update section visibility
    document.querySelectorAll('input[name="moduleType"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const moduleType = e.target.value;
        console.log(`[KiosqueConfigurator] Module type changed to: ${moduleType}`);
        
        // Ensure the correct personalization section is marked as active
        if (moduleType === 'Kiosque') {
          this.sections.setActive('personnalisation-interieur');
        } else if (moduleType === 'Abri Minimaliste') {
          this.sections.setActive('personnalisation-abri');
        }
      });
    });
   }
  
  async updateConfiguration() {
    const config = this.form.getConfiguration();
    let allOptions = [];
    
    // Only include Kiosque-specific options when using Kiosque
    if (config.moduleType === 'Kiosque') {
      allOptions = [
        ...config.structureOptions,
        ...config.finitionOptions,
        ...config.options
      ];
    }
    // Include only Abri-specific options when using Abri Minimaliste
    else if (config.moduleType === 'Abri Minimaliste') {
      const abriOptions = this.form.getSelectedAbriOptions();
      allOptions = [...abriOptions];
    }
    
    // Update model only when the module type changes or no model is loaded.
    if (!this.modelManager.currentModel || config.moduleType !== this.currentModuleType) {
      console.log(`[KiosqueConfigurator] Module type changed from ${this.currentModuleType} to ${config.moduleType}`);
      
      // Show loading indicator when switching modules
      showPreloader();
      
      // Clear casiers immediately when module type changes to prevent blue boxes from appearing
      this.casierManager.clear();
      
      await this.modelManager.loadModel(config.moduleType, allOptions);
      this.currentModuleType = config.moduleType;
      
      // Hide loading indicator when done
      hidePreloader();
    } else {
      // Apply options directly without reloading the model
      this.modelManager.applyOptions(allOptions);
    }
    
    // Ensure model is visible when configuration changes
    this.modelManager.setModelVisible(true);
    
    // Update casiers
    this.updateCasiers();
    
    // Update summary
    this.updateSummary(config);
  }
  
  updateCasiers() {
    // ONLY update casiers for the current module type
    const moduleType = this.form.getSelectedModuleType();
    
    if (moduleType === 'Kiosque') {
      const config = this.form.getKiosqueCasierConfiguration();
      this.casierManager.updateVisualization_Kiosque(config);
    } else if (moduleType === 'Abri Minimaliste') {
      const config = this.form.getAbriCasierConfiguration();
      this.casierManager.updateVisualization_Abri(config);
    }
  }
  
  onSectionChange(sectionId) {
    // Stop spinning by default when changing sections
    this.interaction.stopSpinning();
    
    if (sectionId === 'personnalisation-interieur') {
      this.hasVisitedInterior = true;
    }
    
    // Only show casiers for Kiosque, never for Abri Minimaliste
    const moduleType = this.form.getSelectedModuleType();
    const shouldShowCasiers = moduleType === 'Kiosque';
    
    switch (sectionId) {
      case 'personnalisation-interieur':
        this.modelManager.setTransparency(true);
        // Only show casiers if in Kiosque mode
        if (shouldShowCasiers) {
          this.casierManager.setVisible(true);
        } else {
          this.casierManager.setVisible(false);
        }
        break;
        
      case 'recap-section':
        this.interaction.startSpinning();
        this.modelManager.setTransparency(false);
        // Only show casiers in recap if in Kiosque mode and visited interior
        if (shouldShowCasiers && this.hasVisitedInterior) {
          this.casierManager.setVisible(true);
        } else {
          this.casierManager.setVisible(false);
        }
        break;
        
      default:
        this.modelManager.setTransparency(false);
        // Only show casiers if in Kiosque mode and visited interior
        if (shouldShowCasiers && this.hasVisitedInterior) {
          this.casierManager.setVisible(true);
        } else {
          this.casierManager.setVisible(false);
        }
    }
  }
  
  updateSummary(config) {
    const summaryDiv = document.getElementById('config-summary');
    if (!summaryDiv) return;
    
    if (config.moduleType === 'Kiosque') {
      this.updateSummary_Kiosque(config, summaryDiv);
    } else if (config.moduleType === 'Abri Minimaliste') {
      this.updateSummary_Abri(config, summaryDiv);
    }
  }

  updateSummary_Kiosque(config, summaryDiv) {
    let html = `<div style="margin-bottom: 16px;">
      <div style="font-weight: bold; margin-bottom: 8px;">Module:</div>
      <div style="margin-left: 16px; margin-bottom: 12px;">${config.moduleType}</div>
    </div>`;
    
    // Helper function to render options section
    const renderOptionsSection = (title, options) => {
      if (!options || options.length === 0) return '';
      
      let sectionHtml = `<div style="margin-bottom: 16px;">
        <div style="font-weight: bold; margin-bottom: 8px;">${title}:</div>
        <div style="margin-left: 16px; margin-bottom: 12px;">`;
      
      options.forEach(opt => {
        // Find the option card with this value
        const optionInput = document.querySelector(`input[name="options"][value="${opt}"], input[name="finition"][value="${opt}"]`);
        const optionCard = optionInput?.closest('.option-card, .card');
        const iconElement = optionCard?.querySelector('.icon-placeholder svg');
        
        let iconHtml = '';
        if (iconElement) {
          // Clone and modify the SVG for the recap
          const clonedSvg = iconElement.cloneNode(true);
          // Set a smaller size for recap display
          clonedSvg.setAttribute('width', '16');
          clonedSvg.setAttribute('height', '16');
          clonedSvg.style.display = 'inline';
          clonedSvg.style.marginRight = '8px';
          clonedSvg.style.verticalAlign = 'middle';
          iconHtml = clonedSvg.outerHTML;
        }
        
        sectionHtml += `<div style="margin-bottom: 6px; display: flex; align-items: center;">${iconHtml}<span>• ${opt}</span></div>`;
      });
      
      sectionHtml += `</div>
      </div>`;
      return sectionHtml;
    };
    
    // Add Options Structure section
    if (config.structureOptions && config.structureOptions.length > 0) {
      html += renderOptionsSection('Options Structure', config.structureOptions);
    }
    
    // Add Finitions section
    if (config.finitionOptions && config.finitionOptions.length > 0) {
      html += renderOptionsSection('Finitions', config.finitionOptions);
    }

    // Add "Options du Casier" section
    if (config.casierOptions && config.casierOptions.length > 0) {
      html += renderOptionsSection('Options du Casier', config.casierOptions);
    }
    
    // Add casiers section
    html += `<div style="margin-bottom: 16px;">
      <div style="font-weight: bold; margin-bottom: 8px;">Casiers:</div>
      <div style="margin-left: 16px;">`;
    
    html += `<div style="margin-bottom: 6px;">• ${config.casiers.nbModules} module(s) de ${config.casiers.tailleCasiers} casiers</div>
      <div style="margin-bottom: 6px;">• Borne ${config.casiers.typeBorne}</div>`;
    
    if (config.casiers.distribution) {
      html += `<div style="margin-bottom: 6px;">• Distribution: `;
      const parts = [];
      Object.entries(config.casiers.distribution).forEach(([size, count]) => {
        if (count > 0) parts.push(`${count}×${size}`);
      });
      html += parts.join(', ') + '</div>';
    }
    
    html += `</div>
    </div>`;
    
    summaryDiv.innerHTML = html;
  }

  updateSummary_Abri(config, summaryDiv) {
    let html = `<div style="margin-bottom: 16px;">
      <div style="font-weight: bold; margin-bottom: 8px;">Module:</div>
      <div style="margin-left: 16px; margin-bottom: 12px;">${config.moduleType}</div>
    </div>`;
    
    // Helper function to render options section
    const renderOptionsSection = (title, options) => {
      if (!options || options.length === 0) return '';
      
      let sectionHtml = `<div style="margin-bottom: 16px;">
        <div style="font-weight: bold; margin-bottom: 8px;">${title}:</div>
        <div style="margin-left: 16px; margin-bottom: 12px;">`;
      
      options.forEach(opt => {
        // Find the option card with this value
        const optionInput = document.querySelector(`input[name="optionsAbri"][value="${opt}"]`);
        const optionCard = optionInput?.closest('.option-card, .card');
        const iconElement = optionCard?.querySelector('.icon-placeholder svg');
        
        let iconHtml = '';
        if (iconElement) {
          // Clone and modify the SVG for the recap
          const clonedSvg = iconElement.cloneNode(true);
          // Set a smaller size for recap display
          clonedSvg.setAttribute('width', '16');
          clonedSvg.setAttribute('height', '16');
          clonedSvg.style.display = 'inline';
          clonedSvg.style.marginRight = '8px';
          clonedSvg.style.verticalAlign = 'middle';
          iconHtml = clonedSvg.outerHTML;
        }
        
        sectionHtml += `<div style="margin-bottom: 6px; display: flex; align-items: center;">${iconHtml}<span>• ${opt}</span></div>`;
      });
      
      sectionHtml += `</div>
      </div>`;
      return sectionHtml;
    };
    
    // Add casier selection section
    html += `<div style="margin-bottom: 16px;">
      <div style="font-weight: bold; margin-bottom: 8px;">Configuration des casiers:</div>
      <div style="margin-left: 16px;">
        <div style="margin-bottom: 6px;">• ${config.casiers.tailleCasiers} casiers par module</div>
      </div>
    </div>`;
    
    // Add "Options des casiers" section
    if (config.casierOptions && config.casierOptions.length > 0) {
      html += renderOptionsSection('Options des casiers', config.casierOptions);
    }
    
    summaryDiv.innerHTML = html;
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    this.interaction.update();
    this.scene.render();
  }
}

// ============================================
// Initialize Application
// ============================================

if (document.getElementById('three-canvas')) {
  // Show preloader while initial assets and model load
  showPreloader();

  (async () => {
    try {
      window.configurator = new KiosqueConfigurator();
      if (window.configurator && typeof window.configurator.init === 'function') {
        await window.configurator.init();
      }
    } catch (err) {
      // Keep any errors in console but ensure preloader is hidden
      console.error('Failed to initialize configurator', err);
    } finally {
      hidePreloader();
    }
  })();
}