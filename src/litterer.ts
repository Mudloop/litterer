import { html, CSSResultGroup, CSSResult, LitElement } from "lit";
import { splitCamelCase } from "./util";

export type Styles = CSSStyleSheet | string | CSSResultGroup | CSSResult | Styles[]
const cache: Record<string, CSSStyleSheet> = {};
export const convert = (styles: Styles): CSSStyleSheet[] =>
	(styles ??= []) instanceof CSSStyleSheet ? [styles]
		: Array.isArray(styles) ? styles.map(styles => convert(styles)).flat()
			: [styles].flat().map(style => {
				if (!cache[style = style.toString()]) (cache[style] = new CSSStyleSheet()).replaceSync(style);
				return cache[style];
			})

export abstract class LittererElement extends LitElement {
	static css: Styles;
	public static register(this: CustomElementConstructor, tag?: string) {
		tag ??= splitCamelCase(this.name, '-').toLowerCase();
		if (!tag.includes('-')) tag = `litter-${tag}`;
		window.customElements.define(tag, this)
		return tag;
	}
	public get shadow() { return this.shadowRoot ?? this.attachShadow({ mode: 'open' }) }
	constructor() {
		super();
		let css = new Set<Styles>(), ctr = (this.constructor as typeof LittererElement);
		do css.add(ctr.css); while ((ctr = Object.getPrototypeOf(ctr)).css)
		this.adopt([...css].reverse());
		queueMicrotask(() => this.init());
	}
	public init(): any { };
	public adopt = async (...css: Styles[]) => {
		await this.updateComplete;
		this.shadow.adoptedStyleSheets.push(...convert(css).filter(css => !this.shadow.adoptedStyleSheets.includes(css)));
	};
	public attr = (attr: Record<string, any>) => {
		Object.entries(attr).forEach(([k, v]) => {
			if (typeof v == 'boolean') return this.toggleAttribute(k, v);
			if (v == null) return this.removeAttribute(k);
			this.setAttribute(k, v.toString());
		})
		return this;
	}
	addEventListener<T extends Event>(type: string, listener: (e: T) => any, options?: boolean | AddEventListenerOptions) {
		return super.addEventListener(type, listener as (e: Event) => any, options);
	}
	request = <T>(key: string | Symbol) =>
		new Promise<T>(cb => this.dispatchEvent(new CustomEvent('data-request', { bubbles: true, composed: true, detail: { key, cb } })))

	supply = <T>(requestKey: string | Symbol, data: Promise<T> | T) =>
		this.listen<{ key: string | Symbol; cb: (val: any) => void; }>('data-request', async ({ key, cb }, e) => {
			if (requestKey != key) return;
			cb(await data);
			e.preventDefault();
			e.stopImmediatePropagation();
		})
	listen = <T = any>(type: string, listener: (data: T, e: CustomEvent) => any, options?: boolean | AddEventListenerOptions) =>
		this.addEventListener<CustomEvent>(type, e => listener(e.detail, e), options)
}
export function renderize<T extends { render: (o: T) => any }>(o: T): T;
export function renderize<T extends {}>(o: T, render: (o: T) => any): T;
export function renderize<T extends { render?: (o: T) => any }>(o: T, render?: (o: T) => any) {
	return Object.defineProperty(Object.assign(o, html`${void (0)}`), 'values', {
		get: () => [render?.(o) ?? o.render?.(o)],
	});
}