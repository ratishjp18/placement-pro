import json
from functools import wraps

from django.http import JsonResponse


def read_json(request):
    """Parse a JSON object body. Returns None if it is malformed."""
    if not request.body:
        return {}
    try:
        data = json.loads(request.body)
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def endpoint(*methods, role=None, public=False):
    """Method check + login check + role check for JSON views."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(request, *args, **kwargs):
            if request.method not in methods:
                return JsonResponse({'error': 'Method not allowed.'}, status=405)
            if not public:
                if not request.user.is_authenticated:
                    return JsonResponse({'error': 'Not logged in.'}, status=401)
                if role and request.user.role != role:
                    return JsonResponse({'error': 'Not allowed.'}, status=403)
            return fn(request, *args, **kwargs)
        return wrapper
    return decorator


def form_errors(form):
    return {field: [e['message'] for e in errs] for field, errs in form.errors.get_json_data().items()}


def invalid(form):
    return JsonResponse({'errors': form_errors(form)}, status=400)


def bad_request(message='Bad request.'):
    return JsonResponse({'error': message}, status=400)
