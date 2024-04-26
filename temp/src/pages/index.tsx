import Head from 'next/head';
import React, { useRef, useState } from 'react';
import GraphVisualizer from './GraphVisualizer';

export default function Home() {
  const [graphData, setGraphData] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          setGraphData(data);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }
      };
      reader.readAsText(file);
    }
  
    // Clear the input value
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUpload = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div>
      <Head>
        <title>Graph Visualization</title>
        <style>
          {`
            #my_dataviz {
              width: 100%;
              height: 100%;
              overflow: auto;
              overflow-x: auto;
            }
          `}
        </style>
      </Head>
      <h1>Graph Visualization</h1>
      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        ref={inputRef}
        style={{ display: 'none' }}
      />
      <button onClick={handleUpload}>Upload JSON File</button>
      <h2>Visualization</h2>
      {graphData && <GraphVisualizer graphData={[graphData]} />}
    </div>
  );
}