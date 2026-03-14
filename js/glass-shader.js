import * as THREE from 'three';

export function initGlassShader(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    const imgUrl = 'images/Gemini_Generated_Image_nms8hmnms8hmnms8.png';

    const params = {
        frequency: 20,
        rotationDeg: -180,
        curvePow: 1.5,
        distortion: 0.015,
        lineWidth: 0.005,
        lineIntensity: 0.17,
        speed: -0.3
    };

    const vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform vec2 uImageRes;
        uniform float uFrequency;
        uniform float uRotation;
        uniform float uDistortion;
        uniform float uCurvePow;
        uniform float uLineWidth;
        uniform float uLineIntensity;
        uniform float uTime;
        uniform float uSpeed;

        varying vec2 vUv;

        mat2 rotate2d(float _angle) {
            return mat2(cos(_angle), -sin(_angle), sin(_angle), cos(_angle));
        }

        vec2 getCoverUv(vec2 uv, vec2 resolution, vec2 texResolution) {
            vec2 s = resolution;
            vec2 i = texResolution;
            float rs = s.x / s.y;
            float ri = i.x / i.y;
            vec2 st = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
            vec2 offset = (rs < ri ? vec2((st.x - s.x) / 2.0, 0.0) : vec2(0.0, (st.y - s.y) / 2.0)) / st;
            return uv * s / st + offset;
        }

        void main() {
            vec2 uv = getCoverUv(vUv, uResolution, uImageRes);

            vec2 centered = uv - 0.5;
            vec2 rotated = rotate2d(uRotation) * centered;

            float patternPhase = rotated.x * uFrequency + (uTime * uSpeed);
            float p = fract(patternPhase);

            float shapedP = pow(p, uCurvePow);
            float displacement = (shapedP - 0.5) * uDistortion;

            vec2 offsetVector = rotate2d(-uRotation) * vec2(displacement, 0.0);

            float r = texture2D(tDiffuse, uv + offsetVector).r;
            float g = texture2D(tDiffuse, uv + offsetVector * 1.01 + vec2(0.002, 0.0)).g;
            float b = texture2D(tDiffuse, uv + offsetVector * 1.02 + vec2(0.004, 0.0)).b;
            vec3 color = vec3(r, g, b);

            float line = smoothstep(1.0 - uLineWidth, 1.0, p);
            color += vec3(line * uLineIntensity);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    loader.load(imgUrl, (texture) => {
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: texture },
                uResolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
                uImageRes: { value: new THREE.Vector2(texture.image.width, texture.image.height) },
                uTime: { value: 0 },
                uFrequency: { value: params.frequency },
                uRotation: { value: params.rotationDeg * (Math.PI / 180) },
                uDistortion: { value: params.distortion },
                uCurvePow: { value: params.curvePow },
                uLineWidth: { value: params.lineWidth },
                uLineIntensity: { value: params.lineIntensity },
                uSpeed: { value: params.speed }
            },
            vertexShader,
            fragmentShader
        });

        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(mesh);

        window.addEventListener('resize', () => {
            renderer.setSize(container.clientWidth, container.clientHeight);
            material.uniforms.uResolution.value.set(container.clientWidth, container.clientHeight);
        });

        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            material.uniforms.uTime.value = clock.getElapsedTime();
            renderer.render(scene, camera);
        }
        animate();
    });
}
