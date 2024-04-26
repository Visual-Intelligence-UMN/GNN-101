// UTILS FILE BECAUSE WE HAVE SO MANY HELPER FUNCTIONS
import * as d3 from 'd3';
export const load_json = async (path: string) => {
  try {
    console.log('entered load_json')
    const response = await fetch(path);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There has been a problem with your fetch operation:', error);
  }
}
// data_prep
export async function data_prep(o_data: any) {
  // Painful explicit typing because we are using Typescript
  type NodeType = {
    id: number;
    name: number;
    features: any;
  };
  type LinkType = {
    source: number;
    target: number;
  };

  let final_data = {
    nodes: [] as NodeType[],
    links: [] as LinkType[],
  }

  try {
    var data = await load_json(o_data);
    var nodes = data.x;
    var edges = data.edge_index;

    for (var i = 0; i < nodes.length; i++) {
      var new_node = {
        "id": i,
        "name": i,
        "features": nodes[i]
      }
      final_data.nodes.push(new_node);
    }
    for (var i = 0; i < edges[0].length; i++) {
      var new_relation = {
        "source": edges[0][i],
        "target": edges[1][i]
      }
      final_data.links.push(new_relation);
    }

    return final_data;
  } catch (error) {
    console.error('There has been an error in data_prep:', error);
  }
} // end of data_prep
// prep_graphs
export async function prep_graphs(g_num: number, data: any) {
  var graphs = [];
    for(var i=0; i<g_num; i++){
        let graphData = {
            nodes: deepClone(data.nodes),
            links: deepClone(data.links)
        };
        graphs.push(graphData);
    }
    return graphs;
}

export function connectCrossGraphNodes(nodes: any, svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>, graphs: any[]) {
  const nodesById = d3.group(nodes, (d:any) => d.id);
  console.log(nodesById);
  nodesById.forEach((nodes, id) => {
    nodes.forEach((node, i) => {
      if (i < nodes.length - 1) {
        const nextNode = nodes[i + 1];
        const xOffset1 = node.graphIndex * 500;
        const xOffset2 = nextNode.graphIndex * 500;

        console.log("first cood");
        console.log(nodes[i].x, nodes[i].y);
        console.log("second cood");
        console.log(nextNode.x, nextNode.y);

        svg.append("line")
          .attr("x1", nodes[i].x + xOffset1)
          .attr("y1", nodes[i].y + 10)
          .attr("x2", nextNode.x + xOffset2)
          .attr("y2", nextNode.y + 10)
          .style("stroke", "red")
          .style("opacity", 0.2)
          .style("stroke-width", 2);

        const nextGraphLinks = graphs[nextNode.graphIndex].links;
        nextGraphLinks.forEach((link: any) => {
          if (
            link.source.id === nextNode.id ||
            link.target.id === nextNode.id
          ) {
            const neighborNode =
              link.source.id === nextNode.id
                ? link.target
                : link.source;
            svg.append("line")
              .attr("x1", node.x + node.graphIndex * 500)
              .attr("y1", node.y + 10)
              .attr(
                "x2",
                neighborNode.x + neighborNode.graphIndex * 500
              )
              .attr("y2", neighborNode.y + 10)
              .style("stroke", "blue")
              .style("opacity", 0.2)
              .style("stroke-width", 1);
          }
        });
      }
    });
  })
}

// helper helper function
function deepClone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}

export async function process() {
  var data = await data_prep("./input_graph.json");
  console.log(data);
  return data;
}