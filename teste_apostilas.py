from docx import Document
import os

caminho = os.path.join("apostilas", "apostila_historia.docx")

if os.path.exists(caminho):
    doc = Document(caminho)
    texto = "\n".join([p.text for p in doc.paragraphs])
    print("Trecho lido:", texto[:500])
else:
    print("Arquivo não encontrado:", caminho)