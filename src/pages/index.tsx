import React, { useEffect, useRef, useState } from "react";
import GraphVisualizer from "./GraphVisualizer";
import ClassifyGraph from "./ClassifyGraph";
import MatricesVisualizer from "./MatricesVisualizer";
import NodeMatricesVisualizer from "./node_classifier/NodeMatrixVisualizer";
import NodeGraphVisualizer from "./node_classifier/NodeGraphVisualizer";
import LinkMatricesVisualizer from "./link_classifier/LinkMatrixVisualizer";
import LinkGraphVisualizer from "./link_classifier/LinkGraphVisualizer";
import { IntmData, IntmDataNode } from "../types";
import GraphMatrixVisualization from "../components/GraphMatrixVisualization";
import {
    graphList,
    linkList,
    modelList,
    nodeList,
    DatasetInfo,
    midGraphNodeSelectionList,
    INTRO_STEPS,
} from "../utils/const";
import Sidebar from "./Sidebar";
import styles from "./index.module.css";
import * as d3 from "d3";
import { Steps } from "intro.js-react";
import "intro.js/introjs.css";

import {
    Selector,
    Hint,
    ViewSwitch,
    NodeSelector,
    ArchitectureButtonChain,
    ColorLegend,
    SandboxModeSelector,
} from "../components/WebUtils";
import { Footer, NavBar } from "../components/Surfaces";
import { Inter } from "@next/font/google";
import GraphEditor from "@/components/GraphEditor";
import DualViews from "@/components/DualViews/DualViews";

export const inter = Inter({
    variable: "--font-inter",
    weight: "500",
    subsets: ["latin-ext"],
});

export const inter2 = Inter({
    variable: "--font-inter",
    weight: "200",
    subsets: ["latin-ext"],
});

export const inter3 = Inter({
    variable: "--font-inter",
    weight: "400",
    subsets: ["latin-ext"],
});

const LoadingSpinner = () => (
    <div className="fixed top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-white bg-opacity-75 z-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
        <p className="mt-4 text-gray-700 text-lg">
            Loading the visualization...
        </p>
    </div>
);

export default function Home() {
    const [isLoading, setIsLoading] = useState(false);
    const [model, setModel] = useState("GCN - graph classification");

    const initialMUTAGGraph = Object.keys(graphList)[0];
    const [selectedGraph, setSelectedGraph] = useState(initialMUTAGGraph);
    const introRef = useRef<Steps>(null);
    const [outputData, setOutputData] = useState(null);

    const [isGraphView, setIsGraphView] = useState(true);
    const [changedG, setChangedG] = useState(true);
    const [step, setStep] = useState(1);
    const [show, setShow] = useState(false);
    const [predicted, setPredicted] = useState(false);
    const [simulationLoading, setSimulation] = useState(false);

    const [graphEditorState, setGraphEditorState] = useState(false);

    const [simGraphData, setSimGraphData] = useState({});
    const [nodePositions, setNodePositions] = useState<any[]>([]);
    const [sandBoxMode, setSandBoxMode] = useState(false);

    const [hubNodeA, setHubNodeA] = useState(241);
    const [hubNodeB, setHubNodeB] = useState(109);

    const [datasetIndex, setDatasetIndex] = useState(0);

    const [modelType, setModelType] = useState("GCN");

    // Intermediate output
    const [intmData, setIntmData] = useState<IntmData | IntmDataNode | null>(
        null
    );
    const [selectedButtons, setSelectedButtons] = useState([
        false,
        false,
        false,
        false,
        false,
        false,
        false,
    ]);
    const [probabilities, setProbabilities] = useState<number[] | number[][]>(
        []
    );
    const [showDatasetInfo, setShowDatasetInfo] = useState(false);

    const handleSimulatedGraphChange = (value: any) => {
        setSimGraphData(value);
        console.log("Simulated graph data updated:", value, simGraphData);
    };

    const handleNodePositionsChange = (positions: { id: string; x: number; y: number }[]) => {
        setNodePositions(positions);
        console.log("Node positions updated:", positions);
    };

    function handleGraphSelection(
        e: React.ChangeEvent<HTMLSelectElement>
    ): void {
        setSelectedGraph(e.target.value);
        setChangedG(true);
        setProbabilities([]);
        setPredicted(false);
        setSimulation(false);
    }

    function handleGraphEditor(e: React.MouseEvent<HTMLButtonElement>): void {
        console.log("Graph editor button clicked");
        if (graphEditorState) {
            setGraphEditorState(false);
        } else {
            setGraphEditorState(true);
        }
    }

    const startIntro = () => {
        if (introRef.current) {
            introRef.current.introJs.start();
        }
    };

    const zoomStyle = {
        zoom: "70%",
    };

    useEffect(() => {
        console.log("simGraphData updated:", simGraphData);
    }, [simGraphData]);

    useEffect(() => {
        document.body.style.overflow = "hidden";

        fetch("./json_data/graphs/testing_graph.json")
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Failed to load simgraph JSON");
                }
                return res.json();
            })
            .then((data) => {
                setSimGraphData(data);
            })
            .catch((err) => {
                console.error("Error loading simgraph JSON:", err);
            });
    }, []);

    useEffect(() => {
        if (predicted && introRef.current) {
            introRef.current.introJs.exit();
        }
    }, [predicted]);

    function handleNodeSelection(
        e: React.ChangeEvent<HTMLSelectElement>
    ): void {
        // Handle node selection changes
        setChangedG(true);
        setProbabilities([]);
        setPredicted(false);
        setSimulation(false);
    }

    function handleSandboxModeSelection(
        e: React.ChangeEvent<HTMLSelectElement>
    ): void {
        console.log("Sandbox mode selection changed:", e.target.value);
        if (e.target.value === "On") {
            setSandBoxMode(true);
        } else {
            setSandBoxMode(false);
        }
        console.log("Sandbox mode is now:", sandBoxMode);
        setPredicted(false);
    }

    return (
        <div style={zoomStyle}>
            <Steps
                enabled={true}
                steps={INTRO_STEPS}
                initialStep={0}
                onExit={() => {}}
                ref={introRef}
            />
            {isLoading && model.includes("link prediction") && (
                <LoadingSpinner />
            )}
            <main className={inter.className}>
                <div className={inter2.className}>
                    {step === 0 && (
                        <div
                            style={{ paddingTop: "15%" }}
                            className="bg-white min-h-screen flex justify-center items-center"
                        >
                            <h1
                                className="animate-dissolve text-6xl  font-bold text-gradient-stroke"
                                data-text="Welcome to a Graph Neural Network Visualizer"
                            />
                        </div>
                    )}
                </div>
                {step === 1 && (
                    <div className="bg-white text-black">
                        <div id="gnn101">
                            <NavBar startIntro={startIntro} />
                        </div>

                        <div className={` ${styles.body}  grid grid-cols-4 `}>
                            <div id="text-panel">
                                <Sidebar
                                    isGraphView={isGraphView}
                                    setIsGraphView={setIsGraphView}
                                    predicted={predicted}
                                    modelMode={model}
                                />
                            </div>

                            <div
                                className={`${styles.rightContainer} col-span-3 ml-4`}
                            >
                                <div
                                    className="flex gap-x-2 items-center"
                                    style={{ paddingTop: "40px" }}
                                    id="model-selector"
                                >
                                    <h1 className="text-3xl min-w-48 font-black">
                                        GNN Model
                                    </h1>
                                    <div className="flex flex-col space-y-4">
                                        <div className="flex flex-row">
                                            <h2 className="text-xl mr-4">
                                                Model-Task
                                            </h2>
                                            <Selector
                                                selectedOption={model}
                                                handleChange={(e) => {
                                                    const newModel =
                                                        e.target.value;
                                                    console.log(
                                                        "Selected model:",
                                                        newModel
                                                    );
                                                    setModel(newModel);
                                                    setPredicted(false);
                                                    setSimulation(false);
                                                    setProbabilities([]);
                                                    setIntmData(null);

                                                    if(newModel.includes("Sandbox")){
                                                        setSandBoxMode(true);
                                                        setPredicted(false);
                                                    } else {
                                                        setSandBoxMode(false);
                                                    }

                                                    if (
                                                        newModel.includes("GAT")
                                                    ) {
                                                        setModelType("GAT");
                                                        setSelectedGraph(
                                                            "twitch_EN"
                                                        );
                                                        setHubNodeA(194);
                                                        setHubNodeB(590);
                                                    } else if (
                                                        newModel.includes(
                                                            "GraphSAGE"
                                                        )
                                                    ) {
                                                        setModelType(
                                                            "GraphSAGE"
                                                        );
                                                        setSelectedGraph(
                                                            "twitch_EN"
                                                        );
                                                        setHubNodeA(194);
                                                        setHubNodeB(590);
                                                    } else if (
                                                        newModel.includes("GCN")
                                                    ) {
                                                        setModelType("GCN");
                                                        if (
                                                            newModel.includes(
                                                                "graph classification"
                                                            )
                                                        ) {
                                                            setSelectedGraph(
                                                                initialMUTAGGraph
                                                            );
                                                        } else if (
                                                            newModel.includes(
                                                                "node classification"
                                                            )
                                                        ) {
                                                            setSelectedGraph(
                                                                "karate"
                                                            );
                                                        } else if (
                                                            newModel.includes(
                                                                "link prediction"
                                                            )
                                                        ) {
                                                            setSelectedGraph(
                                                                "twitch_EN"
                                                            );
                                                            setHubNodeA(194);
                                                            setHubNodeB(590);
                                                        }
                                                    }
                                                }}
                                                OptionList={Object.keys(
                                                    modelList
                                                )}
                                                id={""}
                                            />
                                        </div>

                                        <ArchitectureButtonChain
                                            selectedButtons={selectedButtons}
                                            setSelectedButtons={
                                                setSelectedButtons
                                            }
                                            predicted={predicted}
                                            selectedModel={model}
                                        />
                                    </div>
                                </div>
                                <hr className="border-t border-gray-300 my-4"></hr>

                                {/* Graph Data */}
                                <div>
                                    <div
                                        id="graph-selector"
                                        className="flex gap-x-4 items-center  mb-3 "
                                    >
                                        <h1 className="text-3xl font-black min-w-48">
                                            Input Graph
                                        </h1>
                                        {!model.includes("link") && <div>
                                        
                                        {sandBoxMode? <>Modify the graph in the graph visualizer. </>: <div
                                            className={`flex-1 items-center gap-x-6 ${inter2.className}`}
                                            id="dataset-description"
                                        >
                                            {DatasetInfo[model]}
                                        </div>}</div>}
                                        <div className="flex-1 items-center gap-x-4 text-xl">
                                            <div className={inter3.className}>
                                                {model.includes(
                                                    "graph classification"
                                                ) && !sandBoxMode && (
                                                    <>
                                                        {" "}
                                                        <div className="m-1">
                                                            {" "}
                                                            Classify the graph
                                                            of{" "}
                                                        </div>
                                                        <Selector
                                                            selectedOption={
                                                                selectedGraph
                                                            }
                                                            handleChange={
                                                                handleGraphSelection
                                                            }
                                                            OptionList={Object.keys(
                                                                graphList
                                                            )}
                                                            id="dataset-selector"
                                                        />
                                                    </>
                                                )}
                                                {model.includes(
                                                    "node classification"
                                                ) && !sandBoxMode && (
                                                    <>
                                                        <span>
                                                            Classify all nodes
                                                            of the karate club
                                                            network
                                                        </span>
                                                    </>
                                                )}

                                                                                                        

                                                {graphEditorState && (
                                                    <div>
                                                        <GraphEditor
                                                            onClose={() =>
                                                                setGraphEditorState(
                                                                    false
                                                                )
                                                            }
                                                            simGraphData={
                                                                simGraphData
                                                            }
                                                            handleSimulatedGraphChange={
                                                                handleSimulatedGraphChange
                                                            }
                                                            onNodePositionsChange={
                                                                handleNodePositionsChange
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                

                                                {model.includes(
                                                    "link prediction"
                                                ) && (
                                                    <>
                                                        Predict whether there is
                                                        a link <br /> from node{" "}
                                                        <NodeSelector
                                                            nodeList={
                                                                midGraphNodeSelectionList
                                                            }
                                                            selectedNode={
                                                                hubNodeA
                                                            }
                                                            dependNode={
                                                                hubNodeB
                                                            }
                                                            setSelectedNode={
                                                                setHubNodeA
                                                            }
                                                            handleChange={
                                                                handleNodeSelection
                                                            }
                                                        />{" "}
                                                        to node{" "}
                                                        <NodeSelector
                                                            nodeList={
                                                                midGraphNodeSelectionList
                                                            }
                                                            selectedNode={
                                                                hubNodeB
                                                            }
                                                            dependNode={
                                                                hubNodeA
                                                            }
                                                            setSelectedNode={
                                                                setHubNodeB
                                                            }
                                                            handleChange={
                                                                handleNodeSelection
                                                            }
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* 在未预测时显示 Click to Predict 按钮 */}
                                    {!predicted && (
                                        <div>
                                            <ClassifyGraph
                                                graphPath={
                                                    model ==
                                                    "GCN - graph classification"
                                                        ? graphList[
                                                              selectedGraph
                                                          ]
                                                        : nodeList[
                                                              selectedGraph
                                                          ]
                                                }
                                                modelPath={modelList[model]}
                                                setChangedG={setChangedG}
                                                setIntmData={setIntmData}
                                                setPredicted={setPredicted}
                                                predicted={predicted}
                                                probabilities={probabilities}
                                                setProbabilities={
                                                    setProbabilities
                                                }
                                                onlyShownButton={true}
                                                simulationLoading={
                                                    simulationLoading
                                                }
                                                setIsLoading={setIsLoading}
                                                simGraphData={simGraphData}
                                                sandBoxMode={sandBoxMode}
                                            />
                                        </div>
                                    )}

                                    {/* 在未预测时显示 Graph View 和 Matrix View */}
                                    {!predicted && (
                                        <div>
                                            {/* 新的可视化替换内容 */}
                                            <div
                                                className={styles.vizContainer}
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                }}
                                            >
                                                <div
                                                    className="new-visualization"
                                                    style={{
                                                        flex: 1,
                                                        overflow: "auto",
                                                    }}
                                                >
                                                    <DualViews
                                                        dataFile={
                                                            model.includes(
                                                                "graph classification"
                                                            )
                                                                ? graphList[
                                                                      selectedGraph
                                                                  ]
                                                                : model.includes(
                                                                      "node classification"
                                                                  )
                                                                ? nodeList[
                                                                      selectedGraph
                                                                  ]
                                                                : model.includes(
                                                                      "link prediction"
                                                                  )
                                                                ? linkList[
                                                                      selectedGraph
                                                                  ]
                                                                : "test-test"
                                                        }
                                                        graph_path={
                                                                graphList[
                                                                    selectedGraph
                                                                ]
                                                            }
                                                        simulatedGraphData={
                                                            simGraphData
                                                        }
                                                        hubNodeA={
                                                            model.includes(
                                                                "link prediction"
                                                            )
                                                                ? hubNodeA
                                                                : undefined
                                                        }
                                                        hubNodeB={
                                                            model.includes(
                                                                "link prediction"
                                                            )
                                                                ? hubNodeB
                                                                : undefined
                                                        }
                                                        modelType={model}
                                                        sandboxMode={model.includes('link prediction') ? false : sandBoxMode}
                                                        nodePositions={nodePositions}
                                                        onNodePositionChange={handleNodePositionsChange}
                                                        handleNodePositionsChange={handleNodePositionsChange}
                                                        handleSimulatedGraphChange={handleSimulatedGraphChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 在预测后显示 Inner Model Visualization */}
                                    {predicted && (
                                        <>
                                            <hr className="border-t border-gray-300 my-4"></hr>
                                            {/* Inner Model Visualization 标题和切换视图的控件 */}
                                            <div className="flex gap-x-4 items-center">
                                                <div className="flex gap-x-4">
                                                    <h2 className="text-3xl font-black">
                                                        Inner Model
                                                        Visualization
                                                    </h2>
                                                </div>
                                                <div className="flex gap-x-4">
                                                    <ViewSwitch
                                                        handleChange={() => {
                                                            setIsLoading(true);
                                                            setIsGraphView(
                                                                !isGraphView
                                                            );
                                                            setSimulation(
                                                                false
                                                            );
                                                            d3.select(
                                                                document
                                                            ).on("click", null);
                                                            d3.select(".mats")
                                                                .selectAll(
                                                                    ".procVis"
                                                                )
                                                                .remove();
                                                        }}
                                                        checked={isGraphView}
                                                        labels={[
                                                            "Graph View",
                                                            "Matrix View",
                                                        ]}
                                                    />
                                                    <Hint
                                                        text={
                                                            "Change the view of GNN model"
                                                        }
                                                    />
                                                </div>
                                                <div className="flex gap-x-4 colorLegend">
                                                    <ColorLegend />
                                                </div>
                                            </div>

                                            {/* 根据 isGraphView 显示对应的视图 */}
                                            <div
                                                className={styles.vizContainer}
                                            >
                                                {model.includes("GCN - graph classification") ? (
                                                    isGraphView ? (
                                                        <GraphVisualizer
                                                            graph_path={
                                                                graphList[
                                                                    selectedGraph
                                                                ]
                                                            }
                                                            intmData={intmData}
                                                            changed={changedG}
                                                            predicted={
                                                                predicted
                                                            }
                                                            selectedButtons={
                                                                selectedButtons
                                                            }
                                                            simulationLoading={
                                                                simulationLoading
                                                            }
                                                            setSimulation={
                                                                setSimulation
                                                            }
                                                            innerComputationMode={
                                                                modelType
                                                            }
                                                            onLoadComplete={() => {
                                                                if (
                                                                    model.includes(
                                                                        "link prediction"
                                                                    )
                                                                ) {
                                                                    setIsLoading(
                                                                        false
                                                                    );
                                                                }
                                                            }}
                                                            simGraphData={
                                                                simGraphData
                                                            }
                                                            sandBoxMode={
                                                                sandBoxMode
                                                            }
                                                            nodePositions={nodePositions}
                                                        />
                                                    ) : (
                                                        <MatricesVisualizer
                                                            graph_path={
                                                                graphList[
                                                                    selectedGraph
                                                                ]
                                                            }
                                                            intmData={intmData}
                                                            changed={changedG}
                                                            predicted={
                                                                predicted
                                                            }
                                                            selectedButtons={
                                                                selectedButtons
                                                            }
                                                            onLoadComplete={() =>
                                                                setIsLoading(
                                                                    false
                                                                )
                                                            }
                                                            simGraphData={
                                                                simGraphData
                                                            }
                                                            sandBoxMode={
                                                                sandBoxMode
                                                            }
                                                        />
                                                    )
                                                ) : model.includes("GCN - node classification") ? (
                                                    isGraphView ? (
                                                        <NodeGraphVisualizer
                                                            graph_path={
                                                                nodeList[
                                                                    selectedGraph
                                                                ]
                                                            }
                                                            intmData={intmData}
                                                            changed={changedG}
                                                            predicted={
                                                                predicted
                                                            }
                                                            selectedButtons={
                                                                selectedButtons
                                                            }
                                                            simulationLoading={
                                                                simulationLoading
                                                            }
                                                            setSimulation={
                                                                setSimulation
                                                            }
                                                            innerComputationMode={
                                                                modelType
                                                            }
                                                            onLoadComplete={() =>
                                                                setIsLoading(
                                                                    false
                                                                )
                                                            }
                                                            simGraphData={
                                                                simGraphData
                                                            }
                                                            sandBoxMode={
                                                                sandBoxMode
                                                            }
                                                            nodePositions={nodePositions}
                                                        />
                                                    ) : (
                                                        <NodeMatricesVisualizer
                                                            graph_path={
                                                                nodeList[
                                                                    selectedGraph
                                                                ]
                                                            }
                                                            intmData={intmData}
                                                            changed={changedG}
                                                            predicted={
                                                                predicted
                                                            }
                                                            selectedButtons={
                                                                selectedButtons
                                                            }
                                                            onLoadComplete={() =>
                                                                setIsLoading(
                                                                    false
                                                                )
                                                            }
                                                            simGraphData={
                                                                simGraphData
                                                            }
                                                            sandBoxMode={
                                                                sandBoxMode
                                                            }
                                                        />
                                                    )
                                                ) : isGraphView ? (
                                                    <LinkGraphVisualizer
                                                        graph_path={
                                                            linkList[
                                                                selectedGraph
                                                            ]
                                                        }
                                                        intmData={intmData}
                                                        changed={changedG}
                                                        predicted={predicted}
                                                        selectedButtons={
                                                            selectedButtons
                                                        }
                                                        simulationLoading={
                                                            simulationLoading
                                                        }
                                                        setSimulation={
                                                            setSimulation
                                                        }
                                                        hubNodeA={hubNodeA}
                                                        hubNodeB={hubNodeB}
                                                        innerComputationMode={
                                                            modelType
                                                        }
                                                        onLoadComplete={() =>
                                                            setIsLoading(false)
                                                        }
                                                    />
                                                ) : (
                                                    <LinkMatricesVisualizer
                                                        graph_path={
                                                            linkList[
                                                                selectedGraph
                                                            ]
                                                        }
                                                        intmData={intmData}
                                                        changed={changedG}
                                                        predicted={predicted}
                                                        selectedButtons={
                                                            selectedButtons
                                                        }
                                                        hubNodeA={hubNodeA}
                                                        hubNodeB={hubNodeB}
                                                        innerComputationMode={
                                                            modelType
                                                        }
                                                        onLoadComplete={() =>
                                                            setIsLoading(false)
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <Footer />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
