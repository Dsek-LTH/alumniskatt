/** 150000 öre → "1 500 kr" */
export const kr = (ore: number) => `${Math.round(ore / 100).toLocaleString("sv-SE")} kr`;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
