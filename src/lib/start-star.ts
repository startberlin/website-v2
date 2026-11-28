// Scroll parallax for StartStar.astro: the real START star artwork, drawn with a
// small WebGL shader that shifts every pixel by its estimated depth while the page
// scrolls, so the flat image gains a slight sense of depth. No 3D model and no
// library; the component loads this module only when the star is near the viewport.

// The still artwork is drawn at 88.5 % of the box (padding 5.75 %); the canvas uses
// the same fit, so the two line up exactly.
const fit = 1 / 0.885;
// Largest shift of the nearest pixels, in texture units, and how much of it goes
// sideways, so the movement reads as a slight diagonal tilt.
const maxShift = 0.06;
const sideways = 0.35;
// Depth that stays in place; nearer pixels move with the shift, deeper ones against it.
const pivot = 0.4;
// After the canvas takes over from the still image, the parallax eases in over this
// many milliseconds, so the swap shows no jump.
const easeIn = 400;

const vertexSource = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
	v_uv = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5);
	gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// One refinement step: the depth is sampled again where the pixel actually comes
// from, which keeps edges between near and deep parts from smearing.
const fragmentSource = `
precision mediump float;
uniform sampler2D u_image;
uniform sampler2D u_depth;
uniform float u_fit;
uniform float u_pivot;
uniform vec2 u_shift;
varying vec2 v_uv;

void main() {
	vec2 uv = (v_uv - 0.5) * u_fit + 0.5;
	vec2 offset = u_shift * (texture2D(u_depth, uv).r - u_pivot);
	offset = u_shift * (texture2D(u_depth, uv - offset).r - u_pivot);
	vec2 source = uv - offset;
	bool inside = source.x >= 0.0 && source.x <= 1.0 && source.y >= 0.0 && source.y <= 1.0;
	gl_FragColor = inside ? texture2D(u_image, source) : vec4(0.0);
}`;

// Estimated depth from the artwork itself: lit faces are near, the black hollow and
// shadows are deep, the transparent surround sits in between. Blurred, so neighbouring
// pixels move together and the image never tears.
function depthMap(image: HTMLImageElement) {
	const size = 240;
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = size;
	const paint = canvas.getContext('2d', { willReadFrequently: true })!;
	paint.drawImage(image, 0, 0, size, size);
	const pixels = paint.getImageData(0, 0, size, size);
	const data = pixels.data;
	let depth = new Float32Array(size * size);
	for (let i = 0; i < depth.length; i++) {
		const [r, g, b, a] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2], data[i * 4 + 3]];
		const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 510;
		depth[i] = a > 128 ? Math.min(1, Math.max(0, (lightness - 0.04) / 0.45)) : 0.35;
	}
	// Two box-blur passes in each direction (close to a Gaussian blur of about 1.5 px).
	const blur = (from: Float32Array, step: number, across: number) => {
		const to = new Float32Array(from.length);
		const radius = 2;
		for (let line = 0; line < size; line++) {
			for (let i = 0; i < size; i++) {
				let sum = 0;
				for (let k = -radius; k <= radius; k++) {
					const j = Math.min(size - 1, Math.max(0, i + k));
					sum += from[line * across + j * step];
				}
				to[line * across + i * step] = sum / (radius * 2 + 1);
			}
		}
		return to;
	};
	for (let pass = 0; pass < 2; pass++) depth = blur(blur(depth, 1, size), size, 1);
	for (let i = 0; i < depth.length; i++) {
		const value = Math.round(depth[i] * 255);
		data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = value;
		data[i * 4 + 3] = 255;
	}
	paint.putImageData(pixels, 0, 0);
	return canvas;
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type)!;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader failed');
	return shader;
}

function texture(gl: WebGLRenderingContext, unit: number, source: TexImageSource) {
	gl.activeTexture(gl.TEXTURE0 + unit);
	gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

export interface StarControl {
	/** Stops or resumes the parallax, e.g. when the system motion setting changes. */
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

	gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	texture(gl, 0, image);
	texture(gl, 1, depthMap(image));

	const uniform = (name: string) => gl.getUniformLocation(program, name);
	gl.uniform1i(uniform('u_image'), 0);
	gl.uniform1i(uniform('u_depth'), 1);
	gl.uniform1f(uniform('u_fit'), fit);
	gl.uniform1f(uniform('u_pivot'), pivot);
	const shiftUniform = uniform('u_shift');

	let active = true;
	let onScreen = true;
	let frame = 0;
	let shownAt = performance.now();

	// -1 when the star sits at the top of the screen, 0 in the middle, 1 at the bottom.
	function scrollPosition() {
		const rect = root.getBoundingClientRect();
		const centre = rect.top + rect.height / 2;
		return Math.min(1, Math.max(-1, (centre - innerHeight / 2) / (innerHeight / 2)));
	}

	function render() {
		frame = 0;
		const blend = Math.min(1, (performance.now() - shownAt) / easeIn);
		const amount = active ? scrollPosition() * blend * (2 - blend) : 0;
		gl!.viewport(0, 0, canvas.width, canvas.height);
		gl!.clearColor(0, 0, 0, 0);
		gl!.clear(gl!.COLOR_BUFFER_BIT);
		// Near parts move against the scroll direction, deep parts with it.
		gl!.uniform2f(shiftUniform, -amount * maxShift * sideways, -amount * maxShift);
		gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
		if (active && blend < 1) schedule();
	}

	function schedule() {
		if (!frame && onScreen) frame = requestAnimationFrame(render);
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

	addEventListener('scroll', schedule, { passive: true });
	addEventListener('resize', schedule);
	new IntersectionObserver(([entry]) => {
		onScreen = entry.isIntersecting;
		schedule();
	}).observe(root);

	return {
		setActive(value) {
			if (value && !active) shownAt = performance.now();
			active = value;
			render();
		},
	};
}
