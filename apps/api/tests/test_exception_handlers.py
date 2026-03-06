from httpx import ASGITransport, AsyncClient

from app.main import app


async def test_unexpected_exceptions_return_json_with_cors_headers():
    async def boom():
        raise RuntimeError("boom")

    app.add_api_route("/__test__/boom", boom, methods=["GET"])

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app, raise_app_exceptions=False),
            base_url="http://test",
        ) as client:
            response = await client.get(
                "/__test__/boom",
                headers={"Origin": "http://localhost:3000"},
            )
    finally:
        app.router.routes.pop()

    assert response.status_code == 500
    assert response.json() == {"detail": "An unexpected error occurred"}
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
