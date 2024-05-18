import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { graph_to_matrix, prepMatrices, load_json, matrix_to_hmap, get_axis_gdata } from '../utils/utils';
import { IntmData } from './FileUpload';
interface MatricesVisualizerProps {
  graph_path: string;  
  intmData: null | IntmData; 
  changed: boolean;
}

const MatricesVisualizer: React.FC<MatricesVisualizerProps>=({graph_path, intmData, changed}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  //const lastIntmData = useRef(intmData);

  // This is really messy but init will stay at the top to remain in the scope of all functions
  
  console.log("updated",intmData);
  if(intmData != null){
    console.log("From Visualizer:", intmData);
  }

  useEffect(()=>{
    const init = async (graphs: any[]) => {

      console.log("intmData", intmData);
      if(intmData != null){
        console.log("From Visualizer:", intmData);
      }


      console.log("path ", graph_path);
      let allNodes: any[] = [];
      const gridSize = 500;
      const margin = { top: 10, right: 80, bottom: 30, left: 80 };
      const width = (gridSize + margin.left + margin.right) * 3;
      const height = (gridSize + margin.top + margin.bottom) * 3;
      
      // Append the SVG object to the body of the page
      console.log(graphs);
      d3.select('#matvis').selectAll('svg').remove();
      const svg = d3
          .select("#matvis")
          .append("svg")
          .attr("width", width)
          .attr("height", height);
      
      graphs.forEach((gData, i) => {
          console.log("i",i)
          const xOffset = i * 500 + 50;
          const g = svg
              .append("g")
              .attr("transform", `translate(${xOffset + i * 50},${margin.top})`);
          //do the real thing: visualize the matrices
          // set the dimensions and margins of the graph
          // Labels of row and columns
          var myGroups = get_axis_gdata(gData);
          var myVars = get_axis_gdata(gData);

          // Build X scales and axis:
          var x = d3.scaleBand()
          .range([ 0, gridSize ])
          .domain(myGroups)
          .padding(0.01);
          g.append("g")
          .attr("transform", `translate(0,${gridSize})`)
          .call(d3.axisBottom(x))

          // Build X scales and axis:
          var y = d3.scaleBand()
          .range([0, gridSize ])
          .domain(myVars)
          .padding(0.01);
          g.append("g")
          .call(d3.axisLeft(y));

          // Build color scale
          var myColor = d3.scaleLinear<string>()
          .range(["white", "#69b3a2"])
          .domain([1,100])

          interface HeatmapData{
            group: string; 
            variable: string; 
            value: number;
          }

          const data = matrix_to_hmap(gData);
          console.log("accepted data:", data);
          // 过滤掉未定义的数据项
          const filteredData = data.filter((d): d is HeatmapData => !!d);

          var tooltip = d3.select("#matvis")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

          // Three function that change the tooltip when user hover / move / leave a cell
          var mouseover = (event: MouseEvent, d: { value: number }) => {
            tooltip
              .style("opacity", 1);
            d3.select(event.currentTarget as HTMLElement)  // 明确转换为HTMLElement
              .style("stroke", "black")
              .style("opacity", 1);
          };
          
          var mousemove = (event: MouseEvent, d: { value: number }) => {
            //console.log("move");
            const [x, y] = d3.pointer(event);  // 使用传递给函数的事件对象
            tooltip
              .html(`The exact value of<br>this cell is: ${d.value}`)
              .style("left", (x + 70) + "px")
              .style("top", y + "px");
          };
          
          var mouseleave = (event: MouseEvent, d: { value: number }) => {
            tooltip
              .style("opacity", 0);
            d3.select(event.currentTarget as HTMLElement)  // 使用event.currentTarget
              .style("stroke", "none")
              .style("opacity", 0.8);
          };

          // 使用处理后的数据绘制图形
          g.selectAll("rect")
            .data(data, (d:any) => d.group + ':' + d.variable)
            .enter()
            .append("rect")
            .attr("x", (d: HeatmapData) => x(d.group)!)
            .attr("y", (d: HeatmapData) => y(d.variable)!)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", (d: HeatmapData) => myColor(d.value))
            .style("stroke-width", 4)
            .style("stroke", "none")
            .style("opacity", 0.8)
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
      });
    };

    const processDataAndRunD3 = async (num: number) => {
      try {
        setIsLoading(true);
        // Process data
        console.log("path matvis", graph_path);
        const data = await load_json(graph_path)
        console.log("data matvis", data);
        const processedData = await graph_to_matrix(data);
        console.log("pData matvis", processedData);
        const graphsData = await prepMatrices(num, processedData);
        console.log("gData", graphsData);
        // Initialize and run D3 visualization with processe  d data
        await init(graphsData);
      } catch (error) {
        console.error('Error in processDataAndRunD3:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if(intmData==null || changed){
      processDataAndRunD3(1);
    }else{
      processDataAndRunD3(3);
    }
    console.log('i fire once')
  },[graph_path, intmData, changed]);

  return <div id="matvis" ref={containerRef} style={{
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    height: 'auto',
    overflow: 'auto', // this enables scrollbars if content overflows
    overflowX: 'auto',
  }}></div>;
}

export default MatricesVisualizer;