export function processDataFromVisualizerToEditor(input: {
  x: number[][],
  edge_index: number[][],
  edge_attr: number[][],
  y: number[],
  batch: number[]
}) {
  const { x, edge_index, edge_attr } = input;

  const nodes = x.map((features, index) => ({
    id: `N${index}`,
    group: 1 
  }));


  const links = edge_index[0].map((sourceIdx, i) => {
    const targetIdx = edge_index[1][i];
    return {
      source: `N${sourceIdx}`,
      target: `N${targetIdx}`,
      value: edge_attr[i]?.[0] ?? 1  
    };
  });

  return { nodes, links };
}

export function processDataFromEditorToVisualizer(input: {
  nodes: { id: string; group: number }[];
  links: { source: string; target: string; value: number }[];
}) {
  const { nodes, links } = input;

  // 建立 id → index 的映射
  const nodeIdToIndex = new Map<string, number>();
  nodes.forEach((node, idx) => nodeIdToIndex.set(node.id, idx));

  // 构造 x 向量（每个节点一个长度为 5，值为 1 ~ 1.5 的向量）
  const x = nodes.map(() =>
    Array.from({ length: 5 }, () =>
      +(1 + Math.random() * 0.5).toFixed(3)
    )
  );

  // 构造 edge_index
  const edge_index: number[][] = [[], []];
  console.log("transmit pipe links", links);
  links.forEach(link => {
    const sourceIdx = link.source.index;
    const targetIdx = link.target.index;
    console.log("sourceIdx", sourceIdx, "targetIdx", targetIdx, "link", link);
    edge_index[0].push(sourceIdx);
    edge_index[1].push(targetIdx);
  });

  // 构造 edge_attr（每条边一个长度为 4，值为 1~10 的整数向量）
  const edge_attr = links.map(() =>
    Array.from({ length: 4 }, () =>
      Math.floor(1 + Math.random() * 10)
    )
  );

  // 构造 batch 和 y
  const batch = new Array(nodes.length).fill(0);
  const y = [0];

  return { x, edge_index, edge_attr, y, batch };
}




