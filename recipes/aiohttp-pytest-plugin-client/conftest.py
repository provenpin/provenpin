import fcntl
import socket
import struct

import pytest

_IFF_UP = 0x1
_SIOCGIFFLAGS = 0x8913
_SIOCSIFFLAGS = 0x8914


def _enable_loopback():
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            ifreq = struct.pack("16sH", b"lo", 0)
            flags = struct.unpack("16sH", fcntl.ioctl(sock, _SIOCGIFFLAGS, ifreq))[1]
            if not flags & _IFF_UP:
                fcntl.ioctl(sock, _SIOCSIFFLAGS, struct.pack("16sH", b"lo", flags | _IFF_UP))
    except OSError:
        pass


@pytest.fixture(scope="session", autouse=True)
def loopback():
    _enable_loopback()
