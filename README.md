# a simple demo that run GNN model in web browser using onnx webruntime.

**how to run:**
Open the project folder and run `npm i` to install all necessary packages.
In terminal run `npm run start`

Run 
If installed globally, use `http-server -p [port number]` 
Otherwise use `npx http-server -p [port number]` 

Open `localhost:[port number]` or `[your local ip address]:[port number]` in your web browser, 
upload a graph in json format (we provide an example `input_graph.json` in this repo), 
then click on classify graph button, 
you will get the model prediction for this graph.

## format of the graph data
Please refer to the `def data_to_json` function in model.py for more details about graph data format.
