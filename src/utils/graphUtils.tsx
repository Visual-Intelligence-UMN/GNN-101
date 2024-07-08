import * as d3 from "d3";
import {
    FeatureGroupLocation,
    State,
    calculateAverage,
    deepClone,
    myColor,
    state,
} from "./utils";
import { roundToTwo } from "@/pages/WebUtils";
import { loadWeights } from "./matHelperUtils";
import * as math from "mathjs";
import { create, all, matrix } from "mathjs";
import { inter } from "@/pages";
import { off } from "process";
import { injectPlayButtonSVGForGraphView } from "./svgUtils";

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
                link.style("opacity", 0.1);
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
        node.featureGroup.style("visibility", "visible");
        node.featureGroup.raise();
    }

    if (node.relatedNodes) {
        node.relatedNodes.forEach((n: any) => {
            d3.select(n.svgElement).attr("stroke-width", 3);
            n.featureGroup.style("visibility", "visible");
            n.featureGroup.raise();
        });
    }
    

    if (node.links) {
        node.links.forEach((link: any) => {
            link.style("opacity", 1);
        });
    }
}

export function resetNodes(allNodes: any[]) {
    allNodes.forEach((node) => {
        scaleFeatureGroup(node, 0.5)
        if (node.graphIndex <= 3) {
            if (node.featureGroup) {
                node.featureGroup.style("visibility", "hidden");
            }
            if (node.svgElement) {
                d3.select(node.svgElement).attr("stroke-width", 1);
            }
            if (node.relatedNodes) {
                node.relatedNodes.forEach((relatedNode: any) => {
                    d3.select(relatedNode.svgElement).attr("stroke-width", 1);
                });
            }
            if (node.intermediateFeatureGroups) {
                node.intermediateFeatureGroups.forEach(
                    (intermediateFeatureGroup: any) => {
                        intermediateFeatureGroup.style("visibility", "hidden");
                    }
                );
            }

            if (node.links) {
                node.links.forEach((link: any) => {
                    link.style("opacity", 0.1);
                });
            }

            if (node.relatedNodes) {
                node.relatedNodes.forEach((n: any) => {
                    d3.select(n.svgElement).attr("stroke-width", 1);
                    n.featureGroup.style("visibility", "hidden");
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
    weights: any[],
    bias: any[],
    svg: any,
    offset: number,
    isClicked: boolean,
    moveOffset: number,
    height: number
) {
    d3.selectAll(".node-features-Copy").style("visibility", "visible");
    let originalCoordinates = moveFeatures(
        node.relatedNodes,
        (node.graphIndex - 1) * offset - 250,
        height / 5
    );
    node.featureGroup
        .transition()
        .delay(2000)
        .duration(1000)
        .attr(
            "transform",
            `translate(${node.x - 100}, ${node.y - 25}) rotate(-90)`
        );

    let temp = 475;

    let calculatedData: number[] = [];
    for (let i = 0; i < 2; i++) {
        let data = 0;
        for (let j = 0; j < node.relatedNodes[0].features.length; j++) {
            data += weights[i][j] * node.relatedNodes[0].features[j];
        }
        calculatedData.push(data);
    }
    console.log("mDAWa", node.relatedNodes[0].features, weights);

    let startCoordList = [];
    for (let i = 0; i < 64; i++) {
        let s: [number, number] = [
            node.x +
                3 * i -
                offset -
                moveOffset + temp - 215,
            node.y - 15,
        ];
        startCoordList.push(s);
    }

    console.log(calculatedData);
    const calculatedFeatureGroup = svg
        .append("g")
        .attr("transform", `translate(${node.x - temp}, ${node.y})`);

    calculatedFeatureGroup
        .selectAll("rect")
        .data(calculatedData)
        .enter()
        .append("rect")
        .attr("x", (d: number, i: number) => i * 20 + 5)
        .attr("y", -30)
        .attr("width", 20)
        .attr("height", 15)
        .attr(
            "class",
            (d: number, i: number) => `calculatedFeatures${i} to-be-removed`
        )
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0);

    let endCoordList = [];

    for (let i = 0; i < node.features.length; i++) {
        let s: [number, number] = [node.x + 20 + i * 100 - temp, node.y - 15];
        endCoordList.push(s);
    }
    console.log("start", startCoordList);
    console.log("end", endCoordList);
    const math = create(all, {});
    const Xt = math.transpose(weights);

    const BiasGroup = svg
        .append("g")
        .attr("transform", `translate(${node.x - 200}, ${node.y + 30})`);

    BiasGroup.selectAll("rect")
        .data(bias)
        .enter()
        .append("rect")
        .attr("class", "bias")
        .attr("x", (d: any, i: number) => i * 20 + 5 - moveOffset)
        .attr("y", 0)
        .attr("width", 20)
        .attr("height", 15)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0);

    setTimeout(() => {
        weightAnimation(
            svg,
            node,
            startCoordList,
            endCoordList,
            Xt,
            offset,
            height,
            moveOffset
        );

        let start_x = node.x + 40 + 5 - temp;
        let start_y = node.y - 22.5;
        let end_x = node.x + 200 - 40 - 5 - temp + 50;
        let end_y = node.y - 22.5;

        let control_x = (start_x + end_x) / 2;
        let control_y = start_y + 50;

        for (let i = 0; i < node.features.length; i++)
            for (let j = 0; j < node.features.length; j++) {
                const softmaxPath1 = svg
                    .append("path")
                    .attr(
                        "d",
                        `M${start_x + 20 * i - 30},${
                            start_y + 7.5
                        } Q${control_x},${control_y} ${end_x - 20 * j},${
                            end_y + 7.5
                        }`
                    )
                    .attr("stroke", myColor(calculatedData[i]))
                    .attr("stroke-width", 1)
                    .attr("class", `softmax${1 - j} softmax to-be-removed`)
                    .attr("opacity", 0)
                    .style("fill", "none");
            }

        let color = calculateAverage(node.features); // to be determined

        const aggregatedToFinal = svg
            .append("path")
            .attr("d", `M${start_x},${start_y} ${end_x - 20},${end_y}`)
            .style("stroke", pathColor(color))
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "relu to-be-removed")
            .attr("opacity", 0);

        start_y = node.y + 40;
        start_x = start_x - moveOffset + temp - 200;
        end_x = end_x - 200;

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
            .style("opacity", 0);



        const originToAggregated = svg
            .append("path")
            .attr(
                "d",
                `M${start_x + 6},${start_y - 65} L${end_x},${end_y}`
            )
            .style("stroke", pathColor(color))
            .style("stroke-width", 1)
            .style("fill", "none")
            .attr("class", "output-path to-be-removed")
            .attr("opacity", 0);
    }, 2000);

    const g4 = svg
        .append("g")
        .attr("transform", `translate(${node.x - temp}, ${node.y - 150})`);

    let rectL = 15;
    let displayerWidth = 300; // Width of the graph-displayer
    let displayHeight = 75;

    const displayer = g4
        .append("rect")
        .attr("x", 0)
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

    state.isClicked = true;

    for (let i = 0; i < node.features.length; i++) {
        d3.select(`#output-layer-rect-${i}`)
            .on("mouseover", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.select(".graph-displayer").attr("opacity", 1);
                d3.selectAll(`.softmax${i}`).attr("opacity", 1);
                g4.append("rect")
                    .attr("x", 70)
                    .attr("y", displayHeight - 40)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[0]))
                    .attr("class", "math-displayer")
                    .lower();
                g4.append("text")
                    .attr("x", 70)
                    .attr("y", displayHeight - 40 + rectL / 2)
                    .text(roundToTwo(calculatedData[0]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");

                g4.append("rect")
                    .attr("x", displayerWidth - 130)
                    .attr("y", displayHeight - 40)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[1]))
                    .attr("class", "math-displayer")
                    .lower();
                g4.append("text")
                    .attr("x", displayerWidth - 130)
                    .attr("y", displayHeight - 40 + rectL / 2)
                    .text(roundToTwo(calculatedData[1]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");

                g4.append("rect")
                    .attr("x", 100)
                    .attr("y", 10)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(calculatedData[i]))
                    .attr("class", "math-displayer")
                    .lower();
                g4.append("text")
                    .attr("x", 100)
                    .attr("y", 10 + rectL / 2)
                    .text(roundToTwo(calculatedData[i]))
                    .attr("class", "math-displayer")
                    .attr("font-size", "5");

                g4.append("text")
                    .attr("x", displayerWidth / 2 - 50)
                    .attr("y", displayHeight - 30)
                    .text("+")
                    .attr("class", "math-displayer")
                    .attr("font-size", "12");

                g4.append("text")
                    .attr("x", 100 - 25)
                    .attr("y", 20)
                    .attr("xml:space", "preserve")
                    .text("exp(        )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");

                g4.append("text")
                    .attr("x", 70 - 25)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("exp(        )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");

                g4.append("text")
                    .attr("x", displayerWidth - 130 - 25)
                    .attr("y", displayHeight - 30)
                    .attr("xml:space", "preserve")
                    .text("exp(        )")
                    .attr("class", "math-displayer")
                    .attr("font-size", "10");

                g4.append("line")
                    .attr("x1", 20)
                    .attr("y1", 30)
                    .attr("x2", displayerWidth - 80)
                    .attr("y2", 30)
                    .attr("stroke", "black")
                    .attr("class", "math-displayer")
                    .attr("stroke-width", 1);

                g4.append("text")
                    .attr("x", displayerWidth - 60)
                    .attr("y", 35)
                    .text("=")
                    .attr("class", "math-displayer")
                    .attr("font-size", "15");

                g4.append("rect")
                    .attr("x", displayerWidth - 50)
                    .attr("y", 25)
                    .attr("width", rectL)
                    .attr("height", rectL)
                    .style("stroke", "black")
                    .attr("fill", myColor(node.features[i]))
                    .attr("class", "math-displayer")
                    .lower();
                g4.append("text")
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

    document.addEventListener("click", function () {
        d3.selectAll(".graph-displayer").remove();
        moveFeaturesBack(node.relatedNodes, originalCoordinates);
        node.featureGroup
            .transition()
            .duration(1000)
            .attr(
                "transform",
                `translate(${node.x - 7.5}, ${node.y + 170 + 5}) rotate(0)`
            );
    });
}

export function calculationVisualizer(
    node: any,
    currentWeights: any,
    bias: any,
    normalizedAdjMatrix: any,
    aggregatedDataMap: any[],
    calculatedDataMap: any[],
    svg: any,
    offset: number,
    height: number,
    isClicked: boolean,
    moveOffset: number,
    rectHeight: number
) {
    if (isClicked || aggregatedDataMap == null || calculatedDataMap == null) {
        return;
    }
    showFeature(node);

    let isPlaying: boolean = true;

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

    let xPos = 0;
    let yPos = 0;

    let moveToX = 3.5 * offset - 100;
    let moverToY = height / 5;
    let originalCoordinates = moveFeatures(
        node.relatedNodes,
        moveToX,
        moverToY
    ); //record the original cooridinates for restoring

    if (node.featureGroupLocation) {
        xPos = node.featureGroupLocation.xPos;
        yPos = node.featureGroupLocation.yPos;
    }

    let paths: any = [];
    let intermediateFeatureGroups: any = [];

    const aggregatedData = aggregatedDataMap[node.id];

    const aggregatedFeatureGroup = g3
        .append("g")
        .attr(
            "transform",
            `translate(${
                3.5 * offset + node.relatedNodes[0].features.length * rectHeight
            }, ${height / 5 + 150})`
        );

    aggregatedFeatureGroup
        .selectAll("rect")
        .data(aggregatedData)
        .enter()
        .append("rect")
        .attr("x", (d: any, i: number) => i * rectHeight)
        .attr("y", 0)
        .attr("width", rectHeight)
        .attr("height", 15)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .attr("class", "aggregatedFeatureGroup to-be-removed")
        .style("stroke", "grey")
        .style("opacity", 0);

    
    const aggFrame = aggregatedFeatureGroup.append("rect")
        .attr("class", "aggregatedFeatureGroup to-be-removed")
        .attr("x", 0)  
        .attr("y", 0)
        .attr("width", rectHeight * aggregatedData.length)
        .attr("height", 15)
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
                i * rectHeight +
                node.relatedNodes[0].features.length * rectHeight + rectHeight / 2,
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
            `translate(${
                3.5 * offset +
                node.relatedNodes[0].features.length * 2 * rectHeight +
                30
            }, ${height / 5 + 150})`
        );

    calculatedFeatureGroup
        .selectAll("rect")
        .data(calculatedData)
        .enter()
        .append("rect")
        .attr("x", (d: number, i: number) => i * 3 + 5)
        .attr("y", 0)
        .attr("width", 3)
        .attr("height", 15)
        .attr(
            "class",
            (d: number, i: number) => `calculatedFeatures${i} to-be-removed`
        )
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .style("stroke", "grey")
        .style("opacity", 0);

            
    const calFrame = calculatedFeatureGroup.append("rect")
    .attr("class", "calFrame to-be-removed")
    .attr("x", 0)  
    .attr("y", 0)
    .attr("width", (3 * calculatedData.length + 5))
    .attr("height", 15)
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .style("opacity", 0);

    for (let i = 0; i < 64; i++) {
        let s: [number, number] = [
            node.graphIndex * offset +
                i * 3 +
                node.relatedNodes[0].features.length * 2 * rectHeight +
                30,
            height / 5 + 150 + 25,
        ];
        endCoordList.push(s);
    }

    intermediateFeatureGroups.push(calculatedFeatureGroup);

    const BiasGroup = g3
        .append("g")
        .attr(
            "transform",
            `translate(${
                3.5 * offset +
                node.relatedNodes[0].features.length * 2 * rectHeight +
                30
            }, ${height / 5 + 100})`
        );

    BiasGroup.selectAll("rect")
        .data(biasData)
        .enter()
        .append("rect")
        .attr("class", "bias")
        .attr("x", (d: any, i: number) => i * 3 + 5)
        .attr("y", 0)
        .attr("width", 3)
        .attr("height", 15)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .style("stroke", "grey")
        .style("opacity", 0);

        const BiasFrame = BiasGroup.append("rect")
    .attr("class", "bias to-be-removed")
    .attr("x", 0)  
    .attr("y", 0)
    .attr("width", 3 * biasData.length + 5)
    .attr("height", 15)
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .style("opacity", 0);    

    intermediateFeatureGroups.push(BiasGroup);
    node.intermediateFeatureGroups = intermediateFeatureGroups;

    end_x = 3.5 * offset + node.relatedNodes[0].features.length * rectHeight;
    end_y = height / 5 + 150 + 7.5;

    let adjMatrixSlice: number[] = [];
    for (let i = 0; i < normalizedAdjMatrix[node.id].length; i++) {
        if (normalizedAdjMatrix[node.id][i] != 0) {
            adjMatrixSlice.push(normalizedAdjMatrix[node.id][i].toFixed(2));
        }
    }

    setTimeout(() => {
        d3.selectAll(".calFrame").style("opacity", 1);
        weightAnimation(
            svg,
            node,
            startCoordList,
            endCoordList,
            currentWeights,
            offset,
            height,
            moveOffset
        );
        if (node.relatedNodes) {
            node.relatedNodes.forEach((n: any, i: number) => {
                if (n.featureGroupLocation) {
                    start_x =
                        3.5 * offset - 70 + n.features.length * rectHeight;
                    start_y = height / 5 + 90 + 50 * i;
                    if (node.graphIndex === 1) {
                        start_x -= 60;
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
                        .attr("class", "parameter")
                        .attr("opacity", 1);

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
                        .style("opacity", 0);

                    d3.selectAll(".origin-to-aggregated").style("opacity", 1);

                    paths.push(originToAggregated);
                }
            });

            let color;
            start_x =
                3.5 * offset +
                node.relatedNodes[0].features.length * rectHeight * 2 +
                node.features.length * 3 +
                35;
            start_y = height / 5 + 150 + 7.5;
            end_x =
                3.5 * offset +
                node.relatedNodes[0].features.length * rectHeight * 2 +
                node.features.length * 3 +
                100; // the horizontal distance is offset(600) + moveoffset(300)
            end_y = height / 5 + 150 + 7.5;

            color = calculateAverage(node.features); // to be determined

            const aggregatedToFinal = g3
                .append("path")
                .attr("d", `M${start_x},${start_y} ${end_x},${end_y}`)
                .style("stroke", pathColor(color))
                .style("stroke-width", 1)
                .style("fill", "none")
                .attr("class", "relu to-be-removed")
                .attr("opacity", 0);

            paths.push(aggregatedToFinal);

            start_x =
                3.5 * offset +
                node.relatedNodes[0].features.length * 2 * rectHeight +
                node.features.length * 3 +
                35;
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
                    `M${start_x},${start_y} C ${control1_x} ${control1_y}, ${control2_x} ${control2_y} ${
                        end_x - 30
                    },${end_y}`
                )
                .style("stroke", pathColor(color))
                .style("opacity", 0.7)
                .style("stroke-width", 1)
                .style("fill", "none")
                .attr("class", "bias to-be-removed")
                .style("opacity", 0);

            paths.push(biasToFinal);
            node.intermediatePaths = paths;
        }

        // relu

        const relu = g3.append("g");

        d3.xml("./assets/SVGs/ReLU.svg").then(function (data) {
          console.log("xml", data.documentElement);
          if(relu.node()!=null){
          const ReLU = relu!.node()!.appendChild(data.documentElement);
          d3.select(ReLU)
              .attr("x", end_x - 45)
              .attr("y", end_y - 15)
              .attr("class", "relu to-be-removed")
              .attr("opacity", 0)
              .raise();
          }
      });

    }, 3500);

    const outputGroup = g3
        .append("g")
        .attr(
            "transform",
            `translate(${
                3.5 * offset +
                node.relatedNodes[0].features.length * 2 * rectHeight +
                node.features.length * 3 +
                95
            }, ${height / 5 + 150})`
        );

    outputGroup
        .selectAll("rect")
        .data(node.features)
        .enter()
        .append("rect")
        .attr("class", "relu output")
        .attr("x", (d: any, i: number) => i * 3+ 5)
        .attr("y", 0)
        .attr("width", 3)
        .attr("height", 15)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .style("stroke", "grey")
        .attr("opacity", 0);


    const outputFrame = outputGroup.append("rect")
        .attr("x", 0)  
        .attr("y", 0)
        .attr("class", "relu output")
        .attr("width", 3 * node.features.length + 5)
        .attr("height", 15)
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-width", 1)
        .style("opacity", 0);

    const outputGroupCopy = g3
        .append("g")
        .attr(
            "transform",
            `translate(${
                3.5 * offset +
                node.relatedNodes[0].features.length * 2 * rectHeight +
                node.features.length * 3 +
                95
            }, ${height / 5 + 150})`
        );

    outputGroupCopy
        .selectAll("rect")
        .data(node.features)
        .enter()
        .append("rect")
        .attr("class", "relu")
        .attr("x", (d: any, i: number) => i * 3 + 5)
        .attr("y", 0)
        .attr("width", 3)
        .attr("height", 15)
        .style("fill", (d: number) => myColor(d))
        .style("stroke-width", 0.1)
        .style("stroke", "grey")
        .attr("opacity", 0);    



    const outputFrameCopy = outputGroupCopy.append("rect")
    .attr("x", 0)  
    .attr("y", 0)
    .attr("class", "relu")
    .attr("width", 3 * node.features.length + 5)
    .attr("height", 15)
    .style("fill", "none")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .style("opacity", 0);

    intermediateFeatureGroups.push(outputGroup);
    node.intermediateFeatureGroups = intermediateFeatureGroups;

    document.addEventListener("click", () => {
        moveFeaturesBack(node.relatedNodes, originalCoordinates);
        d3.selectAll(".to-be-removed").remove();
        
    });
}

export function moveNextLayer(
    svg: any,
    node: any,
    moveOffset: number,
    indicator: number
) {
    if (!svg.selectAll) {
        svg = d3.select(svg);
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
    node: any,startCoordList: number[][],
    endCoordList: number[][],
    weights: any,
    offset: number,
    height: number,
    moveOffset: number
) {
    
    let i = 0;
    let intervalID: any;
    let isPlaying = true;
    let isAnimating = true;
    let endNumber = 64;
    if (node.graphIndex === 5) {
        endNumber = 2;
    }
    let rectHeight = 3;
    if (node.graphIndex === 1) {
        rectHeight = 10;
    }
    let translateOffset = 0;
    if (node.graphIndex === 1) {
        translateOffset = 140;
    }

    if (!svg.selectAll) {
        svg = d3.select(svg);
    }

    // Pause and replay button
    const btn = svg.append("g").attr("class", "button-group");

    injectPlayButtonSVGForGraphView(btn, endCoordList[0][0] - 100, node.y - 100, "./assets/SVGs/playBtn_pause.svg")

    btn.on("click", function (event: any) {
        event.stopPropagation();
        isPlaying = !isPlaying;
        console.log(isPlaying);
        if(isPlaying)injectPlayButtonSVGForGraphView(btn, endCoordList[0][0] - 100, node.y - 100, "./assets/SVGs/playBtn_pause.svg");
        else injectPlayButtonSVGForGraphView(btn, endCoordList[0][0] - 100, node.y - 100, "./assets/SVGs/playBtn_play.svg")
        if (isPlaying) {
            startAnimation(endNumber);
        } else {
            clearInterval(intervalID);
        }
    });

    const math = create(all, {});
    const Xt = math.transpose(weights);

    document.addEventListener("click", () => {
        isAnimating = false;
        state.isClicked = false;
        d3.selectAll(".bias").remove();
        d3.selectAll(".vis-component").remove();
        d3.selectAll(".relu").remove();
        d3.selectAll(".intermediate-path").remove();
        d3.selectAll(".parameter").remove();
        d3.selectAll(".to-be-removed").remove();
    });

    function startAnimation(endNumber: number) {
        if (i >= endNumber) {
            i = 0; // Reset the index to replay the animation
        }
        intervalID = setInterval(() => {
            d3.selectAll(`.calculatedFeatures${i}`).style("opacity", 1);
            d3.selectAll(`#tempath${i - 1}`).attr("opacity", 0);

            if (isAnimating) {
                GraphViewDrawPaths(
                    Xt,
                    myColor,
                    i,
                    startCoordList,
                    endCoordList,
                    svg,
                    isAnimating,
                    btn,
                    node
                );
 
                i++;
                if (i >= endNumber) {
                    clearInterval(intervalID);
                    isPlaying = false;
                    d3.selectAll(`#tempath${i - 1}`).remove();
                    injectPlayButtonSVGForGraphView(btn, endCoordList[0][0] - 100, node.y - 100, "./assets/SVGs/playBtn_play.svg")
                    setTimeout(() => {
                        d3.selectAll(".bias").style("opacity", 1);
                        d3.selectAll(".softmax").attr("opacity", 0.07);
                        d3.selectAll(".relu").attr("opacity", 1);
                        d3.selectAll(".output-path").attr("opacity", 1);
                        d3.selectAll(".output")
                            .transition()
                            .delay(2000)
                            .duration(1000)
                            .attr("opacity", 1)
                            .attr(
                                "transform",
                                `translate(${
                                    node.featureGroupLocation.xPos -
                                    2.5 * offset +
                                    (moveOffset -
                                        node.features.length * 3 -
                                        node.relatedNodes[0].features.length *
                                            2 *
                                            rectHeight) -
                                    100 +
                                    12.5 -
                                    translateOffset
                                }, ${
                                    node.featureGroupLocation.yPos -
                                    height / 5 -
                                    150 -
                                    node.features.length * 3
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
    btn:any,
    node:any
) {
    if (!svg.selectAll) {
        svg = d3.select(svg);
    }
    const Wi = Xt[i];
    for (let j = 0; j < 64; j++) {
        let s = startCoordList[63 - j];
        let e = endCoordList[i];
        console.log("S", s);
        console.log("E", e);

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
            .attr("stroke", myColor(Wi[63 - j]))
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
                .delay(2000)
                .duration(1000)
                .attr(
                    "transform",
                    `translate(${xPos + 27.5}, ${
                        yPos + i * 45 + 100
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

        if (n.graphIndex <= 3) {
            n.featureGroup
                .transition()
                .duration(1000)
                .attr(
                    "transform",
                    `translate(${xPos - 7.5}, ${
                        yPos + 5 - n.features.length * 3 - 4.5
                    }) rotate(0)`
                );
        } else {
            n.featureGroup
                .transition()
                .duration(1000)
                .attr(
                    "transform",
                    `translate(${xPos - 7.5}, ${
                        yPos + 200 - n.features.length * 3 - 4.5
                    }) rotate(0)`
                );
        }
    });
}

export function fcLayerCalculationVisualizer(
    node: any,
    relatedNodes: any,
    offset: number,
    height: number,
    moveOffset: number,
    graphIndex: number,
    svg: any,
    state: State
) {

    d3.selectAll(".node-features-Copy").style("visibility", "visible");
    d3.selectAll(".node-features-Copy").raise();
    let moveToX = graphIndex * offset - 350;
    let moveToY = height / 7;
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
            state
        );
        node.relatedNodes.forEach((n: any, i: number) => {
            let start_x = 0;
            let start_y = 0;
            let end_x = moveToX - 900 + 15 + node.relatedNodes[0].features.length * 3;
            let end_y = moveToY + 150;
                start_x =
                    3.5 * offset + n.features.length * 3 - offset - moveOffset + 135;
                start_y = height / 7 + 100 + 45 * i - 7.5;
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


    document.addEventListener("click", function () {
        console.log("document clicked");
        d3.selectAll(".origin-to-aggregated").remove();

        d3.selectAll(".node-features-Copy").style("visibility", "hidden");

        moveFeaturesBack(relatedNodes, originalCoordinates);
        node.featureGroup
            .transition()
            .duration(1000)
            .attr(
                "transform",
                `translate(${xPos - 300 - 15 / 2}, ${yPos}) rotate(0)`
            );
        d3.selectAll("rect").style("opacity", 1);
        d3.select(".graph-displayer").remove();
        state.isClicked = false;
    });
}

function poolingLayerInteraction(
    node: any,
    svg: any,
    numRect: number[][],
    rectL: number,
    posNeed: number[][],
    posPlus: number[][],
    state: State
) {
    if (!svg.selectAll) {
        svg = d3.select(svg);
    }

    for (let i = 0; i < node.features.length; i++) {
        d3.select(`#pooling-layer-rect-${i}`)
            .on("mouseover", function () {
                if (!state.isClicked) {
                    return;
                }
                d3.selectAll(".node-features").style("opacity", 0.3);
                d3.select(`#pooling-layer-rect-${i}`).style("opacity", 1);
                d3.selectAll(`#conv3-layer-rect-${i}`).style("opacity", 1);
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
                d3.selectAll(".math-displayer").remove();
                d3.select(".graph-displayer").attr("opacity", 0);
            });
    }
}
