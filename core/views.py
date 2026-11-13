from django.conf import settings
from django.http import FileResponse, HttpResponse


def spa(request, path=''):
    """Serve the built React app (frontend/dist) for any non-API URL."""
    index = settings.FRONTEND_DIST / 'index.html'
    if index.exists():
        return FileResponse(open(index, 'rb'), content_type='text/html')
    return HttpResponse(
        'React build not found. In development open http://localhost:5180 (run "npm run dev" in /frontend). '
        'For a single-server setup run "npm run build" in /frontend.', status=404)
