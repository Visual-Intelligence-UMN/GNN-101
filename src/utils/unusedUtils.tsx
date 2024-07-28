import { off } from "process";
import {
    deepClone,
    get_cood_from_parent,
    uniqueArray,
    get_category_node,
    drawPoints,
    softmax,
} from "./utils";
import * as d3 from "d3";
import { useEffect, useState } from "react";

export function crossConnectionMatrices(
    graphs: any,
    locations: any,
    offsetMat: number
) {
    const cood1 = get_cood_from_parent(".mats", "rect");

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

function interactRowCol(
    xAxis: boolean,
    tooltipG: any,
    sqSize: number,
    gridNum: number
) {
    if (!xAxis) {
        tooltipG
            .append("rect")
            .attr("x", 0)
            .attr("y", -sqSize / 2)
            .attr("width", sqSize * gridNum + 2)
            .attr("height", sqSize)
            .attr("fill", "red")
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("class", "tooltips")
            .attr("stroke-width", 0.1);
    } else {
        tooltipG
            .append("rect")
            .attr("x", -sqSize / 2)
            .attr("y", -sqSize * gridNum - 2)
            .attr("width", sqSize)
            .attr("height", sqSize * gridNum + 2)
            .attr("fill", "red")
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("class", "tooltips")
            .attr("stroke-width", 0.1);
    }
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
    myColor: any,
    gridNum: number,
    sqSize: number,
    xAxis: boolean
) {
    let t = d3.select(target).text();
    let num = Number(t);


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



        let k = 0;

        for (let i = 0; i < matrixSize; i++) {
            for (let j = 0; j < matrixSize; j++) {
                let c: number = mat[i][j];
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
        interactRowCol(xAxis, tooltipG, sqSize, gridNum);
        d3.selectAll(".tooltips").raise();
    }
}

export function tooltipBars7(
    num: number,
    features: any,
    tooltipG: any,
    cellSize: number,
    yOffset: number,
    myColor: any,
    xAxis: boolean,
    sqSize: number,
    gridNum: number
) {
    let k = 0;
    for (let i = 0; i < 7; i++) {
        const cate = get_category_node(features[num]) * 100;


        tooltipG
            .append("rect")
            .attr("x", k * cellSize - 5 * cellSize)
            .attr("y", yOffset * cellSize)
            .attr("width", cellSize)
            .attr("height", 20)
            .attr("class", "tooltips")
            .attr("fill", myColor(cate))
            .attr("opacity", 1)
            .attr("stroke", "black")
            .attr("stroke-width", 1);


        k++;
    }
    interactRowCol(xAxis, tooltipG, sqSize, gridNum);
    d3.selectAll(".tooltips").raise();
}