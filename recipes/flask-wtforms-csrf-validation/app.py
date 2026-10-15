import re

from flask import Flask, render_template_string, request
from flask_wtf import FlaskForm
from wtforms import IntegerField, StringField, SubmitField
from wtforms.validators import DataRequired, NumberRange, ValidationError

SLUG = re.compile(r"^[a-z0-9-]+$")


def slug_format(form, field):
    # Reusable custom validator: raise ValidationError to attach a message to the field.
    if not SLUG.match(field.data or ""):
        raise ValidationError("Use lowercase letters, digits and dashes only.")


class ProjectForm(FlaskForm):
    # filters run before validators, so whitespace-only names fail DataRequired.
    name = StringField("Name", filters=[lambda s: s.strip() if s else s],
                       validators=[DataRequired()])
    slug = StringField("Slug", validators=[DataRequired(), slug_format])
    seats = IntegerField("Seats", validators=[NumberRange(min=1, max=50)])
    submit = SubmitField("Create")


TEMPLATE = """
<form method="post">
  {{ form.csrf_token }}
  {% for field in [form.name, form.slug, form.seats] %}
  <label>{{ field.label }} {{ field() }}</label>
  {% endfor %}
  {{ form.submit() }}
  {% for msgs in form.errors.values() %}{% for e in msgs %}<p class="error">{{ e }}</p>{% endfor %}{% endfor %}
</form>
"""


def create_app(config=None):
    app = Flask(__name__)
    # Flask-WTF reads WTF_CSRF_ENABLED per form instance, so set it before requests.
    # Note: TESTING=True does NOT disable CSRF; only WTF_CSRF_ENABLED does.
    app.config.update(SECRET_KEY="dev", TESTING=True)
    app.config.update(config or {})

    @app.route("/projects/new", methods=["GET", "POST"])
    def new_project():
        form = ProjectForm()
        if form.validate_on_submit():
            return f"created {form.slug.data}", 201
        status = 422 if request.method == "POST" else 200
        return render_template_string(TEMPLATE, form=form), status

    return app
