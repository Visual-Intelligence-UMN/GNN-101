import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GraphMatrixVisualizationProps {
  dataFile: string;
  hubNodeA?: number;
  hubNodeB?: number;
  modelType?: string;
}

const elementMap = {
  0: 'C', 1: 'N', 2: 'O', 3: 'F', 4: 'H', 5: 'S', 6: 'Cl'
};

const GraphMatrixVisualization: React.FC<GraphMatrixVisualizationProps> = ({ 
  dataFile, 
  hubNodeA, 
  hubNodeB,
  modelType 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  console.log("GraphMatrixVisualization props:", { dataFile, hubNodeA, hubNodeB, modelType });


  const styles = `
    .container {
      display: flex;
      gap: 20px;
      padding: 20px;
    }
    .view {
      border: 1px solid #ccc;
      padding: 10px;
    }
    .node {
      fill: white;
      stroke: #69b3a2;
      stroke-width: 1.5px;
      cursor: pointer;
    }
    .node.highlighted {
      fill: #006d5b; 
      stroke: #004f41; 
      stroke-width: 2px;
    }
    .link {
      stroke: #aaa;
      stroke-width: 1px;
      stroke-opacity: 0.6;
      cursor: pointer;
    }
    .link.highlighted {
      stroke: #006d5b; 
      stroke-width: 2px;
      stroke-opacity: 1;
    }
    .matrix-cell {
      stroke: #fff;
      stroke-width: 0.5px;
      cursor: pointer;
    }
    .matrix-cell.highlighted {
      fill: #006d5b !important;
      stroke: #004f41;
      stroke-width: 1px;
    }
    .node-label {
      font-size: 10px;
      pointer-events: none;
      text-anchor: middle;
      dominant-baseline: middle;
    }
    .axis-label {
      font-size: 11px;
    }
    .info-container-wrapper {
      display: flex;
      gap: 20px;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      position: relative;
    }
    .info-container {
      background: #f9f9f9;
      padding: 10px 15px;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      font-size: 14px;
      flex: 1;
      min-width: 250px;
      position: relative;
      color: #333;
    }
    .info-title {
      font-size: 16px;
      font-weight: bold;
      position: relative;
      color: #333;
    }
    .info-box {
      position: relative;
      width: 100%;
      background: white;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      font-size: 13px;
      line-height: 1.5;
      z-index: 10;
      margin-top: 10px;
      color: #333;
    }
    @media (max-width: 768px) {
      .info-container-wrapper {
        flex-direction: column;
      }
    }
  `;

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Loading data from:", dataFile);
        const response = await fetch(dataFile);
        console.log("Response status:", response);
        const data = await response.json();
        console.log("Loaded data:", data);
        createVisualization(data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    const createVisualization = (data: any) => {
      if (!containerRef.current) return;

      const width = 800;
      const height = 700;
      const padding = 60; 

      d3.select(containerRef.current).selectAll("*").remove();

      const container = d3.select(containerRef.current)
        .append("div")
        .attr("class", "container");

      const graphDiv = container.append("div")
        .attr("id", "chart1")
        .attr("class", "view");

      const matrixDiv = container.append("div")
        .attr("id", "chart2")
        .attr("class", "view");

      const graphSvgRoot = graphDiv.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .append("g")
        .attr("transform", `translate(${padding},${padding})`);

      const matrixSvg = matrixDiv.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        .append("g")
        .attr("transform", `translate(${padding},${padding})`);

      const isTwitchData = dataFile.includes('twitch.json');
      
      let processedNodes;
      if (isTwitchData && (modelType?.includes('link prediction'))) {
        const subgraphNodes = new Set<number>();
        
        console.log("Selected nodes:", hubNodeA, hubNodeB);
        
        if (hubNodeA !== undefined) subgraphNodes.add(hubNodeA);
        if (hubNodeB !== undefined) subgraphNodes.add(hubNodeB);
        
        if (data.edge_index) {
          console.log("Processing edge_index to find neighbors");
          for (let i = 0; i < data.edge_index[0].length; i++) {
            const source = data.edge_index[0][i];
            const target = data.edge_index[1][i];
            
            if (source === hubNodeA || source === hubNodeB) {
              subgraphNodes.add(target);
            }
            if (target === hubNodeA || target === hubNodeB) {
              subgraphNodes.add(source);
            }
          }
        }
        
        processedNodes = Array.from(subgraphNodes).sort((a, b) => a - b);
        console.log("Final processed nodes:", processedNodes);
      } else {
        processedNodes = data.x.map((_: any, i: number) => i);
      }

      const nodes = processedNodes.map((nodeId: number) => {
        let label = nodeId.toString();
        if (!isTwitchData) {
          const features = data.x[nodeId];
          const idx = Array.isArray(features) ? features.indexOf(1) : -1;
          if (idx !== -1 && elementMap[idx as keyof typeof elementMap]) {
            label = elementMap[idx as keyof typeof elementMap];
          } else if (data.train_nodes) {
            const isTrainNode = data.train_nodes.includes(nodeId);
            label = isTrainNode ? 'T' : '?';
          } else if (data.y) {
            label = data.y[nodeId];
          }
        }
        return {
          id: nodeId,
          element: label,
          x: undefined,
          y: undefined
        };
      });

      const graphSvg = graphSvgRoot.append("g");

      // 放大比例
      const scaleFactor = 1.4;
      const centerX = (width - 2 * padding) / 2;
      const centerY = (height - 2 * padding) / 2;
      graphSvg.attr("transform", `translate(${padding + centerX * (1 - scaleFactor)},${padding + centerY * (1 - scaleFactor)}) scale(${scaleFactor})`);

      const filteredLinks = data.edge_index[0].reduce((acc: any[], source: number, i: number) => {
        const target = data.edge_index[1][i];
        if (isTwitchData && modelType?.includes('link prediction')) {
          if (processedNodes.includes(source) && processedNodes.includes(target)) {
            acc.push({
              source,
              target,
              attr: data.edge_attr ? data.edge_attr[i] : null
            });
          }
        } else {
          acc.push({
            source,
            target,
            attr: data.edge_attr ? data.edge_attr[i] : null
          });
        }
        return acc;
      }, []);

      console.log("Processed Nodes:", processedNodes);
      console.log("Filtered Links:", filteredLinks);

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(filteredLinks)
          .id((d: any) => d.id)
          .distance(80))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter((width - 2 * padding) / 2, (height - 2 * padding) / 2))
        .force("x", d3.forceX((width - 2 * padding) / 2).strength(0.1))
        .force("y", d3.forceY((height - 2 * padding) / 2).strength(0.1));

      const graphLinks = graphSvg.append("g")
        .selectAll("line")
        .data(filteredLinks)
        .enter()
        .append("line")
        .attr("class", "link");

      const nodeGroups = graphSvg.append("g")
        .selectAll("g")
        .data(nodes)
        .enter()
        .append("g");

      const graphNodes = nodeGroups
        .append("circle")
        .attr("class", "node")
        .attr("r", 12);

      const nodeLabels = nodeGroups
        .append("text")
        .attr("class", "node-label")
        .text((d: any) => d.element);

      const numNodes = nodes.length;
      const matrix = Array(numNodes).fill(null)
        .map(() => Array(numNodes).fill(0));

      filteredLinks.forEach((link: any) => {
        const sourceIndex = nodes.findIndex((n: any) => n.id === link.source.id);
        const targetIndex = nodes.findIndex((n: any) => n.id === link.target.id);
        if (sourceIndex !== -1 && targetIndex !== -1) {
          matrix[sourceIndex][targetIndex] = 1;
          matrix[targetIndex][sourceIndex] = 1;
        }
      });

      let cellSize = Math.min(
        (width - 2 * padding) / numNodes,
        (height - 2 * padding) / numNodes
      ) * 0.9;

      const matrixG = matrixSvg.append("g");

      const rows = matrixG.selectAll("g")
        .data(matrix)
        .enter()
        .append("g")
        .attr("transform", (d: any, i: number) => `translate(0,${i * cellSize})`);

      const matrixCells = rows.selectAll("rect")
        .data((row: any, i: number) => row.map((value: any, j: number) => ({ value, i, j })))
        .enter()
        .append("rect")
        .attr("class", "matrix-cell")
        .attr("x", (d: any, j: number) => j * cellSize)
        .attr("width", cellSize)
        .attr("height", cellSize)
        .style("fill", (d: any) => d.value ? "#69b3a2" : "#eee");

      matrixSvg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", "axis-label")
        .attr("x", (d: any, i: number) => i * cellSize + cellSize / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .text((d: any) => d.id);

      matrixSvg.append("g")
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", "axis-label")
        .attr("x", -5)
        .attr("y", (d: any, i: number) => i * cellSize + cellSize / 2)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .text((d: any) => d.id);

      simulation.on("tick", () => {
        graphLinks
          .attr("x1", (d: any) => d.source.x)
          .attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x)
          .attr("y2", (d: any) => d.target.y);

        nodeGroups
          .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      const highlightConnection = (event: any, d: any) => {
        const isGraphNodeHover = event.currentTarget.tagName === "circle"; 
        const isGraphEdgeHover = event.currentTarget.tagName === "line";   
      
        if (isGraphNodeHover) {
          const nodeId = d.id;
      
          graphNodes.classed("highlighted", (n: any) => n.id === nodeId);
          graphLinks.classed("highlighted", false); 
      
          matrixCells.classed("highlighted", (cell: any) => {
            const columnIndex = nodes.findIndex((n: any) => n.id === nodeId);
            return cell.i === columnIndex || cell.j === columnIndex;
          });
        } else if (isGraphEdgeHover) {
          const sourceId = d.source.id;
          const targetId = d.target.id;
      
          graphLinks.classed("highlighted", (l: any) =>
            l.source.id === sourceId && l.target.id === targetId
          );
      
          graphNodes.classed("highlighted", (n: any) =>
            n.id === sourceId || n.id === targetId
          );
      
          matrixCells.classed("highlighted", (cell: any) => {
            const sourceIndex = nodes.findIndex((n: any) => n.id === sourceId);
            const targetIndex = nodes.findIndex((n: any) => n.id === targetId);
            return (
              (cell.i === sourceIndex && cell.j === targetIndex) ||
              (cell.i === targetIndex && cell.j === sourceIndex)
            );
          });
        }
      };      

      const highlightMatrixCell = (event: any, d: any) => {
        if (d.value === 0) return;

        const sourceNode = nodes[d.i];
        const targetNode = nodes[d.j];

        matrixCells.classed("highlighted", (cell: any) =>
          (cell.i === d.i && cell.j === d.j) ||
          (cell.i === d.j && cell.j === d.i)
        );

        graphNodes.classed("highlighted", (n: any) =>
          n.id === sourceNode.id || n.id === targetNode.id
        );

        graphLinks.classed("highlighted", (l: any) =>
          (l.source.id === sourceNode.id && l.target.id === targetNode.id) ||
          (l.source.id === targetNode.id && l.target.id === sourceNode.id)
        );
      };
      const highlightMatrixLabel = (index: number) => {
        // 高亮矩阵中，第 i 行或第 i 列的 cell
        matrixCells.classed("highlighted", (cellData: any) => {
          return cellData.i === index || cellData.j === index;
        });
        const nodeId = nodes[index].id;
        graphNodes.classed("highlighted", (node: any) => node.id === nodeId);
      };

      const unhighlightAll = () => {
        graphNodes.classed("highlighted", false);
        graphLinks.classed("highlighted", false);
        matrixCells.classed("highlighted", false);
      };
      matrixSvg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "axis-label")
      .attr("x", (d: any, i: number) => i * cellSize + cellSize / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .text((d: any) => d.id)
      .on("mouseover", function (event, d) {
        const index = nodes.indexOf(d);   
        highlightMatrixLabel(index);
      })
      .on("mouseout", unhighlightAll);

      matrixSvg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "axis-label")
      .attr("x", -5)
      .attr("y", (d: any, i: number) => i * cellSize + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .text((d: any) => d.id)
      .on("mouseover", function (event, d) {
        const index = nodes.indexOf(d);   
        highlightMatrixLabel(index);
      })
      .on("mouseout", unhighlightAll);

      graphNodes.on("mouseover", highlightConnection)
        .on("mouseout", unhighlightAll);

      // 为边增加事件监听
      graphLinks.on("mouseover", highlightConnection)
        .on("mouseout", unhighlightAll);

      matrixCells.on("mouseover", highlightMatrixCell)
        .on("mouseout", unhighlightAll);
    };

    loadData();
  }, [dataFile, hubNodeA, hubNodeB, modelType]);

  return (
    <>
      <style>{styles}</style>
      <div className="info-container-wrapper">
        <div className="info-container" style={{ color: "gray" }}>
          <div className="info-title" style={{ color: "gray" }}>
            Understanding Graphs and Adjacency Matrices
          </div>
          <div className="info-box" style={{ color: "gray" }}>
            <p>
              A graph can be visualized as either a node-link diagram or an adjacency matrix.
              Hover over the nodes, edges, matrix cells, or matrix labels to highlight their connections.
            </p>
          </div>
        </div>
      </div>
      <div ref={containerRef} />
    </>
  );
};

export default GraphMatrixVisualization;
