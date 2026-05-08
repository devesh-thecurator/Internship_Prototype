from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok', 'service': 'legitimate-term-sheet-validation'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='api-health'),
    path('api/auth/', include('authentication.urls')),
    path('api/uploads/', include('uploads.urls')),
    path('api/validation/', include('validation_engine.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/audit/', include('audit_logs.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/reports/', include('reports.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
