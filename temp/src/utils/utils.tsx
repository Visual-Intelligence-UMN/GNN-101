// UTILS FILE BECAUSE WE HAVE SO MANY HELPER FUNCTIONS
import * as d3 from "d3";
import * as ort from "onnxruntime-web";
import { env } from "onnxruntime-web";

env.wasm.wasmPaths = {
    "ort-wasm-simd.wasm": "./ort-wasm-simd.wasm",
};

//direct get coordinates - you can use this function to get the coordination of a specific element in the SVG
export function get_coordination(element: any) {
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
    const adjustedY = cy + translate[1] - 10;
    return [adjustedX, adjustedY];
}

//get coordinates for type child in the parent node parent
export function get_cood_from_parent(
    parent: string,
    child: string
): number[][] {
    let res: number[][] = [];
    const mainNode = d3.select(parent);
    mainNode.selectAll(child).each(function () {
        const children = d3.select(this as SVGGraphicsElement);
        const r = get_coordination(children.node());
        res.push(r);
    });
    console.log("COOD", res);
    return res;
}

//print text coordinates in MatricesVisualizer
export function printAxisTextCoordinates(): void {
    d3.selectAll<SVGTextElement, any>(".x-axis text").each(function () {
        const bbox = this.getBBox();
        console.log(
            `X Axis Text: [x: ${bbox.x}, y: ${bbox.y}, width: ${bbox.width}, height: ${bbox.height}]`
        );
    });

    d3.selectAll<SVGTextElement, any>(".y-axis text").each(function () {
        const bbox = this.getBBox();
        console.log(
            `Y Axis Text: [x: ${bbox.x}, y: ${bbox.y}, width: ${bbox.width}, height: ${bbox.height}]`
        );
    });
}

//Split a large 1d array into a 1d array with multiple 8*8 matrices
type Matrix = number[][];

export function splitIntoMatrices(
    array: number[],
    matrixSize: number = 8
): Matrix[] {
    const matrices: Matrix[] = [];
    const totalElementsInMatrix = matrixSize * matrixSize;

    if (array.length % totalElementsInMatrix !== 0) {
        throw new Error(
            "Array length is not a multiple of the total elements in a matrix."
        );
    }

    for (let i = 0; i < array.length; i += totalElementsInMatrix) {
        const matrix: Matrix = [];

        for (let row = 0; row < matrixSize; row++) {
            const start = i + row * matrixSize;
            const end = start + matrixSize;
            matrix.push(array.slice(start, end));
        }

        matrices.push(matrix);
    }
    console.log(matrices);

    return matrices;
}

//get the category of node features in the original input graph
export function get_category_node(data: number[]) {
    for (let i = 0; i < data.length; i++) {
        if (data[i] == 1) {
            return i;
        }
    }
    return 0;
}

//get the features from a JSON structure
export async function get_features_origin(data: any) {
    return data.x;
}

//get axis from gData
export function get_axis_gdata(data: number[][]) {
    let res: string[];
    res = [];
    for (let i = 0; i < data.length; i++) {
        res.push(i.toString());
    }
    return res;
}

//write a function to convert gData to heatmap data
export function matrix_to_hmap(data: number[][]) {
    let res: any[];
    res = [];
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[0].length; j++) {
            let d = {
                group: i.toString(),
                variable: j.toString(),
                value: data[i][j], // 将字符串转换为数字
            };
            if (data[i][j] === 1) {
                d.value = 56;
            }
            res.push(d);
        }
    }
    return res;
}

//input a JSON file and transform it into a matrix representation of graph
export async function graph_to_matrix(data: any) {
    //get the number of nodes
    const nodeCount = data.x.length;
    //tranformation process
    let matrix: number[][];
    matrix = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(0));
    for (let i = 0; i < data.edge_index[0].length; i++) {
        let source = data.edge_index[0][i];
        let target = data.edge_index[1][i];
        console.log("target:", target, "source:", source, "iter:", i);
        matrix[source][target] = 1;
    }
    console.log("matrix representation", matrix);
    return matrix;
}

//prepare for matrices data to visualize
export async function prepMatrices(n: number, mat: number[][]) {
    let matrices = [];
    for (let i = 0; i < n; i++) {
        matrices.push(mat);
    }
    //push a 8*8 matrix
    if (matrices.length > 1) {
        const array1: number[][] = Array(8)
            .fill(null)
            .map(() => Array(8).fill(0));
        matrices.push(array1);
    }
    return matrices;
}

export const load_json = async (path: string) => {
    try {
        console.log("entered load_json");
        const response = await fetch(path);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(
            "There has been a problem with your fetch operation:",
            error
        );
    }
};
// data_prep
export async function data_prep(o_data: any) {
    // Painful explicit typing because we are using Typescript
    type NodeType = {
        id: number;
        name: number;
        features: any;
    };
    type LinkType = {
        source: number;
        target: number;
    };

    let final_data = {
        nodes: [] as NodeType[],
        links: [] as LinkType[],
    };

    try {
        var data = await load_json(o_data);
        var nodes = data.x;
        var edges = data.edge_index;

        for (var i = 0; i < nodes.length; i++) {
            var new_node = {
                id: i,
                name: i,
                features: nodes[i],
            };
            final_data.nodes.push(new_node);
        }
        for (var i = 0; i < edges[0].length; i++) {
            var new_relation = {
                source: edges[0][i],
                target: edges[1][i],
            };
            final_data.links.push(new_relation);
        }

        return final_data;
    } catch (error) {
        console.error("There has been an error in data_prep:", error);
    }
} // end of data_prep
// prep_graphs
export async function prep_graphs(g_num: number, data: any) {
    var graphs = [];
    for (var i = 0; i < g_num; i++) {
        let graphData = {
            nodes: deepClone(data.nodes),
            links: deepClone(data.links),
        };
        graphs.push(graphData);
    }
    return graphs;
}

export function featureVisualizer(svg: any, nodes: any[], offset: number) {
    const nodesById = d3.group(nodes, (d: any) => d.id);

    nodesById.forEach((nodes, id) => {
        nodes.forEach((node: any, i: number) => {
            const features = node.features;
            //console.log("features VIS", features.length);
            const lines = [];
            if (features != null && features.length > 7) {
                for (let j = 0; j < features.length; j += 8) {
                    lines.push(features.slice(j, j + 8).join(" "));
                }
            } else {
                lines.push(features);
            }
            const tooltipText = lines.join("<br>");

            const tooltip = svg
                .append("foreignObject")
                .attr("x", (i - 1) * offset + node.x + 100)
                .attr("y", node.y - 100)
                .attr("width", 700)
                .attr("height", 500)
                .style("visibility", "hidden")
                .append("xhtml:div")
                .style("font-size", "14px")
                .style("background", "rgba(255, 255, 255, 0.8)")
                .style("border", "1px solid #ccc")
                .style("padding", "5px")
                .style("border-radius", "3px")
                .html(tooltipText);

            node.tooltip = tooltip;
            node.svgElement
                .on("mouseover", function () {
                    node.tooltip.style("visibility", "visible");
                    node.links.forEach((link: any) => {
                        link.style("stroke-width", 4).style("opacity", 1);
                    });
                })
                .on("mouseout", function () {
                    node.tooltip.style("visibility", "hidden");
                    node.links.forEach((link: any) => {
                        link.style("stroke-width", 1).style("opacity", 0.1);
                    });
                });
        });
    });
}

export function connectCrossGraphNodes(
    nodes: any,
    svg: any,
    graphs: any[],
    offset: number,
    height: number
) {
    const nodesById = d3.group(nodes, (d: any) => d.id);
    let upperIndex = 0;
    let lowerIndex = 0;
    let upperIndexBlue = 0;
    let lowerIndexBlue = 0;

    nodesById.forEach((nodes, id) => {
        nodes.forEach((node: any, i) => {
            if (!node.links) {
                node.links = [];
            }

            if (i < nodes.length - 1) {
                const nextNode = nodes[i + 1];
                if (nextNode[0] != null && nextNode[0].graphIndex == 3) {
                    return;
                }
                const xOffset1 = (node.graphIndex - 1) * offset;
                const xOffset2 = (nextNode.graphIndex - 1) * offset;

                if (!nextNode.links) {
                    nextNode.links = [];
                }

                const controlX =
                    (node.x + xOffset1 + nextNode.x + xOffset2) / 2;
                let controlY;

                if ((node.y + 10 + nextNode.y + 10) / 2 < height / 2) {
                    controlY =
                        Math.min(node.y + 10, nextNode.y + 10) -
                        50 -
                        upperIndex * 10;
                    upperIndex++;
                } else {
                    controlY =
                        Math.max(node.y + 10, nextNode.y + 10) +
                        50 +
                        lowerIndex * 10;
                    lowerIndex++;
                }

                const path = svg
                    .append("path")
                    .attr(
                        "d",
                        `M ${node.x + xOffset1} ${
                            node.y + 10
                        } Q ${controlX} ${controlY} ${nextNode.x + xOffset2} ${
                            nextNode.y + 10
                        }`
                    )
                    .style("stroke", "red")
                    .style("opacity", 0.1)
                    .style("stroke-width", 1)
                    .style("fill", "none");

                node.links.push(path);
                nextNode.links.push(path);

                let drawnLinks = new Set();

                const nextGraphLinks = graphs[nextNode.graphIndex].links;

                nextGraphLinks.forEach((link: any) => {
                    const sortedIds = [link.source.id, link.target.id].sort();
                    const linkId = sortedIds.join("-");

                    if (
                        (link.source.id === nextNode.id ||
                            link.target.id === nextNode.id) &&
                        !drawnLinks.has(linkId)
                    ) {
                        drawnLinks.add(linkId);

                        const neighborNode =
                            link.source.id === nextNode.id
                                ? link.target
                                : link.source;
                        if (!neighborNode.links) {
                            neighborNode.links = [];
                        }
                        const neighborControlX =
                            (node.x + xOffset1 + neighborNode.x + xOffset2) / 2;
                        let neighborControlY;

                        if (
                            (node.y + 10 + neighborNode.y + 10) / 2 <
                            height / 2
                        ) {
                            neighborControlY =
                                (node.y + 10 + neighborNode.y + 10) / 2 -
                                30 -
                                upperIndexBlue * 10;
                            upperIndexBlue++;
                        } else {
                            neighborControlY =
                                (node.y + 10 + neighborNode.y + 10) / 2 +
                                30 +
                                lowerIndexBlue * 10;
                            lowerIndexBlue++;
                        }

                        const path = svg
                            .append("path")
                            .attr(
                                "d",
                                `M ${node.x + xOffset1} ${
                                    node.y + 10
                                } Q ${neighborControlX} ${neighborControlY} ${
                                    neighborNode.x +
                                    (neighborNode.graphIndex - 1) * offset
                                } ${neighborNode.y + 10}`
                            )
                            .style("stroke", "blue")
                            .style("opacity", 0.1)
                            .style("stroke-width", 1)
                            .style("fill", "none");

                        node.links.push(path);
                        neighborNode.links.push(path);
                    }
                });

                node.svgElement = svg
                    .append("circle")
                    .attr("cx", node.x + xOffset1)
                    .attr("cy", node.y + 10)
                    .attr("r", 10)
                    .style("fill", "#69b3a2");

                node.svgElement
                    .on("mouseover", function () {
                        node.links.forEach((link: any) => {
                            link.style("stroke-width", 4).style("opacity", 1);
                        });
                    })
                    .on("mouseout", function () {
                        node.links.forEach((link: any) => {
                            link.style("stroke-width", 1).style("opacity", 0.1);
                        });
                    });
            } else {
                const xOffset1 = (node.graphIndex - 1) * offset;
                const lastLayer = graphs[3];
                const lastLayerNodes = lastLayer.nodes;
                lastLayerNodes.forEach((lastNode: any) => {
                    const xOffset2 = (lastNode.graphIndex - 1) * offset;

                    if (!lastNode.links) {
                        lastNode.links = [];
                    }

                    const path = svg
                        .append("path")
                        .attr(
                            "d",
                            `M ${node.x + xOffset1} ${node.y + 10} L ${
                                lastNode.x + xOffset2
                            } ${lastNode.y + 10}`
                        )
                        .style("stroke", "red")
                        .style("opacity", 0.1)
                        .style("stroke-width", 1)
                        .style("fill", "none");

                    node.links.push(path);
                    lastNode.links.push(path);
                });

                node.svgElement = svg
                    .append("circle")
                    .attr("cx", node.x + (i - 1) * offset)
                    .attr("cy", node.y + 10)
                    .attr("r", 10)
                    .style("fill", "#69b3a2");

                node.svgElement
                    .on("mouseover", function () {
                        node.links.forEach((link: any) => {
                            link.style("stroke-width", 4).style("opacity", 1);
                        });
                    })
                    .on("mouseout", function () {
                        node.links.forEach((link: any) => {
                            link.style("stroke-width", 1).style("opacity", 0.1);
                        });
                    });
            }
        });
    });
}

// helper helper function
function deepClone(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export async function process() {
    var data = await data_prep("./input_graph.json");
    console.log(data);
    return data;
}

export async function loadModel() {
    //await session.loadModel("gnn_model.onnx");
    let session: any;
    try {
        session = await ort.InferenceSession.create("./gnn_model.onnx", {
            executionProviders: ["wasm"],
        });
        console.log("Model loaded successfully");
    } catch (error) {
        console.log("Load model failed", error);
    }
    return session;
}

export function softmax(logits: number[]) {
    // Find the maximum logit to improve numerical stability.
    const maxLogit = Math.max(...logits);

    // Compute the exponential of each logit, adjusted by the max logit for numerical stability.
    const expLogits = logits.map((logit) => Math.exp(logit - maxLogit));

    // Compute the sum of the exponentials.
    const sumExpLogits = expLogits.reduce((acc, val) => acc + val, 0);

    // Divide each exponential by the sum of exponentials to get the probabilities.
    const probabilities = expLogits.map((expLogit) => expLogit / sumExpLogits);

    return probabilities;
}

export function analyzeGraph(graphData: any) {
    const nodeCount = graphData.x.length;
    const edgePairs = graphData.edge_index;
    const edges = edgePairs[0].length;
    const degreeMap = new Array(nodeCount).fill(0);
    const hasLoop = new Set();
    let isDirected = false;

    for (let i = 0; i < edges; i++) {
        const source = edgePairs[0][i];
        const target = edgePairs[1][i];

        degreeMap[source]++;
        degreeMap[target]++;

        if (source === target) {
            hasLoop.add(source);
        }

        if (
            (!isDirected && !edgePairs[1].includes(source)) ||
            !edgePairs[0].includes(target)
        ) {
            isDirected = true;
        }
    }

    const totalDegree = degreeMap.reduce((acc, degree) => acc + degree, 0);
    const averageDegree = totalDegree / nodeCount;

    const hasIsolatedNode = degreeMap.some((degree) => degree === 0);

    console.log(`Node Count: ${nodeCount}`);
    console.log(`Edge Count: ${edges}`);
    console.log(`Average Node Degree: ${averageDegree}`);
    console.log(`Has Isolated Node: ${hasIsolatedNode}`);
    console.log(`Has Loop: ${hasLoop.size > 0}`);
    console.log(`Is Directed: ${isDirected}`);

    return {
        node_count: nodeCount,
        edge_count: edges,
        avg_node_degree: averageDegree,
        has_isolated_node: hasIsolatedNode,
        has_loop: hasLoop.size > 0,
        is_directed: isDirected,
    };
}
