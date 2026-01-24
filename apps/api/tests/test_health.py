"""Basic integration tests to verify test infrastructure."""

from httpx import AsyncClient


async def test_root_endpoint_returns_message(test_client: AsyncClient):
    """Verify the root endpoint works."""
    response = await test_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
