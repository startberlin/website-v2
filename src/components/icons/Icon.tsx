import type { SVGProps } from 'react';
import { getIcon, type IconName } from '../../lib/icons';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'viewBox' | 'dangerouslySetInnerHTML' | 'role' | 'aria-label' | 'aria-hidden' | 'focusable'> {
	name: IconName;
	size?: number | string;
	label?: string;
}

export function Icon({ name, size = 24, label, ...attributes }: IconProps) {
	const icon = getIcon(name);

	return (
		<svg
			{...attributes}
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox={icon.viewBox}
			fill={icon.fill}
			stroke={icon.stroke}
			strokeWidth={attributes.strokeWidth ?? icon.strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden={label ? undefined : true}
			aria-label={label}
			role={label ? 'img' : undefined}
			focusable="false"
		>
			{icon.paths.map((d) => <path key={d} d={d} />)}
		</svg>
	);
}
