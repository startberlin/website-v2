// Animated START star for StartStar.astro: the real START star artwork, drawn with
// a small WebGL shader. Its spikes grow out of the core, each direction at its own
// moment, then the star turns slowly and can be spun with heavy inertia by moving
// the cursor across it. No library is needed; the component loads this module only
// when the star is near the viewport.

// Measured on src/assets/brand/start-star.webp: the dark core sits at (0.445, 0.5)
// and the farthest tip lies 0.542 from it, so drawing at 0.885 keeps every tip
// inside the canvas at any rotation.
const coreCentre = [0.445, 0.5];
const fit = 1 / 0.885;
// Radius around the core that stays put while the spikes grow (texture units).
const coreRadius = 0.07;

// Spin feel: cursor movement drives the star, which picks up speed slowly and
// coasts for a few seconds, so it feels heavy rather than twitchy.
const idleSpeed = 0.06; // rad/s, clockwise
const spinGain = 9; // rad/s per radian of cursor sweep around the centre
const maxSpin = 4; // rad/s
const pickUp = 2.2; // how quickly the star follows the drive (1/s)
const coast = 0.9; // how quickly the drive fades (1/s)

const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
	v_uv = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
	gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// Each display point is turned back by the rotation, then mapped to the artwork:
// the core scales in first, and outside it every direction stretches from a
// compressed stub to full length, so spikes grow out of the middle without seams.
const fragmentSource = `
precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_core;
uniform float u_fit;
uniform float u_coreRadius;
uniform float u_time;
uniform float u_rotation;
varying vec2 v_uv;

float easeOut(float value) { return 1.0 - pow(1.0 - clamp(value, 0.0, 1.0), 3.0); }

void main() {
	vec2 p = v_uv - 0.5;
	float c = cos(u_rotation);
	float s = sin(u_rotation);
	p = vec2(c * p.x + s * p.y, -s * p.x + c * p.y);
	float r = length(p) * u_fit;
	float angle = atan(p.y, p.x);

	// Integer frequencies keep the delay continuous all the way round.
	float delay = 0.18 + 0.12 * sin(angle * 3.0 + 1.3) + 0.08 * sin(angle * 7.0 + 0.4);
	float grow = max(easeOut((u_time - delay) / 1.3), 0.0001);
	float core = max(easeOut(u_time / 0.45), 0.0001);

	float shown = u_coreRadius * core;
	float source = r <= shown ? r / core : u_coreRadius + (r - shown) / grow;
	vec2 uv = u_core + (r > 0.0 ? normalize(p) : vec2(0.0)) * source;
	vec4 colour = texture2D(u_image, uv);
	bool inside = uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0;
	gl_FragColor = inside ? colour : vec4(0.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type)!;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader failed');
	return shader;
}

export interface StarControl {
	/** Stops or resumes the animation, e.g. when the system motion setting changes. */
	setActive(active: boolean): void;
}

export async function mountStar(root: HTMLElement): Promise<StarControl> {
	const canvas = root.querySelector<HTMLCanvasElement>('.star__canvas')!;

	const image = new Image();
	image.src = root.dataset.texture!;
	await image.decode();

	const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
	if (!gl) throw new Error('WebGL unavailable');

	const program = gl.createProgram()!;
	gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
	gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'Program failed');
	gl.useProgram(program);

	// One rectangle covering the canvas.
	gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
	const position = gl.getAttribLocation(program, 'a_position');
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

	gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	const uniform = (name: string) => gl.getUniformLocation(program, name);
	gl.uniform2f(uniform('u_core'), coreCentre[0], coreCentre[1]);
	gl.uniform1f(uniform('u_fit'), fit);
	gl.uniform1f(uniform('u_coreRadius'), coreRadius);
	const timeUniform = uniform('u_time');
	const rotationUniform = uniform('u_rotation');

	let rotation = 0;
	let drive = 0;
	let spin = 0;
	let elapsed = 0;
	let frame = 0;
	let last = 0;
	let active = true;
	let onScreen = true;

	function render() {
		gl!.viewport(0, 0, canvas.width, canvas.height);
		gl!.uniform1f(timeUniform, elapsed);
		gl!.uniform1f(rotationUniform, rotation);
		gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
	}

	function tick(now: number) {
		const delta = Math.min((now - last) / 1000, 0.05);
		last = now;
		elapsed += delta;
		spin += (drive - spin) * (1 - Math.exp(-delta * pickUp));
		drive *= Math.exp(-delta * coast);
		rotation += (idleSpeed + spin) * delta;
		render();
		frame = requestAnimationFrame(tick);
	}

	function start() {
		if (frame || !active || !onScreen || document.hidden) return;
		last = performance.now();
		frame = requestAnimationFrame(tick);
	}

	function stop() {
		cancelAnimationFrame(frame);
		frame = 0;
	}

	function resize() {
		const { width } = root.getBoundingClientRect();
		const size = Math.round(width * Math.min(window.devicePixelRatio, 2));
		if (!size) return;
		canvas.width = size;
		canvas.height = size;
		// Resizing clears the canvas; draw at once so no blank frame shows.
		render();
	}

	new ResizeObserver(resize).observe(root);
	resize();

	// Moving the cursor across the star (or swiping on touch) turns it like a wheel:
	// the sweep of the pointer around the centre adds to the spin.
	let previous: { x: number; y: number } | undefined;
	root.addEventListener('pointermove', (event) => {
		const rect = root.getBoundingClientRect();
		const point = { x: event.clientX - (rect.left + rect.width / 2), y: event.clientY - (rect.top + rect.height / 2) };
		// Close to the centre a small move sweeps a large angle; ignore the core.
		if (Math.hypot(point.x, point.y) < rect.width * 0.12) {
			previous = undefined;
			return;
		}
		if (previous && active) {
			const sweep = Math.atan2(previous.x * point.y - previous.y * point.x, previous.x * point.x + previous.y * point.y);
			drive = Math.max(-maxSpin, Math.min(maxSpin, drive + sweep * spinGain));
		}
		previous = point;
	}, { passive: true });
	const release = () => (previous = undefined);
	root.addEventListener('pointerleave', release);
	root.addEventListener('pointercancel', release);

	new IntersectionObserver(([entry]) => {
		onScreen = entry.isIntersecting;
		if (onScreen) start();
		else stop();
	}).observe(root);
	document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

	start();
	return {
		setActive(value) {
			active = value;
			if (active) start();
			else stop();
		},
	};
}
