import os
from dotenv import load_dotenv
from src import create_app

load_dotenv()

PORT = int(os.getenv("SERVER_PORT", 5000))

app = create_app()  # Initialize Flask app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=True)


# gunicorn run:app -b 0.0.0.0:5000
# gunicorn run:app -b 0.0.0.0:5000 --reload




