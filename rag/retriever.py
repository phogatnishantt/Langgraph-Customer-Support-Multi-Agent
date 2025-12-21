import streamlit as st
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
from config import CHROMA_DIR

@st.cache_resource(show_spinner="Loading embeddings & vector store...")
def load_retriever():
    embeddings = HuggingFaceBgeEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = Chroma(
        persist_directory=CHROMA_DIR,
        embedding_function=embeddings
    )

    return vectorstore.as_retriever(search_kwargs = {"k": 4})

retriever = load_retriever()
