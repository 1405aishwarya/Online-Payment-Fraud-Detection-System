from kafka import KafkaProducer
import json
import random
import time
import uuid

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def generate_transaction():
   
    transaction_id = str(uuid.uuid4())
    step = random.randint(1, 10)
    tx_type = random.choices([1,2,3,4], weights=[2,1,6,1])[0]
    if tx_type == 1:
        amount = round(random.uniform(100, 500), 2)
    elif tx_type == 2:
        amount = round(random.uniform(1000, 10000), 2)
    elif tx_type == 3:
        amount = round(random.uniform(1000, 15000), 2)
    else:
        amount = round(random.uniform(100, 2000), 2)
    oldbalanceOrg = round(random.uniform(amount, amount*20), 2)
    newbalanceOrig = round(oldbalanceOrg - amount, 2)
    oldbalanceDest = round(random.uniform(0, 200000), 2)
    newbalanceDest = round(oldbalanceDest + amount, 2)

    return {
        "id": transaction_id,  
        "step": step,
        "type": tx_type,
        "amount": amount,
        "oldbalanceOrg": oldbalanceOrg,
        "newbalanceOrig": newbalanceOrig,
        "oldbalanceDest": oldbalanceDest,
        "newbalanceDest": newbalanceDest
    }

for i in range(1000):  
    tx = generate_transaction()
    producer.send('transactions', tx)
    print(f"Sent transaction {i}: {tx}")
    time.sleep(0.6)  
