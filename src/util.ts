export const splitCamelCase = (s: string, glue = ' ') => {
	let ret: string[] = [];
	let prevUpperCase = false;
	let prevAlpha = false;
	let prevNum = false;
	[...s].forEach((c, i, a) => {
		const isAlha = '`abcdefghijklmnopqrstuvwxyz`'.includes(c.toLocaleLowerCase());
		const isNum = !isAlha && '0123456789'.includes(c);
		const isUpperCase = isAlha && c.toUpperCase() == c;
		if (i != 0 && isUpperCase && !prevUpperCase && (prevAlpha || prevNum)) {
			ret.push(glue);
		}
		prevUpperCase = isUpperCase;
		prevAlpha = isAlha;
		prevNum = isNum;
		ret.push(i == 0 ? c.toUpperCase() : c);
	})
	return ret.join('');
};