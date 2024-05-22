import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { graph_to_matrix, prepMatrices, load_json, matrix_to_hmap, get_axis_gdata } from '../utils/utils';

interface MatricesVisualizerProps {
  graph_path: string;  
  intmData: null | JSON; 
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
      const gLen = graphs.length;
      const gridSize = 500;
      const margin = { top: 10, right: 80, bottom: 30, left: 80 };
      const width = (gridSize + margin.left + margin.right) * gLen;
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
          .attr("class", "x-axis")
          .attr("transform", `translate(0,${gridSize})`)
          .call(d3.axisBottom(x))

          // Build Y scales and axis:
          var y = d3.scaleBand()
          .range([0, gridSize ])
          .domain(myVars)
          .padding(0.01);
          g.append("g").attr("class", "y-axis")
          .call(d3.axisLeft(y));

          if(i==0){
            d3.selectAll<SVGTextElement, any>(".x-axis text").classed("first", true);
            d3.selectAll<SVGTextElement, any>(".y-axis text").classed("first", true);
          }

          function printAxisTextCoordinates(): void {
            d3.selectAll<SVGTextElement, any>(".x-axis text").each(function() {
                const bbox = this.getBBox();
                console.log(`X Axis Text: [x: ${bbox.x}, y: ${bbox.y}, width: ${bbox.width}, height: ${bbox.height}]`);
            });
        
            d3.selectAll<SVGTextElement, any>(".y-axis text").each(function() {
                const bbox = this.getBBox();
                console.log(`Y Axis Text: [x: ${bbox.x}, y: ${bbox.y}, width: ${bbox.width}, height: ${bbox.height}]`);
            });
        }
        
        printAxisTextCoordinates();
          



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
            d3.select(event.currentTarget as HTMLElement)  
              .style("stroke", "black")
              .style("opacity", 1);
          };
          
          var mousemove = (event: MouseEvent, d: { value: number }) => {
            const rect = (event.target as HTMLElement).getBoundingClientRect();
            tooltip
              .style("opacity", 1)
              .html(`The exact value of<br>this cell is: ${d.value}`)
              .style("left", (rect.left + window.scrollX + 70) + "px")
              .style("top", (rect.top + window.scrollY) + "px");
          };
          
          
          var mouseleave = (event: MouseEvent, d: { value: number }) => {
            tooltip
              .style("opacity", 0);
            d3.select(event.currentTarget as HTMLElement)  
              .style("stroke", "none")
              .style("opacity", 0.8);
          };

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


            g.selectAll(".x-axis text")
            .on("mouseover", function(event) {
              const element = event.target as SVGGraphicsElement;
              const bbox = element.getBBox();
              const cx = bbox.x + bbox.width / 2;
              const cy = bbox.y + bbox.height / 2;
          
              const svgTop = svg.node()!.getBoundingClientRect().top;
              const elementTop = element.getBoundingClientRect().top;
              const relativeY = elementTop - svgTop + bbox.height / 2; // 调整至文本中心或稍上方
  
              const array1: number[][] = Array(8).fill(null).map(() => Array(8).fill(0));
          
              g.append("circle")
                .attr("id", "tmp")
                .attr("cx", cx)
                .attr("cy", relativeY - 10) // 在文本上方一点位置绘制圆
                .attr("r", 10)
                .attr("stroke", "blue")
                .attr("stroke-width", 1)
                .attr("fill", "none");
          
              d3.select(element)
                .style("fill", "red")
                .style("font-weight", "bold");
            })
            .on("mouseout", function(event) {
              const element = event.target as SVGGraphicsElement;
              d3.select(element)
                .style("fill", "black")
                .style("font-weight", "normal");
          
              d3.select("#tmp").remove();
            });
          
  
  
  
            g.selectAll(".y-axis text")
            .on("mouseover", function(event, d){
              const element = event.target as SVGGraphicsElement;
                const bbox = element.getBBox();
                const cx = bbox.x + bbox.width / 2;
                const cy = bbox.y + bbox.height / 2;
  
                const transformAttr = d3.select(element.parentNode as SVGElement).attr('transform');
                let translate = [0, 0];  // 默认为无位移
                if (transformAttr) {
                  const matches = transformAttr.match(/translate\(([^,]+),([^)]+)\)/);
                  if (matches) {
                    translate = matches.slice(1).map(Number);
                  }
                }
                
                const adjustedX = cx + translate[0];
                const adjustedY = cy + translate[1] - 10; // 上移10以放置于文本上方
                const cellSize = 10; // 每个格子的尺寸
            
              if(d3.select(this).attr("class")!= "first"){
              // 创建一个8x8的矩阵tooltip
              const matrixSize = 8;
              
              const tooltipG = d3.select(element.parentNode as SVGGElement)
                .append('g')
                .attr('class', 'matrix-tooltip')
                .attr("x", adjustedX)
                .attr("y", adjustedY)
                .raise();
                //.attr('transform', `translate(${adjustedX}, ${adjustedY})`);
            
              for (let i = 0; i < matrixSize; i++) {
                for (let j = 0; j < matrixSize; j++) {
                  tooltipG.append('rect')
                    .attr('x', -(j+5) * cellSize)
                    .attr('y', i * cellSize)
                    .attr('width', cellSize)
                    .attr('height', cellSize)
                    .attr('fill', 'white')
                    .attr("opacity", 1)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);
                }
              }
            }else{
              const tooltipG = d3.select(element.parentNode as SVGGElement)
                .append('g')
                .attr('class', 'matrix-tooltip')
                .attr("x", adjustedX)
                .attr("y", adjustedY)
                .raise();
                //.attr('transform', `translate(${adjustedX}, ${adjustedY})`);
            
              for (let i = 0; i < 7; i++) {
                  tooltipG.append('rect')
                    .attr('x', -25)
                    .attr('y', i * cellSize)
                    .attr('width', cellSize)
                    .attr('height', cellSize)
                    .attr('fill', 'white')
                    .attr("opacity", 1)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 1);
            }
          }
            
              d3.select(element)
                .style("fill", "red")
                .style("font-weight", "bold");
            })
            .on("mouseout", function(event, d){
              const element = event.target as SVGGraphicsElement;
              d3.select('.matrix-tooltip').remove(); // 移除矩阵tooltip
            
              d3.select(element)
                .style("fill", "black")
                .style("font-weight", "normal");
            });          
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
      processDataAndRunD3(4);
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