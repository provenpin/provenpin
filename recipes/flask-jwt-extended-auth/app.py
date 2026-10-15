from flask import Flask, jsonify, request
from flask_jwt_extended import (JWTManager, create_access_token, create_refresh_token,
                                get_jwt, get_jwt_identity, jwt_required)

USERS = {"ada": {"password": "lovelace", "role": "admin"}}  # swap for a real store

def create_app(secret="change-me"):
    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = secret
    JWTManager(app)

    @app.post("/login")
    def login():
        body = request.get_json(silent=True) or {}
        user = USERS.get(body.get("username"))
        if not user or user["password"] != body.get("password"):
            return jsonify(error="invalid_credentials"), 401
        claims = {"role": user["role"]}
        return jsonify(access=create_access_token(identity=body["username"], additional_claims=claims),
                       refresh=create_refresh_token(identity=body["username"], additional_claims=claims))

    @app.post("/refresh")
    @jwt_required(refresh=True)
    def refresh():
        return jsonify(access=create_access_token(identity=get_jwt_identity(), additional_claims={"role": get_jwt()["role"]}))

    @app.get("/admin")
    @jwt_required()
    def admin():
        if get_jwt().get("role") != "admin":
            return jsonify(error="forbidden"), 403
        return jsonify(user=get_jwt_identity())

    return app
