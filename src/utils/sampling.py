#%%
import random

# 定义数字的区间和要生成的数字数量
range_start = 0
range_end = 7126
num_count = 7126 - 5700

# 使用random.sample生成唯一的随机数字
unique_numbers = random.sample(range(range_start, range_end + 1), num_count)

# %%
import json

# 定义要存储的JSON文件名
json_filename = "sampling.json"

# 将数字列表写入JSON文件
with open(json_filename, 'w') as json_file:
    json.dump(unique_numbers, json_file)

print(f"随机生成的唯一数字已保存到 {json_filename} 文件中。")
# %%
