from urllib.parse import urlsplit


def origin_of(url: str) -> str | None:
    try:
        parsed_url = urlsplit(url)
        port = parsed_url.port
    except ValueError:
        return None

    return f"{parsed_url.scheme}://{parsed_url.hostname}" + (f":{port}" if port else "")
