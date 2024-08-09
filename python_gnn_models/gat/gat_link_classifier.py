#%%
from torch_geometric.datasets import Twitch
import os.path as osp

import torch
from sklearn.metrics import roc_auc_score

import torch_geometric.transforms as T
from torch_geometric.datasets import Planetoid
from torch_geometric.nn import GATConv
from torch_geometric.utils import negative_sampling

#%%

if torch.cuda.is_available():
    device = torch.device('cuda')
elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
    device = torch.device('mps')
else:
    device = torch.device('cpu')


#%%
dataset = Twitch(root='data/Twitch', name='EN')
print(dataset[0])
#
print()
print(f'Dataset: {dataset}:')
print('====================')
print(f'Number of graphs: {len(dataset)}')
print(f'Number of features: {dataset.num_features}')
print(f'Number of classes: {dataset.num_classes}')

#%%

from torch_geometric.utils import train_test_split_edges


data = train_test_split_edges(dataset[0])

print('Train edges:', data.train_pos_edge_index.size(1))
print('Validation edges (positive):', data.val_pos_edge_index.size(1))
print('Validation edges (negative):', data.val_neg_edge_index.size(1))
print('Test edges (positive):', data.test_pos_edge_index.size(1))
print('Test edges (negative):', data.test_neg_edge_index.size(1))

print(data)

#%%
# x, (edge_index, attn_coefficients) = self.gat_conv(x, edge_index, return_attention_weights=True)
class GAT(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels):
        super().__init__()
        self.conv1 = GATConv(in_channels, hidden_channels)
        self.conv2 = GATConv(hidden_channels, out_channels)

    def encode(self, x, edge_index):
        x = self.conv1(x, edge_index).relu()
        x = self.conv2(x, edge_index)
        return x

    def decode(self, z, edge_label_index):
        x = (z[edge_label_index[0]] * z[edge_label_index[1]])
        x = x.sum(dim=-1)
        return x

    def decode_all(self, z):
        prob_adj = z @ z.t()
        return (prob_adj > 0).nonzero(as_tuple=False).t()

    def forward(self, x, edge_index, edge_label_index):
        outputs = {}
        x, (edge_index, attn1_coefficients) = self.conv1(x, edge_index, return_attention_weights=True)
        x = x.relu()
        outputs["gat1"] = x
        z, (edge_index, attn2_coefficients) = self.conv2(x, edge_index, return_attention_weights=True)
        outputs["gat2"] = z
        outputs["attn1"] = attn1_coefficients
        outputs["attn2"] = attn2_coefficients

        x = (z[edge_label_index[0]] * z[edge_label_index[1]])
        outputs["decode_mul"] = x
        x = x.sum(dim=-1)
        outputs["decode_sum"] = x

        prob_adj = z @ z.t()
        outputs["prob_adj"] = prob_adj
        outputs["decode_all_final"] = (prob_adj > 0).nonzero(as_tuple=False).t()
        return outputs
        


model = GAT(dataset.num_features, 64, 64).to(device)
optimizer = torch.optim.Adam(params=model.parameters(), lr=0.01)
criterion = torch.nn.BCEWithLogitsLoss()
print(device)

#%%
def train():
    model.train()
    optimizer.zero_grad()
    z = model.encode(data.x.to(device), data.train_pos_edge_index.to(device))

    pos_edge_index = data.train_pos_edge_index.to(device)
    pos_out = model.decode(z, pos_edge_index)
    pos_loss = criterion(pos_out, torch.ones(pos_out.size(0), device=device))

    neg_edge_index = negative_sampling(
        edge_index=data.train_pos_edge_index, 
        num_nodes=data.num_nodes,
        num_neg_samples=pos_edge_index.size(1)
    ).to(device)
    neg_out = model.decode(z, neg_edge_index)
    neg_loss = criterion(neg_out, torch.zeros(neg_out.size(0), device=device))

    loss = pos_loss + neg_loss
    loss.backward()
    optimizer.step()
    return loss.item()

#%%

def test(pos_edge_index, neg_edge_index):
    model.eval()
    with torch.no_grad():
        z = model.encode(data.x.to(device), data.train_pos_edge_index.to(device))
    
    pos_out = model.decode(z, pos_edge_index.to(device))
    neg_out = model.decode(z, neg_edge_index.to(device))

    pos_y = torch.ones(pos_out.size(0), device=device)
    neg_y = torch.zeros(neg_out.size(0), device=device)
    y = torch.cat([pos_y, neg_y])
    pred = torch.cat([pos_out, neg_out])

    loss = criterion(pred, y).item()
    pred = torch.sigmoid(pred)  
    pred = pred > 0.5
    acc = pred.eq(y).sum().item() / y.size(0)
    return loss, acc

#%%

for epoch in range(1, 101):
    loss = train()
    val_loss, val_acc = test(data.val_pos_edge_index, data.val_neg_edge_index)
    test_loss, test_acc = test(data.test_pos_edge_index, data.test_neg_edge_index)
    print(f'Epoch: {epoch:03d}, Loss: {loss:.4f}, Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}, Test Loss: {test_loss:.4f}, Test Acc: {test_acc:.4f}')

#%%

gData = dataset[0]
print(gData)

#%%

print(gData.edge_index.size())

#%%
def get_neighbor_count(data, node_index):
    if node_index < 0 or node_index >= data.num_nodes:
        raise ValueError("exceed the dataset")
    
    edge_index = data.edge_index
    
    # First-level neighbors
    neighbors = edge_index[1][edge_index[0] == node_index]
    neighbor_of_neighbor_count = 0
    third_neighbors_set = set()
    
    # Iterate through first-level neighbors
    for neighbor in neighbors:
        # Second-level neighbors
        second_neighbors = edge_index[1][edge_index[0] == neighbor]
        neighbor_of_neighbor_count += second_neighbors.size(0)
        
        # Iterate through second-level neighbors
        for second_neighbor in second_neighbors:
            # Third-level neighbors
            third_neighbors = edge_index[1][edge_index[0] == second_neighbor]
            third_neighbors_set.update(third_neighbors.tolist())
    
    # Remove first-level and second-level neighbors from third-level neighbors set
    all_first_and_second_neighbors = set(neighbors.tolist())
    for neighbor in neighbors:
        second_neighbors = edge_index[1][edge_index[0] == neighbor]
        all_first_and_second_neighbors.update(second_neighbors.tolist())
    
    third_neighbors_set.difference_update(all_first_and_second_neighbors)
    
    third_neighbors_list = list(third_neighbors_set)
    third_neighbors_count = len(third_neighbors_list)
    
    return neighbors.size(0), neighbor_of_neighbor_count, third_neighbors_count

#%%

# print out the size of the size graph
# node i - node j - subgraph size for node i - subgraph size for node j
# (the neighbors of the target node, the neibhors of the neighbors node)
# New algorithm to store sums and corresponding indices
results = []
max_sum = 0
max_node = 0

for i in range(1000):  # Assuming there are 5 nodes for the example
    a, b, c = get_neighbor_count(gData, i)
    sum_neighbors = a + b + c
    results.append((i, sum_neighbors, (a, b, c)))
    if max_sum < sum_neighbors:
        max_sum = sum_neighbors
        max_node = i
    print(i, (a, b, c), sum_neighbors)

# Sort the results based on the sum
results.sort(key=lambda x: x[1], reverse=True)

print("Sorted results based on sum:")
for result in results:
    print(f"Node {result[0]}: Sum {result[1]}")

print("Max node:", max_node, "Max sum:", max_sum)

#%%

print("Sorted results based on sum:")
for result in results:
    print(f"Node {result[0]}: Sum {result[1]} : Values {result[2]}")

#%%

def predict_edge(model, node_index1, node_index2):
    model.eval()
    with torch.no_grad():
        edge_label_index = torch.tensor([[node_index1], [node_index2]], device=device)
        prediction = model.forward(data.x.to(device), data.train_pos_edge_index.to(device), edge_label_index)
        return prediction

node_index1 = 45
node_index2 = 17

# for i in range(20):
#     for j in range(20):
#         if i != j:
#             prediction = predict_edge(model, i, j)
#             print(f"predict node {i} and node {j} probability that has an edge: {prediction}")

#%%
prediction = predict_edge(model, 12, 70)
print(prediction['decode_all_final'])

#%%

print(f'conv1 shape: {list(prediction['gat1'].shape)}')
print(f'conv2 shape: {list(prediction['gat2'].shape)}')
print(f'conv3 shape: {list(prediction['decode_mul'].shape)}')
print(f'final shape: {list(prediction['prob_adj'].shape)}')
print(f'final shape: {list(prediction['decode_all_final'].shape)}')
print(f'attn1 shape: {list(prediction['attn1'].shape)}')
print(f'attn2 shape: {list(prediction['attn2'].shape)}')



#%%

# dummy input
x = torch.randn(7126, 128)
edge_index = torch.randint(0, 7126, (2, 77774))
dummy_input = (x, edge_index, edge_index)
prediction = model.forward(x, edge_index, edge_index)

#%%

print(prediction)


#%%

# 打印可学习参数
parm = []
print("Model's learnable parameters:")
for name, param in model.named_parameters():
    if param.requires_grad:
        parm.append(param.data.tolist())
        print(f"{name}: {param.data.size()}")


#%%

# data extraction

param = {
    "conv1_att_src": parm[0][0][0],
    "conv1_att_dst": parm[1][0][0],
    "conv2_att_src": parm[4][0][0],
    "conv2_att_dst": parm[5][0][0]
}

print(param)

# 打印字典中的每个键和值的形状
# for key, value in param.items():
#     print(f"Key: {key}")
#     print(f"Shape: {value.shape}")

#%%


with open('learnableVectorsGAT.json', 'w') as f:
    json.dump(param, f, indent=4)

#%%
# python model to ONNX model
torch.onnx.export(model,               # model being run
                  dummy_input,         # model input 
                  "gat_link_model.onnx",    # where to save the model
                  export_params=True,  # store the trained parameter weights inside the model file
                  opset_version=18,    # the ONNX version to export the model to
                #   do_constant_folding=True,  # whether to execute constant folding for optimization
                  input_names = ['x', 'edge_index', 'edge_label_index'],   # the model's input names
                  output_names=['gat1', 'gat2', 'decode_mul', 'decode_sum', 'prob_adj', 'decode_all_final'],
                  dynamic_axes={'x': {0: 'num_nodes'},
                                'edge_index': {1: 'num_edges'},
                                'output': {0: 'batch_size'}})  # which axes should be considered dynamic)


#%%

onnxProgram = torch.onnx.dynamo_export(GAT, dummy_input)


#%%
# export data from dataset
import json, torch
def data_to_json(data):
    json_data = {}
    
    # Convert node features to a list of lists
    if data.x is not None:
        json_data['x'] = data.x.tolist()  # Assuming x is a tensor of node features
    
    # Convert edge index to a list of pairs/lists
    if data.edge_index is not None:
        edge_index_list = data.edge_index.tolist()  # Convert to [2] and then to list
        json_data['edge_index'] = edge_index_list 
    
    # Convert labels to a list
    if data.y is not None:
        json_data['y'] = data.y.tolist()  
    num_nodes = data.x.size(0)
    batch = torch.zeros(num_nodes, dtype=torch.int32)
    json_data['batch'] = batch.tolist()
    
    return json_data

json_data = data_to_json(dataset)
with open(f'twitch.json', 'w') as f:
    json.dump(json_data, f, indent=4)

#%%
# export weights of the model
import onnx
import numpy as np
import json

model = onnx.load('../public/gat_link_model.onnx')

weights = {}

for tensor in model.graph.initializer:
    np_array = onnx.numpy_helper.to_array(tensor)
    weights[tensor.name] = np_array.tolist()

with open('gat_link_weights.json', 'w') as f:
    json.dump(weights, f)

#%%

# weights analysis
import json
import numpy as np

def extract_keys(data, keys_set=None):
    if keys_set is None:
        keys_set = set()
    
    if isinstance(data, dict):
        for key, value in data.items():
            keys_set.add(key)
            extract_keys(value, keys_set)
    elif isinstance(data, list):
        for item in data:
            extract_keys(item, keys_set)
    
    return keys_set

with open("gat_link_weights.json", "r") as file:
    data = json.load(file)

print(data)

keys = extract_keys(data)

# print all keys in json
print("All keys:", keys)

for k in keys:
    d = np.array(data[k])
    print(k,d.shape)

# All keys: {'conv1.bias', 'onnx::MatMul_196', 'onnx::MatMul_199', 'conv2.bias'}
# conv1.bias (64,)
# onnx::MatMul_196 (128, 64)
# onnx::MatMul_199 (64, 64)
# conv2.bias (64,)

#%%
import torch.nn as nn
class GAT(nn.Module):
    def __init__(self, in_channels, out_channels, heads=1):
        super(GAT, self).__init__()
        self.gat_conv = GATConv(in_channels, out_channels, heads=heads, concat=True)

    def forward(self, x, edge_index):
        x, (edge_index, attn_coefficients) = self.gat_conv(x, edge_index, return_attention_weights=True)
        return x, attn_coefficients

# 假设输入特征和边索引如下：
in_channels = 16
out_channels = 32
heads = 4

x = torch.randn((10, in_channels))  # 10个节点，每个节点有16维特征
edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 4]], dtype=torch.long)  # 边的索引

# 创建模型并进行前向传播
model = GAT(in_channels, out_channels, heads=heads)
output, attention_coefficients = model(x, edge_index)

print("Output:", output)
print("Attention Coefficients:", attention_coefficients)


# 假设输入特征和边索引如下：
in_channels = 16
out_channels = 32
heads = 4

x = torch.randn((10, in_channels))  # 10个节点，每个节点有16维特征
edge_index = torch.tensor([[0, 1, 2, 3], [1, 2, 3, 4]], dtype=torch.long)  # 边的索引

# 创建模型并进行前向传播
model = GAT(in_channels, out_channels, heads=heads)
output, attention_coefficients = model(x, edge_index)

# 打印可学习参数
parm = []
print("Model's learnable parameters:")
for name, param in model.named_parameters():
    if param.requires_grad:
        parm.append(f"{name}: {param.data}")
        print(f"{name}: {param.data}")

# 打印注意力系数
print("Attention Coefficients:", attention_coefficients)

# %%
# store all learnable parameters
import onnx

model = onnx.load('gat_link_model.onnx')


# 获取模型图
graph = model.graph

# 遍历节点并打印节点名称及其初始值（即参数）
for initializer in graph.initializer:
    name = initializer.name
    dims = initializer.dims
    vals = initializer.float_data
    print(f"Name: {name}")
    print(f"Dimensions: {dims}")
    print(f"Values: {vals[:10]}...")  # 只打印前10个值以示例

# %%
