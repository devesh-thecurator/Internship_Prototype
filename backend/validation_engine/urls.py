from django.urls import path

from .views import ProcessDocumentView, ValidationReportListView

urlpatterns = [
    path('process/', ProcessDocumentView.as_view(), name='validation-process'),
    path('reports/', ValidationReportListView.as_view(), name='validation-reports'),
]
