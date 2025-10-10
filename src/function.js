document.getElementById("enviar").addEventListener("click", async () => {
  const pergunta = document.getElementById("pergunta").value;
  if (!pergunta.trim()) {
    document.getElementById("resposta").innerText = "Por favor, escreva uma pergunta.";
    return;
  }
  try {
    let resp = await fetch("http://127.0.0.1:8000/perguntar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: pergunta })
    });
    let data = await resp.json();
    document.getElementById("resposta").innerText = data.resposta;
  } catch (error) {
    document.getElementById("resposta").innerText = "Erro ao se conectar com o servidor.";
  }
});

const textarea = document.getElementById("pergunta");
const label = document.querySelector('label[for="pergunta"]');

textarea.addEventListener("input", () => {
  if (textarea.value.trim() !== "") {
    label.style.display = "none";
  } else {
    label.style.display = "block";
  }
});