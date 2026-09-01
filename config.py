from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")

model = "openai/gpt-oss-20b"
run_name = "CustomerSupportLangGraph"

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY is not set. "
        "Add it to your .env file."
    )

LLM = ChatGroq(
    model=model,
    api_key=GROQ_API_KEY,
    temperature=0.2
)
