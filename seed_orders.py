import uuid, datetime, subprocess

now = datetime.datetime.now()

product_id_map = {
    'p9':  '26250ae8-2ef7-11f1-9ef0-3612cef1c879',  # Combo 12.90
    'p10': 'a456e461-2ef7-11f1-9ef0-3612cef1c879',  # Cafe 2.50
    'p5':  '2624ffbb-2ef7-11f1-9ef0-3612cef1c879',  # Cappuccino 3.00
    'p1':  '26241be1-2ef7-11f1-9ef0-3612cef1c879',  # Coca-Cola 1.50
    'p6':  '262503b0-2ef7-11f1-9ef0-3612cef1c879',  # Papas 3.20
    'p7':  '262508a1-2ef7-11f1-9ef0-3612cef1c879',  # Brownie 2.80
    'p8':  '262509c1-2ef7-11f1-9ef0-3612cef1c879',  # Helado 2.00
    'p2':  '26249297-2ef7-11f1-9ef0-3612cef1c879',  # Pepsi 1.40
    'p4':  '2624fc60-2ef7-11f1-9ef0-3612cef1c879',  # Jugo 2.20
}

orders = [
    (6, [('p9',1,12.90),('p10',1,2.50)]),
    (6, [('p5',2,3.00),('p1',2,1.50)]),
    (6, [('p9',1,12.90),('p6',2,3.20),('p7',1,2.80)]),
    (5, [('p9',1,12.90),('p4',2,2.20),('p8',1,2.00)]),
    (5, [('p5',2,3.00),('p6',1,3.20),('p7',1,2.80)]),
    (5, [('p9',2,12.90),('p10',2,2.50),('p1',3,1.50)]),
    (5, [('p8',1,2.00),('p7',2,2.80),('p2',1,1.40)]),
    (4, [('p9',3,12.90),('p5',1,3.00),('p8',1,2.00)]),
    (4, [('p9',1,12.90),('p6',3,3.20),('p10',1,2.50),('p4',2,2.20)]),
    (4, [('p5',1,3.00),('p7',1,2.80),('p1',1,1.50),('p2',1,1.40)]),
    (3, [('p9',2,12.90),('p10',1,2.50),('p1',1,1.50)]),
    (3, [('p5',3,3.00),('p6',2,3.20),('p8',1,2.00)]),
    (3, [('p9',3,12.90),('p6',2,3.20),('p2',1,1.40)]),
    (3, [('p5',2,3.00),('p7',1,2.80),('p1',1,1.50),('p4',1,2.20)]),
    (2, [('p9',2,12.90),('p5',2,3.00),('p6',2,3.20)]),
    (2, [('p9',1,12.90),('p10',2,2.50),('p4',2,2.20)]),
    (2, [('p9',4,12.90),('p1',2,1.50),('p2',1,1.40)]),
    (2, [('p5',1,3.00),('p10',1,2.50),('p8',2,2.00)]),
    (1, [('p9',2,12.90),('p6',1,3.20),('p7',1,2.80),('p4',1,2.20)]),
    (1, [('p9',3,12.90),('p10',2,2.50),('p7',1,2.80),('p8',1,2.00)]),
    (1, [('p5',2,3.00),('p6',1,3.20),('p4',2,2.20),('p8',1,2.00)]),
    (0, [('p9',2,12.90),('p8',1,2.00)]),
    (0, [('p9',1,12.90),('p6',1,3.20),('p10',1,2.50)]),
    (0, [('p9',2,12.90),('p5',2,3.00),('p7',1,2.80)]),
]

stmts = ["SET NAMES utf8mb4;"]
for days_ago, items in orders:
    oid = str(uuid.uuid4())
    total = round(sum(qty * price for _, qty, price in items), 2)
    ts = (now - datetime.timedelta(days=days_ago)).strftime('%Y-%m-%d %H:%M:%S')
    stmts.append(f"INSERT INTO `Order`(id,total,createdAt) VALUES('{oid}',{total},'{ts}');")
    for pkey, qty, price in items:
        pid = product_id_map[pkey]
        lt = round(qty * price, 2)
        iid = str(uuid.uuid4())
        stmts.append(f"INSERT INTO OrderItem(id,orderId,productId,quantity,unitPrice,lineTotal) VALUES('{iid}','{oid}','{pid}',{qty},{price},{lt});")

sql = '\n'.join(stmts)
with open('/tmp/seed_orders.sql', 'w') as f:
    f.write(sql)

print(f"Generated SQL for {len(orders)} orders")
print("Executing...")
result = subprocess.run(
    ['docker', 'exec', '-i', 'awsok-mysql-dev', 'mysql', '-u', 'root', '-proot', 'app_db', '--default-character-set=utf8mb4'],
    input=sql.encode(),
    capture_output=True
)
if result.returncode == 0:
    print("Seed OK")
else:
    print("Error:", result.stderr.decode())
