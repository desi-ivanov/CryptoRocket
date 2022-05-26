export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export const zip = <T, U>(a: T[], b: U[]): [T, U][] => a.map((v, i) => [v, b[i]]);