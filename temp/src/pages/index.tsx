import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import { Scrollbar } from 'react-scrollbars-custom';
import GraphVisualizer from "./GraphVisualizer";
import ClassifyGraph, { IntmData } from "./FileUpload";
import { CSSTransition } from 'react-transition-group';
import MatricesVisualizer from "./MatricesVisualizer";
import { PanelGroup, Panel, PanelResizeHandle } from "react-resizable-panels";
import {
    Sidebar,
    GraphSelector,
    graph_list_generate,
    ViewSelector,
    Hint,
    ButtonChain,
    ViewSwitch,
    GraphAnalysisViewer,
} from "./WebUtils";
import { Tooltip } from "react-tooltip";
import { Inter } from '@next/font/google';

export const inter = Inter({
    variable: '--font-inter',
    weight: '500',
    subsets: ['latin-ext'],
})

export const inter2 = Inter({
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
    const [showGraphAnalysis, setShowGraphAnalysis] = useState(false);

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
    useEffect(() => {
        (document.body.style as any).zoom = "67%";

    }, []);
    return (
        <main className={inter.className}>
            {step === 0 &&
                <div style={{ paddingTop: '15%' }} className="bg-white min-h-screen flex justify-center items-center">
                    <h1 className="animate-dissolve text-6xl  font-bold text-gradient-stroke" data-text="Welcome to a Graph Neural Network Visualizer" />
                </div>}
            {step === 1 &&
                <div style={{ paddingTop: '15%' }} className="bg-white min-h-screen flex justify-center items-center">
                    <h1 className="animate-dissolve text-6xl font-bold text-gradient-stroke" data-text="Developed solely for your experience" />
                </div>}
            {step === 2 &&
                <div className="bg-white min-h-screen text-black">
                    <PanelGroup direction="horizontal" >
                        <div className='sidebar'  >
                            <Scrollbar noScrollX={true} removeTracksWhenNotUsed={true} maximalThumbYSize={80} disableTrackYWidthCompensation={true} trackClickBehavior={"jump" as any}

                                trackYProps={{
                                    style: {
                                        width: '15px',
                                        borderRadius: '10px',
                                        backgroundColor: '#f0f0f0',
                                        top: '0',
                                        bottom: '0',
                                    }
                                }}
                                thumbYProps={{
                                    style: {
                                        backgroundColor: '#d9d9d9',
                                        borderRadius: '10px',
                                        boxShadow: '0 5px 6px rgba(0, 0, 0, 0.25)',
                                    }
                                }}
                            >


                                <Sidebar />
                            </Scrollbar>
                        </div>


                        <Panel className="ml-4">
                            <Head>
                                <title>Graph Neural Network Visualization</title>
                            </Head>
                            <div className="flex gap-x-2 items-center" style={{ paddingTop: '40px' }}>
                                <h1 className="text-2xl font-extra-black">
                                    GNN Model
                                </h1>
                                <div className={inter2.className}>
                                <p className="transform translate-y-[3px] text-xl ml-10" style={{fontWeight:0}}>
                                    A binary graph classification model
                                </p>
                                </div>
                            </div>
                            <hr className="border-t border-gray-300 my-4"></hr>
                            {changedG ? <></> : <ButtonChain />}
                            <div className="flex gap-x-4 items-center">
                                <div>
                                    <h2 className="text-xl font-semibold">Data</h2>
                                </div>
                                <div className="flex items-center gap-x-4">
                                    <Hint text={"Select a graph"} />
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
                                    <button
                                        className="transition-transform duration-500 ease-in-out text-2xl"
                                        style={{ transform: `rotate(${showGraphAnalysis ? '90deg' : '0deg'})` }}
                                        onClick={() => setShowGraphAnalysis(!showGraphAnalysis)}
                                        data-tooltip-content={'Click on me to see graph information'}
                                        data-tooltip-id='tooltip'
                                    > ⏵ 
                                        <Tooltip data-tooltip-id='tooltip' />
                                    </button>
                                </div>
                            </div>

                            <CSSTransition in={showGraphAnalysis}
                                timeout={300}
                                classNames="graph"
                                unmountOnExit>
                                <GraphAnalysisViewer path={path} />
                            </CSSTransition>


                            <ClassifyGraph
                                graph_path={path}
                                dataComm={handleDataComm}
                                changedComm={handleChangedComm}
                                changed={changedG}
                            />
                            {isMat ? (
                                <>
                                    <div className="flex gap-x-4 items-center">
                                        <div className="flex gap-x-4">
                                            <h2 className="text-xl font-semibold">
                                                Graphs Visualization
                                            </h2>
                                            <Hint
                                                text={"Change the view of GNN model"}
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