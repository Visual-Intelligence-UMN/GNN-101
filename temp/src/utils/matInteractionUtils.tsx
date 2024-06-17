import * as d3 from "d3";

//warn: below are some functions that need to be updated
export function featureTooltip(adjustedX: number, adjustedY: number) {
    const tooltipG = d3
        .select(".mats")
        .append("g")
        .attr("x", adjustedX)
        .attr("y", adjustedY)
        .raise();

    return tooltipG;
}

// Three function that change the tooltip when user hover / move / leave a cell
export const mouseover = (event: MouseEvent, d: { value: number }) => {
    d3.select(event.currentTarget as HTMLElement)
        .style("stroke", "black")
        .style("opacity", 1);
};

export const mousemove = (event: MouseEvent, d: { value: number }) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
};

export const mouseleave = (event: MouseEvent, d: { value: number }) => {
    d3.select(event.currentTarget as HTMLElement)
        .style("stroke", "grey")
        .style("opacity", 0.8);
};

export function removeEffect(element: any) {
    d3.select(".matrix-tooltip").remove(); // remove tooltip

    d3.select(element).style("fill", "black").style("font-weight", "normal");
}

export function mouseoverEvent(
    element: any,
    target: any,
    i: number,
    conv1: any,
    conv2: any,
    conv3: any,
    final: any,
    features: any,
    myColor: any,
    offset: number,
    gridNum: number,
    sqSize: number,
    xAxis: boolean
) {
    console.log("ELEMENT", element);
    const bbox = element.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const transformAttr = d3
        .select(element.parentNode as SVGElement)
        .attr("transform");
    let translate = [0, 0]; // no translation for default
    if (transformAttr) {
        const matches = transformAttr.match(/translate\(([^,]+),([^)]+)\)/);
        if (matches) {
            translate = matches.slice(1).map(Number);
        }
    }

    const adjustedX = cx + translate[0];
    const adjustedY = cy + translate[1] - 10;
    const cellSize = 5; // size for each grid

    //-----------------interaction with text label and heatmap----------------------

    if (d3.select(target).attr("class") != "first") {
        // 8*8 matrix
        const matrixSize = 8;

        const tooltipG = featureTooltip(adjustedX, adjustedY);
    } else {
        const tooltipG = featureTooltip(adjustedX, adjustedY);
    }

    d3.select(element).style("fill", "red").style("font-weight", "bold");
}