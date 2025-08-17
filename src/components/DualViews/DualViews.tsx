import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import GraphView from "./GraphView";
import MatrixView from "./MatrixView";
import type { HoverState, LinkDatum, NodeDatum } from "./dualViewTypes";
import { loadNodesLocation } from "@/utils/utils";
import { dualViewVisualizerStyle } from "@/utils/const";
import GraphEditor from "../GraphEditor";

interface Props {
  dataFile: string;
  graph_path: string;
  hubNodeA?: number;
  hubNodeB?: number;
  modelType?: string; // "node prediction" | "link prediction" | "graph"
  simulatedGraphData?: any;
  sandboxMode?: boolean;
  nodePositions?: { id: string; x: number; y: number }[];
  onNodePositionChange?: (positions: { id: string; x: number; y: number }[]) => void;
  handleSimulatedGraphChange: any,
  handleNodePositionsChange: any,
}

const elementMap: Record<number, string> = {
  0: "C",
  1: "N",
  2: "O",
  3: "F",
  4: "H",
  5: "S",
  6: "Cl",
};

const DualViews: React.FC<Props> = ({
  dataFile,
  graph_path,
  hubNodeA,
  hubNodeB,
  modelType,
  simulatedGraphData,
  sandboxMode = true,
  nodePositions,
  onNodePositionChange,
  handleSimulatedGraphChange,
  handleNodePositionsChange,
}) => {
  const [nodes, setNodes] = useState<NodeDatum[]>([]);
  const [links, setLinks] = useState<LinkDatum[]>([]);
  const [hover, setHover] = useState<HoverState>(null);

  const styles = dualViewVisualizerStyle;

  const parse = typeof graph_path === "string" ? graph_path.match(/(\d+)\.json$/) : null;
  let select = parse ? parse[1] : "";

  let mode = 0;
  if (modelType?.includes("link prediction")) mode = 2;
  else if (modelType?.includes("node")) {
    mode = 1;
    select = "0";
  } else if (modelType?.includes("graph")) mode = 0;

  // preset positions (for non-link tasks when not in sandbox)
  const fixedPositions = useMemo(() => {
    if (sandboxMode || modelType?.includes("link prediction")) return undefined;
    const dic = loadNodesLocation(mode, select);
    if (!dic) return undefined;
    const mapped: Record<number, { x: number; y: number }> = {};
    Object.entries(dic).forEach(([id, pos]: any) => {
      const nid = Number(id);
      mapped[nid] = { x: pos.x - 1500, y: pos.y };
    });
    return mapped;
  }, [sandboxMode, modelType, mode, select]);

  // load data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const useRemote = modelType?.includes("link prediction") || !sandboxMode;
        const data = useRemote
          ? await (await fetch(dataFile)).json()
          : simulatedGraphData;
        if (cancelled) return;

        const isTwitchData = typeof dataFile === "string" && dataFile.includes("twitch.json");

        // determine processed nodes
        let processed: number[] = [];
        if (isTwitchData && modelType?.includes("link prediction")) {
          const sub = new Set<number>();
          if (hubNodeA != null) sub.add(hubNodeA);
          if (hubNodeB != null) sub.add(hubNodeB);
          if (data.edge_index) {
            for (let i = 0; i < data.edge_index[0].length; i++) {
              const s = data.edge_index[0][i];
              const t = data.edge_index[1][i];
              if (s === hubNodeA || s === hubNodeB) sub.add(t);
              if (t === hubNodeA || t === hubNodeB) sub.add(s);
            }
          }
          processed = Array.from(sub).sort((a, b) => a - b);
        } else {
          processed = data.x.map((_v: any, i: number) => i);
        }

        const nodeList: NodeDatum[] = processed.map((nodeId: number) => {
          let label = String(nodeId);
          if (!sandboxMode && modelType?.includes("node prediction") && !isTwitchData) {
            const feats = data.x[nodeId];
            const idx = Array.isArray(feats) ? feats.indexOf(1) : -1;
            if (idx !== -1 && elementMap[idx] != null) label = elementMap[idx];
            else if (data.train_nodes) label = data.train_nodes.includes(nodeId) ? "T" : "?";
            else if (data.y) label = String(data.y[nodeId]);
          }
          return { id: nodeId, element: label };
        });

        // filter links to processed nodes subset
        const setProcessed = new Set(processed);
        const linkList: LinkDatum[] = (data.edge_index?.[0] || []).reduce(
          (acc: LinkDatum[], s: number, i: number) => {
            const t = data.edge_index[1][i];
            if (setProcessed.has(s) && setProcessed.has(t)) {
              acc.push({ source: s, target: t, attr: data.edge_attr ? data.edge_attr[i] : null });
            }
            return acc;
          },
          []
        );

        setNodes(nodeList);
        setLinks(linkList);
      } catch (e) {
        console.error("Error loading graph data", e);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dataFile, modelType, sandboxMode, simulatedGraphData, hubNodeA, hubNodeB]);

  const onGraphPositions = (positions: { id: number; x: number; y: number }[]) => {
    if (!onNodePositionChange) return;
    onNodePositionChange(positions.map((p) => ({ id: String(p.id), x: p.x, y: p.y })));
  };

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
              A graph can be visualized as either a node-link diagram or an adjacency matrix. Hover over the nodes, edges, matrix cells, or matrix labels to highlight their connections.
            </p>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div id="chart1" className="view">
          {sandboxMode ? 
          <GraphEditor
            onClose={() => {}}
            simGraphData={simulatedGraphData}
            handleSimulatedGraphChange={handleSimulatedGraphChange}
            onNodePositionsChange={handleNodePositionsChange}
          /> : 
          <GraphView
            nodes={nodes}
            links={links}
            fixedPositions={fixedPositions}
            linkPredictionMode={!!modelType?.includes("link prediction")}
            onNodePositionChange={onGraphPositions}
            onHover={setHover}
            hover={hover}
          />}
        </div>
        <div id="chart2" className="view">
          <MatrixView nodes={nodes} links={links} onHover={setHover} hover={hover} />
        </div>
      </div>
    </>
  );
};

export default DualViews;
