//A web utilities file for general UI building
import { useEffect, useState } from "react";
import { Panel } from "react-resizable-panels";
import * as d3 from "d3";
import {
    analyzeGraph,
    data_prep,
    load_json,
    prep_graphs,
    featureVisualizer,
    get_axis_gdata,
    matrix_to_hmap,
    graph_to_matrix,
    prepMatrices,
    get_features_origin,
} from "@/utils/utils";
import {
    removeEffect,
    mouseover,
    mousemove,
    mouseleave
} from "@/utils/matInteractionUtils";
import {
    HeatmapData,
    drawNodeAttributes,
    getNodeAttributes
} from "../utils/matHelperUtils";

import { Tooltip } from 'react-tooltip';

//Math function:::
export function roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
}

interface GraphAnalysisViewerProps {
    path: string;
}

interface GraphData {
    node_count: number;
    edge_count: number;
    avg_node_degree: number;
    has_isolated_node: boolean;
    has_loop: boolean;
    is_directed: boolean;
}

export const GraphAnalysisViewer: React.FC<GraphAnalysisViewerProps> = ({
    path,
}) => {
    const [gPath, setGPath] = useState(path);
    const [data, setData] = useState<GraphData | null>(null);

    useEffect(() => {
        const analysis = async () => {
            const graphData: any = await load_json(path);
            console.log("GDATA", graphData);
            const result: any = analyzeGraph(graphData);
            console.log("Start Analysis!");
            setData(result);
            console.log("Finished Analysis!");
        };
        console.log("PPP", path);
        analysis();
    }, [path]);

    return (
        <div>
            {data ? (
                <div>
                    <div className="flex flex-row flex-wrap items-center">
                        <div className="mr-4">
                            <text className="font-bold">Graph Information</text>{" "}
                        </div>
                        <div className="mr-4">
                            <text className="font-semibold">Node Count</text>:{" "}
                            {data.node_count}
                        </div>
                        <div className="mr-4">
                            <text className="font-semibold">Edge Count</text>:{" "}
                            {data.is_directed ? data.edge_count : data.edge_count / 2}
                        </div>
                        <div className="mr-4">
                            <text className="font-semibold">
                                Average Node Degree
                            </text>
                            : {roundToTwo(data.avg_node_degree / 2)}
                        </div>
                        <div className="mr-4">
                            <text className="font-semibold">
                                Has Isolated Node
                            </text>
                            : {data.has_isolated_node ? "Yes" : "No"}
                        </div>
                        <div className="mr-4">
                            <text className="font-semibold">Has Loop</text>:{" "}
                            {data.has_loop ? "Yes" : "No"}
                        </div>
                        <div className="mr-4">
                            <text className="font-semibold">Is Directed</text>:{" "}
                            {data.is_directed ? "Yes" : "No"}
                        </div>
                    </div>
                </div>
            ) : (
                <div>No data available</div>
            )}
        </div>
    );
};

//button chain on the general UI    
export const ButtonChain = ({ selectedButtons, setSelectedButtons, predicted }: { selectedButtons: any[], setSelectedButtons: Function, predicted: boolean }) => {
    
    const handleButtonClick = (index: number) => {
        setSelectedButtons((prevSelectedLayers: any[]) => {
            const updatedLayers = [...prevSelectedLayers];
            updatedLayers[index] = !(updatedLayers[index]);
            
            return updatedLayers;
        });
    };
    return (
        <div className="flex gap-x-4 items-center" style={{ marginBottom: '20px' }}>
            <div>
                <h2 className="text-xl font-semibold">Model Architecture</h2>
            </div>
            <div>
                <div className="flex items-center justify-center gap-x-2">
                    <div style={{ marginRight: '7px' }}>
                        <Hint text={"Interact with me after you predict!"} />
                    </div>
                     {/* Since input is not shown during the predicted phase, it is disabled */}
                    <button
                        disabled={!predicted}
                        className={`cursor-default bg-gray-200 border border-gray-300 text-black py-1 px-2 rounded `}
                        >
                        Input
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200 border border-gray-300 ${predicted ? 'hover:border-black hover:bg-yellow-300' : ''} text-black py-1 px-2 rounded ${selectedButtons[1] ? 'outline outline-2 outline-black bg-yellow-300' : ''}`}
                        onClick={() => handleButtonClick(1)}>
                        GNNConv1
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200 border border-gray-300 ${predicted ? 'hover:border-black hover:bg-yellow-300': ''} text-black py-1 px-2 rounded ${selectedButtons[2] ? 'outline outline-2 outline-black bg-yellow-300' : ''}`}
                        onClick={() => handleButtonClick(2)}>
                        GNNConv2
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200 border border-gray-300 ${predicted ? 'hover:border-black hover:bg-yellow-300' : ''} text-black py-1 px-2 rounded ${selectedButtons[3] ? 'outline outline-2 outline-black bg-yellow-300' : ''}`}
                        onClick={() => handleButtonClick(3)}>
                        GNNConv3
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-blue-200 border border-gray-300 ${predicted ? 'hover:border-black hover:bg-blue-300' : ''} text-black py-1 px-2 rounded ${selectedButtons[4] ? 'outline outline-2 outline-black bg-blue-300' : ''}`}
                        onClick={() => handleButtonClick(4)}>
                        Global Mean Pooling
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-green-200 border border-gray-300 ${predicted ? 'hover:border-black hover:bg-green-300': ''} text-black py-1 px-2 rounded ${selectedButtons[5] ? 'outline outline-2 outline-black bg-green-300' : ''}`}
                        onClick={() => handleButtonClick(5)}>
                        FC
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-gray-200 border border-gray-300 ${predicted ? 'hover:border-black hover:bg-gray-300' : ''} text-black py-1 px-2 rounded ${selectedButtons[6] ? 'outline outline-2 outline-black bg-gray-300' : ''}`}
                        onClick={() => handleButtonClick(6)}>
                        Output
                    </button>
                </div>
            </div>
        </div>
    );
};
export const ModelButtonChain = () => {
    return (
        <div className="flex items-center space-x-4">
            <button>Model 1</button>
            <button>Model 2</button>
            <button>Model 3</button>
            <button>Model 4</button>

        </div>
    )
}

import { Inter } from '@next/font/google';

const inter = Inter({
    variable: '--font-inter',
    weight: '400',
    subsets: ['latin-ext'],
})
export const Sidebar = () => {
    return (


        <div className="sidebar" style={{ height: '100%' }}>
            <main className={inter.className} style={{ paddingRight: '60px' }}>
                <h1 className="text-2xl font-black text-center text-3xl">WHAT is an GNN model?</h1>
                <p className="text-center text-lg">This is a paragraph explaining the GNN model. The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.

                </p>

                <h1 className="text-2xl font-black text-center text-3xl">How to interact with this demo?</h1>
                <p className="text-center text-lg">This is a paragraph explaining how to interact with the demo.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.</p>
                <h1 className="text-2xl font-black text-center text-3xl">How to interact with this demo?</h1>
                <p className="text-center text-lg">This is a paragraph explaining how to interact with the demo.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.</p>
                <h1 className="text-2xl font-black text-center text-3xl">How to interact with this demo?</h1>
                <p className="text-center text-lg">This is a paragraph explaining how to interact with the demo.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.
                    The quick brown fox jumps over the lazy dog.</p>
            </main>
        </div>


    );
};

//helper function for graph selector, generate a list of graphs to select
export function graph_list_generate(num: number) {
    let res = [];
    res.push("./input_graph.json");
    for (let i = 0; i < num; i++) {
        res.push(`./json_data/input_graph${i}.json`);
    }
    console.log("Graphs List", res);
    return res;
}

//graph selector
interface GraphSelectorProps {
    selectedGraph: string;
    handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    graphList: string[];
}

export const GraphSelector: React.FC<GraphSelectorProps> = ({
    selectedGraph,
    handleChange,
    graphList,
}) => {
    return (
        <select value={selectedGraph} onChange={handleChange} style={{
            boxShadow: 'inset 1px 2px 3px rgba(0, 0, 0, 0.25)',
            height: '30px',
            width: "120px",
            textAlign: "left",
            verticalAlign: "bottom",
            backgroundColor: "#F9F7F7",
            color: "#7A7A7A",
        }}>
            {graphList.map((item, index) => (
                <option key={index} value={item}>
                    Graph {index}
                </option>
            ))}
        </select>
    );
};

//prediction result visualizer
interface PredictionVisualizerProps {
    result: number[];
}

export const PredictionVisualizer: React.FC<PredictionVisualizerProps> = ({
    result,
}) => {
    useEffect(() => {
        //console.log("RESULTS", result1, result2);
        //VIS
        const width = 500;
        const height = 50;

        d3.select("#predvis").selectAll("svg").remove();
        const svg = d3
            .select("#predvis")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        const bars = svg
            .selectAll("rect")
            .data(result)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function (d, i) {
                return i * 25;
            })
            .attr("height", 20)
            .attr("width", function (d, i) {
                return d * 200;
            })
            .attr("fill", "gray");

        const texts = svg
            .selectAll("text")
            .data(result)
            .enter()
            .append("text")
            .text(function (d, i) {
                return roundToTwo(d * 100);
            })
            .attr("dx", "5")
            .attr("x", function (d, i) {
                return d * 200;
            })
            .attr("y", function (d, i) {
                return i * 25 + 12.5;
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "10px")
            .attr("fill", "black")
            .attr("text-anchor", "left");
    }, [result]);

    return <div id="predvis"></div>;
};

import React from "react";

interface ViewSwitchProps {
    handleChange: (newView: boolean) => void;
    current: boolean;
}

export const ViewSwitch: React.FC<ViewSwitchProps> = ({
    handleChange,
    current,
}) => {
    return (

        <div className="relative inline-block w-20 h-8 select-none rounded-full overflow-hidden">
            {/* Input remains hidden but is functional for toggle */}
            <input
                type="checkbox"
                id="toggle"
                className="opacity-0 absolute w-6 h-6 cursor-pointer"
                checked={current}
                onChange={() => handleChange(!current)}
            />
            {/* Label serves as the background and slider control, with added text */}
            <label
                htmlFor="toggle"
                className="block h-8 rounded-full transition-colors duration-300 ease-in-out cursor-pointer"
                style={{ backgroundColor: current ? "gray" : "gray" }} // Green when true, Blue when false
            >
                {/* Only one span for the slider circle */}
                <span
                    className={`cursor-pointer absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transform transition-all duration-300 ease-in-out ${current ? "translate-x-12" : ""
                        }`}
                ></span>
            </label>
        </div>
    );
};

//graph selector
interface ViewSelectorProps {
    handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    current: boolean;
}

export const ViewSelector: React.FC<ViewSelectorProps> = ({
    handleChange,
    current,
}) => {
    return current ? (
        <select
            onChange={(e) => {
                handleChange(e);
            }}
        >
            <option value="true">Graphs View</option>
            <option value="false">Matrices View</option>
        </select>
    ) : (
        <select
            onChange={(e) => {
                handleChange(e);
            }}
        >
            <option value="false">Matrices View</option>
            <option value="true">Graphs View</option>
        </select>
    );
};

//explanation component
interface HintProps {
    text: string;
}

export const Hint: React.FC<HintProps> = ({ text }) => {
    return (
        <span
            data-tooltip-content={text}
            data-tooltip-id='tooltip'
            className='items-center justify-center'
        >
            <span className="inline-block bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-black cursor-default">
                ?
            </span>
            <Tooltip id="tooltip" />
        </span>
    );
};

//-------------------------------------------------------------
//single graph visualizer
export function visualizeGraph(path: string) {
    const init = async (data: any) => {
        let allNodes: any[] = [];
        const offset = 600;
        const margin = { top: 10, right: 30, bottom: 30, left: 40 };
        const width = 6 * offset - margin.left - margin.right;
        const height = 1000 - margin.top - margin.bottom;




        // Append the SVG object to the body of the page
        d3.select("#my_dataviz").selectAll("svg").remove();
        const svg = d3
            .select("#my_dataviz")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        if (data.nodes) {
            const xOffset = -2.5 * offset;
            const g1 = svg
                .append("g")
                .attr("transform", `translate(${xOffset},${margin.top})`);

            // Initialize the links
            const link = g1
                .selectAll("line")
                .data(data.links)
                .join("line")
                .style("stroke", "#aaa");

            // Initialize the nodes
            const node = g1
                .selectAll("circle")
                .data(data.nodes)
                .join("circle")
                .attr("r", 17)
                .style("stroke", "#69b3a2")
                .style("fill", "white")


            const labels = g1
                .selectAll("text")
                .data(data.nodes)
                .join("text")
                .text((d: any) => d.name)
                .attr("font-size", `20px`);



            // Define the simulation
            const simulation = d3
                .forceSimulation(data.nodes)
                .force(
                    "link",
                    d3
                        .forceLink(data.links)
                        .id((d: any) => d.id)
                        .distance(10)
                )
                .force("center", d3.forceCenter(width / 2, height / 2.8))
                .force("collide", d3.forceCollide().radius(20).strength(0.8))
                .force("aromatic", d3.forceManyBody().strength((d: any) => (d.is_aromatic ? -210 : -100)).theta(0.9))
                .on("tick", function ticked() {
                    link.attr("x1", (d: any) => d.source.x)
                        .attr("y1", (d: any) => d.source.y)
                        .attr("x2", (d: any) => d.target.x)
                        .attr("y2", (d: any) => d.target.y)
                        .attr("transform", function (d: any) {
                            if (d.type === "double") {
                                const dx = d.target.x - d.source.x;
                                const dy = d.target.y - d.source.y;
                                const dr = Math.sqrt(dx * dx + dy * dy);
                                const offsetX = 5 * (dy / dr);
                                const offsetY = 5 * (-dx / dr);
                                return `translate(${offsetX}, ${offsetY})`;
                            }
                            else {
                                return null;
                            }
                        })
                        .style("stroke", function (d: any) {
                            if (d.type === "aromatic") {
                                return "purple";
                            }
                            else {
                                return "#aaa";
                            }
                        });


                    node.attr("cx", (d: any) => d.x).attr(
                        "cy",
                        (d: any) => d.y
                    );

                    labels.attr("x", (d: any) => d.x - 6)
                        .attr("y", (d: any) => d.y + 6);
                })
                .on("end", function ended() {
                    let value = null;
                    data.nodes.forEach((node: any) => {
                        node.graphIndex = 0;


                        if (value != null) {
                            //node.features = value.subarray(64 * node.id, 64 * (node.id + 1))
                        }
                        allNodes.push(node);
                    });
                    let maxXDistance = 0;
                    let maxYDistance = 0;
                    data.nodes.forEach((node1: any) => {
                        data.nodes.forEach((node2: any) => {
                            if (node1 !== node2) {
                                const xDistance = Math.abs(node1.x - node2.x);
                                const yDistance = Math.abs(node1.y - node2.y);

                                if (xDistance > maxXDistance) {
                                    maxXDistance = xDistance;
                                }

                                if (yDistance > maxYDistance) {
                                    maxYDistance = yDistance;
                                }
                            }
                        });
                    });
                    const graphWidth = maxXDistance + 20
                    const graphHeight = maxYDistance + 20;
                    const point1 = { x: 0, y: height / 8 };
                    const point2 = { x: 0.9 * offset, y: height / 20 };
                    const point3 = { x: 0.9 * offset, y: height / 1.7 };
                    const point4 = { x: 0, y: height / 1.5 };
                    const tolerance = 120;

                    const x_dist = Math.abs(point1.x - point2.x);
                    const y_dist = Math.abs(point1.y - point4.y)


                    const centerX = (point1.x + point3.x) / 2;
                    const centerY = (point1.y + point3.y) / 2;
                    let scaleX = ((graphWidth + tolerance) / x_dist);
                    let scaleY = ((graphHeight + tolerance) / y_dist);
                    let transform = `translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY})`;
                    if (graphWidth + tolerance < x_dist && graphHeight + tolerance < y_dist) {
                        transform = `scale(1, 1)`;
                    }
                    const parallelogram = svg
                        .append("polygon")
                        .attr("points", `${point1.x},${point1.y} ${point2.x},${point2.y} ${point3.x},${point3.y} ${point4.x},${point4.y}`)
                        .attr("stroke", "black")
                        .attr("fill", "none")
                        .attr('transform', transform);
                    //here has an issue
                    featureVisualizer(svg, allNodes, offset, height, null, []);
                });




        }
    };

    const visualizeG = async () => {
        try {
            console.log("started visualize....");
            const pData = await data_prep(path);
            console.log("s pdata", pData);
            const gData = await prep_graphs(1, pData);
            console.log("s gData", gData);
            await init(gData[0]);
        } catch (error) {
            console.log("Error in single graph visualizer", error);
        }
    };

    visualizeG();
}

//-------------------------------------------------------------
//single matrix visualizer
export function visualizeMatrix(path: string) {
    const init = async (graph: any, features: any, nodeAttrs: any) => {
        const gridSize = 300;
        const margin = { top: 10, right: 80, bottom: 30, left: 80 };
        const width = gridSize + margin.left + margin.right;
        const height = (gridSize + margin.top + margin.bottom) * 2;

        d3.select("#matvis").selectAll("svg").remove();
        const svg = d3
            .select("#matvis")
            .append("svg")
            .attr("class", "mats")
            .attr("width", width)
            .attr("height", height);
        const xOffset = 50;
        const g = svg
            .append("g")
            .attr("transform", `translate(${xOffset},${margin.top})`);
        var myGroups = get_axis_gdata(graph);
        var myVars = get_axis_gdata(graph);

        var x = d3
            .scaleBand()
            .range([0, gridSize])
            .domain(myGroups)
            .padding(0.01);

        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${gridSize+50})`)
            .call(d3.axisBottom(x));

        var y = d3
            .scaleBand()
            .range([0, gridSize])
            .domain(myVars)
            .padding(0.01);

        g.append("g").attr("class", "y-axis").attr("transform", "translate(0,50)").call(d3.axisLeft(y));

        d3.selectAll<SVGTextElement, any>(".x-axis text").classed(
            "first",
            true
        );
        d3.selectAll<SVGTextElement, any>(".y-axis text").classed(
            "first",
            true
        );

        var myColor = d3
            .scaleLinear<string>()
            .range(["white", "#69b3a2"])
            .domain([1, 100]);

        const data = matrix_to_hmap(graph);
        console.log("accepted data:", data);
        const filteredData = data.filter((d): d is HeatmapData => !!d);

        g.selectAll("rect")
            .data(data, (d: any) => d.group + ":" + d.variable)
            .enter()
            .append("rect")
            .attr("x", (d: HeatmapData) => x(d.group)!)
            .attr("y", (d: HeatmapData) => y(d.variable)!+50)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", (d: HeatmapData) => myColor(d.value))
            .style("stroke-width", 1)
            .style("stroke", "grey")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);

        g.selectAll(".x-axis text")
            .on("mouseover", function (event) {
                console.log("EVENT", event);
                const element = event.target as SVGGraphicsElement;
                console.log("ELEMENT", element);
            })
            .on("mouseout", function (event) {
                const element = event.target as SVGGraphicsElement;
                removeEffect(element);
                d3.select("#tmp").remove();
            });

        g.selectAll(".y-axis text")
            .on("mouseover", function (event, d) {
                const element = event.target as SVGGraphicsElement;
                console.log("ELEMENT", element);
            })
            .on("mouseout", function (event, d) {
                const element = event.target as SVGGraphicsElement;
                removeEffect(element);
            });

        drawNodeAttributes(nodeAttrs, graph, 50);
    };

    const visualizeMat = async (path: string) => {
        //const features = await get_features_origin(data);
        //console.log("o features", features);
        try {
            const data = await load_json(path);
            const nodeAttrs = getNodeAttributes(data);
            const features = await get_features_origin(data);
            console.log("VIS features", features);
            const processedData = await graph_to_matrix(data);
            console.log("VIS pData matvis", processedData);
            //const graphsData = await prepMatrices(1, processedData);
            //console.log("VIS gData", graphsData);
            // Initialize and run D3 visualization with processe  d data
            await init(processedData, features, nodeAttrs);
        } catch (error) {
            console.log("Error in single matrix visualizer", error);
        }
    };

    visualizeMat(path);
}