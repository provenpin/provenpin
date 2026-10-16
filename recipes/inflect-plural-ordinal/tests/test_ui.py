from ui import count_label, ordinal, ordinal_words, spell_number, with_article

def test_count_label_keeps_singular_for_one():
    assert count_label("item", 1) == "1 item"
    assert count_label("item", 2) == "2 items"
    assert count_label("item", 0) == "0 items"
    assert count_label("sheep", 3) == "3 sheep"

def test_irregular_plurals():
    assert count_label("child", 2) == "2 children"
    assert count_label("person", 2) == "2 people"
    assert count_label("box", 2) == "2 boxes"

def test_ordinal_teens_do_not_take_st():
    assert ordinal(1) == "1st"
    assert ordinal(2) == "2nd"
    assert ordinal(3) == "3rd"
    assert ordinal(11) == "11th"
    assert ordinal(12) == "12th"
    assert ordinal(13) == "13th"
    assert ordinal(112) == "112th"

def test_ordinal_words_wrap_the_ordinal_form():
    assert ordinal_words(1) == "first"
    assert ordinal_words(21) == "twenty-first"
    assert ordinal_words(8) == "eighth"

def test_article_follows_sound_not_spelling():
    assert with_article("banana") == "a banana"
    assert with_article("hour") == "an hour"
    assert with_article("unicorn") == "a unicorn"
    assert with_article("MBA") == "an MBA"

def test_spell_number_andword_control():
    assert spell_number(1234) == "one thousand, two hundred and thirty-four"
    assert spell_number(123, andword="") == "one hundred twenty-three"
    assert spell_number(0) == "zero"
    assert spell_number(3.5) == "three point five"
