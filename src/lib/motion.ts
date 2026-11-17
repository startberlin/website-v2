export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionChange = 'start-motion-change';

export function setMotionPaused(paused: boolean) {
	document.documentElement.dataset.motion = paused || reducedMotion.matches ? 'paused' : 'running';
	window.dispatchEvent(new Event(motionChange));
}

export function motionEnabled() {
	return document.documentElement.dataset.motion === 'running' && !reducedMotion.matches;
}

export function onMotionChange(update: () => void) {
	window.addEventListener(motionChange, update);
	update();
}
