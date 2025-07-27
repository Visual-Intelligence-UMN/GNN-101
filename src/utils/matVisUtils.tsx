export function prepSimulatedMatrixLayout(graph: any){
    const gLen = graph.length;
    const gridSize = 400;
    const margin = { top: 10, right: 80, bottom: 30, left: 80 };
    const width = 20 * gLen + 50 + 6 * 102 + 1200 * 2;
    const height = (gridSize + margin.top + margin.bottom) * 2;
    return {
        gridSize,
        margin,
        width,
        height
    }
}