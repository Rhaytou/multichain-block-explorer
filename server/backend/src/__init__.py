import os
from flask import Flask
from dotenv import load_dotenv
from .routes import init_routes

def create_app():
    load_dotenv()  # load from .env or .env.production
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")
    app.config['DEBUG'] = os.getenv("DEBUG", "False").lower() == "true"

    init_routes(app)
    return app





