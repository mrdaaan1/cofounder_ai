from flask import Flask, request, jsonify
from flask_cors import CORS
from gigachat import GigaChat
import json
import os

app = Flask(__name__)

# CORS настройка для локальной разработки и production
allowed_origins = [
    "http://localhost:3001",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", "")  # Production URL будет задан в Render
]
# Фильтруем пустые строки
allowed_origins = [origin for origin in allowed_origins if origin]

CORS(app, origins=allowed_origins)

# Инициализация GigaChat
giga = GigaChat(
    credentials="YmNmNDA0NjYtM2UzNS00NTgzLWEyNWItYTczMjE5ZDlmNzk2OjI0NWNmMDM5LTc1NjctNDBkYS04YzQ2LWE1OWJlMjdiYjRhNg==",
    model="GigaChat-2",
    verify_ssl_certs=False
)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        history = data.get('history', [])
        system_instruction = data.get('systemInstruction', '')

        # Собираем контекст для GigaChat
        # GigaChat принимает строку, поэтому объединяем всё в один промпт
        context_parts = []

        # Добавляем системную инструкцию
        if system_instruction:
            context_parts.append(f"СИСТЕМНАЯ ИНСТРУКЦИЯ:\n{system_instruction}\n")

        # Добавляем историю диалога для контекста
        if len(history) > 1:
            context_parts.append("\nИСТОРИЯ ДИАЛОГА:")
            for msg in history[:-1]:  # Все кроме последнего
                role_name = "AI" if msg['role'] == 'model' else "Пользователь"
                context_parts.append(f"{role_name}: {msg['text']}")

        # Последнее сообщение пользователя
        if history:
            last_message = history[-1]['text']
            context_parts.append(f"\nТЕКУЩИЙ ВОПРОС ПОЛЬЗОВАТЕЛЯ:\n{last_message}")
        else:
            last_message = "Привет!"

        # Объединяем всё в один промпт
        full_prompt = "\n".join(context_parts)

        print(f"Sending to GigaChat: {len(full_prompt)} chars")

        # Запрос к GigaChat (передаём строку, а не список)
        response = giga.chat(full_prompt)
        ai_reply = response.choices[0].message.content

        print(f"GigaChat response: {ai_reply[:200]}...")

        # Парсим JSON ответ (если модель вернула JSON)
        try:
            ai_response = json.loads(ai_reply)
            print("Successfully parsed JSON response")
        except Exception as parse_error:
            print(f"Failed to parse JSON: {parse_error}")
            # Если не JSON, оборачиваем в структуру
            ai_response = {
                "reply": ai_reply,
                "artifactUpdate": None,
                "suggestedAction": None
            }

        return jsonify(ai_response)

    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "reply": f"Произошла ошибка: {str(e)}",
            "artifactUpdate": None,
            "suggestedAction": None
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": "GigaChat-2"})

if __name__ == '__main__':
    print("Starting GigaChat Flask backend...")
    port = int(os.getenv('PORT', 5001))
    debug_mode = os.getenv('FLASK_ENV') != 'production'
    print(f"Backend will run on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
