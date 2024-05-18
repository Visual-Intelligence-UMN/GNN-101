import Head from 'next/head';
import React, { useRef, useState } from 'react';
import GraphVisualizer from './GraphVisualizer';
import ClassifyGraph from './FileUpload';
import { IntmData } from './FileUpload';


export default function Home() {
  const [graphData, setGraphData] = useState<any>(null);
  const [selectedGraph, setSelectedGraph] = useState<string>("./input_graph.json")
  const inputRef = useRef<HTMLInputElement>(null);
  const [outputData, setOutputData] = useState(null);
  const [path, setPath] = useState("./json_data/input_graph0.json");
  

  //intermediate output
  const [intmData, setIntmData] = useState<IntmData | null>(null);

  function handleDataComm(data:any){
    setIntmData(data);
    console.log("SET!", intmData);
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
      <ClassifyGraph graph_path={path} dataComm={handleDataComm}/>
      <h2>Visualization</h2>
      <GraphVisualizer graph_path={selectedGraph} intmData={intmData}/>
    </div>
  );
}