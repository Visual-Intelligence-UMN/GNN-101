import { LinkType } from "./utils";

export function circleDetector(links: LinkType[]): Set {



  const clonedLinks = removeDuplicate(links);
  console.log("QEE",clonedLinks)
 

  const circleSet = new Set<number[]>();
  


  let end;
  let start;
  for (let i = 0; i < clonedLinks.length; i++) {
    if (clonedLinks[i + 1] != undefined && clonedLinks[i + 1].source === clonedLinks[i].source) {
      if (clonedLinks[i + 1].target > clonedLinks[i].target) {
        end = clonedLinks[i + 1].target;
        start = clonedLinks[i].target;
      } else {
        end = clonedLinks[i].target;
        start = clonedLinks[i + 1].target;
      }
    }
    
  return circleSet;
}
}

function removeDuplicate(links: LinkType[]): LinkType[] {
  const edges: number[][] = []; 
  let new_source;
  let new_target;
  let type;
  let new_relation : LinkType;
  let list = [];
  const new_links = [];


  for (let i = 0; i < links.length; i++) {
    const source = links[i].source;
    const target = links[i].target;
    let isInEdge: boolean = false;
    if (source > target) {
      list = [target, source];
    } else {
      list = [source, target];
    }
  
    for (let j = 0; j < edges.length; j++) {

      if (edges[j] != undefined && edges[j][0] === list[0] && edges[j][1] === list[1]) {
        isInEdge = true;
      }
    }
    
    if (!isInEdge) {
      edges.push(list);
      new_source = links[i].source;
      new_target = links[i].target;
      type = links[i].type;
      new_relation = {
        source: new_source,
        target: new_target,
        type: type
      }
      new_links.push(new_relation);
    }
  }
  return new_links;
}

function detectorHelper( start: number, end: number, links: LinkType[], result: LinkType[]) {
  for (let i = 0; i < links.length; i++) {
    if (links[i].source === start && links[i].target === end) {
  
    }
  }
  
  return result;
}
