import pickle
import pandas as pd
import json
import asyncio
import websockets
import shap
from kafka import KafkaConsumer

with open("online_payment_model.pkl", "rb") as f:
    model = pickle.load(f)

consumer = KafkaConsumer(
    'transactions',
    bootstrap_servers='localhost:9092',
    value_deserializer=lambda v: json.loads(v)
)

clients = set()

async def broadcast(data):
    """Send data to all connected WebSocket clients."""
    if clients:
        message = json.dumps(data)
        await asyncio.gather(*(client.send(message) for client in clients))

async def ws_server(websocket):
    """Handle new WebSocket client connection."""
    clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)

async def consume_transactions():
    loop = asyncio.get_running_loop()

    def consume_blocking():
        """Blocking Kafka consumer running in a separate thread."""
        features = ['step', 'type', 'amount', 'oldbalanceOrg', 
                    'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest']

        for msg in consumer:
            transaction = pd.DataFrame([msg.value])

            
            transaction_for_model = transaction[features]

            
            prediction = model.predict(transaction_for_model)[0]

            
            explainer = shap.Explainer(model, transaction_for_model)
            shap_values = explainer(transaction_for_model)
            top_features = dict(zip(transaction_for_model.columns, shap_values.values[0]))

            
            result = {
                "transaction": msg.value,
                "prediction": int(prediction),
                "top_shap": top_features
            }

        
            asyncio.run_coroutine_threadsafe(broadcast(result), loop)

    
    await asyncio.to_thread(consume_blocking)

async def main():
    server = await websockets.serve(ws_server, "localhost", 8765)
    print("WebSocket server started at ws://localhost:8765")
    await consume_transactions()  
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())
