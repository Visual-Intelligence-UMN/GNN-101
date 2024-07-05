#%%
# ###########################
# Save one graph input as JSON
# ###########################
import json
import torch
from torch_geometric.datasets import TUDataset

dataset = TUDataset(root='data/TUDataset', name='MUTAG')

def data_to_json(data):
    json_data = {}

    # Convert node features to a list of lists
    if data.x is not None:
        json_data['x'] = data.x.tolist()  # Assuming x is a tensor of node features

    # Convert edge index to a list of pairs/lists
    if data.edge_index is not None:
        edge_index_list = data.edge_index.tolist()  # Convert to [2] and then to list
        json_data['edge_index'] = edge_index_list

    if data.edge_attr is not None:
        json_data['edge_attr'] = data.edge_attr

    # Convert labels to a list
    if data.y is not None:
        json_data['y'] = data.y.tolist()  
    num_nodes = data.x.size(0)
    batch = torch.zeros(num_nodes, dtype=torch.int32)
    json_data['batch'] = batch.tolist()


    return json_data


for i in range(0, 3):
    json_data = data_to_json(dataset[i])

    with open(f'./temp/public/json_data/input_graph{i}.json', 'w') as f:
            json.dump(json_data, f, indent=4)