import { useEffect } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import * as d3 from "d3";

//text panel
export const DescriptionPanel = ()=>{
    return (
        <Panel defaultSize={30} minSize={20}>
          <h1 className="text-2xl font-bold">What is an GNN model?</h1>
          aaaaaaaaaaa
          <h1 className="text-2xl font-bold">How to interact with this demo?</h1>
          bbbbbbbbbbb
        </Panel>
    );
}

//helper function for graph selector, generate a list of graphs to select
export function graph_list_generate(num: number){
    let res = [];
    res.push("./input_graph.json");
    for(let i=0; i<num; i++){
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
  
export const GraphSelector: React.FC<GraphSelectorProps> = ({ selectedGraph, handleChange, graphList }) => {
    return (
      <select value={selectedGraph} onChange={handleChange}>
        {graphList.map((item, index) => (
          <option key={index} value={item}>Graph {index}</option>
        ))}
      </select>
    );
};

//prediction result visualizer
interface PredictionVisualizerProps {
    result: number[];
}

export const PredictionVisualizer: React.FC<PredictionVisualizerProps> = ({result})=>{
    useEffect(()=>{
        //console.log("RESULTS", result1, result2);
        //VIS
        const width = 500;
        const height = 50;

        d3.select("#predvis").selectAll("svg").remove();
        const svg = d3.select("#predvis").append("svg").attr("width", width).attr("height", height);
        const bars = svg.selectAll("rect")
            .data(result)
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d, i){return i*25;})
            .attr("height", 20)
            .attr("width", function(d, i){return d*200;})
            .attr("fill", "teal");
        
        const texts = svg.selectAll("text")
            .data(result)
            .enter()
            .append("text")
            .text(function(d, i){return d*100;})
            .attr("x", function(d, i){return d*200;})
            .attr("y", function(d, i){return i*25+12.5;})
            .attr("font-family","sans-serif")
            .attr("font-size","10px")
            .attr("fill","black")
            .attr("text-anchor", "left");
    },
    [result]);

    return (
        <div
            id='predvis'
        >
        </div>
    )
}



//graph selector
interface ViewSelectorProps {
    handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  }
  
export const ViewSelector: React.FC<ViewSelectorProps> = ({ handleChange }) => {
    return (
        <select onChange={(e)=>{handleChange(e)}}>
            <option value="false">Matrices View</option>
            <option value="true">Graphs View</option>
        </select>
    );
};