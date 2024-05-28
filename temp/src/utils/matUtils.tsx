import {
    deepClone,
    get_cood_from_parent,
    uniqueArray,
    get_category_node,
} from "./utils";
import * as d3 from "d3";

export interface HeatmapData {
    group: string;
    variable: string;
    value: number;
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
    d3.select(".matrix-tooltip").remove(); // 移除矩阵tooltip

    d3.select(element).style("fill", "black").style("font-weight", "normal");
}

export function get_cood_locations(data: any, locations: any) {
    console.log("DATA", Math.sqrt(data.length));
    const nCol = Math.sqrt(data.length);
    const cood = get_cood_from_parent(".y-axis", "text");
    //here's the data processing for getting locations
    const cood1 = get_cood_from_parent(".mats", "rect");
    const currMat = cood1.slice(-(nCol * nCol));
    const sliced = currMat.slice(-nCol);
    locations = locations.concat(sliced);
    console.log("LOCATIONS", locations);
    return locations;
}

export function tooltipBars64(
    target: any,
    i: number,
    conv1: any,
    conv2: any,
    conv3: any,
    final: any,
    matrixSize: number,
    tooltipG: any,
    cellSize: number,
    yOffset: number,
    myColor: any
) {
    let t = d3.select(target).text();
    let num = Number(t);
    console.log("TEXT", t);

    //how to determine the layer?
    let layer = null;
    if (i == 1) {
        layer = conv1;
    } else if (i == 2) {
        layer = conv2;
    } else if (i == 3) {
        layer = conv3;
    } else if (i == 4) {
        layer = final;
    } else {
        layer = null;
    }
    if (layer != null) {
        let mat = layer[num];

        console.log("MAT", mat);

        let k = 0;

        for (let i = 0; i < matrixSize; i++) {
            for (let j = 0; j < matrixSize; j++) {
                let c: number = mat[i][j] * 1000;
                tooltipG
                    .append("rect")
                    .attr("x", k * cellSize - 75 * cellSize)
                    .attr("y", yOffset * cellSize)
                    .attr("width", cellSize)
                    .attr("height", 20)
                    .attr("fill", myColor(c))
                    .attr("opacity", 1)
                    .attr("stroke", "black")
                    .attr("class", "tooltips")
                    .attr("stroke-width", 0.1);

                k++;
            }
        }

        d3.selectAll(".tooltips").raise();
    }
}

export function tooltipBars7(
    target: any,
    features: any,
    tooltipG: any,
    cellSize: number,
    yOffset: number,
    myColor: any
) {
    let t = d3.select(target).text();
    let num = Number(t);
    console.log("TEXT", t);
    let k = 0;
    for (let i = 0; i < 7; i++) {
        const cate = get_category_node(features[num]) * 100;
        console.log("CATE", cate);

        tooltipG
            .append("rect")
            .attr("x", k * cellSize - 5 * cellSize)
            .attr("y", yOffset * cellSize)
            .attr("width", cellSize)
            .attr("height", 20)
            .attr("class", "tool")
            .attr("fill", myColor(cate))
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        console.log("node feature", features[num]);
        k++;
    }
    d3.selectAll(".tool").raise();
}

export function featureTooltip(
    element: any,
    adjustedX: number,
    adjustedY: number
) {
    const tooltipG = d3
        .select(element.parentNode as SVGGElement)
        .append("g")
        .attr("class", "matrix-tooltip")
        .attr("x", adjustedX)
        .attr("y", adjustedY)
        .raise();

    return tooltipG;
}

export function crossConnectionMatrices(
    graphs: any,
    locations: any,
    offsetMat: number
) {
    const cood1 = get_cood_from_parent(".mats", "rect");
    console.log("FINAL coord", cood1);
    if (graphs.length > 1) {
        //calculate the offset
        for (let i = 0; i < locations.length; i++) {
            locations[i][0] += 10;
            locations[i][1] += 10;
        }
        //drawPoints(".mats","red",locations);

        let olocations = deepClone(locations);

        //we also need to find another locations array
        for (let i = 0; i < locations.length; i++) {
            locations[i][0] += offsetMat - 15;
        }

        let plocation = deepClone(locations);

        //draw path one - one
        for (let i = 0; i < plocation.length - graphs[0].length; i++) {
            d3.select(".mats")
                .append("path")
                .attr("d", d3.line()([olocations[i], plocation[i]]))
                .attr("stroke", "black")
                .attr("opacity", 0.2)
                .attr("fill", "none");
        }

        //fdraw path one - multiple
        const drawGraph = graphs[0];
        for (let k = 0; k < 3; k++) {
            for (let i = 0; i < drawGraph.length; i++) {
                for (let j = 0; j < drawGraph[0].length; j++) {
                    if (drawGraph[i][j] == 1) {
                        d3.select(".mats")
                            .append("path")
                            .attr(
                                "d",
                                d3.line()([
                                    olocations[i + drawGraph.length * k],
                                    plocation[j + drawGraph.length * k],
                                ])
                            )
                            .attr("stroke", "black")
                            .attr("opacity", 0.2)
                            .attr("fill", "none");
                    }
                }
            }
        }
        d3.selectAll("path").lower();
    }
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
    offset: number
) {
    console.log("ELEMENT", element);
    const bbox = element.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const transformAttr = d3
        .select(element.parentNode as SVGElement)
        .attr("transform");
    let translate = [0, 0]; // 默认为无位移
    if (transformAttr) {
        const matches = transformAttr.match(/translate\(([^,]+),([^)]+)\)/);
        if (matches) {
            translate = matches.slice(1).map(Number);
        }
    }

    const adjustedX = cx + translate[0];
    const adjustedY = cy + translate[1] - 10; // 上移10以放置于文本上方
    const cellSize = 5; // 每个格子的尺寸

    if (d3.select(target).attr("class") != "first") {
        // 创建一个8x8的矩阵tooltip
        const matrixSize = 8;

        const tooltipG = featureTooltip(element, adjustedX, adjustedY);
        tooltipBars64(
            target,
            i,
            conv1,
            conv2,
            conv3,
            final,
            matrixSize,
            tooltipG,
            cellSize,
            offset,
            myColor
        );
    } else {
        const tooltipG = featureTooltip(element, adjustedX, adjustedY);
        tooltipBars7(target, features, tooltipG, 10, offset, myColor);
    }

    d3.select(element).style("fill", "red").style("font-weight", "bold");
}
