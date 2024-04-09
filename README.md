a simple demo that run GNN model in web browser using onnx webruntime.

**how to run:**
make sure your have [http-server](https://www.npmjs.com/package/http-server) installed

Run 
`http-server -p 30123`

Open `localhost:30123` in your web browser, 
upload a graph in json format (we provide an example `input_graph.json` in this repo), 
then click on classify graph button, 
you will get the model prediction for this graph.
