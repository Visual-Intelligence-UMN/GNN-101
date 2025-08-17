import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { loadNodeWeights } from '@/utils/matHelperUtils';
import { loadNodesLocation } from '@/utils/utils';
import { dualViewVisualizerStyle } from '@/utils/const';

interface GraphMatrixVisualizationProps {
  dataFile: string;
  graph_path: string;
  hubNodeA?: number;
  hubNodeB?: number;
  modelType?: string;
  simulatedGraphData?: any;
  sandboxMode?: boolean;
  nodePositions?: { id: string; x: number; y: number }[];
  onNodePositionChange?: (positions: { id: string; x: number; y: number }[]) => void;
}

const elementMap = {
  0: 'C', 1: 'N', 2: 'O', 3: 'F', 4: 'H', 5: 'S', 6: 'Cl'
};

const GraphMatrixVisualization: React.FC<GraphMatrixVisualizationProps> = ({ 
  dataFile, 
  graph_path,
  hubNodeA, 
  hubNodeB,
  modelType,
  simulatedGraphData,
  sandboxMode =  true,
  nodePositions,
  onNodePositionChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  console.log("GraphMatrixVisualization props:", { dataFile, hubNodeA, hubNodeB, modelType, simulatedGraphData });
  const parse = typeof graph_path === 'string' ? graph_path.match(/(\d+)\.json$/) : null;
  let select = parse ? parse[1] : '';
  
  let mode: number = 0
  if (modelType?.includes('link prediction')) {
    console.log("THIS IS LINK MODE!!!")
    mode = 2
  }
  if (modelType?.includes('node')) {
    console.log("THIS IS NODE MODE!!!")
    mode = 1
    select = "0"
  }
  if (modelType?.includes('graph')) {
    console.log("THIS IS GRAPH MODE!!!")
    mode = 0
  }

  // For link prediction, don't use preset node positions - use force simulation like Correct version
  if (!sandboxMode && !modelType?.includes('link prediction')) {
    console.log("VNAUWN",mode, select)
    const nodePositionsDic = loadNodesLocation(mode, select)
    nodePositions = nodePositionsDic
      ? Object.entries(nodePositionsDic).map(([id, pos]) => ({
          id,
          x: (pos as { x: number; y: number }).x - 1500,
          y: (pos as { x: number; y: number }).y 
        }))
      : [];

  }

  const styles = dualViewVisualizerStyle;

  useEffect(() => {
      const loadData = async () => {
    try {
      // For link prediction, always use dataFile regardless of sandbox mode
      if (modelType?.includes('link prediction') || !sandboxMode) {
        console.log("Loading data from:", dataFile);
        const response = await fetch(dataFile);
        console.log("Response status:", response);
        const data = await response.json();
        console.log("Loaded data:", data);
        createVisualization(data);
      } else {
        createVisualization(simulatedGraphData);
      }
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
        // For link prediction, use the same logic as Correct version
        if (modelType?.includes('link prediction')) {
          label = nodeId.toString();
        } else if (sandboxMode || !modelType?.includes('node prediction')) {
          label = nodeId.toString();
        } else {
          if (!isTwitchData) {
            console.log(sandboxMode, modelType, modelType?.includes('node prediction'))
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
        }
        return {
          id: nodeId,
          element: label,
          x: undefined,
          y: undefined
        };
      });

      const graphSvg = graphSvgRoot.append("g");

      const scaleFactor = 1.4;
      const centerX = (width - 2 * padding) / 2;
      const centerY = (height - 2 * padding) / 2;
      graphSvg.attr("transform", `translate(${padding + centerX * (1 - scaleFactor)},${padding + centerY * (1 - scaleFactor)}) scale(${scaleFactor})`);
      const filteredLinks = data.edge_index[0].reduce((acc: any[], sourceId: number, i: number) => {
        const targetId = data.edge_index[1][i];

        if (isTwitchData && modelType?.includes('link prediction')) {
          if (processedNodes.includes(sourceId) && processedNodes.includes(targetId)) {
            acc.push({
              source: sourceId,
              target: targetId,
              attr: data.edge_attr ? data.edge_attr[i] : null
            });
          }
        } else {
          // For node classification and graph classification, check if both nodes exist
          const sourceNode = nodes.find((n: any) => n.id === sourceId);
          const targetNode = nodes.find((n: any) => n.id === targetId);
          
          if (sourceNode && targetNode) {
            if (modelType?.includes('link prediction')) {
              // Link prediction uses IDs for d3 force simulation
              acc.push({
                source: sourceId,
                target: targetId,
                attr: data.edge_attr ? data.edge_attr[i] : null
              });
            } else {
              // Other tasks use IDs too, but we'll handle them in the force simulation
              acc.push({
                source: sourceId,
                target: targetId,
                attr: data.edge_attr ? data.edge_attr[i] : null
              });
            }
          }
        }

        return acc;
      }, []);

      console.log("Processed Nodes:", processedNodes);
      console.log("Filtered Links:", filteredLinks);
      console.log("Model Type:", modelType);
      console.log("Is Twitch Data:", isTwitchData);

      let simulation: d3.Simulation<any, undefined> | undefined;
      let graphLinks: any;
      let nodeGroups: any;
      let graphNodes: any;
      let nodeLabels: any;
      console.log("AUEFJBHUIOABGHWFUIOGHAWUIFH", nodePositions, nodePositions && nodePositions.length > 0)
      // For link prediction, always use force simulation like Correct version
      if (nodePositions && nodePositions.length > 0 && !modelType?.includes('link prediction')) {
        console.log("nodelocation")
        nodes.forEach((node: any) => {
          const fixedPos = nodePositions[node.id];
          if (fixedPos) {
            node.x = fixedPos.x;
            node.y = fixedPos.y;
          } else {
            // Assign a default position if not found in nodePositions
            // This prevents 'undefined' errors if nodePositions is incomplete
            node.x = (width - 2 * padding) / 2;
            node.y = (height - 2 * padding) / 2;
            console.warn(`Node ${node.id} not found in nodePositions, assigning default center.`);
          }
        });
        console.log("Using fixed node positions:", nodes);

        // Apply fixed positions directly to graph elements
        console.log("New", nodes)
        
        graphLinks = graphSvg.append("g")
          .selectAll("line")
          .data(filteredLinks)
          .enter()
          .append("line")
          .attr("class", "link")
          .attr("x1", (d: any) => {
            const sourceId = d.source.id || d.source;
            return nodes.find((n: any) => n.id === sourceId)?.x || 0;
          })
          .attr("y1", (d: any) => {
            const sourceId = d.source.id || d.source;
            return nodes.find((n: any) => n.id === sourceId)?.y || 0;
          })
          .attr("x2", (d: any) => {
            const targetId = d.target.id || d.target;
            return nodes.find((n: any) => n.id === targetId)?.x || 0;
          })
          .attr("y2", (d: any) => {
            const targetId = d.target.id || d.target;
            return nodes.find((n: any) => n.id === targetId)?.y || 0;
          })
          .style("stroke", function (d: any) {
                            return d.type === "aromatic" ? "purple" : "#aaa";
                        });

        nodeGroups = graphSvg.append("g")
          .selectAll("g")
          .data(nodes)
          .enter()
          .append("g")
          .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

        graphNodes = nodeGroups
          .append("circle")
          .attr("class", "node")
          .attr("r", 12);

        nodeLabels = nodeGroups
          .append("text")
          .attr("class", "node-label")
          .text((d: any) => d.element);

        const drag = d3.drag<SVGCircleElement, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            // For link prediction, don't call onNodePositionChange to avoid flickering
            if (onNodePositionChange && !modelType?.includes('link prediction')) {
              onNodePositionChange(nodes.map((n: any) => ({ id: n.id.toString(), x: n.x, y: n.y })));
            }
          });

        nodeGroups.call(drag);

      } else {
        console.log("no nodelocation")
        // Fallback to force simulation
        simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(filteredLinks)
            .id((d: any) => d.id)
            .distance(80))
          .force("charge", d3.forceManyBody().strength(-200))
          .force("center", d3.forceCenter((width - 2 * padding) / 2, (height - 2 * padding) / 2))
          .force("x", d3.forceX((width - 2 * padding) / 2).strength(0.1))
          .force("y", d3.forceY((height - 2 * padding) / 2).strength(0.1))
          ;
        
        console.log("Using force simulation for node positions.");

        graphLinks = graphSvg.append("g")
          .selectAll("line")
          .data(filteredLinks)
          .enter()
          .append("line")
          .attr("class", "link");

        nodeGroups = graphSvg.append("g")
          .selectAll("g")
          .data(nodes)
          .enter()
          .append("g");

        graphNodes = nodeGroups
          .append("circle")
          .attr("class", "node")
          .attr("r", 12);

        nodeLabels = nodeGroups
          .append("text")
          .attr("class", "node-label")
          .text((d: any) => d.element);

        const drag = d3.drag<SVGCircleElement, any>()
          .on("start", (event, d) => {
            if (!event.active) simulation?.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation?.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            // For link prediction, don't call onNodePositionChange to avoid flickering
            if (onNodePositionChange && !modelType?.includes('link prediction')) {
              onNodePositionChange(nodes.map((n: any) => ({ id: n.id.toString(), x: n.x, y: n.y })));
            }
          });

        nodeGroups.call(drag);

        simulation.on("tick", () => {
          graphLinks
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y)
            .style("stroke", function (d: any) {
                             return d.type === "aromatic" ? "purple" : "#aaa";
                         });

          nodeGroups
            .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
          
          // For link prediction, don't call onNodePositionChange to avoid flickering
          if (onNodePositionChange && !modelType?.includes('link prediction')) {
            onNodePositionChange(nodes.map((n: any) => ({ id: n.id.toString(), x: n.x, y: n.y })));
          }
        });
      }

      const numNodes = nodes.length;
      const matrix = Array(numNodes).fill(null)
        .map(() => Array(numNodes).fill(0));
      filteredLinks.forEach((link: any) => {
        const sourceIndex = nodes.findIndex((n: any) => n.id === (link.source.id || link.source));
        const targetIndex = nodes.findIndex((n: any) => n.id === (link.target.id || link.target));
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
      console.log("MATRIX", matrix)

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

      const highlightConnection = (event: any, d: any) => {
        const isGraphNodeHover = event.currentTarget.tagName === "circle";
        const isGraphEdgeHover = event.currentTarget.tagName === "line";
      
        if (isGraphNodeHover) {
          const nodeId = d.id;
      
          graphNodes.classed("highlighted", (n: any) => n.id === nodeId);
          
          // Highlight edges connected to this node
          graphLinks.classed("highlighted", (l: any) => {
            const sourceId = l.source.id || l.source;
            const targetId = l.target.id || l.target;
            return sourceId === nodeId || targetId === nodeId;
          });
      
          matrixCells.classed("highlighted", (cell: any) => {
            const columnIndex = nodes.findIndex((n: any) => n.id === nodeId);
            return cell.i === columnIndex || cell.j === columnIndex;
          });
        } else if (isGraphEdgeHover) {
          const sourceId = d.source.id || d.source;
          const targetId = d.target.id || d.target;
      
          graphLinks.classed("highlighted", (l: any) => {
            const lSourceId = l.source.id || l.source;
            const lTargetId = l.target.id || l.target;
            return lSourceId === sourceId && lTargetId === targetId;
          });
      
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

        graphLinks.classed("highlighted", (l: any) => {
          const sourceId = l.source.id || l.source;
          const targetId = l.target.id || l.target;
          return (sourceId === sourceNode.id && targetId === targetNode.id) ||
                 (sourceId === targetNode.id && targetId === sourceNode.id);
        });
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
  }, [dataFile, hubNodeA, hubNodeB, modelType, simulatedGraphData, sandboxMode, nodePositions]);

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
