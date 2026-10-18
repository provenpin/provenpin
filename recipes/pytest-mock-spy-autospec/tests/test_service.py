import pytest
from service import Notifier, broadcast, send_via_smtp

def test_plain_patch_accepts_anything(mocker):
    n = Notifier()
    mock_send = mocker.patch.object(n, "send")
    n.send("a@x.com", "hi", "extra-nonsense", typo=True)
    mock_send.assert_called_once_with("a@x.com", "hi", "extra-nonsense", typo=True)

def test_autospec_enforces_signature(mocker):
    n = Notifier()
    mock_send = mocker.patch.object(n, "send", autospec=True)
    with pytest.raises(TypeError):
        n.send("a@x.com")
    mock_send.assert_not_called()

def test_spy_runs_real_method(mocker):
    n = Notifier()
    spy = mocker.spy(n, "send")
    assert broadcast(n, ["a@x.com", "b@x.com"], "hi") == 3
    assert n.sent == [("a@x.com", "hi"), ("b@x.com", "hi")]
    assert spy.call_count == 2
    assert spy.spy_return == 2
    spy.assert_called_with("b@x.com", "hi")

def test_patch_object_stubs_return_and_args(mocker):
    n = Notifier()
    mock_send = mocker.patch.object(n, "send", return_value=42)
    assert broadcast(n, ["a@x.com"], "hi") == 42
    mock_send.assert_called_once_with("a@x.com", "hi")
    assert n.sent == []

def test_patch_context_manager_and_call_args(mocker):
    smtp_cls = mocker.patch("service.smtplib.SMTP", autospec=True)
    smtp = smtp_cls.return_value.__enter__.return_value
    assert send_via_smtp("mail.local", 2525, "a@x.com", "hi")
    smtp_cls.assert_called_once_with("mail.local", 2525, timeout=5)
    smtp.sendmail.assert_called_once_with("noreply@example.com", ["a@x.com"], "hi")
