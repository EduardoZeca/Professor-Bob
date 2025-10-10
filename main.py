import os
import time
import json
from typing import Optional, List
from contextlib import asynccontextmanager

import fitz  # PyMuPDF
import faiss
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from google.api_core import client_options as client_options_lib

# --- OTIMIZAÇÃO: Refinamento do Prompt Mestre ---
# Adicionada uma regra específica para saudações.
PROMPT_MESTRE_FINAL = """
# BLOCO A — IDENTIDADE E FUNÇÃO
Você é o Professor Bob, um professor virtual brasileiro especializado em auxiliar alunos do Ensino Fundamental II (6º ao 9º ano). Seu comportamento é claro, paciente e didático, focado exclusivamente em assuntos acadêmicos. Sua missão é ajudar o aluno a compreender o conteúdo da apostila fornecida.

# BLOCO B — COMPORTAMENTO E LIMITES (GUARDAILS)
1. **Regra de Introdução (Prioridade 1):** Se a pergunta do aluno for um cumprimento ou pedir a sua identidade (ex: "Olá", "Quem é você?"), apresente-se brevemente como Professor Bob, explique sua função e incentive o aluno a fazer uma pergunta sobre os estudos. Ignore as outras regras de recusa para este caso.

2. **Foco Estritamente Educacional:** Responda apenas perguntas relacionadas a matérias escolares. Se o tema não for acadêmico (ex: jogos, entretenimento), recuse e redirecione com: “Essa é uma pergunta interessante! Mas meu papel é te ajudar nos estudos. Quer aproveitar e tirar alguma dúvida sobre o conteúdo da sua matéria?”

3. **Proibições:** Nunca forneça opiniões pessoais. Nunca contradiga o [CONTEXTO DA APOSTILA] com base em fontes externas.

# BLOCO C — BASE DE CONHECIMENTO E HIERARQUIA DE FONTES
- **Fonte Primária (Obrigatória):** Use sempre o conteúdo presente no campo [CONTEXTO DA APOSTILA].
- **Fonte Secundária (Complementar):** Somente se o contexto for insuficiente ou estiver vazio, use conhecimento geral.
- **Transparência Obrigatória:** Se o [CONTEXTO DA APOSTILA] estiver vazio, inicie sua resposta com: "Sem contexto da apostila fornecido, estou usando conhecimento padrão escolar para responder.". Se precisar complementar, indique com: “No seu material, o conceito é apresentado assim... Para complementar...”.

# BLOCO D — MÉTODO PEDAGÓGICO E FORMATO DE RESPOSTA
Siga rigorosamente a seguinte estrutura:
[EXPLICAÇÃO] ...
[EXEMPLO] ...
[ATIVIDADE] ... (opcional)
[INCENTIVO] ...

# BLOCO E — CONTEXTO E ENTRADA DO USUÁRIO
[CONTEXTO DA APOSTILA]
{contexto_apostila}
[PERGUNTA DO ALUNO]
{pergunta_usuario}
"""

# --- Lógica de RAG (Busca e Geração Aumentada) ---
APOSTILAS_DIR = "apostilas"
FAISS_INDEX_FILE = "faiss_index.idx"
CHUNKS_METADATA_FILE = "chunks_metadata.json"

db_vetorial = None
chunks_com_metadata = []

from docx import Document
import re

def extrair_texto(caminho_arquivo: str) -> str:
    print(f"Extraindo texto de {caminho_arquivo}...")
    texto_completo = ""

    if caminho_arquivo.lower().endswith(".pdf"):
        import fitz
        with fitz.open(caminho_arquivo) as doc:
            for pagina in doc:
                texto_completo += pagina.get_text("text")

    elif caminho_arquivo.lower().endswith(".docx"):
        doc = Document(caminho_arquivo)
        for paragrafo in doc.paragraphs:
            texto_completo += paragrafo.text + "\n"

    else:
        raise ValueError("Formato de arquivo não suportado (somente PDF ou DOCX).")

    # Limpeza
    texto_completo = re.sub(r'\n+', ' ', texto_completo)
    texto_completo = re.sub(r'\s{2,}', ' ', texto_completo)
    return texto_completo.strip()


def dividir_em_chunks(texto: str) -> List[str]:
    secoes = re.split(r'\n?\d+\.\s[A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{3,}', texto)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=100
    )
    chunks = []
    for s in secoes:
        chunks.extend(text_splitter.split_text(s))
    return chunks

def extrair_titulo_e_chunks(texto: str, materia: str):
    pattern = r'(\d+\.\s[A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{3,})'
    partes = re.split(pattern, texto)
    resultados = []
    for i in range(1, len(partes), 2):
        titulo = partes[i].strip()
        conteudo = partes[i + 1].strip()
        for c in dividir_em_chunks(conteudo):
            resultados.append({"materia": materia, "topico": titulo, "texto": c})
    return resultados

def gerar_embeddings_em_lotes(chunks: List[str]) -> List[List[float]]:
    embeddings_list = []
    for i, chunk in enumerate(chunks):
        try:
            resultado = genai.embed_content(
                model="models/embedding-001",
                content=chunk,
                task_type="retrieval_document"
            )
            embeddings_list.append(resultado['embedding'])
            if (i + 1) % 50 == 0:
                print(f"{i + 1} chunks processados...")
            time.sleep(0.1)  # evita rate-limit
        except Exception as e:
            print(f"Erro ao gerar embedding no chunk {i}: {e}")
    return embeddings_list


def inicializar_base_de_conhecimento():
    """Carrega ou cria a base de conhecimento vetorial."""
    global db_vetorial, chunks_com_metadata

    if os.path.exists(FAISS_INDEX_FILE) and os.path.exists(CHUNKS_METADATA_FILE):
        print("Carregando base de conhecimento existente...")
        db_vetorial = faiss.read_index(FAISS_INDEX_FILE)
        with open(CHUNKS_METADATA_FILE, "r", encoding="utf-8") as f:
            chunks_com_metadata = json.load(f)
        print(f"Base carregada: {len(chunks_com_metadata)} chunks.")
        return  # <-- encerra aqui para evitar acessar variáveis não definidas

    print("Criando nova base de conhecimento a partir dos arquivos...")
    todos_os_chunks = []

    if not os.path.exists(APOSTILAS_DIR):
        print(f"ERRO: A pasta '{APOSTILAS_DIR}' não foi encontrada.")
        return

    for nome_arquivo in os.listdir(APOSTILAS_DIR):
        if nome_arquivo.lower().endswith((".pdf", ".docx")):
            caminho_completo = os.path.join(APOSTILAS_DIR, nome_arquivo)
            texto = extrair_texto(caminho_completo)
            materia = os.path.splitext(nome_arquivo)[0]
            chunks_arquivo = dividir_em_chunks(texto)
            for chunk in chunks_arquivo:
                todos_os_chunks.append({"texto": chunk, "materia": materia})

    if not todos_os_chunks:
        print("Nenhum arquivo processado. Base de conhecimento vazia.")
        return

    chunks_com_metadata = todos_os_chunks
    textos_para_embedding = [item['texto'] for item in todos_os_chunks]
    embeddings = gerar_embeddings_em_lotes(textos_para_embedding)

    # Validação
    if not embeddings or len(embeddings) != len(todos_os_chunks):
        print(f"Erro: número de embeddings ({len(embeddings)}) difere do número de chunks ({len(todos_os_chunks)}).")
        return

    dimensao = len(embeddings[0])
    db_vetorial = faiss.IndexFlatL2(dimensao)
    db_vetorial.add(np.array(embeddings).astype('float32'))

    faiss.write_index(db_vetorial, FAISS_INDEX_FILE)
    with open(CHUNKS_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(chunks_com_metadata, f, ensure_ascii=False, indent=4)

    print("Base de conhecimento criada e salva com sucesso.")

def buscar_contexto(pergunta: str, materia: Optional[str] = None, k: int = 3) -> str:
    if db_vetorial is None:
        return ""
    
    if materia == 'history':
        materia = 'apostila_historia'
    elif materia == 'geography':
        materia = 'apostila_geografia'

    print(f"Buscando contexto. Filtro de Matéria: {materia}")

    try:
        embedding_pergunta = genai.embed_content(
            model="models/embedding-001", 
            content=pergunta, 
            task_type="retrieval_query",
            request_options={"timeout": 15}
        )['embedding']
    except Exception as e:
        print(f"Erro ao gerar embedding para a pergunta: {e}")
        return ""

    distancias, I = db_vetorial.search(np.array([embedding_pergunta]).astype('float32'), 20)

    resultados_finais = []
    for i in I[0]:
        if i == -1 or i >= len(chunks_com_metadata):
            continue
        chunk_info = chunks_com_metadata[i]

        # --- Ajuste: filtro mais tolerante ---
        if not materia or materia.lower() in chunk_info['materia'].lower():
            resultados_finais.append(chunk_info['texto'])
        if len(resultados_finais) >= k:
            break

    if not resultados_finais:
        print("Nenhum contexto relevante encontrado após a busca e filtragem.")
        return "" 

    return "\n\n".join(resultados_finais)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando o servidor e a base de conhecimento...")
    inicializar_base_de_conhecimento()
    print("Quantidade de chunks carregados:", len(chunks_com_metadata))
    print("Tipo do índice FAISS:", type(db_vetorial))   
    #  Script para verificar quais modelos a chave API suporta, comentado para não ser executado toda vez.
    # print("--- Modelos disponíveis para Geração de Conteúdo ---")
    # for m in genai.list_models():
    #     if 'generateContent' in m.supported_generation_methods:
    #         print(m.name)
    # print("----------------------------------------------------")
    yield
    print("Encerrando o servidor.")

app = FastAPI(lifespan=lifespan)
origins = ["http://127.0.0.1:3000", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.environ.get("GEMINI_API_KEY", "")
client_options = client_options_lib.ClientOptions(api_endpoint="generativelanguage.googleapis.com")
genai.configure(api_key=api_key, client_options=client_options, transport="rest")

class Pergunta(BaseModel):
    texto: str
    materia: Optional[str] = None
    topico: Optional[str] = None

def responder(pergunta_usuario: str, materia: Optional[str] = None, topico: Optional[str] = None):
    saudacoes = ["olá", "oi", "quem é você", "bom dia", "boa tarde", "boa noite"]
    palavras_pergunta = pergunta_usuario.lower().split()
    
    e_saudacao_curta = len(palavras_pergunta) <= 5 and any(saudacao in palavras_pergunta for saudacao in saudacoes)

    if e_saudacao_curta:
        contexto_apostila = "N/A"
    else:
        contexto_apostila = buscar_contexto(pergunta_usuario, materia)

    model_geracao = genai.GenerativeModel('gemini-2.5-flash')
    
    prompt = PROMPT_MESTRE_FINAL.format(
        contexto_apostila=contexto_apostila,
        pergunta_usuario=pergunta_usuario
    )
    
    try:
        resposta = model_geracao.generate_content(
            prompt,
            request_options={"timeout": 30} # Timeout para a geração final da resposta
        )
    
        return resposta.text
    except Exception as e:
        print(f"Erro na geração de conteúdo final: {e}")
        return "Desculpe, tive um problema ao tentar formular a resposta. Pode tentar perguntar de outra forma?"


@app.post("/perguntar")
def perguntar_endpoint(pergunta: Pergunta):
    if db_vetorial is None:
        raise HTTPException(status_code=503, detail="Servidor ocupado, a base de conhecimento ainda está sendo inicializada. Tente novamente em alguns instantes.")
    try:
        resposta_gerada = responder(
            pergunta_usuario=pergunta.texto,
            materia=pergunta.materia,
            topico=pergunta.topico
        )
        return {"resposta": resposta_gerada}
    except Exception as e:
        print(f"Erro ao gerar resposta: {e}")
        raise HTTPException(status_code=500, detail="Ocorreu um erro interno ao processar sua pergunta.")