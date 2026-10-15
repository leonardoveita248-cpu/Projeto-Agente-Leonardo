import os
import uvicorn
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from azure.identity import DefaultAzureCredential
from azure.ai.projects import AIProjectClient

# Azure AI Agent Configuration
ENDPOINT = "https://aula-agente-lucas-resource.services.ai.azure.com/api/projects/aula-agente-lucas"
AGENT_NAME = "leonardo-veita"

app = FastAPI(
    title="Leonardo Veita Food & Drink AI Concierge",
    description="Backend API conectando o Agente de IA da Azure ao Frontend",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Client References
_project_client: Optional[AIProjectClient] = None
_openai_client = None

def get_clients():
    """Lazily initialize and reuse Azure AI Project & OpenAI clients."""
    global _project_client, _openai_client
    if _openai_client is None:
        credential = DefaultAzureCredential()
        _project_client = AIProjectClient(
            endpoint=ENDPOINT,
            credential=credential,
            allow_preview=True,
        )
        _openai_client = _project_client.get_openai_client(agent_name=AGENT_NAME)
    return _openai_client


# Request & Response Models
class RecommendRequest(BaseModel):
    budget: float
    preference: str
    party_type: str  # 'alone', 'couple', 'group'
    party_size: int = 1
    location: Optional[str] = None
    conversation_id: Optional[str] = None


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str
    status: str = "success"


@app.get("/api/health")
def health_check():
    """Check API and Azure connection status."""
    try:
        client = get_clients()
        return {
            "status": "healthy",
            "agent_name": AGENT_NAME,
            "endpoint": ENDPOINT,
            "connected": True
        }
    except Exception as e:
        return {
            "status": "degraded",
            "agent_name": AGENT_NAME,
            "endpoint": ENDPOINT,
            "connected": False,
            "error": str(e)
        }


@app.post("/api/new-conversation")
def new_conversation():
    """Creates a fresh Azure Copilot conversation session."""
    try:
        client = get_clients()
        conv = client.conversations.create()
        return {"conversation_id": conv.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar conversa no Azure: {str(e)}")


@app.post("/api/recommend", response_model=ChatResponse)
def get_recommendations(req: RecommendRequest):
    """
    Submits structured recommendations request (budget, preference, party size)
    to the Azure AI agent and returns the options.
    """
    client = get_clients()
    
    # Resolve or create conversation
    conv_id = req.conversation_id
    if not conv_id:
        try:
            conv = client.conversations.create()
            conv_id = conv.id
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao iniciar conversa: {str(e)}")
    
    # Format user prompt natural language
    party_str = "estou sozinho"
    if req.party_type == "couple" or req.party_size == 2:
        party_str = "estou em 2 pessoas (casal/dupla)"
    elif req.party_type == "group" or req.party_size > 2:
        party_str = f"estou em grupo com {req.party_size} pessoas"
    
    budget_formatted = f"R$ {req.budget:.2f}".replace(".", ",")
    
    prompt = (
        f"Olá! Meu orçamento é de {budget_formatted}, "
        f"minha preferência é {req.preference} e {party_str}."
    )
    if req.location and req.location.strip():
        prompt += f" Estou localizado em: {req.location.strip()}."

    try:
        response = client.responses.create(
            conversation=conv_id,
            input=[{"role": "user", "content": prompt}]
        )
        return ChatResponse(
            reply=response.output_text,
            conversation_id=conv_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na resposta do agente Azure: {str(e)}")


@app.post("/api/chat", response_model=ChatResponse)
def send_chat_message(req: ChatMessageRequest):
    """
    Sends a freeform or follow-up message to the agent within the existing conversation.
    For example: 'Sim, me recomende lugares próximos em Pinheiros, São Paulo'.
    """
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Mensagem não pode ser vazia.")
    
    client = get_clients()

    conv_id = req.conversation_id
    if not conv_id:
        try:
            conv = client.conversations.create()
            conv_id = conv.id
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro ao iniciar conversa: {str(e)}")

    try:
        response = client.responses.create(
            conversation=conv_id,
            input=[{"role": "user", "content": req.message.strip()}]
        )
        return ChatResponse(
            reply=response.output_text,
            conversation_id=conv_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na resposta do agente Azure: {str(e)}")


# Serve static frontend files if folder exists
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Iniciando Servidor Leonardo Veita Food & Drink AI Concierge")
    print("📍 URL Local: http://localhost:8000")
    print("=" * 60)
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
