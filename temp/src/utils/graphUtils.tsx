import * as d3 from "d3";

export function shiftGElements(svg: any, num: number, offset: number) {
    svg.selectAll("g")
        .filter(function (this: any) {
            return parseInt(d3.select(this).attr("layerNum")) > num;
        })
        .attr("transform", function (this:any, d: any, i: number, nodes: any) {
            const currentTransform = d3.select(this).attr("transform") || "translate(0,0)";
            const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
            const [x, y] = translateMatch ? translateMatch[1].split(',').map(Number) : [0, 0];
            const newX = x + offset;
            return `translate(${newX},${y})`;
        });
}