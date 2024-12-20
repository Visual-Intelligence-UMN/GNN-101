import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface GraphMatrixVisualizationProps {
  dataFile: string;
}

const SELECTED_NODES = [194, 497, 567, 590, 1147, 1169, 1588, 1882, 1906, 2369, 2779, 3649, 3728, 3797, 4591, 4990, 5117, 6509];

const elementMap = {
  0: 'C', 1: 'N', 2: 'O', 3: 'F', 4: 'H', 5: 'S', 6: 'Cl'
};

const GraphMatrixVisualization: React.FC<GraphMatrixVisualizationProps> = ({ dataFile }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const styles = `
    .container {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      padding: 20px;
      min-height: 700px;
    }
    .view {
      flex: 1;
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
  `;

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(dataFile);
        const data = await response.json();
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

      const graphSvg = graphDiv.append("svg")
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
      if (isTwitchData) {
        processedNodes = SELECTED_NODES;
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

      const filteredLinks = data.edge_index[0].reduce((acc: any[], source: number, i: number) => {
        const target = data.edge_index[1][i];
        if (isTwitchData) {
          if (SELECTED_NODES.includes(source) && SELECTED_NODES.includes(target)) {
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

      const cellSize = Math.min(
        (width - 2 * padding) / numNodes,
        (height - 2 * padding) / numNodes
      );

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

      const unhighlightAll = () => {
        graphNodes.classed("highlighted", false);
        graphLinks.classed("highlighted", false);
        matrixCells.classed("highlighted", false);
      };

      graphNodes.on("mouseover", highlightConnection)
        .on("mouseout", unhighlightAll);

      // 为边增加事件监听
      graphLinks.on("mouseover", highlightConnection)
        .on("mouseout", unhighlightAll);

      matrixCells.on("mouseover", highlightMatrixCell)
        .on("mouseout", unhighlightAll);
    };

    loadData();
  }, [dataFile]);

  return (
    <>
      <style>{styles}</style>
      <div ref={containerRef} />
    </>
  );
};

export default GraphMatrixVisualization;
