import Head from 'next/head';
import React, { useRef, useState } from 'react';
import GraphVisualizer from './GraphVisualizer';
import ClassifyGraph from './FileUpload';
import MatricesVisualizer from './MatricesVisualizer';

export default function Home() {
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedGraph, setSelectedGraph] = useState<string>("./input_graph.json")
  const inputRef = useRef<HTMLInputElement>(null);
  const [outputData, setOutputData] = useState(null);
  const [path, setPath] = useState("./json_data/input_graph0.json");
  const [isMat, setIsMat] = useState(false);

  //intermediate output
  const [intmData, setIntmData] = useState<null | JSON>(null);

  function handleDataComm(data:any){
    setIntmData(data);
    console.log("SET!", intmData);
  }

  //Graph Options Menu
  function graphOptionsMenu(){

  }


  return (
    <div className='bg-white min-h-screen text-black'>
      <Head>
        <title>Graph Visualization</title>
      </Head>
      <h1>Graph Visualization</h1>
      <select value={selectedGraph} onChange={(e) => {setSelectedGraph(e.target.value); setPath(e.target.value)}}>
        <option value="./input_graph.json">Graph 0</option>
        <option value="./json_data/input_graph0.json">Graph 1</option>
        <option value="./json_data/input_graph1.json">Graph 2</option>
        <option value="./json_data/input_graph2.json">Graph 3</option>
      </select>
      <select onChange={(e)=>{
        if(e.target.value==="true"){setIsMat(true);console.log("mat true", isMat);}
        else{setIsMat(false);console.log("mat false", isMat);}
      }}>
        <option value="true">Graphs View</option>
        <option value="false">Matrices View</option>
      </select>
      <ClassifyGraph graph_path={path} dataComm={handleDataComm}/>
      
      {
        isMat ? 
        <>
        <h2>Graphs Visualization</h2>
        <GraphVisualizer graph_path={selectedGraph} intmData={intmData}/> 
        </>
        :
        <>
        <h2>Matrices Visualization</h2>
        <MatricesVisualizer graph_path={selectedGraph} intmData={intmData}/>
        </>
      }
    </div>
  );
}