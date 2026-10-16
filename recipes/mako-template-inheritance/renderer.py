from mako.lookup import TemplateLookup

TEMPLATES = {
    "base.html": """\
<!doctype html>
<html>
<head><title>${self.page_title()}</title></head>
<body>
${self.body()}
</body>
</html>
""",
    "page.html": """\
<%inherit file="base.html"/>
<%!
def shout(text):
    return text.upper() + "!"
%>
<%def name="page_title()">${title}</%def>
<%def name="tag(name)"><span class="tag">${name}</span></%def>
<h1>${title}</h1>
<p>${subtitle | trim}</p>
<ul>
% for item in items:
  <li>${item}</li>
% endfor
</ul>
<footer>${shout("bye")}</footer>
${self.tag("featured")}
""",
}


def build_lookup(**options):
    lookup = TemplateLookup(default_filters=["h"], **options)
    for uri, source in TEMPLATES.items():
        lookup.put_string(uri, source)
    return lookup


def render_page(title, subtitle, items):
    template = build_lookup().get_template("page.html")
    return template.render(title=title, subtitle=subtitle, items=items)
