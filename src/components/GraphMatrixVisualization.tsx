import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { loadNodesLocation } from '@/utils/utils';
import { dualViewVisualizerStyle } from '@/utils/const';

interface GraphMatrixVisualizationProps {
  dataFile: string;
  graph_path: string;
  hubNodeA?: number;
  hubNodeB?: number;
  modelType?: string;
  simulatedGraphData?: unknown;
  sandboxMode?: boolean;
  nodePositions?: { id: string; x: number; y: number }[];
  onNodePositionChange?: (positions: { id: string; x: number; y: number }[]) => void;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
}

interface GraphData {
  x: unknown[];
  edge_index: [number[], number[]];
  edge_attr?: unknown[];
  train_nodes?: number[];
  y?: Array<string | number>;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: number;
  element: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: number | GraphNode;
  target: number | GraphNode;
  attr?: unknown;
  type?: string;
}

interface MatrixCellDatum {
  value: number;
  i: number;
  j: number;
}

const elementMap: Record<number, string> = {
  0: 'C',
  1: 'N',
  2: 'O',
  3: 'F',
  4: 'H',
  5: 'S',
  6: 'Cl',
};

const getModelMode = (modelType?: string): { mode: number; select: string } => {
  const parsed = typeof modelType === 'string' ? modelType : '';
  let mode = 0;
  let select = '';

  if (parsed.includes('link prediction')) {
    mode = 2;
  }
  if (parsed.includes('node')) {
    mode = 1;
    select = '0';
  }
  if (parsed.includes('graph')) {
    mode = 0;
  }

  return { mode, select };
};

const getLinkNodeId = (endpoint: number | GraphNode): number =>
  typeof endpoint === 'number' ? endpoint : endpoint.id;

const buildPositionLookup = (positions?: NodePosition[]): Map<number, NodePosition> => {
  const lookup = new Map<number, NodePosition>();
  if (!positions) return lookup;

  positions.forEach((pos) => {
    const numericId = Number(pos.id);
    if (!Number.isNaN(numericId)) {
      lookup.set(numericId, pos);
    }
  });

  return lookup;
};

const shouldUseSavedLayout = (sandboxMode: boolean, isLinkPrediction: boolean): boolean =>
  !sandboxMode && !isLinkPrediction;

const GraphMatrixVisualization: React.FC<GraphMatrixVisualizationProps> = ({
  dataFile,
  graph_path,
  hubNodeA,
  hubNodeB,
  modelType,
  simulatedGraphData,
  sandboxMode = true,
  nodePositions,
  onNodePositionChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const graphPathMatch = typeof graph_path === 'string' ? graph_path.match(/(\d+)\.json$/) : null;
  const initialSelect = graphPathMatch ? graphPathMatch[1] : '';
  const isLinkPrediction = modelType?.includes('link prediction') ?? false;
  const isNodePrediction = modelType?.includes('node prediction') ?? false;

  const { mode, select } = (() => {
    const derived = getModelMode(modelType);
    if (derived.select) return derived;
    return { ...derived, select: initialSelect };
  })();

  const fallbackPositions: NodePosition[] | undefined = (() => {
    if (!shouldUseSavedLayout(sandboxMode, isLinkPrediction)) return undefined;

    const nodePositionsDic = loadNodesLocation(mode, select);
    if (!nodePositionsDic) return undefined;

    return Object.entries(nodePositionsDic).map(([id, pos]) => ({
      id,
      x: (pos as { x: number; y: number }).x - 1500,
      y: (pos as { x: number; y: number }).y,
    }));
  })();

  const resolvedPositions = fallbackPositions ?? nodePositions;
  const styles = dualViewVisualizerStyle;

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isLinkPrediction || !sandboxMode) {
          const response = await fetch(dataFile);
          const data = (await response.json()) as GraphData;
          createVisualization(data);
        } else {
          createVisualization(simulatedGraphData as GraphData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    const createVisualization = (data?: GraphData) => {
      if (!containerRef.current || !data || !Array.isArray(data.x) || !Array.isArray(data.edge_index)) {
        return;
      }

      const width = 800;
      const height = 700;
      const padding = 60;

      d3.select(containerRef.current).selectAll('*').remove();

      const container = d3.select(containerRef.current).append('div').attr('class', 'container');
      const graphDiv = container.append('div').attr('id', 'chart1').attr('class', 'view');
      const matrixDiv = container.append('div').attr('id', 'chart2').attr('class', 'view');

      const graphSvgRoot = graphDiv
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('display', 'block')
        .append('g')
        .attr('transform', `translate(${padding},${padding})`);

      const matrixSvg = matrixDiv
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('display', 'block')
        .append('g')
        .attr('transform', `translate(${padding},${padding})`);

      const isTwitchData = dataFile.includes('twitch.json');
      const subgraphNodes = new Set<number>();

      if (isTwitchData && isLinkPrediction) {
        if (hubNodeA !== undefined) subgraphNodes.add(hubNodeA);
        if (hubNodeB !== undefined) subgraphNodes.add(hubNodeB);

        for (let i = 0; i < data.edge_index[0].length; i += 1) {
          const source = data.edge_index[0][i];
          const target = data.edge_index[1][i];

          if (source === hubNodeA || source === hubNodeB) subgraphNodes.add(target);
          if (target === hubNodeA || target === hubNodeB) subgraphNodes.add(source);
        }
      }

      const processedNodes =
        isTwitchData && isLinkPrediction
          ? Array.from(subgraphNodes).sort((a, b) => a - b)
          : data.x.map((_, i) => i);

      const nodes: GraphNode[] = processedNodes.map((nodeId) => {
        let label = nodeId.toString();

        if (!isLinkPrediction && !sandboxMode && isNodePrediction && !isTwitchData) {
          const features = data.x[nodeId];
          const idx = Array.isArray(features) ? features.indexOf(1) : -1;

          if (idx !== -1 && elementMap[idx] !== undefined) {
            label = elementMap[idx];
          } else if (Array.isArray(data.train_nodes)) {
            label = data.train_nodes.includes(nodeId) ? 'T' : '?';
          } else if (Array.isArray(data.y)) {
            label = String(data.y[nodeId]);
          }
        }

        return { id: nodeId, element: label };
      });

      const nodeById = new Map<number, GraphNode>(nodes.map((node) => [node.id, node]));

      const filteredLinks: GraphLink[] = data.edge_index[0].reduce<GraphLink[]>((acc, sourceId, i) => {
        const targetId = data.edge_index[1][i];
        const sourceExists = nodeById.has(sourceId);
        const targetExists = nodeById.has(targetId);

        if (sourceExists && targetExists) {
          acc.push({
            source: sourceId,
            target: targetId,
            attr: data.edge_attr ? data.edge_attr[i] : null,
          });
        }

        return acc;
      }, []);

      const graphSvg = graphSvgRoot.append('g');
      const scaleFactor = 1.4;
      const centerX = (width - 2 * padding) / 2;
      const centerY = (height - 2 * padding) / 2;

      graphSvg.attr(
        'transform',
        `translate(${padding + centerX * (1 - scaleFactor)},${padding + centerY * (1 - scaleFactor)}) scale(${scaleFactor})`,
      );

      let simulation: d3.Simulation<GraphNode, GraphLink> | undefined;

      const graphLinks = graphSvg
        .append('g')
        .selectAll<SVGLineElement, GraphLink>('line')
        .data(filteredLinks)
        .enter()
        .append('line')
        .attr('class', 'link')
        .style('stroke', (d) => (d.type === 'aromatic' ? 'purple' : '#aaa'));

      const nodeGroups = graphSvg
        .append('g')
        .selectAll<SVGGElement, GraphNode>('g')
        .data(nodes)
        .enter()
        .append('g');

      const graphNodes = nodeGroups.append('circle').attr('class', 'node').attr('r', 12);

      nodeGroups.append('text').attr('class', 'node-label').text((d) => d.element);

      const positionLookup = buildPositionLookup(resolvedPositions);
      const hasFixedPositions = positionLookup.size > 0 && !isLinkPrediction;

      const emitNodePositions = () => {
        if (!onNodePositionChange || isLinkPrediction) return;

        onNodePositionChange(
          nodes.map((n) => ({
            id: n.id.toString(),
            x: n.x ?? 0,
            y: n.y ?? 0,
          })),
        );
      };

      if (hasFixedPositions) {
        nodes.forEach((node) => {
          const fixedPos = positionLookup.get(node.id);
          if (fixedPos) {
            node.x = fixedPos.x;
            node.y = fixedPos.y;
          } else {
            node.x = centerX;
            node.y = centerY;
          }
        });

        nodeGroups.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
        graphLinks
          .attr('x1', (d) => nodeById.get(getLinkNodeId(d.source))?.x ?? 0)
          .attr('y1', (d) => nodeById.get(getLinkNodeId(d.source))?.y ?? 0)
          .attr('x2', (d) => nodeById.get(getLinkNodeId(d.target))?.x ?? 0)
          .attr('y2', (d) => nodeById.get(getLinkNodeId(d.target))?.y ?? 0);
      } else {
        simulation = d3
          .forceSimulation(nodes)
          .force(
            'link',
            d3
              .forceLink<GraphNode, GraphLink>(filteredLinks)
              .id((d) => d.id)
              .distance(80),
          )
          .force('charge', d3.forceManyBody().strength(-200))
          .force('center', d3.forceCenter(centerX, centerY))
          .force('x', d3.forceX(centerX).strength(0.1))
          .force('y', d3.forceY(centerY).strength(0.1));

        simulation.on('tick', () => {
          graphLinks
            .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
            .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
            .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
            .attr('y2', (d) => (d.target as GraphNode).y ?? 0);

          nodeGroups.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
          emitNodePositions();
        });
      }

      const drag = d3
        .drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation?.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
          if (hasFixedPositions) {
            d.x = event.x;
            d.y = event.y;
            d3.select(event.sourceEvent?.currentTarget ?? event.subject)
              .attr('transform', `translate(${d.x},${d.y})`);
          }
        })
        .on('end', (event, d) => {
          if (!event.active) simulation?.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          emitNodePositions();
        });

      nodeGroups.call(drag);

      const numNodes = nodes.length;
      if (numNodes === 0) return;

      const nodeIndexMap = new Map<number, number>(nodes.map((node, idx) => [node.id, idx]));
      const matrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(0));

      filteredLinks.forEach((link) => {
        const sourceIndex = nodeIndexMap.get(getLinkNodeId(link.source));
        const targetIndex = nodeIndexMap.get(getLinkNodeId(link.target));

        if (sourceIndex !== undefined && targetIndex !== undefined) {
          matrix[sourceIndex][targetIndex] = 1;
          matrix[targetIndex][sourceIndex] = 1;
        }
      });

      const cellSize =
        Math.min((width - 2 * padding) / numNodes, (height - 2 * padding) / numNodes) * 0.9;

      const matrixG = matrixSvg.append('g');

      const rows = matrixG
        .selectAll<SVGGElement, number[]>('g')
        .data(matrix)
        .enter()
        .append('g')
        .attr('transform', (_row, i) => `translate(0,${i * cellSize})`);

      const matrixCells = rows
        .selectAll<SVGRectElement, MatrixCellDatum>('rect')
        .data((row, i) => row.map((value, j) => ({ value, i, j })))
        .enter()
        .append('rect')
        .attr('class', 'matrix-cell')
        .attr('x', (d) => d.j * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .style('fill', (d) => (d.value ? '#69b3a2' : '#eee'));

      const topLabels = matrixSvg
        .append('g')
        .selectAll<SVGTextElement, GraphNode>('text')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', (_d, i) => i * cellSize + cellSize / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .text((d) => d.id);

      const leftLabels = matrixSvg
        .append('g')
        .selectAll<SVGTextElement, GraphNode>('text')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'axis-label')
        .attr('x', -5)
        .attr('y', (_d, i) => i * cellSize + cellSize / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .text((d) => d.id);

      const highlightConnection = (event: MouseEvent, d: GraphNode | GraphLink) => {
        const currentTarget = event.currentTarget as SVGElement;
        const isGraphNodeHover = currentTarget.tagName === 'circle';
        const isGraphEdgeHover = currentTarget.tagName === 'line';

        if (isGraphNodeHover) {
          const nodeId = (d as GraphNode).id;
          const columnIndex = nodeIndexMap.get(nodeId);

          graphNodes.classed('highlighted', (n) => n.id === nodeId);
          graphLinks.classed('highlighted', (l) => {
            const sourceId = getLinkNodeId(l.source);
            const targetId = getLinkNodeId(l.target);
            return sourceId === nodeId || targetId === nodeId;
          });

          matrixCells.classed(
            'highlighted',
            (cell) => columnIndex !== undefined && (cell.i === columnIndex || cell.j === columnIndex),
          );
        } else if (isGraphEdgeHover) {
          const edge = d as GraphLink;
          const sourceId = getLinkNodeId(edge.source);
          const targetId = getLinkNodeId(edge.target);
          const sourceIndex = nodeIndexMap.get(sourceId);
          const targetIndex = nodeIndexMap.get(targetId);

          graphLinks.classed('highlighted', (l) => {
            const lSourceId = getLinkNodeId(l.source);
            const lTargetId = getLinkNodeId(l.target);
            return lSourceId === sourceId && lTargetId === targetId;
          });

          graphNodes.classed('highlighted', (n) => n.id === sourceId || n.id === targetId);
          matrixCells.classed(
            'highlighted',
            (cell) =>
              sourceIndex !== undefined &&
              targetIndex !== undefined &&
              ((cell.i === sourceIndex && cell.j === targetIndex) ||
                (cell.i === targetIndex && cell.j === sourceIndex)),
          );
        }
      };

      const highlightMatrixCell = (_event: MouseEvent, d: MatrixCellDatum) => {
        if (d.value === 0) return;

        const sourceNode = nodes[d.i];
        const targetNode = nodes[d.j];

        matrixCells.classed(
          'highlighted',
          (cell) =>
            (cell.i === d.i && cell.j === d.j) ||
            (cell.i === d.j && cell.j === d.i),
        );

        graphNodes.classed('highlighted', (n) => n.id === sourceNode.id || n.id === targetNode.id);
        graphLinks.classed('highlighted', (l) => {
          const sourceId = getLinkNodeId(l.source);
          const targetId = getLinkNodeId(l.target);
          return (
            (sourceId === sourceNode.id && targetId === targetNode.id) ||
            (sourceId === targetNode.id && targetId === sourceNode.id)
          );
        });
      };

      const highlightMatrixLabel = (index: number) => {
        const node = nodes[index];
        if (!node) return;

        matrixCells.classed('highlighted', (cell) => cell.i === index || cell.j === index);
        graphNodes.classed('highlighted', (graphNode) => graphNode.id === node.id);
      };

      const unhighlightAll = () => {
        graphNodes.classed('highlighted', false);
        graphLinks.classed('highlighted', false);
        matrixCells.classed('highlighted', false);
      };

      topLabels
        .on('mouseover', (_event, d) => {
          const index = nodeIndexMap.get(d.id);
          if (index !== undefined) highlightMatrixLabel(index);
        })
        .on('mouseout', unhighlightAll);

      leftLabels
        .on('mouseover', (_event, d) => {
          const index = nodeIndexMap.get(d.id);
          if (index !== undefined) highlightMatrixLabel(index);
        })
        .on('mouseout', unhighlightAll);

      graphNodes.on('mouseover', highlightConnection).on('mouseout', unhighlightAll);
      graphLinks.on('mouseover', highlightConnection).on('mouseout', unhighlightAll);
      matrixCells.on('mouseover', highlightMatrixCell).on('mouseout', unhighlightAll);
    };

    loadData();
  }, [
    dataFile,
    hubNodeA,
    hubNodeB,
    isLinkPrediction,
    isNodePrediction,
    modelType,
    resolvedPositions,
    sandboxMode,
    simulatedGraphData,
    onNodePositionChange,
  ]);

  return (
    <>
      <style>{styles}</style>
      <div className="info-container-wrapper">
        <div className="info-container" style={{ color: 'gray' }}>
          <div className="info-title" style={{ color: 'gray' }}>
            Understanding Graphs and Adjacency Matrices
          </div>
          <div className="info-box" style={{ color: 'gray' }}>
            <p>
              A graph can be visualized as either a node-link diagram or an adjacency matrix.
              Hover over the nodes, edges, matrix cells, or matrix labels to highlight their
              connections.
            </p>
          </div>
        </div>
      </div>
      <div ref={containerRef} />
    </>
  );
};

export default GraphMatrixVisualization;
