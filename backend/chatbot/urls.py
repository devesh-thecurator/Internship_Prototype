from django.urls import path

from .views import ChatHistoryListView, ChatbotQueryView

urlpatterns = [
    path('query/', ChatbotQueryView.as_view(), name='chatbot-query'),
    path('history/', ChatHistoryListView.as_view(), name='chatbot-history'),
]
