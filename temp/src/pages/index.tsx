import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import GraphVisualizer from "./GraphVisualizer";
import ClassifyGraph, { IntmData } from "./FileUpload";
import MatricesVisualizer from "./MatricesVisualizer";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
    DescriptionPanel,
    GraphSelector,
    graph_list_generate,
    ViewSelector,
    Hint,
    ButtonChain,
    ViewSwitch,
    GraphAnalysisViewer,
} from "./WebUtils";
import {Inter} from 'next/font/google';

const inter = Inter({
    variable: '--font-inter',
    weight: '200',
    subsets: ['latin-ext'],
  })


export default function Home() {
    const [graphData, setGraphData] = useState<any>(null);
    const [selectedGraph, setSelectedGraph] =
        useState<string>("./input_graph.json");
    const inputRef = useRef<HTMLInputElement>(null);
    const [outputData, setOutputData] = useState(null);
    const [path, setPath] = useState("./json_data/input_graph0.json");
    const [isMat, setIsMat] = useState(true);
    const [changedG, setChangedG] = useState(true);
    const [step, setStep] = useState(0);
    
    //intermediate output
    const [intmData, setIntmData] = useState<IntmData | null>(null);

    const graphList = graph_list_generate(3);

    function handleDataComm(data: any) {
        setIntmData(data);
        console.log("SET!", intmData);
    }

    function handleChangedComm(data: boolean) {
        setChangedG(data);
        console.log("SET Changed!", data);
    }


    useEffect(() => {
        if (step < 2) {
            const timer = setTimeout(() => {
                setStep(step + 1);
            }, 3500); // Change text every 3 seconds
            return () => clearTimeout(timer);
        }
    }, [step]);

    return (
        <main className={inter.className}>
            {step === 0 &&
                <div className="bg-white min-h-screen flex justify-center items-center">
                    <h1 className="animate-dissolve text-6xl font-bold text-gradient-stroke" data-text="Welcome to a Graph Neural Network Visualizer"/>
                </div>}
            {step === 1 &&
                <div className="bg-white min-h-screen flex justify-center items-center">
                    <h1 className="animate-dissolve text-6xl font-bold text-gradient-stroke" data-text="Developed solely for your experience"/>
                </div>}
            {step === 2 &&
                <div className="bg-white min-h-screen text-black">
                    <PanelGroup direction="horizontal">
                        <DescriptionPanel />
                        <PanelResizeHandle className="w-1 bg-gray-200" />
                        <Panel className="ml-4">
                            <Head>
                                <title>Graph Neural Network Visualization</title>
                            </Head>
                            <div className="flex gap-x-4">
                                <h1 className="text-2xl font-bold">
                                    Graph Neural Network Visualization
                                </h1>
                                <p className="transform translate-y-[5px]">
                                    A GNN model to help you classify Mutagen and
                                    Non-Mutagen
                                </p>
                            </div>
                            <hr className="border-t border-gray-300 my-4"></hr>
                            {changedG ? <></> : <ButtonChain />}
                            <div className="flex gap-x-4">
                                <div>
                                    <h2 className="text-xl font-semibold">Data</h2>
                                </div>
                                <div className="flex gap-x-4">
                                    <Hint text={"select a graph"} />
                                    <div>
                                        <GraphSelector
                                            selectedGraph={selectedGraph}
                                            handleChange={(e: any) => {
                                                setSelectedGraph(e.target.value);
                                                setPath(e.target.value);
                                                setChangedG(true);
                                            }}
                                            graphList={graphList}
                                        />
                                    </div>
                                </div>
                            </div>
                            <GraphAnalysisViewer path={path} />
                            <ClassifyGraph
                                graph_path={path}
                                dataComm={handleDataComm}
                                changedComm={handleChangedComm}
                                changed={changedG}
                            />
                            {isMat ? (
                                <>
                                    <div className="flex gap-x-4">
                                        <div className="flex gap-x-4">
                                            <h2 className="text-xl font-semibold">
                                                Graphs Visualization
                                            </h2>
                                            <Hint
                                                text={"Change the View of GNN model"}
                                            />
                                        </div>
                                        <div>
                                            <ViewSwitch
                                                handleChange={(e) => {
                                                    if (e === true) {
                                                        setIsMat(true);
                                                        console.log("mat true", isMat);
                                                        setChangedG(true);
                                                    } else {
                                                        setIsMat(false);
                                                        console.log("mat false", isMat);
                                                        setChangedG(true);
                                                    }
                                                }}
                                                current={true}
                                            />
                                        </div>
                                    </div>
                                    <GraphVisualizer
                                        graph_path={selectedGraph}
                                        intmData={intmData}
                                        changed={changedG}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="flex gap-x-4">
                                        <div className="flex gap-x-4">
                                            <h2 className="text-xl font-semibold">
                                                Matrices Visualization
                                            </h2>
                                            <Hint
                                                text={"Change the View of GNN model"}
                                            />
                                        </div>
                                        <div>
                                            <ViewSwitch
                                                handleChange={(e) => {
                                                    if (e === true) {
                                                        setIsMat(true);
                                                        console.log("mat true", isMat);
                                                        setChangedG(true);
                                                    } else {
                                                        setIsMat(false);
                                                        console.log("mat false", isMat);
                                                        setChangedG(true);
                                                    }
                                                }}
                                                current={false}
                                            />
                                        </div>
                                    </div>
                                    <MatricesVisualizer
                                        graph_path={selectedGraph}
                                        intmData={intmData}
                                        changed={changedG}
                                    />
                                </>
                            )}
                        </Panel>
                    </PanelGroup>
                </div>
            }
        </main>
    );
}


