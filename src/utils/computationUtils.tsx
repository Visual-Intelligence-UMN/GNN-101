export function leakyRelu(x: number): number {
    return x < 0 ? 0.01 * x : x;
}

export function meanAggregation(x: number[][]): number[] {
    return x.map((d) => d.reduce((a, b) => a + b, 0) / d.length);
}

export function concatAggregation(x: number[][]): number[] {
    return x.reduce((a, b) => a.concat(b), []);
}

