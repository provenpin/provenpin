from flask import Flask, abort, jsonify
from marshmallow import EXCLUDE, Schema, fields, validate
from webargs.flaskparser import FlaskParser


class JsonParser(FlaskParser):
    # webargs' default 422 response is HTML; return the field errors as JSON
    def handle_error(self, error, req, schema, *, error_status_code, error_headers):
        resp = jsonify(errors=error.messages)
        resp.status_code = error_status_code or 422
        abort(resp)


parser = JsonParser()


class SearchArgs(Schema):
    class Meta:
        unknown = EXCLUDE  # ignore stray query params instead of failing

    q = fields.Str(required=True, validate=validate.Length(min=1))
    page = fields.Int(load_default=1, validate=validate.Range(min=1))
    tags = fields.List(fields.Str(), load_default=list)  # ?tags=a&tags=b
    include_archived = fields.Bool(load_default=False)


class ItemIn(Schema):
    # default unknown=RAISE: extra JSON keys produce a 422
    name = fields.Str(required=True)
    qty = fields.Int(required=True, validate=validate.Range(min=0))


app = Flask(__name__)


@app.get("/search")
@parser.use_kwargs(SearchArgs(), location="query")
def search(q, page, tags, include_archived):
    return jsonify(q=q, page=page, tags=tags, include_archived=include_archived)


@app.post("/items")
@parser.use_args(ItemIn(), location="json")
def create_item(data):
    return jsonify(data), 201
