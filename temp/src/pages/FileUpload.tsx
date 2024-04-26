import React, { useState } from 'react';
import GraphVisualizer from './GraphVisualizer';

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [graphData, setGraphData] = useState<any>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setFile(selectedFile || null);
  };

  const handleUpload = async () => {
    if (!file) return;

    const data = await readFileAsJSON(file);
    setGraphData(data);
  };

  const readFileAsJSON = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        try {
          const data = JSON.parse(fileReader.result as string);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      fileReader.onerror = () => {
        reject(fileReader.error);
      };
      fileReader.readAsText(file);
    });
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>
        Upload
      </button>
      {graphData && <GraphVisualizer graphData={graphData} />}
    </div>
  );
};

export default FileUploader;