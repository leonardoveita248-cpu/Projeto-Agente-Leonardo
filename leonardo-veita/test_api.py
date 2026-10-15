import requests

payload = {
    "budget": 60,
    "preference": "Pizza Artesanal",
    "party_type": "couple",
    "party_size": 2,
    "location": "Pinheiros, Sao Paulo"
}

print("Enviando requisicao para /api/recommend...")
res = requests.post("http://127.0.0.1:8000/api/recommend", json=payload, timeout=60)
print("Status code:", res.status_code)
data = res.json()
print("Conversation ID:", data.get("conversation_id"))
print("Reply:")
print(data.get("reply"))
