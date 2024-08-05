//A web utilities file for general UI building
import { useEffect, useState, useRef } from "react";
//import "./webUtils.css";
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
    loadNodesLocation,
    graphToMatrix,
} from "@/utils/utils";
import {
    HeatmapData,
    drawNodeAttributes,
    getNodeAttributes,
} from "../utils/matHelperUtils";

import { Tooltip } from "react-tooltip";




//Math function:::
export function roundToTwo(num: number): number {
    return Math.round(num * 100) / 100;
}

export function chunkArray<T>(inputArray: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < inputArray.length; i += chunkSize) {
        const chunk = inputArray.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}


//node selector in link prediction

export const NodeSelector:React.FC<{
    nodeList: number[], selectedNode: number, dependNode:number, setSelectedNode: Function,
    handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}> = ({nodeList, selectedNode, dependNode, setSelectedNode, handleChange}) => {
    return (
        <select
            className="text-2xl rounded-md px-3 shadow-none border-solid border-gray-200 border-2 min-w-80 bg-white text-gray-600"
            value={selectedNode}
            onChange={(e) => {
                if(Number(e.target.value)!=dependNode){
                    setSelectedNode(Number(e.target.value));
                    handleChange(e);
                }else{
                    window.alert("Can't select the same node for link prediction");
                }
            }}
        >
            {nodeList.map((item, index) => (
                <option key={index} value={item}>
                    {item}
                </option>
            ))}
        </select>
    );
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

            const result: any = analyzeGraph(graphData);

            setData(result);

        };
        analysis();
    }, [path]);

    const graphStat = data ? (
        <div className="flex flex-row flex-wrap items-center text-lg font-thin">
            {/* <div className="mr-4">
                <span>Graph Information</span>{" "}
            </div> */}
            <div className="mr-4">
                <span>Node Count</span>: {data.node_count}
            </div>
            <div className="mr-4">
                <span>Edge Count</span>:{" "}
                {data.is_directed ? data.edge_count : data.edge_count / 2}
            </div>
            <div className="mr-4">
                <span>Average Node Degree</span>:{" "}
                {roundToTwo(data.avg_node_degree / 2)}
            </div>
            <div className="mr-4">
                <span>Has Isolated Node</span>:{" "}
                {data.has_isolated_node ? "Yes" : "No"}
            </div>
            <div className="mr-4">
                <span>Has Loop</span>: {data.has_loop ? "Yes" : "No"}
            </div>
            {/* <div className="mr-4">
                <span>Is Directed</span>:{" "}
                {data.is_directed ? "Yes" : "No"}
            </div> */}
        </div>
    ) : (
        <div className="flex flex-row flex-wrap items-center text-lg font-thin">
            No data available
        </div>
    );

    return graphStat;
};

//button chain on the general UI
export const ButtonChain = ({
    selectedButtons,
    setSelectedButtons,
    predicted,
}: {
    selectedButtons: any[];
    setSelectedButtons: Function;
    predicted: boolean;
}) => {
    const handleButtonClick = (index: number) => {
        setSelectedButtons((prevSelectedLayers: any[]) => {
            const updatedLayers = [...prevSelectedLayers];
            updatedLayers[index] = !updatedLayers[index];

            return updatedLayers;
        });
    };
    return (
        <div className="flex gap-x-4 items-center">
            <div className="flex">
                <h2 className="text-xl m-auto">Architecture </h2>
                <div className="my-1 mx-2">
                    <Hint
                        text={
                            "Click to highlight corresponding layer in Model Visualization"
                        }
                    />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-center gap-x-2 opacity-80">
                    {/* Since input is not shown during the predicted phase, it is disabled */}
                    <button
                        disabled={!predicted}
                        className={`bg-gray-200  ${predicted
                            ? "hover:border-black hover:bg-gray-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[0]
                                ? "outline outline-2 outline-black bg-gray-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(0)}
                    >
                        Input
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200  ${predicted
                            ? "hover:border-black hover:bg-yellow-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[1]
                                ? "outline outline-2 outline-black bg-yellow-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(1)}
                    >
                        GCNConv1
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200  ${predicted
                            ? "hover:border-black hover:bg-yellow-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[2]
                                ? "outline outline-2 outline-black bg-yellow-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(2)}
                    >
                        GCNConv2
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200  ${predicted
                            ? "hover:border-black hover:bg-yellow-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[3]
                                ? "outline outline-2 outline-black bg-yellow-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(3)}
                    >
                        GCNConv3
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-blue-200  ${predicted
                            ? "hover:border-black hover:bg-blue-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[4]
                                ? "outline outline-2 outline-black bg-blue-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(4)}
                    >
                        Global Mean Pooling
                    </button>
                    {/* <button
                        disabled={!predicted}
                        className={`bg-emerald-200  ${predicted
                            ? "hover:border-black hover:bg-green-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[5]
                                ? "outline outline-2 outline-black bg-green-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(5)}
                    >
                        FC
                    </button> */}
                    <button
                        disabled={!predicted}
                        className={`bg-gray-200  ${predicted
                            ? "hover:border-black hover:bg-gray-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[5]
                                ? "outline outline-2 outline-black bg-gray-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(5)}
                    >
                        Output
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AnnotatedImage = ({
    imgSrc,
    label
}: {
    imgSrc:string;
    label:string
}) => {
    return (
      <div className="flex flex-col items-center">
        <img src={imgSrc} alt={label} />
        <span className="mt-2 text-center">{label}</span>
      </div>
    );
}

//we may want to find a smater way to do the button chain
export const NodeClassifierButtonChain = ({
    selectedButtons,
    setSelectedButtons,
    predicted,
}: {
    selectedButtons: any[];
    setSelectedButtons: Function;
    predicted: boolean;
}) => {
    const handleButtonClick = (index: number) => {
        setSelectedButtons((prevSelectedLayers: any[]) => {
            const updatedLayers = [...prevSelectedLayers];
            updatedLayers[index] = !updatedLayers[index];

            return updatedLayers;
        });
    };
    return (
        <div className="flex gap-x-4 items-center">
            <div className="flex">
                <h2 className="text-xl m-auto">Architecture </h2>
                <div className="my-1 mx-2">
                    <Hint
                        text={
                            "Click to highlight corresponding layer in Model Visualization"
                        }
                    />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-center gap-x-2 opacity-80">
                    {/* Since input is not shown during the predicted phase, it is disabled */}
                    <button
                        disabled={!predicted}
                        className={`bg-gray-200  ${predicted
                            ? "hover:border-black hover:bg-gray-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[0]
                                ? "outline outline-2 outline-black bg-gray-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(0)}
                    >
                        Input
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200  ${predicted
                            ? "hover:border-black hover:bg-yellow-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[1]
                                ? "outline outline-2 outline-black bg-yellow-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(1)}
                    >
                        GCNConv1
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200  ${predicted
                            ? "hover:border-black hover:bg-yellow-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[2]
                                ? "outline outline-2 outline-black bg-yellow-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(2)}
                    >
                        GCNConv2
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200  ${predicted
                            ? "hover:border-black hover:bg-yellow-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[3]
                                ? "outline outline-2 outline-black bg-yellow-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(3)}
                    >
                        GCNConv3
                    </button>
                    {/* <button
                        disabled={!predicted}
                        className={`bg-emerald-200  ${predicted
                            ? "hover:border-black hover:bg-green-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[5]
                                ? "outline outline-2 outline-black bg-green-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(5)}
                    >
                        FC
                    </button> */}
                    <button
                        disabled={!predicted}
                        className={`bg-gray-200  ${predicted
                            ? "hover:border-black hover:bg-gray-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[4]
                                ? "outline outline-2 outline-black bg-gray-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(4)}
                    >
                        Output
                    </button>
                </div>
            </div>
        </div>
    );
};


export const LinkClassifierButtonChain = ({
    selectedButtons,
    setSelectedButtons,
    predicted,
}: {
    selectedButtons: any[];
    setSelectedButtons: Function;
    predicted: boolean;
}) => {
    const handleButtonClick = (index: number) => {
        setSelectedButtons((prevSelectedLayers: any[]) => {
            const updatedLayers = [...prevSelectedLayers];
            updatedLayers[index] = !updatedLayers[index];

            return updatedLayers;
        });
    };
    return (
        <div className="flex gap-x-4 items-center">
            <div className="flex">
                <h2 className="text-xl m-auto">Architecture </h2>
                <div className="my-1 mx-2">
                    <Hint
                        text={
                            "Click to highlight corresponding layer in Model Visualization"
                        }
                    />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-center gap-x-2 opacity-80">
                    {/* Since input is not shown during the predicted phase, it is disabled */}
                    <button
                        disabled={!predicted}
                        className={`bg-gray-200  ${predicted
                            ? "hover:border-black hover:bg-gray-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[0]
                                ? "outline outline-2 outline-black bg-gray-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(0)}
                    >
                        Input
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200  ${predicted
                            ? "hover:border-black hover:bg-yellow-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[1]
                                ? "outline outline-2 outline-black bg-yellow-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(1)}
                    >
                        GNNConv1
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-yellow-200  ${predicted
                            ? "hover:border-black hover:bg-yellow-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[2]
                                ? "outline outline-2 outline-black bg-yellow-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(2)}
                    >
                        GNNConv2
                    </button>
                    <button
                        disabled={!predicted}
                        className={`bg-gray-200  ${predicted
                            ? "hover:border-black hover:bg-gray-300"
                            : ""
                            } text-black py-1 px-2 rounded ${selectedButtons[6]
                                ? "outline outline-2 outline-black bg-gray-300"
                                : ""
                            }`}
                        onClick={() => handleButtonClick(6)}
                    >
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
    );
};

import { Inter } from "@next/font/google";

const inter = Inter({
    variable: "--font-inter",
    weight: "400",
    subsets: ["latin-ext"],
});
export const Sidebar = () => {
    return (
        <div className="sidebar" style={{ height: "100%" }}>
            <main className={inter.className} style={{ paddingRight: "60px" }}>
                <h1 className="text-2xl font-black text-center text-3xl">
                    WHAT is an GNN model?
                </h1>
                <p className="text-center text-lg">
                    This is a paragraph explaining the GNN model. The quick
                    brown fox jumps over the lazy dog. The quick brown fox jumps
                    over the lazy dog. The quick brown fox jumps over the lazy
                    dog. The quick brown fox jumps over the lazy dog. The quick
                    brown fox jumps over the lazy dog. The quick brown fox jumps
                    over the lazy dog. The quick brown fox jumps over the lazy
                    dog.
                </p>

                <h1 className="text-2xl font-black text-center text-3xl">
                    How to interact with this demo?
                </h1>
                <p className="text-center text-lg">
                    This is a paragraph explaining how to interact with the
                    demo. The quick brown fox jumps over the lazy dog. The quick
                    brown fox jumps over the lazy dog. The quick brown fox jumps
                    over the lazy dog. The quick brown fox jumps over the lazy
                    dog. The quick brown fox jumps over the lazy dog.
                </p>
                <h1 className="text-2xl font-black text-center text-3xl">
                    How to interact with this demo?
                </h1>
                <p className="text-center text-lg">
                    This is a paragraph explaining how to interact with the
                    demo. The quick brown fox jumps over the lazy dog. The quick
                    brown fox jumps over the lazy dog. The quick brown fox jumps
                    over the lazy dog. The quick brown fox jumps over the lazy
                    dog. The quick brown fox jumps over the lazy dog.
                </p>
                <h1 className="text-2xl font-black text-center text-3xl">
                    How to interact with this demo?
                </h1>
                <p className="text-center text-lg">
                    This is a paragraph explaining how to interact with the
                    demo. The quick brown fox jumps over the lazy dog. The quick
                    brown fox jumps over the lazy dog. The quick brown fox jumps
                    over the lazy dog. The quick brown fox jumps over the lazy
                    dog. The quick brown fox jumps over the lazy dog.
                </p>
            </main>
        </div>
    );
};

//graph selector
interface SelectorProps {
    selectedOption: string;
    handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    OptionList: string[];
}

export const Selector: React.FC<SelectorProps> = ({
    selectedOption,
    handleChange,
    OptionList,
}) => {
    return (
        <select
            className="text-2xl rounded-md px-3 shadow-none border-solid border-gray-200 border-2 min-w-80 bg-white text-gray-600"
            value={selectedOption}
            onChange={handleChange}
        >
            {OptionList.map((item, index) => (
                <option key={index} value={item}>
                    {item}
                </option>
            ))}
        </select>
    );
};

//prediction result visualizer
interface PredictionVisualizerProps {
    result: { [label: string]: number };
}

export const PredictionVisualizer: React.FC<PredictionVisualizerProps> = ({
    result,
}) => {
    useEffect(() => {

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
            .data(Object.values(result))
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
            .data(Object.values(result))
            .enter()
            .append("text")
            .text(function (d, i) {
                return `${roundToTwo(d * 100)}%`;
            })
            .attr("dx", "5")
            .attr("x", function (d, i) {
                return d * 200;
            })
            .attr("y", function (d, i) {
                return i * 25 + 12.5;
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("fill", "black")
            .attr("text-anchor", "left");
    }, [result]);

    return (
        <div className="flex gap-x-4">
            <div>
                <p>
                    {Object.keys(result).map((key, index) => (
                        <span key={index}>
                            {key}
                            <br />
                        </span>
                    ))}
                </p>
            </div>
            <div>
                <div id="predvis"></div>
            </div>
        </div>
    );
};

import React from "react";
import { i } from "mathjs";
import { convertToAdjacencyMatrix, getNodeSet } from "@/utils/linkPredictionUtils";
import { extractSubgraph } from "@/utils/graphDataUtils";
import { dataProccessGraphVisLinkPrediction } from "@/utils/GraphvislinkPredUtil";

interface ViewSwitchProps {
    handleChange: () => void;
    checked: boolean;
    labels: string[];
}

export const ViewSwitch: React.FC<ViewSwitchProps> = ({
    handleChange,
    checked,
    labels,
}) => {
    return (
        <div className="relative inline-block w-40 h-8 select-none rounded-full overflow-hidden m-auto switchBtn">
            {/* Input remains hidden but is functional for toggle */}
            <input
                type="checkbox"
                id="toggle"
                className="opacity-0 absolute w-6 h-6 cursor-pointer"
                checked={checked}
                onChange={() => handleChange()}
            />
            {/* Label serves as the background and slider control, with added text */}
            <label
                htmlFor="toggle"
                className="block h-8 rounded-full transition-colors duration-300 ease-in-out cursor-pointer"
                style={{ backgroundColor: checked ? "gray" : "gray" }} // Green when true, Blue when false
            >
                {/* Only one span for the slider circle */}
                <span
                    className={`cursor-pointer absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transform transition-all duration-300 ease-in-out ${checked ? "translate-x-32" : ""
                        }`}
                ></span>
                {/* label */}
                <span className="text-white text-base font-semibold flex items-center justify-center h-full">
                    {checked ? labels[0] : labels[1]}
                </span>
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
            data-tooltip-id="tooltip"
            className="items-center justify-center flex"
        >
            <i
                className="fa fa-info-circle m-auto"
                style={{ fontSize: "28px", color: "#333" }}
            ></i>
            <Tooltip id="tooltip" />
        </span>
    );
};

//-------------------------------------------------------------
//single graph visualizer
let initialCoordinates: { [id: string]: { x: number; y: number } } = {};

export function visualizeGraph(
    path: string,
    onComplete: () => void,
    isAttribute: boolean,
    mode: number
): Promise<void> {
    return new Promise<void>((resolve) => {
        const init = async (data: any) => {
            const parse = path.match(/(\d+)\.json$/);
            const select = parse ? parse[1] : '';
            const location = loadNodesLocation(mode, select);

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

                const xOffset = -2.5 * offset;
                const g1 = svg
                .append("g")
                .attr("class", "layerVis")
                .attr("transform", `translate(${xOffset},${margin.top})`)

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
                .style("fill", "white")
                .style("stroke", "#69b3a2")
                .style("stroke-width", 1)
                .style("stroke-opacity", 1)
                .attr("opacity", 1)

                const labels = g1
                .selectAll("text")
                .data(data.nodes)
                .join("text")
                .text((d: any) => d.name)
                .attr("font-size", `17px`)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central")
                                

                data.nodes.forEach((node: any, i: number) => {
  
                    if (location[i.toString()]) {
                      node.x = location[i.toString()].x;
                      node.y = location[i.toString()].y;
                    } else {
                        node.x = Math.random() * width;
                        node.y = Math.random() * height;
                      }
                  });
                

                	
                  d3.forceSimulation(data.nodes)
                  .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(20))
                  .stop()
                  .on("tick", ticked);
                    function ticked() {
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
                                } else {
                                    return null;
                                }
                            })
                            .style("stroke", function (d: any) {
                                if (d.type === "aromatic") {
                                    return "purple";
                                } else {
                                    return "#aaa";
                                }
                            });

                        node.attr("cx", (d: any) => d.x).attr(
                            "cy",
                            (d: any) => d.y
                        );

                            

                    }
                    function updatePositions() {
                        link
                        .attr("x1", (d: any) => d.source.x)
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
                          return null;
                        })
                        .style("stroke", function (d: any) {
                          return d.type === "aromatic" ? "purple" : "#aaa";
                        });
                      node.attr("cx", (d: any) => d.x)
                        .attr("cy", (d: any) => d.y);
                        labels
                        .attr("x", (d: any) => d.x)
                        .attr("y", (d: any) => d.y);
                        let maxXDistance = 0;
                        let maxYDistance = 0;
                        initialCoordinates = {};
                        data.nodes.forEach((node1: any) => {
                            initialCoordinates[node1.id] = {
                                x: node1.x,
                                y: node1.y,
                            };
                            
                            data.nodes.forEach((node2: any) => {
                                if (node1 !== node2) {
                                    const xDistance = Math.abs(
                                        node1.x - node2.x
                                    );
                                    const yDistance = Math.abs(
                                        node1.y - node2.y
                                    );

                                    if (xDistance > maxXDistance) {
                                        maxXDistance = xDistance;
                                    }

                                    if (yDistance > maxYDistance) {
                                        maxYDistance = yDistance;
                                    }
                                }
                            });
                        });

                        const graphWidth = maxXDistance + 20;
                        const graphHeight = maxYDistance + 20;
                        const point1 = { x: 0.9 * offset - 260, y: height / 8 };
                        const point2 = {
                            x: 0.8 * offset - 260,
                            y: height / 20,
                        };
                        const point3 = {
                            x: 0.8 * offset - 260,
                            y: height / 1.7,
                        };
                        const point4 = {
                            x: 0.9 * offset - 260,
                            y: height / 1.5,
                        };
                        const tolerance = 100;

                        const x_dist = Math.abs(point1.x - point2.x);
                        const y_dist = Math.abs(point1.y - point4.y);

                        const centerX = (point1.x + point3.x) / 2;
                        const centerY = (point1.y + point3.y) / 2;
                        let scaleX = (graphWidth + tolerance) / x_dist;
                        let scaleY = (graphHeight + tolerance) / y_dist;
                        let transform = `translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY})`;
                        if (
                            graphWidth + tolerance < x_dist &&
                            graphHeight + tolerance < y_dist
                        ) {
                            transform = `scale(1, 1)`;
                        }
                        const parallelogram = svg
                            .append("polygon")
                            .attr(
                                "points",
                                `${point1.x},${point1.y} ${point2.x},${point2.y} ${point3.x},${point3.y} ${point4.x},${point4.y}`
                            )
                            .attr("stroke", "black")
                            .attr("fill", "none")
                            .attr("transform", transform);
                            onComplete();
                            resolve();
                        
                        
                    }
                    updatePositions();
        };

        const visualizeG = async () => {
            try {
                const pData = await data_prep(path);
                const gData = await prep_graphs(1, pData);
                await init(gData[0]);
            } catch (error) {

            }
        };

        visualizeG();
    });
}

//helper to get the matrix body visualize
export function visualizeMatrixBody(gridSize: number, graph: any, width: number, height: number, margin: any) {

    console.log("graph", graph);

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

    var x = d3.scaleBand().range([0, gridSize]).domain(myGroups).padding(0.01);

    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${gridSize + 150})`)
        .call(d3.axisBottom(x));

    var y = d3.scaleBand().range([0, gridSize]).domain(myVars).padding(0.01);

    g.append("g")
        .attr("class", "y-axis")
        .attr("transform", "translate(0,150)")
        .call(d3.axisLeft(y));

    if (0 == 0) {
        d3.selectAll<SVGTextElement, any>(".x-axis text").classed(
            "first",
            true
        );
        d3.selectAll<SVGTextElement, any>(".y-axis text").classed(
            "first",
            true
        );
    }

    d3.selectAll<SVGTextElement, any>(".x-axis text").classed("first", true);
    d3.selectAll<SVGTextElement, any>(".y-axis text").classed("first", true);

    var myColor = d3
        .scaleLinear<string>()
        .range(["white", "#69b3a2"])
        .domain([1, 100]);

    const data = matrix_to_hmap(graph);

    const filteredData = data.filter((d): d is HeatmapData => !!d);

    g.selectAll("rect")
        .data(data, (d: any) => d.group + ":" + d.variable)
        .enter()
        .append("rect")
        .attr("x", (d: HeatmapData) => x(d.group)!)
        .attr("y", (d: HeatmapData) => y(d.variable)! + 150)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", (d: HeatmapData) => myColor(d.value))
        .style("stroke-width", 1)
        .style("stroke", "grey")
        .style("opacity", 0.8);

    return data;
}

//-------------------------------------------------------------
//single matrix visualizer
export function visualizeMatrix(
    path: string,
    isAttribute: boolean,
    gridSize: number
) {
    const init = async (graph: any, nodeAttrs: any) => {
        const margin = { top: 10, right: 80, bottom: 30, left: 80 };
        const width = gridSize + margin.left + margin.right;
        const height = (gridSize + margin.top + margin.bottom) * 2;
        //visualize matrix body part
        visualizeMatrixBody(gridSize, graph, width, height, margin);
        if (isAttribute) drawNodeAttributes(nodeAttrs, graph, 150);
    };

    const visualizeMat = async (path: string) => {
        //const features = await get_features_origin(data);

        try {
            const data = await load_json(path);
            const nodeAttrs = getNodeAttributes(data);
            const features = await get_features_origin(data);
            const processedData = await graph_to_matrix(data);
            // Initialize and run D3 visualization with processe  d data
            await init(processedData, nodeAttrs);
        } catch (error) {

        }
    };

    visualizeMat(path);
}

export function visualizePartialGraphMatrix(
    path: string,
    isAttribute: boolean,
    gridSize: number,
    hubNodeA: number,
    hubNodeB: number
) {
    const init = async (graph: any) => {
        console.log("enter! 2", graph);
        const margin = { top: 10, right: 80, bottom: 30, left: 80 };
        const width = gridSize + margin.left + margin.right;
        const height = (gridSize + margin.top + margin.bottom) * 2;
        //get the nodes
        let nodesA:number[] = getNodeSet(graph, hubNodeA)[0];
        let nodesB:number[] = getNodeSet(graph, hubNodeB)[0];

        console.log("nodesA", nodesA);
        console.log("nodesB", nodesB);

        const mergedNodes = [...nodesA, ...nodesB];

        console.log("mergedNodes", mergedNodes);

        //compute the structure of the subgraph
        const subGraph = extractSubgraph(graph, mergedNodes);

        console.log("subGraph", subGraph);

        //get node attribute
        const keys = Object.keys(subGraph).map(Number);

        //transform the subgraph to adjacent matrix
        const subMatrix = convertToAdjacencyMatrix(subGraph);

        console.log("subMatrix", subMatrix);

        //visualize matrix body part
        visualizeMatrixBody(gridSize, subMatrix, width, height, margin);

        drawNodeAttributes(keys, subMatrix, 150);
    };

    const visualizeMat = async (path: string) => {
        console.log("enter! 1", path);
        try {
            const data = await load_json(path);
            const processedData = await graph_to_matrix(data);

            // Initialize and run D3 visualization with processe  d data
            await init(processedData);
        } catch (error) {

        }
    };
    console.log("enter!", path);
    visualizeMat(path);
}


export function visualizePartialGraph(
    path: string,
    onComplete: () => void,
    isAttribute: boolean,
    mode: number,
    hubNodeA: number,
    hubNodeB: number
): Promise<void> {
    return new Promise<void>((resolve) => {
        const init = async (data: any) => {
            const offset = 600;
            const margin = { top: 10, right: 30, bottom: 30, left: 40 };
            const width = 6 * offset - margin.left - margin.right;
            const height = 1000 - margin.top - margin.bottom;

            console.log(data);

            // Append the SVG object to the body of the page
            d3.select("#my_dataviz").selectAll("svg").remove();
            const svg = d3
                .select("#my_dataviz")
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            const xOffset = -2.5 * offset;
            const g1 = svg
                .append("g")
                .attr("class", "layerVis")
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
                .attr("r", 6)
                .style("fill", "white")
                .style("stroke", "#69b3a2")
                .style("stroke-width", 1)
                .style("stroke-opacity", 1)
                .attr("opacity", 1);

            const labels = g1
                .selectAll("text")
                .data(data.nodes)
                .join("text")
                .text(" ")
                .attr("font-size", `12px`)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "central");



                const simulation = d3
                .forceSimulation(data.nodes)
                .force(
                    "link",
                    d3
                        .forceLink(data.links)
                        .id((d: any) => d.id)
                        .distance(10)
                )
                .force("charge", d3.forceManyBody().strength(-50))
                .force("center", d3.forceCenter(width / 2, height / 3.5))
                .on("tick", function ticked() {
                    link.attr("x1", (d: any) => d.source.x)
                        .attr("y1", (d: any) => d.source.y)
                        .attr("x2", (d: any) => d.target.x)
                        .attr("y2", (d: any) => d.target.y)
                    node.attr("cx", (d: any) => d.x).attr(
                        "cy",
                        (d: any) => d.y
                    );

                    labels.attr("x", (d: any) => d.x)
                          .attr("y", (d: any) => d.y);
                    labels.attr("x", (d: any) => d.x - 6)
                          .attr("y", (d: any) => d.y + 6);
                })
                .on("end", function ended() {
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
            const x_dist = Math.abs(point1.x - point2.x);
            const y_dist = Math.abs(point1.y - point4.y)
            const centerX = (point1.x + point3.x) / 2;
            const centerY = (point1.y + point3.y) / 2;
            let scaleX = (graphWidth / (538.12));
            let scaleY = (graphHeight / (512.63));
            let transform = `translate(${centerX}, ${centerY}) scale(${scaleX}, ${scaleY}) translate(${-centerX}, ${-centerY})`;
            if (graphWidth < x_dist && graphHeight < y_dist) {
                scaleX = 1
                scaleY = 1
                transform = `scale(${scaleX}, ${scaleY})`;
            }
            const parallelogram = svg
                .append("polygon")  
                .attr("points", `${point1.x},${point1.y} ${point2.x},${point2.y} ${point3.x},${point3.y} ${point4.x},${point4.y}`)
                .attr("stroke", "black")
                .attr("fill", "none")
                .attr('transform',transform);
                });
          
            
    
        }


        const visualizeG = async () => {
            try {
                const pData = await dataProccessGraphVisLinkPrediction(path, hubNodeA, hubNodeB);
                await init(pData[0]);
            } catch (error) {
                console.error(error); // Log the error
            }
        };

        visualizeG();
    });
}

