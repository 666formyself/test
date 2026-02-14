/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

export function sanitizeHtml(html: string): string {
	if (!html) return '';
	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');

		// remove dangerous tags
		const forbidden = ['script', 'iframe', 'object', 'embed', 'link', 'meta'];
		forbidden.forEach(tag => {
			const nodes = Array.from(doc.getElementsByTagName(tag));
			nodes.forEach(n => n.remove());
		});

		// remove event handler attributes and javascript: URIs
		const all = doc.getElementsByTagName('*');
		for (let i = 0; i < all.length; i++) {
			const el = all[i] as HTMLElement;
			const attrs = Array.from(el.attributes);
			attrs.forEach(a => {
				const name = a.name.toLowerCase();
				const val = a.value || '';
				if (name.startsWith('on')) {
					el.removeAttribute(a.name);
				}
				if ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(val)) {
					el.removeAttribute(a.name);
				}
				if (name === 'style') {
					// remove potential javascript: or expression() from inline styles
					try {
						const clean = val.replace(/expression\([^)]*\)/gi, '').replace(/javascript:/gi, '');
						el.setAttribute('style', clean);
					} catch (e) { el.removeAttribute('style'); }
				}
			});
		}

		return doc.body ? doc.body.innerHTML : '';
	} catch (e) {
		return '';
	}
}