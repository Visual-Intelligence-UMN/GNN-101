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





