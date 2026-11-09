// 3D START star for StartStar.astro. Named imports keep the three.js bundle to the
// classes used here; the component loads this module only when the star is near
// the viewport.
import {
	AmbientLight,
	BufferGeometry,
	Color,
	DirectionalLight,
	DoubleSide,
	EdgesGeometry,
	Euler,
	Float32BufferAttribute,
	Group,
	IcosahedronGeometry,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	PerspectiveCamera,
	Quaternion,
	Scene,
	Vector3,
	WebGLRenderer,
} from 'three';

interface Spike {
	holder: Object3D;
	mesh: Mesh;
	from: Vector3;
	spin: Euler;
	delay: number;
	phase: number;
}

// Two even length tiers, measured from the START star artwork: short spikes reach
// 72–83 % of the longest, long spikes 87–100 %, so the tiers nearly meet.
// Bases are wide and flattened, so each spike reads as a folded blade like the
// artwork rather than a needle.
const tiers = [
	{ min: 1.62, max: 1.86, widthMin: 0.5, widthMax: 0.62 },
	{ min: 1.96, max: 2.25, widthMin: 0.56, widthMax: 0.7 },
];
const spikeCount = 32;

// Spin feel: cursor movement drives the star, which picks up speed slowly and
// coasts for a few seconds, so it feels heavy rather than twitchy.
const idleSpeed = 0.12; // rad/s around the vertical axis
const spinGain = 0.0045; // rad/s per pixel of pointer movement
const maxSpin = 3.2; // rad/s
const pickUp = 2.2; // how quickly the star follows the drive (1/s)
const coast = 0.9; // how quickly the drive fades (1/s)

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Seeded generator so the star keeps the same shape on every visit.
function seeded(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;
const easeOutBack = (value: number) => 1 + 2.2 * (value - 1) ** 3 + 1.2 * (value - 1) ** 2;

export function mountStar(root: HTMLElement) {
	const canvas = root.querySelector<HTMLCanvasElement>('.star__canvas')!;
	const toggle = root.querySelector<HTMLButtonElement>('[data-star-toggle]')!;
	const assemble = root.dataset.mode === 'assemble';

	// Colours come from tokens.css so the star follows the design system.
	const styles = getComputedStyle(root);
	const token = (name: string) => new Color(styles.getPropertyValue(name).trim());
	const light = token('--color-star-light');
	const mid = token('--color-star-mid');
	const deep = token('--color-star-deep');
	const shadow = token('--color-star-shadow');
	const accent = token('--color-accent');
	const white = token('--color-white');

	const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	const scene = new Scene();
	const camera = new PerspectiveCamera(30, 1, 0.1, 50);
	camera.position.set(0, 0, 8.4);

	// Low ambient light keeps the deep blue in shadowed facets, as in the artwork.
	scene.add(new AmbientLight(white, 0.2));
	const keyLight = new DirectionalLight(white, 2);
	keyLight.position.set(-3, 4, 5);
	scene.add(keyLight);
	const fillLight = new DirectionalLight(mid, 1.2);
	fillLight.position.set(4, -1, 3);
	scene.add(fillLight);
	const rimLight = new DirectionalLight(light, 2);
	rimLight.position.set(2, -3, -4);
	scene.add(rimLight);

	const star = new Group();
	star.quaternion.setFromEuler(new Euler(0.2, 0.6, 0));
	scene.add(star);

	const material = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.5, metalness: 0.1, side: DoubleSide });
	const edgeMaterial = new LineBasicMaterial({ color: accent, transparent: true, opacity: 0.35 });
	const core = new Mesh(new IcosahedronGeometry(0.62, 0), new MeshStandardMaterial({ color: shadow, flatShading: true, roughness: 0.85 }));
	star.add(core);

	const random = seeded(2013);
	const golden = Math.PI * (3 - Math.sqrt(5));
	const forward = new Vector3(0, 0, 1);
	const spikes: Spike[] = [];

	for (let index = 0; index < spikeCount; index++) {
		// Even spread over a sphere with only a slight jitter. Alternating tiers along
		// the spiral interleave short and long spikes.
		const y = 1 - ((index + 0.5) / spikeCount) * 2;
		const radius = Math.sqrt(1 - y * y);
		const theta = golden * index + (random() - 0.5) * 0.2;
		const direction = new Vector3(Math.cos(theta) * radius, y + (random() - 0.5) * 0.06, Math.sin(theta) * radius).normalize();
		const tier = tiers[index % 2];

		// Each spike is a 3- or 4-sided pyramid pointing along +Z.
		const length = tier.min + random() * (tier.max - tier.min);
		const width = tier.widthMin + random() * (tier.widthMax - tier.widthMin);
		const sides = random() < 0.5 ? 3 : 4;
		const twist = random() * Math.PI * 2;
		const flatness = 0.4 + random() * 0.25;
		const base = Array.from({ length: sides }, (_, side) => {
			const angle = (side / sides) * Math.PI * 2 + (random() - 0.5) * 0.4;
			const reach = width * (0.8 + random() * 0.4);
			// Squash one axis, then turn the blade to its own angle around the spike.
			const x = Math.cos(angle) * reach;
			const y = Math.sin(angle) * reach * flatness;
			return new Vector3(x * Math.cos(twist) - y * Math.sin(twist), x * Math.sin(twist) + y * Math.cos(twist), 0.25);
		});
		const tip = new Vector3((random() - 0.5) * 0.18, (random() - 0.5) * 0.18, length);

		const positions: number[] = [];
		const colors: number[] = [];
		for (let side = 0; side < sides; side++) {
			const a = base[side];
			const b = base[(side + 1) % sides];
			positions.push(a.x, a.y, a.z, b.x, b.y, b.z, tip.x, tip.y, tip.z);
			// Bright cyan where the spike leaves the core, deeper blue towards the tip.
			const tint = random();
			const inner = light.clone().lerp(mid, tint * 0.3);
			const outer = deep.clone().lerp(shadow, 0.35 + tint * 0.5);
			colors.push(...inner.toArray(), ...inner.toArray(), ...outer.toArray());
		}
		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
		geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
		geometry.computeVertexNormals();

		const mesh = new Mesh(geometry, material);
		mesh.add(new LineSegments(new EdgesGeometry(geometry), edgeMaterial));
		const holder = new Object3D();
		holder.quaternion.setFromUnitVectors(forward, direction);
		holder.add(mesh);
		star.add(holder);

		spikes.push({
			holder,
			mesh,
			from: direction.clone().multiplyScalar(5 + random() * 5),
			spin: new Euler(random() * 6, random() * 6, random() * 6),
			delay: random() * 0.7,
			phase: random() * Math.PI * 2,
		});
	}

	const still = reducedMotion.matches;
	const drive = new Vector3();
	const spin = new Vector3();
	const omega = new Vector3();
	const idle = new Vector3(0, idleSpeed, 0);
	const step = new Quaternion();

	function update(time: number, delta: number) {
		const assembleTime = assemble && !still ? time : Infinity;
		core.scale.setScalar(Math.max(easeOutBack(clamp01(assembleTime / 0.8)), 0.001));

		for (const spike of spikes) {
			const progress = easeOutCubic(clamp01((assembleTime - spike.delay) / 1.3));
			const size = 0.4 + 0.6 * progress;
			const breathe = still ? 1 : 1 + 0.03 * Math.sin(time * 0.9 + spike.phase);
			spike.holder.position.copy(spike.from).multiplyScalar(1 - progress);
			spike.mesh.rotation.set(spike.spin.x * (1 - progress), spike.spin.y * (1 - progress), spike.spin.z * (1 - progress));
			spike.mesh.scale.set(size, size, size * breathe);
		}

		if (still || !delta) return;
		spin.lerp(drive, 1 - Math.exp(-delta * pickUp));
		drive.multiplyScalar(Math.exp(-delta * coast));
		omega.copy(spin).add(idle);
		const angle = omega.length() * delta;
		if (angle > 0) star.quaternion.premultiply(step.setFromAxisAngle(omega.normalize(), angle));
	}

	let frame = 0;
	let last = 0;
	let elapsed = 0;
	let paused = false;
	let onScreen = true;

	function render(delta = 0) {
		update(elapsed, delta);
		renderer.render(scene, camera);
	}

	function tick(now: number) {
		const delta = Math.min((now - last) / 1000, 0.05);
		elapsed += delta;
		last = now;
		render(delta);
		frame = requestAnimationFrame(tick);
	}

	function start() {
		if (frame || still || paused || !onScreen || document.hidden) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	function stop() {
		cancelAnimationFrame(frame);
		frame = 0;
	}

	function resize() {
		const { width, height } = root.getBoundingClientRect();
		if (!width || !height) return;
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		// Resizing clears the canvas; draw at once so no blank frame shows.
		render();
	}

	new ResizeObserver(resize).observe(root);
	resize();
	render();
	canvas.hidden = false;
	root.classList.add('star--live');

	if (still) return;

	// Animation runs longer than five seconds, so it needs a pause control.
	const pauseLabel = toggle.querySelector<HTMLElement>('[data-star-pause]')!;
	const playLabel = toggle.querySelector<HTMLElement>('[data-star-play]')!;
	toggle.hidden = false;
	toggle.addEventListener('click', () => {
		paused = !paused;
		pauseLabel.hidden = paused;
		playLabel.hidden = !paused;
		if (paused) stop();
		else start();
	});

	// Moving the cursor across the star (or swiping sideways on touch) spins it.
	let pointerX: number | undefined;
	let pointerY = 0;
	root.addEventListener('pointermove', (event) => {
		if (paused) return;
		if (pointerX !== undefined) {
			const dx = event.clientX - pointerX;
			const dy = event.clientY - pointerY;
			drive.x += dy * spinGain;
			drive.y += dx * spinGain;
			drive.clampLength(0, maxSpin);
		}
		pointerX = event.clientX;
		pointerY = event.clientY;
	}, { passive: true });
	const release = () => (pointerX = undefined);
	root.addEventListener('pointerleave', release);
	root.addEventListener('pointercancel', release);

	new IntersectionObserver(([entry]) => {
		onScreen = entry.isIntersecting;
		if (onScreen) start();
		else stop();
	}).observe(root);
	document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

	start();
}
