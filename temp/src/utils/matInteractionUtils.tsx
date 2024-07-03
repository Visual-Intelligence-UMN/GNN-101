import * as d3 from "d3";
import { roundToTwo } from "@/pages/WebUtils";
import { softmax } from "./utils";

//---------------------------functions for the softmax interaction in the graph classifier------------------------------
export function drawSoftmaxDisplayer(
    pathMap: any,
    endCoord: any,
    result: number[],
    id: number,
    myColor: any
) {
    pathMap[0][id]!.style.opacity = "1";
    pathMap[1][id]!.style.opacity = "1";

    //set-up the paramtere for the math displayer
    const displayW = 250;
    const displayH = 75;

    //find coordination for the math displayer first
    const displayX = endCoord[1][0] + 30;
    const displayY = endCoord[1][1] - (displayH + 50);

    //add displayer
    d3.select(".mats")
        .append("rect")
        .attr("x", displayX)
        .attr("y", displayY)
        .attr("width", displayW)
        .attr("height", displayH)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("fill", "white")
        .style("stroke", "black")
        .style("stroke-width", 2)
        .attr("class", "math-displayer")
        .lower();

    //data preparation and preprocessing
    //model outputs and the values after softmax
    console.log("ouputvis", result);
    const finalResult = softmax(result);
    console.log("ouputvis 1", finalResult);
    //title fetch
    let title = "Softmax Score for 'Mutagenic'";
    if (id == 0) {
        title = "Softmax Score for 'Non-Mutagenic'";
    }
    console.log("outputvis title", title);

    //add contents into the math displayer
    //add title
    const titleYOffset = 10;
    const titleXOffset = 50;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + titleXOffset)
        .attr("y", displayY + titleYOffset)
        .text(title)
        .attr("class", "math-displayer")
        .attr("font-size", titleYOffset)
        .attr("fill", "black");
    //add equation
    //draw fraction
    //upper part of the fraction
    const eqXOffset = titleXOffset / 2;
    const eqYOffset = titleYOffset * 2.5;
    const unitSize = eqXOffset / 3 + 3;
    const upperOffset = unitSize * 2;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + upperOffset)
        .attr("y", displayY + eqYOffset)
        .text("exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    d3.select(".mats")
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 2.5 + upperOffset)
        .attr("y", displayY + eqYOffset - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(result[id]))
        .attr("class", "math-displayer")
        .raise();
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 2.5 + upperOffset)
        .attr("y", displayY + eqYOffset - unitSize / 3)
        .text(roundToTwo(result[id]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", "white");
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 4 + upperOffset)
        .attr("y", displayY + eqYOffset)
        .text(")")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    //upper part finished
    //draw fraction line
    const startFLPt: [number, number] = [
        displayX + eqXOffset / 2,
        displayY + eqYOffset + unitSize,
    ];
    const endFLPt: [number, number] = [
        displayX + eqXOffset + unitSize * 10,
        displayY + eqYOffset + unitSize,
    ];
    const path1 = d3
        .select(".mats")
        .append("path")
        .attr("d", d3.line()([startFLPt, endFLPt]))
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("fill", "none")
        .attr("class", "math-displayer");
    //draw lower part
    const offsetMul = 2;
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text("exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    d3.select(".mats")
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 2.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(result[0]))
        .attr("class", "math-displayer")
        .raise();
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 2.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(result[0]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", "white");
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 4)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")+exp(")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    d3.select(".mats")
        .append("rect")
        .attr("x", displayX + eqXOffset + unitSize * 7.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize + 2)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(result[1]))
        .attr("class", "math-displayer")
        .raise();
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 7.5)
        .attr("y", displayY + eqYOffset * offsetMul - unitSize / 3)
        .text(roundToTwo(result[1]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", "white");
    d3.select(".mats")
        .append("text")
        .attr("x", displayX + eqXOffset + unitSize * 9)
        .attr("y", displayY + eqYOffset * offsetMul)
        .text(")")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    //lower part finished
    //eq sign and result
    d3.select(".mats")
        .append("text")
        .attr("x", endFLPt[0] + unitSize / 2)
        .attr("y", endFLPt[1])
        .text("=")
        .attr("class", "math-displayer")
        .attr("font-size", unitSize)
        .attr("fill", "black");
    d3.select(".mats")
        .append("rect")
        .attr("x", endFLPt[0] + unitSize * 1.5)
        .attr("y", endFLPt[1] - unitSize)
        .attr("width", unitSize)
        .attr("height", unitSize)
        .style("stroke", "black")
        .attr("fill", myColor(finalResult[id]))
        .attr("class", "math-displayer")
        .raise();
    let textColor = "white";
    if (Math.abs(finalResult[id]) < 0.5) {
        textColor = "black";
    }
    d3.select(".mats")
        .append("text")
        .attr("x", endFLPt[0] + unitSize * 1.5)
        .attr("y", endFLPt[1] - unitSize / 2)
        .text(roundToTwo(finalResult[id]))
        .attr("class", "math-displayer")
        .attr("font-size", unitSize / 2)
        .attr("fill", textColor);
}

//-----------------------------------------------------warn: below are some functions that need to be updated
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
