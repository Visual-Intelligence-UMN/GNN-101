import Head from 'next/head';
import React, { useRef, useState } from 'react';
import GraphVisualizer from './GraphVisualizer';
import ClassifyGraph from './FileUpload';
import MatricesVisualizer from './MatricesVisualizer';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { DescriptionPanel, GraphSelector, graph_list_generate, ViewSelector, Hint } from "./WebUtils"

export default function Home() {
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedGraph, setSelectedGraph] = useState<string>("./input_graph.json")
  const inputRef = useRef<HTMLInputElement>(null);
  const [outputData, setOutputData] = useState(null);
  const [path, setPath] = useState("./json_data/input_graph0.json");
  const [isMat, setIsMat] = useState(false);
  const [changedG, setChangedG] = useState(true);

  //intermediate output
  const [intmData, setIntmData] = useState<null | JSON>(null);

  const graphList = graph_list_generate(3);

  function handleDataComm(data:any){
    setIntmData(data);
    console.log("SET!", intmData);
  }

  function handleChangedComm(data:boolean){
    setChangedG(data);
    console.log("SET Changed!", data);
  }

  return (
    <div className='bg-white min-h-screen text-black'>
      <PanelGroup direction='horizontal'>
        <DescriptionPanel />
        <PanelResizeHandle className="w-1 bg-gray-200"/>
        <Panel className='ml-4'>
      <Head>
        <title>Graph Neural Network Visualization</title>
      </Head>
      <h1 className="text-2xl font-bold">Graph Neural Network Visualization</h1>
      <hr className="border-t border-gray-300 my-4"></hr>
      <div className="flex gap-x-4">
        <div><h2 className="text-xl font-semibold">GNN Architecture</h2></div>
          <div>
          <div className="flex justify-center gap-2">
            <Hint text={"Here's the Architecture of the GNN"} />
            <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded">
              Input
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">
              GNNConv1
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">
            GNNConv2
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded">
            GNNConv3
            </button>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">
              Global Mean Pooling
            </button>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded">
              FC
            </button>
            <button className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded">
              Output
            </button>
          </div>
        </div>
      </div>


      <div className="flex gap-x-4">
        <div><h2 className="text-xl font-semibold">Data</h2></div>
        <div className="flex gap-x-4">
        <Hint text={"select a graph"} />
          <div>
            <GraphSelector 
              selectedGraph={selectedGraph} 
              handleChange={(e:any) => {setSelectedGraph(e.target.value); setPath(e.target.value); setChangedG(true);}} 
              graphList={graphList} 
            />
          </div>
        </div>
      </div>
      <ClassifyGraph graph_path={path} dataComm={handleDataComm} changedComm={handleChangedComm} changed={changedG}/>
      {
        isMat ? 
        <>
        <div className="flex gap-x-4">
        <div className="flex gap-x-4">
          <h2 className="text-xl font-semibold">Network Visualization</h2>
          <Hint text={"Change the View of GNN model"}/>
          </div>
          <div>
          <ViewSelector handleChange={(e)=>{
            if(e.target.value==="true"){setIsMat(true);console.log("mat true", isMat);setChangedG(true);}
            else{setIsMat(false);console.log("mat false", isMat);setChangedG(true);}
          }}/>
          </div>
          </div>
          <GraphVisualizer graph_path={selectedGraph} intmData={intmData} changed={changedG}/> 
        </>
        :
        <>
        <div className="flex gap-x-4">
        <div className="flex gap-x-4">
          <h2 className="text-xl font-semibold">Matrices Visualization</h2>
          <Hint text={"Change the View of GNN model"}/>
          </div>
          <div>
          <ViewSelector handleChange={(e)=>{
            if(e.target.value==="true"){setIsMat(true);console.log("mat true", isMat);setChangedG(true);}
            else{setIsMat(false);console.log("mat false", isMat);setChangedG(true);}
          }}/>
          </div>
          </div>
          <MatricesVisualizer graph_path={selectedGraph} intmData={intmData} changed={changedG}/>
        </>
      }
      </Panel>
      </PanelGroup>
    </div>
  );
}