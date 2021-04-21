export class Maybe<T> {
	value: T | null = null;
	static Just<T>(v: T) {
		const r = new Maybe<T>();
		r.value = v;
		return r;
	}
	static Nothing<T>() {
		const r = new Maybe<T>();
		r.value = null;
		return r;
	}
	static maybe<T>(v: T | undefined | null): Maybe<T> {
		return v === undefined || v === null ? Maybe.Nothing<T>() : Maybe.Just<T>(v);
	}
	isPresentAnd(ifp: (x: T) => boolean) {
		return this.mapLazy(ifp, () => false);
	}
	isPresent() {
		return this.value !== null;
	}
	map2<E>(ifp: (x: T) => E, ife: E) {
		return this.value === null
			|| this.value === undefined
			? ife
			: ifp(this.value);
	}
	mapLazy<E, U>(ifp: (x: T) => E, ife: (() => U)) {
		return this.value === null
			|| this.value === undefined
			? (typeof ife === "function" ? (ife as () => U)() : ife)
			: ifp(this.value);
	}
	map<E>(f: (x: T) => E): Maybe<E> {
		return this.map2(x => Maybe.Just(f(x)), Maybe.Nothing<E>());
	}
	flatMap<E>(f: (x: T) => Maybe<E>): Maybe<E> {
		return joinM(this.map(f));
	}
	oMap<E>(f: (x: T) => E | undefined | null): Maybe<E> {
		return this.map2(x => Maybe.maybe(f(x)), Maybe.Nothing());
	}
	ifPresentOrElse(ifp: (x: T) => void, ife: () => void) {
		this.mapLazy(ifp, ife);
	}
	ifPresent(ifp: (x: T) => void) {
		this.ifPresentOrElse(ifp, () => { });
	}
	ifAbsent(ifa: () => void) {
		this.ifPresentOrElse(() => { }, ifa);
	}
	isAbsent() {
		return !this.isPresent()
	}
	getOrThrow() {
		if(this.value === null) {
			throw new Error("Accessing optional nothing");
		}
		return this.value;
	}
	get() {
		return this.value;
	}
	orElseF(f: () => T) {
		return this.mapLazy(v => v, f);
	}
	orElse<U>(x: U) {
		return this.mapLazy(v => v, () => x);
	}
	ifMap<E, U>(P: (x: T) => boolean, ifs: (x: T) => E, ifn: () => U) {
		return this.mapLazy(x => P(x) ? ifs(x) : ifn(), ifn);
	}
	is<U>(P: (x: T) => x is T & U): Maybe<T & U> {
		return joinM(this.map(x => P(x) ? Just(x) : Nothing()))
	}
	filter(P: (x: T) => boolean) {
		return joinM(this.map(x => P(x) ? Just(x) : Nothing()))
	}
	zip<U>(o: Maybe<U>): Maybe<[T, U]> {
		return joinM(this.map(x => o.map(y => [x, y])));
	}
	zipWith<U, V>(o: Maybe<U>, f: (pair: [T, U]) => V): Maybe<V> {
		return this.zip(o).map(f);
	}
	equals(o: Maybe<T>, P?: ((pair: [T, T]) => boolean)) {
		return this.zipWith(o, P !== undefined ? P : ([a, b]) => a === b).orElse(false);
	}
	includes(v: T) {
		return this.map2(x => x === v, false);
	}
}

export const maybe = Maybe.maybe;
export const Just = Maybe.Just
export const Nothing = Maybe.Nothing

export const joinM: <T>(x: Maybe<Maybe<T>>) => Maybe<T> = x => x.map2(y =>
	y.map2(z => Just(z), Nothing()), Nothing())