from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChatHistory
from .serializers import ChatHistorySerializer
from .services import answer_question
from audit_logs.services import record_audit


class ChatbotQueryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        query = request.data.get('query')
        if not query:
            return Response({'detail': 'query is required'}, status=status.HTTP_400_BAD_REQUEST)

        result = answer_question(request.user, query)
        record_audit(
            request.user,
            'chatbot_query',
            target='chatbot',
            metadata={'chat_id': result.get('chat_id'), 'query': query[:200]},
        )
        return Response(result, status=status.HTTP_200_OK)


class ChatHistoryListView(generics.ListAPIView):
    serializer_class = ChatHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatHistory.objects.filter(user=self.request.user).order_by('-created_at')
