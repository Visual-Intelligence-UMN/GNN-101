import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { data_prep, prep_graphs, connectCrossGraphNodes, process } from '../utils/utils';

interface MatricesVisualizerProps {
  graph_path: string;  
  intmData: null | JSON
}

const MatricesVisualizer: React.FC<MatricesVisualizerProps>=({graph_path, intmData}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    //prep the data
    
    //MatVis

  },[graph_path, intmData]);


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