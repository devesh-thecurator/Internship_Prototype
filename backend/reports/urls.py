from django.urls import path

from .views import ExportActivityListView, ReportExportView

urlpatterns = [
    path('export/', ReportExportView.as_view(), name='report-export'),
    path('activity/', ExportActivityListView.as_view(), name='report-activity'),
]