import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import GraphVisualizer from "./GraphVisualizer";
import ClassifyGraph from "./ClassifyGraph";
// import { CSSTransition } from 'react-transition-group';
import MatricesVisualizer from "./MatricesVisualizer";
import { IntmData, IntmDataNode } from "../types";
import {
    graphList,
    linkList,
    modelList,
    nodeList,
    DatasetInfo,
    nodeSelectionList,
    modelTypeList,
    midGraphNodeSelectionList,
} from "../utils/const";
import Sidebar from "./Sidebar";
import styles from "./index.module.css";
import * as d3 from "d3";
import { Steps } from 'intro.js-react';
import { INTRO_STEPS } from "../utils/const"
import 'intro.js/introjs.css';

import {
    Selector,
    Hint,
    ButtonChain,
    ViewSwitch,
    GraphAnalysisViewer,
    NodeClassifierButtonChain,
    LinkClassifierButtonChain,
    NodeSelector,
    PredictionVisualizer,
} from "../components/WebUtils";
import { Footer, NavBar } from "../components/Surfaces";
import { Inter } from "@next/font/google";
import NodeMatricesVisualizer from "./node_classifier/NodeMatrixVisualizer";
import NodeGraphVisualizer from "./node_classifier/NodeGraphVisualizer";
import { mod } from "mathjs";
import LinkMatricesVisualizer from "./link_classifier/LinkMatrixVisualizer";

import LinkGraphVisualizer from "./link_classifier/LinkGraphVisualizer";

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

export default function Home() {
    const [model, setModel] = useState("GCN - graph classification");
    const [selectedGraph, setSelectedGraph] = useState("graph_2");
    const introRef = useRef<Steps>(null);
    const [outputData, setOutputData] = useState(null);

    const [isGraphView, setIsGraphView] = useState(true);
    const [changedG, setChangedG] = useState(true);
    const [step, setStep] = useState(1);
    const [show, setShow] = useState(false);
    const [predicted, setPredicted] = useState(false);
    const [simulationLoading, setSimulation] = useState(false);

    const [hubNodeA, setHubNodeA] = useState(241);
    const [hubNodeB, setHubNodeB] = useState(109);

    const [modelType, setModelType] = useState("GCN");

    //intermediate output
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

    function handleGraphSelection(
        e: React.ChangeEvent<HTMLSelectElement>
    ): void {
        setSelectedGraph(e.target.value);
        setChangedG(true);
        setProbabilities([]);
        setPredicted(false);
        setSimulation(false);
    }

    const startIntro = () => {
        if (introRef.current) {
            introRef.current.introJs.start();
        }
    }


    useEffect(() => {
        (document.body.style as any).zoom = "70%";

    }, []);

    useEffect(() => {
        if (predicted && introRef.current) {
            introRef.current.introJs.exit();
        }
    }, [predicted]
    )

    useEffect(() => {
        
    }, [model]);


    function handleNodeSelection(
        e: React.ChangeEvent<HTMLSelectElement>
    ): void {
        //setSelectedGraph(e.target.value);
        setChangedG(true);
        setProbabilities([]);
        setPredicted(false);
        setSimulation(false);
    }



    return (
        <div >
            <Steps
                enabled={true}
                steps={INTRO_STEPS}
                initialStep={0}
                onExit={() => { }}
                ref={introRef}
            />
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
                        {/* <PanelGroup direction="horizontal"> */}

                    <div className={` ${styles.body}  grid grid-cols-4 `} >
                        <div id="text-panel">
                        <Sidebar
                            isGraphView={isGraphView}
                            setIsGraphView={setIsGraphView}
                            predicted={predicted}
                            modelMode={model}
                        />
                        </div>
                        {/* <Panel className="ml-4"> */}
                        {/* GNN model */}
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
                                        <h2 className="text-xl">
                                            Model - Task
                                        </h2>
                                        <Selector
                                                selectedOption={model}
                                                handleChange={(e) => {
                                                    const newModel = e.target.value;
                                                    setModel(newModel);
                                                    setPredicted(false);
                                                    setSimulation(false);
                                                    setProbabilities([]);
                                                    setIntmData(null);
                                                    if(newModel.includes("GAT")){
                                                        setModelType("GAT");
                                                        setSelectedGraph("twitch_EN");
                                                        setHubNodeA(148);
                                                        setHubNodeB(407);
                                                    }else if(newModel.includes("GraphSAGE")){
                                                        setModelType("GraphSAGE");
                                                        setSelectedGraph("twitch_EN");
                                                        setHubNodeA(317);
                                                        setHubNodeB(784);
                                                    }else if(newModel.includes("GCN")){
                                                        setModelType("GCN");
                                                        if(newModel.includes("graph classification")){
                                                            setSelectedGraph("graph_2");
                                                        }else if(newModel.includes("node classification")){
                                                            setSelectedGraph("karate");
                                                        }else if(newModel.includes("link classification")){
                                                            setSelectedGraph("twitch_EN");
                                                            setHubNodeA(148);
                                                            setHubNodeB(407);
                                                        }
                                                    }
                                                    }
                                                } 
                                                OptionList={Object.keys(modelList)} id={""}                                        />
                                    </div>

                                    <div id="model-architecture">
                                    {model == "GCN - graph classification" ? (
                                            <ButtonChain
                                                selectedButtons={selectedButtons}
                                                setSelectedButtons={
                                                setSelectedButtons
                                            }
                                                predicted={predicted}
                                            />
                                        ) : model == "GCN - node classification" ? (
                                            <NodeClassifierButtonChain
                                                selectedButtons={selectedButtons}
                                                setSelectedButtons={
                                                setSelectedButtons
                                            }
                                                predicted={predicted}
                                            />
                                        ) : (
                                            <LinkClassifierButtonChain
                                                selectedButtons={selectedButtons}
                                                setSelectedButtons={
                                                setSelectedButtons
                                            }
                                                predicted={predicted}
                                            innerComputationMode={modelType}
                                            />
                                        )}
                                </div>
                                </div>
                            </div>
                            <hr className="border-t border-gray-300 my-4"></hr>

                            {/* graph data */}
                            {/* graph data */}
                            <div>
                                <div className="flex gap-x-4 items-center  mb-3 ">
                                    <h1 className="text-3xl font-black min-w-48">
                                        Input Graph{" "}
                                    </h1>
                                    <div className="flex flex-row gap-x-4">
                                        <div className="flex items-center gap-x-4 ">
                                            <div className={inter3.className}>
                                                {model ==
                                                "GCN - graph classification" ? (
                                                    <>
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
                                                ) : model ==
                                                  "GCN - node classification" ? (
                                                    //   <Selector
                                                    //     selectedOption={selectedGraph}
                                                    //     handleChange={handleGraphSelection}
                                                    //     OptionList={Object.keys(nodeList)}
                                                    //   />

                                                    <span className="text-2xl">
                                                        Zachary&apos;s Karate
                                                        Club{" "}
                                                    </span>
                                                ) : (
                                                    <span className="text-2xl">
                                                        Twitch Users{" "}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            {selectedGraph &&
                                            (linkList[selectedGraph] ||
                                                graphList[selectedGraph] ||
                                                nodeList[selectedGraph]) ? (
                                                model ==
                                                "GCN - graph classification" ? (
                                                    <GraphAnalysisViewer
                                                        path={
                                                            graphList[
                                                                selectedGraph
                                                            ]
                                                        }
                                                    />
                                                ) : model ==
                                                  "GCN - node classification" ? (
                                                    <GraphAnalysisViewer
                                                        path={
                                                            nodeList[
                                                                selectedGraph
                                                            ]
                                                        }
                                                    />
                                                ) : (
                                                    <GraphAnalysisViewer
                                                        path={
                                                            linkList[
                                                                selectedGraph
                                                            ]
                                                        }
                                                    />
                                                )
                                            ) : null}
                                        </div>
                                    </div>

                                    {model.includes("link classification") ? (
                                        model.includes("GAT") || model.includes("GCN")?
                                        <>
                                            Predict a link from node
                                            <NodeSelector
                                                nodeList={nodeSelectionList}
                                                selectedNode={hubNodeA}
                                                dependNode={hubNodeB}
                                                setSelectedNode={setHubNodeA}
                                                handleChange={
                                                    handleNodeSelection
                                                }
                                            />
                                            to node
                                            <NodeSelector
                                                nodeList={nodeSelectionList}
                                                selectedNode={hubNodeB}
                                                dependNode={hubNodeA}
                                                setSelectedNode={setHubNodeB}
                                                handleChange={
                                                    handleNodeSelection
                                                }
                                            />

                                        </>:
                                        <>
                                        Predict a link from node(GraphSAGE)
                                        <NodeSelector
                                            nodeList={midGraphNodeSelectionList}
                                            selectedNode={hubNodeA}
                                            dependNode={hubNodeB}
                                            setSelectedNode={setHubNodeA}
                                            handleChange={
                                                handleNodeSelection
                                            }
                                        />
                                        to node
                                        <NodeSelector
                                            nodeList={midGraphNodeSelectionList}
                                            selectedNode={hubNodeB}
                                            dependNode={hubNodeA}
                                            setSelectedNode={setHubNodeB}
                                            handleChange={
                                                handleNodeSelection
                                            }
                                        />

                                    </>

                                    ) : (
                                        <></>
                                    )}
                                </div>
                                <p id="dataset-description">{DatasetInfo[model]}</p>

                                <hr className="border-t border-gray-300 my-4"></hr>

                                {/* model visualization */}

                                <div className="flex gap-x-4 items-center">
                                    <div className="flex gap-x-4">
                                        <h2 className="text-3xl font-black">
                                            Inner Model Visualization
                                        </h2>
                                    </div>
                                    <div className="flex gap-x-4">
                                        <ViewSwitch
                                            handleChange={() => {
                                                setIsGraphView(!isGraphView);
                                                setSimulation(false);
                                                d3.select(document).on(
                                                    "click",
                                                    null
                                                );
                                                d3.select(".mats")
                                                    .selectAll(".procVis")
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
                                </div>
                            </div>

                            <div className={styles.vizContainer}>
                                {model == "GCN - graph classification" ? (
                                    isGraphView ? (
                                        <>
                                            <GraphVisualizer
                                                graph_path={
                                                    graphList[selectedGraph]
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
                                                setSimulation={setSimulation}
                                                innerComputationMode={modelType}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <MatricesVisualizer
                                                graph_path={
                                                    graphList[selectedGraph]
                                                }
                                                intmData={intmData}
                                                changed={changedG}
                                                predicted={predicted}
                                                selectedButtons={
                                                    selectedButtons
                                                }
                                            />
                                        </>
                                    )
                                ) : model == "GCN - node classification" ? (
                                    isGraphView ? (
                                        <NodeGraphVisualizer
                                            graph_path={nodeList[selectedGraph]}
                                            intmData={intmData}
                                            changed={changedG}
                                            predicted={predicted}
                                            selectedButtons={selectedButtons}
                                            simulationLoading={
                                                simulationLoading
                                            }
                                            setSimulation={setSimulation}
                                            innerComputationMode={modelType}
                                        />
                                    ) : (
                                        <NodeMatricesVisualizer
                                            graph_path={nodeList[selectedGraph]}
                                            intmData={intmData}
                                            changed={changedG}
                                            predicted={predicted}
                                            selectedButtons={selectedButtons}
                                        />
                                    )
                                ) : isGraphView ? (
                                    <LinkGraphVisualizer
                                        graph_path={linkList[selectedGraph]}
                                        intmData={intmData}
                                        changed={changedG}
                                        predicted={predicted}
                                        selectedButtons={selectedButtons}
                                        simulationLoading={simulationLoading}
                                        setSimulation={setSimulation}
                                        hubNodeA={hubNodeA}
                                        hubNodeB={hubNodeB}
                                        innerComputationMode={modelType}
                                    />
                                ) : (
                                    <LinkMatricesVisualizer
                                        graph_path={linkList[selectedGraph]}
                                        intmData={intmData}
                                        changed={changedG}
                                        predicted={predicted}
                                        selectedButtons={selectedButtons}
                                        hubNodeA={hubNodeA}
                                        hubNodeB={hubNodeB}
                                        innerComputationMode={modelType}
                                    />
                                )}

                                {/* overlay text on visualizer when not predicted */}
                                {probabilities.length == 0 && (
                                    <div
                                        className="absolute top-1/2"
                                        style={{ right: "300px" }}
                                    >
                                        <h1 className="text-4xl text-gray-300">
                                            Model Visualization will show after
                                            prediction
                                        </h1>

                                        {model == "GCN - graph classification" ? (
                                            <ClassifyGraph
                                                graphPath={
                                                    graphList[selectedGraph]
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
                                            />
                                        ) : (
                                            <ClassifyGraph
                                                graphPath={
                                                    nodeList[selectedGraph]
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
                                            />
                                        )}
                                    </div>
                                )}
                                {/* </Panel> */}
                                {/* </PanelGroup> */}
                            </div>
                        </div>
                    </div>

                    <Footer />
                </div>
            )}
        </main>
        </div>
    );
}