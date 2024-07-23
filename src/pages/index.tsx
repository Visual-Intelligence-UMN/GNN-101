import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import GraphVisualizer from "./GraphVisualizer";
import ClassifyGraph from "./ClassifyGraph";
// import { CSSTransition } from 'react-transition-group';
import MatricesVisualizer from "./MatricesVisualizer";
import { IntmData, IntmDataNode } from "../types";
import { graphList, linkList, modelList, nodeList, DatasetInfo } from "../utils/const";
import Sidebar from "./Sidebar";
import styles from "./index.module.css";
import * as d3 from "d3";

import {
  Selector,
  Hint,
  ButtonChain,
  ViewSwitch,
  GraphAnalysisViewer,
  NodeClassifierButtonChain,
  LinkClassifierButtonChain,
} from "../components/WebUtils";
import { Footer, NavBar } from "../components/Surfaces";
import { Inter } from "@next/font/google";
import NodeMatricesVisualizer from "./node_classifier/NodeMatrixVisualizer";
import NodeGraphVisualizer from "./node_classifier/NodeGraphVisualizer";
import { mod } from "mathjs";

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
  const [model, setModel] = useState("graph classification");
  const [selectedGraph, setSelectedGraph] = useState("graph_2");
  const inputRef = useRef<HTMLInputElement>(null);
  const [outputData, setOutputData] = useState(null);

  const [isGraphView, setIsGraphView] = useState(true);
  const [changedG, setChangedG] = useState(true);
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [predicted, setPredicted] = useState(false);
  const [simulationLoading, setSimulation] = useState(false);

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
  const [probabilities, setProbabilities] = useState<number[] | number[][]>([]);

  function handleGraphSelection(e: React.ChangeEvent<HTMLSelectElement>): void {
    console.log("graph handler", e.target.value);
    setSelectedGraph(e.target.value);
    setChangedG(true);
    setProbabilities([]);
    setPredicted(false);
    setSimulation(false);
  }

  useEffect(() => {
    (document.body.style as any).zoom = "70%";
  }, []);

  return (
    <main className={inter.className}>
      <Head>
        <title>Graph Neural Network Visualization</title>
      </Head>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
      ></link>
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
          <NavBar />
          {/* <PanelGroup direction="horizontal"> */}

          <div className={` ${styles.body}  grid grid-cols-4 `}>
            <Sidebar
              isGraphView={isGraphView}
              setIsGraphView={setIsGraphView}
              predicted={predicted}
            />

            {/* <Panel className="ml-4"> */}
            {/* GNN model */}
            <div className={`${styles.rightContainer} col-span-3 ml-4`}>
              <div
                className="flex gap-x-2 items-center"
                style={{ paddingTop: "40px" }}
              >
                <h1 className="text-3xl min-w-48 font-black">GNN Model</h1>
                <Selector
                  selectedOption={model}
                  handleChange={(e) => {
                    const newModel = e.target.value;
                    setModel(newModel);
                    setPredicted(false);
                    setSimulation(false);
                    setProbabilities([]);
                    setIntmData(null);
                    if (newModel === "node classification") {
                      setSelectedGraph("karate");
                    } else if (newModel === "graph classification") {
                      setSelectedGraph("graph_2");
                    } else {
                      setSelectedGraph("twitch_EN");
                    }
                    console.log("selectedGraph from selector", selectedGraph);
                  }}
                  OptionList={Object.keys(modelList)}
                />

                {model == "graph classification" ? (
                  <ButtonChain
                    selectedButtons={selectedButtons}
                    setSelectedButtons={setSelectedButtons}
                    predicted={predicted}
                  />
                ) : model == "node classification" ? (
                  <NodeClassifierButtonChain
                    selectedButtons={selectedButtons}
                    setSelectedButtons={setSelectedButtons}
                    predicted={predicted}
                  />
                ) : (
                  <LinkClassifierButtonChain
                    selectedButtons={selectedButtons}
                    setSelectedButtons={setSelectedButtons}
                    predicted={predicted}
                  />
                )}
              </div>

              <hr className="border-t border-gray-300 my-4"></hr>

              {/* graph data */}
              <div className="flex gap-x-4 items-center  mb-3 ">
                <h1 className="text-3xl font-black min-w-48">Input Graph </h1>

                <div className="flex items-center gap-x-4 ">
                  <div className={inter3.className}>
                    {model == "graph classification" ? (
                      <Selector
                        selectedOption={selectedGraph}
                        handleChange={handleGraphSelection}
                        OptionList={Object.keys(graphList)}
                      />
                    ) : model == "node classification" ? (
                      //   <Selector
                      //     selectedOption={selectedGraph}
                      //     handleChange={handleGraphSelection}
                      //     OptionList={Object.keys(nodeList)}
                      //   />

                      <span className="text-2xl">Zachary&apos;s Karate Club </span>
                    ) : (
                      <Selector
                        selectedOption={selectedGraph}
                        handleChange={handleGraphSelection}
                        OptionList={Object.keys(linkList)}
                      />
                    )}
                    <p>{DatasetInfo[model]}</p>
                  </div>
                </div>

                {selectedGraph &&
                (graphList[selectedGraph] || nodeList[selectedGraph]) ? (
                  model == "graph classification" ? (
                    <GraphAnalysisViewer path={graphList[selectedGraph]} />
                  ) : (
                    <GraphAnalysisViewer path={nodeList[selectedGraph]} />
                  )
                ) : null}
              </div>

              <hr className="border-t border-gray-300 my-4"></hr>

              {/* <ClassifyGraph
                graphPath={graphList[selectedGraph]}
                modelPath={modelList[model]}
                setChangedG={setChangedG}
                setIntmData={setIntmData}
                setPredicted={setPredicted}
                predicted={predicted}
                probabilities={probabilities}
                setProbabilities={setProbabilities}
                simulationLoading={simulationLoading}
              /> */}

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
                      d3.select(document).on("click", null);
                      d3.select(".mats").selectAll(".procVis").remove()
                      
                    }}
                    checked={isGraphView}
                    labels={["Graph View", "Matrix View"]}
                  />
                  <Hint text={"Change the view of GNN model"} />
                </div>
              </div>

              <div className={styles.vizContainer}>
                {model == "graph classification" ? (
                  isGraphView ? (
                    <>
                      <GraphVisualizer
                        graph_path={graphList[selectedGraph]}
                        intmData={intmData}
                        changed={changedG}
                        predicted={predicted}
                        selectedButtons={selectedButtons}
                        simulationLoading={simulationLoading}
                        setSimulation={setSimulation}
                      />
                    </>
                  ) : (
                    <>
                      <MatricesVisualizer
                        graph_path={graphList[selectedGraph]}
                        intmData={intmData}
                        changed={changedG}
                        predicted={predicted}
                        selectedButtons={selectedButtons}
                      />
                    </>
                  )
                ) : model == "node classification" ? (
                  isGraphView ? (
                    <NodeGraphVisualizer
                      graph_path={nodeList[selectedGraph]}
                      intmData={intmData}
                      changed={changedG}
                      predicted={predicted}
                      selectedButtons={selectedButtons}
                      simulationLoading={simulationLoading}
                      setSimulation={setSimulation}
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
                  <>Graph View</>
                ) : (
                  <>Matrix View</>
                )}

                {/* overlay text on visualizer when not predicted */}
                {probabilities.length == 0 && (
                  <div className="absolute top-1/2 left-1/2 ">
                    <h1 className="text-4xl text-gray-300">
                      Model Visualization will show after prediction
                    </h1>

                    {model == "graph classification" ? (
                      <ClassifyGraph
                        graphPath={graphList[selectedGraph]}
                        modelPath={modelList[model]}
                        setChangedG={setChangedG}
                        setIntmData={setIntmData}
                        setPredicted={setPredicted}
                        predicted={predicted}
                        probabilities={probabilities}
                        setProbabilities={setProbabilities}
                        onlyShownButton={true}
                        simulationLoading={simulationLoading}
                      />
                    ) : (
                      <ClassifyGraph
                        graphPath={nodeList[selectedGraph]}
                        modelPath={modelList[model]}
                        setChangedG={setChangedG}
                        setIntmData={setIntmData}
                        setPredicted={setPredicted}
                        predicted={predicted}
                        probabilities={probabilities}
                        setProbabilities={setProbabilities}
                        onlyShownButton={true}
                        simulationLoading={simulationLoading}
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
  );
}
