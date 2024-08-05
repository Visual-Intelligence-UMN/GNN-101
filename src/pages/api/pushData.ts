import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type Data = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log('entered the handler thingy middleware');

  if (req.method === 'POST') {
    const { filePath, newData } = req.body;
    try {
      const absolutePath = path.resolve('.', filePath);
      const rawData = fs.readFileSync(absolutePath, 'utf-8');
      const existingData = rawData ? JSON.parse(rawData) : {};

      if (typeof existingData !== 'object' || Array.isArray(existingData)) {
        throw new Error('Existing data in the JSON file is not an object.');
      }

      // Merge the new data into the existing data
      Object.keys(newData).forEach(key => {
        if (existingData.hasOwnProperty(key)) {
            console.log(`Key "${key}" already exists. Merging data...`);
          } else {
            console.log(`Adding new key "${key}".`);
          }
        existingData[key] = newData[key];
      });

      fs.writeFileSync(absolutePath, JSON.stringify(existingData, null, 2));
      res.status(200).json({ message: 'Data successfully appended to JSON file.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Error: ' + err.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
