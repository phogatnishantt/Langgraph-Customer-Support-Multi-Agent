from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
import streamlit as st

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")


model = "llama-3.1-8b-instant"
run_name = "CustomerSupportLangGraph"

LLM = ChatGroq(
    model = model,
    api_key = st.secrets["GROQ_API_KEY"]
    temperature= 0.2

)


