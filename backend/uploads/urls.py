from django.urls import path

from .views import UploadedDocumentDetailView, UploadedDocumentListCreateView

urlpatterns = [
    path('', UploadedDocumentListCreateView.as_view(), name='upload-list-create'),
    path('<int:pk>/', UploadedDocumentDetailView.as_view(), name='upload-detail'),
]
