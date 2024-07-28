import * as d3 from "d3";
import {
    FeatureGroupLocation,
    State,
    calculateAverage,
    deepClone,
    handleClickEvent,
    myColor,
    state,
} from "./utils";
import { roundToTwo } from "../components/WebUtils";
import { drawHintLabel, loadWeights } from "./matHelperUtils";
import * as math from "mathjs";
import { create, all, matrix } from "mathjs";
import { inter } from "@/pages";
import { off } from "process";

import { injectPlayButtonSVGForGraphView, injectSVG} from "./svgUtils";
import { stat, truncateSync } from "fs";


import { drawActivationExplanation } from "./matInteractionUtils";
import { computeMatrixLocations, drawMatrixWeight, drawWeightMatrix } from "./matAnimateUtils";
import { graphVisDrawActivationExplanation, graphVisDrawMatrixWeight, displayerHandler, hoverOverHandler} from "./graphAnimationHelper";

export const pathColor = d3
    .scaleLinear<string>()
    .domain([-0.25, 0, 0.25])
    .range(["white", "gray", "black"]);

export function hideAllLinks(nodes: any) {
    nodes.forEach((node: any) => {
        if (node.links) {
            node.links.forEach((link: any) => {
                link.style("opacity", 0);
            });
        }
    });
}

export function showAllLinks(nodes: any) {
    nodes.forEach((node: any) => {
        if (node.links) {
            node.links.forEach((link: any) => {
                link.style("opacity", 0).lower();
            });
        }
    });
}

export function reduceNodeOpacity(
    nodes: any[],
    relatedNodes: any[],
    selfNode: any
) {
    nodes.forEach((node: any) => {
        if (node.svgElement && node.text) {
            if (
                !(relatedNodes.length != 0 && relatedNodes.includes(node)) &&
                node != selfNode
            ) {
                d3.select(node.svgElement).attr("stroke-opacity", 0.2);
                node.text.attr("opacity", 0.2);
            }
        }
    });
}

export function scaleFeatureGroup(node: any, scale: number) {
    d3.selectAll(`.node-features-${node.graphIndex}-${node.id}`).attr('transform', `scale(${scale})`);


}

export function showFeature(node: any) {
    const scale = 1;
    if (node.featureGroup) {
        scaleFeatureGroup(node, scale);
    }
    if (node.relatedNodes) {
        node.relatedNodes.forEach((n: any) => {
            if (n.featureGroup) {
                scaleFeatureGroup(n, scale);
            }
        });
    }
}

export function highlightNodes(node: any) {
    if (node.featureGroup && node.svgElement) {
        d3.select(node.svgElement).attr("stroke-width", 3);
        node.featureGroup.style("transition", "none")
            .style("opacity", 1)
            .style("visibility", "visible")
            .style("pointer-events", "auto");
        node.featureGroup.raise();
    }

    if (node.relatedNodes) {
        node.relatedNodes.forEach((n: any) => {
            d3.select(n.svgElement).attr("stroke-width", 3);
            n.featureGroup.style("transition", "none")
                .style("opacity", 1)
                .style("visibility", "visible")
                .style("pointer-events", "auto");
            n.featureGroup.raise();
        });
    }

    if (node.links) {
        node.links.forEach((link: any) => {
            link.style("transition", "none")
                .style("opacity", 1)
                .raise();
        });
    }
}

export function resetNodes(allNodes: any[], convNum: number) {
    allNodes.forEach((node) => {
        scaleFeatureGroup(node, 0.5)
        if (node.graphIndex < convNum) {
            if (node.featureGroup) {
                node.featureGroup.style("transition", "opacity 0.2s ease-out, visibility 0.2s ease-out")
                    .style("opacity", 0)
                    .style("pointer-events", "none");
                
            }
            if (node.svgElement) {
                d3.select(node.svgElement).attr("stroke-width", 1);
            }
            if (node.relatedNodes) {
                node.relatedNodes.forEach((relatedNode: any) => {
                    d3.select(relatedNode.svgElement).attr("stroke-width", 1);
                    relatedNode.featureGroup.style("transition", "opacity 0.2s ease-out, visibility 0.2s ease-out")
                        .style("opacity", 0)
                        .style("pointer-events", "none");
                    
                });
            }
            if (node.intermediateFeatureGroups) {
                node.intermediateFeatureGroups.forEach(
                    (intermediateFeatureGroup: any) => {
                        intermediateFeatureGroup.style("transition", "opacity 0.2s ease-out, visibility 0.2s ease-out")
                            .style("opacity", 0)
                            .style("pointer-events", "none");
                        
                    }
                );
            }
            if (node.links) {
                node.links.forEach((link: any) => {
                    link.style("transition", "opacity 0.2s ease-out")
                        .style("opacity", 0)
                        .lower();
                });
            }
            if (node.svgElement && node.text) {
                d3.select(node.svgElement).attr("stroke-opacity", 1);
                node.text.attr("opacity", 1);
            }
        }
    });
}

export function outputVisualizer(
    node: any,
    allNodes: any[],
    allWeights: any[],
    bias: any[],
    svg: any,
    offset: number,
    isClicked: boolean,
    moveOffset: number,
    height: number,
    prevRectHeight: number,
    rectHeight: number,
    rectWidth: number,
    colorSchemes: any,
    convNum: number,
    originalSvg: any,
    mode: number

) {

    let weights = allWeights[3];
    if (!svg.selectAll) {
        svg = d3.selectAll(svg);
    }


    let intervalID = 0;
    state.isClicked = true;

    d3.selectAll(".to-be-removed").remove();
    d3.selectAll(".node-features-Copy").style("visibility", "visible").lower();

    //color schemes interaction
    for (let i = 0; i < 4; i++)colorSchemes[i].style.opacity = "0.5";

    let originalCoordinates = moveFeatures(
        node.relatedNodes,
        (node.graphIndex - 1) * offset - 240,
        height / 5 + 15
    );
    node.featureGroup
        .transition()
        .delay(2000)
        .duration(1000)
        .attr(
            "transform",
            `translate(${node.x - 100}, ${node.y - 25}) rotate(-90)`
        );

    let temp = 600;

    let calculatedData: number[] = [];
    for (let i = 0; i < 2; i++) {
        let data = 0;
        for (let j = 0; j < node.relatedNodes[0].features.length; j++) {
            data += weights[i][j] * node.relatedNodes[0].features[j];
        }
        calculatedData.push(data);
    }


    let startCoordList = [];
    for (let i = 0; i < 64; i++) {
        let s: [number, number] = [
            node.x +
            prevRectHeight * i -
            offset -
            moveOffset - temp + 855,
            node.y - 15,
        ];
        startCoordList.push(s);
    }

    // for (let i = 0; i < 64; i++) {
    //     let s: [number, number] = [
    //         node.graphIndex * offset +
    //         i * prevRectHeight +
    //         node.relatedNodes[0].features.length * prevRectHeight + prevRectHeight / 2,
    //         height / 5 + 150 + 25,
    //     ];
    //     startCoordList.push(s);
    // }


    console.log(calculatedData);
    const calculatedFeatureGroup = svg
        .append("g")
        .attr("transform", `translate(${node.x - temp}, ${node.y})`);

    calculatedFeatureGroup
        .selectAll("rect")
        .data(calculatedData)
        .enter()
        .append("rect")
        .attr("x", (d: number, i: number) => i * rectHeight + 5)
        .attr("y", -30)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .attr(
            "class",
            (d: number, i: number) => `calculatedFeatures${i} to-be-removed bias calculatedRect`
        )
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0);

    calculatedFeatureGroup.append("text")
        .attr("x", 5)
        .attr("y", -43)
        .text("Matrix Multiplication")
        .style("fill", "gray")

        .style("font-size", "12px")
        .attr("class", "bias to-be-removed")
        .style("opacity", 0);


    let endCoordList = [];

    for (let i = 0; i < node.features.length; i++) {
        let s: [number, number] = [node.x + 20 + i * rectHeight - temp, node.y - 15];
        endCoordList.push(s);
    }
    const math = create(all, {});
    const wMat = math.transpose(allWeights[3]);
    let weightsLocation = computeMatrixLocations(endCoordList[0][0] - 100, endCoordList[0][1] - 30, -1, rectHeight / 3, node.features.length, [wMat], 0);


    setTimeout(() => {
        if (!state.isClicked) {
            return;
        }
        drawWeightMatrix(endCoordList[0][0] - 90, endCoordList[0][1] - 30, 1, rectHeight / 3, rectHeight / 3, node.features.length, [wMat], 0, myColor, svg, weightsLocation);

        d3.selectAll(".bias").style("opacity", 1);
        d3.selectAll(".softmax").attr("opacity", 0.07);
        d3.selectAll(".relu").style("opacity", 1);
        d3.selectAll(".output-path").attr("opacity", 1);
        d3.selectAll(".softmaxLabel").attr("opacity", 1);
        
    }, 2000)

    const g5 = svg
        .append("g")
        .attr("transform", `translate(${endCoordList[0][0] - 90}, ${endCoordList[0][1] - 120})`);


    let DisplayerWidth = 300; // Width of the graph-displayer
    let DisplayHeight = 75;

    const graphDisplayer = g5
        .append("rect")
        .attr("x", (node.graphIndex - 2) * 1)
        .attr("y", 0)
        .attr("width", DisplayerWidth)
        .attr("height", DisplayHeight)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("fill", "transparent")
        .style("stroke", "black")
        .style("stroke-width", 2)
        .attr("class", "graph-displayer")
        .attr("opacity", 0)
        .lower();

        const Xt = weights;;

    hoverOverHandler(node, node.relatedNodes[0].features, state, g5, DisplayHeight, (32 / node.relatedNodes[0].features.length), (32 / node.relatedNodes[0].features.length), myColor, [wMat], 0, weightsLocation, Xt, startCoordList, endCoordList, svg)

    let outputData = [];
    for (let i = 0; i < calculatedData.length; i++) {
        outputData.push(calculatedData[i] + bias[i])
    }



    const outputGroup = svg
        .append("g")
        .attr("transform", `translate(${node.x + 150}, ${node.y - 30})`);

    outputGroup.selectAll("rect")
        .data(outputData)
        .enter()
        .append("rect")
        .attr("class", "bias to-be-removed")
        .attr("x", (d: any, i: number) => i * rectHeight + 5 - moveOffset)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0);

    outputGroup.append("text")
        .attr("x", 5 - moveOffset)
        .attr("y", 28)
        .text("Matmul")
        .style("fill", "gray")

        .style("font-size", "12px")
        .attr("class", "bias to-be-removed")

        .style("opacity", 0);




    const BiasGroup = svg
        .append("g")
        .attr("transform", `translate(${node.x}, ${node.y + 30})`);

    BiasGroup.selectAll("rect")
        .data(bias)
        .enter()
        .append("rect")
        .attr("class", "bias to-be-removed")
        .attr("x", (d: any, i: number) => i * rectHeight + 5 - moveOffset)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0);

    BiasGroup.append("text")
        .attr("x", 5 - moveOffset)
        .attr("y", 28)
        .text("Bias Vector")
        .style("fill", "gray")

        .style("font-size", "12px")
        .attr("class", "bias to-be-removed")

        .style("opacity", 0);

    setTimeout(() => {
        if (!state.isClicked) {
            return;
        }

        weightAnimation(
            svg,
            node,
            startCoordList,
            endCoordList,
            Xt,
            node.relatedNodes[0].features,
            offset,
            height,
            moveOffset,
            rectHeight,
            prevRectHeight,
            state,
            weightsLocation,
            intervalID,
            allWeights,
            g5,
            displayHeight,
            mode
        );

        let start_x = node.x + 170 - temp;
        let start_y = node.y - 22.5;
        let end_x = node.x + 300 - 10 - 5 - temp + 50;
        let end_y = node.y - 22.5;
    



        let control_x = (start_x + end_x) / 2;
        let control_y = start_y + 50;

        for (let i = 0; i < node.features.length; i++) {
            for (let j = 0; j < node.features.length; j++) {
                const softmaxPath1 = svg
                    .append("path")
                    .attr(
                        "d",
                        `M${start_x + 20 * i},${start_y + 7.5
                        } Q${control_x},${control_y} ${end_x - 20 * j},${end_y + 7.5
                        }`
                    )
                    .attr("stroke", myColor(calculatedData[i]))
                    .attr("stroke-width", 1)
                    .attr("class", `softmax${node.features.length - j - 1} softmax to-be-removed`)
                    .attr("opacity", 0)
                    .style("fill", "none");
            }
        }

        svg.append("text")
            .attr("x", (start_x - 30 + end_x) / 2)
            .attr("y", end_y + 55)
            .text("Softmax")
            .style("fill", "gray")
            .style("font-size", "12px")
            .attr("class", "to-be-removed softmaxLabel")
            .style("opacity", 1);


        let color = calculateAverage(node.features); // to be determined

        start_y += 60
        start_x -= 125
        end_x -= 180;
        let control1_x = start_x + (end_x - start_x) * 0.2;
        let control1_y = start_y;
        let control2_x = start_x + (end_x - start_x) * 0.4;
        let control2_y = end_y;

        color = calculateAverage(node.features); // to be determined
        const biasToFinal = svg
            .append("path")
            .attr(
                "d",
                `M${start_x},${start_y} C ${control1_x} ${control1_y}, ${control2_x} ${control2_y} ${end_x},${end_y}`
            )
            .style("stroke", pathColor(color))
            .style("opacity", 0.7)
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "bias to-be-removed")
            .style("opacity", 1);


            start_y -= 60;
            const calculatedToFinal = svg
            .append("path")
            .attr(
                "d",
                `M${start_x},${start_y} L ${end_x},${end_y}`
            )
            .style("stroke", pathColor(color))
            .style("opacity", 0.7)
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "bias to-be-removed")
            .style("opacity", 1);



            start_y = node.y + 40;
            start_x = start_x - moveOffset + temp - 205;
            end_x = end_x - 150;



        const originToAggregated = svg
            .append("path")
            .attr(
                "d",
                `M${start_x + 6},${start_y - 65} L${end_x},${end_y}`
            )
            .style("stroke", "black")
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "output-path to-be-removed")
            .attr("opacity", 1)
            .lower();






            if (state.isClicked) {

            d3.selectAll(".bias").style("opacity", 1);
            d3.selectAll(".softmax").attr("opacity", 0.07);
            d3.selectAll(".relu").style("opacity", 1);
            d3.selectAll(".output-path").attr("opacity", 1);
            d3.selectAll(".softmaxLabel").attr("opacity", 1);
            d3.selectAll(".intermediate-path").attr("opacity", 0)    
            }
    }, 2000);


    let rectL = 15;
    let displayerWidth = 300; // Width of the graph-displayer
    let displayHeight = 75;





    for (let i = 0; i < node.features.length; i++) {
        d3.select(`#output-layer-rect-${i}`)
            .on("mouseover", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(".graph-displayer").attr("opacity", 1);
                d3.selectAll(`.softmax${i}`).attr("opacity", 1);
                g5.append("rect")
                    .attr("x", 70)
                    .attr("y", displayHeight - 40)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[0]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", 70)
                    .attr("y", displayHeight - 40 + rectL / 2)
                    .text(roundToTwo(calculatedData[0]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");

                g5.append("rect")
                    .attr("x", displayerWidth - 130)
                    .attr("y", displayHeight - 40)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[1]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", displayerWidth - 130)
                    .attr("y", displayHeight - 40 + rectL / 2)
                    .text(roundToTwo(calculatedData[1]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");

                g5.append("rect")
                    .attr("x", 100)
                    .attr("y", 10)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[i]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", 100)
                    .attr("y", 10 + rectL / 2)
                    .text(roundToTwo(calculatedData[i]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");

                g5.append("text")
                    .attr("x", displayerWidth / 2 - 50)
                    .attr("y", displayHeight - 30)
                    .text("+")
                    .attr("class", "math-displayer")
                    .attr("font-size", "12");

                g5.append("text")
                    .attr("x", 100 - 25)
                    .attr("y", 20)
                    .attr("xml:space", "preserve")
                    .text("exp(        )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");

                g5.append("text")
                    .attr("x", 70 - 25)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("exp(        )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");

                g5.append("text")
                    .attr("x", displayerWidth - 130 - 25)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("exp(        )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");

                g5.append("line")
                    .attr("x1", 20)
                    .attr("y1", 30)
                    .attr("x2", displayerWidth - 80)
                    .attr("y2", 30)
                    .attr("stroke", "black")
                    .attr("class", "math-displayer")
                    .attr("stroke-width", 1);

                g5.append("text")
                    .attr("x", displayerWidth - 60)
                    .attr("y", 35)
                    .text("=")
                    .attr("class", "math-displayer")
                    .attr("font-size", "15");

                g5.append("rect")
                    .attr("x", displayerWidth - 50)
                    .attr("y", 25)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(node.features[i]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", displayerWidth - 50)
                    .attr("y", 25 + rectL / 2)
                    .text(roundToTwo(node.features[i]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");
            })
            .on("mouseout", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(".math-displayer").remove();
                d3.selectAll(".graph-displayer").attr("opacity", 0);
                d3.selectAll(".softmax").attr("opacity", 0);
                d3.selectAll(`.softmax${i}`).attr("opacity", 0.07);
            });
    }



    d3.select("#my_dataviz").on("click", function(event: any) {
        d3.selectAll(".math-displayer").remove();
        d3.selectAll(".graph-displayer").remove();
     
            d3.selectAll(".node-features-Copy").style("visibility", "hidden")
            d3.selectAll(".weightUnit").remove();
            d3.selectAll(".columnUnit").remove();
            d3.selectAll(".procVis").remove();
            d3.selectAll(".to-be-removed").remove();
    
            d3.selectAll(".graph-displayer").remove();
            for (let i = 0; i < 4; i++)colorSchemes[i].style.opacity = "1";
            moveFeaturesBack(node.relatedNodes, originalCoordinates);
            node.featureGroup
                .transition()
                .duration(1000)
                .attr(
                    "transform",
                    `translate(${node.x - 7.5}, ${node.y + 170 + 5}) rotate(0)`
                );

                handleClickEvent(originalSvg, node, event, moveOffset, colorSchemes, allNodes, convNum, mode, state)


    })

}

export function calculationVisualizer(
    node: any,
    allNodes: any[],
    weights: any,
    bias: any,
    normalizedAdjMatrix: any,
    aggregatedDataMap: any[],
    calculatedDataMap: any[],
    svg: any,
    offset: number,
    height: number,
    colorSchemes: any,
    convNum: number,
    moveOffset: number,
    prevRectHeight: number,
    rectHeight: number,
    rectWidth: number,
    state: State,
    mode: number
) {



    let intervalID = 0;

    d3.selectAll(".graph-displayer").remove();
    showFeature(node);
    let currentWeights = weights[node.graphIndex - 1]


    


    let biasData = bias;

    const g3 = svg
        .append("g")
        .attr("class", "layerVis")
        .attr(
            "transform",
            `translate(${(node.graphIndex - 3.5) * offset}, 10)`
        );

    d3.selectAll(".to-be-removed").remove();


    let startCoordList: any[] = [];
    let endCoordList: any[] = [];

    let start_x = 0;
    let start_y = 0;
    let end_x = 0;
    let end_y = 0;


    let moveToX = 3.5 * offset - 100;
    let moveToY = height / 20;
    if (node.relatedNodes.length <= 8) {
        moveToY = height / 5;
    }
    let originalCoordinates = moveFeatures(
        node.relatedNodes,
        moveToX,
        moveToY
    ); //record the original cooridinates for restoring

  

    let paths: any = [];
    let intermediateFeatureGroups: any = [];

    const aggregatedData = aggregatedDataMap[node.id];

    const aggregatedFeatureGroup = g3
        .append("g")
        .attr(
            "transform",
            `translate(${3.5 * offset + node.relatedNodes[0].features.length * prevRectHeight
            }, ${height / 5 + 150})`
        );
    
    aggregatedFeatureGroup.on("mouseover", function(event:any, d:any){
        d3.selectAll(".parameter").style("opacity", 1);
    });

    aggregatedFeatureGroup.on("mouseout", function(event:any, d:any){
        d3.selectAll(".parameter").style("opacity", 0);
    });

    aggregatedFeatureGroup
        .selectAll("rect")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("x", (d: any, i: number) => i * prevRectHeight)
        .attr("y", 0)
        .attr("width", prevRectHeight)
        .attr("height", rectWidth)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .attr("class", "aggregatedFeatureGroup to-be-removed")
        .style("stroke", "grey")
        .style("opacity", 0);

    //draw label
    aggregatedFeatureGroup.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .text("Vectors Summation")
        .style("fill", "gray")
        .style("font-size", "12px")
        .attr("class", "aggregatedFeatureGroup to-be-removed")
        .style("opacity", 0);


    const aggFrame = aggregatedFeatureGroup.append("rect")
        .attr("class", "aggregatedFeatureGroup to-be-removed")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", prevRectHeight * aggregatedData.length)
        .attr("height", rectWidth)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("opacity", 0);

    d3.selectAll(".aggregatedFeatureGroup")
        .transition()
        .delay(3500)
        .style("opacity", 1);

    for (let i = 0; i < 64; i++) {
        let s: [number, number] = [
            node.graphIndex * offset +
            i * prevRectHeight +
            node.relatedNodes[0].features.length * prevRectHeight + prevRectHeight / 2,
            height / 5 + 150 + 25,
        ];
        startCoordList.push(s);
    }

    intermediateFeatureGroups.push(aggregatedFeatureGroup);

    const calculatedData = calculatedDataMap[node.id];

    const calculatedFeatureGroup = g3
        .append("g")
        .attr(
            "transform",
            `translate(${3.5 * offset +
            node.relatedNodes[0].features.length * 2 * prevRectHeight +
            100
            }, ${height / 5 + 150})`
        );


    calculatedFeatureGroup
        .selectAll("rect")
        .data(calculatedData)
        .enter()
        .append("rect")
        .attr("x", (d: number, i: number) => i * rectHeight)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .attr(
            "class",
            (d: number, i: number) => `calculatedFeatures${i} to-be-removed aniRect calculatedRect`
        )
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .style("stroke", "grey")
        .style("opacity", 0);

    //draw label
    calculatedFeatureGroup.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .text("Matrix Multiplication")
        .style("fill", "gray")
        .style("font-size", "12px")
        .attr("class", "calFrame to-be-removed")
        .style("opacity", 0);




    const calFrame = calculatedFeatureGroup.append("rect")
        .attr("class", "calFrame to-be-removed")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", (rectHeight * calculatedData.length))
        .attr("height", rectWidth)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("opacity", 0);

    for (let i = 0; i < 64; i++) {
        let s: [number, number] = [
            node.graphIndex * offset +
            i * rectHeight +
            node.relatedNodes[0].features.length * 2 * prevRectHeight +
            100,
            height / 5 + 150 + 25,
        ];
        endCoordList.push(s);
    }

    let matrixRectSize = rectHeight;
    if (mode === 1 && node.graphIndex === 1) {
        matrixRectSize /= 2
    }
    let weightsLocation = computeMatrixLocations(endCoordList[0][0] - 100, endCoordList[0][1] - 30, -1, matrixRectSize, node.features.length, weights, node.graphIndex - 1);




    const math = create(all, {});
    let Xt = math.transpose(currentWeights);
    if (node.graphIndex === 1) {
        Xt = math.transpose(Xt);
    }

    



    

    setTimeout(()=> {
        if (!state.isClicked) {
            return;
        }
        drawWeightMatrix(endCoordList[0][0] - 90, endCoordList[0][1] - 30, -1, matrixRectSize, matrixRectSize, node.features.length, weights, node.graphIndex - 1, myColor, svg, weightsLocation)



    }, 2000)
   




    const g4 = g3
        .append("g")
        .attr("transform", `translate(${3.5 * offset +
            node.relatedNodes[0].features.length * 2 * prevRectHeight +
            100}, ${height / 5 + 10})`);

    let rectL = 0.5;
    if (mode === 1) {
        rectL = 5
        if (node.graphIndex === 1) {
            rectL = 1.9
        }
    }
    let displayerWidth = 300; // Width of the graph-displayer
    let displayHeight = 75;

    const displayer = g4
        .append("rect")
        .attr("x", (node.graphIndex - 2) * 1)
        .attr("y", 0)
        .attr("width", displayerWidth)
        .attr("height", displayHeight)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("fill", "transparent")
        .style("stroke", "black")
        .style("stroke-width", 2)
        .attr("class", "graph-displayer")
        .attr("opacity", 0)
        .lower();

    




    intermediateFeatureGroups.push(calculatedFeatureGroup);

    const BiasGroup = g3
        .append("g")
        .attr(
            "transform",
            `translate(${3.5 * offset +
            node.relatedNodes[0].features.length * 2 * prevRectHeight +
            100
            }, ${height / 5 + 100})`
        );

    BiasGroup.selectAll("rect")
        .data(biasData)
        .enter()
        .append("rect")
        .attr("class", "bias")
        .attr("x", (d: any, i: number) => i * rectHeight)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .style("stroke", "grey")
        .style("opacity", 0);

    //draw label
    BiasGroup.append("text")
        .attr("x", 0)
        .attr("y", -5)
        .text("Bias Vector")
        .style("fill", "gray")
        .style("font-size", "12px")
        .attr("class", "bias to-be-removed").style("opacity", 0);

    const BiasFrame = BiasGroup.append("rect")
        .attr("class", "bias to-be-removed")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", rectHeight * biasData.length)
        .attr("height", rectWidth)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("opacity", 0);

    intermediateFeatureGroups.push(BiasGroup);
    node.intermediateFeatureGroups = intermediateFeatureGroups;

    end_x = 3.5 * offset + node.relatedNodes[0].features.length * prevRectHeight;
    end_y = height / 5 + 150 + 7.5;

    let adjMatrixSlice: number[] = [];
    for (let i = 0; i < normalizedAdjMatrix[node.id].length; i++) {
        if (normalizedAdjMatrix[node.id][i] != 0) {
            adjMatrixSlice.push(normalizedAdjMatrix[node.id][i].toFixed(2));
        }
    }



    setTimeout(() => {
        if (!state.isClicked) {
            return;
        }
        d3.selectAll(".calFrame").style("opacity", 1);
        weightAnimation(
            svg,
            node,
            startCoordList,
            endCoordList,
            currentWeights,
            aggregatedData,
            offset,
            height,
            moveOffset,
            rectHeight,
            prevRectHeight,
            state,
            weightsLocation,
            intervalID,
            weights,
            g4,
            displayHeight,
            mode
        );
        hoverOverHandler(node, aggregatedData, state, g4, displayHeight, (32 / node.relatedNodes[0].features.length), (32 / node.relatedNodes[0].features.length), myColor, weights, node.graphIndex - 1, weightsLocation, Xt, startCoordList, endCoordList, svg)



        if (node.relatedNodes) {
            node.relatedNodes.forEach((n: any, i: number) => {
                if (n.featureGroupLocation) {
                    start_x =
                        3.5 * offset - 70 + n.features.length * prevRectHeight;
                    start_y = height / 20 + 90 + 45 * i;
                    if (node.relatedNodes.length <= 8) {
                        start_y = height / 5 + 90 + 45 * i
                    }
                    const control1_x = start_x + (end_x - start_x) * 0.3;
                    const control1_y = start_y;
                    const control2_x = start_x + (end_x - start_x) * 0.7;
                    const control2_y = end_y;

                    let color = calculateAverage(n.features);

                    g3.append("text")
                        .attr("x", start_x + 20)
                        .attr("y", start_y - 10)
                        .text(adjMatrixSlice[i])
                        .attr("font-size", 7.5)
                        .attr("class", "parameter")
                        .attr("opacity", 0).raise();

                    const originToAggregated = g3
                        .append("path")
                        .attr(
                            "d",
                            `M${start_x},${start_y} C ${control1_x},${control1_y}, ${control2_x},${control2_y}, ${end_x},${end_y}`
                        )
                        .style("stroke", myColor(adjMatrixSlice[i]))
                        .style("stroke-width", 1)
                        .style("fill", "none")
                        .attr("class", "to-be-removed origin-to-aggregated")
                        .style("opacity", 0).lower();

                    d3.selectAll(".origin-to-aggregated").style("opacity", 1);

                    paths.push(originToAggregated);
                }
            });

            let color;
            start_x =
                3.5 * offset +
                node.relatedNodes[0].features.length * prevRectHeight * 2;
            start_y = height / 5 + 150 + 7.5;
            end_x =
                3.5 * offset +
                node.relatedNodes[0].features.length * prevRectHeight * 2 +
                100; // the horizontal distance is offset(600) + moveoffset(300)
            end_y = height / 5 + 150 + 7.5;

            color = calculateAverage(node.features); // to be determined


            const aggregatedToCalculated = g3
                .append("path")
                .attr("d", `M${start_x},${start_y} ${end_x},${end_y}`)
                .style("stroke", "black")
                .style("stroke-width", 1)
                .style("fill", "none")
                .attr("class", "relu to-be-removed output-path")
                .attr("opacity", 0).lower();

            paths.push(aggregatedToCalculated);

            start_x =
                3.5 * offset +
                node.relatedNodes[0].features.length * prevRectHeight * 2 +
                node.features.length * rectHeight +
                100;
            start_y = height / 5 + 150 + 7.5;
            end_x =
                3.5 * offset +
                node.relatedNodes[0].features.length * prevRectHeight * 2 +
                node.features.length * rectHeight +
                175; // the horizontal distance is offset(600) + moveoffset(300)
            end_y = height / 5 + 150 + 7.5;

            color = calculateAverage(node.features); // to be determined

            const calculatedToFinal = g3
                .append("path")
                .attr("d", `M${start_x},${start_y} ${end_x},${end_y}`)
                .style("stroke", "black")
                .style("stroke-width", 1)
                .style("fill", "none")
                .attr("class", "relu to-be-removed")
                .attr("opacity", 0).lower();

            paths.push(calculatedToFinal);

            start_x =
                3.5 * offset +
                node.relatedNodes[0].features.length * 2 * prevRectHeight +
                node.features.length * 3 +
                100;
            start_y = height / 5 + 100 + 7.5;

            let control1_x = start_x + (end_x - start_x) * 0.2;
            let control1_y = start_y;
            let control2_x = start_x + (end_x - start_x) * 0.4;
            let control2_y = end_y;

            color = calculateAverage(node.features); // to be determined
            const biasToFinal = g3
                .append("path")
                .attr(
                    "d",
                    `M${start_x},${start_y} C ${control1_x} ${control1_y}, ${control2_x} ${control2_y} ${end_x - 30
                    },${end_y}`
                )
                .style("stroke", "black")
                .style("opacity", 0.7)
                .style("stroke-width", 1)
                .style("fill", "none")
                .attr("class", "bias to-be-removed")
                .style("opacity", 0).lower();

            paths.push(biasToFinal);
            node.intermediatePaths = paths;
        }

                        d3.selectAll(".bias").style("opacity", 1);
                        d3.selectAll(".softmax").attr("opacity", 0.07);
                        d3.selectAll(".relu").style("opacity", 1);
                        d3.selectAll(".output-path").attr("opacity", 1);
                        d3.selectAll(".softmaxLabel").attr("opacity", 1);
                        d3.selectAll(".intermediate-path").attr("opacity", 0);
                        d3.selectAll(".aniRect").style("opacity", 1);
             

        // relu
        const relu = g3.append("g");
        let svgPath = "./assets/SVGs/ReLU.svg";
        let labelText = "ReLU Non-linear Function";
        if (mode == 1) {
            svgPath = "./assets/SVGs/tanh.svg";
            labelText = "Tanh Non-linear Function";
        }
        d3.xml(svgPath).then(function (data) {

            if (relu.node() != null) {
                const ReLU = relu!.node()!.appendChild(data.documentElement);
                d3.select(ReLU)
                    .attr("x", end_x - 45)
                    .attr("y", end_y - 15)
                    .attr("class", "relu to-be-removed mats procVis")
                    .attr("opacity", 0)
                    .raise();
            }
        });
        relu.on("mouseover", function (event: any, d: any) {
            const [x, y] = d3.pointer(event);

            //set-up the paramtere for the math displayer
            let text = "ReLU Non-Linear Function";
            let formular = "f(x) = max(0, x)";
            let descirption = "Range:  [0 to Infinity)."
            if (mode === 1) {
                text = "Tanh Non-Linear Function";
                formular = "f(x) = (e^x - e^(-x)) / (e^x + e^(-x))";
                descirption = "Range:  (-1 to 1)."


            }
            graphVisDrawActivationExplanation(
                x, y, text,
                formular, descirption, g3
            );


        });

        relu.on("mouseout", function () {
            d3.selectAll(".math-displayer").remove();
        });


        //draw label
        relu.append("text")
            .attr("x", end_x - 45)
            .attr("y", end_y - 20)
            .text(labelText)
            .style("fill", "gray")
            .style("font-size", "12px")
            .attr("class", "relu to-be-removed").attr("opacity", 0);




            d3.selectAll(".bias").style("opacity", 1);
            d3.selectAll(".softmax").attr("opacity", 0.07);
            d3.selectAll(".relu").style("opacity", 1);
            d3.selectAll(".output-path").attr("opacity", 1);
            d3.selectAll(".softmaxLabel").attr("opacity", 1);
            d3.selectAll(".intermediate-path").attr("opacity", 0)     
            clearInterval(intervalID)   
            
    }, 3500);



    const outputGroup = g3
        .append("g")
        .attr(
            "transform",
            `translate(${3.5 * offset +
            node.relatedNodes[0].features.length * 2 * prevRectHeight +
            node.features.length * rectHeight +
            175
            }, ${height / 5 + 150})`
        );


    //draw label
    outputGroup.append("text")
        .attr("x", 0)
        .attr("y", 28)
        .text("Final Output Vector")
        .style("fill", "gray")

        .style("font-size", "12px")
        .attr("class", "relu output to-be-removed").style("opacity", 0);


    outputGroup
        .selectAll("rect")
        .data(node.features)
        .enter()
        .append("rect")
        .attr("class", "relu output to-be-removed")
        .attr("x", (d: any, i: number) => i * rectHeight)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .style("stroke", "grey")
        .attr("opacity", 0);


    const outputFrame = outputGroup.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("class", "relu output to-be-removed")
        .attr("width", rectHeight * node.features.length)
        .attr("height", rectWidth)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("opacity", 0);

    const outputGroupCopy = g3
        .append("g")
        .attr(
            "transform",
            `translate(${3.5 * offset +
            node.relatedNodes[0].features.length * 2 * prevRectHeight +
            node.features.length * rectHeight +
            175
            }, ${height / 5 + 150})`
        );

    outputGroupCopy
        .selectAll("rect")
        .data(node.features)
        .enter()
        .append("rect")
        .attr("class", "relu to-be-removed")
        .attr("x", (d: any, i: number) => i * rectHeight)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .style("stroke", "grey")
        .attr("opacity", 0);



    const outputFrameCopy = outputGroupCopy.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("class", "relu to-be-removed")
        .attr("width", rectHeight * node.features.length)
        .attr("height", rectWidth)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("opacity", 0).raise();

    //draw label
    outputGroupCopy.append("text")
        .attr("x", 0)
        .attr("y", 28)
        .text("Final Output Vector")
        .style("fill", "gray")

        .style("font-size", "12px")
        .attr("class", "relu to-be-removed").style("opacity", 0);


    intermediateFeatureGroups.push(outputGroup);
    node.intermediateFeatureGroups = intermediateFeatureGroups;


    d3.select("#my_dataviz").on("click", function(event: any) {
        if (!state.isClicked) {
            return;
        }
        d3.selectAll(".math-displayer").remove();
        d3.selectAll(".graph-displayer").remove();
        moveFeaturesBack(node.relatedNodes, originalCoordinates);
        d3.selectAll(".to-be-removed").remove();
        d3.selectAll(".weightUnit").remove();
        d3.selectAll(".columnUnit").remove();
        d3.selectAll(".procVis").remove();


        state.isPlaying = false;
        clearInterval(intervalID);
        d3.selectAll(".bias").remove();
        d3.selectAll(".vis-component").remove();
        d3.selectAll(".relu").remove();
        d3.selectAll(".intermediate-path").remove();
        d3.selectAll(".parameter").remove();
        d3.selectAll(".to-be-removed").remove();
        d3.selectAll(".intermediate-path").remove();
        handleClickEvent(svg, node, event, moveOffset, colorSchemes, allNodes, convNum, mode, state);

    }) 

}

export function moveNextLayer(
    svg: any,
    node: any,
    moveOffset: number,
    indicator: number
) {
    if (!svg.selectAll) {
        svg = d3.selectAll(svg);
    } // when svg is passed into a function, it should be selected again
    svg.selectAll("g[layerNum]")
        .filter((d: any, i: any, nodes: any) => {
            const layerNum = d3.select(nodes[i]).attr("layerNum");
        
            return (
                layerNum !== null &&
                parseInt(layerNum) > 0 &&
                parseInt(layerNum) >= node.graphIndex
            );
        })
        .attr("transform", function (this: any) {
            const currentTransform = d3.select(this).attr("transform");
            if (currentTransform) {
                const currentXMatch =
                    currentTransform.match(/translate\(([^,]+),/);
                if (currentXMatch && currentXMatch[1]) {
                    const currentX = parseInt(currentXMatch[1]);
                    return `translate(${currentX + indicator * moveOffset},10)`;
                }
            }
            return `translate(${moveOffset},10)`; // Default fallback
        });




}

function weightAnimation(
    svg: any,
    node: any, startCoordList: number[][],
    endCoordList: number[][],
    weights: any,
    aggregatedData: any,
    offset: number,
    height: number,
    moveOffset: number,
    rectHeight: number,
    prevRectHeight: number,
    state: State,
    weightsLocation: number[][][],
    intervalID: any,
    allWeights: number[][][],
    displayerSVG: any,
    displayerHeight: number,
    mode: number
) {

    if (!state.isClicked) {
        d3.selectAll(".to-be-removed").remove();
        return
    }

    let i = 0;


    let endNumber = 64;
    if (node.graphIndex === 5) {
        endNumber = 2;
    }
    if (mode === 1) {
        endNumber = 4
        if (node.graphIndex === 3) {  //need to alter
            endNumber = 2

        }
    }




    if (!svg.selectAll) {
        svg = d3.select(svg);
    }

    // Pause and replay button
    const btn = svg.append("g").attr("class", "button-group");


    let btnYOffset = 100;
    if (node.relatedNodes.length == 2) btnYOffset = 150;

    injectPlayButtonSVGForGraphView(btn, endCoordList[0][0] - 80, endCoordList[0][1] - 22.5, "./assets/SVGs/matmul.svg")


    let isSwitched = 0;
    state.isPlaying = false;



    const gLabel = svg.append("g");
    injectSVG(gLabel, endCoordList[0][0] - 80-120-64, endCoordList[0][1] - 22.5-120-64, "./assets/SVGs/interactionHint.svg", "to-be-removed");

    btn.on("click", function (event: any) {
        if (isSwitched === 0) {
            
            d3.selectAll(".aniRect").style("opacity", 0);
        }
        isSwitched ++;

        event.stopPropagation();
        state.isPlaying = !state.isPlaying;
        console.log(state.isPlaying);
        if(state.isPlaying)injectPlayButtonSVGForGraphView(btn, endCoordList[0][0] - 80, endCoordList[0][1] - 22.5, "./assets/SVGs/playBtn_pause.svg");
        else injectPlayButtonSVGForGraphView(btn, endCoordList[0][0] - 80, endCoordList[0][1] - 22.5, "./assets/SVGs/playBtn_play.svg")
        if (state.isPlaying && state.isClicked) {

            startAnimation(endNumber);
        } else {
            //d3.selectAll(".aniRect").style("opacity", 0);
            clearInterval(intervalID);
        }
    });

    const math = create(all, {});
    let Xt = math.transpose(weights);
    if (node.graphIndex === 1) {
        Xt = math.transpose(Xt);
    }

    d3.selectAll(".aniRect").style("opacity", 0);


    let featureLength = node.features.length;
    let prevLayerFeatureLength = node.relatedNodes[0].features.length;

    function startAnimation(endNumber: number) {
        if (!state.isClicked || !state.isPlaying) {
            return;
        }

        d3.selectAll(".weightUnit").style("opacity", 0.3).lower();
        if (i >= endNumber) {
            i = 0; // Reset the index to replay the animation
        }
        intervalID = setInterval(() => {
            if (!state.isClicked) {
                clearInterval(intervalID)
                return;
            }


            d3.selectAll(`.calculatedFeatures${i}`).style("opacity", 1);
            d3.selectAll(`#tempath${i - 1}`).style("opacity", 0);
            d3.selectAll(".math-displayer").remove();

            if (state.isPlaying) {
                // GraphViewDrawPaths(
                //     Xt,
                //     myColor,
                //     i,
                //     startCoordList,
                //     endCoordList,
                //     svg,
                //     isAnimating,
                //     btn,
                //     node,
                //     featureLength,
                //     prevLayerFeatureLength,
                //     state
                // );
                if (mode === 0 && node.graphIndex === 5) {
                    const math = create(all, {});
                    const wMat = math.transpose(allWeights[3]);

                    displayerHandler(node, aggregatedData, state, displayerSVG, displayerHeight, (32 / node.relatedNodes[0].features.length), (32 / node.relatedNodes[0].features.length), myColor, [wMat], 0, weightsLocation, i)
                } else {
                displayerHandler(node, aggregatedData, state, displayerSVG, displayerHeight, (32 / node.relatedNodes[0].features.length), (32 / node.relatedNodes[0].features.length), myColor, allWeights, node.graphIndex - 1, weightsLocation, i)
                }


                
                graphVisDrawMatrixWeight(Xt, startCoordList, endCoordList, -1, i, myColor, weightsLocation, node.features.length, svg)

                d3.selectAll(`#weightUnit-${i - 1}`).style("opacity", 0.3).lower();
                d3.select(`#columnUnit-${i - 1}`).style("opacity", 0).lower();
                d3.selectAll(`#weightUnit-${i}`).style("opacity", 1).raise();
                d3.select(`#columnUnit-${i}`).style("opacity", 1).raise();

                i++;




                if (i >= endNumber) {
        

 

    
                    clearInterval(intervalID);
                    state.isPlaying = false;
                    d3.selectAll(".math-displayer").remove();
                    d3.selectAll(".graph-displayer").remove();

                    injectPlayButtonSVGForGraphView(btn, endCoordList[0][0] - 80, endCoordList[0][1] - 22.5, "./assets/SVGs/playBtn_play.svg")
                    d3.selectAll(".aniRect").style("opacity", 1);
                    d3.selectAll(".weightUnit").style("opacity", 1);
                    d3.selectAll(".columnUnit").style("opacity", 0);
                    d3.selectAll(`#tempath${i - 1}`).style("opacity", 0);
                  
       
                    setTimeout(() => {
   
            

                        d3.selectAll(".output")
                            .transition()
                            .delay(2000)
                            .duration(1000)
                            .attr("opacity", 1)
                            .attr(
                                "transform",
                                `translate(${node.featureGroupLocation.xPos - 2.5 * offset + (moveOffset - node.features.length * rectHeight - node.relatedNodes[0].features.length *
                                    2 * prevRectHeight) - 180 + 12.5
                                }, ${node.featureGroupLocation.yPos -
                                height / 5 -
                                150
                                }) rotate(90)`
                            );
                    }, 2000);
                }
            }
        }, 250);
    }

    setTimeout(() => {
        startAnimation(endNumber);
    }, 1000);
}

function GraphViewDrawPaths(
    Xt: any,
    myColor: any,
    i: number,
    startCoordList: number[][],
    endCoordList: number[][],
    svg: any,
    isAnimating: boolean,
    btn: any,
    node: any,
    featureLength: number,
    prevLayerFeatureLength: number,
    state: State
) {
    if (!svg.selectAll) {
        svg = d3.select(svg);
    }
    const Wi = Xt[i];

    for (let j = 0; j < prevLayerFeatureLength; j++) {
        if (!state.isClicked) {
            return;

        }
        let s = startCoordList[prevLayerFeatureLength - 1 - j];
        let e = endCoordList[i];



        let start_x = s[0];
        let start_y = s[1];
        let end_x = e[0];
        let end_y = e[1];

        let control_x = (start_x + end_x) * 0.5;
        let control_y = start_y + 100;

        svg.append("path")
            .attr("d", function () {
                return [
                    "M",
                    start_x,
                    start_y,
                    "A",
                    (end_x - start_x) / 2,
                    ",",
                    (end_x - start_x) / 4,
                    0,
                    0,
                    ",",
                    0,
                    ",",
                    end_x,
                    ",",
                    end_y,
                ].join(" ");
            })
            .attr("stroke", myColor(Wi[prevLayerFeatureLength - 1 - j]))
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .attr("fill", "none")
            .attr("class", "intermediate-path to-be-removed")
            .attr("id", `tempath${i}`)
            .lower();
    }

    if (isAnimating) {
        setTimeout(() => {
            i++;
        }, 250);
    }
}

export function aggregationCalculator(graphs: any[]) {
    let data = graphs[1];
    const nodeCount = data.nodes.length;
    const edgePairs = data.links;
    let adjList: number[][] = Array.from({ length: nodeCount }, () => []);
    let checked: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
        // Push itself to the adjList
        adjList[i].push(i);
        for (let j = 0; j < edgePairs.length; j++) {
            if (data.links[j].source.id === i) {
                // Push its neighbors to adjList
                adjList[i].push(data.links[j].target.id);
            }
        }
    }

    const degreeMap = new Array(nodeCount).fill(0);
    for (let i = 0; i < edgePairs.length; i++) {
        const source = edgePairs[i].source.id;
        const target = edgePairs[i].target.id;

        degreeMap[source]++;
        degreeMap[target]++;
    }
    for (let i = 0; i < degreeMap.length; i++) {
        degreeMap[i] = degreeMap[i] / 2 + 1;
    }

    let degreeMatrix: any;
    degreeMatrix = Array.from({ length: nodeCount }, () =>
        new Array(nodeCount).fill(0)
    );
    for (let i = 0; i < nodeCount; i++) {
        degreeMatrix[i][i] = 1 / Math.sqrt(degreeMap[i]);
    }

    let adjMatrix = Array.from({ length: nodeCount }, () =>
        new Array(nodeCount).fill(0)
    );

    for (let i = 0; i < nodeCount; i++) {
        for (let j = 0; j < adjList[i].length; j++) {
            const neighbor = adjList[i][j];
            adjMatrix[i][neighbor] = 1;
        }
    }

    let normalizedAdjMatrix = matrixMultiplication(degreeMatrix, adjMatrix);
    normalizedAdjMatrix = matrixMultiplication(
        normalizedAdjMatrix,
        degreeMatrix
    );
    return normalizedAdjMatrix;
}

export function matrixMultiplication(matrix_a: any[], matrix_b: any[]) {
    const rowsA = matrix_a.length;
    const colsA = matrix_a[0].length;
    const rowsB = matrix_b.length;
    const colsB = matrix_b[0].length;

    if (colsA !== rowsB) {
        console.log(matrix_a.length, matrix_a[0].length);
        console.log(matrix_b.length, matrix_b[0].length);
        console.log("can't do");
        return [];
    }

    const result: any[][] = Array.from({ length: rowsA }, () =>
        Array(colsB).fill(0)
    );

    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < colsB; j++) {
            for (let k = 0; k < colsA; k++) {
                result[i][j] += matrix_a[i][k] * matrix_b[k][j];
            }
        }
    }

    return result;
}

function moveFeatures(relatedNodes: any, xPos: number, yPos: number) {
    let originalCoordinates: any[] = [];
    let coordinate: FeatureGroupLocation;
    let x;
    let y;

    relatedNodes.forEach((n: any, i: number) => {
        if (n.featureGroup) {
            n.featureGroup
                .transition()
                .delay(1000)
                .duration(1500)
                .attr(
                    "transform",
                    `translate(${xPos + 27.5}, ${yPos + i * 45 + 100
                    }) rotate(-90)`
                );
        }
        if (n.featureGroupLocation) {
            x = n.featureGroupLocation.xPos;
            y = n.featureGroupLocation.yPos;
            coordinate = { xPos: x, yPos: y };
            originalCoordinates.push(coordinate);
        }
    });
    return originalCoordinates;
}

function moveFeaturesBack(
    relatedNodes: any,
    originalCoordinates: FeatureGroupLocation[]
) {
    relatedNodes.forEach((n: any, i: number) => {
        let xPos = originalCoordinates[i].xPos;
        let yPos = originalCoordinates[i].yPos;


        n.featureGroup
            .transition()
            .duration(1000)
            .attr(
                "transform",
                `translate(${xPos - 7.5}, ${yPos
                }) rotate(0)`
            );

    });
}

export function fcLayerCalculationVisualizer(
    node: any,
    allNodes: any[],
    relatedNodes: any,
    offset: number,
    height: number,
    moveOffset: number,
    graphIndex: number,
    svg: any,
    state: State,
    rectHeight: number,
    colorSchemes: any,
    convNum: number,
    originalSvg: any,
    mode: number
) {

    d3.selectAll(".node-features-Copy").style("visibility", "visible");
    d3.selectAll(".node-features-Copy").raise();
    let moveToX = graphIndex * offset - 350;
    let moveToY = height / 20;
    
    let originalCoordinates = moveFeatures(relatedNodes, moveToX, moveToY);

    if (!svg.selectAll) {
        svg = d3.select(svg);
    }

    const g4 = svg
        .append("g")
        .attr("transform", `translate(${moveToX - 700}, ${moveToY})`);

    const displayer = g4
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 300)
        .attr("height", 75)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("fill", "transparent")
        .style("stroke", "black")
        .style("stroke-width", 2)
        .attr("class", "graph-displayer")
        .attr("opacity", 0)
        .lower();

    let xPos = node.featureGroupLocation.xPos + (graphIndex - 3.5) * offset;
    let yPos = node.featureGroupLocation.yPos;
    node.featureGroup
        .transition()
        .delay(1000)
        .duration(1000)
        .attr(
            "transform",
            `translate(${moveToX - 500}, ${moveToY + 150}) rotate(-90)`
        );

    let rectL = 175 / node.relatedNodes.length; // Assuming square shape and 75 is the height of graph-displayer
    let spacing = 30; // Adjust spacing as needed
    let displayerWidth = 300; // Width of the graph-displayer
    let numRect = [];
    let ySpacing = 5; // Additional spacing for y direction

    for (let i = 0; i < node.relatedNodes.length; i++) {
        let x =
            (i % Math.floor((displayerWidth - spacing) / (rectL + spacing))) *
            (rectL + spacing) +
            spacing +
            20;
        let y =
            Math.floor(
                i /
                Math.floor(
                    (displayerWidth - spacing - 20) / (rectL + spacing)
                )
            ) *
            (rectL + ySpacing) +
            ySpacing;
        numRect.push([x, y]);
    }

    let posNeed = [];

    posNeed.push([40, 30]); // Adjust the x offset to space the textNeed elements
    posNeed.push([265, 30]);
    posNeed.push([270, 30]);

    let posPlus = [];
    for (let i = 0; i < numRect.length; i++) {
        let c = [numRect[i][0] + rectL, numRect[i][1] + rectL / 2 + 2];
        posPlus.push(c);
    }

    

    setTimeout(() => {
        poolingLayerInteraction(
            node,
            g4,
            numRect,
            rectL,
            posNeed,
            posPlus,
            state,
            colorSchemes
        );
        node.relatedNodes.forEach((n: any, i: number) => {
            let start_x = 0;
            let start_y = 0;
            let end_x = moveToX - 900 + 15 + node.relatedNodes[0].features.length * rectHeight;
            let end_y = moveToY + 150;
            start_x =
                3.5 * offset + n.features.length * rectHeight - offset - moveOffset + 135;
                start_y = height / 20 + 100 + 45 * i - 7.5;
                if (node.relatedNodes.length <= 8) {
                    start_y = height / 5 + 100 + 45 * i - 7.5;
                }
            const control1_x = start_x + (end_x - start_x) * 0.3;
            const control1_y = start_y;
            const control2_x = start_x + (end_x - start_x) * 0.7;
            const control2_y = end_y;



            const originToAggregated = svg
                .append("path")
                .attr(
                    "d",
                    `M${start_x},${start_y} C ${control1_x},${control1_y}, ${control2_x},${control2_y}, ${end_x},${end_y}`
                )
                .style("stroke", "black")
                .style("stroke-width", 1)
                .style("fill", "none")
                .attr("class", "to-be-removed origin-to-aggregated")
                .style("opacity", 0);

            d3.selectAll(".origin-to-aggregated").transition()
                .delay(1000)
                .duration(1000)
                .style("opacity", 0.3);




        })
    }, 1000);





    d3.select("#my_dataviz").on("click", function(event: any) {
        d3.selectAll(".math-displayer").remove();
        d3.selectAll(".graph-displayer").remove();
        

            d3.selectAll(".origin-to-aggregated").remove();
    
            d3.selectAll(".node-features-Copy").style("visibility", "hidden");
    
            for (let i = 0; i < colorSchemes.length; i++)colorSchemes[i].style.opacity = "1";
    
            moveFeaturesBack(relatedNodes, originalCoordinates);
            node.featureGroup
                .transition()
                .duration(1000)
                .attr(
                    "transform",
                    `translate(${xPos - 300 - 15 / 2}, ${yPos}) rotate(0)`
                );
            d3.selectAll("rect").style("opacity", 1);
            d3.selectAll(".graph-displayer").remove();
            handleClickEvent(originalSvg, node, event, moveOffset, colorSchemes, allNodes, convNum, mode, state);
       


    })

}

function poolingLayerInteraction(
    node: any,
    svg: any,
    numRect: number[][],
    rectL: number,
    posNeed: number[][],
    posPlus: number[][],
    state: State,
    colorSchemes: any
) {
    if (!svg.selectAll) {
        svg = d3.select(svg);
    }

    for (let i = 0; i < colorSchemes.length; i++)colorSchemes[i].style.opacity = "0.5";

    colorSchemes[3].style.opacity = "1";
    colorSchemes[4].style.opacity = "1";

    for (let i = 0; i < node.features.length; i++) {
        d3.select(`#pooling-layer-rect-${i}`)
            .on("mouseover", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(".node-features").style("opacity", 0.3);
                d3.select(`#pooling-layer-rect-${i}`).style("opacity", 1).style("stroke", "black").style("stroke-width", 1);
                d3.selectAll(`#conv3-layer-rect-${i}`).style("opacity", 1).style("stroke", "black").style("stroke-width", 1);
                d3.select(".graph-displayer").attr("opacity", 1);
                svg.append("text")
                    .attr("x", 0)
                    .attr("y", 30)
                    .text("Avg")
                    .attr("class", "math-displayer")
                    .attr("font-size", "12.5")
                    .attr("fill", "black");

                for (let j = 0; j < node.relatedNodes.length; j++) {
                    svg.append("rect")
                        .attr("x", numRect[j][0])
                        .attr("y", numRect[j][1])
                        .attr("width", rectL)
                        .attr("height", rectL)
                        .style("stroke", "black")
                        .attr("fill", myColor(node.relatedNodes[j].features[i]))
                        .attr("class", "math-displayer")
                        .lower();
                    svg.append("text")
                        .attr("x", numRect[j][0])
                        .attr("y", numRect[j][1] + rectL / 2)
                        .text(roundToTwo(node.relatedNodes[j].features[i]))
                        .attr("class", "math-displayer")
                        .attr("font-size", "5");
                }
                // append text

                //add plus sign to svg
                for (let i = 0; i < posPlus.length - 1; i++) {
                    svg.append("text")
                        .attr("x", posPlus[i][0])
                        .attr("y", posPlus[i][1])
                        .text("+")
                        .attr("class", "math-displayer")
                        .attr("font-size", "10")
                        .attr("fill", "black");
                }

                const textNeed = ["(", ")", "="];
                for (let i = 0; i < textNeed.length; i++) {
                    svg.append("text")
                        .attr("x", posNeed[i][0])
                        .attr("y", posNeed[i][1])
                        .text(textNeed[i])
                        .attr("class", "math-displayer")
                        .attr("font-size", "10")
                        .attr("fill", "black");
                }

                svg.append("rect")
                    .attr("x", 280)
                    .attr("y", 30 - rectL)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(node.features[i]))
                    .text(roundToTwo(node.features[i]))
                    .attr("class", "math-displayer")
                    .lower();
                svg.append("text")
                    .attr("x", 280)
                    .attr("y", 30 - rectL / 2)
                    .text(roundToTwo(node.features[i]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");
            })
            .on("mouseout", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(`#pooling-layer-rect-${i}`).style("opacity", 1).style("stroke", "black").style("stroke-width", 1);
                d3.select(".graph-displayer").attr("opacity", 0);
                d3.selectAll("[id^='conv3-layer-rect-']").style("opacity", 1).style("stroke", "none").style("stroke-width", 0);
                d3.selectAll("[id^='pooling-layer-rect-']").style("opacity", 1).style("stroke", "none").style("stroke-width", 0);
                d3.selectAll(".math-displayer").remove();
            });
    }
}

export function nodeOutputVisualizer(
    node: any,
    allNodes: any,
    allWeights: number[][][],
    bias: any[],
    svg: any,
    offset: number,
    convNum: number,
    moveOffset: number,
    height: number,
    prevRectHeight: number,
    rectHeight: number,
    rectWidth: number,
    colorSchemes: any,
    originalSvg: any,
    mode: number

) {

    showFeature(node)
    let weights = allWeights[3]
    let intervalID = 0;
    state.isClicked = true;



    d3.selectAll(".to-be-removed").remove();
    d3.selectAll(".node-features-Copy").style("visibility", "visible").lower();

    //color schemes interaction
    for (let i = 0; i < 4; i++)colorSchemes[i].style.opacity = "0.5";
    let xPos = (node.graphIndex) * offset - 250;
    let yPos = node.y - 15
    let originalCoordinates = moveFeatures(
        node.relatedNodes,
        xPos,
        yPos - 100
    );
    const featureGroupCopy = svg.append("g")
        .attr("transform", `translate(${node.featureGroupLocation.xPos - 7.5}, ${node.featureGroupLocation.yPos})`);


    node.featureGroup
        .transition()
        .delay(1000)
        .duration(1000)
        .attr(
            "transform",
            `translate(${xPos - moveOffset}, ${yPos}) rotate(-90)`
        );

    let temp = 350;

    let calculatedData: number[] = [];
    for (let i = 0; i < 4; i++) {
        let data = 0;
        for (let j = 0; j < node.relatedNodes[0].features.length; j++) {
            data += weights[i][j] * node.relatedNodes[0].features[j];
        }
        calculatedData.push(data);
    }


    let startCoordList = [];
    for (let i = 0; i < 2; i++) {
        let s: [number, number] = [
            xPos - temp - moveOffset
            + prevRectHeight * i - 215,
            node.y - 15,
        ];
        startCoordList.push(s);
    }

    console.log(calculatedData);
    const calculatedFeatureGroup = svg
        .append("g")
        .attr("transform", `translate(${xPos - temp - moveOffset}, ${node.y})`);

    calculatedFeatureGroup
        .selectAll("rect")
        .data(calculatedData)
        .enter()
        .append("rect")
        .attr("x", (d: number, i: number) => i * rectHeight + 5)
        .attr("y", -30)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .attr(
            "class",
            (d: number, i: number) => `calculatedFeatures${i} to-be-removed calculatedRect bias`
        )
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
     
        .style("opacity", 0);

    calculatedFeatureGroup.append("text")
        .attr("x", 5)
        .attr("y", -43)
        .text("Matrix Multiplication")
        .style("fill", "gray")

        .style("font-size", "12px")
        .attr("class", "bias to-be-removed")

        .style("opacity", 0);

    let endCoordList = [];

    for (let i = 0; i < 4; i++) {
        let s: [number, number] = [xPos - moveOffset + 20 + i * rectHeight - temp, node.y - 15];
        endCoordList.push(s);
    }
    const math = create(all, {});
    const wMat = math.transpose(allWeights[3]);

    let weightsLocation = computeMatrixLocations(endCoordList[0][0] - 100, endCoordList[0][1] - 30, -1, 10, node.features.length, [wMat], 0);

    setTimeout(() => {
        if (!state.isClicked) {
            return;
        }
        drawWeightMatrix(endCoordList[0][0] - 90, endCoordList[0][1] - 30, 1, 10, 10, node.features.length, [wMat], 0, myColor, svg, weightsLocation)


        d3.selectAll(".bias").style("opacity", 1);
        d3.selectAll(".softmax").attr("opacity", 0.3);
        d3.selectAll(".relu").style("opacity", 1);
        d3.selectAll(".output-path").attr("opacity", 1);
        d3.selectAll(".softmaxLabel").attr("opacity", 1);
        
    }, 2000)


    const g5 = svg
        .append("g")
        .attr("transform", `translate(${endCoordList[0][0]}, ${endCoordList[0][1] - 150})`);

    let RectL = 0.5;
    if (mode === 1) {
        RectL = 5

    }
    let DisplayerWidth = 300; // Width of the graph-displayer
    let DisplayHeight = 75;

    const graphDisplayer = g5
        .append("rect")
        .attr("x", (node.graphIndex - 2) * 1)
        .attr("y", 0)
        .attr("width", DisplayerWidth)
        .attr("height", DisplayHeight)
        .attr("rx", 10)
        .attr("ry", 10)
        .style("fill", "transparent")
        .style("stroke", "black")
        .style("stroke-width", 2)
        .attr("class", "graph-displayer to-be-removed")
        .attr("opacity", 0)
        .lower();

        const Xt = math.transpose(weights);
    hoverOverHandler(node, calculatedData, state, g5, DisplayHeight, (20 / node.relatedNodes[0].features.length), (32 / node.relatedNodes[0].features.length), myColor, [wMat], 0, weightsLocation, Xt, startCoordList, endCoordList, svg)



    let outputData = [];
    for (let i = 0; i < calculatedData.length; i++) {
        outputData.push(calculatedData[i] + bias[i])
    }

    const outputGroup = svg
        .append("g")
        .attr("transform", `translate(${xPos - temp - moveOffset + 170}, ${node.y - 30})`);

    outputGroup.selectAll("rect")
        .data(outputData)
        .enter()
        .append("rect")
        .attr("class", "bias to-be-removed")
        .attr("x", (d: any, i: number) => i * rectHeight + 5)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0);

    outputGroup.append("text")
        .attr("x", 5)
        .attr("y", 28)
        .text("Matmul Result")
        .style("fill", "gray")

        .style("font-size", "12px")
        .attr("class", "bias to-be-removed")

        .style("opacity", 0);

    const BiasGroup = svg
        .append("g")
        .attr("transform", `translate(${xPos - temp - moveOffset}, ${node.y + 30})`);

    BiasGroup.selectAll("rect")
        .data(bias)
        .enter()
        .append("rect")
        .attr("class", "bias to-be-removed")
        .attr("x", (d: any, i: number) => i * rectHeight + 5)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", rectWidth)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0);

    BiasGroup.append("text")
        .attr("x", 5)
        .attr("y", 28)
        .text("Bias Vector")
        .style("fill", "gray")

        .style("font-size", "12px")
        .attr("class", "bias to-be-removed")

        .style("opacity", 0);

    setTimeout(() => {
        if (!state.isClicked) {
            return;
        }

        weightAnimation(
            svg,
            node,
            startCoordList,
            endCoordList,
            Xt,
            calculatedData,
            offset,
            height,
            moveOffset,
            rectHeight,
            prevRectHeight,
            state,
            weightsLocation,
            intervalID,
            allWeights,
            g5,
            displayHeight,
            mode
        );

        let start_x = xPos - temp - moveOffset
            + prevRectHeight * 4 + 140;
        let start_y = node.y - 22.5;
        let end_x = xPos - temp - moveOffset
            + prevRectHeight * 4 + 200;
        let end_y = node.y - 22.5;

        let control_x = (start_x + end_x) / 2;
        let control_y = start_y + 50;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const softmaxPath1 = svg
                    .append("path")
                    .attr(
                        "d",
                        `M${start_x + 20 * i - 30},${start_y + 7.5
                        } Q${control_x},${control_y} ${end_x + 70 + 20 * j},${end_y + 7.5
                        }`
                    )
                    .attr("stroke", myColor(calculatedData[i]))
                    .attr("stroke-width", 1)
                    .attr("class", `softmax${j} softmax to-be-removed`)
                    .attr("opacity", 1)
                    .style("fill", "none")

            }
        }

        svg.append("text")
            .attr("x", (start_x - 30 + end_x) / 2)
            .attr("y", end_y + 55)
            .text("Softmax")
            .style("fill", "gray")
            .style("font-size", "12px")
            .attr("class", "to-be-removed softmaxLabel")
            .style("opacity", 1);


        let color = calculateAverage(node.features); // to be determined

        start_y = node.y + 40;
        start_x = xPos - temp - moveOffset + node.features.length * rectHeight;
        end_x -= node.features.length * rectHeight;


        let control1_x = start_x + (end_x - start_x) * 0.2;
        let control1_y = start_y;
        let control2_x = start_x + (end_x - start_x) * 0.4;
        let control2_y = end_y;

        color = calculateAverage(node.features);
        const biasToFinal = svg
            .append("path")
            .attr(
                "d",
                `M${start_x},${start_y} C ${control1_x} ${control1_y}, ${control2_x} ${control2_y} ${end_x},${end_y}`
            )
            .style("stroke", pathColor(color))
            .style("opacity", 0.7)
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "bias to-be-removed")
            .style("opacity", 1)
            .lower()



        const originToAggregated = svg
            .append("path")
            .attr(
                "d",
                `M${start_x - 270},${start_y - 65} L${end_x - 195},${end_y}`
            )
            .style("stroke", pathColor(color))
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "output-path to-be-removed")
            .attr("opacity", 1)
            .lower();

            const calculatedToOutput = svg
            .append("path")
            .attr(
                "d",
                `M${end_x - 130},${start_y - 65} L${end_x},${end_y}`
            )
            .style("stroke", pathColor(color))
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "output-path to-be-removed")
            .attr("opacity", 1)
            .lower();

            const outputToFinal = svg
            .append("path")
            .attr(
                "d",
                `M${end_x + 45},${start_y - 65} L${end_x + 200},${end_y}`
            )
            .style("stroke", pathColor(color))
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "output-path to-be-removed")
            .attr("opacity", 1)
            .lower();
    }, 2000);



    let rectL = 15;
    let displayerWidth = 300; // Width of the graph-displayer
    let displayHeight = 75;





    for (let i = 0; i < node.features.length; i++) {
        d3.selectAll(`#output-layer-rect-${i}`)
            .on("mouseover", function () {

                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(".graph-displayer").attr("opacity", 1);
                d3.selectAll(`.softmax${i}`).attr("opacity", 1);
                g5.append("rect")
                    .attr("x", 50)
                    .attr("y", displayHeight - 40)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[0]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", 50)
                    .attr("y", displayHeight - 40 + rectL / 2)
                    .text(roundToTwo(calculatedData[0]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");

                g5.append("rect")
                    .attr("x", 100)
                    .attr("y", displayHeight - 40)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[1]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", 100)
                    .attr("y", displayHeight - 40 + rectL / 2)
                    .text(roundToTwo(calculatedData[1]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");



                    g5.append("rect")
                    .attr("x", displayerWidth - 150)
                    .attr("y", displayHeight - 40)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[2]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", displayerWidth - 150)
                    .attr("y", displayHeight - 40 + rectL / 2)
                    .text(roundToTwo(calculatedData[2]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");


                    g5.append("rect")
                    .attr("x", displayerWidth - 100)
                    .attr("y", displayHeight - 40)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[3]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", displayerWidth - 100)
                    .attr("y", displayHeight - 40 + rectL / 2)
                    .text(roundToTwo(calculatedData[3]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");















                g5.append("rect")
                    .attr("x", 100)
                    .attr("y", 10)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[i]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", 100)
                    .attr("y", 10 + rectL / 2)
                    .text(roundToTwo(calculatedData[i]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");

                g5.append("text")
                    .attr("x", 100 - 27)
                    .attr("y", displayHeight - 30)
                    .text("+")
                    .attr("class", "math-displayer")
                    .attr("font-size", "12");

                    g5.append("text")
                    .attr("x", displayerWidth - 25 - 105)
                    .attr("y", displayHeight - 30)
                    .text("+")
                    .attr("class", "math-displayer")
                    .attr("font-size", "12");

                    g5.append("text")
                    .attr("x", displayerWidth - 25 - 152)
                    .attr("y", displayHeight - 30)
                    .text("+")
                    .attr("class", "math-displayer")
                    .attr("font-size", "12");



                g5.append("text")
                    .attr("x", 100 - 20)
                    .attr("y", 20)
                    .attr("xml:space", "preserve")
                    .text("exp(          )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "8");

                g5.append("text")
                    .attr("x", 50 - 20)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("exp(            )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "8");

                g5.append("text")
                    .attr("x", displayerWidth - 150 - 20)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("exp(          )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "8");

                    g5.append("text")
                    .attr("x", displayerWidth - 100 - 20)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("exp(          )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "8");

                    g5.append("text")
                    .attr("x", 100 - 20)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("exp(        )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "8");


                g5.append("line")
                    .attr("x1", 20)
                    .attr("y1", 30)
                    .attr("x2", displayerWidth - 80)
                    .attr("y2", 30)
                    .attr("stroke", "black")
                    .attr("class", "math-displayer")
                    .attr("stroke-width", 1);

                g5.append("text")
                    .attr("x", displayerWidth - 60)
                    .attr("y", 35)
                    .text("=")
                    .attr("class", "math-displayer")
                    .attr("font-size", "15");

                g5.append("rect")
                    .attr("x", displayerWidth - 50)
                    .attr("y", 25)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(node.features[i]))
                    .attr("class", "math-displayer")
                    .lower();
                g5.append("text")
                    .attr("x", displayerWidth - 50)
                    .attr("y", 25 + rectL / 2)
                    .text(roundToTwo(node.features[i]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");
            })
            .on("mouseout", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(".math-displayer").remove();
                d3.selectAll(".graph-displayer").attr("opacity", 0);
                d3.selectAll(".softmax").attr("opacity", 0);
                d3.selectAll(`.softmax${i}`).attr("opacity", 0.07);
            });
    }





    d3.select("#my_dataviz").on("click", function(event: any) {
        if (!state.isClicked) {
            return;
        }
        d3.selectAll(".math-displayer").remove();
        d3.selectAll(".graph-displayer").remove();
                d3.selectAll(".node-features-Copy").style("opacity", "hidden");
                d3.selectAll(".procVis").remove();
                d3.selectAll(".to-be-removed").remove();
                handleClickEvent(originalSvg, node, event, moveOffset, colorSchemes, allNodes, convNum, mode, state);
    

    
    
            d3.selectAll(".graph-displayer").remove();
            d3.selectAll(".weightUnit").remove();
            d3.selectAll(".columnUnit").remove();
            for (let i = 0; i < 4; i++)colorSchemes[i].style.opacity = "1";
            moveFeaturesBack(node.relatedNodes, originalCoordinates);
            node.featureGroup
                .transition()
                .duration(1000)
                .attr(
                    "transform",
                    `translate(${node.x - 7.5}, ${node.y + 25}) rotate(0)`
                )
                .style("visibility", "hidden");
    

    })




}

