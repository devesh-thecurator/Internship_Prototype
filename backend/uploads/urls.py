from django.urls import path

from .views import UploadedDocumentDetailView, UploadedDocumentListCreateView, UploadValidationStreamView

urlpatterns = [
    path('', UploadedDocumentListCreateView.as_view(), name='upload-list-create'),
    path('stream/', UploadValidationStreamView.as_view(), name='upload-validation-stream'),
    path('<int:pk>/', UploadedDocumentDetailView.as_view(), name='upload-detail'),
]
