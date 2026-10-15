from datetime import datetime, timezone

import pytest

from feed import parse_feed

ATOM = b"""<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Feed</title>
  <link href="http://example.org/"/>
  <updated>2024-05-01T12:00:00Z</updated>
  <entry>
    <title>First</title>
    <link href="http://example.org/1"/>
    <id>urn:1</id>
    <published>2024-05-01T12:00:00Z</published>
    <summary>Hello &lt;b&gt;world&lt;/b&gt;</summary>
    <category term="python"/>
    <category term="rss"/>
  </entry>
  <entry>
    <title>Second</title>
    <link href="http://example.org/2"/>
    <id>urn:2</id>
  </entry>
</feed>
"""

RSS = """<?xml version="1.0"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>RSS Feed</title>
    <link>http://example.org/rss</link>
    <lastBuildDate>Mon, 06 May 2024 08:00:00 GMT</lastBuildDate>
    <item>
      <title>Item</title>
      <link>http://example.org/item</link>
      <guid>urn:item</guid>
      <pubDate>Mon, 06 May 2024 08:00:00 GMT</pubDate>
      <description>short</description>
      <content:encoded><![CDATA[<p>full body</p>]]></content:encoded>
    </item>
  </channel>
</rss>
"""


def test_parses_atom_entries():
    feed = parse_feed(ATOM)
    assert feed.title == "Example Feed"
    assert [e.id for e in feed.entries] == ["urn:1", "urn:2"]
    assert feed.entries[0].link == "http://example.org/1"


def test_struct_time_becomes_utc_datetime():
    feed = parse_feed(ATOM)
    assert feed.updated == datetime(2024, 5, 1, 12, 0, tzinfo=timezone.utc)
    assert feed.entries[0].published == datetime(2024, 5, 1, 12, 0, tzinfo=timezone.utc)


def test_missing_keys_are_none_not_errors():
    second = parse_feed(ATOM).entries[1]
    assert second.published is None
    assert second.summary is None
    assert second.content is None
    assert second.tags == []


def test_tags_and_html_are_flattened_but_kept_raw():
    first = parse_feed(ATOM).entries[0]
    assert first.tags == ["python", "rss"]
    assert first.summary == "Hello <b>world</b>"


def test_rss_string_and_content_encoded():
    item = parse_feed(RSS).entries[0]
    assert item.id == "urn:item"
    assert item.summary == "short"
    assert item.content == "<p>full body</p>"
    assert item.published == datetime(2024, 5, 6, 8, 0, tzinfo=timezone.utc)


def test_malformed_feed_raises():
    with pytest.raises(ValueError):
        parse_feed(b"<feed>not closed")
