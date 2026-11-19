const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function motionEnabled() {
	return !reducedMotion.matches;
}

export function onMotionChange(update: () => void) {
	reducedMotion.addEventListener('change', update);
	update();
}
