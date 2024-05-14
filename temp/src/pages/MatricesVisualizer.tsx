import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { graph_to_matrix, prepMatrices, load_json } from '../utils/utils';

interface MatricesVisualizerProps {
  graph_path: string;  
  intmData: null | JSON
}

const MatricesVisualizer: React.FC<MatricesVisualizerProps>=({graph_path, intmData}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);


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
          const xOffset = i * 500 + 500;
          const g = svg
              .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);
          //do the real thing: visualize the matrices
          // set the dimensions and margins of the graph
          // Labels of row and columns
          var myGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
          var myVars = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10"]

          // Build X scales and axis:
          var x = d3.scaleBand()
          .range([ 0, gridSize ])
          .domain(myGroups)
          .padding(0.01);
          svg.append("g")
          .attr("transform", `translate(0,${gridSize})`)
          .call(d3.axisBottom(x))

          // Build X scales and axis:
          var y = d3.scaleBand()
          .range([0, gridSize ])
          .domain(myVars)
          .padding(0.01);
          svg.append("g")
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

          //Read the data
          d3.csv<HeatmapData>("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/heatmap_data.csv", function(d: d3.DSVRowString): HeatmapData | undefined {
          // 确保数据行包含所有必要的字段
          if (!d.group || !d.variable || d.value === undefined) {
            return undefined;  // 跳过不完整或错误的数据行
          }
          return {
            group: d.group,
            variable: d.variable,
            value: +d.value  // 将字符串转换为数字
          };
        }).then(data => {
          // 过滤掉未定义的数据项
          const filteredData = data.filter((d): d is HeatmapData => !!d);

          // 使用处理后的数据绘制图形
          const svg = d3.select('svg');
          svg.selectAll("rect")
            .data(filteredData, d => d.group + ':' + d.variable)
            .enter()
            .append("rect")
            .attr("x", (d: HeatmapData) => x(d.group)!)
            .attr("y", (d: HeatmapData) => y(d.variable)!)
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .style("fill", (d: HeatmapData) => myColor(d.value));
        }).catch(error => {
          console.error("Error loading or processing data:", error);
        });

      });
    };

    const processDataAndRunD3 = async () => {
      try {
        setIsLoading(true);
        // Process data
        console.log("path matvis", graph_path);
        const data = await load_json(graph_path)
        console.log("data matvis", data);
        const processedData = await graph_to_matrix(data);
        console.log("pData matvis", processedData);
        const graphsData = await prepMatrices(3, processedData);
        console.log("gData", graphsData);
        // Initialize and run D3 visualization with processe  d data
        await init(graphsData);
      } catch (error) {
        console.error('Error in processDataAndRunD3:', error);
      } finally {
        setIsLoading(false);
      }
    };

    processDataAndRunD3();
    console.log('i fire once')
  },[graph_path, intmData]);

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