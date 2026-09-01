from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.chat import router as chat_router
from backend.app.api.health import router as health_router
from backend.app.api.customers import router as customers_router
from backend.app.api.orders import router as orders_router
from backend.app.api.tickets import router as tickets_router
from backend.app.api.conversations import router as conversations_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.auth import router as auth_router


app = FastAPI(
    title="Customer Support AI",
    description="Multi-Agent AI Customer Support Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(chat_router)
app.include_router(health_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(tickets_router)
app.include_router(conversations_router)
app.include_router(analytics_router)
app.include_router(auth_router)


@app.get("/")
def root():

    return {
        "message": "Customer Support AI API",
        "status": "running"
    }