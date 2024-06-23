import { deepClone, drawPoints, softmax } from "./utils";
import { addLayerName, buildBinaryLegend, buildLegend } from "./matHelperUtils";
import * as d3 from "d3";

//draw cross connections between feature visualizers
export function drawCrossConnection(
    graph: any,
    locations: any,
    firstVisSize: number,
    gapSize: number,
    layerID: number
) {
    console.log("layerID", layerID);
    let alocations = deepClone(locations);
    for (let i = 0; i < alocations.length; i++) {
        alocations[i][0] += firstVisSize;
        alocations[i][1] += 5;
    }
    let blocations = deepClone(alocations);
    for (let i = 0; i < blocations.length; i++) {
        blocations[i][0] += gapSize;
    }
    console.log("location length", alocations.length);
    //draw one-one paths
    for (let i = 0; i < alocations.length; i++) {
        d3.select(".mats")
            .append("path")
            .attr("d", d3.line()([alocations[i], blocations[i]]))
            .attr("stroke", "black")
            .attr("opacity", 0.05)
            .attr("fill", "none")
            .attr("endingNode", i)
            .attr("layerID", layerID);
    }
    //draw one-multiple paths - three
    let pts: number[][] = [];
    const curve = d3.line().curve(d3.curveBasis);
    for (let i = 0; i < graph.length; i++) {
        for (let j = 0; j < graph[0].length; j++) {
            if (graph[i][j] == 1) {
                const res = computeMids(alocations[i], blocations[j]);
                const hpoint = res[0];
                const lpoint = res[1];
                console.log("control points", hpoint, lpoint);
                d3.select(".mats")
                    .append("path")
                    .attr(
                        "d",
                        curve([alocations[i], hpoint, lpoint, blocations[j]])
                    )
                    .attr("stroke", "black")
                    .attr("opacity", 0.05)
                    .attr("fill", "none")
                    .attr("endingNode", j)
                    .attr("layerID", layerID);
                pts.push(hpoint);
                pts.push(lpoint);
                console.log(
                    "odata",
                    alocations[i],
                    blocations[i],
                    "low",
                    lpoint,
                    "high",
                    hpoint
                );
            }
        }
    }
    //drawPoints(".mats", "red", pts);

    d3.selectAll("path").lower();

    //group all path elements by LayerID and Ending Node
    interface GroupedPaths {
        [layerID: string]: {
            [endingNode: string]: SVGPathElement[];
        };
    }
    const paths = d3.selectAll<SVGPathElement, any>("path");

    const groupedPaths: GroupedPaths = paths
        .nodes()
        .reduce((acc: GroupedPaths, path: SVGPathElement) => {
            const layerID: string = path.getAttribute("layerID") || ""; // 确保 layerID 和 endingNode 不是 null
            const endingNode: string = path.getAttribute("endingNode") || "";

            if (!acc[layerID]) {
                acc[layerID] = {};
            }

            if (!acc[layerID][endingNode]) {
                acc[layerID][endingNode] = [];
            }

            acc[layerID][endingNode].push(path);

            return acc;
        }, {});
    console.log("groupedPath", groupedPaths);
    return groupedPaths;
}

//compute mid point for basis curve drawing
export function computeMids(point1: any, point2: any) {
    //find mid - x
    const midX = (point1[0] + point2[0]) / 2;
    const res = [
        [midX - 20, point1[1]],
        [midX + 20, point2[1]],
    ];
    console.log("res", res);
    return res;
}

//draw aid utils for matrix visualization(column and row frames)
export function drawMatrixPreparation(graph: any, locations: any) {
    let colLocations = [];
    for (let i = 0; i < graph.length; i++) {
        const x =
            locations[0][0] - (300 / graph.length) * i - 300 / graph.length / 2;
        const y = locations[0][1];
        colLocations.push([x, y]);
    }
    //drawPoints(".mats", "red", colLocations);
    let colFrames: SVGElement[] = []; //a
    for (let i = 0; i < colLocations.length; i++) {
        const r = d3
            .select(".mats")
            .append("rect")
            .attr("x", colLocations[i][0])
            .attr("y", colLocations[i][1])
            .attr("height", 300)
            .attr("width", 300 / graph.length)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("class", "colFrame");

        colFrames.push(r.node() as SVGElement);
    }
    colFrames.reverse();
    //draw frames on matrix
    let matFrames: SVGElement[] = []; //a
    let w = locations[1][1] - locations[0][1];
    console.log("rect w", w);
    for (let i = 0; i < locations.length; i++) {
        const r = d3
            .select(".mats")
            .append("rect")
            .attr("x", locations[i][0] - 300 + 300 / graph.length / 2)
            .attr("y", locations[i][1]-2)
            .attr("height", 300 / graph.length)
            .attr("width", 300)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("class", "rowFrame");

        matFrames.push(r.node() as SVGElement);
    }
    console.log("frame locations", locations)
    console.log("matFrames", matFrames);
    return { colFrames: colFrames, matFrames: matFrames };
}

//draw data original feature
export function drawNodeFeatures(
    locations: any,
    graph: any,
    myColor: any,
    features: any,
    frames: any,
    schemeLocations: any,
    featureVisTable: any
) {
    //drawPoints(".mats", "red", locations);
    //initial visualizer
    for (let i = 0; i < locations.length; i++) {
        locations[i][0] += 25;
        locations[i][1] += 2;
    }
    
    //draw cross connections for features layer and first GCNConv layer
    drawCrossConnection(graph, locations, 35, 102, 0);

    //using locations to find the positions for first feature visualizers
    const firstLayer = d3.select(".mats").append("g").attr("id", "layerNum_0");
    for (let i = 0; i < locations.length; i++) {
        const g = firstLayer
            .append("g")
            .attr("class", "oFeature")
            .attr("node", i)
            .attr("layerID", 0);

        for (let j = 0; j < 7; j++) {
            const fVis = g
                .append("rect")
                .attr("x", locations[i][0] + 5 * j)
                .attr("y", locations[i][1])
                .attr("width", 5)
                .attr("height", 10)
                .attr("fill", myColor(features[i][j]))
                .attr("opacity", 1)
                .attr("stroke", "gray")
                .attr("stroke-width", 0.1);
        }
        //draw frame
        const f = g
            .append("rect")
            .attr("x", locations[i][0])
            .attr("y", locations[i][1])
            .attr("width", 5 * 7)
            .attr("height", 10)
            .attr("fill", "none")
            .attr("opacity", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("node", i)
            .attr("layerID", 0)
            .attr("class", "frame");
        frames["features"].push(f.node());

        //find last location
        if (i == locations.length - 1)
            schemeLocations.push([locations[i][0], 350]);

        //push feature visualizer into the table
        featureVisTable[0].push(g.node() as SVGElement);
    }
    //drawPoints(".mats", "red", schemeLocations);
    //add layer label for the first one

    addLayerName(locations, "Graph Features", 0, 30, firstLayer);
    return {
        locations: locations,
        frames: frames,
        schemeLocations: schemeLocations,
        featureVisTable: featureVisTable,
        firstLayer: firstLayer,
    };
}

//draw intermediate features from GCNConv process
export function drawGCNConv(
    conv1: any,
    conv2: any,
    conv3: any,
    locations: any,
    myColor: any,
    frames: any,
    schemeLocations: any,
    featureVisTable: any,
    pooling: any,
    graph: any,
    colorSchemesTable: any,
    poolingVis: any,
    outputVis: any,
    final: any,
    firstLayer: any,
    maxVals: any
) {
    //drawPoints(".mats", "red", locations);
    //GCNCov Visualizer
    let one = null;
    let paths: any;
    let resultVis = null;
    const gcnFeatures = [conv1, conv2, conv3];
    console.log("gcnf", gcnFeatures);
    console.log("CONV1", conv1);
    for (let k = 0; k < 3; k++) {
        const layer = d3
            .select(".mats")
            .append("g")
            .attr("class", "layerVis")
            .attr("id", `layerNum_${k + 1}`);
        for (let i = 0; i < locations.length; i++) {
            if (k != 0) {
                locations[i][0] += 2 * 64 + 100;
            } else {
                locations[i][0] += 7 * 2 + 100 + 25;
            }
        }

        addLayerName(
            locations,
            "GCNConv" + (k + 1),
            0,
            30,
            d3.select(`g#layerNum_${k + 1}`)
        );
        //drawPoints(".mats","red",locations);
        const gcnFeature = gcnFeatures[k];
        for (let i = 0; i < locations.length; i++) {
            //const cate = get_category_node(features[i]) * 100;
            const g = layer
                .append("g")
                .attr("class", "featureVis")
                .attr("node", i)
                .attr("layerID", k + 1);

            console.log("new", gcnFeature);

            //loop through each node
            let nodeMat = gcnFeature[i];
            console.log("nodeMat", i, nodeMat);
            for (let m = 0; m < nodeMat.length; m++) {
                g.append("rect")
                    .attr("x", locations[i][0] + 2 * m)
                    .attr("y", locations[i][1])
                    .attr("width", 2)
                    .attr("height", 10)
                    .attr("fill", myColor(nodeMat[m]))
                    .attr("opacity", 1)
                    .attr("stroke", "gray")
                    .attr("stroke-width", 0.1);
            }
            //draw frame
            const f = g
                .append("rect")
                .attr("x", locations[i][0])
                .attr("y", locations[i][1])
                .attr("width", 2 * 64)
                .attr("height", 10)
                .attr("fill", "none")
                .attr("opacity", 0)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("node", i)
                .attr("layerID", k + 1)
                .attr("class", "frame");
            //havent figure out how to optimize this code..
            if (k == 0) frames["GCNConv1"].push(f.node());
            if (k == 1) frames["GCNConv2"].push(f.node());
            if (k == 2) frames["GCNConv3"].push(f.node());
            //drawPoints(".mats", "red", locations);
            if (i == locations.length - 1) {
                schemeLocations.push([locations[i][0], 350]);
            }

            featureVisTable[k + 1].push(g.node() as SVGElement);
        }
        console.log("FVT", featureVisTable);
        if (k != 2) {
            // visualize cross connections btw 1st, 2nd, 3rd GCNConv
            paths = drawCrossConnection(graph, locations, 62 * 2, 102, k + 1);
            console.log("grouped grouped", paths);
        } else {
            //visualize pooling layer
            const poolingPack = drawPoolingVis(
                locations,
                pooling,
                myColor,
                frames,
                colorSchemesTable
            );
            one = poolingPack["one"];
            poolingVis = poolingPack["g"];
            console.log("poolingVis", poolingVis);
            console.log("ONE", one);
            schemeLocations.push([one[0][0], 350]);
            //visualize last layer and softmax output
            const tlPack = drawTwoLayers(one, final, myColor);
            let aOne = tlPack["locations"];
            outputVis = tlPack["g"];
            resultVis = tlPack["g1"];
            console.log("AAA", aOne);
            if (aOne != undefined) {
                schemeLocations.push([aOne[0][0], 350]);
            }
            schemeLocations.push([aOne[1][0] - 20, 350]);
        }
        console.log("schemeLocations", schemeLocations);
        //drawPoints(".mats", "red", schemeLocations);
        //let max1 = findAbsMax(maxVals.conv1);
        let result = softmax(final);
        console.log("debug", schemeLocations);

        //select layers
        const l1 = d3.select(`g#layerNum_1`);
        const l2 = d3.select(`g#layerNum_2`);
        const l3 = d3.select(`g#layerNum_3`);
        const l4 = d3.select(`g#layerNum_4`);
        const l5 = d3.select(`g#layerNum_5`);
        const l6 = d3.select(`g#layerNum_6`);

        const scheme1 = buildBinaryLegend(
            myColor,
            0,
            1,
            "Features Color Scheme",
            schemeLocations[0][0],
            schemeLocations[0][1],
            firstLayer
        );
        const scheme2 = buildLegend(
            myColor,
            maxVals.conv1,
            "GCNConv1 Color Scheme",
            schemeLocations[1][0],
            schemeLocations[1][1],
            l1
        );
        const scheme3 = buildLegend(
            myColor,
            maxVals.conv2,
            "GCNConv2 Color Scheme",
            schemeLocations[1][0] + 230,
            schemeLocations[1][1],
            l2
        );
        const scheme4 = buildLegend(
            myColor,
            maxVals.conv3,
            "GCNConv3 Color Scheme",
            schemeLocations[1][0] + 230 * 2,
            schemeLocations[1][1],
            l3
        );
        const scheme5 = buildLegend(
            myColor,
            maxVals.pooling,
            "Pooling Color Scheme",
            schemeLocations[1][0] + 230 * 3,
            schemeLocations[1][1],
            l4
        );
        const scheme6 = buildBinaryLegend(
            myColor,
            result[0],
            result[1],
            "Result Color Scheme",
            schemeLocations[1][0] + 230 * 4,
            schemeLocations[1][1],
            l5
        );

        colorSchemesTable = [
            scheme1,
            scheme2,
            scheme3,
            scheme4,
            scheme5,
            scheme6
        ];
    }
    return {
        "locations":locations,
        "frames":frames,
        "schemeLocations":schemeLocations,
        "featureVisTable":featureVisTable,
        "colorSchemesTable":colorSchemesTable,
        "poolingVis":poolingVis,
        "outputVis":outputVis,
        "firstLayer":firstLayer,
        "maxVals":maxVals,
        "paths":paths,
        "resultVis":resultVis,
        "one":one
    }
}

//draw pooling visualizer
export function drawPoolingVis(
    locations: any,
    pooling: number[],
    myColor: any,
    frames: any,
    colorSchemesTable: any
) {
    let oLocations = deepClone(locations);
    //find edge points
    locations[0][0] += 64 * 2;
    locations[locations.length - 1][0] += 64 * 2;
    locations[locations.length - 1][1] += 10;
    //find mid point
    const midY = (locations[locations.length - 1][1] - locations[0][1]) / 2;
    //all paths should connect to mid point
    const one = [[locations[0][0] + 102, midY]];
    //drawPoints(".mats", "red", one);
    //draw the pooling layer
    console.log("from feature vis", pooling);
    const gg = d3
        .select(".mats")
        .append("g")
        .attr("class", "layerVis")
        .attr("id", "layerNum_4");
    const g = gg.append("g").attr("class", "pooling");
    for (let i = 0; i < pooling.length; i++) {
        g.append("rect")
            .attr("x", locations[0][0] + 102 + 2 * i)
            .attr("y", midY - 5)
            .attr("width", 2)
            .attr("height", 10)
            .attr("fill", myColor(pooling[i]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
    }
    //add text
    addLayerName(locations, "Pooling", 102, -142, gg);
    //draw the cross connections btw last GCN layer and pooling layer

    //do some transformations on the original locations
    for (let i = 0; i < oLocations.length; i++) {
        oLocations[i][0] += 2 * 64;
        oLocations[i][1] += 5;
    }
    //drawPoints(".mats", "red", oLocations);
    //connnnnnnnect!!!
    const curve = d3.line().curve(d3.curveBasis);
    const paths: any[] = [];
    const mats = d3.select(".mats");
    for (let i = 0; i < oLocations.length; i++) {
        const res = computeMids(oLocations[i], one[0]);
        const lpoint = res[0];
        const hpoint = res[1];
        const path = mats
            .append("path")
            .attr("d", curve([oLocations[i], lpoint, hpoint, one[0]]))
            .attr("stroke", "black")
            .attr("opacity", 0.05)
            .attr("fill", "none");

        paths.push(path.node());
    }
    //draw frame
    const f = g
        .append("rect")
        .attr("x", locations[0][0] + 102)
        .attr("y", midY - 5)
        .attr("width", 2 * 64)
        .attr("height", 10)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "poolingFrame");
    //send all paths to the back
    d3.selectAll("path").lower();

    g.on("mouseover", function (event, d) {
        console.log("over", paths);
        //interaction with paths
        if (paths != null) {
            paths.forEach((div: HTMLElement) => {
                div.style.opacity = "1";
            });
        }
        //interaction with frame
        d3.select(".poolingFrame").style("opacity", 1);
        //d3.selectAll('[layerID="3"][class="frame"]').attr("opacity", 1);
        const layerFrames = frames["GCNConv3"];
        layerFrames.forEach((frame: HTMLElement) => {
            frame.style.opacity = "1";
        });
    });

    g.on("mouseout", function (event, d) {
        if (paths != null) {
            paths.forEach((div: HTMLElement) => {
                div.style.opacity = "0.05";
            });
        }
        //interaction with frame
        d3.select(".poolingFrame").style("opacity", 0);
        //d3.selectAll('[layerID="3"][class="frame"]').attr("opacity", 0);
        const layerFrames = frames["GCNConv3"];
        layerFrames.forEach((frame: HTMLElement) => {
            frame.style.opacity = "0";
        });
    });

    return { one: one, g: g };
}

//the function to draw the last two layers of the model
export function drawTwoLayers(one: any, final: any, myColor: any) {
    //find the next position
    one[0][0] += 64 * 2 + 102;
    let aOne = deepClone(one);
    one[0][1] -= 5;
    //drawPoints(".mats", "red", one);
    let result = softmax(final);
    //visulaize
    const g = d3
        .select(".mats")
        .append("g")
        .attr("class", "twoLayer layerVis")
        .attr("id", "layerNum_5");
    for (let m = 0; m < final.length; m++) {
        g.append("rect")
            .attr("x", one[0][0] + 10 * m)
            .attr("y", one[0][1])
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", myColor(result[m]))
            .attr("opacity", 1)
            .attr("stroke", "gray")
            .attr("stroke-width", 0.1);
    }

    //add labels
    g.append("text")
        .attr("x", one[0][0] + 5)
        .attr("y", one[0][1])
        .attr("font-size", "5px")
        .attr("transform", "rotate(-45," + one[0][0] + "," + one[0][1] + ")")
        .text("Non-Mutagenic");

    g.append("text")
        .attr("x", one[0][0] + 15)
        .attr("y", one[0][1])
        .attr("font-size", "5px")
        .attr(
            "transform",
            "rotate(-45," + (one[0][0] + 10) + "," + one[0][1] + ")"
        )
        .text("Mutagenic");

    //draw frame
    const f = g
        .append("rect")
        .attr("x", one[0][0])
        .attr("y", one[0][1])
        .attr("width", 2 * 10)
        .attr("height", 10)
        .attr("fill", "none")
        .attr("opacity", 0)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("layerID", 4)
        .attr("class", "frame")
        .attr("fr", 1)
        .attr("id", "fr1");
    //add text
    addLayerName(one, "Prediction Result", 0, 20, g);
    //find positions to connect
    let bOne = deepClone(aOne);
    bOne[0][0] -= 102;
    //connect
    d3.select(".mats")
        .append("path")
        .attr("d", d3.line()([aOne[0], bOne[0]]))
        .attr("stroke", "black")
        .attr("opacity", 0.05)
        .attr("fill", "none")
        .attr("class", "path1")
        .attr("id", "path1");
    //visualize the result
    aOne[0][0] += 20 + 102;
    //drawPoints(".mats","red",aOne);
    aOne[0][1] -= 5;

    
    console.log("mat result", result);
    let cOne = deepClone(aOne);

    return { locations: [aOne[0], cOne[0]], g: g, g1: null };
}
